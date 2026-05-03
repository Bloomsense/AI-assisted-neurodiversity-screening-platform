# Local Backend Setup Guide

This guide will help you run the backend server locally and connect it with your frontend and Supabase database.

## Prerequisites

1. **Deno** - The backend runs on Deno runtime
2. **Supabase Account** - You need your Supabase project credentials

## Step 1: Install Deno

### Windows (PowerShell):
```powershell
irm https://deno.land/install.ps1 | iex
```

### After installation, restart your terminal or run:
```powershell
$env:Path += ";$env:USERPROFILE\.deno\bin"
```

### Verify installation:
```powershell
deno --version
```

## Step 2: Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (ID: `irqqfedhzzxysdiowuft`)
3. Go to **Project Settings** > **API**
4. Copy these values:
   - **Project URL**: `https://irqqfedhzzxysdiowuft.supabase.co`
   - **Service Role Key**: (under "service_role" key - keep this secret!)

## Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```powershell
   copy .env.example .env
   ```

2. Open `.env` and fill in your values:
   ```
   DATABASE_URL=https://irqqfedhzzxysdiowuft.supabase.co
   DATABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
   PORT=8000
   ```

## Step 4: Update Frontend to Use Local Backend

The frontend is currently configured to use the cloud backend. To use your local backend, you need to update the API URL in `src/components/ChildProfileDetail.tsx`.

**Option 1: Update for local development only**

In `src/components/ChildProfileDetail.tsx`, change line 60:

```typescript
// Change from:
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-8d885905`;

// To:
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8000/make-server-8d885905'
  : `https://${projectId}.supabase.co/functions/v1/make-server-8d885905`;
```

## Step 5: Run the Backend Server

Open a **new terminal window** and run:

```powershell
npm run dev:backend
```

You should see:
```
🚀 Starting backend server on port 8000...
📡 Health check: http://localhost:8000/make-server-8d885905/health
```

## Step 6: Run the Frontend

In your **original terminal**, run:

```powershell
npm run dev
```

The frontend will run on `http://localhost:3000`

## Step 7: Verify Connection

1. **Test backend health**: Open `http://localhost:8000/make-server-8d885905/health` in your browser
   - Should return: `{"status":"ok","message":"Backend server is running"}`

2. **Test frontend**: Open `http://localhost:3000`
   - The app should load and connect to your local backend

## Troubleshooting

### Backend won't start
- **Error: "Missing required environment variables"**
  - Make sure you created `.env` file with correct values
  - Check that `.env` is in the project root directory

- **Error: "Permission denied"**
  - Make sure Deno has the required permissions (the script uses `--allow-net --allow-env --allow-read`)

### Frontend can't connect to backend
- **CORS errors**
  - The backend already has CORS enabled for all origins
  - Check that backend is running on port 8000

- **404 errors**
  - Make sure the API_BASE_URL in `ChildProfileDetail.tsx` points to `http://localhost:8000/make-server-8d885905`
  - Check browser console for specific error messages

### Database connection issues
- **Error connecting to Supabase**
  - Verify your `DATABASE_URL` and `DATABASE_SERVICE_ROLE_KEY` are correct
  - Make sure your Supabase project is active
  - Check Supabase dashboard for any service issues

## Running Both Servers Together

You need **two terminal windows**:

**Terminal 1 (Backend):**
```powershell
npm run dev:backend
```

**Terminal 2 (Frontend):**
```powershell
npm run dev
```

## API Endpoints

Your local backend provides these endpoints:

- `GET /make-server-8d885905/health` - Health check
- `GET /make-server-8d885905/comments/:childId` - Get comments
- `POST /make-server-8d885905/comments/:childId` - Add comment
- `GET /make-server-8d885905/meetings/:childId` - Get meetings
- `POST /make-server-8d885905/meetings/:childId` - Schedule meeting
- `POST /make-server-8d885905/meetings/:childId/:meetingId/reminder` - Send reminder
- `GET /make-server-8d885905/appointments` - Get appointments
- `POST /make-server-8d885905/appointments` - Create appointment

All endpoints are prefixed with `/make-server-8d885905` to match the Supabase Edge Function structure.
