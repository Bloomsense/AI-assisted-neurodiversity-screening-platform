"""
Vercel serverless function for Flask AdminDashboard API
"""
import sys
import os
import json

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

try:
    from AdminDashboard import app
    
    def handler(request):
        """
        Vercel serverless function handler for Flask app
        """
        # Get path and remove /api prefix if present
        path = request.path
        if path.startswith('/api/'):
            path = path[4:] if len(path) > 4 else '/'
        
        # Build WSGI environ
        environ = {
            'REQUEST_METHOD': request.method,
            'PATH_INFO': path,
            'QUERY_STRING': request.query_string or '',
            'CONTENT_TYPE': request.headers.get('Content-Type', ''),
            'CONTENT_LENGTH': str(len(request.body or b'')),
            'wsgi.version': (1, 0),
            'wsgi.url_scheme': 'https',
            'wsgi.input': None,
            'wsgi.errors': sys.stderr,
            'wsgi.multithread': False,
            'wsgi.multiprocess': True,
            'wsgi.run_once': False,
            'SERVER_NAME': request.headers.get('Host', ''),
            'SERVER_PORT': '443',
        }
        
        # Add all headers
        for key, value in request.headers.items():
            header_key = f'HTTP_{key.upper().replace("-", "_")}'
            environ[header_key] = value
        
        # Response storage
        status_code = [200]
        response_headers = []
        
        def start_response(status, headers):
            status_code[0] = int(status.split()[0])
            response_headers.extend(headers)
        
        # Call Flask app
        result = app(environ, start_response)
        body = b''.join(result) if result else b''
        
        # Return in Vercel format
        return {
            'statusCode': status_code[0],
            'headers': dict(response_headers),
            'body': body.decode('utf-8')
        }
        
except Exception as e:
    import traceback
    error_trace = traceback.format_exc()
    print(f"Error initializing Flask app: {e}")
    print(error_trace)
    
    # Fallback handler
    def handler(request):
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Server initialization error',
                'message': str(e),
                'trace': error_trace
            })
        }
