# Quick Deployment Check

## File Structure Status

### ✅ Correct Files:
- `api/index.py` - Vercel serverless function ✅
- `api/requirements.txt` - Python dependencies for Vercel ✅
- `backend/AdminDashboard.py` - Flask application ✅
- `backend/requirements.txt` - Python dependencies for local dev ✅
- `vercel.json` - Vercel configuration ✅

### ❌ Issues Found:
- Empty `backend/api/` directory (should be removed)

## For Local Development:

1. **Start Flask server:**
   ```powershell
   cd backend
   python AdminDashboard.py
   ```

2. **Check if running:**
   - Open: http://localhost:5000/api/health
   - Should return: `{"status":"healthy","message":"Flask API is running"}`

3. **Frontend .env file** (in project root):
   ```env
   VITE_FLASK_API_URL=http://localhost:5000
   ```

## For Vercel Deployment:

1. **Environment Variables** (set in Vercel dashboard):
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `FLASK_ENV=production`

2. **After deployment, update frontend .env:**
   ```env
   VITE_FLASK_API_URL=https://your-vercel-domain.vercel.app
   ```

## Troubleshooting "Failed to connect to backend":

### If running locally:
- ✅ Flask server must be running: `python backend/AdminDashboard.py`
- ✅ Check `VITE_FLASK_API_URL` in root `.env` file
- ✅ Test: http://localhost:5000/api/health

### If on Vercel:
- ✅ Check Vercel deployment logs
- ✅ Verify environment variables are set
- ✅ Check function logs in Vercel dashboard
- ✅ Update frontend `.env` with Vercel URL
