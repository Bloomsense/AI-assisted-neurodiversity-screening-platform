"""
BloomSense Questionnaire API
Flask backend for fetching neurodiversity screening questions from Supabase
"""

from flask import Flask, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import os
from typing import List, Dict, Any

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://irqqfedhzzxysdiowuft.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlycXFmZWRoenp4eXNkaW93dWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MDkwMDksImV4cCI6MjA3OTE4NTAwOX0.lf4PAQiqSCcBXJQ1nJCvfkENoUl4nLLHx47a74wvd1c')

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase client initialized successfully")
    print(f"  URL: {SUPABASE_URL}")
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    raise


@app.route('/api/questionnaire/questions', methods=['GET'])
def get_questionnaire_questions():
    """
    Fetch all questions from the questionaire table
    Returns questions ordered by question_order
    """
    try:
        print("Fetching questions from Supabase...")
        # Fetch all questions from questionaire table, ordered by question_order
        response = supabase.table('questionaire')\
            .select('question_id, question_text, question_order, max_score, critical_item')\
            .order('question_order', desc=False)\
            .execute()
        
        print(f"Supabase response received. Data: {response.data is not None}, Count: {len(response.data) if response.data else 0}")
        
        if response.data:
            return jsonify({
                'success': True,
                'questions': response.data,
                'count': len(response.data)
            }), 200
        else:
            print("Warning: No questions found in database")
            return jsonify({
                'success': True,
                'questions': [],
                'count': 0,
                'message': 'No questions found'
            }), 200
            
    except Exception as e:
        error_msg = str(e)
        print(f"Error fetching questions: {error_msg}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': error_msg,
            'message': 'Failed to fetch questions from database'
        }), 500


@app.route('/api/questionnaire/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'BloomSense Questionnaire API'
    }), 200


if __name__ == '__main__':
    # Run Flask app
    # Default port 5000, can be overridden with PORT environment variable
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
