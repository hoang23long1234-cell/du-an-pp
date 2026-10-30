const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('tệp hệ thống/tailwind-shadcn/shadcn.js', 'utf8');
try {
  new vm.Script(code);
  console.log('SUCCESS: shadcn.js compiles cleanly without syntax error!');
  process.exit(0);
} catch (e) {
  console.error('SYNTAX ERROR IN shadcn.js:', e);
  process.exit(1);
}
