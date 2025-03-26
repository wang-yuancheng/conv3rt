/*
  # Add Excel data storage

  1. Changes
    - Add excel_data column to store complete Excel file data
    - Add excel_data_updated_at timestamp to track last update
    
  2. Implementation
    - Use JSONB type for flexible data storage
    - Track when Excel data was last updated
*/

-- Add columns for Excel data storage
ALTER TABLE files 
ADD COLUMN excel_data jsonb,
ADD COLUMN excel_data_updated_at timestamptz;