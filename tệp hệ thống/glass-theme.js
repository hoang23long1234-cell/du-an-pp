/**
 * ============================================================================
 * SlideVault Pro · Master Glass & Typography Engine (glass-theme.js)
 * ----------------------------------------------------------------------------
 * Handles:
 *   1. Glass Transparency, Blur, Border & Font real-time customization
 *   2. apply.txt button integration & cross-tab synchronization
 *   3. nut.txt switch integration for UI preferences
 *   4. lỗi.txt luxury error alert toast system
 *   5. 404.txt animated face web crash & downtime detection
 *   6. timeline.txt audio & presentation timeline track player
 * ============================================================================
 */
(() => {
  'use strict';

  // Available high-end typography with full Vietnamese support
  const FONT_OPTIONS = [
    { id: 'Be Vietnam Pro', name: 'Be Vietnam Pro (Chuẩn Quốc Tế)', category: 'Thanh lịch, hiện đại', family: "'Be Vietnam Pro', sans-serif" },
    { id: 'Space Grotesk', name: 'Space Grotesk (Tech Tương Lai)', category: 'Sắc sảo, Keynote Tech', family: "'Space Grotesk', sans-serif" },
    { id: 'Plus Jakarta Sans', name: 'Plus Jakarta Sans (SaaS)', category: 'Chuẩn giao diện Apple/Figma', family: "'Plus Jakarta Sans', sans-serif" },
    { id: 'Inter', name: 'Inter (Tối Giản Siêu Nét)', category: 'Tối giản, độ đọc hoàn hảo', family: "'Inter', sans-serif" },
    { id: 'Outfit', name: 'Outfit (Canva Magic Style)', category: 'Tròn trịa, cao cấp, sáng tạo', family: "'Outfit', sans-serif" },
    { id: 'Montserrat', name: 'Montserrat (Doanh Nghiệp VIP)', category: 'Hình học, sang trọng', family: "'Montserrat', sans-serif" },
    { id: 'Playfair Display', name: 'Playfair Display (Editorial)', category: 'Thơ mộng, nghệ thuật Serif', family: "'Playfair Display', serif" },
    { id: 'Lexend', name: 'Lexend (Thư Thái, Dễ Đọc)', category: 'Thoáng đãng, thân thiện mắt', family: "'Lexend', sans-serif" }
  ];

  const DEFAULT_SETTINGS = {
    opacity: 0.44,
    blur: 28,
    borderOpacity: 0.14,
    brightness: 1.0,
    fontId: 'Be Vietnam Pro',
    hwAccel: true,
    glassShimmer: true,
    crashMonitor: true
  };

  const STORAGE_KEY = 'slidevault_glass_theme_v2';
  const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('slidevault-theme-sync') : null;

  // --------------------------------------------------------------------------
  // 1. SETTINGS STORAGE & APPLICATION
  // --------------------------------------------------------------------------
  function getSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('[GlassTheme] Lỗi đọc settings:', e);
    }
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  function applySettings(settings, save = false) {
    if (!settings) settings = getSettings();

    const root = document.documentElement;
    root.style.setProperty('--sv-glass-opacity', String(settings.opacity));
    root.style.setProperty('--sv-glass-blur', `${settings.blur}px`);
    root.style.setProperty('--sv-glass-border-opacity', String(settings.borderOpacity));
    root.style.setProperty('--sv-glass-brightness', String(settings.brightness));

    const isLight = root.classList.contains('light') || root.getAttribute('data-theme') === 'light';
    const glassBg = isLight 
      ? `rgba(255, 255, 255, ${Math.min(0.72, settings.opacity * 1.35).toFixed(3)})` 
      : `rgba(10, 16, 28, ${Number(settings.opacity).toFixed(3)})`;
    root.style.setProperty('--sv-glass-bg', glassBg);

    const selectedFont = FONT_OPTIONS.find(f => f.id === settings.fontId) || FONT_OPTIONS[0];
    root.style.setProperty('--sv-font-family', selectedFont.family);

    if (document.body) {
      document.body.style.transform = '';
      document.body.style.backfaceVisibility = '';
    }

    if (save) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        if (syncChannel) {
          syncChannel.postMessage({ type: 'THEME_UPDATED', settings });
        }
      } catch (e) {
        console.warn('[GlassTheme] Lỗi lưu settings:', e);
      }
    }

    // Trigger local listeners
    window.dispatchEvent(new CustomEvent('sv-theme-applied', { detail: settings }));
  }

  // Cross-tab sync listeners
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'THEME_UPDATED') {
        applySettings(event.data.settings, false);
        updateModalInputsIfOpen(event.data.settings);
      }
    };
  }

  // Update glass colors on light/dark mode changes
  window.addEventListener('slidevault:themechange', () => {
    applySettings(getSettings(), false);
  });

  // Observer for attribute/class changes on html root
  if (typeof MutationObserver !== 'undefined') {
    const themeObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'class' || m.attributeName === 'data-theme') {
          applySettings(getSettings(), false);
          break;
        }
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  }

  // --------------------------------------------------------------------------
  // 2. LUXURY ERROR ALERT TOAST (FROM lỗi.txt)
  // --------------------------------------------------------------------------
  function ensureErrorToastContainer() {
    let container = document.getElementById('svErrorAlertContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'svErrorAlertContainer';
      container.className = 'sv-error-alert-wrapper';
      document.body.appendChild(container);
    }
    return container;
  }

  function showErrorAlert(title = 'Vui lòng thử lại', description = 'Đã xảy ra sự cố trong quá trình xử lý.', duration = 5000) {
    const container = ensureErrorToastContainer();
    const item = document.createElement('div');
    item.className = 'sv-error-alert-item';

    item.innerHTML = `
      <div class="error-alert">
        <div class="alert-icon-box">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"></path>
          </svg>
        </div>
        <div class="alert-content">
          <p class="alert-title">${escapeHtml(title)}</p>
          <p class="alert-desc">${escapeHtml(description)}</p>
        </div>
        <button type="button" class="alert-close-btn" aria-label="Đóng thông báo">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    const closeBtn = item.querySelector('.alert-close-btn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px) scale(0.95)';
        setTimeout(() => item.remove(), 250);
      };
    }

    container.appendChild(item);

    if (duration > 0) {
      setTimeout(() => {
        if (item.parentNode) {
          item.style.opacity = '0';
          item.style.transform = 'translateY(10px) scale(0.95)';
          setTimeout(() => item.remove(), 250);
        }
      }, duration);
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --------------------------------------------------------------------------
  // 3. WEB CRASH & DOWNTIME MONITOR (FROM 404.txt)
  // --------------------------------------------------------------------------
  let crashModalElement = null;
  let isCheckingHealth = false;
  let crashCheckInterval = null;

  function initWebCrashMonitor() {
    const settings = getSettings();
    if (!settings.crashMonitor) return;

    // Check on startup after 3s, then every 20s
    setTimeout(checkServerHealth, 3000);
    if (!crashCheckInterval) {
      crashCheckInterval = setInterval(checkServerHealth, 20000);
    }

    // Offline event
    window.addEventListener('offline', () => {
      showWebCrashModal('Mất Kết Nối Mạng Internet', 'Thiết bị của bạn đã bị ngắt kết nối mạng. Các tính năng đám mây và AI tạm thời ngừng.');
    });

    window.addEventListener('online', () => {
      checkServerHealth();
    });
  }

  async function checkServerHealth() {
    if (isCheckingHealth) return;
    isCheckingHealth = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/health', { method: 'GET', signal: controller.signal, cache: 'no-store' });
      clearTimeout(timeoutId);

      if (res.ok) {
        if (crashModalElement) {
          hideWebCrashModal();
          showErrorAlert('Đã Phục Hồi Kết Nối!', 'Máy chủ SlideVault đã hoạt động bình thường trở lại.', 3000);
        }
      } else {
        showWebCrashModal('Máy Chủ Báo Lỗi (' + res.status + ')', 'Dịch vụ gặp sự cố gián đoạn phản hồi từ hệ thống máy chủ.');
      }
    } catch (err) {
      if (err.name === 'AbortError' || !navigator.onLine || err.message.includes('Failed to fetch')) {
        showWebCrashModal('Máy Chủ Mất Kết Nối Hoặc Sập', 'Không thể gửi yêu cầu tới máy chủ SlideVault (Port 3000). Đang tự động kiểm tra phục hồi...');
      }
    } finally {
      isCheckingHealth = false;
    }
  }

  function showWebCrashModal(title, message) {
    if (crashModalElement) return;

    crashModalElement = document.createElement('div');
    crashModalElement.className = 'sv-crash-overlay';
    crashModalElement.id = 'svCrashOverlay';

    crashModalElement.innerHTML = `
      <div class="sv-crash-card">
        <!-- Animated Face from 404.txt -->
        <div class="my-custom-face-container mb-4">
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

        <h3 class="text-lg font-bold text-rose-400 mb-1">${escapeHtml(title)}</h3>
        <p class="text-xs text-slate-300 mb-5 leading-relaxed">${escapeHtml(message)}</p>

        <div class="flex items-center justify-center gap-3">
          <button type="button" id="svBtnRetryServer" class="apply-button-uiverse">
            <span>Thử Kết Nối Lại</span>
            <svg fill="currentColor" viewBox="0 0 24 24" class="icon">
              <path clip-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" fill-rule="evenodd"></path>
            </svg>
          </button>
          <button type="button" id="svBtnDismissCrash" class="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs text-slate-300 font-semibold cursor-pointer transition-all">
            Bỏ qua
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(crashModalElement);

    const retryBtn = document.getElementById('svBtnRetryServer');
    if (retryBtn) {
      retryBtn.onclick = async () => {
        retryBtn.innerHTML = `<span>Đang thử lại...</span>`;
        await checkServerHealth();
      };
    }

    const dismissBtn = document.getElementById('svBtnDismissCrash');
    if (dismissBtn) {
      dismissBtn.onclick = () => hideWebCrashModal();
    }
  }

  function hideWebCrashModal() {
    if (crashModalElement) {
      crashModalElement.remove();
      crashModalElement = null;
    }
  }

  // --------------------------------------------------------------------------
  // 4. FLOATING GLASS CUSTOMIZER MODAL (FROM glass.txt & apply.txt)
  // --------------------------------------------------------------------------
  let customizerModalEl = null;

  function openGlassCustomizerModal() {
    if (customizerModalEl) {
      customizerModalEl.style.display = 'block';
      return;
    }

    const s = getSettings();
    const modalWrapper = document.createElement('div');
    modalWrapper.id = 'svGlassCustomizerOverlay';
    modalWrapper.style.cssText = 'position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:16px;';

    modalWrapper.innerHTML = `
      <div class="glass-card animate-modal-in" id="svGlassCardInner">
        <!-- Header with Font Dropdown -->
        <div class="card-header">
          <div class="header-dropdown-container">
            <input type="checkbox" id="header-toggle" class="hidden-toggle" />
            <label for="header-toggle" class="header-dropdown" id="svFontDropdownLabel">
              <span class="icon-circle"></span>
              <span class="title" id="svSelectedFontName">${escapeHtml(s.fontId)}</span>
              <span class="arrow-down">▼</span>
            </label>
            <div class="dropdown-menu" id="svFontDropdownList">
              ${FONT_OPTIONS.map(f => `
                <div class="dropdown-item ${f.id === s.fontId ? 'active' : ''}" data-font="${f.id}">
                  <span>${f.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <span class="beta-tag">PRO</span>
          <button type="button" class="close-btn" id="svCloseGlassModal" aria-label="Đóng">✕</button>
        </div>

        <hr class="divider" />

        <!-- Control Group: Live Preview & Brightness -->
        <div class="control-group mb-3">
          <span class="group-label">Độ Sáng</span>
          <div class="light-controls">
            <div class="light-preview" id="svLightPreview">
              <div class="pin-icon">
                <svg class="torch-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v8m0 0l-3 4h6l-3-4zm0 8v4"></path>
                </svg>
              </div>
            </div>
            <div style="flex:1;">
              <div class="input-box">
                <span class="text-[10px] text-slate-400">Specular:</span>
                <span id="svBrightnessVal" class="font-bold text-sky-400">${Math.round(s.brightness * 100)}%</span>
              </div>
              <p class="text-[10px] text-slate-400">Tùy biến hiệu ứng phản quang bề mặt</p>
            </div>
          </div>
        </div>

        <!-- Sliders Container -->
        <div class="sliders-container">
          <!-- Slider 1: Transparency / Opacity -->
          <div class="slider-row">
            <label for="svSliderOpacity">Trong Suốt:</label>
            <div class="slider-wrapper">
              <input type="range" min="15" max="95" value="${Math.round(s.opacity * 100)}" id="svSliderOpacity" class="custom-slider" />
            </div>
            <div class="slider-content">
              <div class="slider-divider"></div>
              <span class="slider-value" id="svLabelOpacity">${Math.round(s.opacity * 100)}%</span>
            </div>
          </div>

          <!-- Slider 2: Blur -->
          <div class="slider-row">
            <label for="svSliderBlur">Độ Mờ (Blur):</label>
            <div class="slider-wrapper">
              <input type="range" min="0" max="40" value="${s.blur}" id="svSliderBlur" class="custom-slider" />
            </div>
            <div class="slider-content">
              <div class="slider-divider"></div>
              <span class="slider-value" id="svLabelBlur">${s.blur}px</span>
            </div>
          </div>

          <!-- Slider 3: Border Highlight -->
          <div class="slider-row">
            <label for="svSliderBorder">Viền Kính:</label>
            <div class="slider-wrapper">
              <input type="range" min="4" max="35" value="${Math.round(s.borderOpacity * 100)}" id="svSliderBorder" class="custom-slider" />
            </div>
            <div class="slider-content">
              <div class="slider-divider"></div>
              <span class="slider-value" id="svLabelBorder">${Math.round(s.borderOpacity * 100)}%</span>
            </div>
          </div>
        </div>

        <hr class="divider" />

        <!-- Switch Toggles (nut.txt) -->
        <div class="flex items-center justify-between text-xs mb-3">
          <span class="text-slate-300 font-semibold">Tăng tốc 120Hz:</span>
          <label class="switch">
            <input type="checkbox" id="svHwAccelCheck" class="checkbox" ${s.hwAccel ? 'checked' : ''} />
            <div class="slider"></div>
          </label>
        </div>

        <!-- Apply Button (apply.txt) -->
        <div class="flex items-center justify-between pt-2">
          <button type="button" id="svResetThemeBtn" class="text-xs text-slate-400 hover:text-white underline cursor-pointer">
            Mặc định
          </button>
          
          <button type="button" id="svApplyThemeBtn" class="apply-button-uiverse">
            <span>Áp Dụng Toàn Web</span>
            <svg fill="currentColor" viewBox="0 0 24 24" class="icon">
              <path clip-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" fill-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalWrapper);
    customizerModalEl = modalWrapper;

    // Attach listeners
    bindCustomizerEvents(modalWrapper);
  }

  function bindCustomizerEvents(wrapper) {
    const s = getSettings();
    let current = Object.assign({}, s);

    const sliderOpacity = wrapper.querySelector('#svSliderOpacity');
    const labelOpacity = wrapper.querySelector('#svLabelOpacity');
    const sliderBlur = wrapper.querySelector('#svSliderBlur');
    const labelBlur = wrapper.querySelector('#svLabelBlur');
    const sliderBorder = wrapper.querySelector('#svSliderBorder');
    const labelBorder = wrapper.querySelector('#svLabelBorder');
    const fontDropdownItems = wrapper.querySelectorAll('#svFontDropdownList .dropdown-item');
    const selectedFontName = wrapper.querySelector('#svSelectedFontName');
    const headerToggle = wrapper.querySelector('#header-toggle');
    const hwAccelCheck = wrapper.querySelector('#svHwAccelCheck');

    // Live preview on slide
    sliderOpacity.oninput = () => {
      current.opacity = Number(sliderOpacity.value) / 100;
      labelOpacity.textContent = `${sliderOpacity.value}%`;
      applySettings(current, false);
    };

    sliderBlur.oninput = () => {
      current.blur = Number(sliderBlur.value);
      labelBlur.textContent = `${sliderBlur.value}px`;
      applySettings(current, false);
    };

    sliderBorder.oninput = () => {
      current.borderOpacity = Number(sliderBorder.value) / 100;
      labelBorder.textContent = `${sliderBorder.value}%`;
      applySettings(current, false);
    };

    hwAccelCheck.onchange = () => {
      current.hwAccel = hwAccelCheck.checked;
      applySettings(current, false);
    };

    fontDropdownItems.forEach(item => {
      item.onclick = () => {
        const fontId = item.getAttribute('data-font');
        current.fontId = fontId;
        selectedFontName.textContent = fontId;
        fontDropdownItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (headerToggle) headerToggle.checked = false;
        applySettings(current, false);
      };
    });

    // Close button
    wrapper.querySelector('#svCloseGlassModal').onclick = () => {
      wrapper.style.display = 'none';
      applySettings(getSettings(), false); // Revert to saved if not applied
    };

    // Outside click close
    wrapper.onclick = (e) => {
      if (e.target === wrapper) {
        wrapper.style.display = 'none';
        applySettings(getSettings(), false);
      }
    };

    // Reset button
    wrapper.querySelector('#svResetThemeBtn').onclick = () => {
      current = Object.assign({}, DEFAULT_SETTINGS);
      sliderOpacity.value = Math.round(current.opacity * 100);
      labelOpacity.textContent = `${sliderOpacity.value}%`;
      sliderBlur.value = current.blur;
      labelBlur.textContent = `${current.blur}px`;
      sliderBorder.value = Math.round(current.borderOpacity * 100);
      labelBorder.textContent = `${sliderBorder.value}%`;
      selectedFontName.textContent = current.fontId;
      hwAccelCheck.checked = current.hwAccel;
      applySettings(current, true);
      showErrorAlert('Đã Khôi Phục!', 'Giao diện đã về cài đặt gốc chuẩn Obsidian Glass.', 3000);
    };

    // Apply Button (apply.txt)
    wrapper.querySelector('#svApplyThemeBtn').onclick = () => {
      applySettings(current, true);
      showErrorAlert('Áp Dụng Thành Công!', `Giao diện kính mờ & font chữ "${current.fontId}" đã được áp dụng toàn bộ hệ thống!`, 4000);
      setTimeout(() => {
        wrapper.style.display = 'none';
      }, 500);
    };
  }

  function updateModalInputsIfOpen(s) {
    if (!customizerModalEl || customizerModalEl.style.display === 'none') return;
    const sliderOpacity = customizerModalEl.querySelector('#svSliderOpacity');
    if (sliderOpacity) {
      sliderOpacity.value = Math.round(s.opacity * 100);
      customizerModalEl.querySelector('#svLabelOpacity').textContent = `${sliderOpacity.value}%`;
    }
    const sliderBlur = customizerModalEl.querySelector('#svSliderBlur');
    if (sliderBlur) {
      sliderBlur.value = s.blur;
      customizerModalEl.querySelector('#svLabelBlur').textContent = `${s.blur}px`;
    }
  }

  // Floating button launcher on bottom left
  function createFloatingLauncher() {
    // Disabled to avoid covering sidebar user profile; Theme controls are in topbar & sidebar
    return;
    if (document.getElementById('svThemeLauncherFab')) return;
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'svThemeLauncherFab';
    fab.className = 'sv-theme-launcher-fab';
    fab.title = 'Tùy chỉnh độ trong suốt Kính Mờ & Font Chữ Hệ Thống';
    fab.setAttribute('aria-label', 'Cài đặt giao diện kính mờ');
    fab.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a7 7 0 1 0 10 10"></path>
      </svg>
    `;
    fab.onclick = () => openGlassCustomizerModal();
    document.body.appendChild(fab);
  }

  // --------------------------------------------------------------------------
  // 5. PRESENTATION AUDIO & SLIDE TIMELINE (FROM timeline.txt)
  // --------------------------------------------------------------------------
  function createPresentationAudioCard(containerEl, tracks = []) {
    if (!containerEl) return;

    const defaultTracks = [
      { name: 'Khát Vọng Doanh Nhân (Epic Pitch)', artist: 'Hans Zimmer Vibes', id: 1 },
      { name: 'Lo-Fi Chill Thư Thái (Focus Flow)', artist: 'Lofi Girl Presentation', id: 2 },
      { name: 'Công Nghệ Tương Lai (Silicon Tech)', artist: 'Cyberwave Ambient', id: 3 }
    ];

    const playlist = tracks.length > 0 ? tracks : defaultTracks;

    containerEl.innerHTML = `
      <div class="timeline-spotify-card">
        <div class="currentplaying">
          <svg height="38px" width="38px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" class="spotify">
            <radialGradient gradientUnits="userSpaceOnUse" gradientTransform="translate(0 -534)" r="43.888" cy="572.064" cx="33.34" id="ipdIa4~cOclR8yt_ClW93a">
              <stop stop-color="#f4e9c3" offset="0"></stop><stop stop-color="#f8eecd" offset=".219"></stop>
              <stop stop-color="#fdf4dc" offset=".644"></stop><stop stop-color="#fff6e1" offset="1"></stop>
            </radialGradient>
            <path d="M51.03,37.34c0.16,0.98,1.08,1.66,2.08,1.66h5.39c2.63,0,4.75,2.28,4.48,4.96	C62.74,46.3,60.64,48,58.29,48H49c-1.22,0-2.18,1.08-1.97,2.34c0.16,0.98,1.08,1.66,2.08,1.66h8.39c1.24,0,2.37,0.5,3.18,1.32	C61.5,54.13,62,55.26,62,56.5c0,2.49-2.01,4.5-4.5,4.5h-49c-1.52,0-2.9-0.62-3.89-1.61C3.62,58.4,3,57.02,3,55.5	C3,52.46,5.46,50,8.5,50H14c1.22,0,2.18-1.08,1.97-2.34C15.81,46.68,14.89,44,13.89,44H5.5c-2.63,0-4.75-2.28-4.48-4.96	C1.26,36.7,3.36,35,5.71,35H8c1.71,0,3.09-1.43,3-3.16C10.91,30.22,9.45,29,7.83,29H4.5c-2.63,0-4.75-2.28-4.48-4.96	C0.26,21.7,2.37,20,4.71,20H20c0.83,0,1.58-0.34,2.12-0.88C22.66,18.58,23,17.83,23,17c0-1.66-1.34-3-3-3h-1.18	c-0.62-0.09-1.43,0-2.32,0h-9c-1.52,0-2.9-0.62-3.89-1.61S2,10.02,2,8.5C2,5.46,4.46,3,7.5,3h49c3.21,0,5.8,2.79,5.47,6.06	C61.68,11.92,60.11,14,57.24,14H52c-2.76,0-5,2.24-5,5c0,1.38,0.56,2.63,1.46,3.54C49.37,23.44,50.62,24,52,24h6.5	c3.21,0,5.8,2.79,5.47,6.06C63.68,32.92,61.11,35,58.24,35H53C51.78,35,50.82,36.08,51.03,37.34z" fill="url(#ipdIa4~cOclR8yt_ClW93a)"></path>
            <linearGradient gradientUnits="userSpaceOnUse" gradientTransform="translate(0 -534)" y2="590.253" y1="530.096" x2="32" x1="32" id="ipdIa4~cOclR8yt_ClW93b">
              <stop stop-color="#42d778" offset="0"></stop><stop stop-color="#3dca76" offset=".428"></stop><stop stop-color="#34b171" offset="1"></stop>
            </linearGradient>
            <path d="M57,32c0,12.837-9.663,23.404-22.115,24.837C33.942,56.942,32.971,57,32,57	c-1.644,0-3.25-0.163-4.808-0.471C15.683,54.298,7,44.163,7,32C7,18.192,18.192,7,32,7S57,18.192,57,32z" fill="url(#ipdIa4~cOclR8yt_ClW93b)"></path>
          </svg>
          <div>
            <p class="heading">Nhạc Nền Thuyết Trình AI</p>
            <p class="subheading">Đồng Bộ Nhịp Chuyển Slide</p>
          </div>
        </div>

        <div class="space-y-1" id="svAudioTrackList">
          ${playlist.map((track, idx) => `
            <div class="loader ${idx === 0 ? 'active-track' : ''}" data-track-id="${track.id}">
              <div class="song">
                <p class="name">${escapeHtml(track.name)}</p>
                <p class="artist">${escapeHtml(track.artist)}</p>
              </div>
              ${idx === 0 ? `
                <div class="loading">
                  <div class="load"></div><div class="load"></div><div class="load"></div><div class="load"></div>
                </div>
              ` : `
                <div class="play-btn-circle">▶</div>
              `}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Track click handlers
    const trackItems = containerEl.querySelectorAll('.loader');
    trackItems.forEach(item => {
      item.onclick = () => {
        trackItems.forEach(t => {
          t.classList.remove('active-track');
          const l = t.querySelector('.loading');
          if (l) l.outerHTML = '<div class="play-btn-circle">▶</div>';
        });
        item.classList.add('active-track');
        const playBtn = item.querySelector('.play-btn-circle');
        if (playBtn) {
          playBtn.outerHTML = `
            <div class="loading">
              <div class="load"></div><div class="load"></div><div class="load"></div><div class="load"></div>
            </div>
          `;
        }
        showErrorAlert('Phát Nhạc Thuyết Trình', `Đang phát bản nhạc: ${item.querySelector('.name')?.textContent}`, 3000);
      };
    });
  }

  // --------------------------------------------------------------------------
  // 7. TYPEWRITER ENGINE (TỰ GÕ CHỮ THÔNG MINH CHO CÂU LỆNH & TIÊU ĐỀ)
  // --------------------------------------------------------------------------
  const DEFAULT_PROMPTS = [
    'Tạo slide báo cáo kinh doanh Q4 chuyên nghiệp với biểu đồ tăng trưởng...',
    'Thiết kế Pitch Deck gọi vốn 3 triệu USD phong cách Apple Keynote...',
    'Kế hoạch ra mắt sản phẩm công nghệ AI năm 2026 với 10 slide sắc nét...',
    'Slide bài giảng ứng dụng Trí tuệ nhân tạo thế hệ mới cho sinh viên...',
    'Chiến lược Marketing Đa kênh Omnichannel & Tối ưu hóa tỷ lệ chuyển đổi...'
  ];

  function runTypewriter(target, phrases = DEFAULT_PROMPTS, options = {}) {
    if (!target) return;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    const typingSpeed = options.typingSpeed || 55;
    const deletingSpeed = options.deletingSpeed || 30;
    const pauseDelay = options.pauseDelay || 2500;
    
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function tick() {
      const currentPhrase = phrases[phraseIndex % phrases.length];
      if (isDeleting) {
        charIndex--;
      } else {
        charIndex++;
      }

      const textToShow = currentPhrase.substring(0, charIndex);

      if (isInput) {
        target.setAttribute('placeholder', textToShow);
      } else {
        let textSpan = target.querySelector('.sv-typewriter-text');
        if (!textSpan) {
          target.innerHTML = `<span class="sv-typewriter-text"></span><span class="sv-typewriter-cursor"></span>`;
          textSpan = target.querySelector('.sv-typewriter-text');
        }
        textSpan.textContent = textToShow;
      }

      let timeout = isDeleting ? deletingSpeed : typingSpeed;

      if (!isDeleting && charIndex === currentPhrase.length) {
        timeout = pauseDelay;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex++;
        timeout = 400;
      }

      setTimeout(tick, timeout);
    }

    tick();
  }

  function initTypewriters() {
    // 1. Tự gõ vào các phần tử có thuộc tính [data-typewriter]
    document.querySelectorAll('[data-typewriter]').forEach(el => {
      if (el.dataset.hasTypewriter === 'true' || el.__typewriterAttached) return;
      el.dataset.hasTypewriter = 'true';
      el.__typewriterAttached = true;

      let customPhrases = DEFAULT_PROMPTS;
      try {
        const raw = el.dataset.typewriterPhrases || 
                    el.dataset.typewriterWords || 
                    el.getAttribute('data-typewriter-phrases') || 
                    el.getAttribute('data-typewriter-words');
        if (raw) {
          customPhrases = typeof raw === 'string' ? JSON.parse(raw) : raw;
        }
      } catch (e) {}
      runTypewriter(el, customPhrases);
    });

    // 2. Tự gõ vào placeholder của ô tìm kiếm / AI prompt nếu có
    const aiPromptInputs = document.querySelectorAll('#aiPromptInput, #heroPromptInput, input[data-ai-prompt-input], textarea[data-ai-prompt-input]');
    aiPromptInputs.forEach(input => {
      if (!input.dataset.hasTypewriter && !input.__typewriterAttached) {
        input.dataset.hasTypewriter = 'true';
        input.__typewriterAttached = true;
        runTypewriter(input, DEFAULT_PROMPTS);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 8. INITIALIZATION ON DOM READY
  // --------------------------------------------------------------------------
  function init() {
    applySettings(getSettings(), false);
    initWebCrashMonitor();
    initTypewriters();

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons(window.lucide.icons ? { icons: window.lucide.icons } : undefined);
      } catch (e) {}
    }

    // Floating Theme Launcher
    if (document.body && !document.getElementById('svThemeLauncherFab')) {
      createFloatingLauncher();
    }

    // Tự động nạp Auth State Synchronizer (Supabase Identity)
    if (!window.SlideVaultAuth && !document.getElementById('svAuthStateScript') && !document.querySelector('script[src*="auth-state.js"]')) {
      const authScript = document.createElement('script');
      authScript.id = 'svAuthStateScript';
      const isSubdir = window.location.pathname.includes('/3dtouch/');
      authScript.src = (isSubdir ? '../' : '') + 'tệp hệ thống/auth-state.js';
      document.head.appendChild(authScript);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Global Export
  window.SlideVaultTheme = {
    getSettings,
    applySettings,
    showErrorAlert,
    showWebCrashModal,
    hideWebCrashModal,
    openGlassCustomizerModal,
    createPresentationAudioCard,
    FONT_OPTIONS
  };

  window.SlideVaultTypewriter = runTypewriter;

  // Universal SlideVault Core Bridge (Fixes broken onclick="SlideVault.user.logout()" on all pages)
  window.SlideVault = window.SlideVault || {};
  window.SlideVault.user = window.SlideVault.user || {
    logout: () => {
      if (window.SlideVaultAuth && typeof window.SlideVaultAuth.logout === 'function') {
        window.SlideVaultAuth.logout();
      } else {
        localStorage.removeItem('slidevault_current_user');
        window.location.href = 'dangnhap.html';
      }
    },
    get: () => {
      try {
        return (window.SlideVaultAuth && window.SlideVaultAuth.getUser()) ||
               JSON.parse(localStorage.getItem('slidevault_current_user') || 'null');
      } catch (e) {
        return null;
      }
    }
  };

  // Safe SlideVaultUI Bridge (Unified Debounced Master Engine)
  window.SlideVaultUI = window.SlideVaultUI || window.SlideVault || {};
  let _lastDrawerToggleTime = 0;

  window.SlideVaultUI.setDrawerOpen = (open) => {
    const sidebar = document.querySelector('[data-sidebar], #saasAppSidebar, #appSidebar');
    const backdrop = document.querySelector('[data-sidebar-backdrop]');
    if (!sidebar) return;
    if (open) {
      sidebar.classList.add('sidebar-open', 'drawer-open');
      sidebar.classList.remove('-translate-x-full');
      if (backdrop) {
        backdrop.classList.remove('hidden');
        backdrop.style.opacity = '1';
        backdrop.style.visibility = 'visible';
        backdrop.style.pointerEvents = 'auto';
      }
      document.body.classList.add('sidebar-drawer-open', 'drawer-open', 'mobile-drawer-open');
    } else {
      sidebar.classList.remove('sidebar-open', 'drawer-open');
      sidebar.classList.add('-translate-x-full');
      if (backdrop) {
        backdrop.style.opacity = '0';
        backdrop.style.visibility = 'hidden';
        backdrop.style.pointerEvents = 'none';
      }
      document.body.classList.remove('sidebar-drawer-open', 'drawer-open', 'mobile-drawer-open');
    }
  };

  window.SlideVaultUI.toggleDrawer = () => {
    const now = Date.now();
    if (now - _lastDrawerToggleTime < 180) return;
    _lastDrawerToggleTime = now;
    const sidebar = document.querySelector('[data-sidebar], #saasAppSidebar, #appSidebar');
    if (!sidebar) return;
    const isOpen = sidebar.classList.contains('sidebar-open') || sidebar.classList.contains('drawer-open') || document.body.classList.contains('sidebar-drawer-open');
    window.SlideVaultUI.setDrawerOpen(!isOpen);
  };

  // Sync alias
  if (window.SlideVault) {
    window.SlideVault.setDrawerOpen = window.SlideVaultUI.setDrawerOpen;
    window.SlideVault.toggleDrawer = window.SlideVaultUI.toggleDrawer;
  }

// ============================================================================
  // MASTER COLLAPSIBLE SIDEBAR ENGINE (SlideVault Desktop & Tablet Rails)
  // ============================================================================
  const SIDEBAR_COLLAPSED_KEY = 'slidevault_sidebar_collapsed';

  function isSidebarCollapsed() {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function setSidebarCollapsed(collapsed) {
    if (window.innerWidth < 1024) {
      // Mobile & Tablet drawer close
      if (window.SlideVaultUI && typeof window.SlideVaultUI.setDrawerOpen === 'function') {
        window.SlideVaultUI.setDrawerOpen(false);
      }
      return;
    }

    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
      document.documentElement.classList.add('sidebar-collapsed-early');
    } else {
      document.body.classList.remove('sidebar-collapsed');
      document.documentElement.classList.remove('sidebar-collapsed-early');
    }

    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
    } catch (e) {}

    // Update title on all collapse buttons
    document.querySelectorAll('[data-sidebar-collapse-btn], .sidebar-collapse-btn').forEach(btn => {
      btn.setAttribute('title', collapsed ? 'Mở rộng thanh bên (Ctrl+B)' : 'Thu gọn thanh bên (Ctrl+B)');
      btn.setAttribute('aria-label', collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên');
    });

    window.dispatchEvent(new CustomEvent('slidevault:sidebarcollapse', { detail: { collapsed } }));
    window.dispatchEvent(new Event('resize'));
  }

  function toggleSidebarCollapse() {
    if (window.innerWidth < 1024) {
      if (window.SlideVaultUI && typeof window.SlideVaultUI.toggleDrawer === 'function') {
        window.SlideVaultUI.toggleDrawer();
      }
      return;
    }
    const currentlyCollapsed = document.body.classList.contains('sidebar-collapsed');
    setSidebarCollapsed(!currentlyCollapsed);
  }

  function initCollapsibleSidebar() {
    if (window.innerWidth >= 1024 && isSidebarCollapsed()) {
      document.body.classList.add('sidebar-collapsed');
      document.documentElement.classList.add('sidebar-collapsed-early');
    }

    // Attach global click event delegation
    document.addEventListener('click', (e) => {
      // 1. Collapse button click
      const btn = e.target.closest('[data-sidebar-collapse-btn], .sidebar-collapse-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebarCollapse();
        return;
      }

      // 1b. Mobile drawer toggle button click (<= 1024px)
      const drawerToggleBtn = e.target.closest('[data-sidebar-toggle], [data-mobile-more], [data-mobile-nav="menu"], [data-drawer-toggle]');
      if (drawerToggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
        if (window.SlideVaultUI && typeof window.SlideVaultUI.toggleDrawer === 'function') {
          window.SlideVaultUI.toggleDrawer();
        }
        return;
      }

      // 1c. Mobile drawer backdrop overlay click
      const backdrop = e.target.closest('[data-sidebar-backdrop]');
      if (backdrop) {
        e.preventDefault();
        e.stopPropagation();
        if (window.SlideVaultUI && typeof window.SlideVaultUI.setDrawerOpen === 'function') {
          window.SlideVaultUI.setDrawerOpen(false);
        }
        return;
      }

      // 1d. Mobile drawer close button click ([data-sidebar-close])
      const closeBtn = e.target.closest('[data-sidebar-close]');
      if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (window.SlideVaultUI && typeof window.SlideVaultUI.setDrawerOpen === 'function') {
          window.SlideVaultUI.setDrawerOpen(false);
        }
        return;
      }

      // 1e. Auto-close mobile drawer when any link inside sidebar is tapped
      const sidebarLink = e.target.closest('.saas-sidebar a[href]');
      if (sidebarLink && window.innerWidth < 1024) {
        if (window.SlideVaultUI && typeof window.SlideVaultUI.setDrawerOpen === 'function') {
          window.SlideVaultUI.setDrawerOpen(false);
        }
      }

      // 2. Click logo while collapsed expands the sidebar
      if (document.body.classList.contains('sidebar-collapsed') && window.innerWidth >= 1024) {
        const logo = e.target.closest('.saas-sidebar .sidebar-brand-header a, .saas-sidebar .sidebar-brand-header .group');
        if (logo) {
          e.preventDefault();
          e.stopPropagation();
          setSidebarCollapsed(false);
        }
      }
    });

    // Keyboard shortcut: Ctrl+B or Cmd+B
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCollapsibleSidebar);
  } else {
    initCollapsibleSidebar();
  }

  // Early execution in head if script is running synchronously
  try {
    if (window.innerWidth >= 1024 && isSidebarCollapsed()) {
      document.documentElement.classList.add('sidebar-collapsed-early');
      if (document.body) document.body.classList.add('sidebar-collapsed');
    }
  } catch (e) {}

  window.SlideVaultUI.toggleCollapse = toggleSidebarCollapse;
  window.SlideVaultUI.setCollapsed = setSidebarCollapsed;
  window.SlideVaultUI.isCollapsed = () => document.body.classList.contains('sidebar-collapsed');

  // ==========================================================================
  // HARDWARE-ADAPTIVE TIERING & DYNAMIC FRAME-RATE REGULATOR
  // Detects low-end vs mid vs ultra hardware and optimizes motion in real time
  // ==========================================================================
  function detectHardwareTier() {
    try {
      const userTier = localStorage.getItem('sv_performance_tier_override');
      if (userTier && ['low', 'mid', 'ultra'].includes(userTier)) {
        return userTier;
      }
    } catch(e) {}

    const cores = navigator.hardwareConcurrency || 4;
    const memory = navigator.deviceMemory || 4;

    if (cores <= 2 || memory <= 2) {
      return 'low';
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'low';
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        if (/apple|rtx|gtx|geforce|radeon rx|m1|m2|m3|m4|adreno (7|6)/i.test(renderer)) {
          return cores >= 6 && memory >= 4 ? 'ultra' : 'mid';
        }
        if (/powervr|mali-4|adreno (3|4|50)|intel hd graphics [2345]/i.test(renderer)) {
          return 'low';
        }
      }
    } catch (e) {}

    return cores >= 8 && memory >= 8 ? 'ultra' : 'mid';
  }

  function applyHardwareTier(tier) {
    const root = document.documentElement;
    root.classList.remove('sv-tier-low', 'sv-tier-mid', 'sv-tier-ultra');
    root.classList.add(`sv-tier-${tier}`);
    window.__sv_hardware_tier = tier;
    console.log(`[SlideVault Engine] 🚀 Hardware Tier Activated: ${tier.toUpperCase()}`);
    window.dispatchEvent(new CustomEvent('sv-tier-change', { detail: { tier } }));
  }

  function monitorDynamicPerformance() {
    if (window.__sv_fps_monitored) return;
    window.__sv_fps_monitored = true;

    let frames = 0;
    let lastTime = performance.now();
    let lowFpsCount = 0;

    function checkFps(now) {
      frames++;
      if (now - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        frames = 0;
        lastTime = now;

        if (fps < 35 && window.__sv_hardware_tier !== 'low') {
          lowFpsCount++;
          if (lowFpsCount >= 2) {
            console.warn('[SlideVault Engine] ⚡ Throttling detected! Auto-adapting to Smooth Low Tier');
            applyHardwareTier('low');
            return;
          }
        } else {
          lowFpsCount = 0;
        }
      }
      if (lowFpsCount < 2) {
        requestAnimationFrame(checkFps);
      }
    }
    requestAnimationFrame(checkFps);
  }

  const detectedTier = detectHardwareTier();
  applyHardwareTier(detectedTier);
  if (detectedTier !== 'low') {
    setTimeout(monitorDynamicPerformance, 2000);
  }

  window.SlideVaultUI.getHardwareTier = () => window.__sv_hardware_tier;
  window.SlideVaultUI.setHardwareTier = (tier) => {
    try { localStorage.setItem('sv_performance_tier_override', tier); } catch(e){}
    applyHardwareTier(tier);
  };

  // ============================================================================
  // UNIVERSAL ZERO-DEPENDENCY BOOTSTRAP BRIDGE (Offcanvas & Modal)
  // Provides native slide-in drawers and centered modals across all themes
  // ============================================================================
  (function initBootstrapBridge() {
    function getOrCreateBackdrop(id, onClick) {
      let bd = document.getElementById(id);
      if (!bd) {
        bd = document.createElement('div');
        bd.id = id;
        bd.className = 'offcanvas-backdrop fade show';
        bd.style.cursor = 'pointer';
        document.body.appendChild(bd);
      }
      bd.onclick = (e) => {
        e.preventDefault();
        if (typeof onClick === 'function') onClick(e);
      };
      bd.ontouchstart = (e) => {
        e.preventDefault();
        if (typeof onClick === 'function') onClick(e);
      };
      return bd;
    }

    function removeBackdrops() {
      document.querySelectorAll('.offcanvas-backdrop, .modal-backdrop, [id^="sv-"]').forEach(el => {
        if (el.id === 'sv-offcanvas-backdrop' || el.id === 'sv-modal-backdrop' || el.classList.contains('offcanvas-backdrop') || el.classList.contains('modal-backdrop')) {
          el.remove();
        }
      });
      if (!document.querySelector('.offcanvas.show, .modal.show')) {
        document.body.classList.remove('overflow-hidden');
      }
    }

    class OffcanvasBridge {
      constructor(element) {
        this.el = typeof element === 'string' ? document.querySelector(element) : element;
        if (this.el) this.el._bsOffcanvas = this;
      }
      show() {
        if (!this.el) return;
        this.el.classList.add('show');
        this.el.style.visibility = 'visible';
        document.body.classList.add('overflow-hidden');
        getOrCreateBackdrop('sv-offcanvas-backdrop', () => this.hide());
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          try { lucide.createIcons(); } catch(e){}
        }
        this.el.dispatchEvent(new CustomEvent('show.bs.offcanvas'));
      }
      hide() {
        if (!this.el) return;
        this.el.classList.remove('show');
        removeBackdrops();
        setTimeout(() => {
          if (!this.el.classList.contains('show')) {
            this.el.style.visibility = 'hidden';
          }
        }, 300);
        this.el.dispatchEvent(new CustomEvent('hide.bs.offcanvas'));
      }
      toggle() {
        if (this.el?.classList.contains('show')) this.hide();
        else this.show();
      }
      static getInstance(el) {
        const node = typeof el === 'string' ? document.querySelector(el) : el;
        return node?._bsOffcanvas || (node ? new OffcanvasBridge(node) : null);
      }
      static getOrCreateInstance(el) {
        const node = typeof el === 'string' ? document.querySelector(el) : el;
        if (!node) return null;
        if (!node._bsOffcanvas) new OffcanvasBridge(node);
        return node._bsOffcanvas;
      }
    }

    class ModalBridge {
      constructor(element) {
        this.el = typeof element === 'string' ? document.querySelector(element) : element;
        if (this.el) this.el._bsModal = this;
      }
      show() {
        if (!this.el) return;
        this.el.classList.add('show');
        this.el.style.display = 'block';
        document.body.classList.add('overflow-hidden');
        getOrCreateBackdrop('sv-modal-backdrop', () => this.hide());
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
          try { lucide.createIcons(); } catch(e){}
        }
        this.el.dispatchEvent(new CustomEvent('show.bs.modal'));
      }
      hide() {
        if (!this.el) return;
        this.el.classList.remove('show');
        this.el.style.display = 'none';
        removeBackdrops();
        this.el.dispatchEvent(new CustomEvent('hide.bs.modal'));
      }
      toggle() {
        if (this.el?.classList.contains('show')) this.hide();
        else this.show();
      }
      static getInstance(el) {
        const node = typeof el === 'string' ? document.querySelector(el) : el;
        return node?._bsModal || (node ? new ModalBridge(node) : null);
      }
      static getOrCreateInstance(el) {
        const node = typeof el === 'string' ? document.querySelector(el) : el;
        if (!node) return null;
        if (!node._bsModal) new ModalBridge(node);
        return node._bsModal;
      }
    }

    window.SlideVaultUI = window.SlideVaultUI || {};
    window.SlideVaultUI.sheet = {
      open: (el) => OffcanvasBridge.getOrCreateInstance(el).show(),
      close: (el) => OffcanvasBridge.getOrCreateInstance(el).hide(),
      toggle: (el) => OffcanvasBridge.getOrCreateInstance(el).toggle(),
      getInstance: (el) => OffcanvasBridge.getInstance(el),
      getOrCreateInstance: (el) => OffcanvasBridge.getOrCreateInstance(el)
    };
    window.SlideVaultUI.dialog = {
      open: (el) => ModalBridge.getOrCreateInstance(el).show(),
      close: (el) => ModalBridge.getOrCreateInstance(el).hide(),
      toggle: (el) => ModalBridge.getOrCreateInstance(el).toggle(),
      getInstance: (el) => ModalBridge.getInstance(el),
      getOrCreateInstance: (el) => ModalBridge.getOrCreateInstance(el)
    };
    window.SlideVaultUI.modal = window.SlideVaultUI.dialog;

    window.bootstrap = window.bootstrap || {};
    window.bootstrap.Offcanvas = window.bootstrap.Offcanvas || OffcanvasBridge;
    window.bootstrap.Modal = window.bootstrap.Modal || ModalBridge;

    // Global Event Delegation for Dismiss and Toggle buttons
    document.addEventListener('click', (e) => {
      // 1. Dismiss offcanvas
      const dismissOff = e.target.closest('[data-bs-dismiss="offcanvas"], .btn-close-cart, .btn-close[data-bs-dismiss="offcanvas"], .btn-close');
      if (dismissOff && (dismissOff.closest('.offcanvas') || document.getElementById('cartOffcanvas'))) {
        if (!dismissModInsideModal(dismissOff)) {
          e.preventDefault();
          const off = dismissOff.closest('.offcanvas') || document.getElementById('cartOffcanvas');
          if (off) OffcanvasBridge.getOrCreateInstance(off).hide();
          return;
        }
      }

      function dismissModInsideModal(el) {
        return el.closest('.modal') && !el.closest('.offcanvas');
      }

      // 2. Dismiss modal
      const dismissMod = e.target.closest('[data-bs-dismiss="modal"], .modal .btn-close');
      if (dismissMod) {
        e.preventDefault();
        const modal = dismissMod.closest('.modal');
        if (modal) ModalBridge.getOrCreateInstance(modal).hide();
        return;
      }

      // 3. Toggle offcanvas trigger
      const toggleOff = e.target.closest('[data-bs-toggle="offcanvas"]');
      if (toggleOff) {
        e.preventDefault();
        const sel = toggleOff.getAttribute('data-bs-target') || toggleOff.getAttribute('href');
        const target = sel ? document.querySelector(sel) : null;
        if (target) OffcanvasBridge.getOrCreateInstance(target).toggle();
        return;
      }

      // 4. Toggle modal trigger
      const toggleMod = e.target.closest('[data-bs-toggle="modal"]');
      if (toggleMod) {
        e.preventDefault();
        const sel = toggleMod.getAttribute('data-bs-target') || toggleMod.getAttribute('href');
        const target = sel ? document.querySelector(sel) : null;
        if (target) ModalBridge.getOrCreateInstance(target).toggle();
        return;
      }
    });

    // Global ESC key listener to exit active modals/drawers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        document.querySelectorAll('.offcanvas.show').forEach(el => OffcanvasBridge.getOrCreateInstance(el).hide());
        document.querySelectorAll('.modal.show').forEach(el => ModalBridge.getOrCreateInstance(el).hide());
      }
    });
  })();

// ============================================================================
// 17. REVOLUTIONARY MOBILE ENGINE: SCROLL-DRIVEN DYNAMIC SCALING & INSTAGRAM SWIPE
// ============================================================================
(function initMobileScrollScalingAndInstagramSwipe() {
  if (typeof window === 'undefined') return;

  // A. SCROLL-DRIVEN DUAL-BAR DYNAMIC SCALING & VISIONOS SPRING
  let lastScrollY = window.scrollY || 0;
  let scrollTicking = false;
  let scrollRestorationTimer = null;

  function restoreNavBars() {
    if (document.body.classList.contains('modal-open') || 
        document.body.classList.contains('sidebar-drawer-open') ||
        document.querySelector('dialog[open]')) {
      return;
    }
    const topBar = document.querySelector('.saas-topbar, header.saas-topbar');
    const mobileNav = document.querySelector('.mobile-glass-nav, .saas-bottom-dock, [data-mobile-nav]');
    if (topBar) topBar.classList.remove('topbar-compact');
    if (mobileNav) {
      mobileNav.classList.remove('dock-compact', 'nav-compact', 'nav-shrunk', 'nav-scrolling-down', 'nav-hidden');
      mobileNav.classList.add('nav-expanded', 'nav-scrolling-up');
    }
  }

  function scheduleNavRestoration() {
    if (scrollRestorationTimer) clearTimeout(scrollRestorationTimer);
    scrollRestorationTimer = setTimeout(restoreNavBars, 1000);
  }

  function updateMobileNavScale(e) {
    const target = (e && e.target && e.target !== document && e.target.scrollTop !== undefined) ? e.target : null;
    const currentScrollY = target ? target.scrollTop : (window.scrollY || document.documentElement.scrollTop || (document.body ? document.body.scrollTop : 0) || 0);
    const diff = currentScrollY - lastScrollY;
    const topBar = document.querySelector('.saas-topbar, header.saas-topbar');
    const mobileNav = document.querySelector('.mobile-glass-nav, .saas-bottom-dock, [data-mobile-nav]');

    if (window.innerWidth < 1024) {
      // Pause scroll hiding if modal is active
      if (document.body.classList.contains('modal-open') || document.querySelector('dialog[open]')) {
        lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
        scrollTicking = false;
        return;
      }

      if ((diff > 4 || diff > 8) && currentScrollY > 35) {
        // Scrolling DOWN -> Full Immersive Auto-Hide: Slide topbar and bottom bars completely off-screen
        if (topBar) topBar.classList.add('topbar-compact');
        if (mobileNav) {
          mobileNav.classList.remove('nav-expanded', 'nav-scrolling-up');
          mobileNav.classList.add('dock-compact', 'nav-compact', 'nav-shrunk', 'nav-scrolling-down', 'nav-hidden');
        }
        scheduleNavRestoration();
      } else if (diff < -6 || currentScrollY <= 24) {
        // Scrolling UP or at top -> Zoom in and expand to full size with spring animation
        if (topBar) topBar.classList.remove('topbar-compact');
        if (mobileNav) {
          mobileNav.classList.remove('dock-compact', 'nav-compact', 'nav-shrunk', 'nav-scrolling-down', 'nav-hidden');
          mobileNav.classList.add('nav-expanded', 'nav-scrolling-up');
        }
        if (scrollRestorationTimer) clearTimeout(scrollRestorationTimer);
      } else {
        scheduleNavRestoration();
      }
    }

    // Dynamic Liquid Scroll Progress Bar
    const progressEl = document.querySelector('.liquid-scroll-progress');
    if (progressEl) {
      const docHeight = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      if (docHeight > 0) {
        const pct = Math.min(100, Math.max(0, (currentScrollY / docHeight) * 100));
        progressEl.style.width = pct + '%';
        progressEl.classList.toggle('active', currentScrollY > 15);
      }
    }

    lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
    scrollTicking = false;
  }

  // Listen on window and capture all scrollable feed containers
  window.addEventListener('scroll', (e) => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => updateMobileNavScale(e));
      scrollTicking = true;
    }
  }, { passive: true, capture: true });

  // Native scrollend support
  window.addEventListener('scrollend', () => {
    scheduleNavRestoration();
  }, { passive: true });

  // Polyfill / normalize TouchEvent constructor to accept plain touch objects in headless/test environments
  if (typeof window !== 'undefined' && typeof window.TouchEvent === 'function' && typeof window.Touch === 'function') {
    const NativeTouchEvent = window.TouchEvent;
    window.TouchEvent = function(type, dict) {
      if (dict && dict.touches) {
        dict.touches = Array.from(dict.touches).map((t, i) => {
          if (t instanceof Touch) return t;
          try {
            return new Touch({
              identifier: t.identifier != null ? t.identifier : i,
              target: t.target || dict.target || document.body,
              clientX: t.clientX || 0,
              clientY: t.clientY || 0,
              pageX: t.pageX != null ? t.pageX : (t.clientX || 0),
              pageY: t.pageY != null ? t.pageY : (t.clientY || 0),
              screenX: t.screenX != null ? t.screenX : (t.clientX || 0),
              screenY: t.screenY != null ? t.screenY : (t.clientY || 0)
            });
          } catch (e) {
            return t;
          }
        });
      }
      return new NativeTouchEvent(type, dict);
    };
    window.TouchEvent.prototype = NativeTouchEvent.prototype;
  }

  // B. INSTAGRAM / IOS STYLE TOUCH GESTURE SWIPE DRAWER
  let touchStartX = 0;
  let touchStartY = 0;
  let touchCurrentX = 0;
  let isSwiping = false;
  let activeSidebar = null;

  function getMobileSidebar() {
    return document.querySelector('#saasAppSidebar, .saas-sidebar, [data-sidebar]');
  }

  document.addEventListener('touchstart', (e) => {
    if (window.innerWidth >= 1024) return;
    if (e.touches.length !== 1) return;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchCurrentX = touchStartX;
    activeSidebar = getMobileSidebar();

    const isInsideSidebar = e.target && e.target.closest && e.target.closest('#saasAppSidebar, .saas-sidebar');
    const isDrawerOpen = activeSidebar && (activeSidebar.classList.contains('sidebar-open') || activeSidebar.classList.contains('drawer-open') || document.body.classList.contains('sidebar-drawer-open') || document.body.classList.contains('drawer-open'));
    const isBackdrop = e.target && e.target.closest && e.target.closest('[data-sidebar-backdrop]');

    // Refined left edge threshold (24px) to avoid hijacking vertical page scroll
    const isNearLeftEdge = touchStartX <= 24;

    // Allow swipe right from edge to open; allow swipe left from inside drawer or backdrop to close
    if ((!isDrawerOpen && isNearLeftEdge) || (isDrawerOpen && (isInsideSidebar || isBackdrop))) {
      isSwiping = true;
    } else {
      isSwiping = false;
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isSwiping || !activeSidebar || window.innerWidth >= 1024) return;

    touchCurrentX = e.touches[0].clientX;
    const deltaX = touchCurrentX - touchStartX;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

    // If vertical scrolling dominates, cancel horizontal gesture to allow 100% native smooth scrolling
    if (deltaY > Math.abs(deltaX) && Math.abs(deltaX) < 18) {
      isSwiping = false;
      return;
    }

    const isDrawerOpen = activeSidebar.classList.contains('sidebar-open') || activeSidebar.classList.contains('drawer-open') || document.body.classList.contains('sidebar-drawer-open') || document.body.classList.contains('drawer-open');

    // Only swipe right when opening; only swipe left when closing
    if (!isDrawerOpen && deltaX <= 0) return;
    if (isDrawerOpen && deltaX >= 0) return;

    const sidebarWidth = activeSidebar.offsetWidth || 290;
    const backdrop = document.querySelector('[data-sidebar-backdrop]');

    if (!isDrawerOpen && deltaX > 0) {
      const translateX = Math.min(0, -sidebarWidth + deltaX);
      activeSidebar.style.setProperty('transform', 'translateX(' + translateX + 'px)', 'important');
      activeSidebar.style.setProperty('transition', 'none', 'important');
      if (backdrop) {
        backdrop.classList.remove('hidden');
        backdrop.style.setProperty('opacity', String(Math.min(0.65, (deltaX / sidebarWidth) * 0.65)), 'important');
        backdrop.style.setProperty('visibility', 'visible', 'important');
        backdrop.style.setProperty('pointer-events', 'auto', 'important');
      }
    } else if (isDrawerOpen && deltaX < 0) {
      const translateX = Math.min(0, deltaX);
      activeSidebar.style.setProperty('transform', 'translateX(' + translateX + 'px)', 'important');
      activeSidebar.style.setProperty('transition', 'none', 'important');
      if (backdrop) {
        backdrop.style.setProperty('opacity', String(Math.max(0, 0.65 + (deltaX / sidebarWidth) * 0.65)), 'important');
      }
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    scheduleNavRestoration();

    if (!isSwiping || !activeSidebar || window.innerWidth >= 1024) {
      isSwiping = false;
      return;
    }

    isSwiping = false;
    const deltaX = touchCurrentX - touchStartX;
    const isDrawerOpen = activeSidebar.classList.contains('sidebar-open') || activeSidebar.classList.contains('drawer-open') || document.body.classList.contains('sidebar-drawer-open') || document.body.classList.contains('drawer-open');
    const sidebarWidth = activeSidebar.offsetWidth || 290;
    const backdrop = document.querySelector('[data-sidebar-backdrop]');

    activeSidebar.style.removeProperty('transform');
    activeSidebar.style.removeProperty('transition');
    if (backdrop) {
      backdrop.style.removeProperty('opacity');
      backdrop.style.removeProperty('visibility');
      backdrop.style.removeProperty('pointer-events');
    }

    if (!isDrawerOpen && deltaX > sidebarWidth * 0.25) {
      // Snap Open
      if (window.SlideVaultUI && typeof window.SlideVaultUI.setDrawerOpen === 'function') {
        window.SlideVaultUI.setDrawerOpen(true);
      } else {
        activeSidebar.classList.add('sidebar-open', 'drawer-open');
        document.body.classList.add('sidebar-drawer-open');
      }
    } else if (isDrawerOpen && deltaX < -sidebarWidth * 0.18) {
      // Snap Closed
      if (window.SlideVaultUI && typeof window.SlideVaultUI.setDrawerOpen === 'function') {
        window.SlideVaultUI.setDrawerOpen(false);
      } else {
        activeSidebar.classList.remove('sidebar-open', 'drawer-open');
        document.body.classList.remove('sidebar-drawer-open');
      }
    } else {
      // Revert to original state
      if (isDrawerOpen) {
        if (window.SlideVaultUI && typeof window.SlideVaultUI.setDrawerOpen === 'function') {
          window.SlideVaultUI.setDrawerOpen(true);
        }
      } else {
        if (window.SlideVaultUI && typeof window.SlideVaultUI.setDrawerOpen === 'function') {
          window.SlideVaultUI.setDrawerOpen(false);
        }
      }
    }
  }, { passive: true });

  // C. INSTAGRAM / DYNAMIC ISLAND SLIDING ACTIVE INDICATOR PILL
  function initInstagramSlidingPill() {
    const nav = document.querySelector('.mobile-glass-nav');
    if (!nav) return;

    let pill = nav.querySelector('.mobile-nav-sliding-pill');
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'mobile-nav-sliding-pill';
      pill.setAttribute('aria-hidden', 'true');
      nav.insertBefore(pill, nav.firstChild);
    }

    function syncPillToActive(item) {
      const active = item || nav.querySelector('.mobile-nav-item.active, .mobile-nav-item[aria-current="page"]');
      if (!active || !pill) {
        if (pill) pill.style.opacity = '0';
        return;
      }
      const navRect = nav.getBoundingClientRect();
      const itemRect = active.getBoundingClientRect();
      const padX = 2;
      const left = Math.round((itemRect.left - navRect.left) + padX);
      const width = Math.max(20, Math.round(itemRect.width - (padX * 2)));
      pill.style.transform = `translateX(${left}px)`;
      pill.style.width = `${width}px`;
      pill.style.opacity = '1';
    }

    syncPillToActive();
    setTimeout(syncPillToActive, 100);
    setTimeout(syncPillToActive, 500);
    window.addEventListener('resize', () => syncPillToActive(), { passive: true });

    nav.addEventListener('click', (e) => {
      const item = e.target.closest('.mobile-nav-item');
      if (item && !item.hasAttribute('data-sidebar-toggle') && !item.hasAttribute('data-mobile-more')) {
        nav.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        syncPillToActive(item);
      }
    });
  }

  // D. DYNAMIC MOBILE ISLAND CONTROLLER (THANH SỐ 3 ĐIỆN THOẠI)
  function initDynamicMobileIsland() {
    const island = document.querySelector('#dynamicMobileIsland, .mobile-dynamic-island');
    if (!island) return;

    // 1. Công tắc 3D Spatial Touch
    const touchBtn = island.querySelector('#islandTouchToggle, [data-island-touch]');
    const touchDot = island.querySelector('.island-touch-dot');
    
    function syncIslandTouch() {
      const active = document.body.classList.contains('sv-3dtouch-active') || 
                     (window.SlideVaultSpatial && window.SlideVaultSpatial.isActive && window.SlideVaultSpatial.isActive());
      if (touchDot) touchDot.classList.toggle('active', !!active);
      if (touchBtn) touchBtn.classList.toggle('border-emerald-400', !!active);
    }

    if (touchBtn) {
      touchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(15);
        if (typeof window.toggle3DTouchEngine === 'function') {
          window.toggle3DTouchEngine();
        } else if (window.SlideVaultSpatial && typeof window.SlideVaultSpatial.toggle === 'function') {
          window.SlideVaultSpatial.toggle(true);
        }
        setTimeout(syncIslandTouch, 100);
      });
      syncIslandTouch();
      window.addEventListener('sv-3dtouch-change', syncIslandTouch);
    }

    // 2. Bộ chuyển slide một chạm với Haptic Feedback
    const prevBtn = island.querySelector('#islandSlidePrev');
    const nextBtn = island.querySelector('#islandSlideNext');
    const indicator = island.querySelector('#islandSlideIndicator');

    function updateIslandSlide(idx) {
      if (typeof window.selectHeroSlide === 'function') {
        window.selectHeroSlide(idx);
      }
      const total = (window.heroSlides && window.heroSlides.length) ? window.heroSlides.length : 4;
      if (indicator) indicator.textContent = `${(idx % total) + 1}/${total}`;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(12);
        const total = (window.heroSlides && window.heroSlides.length) ? window.heroSlides.length : 4;
        const cur = (typeof window.currentHeroIndex !== 'undefined') ? window.currentHeroIndex : 0;
        const prevIdx = (cur - 1 + total) % total;
        updateIslandSlide(prevIdx);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(12);
        const total = (window.heroSlides && window.heroSlides.length) ? window.heroSlides.length : 4;
        const cur = (typeof window.currentHeroIndex !== 'undefined') ? window.currentHeroIndex : 0;
        const nextIdx = (cur + 1) % total;
        updateIslandSlide(nextIdx);
      });
    }

    // 3. Nút Haptic AI Trigger tạo slide nhanh
    const aiBtn = island.querySelector('#islandAiTrigger, [data-island-ai]');
    if (aiBtn) {
      aiBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate([15, 30, 20]);
        const heroPrompt = document.getElementById('heroPromptInput');
        if (heroPrompt) {
          heroPrompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            heroPrompt.focus();
            heroPrompt.classList.add('ring-2', 'ring-emerald-400');
            setTimeout(() => heroPrompt.classList.remove('ring-2', 'ring-emerald-400'), 1500);
          }, 350);
        } else {
          window.location.href = 'AI.html';
        }
      });
    }

    // 4. Nút Giao diện Điều Khiển Điện Thoại Riêng Biệt (SlideVault Vision Remote)
    const remoteBtn = island.querySelector('#islandPhoneRemote, [data-island-remote]');
    if (remoteBtn) {
      remoteBtn.addEventListener('click', (e) => {
        if (navigator.vibrate) navigator.vibrate([25, 45]);
      });
    }

    // 5. Thanh trượt danh mục quán tính (Inertial Category Pills)
    island.querySelectorAll('.island-cat-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(8);
        island.querySelectorAll('.island-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const cat = pill.getAttribute('data-island-cat');
        if (typeof window.filterCatalogByCategory === 'function') {
          window.filterCatalogByCategory(cat);
        }
        const grid = document.getElementById('catalogGrid') || document.querySelector('.grid-catalog-responsive');
        if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // E. UNIVERSAL LIQUID SCROLL PROGRESS BAR
  function initLiquidScrollProgress() {
    if (!document.querySelector('.liquid-scroll-progress')) {
      const bar = document.createElement('div');
      bar.className = 'liquid-scroll-progress';
      bar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(bar);
    }
  }

  // F. UNIVERSAL LUCIDE SVG SAFEGUARD (NO EMPTY SQUARES)
  function ensureLucideIconsLoaded() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons();
      } catch (err) {
        console.warn('[SlideVault] Lucide render notice:', err);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initLiquidScrollProgress();
      initInstagramSlidingPill();
      ensureLucideIconsLoaded();
    });
  } else {
    initLiquidScrollProgress();
    initInstagramSlidingPill();
    ensureLucideIconsLoaded();
  }
})();

})();



  // Spotlight Card Cursor Tracking (Human-Crafted Glass Lighting, rAF throttled)
  if (typeof window !== 'undefined') {
    let spotlightTicking = false;
    document.addEventListener('mousemove', (e) => {
      if (!spotlightTicking) {
        window.requestAnimationFrame(() => {
          const card = e.target && e.target.closest ? e.target.closest('.spotlight-card, .glass-card, .tool-card, .bento-card') : null;
          if (card) {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
            card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
          }
          spotlightTicking = false;
        });
        spotlightTicking = true;
      }
    }, { passive: true });
  }

// ============================================================================
// 18. MODAL & DIALOG AUTO-DETECTION (BODY.MODAL-OPEN TOGGLE)
// ============================================================================
(function initModalIsolationObserver() {
  if (typeof window === 'undefined') return;

  function isElementVisibleModal(el) {
    if (!el) return false;
    if (el.tagName === 'DIALOG') return el.hasAttribute('open');
    if (el.classList.contains('hidden')) return false;
    if (el.style.display === 'none') return false;
    if (el.classList.contains('opacity-0') && el.classList.contains('pointer-events-none')) return false;
    return el.offsetWidth > 0 || el.offsetHeight > 0 || (el.getClientRects && el.getClientRects().length > 0);
  }

  let isCheckingModals = false;
  let modalCheckScheduled = false;

  function checkOpenModals() {
    if (isCheckingModals) return;
    isCheckingModals = true;
    try {
      const candidateSelectors = [
        'dialog[open]',
        '.modal:not(.hidden)',
        '[id$="Modal"]',
        '[id$="Dialog"]',
        '#quickViewDialog',
        '#checkoutDialog',
        '#commandPaletteModal',
        '#templatePreviewModal',
        '#projectManageModal',
        '#settingLogoutModal',
        '#directEditModal',
        '#editScriptModal',
        '#airShareModal'
      ];

      const hasOpen = Array.from(document.querySelectorAll(candidateSelectors.join(',')))
        .some(el => isElementVisibleModal(el));

      const isBodyModalOpen = document.body.classList.contains('modal-open');
      if (hasOpen && !isBodyModalOpen) {
        document.body.classList.add('modal-open');
      } else if (!hasOpen && isBodyModalOpen) {
        document.body.classList.remove('modal-open');
      }
    } finally {
      isCheckingModals = false;
    }
  }

  function scheduleCheckOpenModals() {
    if (modalCheckScheduled) return;
    modalCheckScheduled = true;
    window.requestAnimationFrame(() => {
      modalCheckScheduled = false;
      checkOpenModals();
    });
  }

  if (typeof HTMLDialogElement !== 'undefined') {
    const origShow = HTMLDialogElement.prototype.showModal;
    if (origShow && !HTMLDialogElement.prototype._svPatched) {
      HTMLDialogElement.prototype.showModal = function() {
        document.body.classList.add('modal-open');
        const res = origShow.apply(this, arguments);
        setTimeout(scheduleCheckOpenModals, 30);
        return res;
      };
      const origClose = HTMLDialogElement.prototype.close;
      HTMLDialogElement.prototype.close = function() {
        const res = origClose.apply(this, arguments);
        document.body.classList.remove('modal-open');
        setTimeout(scheduleCheckOpenModals, 30);
        return res;
      };
      HTMLDialogElement.prototype._svPatched = true;
    }
  }

  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    for (const m of mutations) {
      if (m.target === document.body && m.attributeName === 'class') continue;
      shouldCheck = true;
      break;
    }
    if (shouldCheck) scheduleCheckOpenModals();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'class'] });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'class'] });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkOpenModals);
  } else {
    checkOpenModals();
  }

  // ==========================================================================
  // MATHEMATICAL GEOMETRY & PHYSICS ENGINE (SlideVaultMathPhysics v4 Argon)
  // Comprehensive Quantum Mathematical, Optical & Physics Computing Engine.
  // Integrates Hooke Damped Oscillator, Runge-Kutta 4, Matrix4 Tensors,
  // 4D Quaternion SLERP, Snell 3D Vector Refraction, Fresnel Schlick,
  // Cauchy Dispersion, SPH Lucy Kernels, 2D Kalman Filter, Convex Hull,
  // Golden Spirals, Fluid Clamps, and Apple VisionOS Spring Physics.
  // ==========================================================================
  const PHI = 1.6180339887498948482;
  const INV_PHI = 0.6180339887498948482;
  const SQ_PHI = 2.6180339887498948482;
  const PI = Math.PI;
  const TAU = Math.PI * 2;
  const EULER = Math.E;
  const SQRT2 = Math.SQRT2;
  const INV_SQRT2 = 1 / Math.SQRT2;
  const EPSILON = 1e-12;

  const OPTICS = {
    N_VACUUM: 1.0,
    N_AIR: 1.000293,
    N_WATER: 1.333,
    N_ACRYLIC: 1.491,
    N_GLASS_CROWN: 1.520,
    N_FLINT_GLASS: 1.620,
    N_SAPPHIRE: 1.770,
    CAUCHY_A: 1.5046,
    CAUCHY_B: 0.00420 * 1e6
  };

  const mathClamp = (val, min, max) => (val !== val) ? min : val < min ? min : val > max ? max : val;
  const mathLerp = (a, b, t) => a + (b - a) * t;
  const mathRemap = (val, inMin, inMax, outMin, outMax) => {
    const t = mathClamp((val - inMin) / (inMax - inMin || EPSILON), 0, 1);
    return outMin + (outMax - outMin) * t;
  };
  const mathSmoothstep = (edge0, edge1, x) => {
    if (edge0 === edge1) return x < edge0 ? 0 : 1;
    const t = mathClamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const mathSmootherstep = (edge0, edge1, x) => {
    if (edge0 === edge1) return x < edge0 ? 0 : 1;
    const t = mathClamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };

  class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = Number.isFinite(x) ? x : 0;
      this.y = Number.isFinite(y) ? y : 0;
    }
    clone() { return new Vector2(this.x, this.y); }
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    scale(s) { return new Vector2(this.x * s, this.y * s); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    cross(v) { return this.x * v.y - this.y * v.x; }
    length() { return Math.hypot(this.x, this.y); }
    normalize() {
      const len = this.length();
      return len > EPSILON ? new Vector2(this.x / len, this.y / len) : new Vector2(0, 0);
    }
    distance(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
    angle() { return Math.atan2(this.y, this.x); }
    rotate(angleRad) {
      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
      return new Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
    reflect(normal) {
      const n = normal.normalize();
      const d = this.dot(n);
      return new Vector2(this.x - 2 * d * n.x, this.y - 2 * d * n.y);
    }
  }

  class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = Number.isFinite(x) ? x : 0;
      this.y = Number.isFinite(y) ? y : 0;
      this.z = Number.isFinite(z) ? z : 0;
    }
    clone() { return new Vector3(this.x, this.y, this.z); }
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
    scale(s) { return new Vector3(this.x * s, this.y * s, this.z * s); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) {
      return new Vector3(
        this.y * v.z - this.z * v.y,
        this.z * v.x - this.x * v.z,
        this.x * v.y - this.y * v.x
      );
    }
    length() { return Math.hypot(this.x, this.y, this.z); }
    normalize() {
      const len = this.length();
      return len > EPSILON ? new Vector3(this.x / len, this.y / len, this.z / len) : new Vector3(0, 0, 0);
    }
    distance(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
    reflect(normal) {
      const n = normal.normalize();
      const d = this.dot(n);
      return new Vector3(this.x - 2 * d * n.x, this.y - 2 * d * n.y, this.z - 2 * d * n.z);
    }
    project(target) {
      const tNorm = target.normalize();
      return tNorm.scale(this.dot(tNorm));
    }
    reject(target) { return this.sub(this.project(target)); }
  }

  class Vector4 {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = Number.isFinite(x) ? x : 0;
      this.y = Number.isFinite(y) ? y : 0;
      this.z = Number.isFinite(z) ? z : 0;
      this.w = Number.isFinite(w) ? w : 1;
    }
    clone() { return new Vector4(this.x, this.y, this.z, this.w); }
    add(v) { return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w); }
    sub(v) { return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w); }
    scale(s) { return new Vector4(this.x * s, this.y * s, this.z * s, this.w * s); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w; }
    length() { return Math.hypot(this.x, this.y, this.z, this.w); }
    perspectiveDivide() {
      const invW = Math.abs(this.w) > EPSILON ? 1 / this.w : 1;
      return new Vector4(this.x * invW, this.y * invW, this.z * invW, 1.0);
    }
  }

  class Matrix4 {
    constructor(elements) {
      this.elements = new Float64Array(16);
      if (elements && elements.length === 16) {
        this.elements.set(elements);
      } else {
        this.setIdentity();
      }
    }
    setIdentity() {
      const e = this.elements;
      e.fill(0);
      e[0] = 1; e[5] = 1; e[10] = 1; e[15] = 1;
      return this;
    }
    static identity() { return new Matrix4(); }
    static translation(tx, ty, tz = 0) {
      const m = new Matrix4();
      m.elements[12] = tx; m.elements[13] = ty; m.elements[14] = tz;
      return m;
    }
    static scaling(sx, sy, sz = 1) {
      const m = new Matrix4();
      m.elements[0] = sx; m.elements[5] = sy; m.elements[10] = sz;
      return m;
    }
    static rotationX(rad) {
      const m = new Matrix4();
      const c = Math.cos(rad), s = Math.sin(rad);
      m.elements[5] = c;  m.elements[6] = s;
      m.elements[9] = -s; m.elements[10] = c;
      return m;
    }
    static rotationY(rad) {
      const m = new Matrix4();
      const c = Math.cos(rad), s = Math.sin(rad);
      m.elements[0] = c;  m.elements[2] = -s;
      m.elements[8] = s;  m.elements[10] = c;
      return m;
    }
    static rotationZ(rad) {
      const m = new Matrix4();
      const c = Math.cos(rad), s = Math.sin(rad);
      m.elements[0] = c;  m.elements[1] = s;
      m.elements[4] = -s; m.elements[5] = c;
      return m;
    }
    multiply(other) {
      const a = this.elements, b = other.elements, r = new Float64Array(16);
      for (let i = 0; i < 4; i++) {
        const ai0 = a[i], ai1 = a[i + 4], ai2 = a[i + 8], ai3 = a[i + 12];
        r[i]      = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
        r[i + 4]  = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
        r[i + 8]  = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
        r[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
      }
      return new Matrix4(r);
    }
    transformVector4(v) {
      const e = this.elements;
      return new Vector4(
        e[0] * v.x + e[4] * v.y + e[8]  * v.z + e[12] * v.w,
        e[1] * v.x + e[5] * v.y + e[9]  * v.z + e[13] * v.w,
        e[2] * v.x + e[6] * v.y + e[10] * v.z + e[14] * v.w,
        e[3] * v.x + e[7] * v.y + e[11] * v.z + e[15] * v.w
      );
    }
    determinant() {
      const m = this.elements;
      const b00 = m[0] * m[5] - m[1] * m[4];
      const b01 = m[0] * m[6] - m[2] * m[4];
      const b02 = m[0] * m[7] - m[3] * m[4];
      const b03 = m[1] * m[6] - m[2] * m[5];
      const b04 = m[1] * m[7] - m[3] * m[5];
      const b05 = m[2] * m[7] - m[3] * m[6];
      const b06 = m[8] * m[13] - m[9] * m[12];
      const b07 = m[8] * m[14] - m[10] * m[12];
      const b08 = m[8] * m[15] - m[11] * m[12];
      const b09 = m[9] * m[14] - m[10] * m[13];
      const b10 = m[9] * m[15] - m[11] * m[13];
      const b11 = m[10] * m[15] - m[11] * m[14];
      return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    }
    inverse() {
      const m = this.elements;
      const det = this.determinant();
      if (Math.abs(det) < EPSILON) return Matrix4.identity();
      const invDet = 1 / det, inv = new Float64Array(16);

      const b00 = m[0] * m[5] - m[1] * m[4];
      const b01 = m[0] * m[6] - m[2] * m[4];
      const b02 = m[0] * m[7] - m[3] * m[4];
      const b03 = m[1] * m[6] - m[2] * m[5];
      const b04 = m[1] * m[7] - m[3] * m[5];
      const b05 = m[2] * m[7] - m[3] * m[6];
      const b06 = m[8] * m[13] - m[9] * m[12];
      const b07 = m[8] * m[14] - m[10] * m[12];
      const b08 = m[8] * m[15] - m[11] * m[12];
      const b09 = m[9] * m[14] - m[10] * m[13];
      const b10 = m[9] * m[15] - m[11] * m[13];
      const b11 = m[10] * m[15] - m[11] * m[14];

      inv[0]  = (m[5] * b11 - m[6] * b10 + m[7] * b09) * invDet;
      inv[1]  = (-m[1] * b11 + m[2] * b10 - m[3] * b09) * invDet;
      inv[2]  = (m[13] * b05 - m[14] * b04 + m[15] * b03) * invDet;
      inv[3]  = (-m[9] * b05 + m[10] * b04 - m[11] * b03) * invDet;
      inv[4]  = (-m[4] * b11 + m[6] * b08 - m[7] * b07) * invDet;
      inv[5]  = (m[0] * b11 - m[2] * b08 + m[3] * b07) * invDet;
      inv[6]  = (-m[12] * b05 + m[14] * b02 - m[15] * b01) * invDet;
      inv[7]  = (m[8] * b05 - m[10] * b02 + m[11] * b01) * invDet;
      inv[8]  = (m[4] * b10 - m[5] * b08 + m[7] * b06) * invDet;
      inv[9]  = (-m[0] * b10 + m[1] * b08 - m[3] * b06) * invDet;
      inv[10] = (m[12] * b04 - m[13] * b02 + m[15] * b00) * invDet;
      inv[11] = (-m[8] * b04 + m[9] * b02 - m[11] * b00) * invDet;
      inv[12] = (-m[4] * b09 + m[5] * b07 - m[6] * b06) * invDet;
      inv[13] = (m[0] * b09 - m[1] * b07 + m[2] * b06) * invDet;
      inv[14] = (-m[12] * b03 + m[13] * b01 - m[14] * b00) * invDet;
      inv[15] = (m[8] * b03 - m[9] * b01 + m[10] * b00) * invDet;

      return new Matrix4(inv);
    }
    toCssMatrix3d() {
      const e = this.elements;
      return `matrix3d(${e[0].toFixed(6)}, ${e[1].toFixed(6)}, ${e[2].toFixed(6)}, ${e[3].toFixed(6)}, ${e[4].toFixed(6)}, ${e[5].toFixed(6)}, ${e[6].toFixed(6)}, ${e[7].toFixed(6)}, ${e[8].toFixed(6)}, ${e[9].toFixed(6)}, ${e[10].toFixed(6)}, ${e[11].toFixed(6)}, ${e[12].toFixed(2)}, ${e[13].toFixed(2)}, ${e[14].toFixed(2)}, ${e[15].toFixed(6)})`;
    }
  }

  class Quaternion {
    constructor(w = 1, x = 0, y = 0, z = 0) {
      this.w = Number.isFinite(w) ? w : 1;
      this.x = Number.isFinite(x) ? x : 0;
      this.y = Number.isFinite(y) ? y : 0;
      this.z = Number.isFinite(z) ? z : 0;
    }
    static identity() { return new Quaternion(1, 0, 0, 0); }
    length() { return Math.hypot(this.w, this.x, this.y, this.z); }
    normalize() {
      const len = this.length();
      if (len < EPSILON) return Quaternion.identity();
      const inv = 1 / len;
      return new Quaternion(this.w * inv, this.x * inv, this.y * inv, this.z * inv);
    }
    static fromAxisAngle(axisVec3, angleRad) {
      const half = angleRad * 0.5, s = Math.sin(half), a = axisVec3.normalize();
      return new Quaternion(Math.cos(half), a.x * s, a.y * s, a.z * s).normalize();
    }
    static fromEuler(pitchRad, yawRad, rollRad) {
      const p = pitchRad * 0.5, y = yawRad * 0.5, r = rollRad * 0.5;
      const cp = Math.cos(p), sp = Math.sin(p), cy = Math.cos(y), sy = Math.sin(y), cr = Math.cos(r), sr = Math.sin(r);
      return new Quaternion(
        cr * cp * cy + sr * sp * sy,
        sr * cp * cy - cr * sp * sy,
        cr * sp * cy + sr * cp * sy,
        cr * cp * sy - sr * sp * cy
      ).normalize();
    }
    toEuler() {
      const q = this.normalize();
      const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
      const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
      const roll = Math.atan2(sinr_cosp, cosr_cosp);
      const sinp = 2 * (q.w * q.y - q.z * q.x);
      const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * (Math.PI / 2) : Math.asin(sinp);
      const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
      const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
      const yaw = Math.atan2(siny_cosp, cosy_cosp);
      return { pitch, yaw, roll };
    }
    multiply(b) {
      const a = this;
      return new Quaternion(
        a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
        a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
        a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
        a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
      ).normalize();
    }
    static slerp(qa, qb, t) {
      let q1 = qa.normalize(), q2 = qb.normalize();
      let cosHalfTheta = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;
      if (cosHalfTheta < 0) {
        q2 = new Quaternion(-q2.w, -q2.x, -q2.y, -q2.z);
        cosHalfTheta = -cosHalfTheta;
      }
      if (Math.abs(cosHalfTheta) >= 1.0 - EPSILON) {
        return new Quaternion(
          mathLerp(q1.w, q2.w, t),
          mathLerp(q1.x, q2.x, t),
          mathLerp(q1.y, q2.y, t),
          mathLerp(q1.z, q2.z, t)
        ).normalize();
      }
      const halfTheta = Math.acos(mathClamp(cosHalfTheta, -1, 1));
      const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);
      if (Math.abs(sinHalfTheta) < EPSILON) return q1;
      const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
      const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
      return new Quaternion(
        q1.w * ratioA + q2.w * ratioB,
        q1.x * ratioA + q2.x * ratioB,
        q1.y * ratioA + q2.y * ratioB,
        q1.z * ratioA + q2.z * ratioB
      );
    }
    toMatrix4() {
      const q = this.normalize();
      const xx = q.x * q.x, yy = q.y * q.y, zz = q.z * q.z;
      const xy = q.x * q.y, xz = q.x * q.z, yz = q.y * q.z;
      const wx = q.w * q.x, wy = q.w * q.y, wz = q.w * q.z;
      const m = new Matrix4(), e = m.elements;
      e[0] = 1 - 2 * (yy + zz); e[1] = 2 * (xy + wz); e[2] = 2 * (xz - wy); e[3] = 0;
      e[4] = 2 * (xy - wz); e[5] = 1 - 2 * (xx + zz); e[6] = 2 * (yz + wx); e[7] = 0;
      e[8] = 2 * (xz + wy); e[9] = 2 * (yz - wx); e[10] = 1 - 2 * (xx + yy); e[11] = 0;
      e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
      return m;
    }
  }

  function mathRk4(f, y0, t0, dt) {
    const n = y0.length;
    const k1 = f(t0, y0);
    const yK1 = new Array(n);
    for (let i = 0; i < n; i++) yK1[i] = y0[i] + 0.5 * dt * k1[i];
    const k2 = f(t0 + 0.5 * dt, yK1);
    const yK2 = new Array(n);
    for (let i = 0; i < n; i++) yK2[i] = y0[i] + 0.5 * dt * k2[i];
    const k3 = f(t0 + 0.5 * dt, yK2);
    const yK3 = new Array(n);
    for (let i = 0; i < n; i++) yK3[i] = y0[i] + dt * k3[i];
    const k4 = f(t0 + dt, yK3);
    const yNext = new Array(n);
    for (let i = 0; i < n; i++) {
      yNext[i] = y0[i] + (dt / 6.0) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    return yNext;
  }

  function mathRefractRay(incident, normal, eta) {
    const I = incident.normalize();
    const N = normal.normalize();
    let cosTheta1 = -N.dot(I), n = N, etaRatio = eta;
    if (cosTheta1 < 0) {
      cosTheta1 = -cosTheta1;
      n = N.scale(-1);
    }
    const sin2Theta2 = etaRatio * etaRatio * (1.0 - cosTheta1 * cosTheta1);
    if (sin2Theta2 > 1.0) {
      return { totalInternalReflection: true, refracted: I.reflect(n), reflectance: 1.0 };
    }
    const cosTheta2 = Math.sqrt(1.0 - sin2Theta2);
    const T = I.scale(etaRatio).add(n.scale(etaRatio * cosTheta1 - cosTheta2)).normalize();
    return { totalInternalReflection: false, refracted: T, cosTheta1, cosTheta2 };
  }

  function mathFresnelSchlick(cosTheta, n1 = 1.0, n2 = 1.52) {
    const r0 = Math.pow((n1 - n2) / (n1 + n2), 2);
    const c = mathClamp(1.0 - cosTheta, 0, 1);
    return r0 + (1.0 - r0) * Math.pow(c, 5);
  }

  function mathCauchyDispersion(wavelengthNm, A = OPTICS.CAUCHY_A, B = OPTICS.CAUCHY_B) {
    return A + (B / (wavelengthNm * wavelengthNm));
  }

  function mathChromaticAberrationOffsets(incident, normal, glassThickness = 12) {
    const nR = mathCauchyDispersion(650);
    const nG = mathCauchyDispersion(530);
    const nB = mathCauchyDispersion(450);
    const rayR = mathRefractRay(incident, normal, 1.0 / nR);
    const rayG = mathRefractRay(incident, normal, 1.0 / nG);
    const rayB = mathRefractRay(incident, normal, 1.0 / nB);
    return {
      red: rayR.refracted ? rayR.refracted.scale(glassThickness) : new Vector3(),
      green: rayG.refracted ? rayG.refracted.scale(glassThickness) : new Vector3(),
      blue: rayB.refracted ? rayB.refracted.scale(glassThickness) : new Vector3(),
      nR, nG, nB
    };
  }

  function mathSphLucyKernel(r, h = 10) {
    if (r < 0 || r > 2 * h) return 0;
    const q = r / (2 * h);
    if (q > 1.0) return 0;
    const factor = 5.0 / (Math.PI * 4 * h * h);
    return factor * (1 + 3 * q) * Math.pow(1 - q, 3);
  }

  class KalmanFilter1D {
    constructor({ q = 0.01, r = 0.5, p = 1.0, x = 0 } = {}) {
      this.q = q; this.r = r; this.p = p; this.x = x;
    }
    update(measurement) {
      if (!Number.isFinite(measurement)) return this.x;
      this.p = this.p + this.q;
      const k = this.p / (this.p + this.r);
      this.x = this.x + k * (measurement - this.x);
      this.p = (1 - k) * this.p;
      return this.x;
    }
  }

  class KalmanFilter2D {
    constructor({ alpha = 0.75, beta = 0.45 } = {}) {
      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
      this.alpha = alpha; this.beta = beta; this.initialized = false;
    }
    predict(dt = 0.1) {
      if (!this.initialized) return;
      this.x += this.vx * dt; this.y += this.vy * dt;
    }
    update(measX, measY, dt = 0.1) {
      if (!Number.isFinite(measX) || !Number.isFinite(measY)) return;
      const safeDt = Math.max(1e-4, dt);
      if (!this.initialized) {
        this.x = measX; this.y = measY; this.vx = 0; this.vy = 0;
        this.initialized = true; return;
      }
      const rx = measX - this.x, ry = measY - this.y;
      this.x += this.alpha * rx; this.y += this.alpha * ry;
      this.vx += (this.beta / safeDt) * rx; this.vy += (this.beta / safeDt) * ry;
    }
    getState() { return { x: this.x, y: this.y, vx: this.vx, vy: this.vy }; }
  }

  function mathSavitzkyGolay5(samples) {
    if (!Array.isArray(samples) || samples.length < 5) return samples[Math.floor(samples.length / 2)] || 0;
    const [y_2, y_1, y0, y1, y2] = samples.slice(0, 5);
    return (-3 * y_2 + 12 * y_1 + 17 * y0 + 12 * y1 - 3 * y2) / 35.0;
  }

  function mathConvexHull2D(points) {
    if (!Array.isArray(points) || points.length <= 3) return points ? [...points] : [];
    const pts = points.map(p => ({ x: p.x, y: p.y })).sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [];
    for (const p of pts) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    lower.pop(); upper.pop();
    return lower.concat(upper);
  }

  function mathRayIntersectsAABB(rayOrigin, rayDir, boxMin, boxMax) {
    const dir = rayDir.normalize();
    let tMin = -Infinity, tMax = Infinity;
    for (const ax of ['x', 'y', 'z']) {
      if (Math.abs(dir[ax]) < EPSILON) {
        if (rayOrigin[ax] < boxMin[ax] || rayOrigin[ax] > boxMax[ax]) return { hit: false };
      } else {
        const invD = 1.0 / dir[ax];
        let t1 = (boxMin[ax] - rayOrigin[ax]) * invD;
        let t2 = (boxMax[ax] - rayOrigin[ax]) * invD;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1); tMax = Math.min(tMax, t2);
        if (tMin > tMax || tMax < 0) return { hit: false };
      }
    }
    return { hit: true, tMin, tMax };
  }

  function mathPointInPolygon(point, polygon) {
    if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
    let inside = false;
    const len = polygon.length;
    for (let i = 0; i < len; i++) {
      const j = (i === 0) ? len - 1 : i - 1;
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi || EPSILON) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function mathFluidClamp(minRem, maxRem, minViewportWidthPx = 375, maxViewportWidthPx = 1200) {
    const minPx = minRem * 16, maxPx = maxRem * 16;
    const slope = (maxPx - minPx) / (maxViewportWidthPx - minViewportWidthPx);
    const intercept = minPx - slope * minViewportWidthPx;
    const slopeVw = (slope * 100).toFixed(4);
    const interceptRem = (intercept / 16).toFixed(4);
    const css = `clamp(${minRem}rem, ${slopeVw}vw + ${interceptRem}rem, ${maxRem}rem)`;
    return { css, slope, intercept, minRem, maxRem };
  }

  function mathEvalMath(expr) {
    if (!expr || typeof expr !== 'string') return null;
    let cleaned = expr.trim();
    if (cleaned.startsWith('/calc')) {
      cleaned = cleaned.replace(/^\/calc\s*/i, '');
    }
    if (!cleaned) return null;
    const mathScope = {
      phi: PHI, PHI: PHI, inv_phi: INV_PHI, INV_PHI: INV_PHI,
      pi: PI, PI: PI, e: EULER, E: EULER,
      fib: (n) => SlideVaultMathPhysics.goldenRatio.fibonacci(Math.round(n)),
      sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
      abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil,
      log: Math.log, exp: Math.exp, min: Math.min, max: Math.max,
      clamp: mathClamp,
      lerp: mathLerp,
      smoothstep: mathSmoothstep,
      smootherstep: mathSmootherstep
    };
    if (!/^[\d\s+\-*/^%(),.a-zA-Z_]+$/.test(cleaned)) return null;
    const forbidden = ['constructor', 'prototype', '__proto__', 'import', 'require', 'window', 'document', 'global', 'process', 'eval', 'Function', 'this'];
    for (const f of forbidden) {
      if (new RegExp('\\b' + f + '\\b', 'i').test(cleaned)) return null;
    }
    try {
      const jsExpr = cleaned.replace(/\^/g, '**');
      const keys = Object.keys(mathScope);
      const values = Object.values(mathScope);
      const fn = new Function(...keys, '"use strict"; return (' + jsExpr + ');');
      const res = fn(...values);
      if (typeof res === 'number' && Number.isFinite(res)) {
        return {
          expression: cleaned,
          result: Number.isInteger(res) ? res : Number(res.toFixed(6)),
          raw: res
        };
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  const SlideVaultMathPhysics = {
    version: '4.0.0-argon',
    constants: {
      PHI,
      INV_PHI,
      SQ_PHI,
      PI,
      TAU,
      EULER,
      SQRT2,
      INV_SQRT2,
      EPSILON,
      OPTICS,
      VISIONOS_BEZIER: [0.16, 1.0, 0.3, 1.0],
      VISIONOS_DURATION: 0.42
    },
    clamp: mathClamp,
    lerp: mathLerp,
    remap: mathRemap,
    smoothstep: mathSmoothstep,
    smootherstep: mathSmootherstep,
    vec2: (x, y) => new Vector2(x, y),
    vec3: (x, y, z) => new Vector3(x, y, z),
    vec4: (x, y, z, w) => new Vector4(x, y, z, w),
    Vector2,
    Vector3,
    Vector4,
    Matrix4,
    Quaternion,
    rk4: mathRk4,
    dampedOscillator: function({ mass = 1.0, stiffness = 180, damping = 24, x0 = 1.0, v0 = 0.0, dt = 1 / 60 } = {}) {
      const m = Math.max(EPSILON, mass);
      const k = Math.max(0, stiffness);
      const c = Math.max(0, damping);

      const omega0 = Math.sqrt(k / m);
      const zeta = c / (2 * Math.sqrt(k * m));

      let x = x0;
      let v = v0;

      if (zeta < 1.0) {
        const omegad = omega0 * Math.sqrt(1.0 - zeta * zeta);
        const decay = Math.exp(-zeta * omega0 * dt);
        const cosVal = Math.cos(omegad * dt);
        const sinVal = Math.sin(omegad * dt);
        const aCoeff = x0;
        const bCoeff = (v0 + zeta * omega0 * x0) / omegad;

        x = decay * (aCoeff * cosVal + bCoeff * sinVal);
        v = decay * (
          (bCoeff * omegad - aCoeff * zeta * omega0) * cosVal -
          (aCoeff * omegad + bCoeff * zeta * omega0) * sinVal
        );
      } else if (Math.abs(zeta - 1.0) < 1e-4) {
        const decay = Math.exp(-omega0 * dt);
        const aCoeff = x0;
        const bCoeff = v0 + omega0 * x0;

        x = decay * (aCoeff + bCoeff * dt);
        v = decay * (bCoeff - omega0 * (aCoeff + bCoeff * dt));
      } else {
        const gamma = omega0 * Math.sqrt(zeta * zeta - 1.0);
        const r1 = -zeta * omega0 + gamma;
        const r2 = -zeta * omega0 - gamma;
        const c1 = (v0 - r2 * x0) / (r1 - r2);
        const c2 = x0 - c1;

        x = c1 * Math.exp(r1 * dt) + c2 * Math.exp(r2 * dt);
        v = c1 * r1 * Math.exp(r1 * dt) + c2 * r2 * Math.exp(r2 * dt);
      }

      const kineticEnergy = 0.5 * m * v * v;
      const potentialEnergy = 0.5 * k * x * x;

      return {
        displacement: x,
        velocity: v,
        acceleration: (-k * x - c * v) / m,
        omega0,
        zeta,
        energy: {
          kinetic: kineticEnergy,
          potential: potentialEnergy,
          total: kineticEnergy + potentialEnergy
        }
      };
    },
    criticalSpringTuner: function(settlingTimeSeconds = 0.42, dampingRatio = 1.0) {
      const ts = Math.max(0.05, settlingTimeSeconds);
      const omega0 = 4.0 / (dampingRatio * ts);
      const mass = 1.0;
      const stiffness = mass * omega0 * omega0;
      const damping = 2 * dampingRatio * Math.sqrt(stiffness * mass);
      return { stiffness, damping, mass, omega0, zeta: dampingRatio };
    },
    refractRay: mathRefractRay,
    fresnelSchlick: mathFresnelSchlick,
    cauchyDispersion: mathCauchyDispersion,
    chromaticAberrationOffsets: mathChromaticAberrationOffsets,
    sphLucyKernel: mathSphLucyKernel,
    KalmanFilter1D,
    KalmanFilter2D,
    savitzkyGolay5: mathSavitzkyGolay5,
    convexHull2D: mathConvexHull2D,
    rayIntersectsAABB: mathRayIntersectsAABB,
    pointInPolygon: mathPointInPolygon,
    fluidClamp: mathFluidClamp,
    evalMath: mathEvalMath,
    solveCubicBezier: function(p1x = 0.16, p1y = 1.0, p2x = 0.3, p2y = 1.0) {
      function sampleCurveX(t) {
        return ((1 - 3 * p2x + 3 * p1x) * t + (3 * p2x - 6 * p1x)) * t * t + (3 * p1x) * t;
      }
      function sampleCurveY(t) {
        return ((1 - 3 * p2y + 3 * p1y) * t + (3 * p2y - 6 * p1y)) * t * t + (3 * p1y) * t;
      }
      function sampleCurveDerivativeX(t) {
        return (3 * (1 - 3 * p2x + 3 * p1x) * t + 2 * (3 * p2x - 6 * p1x)) * t + (3 * p1x);
      }
      function solveCurveX(x) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        let t = x;
        for (let i = 0; i < 8; i++) {
          const xEst = sampleCurveX(t) - x;
          if (Math.abs(xEst) < 1e-5) return t;
          const d2 = sampleCurveDerivativeX(t);
          if (Math.abs(d2) < 1e-6) break;
          t -= xEst / d2;
        }
        let t0 = 0, t1 = 1;
        t = x;
        for (let iter = 0; iter < 16 && t0 < t1; iter++) {
          const xEst = sampleCurveX(t);
          if (Math.abs(xEst - x) < 1e-5) return t;
          if (x > xEst) t0 = t; else t1 = t;
          t = (t1 + t0) * 0.5;
        }
        return t;
      }
      return function(x) {
        return sampleCurveY(solveCurveX(x));
      };
    },
    goldenRatio: {
      PHI: PHI,
      INV_PHI: INV_PHI,
      rect: function(width) {
        return { width: width, height: width / PHI };
      },
      fibonacci: function(n) {
        if (n <= 0) return 0;
        if (n === 1) return 1;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
          const c = a + b;
          a = b;
          b = c;
        }
        return b;
      },
      scale: function(base, steps) {
        return base * Math.pow(PHI, steps);
      },
      spiralPoints: function (turns = 3, scale = 1.0, count = 50) {
        const points = [];
        const b = Math.log(PHI) / (Math.PI * 0.5);
        for (let i = 0; i < count; i++) {
          const theta = (i / (count - 1)) * (turns * TAU);
          const r = scale * Math.exp(b * theta);
          points.push({
            x: r * Math.cos(theta),
            y: r * Math.sin(theta),
            radius: r,
            theta
          });
        }
        return points;
      }
    },
    eulerToMatrix3d: function({ pitch = 0, yaw = 0, roll = 0, tx = 0, ty = 0, tz = 0, perspective = 1200 } = {}) {
      const rad = Math.PI / 180;
      const p = pitch * rad;
      const y = yaw * rad;
      const r = roll * rad;

      const cp = Math.cos(p), sp = Math.sin(p);
      const cy = Math.cos(y), sy = Math.sin(y);
      const cr = Math.cos(r), sr = Math.sin(r);

      const m11 = cy * cr + sy * sp * sr;
      const m12 = -cy * sr + sy * sp * cr;
      const m13 = sy * cp;

      const m21 = cp * sr;
      const m22 = cp * cr;
      const m23 = -sp;

      const m31 = -sy * cr + cy * sp * sr;
      const m32 = sy * sr + cy * sp * cr;
      const m33 = cy * cp;

      const perspZ = perspective ? -1 / perspective : 0;

      return `matrix3d(${m11.toFixed(6)}, ${m21.toFixed(6)}, ${m31.toFixed(6)}, 0, ${m12.toFixed(6)}, ${m22.toFixed(6)}, ${m32.toFixed(6)}, 0, ${m13.toFixed(6)}, ${m23.toFixed(6)}, ${m33.toFixed(6)}, ${perspZ.toFixed(6)}, ${tx.toFixed(2)}, ${ty.toFixed(2)}, ${tz.toFixed(2)}, 1)`;
    },
    fuzzyMatch: function(query, target) {
      if (!query) return 100;
      if (!target) return 0;

      const q = query.toLowerCase().trim();
      const t = target.toLowerCase().trim();

      if (t === q) return 100;
      if (t.startsWith(q)) return 95;
      if (t.includes(q)) return 85;

      let qIdx = 0;
      let tIdx = 0;
      let score = 0;
      let consecutive = 0;

      while (qIdx < q.length && tIdx < t.length) {
        if (q[qIdx] === t[tIdx]) {
          score += 10;
          consecutive++;
          score += consecutive * 5;
          if (tIdx === 0 || t[tIdx - 1] === ' ' || t[tIdx - 1] === '-' || t[tIdx - 1] === '/') {
            score += 20;
          }
          qIdx++;
        } else {
          consecutive = 0;
        }
        tIdx++;
      }

      if (qIdx === q.length) {
        const ratio = q.length / t.length;
        return Math.min(80, Math.round(score * ratio));
      }

      return 0;
    }
  };

  // Expose globally
  window.SlideVaultMathPhysics = SlideVaultMathPhysics;
  window.SlideVaultPhysics = SlideVaultMathPhysics;
  if (typeof globalThis !== 'undefined') {
    globalThis.SlideVaultMathPhysics = SlideVaultMathPhysics;
    globalThis.SlideVaultPhysics = SlideVaultMathPhysics;
  }
})();
