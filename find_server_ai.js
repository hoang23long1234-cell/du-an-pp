const fs = require('fs');
const code = fs.readFileSync('fix.html/server.js', 'utf8');

const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes("app.post('/api/ai") || l.includes('app.get(\'/api/ai') || l.includes('ai-chat')) {
    console.log(`L${i+1}: ${l.trim()}`);
  }
});
