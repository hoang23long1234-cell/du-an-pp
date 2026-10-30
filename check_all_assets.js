const fs = require('fs');
const http = require('http');
const https = require('https');

const html = fs.readFileSync('index.html', 'utf8');

// Find all script src, link href, img src
const scriptSrcs = (html.match(/<script[^>]+src=["']([^"']+)["']/g) || []).map(s => s.match(/src=["']([^"']+)["']/)[1]);
const linkHrefs = (html.match(/<link[^>]+href=["']([^"']+)["']/g) || []).map(s => s.match(/href=["']([^"']+)["']/)[1]);
const imgSrcs = (html.match(/<img[^>]+src=["']([^"']+)["']/g) || []).map(s => s.match(/src=["']([^"']+)["']/)[1]);

console.log('Scripts:', scriptSrcs);
console.log('Links:', linkHrefs);
console.log('Images count:', imgSrcs.length);

async function checkAsset(url) {
  return new Promise(resolve => {
    const isHttps = url.startsWith('https://');
    const fullUrl = url.startsWith('http') ? url : `http://127.0.0.1:3000/${url.replace(/^\//, '')}`;
    const client = fullUrl.startsWith('https://') ? https : http;
    const start = Date.now();

    const req = client.get(fullUrl, { timeout: 4000 }, res => {
      const duration = Date.now() - start;
      resolve({ url, status: res.statusCode, duration, ok: res.statusCode >= 200 && res.statusCode < 400 });
      res.resume();
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT', duration: 4000, ok: false });
    });

    req.on('error', err => {
      resolve({ url, status: err.message, duration: Date.now() - start, ok: false });
    });
  });
}

(async () => {
  const allUrls = [...new Set([...scriptSrcs, ...linkHrefs])];
  console.log('\nChecking all scripts and links...');
  for (const u of allUrls) {
    const res = await checkAsset(u);
    console.log(`[${res.ok ? 'OK' : 'FAIL'}] ${u} -> status: ${res.status} (${res.duration}ms)`);
  }
})();
