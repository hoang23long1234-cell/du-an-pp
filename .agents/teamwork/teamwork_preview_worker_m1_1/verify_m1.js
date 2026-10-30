const fs = require('fs');
const crypto = require('crypto');
const assert = require('assert');

console.log('--- TEST 1: INVARIANCE RULE ---');
const tc = fs.readFileSync('trangchudong.html');
const idx = fs.readFileSync('index.html');
const h1 = crypto.createHash('sha256').update(tc).digest('hex');
const h2 = crypto.createHash('sha256').update(idx).digest('hex');
console.log('trangchudong.html hash:', h1);
console.log('index.html hash:       ', h2);
assert.strictEqual(h1, h2, 'Hashes must match');
assert.strictEqual(tc.length, idx.length, 'Lengths must match');
assert.ok(tc.equals(idx), 'Binary content must be identical');
console.log('PASS: Invariance 100% verified.');

console.log('--- TEST 2: GLASS-THEME.CSS RULES ---');
const css = fs.readFileSync('tệp hệ thống/glass-theme.css', 'utf8');
assert.ok(css.includes('overflow: hidden !important;'), 'Outer sidebar overflow hidden');
assert.ok(css.includes('min-width: 48px !important;'), 'Sidebar close touch target min-width 48px');
assert.ok(!css.includes('@keyframes svTopbarSpringExpand'), 'Jumping keyframes svTopbarSpringExpand removed');
assert.ok(!css.includes('@keyframes svDockSpringExpand'), 'Jumping keyframes svDockSpringExpand removed');
assert.ok(css.includes('transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)'), 'Symmetrical cubic-bezier transition present');
assert.ok(css.includes('max-height: 85dvh !important;'), 'Modal dialog 85dvh cap');
assert.ok(css.includes('#floatingQuickCamAi') && css.includes('@media (max-width: 1023.98px)'), 'Floating quick cam hidden on tablet/mobile');
console.log('PASS: CSS rules verified.');

console.log('--- TEST 3: GLASS-THEME.JS IMPLEMENTATION ---');
const js = fs.readFileSync('tệp hệ thống/glass-theme.js', 'utf8');
assert.ok(js.includes('scrollRestorationTimer'), 'scrollRestorationTimer present');
assert.ok(js.includes('scheduleNavRestoration'), 'scheduleNavRestoration present');
assert.ok(js.includes('isElementVisibleModal'), 'isElementVisibleModal present');
assert.ok(js.includes('settingLogoutModal'), 'settingLogoutModal observed');
assert.ok(!js.includes('if (isInsideSidebar && isDrawerOpen)'), 'blocking inside sidebar swipe removed');
assert.ok(js.includes('scrollend'), 'scrollend event listener present');
console.log('PASS: JS implementation verified.');

console.log('--- TEST 4: AI.HTML RESPONSIVE TOPBAR ---');
const ai = fs.readFileSync('AI.html', 'utf8');
assert.ok(ai.includes('class="hidden sm:inline font-bold">Camera AI 3D Touch</span>'), 'Camera AI 3D Touch has hidden sm:inline');
console.log('PASS: AI.html verified.');

console.log('--- TEST 5: TOUCH TARGETS & 3-DOTS ERADICATION ---');
const tcStr = tc.toString('utf8');
assert.ok(tcStr.includes('min-w-[48px] min-h-[48px]'), 'trangchudong.html has min-w-[48px] min-h-[48px]');
const dots1 = tcStr.match(/(more-vertical|more-horizontal|ellipsis)/g);
assert.strictEqual(dots1, null, 'No 3-dots in trangchudong.html');
const dots2 = ai.match(/(more-vertical|more-horizontal|ellipsis)/g);
assert.strictEqual(dots2, null, 'No 3-dots in AI.html');
console.log('PASS: Touch targets and 3-dots clean.');

console.log('ALL VERIFICATION TESTS PASSED 100% SUCCESSFULLY!');
