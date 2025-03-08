import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const STORAGE_BUCKET = 'files';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Note: Remove bucket initialization as it should be done through the Supabase dashboard
// Bucket creation and policy setup requires admin privileges which we don't have
// in the client-side application