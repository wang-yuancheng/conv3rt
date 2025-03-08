import React, { useState, useRef } from 'react';
import { Upload, File, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png'
];

interface UploadProgressProps {
  progress: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

export const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return false;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not supported');
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

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            setProgress(Math.round(percentage));
          },
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName);

      // Store metadata in database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          filename: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl
        });

      if (dbError) throw dbError;

      setSuccess(true);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
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
            <p className="text-xs text-gray-500">
              Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.png"
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
            className="w-full mt-4 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
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
  );
};