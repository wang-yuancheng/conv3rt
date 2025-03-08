/*
  # Create storage bucket for file uploads

  1. Storage Setup
    - Create 'files' storage bucket for user file uploads
    - Enable row level security

  2. Security
    - Add policies for authenticated users to:
      - Upload their own files
      - Read their own files
      - Delete their own files
    - Prevent public access to files
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false);

-- Enable row level security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for users to upload their own files
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);