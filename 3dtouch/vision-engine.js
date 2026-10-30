/* ============================================================================
 * SlideVault Vision Engine v2.5 — MediaPipe Tasks Vision (Dual-Hand + Pose)
 * ========================================================================== */
(() => {
  'use strict';
  if (window.SlideVaultVision && window.SlideVaultVision.version >= 2.5) return;

  const CDN = {
    tasks: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14',
    wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
    hand: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    pose: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
  };

  class OneEuroFilter {
    constructor({ minCutoff = 1.2, beta = 0.05, dCutoff = 1.0 } = {}) {
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
      this.x = this.x == null ? value : a * value + (1 - a) * this.x;
      this.t = timestamp;
      return this.x;
    }
    reset() { this.x = null; this.dx = 0; this.t = null; }
  }

  class Point2Filter {
    constructor(opts) { this.fx = new OneEuroFilter(opts); this.fy = new OneEuroFilter(opts); }
    filter(p, t) {
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
      return { x: this.fx.filter(p.x, t), y: this.fy.filter(p.y, t) };
    }
    reset() { this.fx.reset(); this.fy.reset(); }
  }

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
        if (absY > absX * 1.5) dir = dy < 0 ? FingerDirection.VerticalDown : FingerDirection.VerticalUp;
        else if (absX > absY * 1.5) dir = dx > 0 ? FingerDirection.HorizontalLeft : FingerDirection.HorizontalRight;
        else dir = dy >= 0 ? (dx > 0 ? FingerDirection.DiagonalUpLeft : FingerDirection.DiagonalUpRight) : (dx > 0 ? FingerDirection.DiagonalDownLeft : FingerDirection.DiagonalDownRight);
        directions[finger] = dir;
      }
      return { curls, directions };
    }
  }

  async function getUserMediaOptimized(facing = 'user') {
    const steps = [
      { width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 60, min: 30 } },
      { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 60, min: 30 } },
    ];
    for (const step of steps) {
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: facing, ...step } });
      } catch (e) {}
    }
    return await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: facing } });
  }

  async function loadVisionTasks({ withPose = false } = {}) {
    const mod = await import(CDN.tasks);
    const { FilesetResolver, HandLandmarker, PoseLandmarker } = mod;
    const fileset = await FilesetResolver.forVisionTasks(CDN.wasm);
    const tryCreate = async (delegate) => ({
      hand: await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: CDN.hand, delegate },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      }),
      pose: withPose
        ? await PoseLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: CDN.pose, delegate },
            runningMode: 'VIDEO',
            numPoses: 1,
          })
        : null,
      delegate,
    });
    try { return await tryCreate('GPU'); } catch { return await tryCreate('CPU'); }
  }

  class GestureFSM {
    constructor(cb = () => {}, opts = {}) {
      this.cb = cb;
      this.estimator = new FingerPoseEstimator();
      this.cfg = {
        pinchOn: 0.40, pinchOff: 0.52,
        pinchClickMs: 320,
        grabHoldMs: 130,
        swipeMinSpan: 0.18,
        swipeMaxMs: 400,
        swipeCooldownMs: 550,
        airDropMinSpeed: 1.35,
        scrollSensitivity: 1500,
        ...opts,
      };
      this.reset();
    }
    reset() {
      this.state = 'idle';
      this.lastPinchAt = 0;
      this.grabStartedAt = 0;
      this.swipe = null;
      this.lastSwipeAt = 0;
      this.lastPos = null;
      this.lastTwoFingerY = null;
      this.velocity = { x: 0, y: 0, z: 0 };
    }
    update(landmarks, now) {
      if (!Array.isArray(landmarks) || landmarks.length < 21) {
        if (this.state !== 'idle') {
          this.cb({ type: 'lost', at: now });
          this.reset();
        }
        return;
      }
      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const middleMcp = landmarks[9];
      const handSpan = Math.max(1e-4, Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y));
      const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

      const pose = this.estimator.estimate(landmarks);
      const isIndexNoCurl = pose.curls[Finger.Index] === FingerCurl.NoCurl;
      const isMiddleNoCurl = pose.curls[Finger.Middle] === FingerCurl.NoCurl;
      const isRingCurled = pose.curls[Finger.Ring] !== FingerCurl.NoCurl;
      const isPinkyCurled = pose.curls[Finger.Pinky] !== FingerCurl.NoCurl;

      const extended = [8, 12, 16, 20].map((tip, i) => d(landmarks[tip], wrist) > d(landmarks[[5, 9, 13, 17][i]], wrist) * 1.12);
      const extendedCount = extended.filter(Boolean).length;
      const pinchDist = d(thumbTip, indexTip);
      const pinchRatio = pinchDist / handSpan;
      const pointer = { x: 1 - indexTip.x, y: indexTip.y };

      if (this.lastPos && this.lastPos.t < now) {
        const dt = Math.max(0.016, (now - this.lastPos.t) / 1000);
        this.velocity = {
          x: (pointer.x - this.lastPos.x) / dt,
          y: (pointer.y - this.lastPos.y) / dt,
          z: ((indexTip.z || 0) - this.lastPos.z) / dt,
        };
      }
      this.lastPos = { ...pointer, z: indexTip.z || 0, t: now };

      const isPinch = pinchRatio < (this.state === 'pinch' ? this.cfg.pinchOff : this.cfg.pinchOn) || pinchDist < 0.048;
      const isFist = !isPinch && extendedCount === 0;
      const isTwoFingers = !isPinch && isIndexNoCurl && isMiddleNoCurl && isRingCurled && isPinkyCurled;
      const isOpen = !isPinch && extendedCount >= 3;

      if (isTwoFingers) {
        const avgY = (indexTip.y + middleTip.y) * 0.5;
        if (this.lastTwoFingerY !== null) {
          const deltaY = (avgY - this.lastTwoFingerY) * this.cfg.scrollSensitivity;
          if (Math.abs(deltaY) > 2) this.cb({ type: 'scroll', deltaY, pointer, x: pointer.x, y: pointer.y, at: now });
        }
        this.lastTwoFingerY = avgY;
      } else {
        this.lastTwoFingerY = null;
      }

      // Phát đồng thời cả `pointer` và `x, y` để tương thích 100% với cả AI.html và phone.html
      this.cb({
        type: 'move',
        pointer,
        x: pointer.x,
        y: pointer.y,
        extendedCount,
        pinch: isPinch,
        fist: isFist,
        pose,
      });

      if (isPinch && this.state !== 'pinch' && now - this.lastPinchAt > this.cfg.pinchClickMs) {
        this.cb({ type: 'click', pointer, x: pointer.x, y: pointer.y, at: now });
        this.lastPinchAt = now;
      }

      if (isFist) {
        if (!this.grabStartedAt) this.grabStartedAt = now;
        if (this.state !== 'grab' && now - this.grabStartedAt >= this.cfg.grabHoldMs) {
          this.state = 'grab';
          this.cb({ type: 'grab', pointer, x: pointer.x, y: pointer.y, at: now });
        }
      } else if (this.state === 'grab' && (isOpen || isPinch)) {
        const speed = Math.hypot(this.velocity.x, this.velocity.y);
        const forward = this.velocity.z < -0.9;
        this.cb({
          type: speed >= this.cfg.airDropMinSpeed || forward ? 'air-drop' : 'release',
          pointer,
          x: pointer.x,
          y: pointer.y,
          speed,
          at: now,
        });
        this.state = 'idle';
        this.grabStartedAt = 0;
      } else if (isOpen) {
        if (!this.swipe) this.swipe = { x: pointer.x, y: pointer.y, t: now };
        const dx = pointer.x - this.swipe.x;
        const dy = pointer.y - this.swipe.y;
        const elapsed = now - this.swipe.t;
        if (elapsed > this.cfg.swipeMaxMs) {
          this.swipe = { x: pointer.x, y: pointer.y, t: now };
        } else if (now - this.lastSwipeAt > this.cfg.swipeCooldownMs) {
          const horizontal = Math.abs(dx) >= Math.abs(dy);
          const span = horizontal ? Math.abs(dx) : Math.abs(dy);
          if (span >= this.cfg.swipeMinSpan) {
            const direction = horizontal ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            this.cb({ type: 'swipe', direction, pointer, x: pointer.x, y: pointer.y, span, at: now });
            this.lastSwipeAt = now;
            this.swipe = null;
          }
        }
        if (this.state !== 'grab') this.state = 'open';
      } else {
        this.swipe = null;
        if (this.state !== 'grab') this.state = isPinch ? 'pinch' : 'idle';
      }
      if (!isFist && this.state !== 'grab') this.grabStartedAt = 0;
    }
  }

  const HAND_BONES = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
    [9, 10], [10, 11], [11, 12], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17],
  ];

  class VisionEngine {
    constructor(opts = {}) {
      this.opts = { withPose: false, preferHigh: true, facing: 'user', ...opts };
      this.video = opts.video || null;
      this.canvas = opts.canvas || null;
      this.onEvent = typeof opts.onEvent === 'function' ? opts.onEvent : () => {};
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.tasks = null;
      this.stream = null;
      this.running = false;
      this.fps = 0;
      this._frames = 0;
      this._fpsAt = 0;
      this._smoother = new Point2Filter({ minCutoff: 1.5, beta: 0.05 });
      this.fsm = new GestureFSM((event) => {
        if (event.type === 'move') {
          const smoothed = this._smoother.filter(event.pointer, performance.now()) || event.pointer;
          event.pointer = smoothed;
          event.x = smoothed.x;
          event.y = smoothed.y;
        }
        this.emit(event);
      });
      this._boundLoop = this.loop.bind(this);
    }

    emit(event) { try { this.onEvent(event); } catch {} }

    async init() {
      if (this.tasks) return this;
      const ready = await loadVisionTasks({ withPose: this.opts.withPose });
      this.tasks = { hand: ready.hand, pose: ready.pose };
      this.delegate = ready.delegate;
      return this;
    }

    async start(existingStream) {
      if (this.running) return this;
      this.stream = existingStream || await getUserMediaOptimized(this.opts.facing);
      if (this.video) {
        this.video.srcObject = this.stream;
        this.video.muted = true;
        this.video.playsInline = true;
        try { await this.video.play(); } catch {}
      }
      this.running = true;
      requestAnimationFrame(this._boundLoop);
      return this;
    }

    loop(now) {
      if (!this.running) return;
      requestAnimationFrame(this._boundLoop);
      const video = this.video;
      if (!video || video.readyState < 2 || document.hidden) return;
      let handResult = null;
      try {
        handResult = this.tasks.hand.detectForVideo(video, performance.now());
      } catch {}
      this._frames += 1;
      if (now - this._fpsAt >= 500) {
        this.fps = Math.round((this._frames * 1000) / Math.max(1, now - this._fpsAt));
        this._frames = 0;
        this._fpsAt = now;
        this.emit({ type: 'stats', fps: this.fps });
      }
      const landmarks = handResult?.landmarks?.[0] || null;
      this.fsm.update(landmarks, now);
      this.drawOverlay(landmarks);
    }

    drawOverlay(landmarks) {
      if (!this.ctx || !this.canvas) return;
      const width = this.video?.videoWidth || 640;
      const height = this.video?.videoHeight || 480;
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      const ctx = this.ctx;
      ctx.clearRect(0, 0, width, height);
      if (!landmarks) return;
      const toPx = (p) => ({ x: (1 - p.x) * width, y: p.y * height });
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      for (const [a, b] of HAND_BONES) {
        const pa = toPx(landmarks[a]);
        const pb = toPx(landmarks[b]);
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
      landmarks.forEach((point, index) => {
        const px = toPx(point);
        const isTip = index === 8 || index === 4;
        ctx.beginPath();
        ctx.arc(px.x, px.y, isTip ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isTip ? '#10b981' : '#f8fafc';
        ctx.fill();
      });
    }

    dispose() {
      this.stop();
      this.tasks?.hand?.close?.();
      this.tasks?.pose?.close?.();
      this.tasks = null;
    }

    stop() {
      this.running = false;
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = null;
      if (this.video) this.video.srcObject = null;
    }
  }

  window.SlideVaultVision = Object.assign(window.SlideVaultVision || {}, {
    version: 2.5,
    VisionEngine,
    HAND_BONES,
    GestureFSM,
    OneEuroFilter,
    Point2Filter,
    create: async (opts = {}) => new VisionEngine(opts).init(),
  });
})();