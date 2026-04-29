import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, publicAnonKey, isSupabaseConfigured } from './config';

if (!isSupabaseConfigured()) {
  console.error(
    '[BloomSense] Missing Supabase env. Copy `.env.example` to `.env` and set VITE_SUPABASE_URL (or VITE_SUPABASE_PROJECT_ID) and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  publicAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
