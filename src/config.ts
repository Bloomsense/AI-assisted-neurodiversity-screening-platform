/**
 * Public HTTP API origin for fetch() calls from the browser.
 *
 * Safe to expose: this is only a URL (like https://your-app.vercel.app). Never put
 * Supabase service keys or other secrets in Vite env vars — they are bundled for clients.
 *
 * - Leave unset (or empty): use same-origin `/api/...` — works with the Vite dev proxy
 *   and when the UI and API are served from the same host.
 * - Set `VITE_API_BASE_URL` for staging/production when the API lives on another origin.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.replace(/\/$/, '');
  }
  return '';
}
