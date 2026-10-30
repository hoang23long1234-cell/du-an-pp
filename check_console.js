const { spawn } = require('child_process');
const http = require('http');

async function testConsole() {
  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9666',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  let target = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const data = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9666/json', res => {
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

  if (!target) {
    console.error('Could not connect to Chrome port 9666');
    chrome.kill();
    return;
  }

  console.log('Connected to Chrome target:', target.webSocketDebuggerUrl);
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

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Console.messageAdded') {
      console.log('[BROWSER CONSOLE]', msg.params.message.level, msg.params.message.text);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('[RUNTIME CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.log('[EXCEPTION THROWN]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
    }
  });

  await send('Console.enable');
  await send('Runtime.enable');
  await send('Page.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    mobile: true
  });

  console.log('Navigating to http://127.0.0.1:3000/index.html...');
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/index.html' });

  await new Promise(r => setTimeout(r, 3500));

  const evaluation = await send('Runtime.evaluate', {
    expression: `(() => {
      const catalogCount = document.querySelectorAll('#catalogProductContainer > div').length;
      const bento1 = document.querySelector('.md\\\\:col-span-7');
      const bento2 = document.querySelector('.md\\\\:col-span-5');
      return {
        catalogCount,
        hasBento1: !!bento1,
        bento1Display: bento1 ? window.getComputedStyle(bento1).display : 'none',
        hasBento2: !!bento2,
        bento2Display: bento2 ? window.getComputedStyle(bento2).display : 'none',
        docHeight: document.documentElement.scrollHeight
      };
    })()`,
    returnByValue: true
  });
  console.log('DOM Evaluation:', JSON.stringify(evaluation.result?.value, null, 2));

  ws.close();
  chrome.kill();
  process.exit(0);
}

testConsole().catch(console.error);
