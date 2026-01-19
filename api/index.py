"""
Vercel serverless function for Flask AdminDashboard API
Vercel Python runtime automatically handles WSGI apps
"""
import sys
import os

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

# Import Flask app
from AdminDashboard import app

# Vercel automatically detects and uses the 'app' variable
# No need for a handler function - Vercel's Python runtime handles WSGI apps directly
