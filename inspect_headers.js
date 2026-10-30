const fs = require('fs');
['vanban.html', 'vebieudonhanh.html', 'setting.html', 'security.html'].forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log('=== ' + f + ' ===');
  const m = content.match(/<header[^>]*class=["'][^"']*saas-topbar[^"']*["'][^>]*>([\s\S]*?)<\/header>/i);
  if (m) {
    const lines = m[0].split('\n').slice(0, 15);
    console.log(lines.join('\n'));
  }
});
