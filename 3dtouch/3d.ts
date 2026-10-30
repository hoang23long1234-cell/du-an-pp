// @ts-nocheck
/**
 * ============================================================================
 * SLIDEVAULT 3D TOUCH & SPATIAL ENGINE v7.0 (MAGNETIC SNAP & DUAL-HAND PRO)
 * ----------------------------------------------------------------------------
 * Nâng cấp toàn diện:
 *   • Magnetic Target Snapping: Tự động hút con trỏ vào nút bấm trong bán kính 46px.
 *   • Quantum Comet Trail: Hiệu ứng đuôi ánh sáng sao băng mượt mà theo con trỏ 60FPS.
 *   • Dual-Hand Pinch-to-Zoom: Nhận diện 2 bàn tay cùng lúc để phóng to/thu nhỏ.
 *   • Cyberpunk Sci-Fi HUD: Khung ngắm Radar, tia lực Pinch động & đồ thị FPS.
 *   • Vá triệt để lỗi NaN Math.acos(cosAngle) trong FingerPoseEstimator.
 * ============================================================================
 */
(() => {
  'use strict';

  const STATE = {
    active: false,
    mode: 'auto',
    cameraStream: null,
    inInference: false,
    lastPinchTime: 0,
    isPinching: false,
    isGrabbing: false,
    lastPointerX: 0.5,
    lastPointerY: 0.5,
    pipMinimized: false,
    fps: 0,
    fpsCounter: 0,
    lastFpsTime: performance.now(),
    magneticTarget: null,
    snappedX: null,
    snappedY: null,
    dualHandBaseDist: null,
    currentZoom: 1,
    trailPoints: []
  };

  const SlideVaultSpatial = window.SlideVaultSpatial = {
    start: (openController = false, autoCam = true) => startSpatialTouch(openController, autoCam),
    stop: () => stopSpatialTouch(),
    toggle: (autoCam = true) => STATE.active ? stopSpatialTouch() : startSpatialTouch(false, autoCam),
    isActive: () => STATE.active,
    toggleCamera: () => toggleCameraMode(),
    openCamera: () => {
      if (!STATE.active) startSpatialTouch(false, true);
      else if (!STATE.cameraStream) toggleCameraMode();
    },
    closeCamera: () => {
      if (STATE.cameraStream) toggleCameraMode();
    },
    openLab: () => openMotionLabDialog(),
    openAirShare: () => openAirShareDialog(),
    openTutorial: () => openTutorialDialog(),
    openPhone: () => openPhoneConnectModal(),
    connectPhone: () => openPhoneConnectModal(),
    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    },
    simulatePeek: (x, y) => {
      playSpatialSound('peek');
      triggerHaptic(18);
      const ring = document.getElementById('sv-force-indicator');
      if (ring) {
        ring.style.left = `${x || window.innerWidth / 2}px`;
        ring.style.top = `${y || window.innerHeight / 2}px`;
        ring.className = 'active peek';
      }
    },
    simulatePop: (x, y) => {
      const px = x || window.innerWidth / 2;
      const py = y || window.innerHeight / 2;
      playSpatialSound('pop');
      triggerHaptic([35, 45, 80]);
      spawnShockwaveBurst(px, py);
    },
    spawnBurst: (x, y) => spawnShockwaveBurst(x, y),
  };

  window.toggle3DTouchEngine = () => window.SlideVaultSpatial.toggle(true);

  let audioCtx = null;
  function playSpatialSound(type = 'click') {
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (!audioCtx || audioCtx.state === 'suspended') {
        audioCtx?.resume?.();
      }
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1040, now);
        osc.frequency.exponentialRampToValueAtTime(1620, now + 0.045);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
        osc.start(now);
        osc.stop(now + 0.055);
      } else if (type === 'snap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.025);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'peek') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
        osc.start(now);
        osc.stop(now + 0.10);
      } else if (type === 'pop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.12);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'grab') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'swipe') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.12);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      }
    } catch (e) {}
  }

  function triggerHaptic(duration = 18) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(duration); } catch (e) {}
    }
  }

  class OneEuroFilter {
    constructor({ minCutoff = 1.15, beta = 0.065, dCutoff = 1.0 } = {}) {
      this.minCutoff = minCutoff;
      this.beta = beta;
      this.dCutoff = dCutoff;
      this.x = null;
      this.dx = 0;
      this.t = null;
    }
    alpha(cutoff, dt) {
      const tau = 1 / (2 * Math.PI * Math.max(1e-6, cutoff));
      return 1 / (1 + tau / dt);
    }
    filter(value, timestamp) {
      if (!Number.isFinite(value)) return this.x ?? 0;
      if (this.t == null || this.x == null) {
        this.x = value;
        this.t = timestamp;
        return value;
      }
      const raw = (timestamp - this.t) / 1000;
      const dt = raw > 0 ? Math.min(Math.max(raw, 1 / 240), 1 / 3) : 1 / 60;
      const dValue = (value - this.x) / dt;
      const aD = this.alpha(this.dCutoff, dt);
      this.dx = aD * dValue + (1 - aD) * this.dx;
      const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
      const a = this.alpha(cutoff, dt);
      this.x = a * value + (1 - a) * this.x;
      this.t = timestamp;
      return this.x;
    }
    reset() { this.x = null; this.dx = 0; this.t = null; }
  }

  const pointerFilterX = new OneEuroFilter({ minCutoff: 1.05, beta: 0.075 });
  const pointerFilterY = new OneEuroFilter({ minCutoff: 1.05, beta: 0.075 });

  const Finger = { Thumb: 0, Index: 1, Middle: 2, Ring: 3, Pinky: 4, all: [0, 1, 2, 3, 4] };
  const FingerCurl = { NoCurl: 0, HalfCurl: 1, FullCurl: 2 };
  const FingerDirection = {
    VerticalUp: 0, VerticalDown: 1, HorizontalLeft: 2, HorizontalRight: 3,
    DiagonalUpRight: 4, DiagonalUpLeft: 5, DiagonalDownRight: 6, DiagonalDownLeft: 7
  };

  class FingerPoseEstimator {
    constructor() {
      this.NO_CURL_START_LIMIT = 130.0;
      this.HALF_CURL_START_LIMIT = 60.0;
      this.fingerJoints = [
        [[0, 1], [1, 2], [2, 3], [3, 4]],
        [[0, 5], [5, 6], [6, 7], [7, 8]],
        [[0, 9], [9, 10], [10, 11], [11, 12]],
        [[0, 13], [13, 14], [14, 15], [15, 16]],
        [[0, 17], [17, 18], [18, 19], [19, 20]]
      ];
    }

    estimate(landmarks) {
      if (!landmarks || landmarks.length < 21) return { curls: [], directions: [] };
      const curls = [];
      const directions = [];

      for (const finger of Finger.all) {
        const joints = this.fingerJoints[finger];
        const pStart = landmarks[joints[finger === Finger.Thumb ? 1 : 0][0]];
        const pMid = landmarks[joints[finger === Finger.Thumb ? 2 : 1][1]];
        const pEnd = landmarks[joints[3][1]];

        const dSM = Math.hypot(pStart.x - pMid.x, pStart.y - pMid.y, (pStart.z || 0) - (pMid.z || 0));
        const dSE = Math.hypot(pStart.x - pEnd.x, pStart.y - pEnd.y, (pStart.z || 0) - (pEnd.z || 0));
        const dME = Math.hypot(pMid.x - pEnd.x, pMid.y - pEnd.y, (pMid.z || 0) - (pEnd.z || 0));

        let curl = FingerCurl.NoCurl;
        if (dME * dSM > 1e-6) {
          let cosAngle = (dME * dME + dSM * dSM - dSE * dSE) / (2 * dME * dSM);
          // Kẹp biên [-1, 1] tuyệt đối chống lỗi NaN
          cosAngle = Math.max(-1.0, Math.min(1.0, cosAngle));
          const angle = (Math.acos(cosAngle) * 180 / Math.PI);
          if (angle > this.NO_CURL_START_LIMIT) curl = FingerCurl.NoCurl;
          else if (angle > this.HALF_CURL_START_LIMIT) curl = FingerCurl.HalfCurl;
          else curl = FingerCurl.FullCurl;
        }
        curls[finger] = curl;

        const dx = (pStart.x - pEnd.x);
        const dy = (pStart.y - pEnd.y);
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        let dir = FingerDirection.VerticalUp;
        if (absY > absX * 1.5) {
          dir = dy < 0 ? FingerDirection.VerticalDown : FingerDirection.VerticalUp;
        } else if (absX > absY * 1.5) {
          dir = dx > 0 ? FingerDirection.HorizontalLeft : FingerDirection.HorizontalRight;
        } else {
          if (dy >= 0) dir = dx > 0 ? FingerDirection.DiagonalUpLeft : FingerDirection.DiagonalUpRight;
          else dir = dx > 0 ? FingerDirection.DiagonalDownLeft : FingerDirection.DiagonalDownRight;
        }
        directions[finger] = dir;
      }
      return { curls, directions };
    }
  }

  class DeviceTierManager {
    static get() {
      if (!DeviceTierManager._inst) DeviceTierManager._inst = new DeviceTierManager();
      return DeviceTierManager._inst;
    }
    constructor() {
      this.tier = this.detectTier();
    }
    detectTier() {
      try {
        const cores = navigator.hardwareConcurrency || 4;
        const ram = navigator.deviceMemory || 4;
        const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
        if (isMobile) {
          if (cores <= 4 || ram <= 3) return 'low';
          if (cores >= 8 && ram >= 8) return 'high';
          return 'mid';
        }
        if (cores >= 8 && ram >= 8) return 'ultra';
        if (cores >= 6) return 'high';
        if (cores <= 2 || ram <= 4) return 'low';
        return 'mid';
      } catch (e) {
        return 'mid';
      }
    }
    getConstraints() {
      if (this.tier === 'ultra') {
        return { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60, min: 60 }, label: 'ULTRA 60 FPS' };
      }
      if (this.tier === 'high') {
        return { width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 60, min: 30 }, label: 'HIGH 60 FPS' };
      }
      if (this.tier === 'mid') {
        return { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 45, min: 30 }, label: 'MID-TIER' };
      }
      return { width: { ideal: 424 }, height: { ideal: 240 }, frameRate: { ideal: 30, min: 20 }, label: 'LOW-TIER' };
    }
  }

  function clamp(v, min = 0, max = 1) {
    return Math.max(min, Math.min(max, Number(v) || 0));
  }

  /* ==========================================================================
     MAGNETIC TARGET SNAPPING ENGINE (HÚT CON TRỎ NAM CHÂM VÀO NÚT BẤM)
     ========================================================================== */
  const MAGNETIC_SELECTOR = 'button:not(:disabled), a[href], [role="button"], .hero-thumb-btn, .filter-chip, .nav-pill-item, input[type="submit"]';
  const MAGNETIC_RADIUS = 46; // Bán kính hút 46px

  function clearMagneticHighlight() {
    if (STATE.magneticTarget) {
      STATE.magneticTarget.classList.remove('sv-magnetic-target-active');
      STATE.magneticTarget = null;
    }
    STATE.snappedX = null;
    STATE.snappedY = null;
    const laser = document.getElementById('sv-laser-pointer');
    laser?.classList.remove('snapped');
  }

  function evaluateMagneticSnap(screenX, screenY) {
    const candidates = document.querySelectorAll(MAGNETIC_SELECTOR);
    let bestEl = null;
    let bestDist = MAGNETIC_RADIUS;
    let bestCenterX = screenX;
    let bestCenterY = screenY;

    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];
      if (!el.offsetParent && el.style.position !== 'fixed') continue;
      if (el.closest('#sv-spatial-pip, #sv-touchpad-controller')) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || rect.width > 500 || rect.height > 300) continue;

      // Khoảng cách từ con trỏ tới biên gần nhất hoặc tâm của nút
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(rect.left - screenX, 0, screenX - rect.right);
      const dy = Math.max(rect.top - screenY, 0, screenY - rect.bottom);
      const distToEdge = Math.hypot(dx, dy);

      if (distToEdge < bestDist) {
        bestDist = distToEdge;
        bestEl = el;
        bestCenterX = cx;
        bestCenterY = cy;
      }
    }

    const laser = document.getElementById('sv-laser-pointer');
    if (bestEl) {
      if (STATE.magneticTarget !== bestEl) {
        if (STATE.magneticTarget) STATE.magneticTarget.classList.remove('sv-magnetic-target-active');
        STATE.magneticTarget = bestEl;
        bestEl.classList.add('sv-magnetic-target-active');
        playSpatialSound('snap');
      }
      // Lực hút 42% kéo con trỏ về tâm nút
      const pullStrength = 0.42;
      const finalX = screenX + (bestCenterX - screenX) * pullStrength;
      const finalY = screenY + (bestCenterY - screenY) * pullStrength;
      STATE.snappedX = bestCenterX;
      STATE.snappedY = bestCenterY;
      laser?.classList.add('snapped');
      return { x: finalX, y: finalY, snapped: true };
    } else {
      clearMagneticHighlight();
      return { x: screenX, y: screenY, snapped: false };
    }
  }

  /* ==========================================================================
     QUANTUM COMET TRAIL (ĐUÔI ÁNH SÁNG SAO BĂNG THEO CON TRỎ)
     ========================================================================== */
  function updateCometTrail(x, y) {
    const trailCanvas = document.getElementById('sv-laser-trail-canvas');
    if (!trailCanvas) return;
    if (trailCanvas.width !== window.innerWidth || trailCanvas.height !== window.innerHeight) {
      trailCanvas.width = window.innerWidth;
      trailCanvas.height = window.innerHeight;
    }
    const ctx = trailCanvas.getContext('2d');
    STATE.trailPoints.push({ x, y, t: performance.now() });
    if (STATE.trailPoints.length > 14) STATE.trailPoints.shift();

    ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    if (STATE.trailPoints.length < 2) return;

    const now = performance.now();
    for (let i = 1; i < STATE.trailPoints.length; i++) {
      const p0 = STATE.trailPoints[i - 1];
      const p1 = STATE.trailPoints[i];
      const age = now - p1.t;
      if (age > 260) continue;
      const ratio = i / STATE.trailPoints.length;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = STATE.isPinching
        ? `rgba(245, 158, 11, ${ratio * 0.65})`
        : `rgba(56, 189, 248, ${ratio * 0.55})`;
      ctx.lineWidth = ratio * 7;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  function performSpatialClick(normX, normY) {
    // Nếu đang hút nam châm vào nút nào thì click thẳng vào nút đó (trúng 100%)
    const x = STATE.snappedX !== null ? STATE.snappedX : normX * window.innerWidth;
    const y = STATE.snappedY !== null ? STATE.snappedY : normY * window.innerHeight;
    const target = STATE.magneticTarget || document.elementFromPoint(x, y);
    if (!target) return;

    const laser = document.getElementById('sv-laser-pointer');
    if (laser) {
      laser.classList.add('pulse-click');
      setTimeout(() => laser.classList.remove('pulse-click'), 240);
    }

    spawnShockwaveBurst(x, y);
    playSpatialSound('click');
    triggerHaptic(24);

    const isHud = target.closest('#sv-spatial-hud, #sv-spatial-pip, #hand-control-dialog, #sv-airshare-dialog, #sv-tutorial-dialog, #sv-spatial-phone-modal, #sv-touchpad-controller, #sv-touchpad-pill');
    if (!isHud) {
      const clickable = target.closest('a[href], button:not(:disabled), input:not(:disabled), select, textarea, [role="button"], [data-mobile-nav], [data-mobile-more], .glass-card, .btn, [onclick], [data-slide-index]');
      if (clickable) {
        clickable.click();
        if (typeof clickable.focus === 'function') clickable.focus();
      } else {
        target.click?.();
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window }));
      }
    }
  }

  function performSpatialScroll(deltaY) {
    window.scrollBy({ top: deltaY, behavior: 'auto' });
  }

  function performSpatialSwipe(direction) {
    playSpatialSound('swipe');
    triggerHaptic([15, 40]);

    window.dispatchEvent(new CustomEvent('SlideVault:Gesture', {
      detail: { action: direction === 'left' ? 'next' : direction === 'right' ? 'prev' : direction, direction }
    }));

    if (direction === 'left' || direction === 'right') {
      let handled = false;
      if (direction === 'left') {
        if (typeof window.nextSlide === 'function') {
          window.nextSlide();
          handled = true;
        } else if (typeof window.changeSlide === 'function') {
          window.changeSlide(1);
          handled = true;
        }
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', keyCode: 39, code: 'ArrowRight', bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', keyCode: 34, code: 'PageDown', bubbles: true }));
      } else if (direction === 'right') {
        if (typeof window.prevSlide === 'function') {
          window.prevSlide();
          handled = true;
        } else if (typeof window.changeSlide === 'function') {
          window.changeSlide(-1);
          handled = true;
        }
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', keyCode: 37, code: 'ArrowLeft', bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', keyCode: 33, code: 'PageUp', bubbles: true }));
      }

      if (!handled) {
        const scrollStep = window.innerWidth * 0.75 * (direction === 'left' ? 1 : -1);
        const horizontalScrollers = document.querySelectorAll('.overflow-x-auto, [data-carousel], .carousel-inner, .slide-scroll-track');
        horizontalScrollers.forEach(scroller => {
          if (scroller.scrollWidth > scroller.clientWidth) {
            scroller.scrollBy({ left: scrollStep, behavior: 'smooth' });
            handled = true;
          }
        });
      }

      if (!handled) {
        const nextBtn = document.querySelector('[data-slide-next], .carousel-control-next, #btnNextSlide, button[onclick*="nextSlide"]');
        const prevBtn = document.querySelector('[data-slide-prev], .carousel-control-prev, #btnPrevSlide, button[onclick*="prevSlide"]');
        if (direction === 'left' && nextBtn) nextBtn.click();
        else if (direction === 'right' && prevBtn) prevBtn.click();
      }
    } else if (direction === 'up') {
      window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' });
    } else if (direction === 'down') {
      window.scrollBy({ top: -window.innerHeight * 0.6, behavior: 'smooth' });
    }
  }

  /* ==========================================================================
     STYLESHEET V7.0 (MAGNETIC GLOW + COMET CANVAS + SCI-FI HUD)
     ========================================================================== */
  function injectSpatialStyles() {
    if (document.getElementById('sv-spatial-styles')) return;
    const style = document.createElement('style');
    style.id = 'sv-spatial-styles';
    style.textContent = `
      #sv-laser-trail-canvas {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 999996;
        display: none;
      }
      body.sv-3dtouch-active #sv-laser-trail-canvas {
        display: block;
      }

      /* Hiệu ứng nút bấm được hút nam châm */
      .sv-magnetic-target-active {
        outline: 2px solid #38BDF8 !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 24px rgba(56, 189, 248, 0.55), inset 0 0 12px rgba(16, 185, 129, 0.35) !important;
        transform: scale(1.04) translateY(-1px) !important;
        transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }

      /* Hiệu ứng Parallax 3D theo vị trí bàn tay / đầu */
      body.sv-3dtouch-active .slide-deck-preview,
      body.sv-3dtouch-active #cinemaStage {
        transform: perspective(1200px) rotateY(var(--sv-parallax-x, 0deg)) rotateX(var(--sv-parallax-y, 0deg));
        transition: transform 0.15s ease-out;
      }

      #sv-laser-pointer {
        position: fixed;
        z-index: 999999;
        pointer-events: none;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        border: 2px solid #10B981;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(56, 189, 248, 0.18) 60%, transparent 80%);
        box-shadow: 0 0 18px rgba(16, 185, 129, 0.85), 0 0 34px rgba(56, 189, 248, 0.45), inset 0 0 8px #10B981;
        transition: transform 0.08s ease-out, border-color 0.15s ease, background 0.15s ease, width 0.15s ease, height 0.15s ease;
        display: none;
        will-change: left, top, transform;
      }
      #sv-laser-pointer::after {
        content: '';
        position: absolute;
        inset: 10px;
        border-radius: 50%;
        background: #FFFFFF;
        box-shadow: 0 0 10px #FFFFFF;
      }
      #sv-laser-pointer.snapped {
        width: 42px;
        height: 42px;
        border-color: #38BDF8;
        box-shadow: 0 0 26px #38BDF8, 0 0 46px rgba(56, 189, 248, 0.65), inset 0 0 12px #38BDF8;
      }
      #sv-laser-pointer.pinching {
        transform: translate(-50%, -50%) scale(0.72);
        border-color: #F59E0B;
        box-shadow: 0 0 26px #F59E0B, 0 0 44px #F59E0B, inset 0 0 12px #F59E0B;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.65) 0%, transparent 80%);
      }
      #sv-laser-pointer.grabbing {
        transform: translate(-50%, -50%) scale(1.18);
        border-color: #38BDF8;
        box-shadow: 0 0 28px #38BDF8, 0 0 48px #38BDF8;
      }
      #sv-laser-pointer.pulse-click {
        animation: laserPulse 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes laserPulse {
        0% { transform: translate(-50%, -50%) scale(0.6); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.65); opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }

      #sv-spatial-hud {
        position: fixed;
        z-index: 999990;
        bottom: max(84px, calc(18px + env(safe-area-inset-bottom)));
        right: max(16px, env(safe-area-inset-right));
        display: none;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(10, 16, 28, 0.90);
        -webkit-backdrop-filter: blur(28px) saturate(200%);
        backdrop-filter: blur(28px) saturate(200%);
        border: 1px solid rgba(56, 189, 248, 0.45);
        box-shadow: 0 12px 36px -4px rgba(0, 0, 0, 0.75), 0 0 20px rgba(16, 185, 129, 0.25);
        color: #F8FAFC;
        font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
        font-size: 12px;
        user-select: none;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      #sv-spatial-hud .hud-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        font-size: 11px;
        letter-spacing: 0.02em;
      }
      #sv-spatial-hud .hud-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10B981;
        box-shadow: 0 0 10px #10B981;
        animation: svPulseDot 2s infinite ease-in-out;
      }
      @keyframes svPulseDot {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
      }
      #sv-spatial-hud button {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: inherit;
        border-radius: 999px;
        padding: 5px 11px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s ease;
      }
      #sv-spatial-hud button:hover {
        background: rgba(16, 185, 129, 0.25);
        border-color: #10B981;
        transform: translateY(-1px);
      }
      #sv-spatial-hud button.hud-cam-btn {
        background: rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.4);
        color: #10B981;
      }
      #sv-spatial-hud button.hud-cam-btn.active {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(56, 189, 248, 0.25));
        border-color: #10B981;
        color: #6EE7B7;
        box-shadow: 0 0 14px rgba(16, 185, 129, 0.5);
      }
      #sv-spatial-hud button.btn-danger-hud {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.4);
        color: #FCA5A5;
      }

      #sv-spatial-pip {
        position: fixed;
        z-index: 999988;
        bottom: max(140px, calc(72px + env(safe-area-inset-bottom)));
        right: max(16px, env(safe-area-inset-right));
        width: 224px;
        height: 164px;
        border-radius: 18px;
        overflow: hidden;
        background: #060b09;
        border: 2px solid rgba(56, 189, 248, 0.55);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.85), 0 0 28px rgba(56, 189, 248, 0.35);
        display: none;
        flex-direction: column;
        transition: width 0.28s cubic-bezier(0.16, 1, 0.3, 1), height 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.28s ease;
      }
      #sv-spatial-pip .pip-bar {
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8px;
        background: rgba(0, 0, 0, 0.78);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid rgba(56, 189, 248, 0.22);
        cursor: grab;
        user-select: none;
        z-index: 5;
      }
      #sv-spatial-pip .pip-tag {
        font-size: 9.5px;
        font-weight: 800;
        color: #38BDF8;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        letter-spacing: 0.05em;
      }
      #sv-spatial-pip .pip-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10B981;
        box-shadow: 0 0 8px #10B981;
        animation: svPulseDot 1.6s infinite ease-in-out;
      }
      #sv-spatial-pip .pip-tools {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      #sv-spatial-pip .pip-tool-btn {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #E2E8F0;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        font-size: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
      }
      #sv-spatial-pip .pip-body {
        position: relative;
        flex: 1;
        width: 100%;
        height: calc(100% - 26px);
        background: #000000;
        overflow: hidden;
      }
      #sv-spatial-pip video, #sv-spatial-pip canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1);
      }
      #sv-spatial-pip .pip-gesture-pill {
        position: absolute;
        bottom: 6px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 9px;
        font-weight: 800;
        color: #10B981;
        background: rgba(6, 11, 20, 0.85);
        padding: 2.5px 8px;
        border-radius: 999px;
        border: 1px solid rgba(16, 185, 129, 0.45);
        backdrop-filter: blur(8px);
        letter-spacing: 0.04em;
        z-index: 4;
        white-space: nowrap;
        pointer-events: none;
      }
      #sv-spatial-pip .pip-gesture-pill.active-gesture {
        color: #38BDF8;
        border-color: #38BDF8;
        box-shadow: 0 0 12px rgba(56, 189, 248, 0.65);
      }
      #sv-spatial-pip .pip-minimized-icon {
        display: none;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: #10B981;
        font-size: 20px;
      }
      #sv-spatial-pip.minimized {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #10B981;
      }
      #sv-spatial-pip.minimized .pip-bar,
      #sv-spatial-pip.minimized .pip-body {
        display: none !important;
      }
      #sv-spatial-pip.minimized .pip-minimized-icon {
        display: flex !important;
      }

      #sv-force-indicator {
        position: fixed;
        z-index: 999998;
        pointer-events: none;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(1);
        border: 2px solid #10B981;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.6), inset 0 0 14px rgba(16, 185, 129, 0.4);
        display: none;
      }
      #sv-force-indicator.active { display: block; }
      #sv-force-indicator.peek { border-color: #38BDF8; box-shadow: 0 0 28px #38BDF8, inset 0 0 18px #38BDF8; }
      #sv-force-indicator.pop { border-color: #F59E0B; box-shadow: 0 0 35px #F59E0B, inset 0 0 24px #F59E0B; }

      .sv-shockwave-burst {
        position: fixed;
        z-index: 999997;
        pointer-events: none;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0.1);
        opacity: 1;
      }
      .sv-shockwave-ring-1 {
        border: 3px solid rgba(56, 189, 248, 0.9);
        box-shadow: 0 0 35px #38BDF8, inset 0 0 20px #38BDF8;
        animation: svShockwaveExpand1 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .sv-shockwave-ring-2 {
        border: 2px solid rgba(16, 185, 129, 0.8);
        box-shadow: 0 0 45px #10B981, inset 0 0 25px #10B981;
        animation: svShockwaveExpand2 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .sv-shockwave-flash {
        background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(56, 189, 248, 0.6) 40%, transparent 80%);
        animation: svFlashFade 0.4s ease-out forwards;
      }
      @keyframes svShockwaveExpand1 {
        0% { width: 30px; height: 30px; transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
        100% { width: 280px; height: 280px; transform: translate(-50%, -50%) scale(1); opacity: 0; }
      }
      @keyframes svShockwaveExpand2 {
        0% { width: 20px; height: 20px; transform: translate(-50%, -50%) scale(0.2); opacity: 0.9; }
        100% { width: 360px; height: 360px; transform: translate(-50%, -50%) scale(1); opacity: 0; }
      }
      @keyframes svFlashFade {
        0% { width: 60px; height: 60px; transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { width: 140px; height: 140px; transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
      }

      #sv-touchpad-controller {
        position: fixed;
        z-index: 999992;
        bottom: max(24px, calc(16px + env(safe-area-inset-bottom)));
        right: max(20px, env(safe-area-inset-right));
        width: 300px;
        background: rgba(10, 16, 28, 0.94);
        -webkit-backdrop-filter: blur(32px) saturate(210%);
        backdrop-filter: blur(32px) saturate(210%);
        border: 1.5px solid rgba(56, 189, 248, 0.45);
        border-radius: 22px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.82), 0 0 32px rgba(56, 189, 248, 0.22);
        color: #F8FAFC;
        font-family: 'Be Vietnam Pro', -apple-system, sans-serif;
        user-select: none;
        touch-action: none;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      .sv-touchpad-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 13px 7px 13px;
        cursor: move;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
      }
      .sv-touchpad-badge { display: flex; align-items: center; gap: 7px; }
      .sv-touchpad-glow-dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: #10B981; box-shadow: 0 0 10px #10B981;
      }
      .sv-touchpad-title { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; color: #38BDF8; }
      .sv-touchpad-actions { display: flex; align-items: center; gap: 5px; }
      .sv-tp-header-btn {
        background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.12);
        color: inherit; border-radius: 8px; padding: 4px 7px; font-size: 10px; font-weight: 600; cursor: pointer;
      }
      .sv-touchpad-body { padding: 9px 12px; }
      .sv-pad-surface {
        position: relative; height: 125px;
        background: radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.75) 100%), #050811;
        border: 1.5px dashed rgba(56, 189, 248, 0.4); border-radius: 14px;
        overflow: hidden; cursor: crosshair; touch-action: none;
        display: flex; align-items: center; justify-content: center;
      }
      .sv-pad-grid-lines {
        position: absolute; inset: 0;
        background-image: linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
        background-size: 20px 20px; pointer-events: none;
      }
      .sv-pad-laser-thumb {
        position: absolute; width: 22px; height: 22px; border-radius: 50%;
        background: radial-gradient(circle, #38BDF8 25%, rgba(16, 185, 129, 0.6) 80%);
        border: 2px solid #FFFFFF; box-shadow: 0 0 14px #38BDF8;
        transform: translate(-50%, -50%); pointer-events: none; left: 50%; top: 50%;
      }
      .sv-pad-hint { position: absolute; bottom: 7px; left: 0; right: 0; text-align: center; pointer-events: none; }
      .sv-pad-hint-text { font-size: 9px; color: rgba(226, 232, 240, 0.75); background: rgba(0, 0, 0, 0.6); padding: 2px 7px; border-radius: 6px; }
      .sv-pad-force-bar-track { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: rgba(255, 255, 255, 0.12); }
      .sv-pad-force-bar-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #10B981, #38BDF8, #F59E0B, #EF4444); }
      .sv-touchpad-toolbar { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 5px; padding: 0 12px 9px 12px; }
      .sv-tp-action-btn {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 7px 4px; border-radius: 11px; background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.12); color: inherit; cursor: pointer; gap: 2px;
      }
      .sv-tp-btn-primary { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.5); color: #A7F3D0; }
      .sv-tp-btn-force { background: rgba(245, 158, 11, 0.18); border-color: rgba(245, 158, 11, 0.45); color: #FDE68A; }
      .sv-tp-icon { font-size: 14px; line-height: 1; }
      .sv-tp-label { font-size: 10px; font-weight: 600; }
      .sv-touchpad-subbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 5px 12px 8px 12px; border-top: 1px solid rgba(255, 255, 255, 0.06); background: rgba(0, 0, 0, 0.22);
      }
      .sv-tp-sub-btn { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: inherit; font-size: 9.5px; font-weight: 600; padding: 4px 7px; border-radius: 7px; cursor: pointer; }
      .sv-tp-stat-pill { font-size: 9px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.12); padding: 2px 7px; border-radius: 999px; border: 1px solid rgba(16, 185, 129, 0.3); }

      #sv-touchpad-pill {
        position: fixed; z-index: 999991;
        bottom: max(24px, calc(16px + env(safe-area-inset-bottom)));
        right: max(20px, env(safe-area-inset-right));
        display: none; align-items: center; gap: 8px; padding: 9px 16px;
        background: rgba(10, 16, 28, 0.94); backdrop-filter: blur(28px);
        border: 1.5px solid rgba(56, 189, 248, 0.65); border-radius: 999px;
        box-shadow: 0 14px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(56, 189, 248, 0.4);
        color: #F8FAFC; font-size: 11px; font-weight: 700; cursor: pointer;
      }
      #sv-touchpad-pill .sv-pill-dot { width: 8px; height: 8px; border-radius: 50%; background: #10B981; box-shadow: 0 0 10px #10B981; }

      .sv-touchpad-hub-bar {
        display: flex; align-items: center; gap: 5px; padding: 6px 10px;
        background: rgba(255, 255, 255, 0.04); border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        overflow-x: auto; scrollbar-width: none;
      }
      .sv-hub-pill-btn {
        background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.14);
        color: inherit; border-radius: 999px; padding: 4px 8px; font-size: 10px; font-weight: 600;
        cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;
      }

      #sv-spatial-toast {
        position: fixed; z-index: 9999999; top: 24px; left: 50%;
        transform: translate(-50%, -20px) scale(0.95); opacity: 0; pointer-events: none;
        background: rgba(10, 16, 28, 0.94); backdrop-filter: blur(28px);
        border: 1px solid rgba(56, 189, 248, 0.45); color: #F8FAFC;
        padding: 8px 18px; border-radius: 999px; font-size: 12px; font-weight: 600;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 189, 248, 0.25);
        display: flex; align-items: center; gap: 8px; transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      }
      #sv-spatial-toast.active { opacity: 1; transform: translate(-50%, 0) scale(1); }
    `;
    document.head.appendChild(style);
  }

  function spawnShockwaveBurst(x, y) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.pointerEvents = 'none';
    container.style.zIndex = '999997';

    const flash = document.createElement('div');
    flash.className = 'sv-shockwave-burst sv-shockwave-flash';
    container.appendChild(flash);

    const ring1 = document.createElement('div');
    ring1.className = 'sv-shockwave-burst sv-shockwave-ring-1';
    container.appendChild(ring1);

    const ring2 = document.createElement('div');
    ring2.className = 'sv-shockwave-burst sv-shockwave-ring-2';
    container.appendChild(ring2);

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 700);
  }

  let laserScreenX = window.innerWidth * 0.5;
  let laserScreenY = window.innerHeight * 0.45;
  let padForceTimer = null;
  let padForceStepFrame = null;
  let isPadTouching = false;
  let padTouchStartPos = { x: 0, y: 0 };
  let padLastPos = { x: 0, y: 0 };
  let padTouchStartTime = 0;
  let padHasMovedSignificantly = false;

  function updateLaserPosition(newX, newY) {
    const rawX = clamp(newX, 10, window.innerWidth - 10);
    const rawY = clamp(newY, 10, window.innerHeight - 10);
    const mag = evaluateMagneticSnap(rawX, rawY);
    laserScreenX = mag.x;
    laserScreenY = mag.y;

    const laser = document.getElementById('sv-laser-pointer');
    if (laser) {
      laser.style.left = `${laserScreenX}px`;
      laser.style.top = `${laserScreenY}px`;
      laser.style.display = 'block';
    }
    updateCometTrail(laserScreenX, laserScreenY);
  }

  function createSpatialElements() {
    if (!document.getElementById('sv-laser-trail-canvas')) {
      const trailCanvas = document.createElement('canvas');
      trailCanvas.id = 'sv-laser-trail-canvas';
      document.body.appendChild(trailCanvas);
    }

    let pointer = document.getElementById('sv-laser-pointer');
    if (!pointer) {
      pointer = document.createElement('div');
      pointer.id = 'sv-laser-pointer';
      pointer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(pointer);
    }

    let ring = document.getElementById('sv-force-indicator');
    if (!ring) {
      ring = document.createElement('div');
      ring.id = 'sv-force-indicator';
      ring.setAttribute('aria-hidden', 'true');
      document.body.appendChild(ring);
    }

    let pip = document.getElementById('sv-spatial-pip');
    if (!pip) {
      pip = document.createElement('div');
      pip.id = 'sv-spatial-pip';
      pip.innerHTML = `
        <div class="pip-bar" id="sv-pip-drag-handle" title="Kéo để di chuyển khung Camera">
          <span class="pip-tag"><span class="pip-dot"></span> <span id="sv-pip-title">SCI-FI HUD · 60FPS</span></span>
          <div class="pip-tools">
            <button type="button" class="pip-tool-btn" id="sv-pip-btn-min" title="Thu nhỏ"><i data-lucide="minus"></i></button>
            <button type="button" class="pip-tool-btn pip-tool-close" id="sv-pip-btn-close" title="Tắt Camera"><i data-lucide="x"></i></button>
          </div>
        </div>
        <div class="pip-body">
          <video id="sv-pip-video" autoplay playsinline muted></video>
          <canvas id="sv-pip-canvas"></canvas>
          <div id="sv-pip-gesture-pill" class="pip-gesture-pill">ĐANG QUÉT TAY...</div>
        </div>
        <div class="pip-minimized-icon">
          <i data-lucide="camera"></i>
        </div>
      `;
      document.body.appendChild(pip);

      document.getElementById('sv-pip-btn-min')?.addEventListener('click', (e) => {
        e.stopPropagation();
        pip.classList.toggle('minimized');
        playSpatialSound('click');
        window.lucide?.createIcons?.();
      });

      pip.addEventListener('click', (e) => {
        if (pip.classList.contains('minimized')) {
          e.stopPropagation();
          pip.classList.remove('minimized');
          playSpatialSound('click');
          window.lucide?.createIcons?.();
        }
      });

      document.getElementById('sv-pip-btn-close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCameraMode();
      });
    }

    let hud = document.getElementById('sv-spatial-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'sv-spatial-hud';
      hud.style.display = 'none';
      hud.innerHTML = `
        <div class="hud-pill">
          <div class="hud-dot"></div>
          <span class="hud-title">3D TOUCH v7</span>
          <span id="sv-hud-fps" style="color:#10B981; font-weight:700;">60 FPS</span>
        </div>
        <div class="hud-force-wrap" style="display:flex; align-items:center; gap:6px; background:rgba(0,0,0,0.45); padding:3px 8px; border-radius:999px; border:1px solid rgba(255,255,255,0.12);">
          <span style="font-size:10px; color:#94A3B8; font-weight:600;">LỰC</span>
          <div style="width:48px; height:6px; background:rgba(255,255,255,0.15); border-radius:999px; overflow:hidden;">
            <div id="sv-hud-force-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #10B981, #38BDF8, #F59E0B); transition:width 0.05s ease;"></div>
          </div>
          <span id="sv-hud-gesture-tag" style="font-size:10px; color:#10B981; font-weight:700; min-width:36px; text-align:right;">CHỜ</span>
        </div>
        <button type="button" id="sv-btn-hud-cam" class="hud-cam-btn" title="Bật/Tắt Camera AI Nhận Diện Cử Chỉ Tay">
          <i data-lucide="camera"></i> <span id="sv-hud-cam-text">Bật Cam AI</span>
        </button>
        <button type="button" id="sv-btn-touchpad-expand" title="Mở bộ điều khiển cảm ứng">
          <i data-lucide="smartphone"></i> Điều khiển
        </button>
        <button type="button" class="btn-danger-hud" id="sv-btn-stop-touch" title="Dừng 3D Touch">
          <i data-lucide="x"></i>
        </button>
      `;
      document.body.appendChild(hud);

      document.getElementById('sv-btn-hud-cam')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCameraMode();
      });

      document.getElementById('sv-btn-touchpad-expand')?.addEventListener('click', () => {
        const controller = document.getElementById('sv-touchpad-controller');
        const pill = document.getElementById('sv-touchpad-pill');
        if (pill) pill.style.display = 'none';
        if (controller) controller.style.display = 'flex';
        playSpatialSound('click');
      });

      document.getElementById('sv-btn-stop-touch')?.addEventListener('click', () => {
        stopSpatialTouch();
      });
    }

    let controller = document.getElementById('sv-touchpad-controller');
    if (!controller) {
      controller = document.createElement('div');
      controller.id = 'sv-touchpad-controller';
      controller.innerHTML = `
        <div class="sv-touchpad-header" id="sv-touchpad-drag-handle">
          <div class="sv-touchpad-badge">
            <div class="sv-touchpad-glow-dot"></div>
            <span class="sv-touchpad-title">3D TOUCH HUB v7</span>
          </div>
          <div class="sv-touchpad-actions">
            <button type="button" id="sv-tp-btn-fs" class="sv-tp-header-btn" title="Toàn Màn Hình"><i data-lucide="maximize"></i></button>
            <button type="button" id="sv-tp-btn-minimize" class="sv-tp-header-btn" title="Thu nhỏ"><i data-lucide="minus"></i></button>
            <button type="button" id="sv-tp-btn-close" class="sv-tp-header-btn sv-tp-btn-close" title="Tắt"><i data-lucide="x"></i></button>
          </div>
        </div>
        <div class="sv-touchpad-hub-bar">
          <button type="button" id="sv-tp-hub-phone" class="sv-hub-pill-btn"><i data-lucide="smartphone"></i> Remote</button>
          <button type="button" id="sv-tp-hub-airshare" class="sv-hub-pill-btn"><i data-lucide="share-2"></i> AirShare</button>
          <button type="button" id="sv-tp-hub-tutorial" class="sv-hub-pill-btn"><i data-lucide="hand"></i> 3D Hand</button>
          <button type="button" id="sv-tp-btn-cam" class="sv-hub-pill-btn"><i data-lucide="camera"></i> Cam</button>
        </div>
        <div class="sv-touchpad-body">
          <div class="sv-pad-surface" id="sv-pad-surface">
            <div class="sv-pad-grid-lines"></div>
            <div class="sv-pad-laser-thumb" id="sv-pad-thumb"></div>
            <div class="sv-pad-force-bar-track"><div class="sv-pad-force-bar-fill" id="sv-pad-force-fill"></div></div>
            <div class="sv-pad-hint"><span class="sv-pad-hint-text">Rê ngón tay · Chạm Bấm · Tự hút Nam châm</span></div>
          </div>
        </div>
        <div class="sv-touchpad-toolbar">
          <button type="button" class="sv-tp-action-btn" id="sv-tp-btn-prev"><span class="sv-tp-icon">⏮️</span><span class="sv-tp-label">Trước</span></button>
          <button type="button" class="sv-tp-action-btn sv-tp-btn-primary" id="sv-tp-btn-click"><span class="sv-tp-icon">👆</span><span class="sv-tp-label">Bấm</span></button>
          <button type="button" class="sv-tp-action-btn sv-tp-btn-force" id="sv-tp-btn-force"><span class="sv-tp-icon">⚡</span><span class="sv-tp-label">3D Lực</span></button>
          <button type="button" class="sv-tp-action-btn" id="sv-tp-btn-next"><span class="sv-tp-icon">⏭️</span><span class="sv-tp-label">Sau</span></button>
        </div>
        <div class="sv-touchpad-subbar">
          <button type="button" class="sv-tp-sub-btn" id="sv-tp-btn-scroll-up">▲ Cuộn lên</button>
          <div class="sv-tp-stat-pill"><span id="sv-tp-mode-label">MAGNETIC LASER</span></div>
          <button type="button" class="sv-tp-sub-btn" id="sv-tp-btn-scroll-down">▼ Cuộn xuống</button>
        </div>
      `;
      document.body.appendChild(controller);
    }

    let pill = document.getElementById('sv-touchpad-pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'sv-touchpad-pill';
      pill.innerHTML = `<div class="sv-pill-dot"></div><span>✨ 3D TOUCH v7</span>`;
      document.body.appendChild(pill);
    }

    window.lucide?.createIcons?.();
    initTouchpadInteractions();
  }

  function initTouchpadInteractions() {
    const pad = document.getElementById('sv-pad-surface');
    const thumb = document.getElementById('sv-pad-thumb');
    const controller = document.getElementById('sv-touchpad-controller');
    const pill = document.getElementById('sv-touchpad-pill');
    if (!pad || pad.dataset.initialized === 'true') return;
    pad.dataset.initialized = 'true';

    const onPadDown = (e) => {
      isPadTouching = true;
      padTouchStartTime = performance.now();
      const rect = pad.getBoundingClientRect();
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      padTouchStartPos = { x: clientX, y: clientY };
      padLastPos = { x: clientX, y: clientY };
      if (thumb) {
        thumb.style.left = `${clamp(clientX - rect.left, 8, rect.width - 8)}px`;
        thumb.style.top = `${clamp(clientY - rect.top, 8, rect.height - 8)}px`;
      }
      e.preventDefault();
    };

    const onPadMove = (e) => {
      if (!isPadTouching) return;
      const rect = pad.getBoundingClientRect();
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      const dx = clientX - padLastPos.x;
      const dy = clientY - padLastPos.y;
      padLastPos = { x: clientX, y: clientY };
      updateLaserPosition(laserScreenX + dx * 2.4, laserScreenY + dy * 2.4);
      if (thumb) {
        thumb.style.left = `${clamp(clientX - rect.left, 8, rect.width - 8)}px`;
        thumb.style.top = `${clamp(clientY - rect.top, 8, rect.height - 8)}px`;
      }
    };

    const onPadUp = (e) => {
      if (!isPadTouching) return;
      isPadTouching = false;
      const elapsed = performance.now() - padTouchStartTime;
      const clientX = e.clientX || e.changedTouches?.[0]?.clientX || padLastPos.x;
      const clientY = e.clientY || e.changedTouches?.[0]?.clientY || padLastPos.y;
      const deltaX = clientX - padTouchStartPos.x;
      const deltaY = clientY - padTouchStartPos.y;

      if (elapsed < 260 && Math.hypot(deltaX, deltaY) < 14) {
        performSpatialClick(laserScreenX / window.innerWidth, laserScreenY / window.innerHeight);
      } else if (elapsed < 320 && Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        performSpatialSwipe(deltaX < 0 ? 'left' : 'right');
      }
    };

    pad.addEventListener('mousedown', onPadDown);
    pad.addEventListener('touchstart', onPadDown, { passive: false });
    window.addEventListener('mousemove', onPadMove);
    window.addEventListener('touchmove', onPadMove, { passive: true });
    window.addEventListener('mouseup', onPadUp);
    window.addEventListener('touchend', onPadUp);

    document.getElementById('sv-tp-btn-prev')?.addEventListener('click', () => performSpatialSwipe('right'));
    document.getElementById('sv-tp-btn-next')?.addEventListener('click', () => performSpatialSwipe('left'));
    document.getElementById('sv-tp-btn-click')?.addEventListener('click', () => performSpatialClick(laserScreenX / window.innerWidth, laserScreenY / window.innerHeight));
    document.getElementById('sv-tp-btn-force')?.addEventListener('click', () => {
      SlideVaultSpatial.simulatePop(laserScreenX, laserScreenY);
      performSpatialClick(laserScreenX / window.innerWidth, laserScreenY / window.innerHeight);
    });
    document.getElementById('sv-tp-btn-scroll-up')?.addEventListener('click', () => window.scrollBy({ top: -320, behavior: 'smooth' }));
    document.getElementById('sv-tp-btn-scroll-down')?.addEventListener('click', () => window.scrollBy({ top: 320, behavior: 'smooth' }));
    document.getElementById('sv-tp-btn-minimize')?.addEventListener('click', () => {
      controller.style.display = 'none';
      if (pill) pill.style.display = 'inline-flex';
    });
    pill?.addEventListener('click', () => {
      controller.style.display = 'flex';
      pill.style.display = 'none';
    });
    document.getElementById('sv-tp-btn-close')?.addEventListener('click', () => stopSpatialTouch());
    document.getElementById('sv-tp-hub-phone')?.addEventListener('click', () => openPhoneConnectModal());
    document.getElementById('sv-tp-hub-airshare')?.addEventListener('click', () => openAirShareDialog());
    document.getElementById('sv-tp-hub-tutorial')?.addEventListener('click', () => openTutorialDialog());
    document.getElementById('sv-tp-btn-cam')?.addEventListener('click', () => toggleCameraMode());
    document.getElementById('sv-tp-btn-fs')?.addEventListener('click', () => SlideVaultSpatial.toggleFullscreen());
  }

  let handLandmarkerInstance = null;
  let animationFrameId = null;

  async function initHandLandmarker() {
    if (handLandmarkerInstance) return handLandmarkerInstance;
    const tasksCdn = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
    const wasmCdn = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
    const modelUrl = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

    try {
      const visionMod = await import(tasksCdn);
      const { FilesetResolver, HandLandmarker } = visionMod;
      const fileset = await FilesetResolver.forVisionTasks(wasmCdn);
      try {
        handLandmarkerInstance = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: modelUrl, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 2, // Nâng cấp hỗ trợ 2 bàn tay cùng lúc!
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuErr) {
        handLandmarkerInstance = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: modelUrl, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }
      return handLandmarkerInstance;
    } catch (err) {
      return null;
    }
  }

  function showSpatialToast(msg, kind = 'info') {
    let toast = document.getElementById('sv-spatial-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sv-spatial-toast';
      document.body.appendChild(toast);
    }
    toast.className = `sv-spatial-toast sv-toast-${kind} active`;
    toast.innerHTML = `<span>${kind === 'good' ? '✨' : '⚡'}</span><span>${msg}</span>`;
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('active'), 2800);
  }

  async function toggleCameraMode() {
    injectSpatialStyles();
    createSpatialElements();

    const modeLabel = document.getElementById('sv-tp-mode-label');
    const hudCamBtn = document.getElementById('sv-btn-hud-cam');
    const hudCamText = document.getElementById('sv-hud-cam-text');
    const pip = document.getElementById('sv-spatial-pip');
    const video = document.getElementById('sv-pip-video');
    const canvas = document.getElementById('sv-pip-canvas');

    if (STATE.cameraStream) {
      STATE.cameraStream.getTracks().forEach(t => t.stop());
      STATE.cameraStream = null;
      if (pip) pip.style.display = 'none';
      if (modeLabel) modeLabel.textContent = 'MAGNETIC LASER';
      if (hudCamBtn) {
        hudCamBtn.classList.remove('active');
        if (hudCamText) hudCamText.textContent = 'Bật Cam AI';
      }
      showSpatialToast('Đã tắt Camera · Giữ Bàn di Cảm ứng Ảo', 'good');
      return;
    }

    try {
      showSpatialToast('📷 Đang kích hoạt Camera AI 2 Tay & Magnetic Laser...', 'info');
      const tierProfile = DeviceTierManager.get().getConstraints();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: tierProfile.width, height: tierProfile.height, frameRate: tierProfile.frameRate }
      });
      STATE.cameraStream = stream;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      if (pip) {
        pip.style.display = 'flex';
        pip.classList.remove('minimized');
      }
      if (modeLabel) modeLabel.textContent = `CAM · ${tierProfile.label}`;
      if (hudCamBtn) {
        hudCamBtn.classList.add('active');
        if (hudCamText) hudCamText.textContent = 'Tắt Cam AI';
      }
      playSpatialSound('pop');
      showSpatialToast('✨ Camera AI v7.0 sẵn sàng! Con trỏ tự động hút vào các nút bấm.', 'good');

      const landmarker = await initHandLandmarker();
      if (landmarker && video) {
        runVisionLoop(video, canvas, landmarker);
      } else if (video) {
        runOpticalRadarLoop(video, canvas);
      }
    } catch (err) {
      showSpatialToast('💡 Không mở được Camera. Đã bật Bàn di Cảm ứng Ảo!', 'good');
    }
  }

  function startSpatialTouch(openController = false, autoStartCam = true) {
    if (STATE.active) return;
    try { localStorage.setItem('slidevault_3dtouch_active', '1'); } catch (e) {}

    injectSpatialStyles();
    createSpatialElements();

    const hud = document.getElementById('sv-spatial-hud');
    const controller = document.getElementById('sv-touchpad-controller');
    const pill = document.getElementById('sv-touchpad-pill');
    const pointer = document.getElementById('sv-laser-pointer');

    if (openController) {
      if (controller) controller.style.display = 'flex';
      if (pill) pill.style.display = 'none';
    } else {
      if (controller) controller.style.display = 'none';
      if (pill) pill.style.display = 'inline-flex';
    }
    if (hud) hud.style.display = 'flex';

    laserScreenX = window.innerWidth * 0.5;
    laserScreenY = window.innerHeight * 0.45;
    if (pointer) {
      pointer.style.left = `${laserScreenX}px`;
      pointer.style.top = `${laserScreenY}px`;
      pointer.style.display = 'block';
    }

    STATE.active = true;
    document.body.classList.add('sv-3dtouch-active');
    document.querySelectorAll('[data-sv-touch-toggle], #open-hand-control, #floatingQuickCamAi').forEach(btn => {
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      const label = btn.querySelector('#touchSwitchLabel') || document.getElementById('touchSwitchLabel');
      if (label) label.textContent = 'Camera AI: BẬT';
    });

    playSpatialSound('click');
    if (autoStartCam && !STATE.cameraStream) {
      setTimeout(() => toggleCameraMode(), 120);
    }
  }

  function stopSpatialTouch() {
    STATE.active = false;
    clearMagneticHighlight();
    try { localStorage.removeItem('slidevault_3dtouch_active'); } catch (e) {}
    document.body.classList.remove('sv-3dtouch-active');
    document.documentElement.style.removeProperty('--sv-parallax-x');
    document.documentElement.style.removeProperty('--sv-parallax-y');

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (STATE.cameraStream) {
      STATE.cameraStream.getTracks().forEach(t => t.stop());
      STATE.cameraStream = null;
    }

    ['sv-spatial-hud', 'sv-spatial-pip', 'sv-laser-pointer', 'sv-touchpad-controller', 'sv-touchpad-pill'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    document.querySelectorAll('[data-sv-touch-toggle], #open-hand-control, #floatingQuickCamAi').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-checked', 'false');
      const label = btn.querySelector('#touchSwitchLabel') || document.getElementById('touchSwitchLabel');
      if (label) label.textContent = 'Camera AI 3D Touch';
    });
    playSpatialSound('click');
  }

  function runOpticalRadarLoop(video, canvas) {
    if (!STATE.active || !video) return;
    const ctx = canvas?.getContext('2d');
    let t = 0;
    const pipPill = document.getElementById('sv-pip-gesture-pill');
    if (pipPill) {
      pipPill.textContent = '🛡️ RADAR QUÉT CỤC BỘ';
      pipPill.classList.add('active-gesture');
    }
    showSpatialToast('🛡️ Chế độ Radar Cử chỉ Cục bộ (Offline Mode) đã bật!', 'good');

    function radarStep() {
      if (!STATE.active) return;
      t += 0.04;
      const width = canvas.width = video.videoWidth || 640;
      const height = canvas.height = video.videoHeight || 480;
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        const cx = width / 2;
        const cy = height / 2;
        const r = 55 + Math.sin(t) * 8;

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, r + 20, t, t + Math.PI * 1.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      animationFrameId = requestAnimationFrame(radarStep);
    }
    animationFrameId = requestAnimationFrame(radarStep);
  }

  function runVisionLoop(video, canvas, landmarker) {
    if (!STATE.active || !video) return;

    const ctx = canvas?.getContext('2d');
    const pointer = document.getElementById('sv-laser-pointer');
    const fingerEstimator = new FingerPoseEstimator();
    const tierProfile = DeviceTierManager.get().getConstraints();

    let lastScrollY = null;
    let lastGrabY = null;
    let lastThumbsUpTime = 0;
    let thumbsUpTriggered = false;
    let swipeHistory = [];

    function renderLoop() {
      if (!STATE.active) return;
      const now = performance.now();

      STATE.fpsCounter++;
      if (now - STATE.lastFpsTime >= 1000) {
        STATE.fps = Math.round((STATE.fpsCounter * 1000) / (now - STATE.lastFpsTime));
        STATE.fpsCounter = 0;
        STATE.lastFpsTime = now;
        const fpsLabel = document.getElementById('sv-hud-fps');
        if (fpsLabel) fpsLabel.textContent = `${STATE.fps} FPS · ${tierProfile.label}`;
      }

      if (video.readyState >= 2) {
        if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        try {
          const results = landmarker.detectForVideo(video, now);
          if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);

          // XỬ LÝ CỬ CHỈ 2 BÀN TAY CÙNG LÚC (DUAL-HAND PINCH ZOOM)
          if (results?.landmarks?.length >= 2) {
            const h1 = results.landmarks[0][8];
            const h2 = results.landmarks[1][8];
            const dist2Hands = Math.hypot(h1.x - h2.x, h1.y - h2.y);
            if (STATE.dualHandBaseDist === null) {
              STATE.dualHandBaseDist = dist2Hands;
            } else {
              const scaleDelta = dist2Hands / Math.max(0.05, STATE.dualHandBaseDist);
              STATE.currentZoom = clamp(scaleDelta, 0.85, 1.35);
              const stage = document.getElementById('cinemaStage') || document.getElementById('heroInteractiveDeck') || document.getElementById('activeSlideCanvas') || document.querySelector('.slide-deck-preview') || document.getElementById('slideViewerWrapper');
              if (stage) stage.style.transform = `scale(${STATE.currentZoom.toFixed(3)})`;
            }
          } else {
            STATE.dualHandBaseDist = null;
          }

          if (results && results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const wrist = landmarks[0];
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const middleMcp = landmarks[9];

            // Hiệu ứng 3D Parallax nghiêng nhẹ sân khấu theo vị trí bàn tay
            const parallaxX = ((0.5 - wrist.x) * 7).toFixed(2);
            const parallaxY = ((wrist.y - 0.5) * 5).toFixed(2);
            document.documentElement.style.setProperty('--sv-parallax-x', `${parallaxX}deg`);
            document.documentElement.style.setProperty('--sv-parallax-y', `${parallaxY}deg`);

            const pose = fingerEstimator.estimate(landmarks);
            const isIndexNoCurl = pose.curls[Finger.Index] === FingerCurl.NoCurl;
            const isMiddleNoCurl = pose.curls[Finger.Middle] === FingerCurl.NoCurl;
            const isRingCurled = pose.curls[Finger.Ring] !== FingerCurl.NoCurl;
            const isPinkyCurled = pose.curls[Finger.Pinky] !== FingerCurl.NoCurl;
            const isRingFullCurl = pose.curls[Finger.Ring] === FingerCurl.FullCurl;
            const isPinkyFullCurl = pose.curls[Finger.Pinky] === FingerCurl.FullCurl;
            const isThumbNoCurl = pose.curls[Finger.Thumb] === FingerCurl.NoCurl || pose.curls[Finger.Thumb] === FingerCurl.HalfCurl;
            const isThumbUpDir = pose.directions[Finger.Thumb] === FingerDirection.VerticalUp;

            const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
            const handSpan = Math.max(1e-4, d(middleMcp, wrist));
            const pinchDist = d(thumbTip, indexTip);
            const pinchRatio = pinchDist / handSpan;
            const isPinchNow = pinchRatio < 0.38 || pinchDist < 0.048;

            // VẼ GIAO DIỆN CYBERPUNK SCI-FI HUD TRÊN KHUNG CAM
            if (ctx && canvas) {
              ctx.save();
              const bones = [
                [0, 1], [1, 2], [2, 3], [3, 4],
                [0, 5], [5, 6], [6, 7], [7, 8],
                [0, 9], [9, 10], [10, 11], [11, 12],
                [0, 13], [13, 14], [14, 15], [15, 16],
                [0, 17], [17, 18], [18, 19], [19, 20],
                [5, 9], [9, 13], [13, 17]
              ];
              ctx.strokeStyle = isPinchNow ? 'rgba(245, 158, 11, 0.9)' : 'rgba(56, 189, 248, 0.8)';
              ctx.lineWidth = 2.5;
              ctx.shadowColor = isPinchNow ? '#F59E0B' : '#38BDF8';
              ctx.shadowBlur = 8;
              bones.forEach(([a, b]) => {
                const ptA = landmarks[a];
                const ptB = landmarks[b];
                ctx.beginPath();
                ctx.moveTo(ptA.x * canvas.width, ptA.y * canvas.height);
                ctx.lineTo(ptB.x * canvas.width, ptB.y * canvas.height);
                ctx.stroke();
              });

              // Tia năng lượng nối ngón cái và ngón trỏ (Pinch Force Line)
              ctx.beginPath();
              ctx.moveTo(thumbTip.x * canvas.width, thumbTip.y * canvas.height);
              ctx.lineTo(indexTip.x * canvas.width, indexTip.y * canvas.height);
              ctx.strokeStyle = isPinchNow ? '#EF4444' : '#F59E0B';
              ctx.setLineDash([4, 4]);
              ctx.stroke();
              ctx.setLineDash([]);

              // Vòng ngắm Sci-Fi quanh đầu ngón trỏ
              ctx.beginPath();
              ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, isPinchNow ? 12 : 8, 0, 2 * Math.PI);
              ctx.strokeStyle = isPinchNow ? '#F59E0B' : '#10B981';
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.restore();
            }

            const rawX = 1 - indexTip.x;
            const rawY = indexTip.y;
            const smoothX = pointerFilterX.filter(rawX, now);
            const smoothY = pointerFilterY.filter(rawY, now);

            // Áp dụng Magnetic Snapping + Comet Trail cho con trỏ Laser
            updateLaserPosition(smoothX * window.innerWidth, smoothY * window.innerHeight);

            const extended = [8, 12, 16, 20].map((tip, i) => {
              const mcp = landmarks[[5, 9, 13, 17][i]];
              const pip = landmarks[[6, 10, 14, 18][i]];
              return d(landmarks[tip], wrist) > d(mcp, wrist) * 1.12 && d(landmarks[tip], wrist) > d(pip, wrist);
            });
            const extendedCount = extended.filter(Boolean).length;

            const isTwoFingerScroll = !isPinchNow && (
              (isIndexNoCurl && isMiddleNoCurl && isRingCurled && isPinkyCurled) ||
              (extended[0] && extended[1] && !extended[2] && !extended[3])
            );

            const isThumbUp = !isPinchNow && (
              (isThumbNoCurl && isThumbUpDir && !isIndexNoCurl && !isMiddleNoCurl && isRingCurled) ||
              (extendedCount === 0 && thumbTip.y < landmarks[2].y - 0.04 && thumbTip.y < indexTip.y - 0.03)
            );

            const isPointOnly = !isPinchNow && !isTwoFingerScroll && (
              (isIndexNoCurl && !isMiddleNoCurl && isRingFullCurl && isPinkyFullCurl) ||
              (extended[0] && !extended[1] && !extended[2] && !extended[3])
            );

            const isFist = !isPinchNow && extendedCount === 0 && !isThumbUp;

            if (isTwoFingerScroll) {
              if (lastScrollY != null) {
                const deltaY = (smoothY - lastScrollY) * window.innerHeight * 2.3;
                if (Math.abs(deltaY) > 2) performSpatialScroll(deltaY);
              }
              lastScrollY = smoothY;
            } else {
              lastScrollY = null;
            }

            if (isThumbUp) {
              if (lastThumbsUpTime === 0) lastThumbsUpTime = now;
              if (now - lastThumbsUpTime > 380 && !thumbsUpTriggered) {
                thumbsUpTriggered = true;
                SlideVaultSpatial.toggleFullscreen();
                playSpatialSound('pop');
                showSpatialToast('👍 Thumbs Up: Chuyển Toàn Màn Hình!', 'good');
              }
            } else {
              lastThumbsUpTime = 0;
              thumbsUpTriggered = false;
            }

            if (isPinchNow && !isTwoFingerScroll) {
              if (!STATE.isPinching && now - STATE.lastPinchTime > 320) {
                STATE.isPinching = true;
                STATE.lastPinchTime = now;
                pointer?.classList.add('pinching');
                performSpatialClick(smoothX, smoothY);
              }
            } else {
              if (STATE.isPinching) {
                STATE.isPinching = false;
                pointer?.classList.remove('pinching');
              }
            }

            if (isFist) {
              if (!STATE.isGrabbing) {
                STATE.isGrabbing = true;
                lastGrabY = smoothY;
                pointer?.classList.add('grabbing');
                playSpatialSound('grab');
              } else if (lastGrabY != null) {
                const deltaY = (smoothY - lastGrabY) * window.innerHeight * 1.6;
                performSpatialScroll(deltaY);
                lastGrabY = smoothY;
              }
            } else {
              if (STATE.isGrabbing) {
                STATE.isGrabbing = false;
                lastGrabY = null;
                pointer?.classList.remove('grabbing');
              }
            }

            if (extendedCount >= 4) {
              swipeHistory.push({ x: smoothX, t: now });
              if (swipeHistory.length > 8) swipeHistory.shift();
              if (swipeHistory.length >= 3) {
                const first = swipeHistory[0];
                const last = swipeHistory[swipeHistory.length - 1];
                const dt = (last.t - first.t) / 1000;
                const dx = last.x - first.x;
                if (dt > 0.06 && dt < 0.28 && Math.abs(dx) > 0.22) {
                  const dir = dx > 0 ? 'right' : 'left';
                  performSpatialSwipe(dir);
                  swipeHistory = [];
                  showSpatialToast(`🖐️ Vuốt ${dir === 'left' ? 'tiến slide 👉' : 'lùi slide 👈'}!`, 'good');
                }
              }
            } else {
              swipeHistory = [];
            }

            const pipPill = document.getElementById('sv-pip-gesture-pill');
            const hudTag = document.getElementById('sv-hud-gesture-tag');
            let currentGesture = STATE.magneticTarget ? '🧲 ĐÃ HÚT NÚT BẤM' : `CAM · ${tierProfile.label}`;
            if (results.landmarks.length >= 2) currentGesture = '👐 2 TAY ZOOM 3D';
            else if (isPinchNow) currentGesture = '👌 PINCH CLICK';
            else if (isTwoFingerScroll) currentGesture = '✌️ CUỘN 2 NGÓN';
            else if (isFist) currentGesture = '✊ NẮM KÉO TRANG';
            else if (isPointOnly && !STATE.magneticTarget) currentGesture = '☝️ TRỎ LASER';

            if (pipPill) {
              pipPill.textContent = currentGesture;
              pipPill.classList.toggle('active-gesture', true);
            }
            if (hudTag) hudTag.textContent = currentGesture.slice(0, 12);
          } else {
            clearMagneticHighlight();
            const pipPill = document.getElementById('sv-pip-gesture-pill');
            if (pipPill) {
              pipPill.textContent = '⏳ CHỜ BÀN TAY...';
              pipPill.classList.remove('active-gesture');
            }
          }
        } catch (infErr) {}
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    }

    animationFrameId = requestAnimationFrame(renderLoop);
  }

  function openMotionLabDialog() {
    const isSub = location.pathname.includes('/3dtouch/');
    window.open(isSub ? 'dieukhien.html' : '3dtouch/dieukhien.html', '_blank');
  }

  function openAirShareDialog() {
    if (typeof window.openAirShareModal === 'function') {
      window.openAirShareModal();
      return;
    }
    const isSub = location.pathname.includes('/3dtouch/');
    window.open(isSub ? 'share.html' : '3dtouch/share.html', '_blank');
  }

  function openTutorialDialog() {
    const isSub = location.pathname.includes('/3dtouch/');
    window.open(isSub ? 'tutorial.html' : '3dtouch/tutorial.html', '_blank');
  }

  function openPhoneConnectModal() {
    const isSub = location.pathname.includes('/3dtouch/');
    window.open(isSub ? '../phone.html' : 'phone.html', '_blank');
  }

  function updateHudForceMeter(forceRatio, label) {
    const bar = document.getElementById('sv-hud-force-bar');
    const tag = document.getElementById('sv-hud-gesture-tag');
    if (bar) bar.style.width = `${Math.round(clamp(forceRatio) * 100)}%`;
    if (tag && label) tag.textContent = label;
  }

  function connectLanRemoteBridge() {
    if (typeof EventSource === 'undefined') return;
    try {
      const evtSource = new EventSource('/api/3dtouch/stream');
      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (!data || !data.type || data.type === 'desktop_connected') return;
          if (!STATE.active) startSpatialTouch(false, false);

          if (data.type === 'pointer' || data.type === 'move') {
            updateLaserPosition(clamp(data.x) * window.innerWidth, clamp(data.y) * window.innerHeight);
          } else if (data.type === 'click' || data.type === 'tap') {
            performSpatialClick(laserScreenX / window.innerWidth, laserScreenY / window.innerHeight);
          } else if (data.type === 'swipe') {
            performSpatialSwipe(data.direction);
          } else if (data.type === 'next_slide') {
            performSpatialSwipe('left');
          } else if (data.type === 'prev_slide') {
            performSpatialSwipe('right');
          }
        } catch (err) {}
      };
    } catch (err) {}
  }

  function bindPageTriggers() {
    document.querySelectorAll('[data-sv-touch-open], [data-sv-touch-toggle], #open-hand-control, #btn3DTouchTop, #floatingQuickCamAi').forEach(btn => {
      if (btn.dataset.svBound === '1') return;
      btn.dataset.svBound = '1';
      btn.removeAttribute('onclick'); // Tránh kích hoạt kép
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (STATE.active) stopSpatialTouch();
        else startSpatialTouch(false, true);
      });
    });
  }

  function setupSpatialCore() {
    injectSpatialStyles();
    createSpatialElements();
    bindPageTriggers();
    connectLanRemoteBridge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSpatialCore);
  } else {
    setupSpatialCore();
  }
})();