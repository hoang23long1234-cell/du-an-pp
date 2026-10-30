const { spawn } = require('child_process');
const http = require('http');

async function test() {
  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9691',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  let target = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const data = await new Promise((res, rej) => {
        http.get('http://127.0.0.1:9691/json', r => {
          let buf = '';
          r.on('data', c => buf += c);
          r.on('end', () => res(buf));
        }).on('error', rej);
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

  console.log('=== MOBILE AUDIT (393x852) ===');
  await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/index.html' });
  await new Promise(r => setTimeout(r, 2500));

  const mobileRes = await send('Runtime.evaluate', {
    expression: `(() => {
      function info(sel) {
        const el = document.querySelector(sel);
        if (!el) return { sel, exists: false };
        const s = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          sel,
          exists: true,
          display: s.display,
          position: s.position,
          overflow: s.overflow,
          overflowY: s.overflowY,
          height: s.height,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), width: Math.round(r.width) }
        };
      }
      return {
        html: info('html'),
        body: info('body'),
        wrapper: info('.saas-layout-wrapper'),
        mainStage: info('.saas-main-stage'),
        mainCard: info('.saas-main-card'),
        catalog: info('section#catalog'),
        catalogCardsCount: document.querySelectorAll('#catalogProductContainer > div').length,
        sidebar: info('#saasAppSidebar'),
        sidebarBtn: info('[data-sidebar-open]'),
        windowInnerHeight: window.innerHeight,
        bodyScrollHeight: document.body.scrollHeight,
        docElScrollHeight: document.documentElement.scrollHeight
      };
    })()`,
    returnByValue: true
  });
  console.log('MOBILE RESULT:\n', JSON.stringify(mobileRes, null, 2));

  console.log('=== DESKTOP AUDIT (1440x900) ===');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:3000/index.html' });
  await new Promise(r => setTimeout(r, 2500));

  const desktopRes = await send('Runtime.evaluate', {
    expression: `(() => {
      function info(sel) {
        const el = document.querySelector(sel);
        if (!el) return { sel, exists: false };
        const s = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          sel,
          exists: true,
          display: s.display,
          position: s.position,
          overflow: s.overflow,
          overflowY: s.overflowY,
          height: s.height,
          rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), width: Math.round(r.width) }
        };
      }
      return {
        sidebar: info('#saasAppSidebar'),
        mainStage: info('.saas-main-stage'),
        catalogCardsCount: document.querySelectorAll('#catalogProductContainer > div').length,
        hasHorizontalScroll: document.body.scrollWidth > window.innerWidth
      };
    })()`,
    returnByValue: true
  });
  console.log('DESKTOP RESULT:\n', JSON.stringify(desktopRes, null, 2));

  ws.close();
  chrome.kill();
  process.exit(0);
}

test().catch(console.error);
