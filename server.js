/**
 * Family Tree — dev server
 * - Serves static files (index.html, style.css, app.js)
 * - Proxies Google Sheets CSV at GET /api/sheet?id=SHEET_ID
 *   (avoids CORS/null-origin issues when opening from file://)
 *
 * Usage:  node server.js
 * Then open:  http://localhost:3000
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { URL } = require('url');

const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
  '.xml':  'application/xml; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
};

// ── Redirect-following HTTPS GET ─────────────────────────────────────────────
function fetchFollow(urlStr, cb, hops = 8) {
  if (hops <= 0) return cb(new Error('Too many redirects'), null);

  const parsed = new URL(urlStr);
  const lib    = parsed.protocol === 'https:' ? https : http;

  const opts = {
    hostname: parsed.hostname,
    path:     parsed.pathname + parsed.search,
    headers:  { 'User-Agent': 'FamilyTree/1.0', 'Accept-Encoding': 'identity' },
  };

  lib.get(opts, (res) => {
    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
      res.resume(); // drain
      // Resolve relative redirects
      const next = new URL(res.headers.location, urlStr).href;
      fetchFollow(next, cb, hops - 1);
      return;
    }
    cb(null, res);
  }).on('error', (e) => cb(e, null));
}

// ── Request handler ───────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  // ── API: proxy Google Sheet CSV ────────────────────────────────────────────
  if (reqUrl.pathname === '/api/sheet') {
    const sheetId = reqUrl.searchParams.get('id');
    if (!sheetId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing ?id= parameter' }));
      return;
    }

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/export?format=csv&gid=0`;

    fetchFollow(sheetUrl, (err, sheetRes) => {
      if (err) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }

      if (sheetRes.statusCode !== 200) {
        res.writeHead(sheetRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Google Sheets returned ${sheetRes.statusCode}` }));
        return;
      }

      res.writeHead(200, {
        'Content-Type':                'text/csv; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control':               'no-cache',
      });
      sheetRes.pipe(res);
    });
    return;
  }

  // ── Static file server ─────────────────────────────────────────────────────
  let filePath = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
  filePath = path.join(__dirname, filePath);

  // Basic path traversal guard
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'text/plain; charset=utf-8';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🌳 Family Tree is running!\n`);
  console.log(`   Open → http://localhost:${PORT}\n`);
});
