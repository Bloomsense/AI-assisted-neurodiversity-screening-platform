
export const API_BASE_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://ai-assisted-neurodiversity-screenin-eosin.vercel.app'  // Production backend
    : 'http://localhost:3000';         // Local development