import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, FileSpreadsheet, Download, Trash2, AlertCircle, PencilLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';
import type { FileRecord } from '../types/files';

interface FileListProps extends React.HTMLAttributes<HTMLDivElement> {
  files: FileRecord[];
  setFiles: React.Dispatch<React.SetStateAction<FileRecord[]>>;
  category: 'excel' | 'pdf';
  title: string;
}

export const FileList: React.FC<FileListProps> = ({ files, setFiles, category, title, className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileRecord) => {
    try {
      setDownloadError(null);

      if (!file.storage_path) {
        throw new Error('Invalid storage path');
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.storage_path, 60);

      if (signedUrlError) throw signedUrlError;
      if (!signedUrlData?.signedUrl) throw new Error('Failed to generate download URL');

      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) throw new Error('Failed to download file');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading file:', err);
      setDownloadError('Failed to download file. Please try again.');
    }
  };

  const handleDelete = async (id: string, file: FileRecord) => {
    try {
      if (!file.storage_path) {
        throw new Error('Invalid storage path');
      }

      // First delete any converted files that reference this file
      if (file.category === 'pdf') {
        const { error: convertedFilesError } = await supabase
          .from('files')
          .delete()
          .eq('converted_from_file_id', id);

        if (convertedFilesError) throw convertedFilesError;
      }

      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setFiles(files.filter(f => f.id !== id));
      setDownloadError(null);
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
    }
  };

  const handleEdit = (fileId: string) => {
    navigate(`/edit/${fileId}`);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading files...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4 flex items-center justify-center gap-2">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`mt-8 w-full ${className}`}>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      
      {downloadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{downloadError}</p>
        </div>
      )}

      <div className="space-y-4">
        {files.length === 0 ? (
          <p className="text-gray-500 text-center">No files uploaded yet</p>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="bg-white p-4 rounded-lg border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow transition-all duration-200 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                {file.category === 'pdf' ? (
                  <FileText className="w-5 h-5 text-red-600" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{file.filename}</p>
                    {file.is_converted_from_pdf && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        Converted from PDF
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {format(new Date(file.created_at), 'PPp')} •{' '}
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(file.id)}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-all duration-200"
                  title="Edit file"
                >
                  <PencilLine className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-all duration-200"
                  title="Download file"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(file.id, file)}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-all duration-200"
                  title="Delete file"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};