import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qsl
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
REMOTE_API_URL = "https://script.google.com/macros/s/AKfycbzqqw5QNFUcbVpz9xW1wKPqfXTHFRrdYIXgR9-UBJofEa1YJXV5sgk5m8qZfvg5ghUU/exec"


class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api"):
            self._proxy_request()
            return

        self._serve_static()

    def do_POST(self):
        if self.path.startswith("/api"):
            self._proxy_request()
            return

        self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.end_headers()

    def _proxy_request(self):
        parsed = urlparse(self.path)
        target_url = REMOTE_API_URL

        if parsed.query:
            target_url = target_url + "?" + parsed.query

        body = None
        headers = {}

        if self.command == "POST":
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length) if length > 0 else b""
            content_type = self.headers.get("Content-Type")
            if content_type:
                headers["Content-Type"] = content_type
            headers["Accept"] = self.headers.get("Accept", "application/json")

        request = Request(target_url, data=body, headers=headers, method=self.command)

        try:
            with urlopen(request) as response:
                payload = response.read()
                status = response.getcode()
                self.send_response(status)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")

                content_type = response.headers.get("Content-Type", "application/json")
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except HTTPError as error:
            payload = error.read()
            self.send_response(error.code)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
            self.send_header("Content-Type", error.headers.get("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except URLError as error:
            self.send_response(502)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(str(error).encode("utf-8"))

    def _serve_static(self):
        path = self.path.split("?", 1)[0]

        if path in ("", "/"):
            path = "/index.html"

        normalized_path = path.lstrip("/")
        if normalized_path == "":
            normalized_path = "index.html"

        file_path = os.path.abspath(os.path.join(ROOT_DIR, normalized_path))

        if not file_path.startswith(ROOT_DIR + os.sep) and file_path != ROOT_DIR:
            self.send_error(403)
            return

        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            self.send_error(404)
            return

        with open(file_path, "rb") as handler:
            content = handler.read()

        mime_type = "text/html"
        if file_path.endswith(".css"):
            mime_type = "text/css"
        elif file_path.endswith(".js"):
            mime_type = "application/javascript"
        elif file_path.endswith(".json"):
            mime_type = "application/json"
        elif file_path.endswith(".png"):
            mime_type = "image/png"
        elif file_path.endswith(".jpg") or file_path.endswith(".jpeg"):
            mime_type = "image/jpeg"

        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    host = "127.0.0.1"
    port = 8000
    server = ThreadingHTTPServer((host, port), ProxyHandler)
    print(f"Servidor rodando em http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
