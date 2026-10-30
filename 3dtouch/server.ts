import cors from 'cors';
import express from 'express';
import { ExpressPeerServer } from 'peer';
import { randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import https from 'node:https';
import QRCode from 'qrcode';

const app = express();
const port = Number(process.env.SV_TOUCH_PORT || process.env.PORT || 9000);
const tlsKeyPath = process.env.SV_TLS_KEY_PATH?.trim();
const tlsCertPath = process.env.SV_TLS_CERT_PATH?.trim();
const tlsPfxPath = process.env.SV_TLS_PFX_PATH?.trim();
if (Boolean(tlsKeyPath) !== Boolean(tlsCertPath)) {
  throw new Error('SV_TLS_KEY_PATH and SV_TLS_CERT_PATH must both be configured.');
}
if (tlsPfxPath && (tlsKeyPath || tlsCertPath)) {
  throw new Error('Configure either SV_TLS_PFX_PATH or both SV_TLS_KEY_PATH and SV_TLS_CERT_PATH, not both.');
}
const server = tlsPfxPath
  ? https.createServer({
    pfx: readFileSync(tlsPfxPath),
    passphrase: process.env.SV_TLS_PFX_PASSPHRASE,
  }, app)
  : tlsKeyPath && tlsCertPath
    ? https.createServer({ key: readFileSync(tlsKeyPath), cert: readFileSync(tlsCertPath) }, app)
  : http.createServer(app);
// Bắt lỗi cổng bị chiếm (EADDRINUSE) và lỗi listen khác — trước đây tiến trình
// crash với stack chữ nghĩa, giờ báo rõ cách xử lý rồi thoát sạch.
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[SlideVault Touch] Cổng ${port} đã bị tiến trình khác chiếm. Dùng SV_TOUCH_PORT=<cổng khác> (VD: SV_TOUCH_PORT=9001) hoặc tắt tiến trình đang giữ cổng ${port} rồi chạy lại.`);
  } else {
    console.error(`[SlideVault Touch] Không khởi động được server: ${error.message}`);
  }
  process.exit(1);
});
const serverProtocol = tlsPfxPath || (tlsKeyPath && tlsCertPath) ? 'https' : 'http';
const appDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = dirname(appDirectory);
const roomLifetimeMs = 30 * 60 * 1000;
const previewEnabled = process.env.SV_TOUCH_PREVIEW === '1';
const caCertPath = process.env.SV_TLS_CA_CERT_PATH?.trim();
const caCertData = caCertPath ? readFileSync(caCertPath) : null;

interface RoomState {
  stagePeerId: string;
  createdAt: number;
}

const activeRooms = new Map<string, RoomState>();
const apiAttempts = new Map<string, { count: number; resetAt: number }>();
const apiWindowMs = 5 * 60 * 1000;
const apiMaxAttempts = 20;

function limitApiAttempts(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const now = Date.now();
  const key = `${req.ip}:${req.path}`;
  const current = apiAttempts.get(key);
  if (!current || now >= current.resetAt) {
    if (apiAttempts.size > 5000) {
      for (const [entry, limit] of apiAttempts) {
        if (now >= limit.resetAt) apiAttempts.delete(entry);
      }
      if (apiAttempts.size > 5000) {
        const oldestEntry = apiAttempts.keys().next().value;
        if (oldestEntry) apiAttempts.delete(oldestEntry);
      }
    }
    apiAttempts.set(key, { count: 1, resetAt: now + apiWindowMs });
    next();
    return;
  }
  if (current.count >= apiMaxAttempts) {
    res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
    res.status(429).json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.' });
    return;
  }
  current.count += 1;
  next();
}

function getLanAddress(): string {
  const interfaces = Object.entries(networkInterfaces())
    .filter(([name]) => !/(virtual|vmware|hyper-v|virtualbox|wsl|loopback|vpn)/i.test(name))
    .sort(([left], [right]) => {
      const preferred = (name: string) => (/wi-?fi|wireless|ethernet/i.test(name) ? 0 : 1);
      return preferred(left) - preferred(right);
    });
  for (const [, entries] of interfaces) {
    const address = entries?.find((entry) => entry.family === 'IPv4' && !entry.internal);
    if (address) return address.address;
  }
  return 'localhost';
}

function getServerOrigin(req: express.Request): string {
  const configuredOrigin = process.env.SV_PUBLIC_URL?.trim().replace(/\/$/, '');
  if (configuredOrigin) return configuredOrigin;
  const portFromRequest = Number(req.get('host')?.split(':').pop());
  return `${req.protocol}://${getLanAddress()}:${portFromRequest || port}`;
}

app.use(cors());
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json({ limit: '32kb' }));
app.use('/3dtouch', express.static(appDirectory, {
  index: false,
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (/\.(?:html|js)$/i.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
  },
}));
app.use('/assets/peerjs', express.static(join(appDirectory, '..', 'node_modules', 'peerjs', 'dist'), { maxAge: '1d' }));
if (previewEnabled) {
  const uiAssetPrefix = '/tệp hệ thống/tailwind-shadcn/'.normalize('NFC');
  const uiAssetDirectory = join(projectDirectory, 'tệp hệ thống', 'tailwind-shadcn');
  app.get(['/', '/trangchudong.html'], (_req, res) => {
    res.sendFile(join(projectDirectory, 'trangchudong.html'));
  });
  app.get('/setting.html', (_req, res) => {
    res.sendFile(join(projectDirectory, 'setting.html'));
  });
  app.use('/font', express.static(join(projectDirectory, 'font'), { index: false, maxAge: '1h' }));
  app.use((req, _res, next) => {
    let decodedPath: string;
    try {
      decodedPath = decodeURIComponent(req.path).normalize('NFC');
    } catch {
      next();
      return;
    }
    if (!decodedPath.startsWith(uiAssetPrefix)) {
      next();
      return;
    }
    const assetPath = decodedPath.slice(uiAssetPrefix.length);
    if (assetPath.split('/').includes('..')) {
      next();
      return;
    }
    const queryIndex = req.url.indexOf('?');
    const query = queryIndex >= 0 ? req.url.slice(queryIndex) : '';
    req.url = `/ui-assets/${assetPath}${query}`;
    next();
  });
  app.use('/ui-assets', express.static(uiAssetDirectory, { index: false, maxAge: '1h' }));
  app.get('/pptxgen.bundle.js', (_req, res) => {
    res.sendFile(join(projectDirectory, 'pptxgen.bundle.js'));
  });
}

const peerServer = ExpressPeerServer(server, { allow_discovery: false, proxied: true });
app.use('/peerjs', peerServer);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'online', service: 'SlideVault Touch Coordinator', port });
});

app.get('/api/webrtc-config', (_req, res) => {
  const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ];
  const turnUrls = process.env.SV_TURN_URL?.split(',').map((url) => url.trim()).filter(Boolean);
  if (turnUrls?.length && process.env.SV_TURN_USERNAME && process.env.SV_TURN_CREDENTIAL) {
    iceServers.push({
      urls: turnUrls,
      username: process.env.SV_TURN_USERNAME,
      credential: process.env.SV_TURN_CREDENTIAL,
    });
  }
  res.json({ iceServers });
});

app.get('/api/qr', async (req, res) => {
  const text = typeof req.query.text === 'string' ? req.query.text : '';
  if (!text || text.length > 512) {
    res.status(400).json({ error: 'Nội dung mã QR không hợp lệ.' });
    return;
  }
  try {
    const image = await QRCode.toBuffer(text, { width: 196, margin: 1, errorCorrectionLevel: 'M' });
    res.type('png').send(image);
  } catch {
    res.status(500).json({ error: 'Không thể tạo mã QR.' });
  }
});

app.post('/api/create-room', limitApiAttempts, (req, res) => {
  const peerId = typeof req.body?.peerId === 'string' ? req.body.peerId.trim() : '';
  if (!peerId || peerId.length > 128) {
    res.status(400).json({ error: 'Peer ID không hợp lệ.' });
    return;
  }

  const now = Date.now();
  for (const [pin, room] of activeRooms) {
    if (now - room.createdAt > roomLifetimeMs) activeRooms.delete(pin);
  }

  let pin = '';
  do {
    pin = String(randomInt(1000, 10000));
  } while (activeRooms.has(pin));

  activeRooms.set(pin, { stagePeerId: peerId, createdAt: now });
  res.json({ pin, phoneUrl: `${getServerOrigin(req)}/3dtouch/phone.html?pin=${pin}` });
});

app.get('/api/resolve-pin/:pin', limitApiAttempts, (req, res) => {
  const pin = req.params.pin;
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    res.status(400).json({ error: 'Mã kết nối không hợp lệ.' });
    return;
  }
  const room = activeRooms.get(pin);
  if (!room || Date.now() - room.createdAt > roomLifetimeMs) {
    activeRooms.delete(pin);
    res.status(404).json({ error: 'Mã kết nối không tồn tại hoặc đã hết hạn.' });
    return;
  }
  res.json({ stagePeerId: room.stagePeerId });
});

interface ShareRelayEntry {
  name: string;
  size: number;
  type: string;
  buffer: Buffer | null;
  createdAt: number;
}

// ============================================================================
// Nâng cấp v2 (04/2026): Relay chia sẻ file — fallback khi P2P bị chặn
// Bộ nhớ đệm trong RAM, TTL 30 phút, tối đa 50MB/file; không lưu đĩa.
// ============================================================================
const shareRelayStore = new Map<string, ShareRelayEntry>();
const SHARE_RELAY_TTL_MS = 30 * 60 * 1000;
const SHARE_RELAY_MAX_BYTES = 50 * 1024 * 1024;

function sweepShareRelay(): void {
  const now = Date.now();
  for (const [id, entry] of shareRelayStore) {
    if (now - entry.createdAt > SHARE_RELAY_TTL_MS) shareRelayStore.delete(id);
  }
}
// Quét định kỳ: trước đây chỉ quét khi có POST mới, nếu không ai gửi nữa
// các bản ghi hết hạn nằm lì trong RAM cho tới lần POST kế tiếp.
const relaySweepTimer = setInterval(sweepShareRelay, 60 * 1000);
relaySweepTimer.unref?.();

app.post('/api/share/relay', (req, res) => {
  sweepShareRelay();
  const { name, size, type } = (req.body || {}) as { name?: string; size?: number; type?: string };
  if (!name || !Number.isFinite(size) || (size as number) <= 0 || (size as number) > SHARE_RELAY_MAX_BYTES) {
    res.status(400).json({ error: 'Thông tin file không hợp lệ (tối đa 50MB).' });
    return;
  }
  const id = `shr-${randomInt(100000, 1000000)}-${Date.now().toString(36)}`;
  shareRelayStore.set(id, {
    name: String(name).slice(0, 180),
    size: Number(size),
    type: typeof type === 'string' ? type.slice(0, 120) : 'application/octet-stream',
    buffer: null,
    createdAt: Date.now(),
  });
  res.json({
    id,
    uploadUrl: `/api/share/relay/${id}`,
    downloadUrl: `/api/share/relay/${id}/download`,
    expiresAt: Date.now() + SHARE_RELAY_TTL_MS,
  });
});

app.put('/api/share/relay/:id', express.raw({ type: '*/*', limit: '52mb' }), (req, res) => {
  sweepShareRelay();
  const entry = shareRelayStore.get(String(req.params.id));
  if (!entry) {
    res.status(404).json({ error: 'Phiên chia sẻ không tồn tại hoặc đã hết hạn.' });
    return;
  }
  const body = req.body as Buffer;
  if (!Buffer.isBuffer(body) || body.length === 0) {
    res.status(400).json({ error: 'Nội dung file rỗng.' });
    return;
  }
  // Đối chiếu số byte thực với khai báo lúc tạo — lệch nghĩa là file gửi bị hỏng,
  // nhận vào sẽ tạo file hỏng nên báo lỗi ngay để bên gửi thử lại.
  if (body.length !== entry.size) {
    res.status(400).json({
      error: `Số byte không khớp khai báo (nhận ${body.length}, khai báo ${entry.size}).`,
      received: body.length,
      declared: entry.size,
    });
    return;
  }
  if (entry.buffer) {
    res.status(409).json({ error: 'Phiên này đã có dữ liệu; hãy tạo phiên mới để gửi lại.' });
    return;
  }
  entry.buffer = body;
  res.json({ ok: true, bytes: body.length });
});

app.get('/api/share/relay/:id/meta', (req, res) => {
  const entry = shareRelayStore.get(String(req.params.id));
  if (!entry) {
    res.status(404).json({ error: 'Không tìm thấy.' });
    return;
  }
  res.json({ name: entry.name, size: entry.size, type: entry.type, ready: Boolean(entry.buffer), createdAt: entry.createdAt });
});

app.get('/api/share/relay/:id/download', (req, res) => {
  const entry = shareRelayStore.get(String(req.params.id));
  if (!entry?.buffer) {
    res.status(404).send('Phiên chia sẻ không tồn tại hoặc chưa có dữ liệu.');
    return;
  }
  res.setHeader('Content-Type', entry.type);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(entry.name)}`);
  res.send(entry.buffer);
  // Giải phóng bộ nhớ sau khi tải xong (một lần dùng)
  setTimeout(() => shareRelayStore.delete(String(req.params.id)), 5000);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[SlideVault Touch] Server chạy tại ${serverProtocol}://0.0.0.0:${port}`);
});


if (tlsPfxPath && caCertPath) {
  const certificateApp = express();
  certificateApp.get('/touch-ca.cer', (_req, res) => {
    res.type('application/x-x509-ca-cert');
    res.attachment('slidevault-touch-lan-ca.cer').send(caCertData);
  });
  http.createServer(certificateApp).listen(
    Number(process.env.SV_TLS_HELPER_PORT || 9001),
    '0.0.0.0',
    () => console.log(`[SlideVault Touch] Tải chứng chỉ CA tại http://0.0.0.0:${process.env.SV_TLS_HELPER_PORT || 9001}/touch-ca.cer`),
  );
}
