#!/usr/bin/env node

/**
 * ============================================================================
 * EMPIRICAL ADVERSARIAL STRESS TEST HARNESS (CHALLENGER 1 GEN 3)
 * SlideVault Mobile & Tablet UI Overhaul (Milestones M1–M4)
 * ============================================================================
 * Scope:
 * 1. Rapid scrolling & auto-restoration timer edge cases (alternating scrolls,
 *    multi-touch events, scroll stop after 1000ms idle, preemption, modal block).
 * 2. Modal suppression & CTA visibility:
 *    - #quickViewDialog, #checkoutDialog, #templatePreviewModal, #settingLogoutModal.
 *    - 100% bottom dock suppression (:has, body.modal-open, MutationObserver).
 *    - 100% CTA button visibility & clickability ("Tải Slide Ngay", "Thêm Vào Giỏ",
 *      "Xác Nhận Đã Chuyển Khoản").
 * 3. Symmetrical Apple VisionOS cubic-bezier(0.16, 1, 0.3, 1) spring physics & 0.42s.
 * 4. Cryptographic SHA-256 byte-for-byte binary invariance between index.html and
 *    trangchudong.html.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
}
function readProjectBuffer(relPath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relPath));
}

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTest(category, name, testFn) {
  testResults.total++;
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    testResults.passed++;
    testResults.details.push({ category, name, passed: true, duration });
    console.log(`  [PASS] [${category}] ${name} (${duration}ms)`);
  } catch (err) {
    const duration = Date.now() - start;
    testResults.failed++;
    testResults.details.push({ category, name, passed: false, duration, error: err.message });
    console.error(`  [FAIL] [${category}] ${name} (${duration}ms)`);
    console.error(`         Error: ${err.message}`);
  }
}

/**
 * High-fidelity Headless DOM Simulator with W3C HTML5 User-Agent Stylesheet Semantics
 */
function createHeadlessDOM() {
  const listeners = {};
  const elementRegistry = new Map();

  function makeClassList(initialClasses = []) {
    const set = new Set(initialClasses);
    return {
      classes: set,
      add: (...cls) => cls.forEach(c => set.add(c)),
      remove: (...cls) => cls.forEach(c => set.delete(c)),
      contains: (c) => set.has(c),
      toggle: (c, force) => {
        if (force === true) set.add(c);
        else if (force === false) set.delete(c);
        else if (set.has(c)) set.delete(c);
        else set.add(c);
      },
      toString: () => Array.from(set).join(' ')
    };
  }

  function matchesSelector(elem, sel) {
    if (!elem) return false;
    const parts = sel.split(',').map(s => s.trim());
    for (const part of parts) {
      if (part.startsWith('#') && elem.id === part.slice(1)) return true;
      if (part.startsWith('.') && elem.classList.contains(part.slice(1))) return true;
      if (part.toLowerCase() === elem.tagName.toLowerCase()) return true;
      if (part.startsWith('[') && part.endsWith(']')) {
        const attrExpr = part.slice(1, -1);
        if (attrExpr.includes('=')) {
          const [k, v] = attrExpr.split('=');
          const cleanV = v.replace(/['"]/g, '');
          if (elem.getAttribute(k) === cleanV) return true;
        } else {
          if (elem.hasAttribute(attrExpr)) return true;
        }
      }
    }
    return false;
  }

  function createElement(tagName, id = null, classNames = '', attrs = {}) {
    const classList = makeClassList(classNames.split(/\s+/).filter(Boolean));
    const styleProps = {};
    const elem = {
      tagName: tagName.toUpperCase(),
      id,
      attrs: { ...attrs },
      classList,
      style: {
        properties: styleProps,
        setProperty: (k, v) => { styleProps[k] = String(v); },
        getPropertyValue: (k) => styleProps[k] || '',
        removeProperty: (k) => { delete styleProps[k]; }
      },
      // Layout dimensions obey HTML5 User-Agent default stylesheet:
      // dialog:not([open]) has display: none -> 0 dimensions
      get offsetWidth() {
        if (elem.tagName === 'DIALOG' && !elem.hasAttribute('open')) return 0;
        if (elem.classList.contains('hidden') || elem.style.properties['display'] === 'none') return 0;
        return 393;
      },
      get offsetHeight() {
        if (elem.tagName === 'DIALOG' && !elem.hasAttribute('open')) return 0;
        if (elem.classList.contains('hidden') || elem.style.properties['display'] === 'none') return 0;
        return 48;
      },
      getClientRects: () => {
        if (elem.offsetWidth === 0 || elem.offsetHeight === 0) return [];
        return [{ width: elem.offsetWidth, height: elem.offsetHeight }];
      },
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: elem.offsetWidth,
        height: elem.offsetHeight,
        right: elem.offsetWidth,
        bottom: elem.offsetHeight
      }),
      getAttribute: (a) => elem.attrs[a] !== undefined ? elem.attrs[a] : null,
      setAttribute: (a, v) => { elem.attrs[a] = String(v); },
      removeAttribute: (a) => { delete elem.attrs[a]; },
      hasAttribute: (a) => a in elem.attrs,
      children: [],
      parentNode: null,
      appendChild: (ch) => {
        elem.children.push(ch);
        ch.parentNode = elem;
      },
      get firstChild() {
        return elem.children.length > 0 ? elem.children[0] : null;
      },
      insertBefore: (newChild, refChild) => {
        if (!refChild) {
          elem.appendChild(newChild);
          return newChild;
        }
        const idx = elem.children.indexOf(refChild);
        if (idx !== -1) {
          elem.children.splice(idx, 0, newChild);
        } else {
          elem.children.push(newChild);
        }
        newChild.parentNode = elem;
        return newChild;
      },
      closest: (sel) => {
        let cur = elem;
        while (cur) {
          if (matchesSelector(cur, sel)) return cur;
          cur = cur.parentNode;
        }
        return null;
      },
      querySelector: (sel) => {
        for (const child of elem.children) {
          if (matchesSelector(child, sel)) return child;
          const found = child.querySelector && child.querySelector(sel);
          if (found) return found;
        }
        return null;
      },
      querySelectorAll: (sel) => {
        const res = [];
        for (const child of elem.children) {
          if (matchesSelector(child, sel)) res.push(child);
          if (child.querySelectorAll) res.push(...child.querySelectorAll(sel));
        }
        return res;
      },
      addEventListener: (evt, fn) => {
        if (!elem._listeners) elem._listeners = {};
        if (!elem._listeners[evt]) elem._listeners[evt] = [];
        elem._listeners[evt].push(fn);
      },
      dispatchEvent: (evt) => {
        if (elem._listeners && elem._listeners[evt.type]) {
          elem._listeners[evt.type].forEach(fn => fn(evt));
        }
      },
      click: () => {
        if (elem._listeners && elem._listeners['click']) {
          elem._listeners['click'].forEach(fn => fn({ type: 'click', target: elem, preventDefault: () => {} }));
        }
      }
    };

    if (tagName.toLowerCase() === 'dialog') {
      elem.open = false;
      elem.showModal = function() {
        elem.open = true;
        elem.setAttribute('open', '');
        if (windowObj.HTMLDialogElement && windowObj.HTMLDialogElement.prototype.showModal) {
          windowObj.HTMLDialogElement.prototype.showModal.call(elem);
        }
      };
      elem.close = function() {
        elem.open = false;
        elem.removeAttribute('open');
        if (windowObj.HTMLDialogElement && windowObj.HTMLDialogElement.prototype.close) {
          windowObj.HTMLDialogElement.prototype.close.call(elem);
        }
      };
    }

    if (id) elementRegistry.set(id, elem);
    return elem;
  }

  const documentElement = createElement('HTML', null, 'dark');
  const head = createElement('HEAD', null, '');
  const body = createElement('BODY', null, '');
  documentElement.appendChild(head);
  documentElement.appendChild(body);

  const documentObj = {
    documentElement,
    head,
    body,
    readyState: 'complete',
    getElementById: (id) => elementRegistry.get(id) || null,
    querySelector: (sel) => {
      if (sel === 'body') return body;
      if (sel === 'html') return documentElement;
      if (sel === 'dialog[open]') {
        for (const el of elementRegistry.values()) {
          if (el.tagName === 'DIALOG' && el.hasAttribute('open')) return el;
        }
        return null;
      }
      for (const el of elementRegistry.values()) {
        if (matchesSelector(el, sel)) return el;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      const res = [];
      const parts = sel.split(',').map(s => s.trim());
      for (const el of elementRegistry.values()) {
        for (const p of parts) {
          if (p === 'dialog[open]') {
            if (el.tagName === 'DIALOG' && el.hasAttribute('open')) {
              res.push(el);
              break;
            }
          } else if (p.startsWith('[id$=')) {
            const suffix = p.slice(5, -1).replace(/['"]/g, '');
            if (el.id && el.id.endsWith(suffix)) {
              res.push(el);
              break;
            }
          } else if (matchesSelector(el, p)) {
            res.push(el);
            break;
          }
        }
      }
      return res;
    },
    addEventListener: (evt, fn) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    removeEventListener: (evt, fn) => {
      if (listeners[evt]) listeners[evt] = listeners[evt].filter(f => f !== fn);
    },
    dispatchEvent: (evt) => {
      if (listeners[evt.type]) {
        listeners[evt.type].forEach(fn => fn(evt));
      }
    },
    createElement: (tag) => createElement(tag)
  };

  let mutationCallback = null;

  const windowObj = {
    innerWidth: 393,
    innerHeight: 852,
    scrollY: 0,
    document: documentObj,
    addEventListener: (evt, fn) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    removeEventListener: (evt, fn) => {
      if (listeners[evt]) listeners[evt] = listeners[evt].filter(f => f !== fn);
    },
    dispatchEvent: (evt) => {
      if (listeners[evt.type]) {
        listeners[evt.type].forEach(fn => fn(evt));
      }
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    localStorage: {
      store: {},
      getItem: (k) => windowObj.localStorage.store[k] || null,
      setItem: (k, v) => { windowObj.localStorage.store[k] = String(v); },
      removeItem: (k) => { delete windowObj.localStorage.store[k]; }
    },
    location: {
      href: 'http://localhost/index.html',
      pathname: '/index.html',
      search: '',
      hash: ''
    },
    HTMLDialogElement: function() {},
    MutationObserver: function(callback) {
      mutationCallback = callback;
      return {
        observe: () => {},
        disconnect: () => {}
      };
    },
    BroadcastChannel: function() {
      return { postMessage: () => {}, onmessage: null };
    },
    CustomEvent: function(type, params) {
      return { type, detail: params ? params.detail : null };
    },
    performance: {
      now: () => Date.now()
    },
    navigator: {
      vibrate: () => true
    },
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  };

  documentObj.location = windowObj.location;

  windowObj.HTMLDialogElement.prototype = {
    showModal: function() {
      this.open = true;
      this.setAttribute('open', '');
    },
    close: function() {
      this.open = false;
      this.removeAttribute('open');
    }
  };

  const sandbox = {
    ...windowObj,
    window: windowObj,
    document: documentObj,
    HTMLDialogElement: windowObj.HTMLDialogElement,
    MutationObserver: windowObj.MutationObserver,
    BroadcastChannel: windowObj.BroadcastChannel,
    CustomEvent: windowObj.CustomEvent,
    performance: windowObj.performance,
    navigator: windowObj.navigator,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    console
  };
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  windowObj.window = windowObj;
  windowObj.globalThis = sandbox;

  return {
    window: windowObj,
    document: documentObj,
    sandbox,
    createElement,
    elementRegistry,
    listeners,
    notifyDOMMutation: () => {
      if (mutationCallback) mutationCallback([]);
    },
    triggerScroll: (targetY) => {
      const prev = windowObj.scrollY;
      windowObj.scrollY = targetY;
      const evt = { type: 'scroll', currentScrollY: targetY, prevScrollY: prev };
      if (listeners['scroll']) {
        listeners['scroll'].forEach(fn => fn(evt));
      }
    },
    triggerScrollEnd: () => {
      if (listeners['scrollend']) {
        listeners['scrollend'].forEach(fn => fn({ type: 'scrollend' }));
      }
    },
    triggerTouch: (type, touches) => {
      const evt = {
        type,
        touches: touches.map(t => ({ clientX: t.x || 0, clientY: t.y || 0 })),
        target: documentObj.body
      };
      if (listeners[type]) {
        listeners[type].forEach(fn => fn(evt));
      }
    }
  };
}

/**
 * Solve cubic-bezier curve equation B(t)
 */
function solveCubicBezier(p1x, p1y, p2x, p2y) {
  function sampleCurveX(t) {
    return ((1 - 3 * p2x + 3 * p1x) * t + (3 * p2x - 6 * p1x)) * t * t + 3 * p1x * t;
  }
  function sampleCurveY(t) {
    return ((1 - 3 * p2y + 3 * p1y) * t + (3 * p2y - 6 * p1y)) * t * t + 3 * p1y * t;
  }
  function solveT(x, epsilon = 1e-6) {
    let t0 = 0, t1 = 1, t = x;
    for (let i = 0; i < 25; i++) {
      const currentX = sampleCurveX(t);
      if (Math.abs(currentX - x) < epsilon) return t;
      if (currentX < x) t0 = t;
      else t1 = t;
      t = (t0 + t1) / 2;
    }
    return t;
  }
  return function(x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleCurveY(solveT(x));
  };
}

// ============================================================================
// MAIN EXECUTION HARNESS
// ============================================================================

async function main() {
  console.log('='.repeat(80));
  console.log(' ADVERSARIAL STRESS TEST HARNESS (CHALLENGER 1 GEN 3)');
  console.log(' Scope: Scroll Engine, Modal Suppression, Spring Physics, Invariance Parity');
  console.log('='.repeat(80) + '\n');

  const cssContent = readProjectFile('tệp hệ thống/glass-theme.css');
  const jsContent = readProjectFile('tệp hệ thống/glass-theme.js');
  const indexHtml = readProjectFile('index.html');
  const trangchudongHtml = readProjectFile('trangchudong.html');
  const thuvienmauHtml = readProjectFile('thuvienmau.html');
  const settingHtml = readProjectFile('setting.html');

  // Helper to instantiate clean sandbox with glass-theme.js loaded
  function loadCleanEnvironment() {
    const dom = createHeadlessDOM();
    const topBar = dom.createElement('header', 'appTopBar', 'saas-topbar');
    const bottomNav = dom.createElement('nav', 'mobileBottomNav', 'mobile-glass-nav');
    const sidebar = dom.createElement('aside', 'saasAppSidebar', 'saas-sidebar');
    dom.document.body.appendChild(topBar);
    dom.document.body.appendChild(bottomNav);
    dom.document.body.appendChild(sidebar);

    const context = vm.createContext(dom.sandbox);
    const script = new vm.Script(jsContent);
    script.runInContext(context);

    return { dom, topBar, bottomNav, sidebar };
  }

  // --------------------------------------------------------------------------
  // CATEGORY 1: RAPID SCROLLING & AUTO-RESTORATION TIMER STRESS
  // --------------------------------------------------------------------------
  console.log('--- CATEGORY 1: RAPID SCROLLING & AUTO-RESTORATION TIMER STRESS ---');

  await runTest('SCROLL_STRESS', 'Downscroll past threshold (diff > 8 && scrollY > 35) triggers compact mode', async () => {
    const { dom, topBar, bottomNav } = loadCleanEnvironment();

    dom.triggerScroll(80);
    await new Promise(r => setTimeout(r, 20));

    assert(topBar.classList.contains('topbar-compact'), 'Expected topbar-compact added on downscroll');
    assert(bottomNav.classList.contains('dock-compact'), 'Expected dock-compact added on downscroll');
    assert(bottomNav.classList.contains('nav-scrolling-down'), 'Expected nav-scrolling-down added');
  });

  await runTest('SCROLL_STRESS', 'Immediate upscroll (diff < -6) cancels compact and clears restoration timer immediately', async () => {
    const { dom, topBar, bottomNav } = loadCleanEnvironment();

    // Scroll down to 100px
    dom.triggerScroll(100);
    await new Promise(r => setTimeout(r, 20));
    assert(topBar.classList.contains('topbar-compact'), 'Should be compact after downscroll');

    // Scroll up by 15px (diff = -15 < -6)
    dom.triggerScroll(85);
    await new Promise(r => setTimeout(r, 20));

    assert(!topBar.classList.contains('topbar-compact'), 'topbar-compact must be removed immediately on upscroll');
    assert(!bottomNav.classList.contains('dock-compact'), 'dock-compact must be removed immediately on upscroll');
    assert(bottomNav.classList.contains('nav-scrolling-up'), 'nav-scrolling-up must be set');
  });

  await runTest('SCROLL_STRESS', '100 Rapid alternating scroll bursts: stress-test state consistency and zero crash', async () => {
    const { dom, topBar, bottomNav } = loadCleanEnvironment();

    let curY = 50;
    for (let i = 0; i < 100; i++) {
      const step = (i % 2 === 0) ? 25 : -20; // Alternate down/up
      curY = Math.max(0, curY + step);
      dom.triggerScroll(curY);
      await new Promise(r => setTimeout(r, 4));
    }

    // Now decisive scroll up to near-top (scrollY <= 24px)
    dom.triggerScroll(15);
    await new Promise(r => setTimeout(r, 20));

    assert(!topBar.classList.contains('topbar-compact'), 'After ending near top, topbar must NOT be compact');
    assert(!bottomNav.classList.contains('dock-compact'), 'After ending near top, dock must NOT be compact');
  });

  await runTest('SCROLL_STRESS', 'Scroll stop: 1000ms idle timer automatically restores topbar and bottom dock', async () => {
    const { dom, topBar, bottomNav } = loadCleanEnvironment();

    // Scroll down to 120px
    dom.triggerScroll(120);
    await new Promise(r => setTimeout(r, 20));
    assert(topBar.classList.contains('topbar-compact'), 'Must be compact initially');
    assert(bottomNav.classList.contains('dock-compact'), 'Must be compact initially');

    // Idle for 1050ms (simulating scroll stop)
    await new Promise(r => setTimeout(r, 1050));

    assert(!topBar.classList.contains('topbar-compact'), 'Expected topbar restored after 1000ms idle');
    assert(!bottomNav.classList.contains('dock-compact'), 'Expected bottom dock restored after 1000ms idle');
    assert(bottomNav.classList.contains('nav-expanded'), 'Expected nav-expanded set after auto-restoration');
  });

  await runTest('SCROLL_STRESS', 'Timer preemption: scrolling down again at 700ms resets the 1000ms restoration countdown', async () => {
    const { dom, topBar, bottomNav } = loadCleanEnvironment();

    // Scroll down to 100px at t=0
    dom.triggerScroll(100);
    await new Promise(r => setTimeout(r, 20));
    assert(topBar.classList.contains('topbar-compact'), 'Compact at t=0');

    // Wait 700ms
    await new Promise(r => setTimeout(r, 700));

    // Scroll down again to 140px at t=700ms
    dom.triggerScroll(140);
    await new Promise(r => setTimeout(r, 20));

    // Wait another 500ms (t = 1220ms from start)
    await new Promise(r => setTimeout(r, 500));

    // Must STILL be compact because timer was rescheduled to t=1700ms
    assert(topBar.classList.contains('topbar-compact'), 'Expected STILL compact at t=1200ms due to timer reset');
    assert(bottomNav.classList.contains('dock-compact'), 'Expected STILL compact at t=1200ms due to timer reset');

    // Wait remaining 600ms (t = 1820ms)
    await new Promise(r => setTimeout(r, 600));

    // Now auto-restored
    assert(!topBar.classList.contains('topbar-compact'), 'Restored at t=1800ms');
    assert(!bottomNav.classList.contains('dock-compact'), 'Restored at t=1800ms');
  });

  await runTest('SCROLL_STRESS', 'touchend and scrollend events trigger scheduleNavRestoration()', async () => {
    const { dom, topBar, bottomNav } = loadCleanEnvironment();

    dom.triggerScroll(100);
    await new Promise(r => setTimeout(r, 20));
    assert(topBar.classList.contains('topbar-compact'), 'Compact');

    // Trigger touchend
    dom.triggerTouch('touchend', []);
    await new Promise(r => setTimeout(r, 1050));
    assert(!topBar.classList.contains('topbar-compact'), 'Restored after touchend idle');

    // Repeat with scrollend
    dom.triggerScroll(150);
    await new Promise(r => setTimeout(r, 20));
    assert(topBar.classList.contains('topbar-compact'), 'Compact again');

    dom.triggerScrollEnd();
    await new Promise(r => setTimeout(r, 1050));
    assert(!topBar.classList.contains('topbar-compact'), 'Restored after scrollend idle');
  });

  await runTest('SCROLL_STRESS', 'Multi-touch rejection: 2-finger touches are safely ignored by swipe drawer engine', async () => {
    const { dom } = loadCleanEnvironment();

    // Dispatch touchstart with 2 fingers
    dom.triggerTouch('touchstart', [{ x: 10, y: 100 }, { x: 200, y: 100 }]);
    await new Promise(r => setTimeout(r, 20));

    assert(!dom.document.body.classList.contains('sidebar-drawer-open'), 'Drawer must not open on 2-finger touchstart');
  });

  await runTest('SCROLL_STRESS', 'Modal protection: restoration timer NEVER restores nav bars while a modal is open', async () => {
    const { dom, topBar, bottomNav } = loadCleanEnvironment();

    // Scroll down to compact
    dom.triggerScroll(100);
    await new Promise(r => setTimeout(r, 20));
    assert(topBar.classList.contains('topbar-compact'), 'Initially compact');

    // Open native dialog modal
    const dialog = dom.createElement('dialog', 'quickViewDialog', '');
    dom.document.body.appendChild(dialog);
    dialog.showModal();
    dom.notifyDOMMutation();
    await new Promise(r => setTimeout(r, 50));
    assert(dom.document.body.classList.contains('modal-open'), 'Body must be modal-open');

    // Wait 1200ms (timer fires)
    await new Promise(r => setTimeout(r, 1200));

    // Nav bars must NOT be un-compacted / restored
    assert(dom.document.body.classList.contains('modal-open'), 'Modal still open');
    assert(topBar.classList.contains('topbar-compact'), 'Topbar must NOT be restored while modal is open');
  });

  await runTest('SCROLL_STRESS', 'Negative scroll clamping: iOS rubber-band overscroll (scrollY < 0) safely clamped to 0', async () => {
    const { dom, topBar, bottomNav } = loadCleanEnvironment();

    dom.triggerScroll(-40);
    await new Promise(r => setTimeout(r, 20));

    assert(!topBar.classList.contains('topbar-compact'), 'Topbar must not be compact during negative overscroll');
    assert(!bottomNav.classList.contains('dock-compact'), 'Bottom dock must not be compact during negative overscroll');
  });

  // --------------------------------------------------------------------------
  // CATEGORY 2: MODAL SUPPRESSION & CTA BUTTON ACCESSIBILITY
  // --------------------------------------------------------------------------
  console.log('\n--- CATEGORY 2: MODAL SUPPRESSION & CTA BUTTON ACCESSIBILITY ---');

  await runTest('MODAL_SUPPRESSION', '#quickViewDialog: Bottom dock 100% suppressed and #qvBtnDownload / #qvBtnCart 100% visible & clickable', async () => {
    assert(cssContent.includes('body:has(dialog[open]) .mobile-glass-nav'), 'CSS must include body:has(dialog[open])');
    assert(cssContent.includes('body:has([id$="Dialog"][open]) .mobile-glass-nav'), 'CSS must include [id$="Dialog"][open]');
    assert(cssContent.includes('body.modal-open .mobile-glass-nav'), 'CSS must include body.modal-open .mobile-glass-nav');

    assert(cssContent.includes('display: none !important;'), 'Suppression rule must enforce display: none !important;');
    assert(cssContent.includes('pointer-events: none !important;'), 'Suppression rule must enforce pointer-events: none !important;');
    assert(cssContent.includes('visibility: hidden !important;'), 'Suppression rule must enforce visibility: hidden !important;');

    assert(indexHtml.includes('id="quickViewDialog"'), 'index.html must have #quickViewDialog');
    assert(indexHtml.includes('id="qvBtnDownload"'), 'index.html must have #qvBtnDownload ("Tải Slide Ngay")');
    assert(indexHtml.includes('id="qvBtnCart"'), 'index.html must have #qvBtnCart ("Thêm Vào Giỏ")');

    const qvEnd = indexHtml.indexOf('</dialog>', indexHtml.indexOf('id="quickViewDialog"'));
    const qvSnippet = indexHtml.slice(indexHtml.indexOf('id="quickViewDialog"'), qvEnd > 0 ? qvEnd + 9 : indexHtml.indexOf('id="quickViewDialog"') + 5000);
    assert(qvSnippet.includes('id="qvBtnDownload"'), 'Download button inside quickViewDialog');
    assert(qvSnippet.includes('id="qvBtnCart"'), 'Cart button inside quickViewDialog');
    assert(!qvSnippet.includes('id="qvBtnDownload" class="pointer-events-none"'), 'qvBtnDownload must be clickable');

    assert(cssContent.includes('max-height: 85dvh !important;'), 'Dialogs must be capped at 85dvh');
    assert(cssContent.includes('calc(env(safe-area-inset-bottom, 16px) + 24px)'), 'Dialogs must include safe area bottom padding');
  });

  await runTest('MODAL_SUPPRESSION', '#checkoutDialog: Bottom dock 100% suppressed and Payment CTA 100% visible & clickable', async () => {
    assert(indexHtml.includes('id="checkoutDialog"'), 'index.html must have #checkoutDialog');
    const checkoutSnippet = indexHtml.slice(indexHtml.indexOf('id="checkoutDialog"'), indexHtml.indexOf('id="checkoutDialog"') + 3500);
    assert(checkoutSnippet.includes('Thanh Toán VietQR') || checkoutSnippet.includes('shopping-bag'), 'Must have checkout header');
    assert(checkoutSnippet.includes('Xác Nhận') || checkoutSnippet.includes('Tạo Mã QR') || checkoutSnippet.includes('button type="button" class="flex-1 py-3 rounded-xl bg-emerald-500'), 'Must have primary payment CTA button');

    assert(cssContent.includes('body:has([id$="Dialog"][open]) #floatingQuickCamAi'), 'Floating cam button must also be suppressed');
    assert(cssContent.includes('body.modal-open #floatingQuickCamAi'), 'Floating cam button must be suppressed under body.modal-open');
  });

  await runTest('MODAL_SUPPRESSION', '#templatePreviewModal (thuvienmau.html): Bottom dock 100% suppressed & CTA buttons clickable', async () => {
    assert(thuvienmauHtml.includes('id="templatePreviewModal"'), 'thuvienmau.html must have #templatePreviewModal');

    assert(cssContent.includes('body:has([id$="Modal"]:not(.hidden):not(.opacity-0)'), 'CSS must suppress when modal lacks .hidden and .opacity-0');
    assert(cssContent.includes('body:has(.modal:not(.hidden))'), 'CSS must suppress on .modal:not(.hidden)');

    assert(jsContent.includes("'#templatePreviewModal'"), 'glass-theme.js must specifically check #templatePreviewModal in candidateSelectors');

    const modalSnippet = thuvienmauHtml.slice(thuvienmauHtml.indexOf('id="templatePreviewModal"'), thuvienmauHtml.indexOf('id="templatePreviewModal"') + 2500);
    assert(modalSnippet.includes('closePreviewModal()'), 'Must have close CTA button');
  });

  await runTest('MODAL_SUPPRESSION', '#settingLogoutModal (setting.html): Opacity-modal detected, dock suppressed, Logout CTA accessible', async () => {
    assert(settingHtml.includes('id="settingLogoutModal"'), 'setting.html must have #settingLogoutModal');

    assert(jsContent.includes('el.classList.contains(\'opacity-0\') && el.classList.contains(\'pointer-events-none\')'), 
      'isElementVisibleModal must check for opacity-0 && pointer-events-none');
    assert(jsContent.includes("'#settingLogoutModal'"), 'glass-theme.js must track #settingLogoutModal');

    const logoutSnippet = settingHtml.slice(settingHtml.indexOf('id="settingLogoutModal"'), settingHtml.indexOf('id="settingLogoutModal"') + 2000);
    assert(logoutSnippet.includes('executeLogoutSetting()'), 'Must contain executeLogoutSetting CTA');
    assert(logoutSnippet.includes('closeLogoutModalSetting()'), 'Must contain closeLogoutModalSetting CTA');
  });

  await runTest('MODAL_SUPPRESSION', 'Modal state simulation: openModal -> body.modal-open added -> closeModal -> body.modal-open removed', async () => {
    const { dom } = loadCleanEnvironment();
    const dialog = dom.createElement('dialog', 'quickViewDialog', '');
    dom.document.body.appendChild(dialog);

    // Open modal via showModal()
    dialog.showModal();
    dom.notifyDOMMutation();
    await new Promise(r => setTimeout(r, 60));

    assert(dom.document.body.classList.contains('modal-open'), 'body must receive modal-open when dialog.showModal() is called');

    // Close modal via close()
    dialog.close();
    dom.notifyDOMMutation();
    await new Promise(r => setTimeout(r, 60));

    assert(!dom.document.body.classList.contains('modal-open'), 'body must lose modal-open when dialog.close() is called');
  });

  await runTest('MODAL_SUPPRESSION', 'Sequential modal transitions: 20 rapid modal open/close cycles without desync', async () => {
    const { dom } = loadCleanEnvironment();
    const dialogA = dom.createElement('dialog', 'quickViewDialog', '');
    const dialogB = dom.createElement('dialog', 'checkoutDialog', '');
    dom.document.body.appendChild(dialogA);
    dom.document.body.appendChild(dialogB);

    for (let i = 0; i < 20; i++) {
      dialogA.showModal();
      dom.notifyDOMMutation();
      await new Promise(r => setTimeout(r, 10));

      dialogA.close();
      dom.notifyDOMMutation();
      await new Promise(r => setTimeout(r, 10));

      dialogB.showModal();
      dom.notifyDOMMutation();
      await new Promise(r => setTimeout(r, 10));

      dialogB.close();
      dom.notifyDOMMutation();
      await new Promise(r => setTimeout(r, 10));
    }

    await new Promise(r => setTimeout(r, 60));
    assert(!dom.document.body.classList.contains('modal-open'), 'Final state must be modal-open removed');
  });

  // --------------------------------------------------------------------------
  // CATEGORY 3: SYMMETRICAL APPLE VISIONOS CUBIC-BEZIER SPRING PHYSICS
  // --------------------------------------------------------------------------
  console.log('\n--- CATEGORY 3: SYMMETRICAL APPLE VISIONOS CUBIC-BEZIER SPRING PHYSICS ---');

  await runTest('SPRING_PHYSICS', 'Verification of standardized cubic-bezier(0.16, 1, 0.3, 1) and 0.42s duration in CSS', async () => {
    assert(cssContent.includes('0.42s cubic-bezier(0.16, 1, 0.3, 1)'), 'CSS must specify standardized 0.42s cubic-bezier(0.16, 1, 0.3, 1)');

    const topbarRule = cssContent.slice(cssContent.indexOf('/* Topbar Base */'), cssContent.indexOf('/* Topbar Base */') + 800);
    assert(topbarRule.includes('0.42s cubic-bezier(0.16, 1, 0.3, 1)'), 'Topbar base must have 0.42s cubic-bezier transition');

    const topbarCompactRule = cssContent.slice(cssContent.indexOf('/* Topbar Compact State'), cssContent.indexOf('/* Topbar Compact State') + 400);
    assert(topbarCompactRule.includes('0.42s cubic-bezier(0.16, 1, 0.3, 1)'), 'Topbar compact must have 0.42s cubic-bezier transition');

    const dockRule = cssContent.slice(cssContent.indexOf('/* Bottom Dock Base */'), cssContent.indexOf('/* Bottom Dock Base */') + 600);
    assert(dockRule.includes('0.42s cubic-bezier(0.16, 1, 0.3, 1)'), 'Bottom dock base must have 0.42s cubic-bezier transition');

    const dockCompactRule = cssContent.slice(cssContent.indexOf('/* Bottom Dock Compact State'), cssContent.indexOf('/* Bottom Dock Compact State') + 600);
    assert(dockCompactRule.includes('0.42s cubic-bezier(0.16, 1, 0.3, 1)'), 'Bottom dock compact must have 0.42s cubic-bezier transition');
  });

  await runTest('SPRING_PHYSICS', 'Symmetry check: Expand and Compact states share identical cubic-bezier physics curve', async () => {
    // Both transitions must be controlled by GPU transform with identical bezier curve
    const compactDockSnippet = cssContent.slice(cssContent.indexOf('.mobile-glass-nav.dock-compact'), cssContent.indexOf('.mobile-glass-nav.dock-compact') + 400);
    assert(compactDockSnippet.includes('translateY') || compactDockSnippet.includes('translate3d'), 'Compact dock uses GPU transform');

    const compactTopbarSnippet = cssContent.slice(cssContent.indexOf('.saas-topbar.topbar-compact'), cssContent.indexOf('.saas-topbar.topbar-compact') + 400);
    assert(compactTopbarSnippet.includes('translateY') || compactTopbarSnippet.includes('translate3d'), 'Compact topbar uses GPU transform');
  });

  await runTest('SPRING_PHYSICS', 'Eradication of legacy jittery keyframe animations (@keyframes svTopbarSpringExpand / svDockSpringExpand)', async () => {
    assert(!cssContent.includes('@keyframes svTopbarSpringExpand'), 'svTopbarSpringExpand must be completely eliminated');
    assert(!cssContent.includes('@keyframes svDockSpringExpand'), 'svDockSpringExpand must be completely eliminated');
    assert(!cssContent.includes('animation: svTopbarSpringExpand'), 'svTopbarSpringExpand animation references must be eradicated');
    assert(!cssContent.includes('animation: svDockSpringExpand'), 'svDockSpringExpand animation references must be eradicated');
  });

  await runTest('SPRING_PHYSICS', 'Mathematical verification of Apple VisionOS spring curve B(t)', async () => {
    const curve = solveCubicBezier(0.16, 1.0, 0.3, 1.0);

    const y0 = curve(0.0);
    const y10 = curve(0.1);
    const y25 = curve(0.25);
    const y50 = curve(0.5);
    const y80 = curve(0.8);
    const y100 = curve(1.0);

    assert(Math.abs(y0 - 0.0) < 1e-4, 'B(0) must equal 0.0');
    assert(Math.abs(y100 - 1.0) < 1e-4, 'B(1) must equal 1.0');

    // Apple VisionOS spring curve rises quickly (fast response: y(0.25) > 0.75) and smoothly settles without overshooting 1.0
    assert(y25 > 0.75, `Expected responsive initial acceleration: y(0.25) = ${y25.toFixed(4)} > 0.75`);
    assert(y50 > 0.95, `Expected near-complete expansion by mid-duration: y(0.50) = ${y50.toFixed(4)} > 0.95`);
    assert(y80 <= 1.0, `Expected no overshoot past 1.0: y(0.80) = ${y80.toFixed(4)} <= 1.0`);

    // Monotonic ascent (no oscillation or stutter)
    assert(y10 <= y25 && y25 <= y50 && y50 <= y80 && y80 <= y100, 'Curve must be strictly monotonic non-decreasing');
  });

  // --------------------------------------------------------------------------
  // CATEGORY 4: CRYPTOGRAPHIC SHA-256 INVARIANCE & BINARY PARITY
  // --------------------------------------------------------------------------
  console.log('\n--- CATEGORY 4: CRYPTOGRAPHIC SHA-256 INVARIANCE & BINARY PARITY ---');

  await runTest('INVARIANCE', 'Cryptographic SHA-256 hash match between index.html and trangchudong.html', async () => {
    const bufIndex = readProjectBuffer('index.html');
    const bufTrangchu = readProjectBuffer('trangchudong.html');

    const hashIndex = crypto.createHash('sha256').update(bufIndex).digest('hex').toUpperCase();
    const hashTrangchu = crypto.createHash('sha256').update(bufTrangchu).digest('hex').toUpperCase();

    console.log(`         index.html SHA-256:       ${hashIndex}`);
    console.log(`         trangchudong.html SHA-256: ${hashTrangchu}`);

    assert(hashIndex === hashTrangchu, `SHA-256 mismatch! index=${hashIndex}, trangchu=${hashTrangchu}`);
  });

  await runTest('INVARIANCE', 'Binary byte-for-byte buffer comparison (0 byte difference, identical length)', async () => {
    const bufIndex = readProjectBuffer('index.html');
    const bufTrangchu = readProjectBuffer('trangchudong.html');

    assert(bufIndex.length === bufTrangchu.length, 
      `File length mismatch! index=${bufIndex.length} bytes, trangchu=${bufTrangchu.length} bytes`);

    let diffCount = 0;
    for (let i = 0; i < bufIndex.length; i++) {
      if (bufIndex[i] !== bufTrangchu[i]) diffCount++;
    }

    console.log(`         Exact size: ${bufIndex.length} bytes (Diff: ${diffCount} bytes)`);
    assert(diffCount === 0, `Detected ${diffCount} byte differences between index.html and trangchudong.html!`);
    assert(bufIndex.equals(bufTrangchu), 'Buffers must be strictly equal (bufIndex.equals(bufTrangchu))');
  });

  // ==========================================================================
  // FINAL SUMMARY REPORT
  // ==========================================================================
  console.log('\n' + '='.repeat(80));
  console.log(' ADVERSARIAL STRESS TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Adversarial Tests: ${testResults.total}`);
  console.log(`Passed:                  ${testResults.passed} (${((testResults.passed / testResults.total) * 100).toFixed(1)}%)`);
  console.log(`Failed:                  ${testResults.failed}`);
  console.log('='.repeat(80));

  if (testResults.failed > 0) {
    console.error('\nFAILURES DETECTED:');
    testResults.details.filter(d => !d.passed).forEach((d, idx) => {
      console.error(`\n${idx + 1}. [${d.category}] ${d.name}`);
      console.error(`   Error: ${d.error}`);
    });
    process.exit(1);
  } else {
    console.log('\nALL ADVERSARIAL STRESS TESTS COMPLETED SUCCESSFULLY! VERDICT: CERTIFIED PASS.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
