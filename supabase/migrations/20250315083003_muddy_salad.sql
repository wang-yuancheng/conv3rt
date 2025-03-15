/*
  # Add reformatted flag to files table

  1. Changes
    - Add reformatted column to files table
    - Add reformatted_at timestamp column
    
  2. Implementation
    - Both columns are nullable to handle existing files
    - reformatted is a boolean flag
    - reformatted_at tracks when the file was reformatted
*/

-- Add reformatted flag column
ALTER TABLE files ADD COLUMN reformatted boolean DEFAULT false;

-- Add reformatted_at timestamp column
ALTER TABLE files ADD COLUMN reformatted_at timestamptz;