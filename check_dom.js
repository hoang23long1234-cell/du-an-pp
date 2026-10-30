const { spawn } = require('child_process');
const http = require('http');

async function testDOM() {
  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9667',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  let target = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const data = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9667/json', res => {
          let buf = '';
          res.on('data', c => buf += c);
          res.on('end', () => resolve(buf));
        }).on('error', reject);
      });
      const targets = JSON.parse(data);
      target = targets.find(t => t.type === 'page');
      if (target && target.webSocketDebuggerUrl) break;
    } catch(e) {}
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const reqId = msgId++;
      function onMsg(evt) {
        const msg = JSON.parse(evt.data);
        if (msg.id === reqId) {
          ws.removeEventListener('message', onMsg);
          resolve(msg.result);
        }
      }
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true });

  await send('Page.navigate', { url: 'http://127.0.0.1:3000/index.html' });
  await new Promise(r => setTimeout(r, 3000));

  const domDump = await send('Runtime.evaluate', {
    expression: `(() => {
      const main = document.querySelector('main');
      const sections = Array.from(document.querySelectorAll('section')).map(s => ({
        id: s.id,
        className: (s.className || '').slice(0, 40),
        childrenCount: s.children.length,
        rect: s.getBoundingClientRect()
      }));
      return {
        hasMain: !!main,
        mainHTML: main ? main.innerHTML.slice(0, 500) : 'NO MAIN',
        sections
      };
    })()`,
    returnByValue: true
  });

  console.log('DOM Dump:', JSON.stringify(domDump.result?.value, null, 2));

  ws.close();
  chrome.kill();
  process.exit(0);
}

testDOM().catch(console.error);
