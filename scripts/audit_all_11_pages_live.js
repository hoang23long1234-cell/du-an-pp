const { spawn } = require('child_process');
const http = require('http');

const pages = [
  'AI.html',
  'index.html',
  'trangchudong.html',
  'vault.html',
  'thuvienmau.html',
  'setting.html',
  'security.html',
  'phoimau.html',
  'vebieudonhanh.html',
  'trinhchieuchiase.html',
  'vanban.html'
];

async function runLiveAudit() {
  const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9994',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  let target = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const data = await new Promise((res, rej) => {
        http.get('http://127.0.0.1:9994/json', r => {
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

  if (!target) {
    console.error('Failed to attach to Chrome');
    chrome.kill();
    return;
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

  let consoleErrors = [];
  let exceptions = [];

  ws.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Console.messageAdded') {
      if (msg.params.message.level === 'error') {
        consoleErrors.push(msg.params.message.text);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description || ''));
    }
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  console.log('Auditing 11 HTML pages with headless Chrome...\n');

  for (const page of pages) {
    console.log(`\n=================== CHECKING: ${page} ===================`);
    consoleErrors = [];
    exceptions = [];

    // 1. Mobile check (393px)
    await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });

    let loadPromise = new Promise(resolve => {
      function onMsg(evt) {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'Page.loadEventFired') {
          ws.removeEventListener('message', onMsg);
          resolve();
        }
      }
      ws.addEventListener('message', onMsg);
    });

    await send('Page.navigate', { url: `http://127.0.0.1:3000/${page}` });
    await loadPromise;
    await new Promise(r => setTimeout(r, 600));

    const mobileDiag = await send('Runtime.evaluate', {
      expression: `(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        const overflow = scrollW > innerW;
        const dock = document.querySelector('.mobile-glass-nav');
        const dockStyle = dock ? window.getComputedStyle(dock) : null;
        const dockVisible = dockStyle ? (dockStyle.display !== 'none' && dockStyle.visibility !== 'hidden' && parseFloat(dockStyle.opacity || '1') > 0) : false;
        
        // Check elements exceeding innerW
        const overElements = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > innerW + 1) {
            overElements.push(el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).slice(0, 30) : '') + ' right=' + Math.round(rect.right));
          }
        });

        // Check broken images
        const brokenImages = Array.from(document.querySelectorAll('img')).filter(img => img.naturalWidth === 0 && img.getAttribute('src') && !img.getAttribute('src').startsWith('data:')).map(img => img.src);

        return {
          scrollW,
          innerW,
          overflow,
          overflowElementsCount: overElements.length,
          overSample: overElements.slice(0, 3),
          dockFound: !!dock,
          dockVisible,
          dockDisplay: dockStyle ? dockStyle.display : null,
          brokenImagesCount: brokenImages.length,
          brokenImages
        };
      })()`,
      returnByValue: true
    });

    console.log('Mobile (393px):', JSON.stringify(mobileDiag.result?.value, null, 2));

    // 2. Tablet check (820px)
    await send('Emulation.setDeviceMetricsOverride', { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true });
    await new Promise(r => setTimeout(r, 400));

    const tabletDiag = await send('Runtime.evaluate', {
      expression: `(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        const dock = document.querySelector('.mobile-glass-nav');
        const dockStyle = dock ? window.getComputedStyle(dock) : null;
        const dockVisible = dockStyle ? (dockStyle.display !== 'none' && dockStyle.visibility !== 'hidden' && parseFloat(dockStyle.opacity || '1') > 0) : false;
        const sidebar = document.querySelector('.saas-sidebar');
        const sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
        return {
          scrollW,
          innerW,
          overflow: scrollW > innerW,
          dockVisible,
          sidebarDisplay: sidebarStyle ? sidebarStyle.display : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Tablet (820px):', JSON.stringify(tabletDiag.result?.value, null, 2));

    // 3. Desktop check (1440px)
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 400));

    const desktopDiag = await send('Runtime.evaluate', {
      expression: `(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        const dock = document.querySelector('.mobile-glass-nav');
        const dockStyle = dock ? window.getComputedStyle(dock) : null;
        const dockVisible = dockStyle ? (dockStyle.display !== 'none' && dockStyle.visibility !== 'hidden' && parseFloat(dockStyle.opacity || '1') > 0) : false;
        const sidebar = document.querySelector('.saas-sidebar');
        const sidebarStyle = sidebar ? window.getComputedStyle(sidebar) : null;
        return {
          scrollW,
          innerW,
          overflow: scrollW > innerW,
          dockVisible,
          sidebarVisible: sidebarStyle ? sidebarStyle.display !== 'none' : false
        };
      })()`,
      returnByValue: true
    });
    console.log('Desktop (1440px):', JSON.stringify(desktopDiag.result?.value, null, 2));

    if (exceptions.length > 0) {
      console.log('  EXCEPTIONS:', exceptions);
    }
    if (consoleErrors.length > 0) {
      console.log('  CONSOLE ERRORS:', consoleErrors);
    }
  }

  ws.close();
  chrome.kill();
  console.log('\nLive audit complete.');
}

runLiveAudit().catch(console.error);
