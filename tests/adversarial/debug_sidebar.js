const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const HTTP_PORT = 9888;
const CHROME_DEBUG_PORT = 9335;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function startHttpServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
        let filePath = path.join(PROJECT_ROOT, decodedUrl === '/' ? 'index.html' : decodedUrl);
        if (!fs.existsSync(filePath)) {
          res.writeHead(404);
          return res.end('404');
        }
        if (fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fs.readFileSync(filePath));
      } catch (e) {
        res.writeHead(500);
        res.end(e.message);
      }
    });
    server.listen(HTTP_PORT, '127.0.0.1', () => resolve(server));
  });
}

function launchChrome() {
  return new Promise((resolve, reject) => {
    const chromeProc = spawn(CHROME_PATH, [
      '--headless=new',
      `--remote-debugging-port=${CHROME_DEBUG_PORT}`,
      '--disable-gpu',
      '--no-sandbox',
      'about:blank'
    ]);
    let attempts = 0;
    function check() {
      attempts++;
      http.get(`http://127.0.0.1:${CHROME_DEBUG_PORT}/json`, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const targets = JSON.parse(d);
            const pt = targets.find(t => t.type === 'page');
            if (pt) return resolve({ chromeProc, pt });
          } catch(e) {}
          if (attempts < 30) setTimeout(check, 200);
          else reject(new Error('no target'));
        });
      }).on('error', () => {
        if (attempts < 30) setTimeout(check, 200);
        else reject(new Error('timeout'));
      });
    }
    setTimeout(check, 500);
  });
}

async function debug() {
  const server = await startHttpServer();
  const { chromeProc, pt } = await launchChrome();
  const ws = new WebSocket(pt.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let msgId = 1;
  const callbacks = new Map();
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg.result);
      callbacks.delete(msg.id);
    }
  };
  function send(method, params = {}) {
    return new Promise(res => {
      const id = msgId++;
      callbacks.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: `http://127.0.0.1:${HTTP_PORT}/index.html` });
  await new Promise(r => setTimeout(r, 2000));

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const sb = document.querySelector('#saasAppSidebar, .saas-sidebar');
      const closeBtn = sb ? sb.querySelector('[data-sidebar-close]') : null;
      const toggleBtn = document.querySelector('[data-sidebar-toggle]');
      return {
        href: location.href,
        title: document.title,
        hasSidebar: !!sb,
        sidebarTagName: sb ? sb.tagName : null,
        sidebarId: sb ? sb.id : null,
        sidebarClasses: sb ? sb.className : null,
        sidebarDisplay: sb ? window.getComputedStyle(sb).display : null,
        sidebarVisibility: sb ? window.getComputedStyle(sb).visibility : null,
        hasCloseBtn: !!closeBtn,
        closeBtnRect: closeBtn ? closeBtn.getBoundingClientRect() : null,
        hasToggleBtn: !!toggleBtn,
        toggleBtnRect: toggleBtn ? toggleBtn.getBoundingClientRect() : null
      };
    })()`,
    returnByValue: true
  });

  console.log('DEBUG RESULT:', JSON.stringify(res.result?.value, null, 2));

  ws.close();
  chromeProc.kill();
  server.close();
}

debug().catch(console.error);
