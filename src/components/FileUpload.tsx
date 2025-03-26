import React, { useState, useRef } from 'react';
import { Upload, File, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, STORAGE_BUCKET } from '../lib/supabase';
import type { FileRecord } from '../types/files';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
];

interface UploadProgressProps {
  progress: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div
      className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

interface FileUploadProps {
  onFileUploaded?: (file: FileRecord) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return false;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only Excel files (.xls, .xlsx) are supported');
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError('');
    setSuccess(false);
    
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);
      setError('');

      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Please sign in to upload files');
      }

      // Create a unique filename with user ID prefix
      const fileExt = file.name.split('.').pop();
      const uniqueId = Math.random().toString(36).slice(2);
      const storagePath = `${user.id}/${uniqueId}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setProgress(Math.round(percentage));
          },
        });

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);
      
      const fileData = {
        filename: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        user_id: user.id,
        storage_path: storagePath,
        category: 'excel'
      };

      // Store metadata in database
      const { data: insertedFile, error: dbError } = await supabase
        .from('files')
        .insert(fileData)
        .select()
        .single();

      if (dbError) throw dbError;

      if (insertedFile && onFileUploaded) {
        onFileUploaded(insertedFile);
      }

      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to selection
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mb-1">
              Excel files only (.xls, .xlsx) • Max 10MB
            </p>
            <p className="text-[10px] text-gray-400">Please ensure Excel files contain only one sheet</p>
          </div>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".xlsx,.xls"
          />
        </label>
      </div>

      {file && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <File className="w-4 h-4" />
            <span className="truncate">{file.name}</span>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <UploadProgress progress={progress} />
          <p className="text-sm text-gray-600 text-center mt-2">
            {progress}% uploaded
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg text-green-700 text-sm text-center">
          File uploaded successfully!
        </div>
      )}
    </div>
    </div>
  );
};