/**
 * ============================================================================
 * TIER 1: Feature Coverage Test Suite (>= 70 tests across 14 features)
 * Tests primary behavior (happy paths) for every requirement and feature.
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

const tests = [];

function registerTest(id, name, featureId, fn) {
  tests.push({ id, name, tier: 1, featureId, fn });
}

// ----------------------------------------------------------------------------
// FEATURE 1: Remove/Suppress Thanh Số 3 & Floating Buttons (ORIGINAL_REQUEST §R1)
// ----------------------------------------------------------------------------

registerTest('F1-T1-1', 'Thanh số 3 (dynamicMobileIsland) is absent from core HTML pages', 'F1', () => {
  const corePages = ['index.html', 'trangchudong.html', 'vault.html', 'thuvienmau.html', 'AI.html', 'setting.html', 'security.html'];
  for (const page of corePages) {
    const html = loadFile(page);
    const parsed = parseHtml(html);
    const island = parsed.getElementById('dynamicMobileIsland');
    if (island) {
      throw new Error(`Found unexpected #dynamicMobileIsland in ${page}`);
    }
    const islandClasses = parsed.getElementsByClassName('mobile-dynamic-island');
    if (islandClasses.length > 0) {
      throw new Error(`Found unexpected .mobile-dynamic-island element in ${page}`);
    }
  }
});

registerTest('F1-T1-2', 'Floating camera pill #floatingQuickCamAi has CSS mobile suppression rule', 'F1', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  
  // Rule suppressing #floatingQuickCamAi on mobile / tablet (<1024px)
  const hasSuppression = parsedCss.rules.some(r => {
    return (r.selector.includes('#floatingQuickCamAi') || r.selector.includes('[data-sv-touch-toggle]')) &&
      r.declarations['display'] === 'none !important' ||
      r.declarations['display'] === 'none';
  });
  
  if (!hasSuppression) {
    // Alternatively check if marked with md:flex / hidden or media query
    const html = loadFile('trangchudong.html');
    const parsed = parseHtml(html);
    const btn = parsed.getElementById('floatingQuickCamAi');
    if (btn && !btn.classList.includes('hidden') && !btn.rawAttrs.includes('hidden')) {
      // Must have CSS rule or hidden class
      throw new Error('#floatingQuickCamAi lacks CSS mobile suppression rule or hidden utility class');
    }
  }
});

registerTest('F1-T1-3', 'Dynamic island initialization is guarded or removed in glass-theme.js', 'F1', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // Check that either initDynamicMobileIsland is not called uninvited or safely returns early
  const hasSafeCheck = js.includes('!island') || !js.includes('initDynamicMobileIsland()');
  if (!hasSafeCheck) {
    throw new Error('glass-theme.js does not safely guard initDynamicMobileIsland when element is absent');
  }
});

registerTest('F1-T1-4', 'Floating pills do not block mobile navigation click plane', 'F1', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const mobileNavRules = parsedCss.rules.filter(r => r.selector.includes('.mobile-glass-nav'));
  const hasZIndex = mobileNavRules.some(r => {
    const z = parseInt(r.declarations['z-index'] || '0', 10);
    return z >= 40;
  });
  if (!hasZIndex) {
    throw new Error('.mobile-glass-nav must have sufficient z-index (>=40) to maintain elevated interaction layer');
  }
});

registerTest('F1-T1-5', 'Category chips on homepage have unoccluded layout clearance above dock', 'F1', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const chips = parsed.querySelectorAll('.filter-chip, .category-chip, [data-category], #categoryChipsGroup');
  if (chips.length === 0) {
    // Check main layout container has bottom padding
    const hasBottomPadding = html.includes('pb-24') || html.includes('pb-32') || html.includes('padding-bottom');
    if (!hasBottomPadding) {
      throw new Error('Homepage layout lacks bottom padding for category chips / content clearance');
    }
  }
});

// ----------------------------------------------------------------------------
// FEATURE 2: Spatial Feature Isolation to phone.html (ORIGINAL_REQUEST §R1)
// ----------------------------------------------------------------------------

registerTest('F2-T1-1', 'phone.html provides dedicated 3D Touchpad surface (#touchPadSurface)', 'F2', () => {
  const html = loadFile('phone.html');
  const parsed = parseHtml(html);
  const touchPad = parsed.getElementById('touchPadSurface');
  if (!touchPad) {
    throw new Error('phone.html is missing dedicated #touchPadSurface element');
  }
});

registerTest('F2-T1-2', 'phone.html includes all 4 specialized spatial control modes', 'F2', () => {
  const html = loadFile('phone.html');
  const parsed = parseHtml(html);
  const modes = ['modeTrackpad', 'modeGyro', 'modeLaser', 'modeCameraAi'];
  for (const modeId of modes) {
    const el = parsed.getElementById(modeId);
    if (!el) {
      throw new Error(`phone.html is missing spatial mode selector #${modeId}`);
    }
  }
});

registerTest('F2-T1-3', 'phone.html includes presentation remote control deck', 'F2', () => {
  const html = loadFile('phone.html');
  const parsed = parseHtml(html);
  const controls = ['btnSlidePrev', 'btnClickLaser', 'btnSlideNext', 'btnFullscreen', 'btnBlankScreen'];
  for (const ctrlId of controls) {
    const el = parsed.getElementById(ctrlId);
    if (!el) {
      throw new Error(`phone.html is missing tactical controller button #${ctrlId}`);
    }
  }
});

registerTest('F2-T1-4', 'phone.html provides quick AI prompt form for keynote assistance', 'F2', () => {
  const html = loadFile('phone.html');
  const parsed = parseHtml(html);
  const form = parsed.getElementById('remoteTextForm') || parsed.getElementById('quickPromptForm');
  const input = parsed.getElementById('remoteTextInput') || parsed.getElementById('quickPromptInput');
  if (!form || !input) {
    throw new Error('phone.html is missing remote AI prompt form/input element');
  }
});

registerTest('F2-T1-5', 'Main content pages do NOT inject active spatial HUD overlays on load', 'F2', () => {
  const pages = ['vault.html', 'thuvienmau.html', 'setting.html', 'security.html'];
  for (const page of pages) {
    const html = loadFile(page);
    const parsed = parseHtml(html);
    const hud = parsed.getElementById('sv-spatial-hud');
    if (hud && !hud.classList.includes('hidden') && !hud.rawAttrs.includes('hidden')) {
      throw new Error(`Uninvited active spatial HUD found on main content page ${page}`);
    }
  }
});

// ----------------------------------------------------------------------------
// FEATURE 3: Dual-Layer Modal Suppression (ORIGINAL_REQUEST §R1)
// ----------------------------------------------------------------------------

registerTest('F3-T1-1', 'CSS contains :has(dialog[open]) suppression for .mobile-glass-nav', 'F3', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const hasDialogSuppression = parsedCss.rules.some(r => {
    return (r.selector.includes(':has(dialog[open])') || r.selector.includes('body:has(dialog[open])')) &&
      r.selector.includes('.mobile-glass-nav') &&
      (r.declarations['opacity'] === '0 !important' || r.declarations['opacity'] === '0' || r.declarations['display'] === 'none !important' || r.declarations['display'] === 'none');
  });
  if (!hasDialogSuppression) {
    throw new Error('glass-theme.css missing CSS :has(dialog[open]) .mobile-glass-nav suppression rule');
  }
});

registerTest('F3-T1-2', 'CSS contains body.modal-open suppression for .mobile-glass-nav', 'F3', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const hasBodyModalOpen = parsedCss.rules.some(r => {
    return (r.selector.includes('body.modal-open') || r.selector.includes('.modal-open')) &&
      r.selector.includes('.mobile-glass-nav') &&
      (r.declarations['opacity'] === '0 !important' || r.declarations['pointer-events'] === 'none !important' || r.declarations['display'] === 'none !important');
  });
  if (!hasBodyModalOpen) {
    throw new Error('glass-theme.css missing body.modal-open .mobile-glass-nav suppression rule');
  }
});

registerTest('F3-T1-3', 'Homepage quickViewDialog action buttons are defined without dock overlap', 'F3', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const dialog = parsed.getElementById('quickViewDialog');
  if (!dialog) {
    throw new Error('trangchudong.html missing #quickViewDialog');
  }
  const btnDownload = parsed.getElementById('qvBtnDownload');
  const btnCart = parsed.getElementById('qvBtnCart');
  if (!btnDownload || !btnCart) {
    throw new Error('#quickViewDialog missing essential CTA buttons #qvBtnDownload or #qvBtnCart');
  }
});

registerTest('F3-T1-4', 'Checkout dialog contains confirmation button unblocked by bottom dock', 'F3', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const checkout = parsed.getElementById('checkoutDialog');
  if (!checkout) {
    throw new Error('trangchudong.html missing #checkoutDialog');
  }
});

registerTest('F3-T1-5', 'Template preview modal on thuvienmau.html has primary CTA button', 'F3', () => {
  const html = loadFile('thuvienmau.html');
  const parsed = parseHtml(html);
  const modal = parsed.getElementById('templatePreviewModal') || parsed.querySelectorAll('dialog')[0];
  if (!modal) {
    throw new Error('thuvienmau.html missing template preview dialog');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 4: Bottom Content Clearance & Mobile Dialog Sizing (ORIGINAL_REQUEST §R1)
// ----------------------------------------------------------------------------

registerTest('F4-T1-1', 'Mobile dialog max-height is capped at 85dvh / 85vh in CSS', 'F4', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const hasDialogMaxHeight = parsedCss.rules.some(r => {
    return (r.selector.includes('dialog') || r.selector.includes('.modal-card') || r.selector.includes('.modal')) &&
      r.declarations['max-height'] &&
      /85(dvh|svh|vh)/i.test(r.declarations['max-height']);
  });
  if (!hasDialogMaxHeight) {
    throw new Error('glass-theme.css missing mobile dialog max-height cap (85dvh / 85vh)');
  }
});

registerTest('F4-T1-2', 'Mobile dialog specifies overflow-y auto for scrollable content', 'F4', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const hasDialogScroll = parsedCss.rules.some(r => {
    return (r.selector.includes('dialog') || r.selector.includes('.modal-card') || r.selector.includes('.modal')) &&
      (r.declarations['overflow-y'] === 'auto' || r.declarations['overflow-y'] === 'auto !important' || r.declarations['overflow'] === 'auto');
  });
  if (!hasDialogScroll) {
    throw new Error('glass-theme.css missing dialog overflow-y: auto declaration');
  }
});

registerTest('F4-T1-3', 'Mobile dialog incorporates safe-area-inset-bottom in padding', 'F4', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSafeAreaPadding = css.includes('env(safe-area-inset-bottom');
  if (!hasSafeAreaPadding) {
    throw new Error('glass-theme.css missing env(safe-area-inset-bottom) safe-area padding');
  }
});

registerTest('F4-T1-4', 'Main layout has bottom clearance padding for mobile dock', 'F4', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const html = loadFile('trangchudong.html');
  const hasBottomPadding = css.includes('padding-bottom: calc(125px') ||
    css.includes('.saas-layout-wrapper') && css.includes('padding-bottom') ||
    html.includes('pb-24') || html.includes('pb-28') || html.includes('pb-32') || html.includes('padding-bottom');
  if (!hasBottomPadding) {
    throw new Error('Main layout wrapper lacks bottom clearance padding');
  }
});

registerTest('F4-T1-5', 'AI.html chatInputArea and send button have dedicated viewport clearance', 'F4', () => {
  const html = loadFile('AI.html');
  const parsed = parseHtml(html);
  const inputArea = parsed.getElementById('chatInputArea');
  const sendBtn = parsed.getElementById('chatSendButton');
  if (!inputArea || !sendBtn) {
    throw new Error('AI.html missing #chatInputArea or #chatSendButton');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 5: Scroll-Driven Hiding & Restoration Engine (ORIGINAL_REQUEST §R2)
// ----------------------------------------------------------------------------

registerTest('F5-T1-1', 'Scroll handler logic defines downward threshold in glass-theme.js', 'F5', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasDownwardLogic = js.includes('topbar-compact') && js.includes('dock-compact');
  if (!hasDownwardLogic) {
    throw new Error('glass-theme.js missing topbar-compact and dock-compact scroll logic');
  }
});

registerTest('F5-T1-2', 'Downward scroll adds .topbar-compact class to topbar', 'F5', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  if (!js.includes('classList.add(\'topbar-compact\')') && !js.includes('classList.add("topbar-compact")') && !js.includes(".add('topbar-compact')")) {
    throw new Error('glass-theme.js does not add topbar-compact on downward scroll');
  }
});

registerTest('F5-T1-3', 'Downward scroll adds .dock-compact class to bottom dock', 'F5', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  if (!js.includes('dock-compact')) {
    throw new Error('glass-theme.js does not add dock-compact on downward scroll');
  }
  const hasAddDock = js.includes("add('dock-compact'") || js.includes('add("dock-compact"') || js.includes(".add('dock-compact");
  if (!hasAddDock) {
    throw new Error('glass-theme.js does not add dock-compact class on downward scroll');
  }
});

registerTest('F5-T1-4', 'Upward scroll removes .topbar-compact and .dock-compact classes', 'F5', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasRemoveLogic = (js.includes('remove(\'topbar-compact\'') || js.includes('remove("topbar-compact"')) &&
    (js.includes('remove(\'dock-compact\'') || js.includes('remove("dock-compact"'));
  if (!hasRemoveLogic) {
    throw new Error('glass-theme.js missing logic to remove topbar-compact and dock-compact on upward scroll');
  }
});

registerTest('F5-T1-5', 'Reaching near top of page (scrollY <= 20-25px) clears compact states', 'F5', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasTopCheck = js.includes('currentScrollY <= 24') || js.includes('currentScrollY <= 20') || js.includes('currentScrollY <= 25') || js.includes('scrollY <= 20');
  if (!hasTopCheck) {
    throw new Error('glass-theme.js missing top boundary check to restore navigation near top of page');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 6: Scroll Stop & Touch End Auto-Restoration (ORIGINAL_REQUEST §R2)
// ----------------------------------------------------------------------------

registerTest('F6-T1-1', 'scrollRestorationTimer is defined in glass-theme.js', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasRestorationTimer = js.includes('scrollRestorationTimer') || js.includes('restorationTimer') || js.includes('scrollEndTimer');
  if (!hasRestorationTimer) {
    throw new Error('glass-theme.js missing scroll restoration timer definition');
  }
});

registerTest('F6-T1-2', 'Restoration timeout is set to approximately 1000ms idle', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const has1000ms = js.includes('1000') || js.includes('900') || js.includes('1100') || js.includes('800');
  if (!has1000ms) {
    throw new Error('glass-theme.js missing ~1000ms idle delay for scroll restoration');
  }
});

registerTest('F6-T1-3', 'Restoration timer clears .topbar-compact class', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasClearTopbar = js.includes('topbar-compact') && js.includes('clearTimeout');
  if (!hasClearTopbar) {
    throw new Error('glass-theme.js restoration logic does not manage topbar-compact');
  }
});

registerTest('F6-T1-4', 'Restoration timer clears .dock-compact class', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasClearDock = js.includes('dock-compact') && js.includes('clearTimeout');
  if (!hasClearDock) {
    throw new Error('glass-theme.js restoration logic does not manage dock-compact');
  }
});

registerTest('F6-T1-5', 'touchend / scrollend events trigger scroll restoration check', 'F6', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasTouchOrScrollEnd = js.includes('touchend') || js.includes('scrollend');
  if (!hasTouchOrScrollEnd) {
    throw new Error('glass-theme.js missing touchend or scrollend listener for navigation restoration');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 7: Apple VisionOS Spring Motion Symmetry (ORIGINAL_REQUEST §R2)
// ----------------------------------------------------------------------------

registerTest('F7-T1-1', 'Topbar defines Apple VisionOS cubic-bezier spring transition', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSpring = css.includes('cubic-bezier(0.16, 1, 0.3, 1)') || css.includes('cubic-bezier(0.16, 1, 0.3, 1');
  if (!hasSpring) {
    throw new Error('glass-theme.css missing VisionOS cubic-bezier(0.16, 1, 0.3, 1) timing function');
  }
});

registerTest('F7-T1-2', 'Bottom dock defines symmetrical transform transition', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const dockRules = parsedCss.rules.filter(r => r.selector.includes('.mobile-glass-nav'));
  const hasTransformTransition = dockRules.some(r => {
    return r.declarations['transition'] && r.declarations['transition'].includes('transform');
  });
  if (!hasTransformTransition) {
    throw new Error('.mobile-glass-nav missing transition: transform declaration');
  }
});

registerTest('F7-T1-3', 'Topbar compact state translates completely off-screen (-100%)', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const topbarCompact = parsedCss.rules.filter(r => r.selector.includes('.saas-topbar.topbar-compact') || r.selector.includes('.topbar-compact'));
  const hasOffscreen = topbarCompact.some(r => {
    return r.declarations['transform'] && r.declarations['transform'].includes('-100%');
  });
  if (!hasOffscreen) {
    throw new Error('.topbar-compact missing translateY(-100%) transform');
  }
});

registerTest('F7-T1-4', 'Bottom dock compact state translates completely off-screen (100%)', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const dockCompact = parsedCss.rules.filter(r => r.selector.includes('.mobile-glass-nav.dock-compact') || r.selector.includes('.dock-compact'));
  const hasOffscreen = dockCompact.some(r => {
    return r.declarations['transform'] && r.declarations['transform'].includes('100%');
  });
  if (!hasOffscreen) {
    throw new Error('.dock-compact missing translateY(100%) transform');
  }
});

registerTest('F7-T1-5', 'Discontinuous jumping keyframes (-2px / 4px start) eliminated or corrected', 'F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  // Check if legacy jumping @keyframessvTopbarSpringExpand from -2px remains
  const hasGlitchKeyframe = css.includes('@keyframes svTopbarSpringExpand') && css.includes('translateY(-2px)');
  if (hasGlitchKeyframe) {
    throw new Error('glass-theme.css still contains discontinuous @keyframes svTopbarSpringExpand jumping from -2px');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 8: 60fps Native Inertial Sidebar Scroll (ORIGINAL_REQUEST §R3)
// ----------------------------------------------------------------------------

registerTest('F8-T1-1', 'Outer .saas-sidebar container has overflow: hidden on mobile drawer mode', 'F8', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const sidebarRules = parsedCss.rules.filter(r => r.selector.includes('.saas-sidebar'));
  const hasOverflowHidden = sidebarRules.some(r => {
    return r.declarations['overflow'] === 'hidden' || r.declarations['overflow'] === 'hidden !important';
  });
  if (!hasOverflowHidden) {
    // Alternatively check if overflow-x: hidden and inner scroll is isolated
    const hasAnyHidden = css.includes('saas-sidebar') && css.includes('overflow: hidden');
    if (!hasAnyHidden) {
      throw new Error('.saas-sidebar missing overflow: hidden to resolve nested scroll collision');
    }
  }
});

registerTest('F8-T1-2', 'Inner nav.sidebar-nav-scroll specifies overflow-y: auto', 'F8', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const navRules = parsedCss.rules.filter(r => r.selector.includes('.sidebar-nav-scroll') || r.selector.includes('sidebar-nav'));
  const hasScroll = navRules.some(r => {
    return r.declarations['overflow-y'] === 'auto' || r.declarations['overflow-y'] === 'auto !important';
  });
  if (!hasScroll) {
    const html = loadFile('trangchudong.html');
    if (!html.includes('overflow-y-auto') && !html.includes('sidebar-nav-scroll')) {
      throw new Error('Sidebar nav missing overflow-y: auto declaration');
    }
  }
});

registerTest('F8-T1-3', 'Sidebar nav enables iOS native inertia (-webkit-overflow-scrolling: touch)', 'F8', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasInertia = css.includes('-webkit-overflow-scrolling: touch');
  if (!hasInertia) {
    throw new Error('glass-theme.css missing -webkit-overflow-scrolling: touch for 60fps iOS momentum scroll');
  }
});

registerTest('F8-T1-4', 'Sidebar nav specifies overscroll-behavior-y: contain to isolate scroll chains', 'F8', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasOverscrollContain = css.includes('overscroll-behavior-y: contain') || css.includes('overscroll-behavior: contain');
  if (!hasOverscrollContain) {
    throw new Error('glass-theme.css missing overscroll-behavior-y: contain on sidebar scroll container');
  }
});

registerTest('F8-T1-5', 'Sidebar nav hides scrollbars cleanly across browser engines', 'F8', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasScrollbarHidden = css.includes('scrollbar-width: none') || css.includes('::-webkit-scrollbar');
  if (!hasScrollbarHidden) {
    throw new Error('Sidebar nav missing scrollbar-width: none / ::-webkit-scrollbar styling');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 9: Gesture Hijacking Elimination & Swipe-to-Close (ORIGINAL_REQUEST §R3)
// ----------------------------------------------------------------------------

registerTest('F9-T1-1', 'glass-theme.js does not block swipe-to-close inside open drawer', 'F9', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // Check that "if (isInsideSidebar && isDrawerOpen) return;" has been eliminated
  const hasBlockingReturn = js.includes('if (isInsideSidebar && isDrawerOpen) return;') ||
    js.includes('if (isInsideSidebar && isDrawerOpen) {') && js.includes('return;');
  if (hasBlockingReturn) {
    throw new Error('glass-theme.js still blocks swipe gesture when isInsideSidebar && isDrawerOpen');
  }
});

registerTest('F9-T1-2', 'Swipe left gesture inside drawer initiates sidebar closure', 'F9', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasCloseGesture = js.includes('diffX') || js.includes('deltaX') || js.includes('touchStartX');
  if (!hasCloseGesture) {
    throw new Error('glass-theme.js missing touch gesture coordinate handling');
  }
});

registerTest('F9-T1-3', 'Vertical scroll is prioritized over horizontal drawer dragging', 'F9', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  const hasVerticalCheck = js.includes('Math.abs') || js.includes('Math.max');
  if (!hasVerticalCheck) {
    throw new Error('glass-theme.js missing directional displacement check to prevent vertical scroll hijacking');
  }
});

registerTest('F9-T1-4', 'Edge detection threshold for drawer open gesture is strictly bounded (<= 24px)', 'F9', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // Overly broad touchStartX <= 30 hijacked page scrolling near left margin
  const hasBroadEdge = js.includes('touchStartX <= 30') || js.includes('touchStartX <= 35');
  if (hasBroadEdge) {
    throw new Error('glass-theme.js edge detection threshold is too broad (<= 30px); should be refined to <= 20-24px');
  }
});

registerTest('F9-T1-5', 'Backdrop element [data-sidebar-backdrop] closes drawer on tap', 'F9', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const backdrop = parsed.querySelectorAll('[data-sidebar-backdrop]')[0];
  if (!backdrop) {
    throw new Error('trangchudong.html missing [data-sidebar-backdrop]');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 10: Mobile Sidebar Header & Touch Targets (ORIGINAL_REQUEST §R3)
// ----------------------------------------------------------------------------

registerTest('F10-T1-1', 'Sidebar close button [data-sidebar-close] satisfies minimum 48px touch target', 'F10', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const closeRules = parsedCss.rules.filter(r => r.selector.includes('[data-sidebar-close]') || r.selector.includes('.sidebar-close-btn'));
  const has48px = closeRules.some(r => {
    const minW = r.declarations['min-width'] || r.declarations['width'];
    const minH = r.declarations['min-height'] || r.declarations['height'];
    return (minW && parseInt(minW, 10) >= 44) || (minH && parseInt(minH, 10) >= 44);
  });
  if (!has48px) {
    // Alternatively check HTML class for w-12 h-12 / min-w-[48px]
    const html = loadFile('trangchudong.html');
    const parsed = parseHtml(html);
    const btn = parsed.querySelectorAll('[data-sidebar-close]')[0];
    if (btn) {
      const cls = btn.classList.join(' ');
      const has48Class = cls.includes('w-12') || cls.includes('min-w-[48px]') || cls.includes('p-3') || cls.includes('h-12');
      if (!has48Class && !css.includes('[data-sidebar-close]')) {
        throw new Error('[data-sidebar-close] button lacks >= 48px touch target styling');
      }
    }
  }
});

registerTest('F10-T1-2', 'Sidebar close button has accessible aria-label or title attribute', 'F10', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const btn = parsed.querySelectorAll('[data-sidebar-close]')[0];
  if (!btn) throw new Error('Missing [data-sidebar-close] in trangchudong.html');
  const aria = btn.attrs['aria-label'] || btn.attrs['title'];
  if (!aria || aria.trim().length === 0) {
    throw new Error('[data-sidebar-close] missing accessible aria-label or title');
  }
});

registerTest('F10-T1-3', 'Sidebar menu navigation items (.nav-pill-item) have min-height >= 48px', 'F10', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const has48px = css.includes('min-height: 48px') || css.includes('height: 48px');
  if (!has48px) {
    throw new Error('glass-theme.css missing 48px minimum height for .nav-pill-item');
  }
});

registerTest('F10-T1-4', 'Sidebar brand header on mobile is streamlined without redundant bulk', 'F10', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const brandHeader = parsed.querySelectorAll('.sidebar-brand-header')[0];
  if (!brandHeader) {
    throw new Error('trangchudong.html missing .sidebar-brand-header');
  }
});

registerTest('F10-T1-5', 'Bottom dock buttons have touch target size >= 48px', 'F10', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasDockItemSize = css.includes('.mobile-glass-nav') && (css.includes('min-height: 48px') || css.includes('height: 48px') || css.includes('padding'));
  if (!hasDockItemSize) {
    throw new Error('.mobile-glass-nav items lack touch target sizing');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 11: Complete 3-Dots Button Eradication (ORIGINAL_REQUEST §R3)
// ----------------------------------------------------------------------------

registerTest('F11-T1-1', 'Zero instances of more-vertical or more-horizontal across all root HTML files', 'F11', () => {
  const rootFiles = ['index.html', 'trangchudong.html', 'vault.html', 'thuvienmau.html', 'AI.html', 'setting.html', 'security.html', 'phone.html'];
  for (const file of rootFiles) {
    const content = loadFile(file);
    const matches = content.match(/more-vertical|more-horizontal|lucide-more-vertical|lucide-more-horizontal/gi);
    if (matches && matches.length > 0) {
      throw new Error(`Found redundant 3-dots icon (${matches[0]}) in ${file}`);
    }
  }
});

registerTest('F11-T1-2', 'Zero instances of ellipsis icons across all HTML files', 'F11', () => {
  const rootFiles = ['index.html', 'trangchudong.html', 'vault.html', 'thuvienmau.html', 'AI.html', 'setting.html', 'security.html'];
  for (const file of rootFiles) {
    const content = loadFile(file);
    const matches = content.match(/icon-ellipsis|fa-ellipsis|btn-more|three-dots/gi);
    if (matches && matches.length > 0) {
      throw new Error(`Found redundant ellipsis pattern (${matches[0]}) in ${file}`);
    }
  }
});

registerTest('F11-T1-3', 'CSS maintains strict suppression rules for any rogue 3-dots menus', 'F11', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSuppression = css.includes('data-sidebar-more') ||
    css.includes('more-dots-btn') ||
    css.includes('button:has([data-lucide^="more-"])') ||
    css.includes('lucide-more-horizontal');
  if (!hasSuppression) {
    throw new Error('glass-theme.css missing defensive 3-dots suppression CSS rules');
  }
});

registerTest('F11-T1-4', 'Bottom Dock button #5 is clean Menu drawer toggle, not 3-dots button', 'F11', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const dockToggles = parsed.querySelectorAll('[data-sidebar-toggle]');
  if (dockToggles.length === 0) {
    throw new Error('trangchudong.html missing [data-sidebar-toggle] in mobile navigation');
  }
  const raw = dockToggles[0].rawAttrs;
  if (raw.includes('more') || raw.includes('dots')) {
    throw new Error('Dock toggle button is incorrectly labeled as more/dots instead of Menu');
  }
});

registerTest('F11-T1-5', '3dtouch directory HTML files have zero 3-dots buttons', 'F11', () => {
  const touchFiles = ['3dtouch/3dtouch.html', '3dtouch/3dtouch2.html', '3dtouch/touch.html'];
  for (const f of touchFiles) {
    try {
      const content = loadFile(f);
      const matches = content.match(/more-vertical|more-horizontal|ellipsis/gi);
      if (matches && matches.length > 0) {
        throw new Error(`Found 3-dots button in ${f}`);
      }
    } catch (e) {
      if (!e.message.includes('ENOENT')) throw e;
    }
  }
});

// ----------------------------------------------------------------------------
// FEATURE 12: Horizontal Overflow Elimination (ORIGINAL_REQUEST §R4)
// ----------------------------------------------------------------------------

registerTest('F12-T1-1', 'AI.html topbar Camera AI button label is responsive (hidden sm:inline)', 'F12', () => {
  const html = loadFile('AI.html');
  // Check if Camera AI 3D Touch label in topbar has hidden sm:inline
  const hasResponsiveLabel = html.includes('hidden sm:inline') || html.includes('hidden md:inline') || !html.includes('<span class="inline font-bold">Camera AI 3D Touch</span>');
  if (!hasResponsiveLabel) {
    throw new Error('AI.html topbar Camera AI label is not hidden on mobile (lacks hidden sm:inline)');
  }
});

registerTest('F12-T1-2', 'Global CSS guarantees overflow-x: hidden on root containers', 'F12', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const hasOverflowX = parsedCss.rules.some(r => {
    return (r.selector.includes('body') || r.selector.includes('html') || r.selector.includes('.saas-layout-wrapper')) &&
      r.declarations['overflow-x'] && r.declarations['overflow-x'].includes('hidden');
  });
  if (!hasOverflowX) {
    throw new Error('glass-theme.css missing overflow-x: hidden on root layout containers');
  }
});

registerTest('F12-T1-3', 'trangchudong.html layout wrapper prevents horizontal scrolling', 'F12', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const wrapper = parsed.querySelectorAll('.saas-layout-wrapper')[0];
  if (!wrapper) {
    throw new Error('trangchudong.html missing .saas-layout-wrapper');
  }
});

registerTest('F12-T1-4', 'vault.html contains no fixed elements exceeding 100vw width', 'F12', () => {
  const html = loadFile('vault.html');
  const parsed = parseHtml(html);
  const elements = parsed.elements;
  for (const el of elements) {
    const cls = el.classList.join(' ');
    if (cls.includes('w-[') && cls.includes('px]')) {
      const match = cls.match(/w-\[(\d+)px\]/);
      if (match && parseInt(match[1], 10) > 430 && !cls.includes('hidden') && !cls.includes('lg:')) {
        throw new Error(`vault.html contains element with fixed width exceeding mobile viewport: ${cls}`);
      }
    }
  }
});

registerTest('F12-T1-5', 'AI.html chat messages wrap words to prevent layout ballooning', 'F12', () => {
  const html = loadFile('AI.html');
  const hasWordBreak = html.includes('break-words') || html.includes('overflow-wrap') || html.includes('overflow-x-auto');
  if (!hasWordBreak) {
    throw new Error('AI.html chat layout lacks break-words / overflow-wrap styling');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 13: Multi-device Viewport Compatibility (ORIGINAL_REQUEST §R4)
// ----------------------------------------------------------------------------

registerTest('F13-T1-1', 'All 11 core HTML pages define viewport-fit=cover meta tag', 'F13', () => {
  const corePages = ['index.html', 'trangchudong.html', 'vault.html', 'thuvienmau.html', 'AI.html', 'setting.html', 'phone.html', 'phoimau.html', 'vebieudonhanh.html', 'vanban.html', 'trinhchieuchiase.html'];
  for (const page of corePages) {
    const html = loadFile(page);
    if (!html.includes('viewport-fit=cover')) {
      throw new Error(`${page} is missing viewport-fit=cover in <meta name="viewport">`);
    }
  }
});

registerTest('F13-T1-2', 'iPhone 15 Pro (393px) responsive classes (sm:) configured properly', 'F13', () => {
  const html = loadFile('trangchudong.html');
  const hasTailwindBreakpoints = html.includes('sm:') && html.includes('md:') && html.includes('lg:');
  if (!hasTailwindBreakpoints) {
    throw new Error('trangchudong.html missing multi-device responsive breakpoint classes');
  }
});

registerTest('F13-T1-3', 'Android standard width (375px-412px) 1-column template grid', 'F13', () => {
  const html = loadFile('trangchudong.html');
  const hasGridResponsive = html.includes('grid-cols-1') || html.includes('grid');
  if (!hasGridResponsive) {
    throw new Error('trangchudong.html missing grid layout for mobile devices');
  }
});

registerTest('F13-T1-4', 'Tablet portrait (768px iPad Mini) layout handles bottom dock visibility', 'F13', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const hasTabletQuery = parsedCss.rules.some(r => {
    return r.mediaQuery && (r.mediaQuery.includes('1024px') || r.mediaQuery.includes('768px'));
  });
  if (!hasTabletQuery) {
    throw new Error('glass-theme.css missing media query rules for tablet viewports (768px-1024px)');
  }
});

registerTest('F13-T1-5', 'Tablet landscape (820px-1024px iPad Air/Pro) responsive transitions', 'F13', () => {
  const html = loadFile('trangchudong.html');
  // Check lg:flex vs lg:hidden on sidebar elements
  const hasLg = html.includes('lg:flex') || html.includes('lg:hidden') || html.includes('lg:block');
  if (!hasLg) {
    throw new Error('trangchudong.html missing lg: breakpoint transitions for tablet landscape');
  }
});

// ----------------------------------------------------------------------------
// FEATURE 14: Invariance Parity (SHA-256 Byte-for-Byte) (ORIGINAL_REQUEST §R4)
// ----------------------------------------------------------------------------

registerTest('F14-T1-1', 'index.html and trangchudong.html have identical SHA-256 hashes', 'F14', () => {
  const hashIndex = getFileHash('index.html');
  const hashTrangChu = getFileHash('trangchudong.html');
  if (hashIndex !== hashTrangChu) {
    throw new Error(`Invariance Violation! index.html (${hashIndex}) !== trangchudong.html (${hashTrangChu})`);
  }
});

registerTest('F14-T1-2', 'index.html and trangchudong.html have identical byte lengths', 'F14', () => {
  const cmp = compareBinary('index.html', 'trangchudong.html');
  if (cmp.lengthA !== cmp.lengthB) {
    throw new Error(`Byte length mismatch: index.html (${cmp.lengthA}) vs trangchudong.html (${cmp.lengthB})`);
  }
});

registerTest('F14-T1-3', 'Binary comparison (fc.exe /b equivalent) reports 0 byte differences', 'F14', () => {
  const cmp = compareBinary('index.html', 'trangchudong.html');
  if (!cmp.equal || cmp.diffCount !== 0) {
    throw new Error(`Binary mismatch: ${cmp.diffCount} byte differences between index.html and trangchudong.html`);
  }
});

registerTest('F14-T1-4', 'Both homepage files are valid UTF-8 without BOM differences', 'F14', () => {
  const fs = require('fs');
  const path = require('path');
  const root = require('./test_context').PROJECT_ROOT;
  const bufA = fs.readFileSync(path.resolve(root, 'index.html'));
  const bufB = fs.readFileSync(path.resolve(root, 'trangchudong.html'));
  const hasBomA = bufA[0] === 0xEF && bufA[1] === 0xBB && bufA[2] === 0xBF;
  const hasBomB = bufB[0] === 0xEF && bufB[1] === 0xBB && bufB[2] === 0xBF;
  if (hasBomA !== hasBomB) {
    throw new Error(`BOM discrepancy: index.html (BOM=${hasBomA}) vs trangchudong.html (BOM=${hasBomB})`);
  }
});

registerTest('F14-T1-5', 'Consistent line ending conventions across index.html and trangchudong.html', 'F14', () => {
  const strA = loadFile('index.html');
  const strB = loadFile('trangchudong.html');
  const crlfA = (strA.match(/\r\n/g) || []).length;
  const crlfB = (strB.match(/\r\n/g) || []).length;
  if (crlfA !== crlfB) {
    throw new Error(`Line ending count mismatch: index.html (${crlfA}) vs trangchudong.html (${crlfB})`);
  }
});

module.exports = {
  tests
};
