const fs = require('fs');
const server = fs.readFileSync('fix.html/server.js', 'utf8');

console.log('Has /api/ai-chat:', server.includes("'/api/ai-chat'"));
