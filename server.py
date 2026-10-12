"""
server.py
=========
Lightweight Python HTTP Server for Telemedicine Web Application.
Serves the web application at http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run_server():
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("\n" + "=" * 80)
        print(f"  TELEMEDICINE AAL WEB APPLICATION SERVER RUNNING AT:")
        print(f"  http://localhost:{PORT}")
        print("=" * 80 + "\n")
        
        # Open in browser automatically if interactive
        try:
            webbrowser.open(f"http://localhost:{PORT}")
        except Exception:
            pass
            
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[!] Server stopped by user.")
            sys.exit(0)

if __name__ == "__main__":
    run_server()
