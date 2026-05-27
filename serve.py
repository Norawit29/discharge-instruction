#!/usr/bin/env python3
"""Dev server: reads OPENAI_API_KEY from .env and serves it as /config.js.
Also provides /store (POST) to save discharge data and /d/<id> (GET) to serve it."""
import os, http.server, socketserver, json, socket, threading, uuid

# Load .env
try:
    with open(os.path.join(os.path.dirname(__file__), '.env')) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())
except FileNotFoundError:
    pass

API_KEY = os.environ.get('OPENAI_API_KEY', '')

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

PORT = 8765
LOCAL_IP = get_local_ip()
CONFIG_JS = (
    f'window.OPENAI_API_KEY = {repr(API_KEY)};\n'
    f'window.LOCAL_IP = {repr(LOCAL_IP)};\n'
    f'window.LOCAL_PORT = {PORT};\n'
).encode()

discharge_store = {}
store_lock = threading.Lock()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path == '/store':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(length)
                data = json.loads(body.decode('utf-8'))
                did = uuid.uuid4().hex[:8]
                with store_lock:
                    discharge_store[did] = data
                url = f'http://{LOCAL_IP}:{PORT}/d/{did}'
                resp = json.dumps({'id': did, 'url': url}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', len(resp))
                self._cors()
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(e).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path in ('/config.js', '/config.js?'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.send_header('Content-Length', len(CONFIG_JS))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(CONFIG_JS)
        elif self.path.startswith('/d/') and len(self.path) > 3:
            did = self.path[3:].split('?')[0].split('#')[0]
            with store_lock:
                data = discharge_store.get(did)
            if data is not None:
                try:
                    with open(os.path.join(BASE_DIR, 'patient.html'), 'rb') as f:
                        html = f.read().decode('utf-8')
                    inject = f'<script>window.__DISCHARGE__ = {json.dumps(data, ensure_ascii=False)};</script>'
                    html = html.replace('</head>', inject + '\n</head>', 1)
                    body = html.encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                    self.send_header('Content-Length', len(body))
                    self.send_header('Cache-Control', 'no-store')
                    self.end_headers()
                    self.wfile.write(body)
                except Exception as e:
                    self.send_response(500)
                    self.end_headers()
                    self.wfile.write(str(e).encode())
            else:
                msg = '<html><body style="font-family:sans-serif;padding:40px;text-align:center"><h2>ไม่พบข้อมูล</h2><p>ลิงก์นี้อาจหมดอายุแล้ว</p></body></html>'.encode('utf-8')
                self.send_response(404)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Content-Length', len(msg))
                self.end_headers()
                self.wfile.write(msg)
        else:
            super().do_GET()

    def log_message(self, fmt, *args):
        pass  # quiet

os.chdir(BASE_DIR)
with socketserver.TCPServer(('', PORT), Handler) as httpd:
    httpd.allow_reuse_address = True
    print(f'http://localhost:{PORT}/  (LAN: http://{LOCAL_IP}:{PORT}/)')
    httpd.serve_forever()
