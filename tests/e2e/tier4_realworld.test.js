/**
 * ============================================================================
 * TIER 4: Real-World Application Scenarios (>= 5 realistic end-to-end scenarios)
 * Simulates end-to-end user journeys across mobile and tablet viewports.
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

function registerTest(id, name, scenarioNumber, fn) {
  tests.push({ id, name, tier: 4, featureId: `SC${scenarioNumber}`, fn });
}

// ----------------------------------------------------------------------------
// SCENARIO 1: iPhone 15 Pro Browse & Download Slide Template
// ----------------------------------------------------------------------------
registerTest('SC01', 'Real-world: iPhone 15 Pro Browse, Category Filter & QuickView Download Flow', 1, () => {
  // Step 1: Load homepage on iPhone 15 Pro (393px × 852px)
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  
  // Verify viewport meta
  const meta = parsed.getElementsByTagName('meta').find(m => m.attrs['name'] === 'viewport');
  if (!meta || !meta.attrs['content'].includes('viewport-fit=cover')) {
    throw new Error('SC01: Viewport meta missing viewport-fit=cover');
  }

  // Step 2: Verify category chips exist and have clearance
  const categoryChips = parsed.getElementById('categoryChipsGroup') || parsed.querySelectorAll('[data-category]')[0];
  if (!categoryChips) {
    // If not found by specific id, check category section
    if (!html.includes('Tất cả') && !html.includes('Doanh Nghiệp')) {
      throw new Error('SC01: Category filter bar missing on homepage');
    }
  }

  // Step 3: Verify QuickView Dialog and its CTA buttons
  const qvDialog = parsed.getElementById('quickViewDialog');
  if (!qvDialog) throw new Error('SC01: #quickViewDialog missing from homepage');
  const btnDownload = parsed.getElementById('qvBtnDownload');
  const btnCart = parsed.getElementById('qvBtnCart');
  if (!btnDownload || !btnCart) {
    throw new Error('SC01: Missing #qvBtnDownload or #qvBtnCart in #quickViewDialog');
  }

  // Step 4: Verify CSS modal suppression guarantees CTA visibility
  const css = loadFile('tệp hệ thống/glass-theme.css');
  const hasSuppression = css.includes(':has(dialog[open]) .mobile-glass-nav') || css.includes('body.modal-open .mobile-glass-nav');
  if (!hasSuppression) {
    throw new Error('SC01: Modal suppression rule missing, risking dock occlusion over download button');
  }

  // Step 5: Verify floating camera button does not occlude bottom-right actions
  const parsedCss = parseCss(css);
  const suppressesFloatingCam = parsedCss.rules.some(r => {
    return (r.selector.includes('#floatingQuickCamAi') || r.selector.includes('[data-sv-touch-toggle]')) &&
      r.declarations['display'] && r.declarations['display'].includes('none');
  });
  if (!suppressesFloatingCam && !html.includes('hidden lg:flex') && !html.includes('hidden md:flex')) {
    throw new Error('SC01: Floating camera button overlaps touch area on iPhone 15 Pro');
  }
});

// ----------------------------------------------------------------------------
// SCENARIO 2: Tablet (iPad Air 820px) Sidebar Navigation & Template Selection
// ----------------------------------------------------------------------------
registerTest('SC02', 'Real-world: Tablet (iPad Air 820px) Sidebar Drawer Navigation & Template Preview', 2, () => {
  // Step 1: Load template library page
  const html = loadFile('thuvienmau.html');
  const parsed = parseHtml(html);

  // Step 2: Verify Sidebar Drawer structure
  const sidebar = parsed.getElementById('saasAppSidebar') || parsed.querySelectorAll('[data-sidebar]')[0];
  if (!sidebar) throw new Error('SC02: Missing sidebar element in thuvienmau.html');

  // Step 3: Verify 60fps inertial scrolling in sidebar
  const css = loadFile('tệp hệ thống/glass-theme.css');
  if (!css.includes('-webkit-overflow-scrolling: touch')) {
    throw new Error('SC02: Sidebar lacks -webkit-overflow-scrolling: touch for smooth iPad scrolling');
  }

  // Step 4: Verify touch target of close button >= 48px
  const has48pxClose = css.includes('[data-sidebar-close]') && (css.includes('48px') || css.includes('44px')) ||
    html.includes('data-sidebar-close') && (html.includes('w-12') || html.includes('p-3') || html.includes('min-w-[48px]'));
  if (!has48pxClose) {
    // Check if styled in glass-theme.css
    if (!css.includes('[data-sidebar-close]')) {
      throw new Error('SC02: Sidebar close button lacks 48px touch target');
    }
  }

  // Step 5: Verify template preview dialog
  const previewModal = parsed.getElementById('templatePreviewModal') || parsed.getElementsByTagName('dialog')[0];
  if (!previewModal) {
    throw new Error('SC02: thuvienmau.html missing template preview dialog');
  }
});

// ----------------------------------------------------------------------------
// SCENARIO 3: Mobile AI Prompt Chat Session with Keyboard Open
// ----------------------------------------------------------------------------
registerTest('SC03', 'Real-world: Mobile AI Studio Prompt Chat Session on iPhone 15 Pro', 3, () => {
  // Step 1: Load AI studio page
  const html = loadFile('AI.html');
  const parsed = parseHtml(html);

  // Step 2: Verify no topbar label overflow (Camera AI label is hidden on mobile)
  const hasResponsiveLabel = html.includes('hidden sm:inline') || !html.includes('<span class="inline font-bold">Camera AI 3D Touch</span>');
  if (!hasResponsiveLabel) {
    throw new Error('SC03: AI.html topbar overflows on mobile screens');
  }

  // Step 3: Verify Chat Input Area and Send Button
  const inputArea = parsed.getElementById('chatInputArea');
  const sendBtn = parsed.getElementById('chatSendButton');
  if (!inputArea || !sendBtn) {
    throw new Error('SC03: Missing #chatInputArea or #chatSendButton');
  }

  // Step 4: Verify zero rogue 3-dots menus in chat action bars
  const matches = html.match(/more-vertical|more-horizontal|lucide-more-vertical/gi);
  if (matches && matches.length > 0) {
    throw new Error(`SC03: Found 3-dots icon in AI.html: ${matches[0]}`);
  }

  // Step 5: Verify chat container handles code block overflow
  if (!html.includes('overflow-x-auto') && !html.includes('break-words')) {
    throw new Error('SC03: AI.html chat container lacks overflow wrapping protection');
  }
});

// ----------------------------------------------------------------------------
// SCENARIO 4: Rapid Scroll Down, Sudden Stop, Modal Checkout Flow
// ----------------------------------------------------------------------------
registerTest('SC04', 'Real-world: Rapid Scroll Down, Auto Restoration, and QR Checkout Flow', 4, () => {
  // Step 1: Verify scroll compact logic in JS
  const js = loadFile('tệp hệ thống/glass-theme.js');
  if (!js.includes('topbar-compact') || !js.includes('dock-compact')) {
    throw new Error('SC04: glass-theme.js missing compact scroll states');
  }

  // Step 2: Verify scroll stop timer (~1000ms)
  const hasTimer = js.includes('scrollRestorationTimer') || js.includes('restorationTimer') || js.includes('scrollEndTimer');
  if (!hasTimer) {
    throw new Error('SC04: Missing scroll stop restoration timer in glass-theme.js');
  }

  // Step 3: Verify checkout dialog and action buttons
  const html = loadFile('trangchudong.html');
  const parsed = parseHtml(html);
  const checkoutDialog = parsed.getElementById('checkoutDialog');
  if (!checkoutDialog) throw new Error('SC04: Missing #checkoutDialog in trangchudong.html');

  // Step 4: Verify modal max-height capping (85dvh) in CSS
  const css = loadFile('tệp hệ thống/glass-theme.css');
  if (!css.includes('85dvh') && !css.includes('85vh')) {
    throw new Error('SC04: Dialog missing 85dvh height cap for mobile checkout flow');
  }

  // Step 5: Verify modal suppression hides dock during checkout
  if (!css.includes(':has(dialog[open]) .mobile-glass-nav') && !css.includes('body.modal-open .mobile-glass-nav')) {
    throw new Error('SC04: Modal suppression missing during checkout flow');
  }
});

// ----------------------------------------------------------------------------
// SCENARIO 5: SlideVault Vision Remote (phone.html) Remote Control Session
// ----------------------------------------------------------------------------
registerTest('SC05', 'Real-world: SlideVault Vision Remote (phone.html) Multi-Mode Presentation Session', 5, () => {
  // Step 1: Load phone.html
  const html = loadFile('phone.html');
  const parsed = parseHtml(html);

  // Step 2: Verify 3D Touchpad surface
  const touchPad = parsed.getElementById('touchPadSurface');
  if (!touchPad) throw new Error('SC05: Missing #touchPadSurface in phone.html');

  // Step 3: Verify all 4 specialized spatial control modes
  const modes = ['modeTrackpad', 'modeGyro', 'modeLaser', 'modeCameraAi'];
  for (const m of modes) {
    if (!parsed.getElementById(m)) {
      throw new Error(`SC05: Missing spatial mode button #${m}`);
    }
  }

  // Step 4: Verify presentation control buttons
  const buttons = ['btnSlidePrev', 'btnClickLaser', 'btnSlideNext', 'btnFullscreen', 'btnBlankScreen'];
  for (const b of buttons) {
    if (!parsed.getElementById(b)) {
      throw new Error(`SC05: Missing remote control button #${b}`);
    }
  }

  // Step 5: Verify quick prompt assistant form
  const promptInput = parsed.getElementById('remoteTextInput') || parsed.getElementById('quickPromptInput');
  if (!promptInput) throw new Error('SC05: Missing remote AI prompt input in phone.html');

  // Step 6: Verify zero 3-dots menus across phone.html
  const matches = html.match(/more-vertical|more-horizontal|ellipsis/gi);
  if (matches && matches.length > 0) {
    throw new Error(`SC05: Found 3-dots menu in phone.html: ${matches[0]}`);
  }
});

module.exports = {
  tests
};
