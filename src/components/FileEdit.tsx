import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Table as TableIcon, Save, X, Play } from 'lucide-react';
import { read, utils, Range } from 'xlsx';
import * as ExcelJS from 'exceljs';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';
import type { FileRecord } from '../types/files';

interface CellStyle {
  alignment?: string;
  isBold?: boolean;
  backgroundColor?: string;
  textColor?: string;
  border?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

interface CellData {
  value: string | number | null;
  rowSpan?: number;
  colSpan?: number;
  isHidden?: boolean;
  style?: CellStyle;
}

interface WorksheetData {
  name: string;
  data: CellData[][];
  merges: Range[];
}

const convertExcelColor = (color: { rgb?: string; theme?: number } | undefined): string | undefined => {
  if (!color) return undefined;
  if (color.rgb) {
    // Excel stores RGB as ARGB, so we need to remove the alpha channel
    const rgb = color.rgb.length === 8 ? color.rgb.substring(2) : color.rgb;
    return `#${rgb}`;
  }
  // For theme colors, we'll use a default color mapping
  const themeColors = [
    '#FFFFFF', // 0: Background
    '#000000', // 1: Text
    '#E7E6E6', // 2: Background 2
    '#44546A', // 3: Text 2
    '#4472C4', // 4: Accent 1
    '#ED7D31', // 5: Accent 2
    '#A5A5A5', // 6: Accent 3
    '#FFC000', // 7: Accent 4
    '#5B9BD5', // 8: Accent 5
    '#70AD47'  // 9: Accent 6
  ];
  return color.theme !== undefined ? themeColors[color.theme] : undefined;
};

export const FileEdit: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<FileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worksheets, setWorksheets] = useState<WorksheetData[]>([]);
  const [parsingFile, setParsingFile] = useState(false);
  const [editingCell, setEditingCell] = useState<{ sheetIndex: number; row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processSuccess, setProcessSuccess] = useState(false);

  useEffect(() => {
    const fetchFileAndParse = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('id', fileId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('File not found');

        setFile(data);
        await parseExcelFile(data);
      } catch (err) {
        console.error('Error fetching file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    fetchFileAndParse();
  }, [fileId]);

  const processCell = (worksheet: any, address: string): CellData => {
    const cell = worksheet[address];
    const value = cell ? cell.v : null;
    
    const style: CellStyle = {
      alignment: cell?.s?.alignment?.horizontal || 'left',
      isBold: cell?.s?.font?.bold || false,
      backgroundColor: convertExcelColor(cell?.s?.fill?.fgColor),
      textColor: convertExcelColor(cell?.s?.font?.color),
      border: {
        top: cell?.s?.border?.top?.style ? '1px solid #000' : undefined,
        right: cell?.s?.border?.right?.style ? '1px solid #000' : undefined,
        bottom: cell?.s?.border?.bottom?.style ? '1px solid #000' : undefined,
        left: cell?.s?.border?.left?.style ? '1px solid #000' : undefined,
      }
    };

    return {
      value,
      style
    };
  };

  const processMerges = (worksheet: any, merges: Range[] | undefined): CellData[][] => {
    const range = utils.decode_range(worksheet['!ref'] || 'A1');
    const data: CellData[][] = [];

    // Initialize the data array
    for (let r = 0; r <= range.e.r; ++r) {
      data[r] = [];
      for (let c = 0; c <= range.e.c; ++c) {
        const address = utils.encode_cell({ r, c });
        data[r][c] = processCell(worksheet, address);
      }
    }

    // Process merged cells
    if (merges) {
      for (const merge of merges) {
        const { s: start, e: end } = merge;
        
        // Set rowSpan and colSpan for the top-left cell
        data[start.r][start.c].rowSpan = end.r - start.r + 1;
        data[start.r][start.c].colSpan = end.c - start.c + 1;

        // Mark other cells in the merge range as hidden
        for (let r = start.r; r <= end.r; ++r) {
          for (let c = start.c; c <= end.c; ++c) {
            if (r !== start.r || c !== start.c) {
              data[r][c].isHidden = true;
            }
          }
        }
      }
    }

    return data;
  };

  const parseExcelFile = async (fileData: FileRecord) => {
    try {
      setParsingFile(true);

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(fileData.storage_path, 60);

      if (signedUrlError) throw signedUrlError;
      if (!signedUrlData?.signedUrl) throw new Error('Failed to generate download URL');

      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) throw new Error('Failed to download file');

      const arrayBuffer = await response.arrayBuffer();
      const workbook = read(arrayBuffer, { cellStyles: true });

      const parsedWorksheets: WorksheetData[] = workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const data = processMerges(worksheet, worksheet['!merges']);

        return {
          name: sheetName,
          data,
          merges: worksheet['!merges'] || []
        };
      });

      setWorksheets(parsedWorksheets);
    } catch (err) {
      console.error('Error parsing Excel file:', err);
      setError('Failed to parse Excel file. Please ensure it\'s a valid Excel document.');
    } finally {
      setParsingFile(false);
    }
  };

  const handleCellClick = (sheetIndex: number, row: number, col: number, value: string | number | null) => {
    setEditingCell({ sheetIndex, row, col });
    setEditValue(value?.toString() || '');
  };

  const handleCellEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleSaveEdit = async () => {
    if (!editingCell || !file) return;

    try {
      setSaving(true);
      const { sheetIndex, row, col } = editingCell;

      // Get the file from storage
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.storage_path, 60);

      if (signedUrlError) throw signedUrlError;
      if (!signedUrlData?.signedUrl) throw new Error('Failed to generate download URL');

      // Download and modify the file
      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) throw new Error('Failed to download file');

      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[sheetIndex];
      if (!worksheet) throw new Error('Worksheet not found');

      const cell = worksheet.getCell(row + 1, col + 1);
      const numValue = Number(editValue);
      cell.value = isNaN(numValue) ? editValue : numValue;

      // Convert to blob
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: file.type });

      // Upload modified file
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .update(file.storage_path, blob);

      if (uploadError) throw uploadError;

      // Update the UI
      const newWorksheets = [...worksheets];
      newWorksheets[sheetIndex].data[row][col].value = isNaN(numValue) ? editValue : numValue;
      setWorksheets(newWorksheets);
      setEditingCell(null);
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleProcess = async () => {
    try {
      setProcessing(true);
      setProcessSuccess(false);
      setError(null);

      // Prepare the data from all worksheets
      const excelData = worksheets.map(sheet => ({
        name: sheet.name,
        data: sheet.data.map(row => 
          row.map(cell => ({
            value: cell.value,
            style: cell.style
          }))
        )
      }));

      // Call our backend API instead of the external endpoint directly
      const response = await fetch('http://localhost:3000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: file?.filename,
          data: excelData,
        })
      });

      if (!response.ok) throw new Error('Failed to process file');
      const data = await response.json();
      
      if (!data) throw new Error('No response from server');

      setProcessSuccess(true);
      setTimeout(() => setProcessSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process file. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getCellStyle = (cell: CellData): React.CSSProperties => {
    if (cell.isHidden) return { display: 'none' };

    return {
      textAlign: cell.style?.alignment as 'left' | 'center' | 'right' | undefined,
      fontWeight: cell.style?.isBold ? 'bold' : undefined,
      backgroundColor: cell.style?.backgroundColor,
      color: cell.style?.textColor,
      borderTop: cell.style?.border?.top,
      borderRight: cell.style?.border?.right,
      borderBottom: cell.style?.border?.bottom,
      borderLeft: cell.style?.border?.left,
      padding: '0.5rem 1rem',
    };
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-red-600 text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error || 'File not found'}</span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to files
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold">{file.filename}</h1>
      </div>

      <div className="space-y-6">
        {parsingFile ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Parsing Excel file...</span>
          </div>
        ) : worksheets.length > 0 ? (
          <div className="space-y-8">
            {worksheets.map((sheet, sheetIndex) => (
              <div key={sheet.name} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4 border-b flex items-center gap-2">
                  <TableIcon className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold flex-1">
                    Sheet: {sheet.name}
                  </h2>
                  <button
                    onClick={handleProcess}
                    disabled={processing}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {processing ? 'Processing...' : 'Process'}
                  </button>
                </div>
                {processSuccess && (
                  <div className="bg-green-100 text-green-700 px-4 py-2 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    File processed successfully!
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      {sheet.data.map((row, rowIndex) => (
                        <tr key={`${sheetIndex}-row-${rowIndex}`}>
                          {row.map((cell, colIndex) => !cell.isHidden && (
                            <td
                              key={`${sheetIndex}-${rowIndex}-${colIndex}`}
                              style={getCellStyle(cell)}
                              rowSpan={cell.rowSpan}
                              colSpan={cell.colSpan}
                              className={`text-sm border relative ${
                                editingCell?.sheetIndex === sheetIndex &&
                                editingCell?.row === rowIndex &&
                                editingCell?.col === colIndex
                                  ? 'p-0'
                                  : 'p-2 cursor-pointer hover:bg-blue-50'
                              }`}
                              onClick={() =>
                                !editingCell &&
                                handleCellClick(sheetIndex, rowIndex, colIndex, cell.value)
                              }
                            >
                              {editingCell?.sheetIndex === sheetIndex &&
                              editingCell?.row === rowIndex &&
                              editingCell?.col === colIndex ? (
                                <div className="flex">
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={handleCellEdit}
                                    className="flex-1 p-2 border-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <div className="flex items-center border-l">
                                    <button
                                      onClick={handleSaveEdit}
                                      disabled={saving}
                                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50"
                                      title="Save"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      disabled={saving}
                                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                cell.value?.toString() || ''
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
            No data found in the Excel file
          </div>
        )}

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">File Details</h2>
          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
            <dt className="text-gray-600">Size</dt>
            <dd className="truncate">{(file.size / 1024).toFixed(1)} KB</dd>
            <dt className="text-gray-600">Type</dt>
            <dd className="truncate">{file.type}</dd>
            <dt className="text-gray-600">Uploaded</dt>
            <dd className="truncate">{new Date(file.created_at).toLocaleString()}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
};