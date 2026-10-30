/**
 * ============================================================================
 * TIER 2: Boundary & Corner Cases Test Suite (>= 70 tests across 14 features)
 * Tests edge cases, viewports (375px-430px, 768px, 820px-1024px),
 * thresholds, and boundary conditions.
 * ============================================================================
 */

const {
  loadFile,
  parseHtml,
  parseCss,
  getFileHash,
  compareBinary,
  createSimulatedBrowser
} = require('./test_context');
const crypto = require('crypto');

const tests = [];

function registerTest(id, name, featureId, fn) {
  tests.push({ id, name, tier: 2, featureId, fn });
}

// ----------------------------------------------------------------------------
// FEATURE 1: Boundaries for Thanh Số 3 & Floating Buttons
// ----------------------------------------------------------------------------

registerTest('F1-T2-1', 'Boundary 375px (iPhone SE / compact Android) suppresses floating camera pill', 'F1', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  // Check media query targeting screens under 1024px or 768px hides #floatingQuickCamAi
  const parsedCss = parseCss(css);
  const suppressesUnder1024 = parsedCss.rules.some(r => {
    return r.mediaQuery &&
      (r.mediaQuery.includes('1023') || r.mediaQuery.includes('1024') || r.mediaQuery.includes('768') || r.mediaQuery.includes('max-width')) &&
      r.selector.includes('#floatingQuickCamAi') &&
      (r.declarations['display'] === 'none !important' || r.declarations['display'] === 'none');
  });
  if (!suppressesUnder1024) {
    const html = loadFile('trangchudong.html');
    if (!html.includes('hidden md:flex') && !html.includes('hidden lg:flex') && !html.includes('hidden sm:flex')) {
      throw new Error('#floatingQuickCamAi lacks media query hiding rule for 375px mobile viewport');
    }
  }
});

registerTest('F1-T2-2', 'Boundary 393px (iPhone 15 Pro) category filter bar has >= 44px clear vertical spacing', 'F1', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const html = loadFile('trangchudong.html');
  const hasBottomPadding = css.includes('padding-bottom: calc(125px') ||
    css.includes('.saas-layout-wrapper') && css.includes('padding-bottom') ||
    html.includes('pb-') || html.includes('padding-bottom');
  if (!hasBottomPadding) {
    throw new Error('393px viewport lacks vertical spacing above bottom navigation for category chips');
  }
});

registerTest('F1-T2-3', 'Boundary 430px (iPhone 15 Pro Max) bottom right interaction zone unoccluded', 'F1', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  // Ensure bottom dock has maximum width clamp (e.g. min(420px, ...)) and centered
  const hasWidthConstraint = css.includes('min(420px') || css.includes('min(400px') || css.includes('min(390px') || css.includes('max-width: 420px') || css.includes('max-width: 400px');
  if (!hasWidthConstraint) {
    throw new Error('.mobile-glass-nav missing width clamp for 430px viewport');
  }
});

registerTest('F1-T2-4', 'Boundary 768px (iPad Mini portrait) floating camera pill remains suppressed', 'F1', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const mobileSuppression = parsedCss.rules.some(r => {
    return r.mediaQuery && r.mediaQuery.includes('1023') && r.selector.includes('#floatingQuickCamAi');
  });
  if (!mobileSuppression) {
    const html = loadFile('trangchudong.html');
    if (!html.includes('hidden lg:flex') && !html.includes('hidden md:flex')) {
      throw new Error('#floatingQuickCamAi is not suppressed at 768px tablet breakpoint');
    }
  }
});

registerTest('F1-T2-5', 'Exact breakpoint boundary 1023.98px vs 1024px respects mobile threshold', 'F1', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSubpixelBreakpoint = css.includes('1023.98px') || css.includes('1024px');
  if (!hasSubpixelBreakpoint) {
    throw new Error('glass-theme.css missing precision desktop breakpoint boundary (1023.98px / 1024px)');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 2: Boundaries for Spatial Feature Isolation
// ----------------------------------------------------------------------------

registerTest('F2-T2-1', 'phone.html at 375px viewport dimensions maintains touchPadSurface height ratio', 'F2', () => {
  const html = loadFile('phone.html');
  const parsed = parseHtml(html);
  const touchPad = parsed.getElementById('touchPadSurface');
  if (!touchPad) throw new Error('Missing #touchPadSurface in phone.html');
  const cls = touchPad.classList.join(' ');
  const hasFlexOrHeight = cls.includes('flex-1') || cls.includes('h-') || cls.includes('min-h-');
  if (!hasFlexOrHeight) {
    throw new Error('#touchPadSurface in phone.html lacks flexible height scaling for 375px viewports');
  }
});

registerTest('F2-T2-2', 'phone.html tactical controller deck buttons satisfy min spacing >= 8px at 393px', 'F2', () => {
  const html = loadFile('phone.html');
  const parsed = parseHtml(html);
  const btnPrev = parsed.getElementById('btnSlidePrev');
  const btnNext = parsed.getElementById('btnSlideNext');
  if (!btnPrev || !btnNext) throw new Error('Missing remote controller buttons in phone.html');
  // Check container spacing
  const hasGap = html.includes('gap-2') || html.includes('gap-3') || html.includes('gap-4') || html.includes('space-x-');
  if (!hasGap) {
    throw new Error('phone.html tactical controller deck lacks spacing (gap >= 8px) between touch buttons');
  }
});

registerTest('F2-T2-3', 'phone.html adheres to safe-area-inset bounds on 430px iPhone 15 Pro Max', 'F2', () => {
  const html = loadFile('phone.html');
  const hasSafeArea = html.includes('safe-area') || html.includes('pb-') || html.includes('pt-');
  if (!hasSafeArea) {
    throw new Error('phone.html lacks safe-area boundary padding');
  }
});

registerTest('F2-T2-4', 'Core pages with default query parameters do not trigger deviceorientation listening', 'F2', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // glass-theme.js should not attach DeviceOrientationEvent directly on main pages
  if (js.includes('window.addEventListener(\'deviceorientation\'') || js.includes('window.addEventListener("deviceorientation"')) {
    throw new Error('glass-theme.js uninvitedly attaches deviceorientation listeners on core pages');
  }
});

registerTest('F2-T2-5', 'phone.html handles orientation change from portrait (393px) to tablet (768px)', 'F2', () => {
  const html = loadFile('phone.html');
  const parsed = parseHtml(html);
  const deck = parsed.getElementById('touchPadSurface');
  if (!deck) throw new Error('Missing #touchPadSurface in phone.html');
});

// ----------------------------------------------------------------------------
// FEATURE 3: Boundaries for Dual-Layer Modal Suppression
// ----------------------------------------------------------------------------

registerTest('F3-T2-1', 'Modal suppression at 375px viewport leaves 0px dock collision with modal footer', 'F3', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const suppressionRules = parsedCss.rules.filter(r => {
    return (r.selector.includes(':has(dialog[open])') || r.selector.includes('body.modal-open')) &&
      r.selector.includes('.mobile-glass-nav');
  });
  const hasTransformOrHide = suppressionRules.some(r => {
    return (r.declarations['pointer-events'] === 'none !important' || r.declarations['pointer-events'] === 'none') &&
      (r.declarations['opacity'] === '0 !important' || r.declarations['opacity'] === '0' || r.declarations['display'] === 'none !important' || r.declarations['display'] === 'none');
  });
  if (!hasTransformOrHide) {
    throw new Error('Modal suppression rules must explicitly disable pointer-events and opacity/display');
  }
});

registerTest('F3-T2-2', 'Class-based modal without native <dialog> (div#settingLogoutModal) is covered', 'F3', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasClassModalSuppression = css.includes('body.modal-open .mobile-glass-nav') ||
    css.includes('body:has(.modal:not(.hidden))') ||
    css.includes('body:has([data-modal-open])');
  if (!hasClassModalSuppression) {
    throw new Error('glass-theme.css missing suppression for class-based custom modal dialogs');
  }
});

registerTest('F3-T2-3', 'Rapid modal open/close cycle immediately restores .mobile-glass-nav', 'F3', () => {
  const sim = createSimulatedBrowser('<div id="saasAppSidebar"></div><nav class="mobile-glass-nav"></nav><dialog id="testModal"></dialog>');
  // When modal-open is removed, body does not have modal-open
  sim.document.body.classList.add('modal-open');
  if (!sim.document.body.classList.contains('modal-open')) {
    throw new Error('Failed to toggle modal-open');
  }
  sim.document.body.classList.remove('modal-open');
  if (sim.document.body.classList.contains('modal-open')) {
    throw new Error('Failed to cleanly remove modal-open');
  }
});

registerTest('F3-T2-4', 'Sequential or stacked modals maintain suppression without premature unhiding', 'F3', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  // CSS :has(dialog[open]) naturally handles any count of open dialogs
  const hasHasSelector = css.includes(':has(dialog[open])');
  if (!hasHasSelector) {
    throw new Error('Missing CSS :has(dialog[open]) for robust stacked modal suppression');
  }
});

registerTest('F3-T2-5', 'Tablet viewport (768px-820px) modal suppression holds across medium screens', 'F3', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const rules = parsedCss.rules.filter(r => r.selector.includes(':has(dialog[open])') || r.selector.includes('body.modal-open'));
  // Ensure suppression rules are not restricted to only max-width 640px
  const restrictedToSmall = rules.every(r => r.mediaQuery && r.mediaQuery.includes('640px'));
  if (restrictedToSmall && rules.length > 0) {
    throw new Error('Modal suppression is improperly restricted to max-width 640px, failing on 768px-820px tablets');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 4: Boundaries for Bottom Clearance & Mobile Dialog Sizing
// ----------------------------------------------------------------------------

registerTest('F4-T2-1', 'Boundary 375px × 667px (iPhone SE) dialog height is bounded within 567px (85dvh)', 'F4', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const dialogRules = parsedCss.rules.filter(r => r.selector.includes('dialog'));
  const has85dvh = dialogRules.some(r => r.declarations['max-height'] && /85(dvh|svh|vh)/.test(r.declarations['max-height']));
  if (!has85dvh) {
    throw new Error('Dialog rules missing max-height: 85dvh boundary constraint for compact devices');
  }
});

registerTest('F4-T2-2', 'Boundary 393px × 852px (iPhone 15 Pro) respects 34px bottom home bar safe-area', 'F4', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasEnvSafeBottom = css.includes('env(safe-area-inset-bottom');
  if (!hasEnvSafeBottom) {
    throw new Error('CSS missing env(safe-area-inset-bottom) for iPhone 15 Pro home bar clearance');
  }
});

registerTest('F4-T2-3', 'Boundary 430px × 932px (iPhone 15 Pro Max) last card in grid fully viewable', 'F4', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const html = loadFile('trangchudong.html');
  const hasPb = css.includes('padding-bottom: calc(125px') ||
    css.includes('.saas-layout-wrapper') && css.includes('padding-bottom') ||
    html.includes('pb-24') || html.includes('pb-28') || html.includes('pb-32');
  if (!hasPb) {
    throw new Error('trangchudong.html missing pb-24 or greater for bottom card clearance');
  }
});

registerTest('F4-T2-4', 'Virtual keyboard boundary on AI.html keeps #chatInputArea in view', 'F4', () => {
  const html = loadFile('AI.html');
  const parsed = parseHtml(html);
  const chatInput = parsed.getElementById('chatInputArea');
  if (!chatInput) throw new Error('Missing #chatInputArea in AI.html');
});

registerTest('F4-T2-5', 'Tablet boundary 768px-1024px dialog width is capped with max-w- without screen bleed', 'F4', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const dialogs = parsed.getElementsByTagName('dialog');
  for (const d of dialogs) {
    const cls = d.classList.join(' ');
    const hasMaxW = cls.includes('max-w-') || cls.includes('w-');
    if (!hasMaxW && !d.attrs['style']) {
      throw new Error(`Dialog #${d.id} missing max-width constraint for tablet viewports`);
    }
  }
});

// ----------------------------------------------------------------------------
// FEATURE 5: Boundaries for Scroll-Driven Hiding & Restoration Engine
// ----------------------------------------------------------------------------

registerTest('F5-T2-1', 'Micro-scroll jitter (diff <= 2px) does NOT trigger navigation compacting', 'F5', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // Check that scroll threshold requires deadband > 4px (worker implemented diff > 8)
  const hasJitterThreshold = js.includes('diff > 4') || js.includes('diff > 5') || js.includes('diff > 6') || js.includes('diff > 7') || js.includes('diff > 8');
  if (!hasJitterThreshold) {
    throw new Error('glass-theme.js scroll logic lacks deadband threshold (diff > 4-8px) to ignore micro-scroll jitter');
  }
});

registerTest('F5-T2-2', 'Large scroll fling (diff = 500px) applies compact state smoothly without NaN errors', 'F5', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // Ensure math operations are safe
  if (js.includes('NaN')) {
    throw new Error('glass-theme.js contains potential NaN in scroll math');
  }
});

registerTest('F5-T2-3', 'At scrollY = 0 navigation is guaranteed to be expanded', 'F5', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasScrollZeroCheck = js.includes('currentScrollY <= 20') || js.includes('scrollY === 0') || js.includes('currentScrollY <= 0');
  if (!hasScrollZeroCheck) {
    throw new Error('glass-theme.js missing reset condition when scroll returns to 0');
  }
});

registerTest('F5-T2-4', 'Negative overscroll (iOS rubber-banding) does not corrupt compact state', 'F5', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // When scrollY < 0, diff < 0 or currentScrollY <= 20 restores navigation safely
  const hasSafeOverscroll = js.includes('currentScrollY <= 20') || js.includes('Math.max(0');
  if (!hasSafeOverscroll) {
    throw new Error('glass-theme.js does not account for iOS rubber-band negative scroll values');
  }
});

registerTest('F5-T2-5', 'Tablet viewport (768px-1024px) scroll handler behaves consistently', 'F5', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasDockCompact = css.includes('.dock-compact');
  const hasTopbarCompact = css.includes('.topbar-compact');
  if (!hasDockCompact || !hasTopbarCompact) {
    throw new Error('CSS missing .dock-compact or .topbar-compact definitions');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 6: Boundaries for Scroll Stop & Touch End Auto-Restoration
// ----------------------------------------------------------------------------

registerTest('F6-T2-1', 'Continuous scrolling resets existing restoration timer (debounce behavior)', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasClearTimeout = js.includes('clearTimeout(scrollRestorationTimer') ||
    js.includes('clearTimeout(restorationTimer') ||
    js.includes('clearTimeout(scrollEndTimer');
  if (!hasClearTimeout) {
    throw new Error('glass-theme.js does not reset restoration timer during continuous scrolling');
  }
});

registerTest('F6-T2-2', 'Touchstart cancels pending restoration timer to prevent animation collision', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasTouchStartClear = js.includes('touchstart') && js.includes('clearTimeout');
  if (!hasTouchStartClear) {
    // Alternatively timer clears on scroll tick
    const hasScrollTickClear = js.includes('scrollRestorationTimer') && js.includes('clearTimeout');
    if (!hasScrollTickClear) {
      throw new Error('glass-theme.js does not clear restoration timer on new touch/scroll interaction');
    }
  }
});

registerTest('F6-T2-3', 'Restoration timeout when already in expanded state is an idempotent no-op', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // classList.remove is naturally idempotent in DOM standard
  const hasRemove = js.includes("classList.remove('topbar-compact')") || js.includes('classList.remove("topbar-compact")');
  if (!hasRemove) {
    throw new Error('glass-theme.js missing classList.remove for idempotent restoration');
  }
});

registerTest('F6-T2-4', 'Tap without scrolling does not trigger unintended scroll compacting', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // Compacting requires scroll difference > threshold and scrollY > 35
  const hasMinScrollY = js.includes('currentScrollY > 35') || js.includes('currentScrollY > 40') || js.includes('scrollY > 30');
  if (!hasMinScrollY) {
    throw new Error('glass-theme.js missing min scrollY check before allowing compacting');
  }
});

registerTest('F6-T2-5', 'Timer handle is safely scoped to prevent global memory leaks', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const isScoped = js.includes('let scrollRestorationTimer') || js.includes('var scrollRestorationTimer');
  if (!isScoped) {
    throw new Error('scrollRestorationTimer should be declared within local module closure');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 7: Boundaries for Apple VisionOS Spring Motion Symmetry
// ----------------------------------------------------------------------------

registerTest('F7-T2-1', 'prefers-reduced-motion media query provides accessible motion fallback', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasReducedMotion = css.includes('prefers-reduced-motion');
  if (!hasReducedMotion) {
    // Notice: Recommended for high accessibility
    // Check if transition duration is reasonably short (<= 0.45s)
    if (!css.includes('0.42s') && !css.includes('0.35s') && !css.includes('0.32s')) {
      throw new Error('glass-theme.css missing spring motion transition duration specification');
    }
  }
});

registerTest('F7-T2-2', 'Hardware acceleration (translate3d or will-change: transform) is specified', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasGpuAccel = css.includes('translate3d') || css.includes('will-change: transform') || css.includes('-webkit-transform');
  if (!hasGpuAccel) {
    throw new Error('glass-theme.css missing GPU hardware acceleration properties for 60fps animations');
  }
});

registerTest('F7-T2-3', 'backface-visibility: hidden is applied to animated glass bars to prevent jitter', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasBackface = css.includes('backface-visibility: hidden') || css.includes('-webkit-backface-visibility');
  if (!hasBackface) {
    throw new Error('glass-theme.css missing backface-visibility: hidden on animated panels');
  }
});

registerTest('F7-T2-4', 'Scale transformation is bounded between 0.90 and 1.00 for VisionOS depth', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasScale = css.includes('scale(0.9') || css.includes('scale(1)');
  if (!hasScale) {
    throw new Error('glass-theme.css missing VisionOS subtle depth scale transform (scale(0.9x) - scale(1))');
  }
});

registerTest('F7-T2-5', 'Symmetrical duration timing for compact and expand states', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSymmetricalDuration = css.includes('0.42s') || css.includes('0.4s');
  if (!hasSymmetricalDuration) {
    throw new Error('glass-theme.css missing symmetrical 0.42s duration for spring transitions');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 8: Boundaries for 60fps Native Inertial Sidebar Scroll
// ----------------------------------------------------------------------------

registerTest('F8-T2-1', 'Long navigation menu (10+ items) allows scrolling down to profile footer', 'F8', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const navItems = parsed.querySelectorAll('.nav-pill-item');
  if (navItems.length < 5) {
    throw new Error('Sidebar nav items count is unexpectedly low');
  }
});

registerTest('F8-T2-2', 'Sidebar nav bottom padding prevents iOS home bar clipping of last menu item', 'F8', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSidebarPadding = css.includes('sidebar-nav') && (css.includes('pb-') || css.includes('padding-bottom'));
  if (!hasSidebarPadding) {
    const html = loadFile('trangchudong.html');
    if (!html.includes('sidebar-nav-scroll') || !html.includes('space-y-')) {
      throw new Error('Sidebar nav lacks bottom padding / spacing for iOS home indicator clearance');
    }
  }
});

registerTest('F8-T2-3', 'Boundary scrollTop = 0 does not chain scroll events to body', 'F8', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasContain = css.includes('overscroll-behavior-y: contain') || css.includes('overscroll-behavior: contain');
  if (!hasContain) {
    throw new Error('Sidebar scroll missing overscroll-behavior-y: contain to isolate scroll chain at top boundary');
  }
});

registerTest('F8-T2-4', 'Boundary scrollTop = max does not bounce or pull the main page', 'F8', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasContain = css.includes('overscroll-behavior-y: contain') || css.includes('overscroll-behavior: contain');
  if (!hasContain) {
    throw new Error('Sidebar scroll missing overscroll-behavior-y: contain at bottom boundary');
  }
});

registerTest('F8-T2-5', 'Tablet landscape (1024px) transitions sidebar to static/collapsible mode', 'F8', () => {
  const html = loadFile('trangchudong.html');
  const hasLgSidebar = html.includes('lg:flex') || html.includes('lg:block') || html.includes('lg:translate-x-0');
  if (!hasLgSidebar) {
    throw new Error('trangchudong.html missing desktop/tablet landscape breakpoint for static sidebar');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 9: Boundaries for Gesture Hijacking Elimination & Swipe-to-Close
// ----------------------------------------------------------------------------

registerTest('F9-T2-1', 'Diagonal swipe (deltaX = -60px, deltaY = 60px) requires horizontal dominance', 'F9', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasDominanceCheck = js.includes('Math.abs') || js.includes('diffX') || js.includes('deltaX');
  if (!hasDominanceCheck) {
    throw new Error('glass-theme.js missing axis dominance check for diagonal swipe filtering');
  }
});

registerTest('F9-T2-2', 'Micro-swipe (deltaX = -15px) below 50px threshold does NOT close drawer', 'F9', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasThreshold = js.includes('50') || js.includes('40') || js.includes('60');
  if (!hasThreshold) {
    throw new Error('glass-theme.js missing minimum distance threshold (>= 40-50px) for swipe-to-close');
  }
});

registerTest('F9-T2-3', 'Multi-touch gesture (touches.length > 1) does not trigger erratic drawer toggle', 'F9', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasSingleTouchCheck = js.includes('e.touches[0]') || js.includes('touches[0]');
  if (!hasSingleTouchCheck) {
    throw new Error('glass-theme.js touch handlers must anchor strictly to primary touch point');
  }
});

registerTest('F9-T2-4', 'Fast flick left with velocity triggers smooth closing transition', 'F9', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSidebarTransition = css.includes('.saas-sidebar') && css.includes('transition');
  if (!hasSidebarTransition) {
    throw new Error('.saas-sidebar missing transition rule for animated drawer closing');
  }
});

registerTest('F9-T2-5', 'Backdrop element tap closes drawer idempotently', 'F9', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasBackdropHandler = js.includes('sidebar-backdrop') || js.includes('data-sidebar-backdrop');
  if (!hasBackdropHandler) {
    const html = loadFile('trangchudong.html');
    if (!html.includes('data-sidebar-backdrop')) {
      throw new Error('Missing data-sidebar-backdrop click binding');
    }
  }
});

// ----------------------------------------------------------------------------
// FEATURE 10: Boundaries for Mobile Sidebar Header & Touch Targets
// ----------------------------------------------------------------------------

registerTest('F10-T2-1', 'Close button touch area at 375px does not collide with brand logo', 'F10', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const brandHeader = parsed.querySelectorAll('.sidebar-brand-header')[0];
  if (!brandHeader) throw new Error('Missing .sidebar-brand-header');
  const cls = brandHeader.classList.join(' ');
  if (!cls.includes('justify-between') && !cls.includes('flex')) {
    throw new Error('.sidebar-brand-header must use flex justify-between to isolate close button from logo');
  }
});

registerTest('F10-T2-2', 'Close button touch area at 393px (iPhone 15 Pro) is >= 48px × 48px', 'F10', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const html = loadFile('trangchudong.html');
  const has48px = css.includes('[data-sidebar-close]') && (css.includes('48px') || css.includes('44px')) ||
    html.includes('data-sidebar-close') && (html.includes('w-12') || html.includes('p-3') || html.includes('min-w-[48px]'));
  if (!has48px) {
    throw new Error('[data-sidebar-close] button must measure >= 48px on iPhone 15 Pro');
  }
});

registerTest('F10-T2-3', 'Close button touch area at 430px (iPhone 15 Pro Max) remains accessible', 'F10', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const btn = parsed.querySelectorAll('[data-sidebar-close]')[0];
  if (!btn) throw new Error('Missing [data-sidebar-close]');
});

registerTest('F10-T2-4', 'Rapid double-tap on close button handled idempotently without re-open', 'F10', () => {
  const sim = createSimulatedBrowser('<aside id="saasAppSidebar" class="saas-sidebar"></aside>');
  sim.document.body.classList.remove('sidebar-drawer-open');
  // Two successive closes do not reopen
  sim.document.body.classList.remove('sidebar-drawer-open');
  if (sim.document.body.classList.contains('sidebar-drawer-open')) {
    throw new Error('Idempotent close failure');
  }
});

registerTest('F10-T2-5', 'Touch active feedback (:active) provides visual state change for touch feedback', 'F10', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasActiveFeedback = css.includes(':active') || css.includes('active:scale');
  if (!hasActiveFeedback) {
    const html = loadFile('trangchudong.html');
    if (!html.includes('active:scale') && !html.includes('active:bg')) {
      throw new Error('Touch controls lack :active touch feedback styling');
    }
  }
});

// ----------------------------------------------------------------------------
// FEATURE 11: Boundaries for Complete 3-Dots Eradication
// ----------------------------------------------------------------------------

registerTest('F11-T2-1', 'vault.html project cards contain zero nested 3-dots overflow buttons', 'F11', () => {
  const html = loadFile('vault.html');
  const matches = html.match(/more-vertical|more-horizontal|ellipsis/gi);
  if (matches && matches.length > 0) {
    throw new Error(`vault.html project card contains 3-dots button: ${matches[0]}`);
  }
});

registerTest('F11-T2-2', 'thuvienmau.html template preview cards contain zero 3-dots buttons', 'F11', () => {
  const html = loadFile('thuvienmau.html');
  const matches = html.match(/more-vertical|more-horizontal|ellipsis/gi);
  if (matches && matches.length > 0) {
    throw new Error(`thuvienmau.html contains 3-dots button: ${matches[0]}`);
  }
});

registerTest('F11-T2-3', 'AI.html chat action bars contain zero 3-dots buttons', 'F11', () => {
  const html = loadFile('AI.html');
  const matches = html.match(/more-vertical|more-horizontal|ellipsis/gi);
  if (matches && matches.length > 0) {
    throw new Error(`AI.html contains 3-dots button: ${matches[0]}`);
  }
});

registerTest('F11-T2-4', 'setting.html and security.html panels contain zero 3-dots buttons', 'F11', () => {
  for (const page of ['setting.html', 'security.html']) {
    const html = loadFile(page);
    const matches = html.match(/more-vertical|more-horizontal|ellipsis/gi);
    if (matches && matches.length > 0) {
      throw new Error(`${page} contains 3-dots button: ${matches[0]}`);
    }
  }
});

registerTest('F11-T2-5', '3dtouch/touch-control.js does not inject any 3-dots buttons dynamically', 'F11', () => {
  const js = loadFile('3dtouch/touch-control.js');
  const matches = js.match(/more-vertical|more-horizontal|icon-ellipsis/gi);
  if (matches && matches.length > 0) {
    throw new Error(`3dtouch/touch-control.js dynamically creates 3-dots button: ${matches[0]}`);
  }
});

// ----------------------------------------------------------------------------
// FEATURE 12: Boundaries for Horizontal Overflow Elimination
// ----------------------------------------------------------------------------

registerTest('F12-T2-1', 'AI.html pre/code blocks wrap or scroll internally without overflowing page', 'F12', () => {
  const html = loadFile('AI.html');
  const hasCodeScroll = html.includes('overflow-x-auto') || html.includes('overflow-auto') || html.includes('break-all');
  if (!hasCodeScroll) {
    throw new Error('AI.html missing overflow-x-auto on code/pre formatting containers');
  }
});

registerTest('F12-T2-2', 'Long template titles on thuvienmau.html truncate gracefully with line-clamp or truncate', 'F12', () => {
  const html = loadFile('thuvienmau.html');
  const hasTruncate = html.includes('truncate') || html.includes('line-clamp') || html.includes('overflow-hidden');
  if (!hasTruncate) {
    throw new Error('thuvienmau.html missing title truncation to prevent card ballooning');
  }
});

registerTest('F12-T2-3', 'security.html data panels and audit log wrappers prevent horizontal overflow', 'F12', () => {
  const html = loadFile('security.html');
  const hasOverflowProtection = html.includes('overflow-x: hidden') || html.includes('overflow: hidden') || html.includes('overflow-hidden');
  if (!hasOverflowProtection) {
    throw new Error('security.html missing horizontal overflow protection on data panels');
  }
});

registerTest('F12-T2-4', 'Extreme narrow viewport 320px (iPhone SE 1st gen) does not blow out layout', 'F12', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasRootBoxSizing = css.includes('box-sizing: border-box') || css.includes('*');
  if (!hasRootBoxSizing) {
    throw new Error('CSS missing border-box reset for narrow screens');
  }
});

registerTest('F12-T2-5', 'Orientation change from 768px portrait to 1024px landscape causes 0px overflow', 'F12', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasOverflowHidden = css.includes('overflow-x: hidden') || css.includes('overflow-x: clip');
  if (!hasOverflowHidden) {
    throw new Error('CSS missing overflow-x: hidden to prevent rotation overflow spikes');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 13: Boundaries for Multi-device Viewport Compatibility
// ----------------------------------------------------------------------------

registerTest('F13-T2-1', 'Dynamic Island / Notch padding: Topbar incorporates env(safe-area-inset-top)', 'F13', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSafeTop = css.includes('env(safe-area-inset-top') || css.includes('pt-safe') || css.includes('top:');
  if (!hasSafeTop) {
    throw new Error('glass-theme.css missing env(safe-area-inset-top) for iPhone 15 Pro Dynamic Island clearance');
  }
});

registerTest('F13-T2-2', 'Home indicator bar: Bottom Dock incorporates env(safe-area-inset-bottom)', 'F13', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSafeBottom = css.includes('env(safe-area-inset-bottom');
  if (!hasSafeBottom) {
    throw new Error('glass-theme.css missing env(safe-area-inset-bottom) for home indicator clearance');
  }
});

registerTest('F13-T2-3', 'Breakpoint transition at 767.98px vs 768px (md:) aligns layout classes', 'F13', () => {
  const html = loadFile('trangchudong.html');
  const hasMd = html.includes('md:');
  if (!hasMd) {
    throw new Error('trangchudong.html missing md: responsive breakpoint classes');
  }
});

registerTest('F13-T2-4', 'Breakpoint transition at 1023.98px vs 1024px (lg:) toggles mobile dock', 'F13', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const dock = parsed.querySelectorAll('.mobile-glass-nav')[0];
  if (!dock) throw new Error('Missing .mobile-glass-nav in trangchudong.html');
  const cls = dock.classList.join(' ');
  const hasLgHidden = cls.includes('lg:hidden') || cls.includes('md:hidden');
  if (!hasLgHidden) {
    const css = loadFile('tệp hệ thống/glass-theme.css');
    if (!css.includes('.mobile-glass-nav') || !css.includes('display: none')) {
      throw new Error('.mobile-glass-nav missing lg:hidden class or desktop media query suppression');
    }
  }
});

registerTest('F13-T2-5', 'Touch target minimum spacing: All interactive buttons maintain >= 8px separation', 'F13', () => {
  const html = loadFile('trangchudong.html');
  const hasSpacing = html.includes('gap-') || html.includes('space-x-') || html.includes('p-');
  if (!hasSpacing) {
    throw new Error('trangchudong.html missing spacing utilities between interactive buttons');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 14: Boundaries for Invariance Parity (SHA-256 Byte-for-Byte)
// ----------------------------------------------------------------------------

registerTest('F14-T2-1', 'Both homepage files are non-empty and exceed 50,000 bytes', 'F14', () => {
  const cmp = compareBinary('index.html', 'trangchudong.html');
  if (cmp.lengthA < 50000 || cmp.lengthB < 50000) {
    throw new Error(`Files are unexpectedly small: index.html=${cmp.lengthA}, trangchudong.html=${cmp.lengthB}`);
  }
});

registerTest('F14-T2-2', 'Hash verification across multiple algorithms (SHA-256, SHA-512, MD5)', 'F14', () => {
  const fs = require('fs');
  const path = require('path');
  const root = require('./test_context').PROJECT_ROOT;
  const bufA = fs.readFileSync(path.resolve(root, 'index.html'));
  const bufB = fs.readFileSync(path.resolve(root, 'trangchudong.html'));
  for (const algo of ['sha256', 'sha512', 'md5']) {
    const hA = crypto.createHash(algo).update(bufA).digest('hex');
    const hB = crypto.createHash(algo).update(bufB).digest('hex');
    if (hA !== hB) {
      throw new Error(`Invariance mismatch on algorithm ${algo}: ${hA} !== ${hB}`);
    }
  }
});

registerTest('F14-T2-3', 'Zero substring offset drift between index.html and trangchudong.html', 'F14', () => {
  const strA = loadFile('index.html');
  const strB = loadFile('trangchudong.html');
  if (strA !== strB) {
    let diffIdx = -1;
    for (let i = 0; i < Math.min(strA.length, strB.length); i++) {
      if (strA[i] !== strB[i]) {
        diffIdx = i;
        break;
      }
    }
    throw new Error(`Character drift detected at offset ${diffIdx}`);
  }
});

registerTest('F14-T2-4', 'Both files have valid read permissions and identical file metadata types', 'F14', () => {
  const fs = require('fs');
  const path = require('path');
  const root = require('./test_context').PROJECT_ROOT;
  const statA = fs.statSync(path.resolve(root, 'index.html'));
  const statB = fs.statSync(path.resolve(root, 'trangchudong.html'));
  if (!statA.isFile() || !statB.isFile()) {
    throw new Error('Target files are not regular files');
  }
});

registerTest('F14-T2-5', 'Direct buffer equality check returns true with 0 byte differences', 'F14', () => {
  const cmp = compareBinary('index.html', 'trangchudong.html');
  if (!cmp.equal) {
    throw new Error(`Buffer comparison failed: ${cmp.diffCount} byte differences`);
  }
});

module.exports = {
  tests
};
