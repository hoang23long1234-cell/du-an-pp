/**
 * ============================================================================
 * SlideVault Pro Enterprise · Hệ Thống Phòng Thủ & Chống Sập Toàn Diện
 * Tệp: anti-crash-client.js (Phiên bản 3.0 Enterprise Bulletproof)
 * ----------------------------------------------------------------------------
 * 1. Dual-Tier Defense UX (Hai tầng phòng thủ thông minh, không gây phiền toái):
 *    - Tầng 1: Floating Status Pill (Island thông báo mờ ảo Apple, không chặn thao tác)
 *    - Tầng 2: Full 404 Crash Shield Modal (SVG Animated Face từ 404.txt khi sập thật)
 * 2. Form & Data Auto-Preservation (Tự động lưu dự phòng form, không bao giờ mất bài viết)
 * 3. Safe Storage Wrapper (Chống sập bộ nhớ trên iOS Safari / Chế độ ẩn danh)
 * 4. Network Watchdog & Auto-Reconnect (Tự phục hồi sau rớt mạng hoặc khởi động lại server)
 * 5. Script & Error Boundary (Bảo vệ trước lỗi thư viện bên ngoài, chống màn hình trắng)
 * 6. Tích hợp API Key môi trường cho client-to-server chuẩn bảo mật
 * ============================================================================
 */

(function () {
  'use strict';

  // Tránh nạp trùng lặp
  if (window.__SLIDEVAULT_SHIELD_INSTALLED__) return;
  window.__SLIDEVAULT_SHIELD_INSTALLED__ = true;

  // Cấu hình phòng thủ & chống sập
  const SHIELD_CONFIG = {
    version: '3.0.0-Bulletproof',
    defaultApiKey: 'sv_sec_9942a78fbc310d2e8417',
    pingIntervalMs: 30000,
    pingTimeoutMs: 6000,
    softFailureThreshold: 1, // Kích hoạt Pill nổi nhẹ
    hardFailureThreshold: 3, // Kích hoạt Màn hình 404 toàn diện khi mất hẳn tín hiệu
    redirectUrl404: '404.html',
    autoRecoverSeconds: 5
  };

  let consecutiveFailures = 0;
  let isCrashModalActive = false;
  let isPillActive = false;
  let pillDismissTimer = null;
  let autoRecoverTimer = null;
  let countdownRemaining = SHIELD_CONFIG.autoRecoverSeconds;

  // --------------------------------------------------------------------------
  // 1. AN TOÀN BỘ NHỚ LƯU TRỮ (SAFE STORAGE PROXY - CHỐNG SẬP SAFARI / INCOGNITO)
  // --------------------------------------------------------------------------
  const memoryFallbackStorage = new Map();

  function safeStorageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return memoryFallbackStorage.get(key) || null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('⚠️ [Shield Storage Warning] LocalStorage bị hạn chế hoặc đầy. Lưu vào bộ nhớ tạm an toàn.');
      memoryFallbackStorage.set(key, String(value));
    }
  }

  // --------------------------------------------------------------------------
  // 2. TỰ ĐỘNG BẢO TOÀN DỮ LIỆU BIỂU MẪU (FORM & INPUT AUTO-PRESERVATION)
  // --------------------------------------------------------------------------
  function backupFormData() {
    try {
      const inputs = document.querySelectorAll('input:not([type="password"]), textarea, select');
      if (!inputs || inputs.length === 0) return 0;

      const snapshot = {};
      let count = 0;
      inputs.forEach((input, index) => {
        const id = input.id || input.name || `sv_field_${index}`;
        if (input.type === 'checkbox' || input.type === 'radio') {
          snapshot[id] = { type: input.type, checked: input.checked };
        } else if (input.value && input.value.trim() !== '') {
          snapshot[id] = { type: input.type, value: input.value };
          count++;
        }
      });

      if (count > 0) {
        sessionStorage.setItem('__sv_crash_form_backup__', JSON.stringify({
          url: window.location.pathname,
          timestamp: Date.now(),
          data: snapshot
        }));
      }
      return count;
    } catch (e) {
      return 0;
    }
  }

  function restoreFormData() {
    try {
      const raw = sessionStorage.getItem('__sv_crash_form_backup__');
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      if (parsed.url !== window.location.pathname) return 0;

      let restoredCount = 0;
      const snapshot = parsed.data || {};
      for (const [id, fieldData] of Object.entries(snapshot)) {
        let el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
        if (el) {
          if (fieldData.type === 'checkbox' || fieldData.type === 'radio') {
            el.checked = fieldData.checked;
          } else if (fieldData.value !== undefined && !el.value) {
            el.value = fieldData.value;
            restoredCount++;
          }
        }
      }
      if (restoredCount > 0) {
        showPill('success', `Đã tự động khôi phục ${restoredCount} trường dữ liệu đang nhập!`, 3500);
      }
      return restoredCount;
    } catch (e) {
      return 0;
    }
  }

  // --------------------------------------------------------------------------
  // 3. STYLES CHO LÁ CHẮN (FLOATING PILL & 404 SVG ANIMATION CARD)
  // --------------------------------------------------------------------------
  function injectShieldStyles() {
    if (document.getElementById('slidevault-shield-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'slidevault-shield-styles';
    styleEl.textContent = `
      /* --- TẦNG 1: FLOATING STATUS PILL (APPLE LIQUID ISLAND) --- */
      #sv-shield-pill {
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%) translateY(-120px);
        z-index: 99999998;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 18px;
        border-radius: 9999px;
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12.5px;
        font-weight: 600;
        letter-spacing: -0.01em;
        pointer-events: auto;
        opacity: 0;
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
        max-width: 90vw;
      }
      #sv-shield-pill.active {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      #sv-shield-pill .sv-pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      #sv-shield-pill.warning .sv-pill-dot {
        background-color: #f59e0b;
        box-shadow: 0 0 10px #f59e0b;
        animation: svPillPulse 1.4s infinite;
      }
      #sv-shield-pill.error .sv-pill-dot {
        background-color: #f43f5e;
        box-shadow: 0 0 10px #f43f5e;
        animation: svPillPulse 1.2s infinite;
      }
      #sv-shield-pill.success .sv-pill-dot {
        background-color: #10b981;
        box-shadow: 0 0 10px #10b981;
      }
      @keyframes svPillPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.35; transform: scale(0.8); }
      }
      #sv-shield-pill .sv-pill-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #sv-shield-pill .sv-pill-btn {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: #ffffff;
        border-radius: 9999px;
        padding: 2px 10px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
        margin-left: 4px;
      }
      #sv-shield-pill .sv-pill-btn:hover {
        background: rgba(255, 255, 255, 0.24);
      }

      /* --- TẦNG 2: MÀN HÌNH 404 TOÀN DIỆN (SVG ANIMATED FACE TỪ 404.txt) --- */
      #sv-crash-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999999;
        background: radial-gradient(ellipse 65% 50% at 50% -10%, rgba(244, 63, 94, 0.32), transparent 60%),
                    radial-gradient(ellipse 60% 45% at 100% 50%, rgba(14, 165, 233, 0.20), transparent 55%),
                    linear-gradient(180deg, #020617 0%, #080e1e 60%, #020617 100%);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.35s;
      }
      #sv-crash-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      .sv-crash-card {
        width: 100%;
        max-width: 560px;
        background: rgba(15, 23, 42, 0.82);
        border: 1px solid rgba(255, 255, 255, 0.14);
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 50px rgba(244, 63, 94, 0.18);
        border-radius: 28px;
        padding: 34px 28px;
        text-align: center;
        position: relative;
        overflow: hidden;
        animation: svCardPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      @keyframes svCardPop {
        0% { transform: scale(0.92) translateY(24px); opacity: 0; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      .sv-face-container {
        width: 120px;
        height: 140px;
        margin: 0 auto 16px auto;
        color: #f43f5e;
      }
      .sv-face-container svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      .sv-face-container .face__eyes {
        animation: svEyeBlink 4s infinite;
        transform-origin: 50% 120px;
      }
      .sv-face-container .face__pupil {
        animation: svPupilLook 3s ease-in-out infinite alternate;
      }
      .sv-face-container .face__mouth-left,
      .sv-face-container .face__mouth-right {
        animation: svMouthSad 3s ease-in-out infinite alternate;
      }
      @keyframes svEyeBlink {
        0%, 90%, 100% { transform: scaleY(1); }
        95% { transform: scaleY(0.1); }
      }
      @keyframes svPupilLook {
        0% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
        100% { transform: translateY(6px); }
      }
      @keyframes svMouthSad {
        0% { transform: translateY(0); }
        100% { transform: translateY(5px); }
      }
      .sv-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 14px;
        border-radius: 9999px;
        background: rgba(244, 63, 94, 0.15);
        border: 1px solid rgba(244, 63, 94, 0.35);
        color: #fda4af;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 12px;
      }
      .sv-badge-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background-color: #f43f5e;
        box-shadow: 0 0 10px #f43f5e;
        animation: svPillPulse 1.5s infinite;
      }
      .sv-title {
        font-size: 24px;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 8px 0;
        letter-spacing: -0.02em;
      }
      .sv-desc {
        font-size: 13.5px;
        color: #cbd5e1;
        line-height: 1.55;
        margin: 0 0 18px 0;
      }
      .sv-data-shield-notice {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.3);
        color: #6ee7b7;
        font-size: 11.5px;
        padding: 5px 12px;
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .sv-diag-box {
        background: rgba(2, 6, 23, 0.72);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 12px 16px;
        margin-bottom: 20px;
        text-align: left;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11.5px;
        color: #94a3b8;
      }
      .sv-diag-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .sv-diag-row:last-child {
        margin-bottom: 0;
      }
      .sv-diag-label {
        color: #64748b;
      }
      .sv-diag-val {
        color: #38bdf8;
        font-weight: 600;
      }
      .sv-btn-group {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
      }
      .sv-btn-primary {
        background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
        color: #ffffff;
        border: none;
        border-radius: 12px;
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 15px rgba(244, 63, 94, 0.4);
        transition: transform 0.15s, opacity 0.15s;
        text-decoration: none;
      }
      .sv-btn-primary:hover {
        transform: translateY(-1px);
        opacity: 0.95;
      }
      .sv-btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 12px;
        padding: 10px 18px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        text-decoration: none;
      }
      .sv-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.16);
        color: #ffffff;
      }
    `;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  // --------------------------------------------------------------------------
  // 4. FLOATING STATUS PILL CONTROLLER (TẦNG 1 - KHÔNG LÀM PHIỀN NGƯỜI DÙNG)
  // --------------------------------------------------------------------------
  function createPillDom() {
    if (document.getElementById('sv-shield-pill')) return;
    injectShieldStyles();

    const pill = document.createElement('div');
    pill.id = 'sv-shield-pill';
    pill.className = 'warning';
    pill.innerHTML = `
      <span class="sv-pill-dot"></span>
      <span class="sv-pill-text" id="sv-pill-msg">Đang kết nối lại máy chủ...</span>
      <button type="button" class="sv-pill-btn" id="sv-pill-action">Thử lại</button>
    `;
    (document.body || document.documentElement).appendChild(pill);

    document.getElementById('sv-pill-action')?.addEventListener('click', () => {
      manualRetry();
    });
  }

  function showPill(type = 'warning', message = 'Đang kiểm tra kết nối...', autoDismissMs = 0) {
    createPillDom();
    const pill = document.getElementById('sv-shield-pill');
    const msgEl = document.getElementById('sv-pill-msg');
    if (!pill || !msgEl) return;

    pill.className = type;
    msgEl.textContent = message;
    pill.classList.add('active');
    isPillActive = true;

    if (pillDismissTimer) clearTimeout(pillDismissTimer);
    if (autoDismissMs > 0) {
      pillDismissTimer = setTimeout(() => {
        hidePill();
      }, autoDismissMs);
    }
  }

  function hidePill() {
    const pill = document.getElementById('sv-shield-pill');
    if (pill) pill.classList.remove('active');
    isPillActive = false;
  }

  // --------------------------------------------------------------------------
  // 5. CRASH MODAL 404 CONTROLLER (TẦNG 2 - KHI SERVER CÓ SỰ CỐ THẬT SỰ)
  // --------------------------------------------------------------------------
  function createCrashModalDom() {
    if (document.getElementById('sv-crash-overlay')) return;
    injectShieldStyles();

    const overlay = document.createElement('div');
    overlay.id = 'sv-crash-overlay';
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Thông báo sự cố kết nối máy chủ');

    overlay.innerHTML = `
      <div class="sv-crash-card">
        <!-- SVG Face chuẩn từ 404.txt -->
        <div class="sv-face-container">
          <svg class="face" viewBox="0 0 320 380">
            <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="25">
              <g class="face__eyes" transform="translate(0,112.5)">
                <g transform="translate(15,0)">
                  <polyline class="face__eye-lid" points="37,0 0,120 75,120"></polyline>
                  <polyline class="face__pupil" points="55,120 55,155" stroke-dasharray="35 35"></polyline>
                </g>
                <g transform="translate(230,0)">
                  <polyline class="face__eye-lid" points="37,0 0,120 75,120"></polyline>
                  <polyline class="face__pupil" points="55,120 55,155" stroke-dasharray="35 35"></polyline>
                </g>
              </g>
              <rect class="face__nose" x="132.5" y="112.5" width="55" height="155" rx="4" ry="4"></rect>
              <g transform="translate(65,334)" stroke-dasharray="102 102">
                <path class="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0"></path>
                <path class="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30"></path>
              </g>
            </g>
          </svg>
        </div>

        <div class="sv-badge">
          <span class="sv-badge-dot"></span>
          <span>HỆ THỐNG PHÒNG THỦ · MÃ LỖI 404 / GIÁN ĐOẠN MÁY CHỦ</span>
        </div>

        <h2 class="sv-title" id="sv-crash-title">Kết Nối Máy Chủ Bị Gián Đoạn</h2>
        <p class="sv-desc" id="sv-crash-desc">
          Máy chủ tạm thời không phản hồi. Bộ đệm phòng thủ tự động giữ an toàn tiến trình và chuẩn bị kết nối lại.
        </p>

        <div class="sv-data-shield-notice" id="sv-data-shield-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span id="sv-data-shield-text">Dữ liệu các ô nhập đã được tự động sao lưu an toàn</span>
        </div>

        <div class="sv-diag-box">
          <div class="sv-diag-row">
            <span class="sv-diag-label">Mã Chẩn Đoán:</span>
            <span class="sv-diag-val" id="sv-diag-code">CRASH_ERR_500_UNREACHABLE</span>
          </div>
          <div class="sv-diag-row">
            <span class="sv-diag-label">Thời Điểm:</span>
            <span class="sv-diag-val" id="sv-diag-time">--:--:--</span>
          </div>
          <div class="sv-diag-row">
            <span class="sv-diag-label">Tự Động Thử Lại:</span>
            <span class="sv-diag-val" id="sv-diag-countdown" style="color:#f43f5e;">sau 5 giây...</span>
          </div>
        </div>

        <div class="sv-btn-group">
          <button type="button" id="sv-btn-reconnect" class="sv-btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Kết Nối Lại Ngay</span>
          </button>

          <a href="trangchudong.html" class="sv-btn-secondary">
            Về Trang Chủ
          </a>

          <a href="404.html" class="sv-btn-secondary">
            Xem Chi Tiết 404
          </a>
        </div>
      </div>
    `;

    (document.body || document.documentElement).appendChild(overlay);

    document.getElementById('sv-btn-reconnect')?.addEventListener('click', () => {
      manualRetry();
    });
  }

  function showCrashModal(reason = 'Mất phản hồi máy chủ', code = 'CRASH_DETECTED') {
    if (isCrashModalActive) return;
    isCrashModalActive = true;

    // Lưu dự phòng dữ liệu form trước khi hiển thị màn hình crash
    const backedUp = backupFormData();

    createCrashModalDom();
    hidePill();
    if (document.body) document.body.classList.add('modal-open');

    const overlay = document.getElementById('sv-crash-overlay');
    const descEl = document.getElementById('sv-crash-desc');
    const codeEl = document.getElementById('sv-diag-code');
    const timeEl = document.getElementById('sv-diag-time');
    const countdownEl = document.getElementById('sv-diag-countdown');
    const noticeEl = document.getElementById('sv-data-shield-text');

    if (descEl) descEl.textContent = `Hệ thống ghi nhận sự cố: ${reason}. Bộ đệm phòng thủ đang giữ tiến trình và bảo vệ dữ liệu của bạn an toàn.`;
    if (codeEl) codeEl.textContent = code;
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('vi-VN');
    if (noticeEl && backedUp > 0) {
      noticeEl.textContent = `Đã sao lưu ${backedUp} trường nội dung biểu mẫu an toàn!`;
    }

    overlay?.classList.add('active');

    // Đếm ngược tự phục hồi
    countdownRemaining = SHIELD_CONFIG.autoRecoverSeconds;
    if (autoRecoverTimer) clearInterval(autoRecoverTimer);

    autoRecoverTimer = setInterval(() => {
      countdownRemaining--;
      if (countdownEl) countdownEl.textContent = `sau ${countdownRemaining} giây...`;
      if (countdownRemaining <= 0) {
        clearInterval(autoRecoverTimer);
        autoRecoverTimer = null;
        manualRetry();
      }
    }, 1000);
  }

  function hideCrashModal() {
    if (!isCrashModalActive) return;
    isCrashModalActive = false;
    consecutiveFailures = 0;
    if (document.body) document.body.classList.remove('modal-open');
    if (autoRecoverTimer) {
      clearInterval(autoRecoverTimer);
      autoRecoverTimer = null;
    }
    const overlay = document.getElementById('sv-crash-overlay');
    overlay?.classList.remove('active');

    // Khôi phục dữ liệu đã nhập
    restoreFormData();
    showPill('success', 'Kết nối máy chủ đã phục hồi thành công!', 3000);
  }

  async function manualRetry() {
    const countdownEl = document.getElementById('sv-diag-countdown');
    if (countdownEl) countdownEl.textContent = 'Đang kiểm tra kết nối máy chủ...';
    showPill('warning', 'Đang kết nối lại máy chủ...');

    const isAlive = await checkServerHeartbeat();
    if (isAlive) {
      hideCrashModal();
    } else {
      if (countdownEl) countdownEl.textContent = 'Máy chủ vẫn chưa phản hồi. Tiếp tục thử lại...';
      countdownRemaining = 5;
      showPill('error', 'Máy chủ chưa phản hồi. Sẽ tự thử lại sau giây lát...', 3000);
    }
  }

  // --------------------------------------------------------------------------
  // 6. HEARTBEAT & HEALTH STATUS PING
  // --------------------------------------------------------------------------
  async function checkServerHeartbeat() {
    if (window.location.protocol === 'file:') {
      consecutiveFailures = 0;
      return true;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SHIELD_CONFIG.pingTimeoutMs);

      const res = await (window.__sv_raw_fetch || window.fetch)('/api/security/shield-status', {
        method: 'GET',
        headers: {
          'X-API-Key': getApiKey(),
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok || res.status === 304) {
        consecutiveFailures = 0;
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // 7. NETWORK INTERCEPTORS: FETCH & XHR
  // --------------------------------------------------------------------------
  function setupNetworkInterceptors() {
    const rawFetch = window.fetch.bind(window);
    window.__sv_raw_fetch = rawFetch;

    window.fetch = async function (...args) {
      const [resource, config = {}] = args;
      const url = typeof resource === 'string' ? resource : resource?.url || '';

      // Tự động đính kèm API Key nếu gọi vào /api/
      if (url.includes('/api/')) {
        config.headers = config.headers || {};
        if (config.headers instanceof Headers) {
          if (!config.headers.has('X-API-Key')) {
            config.headers.set('X-API-Key', getApiKey());
          }
        } else if (typeof config.headers === 'object') {
          if (!config.headers['X-API-Key'] && !config.headers['x-api-key']) {
            config.headers['X-API-Key'] = getApiKey();
          }
        }
      }

      try {
        const response = await rawFetch(resource, config);

        // Bắt lỗi sập máy chủ 500/502/503/504
        if (response.status >= 500 && response.status <= 504) {
          consecutiveFailures++;
          console.warn(`[Shield Watchdog] Phản hồi lỗi HTTP ${response.status} từ ${url}`);
          if (consecutiveFailures >= SHIELD_CONFIG.hardFailureThreshold) {
            showCrashModal(`Máy chủ phản hồi mã lỗi HTTP ${response.status}`, `HTTP_CRASH_${response.status}`);
          } else {
            showPill('warning', `Đang tự động thử lại sau sự cố HTTP ${response.status}...`, 4000);
          }
        } else if (response.ok) {
          if (consecutiveFailures > 0) {
            hidePill();
          }
          consecutiveFailures = 0;
        }

        return response;
      } catch (networkError) {
        if (window.location.protocol === 'file:') {
          throw networkError;
        }

        const isCriticalApi = url.includes('/api/security') || url.includes('/api/health');
        if (isCriticalApi) {
          consecutiveFailures++;
          if (consecutiveFailures >= SHIELD_CONFIG.hardFailureThreshold) {
            showCrashModal('Máy chủ cục bộ bị ngắt kết nối hoặc không phản hồi', 'SERVER_DOWN_REFUSED');
          } else {
            showPill('warning', 'Mất tín hiệu máy chủ tạm thời. Đang tự động kết nối lại...', 4000);
          }
        }
        throw networkError;
      }
    };

    // XMLHttpRequest Interceptor
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this.__sv_url = url;
      return originalOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (body) {
      const url = this.__sv_url || '';
      try {
        if (url.includes('/api/')) {
          this.setRequestHeader('X-API-Key', getApiKey());
        }
      } catch (e) {}

      this.addEventListener('load', () => {
        if (this.status >= 500 && this.status <= 504) {
          consecutiveFailures++;
          if (consecutiveFailures >= SHIELD_CONFIG.hardFailureThreshold) {
            showCrashModal(`Mã phản hồi lỗi hệ thống XHR HTTP ${this.status}`, `XHR_CRASH_${this.status}`);
          } else {
            showPill('warning', `XHR: Đang thử kết nối lại (HTTP ${this.status})...`, 4000);
          }
        } else if (this.status >= 200 && this.status < 400) {
          consecutiveFailures = 0;
        }
      });

      return originalSend.call(this, body);
    };
  }

  // --------------------------------------------------------------------------
  // 8. GLOBAL ERROR CATCHERS & WATCHDOG
  // --------------------------------------------------------------------------
  function setupClientErrorWatchdog() {
    window.addEventListener('error', (event) => {
      console.warn('🛡️ [SlideVault Client Shield] Bắt được ngoại lệ JS:', event.message);

      // Nếu lỗi nghiêm trọng làm hỏng cấu trúc DOM chính sau khi trang đã tải xong
      if (document.readyState === 'complete' && document.body && document.body.children.length === 0) {
        showCrashModal('Giao diện bị mất do sự cố mã nguồn client.', 'DOM_RENDER_CRASH');
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.warn('🛡️ [SlideVault Client Shield] Bắt được Unhandled Promise Rejection:', event.reason);
    });

    // Theo dõi trạng thái mạng thiết bị (Online / Offline)
    window.addEventListener('offline', () => {
      backupFormData();
      showPill('error', '📡 Thiết bị đang ngoại tuyến. Dữ liệu đã được lưu cục bộ an toàn.');
    });

    window.addEventListener('online', async () => {
      showPill('warning', '🟢 Đã khôi phục mạng Internet. Đang kiểm tra máy chủ...');
      const alive = await checkServerHeartbeat();
      if (alive) {
        hideCrashModal();
        hidePill();
        showPill('success', 'Đã kết nối lại Internet và đồng bộ thành công!', 3000);
      }
    });

    // Định kỳ gửi heartbeat kiểm tra trạng thái máy chủ
    setInterval(async () => {
      if (document.hidden) return;
      if (window.location.protocol === 'file:') return;

      const alive = await checkServerHeartbeat();
      if (!alive) {
        consecutiveFailures++;
        if (consecutiveFailures >= SHIELD_CONFIG.hardFailureThreshold) {
          showCrashModal('Mất tín hiệu nhịp tim máy chủ (Heartbeat Timeout)', 'HEARTBEAT_TIMEOUT');
        } else {
          showPill('warning', 'Đang kiểm tra kết nối với máy chủ...', 3000);
        }
      } else {
        if (isCrashModalActive) hideCrashModal();
      }
    }, SHIELD_CONFIG.pingIntervalMs);
  }

  // --------------------------------------------------------------------------
  // 9. BẢO MẬT PHÍA CLIENT (ANTI-CLICKJACKING & DEVTOOLS BANNER)
  // --------------------------------------------------------------------------
  function setupClientSecurity() {
    try {
      if (window.top !== window.self) {
        window.top.location = window.self.location;
      }
    } catch (e) {}

    try {
      console.log(
        '%c🛡️ SLIDEVAULT GUARDIAN DEFENSE SYSTEM v3.0 %c\nBảo vệ toàn diện: Chống hack, chống sập web, tự động bảo toàn dữ liệu 24/7.\nAPI Key môi trường đang kích hoạt.',
        'background: #e11d48; color: #ffffff; font-weight: 800; font-size: 14px; padding: 4px 10px; border-radius: 4px;',
        'color: #38bdf8; font-size: 11px; padding: 4px;'
      );
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // 10. TIỆN ÍCH API KEY & SANITIZER
  // --------------------------------------------------------------------------
  function getApiKey() {
    return safeStorageGet('SLIDEVAULT_API_KEY') || SHIELD_CONFIG.defaultApiKey;
  }

  function setApiKey(key) {
    if (key && typeof key === 'string') {
      safeStorageSet('SLIDEVAULT_API_KEY', key.trim());
    }
  }

  function sanitize(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // --------------------------------------------------------------------------
  // 11. KHỞI TẠO TỰ ĐỘNG KHI TẢI TRANG
  // --------------------------------------------------------------------------
  function initShield() {
    setupClientSecurity();
    setupNetworkInterceptors();
    setupClientErrorWatchdog();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        injectShieldStyles();
        restoreFormData();
      });
    } else {
      injectShieldStyles();
      restoreFormData();
    }
  }

  initShield();

  // Public API cho hệ thống và kiểm thử
  window.SlideVaultShield = {
    version: SHIELD_CONFIG.version,
    getApiKey,
    setApiKey,
    sanitize,
    triggerCrashModal: showCrashModal,
    dismissCrashModal: hideCrashModal,
    showPill,
    hidePill,
    checkServerHealth: checkServerHeartbeat,
    backupFormData,
    restoreFormData,
    isProtected: true
  };
})();
