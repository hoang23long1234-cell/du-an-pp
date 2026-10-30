(() => {
  const pinInput = document.getElementById('room-pin');
  const connectButton = document.getElementById('connect-room');
  const status = document.getElementById('connection-status');
  const surface = document.getElementById('touch-surface');
  const webcamButton = document.getElementById('start-webcam');
  const webcamStatus = document.getElementById('camera-status');
  const cameraPreview = document.getElementById('camera-preview');
  const cameraPreviewWrap = document.getElementById('camera-preview-wrap');
  const trackingBox = document.getElementById('tracking-box');
  const trackingLabel = document.getElementById('tracking-label');
  const crosshair = document.getElementById('pad-crosshair');
  const toggleTypingButton = document.getElementById('toggle-typing');
  const typeForm = document.getElementById('type-form');
  const remoteText = document.getElementById('remote-text');
  const targetMode = document.getElementById('target-mode');
  const trackingStatus = document.getElementById('tracking-status');
  const remoteActionButtons = [...document.querySelectorAll('.remote-actions button')];
  const queryPin = new URLSearchParams(location.search).get('pin');
  const apiBase = location.origin;
  let peer;
  let connection;
  let pointerFrame = 0;
  let pendingPointer = null;
  let gestureStart = null;
  let cameraStream = null;
  let cameraCall = null;
  let stagePeerId = null;
  let cursorPoint = { x: 0.5, y: 0.5 };

  if (queryPin) {
    pinInput.value = queryPin.replace(/\D/g, '').slice(0, 4);
    setTimeout(connect, 350);
  }

  function setCameraStatus(message) {
    webcamStatus.textContent = message;
  }

  function stopWebcam(message = 'Webcam đã tắt.') {
    cameraCall?.close();
    cameraCall = null;
    cameraStream?.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    cameraPreview.srcObject = null;
    cameraPreview.dataset.active = 'false';
    cameraPreviewWrap.hidden = true;
    trackingBox.dataset.active = 'false';
    trackingStatus.textContent = 'Webcam tắt; mục tiêu không còn được theo dõi.';
    webcamButton.textContent = 'Bật webcam';
    webcamButton.disabled = !connection?.open;
    setCameraStatus(message);
  }

  function setStatus(message, connected = false) {
    status.textContent = message;
    status.dataset.connected = String(connected);
    connectButton.disabled = connected;
    surface.dataset.connected = String(connected);
    webcamButton.disabled = !connected;
    remoteActionButtons.forEach((button) => { button.disabled = false; });
    toggleTypingButton.disabled = false;
    if (!connected && cameraStream) stopWebcam('Mất kết nối; webcam đã tắt.');
  }
  setStatus('Sẵn sàng điều khiển Wi-Fi LAN · Nhập PIN để bật webcam P2P.', true);

  let lastLanSend = 0;
  function send(payload) {
    if (connection?.open) {
      try { connection.send(payload); } catch (e) {}
    }
    const now = performance.now();
    if (payload.type === 'pointer') {
      if (now - lastLanSend < 24) return;
      lastLanSend = now;
    }
    try {
      fetch(`${apiBase}/api/3dtouch/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: payload.type === 'click' || payload.type === 'swipe' || payload.type === 'next_slide' || payload.type === 'prev_slide'
      }).catch(() => {});
    } catch (e) {}
  }

  async function connect() {
    const pin = pinInput.value.trim();
    if (!/^\d{4}$/.test(pin)) {
      setStatus('Nhập mã 4 số trên màn hình máy tính.');
      return;
    }

    connectButton.disabled = true;
    setStatus('Đang tìm máy tính...');
    try {
      const response = await fetch(`${apiBase}/api/resolve-pin/${pin}`);
      const room = await response.json();
      if (!response.ok) throw new Error(room.error || 'Không tìm thấy mã kết nối.');
      stagePeerId = room.stagePeerId;

      const health = await fetch(`${apiBase}/api/webrtc-config`).then((result) => result.json());
      const peerPort = location.port ? Number(location.port) : (location.protocol === 'https:' ? 443 : 80);
      peer = new Peer(undefined, {
        host: location.hostname,
        port: peerPort,
        path: '/peerjs',
        secure: location.protocol === 'https:',
        config: { iceServers: health.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }] },
      });

      peer.on('open', () => {
        connection = peer.connect(room.stagePeerId, { reliable: true });
        connection.on('open', () => {
          setStatus('Đã kết nối. Chạm hoặc vuốt vùng điều khiển.', true);
          setCameraStatus('Sẵn sàng bật webcam.');
          send({ type: 'target-mode', mode: targetMode.value });
          if (navigator.vibrate) navigator.vibrate(50);
        });
        connection.on('data', (message) => {
          if (message?.type !== 'tracking' || typeof message.status !== 'string') return;
          trackingStatus.textContent = message.status.slice(0, 120);
          const box = message.bbox;
          if (Array.isArray(box) && box.length === 4
            && box.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)
            && box[2] > 0 && box[3] > 0) {
            trackingBox.style.left = `${box[0] * 100}%`;
            trackingBox.style.top = `${box[1] * 100}%`;
            trackingBox.style.width = `${Math.min(box[2], 1 - box[0]) * 100}%`;
            trackingBox.style.height = `${Math.min(box[3], 1 - box[1]) * 100}%`;
            trackingLabel.textContent = typeof message.label === 'string' ? message.label.slice(0, 32) : 'Mục tiêu';
            trackingBox.dataset.stale = String(Boolean(message.stale));
            trackingBox.dataset.active = 'true';
          } else {
            trackingBox.dataset.active = 'false';
          }
        });
        connection.on('close', () => {
          setStatus('Mất kết nối. Hãy quét mã hoặc nhập PIN lại.');
          stopWebcam('Mất kết nối; webcam đã tắt.');
        });
        connection.on('error', () => setStatus('Lỗi kết nối dữ liệu. Hãy thử kết nối lại.'));
      });
      peer.on('error', (error) => setStatus(`Không thể kết nối: ${error.message}`));
    } catch (error) {
      setStatus(error.message || 'Không kết nối được tới server.');
      connectButton.disabled = false;
    }
  }

  async function toggleWebcam() {
    if (cameraStream) {
      stopWebcam();
      return;
    }
    if (!connection?.open || !peer?.open) {
      setCameraStatus('Hãy kết nối với máy tính trước.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('Trình duyệt cần HTTPS hoặc localhost để mở camera.');
      return;
    }

    webcamButton.disabled = true;
    setCameraStatus('Đang xin quyền camera...');
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 },
          frameRate: { ideal: 24, max: 30 },
        },
      });
      cameraPreview.srcObject = cameraStream;
      cameraPreview.dataset.active = 'true';
      cameraPreviewWrap.hidden = false;
      await cameraPreview.play();
      cameraCall = peer.call(stagePeerId, cameraStream, { metadata: { kind: '3dtouch-webcam' } });
      if (!cameraCall) throw new Error('Không thể gửi webcam tới máy tính.');
      cameraCall.on('close', () => {
        if (cameraStream) stopWebcam('Máy tính đã ngắt webcam.');
      });
      cameraCall.on('error', () => stopWebcam('Không truyền được webcam; hãy thử kết nối lại.'));
      cameraStream.getTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (cameraStream) stopWebcam('Quyền camera đã kết thúc.');
        }, { once: true });
      });
      webcamButton.textContent = 'Tắt webcam';
      webcamButton.disabled = false;
      setCameraStatus('Đang truyền webcam P2P tới máy tính.');
    } catch (error) {
      stopWebcam(error.name === 'NotAllowedError'
        ? 'Bạn chưa cấp quyền camera. Hãy cấp quyền rồi thử lại.'
        : `Không bật được webcam: ${error.message}`);
    }
  }

  function normalizePoint(event) {
    const bounds = surface.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  }

  function onPointerDown(event) {
    event.preventDefault();
    if (event.isTrusted && surface.setPointerCapture) {
      try { surface.setPointerCapture(event.pointerId); } catch (e) {}
    }
    const point = normalizePoint(event);
    gestureStart = { ...point, clientX: event.clientX, clientY: event.clientY, startedAt: performance.now() };
    cursorPoint = point;
    crosshair.style.left = `${point.x * 100}%`;
    crosshair.style.top = `${point.y * 100}%`;
    crosshair.dataset.visible = 'true';
    pendingPointer = { type: 'pointer', ...point };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(flushPointer);
  }

  function onPointerMove(event) {
    if (!gestureStart) return;
    const point = normalizePoint(event);
    cursorPoint = point;
    crosshair.style.left = `${point.x * 100}%`;
    crosshair.style.top = `${point.y * 100}%`;
    pendingPointer = { type: 'pointer', ...point };
    if (!pointerFrame) pointerFrame = requestAnimationFrame(flushPointer);
  }

  function flushPointer() {
    pointerFrame = 0;
    if (pendingPointer) send(pendingPointer);
    pendingPointer = null;
  }

  function onPointerUp(event) {
    if (!gestureStart) return;
    const point = normalizePoint(event);
    const deltaX = event.clientX - gestureStart.clientX;
    const deltaY = event.clientY - gestureStart.clientY;
    const distance = Math.hypot(deltaX, deltaY);
    const duration = performance.now() - gestureStart.startedAt;
    const threshold = Math.max(48, Math.min(surface.clientWidth, surface.clientHeight) * 0.12);
    cursorPoint = point;

    send({ type: 'pointer', ...point });
    if (distance < 12) {
      send({ type: 'click', ...point });
      if (navigator.vibrate) navigator.vibrate(20);
    } else if (distance >= threshold && duration < 450) {
      const direction = Math.abs(deltaX) > Math.abs(deltaY)
        ? (deltaX < 0 ? 'left' : 'right')
        : (deltaY < 0 ? 'up' : 'down');
      send({ type: 'swipe', direction, ...point });
      if (navigator.vibrate) navigator.vibrate(35);
    }
    gestureStart = null;
  }

  connectButton.addEventListener('click', connect);
  webcamButton.addEventListener('click', toggleWebcam);
  document.getElementById('click-current').addEventListener('click', () => {
    send({ type: 'click', ...cursorPoint });
    if (navigator.vibrate) navigator.vibrate(20);
  });
  document.getElementById('scroll-up').addEventListener('click', () => {
    send({ type: 'swipe', direction: 'up', ...cursorPoint });
  });
  document.getElementById('scroll-down').addEventListener('click', () => {
    send({ type: 'swipe', direction: 'down', ...cursorPoint });
  });
  toggleTypingButton.addEventListener('click', () => {
    const expanded = toggleTypingButton.getAttribute('aria-expanded') !== 'true';
    toggleTypingButton.setAttribute('aria-expanded', String(expanded));
    toggleTypingButton.textContent = expanded ? 'Đóng nhập' : 'Nhập văn bản';
    typeForm.hidden = !expanded;
    if (expanded) remoteText.focus();
  });
  targetMode.addEventListener('change', () => {
    if (!connection?.open) {
      trackingStatus.textContent = 'Kết nối máy tính để áp dụng mục tiêu AI.';
      return;
    }
    send({ type: 'target-mode', mode: targetMode.value });
    trackingStatus.textContent = targetMode.value === 'hand'
      ? 'Đang ưu tiên bám tay để điều khiển cử chỉ.'
      : 'Đang yêu cầu AI khóa mục tiêu; bật webcam để bắt đầu.';
  });
  typeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = remoteText.value;
    if (!text || text.length > 500) return;
    send({ type: 'text', text, ...cursorPoint });
    remoteText.value = '';
    remoteText.blur();
    setStatus('Đã gửi văn bản tới ô đang chọn trên web.', true);
  });
  pinInput.addEventListener('input', () => {
    pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 4);
  });
  surface.addEventListener('pointerdown', onPointerDown);
  surface.addEventListener('pointermove', onPointerMove);
  surface.addEventListener('pointerup', onPointerUp);
  surface.addEventListener('pointercancel', () => { gestureStart = null; });
  window.addEventListener('pagehide', () => {
    stopWebcam('Trang đã đóng.');
    peer?.destroy();
  });
})();
