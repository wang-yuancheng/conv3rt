import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, Download, Trash2, AlertCircle } from 'lucide-react';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';
import type { FileRecord } from '../types/files';

export const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
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

      // First, get a signed URL for the file
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(file.storage_path, 60); // URL valid for 60 seconds

      if (signedUrlError) throw signedUrlError;
      if (!signedUrlData?.signedUrl) throw new Error('Failed to generate download URL');

      // Fetch the file using the signed URL
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

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setFiles(files.filter(f => f.id !== id));
      setDownloadError(null); // Clear any previous download errors
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
    }
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
    <div className="mt-8 w-full">
      <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
      
      {downloadError && (
        <div className="mb-4 p-3 bg-red-100 rounded-lg flex items-center gap-2 text-red-700">
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
              className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium">{file.filename}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(file.created_at), 'PPp')} •{' '}
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                  title="Download file"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(file.id, file)}
                  className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50 transition-colors"
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