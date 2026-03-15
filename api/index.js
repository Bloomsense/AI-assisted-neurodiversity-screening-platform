/**
 * Vercel serverless function for Node.js AdminDashboard API
 * This replaces the Flask backend (backend/AdminDashboard.py)
 */
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Node.js API is running' });
});

// Admin endpoints have been moved to frontend (AdminDashboard.tsx)
// The frontend now fetches directly from Supabase, so these endpoints are no longer needed

// Vercel serverless function handler
// Vercel will automatically handle Express apps exported this way
module.exports = app;
