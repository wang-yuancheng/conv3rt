/*
  # Add storage path to files table

  1. Changes
    - Add storage_path column to files table
    - Extract storage path from existing URLs
    - Make storage_path NOT NULL after populating data

  2. Implementation Details
    - First add the column as nullable
    - Update existing records to set storage_path based on URL
    - Finally make the column NOT NULL
*/

-- Add storage_path column as nullable first
ALTER TABLE files ADD COLUMN storage_path text;

-- Update existing records to set storage_path based on URL
DO $$ 
BEGIN
  UPDATE files
  SET storage_path = (
    SELECT split_part(url, '/object/files/', 2)
    WHERE url LIKE '%/object/files/%'
  )
  WHERE storage_path IS NULL;

  -- For any remaining NULL storage_paths, use a combination of user_id and filename
  UPDATE files
  SET storage_path = user_id || '/' || filename
  WHERE storage_path IS NULL;
END $$;

-- Make storage_path NOT NULL after data is populated
ALTER TABLE files ALTER COLUMN storage_path SET NOT NULL;