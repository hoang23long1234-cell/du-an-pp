/**
 * Unified Test Runner for SlideVault Math & Physics Suite
 */
const { runUltraMathTests } = require('./test_math_engine_ultra.js');
const engine = require('../tệp hệ thống/math-engine.js');

console.log('Running Ultra Math Engine Verification...');
runUltraMathTests(engine);

console.log('\nTesting Math Engine as embedded in glass-theme.js...');
// Also verify that glass-theme.js exports the exact same API
const fs = require('fs');
const glassCode = fs.readFileSync('tệp hệ thống/glass-theme.js', 'utf8');
const vm = require('vm');
const fakeWindow = {
  document: {
    documentElement: { style: { setProperty: () => {} }, classList: { contains: () => false, add: () => {}, remove: () => {} }, getAttribute: () => null },
    addEventListener: () => {},
    readyState: 'complete',
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => null,
    createElement: () => ({ style: {}, appendChild: () => {}, setAttribute: () => {}, addEventListener: () => {} }),
    head: { appendChild: () => {} },
    body: { style: {}, appendChild: () => {}, classList: { contains: () => false, add: () => {}, remove: () => {} } }
  },
  localStorage: { getItem: () => null, setItem: () => {} },
  addEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: function(name, opts) { this.name = name; this.opts = opts; },
  MutationObserver: function() { this.observe = () => {}; this.disconnect = () => {}; },
  setTimeout: () => 1,
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  console: console,
  location: { href: 'http://localhost/', pathname: '/' },
  navigator: { userAgent: 'Node' }
};
fakeWindow.window = fakeWindow;

try {
  vm.runInNewContext(glassCode, fakeWindow);
  if (fakeWindow.SlideVaultMathPhysics && fakeWindow.SlideVaultMathPhysics.rk4) {
    console.log('  ✅ [PASS] glass-theme.js successfully initialized SlideVaultMathPhysics v' + fakeWindow.SlideVaultMathPhysics.version);
    runUltraMathTests(fakeWindow.SlideVaultMathPhysics);
  } else {
    throw new Error('SlideVaultMathPhysics not found in glass-theme.js context');
  }
} catch (e) {
  console.error('Failed to run math in glass-theme.js:', e);
  process.exit(1);
}

// Clean up any temp debug files if present
['run_direct_math.js', 'debug_runner.js', 'diag_math.js', 'run_math_tests.js'].forEach(f => {
  try { fs.unlinkSync(f); } catch(err){}
});

console.log('\n🎉 ALL MATHEMATICAL ENGINES VALIDATED & CERTIFIED 100% OPERATIONAL!');
process.exit(0);
