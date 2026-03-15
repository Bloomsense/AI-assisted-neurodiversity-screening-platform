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

// Admin endpoints - will be implemented later
// TODO: Migrate logic from backend/AdminDashboard.py
app.get('/api/admin/therapists', async (req, res) => {
  try {
    // TODO: Implement therapist fetching logic
    // This will replace the Flask AdminDashboard.py logic
    res.json({
      success: true,
      therapists: []
    });
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      therapists: []
    });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    // TODO: Implement stats fetching logic
    res.json({
      success: true,
      stats: {
        totalTherapists: 0,
        totalPatients: 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Vercel serverless function handler
// Vercel will automatically handle Express apps exported this way
module.exports = app;
