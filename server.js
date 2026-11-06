#!/usr/bin/env node
// Outil Dys — mini-serveur LOCAL (aucune dépendance npm).
// - sert les fichiers de l'application (nécessaire pour PDF.js, qui utilise des modules ES)
// - expose /api/status et /api/ocr (utilise le programme « tesseract » installé sur l'ordinateur)
// Il n'écoute QUE sur 127.0.0.1 : rien n'est accessible depuis le réseau et rien ne sort.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const PORT = Number(process.env.PORT || 8765);
const ROOT = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};

function ocrStatus() {
  try {
    const v = spawnSync('tesseract', ['--version'], { encoding: 'utf8' });
    if (v.error || v.status !== 0) return { available: false, reason: "Le programme « tesseract » n'est pas installé sur cet ordinateur." };
    const l = spawnSync('tesseract', ['--list-langs'], { encoding: 'utf8' });
    const langs = (l.stdout || '').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('List'));
    const version = ((v.stdout || v.stderr || '').split('\n')[0] || '').trim();
    if (!langs.includes('fra')) return { available: false, version, langs, reason: "Tesseract est installé mais la langue française (fra) manque." };
    return { available: true, version, langs };
  } catch (e) { return { available: false, reason: String(e.message || e) }; }
}

function runOcr(buf, lang, psm) {
  return new Promise((resolve, reject) => {
    const args = ['stdin', 'stdout', '-l', lang || 'fra', '--psm', String(psm || 3), 'tsv'];
    const p = spawn('tesseract', args);
    let out = '', err = '';
    p.stdout.on('data', d => out += d);
    p.stderr.on('data', d => err += d);
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve(out) : reject(new Error(err || ('tesseract code ' + code))));
    p.stdin.on('error', () => {});
    p.stdin.end(buf);
  });
}

function parseTsv(tsv) {
  const rows = tsv.split('\n').slice(1).map(l => l.split('\t')).filter(c => c.length >= 12);
  const lines = new Map(); const words = [];
  for (const c of rows) {
    const level = +c[0]; if (level !== 5) continue;
    const conf = parseFloat(c[10]); const text = c.slice(11).join('\t').trim();
    if (!text) continue;
    const key = c[2] + '-' + c[3] + '-' + c[4];
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key).push(text);
    words.push({ text, conf, x: +c[6], y: +c[7], w: +c[8], h: +c[9] });
  }
  const text = [...lines.values()].map(a => a.join(' ')).join('\n');
  return { text, words, lowConf: words.filter(w => w.conf >= 0 && w.conf < 65).map(w => ({ text: w.text, conf: Math.round(w.conf) })) };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ server: true, ocr: ocrStatus() }));
  }
  if (url.pathname === '/api/ocr' && req.method === 'POST') {
    const chunks = []; let size = 0;
    req.on('data', d => { size += d.length; if (size > 40e6) { req.destroy(); } else chunks.push(d); });
    req.on('end', async () => {
      try {
        const out = await runOcr(Buffer.concat(chunks), url.searchParams.get('lang'), url.searchParams.get('psm'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(parseTsv(out)));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(e.message || e) }));
      }
    });
    return;
  }
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT) || file.includes(path.sep + '.')) { res.writeHead(403); return res.end('Interdit'); }
  serveStatic(file, req, res);
});

// Fichiers statiques : compression (gzip, ou brotli si le navigateur le gère) gardée en mémoire + ETag,
// pour que les gros fichiers de données (communes, structures) se chargent vite et ne soient pas retéléchargés pour rien.
const zlib = require('zlib');
const ZC = new Map(); // fichier -> { tag, raw, gz, br }
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.txt', '.md']);
function serveStatic(file, req, res) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Introuvable'); }
    const ext = path.extname(file).toLowerCase(); const tag = '"' + st.size.toString(36) + '-' + Math.floor(st.mtimeMs).toString(36) + '"';
    const hdr = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'ETag': tag, 'Cache-Control': ext === '.html' ? 'no-cache' : 'no-cache', 'Vary': 'Accept-Encoding' };
    if (req.headers['if-none-match'] === tag) { res.writeHead(304, hdr); return res.end(); }
    const send = e => {
      const ae = String(req.headers['accept-encoding'] || ''); let body = e.raw, enc = '';
      if (e.br && /\bbr\b/.test(ae)) { body = e.br; enc = 'br'; } else if (e.gz && /\bgzip\b/.test(ae)) { body = e.gz; enc = 'gzip'; }
      if (enc) hdr['Content-Encoding'] = enc; hdr['Content-Length'] = body.length; res.writeHead(200, hdr); res.end(req.method === 'HEAD' ? undefined : body);
    };
    const c = ZC.get(file); if (c && c.tag === tag) return send(c);
    fs.readFile(file, (err2, data) => {
      if (err2) { res.writeHead(404); return res.end('Introuvable'); }
      const e = { tag, raw: data, gz: null, br: null };
      if (COMPRESSIBLE.has(ext) && data.length > 1024) { try { e.gz = zlib.gzipSync(data, { level: 6 }); if (data.length > 200000) e.br = zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length } }); } catch (x) { /* envoi sans compression */ } }
      if (data.length < 8e6) ZC.set(file, e); send(e);
    });
  });
}

server.listen(PORT, '127.0.0.1', () => {
  console.log('Outil Dys est prêt : http://127.0.0.1:' + PORT);
  const s = ocrStatus();
  console.log('OCR : ' + (s.available ? 'disponible (' + s.version + ')' : 'indisponible — ' + s.reason));
});
