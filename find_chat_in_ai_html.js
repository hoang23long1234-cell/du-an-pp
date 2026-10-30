const fs = require('fs');
const html = fs.readFileSync('AI.html', 'utf8');

const matches = [];
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('id="') || l.includes('chat') || l.includes('submit') || l.includes('input')) {
    if (l.length < 120) matches.push(`L${i+1}: ${l.trim()}`);
  }
});

console.log('Matches in AI.html:', matches.slice(0, 30));
