const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  png: 'image/png',
  woff2: 'font/woff2',
  json: 'application/json',
};

const PORT = 4242;
const ROOT = __dirname;

http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/' || url === '') url = '/index.html';

  const filePath = path.join(ROOT, url);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).slice(1);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const notFound = path.join(ROOT, '404.html');
    res.writeHead(404, { 'Content-Type': 'text/html' });
    fs.createReadStream(notFound).pipe(res);
  }
}).listen(PORT, () => {
  console.log('Server läuft: http://localhost:' + PORT);
});
