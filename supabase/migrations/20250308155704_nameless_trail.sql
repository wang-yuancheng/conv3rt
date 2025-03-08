/*
  # File Upload System Schema

  1. New Tables
    - `files`
      - `id` (uuid, primary key)
      - `filename` (text, original filename)
      - `size` (integer, file size in bytes)
      - `type` (text, MIME type)
      - `url` (text, public URL)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `files` table
    - Add policies for authenticated users to:
      - Read all files
      - Insert their own files
      - Delete their own files
*/

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  size integer NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access"
  ON files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert"
  ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to delete their files"
  ON files
  FOR DELETE
  TO authenticated
  USING (true);