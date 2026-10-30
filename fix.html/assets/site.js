/* ============================================================================
 * SlideVault · Tiện ích dùng chung cho web (trangchudong, service-admin, security…)
 * Không phụ thuộc thư viện ngoài — chạy tốt trên mọi trình duyệt hiện đại.
 * ========================================================================== */
(function () {
  'use strict';
  var SV = (window.SV = window.SV || {});

  /* ---- DOM ---- */
  SV.q = function (sel, root) { return (root || document).querySelector(sel); };
  SV.qa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  SV.escapeHtml = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  };

  /* ---- Định dạng ---- */
  SV.fmt = {
    bytes: function (n) {
      if (!isFinite(n)) return '—';
      var units = ['B', 'KB', 'MB', 'GB', 'TB'];
      var v = n, u = 0;
      while (v >= 1024 && u < units.length - 1) { v /= 1024; u += 1; }
      return (u === 0 || v >= 100 ? Math.round(v) : v.toFixed(1)) + ' ' + units[u];
    },
    vnd: function (n) {
      try { return new Intl.NumberFormat('vi-VN').format(Number(n) || 0) + ' ₫'; }
      catch (e) { return (Number(n) || 0) + ' ₫'; }
    },
    num: function (n) {
      try { return new Intl.NumberFormat('vi-VN').format(Number(n) || 0); } catch (e) { return String(n || 0); }
    },
    time: function (iso) {
      try { return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }); }
      catch (e) { return String(iso || ''); }
    },
    shortTime: function (iso) {
      try { return new Date(iso).toLocaleTimeString('vi-VN'); } catch (e) { return ''; }
    },
  };

  /* ---- Toast ---- */
  SV.toast = function (message, type, timeout) {
    var wrap = document.getElementById('toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    el.innerHTML = SV.escapeHtml(message);
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(function () { el.remove(); }, 320);
    }, timeout || 4200);
    return el;
  };

  /* ---- Fetch có timeout + xử lý lỗi thống nhất ---- */
  SV.fetchJSON = function (url, options) {
    options = options || {};
    var timeout = options.timeout || 12000;
    var controller = ('AbortController' in window) ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeout) : null;
    var init = Object.assign({}, options, controller ? { signal: controller.signal } : {});
    delete init.timeout;
    return fetch(url, init).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = { raw: text }; }
        if (!res.ok) {
          var err = new Error((data && data.error) || ('HTTP ' + res.status));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  };

  SV.postJSON = function (url, body) {
    return SV.fetchJSON(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
  };

  /* ---- Clock ---- */
  SV.clock = function (selector) {
    var el = typeof selector === 'string' ? SV.q(selector) : selector;
    if (!el) return;
    var tick = function () {
      el.textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    tick();
    setInterval(tick, 1000);
  };

  /* ---- Đánh dấu nav đang xem ---- */
  SV.activeNav = function () {
    var here = location.pathname.replace(/\/+$/, '') || '/';
    SV.qa('.sidebar-nav a').forEach(function (a) {
      var target = (a.getAttribute('href') || '').split('#')[0].replace(/\/+$/, '') || '/';
      if (target === here || (target !== '/' && target && here.indexOf(target) === 0)) a.classList.add('active');
    });
  };

  /* ---- Ripple cho nút ---- */
  SV.ripple = function () {
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.btn') : null;
      if (!btn || btn.disabled) return;
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - rect.left - size / 2) + 'px';
      span.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(span);
      setTimeout(function () { span.remove(); }, 640);
    });
  };

  SV.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { SV.toast('Đã sao chép', 'ok'); });
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); SV.toast('Đã sao chép', 'ok'); } catch (e) { SV.toast('Không sao chép được', 'err'); }
    ta.remove();
    return Promise.resolve();
  };

  SV.emptyRow = function (colspan, text) {
    return '<tr><td colspan="' + colspan + '" class="quiet center">' + SV.escapeHtml(text) + '</td></tr>';
  };

  /* ---- Upload quét file an toàn (kèm tiến trình) ---- */
  SV.uploadScan = function (file, handlers) {
    handlers = handlers || {};
    return new Promise(function (resolve, reject) {
      var form = new FormData();
      form.append('file', file, file.name);
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/scan-file');
      xhr.upload.onprogress = function (e) {
        if (handlers.onProgress && e.lengthComputable) handlers.onProgress(e.loaded / e.total);
      };
      xhr.onload = function () {
        var data = null;
        try { data = JSON.parse(xhr.responseText || '{}'); } catch (e) { data = {}; }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.error || ('HTTP ' + xhr.status)));
      };
      xhr.onerror = function () { reject(new Error('Lỗi mạng khi tải file lên.')); };
      xhr.send(form);
    });
  };

  /* ---- SSE nhật ký trực tiếp (tự kết nối lại) ---- */
  SV.connectSSE = function (path, onMessage, onState) {
    var source = null;
    var closed = false;
    var retry = 0;
    var connect = function () {
      if (closed) return;
      try { source = new EventSource(path); } catch (e) { scheduleRetry(); return; }
      source.onopen = function () { retry = 0; onState && onState('open'); };
      source.onmessage = function (event) {
        var data = null;
        try { data = JSON.parse(event.data); } catch (e) { data = { msg: event.data }; }
        onMessage && onMessage(data);
      };
      source.onerror = function () {
        onState && onState('reconnecting');
        if (source) { source.close(); source = null; }
        scheduleRetry();
      };
    };
    var scheduleRetry = function () {
      retry += 1;
      var wait = Math.min(15000, 1500 * Math.pow(1.5, Math.min(retry, 6)));
      setTimeout(connect, wait);
    };
    connect();
    return function () { closed = true; if (source) source.close(); };
  };

  /* ---- Chế độ demo: API lỗi thì hiển thị dữ liệu mẫu, không vỡ giao diện ---- */
  SV.demoMode = false;
  SV.guard = function (promise, fallback, label) {
    return promise.catch(function (err) {
      if (!SV.demoMode) {
        SV.demoMode = true;
        SV.toast('Không kết nối được API' + (label ? ' (' + label + ')' : '') + ' — đang hiển thị dữ liệu mẫu.', 'warn', 5200);
      }
      return typeof fallback === 'function' ? fallback(err) : fallback;
    });
  };

  /* ---- Khởi tạo chung ---- */
  SV.boot = function () {
    SV.ripple();
    SV.activeNav();
    var clockEl = document.getElementById('clock');
    if (clockEl) SV.clock(clockEl);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', SV.boot);
  else SV.boot();

  /* ---- Cập nhật trạng thái kết nối góc sidebar ---- */
  SV.setStatus = function (text, ok) {
    var el = document.getElementById('app-status');
    if (!el) return;
    el.innerHTML = '<span class="status-dot"></span>' + SV.escapeHtml(text);
    el.style.color = ok === false ? 'var(--danger)' : '';
  };
})();
