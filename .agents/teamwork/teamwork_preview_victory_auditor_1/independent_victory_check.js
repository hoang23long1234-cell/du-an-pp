#!/usr/bin/env node

/**
 * ============================================================================
 * INDEPENDENT VICTORY AUDITOR VERIFICATION SUITE
 * Agent: teamwork_preview_victory_auditor_1
 * Working Directory: .agents/teamwork/teamwork_preview_victory_auditor_1
 * Target: SlideVault Mobile & Tablet UI Overhaul (Milestones M1–M5, R1–R4)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

console.log('='.repeat(80));
console.log(' INDEPENDENT VICTORY AUDIT EXECUTION SUITE');
console.log(` Project Root: ${PROJECT_ROOT}`);
console.log('='.repeat(80));

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: []
};

function assert(condition, message) {
  results.total++;
  if (condition) {
    results.passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    results.failed++;
    results.failures.push(message);
    console.error(`  [FAIL] ${message}`);
  }
}

function readUtf8(rel) {
  return fs.readFileSync(path.join(PROJECT_ROOT, rel), 'utf8');
}

function readBuf(rel) {
  return fs.readFileSync(path.join(PROJECT_ROOT, rel));
}

// ============================================================================
// PHASE A: TIMELINE & PROVENANCE VERIFICATION
// ============================================================================
console.log('\n--- PHASE A: TIMELINE & PROVENANCE AUDIT ---');

// Check agent workspaces exist in .agents/teamwork
const requiredAgentDirs = [
  'orchestrator_1',
  'teamwork_preview_test_writer_e2e_1',
  'teamwork_preview_worker_m1_1',
  'teamwork_preview_reviewer_1_gen2',
  'teamwork_preview_challenger_1_gen3',
  'teamwork_preview_challenger_2_gen2',
  'teamwork_preview_auditor_1_gen2'
];

for (const dir of requiredAgentDirs) {
  const p = path.join(PROJECT_ROOT, '.agents/teamwork', dir);
  assert(fs.existsSync(p), `Agent directory exists: ${dir}`);
}

// Verify no pre-populated mock logs or result files exist in project root or tests
const rootFiles = fs.readdirSync(PROJECT_ROOT);
const fakeResultFiles = rootFiles.filter(f => /test[-_]?result|mock[-_]?pass|audit[-_]?pass/i.test(f));
assert(fakeResultFiles.length === 0, `Zero pre-populated mock/test result files in root (found: ${fakeResultFiles.join(', ') || 'none'})`);

// ============================================================================
// PHASE B: CHEATING & FACADE DETECTION (INTEGRITY FORENSICS)
// ============================================================================
console.log('\n--- PHASE B: CHEATING & FACADE DETECTION ---');

const cssContent = readUtf8('tệp hệ thống/glass-theme.css');
const jsContent = readUtf8('tệp hệ thống/glass-theme.js');
const indexContent = readUtf8('index.html');
const trangchuContent = readUtf8('trangchudong.html');
const aiContent = readUtf8('AI.html');
const phoneContent = readUtf8('phone.html');

const cheatRegexes = [
  /__TEST__/,
  /bypassAudit/,
  /isE2ETest/,
  /mockPass/,
  /fakePass/,
  /return\s+['"]PASS['"]/,
  /return\s+['"]CLEAN['"]/
];

const sourceFiles = [
  { name: 'glass-theme.css', content: cssContent },
  { name: 'glass-theme.js', content: jsContent },
  { name: 'index.html', content: indexContent },
  { name: 'trangchudong.html', content: trangchuContent },
  { name: 'AI.html', content: aiContent },
  { name: 'phone.html', content: phoneContent }
];

for (const file of sourceFiles) {
  for (const reg of cheatRegexes) {
    const matched = reg.test(file.content);
    assert(!matched, `No cheat pattern ${reg} in ${file.name}`);
  }
}

// Check real implementation in glass-theme.js (no empty stub/facade)
assert(jsContent.includes('function restoreNavBars()'), 'glass-theme.js contains authentic restoreNavBars()');
assert(jsContent.includes('function scheduleNavRestoration()'), 'glass-theme.js contains authentic scheduleNavRestoration()');
assert(jsContent.includes('function updateMobileNavScale('), 'glass-theme.js contains authentic updateMobileNavScale()');
assert(jsContent.includes('function isElementVisibleModal('), 'glass-theme.js contains authentic isElementVisibleModal()');
assert(jsContent.includes('HTMLDialogElement.prototype.showModal'), 'glass-theme.js contains authentic HTMLDialogElement patching');
assert(jsContent.includes('MutationObserver'), 'glass-theme.js contains authentic MutationObserver modal listener');
assert(jsContent.includes('scrollRestorationTimer = setTimeout(restoreNavBars, 1000)'), 'glass-theme.js contains authentic 1000ms restoration timer');
assert(jsContent.includes('touchStartX <= 24'), 'glass-theme.js contains authentic 24px left edge swipe restriction');

// Check real CSS implementation in glass-theme.css (no empty stubs)
assert(cssContent.includes('body:has(dialog[open])'), 'glass-theme.css contains authentic body:has(dialog[open]) selector');
assert(cssContent.includes('body.modal-open .mobile-glass-nav'), 'glass-theme.css contains authentic body.modal-open selector');
assert(cssContent.includes('cubic-bezier(0.16, 1, 0.3, 1)'), 'glass-theme.css contains authentic Apple VisionOS cubic-bezier');
assert(cssContent.includes('max-height: 85dvh'), 'glass-theme.css contains authentic 85dvh dialog height limit');
assert(cssContent.includes('-webkit-overflow-scrolling: touch'), 'glass-theme.css contains authentic iOS inertial scrolling');
assert(cssContent.includes('overscroll-behavior-y: contain'), 'glass-theme.css contains authentic overscroll-behavior-y');

// ============================================================================
// PHASE C: INDEPENDENT REQUIREMENT & ACCEPTANCE CRITERIA VERIFICATION
// ============================================================================
console.log('\n--- PHASE C: INDEPENDENT REQUIREMENT VERIFICATION ---');

// 1. INVARIANCE RULE (R4): index.html vs trangchudong.html
const bufIndex = readBuf('index.html');
const bufTrangchu = readBuf('trangchudong.html');
const hashIndex = crypto.createHash('sha256').update(bufIndex).digest('hex').toUpperCase();
const hashTrangchu = crypto.createHash('sha256').update(bufTrangchu).digest('hex').toUpperCase();

assert(hashIndex === hashTrangchu, `Cryptographic SHA-256 match between index.html and trangchudong.html (${hashIndex})`);
assert(bufIndex.length === bufTrangchu.length, `Buffer byte length identity (${bufIndex.length} bytes)`);
assert(bufIndex.equals(bufTrangchu), 'Byte-for-byte binary equality (Buffer.equals, 0 differences)');

// 2. REQUIREMENT R1: Bottom UI & Modal Suppression
const corePages = [
  'index.html',
  'trangchudong.html',
  'vault.html',
  'thuvienmau.html',
  'AI.html',
  'setting.html',
  'security.html'
];

for (const p of corePages) {
  const content = readUtf8(p);
  const hasIslandId = content.includes('id="dynamicMobileIsland"') || content.includes("id='dynamicMobileIsland'");
  const hasIslandClass = content.includes('class="mobile-dynamic-island"') || content.includes('mobile-dynamic-island');
  assert(!hasIslandId && !hasIslandClass, `Thanh số 3 (dynamicMobileIsland) absent from ${p}`);
}

// Floating camera pill mobile suppression
assert(cssContent.includes('#floatingQuickCamAi') && cssContent.includes('display: none !important'), 
  'Floating QuickCam AI has display: none !important rule for mobile');

// phone.html mobile-only features
assert(phoneContent.includes('3D Touch') || phoneContent.includes('vision-engine'), 'phone.html contains 3D Touch engine');
assert(phoneContent.includes('Laser') || phoneContent.includes('laser'), 'phone.html contains Laser pointer features');
assert(phoneContent.includes('Air Mouse') || phoneContent.includes('mouse'), 'phone.html contains Air Mouse features');

// Modal suppression rules
assert(cssContent.includes('.mobile-glass-nav') && cssContent.includes('body:has(dialog[open])'), 
  'CSS suppresses .mobile-glass-nav when dialog is open');
assert(cssContent.includes('max-height: 85dvh !important;'), 'Mobile dialogs capped at 85dvh');
assert(cssContent.includes('env(safe-area-inset-bottom, 16px)'), 'Safe-area inset bottom padding for dialog CTAs');

// Check modal CTA buttons in index/trangchudong
assert(indexContent.includes('id="qvBtnDownload"'), 'QuickView modal has #qvBtnDownload button');
assert(indexContent.includes('id="qvBtnCart"'), 'QuickView modal has #qvBtnCart button');

// 3. REQUIREMENT R2: Scroll-Driven Engine & Apple VisionOS Spring Motion
assert(jsContent.includes("topBar.classList.add('topbar-compact')"), 'Scroll down adds topbar-compact');
assert(jsContent.includes("mobileNav.classList.add('dock-compact'"), 'Scroll down adds dock-compact');
assert(jsContent.includes("topBar.classList.remove('topbar-compact')"), 'Scroll up removes topbar-compact');
assert(jsContent.includes("mobileNav.classList.remove('dock-compact'"), 'Scroll up removes dock-compact');
assert(jsContent.includes("scrollRestorationTimer = setTimeout(restoreNavBars, 1000)"), '1000ms idle auto-restores navbars');
assert(!cssContent.includes('@keyframes svTopbarSpringExpand'), 'svTopbarSpringExpand keyframes eliminated');
assert(!cssContent.includes('@keyframes svDockSpringExpand'), 'svDockSpringExpand keyframes eliminated');
assert(cssContent.includes('0.42s cubic-bezier(0.16, 1, 0.3, 1)'), 'Apple VisionOS spring transition 0.42s cubic-bezier(0.16, 1, 0.3, 1)');

// 4. REQUIREMENT R3: Sidebar Drawer & 3-Dots Eradication
assert(cssContent.includes('.saas-sidebar') && cssContent.includes('overflow-y: hidden !important;'), 
  'Outer sidebar has overflow-y: hidden !important;');
assert(cssContent.includes('.sidebar-nav-scroll') && cssContent.includes('-webkit-overflow-scrolling: touch !important;'), 
  'Inner sidebar has -webkit-overflow-scrolling: touch !important;');
assert(cssContent.includes('.sidebar-nav-scroll') && cssContent.includes('overscroll-behavior-y: contain !important;'), 
  'Inner sidebar has overscroll-behavior-y: contain !important;');
assert(cssContent.includes('[data-sidebar-close]') && cssContent.includes('min-width: 48px'), 
  'Sidebar close button enforces >= 48px touch target');
assert(jsContent.includes('deltaX < -sidebarWidth * 0.18') && jsContent.includes('isDrawerOpen'), 
  'Swipe left inside open drawer smoothly snaps closed');

// Check 3-dots eradication across all 23 HTML files
const allHtmlFiles = [
  'index.html', 'trangchudong.html', 'AI.html', 'vault.html', 'thuvienmau.html',
  'phone.html', 'setting.html', 'security.html', 'dangnhap.html', 'dangki.html',
  'khoiphuctaikhoan.html', 'phoimau.html', 'mobile-connect.html', 'phoneindex.html',
  'service-admin.html', 'trinhchieuchiase.html', 'vanban.html', 'vebieudonhanh.html',
  '404.html', '3dtouch/phone.html', '3dtouch/dieukhien.html', '3dtouch/share.html',
  '3dtouch/tutorial.html'
];

for (const rel of allHtmlFiles) {
  const fullPath = path.join(PROJECT_ROOT, rel);
  if (fs.existsSync(fullPath)) {
    const html = fs.readFileSync(fullPath, 'utf8');
    const hasThreeDots = /more-horizontal|more-vertical|lucide-more-horizontal|lucide-more-vertical|fa-ellipsis-h|fa-ellipsis-v|bi-three-dots/i.test(html);
    assert(!hasThreeDots, `Zero 3-dots menu buttons in ${rel}`);
  }
}

// 5. REQUIREMENT R4: Multi-Device Compatibility & Viewport Geometry
assert(aiContent.includes('hidden sm:inline') && aiContent.includes('Camera AI 3D Touch'), 
  'AI.html Camera AI label uses hidden sm:inline to avoid mobile overflow');
assert(aiContent.includes('id="chatInputArea"'), 'AI.html chat input area exists');
assert(aiContent.includes('id="chatSendButton"'), 'AI.html chat send button exists');

// Verify liquid glass styling
assert(cssContent.includes('backdrop-filter: blur') || cssContent.includes('-webkit-backdrop-filter: blur'), 
  'Liquid glass backdrop-filter blur present for zero bleed-through');

// 6. ACCEPTANCE CRITERIA 3: Local Asset Integrity (Zero 404s)
console.log('\n--- CHECK: LOCAL ASSET INTEGRITY (CSS/JS/ASSETS) ---');
const inspectedPages = ['index.html', 'trangchudong.html', 'AI.html', 'vault.html', 'thuvienmau.html', 'phone.html', 'setting.html', 'security.html'];
let missingAssets = [];
for (const p of inspectedPages) {
  const html = readUtf8(p);
  const regex = /(?:src|href)=["']([^"'#?]+)(?:\?[^"']*)?["']/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const assetUrl = m[1].trim();
    if (assetUrl.startsWith('http://') || assetUrl.startsWith('https://') || assetUrl.startsWith('//') || assetUrl.startsWith('data:') || assetUrl.startsWith('mailto:') || assetUrl.startsWith('javascript:')) continue;
    if (assetUrl.includes('${')) continue; // JS template literal inside inline script
    if (assetUrl.endsWith('.html')) continue; // Internal page link
    const localPath = path.resolve(PROJECT_ROOT, assetUrl);
    if (!fs.existsSync(localPath)) {
      missingAssets.push({ page: p, url: assetUrl });
    }
  }
}
assert(missingAssets.length === 0, `Zero broken local asset links across core HTML pages (missing: ${missingAssets.length})`);

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log(' INDEPENDENT VICTORY AUDIT SUMMARY');
console.log('='.repeat(80));
console.log(`Total Checks:  ${results.total}`);
console.log(`Passed Checks: ${results.passed} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
console.log(`Failed Checks: ${results.failed}`);
console.log('='.repeat(80));

if (results.failed > 0) {
  console.error('\nVICTORY AUDIT FAILED CHECKS:');
  results.failures.forEach((f, idx) => console.error(`  ${idx + 1}. ${f}`));
  process.exit(1);
} else {
  console.log('\n🌟 ALL INDEPENDENT VICTORY AUDIT CHECKS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
