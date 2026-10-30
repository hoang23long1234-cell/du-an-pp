/* ============================================================================
 * SlideVault Hand 3D — bàn tay 3D phát sáng cho trang hướng dẫn (tutorial)
 * ----------------------------------------------------------------------------
 * • Live mode : nhận 21 landmark từ vision-engine và render bàn tay realtime
 * • Demo mode : diễn lại động tác người thật (vẫy, chỉ, chụm, nắm-ném, vuốt)
 * • Không phụ thuộc framework — chỉ cần Three.js (nạp từ CDN hoặc bản cục bộ)
 *
 *   const hand = await SlideVaultHand3D.mount(el, { mode: 'demo' });
 *   hand.playDemo('wave'); hand.setLandmarks(lms); hand.dispose();
 * ========================================================================== */
(() => {
  'use strict';
  if (window.SlideVaultHand3D) return;

  const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

  // Xương bàn tay theo chuẩn MediaPipe (21 điểm)
  const BONES = [
    [0, 1], [1, 2], [2, 3], [3, 4],            // ngón cái
    [0, 5], [5, 6], [6, 7], [7, 8],            // ngón trỏ
    [0, 9], [9, 10], [10, 11], [11, 12],       // ngón giữa (thêm nối từ cổ tay lên gốc ngón giữa)
    [0, 13], [13, 14], [14, 15], [15, 16],     // ngón áp út (thêm nối từ cổ tay lên gốc ngón áp út)
    [0, 17], [17, 18], [18, 19], [19, 20],     // ngón út
    [5, 9], [9, 13], [13, 17],                 // lòng bàn tay
  ];
  const JOINTS = Array.from({ length: 21 }, (_, i) => i);

  async function loadThree() {
    if (window.__SlideVaultThree) return window.__SlideVaultThree;
    try {
      const mod = await import(THREE_CDN);
      window.__SlideVaultThree = mod;
      return mod;
    } catch {
      return null;
    }
  }

  function makeGlowTexture(THREE, color) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(0.35, color.replace(')', ', .45)').replace('rgb', 'rgba'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  const MINT = 'rgb(183, 243, 107)';
  const CYAN = 'rgb(118, 214, 209)';

  function getDeviceTier() {
    try {
      const cores = navigator.hardwareConcurrency || 4;
      const ram = navigator.deviceMemory || 4;
      if (cores <= 4 || ram <= 3) return 'low';
      if (cores >= 8 && ram >= 8) return 'ultra';
      return 'mid';
    } catch {
      return 'mid';
    }
  }

  function buildHand(THREE) {
    const tier = getDeviceTier();
    const segs = tier === 'low' ? 8 : (tier === 'ultra' ? 18 : 14);
    const boneSegs = tier === 'low' ? 6 : (tier === 'ultra' ? 12 : 8);

    const group = new THREE.Group();
    const jointGeo = new THREE.SphereGeometry(0.045, segs, segs);
    const indexTipGeo = new THREE.SphereGeometry(0.068, segs, segs);
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0xb7f36b, emissive: 0x4c7a1f, emissiveIntensity: 0.85, roughness: 0.35, metalness: 0.15,
    });
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0x76d6d1, emissive: 0x1f6f6a, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.2,
    });
    const indexPointerMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.3,
    });
    const joints = JOINTS.map((i) => {
      let geo = jointGeo;
      let mat = jointMat;
      if (i === 8) {
        geo = indexTipGeo;
        mat = indexPointerMat;
      } else if (i === 4) {
        mat = tipMat;
      }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.index = i;
      group.add(mesh);
      return mesh;
    });
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0x9bea74, transparent: true, opacity: 0.65, roughness: 0.4, metalness: 0.1,
    });
    const bones = BONES.map(() => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, boneSegs), boneMat);
      group.add(mesh);
      return mesh;
    });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(THREE, MINT), transparent: true, opacity: tier === 'low' ? 0.35 : 0.5, depthWrite: false,
    }));
    glow.scale.setScalar(2.4);
    group.add(glow);

    function update(landmarks, mirror = true) {
      const pts = landmarks.map((p) => {
        const x = (mirror ? 1 - p.x : p.x) - 0.5;
        const y = 0.5 - p.y;
        const z = (p.z || 0) * (mirror ? -1 : 1);
        return new THREE.Vector3(x * 2.6, y * 2.6, z * 2.6);
      });
      joints.forEach((mesh, i) => pts[i] && mesh.position.copy(pts[i]));
      bones.forEach((mesh, i) => {
        const a = pts[BONES[i][0]];
        const b = pts[BONES[i][1]];
        if (!a || !b) return;
        const dir = new THREE.Vector3().subVectors(b, a);
        const len = Math.max(1e-4, dir.length());
        mesh.position.copy(a).addScaledVector(dir, 0.5);
        mesh.scale.set(1, len, 1);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      });
      const palm = pts[9];
      if (palm) glow.position.copy(palm);
    }

    return { group, update, glow, joints, bones };
  }

  /* ------------------------------------------------------------------ *
   * synthHand — sinh 21 landmark tổng hợp (bàn tay người mô phỏng)
   * cho các động tác demo: vẫy / chỉ / chụm / nắm-ném / vuốt
   * ------------------------------------------------------------------ */
  function synthHand({ folded = [false, false, false, false], pinch = 0, isPointMode = false, offset = { x: 0, y: 0 }, scale = 1, rot = 0 } = {}) {
    const deg = (a) => (a * Math.PI) / 180;
    const pts = [];
    const push = (x, y, z = 0) => {
      const rx = x * Math.cos(rot) - y * Math.sin(rot);
      const ry = x * Math.sin(rot) + y * Math.cos(rot);
      pts.push({ x: 0.5 + (rx * scale + offset.x), y: 0.5 - (ry * scale + offset.y), z: z * scale });
    };
    // 0 wrist
    push(0, -0.32, 0);

    // 1..4 ngón cái
    if (isPointMode) {
      // Khi chỉ ngón: ngón cái mở tự nhiên tạo thành góc chữ L với ngón trỏ rõ ràng
      push(-0.11, -0.22, 0.02);
      push(-0.18, -0.14, 0.04);
      push(-0.23, -0.07, 0.05);
      push(-0.25, 0.01, 0.06);
    } else {
      const thumbSwing = pinch * 0.09;
      push(-0.09, -0.24, 0.01);
      push(-0.15, -0.16 + pinch * 0.04, 0.02);
      push(-0.17 + thumbSwing * 1.6, -0.08 + pinch * 0.07, 0.03);
      push(-0.16 + thumbSwing * 2.2, -0.01 + pinch * 0.1, 0.04);
    }

    // 5..8 ngón trỏ (Index)
    // 9..12 ngón giữa (Middle)
    // 13..16 ngón áp út (Ring)
    // 17..20 ngón út (Pinky)
    const chains = [
      { mcp: [-0.08, -0.05], seg: 0.095 }, // ngón trỏ dài và vươn cao
      { mcp: [-0.01, -0.06], seg: 0.095 }, // ngón giữa
      { mcp: [0.05, -0.05], seg: 0.088 },  // ngón áp út
      { mcp: [0.1, -0.03], seg: 0.075 },   // ngón út
    ];

    chains.forEach((chain, fingerIdx) => {
      const isFolded = folded[fingerIdx];
      const pinchFinger = fingerIdx === 0 ? pinch : 0;
      let [x, y] = chain.mcp;
      let z = 0.005;
      push(x, y, z);
      for (let seg = 0; seg < 3; seg += 1) {
        if (isFolded) {
          // Gập sâu cuộn tròn hẳn vào lòng bàn tay (y tụt xuống âm, z lùi hẳn ra sau)
          const foldStep = chain.seg * 0.32;
          x += foldStep * (fingerIdx === 1 ? 0.15 : 0.25);
          y -= foldStep * 0.6;
          z -= 0.032;
          push(x, y, z);
        } else {
          // Duỗi thẳng vươn cao về phía trước (ngón trỏ Laser)
          const step = chain.seg * (1 - pinchFinger * 0.5);
          x += step * 0.08;
          y += step * 1.05;
          z += 0.01;
          push(x, y, z);
        }
      }
    });

    // Kéo đầu ngón trỏ về phía ngón cái khi chụm
    if (pinch > 0) {
      const thumbTip = pts[4];
      const indexTip = pts[8];
      pts[8] = {
        x: indexTip.x + (thumbTip.x - indexTip.x) * pinch * 0.85,
        y: indexTip.y + (thumbTip.y - indexTip.y) * pinch * 0.85,
        z: indexTip.z,
      };
    }
    return pts;
  }
  function hasPalmCurve(bend) { return bend ? 0.55 : 0; }

  const DEMO_SPEED = { wave: 0.55, point: 0.5, pinch: 0.6, grabThrow: 0.7, swipe: 0.8, scroll: 0.65, thumbsUp: 0.5 };

  /** Tạo hàm cập nhật landmark theo thời gian cho từng động tác. */
  function makeDemo(name) {
    return (timeSec) => {
      const t = timeSec;
      switch (name) {
        case 'wave': {
          const sway = Math.sin(t * 2.4) * 0.14;
          return synthHand({ offset: { x: sway, y: 0.02 }, rot: Math.sin(t * 2.4) * 0.18 });
        }
        case 'point': {
          return synthHand({
            folded: [false, true, true, true],
            isPointMode: true,
            offset: { x: Math.sin(t * 0.9) * 0.08, y: Math.cos(t * 0.8) * 0.03 + 0.02 },
            rot: -0.42 + Math.sin(t * 0.9) * 0.04,
          });
        }
        case 'scroll': {
          // Cử chỉ 2 ngón cuộn trang (ngón trỏ + ngón giữa duỗi thẳng, lướt lên xuống như trackpad)
          const scrollMotion = Math.sin(t * 2.8) * 0.09;
          return synthHand({
            folded: [false, false, true, true],
            offset: { x: 0.01, y: scrollMotion + 0.02 },
            rot: -0.25 + Math.sin(t * 2.8) * 0.03,
          });
        }
        case 'thumbsUp': {
          // Cử chỉ ngón cái giơ lên (Thumbs up - Toàn màn hình)
          const bounce = Math.sin(t * 2.0) * 0.03;
          return synthHand({
            folded: [true, true, true, true],
            offset: { x: -0.02, y: bounce + 0.02 },
            rot: 0.58,
          });
        }
        case 'pinch': {
          const p = (Math.sin(t * 2.1) + 1) / 2;
          return synthHand({ pinch: p, offset: { x: 0.01, y: 0.01 } });
        }
        case 'grabThrow': {
          const cycle = t * 1.15 % 2;
          if (cycle < 0.85) {
            const close = Math.min(1, cycle / 0.25);
            return synthHand({
              folded: [close > 0.5, close > 0.5, close > 0.5, close > 0.5],
              offset: { x: -0.06 + cycle * 0.08, y: 0 },
              scale: 1 - close * 0.08,
            });
          }
          const openT = Math.min(1, (cycle - 0.85) / 0.5);
          return synthHand({
            folded: [false, false, false, false],
            scale: 0.92 + openT * 0.35,
            offset: { x: 0.01, y: 0.04 + openT * 0.03 },
          });
        }
        case 'swipe': {
          const phase = t * DEMO_SPEED.swipe % 1.6;
          const x = phase < 0.8 ? -0.16 + phase * 0.42 : 0.18 - (phase - 0.8) * 0.42;
          return synthHand({ offset: { x, y: 0.02 }, rot: 0.1 });
        }
        default:
          return synthHand({});
      }
    };
  }

  /* ------------------------------------------------------------------ *
   * mount() — dựng sân khấu 3D + vòng lặp render
   * opts: { mode: 'demo'|'live', demo: 'wave'|'point'|'pinch'|'grabThrow'|'swipe',
   *         autoRotate: bool, bg: css color }
   * ------------------------------------------------------------------ */
  async function mount(el, opts = {}) {
    const THREE = await loadThree();
    if (!THREE || !el) return null;
    const { mode = 'demo', demo = 'wave', autoRotate = true } = opts;

    const width = el.clientWidth || 360;
    const height = el.clientHeight || 360;
    const tier = getDeviceTier();
    const renderer = new THREE.WebGLRenderer({
      antialias: tier !== 'low',
      alpha: true,
      powerPreference: tier === 'low' ? 'low-power' : 'high-performance'
    });
    renderer.setPixelRatio(tier === 'low' ? 1 : Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('aria-label', 'Bàn tay 3D minh họa cử chỉ');
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 4.6);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xbfc9ff, 0.55));
    const key = new THREE.PointLight(0xb7f36b, 2.1, 30);
    key.position.set(1.6, 2.4, 3.2);
    scene.add(key);
    const rim = new THREE.PointLight(0x76d6d1, 1.4, 30);
    rim.position.set(-2.4, -1.2, 2.4);
    scene.add(rim);

    const hand = buildHand(THREE);
    scene.add(hand.group);
    hand.group.scale.setScalar(0.92);
    hand.group.position.y = -0.05;

    let animator = mode === 'live' ? null : makeDemo(demo);
    let disposed = false;
    const clock = new THREE.Clock();

    const resizeObserver = new ResizeObserver(() => {
      const w = el.clientWidth || width;
      const h = el.clientHeight || height;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(el);

    let rafId = 0;
    const tick = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();
      if (animator) hand.update(animator(t));
      if (autoRotate) {
        const targetY = Math.sin(t * 0.45) * 0.35 + 0.05;
        hand.group.rotation.y += (targetY - hand.group.rotation.y) * 0.04;
        hand.group.rotation.x = Math.sin(t * 0.3) * 0.06;
      }
      hand.glow.material.opacity = 0.38 + Math.sin(t * 2.2) * 0.12;
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return {
      setLandmarks(landmarks) {
        if (!disposed && Array.isArray(landmarks) && landmarks.length >= 21) hand.update(landmarks);
      },
      playDemo(name) { animator = makeDemo(name); },
      setLive() { animator = null; },
      get three() { return THREE; },
      dispose() {
        disposed = true;
        cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        renderer.dispose();
        if (renderer.domElement.parentElement) renderer.domElement.parentElement.removeChild(renderer.domElement);
      },
    };
  }

  window.SlideVaultHand3D = Object.assign(window.SlideVaultHand3D || {}, {
    synthHand,
    makeDemo,
    mount,
  });
})();


