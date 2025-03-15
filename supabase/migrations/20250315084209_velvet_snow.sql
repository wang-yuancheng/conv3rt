/*
  # Add last_modified column to files table

  1. Changes
    - Add last_modified timestamp column to files table
    - Set default value to current timestamp
    - Backfill existing records with created_at value

  2. Implementation Details
    - Add column as nullable first
    - Update existing records
    - Set NOT NULL constraint
*/

-- Add last_modified column
ALTER TABLE files ADD COLUMN last_modified timestamptz;

-- Update existing records to use created_at as last_modified
UPDATE files SET last_modified = created_at WHERE last_modified IS NULL;

-- Make last_modified NOT NULL and set default
ALTER TABLE files 
  ALTER COLUMN last_modified SET NOT NULL,
  ALTER COLUMN last_modified SET DEFAULT now();