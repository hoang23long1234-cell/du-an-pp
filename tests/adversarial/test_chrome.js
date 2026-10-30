const { spawn } = require('child_process');
const http = require('http');

console.log('Testing Chrome launch capability...');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  '--disable-extensions',
  'about:blank'
]);

chromeProc.on('error', (err) => {
  console.error('Failed to spawn Chrome:', err);
  process.exit(1);
});

let attempts = 0;
function checkChrome() {
  attempts++;
  http.get('http://127.0.0.1:9222/json/version', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Chrome response received:', data);
      chromeProc.kill();
      process.exit(0);
    });
  }).on('error', (err) => {
    if (attempts < 20) {
      setTimeout(checkChrome, 250);
    } else {
      console.error('Chrome timeout:', err);
      chromeProc.kill();
      process.exit(1);
    }
  });
}

setTimeout(checkChrome, 500);
