/*
  # Add PDF Origin Tracking

  1. Changes
    - Add is_converted_from_pdf column to files table
    - Add converted_from_file_id to reference original PDF file
    
  2. Implementation
    - Track whether an Excel file was converted from PDF
    - Store reference to original PDF file
*/

-- Add column to track if file was converted from PDF
ALTER TABLE files ADD COLUMN is_converted_from_pdf boolean DEFAULT false;

-- Add column to reference original PDF file
ALTER TABLE files ADD COLUMN converted_from_file_id uuid REFERENCES files(id);

-- Add index for better query performance
CREATE INDEX idx_files_converted_from_file_id ON files(converted_from_file_id);