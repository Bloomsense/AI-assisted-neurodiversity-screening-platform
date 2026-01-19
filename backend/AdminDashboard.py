from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  

# Get environment variables
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

# Validate environment variables
if not supabase_url:
    raise ValueError("SUPABASE_URL is not set in .env file")
if not supabase_key:
    raise ValueError("SUPABASE_KEY is not set in .env file")

print(f"Supabase URL loaded: {supabase_url[:30]}...")
print(f"Supabase Key loaded: {supabase_key[:30]}...")

# Helper function to make Supabase REST API calls
def supabase_query(table_name, select="*", filters=None):
    """
    Query Supabase using REST API
    """
    url = f"{supabase_url}/rest/v1/{table_name}"
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    params = {'select': select}
    if filters:
        params.update(filters)
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Flask API is running'}), 200

@app.route('/api/admin/therapists', methods=['GET'])
def get_therapists():
    """
    Fetch all doctors (therapists) with their patients from Supabase
    """
    try:
        # Fetch doctors using REST API
        doctors_data = supabase_query('doctors', select='*')
        
        # Fetch patients
        patients_data = supabase_query('patients', select='*')
        
        # Fetch users to get email addresses
        users_data = supabase_query('users', select='user_id,email')
        users_dict = {user.get('user_id'): user.get('email') for user in users_data}
        
        # Transform data to match AdminDashboard interface
        therapists = []
        
        for doctor in doctors_data:
            doctor_id = doctor.get('doctor_id')
            
            # Get patients assigned to this doctor
            doctor_patients = [
                p for p in patients_data 
                if p.get('assigned_doctor_id') == doctor_id
            ]
            
            # Transform patient data
            formatted_patients = []
            for patient in doctor_patients:
                last_session = patient.get('last_session_date') or patient.get('last_session')
                if last_session:
                    try:
                        if isinstance(last_session, str):
                            last_session_date = datetime.fromisoformat(last_session.replace('Z', '+00:00'))
                            days_ago = (datetime.now() - last_session_date.replace(tzinfo=None)).days
                            if days_ago == 0:
                                last_session_str = "Today"
                            elif days_ago == 1:
                                last_session_str = "1 day ago"
                            else:
                                last_session_str = f"{days_ago} days ago"
                        else:
                            last_session_str = "Recently"
                    except:
                        last_session_str = "Recently"
                else:
                    last_session_str = "No sessions yet"
                
                formatted_patients.append({
                    'id': patient.get('patient_id') or patient.get('id'),
                    'name': patient.get('name') or patient.get('patient_name') or patient.get('full_name'),
                    'age': patient.get('age') or patient.get('patient_age'),
                    'status': patient.get('status') or patient.get('screening_status') or 'In Progress',
                    'lastSession': last_session_str,
                    'riskLevel': patient.get('risk_level') or patient.get('riskLevel'),
                    'screeningStage': patient.get('screening_stage') or patient.get('screeningStage')
                })
            
            # Get email from users table
            user_id = doctor.get('user_id')
            doctor_email = users_dict.get(user_id) if user_id else None
            
            if not doctor_email:
                doctor_email = f"doctor{user_id[:8] if user_id else 'unknown'}@bloomsense.com"
            
            # Use active_patients from doctors table
            active_patients = doctor.get('active_patients') or len(formatted_patients)
            
            # Get last login
            last_login = doctor.get('last_login') or doctor.get('created_at')
            if last_login:
                try:
                    if isinstance(last_login, str):
                        login_date = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
                        last_login_str = login_date.strftime('%Y-%m-%d')
                    else:
                        last_login_str = '2024-01-20'
                except:
                    last_login_str = '2024-01-20'
            else:
                last_login_str = '2024-01-20'
            
            # Convert doctor_id (UUID) to numeric ID
            try:
                doctor_id_str = str(doctor_id).replace('-', '')
                numeric_id = int(doctor_id_str[:8], 16) if len(doctor_id_str) >= 8 else hash(doctor_id_str) % 1000000
            except:
                numeric_id = hash(str(doctor_id)) % 1000000
            
            therapists.append({
                'id': numeric_id,
                'doctor_id': str(doctor_id),
                'name': doctor.get('name') or f"Dr. {doctor.get('user_id', 'Unknown')}",
                'email': doctor_email,
                'role': doctor.get('occupation') or 'Therapist',
                'status': doctor.get('status') or 'active',
                'lastLogin': last_login_str,
                'totalPatients': active_patients,
                'patients': formatted_patients
            })
        
        return jsonify({
            'success': True,
            'therapists': therapists
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error fetching therapists: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'therapists': []
        }), 500

@app.route('/api/admin/stats', methods=['GET'])
def get_stats():
    """
    Get aggregated statistics for admin dashboard
    """
    try:
        doctors_data = supabase_query('doctors', select='*')
        patients_data = supabase_query('patients', select='*')
        
        total_therapists = len(doctors_data)
        total_patients = len(patients_data)
        
        return jsonify({
            'success': True,
            'stats': {
                'totalTherapists': total_therapists,
                'totalPatients': total_patients
            }
        }), 200
        
    except Exception as e:
        import traceback
        print(f"Error fetching stats: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    env = os.getenv('FLASK_ENV', 'production')
    
    # Development mode
    if env == 'development':
        print("Starting development server...")
        app.run(debug=True, host='0.0.0.0', port=port)
    # Production mode
    else:
        print("Starting production server with Waitress...")
        try:
            from waitress import serve
            serve(app, host='0.0.0.0', port=port)
        except ImportError:
            print("ERROR: Waitress not installed. Install with: pip install waitress")
            print("Falling back to development server...")
            app.run(host='0.0.0.0', port=port)