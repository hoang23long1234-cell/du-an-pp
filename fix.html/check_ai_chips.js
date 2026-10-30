const fs = require('fs');
const content = fs.readFileSync('AI.html', 'utf8');
const lines = content.split('\n');
const res = [];
for (let i = 600; i < 730; i++) {
  if (lines[i]) res.push(`${i+1}: ${lines[i]}`);
}
fs.writeFileSync('fix.html/ai_chip_lines.txt', res.join('\n'));
console.log('Saved lines 601-730');
