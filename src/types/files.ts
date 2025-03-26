export interface FileRecord {
  id: string;
  filename: string;
  size: number;
  type: string;
  created_at: string;
  url: string;
  user_id: string;
  storage_path: string;
  category: 'excel' | 'pdf';
  text_encoding?: string;
  embedded_fonts?: boolean;
  unicode_text?: boolean;
  quality_checked?: string;
  reformatted?: boolean;
  reformatted_at?: string;
  processed_data?: any[];
  processed_at?: string;
  is_converted_from_pdf?: boolean;
  converted_from_file_id?: string;
}