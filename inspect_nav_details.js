const fs = require('fs');

const files = [
  'phoimau.html',
  'vanban.html',
  'vebieudonhanh.html',
  'setting.html',
  'security.html',
  'trinhchieuchiase.html',
  'thuvienmau.html',
  'vault.html'
];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  console.log('='.repeat(60));
  console.log(`FILE: ${file}`);
  const navMatch = content.match(/<nav[^>]*class=["'][^"']*mobile-glass-nav[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  if (navMatch) {
    console.log(navMatch[0]);
  } else {
    console.log('NO mobile-glass-nav found!');
  }
}
