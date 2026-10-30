/* ============================================================================
 * SlideVault GestureShare — Chia sẻ kiểu Huawei "đưa tay là xong"
 * ----------------------------------------------------------------------------
 * • Nắm tay (grab) trên thẻ file/folder/slide → file dính vào tay
 * • Xòe-đẩy/ném (air-drop) hoặc chạm chip thiết bị → truyền sang máy khác
 * • Hỗ trợ: folder (nhiều file), PowerPoint, ảnh, mọi loại file — chuyển P2P
 *   qua PeerJS datachannel; có kênh dự phòng qua relay của server
 * • Thiết bị: phone ↔ laptop ↔ tablet ↔ pc (miễn là có kết nối chung PIN/QR)
 * • Hoạt động cả khi KHÔNG có camera: kéo-thả cổ điển + nút "Gửi" dự phòng
 * ----------------------------------------------------------------------------
 *   const share = SlideVaultShare.create({ name: 'Laptop của Nam' });
 *   share.attachPeer(peerConnection);        // kênh PeerJS datachannel
 *   share.addTargets(['phone', 'tablet']);   // lọc loại thiết bị hiển thị
 *   share.on('progress', fn); share.on('received', fn);
 * ========================================================================== */
(() => {
  'use strict';
  if (window.SlideVaultShare) return;

  const PROTO = {
    HELLO: 'SV_SHARE_HELLO',
    TARGETS: 'SV_SHARE_TARGETS',
    GRAB: 'SV_SHARE_GRAB',
    ACCEPT: 'SV_SHARE_ACCEPT',
    REJECT: 'SV_SHARE_REJECT',
    CHUNK: 'SV_SHARE_CHUNK',
    DONE: 'SV_SHARE_DONE',
    PROGRESS: 'SV_SHARE_PROGRESS',
    CANCEL: 'SV_SHARE_CANCEL',
  };
  const CHUNK_SIZE = 16 * 1024; // 16KB/chunk — an toàn cho mọi datachannel
  const HEARTBEAT_MS = 3000;
  const PRESENCE_TTL_MS = 10000;

  const uid = () => `sv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const fmtBytes = (n) => {
    if (!Number.isFinite(n)) return '?';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = n;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
    return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
  };
  const safeName = (name) => String(name || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 180);

  function detectKind() {
    const ua = navigator.userAgent || '';
    const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    const isPhone = !isTablet && /Mobi|iPhone|Android/i.test(ua);
    if (isPhone) return 'phone';
    if (isTablet) return 'tablet';
    return /Macintosh|Windows|Linux|CrOS/i.test(ua) ? 'pc' : 'laptop';
  }
  const KIND_LABEL = { phone: 'Điện thoại', tablet: 'Máy tính bảng', laptop: 'Laptop', pc: 'PC' };

  /* ------------------------------------------------------------------ *
   * DeviceRegistry — nhận diện thiết bị cùng phiên (cross-tab + P2P)
   * ------------------------------------------------------------------ */
  class DeviceRegistry {
    constructor() {
      this.id = uid();
      this.kind = detectKind();
      this.name = `${KIND_LABEL[this.kind]} ${this.id.slice(-4)}`;
      this.devices = new Map();
      this.channel = null;
      try {
        this.channel = new BroadcastChannel('slidevault-share');
        this.channel.onmessage = (event) => this.receive(event.data);
      } catch { this.channel = null; }
      this._beat = setInterval(() => this.beat(), HEARTBEAT_MS);
      this.beat();
    }

    setIdentity({ name }) { if (name) this.name = String(name).slice(0, 60); this.beat(); }

    beat() {
      this.purge();
      this.post({ t: PROTO.HELLO, id: this.id, kind: this.kind, name: this.name, at: Date.now() });
    }

    receive(message) {
      if (!message || message.t !== PROTO.HELLO || message.id === this.id) return;
      this.devices.set(message.id, {
        id: message.id, kind: message.kind, name: message.name, lastSeen: Date.now(),
      });
    }

    purge() {
      const now = Date.now();
      for (const [id, device] of this.devices) {
        if (now - device.lastSeen > PRESENCE_TTL_MS) this.devices.delete(id);
      }
    }

    post(message) { try { this.channel?.postMessage(message); } catch { /* kênh đóng */ } }

    list() { this.purge(); return [...this.devices.values()]; }

    dispose() {
      clearInterval(this._beat);
      this.channel?.close();
      this.channel = null;
    }
  }

  /* ------------------------------------------------------------------ *
   * FilePicker — chọn file hoặc cả folder (ưu tiên File System API)
   * ------------------------------------------------------------------ */
  async function pickFiles({ folder = false, multiple = true } = {}) {
    const results = [];
    const pushFile = (file, relPath = '') => results.push({ file, name: file.name, relPath, size: file.size, type: file.type });
    try {
      if (folder && window.showDirectoryPicker) {
        const dir = await window.showDirectoryPicker({ mode: 'read' });
        const walk = async (handle, prefix) => {
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              pushFile(file, `${prefix}${handle.name}/${file.name}`);
            } else if (entry.kind === 'directory') {
              await walk(entry, `${prefix}${handle.name}/`);
            }
          }
        };
        await walk(dir, '');
        return results;
      }
      if (!folder && window.showOpenFilePicker) {
        const handles = await window.showOpenFilePicker({ multiple });
        for (const handle of handles) pushFile(await handle.getFile());
        return results;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return [];
    }
    // Fallback: input file (hỗ trợ webkitdirectory cho folder)
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = multiple;
      if (folder) { input.webkitdirectory = true; input.directory = true; }
      input.style.display = 'none';
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        for (const file of input.files || []) pushFile(file, file.webkitRelativePath || '');
        input.remove();
        resolve(results);
      }, { once: true });
      input.addEventListener('cancel', () => { input.remove(); resolve([]); }, { once: true });
      input.click();
    });
  }

  /* ------------------------------------------------------------------ *
   * FileTransfer — gửi/nhận file theo chunk qua datachannel
   * ------------------------------------------------------------------ */
  class FileTransfer {
    constructor({ conn, onProgress = () => {}, onComplete = () => {}, onError = () => {} } = {}) {
      this.conn = conn;
      this.onProgress = onProgress;
      this.onComplete = onComplete;
      this.onError = onError;
      this.incoming = new Map(); // transferId -> {meta, chunks, received}
    }

    /**
     * Số byte đang xếp hàng trong datachannel.
     * Ưu tiên dataChannel thật; fallback các tên khác của PeerJS/RTCPeerConnection.
     */
    _buffered() {
      const conn = this.conn;
      if (!conn) return 0;
      const candidates = [conn.dataChannel, conn._dc, conn._peerDataChannel, conn];
      for (const c of candidates) {
        const value = c && c.bufferedAmount;
        if (Number.isFinite(value)) return value;
      }
      return 0;
    }

    /** Gửi 1 file; trả về Promise khi xong (đã bơm đủ chunk). */
    async sendFile({ file, name, relPath = '', transferId = uid() }) {
      const meta = {
        transferId,
        name: safeName(name || file.name),
        relPath,
        size: file.size,
        type: file.type || 'application/octet-stream',
        chunks: Math.max(1, Math.ceil(file.size / CHUNK_SIZE)),
      };
      this.conn.send({ t: PROTO.GRAB, ...meta });
      let sent = 0;
      for (let index = 0; index < meta.chunks; index += 1) {
        const start = index * CHUNK_SIZE;
        const buffer = await file.slice(start, start + CHUNK_SIZE).arrayBuffer();
        const payload = new Uint8Array(buffer);
        // Chờ buffer rỗng để tránh tràn datachannel (backpressure).
        // PeerJS không public `bufferedAmount` trên DataConnection, nên đọc
        // trực tiếp dataChannel (biến này trước đây luôn undefined → không chờ).
        while (this._buffered() > 4 * 1024 * 1024) {
          await new Promise((resolve) => setTimeout(resolve, 16));
          if (!this.conn) throw new Error('Mất kết nối khi đang gửi file.');
        }
        this.conn.send({ t: PROTO.CHUNK, transferId, index, total: meta.chunks, data: payload });
        sent += 1;
        this.onProgress({ transferId, name: meta.name, sentBytes: Math.min(file.size, sent * CHUNK_SIZE), totalBytes: file.size, progress: sent / meta.chunks });
      }
      this.conn.send({ t: PROTO.DONE, transferId });
      this.onComplete({ transferId, name: meta.name });
      return meta;
    }

    /** Xử lý message nhận vào — trả true nếu message thuộc luồng file. */
    handleMessage(message) {
      if (!message || typeof message.t !== 'string' || !message.t.startsWith('SV_SHARE_')) return false;
      if (message.t === PROTO.GRAB) {
        // Chặn giá trị hỏng/huge từ đầu gửi: new Array(-1) hay new Array(1e9)
        // sẽ throw RangeError hoặc ăn hết RAM.
        const total = Math.floor(Number(message.chunks));
        if (!Number.isFinite(total) || total < 1 || total > 4_000_000) {
          this.onError({
            transferId: message.transferId,
            name: String(message.name || 'file'),
            error: new Error(`Thông báo GRAB không hợp lệ (chunks=${message.chunks}).`),
          });
          return true;
        }
        this.incoming.set(message.transferId, {
          meta: { ...message, chunks: total },
          chunks: new Array(total),
          received: 0,
          bytes: 0,
        });
        return true;
      }
      if (message.t === PROTO.CHUNK) {
        const entry = this.incoming.get(message.transferId);
        if (!entry) return true;
        const index = Math.floor(Number(message.index));
        if (!Number.isFinite(index) || index < 0 || index >= entry.chunks.length) return true;
        const chunk = message.data instanceof Uint8Array ? message.data : new Uint8Array(message.data || []);
        if (!entry.chunks[index]) {
          entry.chunks[index] = chunk;
          entry.received += 1;
          entry.bytes += chunk.byteLength;
        }
        this.onProgress({
          transferId: message.transferId,
          name: entry.meta.name,
          sentBytes: entry.bytes,
          totalBytes: entry.meta.size,
          progress: entry.received / Math.max(1, entry.meta.chunks),
        });
        return true;
      }
      if (message.t === PROTO.DONE) {
        const entry = this.incoming.get(message.transferId);
        if (!entry) return true;
        this.incoming.delete(message.transferId);
        // Kiểm tra tính toàn vẹn TRƯỚC khi ghép: mảng chunk có lỗ thủng sẽ
        // sinh file hỏng (Blob biến undefined thành chuỗi "undefined").
        const expectedChunks = Math.max(1, Number(entry.meta.chunks) || 0);
        const missing = [];
        for (let index = 0; index < expectedChunks; index += 1) {
          if (!(entry.chunks[index] instanceof Uint8Array)) missing.push(index);
        }
        const receivedBytes = entry.chunks.reduce((sum, chunk) => sum + (chunk?.byteLength || 0), 0);
        if (missing.length) {
          this.onError({
            transferId: message.transferId,
            name: entry.meta.name,
            error: new Error(`Thiếu ${missing.length}/${expectedChunks} chunk (đầu tiên là #${missing[0]}); file chưa hoàn chỉnh.`),
            partial: true,
          });
          return true;
        }
        const declaredSize = Number(entry.meta.size);
        if (Number.isFinite(declaredSize) && declaredSize >= 0 && receivedBytes !== declaredSize) {
          this.onError({
            transferId: message.transferId,
            name: entry.meta.name,
            error: new Error(`Số byte nhận ${receivedBytes} khác khai báo ${declaredSize}; file có thể hỏng.`),
            partial: true,
          });
          return true;
        }
        try {
          const blob = new Blob(entry.chunks, { type: entry.meta.type });
          this.onComplete({ transferId: message.transferId, name: entry.meta.name, blob, meta: entry.meta });
        } catch (error) {
          this.onError({ transferId: message.transferId, error });
        }
        return true;
      }
      if (message.t === PROTO.CANCEL) {
        this.incoming.delete(message.transferId);
        return true;
      }
      return true;
    }
  }

  /* ------------------------------------------------------------------ *
   * ShareSession — bộ điều phối "đưa tay là xong"
   * ------------------------------------------------------------------ */
  class ShareSession {
    constructor({ name, autoDownload = true } = {}) {
      this.registry = new DeviceRegistry();
      if (name) this.registry.setIdentity({ name });
      this.autoDownload = autoDownload;
      this.peers = new Map(); // peerId -> { conn, transfer, meta }
      this.listeners = new Map();
      this.held = [];          // file đang "dính" vào tay (grab)
      this.received = [];      // file đã nhận
    }

    on(type, fn) {
      if (!this.listeners.has(type)) this.listeners.set(type, new Set());
      this.listeners.get(type).add(fn);
      return () => this.off(type, fn);
    }
    off(type, fn) { this.listeners.get(type)?.delete(fn); }
    emit(type, payload) {
      for (const fn of this.listeners.get(type) || []) {
        try { fn(payload); } catch { /* listener lỗi không phá luồng */ }
      }
    }

    /** Gắn một kết nối PeerJS datachannel (từ phòng PIN hiện có). */
    attachPeer(conn, meta = {}) {
      const peerId = meta.peerId || `peer-${uid()}`;
      const transfer = new FileTransfer({
        conn,
        onProgress: (info) => this.emit('progress', info),
        onComplete: (info) => {
          if (info.blob) this.handleReceived(info);
          else this.emit('sent', info);
        },
        onError: (info) => this.emit('error', info),
      });
      this.peers.set(peerId, { conn, transfer, meta });
      conn.on('data', (message) => this.routeMessage(peerId, message));
      conn.on('close', () => {
        this.peers.delete(peerId);
        this.emit('peer-left', { peerId });
      });
      try {
        conn.send({
          t: PROTO.HELLO,
          id: this.registry.id,
          kind: this.registry.kind,
          name: this.registry.name,
        });
        this.emit('peer-joined', { peerId, meta });
      } catch { /* conn có thể chưa mở */ }
      return peerId;
    }

    routeMessage(peerId, message) {
      const peer = this.peers.get(peerId);
      if (!peer) return;
      if (peer.transfer.handleMessage(message)) return;
      if (message?.t === PROTO.HELLO) {
        peer.meta = { ...peer.meta, ...message };
        this.emit('peer-hello', { peerId, device: message });
      } else if (message?.t === PROTO.PROGRESS) {
        this.emit('peer-progress', { peerId, ...message });
      }
    }

    /** Danh sách thiết bị khả dụng = cross-tab + các peer đang kết nối. */
    devices() {
      const local = this.registry.list();
      const remote = [...this.peers.entries()].map(([peerId, peer]) => ({
        id: peerId, kind: peer.meta?.kind || 'pc', name: peer.meta?.name || peerId, lastSeen: Date.now(),
      }));
      return [...local, ...remote];
    }

    /** Bắt đầu "cầm" file bằng cử chỉ hoặc UI. */
    grabBegin(items) {
      this.held = items.filter(Boolean);
      this.emit('held', { items: this.held, count: this.held.length });
    }

    /** Thả file: nếu chỉ định thiết bị thì gửi thẳng, không thì gửi peer đầu tiên. */
    async grabDrop(targetId) {
      if (!this.held.length) return;
      const items = this.held.slice();
      this.held = [];
      this.emit('dropped', { count: items.length, targetId: targetId || null });
      const target = targetId && this.peers.has(targetId)
        ? targetId
        : [...this.peers.keys()][0];
      if (!target) {
        this.emit('no-peer', { items });
        for (const item of items) {
          try {
            await this.relayUpload(item);
          } catch (e) {}
        }
        return;
      }
      await this.sendFilesTo(target, items);
    }

    async sendFilesTo(peerId, items) {
      const peer = this.peers.get(peerId);
      if (!peer) { this.emit('no-peer', { items }); return; }
      for (const item of items) {
        this.emit('sending', { name: item.name, size: item.size });
        await peer.transfer.sendFile(item);
      }
      this.emit('all-sent', { count: items.length, peerId });
    }

    /** Nhận file: tạo URL, tự tải xuống nếu bật, phát sự kiện cho UI. */
    handleReceived({ meta, blob }) {
      const item = {
        name: meta.name,
        size: meta.size,
        type: meta.type,
        blob,
        url: URL.createObjectURL(blob),
        receivedAt: Date.now(),
      };
      this.received.unshift(item);
      if ('vibrate' in navigator) navigator.vibrate([40, 30, 60]);
      this.emit('received', item);
      if (this.autoDownload) this.download(item);
    }

    download(item) {
      const link = document.createElement('a');
      link.href = item.url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    /** Dự phòng khi không có P2P: đẩy file lên relay server, trả link chia sẻ. */
    async relayUpload(item, apiBase = '') {
      const meta = await fetch(`${apiBase}/api/share/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, size: item.size, type: item.type }),
      }).then((r) => r.json());
      if (!meta?.id) throw new Error('Relay không khả dụng.');
      await fetch(`${apiBase}/api/share/relay/${meta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': item.type || 'application/octet-stream' },
        body: item.blob || item.file,
      });
      const link = `${apiBase}/api/share/relay/${meta.id}/download`;
      this.emit('relay-link', { name: item.name, link });
      return link;
    }

    dispose() {
      this.registry.dispose();
      for (const { conn } of this.peers.values()) { try { conn.close(); } catch { /* đã đóng */ } }
      this.peers.clear();
    }
  }

  /* ------------------------------------------------------------------ *
   * flyTo — hiệu ứng "file bay" từ nguồn tới đích (WAAPI, không lib)
   * ------------------------------------------------------------------ */
  async function flyTo(sourceEl, targetEl, { label = '📎', duration = 780 } = {}) {
    if (!sourceEl || !targetEl || typeof sourceEl.animate !== 'function') return;
    const from = sourceEl.getBoundingClientRect();
    const to = targetEl.getBoundingClientRect();
    const chip = document.createElement('div');
    chip.className = 'sv-fly-chip';
    chip.textContent = label;
    chip.style.cssText = `position:fixed;z-index:100000;left:${from.left}px;top:${from.top}px;width:${Math.max(44, Math.min(96, from.width))}px;height:${Math.max(44, Math.min(96, from.height))}px;display:grid;place-items:center;font-size:22px;border-radius:16px;pointer-events:none;color:#0a1410;background:linear-gradient(145deg,#b7f36b,#7de0b1);box-shadow:0 10px 40px rgba(183,243,107,.55),0 2px 10px rgba(0,0,0,.4);`;
    document.body.appendChild(chip);
    const dx = to.left + to.width / 2 - (from.left + Math.max(44, Math.min(96, from.width)) / 2);
    const dy = to.top + to.height / 2 - (from.top + Math.max(44, Math.min(96, from.height)) / 2);
    const animation = chip.animate([
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 90}px) scale(1.22) rotate(14deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px,${dy}px) scale(.28) rotate(28deg)`, opacity: 0.85 },
    ], { duration, easing: 'cubic-bezier(.22,.9,.3,1)' });
    try { await animation.finished; } catch { /* tab bị ẩn giữa chừng */ }
    chip.remove();
    targetEl.animate?.([
      { transform: 'scale(1)' },
      { transform: 'scale(1.18)' },
      { transform: 'scale(1)' },
    ], { duration: 360, easing: 'ease-out' });
  }

  function pulse(el, color = 'rgba(183,243,107,.5)') {
    if (!el || typeof el.animate !== 'function') return;
    el.animate([
      { boxShadow: `0 0 0 0 ${color}` },
      { boxShadow: `0 0 0 18px rgba(0,0,0,0)` },
    ], { duration: 620, easing: 'ease-out' });
  }

  window.SlideVaultShare = Object.assign(window.SlideVaultShare || {}, {
    version: 1,
    PROTO,
    CHUNK_SIZE,
    uid,
    fmtBytes,
    safeName,
    detectKind,
    KIND_LABEL,
    DeviceRegistry,
    pickFiles,
    FileTransfer,
    ShareSession,
    flyTo,
    pulse,
  });
})();



