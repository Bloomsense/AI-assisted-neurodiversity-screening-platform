const ADMIN_EMAIL = 'Admin@bloomsense.com';
const ADMIN_PASSWORD = 'admin@2025';
export const ADMIN_SESSION_KEY = 'bloomsense_admin_authenticated';

export function isValidAdminCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD
  );
}

export function setAdminSession(): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}
