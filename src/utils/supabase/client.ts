import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Log initialization for debugging
console.log('Initializing Supabase client:', {
  url: supabaseUrl,
  hasKey: !!publicAnonKey,
  keyLength: publicAnonKey?.length
});

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
