const fs = require('fs');
const crypto = require('crypto');

const f1 = fs.readFileSync('index.html');
const f2 = fs.readFileSync('trangchudong.html');

const h1 = crypto.createHash('sha256').update(f1).digest('hex').toUpperCase();
const h2 = crypto.createHash('sha256').update(f2).digest('hex').toUpperCase();

console.log('index.html size:       ', f1.length, 'bytes');
console.log('trangchudong.html size:', f2.length, 'bytes');
console.log('index.html SHA-256:       ', h1);
console.log('trangchudong.html SHA-256:', h2);
console.log('Hash Match:            ', h1 === h2);
console.log('Byte-for-byte Equal:   ', f1.equals(f2));

if (!f1.equals(f2)) {
  console.error('FAIL: Files are not identical!');
  process.exit(1);
} else {
  console.log('SUCCESS: 100% Binary Parity Invariance Certified!');
  process.exit(0);
}
