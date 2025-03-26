/*
  # Add Excel Data Storage (Safe Version)

  1. Changes
    - Add excel_data column to store complete Excel file data if it doesn't exist
    - Add excel_data_updated_at timestamp if it doesn't exist
    
  2. Implementation
    - Use DO block to check column existence before adding
    - Prevent errors if columns already exist
*/

DO $$ 
BEGIN
  -- Add excel_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'excel_data'
  ) THEN
    ALTER TABLE files ADD COLUMN excel_data jsonb;
  END IF;

  -- Add excel_data_updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'excel_data_updated_at'
  ) THEN
    ALTER TABLE files ADD COLUMN excel_data_updated_at timestamptz;
  END IF;
END $$;