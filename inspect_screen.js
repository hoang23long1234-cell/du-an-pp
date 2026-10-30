const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9555;

async function run() {
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  let connected = false;
  let attempts = 0;
  let pageTarget = null;

  while (!connected && attempts < 25) {
    attempts++;
    await new Promise(r => setTimeout(r, 200));
    try {
      const data = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${DEBUG_PORT}/json`, res => {
          let buf = '';
          res.on('data', c => buf += c);
          res.on('end', () => resolve(buf));
        }).on('error', reject);
      });
      const targets = JSON.parse(data);
      pageTarget = targets.find(t => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) connected = true;
    } catch(e) {}
  }

  if (!connected) {
    console.error('Failed to connect to Chrome');
    chrome.kill();
    return;
  }

  console.log('Connected to Chrome. WebSocket:', pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise(resolve => ws.onopen = resolve);

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const reqId = id++;
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

  // Set iPhone 15 Pro viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    mobile: true
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });

  console.log('Navigating to http://127.0.0.1:3000/index.html...');
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/index.html' });
  await new Promise(r => setTimeout(r, 2000));

  // Take screenshot at scroll 0
  const snap0 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\admin\\.gemini\\antigravity\\brain\\0921c725-7f46-4040-842b-c3e9f208154e\\debug_snap_0.png', Buffer.from(snap0.data, 'base64'));
  console.log('Saved debug_snap_0.png');

  // Scroll down to 800px (around the Bento/Catalog area)
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 800)' });
  await new Promise(r => setTimeout(r, 800));

  const snap800 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\admin\\.gemini\\antigravity\\brain\\0921c725-7f46-4040-842b-c3e9f208154e\\debug_snap_800.png', Buffer.from(snap800.data, 'base64'));
  console.log('Saved debug_snap_800.png');

  // Scroll down to 1400px
  await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 1400)' });
  await new Promise(r => setTimeout(r, 800));

  const snap1400 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\admin\\.gemini\\antigravity\\brain\\0921c725-7f46-4040-842b-c3e9f208154e\\debug_snap_1400.png', Buffer.from(snap1400.data, 'base64'));
  console.log('Saved debug_snap_1400.png');

  // Inspect DOM elements between y=600 and y=1600
  const inspectData = await send('Runtime.evaluate', {
    expression: `(() => {
      const results = [];
      const els = document.querySelectorAll('*');
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;
        if (bg.includes('255, 255, 255') || bg === 'rgb(255, 255, 255)' || bg === '#ffffff' || bg === 'white') {
          results.push({
            tag: el.tagName,
            id: el.id,
            className: (el.className || '').toString().slice(0, 50),
            rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) },
            bg
          });
        }
      }
      return {
        whiteElements: results.slice(0, 20),
        bodyBg: window.getComputedStyle(document.body).backgroundColor,
        htmlBg: window.getComputedStyle(document.documentElement).backgroundColor,
        docScrollHeight: document.documentElement.scrollHeight
      };
    })()`,
    returnByValue: true
  });

  console.log('Inspect data:', JSON.stringify(inspectData.result.value, null, 2));

  ws.close();
  chrome.kill();
}

run().catch(console.error);
