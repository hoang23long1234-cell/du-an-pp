const fs = require('fs');
const content = fs.readFileSync('fix.html/server.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('redirect') || l.includes('trangchu') || l.includes('index.html') || l.includes('express.static')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
