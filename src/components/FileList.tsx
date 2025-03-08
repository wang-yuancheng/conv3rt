import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, Download, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { FileRecord } from '../types/files';

export const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filename]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setFiles(files.filter(file => file.id !== id));
    } catch (err) {
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
      <div className="text-red-600 text-center py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
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
                <a
                  href={file.url}
                  download
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => handleDelete(file.id, file.filename)}
                  className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
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