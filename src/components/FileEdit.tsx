import * as ExcelJS from 'exceljs';
import { AlertCircle, ArrowLeft, LayoutTemplate, Loader2, Play, Save, Table as TableIcon, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Range, read, utils } from 'xlsx';
import { STORAGE_BUCKET, supabase } from '../lib/supabase';
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

const FileEdit: React.FC = () => {
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
  const [savingReformat, setSavingReformat] = useState(false);
  const [savingProcess, setSavingProcess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasReformatted, setHasReformatted] = useState<boolean>(false);
  const [processSuccess, setProcessSuccess] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [hasAccountType, setHasAccountType] = useState(false);
  const [backendUrl] = useState(
    import.meta.env.MODE === 'development' 
      ? 'http://localhost:3000'
      : 'https://conv3rt-backend.onrender.com'
  );

  const loadProcessedData = async (fileData: FileRecord) => {
    if (!fileData.processed_data || !Array.isArray(fileData.processed_data)) return;
    
    try {
      const data = fileData.processed_data;
      
      // Map the classifications to their respective columns
      // Account Type is in column 3 (index 3), then classifications start at column 4 (index 4)
      const classifications = data.map(row => ({
        accountType: row[0] || '',
        primary: row[1] || '',
        secondary: row[2] || '',
        tertiary: row[3] || ''
      }));

      // Update each classification column
      await Promise.all([
        fillColumnWithValues(3, classifications.map(c => c.accountType)),    // Account Type
        fillColumnWithValues(4, classifications.map(c => c.primary)),        // Primary
        fillColumnWithValues(5, classifications.map(c => c.secondary)),      // Secondary
        fillColumnWithValues(6, classifications.map(c => c.tertiary))        // Tertiary
      ]);
    } catch (err) {
      console.error('Error loading processed data:', err);
      setError('Failed to load processed data');
    }
  };

  const fillColumnWithValues = async (columnNumber: number, values: string[]) => {
    if (!worksheets.length) return;
    if (!file) return;
    if (!values.length) return;

    try {
      setSaving(true);

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

      // Update the Excel file
      const worksheet = workbook.worksheets[0];
      if (!worksheet) throw new Error('Worksheet not found');

      values.forEach((value, index) => {
        // Skip header row (index 0) and start filling from row 1
        const rowIndex = index + 1;
        if (rowIndex <= worksheet.rowCount) {
          const cell = worksheet.getCell(rowIndex + 1, columnNumber + 1);
          cell.value = value;
        }
      });

      // Convert to blob and upload
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: file.type });

      // Upload modified file
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .update(file.storage_path, blob);

      if (uploadError) throw uploadError;
    
      // Update the UI
      const newWorksheets = [...worksheets];
      values.forEach((value, index) => {
        const rowIndex = index + 1;
        if (rowIndex < newWorksheets[0].data.length) {
          if (!newWorksheets[0].data[rowIndex]) {
            newWorksheets[0].data[rowIndex] = [];
          }
          if (!newWorksheets[0].data[rowIndex][columnNumber]) {
            newWorksheets[0].data[rowIndex][columnNumber] = { value: null, style: {} };
          }
          newWorksheets[0].data[rowIndex][columnNumber].value = value;
        }
      });

      setWorksheets(newWorksheets);
    } catch (err) {
      console.error('Error filling column:', err);
      setError('Failed to update column values. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
        
        if (data.category === 'pdf') {
          // Get signed URL for PDF
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(data.storage_path, 3600); // 1 hour expiry

          if (signedUrlError) throw signedUrlError;
          if (!signedUrlData?.signedUrl) throw new Error('Failed to generate PDF URL');

          console.log("signedUrlData.signedUrl)"+ signedUrlData.signedUrl)
          setPdfUrl(signedUrlData.signedUrl);
        } else {
          setHasReformatted(data.reformatted);
          await parseExcelFile(data);
          
          // Load processed data after parsing the file
          if (data.processed_data) {
            await loadProcessedData(data);
          }
        }
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
    const nonEmptyColumns = new Set<number>();

    // Initialize the data array
    for (let r = 0; r <= range.e.r; ++r) {
      data[r] = [];
      for (let c = 0; c <= range.e.c; ++c) {
        const address = utils.encode_cell({ r, c });
        const cell = processCell(worksheet, address);
        data[r][c] = cell;
        
        // Track non-empty columns
        if (cell.value !== null && cell.value !== undefined && cell.value.toString().trim() !== '') {
          nonEmptyColumns.add(c);
        }
      }
    }

    // Mark cells in empty columns as hidden
    for (let r = 0; r <= range.e.r; ++r) {
      for (let c = 0; c <= range.e.c; ++c) {
        if (!nonEmptyColumns.has(c)) {
          data[r][c].isHidden = true;
        }
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

  const handleRemoveFirstRows = async () => {
    if (!file) return;
  
    const headerMappings = {
      'Account': 'Account Description',
      'Debit': 'Debit Amount',
      'Credit': 'Credit Amount',
      'Type': 'Account Type',
    };
    const headerIndicators = ['Account Code', 'Account', 'Account Type', 'Debit - Year to date', 'Debit', 'Credit'];
  
    try {
      // setSaving(true);
      setSavingReformat(true);
      setError('');
      setHasReformatted(true);
  
      // Update database status
      const { error: updateError } = await supabase
        .from('files')
        .update({ reformatted: true, reformatted_at: new Date().toISOString() })
        .eq('id', file.id);

        setFile({
          ...file,
          reformatted: true,
          reformatted_at: new Date().toISOString() 
        });
        
      // download excel
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.storage_path, 60);
      if (signedUrlError) throw signedUrlError;
      const response = await fetch(signedUrlData!.signedUrl);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
  

      console.log(JSON.stringify(worksheets,null,2));

      const newWorksheets = worksheets.map(sheet => {
        const headerIndex = sheet.data.findIndex(row =>
          row.some(cell =>
            typeof cell.value === 'string' &&
            headerIndicators.some(ind => ind.toLowerCase() === cell.value.toString().toLowerCase())
          )
        );
        const start = headerIndex === -1 ? 0 : headerIndex;
      
        const origHeader = sheet.data[start] || [];
        let headerTexts = origHeader.map(cell => 
  cell.value?.toString().trim().toLowerCase() || ''
);

// Special‑case QuickBooks: blank first header + “Debit” + “Credit”
if (
  headerTexts[0] === '' &&
  headerTexts[1]?.includes('debit') &&
  headerTexts[2]?.includes('credit')
) {
  headerTexts[0] = 'account'; // pretend the first column is “Account”
}


      const hasAccountType = headerTexts.some(h => 
        h === 'account type' || h === 'type'
      );
      setHasAccountType(hasAccountType)

      console.log("hasAccountType: " + hasAccountType)

        const keys = Object.keys(headerMappings);

        const colIndices = keys.map(key => {
          const lowerKey = key.toLowerCase();
          const mappedValue = headerMappings[key].toLowerCase();

          let idx = headerTexts.findIndex(h => h === mappedValue);
          if (idx >= 0) return idx;

          idx = headerTexts.findIndex(h => h === lowerKey);
          if (idx >= 0) return idx;

          return headerTexts.findIndex(h => h.includes(lowerKey));
        });

        return {
          ...sheet,
          data: sheet.data
            .slice(start)
            .map((row, rowIndex) => {
              const filtered = colIndices.map(i =>
                i >= 0 && row[i] ? row[i] : { value: '', style: {} }
              );
      
              if (rowIndex === 0) {
                const header = keys.map(key => ({
                  value: headerMappings[key],
                  style: {}
                }));
              const insertColumns = [];
              insertColumns.push(
                { value: 'Primary Classification', style: {} },
                { value: 'Secondary Classification', style: {} },
                { value: 'Tertiary Classification', style: {} }
              );

              header.splice(4, 0, ...insertColumns);
              return header;
              }
      
              const emptyColumns = [];
              emptyColumns.push(
                { value: '', style: {} },
                { value: '', style: {} },
                { value: '', style: {} }
              );
              filtered.splice(4, 0, ...emptyColumns);
              return filtered;
            })
            .filter(row => {
  const first = row[0]?.value?.toString().trim() || '';
  // Drop blank, “Total”, or date rows
  if (!first) return false;
  if (/^total$/i.test(first)) return false;
  if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(first)) return false;
  return true;
})
        };
      });
      if (updateError) throw updateError;
      console.log(newWorksheets);
      setWorksheets(newWorksheets);
    } catch (err) {
      console.error('Error removing rows:', err);
      setError('Failed to remove rows. Please try again.');
    } finally {
      setSavingReformat(false);
    }
  };
 

  const handleProcess = async () => {
    try {
      setProcessing(true);
      setSavingProcess(false);
      setProcessSuccess(false);
      setError(null);

      if (!worksheets[0]?.data) {
        throw new Error('No worksheet data available');
      }
      
      // Prepare data for processing, ensuring we handle undefined cells
      const excelData = worksheets.map(sheet => ({
        name: sheet.name,
        data: sheet.data.slice(1) // Skip header row
          .map(row => 
            // Ensure row is an array and filter out hidden cells
            (Array.isArray(row) ? row : [])
              .filter(cell => cell && !cell.isHidden)
              .map(cell => ({
                value: cell?.value?.toString() || ''
              }))
          )
          .filter(row => row.length > 0) // Remove empty rows
      }));

      const response = await fetch(`${backendUrl}/api/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ data: excelData })
      }).catch(err => {
        throw new Error('Failed to connect to server. Please ensure the server is running.');
      });

      if (!response.ok) throw new Error('Failed to process file');
      const processedData = await response.json();
      
      if (!Array.isArray(processedData) || processedData.length === 0) throw new Error('Invalid response from server');
    
    const accountTypeColumnIndex = 4;

    const promises = [];
    const classifications = processedData.map(row => ({
      accountType: row[1] || '',
      primary: row[2] || '',
      secondary: row[3] || '',
      tertiary: row[4] || ''
    }));
    
    if (!hasAccountType) {
      promises.push(fillColumnWithValues(accountTypeColumnIndex - 1, classifications.map(c => c.accountType)));
    }
    
    promises.push(fillColumnWithValues(hasAccountType ? accountTypeColumnIndex : accountTypeColumnIndex, classifications.map(c => c.primary)));
    promises.push(fillColumnWithValues(accountTypeColumnIndex + 1, classifications.map(c => c.secondary)));
    promises.push(fillColumnWithValues(accountTypeColumnIndex + 2, classifications.map(c => c.tertiary)));


      await Promise.all(promises);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      
      worksheets[0].data.forEach((row, rowIndex) => {
        const values = row.map(cell => cell.value);
        worksheet.addRow(values);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: file.type });

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .update(file.storage_path, blob);

      if (uploadError) throw uploadError;

      if (file) {
        const { error: updateError } = await supabase
          .from('files')
          .update({ 
            processed_at: new Date().toISOString(),
            processed_data: processedData,
            last_modified: new Date().toISOString(),
            excel_data: worksheets[0].data,
            excel_data_updated_at: new Date().toISOString(),
          })
          .eq('id', file.id);

        if (updateError) throw updateError;
        setFile({
          ...file,
          // id: newData[0].id,
          processed_at: new Date().toISOString(),
          processed_data: processedData,
          last_modified: new Date().toISOString(),
          excel_data: worksheets[0].data,
          excel_data_updated_at: new Date().toISOString()
        });
      }

      setProcessSuccess(true);
      setTimeout(() => setProcessSuccess(false), 3000);
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process file. Please try again.');
    } finally {
      setProcessing(false);
      setSavingProcess(false);
    }
  };

  const getCellStyle = (cell: CellData): React.CSSProperties => {
    if (cell.isHidden) return { display: 'none' };

    const minWidth = cell.value?.toString().length || 0;
    
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
      minWidth: `${Math.max(minWidth * 8, 120)}px`,
      maxWidth: '400px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
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

  const handleConvertToExcel = async () => {
    if (!file) return;

    try {
      setConverting(true);
      setError(null);

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.storage_path, 3600);

      if (signedUrlError) throw signedUrlError;
      if (!signedUrlData?.signedUrl) throw new Error('Failed to generate PDF URL');

      const response = await fetch(`${backendUrl}/api/process-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl: signedUrlData.signedUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDF');
      }

      const extractedData = await response.json();

      if (!Array.isArray(extractedData) || extractedData.length === 0) {
        throw new Error('No data extracted from PDF');
      }

      const uniqueData = extractedData.filter((value, index, self) =>
        index === self.findIndex((t) => (
          t.join(',') === value.join(',')
        ))
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Extracted Data');

      uniqueData.forEach((row) => {
        if (Array.isArray(row)) {
          worksheet.addRow(row);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const excelFileName = file.filename.replace('.pdf', '.xlsx');
      const excelStoragePath = file.storage_path.replace('.pdf', '.xlsx');

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(excelStoragePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(excelStoragePath);

      const { data: newData, error: dbError } = await supabase
        .from('files')
        .insert({
          filename: excelFileName,
          size: blob.size,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          url: publicUrl,
          user_id: file.user_id,
          storage_path: excelStoragePath,
          category: 'excel',
          is_converted_from_pdf: true,
          converted_from_file_id: file.id
        })  
        .select('id') 
        .single();

        console.log("newData")
        console.log(newData)

      if (dbError) throw dbError;

      const parsedWorksheets: WorksheetData[] = [];
      const firstWorksheet = workbook.worksheets[0];
      
      const data: CellData[][] = [];
      firstWorksheet.eachRow((row, rowNumber) => {
        const rowData: CellData[] = [];
        row.eachCell((cell, colNumber) => {
          rowData.push({
            value: cell.value?.toString() || '',
            style: {
              alignment: cell.alignment?.horizontal || 'left',
              isBold: cell.font?.bold || false
            }
          });
        });
        data.push(rowData);
      });

      parsedWorksheets.push({
        name: firstWorksheet.name,
        data,
        merges: []
      });

      setWorksheets(parsedWorksheets);
      setFile({
        ...file,
        id:newData.id,
        category: 'excel',
        filename: excelFileName,
        storage_path: excelStoragePath,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert file');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(file.category === 'excel' ? '/upload-excel' : '/upload-pdf')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold">{file.filename}</h1>
      </div>

      <div className="space-y-6">
        {file?.category === 'pdf' ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">PDF Preview</h2>
              <button
                onClick={handleConvertToExcel}
                disabled={converting}
                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
              >
                <TableIcon className="w-4 h-4" />
                {converting ? 'Converting...' : 'Convert to Excel'}
              </button>
            </div>
            <div className="w-full h-[800px]">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0" 
                  //sandbox="allow-forms allow-scripts allow-same-origin"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>
        ) : parsingFile ? (
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
                    onClick={handleRemoveFirstRows}
                    disabled={saving || hasReformatted}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors mr-2"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                     {savingReformat ? 'Reformatting...' : 'Reformat'}
                  </button>
                  <button
                    onClick={handleProcess}
                    disabled={!hasReformatted || processing || savingProcess}
                    title={!hasReformatted ? "Please reformat the file before processing" : undefined}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
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
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                      <tr>
                        {sheet.data[0]?.map((cell, colIndex) => cell && !cell.isHidden && (
                          <th
                            key={`${sheetIndex}-header-${colIndex}`}
                            style={{
                              ...getCellStyle(cell),
                              fontWeight: 'bold',
                              backgroundColor: '#ffffff',
                              borderBottom: '2px solid #e5e7eb'
                            }}
                            colSpan={cell.colSpan}
                            className="text-sm p-3"
                          >
                            {cell.value?.toString() || ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.data.slice(1).map((row, rowIndex) => {
                        const hasVisibleCells = row.some(cell => !cell.isHidden);
                        if (!hasVisibleCells) return null;
                        
                        return (
                        <tr key={`${sheetIndex}-row-${rowIndex + 1}`}>
                          {row.map((cell, colIndex) => cell && !cell.isHidden && (
                            <td
                              key={`${sheetIndex}-${rowIndex + 1}-${colIndex}`}
                              style={getCellStyle(cell)}
                              rowSpan={cell.rowSpan}
                              colSpan={cell.colSpan}
                              className={`text-sm border relative ${
                                editingCell?.sheetIndex === sheetIndex &&
                                editingCell?.row === rowIndex + 1 &&
                                editingCell?.col === colIndex
                                  ? 'p-0'
                                  : 'p-2 cursor-pointer hover:bg-blue-50'
                              }`}
                              onClick={() =>
                                !editingCell &&
                                handleCellClick(sheetIndex, rowIndex + 1, colIndex, cell.value)
                              }
                            >
                              {editingCell?.sheetIndex === sheetIndex &&
                              editingCell?.row === rowIndex + 1 &&
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
                      )})}
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

export { FileEdit }