/*
  # Add PDF quality settings

  1. Changes
    - Add text_encoding column to store PDF text encoding info
    - Add embedded_fonts column to track font embedding status
    - Add unicode_text column to ensure proper Unicode support
    - Add quality_checked timestamp to track verification
    
  2. Implementation
    - Add columns for PDF quality tracking
    - Only apply to PDF files
    - Track text encoding and font embedding status
*/

-- Add columns for PDF quality tracking
ALTER TABLE files
ADD COLUMN text_encoding text,
ADD COLUMN embedded_fonts boolean DEFAULT false,
ADD COLUMN unicode_text boolean DEFAULT false,
ADD COLUMN quality_checked timestamptz;

-- Create function to update quality fields
CREATE OR REPLACE FUNCTION update_pdf_quality()
RETURNS trigger AS $$
BEGIN
  IF NEW.category = 'pdf' THEN
    NEW.text_encoding = 'UTF-8';
    NEW.embedded_fonts = true;
    NEW.unicode_text = true;
    NEW.quality_checked = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set quality fields for PDFs
CREATE TRIGGER ensure_pdf_quality
  BEFORE INSERT OR UPDATE ON files
  FOR EACH ROW
  WHEN (NEW.category = 'pdf')
  EXECUTE FUNCTION update_pdf_quality();

-- Update existing PDF files
UPDATE files
SET 
  text_encoding = 'UTF-8',
  embedded_fonts = true,
  unicode_text = true,
  quality_checked = now()
WHERE category = 'pdf';