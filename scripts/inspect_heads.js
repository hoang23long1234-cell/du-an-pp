const fs = require('fs');
const files = [
  'AI.html',
  'index.html',
  'trangchudong.html',
  'vault.html',
  'thuvienmau.html',
  'setting.html',
  'security.html',
  'phoimau.html',
  'vebieudonhanh.html',
  'trinhchieuchiase.html',
  'vanban.html'
];

files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  console.log('=== ' + f + ' ===');
  const head = c.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (head) {
    const metaViewport = head[1].match(/<meta[^>]*viewport[^>]*>/i);
    const title = head[1].match(/<title[^>]*>(.*?)<\/title>/i);
    const cssLinks = [...head[1].matchAll(/<link[^>]*rel=['"]stylesheet['"][^>]*>/gi)].map(m => m[0]);
    const fontLinks = [...head[1].matchAll(/<link[^>]*href=['"][^'"]*fonts[^'"]*['"][^>]*>/gi)].map(m => m[0]);
    const scripts = [...head[1].matchAll(/<script[^>]*src=['"][^'"]*['"][^>]*><\/script>/gi)].map(m => m[0]);
    console.log('Title:', title ? title[1].trim() : 'none');
    console.log('Viewport:', metaViewport ? metaViewport[0] : 'MISSING');
    console.log('Fonts:', fontLinks.length ? fontLinks.join(' | ') : 'none');
    console.log('CSS:', cssLinks.join(' | '));
    console.log('Scripts in head:', scripts.join(' | '));
  }
});
