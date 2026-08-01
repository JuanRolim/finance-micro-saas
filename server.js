const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const REMOTE_API_URL = 'https://script.google.com/macros/s/AKfycbzqqw5QNFUcbVpz9xW1wKPqfXTHFRrdYIXgR9-UBJofEa1YJXV5sgk5m8qZfvg5ghUU/exec';
const PORT = 8000;

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    default: return 'application/octet-stream';
  }
}

function sendJson(res, code, payload) {
  const content = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload), 'utf8');
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': content.length,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
  });
  res.end(content);
}

async function proxyRequest(req, res) {
  const incomingUrl = new URL(req.url, 'http://127.0.0.1');
  const targetUrl = new URL(REMOTE_API_URL);

  if (incomingUrl.search) {
    targetUrl.search = incomingUrl.search;
  }

  const headers = {};
  if (req.headers.accept) {
    headers.Accept = req.headers.accept;
  }

  let body;
  if (req.method === 'POST') {
    body = await new Promise((resolve) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });

    if (body.length > 0) {
      headers['Content-Length'] = body.length;
    }

    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }
  }

  try {
    const response = await fetch(targetUrl.href, {
      method: req.method,
      headers,
      body
    });

    const responseBody = Buffer.from(await response.arrayBuffer());
    res.writeHead(response.status, {
      'Content-Type': response.headers.get('content-type') || 'application/json; charset=utf-8',
      'Content-Length': responseBody.length,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    });
    res.end(responseBody);
  } catch (error) {
    sendJson(res, 502, { error: error.message });
  }
}

function serveStatic(req, res) {
  let filePath = req.url.split('?')[0];
  if (filePath === '/') filePath = '/index.html';
  const normalizedPath = filePath.replace(/^\//, '');
  const fullPath = path.join(ROOT_DIR, normalizedPath);

  if (!fullPath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (error, data) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': getMimeType(fullPath),
      'Content-Length': data.length,
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept'
      });
      res.end();
      return;
    }
    proxyRequest(req, res).catch((error) => {
      sendJson(res, 502, { error: error.message });
    });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    });
    res.end();
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor rodando em http://127.0.0.1:${PORT}`);
});
