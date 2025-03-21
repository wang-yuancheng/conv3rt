import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, FileText } from 'lucide-react';

export const FileSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => navigate('/upload-excel')}
          className="group p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
              <FileSpreadsheet className="w-12 h-12 text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Excel File</h3>
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
          className="group p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-red-500"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-50 rounded-full group-hover:bg-red-100 transition-colors">
              <FileText className="w-12 h-12 text-red-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload PDF File</h3>
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
    </div>
  );
};