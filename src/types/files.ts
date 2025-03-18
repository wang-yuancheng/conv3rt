export interface FileRecord {
  id: string;
  filename: string;
  size: number;
  type: string;
  created_at: string;
  url: string;
  user_id: string;
  storage_path: string;
  reformatted?: boolean;
  reformatted_at?: string;
  processed_data?: any[];
  processed_at?: string;
}