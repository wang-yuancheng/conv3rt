/*
  # Update files table with user_id and policies

  1. Changes
    - Add user_id column to files table
    - Add foreign key constraint to auth.users
    - Update RLS policies to restrict access by user_id

  2. Security
    - Enable RLS on files table
    - Add policies for authenticated users to:
      - Insert their own files
      - Read their own files
      - Delete their own files
*/

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE files ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policy for inserting files
CREATE POLICY "Users can insert their own files"
ON files FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for reading files
CREATE POLICY "Users can view their own files"
ON files FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Policy for deleting files
CREATE POLICY "Users can delete their own files"
ON files FOR DELETE TO authenticated
USING (auth.uid() = user_id);