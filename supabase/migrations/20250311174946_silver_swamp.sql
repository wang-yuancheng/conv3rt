/*
  # Add update policies for files

  1. Changes
    - Add RLS policy to allow users to update their own files in storage
    - Add RLS policy to allow users to update their own file records

  2. Security
    - Users can only update files they own
    - Policies check user_id matches authenticated user
*/

-- Add policy to allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add policy to allow users to update their own file records
CREATE POLICY "Users can update their own file records"
ON files
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);