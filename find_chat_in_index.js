const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const matches = [];
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('ai-') || l.includes('chat') || l.includes('pipeline') || l.includes('transformers')) {
    matches.push(`L${i+1}: ${l.trim()}`);
  }
});

console.log('Matches in index.html:', matches.slice(0, 20));
