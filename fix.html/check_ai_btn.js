const fs = require('fs');
const content = fs.readFileSync('AI.html', 'utf8');
const lines = content.split('\n');
const found = [];
lines.forEach((l, i) => {
  if (l.includes('layoutBtn_timeline') || l.includes('layoutBtn_')) {
    found.push(`${i+1}: ${l}`);
  }
});
fs.writeFileSync('fix.html/ai_overflow_check.txt', found.join('\n'));
console.log('Found', found.length, 'lines');
