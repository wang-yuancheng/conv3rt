/*
  # Add processed data column to files table

  1. Changes
    - Add processed_data column to store JSON data
    - Add processed_at timestamp to track when processing occurred
    
  2. Implementation
    - Use JSONB type for flexible JSON storage
    - Add timestamp for tracking processing time
*/

-- Add processed_data column
ALTER TABLE files ADD COLUMN processed_data jsonb;

-- Add processed_at timestamp
ALTER TABLE files ADD COLUMN processed_at timestamptz;