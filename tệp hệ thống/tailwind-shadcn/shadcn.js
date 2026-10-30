/**
 * SlideVault shadcn/ui Core Interactive Controller (Pure Tailwind + shadcn Engine)
 * Features:
 * - Pure shadcn/ui Primitives: Sheet (Drawer), Dialog (Modal), Accordion, Dropdown, Toast
 * - Ultra-smooth Typewriter Engine with human-like cadence & input placeholder rotation
 * - Dual-Theme Manager (Obsidian Dark × Studio Light) with localStorage sync
 * - Floating Sidebar & Pill Topbar state sync
 * - Zero Bootstrap Dependency: Universal transparent compatibility layer
 * - Lucide Icon auto-initialization
 */

(function () {
  'use strict';

  // Helper: Backdrop Manager for Sheets & Dialogs
  function getOrCreateBackdrop(id, onClick) {
    let bd = document.getElementById(id);
    if (!bd) {
      bd = document.createElement('div');
      bd.id = id;
      bd.className = 'dialog-backdrop offcanvas-backdrop active show';
      bd.style.cursor = 'pointer';
      document.body.appendChild(bd);
    }
    const handler = (e) => {
      e.preventDefault();
      if (typeof onClick === 'function') onClick(e);
    };
    bd.onclick = handler;
    bd.ontouchstart = handler;
    return bd;
  }

  function hasActiveModals() {
    return !!document.querySelector('.sheet.show, .offcanvas.show, .dialog.show, .modal.show, [data-modal].active, dialog[open], .teamwork-modal-backdrop.active, .device-hub-backdrop.active, .command-palette-backdrop.active');
  }

  function removeBackdrops() {
    document.querySelectorAll('.dialog-backdrop, .modal-backdrop, .offcanvas-backdrop, [id^="sv-"]').forEach(el => {
      if (el.id === 'sv-sheet-backdrop' || el.id === 'sv-dialog-backdrop' || 
          el.id === 'sv-offcanvas-backdrop' || el.id === 'sv-modal-backdrop' ||
          el.classList.contains('offcanvas-backdrop') || el.classList.contains('modal-backdrop')) {
        el.remove();
      }
    });
    if (!hasActiveModals()) {
      document.body.classList.remove('overflow-hidden');
    }
  }

  const SlideVault = {
    // =========================================================================
    // 1. THEME MANAGER (Obsidian Dark × Studio Light)
    // =========================================================================
    theme: {
      KEY: 'slidevault_theme',
      get: function () {
        try {
          const urlParam = new URLSearchParams(window.location.search).get('theme');
          if (urlParam === 'light' || urlParam === 'dark') return urlParam;
        } catch(e) {}
        const stored = localStorage.getItem(this.KEY);
        if (stored) return stored;
        return 'dark'; // Default Obsidian Dark
      },
      set: function (mode) {
        const root = document.documentElement;
        if (mode === 'light') {
          root.classList.remove('dark');
          root.classList.add('light');
          root.setAttribute('data-theme', 'light');
          if (document.body) {
            document.body.classList.remove('dark');
            document.body.classList.add('light');
            document.body.setAttribute('data-theme', 'light');
          }
        } else {
          root.classList.remove('light');
          root.classList.add('dark');
          root.setAttribute('data-theme', 'dark');
          if (document.body) {
            document.body.classList.remove('light');
            document.body.classList.add('dark');
            document.body.setAttribute('data-theme', 'dark');
          }
        }
        localStorage.setItem(this.KEY, mode);
        this.updateButtons(mode);
        window.dispatchEvent(new CustomEvent('slidevault:themechange', { detail: { theme: mode } }));
      },
      toggle: function () {
        const current = this.get();
        const next = current === 'dark' ? 'light' : 'dark';
        this.set(next);
        return next;
      },
      updateButtons: function (mode) {
        const sunSvg = `<svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
        const moonSvg = `<svg class="w-4 h-4 text-inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
        document.querySelectorAll('.theme-toggle-btn, [data-theme-toggle]').forEach(btn => {
          const text = btn.querySelector('.theme-text');
          if (mode === 'light') {
            btn.setAttribute('title', 'Chuyển sang chế độ Tối (Obsidian Dark)');
            btn.setAttribute('aria-label', 'Chuyển sang chế độ Tối');
            if (text) text.textContent = 'Giao diện Sáng';
            btn.innerHTML = `${sunSvg}${text ? `<span class="theme-text text-xs font-medium ml-1.5">Sáng</span>` : ''}`;
          } else {
            btn.setAttribute('title', 'Chuyển sang chế độ Sáng (Studio Light)');
            btn.setAttribute('aria-label', 'Chuyển sang chế độ Sáng');
            if (text) text.textContent = 'Giao diện Tối';
            btn.innerHTML = `${moonSvg}${text ? `<span class="theme-text text-xs font-medium ml-1.5">Tối</span>` : ''}`;
          }
        });
      },
      init: function () {
        const initial = this.get();
        this.set(initial);
        document.addEventListener('click', (e) => {
          const btn = e.target.closest('.theme-toggle-btn, [data-theme-toggle]');
          if (btn) {
            e.preventDefault();
            this.toggle();
          }
        });
      }
    },

    // =========================================================================
    // 2. SHADCN SHEET / DRAWER PRIMITIVE (.sheet, .offcanvas)
    // =========================================================================
    sheet: {
      resolve: function (target) {
        if (!target) return null;
        if (typeof target === 'string') {
          const selector = target.startsWith('#') || target.startsWith('.') ? target : `#${target}`;
          return document.querySelector(selector);
        }
        return target;
      },
      open: function (sheetId) {
        const el = this.resolve(sheetId);
        if (!el) return;
        el.classList.add('show');
        el.style.visibility = 'visible';
        document.body.classList.add('overflow-hidden');
        getOrCreateBackdrop('sv-sheet-backdrop', () => this.close(el));
        if (window.lucide && typeof lucide.createIcons === 'function') {
          try { lucide.createIcons({ root: el }); } catch(e){}
        }
        el.dispatchEvent(new CustomEvent('show.bs.offcanvas'));
        el.dispatchEvent(new CustomEvent('slidevault:sheet:open', { detail: { id: el.id } }));
      },
      close: function (sheetId) {
        const el = sheetId ? this.resolve(sheetId) : document.querySelector('.sheet.show, .offcanvas.show');
        if (!el) return;
        el.classList.remove('show');
        removeBackdrops();
        setTimeout(() => {
          if (!el.classList.contains('show')) {
            el.style.visibility = 'hidden';
          }
        }, 300);
        el.dispatchEvent(new CustomEvent('hide.bs.offcanvas'));
        el.dispatchEvent(new CustomEvent('slidevault:sheet:close', { detail: { id: el.id } }));
      },
      toggle: function (sheetId) {
        const el = this.resolve(sheetId);
        if (!el) return;
        if (el.classList.contains('show')) this.close(el);
        else this.open(el);
      },
      getInstance: function (el) {
        const node = this.resolve(el);
        if (!node) return null;
        return {
          show: () => SlideVault.sheet.open(node),
          hide: () => SlideVault.sheet.close(node),
          toggle: () => SlideVault.sheet.toggle(node)
        };
      },
      getOrCreateInstance: function (el) {
        return this.getInstance(el);
      }
    },

    // =========================================================================
    // 3. SHADCN DIALOG / MODAL PRIMITIVE (.dialog, .modal)
    // =========================================================================
    dialog: {
      resolve: function (target) {
        if (!target) return null;
        if (typeof target === 'string') {
          const selector = target.startsWith('#') || target.startsWith('.') ? target : `#${target}`;
          return document.querySelector(selector);
        }
        return target;
      },
      open: function (dialogId) {
        const el = this.resolve(dialogId);
        if (!el) return;
        el.classList.remove('hidden');
        el.classList.add('show');
        el.style.display = 'block';
        document.body.classList.add('overflow-hidden');
        getOrCreateBackdrop('sv-dialog-backdrop', () => this.close(el));
        const panel = el.querySelector('[data-modal-panel], .dialog-content, .modal-content');
        if (panel) {
          panel.classList.remove('scale-95', 'opacity-0');
          panel.classList.add('scale-100', 'opacity-100');
        }
        if (window.lucide && typeof lucide.createIcons === 'function') {
          try { lucide.createIcons({ root: el }); } catch(e){}
        }
        el.dispatchEvent(new CustomEvent('show.bs.modal'));
        el.dispatchEvent(new CustomEvent('slidevault:dialog:open', { detail: { id: el.id } }));
      },
      close: function (dialogId) {
        const el = dialogId ? this.resolve(dialogId) : document.querySelector('.dialog.show, .modal.show, [data-modal].show');
        if (!el) return;
        const panel = el.querySelector('[data-modal-panel], .dialog-content, .modal-content');
        if (panel) {
          panel.classList.remove('scale-100', 'opacity-100');
          panel.classList.add('scale-95', 'opacity-0');
        }
        el.classList.remove('show');
        setTimeout(() => {
          el.style.display = 'none';
          el.classList.add('hidden');
          removeBackdrops();
        }, 200);
        el.dispatchEvent(new CustomEvent('hide.bs.modal'));
        el.dispatchEvent(new CustomEvent('slidevault:dialog:close', { detail: { id: el.id } }));
      },
      toggle: function (dialogId) {
        const el = this.resolve(dialogId);
        if (!el) return;
        if (el.classList.contains('show')) this.close(el);
        else this.open(el);
      },
      getInstance: function (el) {
        const node = this.resolve(el);
        if (!node) return null;
        return {
          show: () => SlideVault.dialog.open(node),
          hide: () => SlideVault.dialog.close(node),
          toggle: () => SlideVault.dialog.toggle(node)
        };
      },
      getOrCreateInstance: function (el) {
        return this.getInstance(el);
      }
    },

    // Backward-compatible alias: modal -> dialog
    get modal() {
      return this.dialog;
    },

    // =========================================================================
    // 4. SHADCN ACCORDION PRIMITIVE
    // =========================================================================
    accordion: {
      toggle: function (triggerEl) {
        if (!triggerEl) return;
        const targetSel = triggerEl.getAttribute('data-accordion-trigger') || 
                          triggerEl.getAttribute('data-bs-target') || 
                          triggerEl.getAttribute('href');
        const content = targetSel ? document.querySelector(targetSel) : null;
        if (!content) return;

        const parentSel = content.getAttribute('data-accordion-parent') || 
                          content.getAttribute('data-bs-parent');
        const parent = parentSel ? document.querySelector(parentSel) : null;

        const isOpen = content.classList.contains('show') || content.getAttribute('data-state') === 'open';

        // If part of an accordion group, close siblings first
        if (parent && !isOpen) {
          parent.querySelectorAll('.accordion-collapse, .accordion-content').forEach(sibling => {
            if (sibling !== content) {
              sibling.classList.remove('show');
              sibling.setAttribute('data-state', 'closed');
              const sibTrigger = parent.querySelector(`[data-accordion-trigger="#${sibling.id}"], [data-bs-target="#${sibling.id}"]`);
              if (sibTrigger) {
                sibTrigger.classList.add('collapsed');
                sibTrigger.setAttribute('aria-expanded', 'false');
                sibTrigger.setAttribute('data-state', 'closed');
              }
            }
          });
        }

        // Toggle state of clicked item
        if (isOpen) {
          content.classList.remove('show');
          content.setAttribute('data-state', 'closed');
          triggerEl.classList.add('collapsed');
          triggerEl.setAttribute('aria-expanded', 'false');
          triggerEl.setAttribute('data-state', 'closed');
        } else {
          content.classList.add('show');
          content.setAttribute('data-state', 'open');
          triggerEl.classList.remove('collapsed');
          triggerEl.setAttribute('aria-expanded', 'true');
          triggerEl.setAttribute('data-state', 'open');
        }
      }
    },

    // =========================================================================
    // 5. SHADCN DROPDOWN MENU PRIMITIVE
    // =========================================================================
    dropdown: {
      toggle: function (triggerEl) {
        const menu = triggerEl.nextElementSibling?.classList.contains('dropdown-menu') 
          ? triggerEl.nextElementSibling 
          : triggerEl.parentElement?.querySelector('.dropdown-menu');
        if (!menu) return;

        const isOpen = menu.classList.contains('show') || menu.style.display === 'block';
        this.closeAll();
        if (!isOpen) {
          menu.classList.add('show');
          menu.style.display = 'block';
          triggerEl.setAttribute('aria-expanded', 'true');
        }
      },
      closeAll: function () {
        document.querySelectorAll('.dropdown-menu.show, .dropdown-menu[style*="display: block"]').forEach(menu => {
          menu.classList.remove('show');
          menu.style.display = 'none';
          const trigger = menu.parentElement?.querySelector('[data-dropdown-trigger], [data-bs-toggle="dropdown"]');
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
      }
    },

    // =========================================================================
    // 6. TYPEWRITER ENGINE
    // =========================================================================
    typewriter: {
      init: function () {
        const targets = document.querySelectorAll('[data-typewriter]');
        targets.forEach(el => this.attach(el));

        const placeholderInputs = document.querySelectorAll('[data-typewriter-placeholder], #heroPromptInput');
        placeholderInputs.forEach(input => this.attachPlaceholder(input));
      },
      attach: function (element) {
        if (!element || element.__typewriterAttached || element.dataset.hasTypewriter === 'true') return;
        element.__typewriterAttached = true;
        element.dataset.hasTypewriter = 'true';

        let words = [];
        try {
          const raw = element.getAttribute('data-typewriter-phrases') || 
                      element.getAttribute('data-typewriter-words') ||
                      element.dataset.typewriterPhrases ||
                      element.dataset.typewriterWords;
          if (raw) words = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {}

        if (!words || words.length === 0) {
          const single = element.getAttribute('data-typewriter-text') || element.textContent.trim();
          words = single ? [single] : [
            "Tạo slide thuyết trình chuẩn quốc tế trong 15 giây",
            "Biến bài luận văn bản thành bài giảng chuyên nghiệp",
            "Báo cáo tài chính & Biểu đồ tương tác tự động",
            "Slide Pitch Deck gọi vốn phong cách Silicon Valley"
          ];
        }

        const isLoop = element.getAttribute('data-typewriter-loop') !== 'false';
        const typeSpeed = parseInt(element.getAttribute('data-type-speed') || '45', 10);
        const backSpeed = parseInt(element.getAttribute('data-back-speed') || '25', 10);
        const pauseTime = parseInt(element.getAttribute('data-pause-time') || '2200', 10);

        let wordIdx = 0;
        let charIdx = 0;
        let isDeleting = false;

        if (!element.querySelector('.typewriter-cursor')) {
          const cursor = document.createElement('span');
          cursor.className = 'typewriter-cursor inline-block ml-0.5 text-inherit font-normal animate-pulse';
          cursor.textContent = '|';
          element.innerHTML = '';
          const textSpan = document.createElement('span');
          textSpan.className = 'typewriter-content';
          element.appendChild(textSpan);
          element.appendChild(cursor);
        }

        const textSpan = element.querySelector('.typewriter-content') || element;

        function tick() {
          const currentWord = words[wordIdx];
          if (isDeleting) {
            charIdx--;
            textSpan.textContent = currentWord.substring(0, charIdx);
          } else {
            charIdx++;
            textSpan.textContent = currentWord.substring(0, charIdx);
          }

          let delay = isDeleting ? backSpeed : typeSpeed;
          delay += Math.floor(Math.random() * 20) - 10;
          if (delay < 15) delay = 15;

          if (!isDeleting && charIdx === currentWord.length) {
            if (!isLoop && wordIdx === words.length - 1) return;
            delay = pauseTime;
            isDeleting = true;
          } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            wordIdx = (wordIdx + 1) % words.length;
            delay = 400;
          }

          setTimeout(tick, delay);
        }

        setTimeout(tick, 400);
      },

      attachPlaceholder: function (input) {
        if (!input || input.__typewriterAttached) return;
        input.__typewriterAttached = true;

        const defaultWords = [
          "Pitch Deck gọi vốn $1.5M Series A FinTech chuẩn Silicon Valley...",
          "Chiến lược kinh doanh & Kế hoạch mở rộng thị trường toàn cầu 2026...",
          "Báo cáo tài chính doanh nghiệp Q3 & Biểu đồ tăng trưởng ARR...",
          "Slide bảo vệ luận án tốt nghiệp Khoa học Dữ liệu & AI...",
          "Kế hoạch ra mắt sản phẩm công nghệ mới đạt 100,000 người dùng..."
        ];

        let words = defaultWords;
        try {
          const customWords = input.getAttribute('data-typewriter-words');
          if (customWords) words = JSON.parse(customWords);
        } catch (e) {}

        let wordIdx = 0;
        let charIdx = 0;
        let isDeleting = false;
        let isPaused = false;
        let timeoutId = null;

        function tick() {
          if (isPaused) return;
          const currentWord = words[wordIdx];

          if (isDeleting) {
            charIdx--;
            input.setAttribute('placeholder', currentWord.substring(0, charIdx) + ' |');
          } else {
            charIdx++;
            input.setAttribute('placeholder', currentWord.substring(0, charIdx) + ' |');
          }

          let delay = isDeleting ? 22 : 42;
          delay += Math.floor(Math.random() * 16) - 8;
          if (delay < 15) delay = 15;

          if (!isDeleting && charIdx === currentWord.length) {
            input.setAttribute('placeholder', currentWord);
            delay = 2400;
            isDeleting = true;
          } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            wordIdx = (wordIdx + 1) % words.length;
            delay = 450;
          }

          timeoutId = setTimeout(tick, delay);
        }

        input.addEventListener('focus', () => {
          isPaused = true;
          clearTimeout(timeoutId);
          input.setAttribute('placeholder', 'Nhập chủ đề slide bạn muốn tạo...');
        });

        input.addEventListener('blur', () => {
          if (!input.value.trim()) {
            isPaused = false;
            charIdx = 0;
            isDeleting = false;
            timeoutId = setTimeout(tick, 1000);
          }
        });

        timeoutId = setTimeout(tick, 500);
      }
    },

    // =========================================================================
    // 7. TOAST NOTIFICATION ENGINE (.shadcn-toast & Apple Dynamic Island)
    // =========================================================================
    toast: function (options) {
      const {
        title = '',
        message = '',
        type = 'info',
        duration = 3500
      } = typeof options === 'string' ? { message: options } : options;

      // Executive Dynamic Island Sync
      if (this.dynamicIsland && typeof this.dynamicIsland.show === 'function') {
        const iconMap = {
          success: 'check-circle-2',
          error: 'alert-circle',
          warning: 'alert-triangle',
          info: 'sparkles'
        };
        this.dynamicIsland.show({
          icon: iconMap[type] || 'sparkles',
          title: title || (type === 'success' ? 'Thành công' : 'Thông báo'),
          message: message,
          duration: duration
        });
      }

      if (this.sound && typeof this.sound.play === 'function') {
        this.sound.play(type === 'success' ? 'success' : 'click');
      }
      if (this.haptics && typeof this.haptics.vibrate === 'function') {
        this.haptics.vibrate(type === 'success' ? [15, 20, 15] : 12);
      }

      let container = document.getElementById('slidevault-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'slidevault-toast-container';
        container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full p-4';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = 'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0';

      const typeStyles = {
        success: 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100',
        error: 'bg-rose-950/80 border-rose-500/30 text-rose-100',
        warning: 'bg-amber-950/80 border-amber-500/30 text-amber-100',
        info: 'bg-slate-900/85 border-border text-foreground'
      };

      const iconMap = {
        success: 'check-circle-2',
        error: 'alert-circle',
        warning: 'alert-triangle',
        info: 'info'
      };

      const borderClass = typeStyles[type] || typeStyles.info;
      toast.className += ` ${borderClass}`;

      toast.innerHTML = `
        <div class="mt-0.5 shrink-0">
          <i data-lucide="${iconMap[type] || 'info'}" class="w-5 h-5 ${type === 'success' ? 'text-inherit' : type === 'error' ? 'text-rose-400' : type === 'warning' ? 'text-inherit' : 'text-primary'}"></i>
        </div>
        <div class="flex-1 min-w-0">
          ${title ? `<div class="text-sm font-semibold mb-0.5">${title}</div>` : ''}
          <div class="text-xs text-muted-foreground leading-relaxed">${message}</div>
        </div>
        <button type="button" class="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded-lg transition-colors cursor-pointer" onclick="this.parentElement.remove()" aria-label="Đóng">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      `;

      container.appendChild(toast);
      if (window.lucide) lucide.createIcons({ root: toast });

      requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
      });

      setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    // =========================================================================
    // 8. NAVIGATION & MOBILE DRAWER
    // =========================================================================
    setDrawerOpen: function (open) {
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
          backdrop.classList.add('hidden');
          backdrop.style.opacity = '0';
          backdrop.style.visibility = 'hidden';
          backdrop.style.pointerEvents = 'none';
        }
        document.body.classList.remove('sidebar-drawer-open', 'drawer-open', 'mobile-drawer-open');
      }
    },

    toggleDrawer: function () {
      const now = Date.now();
      if (this._lastToggleTime && now - this._lastToggleTime < 180) return;
      this._lastToggleTime = now;
      const sidebar = document.querySelector('[data-sidebar], #saasAppSidebar, #appSidebar');
      if (!sidebar) return;
      const isOpen = sidebar.classList.contains('sidebar-open') || sidebar.classList.contains('drawer-open') || document.body.classList.contains('sidebar-drawer-open');
      this.setDrawerOpen(!isOpen);
    },

    toggleCollapse: function () {
      const isCollapsed = document.body.classList.toggle('sidebar-collapsed');
      document.documentElement.classList.toggle('sidebar-collapsed-early', isCollapsed);
      try {
        localStorage.setItem('slidevault_sidebar_collapsed', isCollapsed ? 'true' : 'false');
      } catch (e) {}
      if (this.sound && typeof this.sound.play === 'function') {
        this.sound.play('toggle');
      }
      if (this.haptics && typeof this.haptics.vibrate === 'function') {
        this.haptics.vibrate(10);
      }
      window.dispatchEvent(new CustomEvent('slidevault:sidebarcollapse', { detail: { collapsed: isCollapsed } }));
      return isCollapsed;
    },

    setCollapsed: function (collapsed) {
      document.body.classList.toggle('sidebar-collapsed', !!collapsed);
      document.documentElement.classList.toggle('sidebar-collapsed-early', !!collapsed);
      try {
        localStorage.setItem('slidevault_sidebar_collapsed', collapsed ? 'true' : 'false');
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('slidevault:sidebarcollapse', { detail: { collapsed: !!collapsed } }));
    },

    isCollapsed: function () {
      return document.body.classList.contains('sidebar-collapsed');
    },

    navigation: {
      init: function () {
        const currentPath = window.location.pathname.split('/').pop() || 'trangchudong.html';
        try {
          const savedCollapsed = localStorage.getItem('slidevault_sidebar_collapsed') === 'true';
          if (savedCollapsed && window.innerWidth >= 1024) {
            document.body.classList.add('sidebar-collapsed');
          } else if (window.innerWidth < 1024) {
            document.body.classList.remove('sidebar-collapsed');
          }
        } catch(e) {}

        document.querySelectorAll('.saas-sidebar a[href], .mobile-glass-nav a[href]').forEach(a => {
          const href = a.getAttribute('href');
          if (href && href.endsWith(currentPath)) {
            a.classList.add('active', 'bg-emerald-500/15', 'text-inherit', 'font-semibold');
            a.classList.remove('text-muted-foreground');
          }
        });

        document.addEventListener('click', (e) => {
          const closeBtn = e.target.closest('[data-sidebar-close]');
          if (closeBtn) {
            e.preventDefault();
            e.stopPropagation();
            SlideVault.setDrawerOpen(false);
            return;
          }
          const toggleBtn = e.target.closest('[data-sidebar-open], [data-sidebar-toggle], [data-mobile-menu]');
          if (toggleBtn) {
            e.preventDefault();
            e.stopPropagation();
            SlideVault.toggleDrawer();
            return;
          }
          const backdrop = e.target.closest('[data-sidebar-backdrop]');
          if (backdrop) {
            e.preventDefault();
            e.stopPropagation();
            SlideVault.setDrawerOpen(false);
            return;
          }
          const collapseBtn = e.target.closest('[data-sidebar-collapse-btn]');
          if (collapseBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (window.matchMedia('(max-width: 1024px)').matches) {
              SlideVault.setDrawerOpen(false);
            } else {
              SlideVault.toggleCollapse();
            }
            return;
          }
          const sidebarLink = e.target.closest('.saas-sidebar a');
          if (sidebarLink && window.matchMedia('(max-width: 1024px)').matches) {
            SlideVault.setDrawerOpen(false);
          }
        });
      }
    },

    dynamicMobileNav: {
      init: function () {
        this.ensureNav();
        this.highlightActiveTab();
      },
      ensureNav: function () {
        let nav = document.querySelector('.mobile-glass-nav');
        if (!nav) {
          nav = document.createElement('nav');
          nav.className = 'mobile-glass-nav';
          nav.setAttribute('aria-label', 'Điều hướng chính di động');
          nav.innerHTML = `
            <a class="mobile-nav-item" href="trangchudong.html" data-mobile-nav="home" title="Trang chủ" aria-label="Trang chủ">
              <svg class="w-5 h-5 text-inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>Trang chủ</span>
            </a>
            <a class="mobile-nav-item" href="vault.html" data-mobile-nav="vault" title="Kho lưu trữ Vault" aria-label="Kho lưu trữ Vault">
              <svg class="w-5 h-5 text-inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/></svg>
              <span>Vault</span>
            </a>
            <a class="mobile-nav-item" href="thuvienmau.html" data-mobile-nav="templates" title="Thư viện mẫu" aria-label="Thư viện mẫu">
              <svg class="w-5 h-5 text-inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
              <span>Mẫu</span>
            </a>
            <a class="mobile-nav-item" href="AI.html" data-mobile-nav="ai" title="AI Studio Trực Tiếp" aria-label="AI Studio Trực Tiếp">
              <svg class="w-5 h-5 text-inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
              <span>AI Studio</span>
            </a>
            <button type="button" class="mobile-nav-item" data-sidebar-toggle data-mobile-menu title="Mở danh mục menu" aria-label="Mở danh mục menu">
              <svg class="w-5 h-5 text-inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              <span>Menu</span>
            </button>
          `;
          document.body.appendChild(nav);
          if (window.lucide) {
            lucide.createIcons({ root: nav });
          }
        }
      },
      highlightActiveTab: function () {
        const path = window.location.pathname.split('/').pop().toLowerCase() || 'trangchudong.html';
        const nav = document.querySelector('.mobile-glass-nav');
        if (!nav) return;

        const items = nav.querySelectorAll('.mobile-nav-item');
        items.forEach(item => {
          item.classList.remove('active');
          item.removeAttribute('aria-current');
        });

        let matched = false;
        if (path === 'trangchudong.html' || path === 'index.html' || path === '') {
          const home = nav.querySelector('[data-mobile-nav="home"]');
          if (home) { home.classList.add('active'); home.setAttribute('aria-current', 'page'); matched = true; }
        } else if (path === 'vault.html') {
          const vault = nav.querySelector('[data-mobile-nav="vault"]');
          if (vault) { vault.classList.add('active'); vault.setAttribute('aria-current', 'page'); matched = true; }
        } else if (path === 'thuvienmau.html') {
          const tpl = nav.querySelector('[data-mobile-nav="templates"]');
          if (tpl) { tpl.classList.add('active'); tpl.setAttribute('aria-current', 'page'); matched = true; }
        } else if (path === 'ai.html') {
          const ai = nav.querySelector('[data-mobile-nav="ai"]');
          if (ai) { ai.classList.add('active'); ai.setAttribute('aria-current', 'page'); matched = true; }
        } else if (path === 'setting.html' || path === 'security.html') {
          const st = nav.querySelector('[data-mobile-nav="settings"]');
          if (st) { st.classList.add('active'); st.setAttribute('aria-current', 'page'); matched = true; }
        }

        if (!matched) {
          items.forEach(item => {
            const href = item.getAttribute('href');
            if (href && href.toLowerCase().endsWith(path)) {
              item.classList.add('active');
              item.setAttribute('aria-current', 'page');
            }
          });
        }
      }
    },

    // =========================================================================
    // 9. USER SESSION & AUTH
    // =========================================================================
    user: {
      get: function () {
        try {
          return JSON.parse(localStorage.getItem('slidevault_current_user') || 'null');
        } catch (e) {
          return null;
        }
      },
      logout: function () {
        const u = this.get();
        if (u && typeof logSecurityEvent === 'function') {
          try { logSecurityEvent('logout', { email: u.email }); } catch (e) {}
        }
        if (window.SlideVaultAuth && typeof window.SlideVaultAuth.logout === 'function') {
          try { window.SlideVaultAuth.logout(); return; } catch (e) {}
        }
        localStorage.removeItem('slidevault_current_user');
        SlideVault.toast({
          title: "Đã đăng xuất tài khoản",
          message: "Phiên làm việc đã kết thúc an toàn. Đang chuyển hướng...",
          type: "info"
        });
        setTimeout(() => {
          window.location.href = 'dangnhap.html';
        }, 700);
      },
      syncUI: function () {
        const u = this.get();
        const names = document.querySelectorAll('#sidebarUserName, [data-user-name]');
        const emails = document.querySelectorAll('#sidebarUserEmail, [data-user-email]');
        const avatars = document.querySelectorAll('#sidebarUserAvatar, [data-user-avatar]');
        const authSlots = document.querySelectorAll('#topbarAuthSlot, #navUserSlot, [data-auth-slot]');
        const sidebarFooters = document.querySelectorAll('.sidebar-footer-profile, .user-profile-pill');

        if (u && u.email) {
          const displayName = u.name || u.email.split('@')[0];
          const initials = displayName.slice(0, 2).toUpperCase();
          names.forEach(el => el.textContent = displayName);
          emails.forEach(el => el.textContent = u.email);
          avatars.forEach(el => {
            if (u.avatar) {
              el.innerHTML = `<img src="${u.avatar}" alt="${displayName}" class="w-full h-full rounded-full object-cover shadow-sm">`;
            } else {
              el.textContent = initials;
            }
          });

          authSlots.forEach(slot => {
            slot.classList.remove('hidden');
            slot.innerHTML = `
              <div class="flex items-center gap-1.5">
                <a href="setting.html" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-pill border border-border/60 hover:bg-muted text-xs font-semibold text-foreground transition-all text-decoration-none">
                  <span class="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    ${initials}
                  </span>
                  <span class="hidden md:inline truncate max-w-[110px]">${displayName}</span>
                </a>
                <button type="button" onclick="SlideVault.user.logout()" class="p-1.5 rounded-full hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer" title="Đăng Xuất Tài Khoản">
                  <i data-lucide="log-out" class="w-4 h-4 text-rose-400"></i>
                </button>
              </div>
            `;
            if (window.lucide) lucide.createIcons({ root: slot });
          });
        } else {
          names.forEach(el => el.textContent = 'Khách');
          emails.forEach(el => el.textContent = 'Chưa đăng nhập');
          avatars.forEach(el => {
            el.innerHTML = '<i data-lucide="user" class="w-4 h-4 text-white"></i>';
          });

          authSlots.forEach(slot => {
            slot.classList.remove('hidden');
            slot.innerHTML = `
              <a href="dangnhap.html" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-pill border border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-xs font-semibold text-foreground transition-all text-decoration-none" title="Đăng Nhập Tài Khoản">
                <i data-lucide="log-in" class="w-3.5 h-3.5 text-inherit"></i>
                <span>Đăng Nhập</span>
              </a>
            `;
            if (window.lucide) lucide.createIcons({ root: slot });
          });

          // Ensure sidebar profile links to dangnhap.html when clicked
          sidebarFooters.forEach(pill => {
            const logoutBtn = pill.querySelector('[title="Đăng Xuất Tài Khoản"], [data-lucide="log-out"]')?.closest('button');
            if (logoutBtn) {
              logoutBtn.outerHTML = `
                <a href="dangnhap.html" class="p-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-inherit border border-emerald-500/30 transition-all flex items-center justify-center cursor-pointer text-decoration-none" title="Đăng Nhập Tài Khoản">
                  <i data-lucide="log-in" class="w-4 h-4"></i>
                </a>
              `;
            }
          });
        }
      },
      init: function () {
        this.syncUI();
      }
    },

    // =========================================================================
    // 10. GLOBAL EVENT DELEGATION
    // =========================================================================
    setupEventDelegation: function () {
      document.addEventListener('click', (e) => {
        // A. Sheet triggers & dismiss
        const sheetTrigger = e.target.closest('[data-sheet-trigger], [data-sheet-toggle], [data-bs-toggle="offcanvas"]');
        if (sheetTrigger) {
          e.preventDefault();
          const target = sheetTrigger.getAttribute('data-sheet-trigger') || 
                         sheetTrigger.getAttribute('data-sheet-toggle') || 
                         sheetTrigger.getAttribute('data-bs-target') || 
                         sheetTrigger.getAttribute('href');
          SlideVault.sheet.toggle(target);
          return;
        }

        const sheetClose = e.target.closest('[data-sheet-close], .btn-close-cart, [data-bs-dismiss="offcanvas"]');
        if (sheetClose) {
          e.preventDefault();
          const target = sheetClose.closest('.sheet, .offcanvas') || '#cartOffcanvas';
          SlideVault.sheet.close(target);
          return;
        }

        // B. Dialog / Modal triggers & dismiss
        const dialogTrigger = e.target.closest('[data-dialog-trigger], [data-dialog-toggle], [data-modal-open], [data-bs-toggle="modal"]');
        if (dialogTrigger) {
          e.preventDefault();
          const target = dialogTrigger.getAttribute('data-dialog-trigger') || 
                         dialogTrigger.getAttribute('data-dialog-toggle') || 
                         dialogTrigger.getAttribute('data-modal-open') || 
                         dialogTrigger.getAttribute('data-bs-target') || 
                         dialogTrigger.getAttribute('href');
          SlideVault.dialog.open(target);
          return;
        }

        const dialogClose = e.target.closest('[data-dialog-close], [data-modal-close], [data-bs-dismiss="modal"]');
        if (dialogClose) {
          e.preventDefault();
          const target = dialogClose.closest('.dialog, .modal, [data-modal]');
          SlideVault.dialog.close(target);
          return;
        }

        // C. Generic Close Button (.btn-close fallback)
        const genericClose = e.target.closest('.btn-close');
        if (genericClose) {
          const sheet = genericClose.closest('.sheet, .offcanvas');
          if (sheet) {
            e.preventDefault();
            SlideVault.sheet.close(sheet);
            return;
          }
          const dialog = genericClose.closest('.dialog, .modal, [data-modal]');
          if (dialog) {
            e.preventDefault();
            SlideVault.dialog.close(dialog);
            return;
          }
        }

        // D. Accordion triggers
        const accordionTrigger = e.target.closest('[data-accordion-trigger], [data-bs-toggle="collapse"]');
        if (accordionTrigger) {
          e.preventDefault();
          SlideVault.accordion.toggle(accordionTrigger);
          return;
        }

        // E. Dropdown triggers
        const dropdownTrigger = e.target.closest('[data-dropdown-trigger], [data-bs-toggle="dropdown"]');
        if (dropdownTrigger) {
          e.preventDefault();
          SlideVault.dropdown.toggle(dropdownTrigger);
          return;
        }

        // F. Command Palette Triggers
        if (!e.target.closest('#svCommandPalette')) {
          const cmdTrigger = e.target.closest('[data-command-trigger], .command-palette-trigger');
          if (cmdTrigger) {
            e.preventDefault();
            SlideVault.commandPalette.open();
            return;
          }
        }

        // Acoustic click for primary actions
        const actionBtn = e.target.closest('.btn-brand, .control-pill, .nav-pill-item, [data-theme-toggle]');
        if (actionBtn) {
          SlideVault.sound.play('click');
          SlideVault.haptics.vibrate(8);
        }

        // Click outside closes dropdowns
        if (!e.target.closest('.dropdown, .dropdown-menu, [data-dropdown-trigger], [data-bs-toggle="dropdown"]')) {
          SlideVault.dropdown.closeAll();
        }
      });

      // Global hotkeys: ESC, CMD+K / CTRL+K, /, F (Keynote)
      document.addEventListener('keydown', (e) => {
        // ESC key closes active sheets, dialogs, command palette, keynote
        if (e.key === 'Escape' || e.key === 'Esc') {
          SlideVault.commandPalette.close();
          SlideVault.keynote.close();
          SlideVault.teamworkPreview.close();
          SlideVault.androidDeviceHub.close();
          SlideVault.sheet.close();
          SlideVault.dialog.close();
          SlideVault.dropdown.closeAll();
          return;
        }

        // Keynote navigation hotkeys when keynote is active
        if (document.getElementById('svKeynoteModal')?.classList.contains('active')) {
          if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
            e.preventDefault();
            SlideVault.keynote.next();
            return;
          }
          if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            SlideVault.keynote.prev();
            return;
          }
        }

        // Ctrl+B or Cmd+B toggles sidebar collapse
        if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
          e.preventDefault();
          SlideVault.toggleCollapse();
          return;
        }

        // CMD+K or CTRL+K opens Command Palette
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          SlideVault.commandPalette.toggle();
          return;
        }

        // Forward slash '/' when not typing opens Command Palette
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
          e.preventDefault();
          SlideVault.commandPalette.open();
          return;
        }

        // F key when not typing launches Keynote Fullscreen Presenter
        if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
          e.preventDefault();
          SlideVault.keynote.toggle();
          return;
        }
      });
    },

    // =========================================================================
    // 11. ACOUSTIC AUDIO & HAPTICS ENGINE (Zero-Dependency Web Audio API)
    // =========================================================================
    sound: {
      enabled: true,
      ctx: null,
      getCtx: function () {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.ctx;
      },
      play: function (type = 'click') {
        if (!this.enabled) return;
        try {
          const ctx = this.getCtx();
          if (!ctx) return;
          if (ctx.state === 'suspended') ctx.resume();
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.025);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
            osc.start(now);
            osc.stop(now + 0.025);
          } else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.07);
            osc.frequency.setValueAtTime(783.99, now + 0.14);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
            osc.start(now);
            osc.stop(now + 0.32);
          } else if (type === 'toggle') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.035);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
            osc.start(now);
            osc.stop(now + 0.035);
          }
        } catch (e) {}
      }
    },

    haptics: {
      vibrate: function (ms = 12) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(ms); } catch (e) {}
        }
      }
    },

    // =========================================================================
    // 12. APPLE DYNAMIC ISLAND (EXECUTIVE HUD STATUS PILL)
    // =========================================================================
    dynamicIsland: {
      el: null,
      timer: null,
      ensure: function () {
        if (this.el) return this.el;
        let el = document.getElementById('svDynamicIsland');
        if (!el) {
          el = document.createElement('aside');
          el.id = 'svDynamicIsland';
          el.className = 'dynamic-island';
          el.setAttribute('role', 'status');
          el.setAttribute('aria-live', 'polite');
          el.setAttribute('aria-label', 'SlideVault Dynamic Island Status');
          el.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="font-bold text-xs tracking-tight">SlideVault Pro</span>
            <span class="text-[10px] text-muted-foreground opacity-75 font-mono px-1 rounded bg-white/10 dark:bg-white/5 border border-white/10 ml-0.5 hidden sm:inline">⌘K</span>
          `;
          document.body.appendChild(el);
          el.addEventListener('click', () => {
            SlideVault.sound.play('click');
            SlideVault.haptics.vibrate(10);
            SlideVault.commandPalette.open();
          });
        }
        this.el = el;
        return el;
      },
      show: function ({ icon = 'sparkles', title = '', message = '', duration = 3500, actionText = '', onAction = null }) {
        const el = this.ensure();
        if (this.timer) clearTimeout(this.timer);

        SlideVault.sound.play('success');
        SlideVault.haptics.vibrate([15, 30, 15]);

        el.classList.add('expanded');
        el.innerHTML = `
          <div class="flex items-center gap-3 w-full">
            <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-inherit flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-sm">
              <i data-lucide="${icon}" class="w-4 h-4"></i>
            </div>
            <div class="flex-1 min-w-0 pr-1 text-left">
              <div class="font-bold text-xs text-foreground truncate">${title}</div>
              ${message ? `<div class="text-[11px] text-muted-foreground truncate leading-tight">${message}</div>` : ''}
            </div>
            ${actionText ? `
              <button type="button" class="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-inherit text-xs font-bold border border-emerald-500/40 shrink-0 transition-colors cursor-pointer" id="svIslandAction">
                ${actionText}
              </button>
            ` : ''}
          </div>
        `;

        if (window.lucide && typeof lucide.createIcons === 'function') {
          lucide.createIcons({ root: el });
        }

        if (actionText && typeof onAction === 'function') {
          const btn = el.querySelector('#svIslandAction');
          if (btn) btn.onclick = (e) => {
            e.stopPropagation();
            onAction();
          };
        }

        this.timer = setTimeout(() => {
          this.collapse();
        }, duration);
      },
      collapse: function () {
        if (!this.el) return;
        this.el.classList.remove('expanded');
        this.el.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="font-bold text-xs tracking-tight">SlideVault Pro</span>
          <span class="text-[10px] text-muted-foreground opacity-75 font-mono px-1 rounded bg-white/10 dark:bg-white/5 border border-white/10 ml-0.5 hidden sm:inline">⌘K</span>
        `;
      },
      init: function () {
        this.ensure();
      }
    },

    // =========================================================================
    // 13. RAYCAST / SPOTLIGHT COMMAND PALETTE (CMD+K / CTRL+K)
    // =========================================================================
    commandPalette: {
      backdrop: null,
      panel: null,
      input: null,
      resultsList: null,
      selectedIndex: 0,
      items: [],
      isOpen: false,
      
      initRegistry: function () {
        this.items = [
          // CLI Slash Commands
          { id: 'cmd-teamwork', group: 'Dòng Lệnh & Lệnh CLI (Slash Commands)', title: '/teamwork-preview (Chế Độ Cộng Tác Trực Tiếp)', desc: 'Kích hoạt không gian làm việc nhóm và con trỏ không gian đồng bộ', icon: 'users', badge: 'CLI', run: () => SlideVault.teamworkPreview.open() },
          { id: 'cmd-boost', group: 'Dòng Lệnh & Lệnh CLI (Slash Commands)', title: '/boost (Turbo Mathematical HW Acceleration)', desc: 'Tối ưu hóa GPU 120 FPS, dọn RAM cache và tăng tốc toán học', icon: 'zap', badge: 'Turbo', run: () => SlideVault.boostEngine.run() },
          { id: 'cmd-device-hub', group: 'Dòng Lệnh & Lệnh CLI (Slash Commands)', title: '/android-device-hub (Bộ Giả Lập Thiết Bị Đa Nền Tảng)', desc: 'Mô phỏng tức thì trên Samsung Galaxy, iPad Tablet và PC 16:9', icon: 'tablet', badge: 'Device Hub', run: () => SlideVault.androidDeviceHub.open() },
          { id: 'cmd-calc', group: 'Dòng Lệnh & Lệnh CLI (Slash Commands)', title: '/calc (Máy Tính Toán Học Kỹ Thuật)', desc: 'Tính toán tỷ lệ vàng φ, Fibonacci, hàm lượng giác và biểu thức đại số', icon: 'calculator', badge: 'Math', run: () => {
            const expr = prompt('Nhập biểu thức toán học (ví dụ: 100 * phi hoặc fib(8) hoặc sin(pi / 4)):', '100 * phi');
            if (expr) {
              const res = (window.SlideVaultMathPhysics && typeof window.SlideVaultMathPhysics.evalMath === 'function')
                ? window.SlideVaultMathPhysics.evalMath(expr)
                : null;
              if (res) {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(String(res.result)).catch(() => {});
                }
                SlideVault.toast({ title: 'Kết quả toán học (Đã sao chép)', message: `${res.expression} = ${res.result}`, type: 'success' });
              } else {
                try {
                  const val = Function('"use strict"; return (' + expr + ')')();
                  SlideVault.toast({ title: 'Kết quả toán học', message: `${expr} = ${val}`, type: 'success' });
                } catch (e) {
                  SlideVault.toast({ title: 'Lỗi tính toán', message: 'Biểu thức không hợp lệ', type: 'error' });
                }
              }
            }
          }},
          { id: 'cmd-help', group: 'Dòng Lệnh & Lệnh CLI (Slash Commands)', title: '/help (Sổ Tay Hướng Dẫn Dòng Lệnh)', desc: 'Hiển thị danh sách các lệnh CLI và phím tắt chuyên gia', icon: 'terminal', badge: 'Docs', run: () => {
            SlideVault.toast({ title: 'Lệnh CLI Khả Dụng', message: '/teamwork-preview • /boost • /android-device-hub • /calc • ⌘K / ↵', type: 'info', duration: 6000 });
          }},

          // Actions
          { id: 'login', group: 'Tác Vụ Nhanh', title: 'Đăng Nhập Tài Khoản', desc: 'Đăng nhập vào hệ thống SlideVault Pro', icon: 'log-in', badge: 'Auth', run: () => window.location.href = 'dangnhap.html' },
          { id: 'register', group: 'Tác Vụ Nhanh', title: 'Đăng Ký Tài Khoản Mới', desc: 'Tạo tài khoản VIP SlideVault miễn phí', icon: 'user-plus', badge: 'VIP', run: () => window.location.href = 'dangki.html' },
          { id: 'ai-gen', group: 'Tác Vụ Nhanh', title: 'Tạo Slide với AI Studio', desc: 'Sinh bài thuyết trình thông minh trong 15s', icon: 'sparkles', badge: 'AI', run: () => window.location.href = 'AI.html' },
          { id: 'cart', group: 'Tác Vụ Nhanh', title: 'Mở Giỏ Hàng & Thanh Toán', desc: 'Xem danh sách mẫu slide đã chọn và quét VietQR', icon: 'shopping-cart', badge: 'Cart', run: () => SlideVault.sheet.open('cartOffcanvas') },
          { id: 'favs', group: 'Tác Vụ Nhanh', title: 'Mẫu Slide Đã Lưu Yêu Thích', desc: 'Xem lại các mẫu bài thuyết trình đã đánh dấu tim', icon: 'heart', badge: 'Saved', run: () => typeof openBookmarksModal === 'function' ? openBookmarksModal() : SlideVault.dialog.open('bookmarksModal') },
          { id: 'theme', group: 'Tác Vụ Nhanh', title: 'Chuyển Đổi Giao Diện Sáng / Tối', desc: 'Chuyển giữa Obsidian Dark và Studio Light', icon: 'moon', badge: 'Theme', run: () => SlideVault.theme.toggle() },
          { id: 'mobile-hub', group: 'Tác Vụ Nhanh', title: 'Mở Cổng Kết Nối Điện Thoại (QR Code)', desc: 'Thử nghiệm giao diện di động và camera AI', icon: 'smartphone', badge: 'Mobile', run: () => window.location.href = 'mobile-connect.html' },
          { id: 'touch-3d', group: 'Tác Vụ Nhanh', title: 'Bật / Tắt Camera AI 3D Touch', desc: 'Điều khiển con trỏ laser và cử chỉ không gian', icon: 'hand', badge: '3D Touch', run: () => { const btn = document.querySelector('[data-sv-touch-toggle]'); if (btn) btn.click(); } },
          { id: 'demo-pptx', group: 'Tác Vụ Nhanh', title: 'Tải Thử Mẫu Demo PowerPoint (.pptx)', desc: 'Xuất tệp slide vector thật để mở trên máy tính', icon: 'download', badge: '.PPTX', run: () => typeof downloadSamplePptxDemo === 'function' ? downloadSamplePptxDemo() : null },
          
          // Navigation
          { id: 'nav-home', group: 'Điều Hướng', title: 'Trang Chủ Khám Phá', desc: 'Trở về trang chủ chính SlideVault', icon: 'home', run: () => window.location.href = 'trangchudong.html' },
          { id: 'nav-vault', group: 'Điều Hướng', title: 'Kho Lưu Trữ Vault', desc: 'Quản lý toàn bộ tệp slide cá nhân của bạn', icon: 'folder-kanban', run: () => window.location.href = 'vault.html' },
          { id: 'nav-shop', group: 'Điều Hướng', title: 'Thư Viện Mẫu Đầy Đủ', desc: 'Khám phá hơn 1.200 bộ slide mẫu đạt chuẩn quốc tế', icon: 'palette', run: () => window.location.href = 'thuvienmau.html' },
          { id: 'nav-text', group: 'Điều Hướng', title: 'Chuyển Văn Bản → Slide', desc: 'Biến tài liệu văn bản thành slide trực quan', icon: 'file-text', run: () => window.location.href = 'vanban.html' },
          { id: 'nav-colors', group: 'Điều Hướng', title: 'Phối Màu Thông Minh', desc: 'Bảng màu đối xứng theo tỷ lệ 60-30-10', icon: 'droplet', run: () => window.location.href = 'phoimau.html' },
          { id: 'nav-chart', group: 'Điều Hướng', title: 'Vẽ Biểu Đồ Thống Kê Nhanh', desc: 'Tạo biểu đồ trực quan chèn vào bài thuyết trình', icon: 'bar-chart-2', run: () => window.location.href = 'vebieudonhanh.html' },
          { id: 'nav-sec', group: 'Điều Hướng', title: 'Bảng Điều Khiển An Ninh & Tường Lửa WAF', desc: 'Xem radar phòng thủ và telemetry máy chủ', icon: 'shield-check', run: () => window.location.href = 'security.html' },
          { id: 'nav-set', group: 'Điều Hướng', title: 'Cài Đặt Hệ Thống', desc: 'Tùy chỉnh cấu hình, thông báo và bảo mật phiên', icon: 'settings', run: () => window.location.href = 'setting.html' }
        ];

        // Enrich with catalog data if available on page
        if (typeof catalogData !== 'undefined' && Array.isArray(catalogData)) {
          catalogData.forEach(prod => {
            this.items.push({
              id: `prod-${prod.id}`,
              group: 'Mẫu Slide Nổi Bật',
              title: prod.title,
              desc: `${prod.categoryName || 'Pitch Deck'} • ${prod.slides || '65+ slides'} • ${(prod.price || 199000).toLocaleString('vi-VN')}đ`,
              icon: 'presentation',
              badge: prod.tag || 'VIP',
              run: () => {
                if (typeof openQuickView === 'function') openQuickView(prod.id);
                else window.location.href = 'thuvienmau.html';
              }
            });
          });
        }
      },

      buildDOM: function () {
        if (this.backdrop) return;
        const bd = document.createElement('div');
        bd.id = 'svCommandPalette';
        bd.className = 'command-palette-backdrop';
        bd.innerHTML = `
          <div class="command-palette-panel" onclick="event.stopPropagation()">
            <!-- Top Search Input Bar -->
            <div class="flex items-center gap-3 px-4 py-3.5 border-b border-border/40 shrink-0">
              <i data-lucide="search" class="w-5 h-5 text-inherit shrink-0"></i>
              <input id="svCommandInput" type="text" placeholder="Tìm tác vụ, mở mẫu slide, hoặc nhập từ khóa..." class="w-full bg-transparent text-sm sm:text-base outline-none text-foreground placeholder:text-muted-foreground/60" aria-label="Nhập lệnh tìm kiếm hoặc lệnh gạch chéo CLI">
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40">ESC</span>
                <button type="button" class="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer" id="svCommandCloseBtn" aria-label="Đóng bảng điều khiển lệnh">
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Scrollable Results -->
            <div id="svCommandResults" class="p-2 overflow-y-auto max-h-[60vh] space-y-3">
              <!-- Rendered dynamically -->
            </div>

            <!-- Footer Tips -->
            <div class="px-4 py-2 border-t border-border/40 bg-muted/20 text-[11px] text-muted-foreground flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1"><kbd class="font-mono bg-card px-1 py-0.5 rounded border border-border/40">↑</kbd> <kbd class="font-mono bg-card px-1 py-0.5 rounded border border-border/40">↓</kbd> Di chuyển</span>
                <span class="flex items-center gap-1"><kbd class="font-mono bg-card px-1 py-0.5 rounded border border-border/40">↵</kbd> Chọn</span>
                <span class="flex items-center gap-1"><kbd class="font-mono bg-card px-1 py-0.5 rounded border border-border/40">ESC</kbd> Đóng</span>
              </div>
              <span class="font-semibold text-inherit">SlideVault OS v52</span>
            </div>
          </div>
        `;
        document.body.appendChild(bd);

        this.backdrop = bd;
        this.panel = bd.querySelector('.command-palette-panel');
        this.input = bd.querySelector('#svCommandInput');
        this.resultsList = bd.querySelector('#svCommandResults');

        bd.addEventListener('click', () => this.close());
        bd.querySelector('#svCommandCloseBtn')?.addEventListener('click', () => this.close());

        this.input.addEventListener('input', () => {
          this.selectedIndex = 0;
          this.renderResults();
        });

        this.input.addEventListener('keydown', (e) => {
          const visibleItems = this.getFilteredItems();
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % Math.max(1, visibleItems.length);
            SlideVault.sound.play('click');
            this.updateSelection();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + visibleItems.length) % Math.max(1, visibleItems.length);
            SlideVault.sound.play('click');
            this.updateSelection();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (visibleItems[this.selectedIndex]) {
              this.executeItem(visibleItems[this.selectedIndex]);
            }
          }
        });

        if (window.lucide && typeof lucide.createIcons === 'function') {
          lucide.createIcons({ root: bd });
        }
      },

      getFilteredItems: function () {
        const rawQ = (this.input?.value || '').trim();
        if (!rawQ) return this.items;

        const matcher = (window.SlideVaultMathPhysics && typeof window.SlideVaultMathPhysics.fuzzyMatch === 'function')
          ? window.SlideVaultMathPhysics.fuzzyMatch
          : null;

        const scoredItems = [];
        const lowerQ = rawQ.toLowerCase();

        // 1. Live Mathematical Evaluator (/calc or mathematical expression)
        if (window.SlideVaultMathPhysics && typeof window.SlideVaultMathPhysics.evalMath === 'function') {
          const evalRes = window.SlideVaultMathPhysics.evalMath(rawQ);
          if (evalRes) {
            const mathItem = {
              id: 'cmd-calc-live',
              group: 'Máy Tính Toán Học Kỹ Thuật (Live Math Engine)',
              title: `= ${evalRes.result}`,
              desc: `Biểu thức: ${evalRes.expression} • Nhấn ↵ để sao chép kết quả (${evalRes.result})`,
              icon: 'calculator',
              badge: `Math = ${evalRes.result}`,
              run: () => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(String(evalRes.result)).catch(() => {});
                }
                SlideVault.toast({
                  title: 'Đã sao chép kết quả toán học',
                  message: `${evalRes.expression} = ${evalRes.result}`,
                  type: 'success'
                });
              }
            };
            scoredItems.push({ item: mathItem, score: 999 });
          }
        }

        // 2. Score standard items with slash command prioritization
        for (const it of this.items) {
          let score = 0;
          if (lowerQ.startsWith('/teamwork') && it.id === 'cmd-teamwork') {
            score = 500;
          } else if (lowerQ.startsWith('/boost') && it.id === 'cmd-boost') {
            score = 500;
          } else if ((lowerQ.startsWith('/android') || lowerQ.startsWith('/device-hub')) && it.id === 'cmd-device-hub') {
            score = 500;
          } else if (lowerQ.startsWith('/help') && it.id === 'cmd-help') {
            score = 500;
          } else if (lowerQ.startsWith('/calc') && it.id === 'cmd-calc') {
            score = 450;
          } else if (matcher) {
            const titleScore = matcher(rawQ, it.title);
            const descScore = matcher(rawQ, it.desc || '');
            const idScore = matcher(rawQ, it.id || '');
            const badgeScore = matcher(rawQ, it.badge || '');
            score = Math.max(titleScore, descScore * 0.85, idScore * 0.9, badgeScore * 0.7);
          } else {
            if (it.title.toLowerCase().includes(lowerQ)) score = 90;
            else if (it.desc?.toLowerCase().includes(lowerQ)) score = 70;
            else if (it.group?.toLowerCase().includes(lowerQ)) score = 50;
            else if (it.badge?.toLowerCase().includes(lowerQ)) score = 60;
          }

          if (score > 15 || it.title.toLowerCase().includes(lowerQ) || (it.desc && it.desc.toLowerCase().includes(lowerQ)) || (it.group && it.group.toLowerCase().includes(lowerQ))) {
            scoredItems.push({ item: it, score: score });
          }
        }

        scoredItems.sort((a, b) => b.score - a.score);
        return scoredItems.map(s => s.item);
      },

      renderResults: function () {
        const filtered = this.getFilteredItems();
        if (filtered.length === 0) {
          this.resultsList.innerHTML = `
            <div class="text-center py-8 text-muted-foreground">
              <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
              <div class="text-sm font-semibold">Không tìm thấy kết quả phù hợp</div>
              <div class="text-xs text-muted-foreground/70">Thử tìm kiếm với từ khóa khác như "Pitch deck", "AI", "Giỏ hàng"...</div>
            </div>
          `;
          if (window.lucide) lucide.createIcons({ root: this.resultsList });
          return;
        }

        // Group items
        const groups = {};
        filtered.forEach((it, idx) => {
          if (!groups[it.group]) groups[it.group] = [];
          groups[it.group].push({ item: it, globalIdx: idx });
        });

        let html = '';
        Object.keys(groups).forEach(grp => {
          html += `
            <div>
              <div class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">${grp}</div>
              <div class="space-y-0.5">
          `;
          groups[grp].forEach(({ item, globalIdx }) => {
            const isSel = globalIdx === this.selectedIndex;
            html += `
              <div class="command-item ${isSel ? 'selected' : ''}" data-cmd-idx="${globalIdx}">
                <div class="w-6 h-6 rounded-lg ${isSel ? 'bg-emerald-500/20 text-inherit' : 'bg-muted text-muted-foreground'} flex items-center justify-center shrink-0">
                  <i data-lucide="${item.icon || 'arrow-right'}" class="w-3.5 h-3.5"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-xs text-foreground truncate">${item.title}</div>
                  ${item.desc ? `<div class="text-[10px] text-muted-foreground truncate">${item.desc}</div>` : ''}
                </div>
                ${item.badge ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-inherit border border-emerald-500/20 shrink-0 font-bold">${item.badge}</span>` : ''}
                <i data-lucide="corner-down-left" class="w-3 h-3 text-muted-foreground/50 shrink-0 ${isSel ? 'opacity-100 text-inherit' : 'opacity-0'}"></i>
              </div>
            `;
          });
          html += `</div></div>`;
        });

        this.resultsList.innerHTML = html;

        // Click handlers
        this.resultsList.querySelectorAll('.command-item').forEach(el => {
          el.addEventListener('click', () => {
            const idx = parseInt(el.getAttribute('data-cmd-idx'), 10);
            if (filtered[idx]) this.executeItem(filtered[idx]);
          });
        });

        if (window.lucide && typeof lucide.createIcons === 'function') {
          lucide.createIcons({ root: this.resultsList });
        }
      },

      updateSelection: function () {
        const els = this.resultsList?.querySelectorAll('.command-item');
        if (!els) return;
        els.forEach(el => {
          const idx = parseInt(el.getAttribute('data-cmd-idx'), 10);
          const isSel = idx === this.selectedIndex;
          el.classList.toggle('selected', isSel);
          const icon = el.querySelector('[data-lucide="corner-down-left"]');
          if (icon) {
            icon.classList.toggle('opacity-100', isSel);
            icon.classList.toggle('text-inherit', isSel);
            icon.classList.toggle('opacity-0', !isSel);
          }
          if (isSel) {
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        });
      },

      executeItem: function (item) {
        SlideVault.sound.play('click');
        SlideVault.haptics.vibrate(15);
        this.close();
        if (typeof item.run === 'function') {
          item.run();
        }
      },

      open: function () {
        this.initRegistry();
        this.buildDOM();
        this.isOpen = true;
        this.selectedIndex = 0;
        this.backdrop.classList.add('active');
        document.body.classList.add('overflow-hidden');
        this.renderResults();
        setTimeout(() => this.input?.focus(), 50);
        SlideVault.sound.play('toggle');
      },

      close: function () {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.backdrop?.classList.remove('active');
        if (!hasActiveModals()) {
          document.body.classList.remove('overflow-hidden');
        }
      },

      toggle: function () {
        if (this.isOpen) this.close();
        else this.open();
      }
    },

    // =========================================================================
    // 14. SPECULAR MOUSE LIGHTING & MAGNETIC PHYSICS
    // =========================================================================
    specular: {
      init: function () {
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          let ticking = false;
          document.addEventListener('mousemove', (e) => {
            if (!ticking) {
              window.requestAnimationFrame(() => {
                const card = e.target && e.target.closest ? e.target.closest('.specular-card, .glass-card, .saas-main-card, .sheet, .spotlight-card, .tool-card, .bento-card') : null;
                if (card) {
                  const rect = card.getBoundingClientRect();
                  card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
                  card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
                }
                ticking = false;
              });
              ticking = true;
            }
          }, { passive: true });
        }
      }
    },

    // =========================================================================
    // 15. HARDWARE-ADAPTIVE PERFORMANCE & BATTERY TIER AUTO-DETECTOR
    // =========================================================================
    perf: {
      tier: 'ultra',
      detect: function () {
        try {
          const cores = navigator.hardwareConcurrency || 4;
          const ram = navigator.deviceMemory || 8;
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (prefersReduced || (isMobile && (cores <= 4 || ram <= 3))) {
            this.tier = 'low';
          } else if (cores < 8 || ram < 6) {
            this.tier = 'medium';
          } else {
            this.tier = 'ultra';
          }
          
          document.documentElement.setAttribute('data-perf-tier', this.tier);
        } catch (e) {
          this.tier = 'medium';
          document.documentElement.setAttribute('data-perf-tier', 'medium');
        }
      },
      init: function () {
        this.detect();
      }
    },

    // =========================================================================
    // 16. VISIONOS KEYNOTE FULLSCREEN PRESENTER ENGINE (F HOTKEY)
    // =========================================================================
    keynote: {
      backdrop: null,
      stage: null,
      currentSlide: 0,
      currentTheme: 'emerald',
      slides: [
        {
          eyebrow: "SERIES A INVESTMENT DECK",
          title: "Next-Gen FinTech Growth Matrix",
          desc: "Quy mô thị trường 4.2 tỷ USD và tốc độ mở rộng phễu khách hàng toàn cầu",
          kpis: [
            { val: "+340%", lbl: "Tăng trưởng YoY", color: "emerald", bar: "85%" },
            { val: "$12.8M", lbl: "Doanh thu ARR", color: "amber", bar: "92%" },
            { val: "99.2%", lbl: "Tỉ lệ giữ chân", color: "cyan", bar: "99%" }
          ]
        },
        {
          eyebrow: "GLOBAL MARKET PENETRATION",
          title: "Thâm Nhập Thị Trường Đông Nam Á",
          desc: "Hơn 120.000 doanh nghiệp vừa & nhỏ (SME) sẵn sàng chuyển đổi số bài thuyết trình",
          kpis: [
            { val: "120K+", lbl: "Khách hàng tiềm năng", color: "emerald", bar: "78%" },
            { val: "68%", lbl: "Thị phần mục tiêu", color: "amber", bar: "68%" },
            { val: "3.2x", lbl: "Tốc độ viral", color: "cyan", bar: "88%" }
          ]
        },
        {
          eyebrow: "FINANCIAL UNIT ECONOMICS",
          title: "Biên Lợi Nhuận Gộp & Dự Phóng Lãi",
          desc: "Mô hình SaaS biên lợi nhuận 82% và dòng tiền hoạt động dương từ quý 3",
          kpis: [
            { val: "82.4%", lbl: "Biên lợi nhuận gộp", color: "emerald", bar: "82%" },
            { val: "14 tháng", lbl: "Thu hồi vốn CAC", color: "amber", bar: "70%" },
            { val: "4.8x", lbl: "LTV / CAC Ratio", color: "cyan", bar: "90%" }
          ]
        },
        {
          eyebrow: "ROADMAP & USE OF FUNDS",
          title: "Kế Hoạch Giải Ngân Vốn Q1-Q4",
          desc: "Phân bổ 55% phát triển lõi AI, 30% Marketing mở rộng, 15% Vận hành",
          kpis: [
            { val: "100%", lbl: "Đúng tiến độ cam kết", color: "emerald", bar: "100%" },
            { val: "4 Quý", lbl: "Cột mốc bứt phá", color: "amber", bar: "80%" },
            { val: "50+", lbl: "Kỹ sư cốt lõi AI", color: "cyan", bar: "75%" }
          ]
        }
      ],
      ensureDOM: function () {
        if (this.backdrop) return;
        const bd = document.createElement('div');
        bd.id = 'svKeynoteModal';
        bd.className = 'keynote-modal-backdrop';
        bd.innerHTML = `
          <div class="keynote-stage-canvas" id="svKeynoteCanvas">
            <!-- Header bar -->
            <div class="flex items-center justify-between pb-3 border-b border-white/10">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span class="text-xs text-white/70 font-mono ml-2" id="svKeynoteIndicator">Series_A_Unicorn_Deck.pptx • Slide 1/4</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-inherit border border-emerald-500/30"> KEYNOTE 4K PRESENTATION</span>
                <button type="button" class="text-white/60 hover:text-white p-1 rounded-lg cursor-pointer" onclick="SlideVault.keynote.close()">
                  <i data-lucide="x" class="w-5 h-5"></i>
                </button>
              </div>
            </div>

            <!-- Slide Main Content -->
            <div class="my-auto py-6" id="svKeynoteBody"></div>

            <!-- Footer Bar -->
            <div class="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/50 font-medium">
              <span>SlideVault AI Executive Studio 2026</span>
              <div class="flex items-center gap-4">
                <span>Dùng phím <kbd class="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white text-[10px]">←</kbd> <kbd class="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white text-[10px]">→ </kbd> để chuyển slide</span>
                <span><kbd class="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white text-[10px]">ESC</kbd> Thoát</span>
              </div>
            </div>
          </div>

          <!-- Bottom Floating Controls -->
          <div class="keynote-controls-bar">
            <button type="button" class="p-2 rounded-full hover:bg-white/10 cursor-pointer active:scale-95" onclick="SlideVault.keynote.prev()" title="Slide Trước (←)">
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <span class="text-xs font-mono font-bold px-2" id="svKeynotePageNum">1 / 4</span>
            <button type="button" class="p-2 rounded-full hover:bg-white/10 cursor-pointer active:scale-95" onclick="SlideVault.keynote.next()" title="Slide Kế (→)">
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
            <div class="w-px h-4 bg-white/20 mx-1"></div>
            <!-- Theme chips inside keynote -->
            <button type="button" onclick="SlideVault.keynote.setTheme('emerald')" class="w-4 h-4 rounded-full bg-emerald-400 border border-white/40 cursor-pointer hover:scale-125 transition-transform" title="Emerald"></button>
            <button type="button" onclick="SlideVault.keynote.setTheme('titanium')" class="w-4 h-4 rounded-full bg-slate-200 border border-white/40 cursor-pointer hover:scale-125 transition-transform" title="Titanium"></button>
            <button type="button" onclick="SlideVault.keynote.setTheme('cyberpunk')" class="w-4 h-4 rounded-full bg-pink-500 border border-white/40 cursor-pointer hover:scale-125 transition-transform" title="Cyberpunk"></button>
            <button type="button" onclick="SlideVault.keynote.setTheme('sapphire')" class="w-4 h-4 rounded-full bg-sky-400 border border-white/40 cursor-pointer hover:scale-125 transition-transform" title="Sapphire"></button>
            <div class="w-px h-4 bg-white/20 mx-1"></div>
            <button type="button" class="px-3 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold border border-red-500/30 cursor-pointer" onclick="SlideVault.keynote.close()">
              Thoát (ESC)
            </button>
          </div>
        `;
        document.body.appendChild(bd);
        this.backdrop = bd;
        this.stage = bd.querySelector('#svKeynoteCanvas');
        if (window.lucide) lucide.createIcons({ root: bd });
      },
      render: function () {
        this.ensureDOM();
        const slide = this.slides[this.currentSlide];
        if (!slide) return;

        const body = this.backdrop.querySelector('#svKeynoteBody');
        body.innerHTML = `
          <div>
            <div class="text-xs uppercase tracking-widest font-bold text-inherit mb-2">${slide.eyebrow}</div>
            <h2 class="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">${slide.title}</h2>
            <p class="text-sm sm:text-base text-inherit max-w-2xl mb-6">${slide.desc}</p>
          </div>
          <div class="grid grid-cols-3 gap-4 my-4">
            ${slide.kpis.map(k => `
              <div class="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div class="text-2xl sm:text-3xl font-black font-mono tracking-tight text-${k.color}-400 mb-1">${k.val}</div>
                <div class="text-xs text-inherit font-medium mb-2">${k.lbl}</div>
                <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-${k.color}-400 h-full rounded-full" style="width: ${k.bar};"></div>
                </div>
              </div>
            `).join('')}
          </div>
        `;

        this.backdrop.querySelector('#svKeynoteIndicator').innerText = `Series_A_Unicorn_Deck.pptx • Slide ${this.currentSlide + 1}/${this.slides.length}`;
        this.backdrop.querySelector('#svKeynotePageNum').innerText = `${this.currentSlide + 1} / ${this.slides.length}`;
        this.stage.className = `keynote-stage-canvas theme-${this.currentTheme}`;
        if (window.lucide) lucide.createIcons({ root: body });
      },
      open: function (index = 0) {
        this.ensureDOM();
        this.currentSlide = index;
        this.render();
        this.backdrop.classList.add('active');
        document.body.classList.add('overflow-hidden');
        SlideVault.sound.play('toggle');
        SlideVault.dynamicIsland.show({ icon: 'presentation', title: 'Chế độ Trình Chiếu Keynote', message: 'Toàn màn hình 16:9 4K • Nhấn ESC để thoát' });
      },
      close: function () {
        if (!this.backdrop) return;
        this.backdrop.classList.remove('active');
        document.body.classList.remove('overflow-hidden');
        SlideVault.sound.play('click');
      },
      toggle: function () {
        if (this.backdrop?.classList.contains('active')) this.close();
        else this.open();
      },
      next: function () {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.render();
        SlideVault.sound.play('click');
        SlideVault.haptics.vibrate(10);
      },
      prev: function () {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.render();
        SlideVault.sound.play('click');
        SlideVault.haptics.vibrate(10);
      },
      setTheme: function (theme) {
        this.currentTheme = theme;
        this.render();
        SlideVault.sound.play('toggle');
        SlideVault.dynamicIsland.show({ icon: 'palette', title: 'Đổi bảng màu: ' + theme.toUpperCase(), message: 'Đã cập nhật phong cách trình chiếu Keynote' });
      }
    },

    // =========================================================================
    // 17. MATHEMATICAL TEAMWORK & COLLABORATIVE PREVIEW (/teamwork-preview)
    // =========================================================================
    teamworkPreview: {
      backdrop: null,
      active: false,
      timer: null,
      collaborators: [
        { id: 1, name: 'Nguyễn An (Lead UI/UX)', role: 'Chủ trì slide', color: '#10b981', initial: 'NA', x: 28, y: 35, slide: 1, action: 'Đang chỉnh sửa Bố cục tỷ lệ vàng φ' },
        { id: 2, name: 'Sarah Chen (VP Product)', role: 'Xem xét & Góp ý', color: '#6366f1', initial: 'SC', x: 64, y: 52, slide: 2, action: 'Đang rà soát KPI Tài chính ARR' },
        { id: 3, name: 'Alex Miller (AI Scientist)', role: 'Cố vấn thuật toán', color: '#ec4899', initial: 'AM', x: 42, y: 78, slide: 1, action: 'Tối ưu hoá Tensor Matrix 3D' }
      ],
      ensureDOM: function () {
        if (this.backdrop) return;
        const bd = document.createElement('div');
        bd.id = 'svTeamworkPreviewModal';
        bd.className = 'teamwork-modal-backdrop';
        bd.setAttribute('role', 'dialog');
        bd.setAttribute('aria-modal', 'true');
        bd.setAttribute('aria-label', 'Chế Độ Xem Nhóm Cộng Tác Trực Tiếp');
        bd.innerHTML = `
          <div class="teamwork-modal-panel liquid-glass-optical" onclick="event.stopPropagation()">
            <!-- Topbar -->
            <div class="flex items-center justify-between pb-3 border-b border-border/40 shrink-0">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="font-bold text-sm text-foreground">Không Gian Cộng Tác Thời Gian Thực</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-inherit border border-emerald-500/30 font-semibold">120Hz Đồng Bộ</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground font-mono hidden sm:inline">Trễ mạng: 14ms</span>
                <button type="button" class="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer" onclick="SlideVault.teamworkPreview.close()" aria-label="Đóng Không Gian Làm Việc Nhóm">
                  <i data-lucide="x" class="w-5 h-5"></i>
                </button>
              </div>
            </div>

            <!-- Main Stage Canvas -->
            <div class="relative flex-1 min-h-[380px] bg-black/30 rounded-xl overflow-hidden border border-border/40 my-3.5 flex items-center justify-center" id="svTeamworkCanvas">
              <!-- Grid Background Lines -->
              <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              
              <!-- Slide Mockup Center -->
              <div class="relative w-[85%] max-w-lg aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 p-5 shadow-2xl flex flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono text-emerald-400 tracking-wider font-bold">SLIDEVAULT • KEYNOTE MATRIX</span>
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span class="text-[10px] text-muted-foreground">Khóa biên tập bởi NA</span>
                  </div>
                </div>
                <div>
                  <h4 class="text-lg sm:text-xl font-bold text-white tracking-tight mb-1">Mô Hình Tăng Trưởng Tài Chính 2026</h4>
                  <p class="text-xs text-muted-foreground">Tối ưu hoá chuyển đổi và tính toán hình học tỷ lệ vàng (phi = 1.618)</p>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-muted-foreground">
                  <span>Trang 1 / 4 • Sẵn sàng xuất bản .PPTX</span>
                  <span class="text-emerald-400 font-mono">Phiên #SV-7892</span>
                </div>
              </div>

              <!-- Animated Collaborator Cursors -->
              <div id="svCollabCursor1" class="collab-cursor" style="top: 35%; left: 28%;">
                <div class="cursor-pointer-dot bg-emerald-500"></div>
                <div class="cursor-badge bg-emerald-500 text-white font-semibold">Nguyễn An (Lead)</div>
              </div>
              <div id="svCollabCursor2" class="collab-cursor" style="top: 52%; left: 64%;">
                <div class="cursor-pointer-dot bg-indigo-500"></div>
                <div class="cursor-badge bg-indigo-500 text-white font-semibold">Sarah Chen (VP)</div>
              </div>
              <div id="svCollabCursor3" class="collab-cursor" style="top: 75%; left: 42%;">
                <div class="cursor-pointer-dot bg-pink-500"></div>
                <div class="cursor-badge bg-pink-500 text-white font-semibold">Alex Miller (AI)</div>
              </div>
            </div>

            <!-- Participants Bar & Action Dock -->
            <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40 shrink-0">
              <div class="flex items-center gap-2">
                <span class="text-xs text-muted-foreground font-medium">Đang có mặt:</span>
                <div class="flex -space-x-1.5">
                  <span class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold ring-2 ring-background" title="Nguyễn An">NA</span>
                  <span class="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold ring-2 ring-background" title="Sarah Chen">SC</span>
                  <span class="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold ring-2 ring-background" title="Alex Miller">AM</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="SlideVault.teamworkPreview.sendReaction('🎉')" class="px-2.5 py-1.5 rounded-full bg-surface-pill border border-border/60 hover:bg-muted text-xs cursor-pointer active:scale-95 transition-all" aria-label="Gửi phản ứng Pháo hoa">
                  🎉 Hoan hô
                </button>
                <button type="button" onclick="SlideVault.teamworkPreview.sendReaction('🚀')" class="px-2.5 py-1.5 rounded-full bg-surface-pill border border-border/60 hover:bg-muted text-xs cursor-pointer active:scale-95 transition-all" aria-label="Gửi phản ứng Tên lửa">
                  🚀 Tăng tốc
                </button>
                <button type="button" onclick="SlideVault.teamworkPreview.sendReaction('💡')" class="px-2.5 py-1.5 rounded-full bg-surface-pill border border-border/60 hover:bg-muted text-xs cursor-pointer active:scale-95 transition-all" aria-label="Gửi phản ứng Ý tưởng">
                  💡 Ý tưởng hay
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(bd);
        this.backdrop = bd;
        bd.addEventListener('click', (e) => {
          if (e.target === bd) SlideVault.teamworkPreview.close();
        });
        if (window.lucide && typeof lucide.createIcons === 'function') {
          lucide.createIcons({ root: bd });
        }
      },
      open: function () {
        this.ensureDOM();
        this.active = true;
        this.backdrop.classList.add('active');
        document.body.classList.add('overflow-hidden');
        if (SlideVault.sound) SlideVault.sound.play('toggle');
        if (SlideVault.haptics) SlideVault.haptics.vibrate(15);
        this.startHarmonicMotion();
      },
      close: function () {
        if (!this.backdrop) return;
        this.active = false;
        this.backdrop.classList.remove('active');
        if (!hasActiveModals()) {
          document.body.classList.remove('overflow-hidden');
        }
        if (this.timer) cancelAnimationFrame(this.timer);
      },
      startHarmonicMotion: function () {
        let t = 0;
        const c1 = this.backdrop.querySelector('#svCollabCursor1');
        const c2 = this.backdrop.querySelector('#svCollabCursor2');
        const c3 = this.backdrop.querySelector('#svCollabCursor3');
        const animate = () => {
          if (!this.active) return;
          t += 0.035;
          if (c1) {
            const x = 28 + 8 * Math.sin(t * 0.8);
            const y = 35 + 6 * Math.cos(t * 0.6);
            c1.style.left = `${x.toFixed(2)}%`;
            c1.style.top = `${y.toFixed(2)}%`;
          }
          if (c2) {
            const x = 64 + 6 * Math.cos(t * 0.9);
            const y = 52 + 7 * Math.sin(t * 0.7);
            c2.style.left = `${x.toFixed(2)}%`;
            c2.style.top = `${y.toFixed(2)}%`;
          }
          if (c3) {
            const x = 42 + 7 * Math.sin(t * 0.5 + 1.2);
            const y = 75 + 5 * Math.cos(t * 0.8 + 0.5);
            c3.style.left = `${x.toFixed(2)}%`;
            c3.style.top = `${y.toFixed(2)}%`;
          }
          this.timer = requestAnimationFrame(animate);
        };
        this.timer = requestAnimationFrame(animate);
      },
      sendReaction: function (emoji) {
        if (SlideVault.sound) SlideVault.sound.play('click');
        if (SlideVault.haptics) SlideVault.haptics.vibrate(10);
        if (SlideVault.dynamicIsland) {
          SlideVault.dynamicIsland.show({
            icon: 'sparkles',
            title: `Cộng tác viên gửi: ${emoji}`,
            message: 'Đã truyền phát phản ứng đến toàn bộ nhóm làm việc',
            duration: 2500
          });
        }
      }
    },

    // =========================================================================
    // 18. TURBO MATHEMATICAL HW ACCELERATION ENGINE (/boost)
    // =========================================================================
    boostEngine: {
      active: false,
      run: function () {
        this.active = !this.active;
        const isBoosted = this.active;

        document.querySelectorAll('.saas-main-card, .glass-card, .bento-card, .sv-ultra-card, .mobile-glass-nav, .saas-topbar').forEach(el => {
          if (isBoosted) {
            el.style.transform = el.style.transform || 'translate3d(0, 0, 0)';
            el.style.willChange = 'transform, opacity';
            el.classList.add('zero-thrash-motion');
          } else {
            el.style.willChange = '';
            el.classList.remove('zero-thrash-motion');
          }
        });

        document.documentElement.setAttribute('data-sv-boost', isBoosted ? 'true' : 'false');

        if (SlideVault.sound) SlideVault.sound.play('success');
        if (SlideVault.haptics) SlideVault.haptics.vibrate([25, 45, 25]);

        if (SlideVault.dynamicIsland) {
          SlideVault.dynamicIsland.show({
            icon: isBoosted ? 'zap' : 'check-circle-2',
            title: isBoosted ? '🚀 Turbo Boost: 120Hz GPU Engaged' : '⚙️ Đã trở về chế độ tiêu chuẩn',
            message: isBoosted ? 'Tối ưu hoá toán học vật lý • Không độ trễ khung hình • 120 FPS' : 'Cấu hình tiết kiệm năng lượng đã kích hoạt',
            duration: 4000
          });
        }
        return isBoosted;
      }
    },

    // =========================================================================
    // 19. ANDROID & MULTI-DEVICE SIMULATION HUB (/android-device-hub)
    // =========================================================================
    androidDeviceHub: {
      backdrop: null,
      currentDevice: 'galaxy-s24',
      orientation: 'portrait',
      devices: {
        'galaxy-s24': { name: 'Samsung Galaxy S24 Ultra (Android 14)', width: 393, height: 852, type: 'phone', os: 'One UI 6.1 • Android', icon: 'smartphone' },
        'pixel-tablet': { name: 'Google Pixel Tablet (Android OS)', width: 820, height: 1180, type: 'tablet', os: 'Pixel Experience Tablet', icon: 'tablet' },
        'galaxy-fold': { name: 'Samsung Galaxy Z Fold 5 (Mở Rộng)', width: 840, height: 650, type: 'foldable', os: 'Multi-Window Android Fold', icon: 'book-open' },
        'macbook-pc': { name: 'PC / Màn Hình 16:9 Máy Tính Bàn', width: 1440, height: 900, type: 'desktop', os: 'Desktop Ultra HD Viewport', icon: 'monitor' }
      },
      ensureDOM: function () {
        if (this.backdrop) return;
        const bd = document.createElement('div');
        bd.id = 'svAndroidDeviceHubModal';
        bd.className = 'device-hub-backdrop';
        bd.setAttribute('role', 'dialog');
        bd.setAttribute('aria-modal', 'true');
        bd.setAttribute('aria-label', 'Android & Multi-Device Hub Simulator');
        bd.innerHTML = `
          <div class="device-hub-container" onclick="event.stopPropagation()">
            <!-- Hub Top Toolbar -->
            <div class="device-hub-toolbar liquid-glass-optical">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-inherit flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <i data-lucide="smartphone" class="w-4 h-4"></i>
                </div>
                <div>
                  <div class="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <span>Android & Tablet Device Hub</span>
                    <span class="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-inherit border border-emerald-500/30 font-bold">Pro CLI</span>
                  </div>
                  <div class="text-[10px] text-muted-foreground" id="svHubDeviceSpec">Samsung Galaxy S24 Ultra • 393 × 852px</div>
                </div>
              </div>

              <!-- Device Switcher Pills -->
              <div class="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-border/40">
                <button type="button" class="hub-pill active" onclick="SlideVault.androidDeviceHub.setDevice('galaxy-s24')" data-hub-dev="galaxy-s24" title="Samsung Galaxy S24 Ultra" aria-label="Chọn thiết bị Galaxy S24 Ultra">
                  <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
                  <span class="hidden md:inline">Galaxy S24</span>
                </button>
                <button type="button" class="hub-pill" onclick="SlideVault.androidDeviceHub.setDevice('pixel-tablet')" data-hub-dev="pixel-tablet" title="Google Pixel Tablet / iPad" aria-label="Chọn thiết bị Pixel Tablet">
                  <i data-lucide="tablet" class="w-3.5 h-3.5"></i>
                  <span class="hidden md:inline">Tablet (820px)</span>
                </button>
                <button type="button" class="hub-pill" onclick="SlideVault.androidDeviceHub.setDevice('galaxy-fold')" data-hub-dev="galaxy-fold" title="Galaxy Z Fold" aria-label="Chọn thiết bị Galaxy Z Fold">
                  <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                  <span class="hidden md:inline">Fold (840px)</span>
                </button>
                <button type="button" class="hub-pill" onclick="SlideVault.androidDeviceHub.setDevice('macbook-pc')" data-hub-dev="macbook-pc" title="PC Desktop 16:9" aria-label="Chọn thiết bị PC Desktop">
                  <i data-lucide="monitor" class="w-3.5 h-3.5"></i>
                  <span class="hidden md:inline">PC (1440px)</span>
                </button>
              </div>

              <!-- Controls: Rotate, Close -->
              <div class="flex items-center gap-2">
                <button type="button" class="p-2 rounded-xl bg-surface-pill border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all" onclick="SlideVault.androidDeviceHub.toggleOrientation()" title="Xoay hướng màn hình (Ngang / Dọc)" aria-label="Xoay hướng màn hình">
                  <i data-lucide="rotate-cw" class="w-4 h-4"></i>
                </button>
                <button type="button" class="p-2 rounded-xl bg-surface-pill border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-all" onclick="SlideVault.androidDeviceHub.close()" title="Đóng Hub" aria-label="Đóng Device Hub">
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Viewport Stage Area -->
            <div class="device-stage-viewport">
              <div class="device-mockup-frame" id="svHubFrame">
                <!-- Status Bar -->
                <div class="device-status-bar">
                  <span class="text-[11px] font-semibold text-white/90 font-mono">09:41</span>
                  <div class="device-camera-hole"></div>
                  <div class="flex items-center gap-1.5 text-white/90 text-xs">
                    <i data-lucide="wifi" class="w-3.5 h-3.5"></i>
                    <i data-lucide="battery" class="w-3.5 h-3.5"></i>
                  </div>
                </div>

                <!-- Live Iframe Renderer -->
                <div class="device-iframe-wrapper">
                  <iframe id="svHubIframe" src="trangchudong.html" class="w-full h-full border-0" title="Bản xem trước SlideVault"></iframe>
                </div>

                <!-- Bottom Home Gesture Bar -->
                <div class="device-home-bar">
                  <div class="w-32 h-1 bg-white/40 rounded-full mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(bd);
        this.backdrop = bd;
        bd.addEventListener('click', (e) => {
          if (e.target === bd || e.target.classList.contains('device-stage-viewport')) {
            SlideVault.androidDeviceHub.close();
          }
        });
        if (window.lucide && typeof lucide.createIcons === 'function') {
          lucide.createIcons({ root: bd });
        }
      },
      open: function (deviceKey = 'galaxy-s24') {
        this.ensureDOM();
        this.backdrop.classList.add('active');
        document.body.classList.add('overflow-hidden');
        this.setDevice(deviceKey);
        if (SlideVault.sound) SlideVault.sound.play('toggle');
        if (SlideVault.haptics) SlideVault.haptics.vibrate(12);
      },
      close: function () {
        if (!this.backdrop) return;
        this.backdrop.classList.remove('active');
        if (!hasActiveModals()) {
          document.body.classList.remove('overflow-hidden');
        }
      },
      setDevice: function (deviceKey) {
        if (!this.devices[deviceKey]) return;
        this.currentDevice = deviceKey;
        const dev = this.devices[deviceKey];

        this.backdrop.querySelectorAll('[data-hub-dev]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-hub-dev') === deviceKey);
        });

        const spec = this.backdrop.querySelector('#svHubDeviceSpec');
        if (spec) {
          spec.textContent = `${dev.name} • ${dev.width} × ${dev.height}px (${dev.os})`;
        }

        this.applyFrameMetrics();
        if (SlideVault.sound) SlideVault.sound.play('click');
      },
      toggleOrientation: function () {
        this.orientation = this.orientation === 'portrait' ? 'landscape' : 'portrait';
        this.applyFrameMetrics();
        if (SlideVault.sound) SlideVault.sound.play('toggle');
        if (SlideVault.haptics) SlideVault.haptics.vibrate(8);
      },
      applyFrameMetrics: function () {
        const frame = this.backdrop?.querySelector('#svHubFrame');
        if (!frame) return;

        const dev = this.devices[this.currentDevice];
        let w = this.orientation === 'portrait' ? dev.width : dev.height;
        let h = this.orientation === 'portrait' ? dev.height : dev.width;

        const maxH = window.innerHeight * 0.74;
        const maxW = window.innerWidth * 0.88;
        const scaleW = maxW / w;
        const scaleH = maxH / h;
        const fitScale = Math.min(1.0, Math.min(scaleW, scaleH));

        frame.style.width = `${w}px`;
        frame.style.height = `${h}px`;
        frame.style.transform = `scale(${fitScale.toFixed(3)})`;
      }
    },

    // =========================================================================
    // 20. INITIALIZATION
    // =========================================================================
    init: function () {
      this.perf.init();
      this.theme.init();
      this.typewriter.init();
      this.navigation.init();
      this.dynamicMobileNav.init();
      this.dynamicIsland.init();
      this.specular.init();
      this.user.init();
      this.setupEventDelegation();

      if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
      }
    }
  };

  // ===========================================================================
  // 12. ZERO-BOOTSTRAP COMPATIBILITY BRIDGE (TRANSPARENT PROXY)
  // Maps any legacy `bootstrap.Modal` or `bootstrap.Offcanvas` seamlessly to shadcn
  // ===========================================================================
  class BootstrapModalShim {
    constructor(el) { this.el = el; }
    show() { SlideVault.dialog.open(this.el); }
    hide() { SlideVault.dialog.close(this.el); }
    toggle() { SlideVault.dialog.toggle(this.el); }
    static getInstance(el) { return new BootstrapModalShim(el); }
    static getOrCreateInstance(el) { return new BootstrapModalShim(el); }
  }

  class BootstrapOffcanvasShim {
    constructor(el) { this.el = el; }
    show() { SlideVault.sheet.open(this.el); }
    hide() { SlideVault.sheet.close(this.el); }
    toggle() { SlideVault.sheet.toggle(this.el); }
    static getInstance(el) { return new BootstrapOffcanvasShim(el); }
    static getOrCreateInstance(el) { return new BootstrapOffcanvasShim(el); }
  }

  window.bootstrap = {
    Modal: BootstrapModalShim,
    Offcanvas: BootstrapOffcanvasShim
  };

  // Global namespace exports
  window.SlideVault = SlideVault;
  window.SlideVaultUI = SlideVault;
  window.shadcn = SlideVault;
  window.confirmLogoutSetting = () => SlideVault.user.logout();
  window.logoutUser = () => SlideVault.user.logout();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SlideVault.init());
  } else {
    SlideVault.init();
  }
})();
