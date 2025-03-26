import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { FileList } from './FileList';
import type { FileRecord } from '../types/files';

export const FileSelection: React.FC = () => {
  const navigate = useNavigate();
  const [excelFiles, setExcelFiles] = useState<FileRecord[]>([]);
  const [pdfFiles, setPdfFiles] = useState<FileRecord[]>([]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/upload-excel')}
          className="group p-8 bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-500/50 relative overflow-hidden"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-green-50 rounded-full group-hover:bg-green-100 transition-colors duration-300 relative z-10">
              <FileSpreadsheet className="w-12 h-12 text-green-600" />
            </div>
            <div className="text-center relative z-10">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Excel</h3>
              <p className="text-sm text-gray-600">
                Process and analyze Excel spreadsheets
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Supports .xlsx and .xls files
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/upload-pdf')}
          className="group p-8 bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-500/50 relative"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-50 rounded-full group-hover:bg-red-100 transition-colors duration-300 relative z-10">
              <FileText className="w-12 h-12 text-red-600" />
            </div>
            <div className="text-center relative z-10">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload PDF</h3>
              <p className="text-sm text-gray-600">
                View and manage PDF documents
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Supports .pdf files
              </p>
            </div>
          </div>
        </button>
      </div>
      
      <div className="mt-12 space-y-8">
        <FileList
          files={excelFiles}
          setFiles={setExcelFiles}
          category="excel"
          title="Excel Documents"
          className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-8 border border-gray-100"
        />
        
        <FileList
          files={pdfFiles}
          setFiles={setPdfFiles}
          category="pdf"
          title="PDF Documents"
          className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-8 border border-gray-100"
        />
      </div>
    </div>
  );
};