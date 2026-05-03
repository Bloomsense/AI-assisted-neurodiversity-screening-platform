# Environment Variables Setup

## Quick Setup

1. **Get your Supabase Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/irqqfedhzzxysdiowuft/settings/api
   - Scroll down to "Project API keys"
   - Copy the `service_role` key (⚠️ Keep this secret!)

2. **Edit the `.env` file:**
   - Open `.env` in your project root
   - Replace `your-service-role-key-here` with your actual service role key
   - Save the file

3. **Run the backend:**
   ```powershell
   npm run dev:backend
   ```

## Alternative: Set Environment Variables in PowerShell

If you prefer to set environment variables directly in PowerShell (instead of using .env file):

```powershell
# Set environment variables for current session
$env:DATABASE_URL = "https://irqqfedhzzxysdiowuft.supabase.co"
$env:DATABASE_SERVICE_ROLE_KEY = "your-actual-service-role-key"
$env:PORT = "8000"

# Then run the backend
npm run dev:backend
```

## Verify Your Setup

After setting up, test the backend:

```powershell
# Test backend health
curl http://localhost:8000/make-server-8d885905/health
```

You should see: `{"status":"ok","message":"Backend server is running"}`

## Security Note

⚠️ **Never commit your `.env` file to git!** It contains sensitive credentials.

The `.env` file is already in `.gitignore` to prevent accidental commits.
