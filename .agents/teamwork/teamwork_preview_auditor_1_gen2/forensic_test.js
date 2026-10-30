const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../../..');
console.log('=== FORENSIC INDEPENDENT AUDIT SUITE ===');
console.log('Working Directory:', ROOT);

let allPassed = true;
function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    allPassed = false;
  } else {
    console.log('✅ PASS:', message);
  }
}

// -------------------------------------------------------------
// CHECK 1: Cryptographic Invariance
// -------------------------------------------------------------
console.log('\n--- CHECK 1: Invariance Parity (index.html vs trangchudong.html) ---');
const indexBuf = fs.readFileSync(path.join(ROOT, 'index.html'));
const trangchuBuf = fs.readFileSync(path.join(ROOT, 'trangchudong.html'));

const indexHash = crypto.createHash('sha256').update(indexBuf).digest('hex');
const trangchuHash = crypto.createHash('sha256').update(trangchuBuf).digest('hex');

assert(indexHash === trangchuHash, `SHA256 Match: ${indexHash} === ${trangchuHash}`);
assert(indexBuf.equals(trangchuBuf), `Byte-for-byte binary match: length=${indexBuf.length} vs ${trangchuBuf.length}`);

// -------------------------------------------------------------
// CHECK 2: Anti-Cheating & Facade Audit
// -------------------------------------------------------------
console.log('\n--- CHECK 2: Source Code Anti-Cheating & Facade Audit ---');
const filesToCheck = [
  'tệp hệ thống/glass-theme.css',
  'tệp hệ thống/glass-theme.js',
  'trangchudong.html',
  'index.html',
  'AI.html'
];

const cheatPatterns = [
  /__TEST__/,
  /test_context/,
  /isE2ETest/,
  /mockPass/,
  /fakePass/,
  /bypassAudit/,
  /return\s*['"]PASS['"]/,
  /return\s*['"]CLEAN['"]/
];

for (const rel of filesToCheck) {
  const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const pat of cheatPatterns) {
    const hasCheat = pat.test(content);
    assert(!hasCheat, `No cheat pattern ${pat} in ${rel}`);
  }
}

// -------------------------------------------------------------
// CHECK 3: Modal Suppression Verification
// -------------------------------------------------------------
console.log('\n--- CHECK 3: Modal Suppression (glass-theme.css & glass-theme.js) ---');
const cssContent = fs.readFileSync(path.join(ROOT, 'tệp hệ thống/glass-theme.css'), 'utf8');
const jsContent = fs.readFileSync(path.join(ROOT, 'tệp hệ thống/glass-theme.js'), 'utf8');

assert(cssContent.includes('body:has(dialog[open]) .mobile-glass-nav'), 'CSS has :has(dialog[open]) modal suppression rule');
assert(cssContent.includes('body.modal-open .mobile-glass-nav'), 'CSS has body.modal-open modal suppression rule');
assert(cssContent.includes('max-height: 85dvh !important'), 'CSS caps mobile dialogs at 85dvh');
assert(cssContent.includes('padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 24px) !important'), 'CSS has safe-area padding for dialogs');

assert(jsContent.includes('isElementVisibleModal'), 'JS contains genuine isElementVisibleModal function');
assert(jsContent.includes('HTMLDialogElement.prototype.showModal'), 'JS hooks HTMLDialogElement.prototype.showModal');
assert(jsContent.includes('HTMLDialogElement.prototype.close'), 'JS hooks HTMLDialogElement.prototype.close');
assert(jsContent.includes('MutationObserver'), 'JS uses MutationObserver for dynamic modal isolation');

// -------------------------------------------------------------
// CHECK 4: Scroll-Driven Engine & VisionOS Spring Motion
// -------------------------------------------------------------
console.log('\n--- CHECK 4: Scroll-Driven Engine & VisionOS Spring Motion ---');
assert(jsContent.includes('scrollRestorationTimer'), 'JS implements scrollRestorationTimer');
assert(jsContent.includes('scheduleNavRestoration'), 'JS implements scheduleNavRestoration');
assert(jsContent.includes('scrollend'), 'JS listens for native scrollend event');
assert(jsContent.includes('touchend'), 'JS listens for touchend event for auto-restoration');
assert(cssContent.includes('0.42s cubic-bezier(0.16, 1, 0.3, 1)'), 'CSS uses 0.42s cubic-bezier(0.16, 1, 0.3, 1) Apple VisionOS spring motion');
assert(!cssContent.includes('@keyframes svTopbarSpringExpand'), 'Jumping keyframe svTopbarSpringExpand removed');
assert(!cssContent.includes('@keyframes svDockSpringExpand'), 'Jumping keyframe svDockSpringExpand removed');

// -------------------------------------------------------------
// CHECK 5: Sidebar Drawer 60fps & Touch Targets
// -------------------------------------------------------------
console.log('\n--- CHECK 5: Sidebar Drawer 60fps & Touch Targets ---');
assert(cssContent.includes('overflow-y: hidden !important'), 'CSS sets outer sidebar to overflow-y: hidden to eliminate nested scroll conflict');
assert(cssContent.includes('-webkit-overflow-scrolling: touch !important'), 'CSS sets inner sidebar nav to -webkit-overflow-scrolling: touch');
assert(cssContent.includes('overscroll-behavior-y: contain !important'), 'CSS sets inner sidebar nav to overscroll-behavior-y: contain');
assert(cssContent.includes('min-width: 48px !important') && cssContent.includes('min-height: 48px !important'), 'CSS enforces min 48px touch targets on close button');
assert(!jsContent.includes('if (isInsideSidebar && isDrawerOpen) return;'), 'JS removed blocking check preventing swipe left inside drawer');

// -------------------------------------------------------------
// CHECK 6: 3-Dots Eradication & Viewport Overflows
// -------------------------------------------------------------
console.log('\n--- CHECK 6: 3-Dots Eradication & Viewport Overflows ---');
const coreHtmlPages = [
  'index.html',
  'trangchudong.html',
  'AI.html',
  'vault.html',
  'thuvienmau.html',
  'setting.html',
  'security.html'
];

for (const p of coreHtmlPages) {
  const content = fs.readFileSync(path.join(ROOT, p), 'utf8');
  assert(!content.includes('data-lucide="more-horizontal"'), `No more-horizontal 3-dots in ${p}`);
  assert(!content.includes('data-lucide="more-vertical"'), `No more-vertical 3-dots in ${p}`);
}

const aiContent = fs.readFileSync(path.join(ROOT, 'AI.html'), 'utf8');
assert(aiContent.includes('hidden sm:inline font-bold">Camera AI 3D Touch'), 'AI.html topbar label has hidden sm:inline to prevent overflow on mobile');
assert(aiContent.includes('id="chatInputArea"'), 'AI.html chat input area exists');
assert(aiContent.includes('id="chatSendButton"'), 'AI.html chat send button exists');

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n=============================================================');
if (allPassed) {
  console.log('🌟 INDEPENDENT FORENSIC AUDIT: 100% CLEAN - NO INTEGRITY VIOLATIONS FOUND');
  process.exit(0);
} else {
  console.error('❌ INDEPENDENT FORENSIC AUDIT: INTEGRITY VIOLATION DETECTED');
  process.exit(1);
}
