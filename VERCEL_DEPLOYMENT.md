# Vercel Deployment Guide for Flask Backend


Vercel uses `vercel.json` configuration file

## Setup for Vercel

### 1. File Structure
Your project should have:
```
project-root/
├── api/
│   └── index.py          # Vercel serverless function wrapper
├── backend/
│   └── AdminDashboard.py # Your Flask app
├── vercel.json           # Vercel configuration
└── requirements.txt      # Python dependencies (in backend/)
```

### 2. Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

- `SUPABASE_URL` = `https://irqqfedhzzxysdiowuft.supabase.co`
- `SUPABASE_KEY` = `your_supabase_anon_key`
- `FLASK_ENV` = `production`
- `FLASK_PORT` = `5000` (optional, Vercel sets this automatically)

### 3. How It Works

- Vercel routes `/api/*` requests to `api/index.py`
- `api/index.py` imports your Flask app from `backend/AdminDashboard.py`
- Vercel's Python runtime automatically handles the WSGI app

### 4. API Endpoints

After deployment, your endpoints will be:
- `https://your-domain.vercel.app/api/health`
- `https://your-domain.vercel.app/api/admin/therapists`
- `https://your-domain.vercel.app/api/admin/stats`

### 5. Update Frontend API URL

In your React app's `.env` file, update:
```env
VITE_FLASK_API_URL=https://your-domain.vercel.app
```

## Deployment Steps

1. **Push to GitHub** (if not already done)
2. **Vercel will auto-detect** the `vercel.json` file
3. **Set environment variables** in Vercel dashboard
4. **Deploy** - Vercel will automatically:
   - Install Python dependencies from `backend/requirements.txt`
   - Build and deploy your serverless functions
   - Deploy your frontend

## Troubleshooting

### If API routes don't work:
- Check that `vercel.json` routes are correct
- Verify `api/index.py` exists and imports correctly
- Check Vercel function logs in dashboard

### If dependencies fail:
- Make sure `backend/requirements.txt` has all dependencies
- Check Vercel build logs for Python package installation errors

### If environment variables don't load:
- Verify they're set in Vercel dashboard (not just `.env` file)
- Redeploy after adding environment variables


