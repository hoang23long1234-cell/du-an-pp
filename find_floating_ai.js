const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const matches = [];
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('floatingQuickCamAi') || l.includes('AI') || l.includes('quickCam') || l.includes('dialog')) {
    if (l.length < 120 && (l.includes('id=') || l.includes('class='))) {
      matches.push(`L${i+1}: ${l.trim()}`);
    }
  }
});

console.log('Matches in index.html:');
matches.slice(0, 25).forEach(m => console.log(' ', m));
