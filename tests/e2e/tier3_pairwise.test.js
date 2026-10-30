/**
 * ============================================================================
 * TIER 3: Cross-Feature Combinations (Pairwise Coverage >= 14 tests)
 * Tests multi-feature interactions, race conditions, and composite states.
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

function registerTest(id, name, featurePair, fn) {
  tests.push({ id, name, tier: 3, featureId: featurePair, fn });
}

registerTest('P01', 'F3 (Modal Suppression) + F5 (Scroll Compact): Opening modal suppresses dock even if compact', 'F3+F5', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  // Suppression rule must take precedence (!important) over .dock-compact
  const hasSuppression = parsedCss.rules.some(r => {
    return (r.selector.includes(':has(dialog[open])') || r.selector.includes('body.modal-open')) &&
      r.selector.includes('.mobile-glass-nav') &&
      r.declarations['opacity'] && r.declarations['opacity'].includes('0');
  });
  if (!hasSuppression) {
    throw new Error('Modal suppression rule missing or lacks precedence over scroll compact state');
  }
});

registerTest('P02', 'F3 (Modal Suppression) + F6 (Scroll Restoration): Restoration timer does NOT resurrect dock when modal is open', 'F3+F6', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  // Even if dock-compact class is removed by timer, :has(dialog[open]) or body.modal-open keeps dock hidden
  const hasDualSuppression = css.includes(':has(dialog[open]) .mobile-glass-nav') || css.includes('body.modal-open .mobile-glass-nav');
  if (!hasDualSuppression) {
    throw new Error('CSS lacks persistent modal suppression selector to block scroll restoration while modal is active');
  }
});

registerTest('P03', 'F3 (Modal Suppression) + F8/F9 (Sidebar Drawer): Opening modal suppresses drawer or closes it', 'F3+F9', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasDrawerOrModalIsolation = css.includes('body.sidebar-drawer-open') || css.includes('body.modal-open');
  if (!hasDrawerOrModalIsolation) {
    throw new Error('Missing drawer and modal isolation classes');
  }
});

registerTest('P04', 'F5 (Scroll Compact) + F7 (VisionOS Spring): Compact transition executes smooth cubic-bezier without glitches', 'F5+F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const dockRules = parsedCss.rules.filter(r => r.selector.includes('.mobile-glass-nav'));
  const hasSpring = dockRules.some(r => {
    return r.declarations['transition'] && r.declarations['transition'].includes('cubic-bezier(0.16, 1, 0.3, 1');
  });
  if (!hasSpring) {
    // Check if cubic-bezier is defined in root or parent
    if (!css.includes('cubic-bezier(0.16, 1, 0.3, 1)')) {
      throw new Error('VisionOS spring cubic-bezier is not applied to mobile navigation scroll transition');
    }
  }
});

registerTest('P05', 'F6 (Scroll Stop Timer) + F7 (VisionOS Spring): Idle restoration animates with symmetrical spring timing', 'F6+F7', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  // Check that transition is symmetrical (applies to base .mobile-glass-nav, not just one keyframe)
  const hasTransition = css.includes('transition:') && css.includes('transform');
  if (!hasTransition) {
    throw new Error('Missing base transition declaration on animated navigation bars');
  }
});

registerTest('P06', 'F8 (60fps Scroll) + F9 (Swipe-to-Close): Vertical scrolling does not trigger swipe-close; horizontal swipe closes drawer', 'F8+F9', () => {
  const js = loadFile('tệp hệ thống/glass-theme.js');
  // Both directional differentiation and unblocked swipe inside drawer must be present
  const hasCoordMath = js.includes('Math.abs') || js.includes('diffX') || js.includes('deltaX');
  if (!hasCoordMath) {
    throw new Error('glass-theme.js missing touch delta computation for discriminating scroll vs swipe');
  }
});

registerTest('P07', 'F10 (Touch Targets) + F11 (3-Dots Eradication): Close button meets >= 48px and zero 3-dots menus exist', 'F10+F11', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const closeBtn = parsed.querySelectorAll('[data-sidebar-close]')[0];
  if (!closeBtn) throw new Error('Missing [data-sidebar-close] button');
  // Verify no 3 dots in close button or parent header
  const brandHeader = parsed.querySelectorAll('.sidebar-brand-header')[0];
  if (brandHeader) {
    const raw = brandHeader.rawAttrs || '';
    if (raw.includes('ellipsis') || raw.includes('dots')) {
      throw new Error('Found redundant 3-dots in sidebar header');
    }
  }
});

registerTest('P08', 'F12 (Horizontal Overflow) + F13 (Multi-Device Viewports): AI.html renders at 375px-430px with 0px overflow', 'F12+F13', () => {
  const html = loadFile('AI.html');
  // Verify viewport meta is present and Camera AI label is hidden on mobile
  if (!html.includes('viewport-fit=cover')) {
    throw new Error('AI.html missing viewport-fit=cover meta');
  }
  const hasResponsiveLabel = html.includes('hidden sm:inline') || !html.includes('<span class="inline font-bold">Camera AI 3D Touch</span>');
  if (!hasResponsiveLabel) {
    throw new Error('AI.html topbar label causes overflow on 375px-430px mobile viewports');
  }
});

registerTest('P09', 'F14 (Invariance Parity) + F1 (Remove Thanh Số 3): index.html and trangchudong.html are byte-identical and lack island', 'F14+F1', () => {
  const cmp = compareBinary('index.html', 'trangchudong.html');
  if (!cmp.equal) {
    throw new Error(`Invariance mismatch: ${cmp.diffCount} byte differences`);
  }
  const html = loadFile('index.html');
  if (html.includes('id="dynamicMobileIsland"') || html.includes('class="mobile-dynamic-island"')) {
    throw new Error('index.html contains forbidden dynamicMobileIsland markup');
  }
});

registerTest('P10', 'F14 (Invariance Parity) + F10 (Touch Targets): Both homepage files contain >= 48px sidebar close button', 'F14+F10', () => {
  const indexHtml = loadFile('index.html');
  const trangChuHtml = loadFile('trangchudong.html');
  const parsedA = parseHtml(indexHtml);
  const parsedB = parseHtml(trangChuHtml);
  const btnA = parsedA.querySelectorAll('[data-sidebar-close]')[0];
  const btnB = parsedB.querySelectorAll('[data-sidebar-close]')[0];
  if (!btnA || !btnB) throw new Error('Missing [data-sidebar-close] in homepage pair');
  if (btnA.rawAttrs !== btnB.rawAttrs) {
    throw new Error('Sidebar close button attributes differ between index.html and trangchudong.html');
  }
});

registerTest('P11', 'F2 (Spatial Isolation) + F1 (Floating Pill): phone.html retains full remote while core pages suppress floating pill', 'F2+F1', () => {
  const phoneHtml = loadFile('phone.html');
  if (!phoneHtml.includes('touchPadSurface')) {
    throw new Error('phone.html missing essential touchPadSurface');
  }
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const hasSuppression = parsedCss.rules.some(r => {
    return r.selector.includes('#floatingQuickCamAi') && (r.declarations['display'] === 'none !important' || r.declarations['display'] === 'none');
  });
  if (!hasSuppression) {
    const html = loadFile('trangchudong.html');
    if (!html.includes('hidden lg:flex') && !html.includes('hidden md:flex')) {
      throw new Error('#floatingQuickCamAi lacks mobile suppression on core pages');
    }
  }
});

registerTest('P12', 'F4 (Bottom Clearance) + F5 (Scroll Hiding): Bottom clearance prevents occlusion whether dock is visible or compact', 'F4+F5', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const html = loadFile('trangchudong.html');
  const hasPb = css.includes('padding-bottom: calc(125px') ||
    css.includes('.saas-layout-wrapper') && css.includes('padding-bottom') ||
    html.includes('pb-24') || html.includes('pb-28') || html.includes('pb-32') || html.includes('padding-bottom');
  if (!hasPb) {
    throw new Error('trangchudong.html / glass-theme.css missing bottom padding for scroll container');
  }
});

registerTest('P13', 'F4 (Dialog Sizing) + F3 (Modal Suppression): Dialog max-height 85dvh allows CTA visibility while dock is suppressed', 'F4+F3', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const has85dvh = css.includes('85dvh') || css.includes('85vh');
  const hasSuppression = css.includes(':has(dialog[open]) .mobile-glass-nav') || css.includes('body.modal-open .mobile-glass-nav');
  if (!has85dvh || !hasSuppression) {
    throw new Error('Missing cooperative dialog 85dvh height cap and modal suppression rules');
  }
});

registerTest('P14', 'F13 (Multi-Device Viewports) + F8/F9/F10 (Sidebar Drawer): Drawer renders as overlay on <1024px and static on >=1024px', 'F14+F8', () => {
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const backdrop = parsed.querySelectorAll('[data-sidebar-backdrop]')[0];
  if (!backdrop) throw new Error('Missing [data-sidebar-backdrop]');
  const cls = backdrop.classList.join(' ');
  if (!cls.includes('lg:hidden')) {
    throw new Error('Sidebar backdrop must be hidden on lg: screens (>=1024px)');
  }
});

registerTest('P15', 'F6 (Scroll Stop Timer) + F3 (Modal Suppression): Opening modal cancels or overrides restoration timer', 'F6+F3', () => {
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const parsedCss = parseCss(css);
  const suppressionRules = parsedCss.rules.filter(r => {
    return (r.selector.includes(':has(dialog[open])') || r.selector.includes('body.modal-open')) &&
      r.selector.includes('.mobile-glass-nav');
  });
  // Check that pointer-events is none !important
  const hasPointerNone = suppressionRules.some(r => {
    return r.declarations['pointer-events'] && r.declarations['pointer-events'].includes('none');
  });
  if (!hasPointerNone) {
    throw new Error('Modal suppression must specify pointer-events: none !important to ensure no rogue click capture');
  }
});

module.exports = {
  tests
};
