# Deployment Guide for AdminDashboard Flask API

## Pre-Deployment Checklist

### 1. Environment Variables
Make sure to set these environment variables in your deployment platform:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `FLASK_ENV` - Set to `production` (not `development`)
- `FLASK_PORT` - Usually set automatically by platform (default: 5000)

### 2. File Name Note
The main file is named `AdminDashboard.py`. Some platforms expect `app.py`. 
- **Option A**: Rename `AdminDashboard.py` to `app.py` before deployment
- **Option B**: Update platform configuration to use `AdminDashboard:app` as the WSGI application

### 3. Requirements
All dependencies are listed in `requirements.txt`. Make sure:
- `requests` is included (for Supabase REST API calls)
- `waitress` is included (for production server)

## Deployment Platforms

### Railway
1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Railway will auto-detect Python and install dependencies
4. Update start command if needed: `waitress-serve --host=0.0.0.0 --port=$PORT AdminDashboard:app`

### Render
1. Create new Web Service
2. Connect GitHub repository
3. Set environment variables
4. Build command: `pip install -r requirements.txt`
5. Start command: `waitress-serve --host=0.0.0.0 --port=$PORT AdminDashboard:app`

### Heroku
1. Use the provided `Procfile`
2. Set environment variables: `heroku config:set SUPABASE_URL=... SUPABASE_KEY=... FLASK_ENV=production`
3. Deploy: `git push heroku main`

### PythonAnywhere
1. Upload files via web interface
2. Set environment variables in Web app configuration
3. Update WSGI configuration file to point to `AdminDashboard:app`

## Testing After Deployment

1. Health check: `https://your-domain.com/api/health`
2. Should return: `{"status":"healthy","message":"Flask API is running"}`

## Important Notes

- **Never commit `.env` file** - It's already in `.gitignore`
- Set `FLASK_ENV=production` in deployment platform (not in .env file)
- The API uses Supabase REST API, so no additional Supabase client setup needed
- CORS is enabled for all origins - consider restricting in production if needed
