/*
  # Add file type categorization

  1. Changes
    - Add file_category column to files table
    - Set default category based on file type
    - Update existing records
    
  2. Implementation
    - Add enum type for file categories
    - Add column with default value
    - Backfill existing records
*/

-- Create enum for file categories
CREATE TYPE file_category AS ENUM ('excel', 'pdf');

-- Add category column
ALTER TABLE files ADD COLUMN category file_category;

-- Update existing records based on file type
UPDATE files 
SET category = CASE 
  WHEN type IN ('application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') THEN 'excel'::file_category
  WHEN type = 'application/pdf' THEN 'pdf'::file_category
END;

-- Make category required after backfill
ALTER TABLE files ALTER COLUMN category SET NOT NULL;