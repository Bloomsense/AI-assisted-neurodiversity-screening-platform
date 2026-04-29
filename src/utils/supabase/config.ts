/**
 * Supabase settings from Vite env. Copy `.env.example` to `.env` in the project root.
 */
function loadConfig() {
  const urlRaw = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
  const projectIdRaw = import.meta.env.VITE_SUPABASE_PROJECT_ID?.trim() ?? '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

  let supabaseUrl = urlRaw;
  let projectId = projectIdRaw;

  if (!supabaseUrl && projectId) {
    supabaseUrl = `https://${projectId}.supabase.co`;
  }
  if (!projectId && supabaseUrl) {
    const m = supabaseUrl.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
    if (m) projectId = m[1];
  }

  return { supabaseUrl, publicAnonKey: anonKey, projectId };
}

const cfg = loadConfig();

export const supabaseUrl = cfg.supabaseUrl;
export const publicAnonKey = cfg.publicAnonKey;
export const projectId = cfg.projectId;

export function isSupabaseConfigured(): boolean {
  return Boolean(cfg.supabaseUrl && cfg.publicAnonKey);
}
