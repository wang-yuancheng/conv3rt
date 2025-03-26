/*
  # Add isReformatted column to files table

  1. Changes
    - Add isReformatted boolean column to files table
    - Set default value to false
    - Update existing records
    
  2. Implementation
    - Add column with default value
    - Ensure backward compatibility
    - Maintain data integrity
*/

-- Add isReformatted column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'is_reformatted'
  ) THEN
    ALTER TABLE files ADD COLUMN is_reformatted boolean DEFAULT false;
  END IF;
END $$;

-- Update existing records to ensure consistency with reformatted column
UPDATE files 
SET is_reformatted = reformatted 
WHERE reformatted IS NOT NULL AND is_reformatted IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_files_is_reformatted ON files(is_reformatted);