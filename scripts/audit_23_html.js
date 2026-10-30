const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'index.html',
  'trangchudong.html',
  'AI.html',
  'vault.html',
  'thuvienmau.html',
  'phone.html',
  'setting.html',
  'security.html',
  'dangnhap.html',
  'dangki.html',
  'khoiphuctaikhoan.html',
  'phoimau.html',
  'mobile-connect.html',
  'phoneindex.html',
  'service-admin.html',
  'trinhchieuchiase.html',
  'vanban.html',
  'vebieudonhanh.html',
  '404.html',
  '3dtouch/phone.html',
  '3dtouch/dieukhien.html',
  '3dtouch/share.html',
  '3dtouch/tutorial.html'
];

htmlFiles.forEach(rel => {
  if (!fs.existsSync(rel)) {
    console.log(`MISSING: ${rel}`);
    return;
  }
  const c = fs.readFileSync(rel, 'utf8');
  const hasGlassCss = c.includes('glass-theme.css');
  const hasGlassJs = c.includes('glass-theme.js');
  const hasDock = c.includes('mobile-glass-nav');
  const hasViewportFit = c.includes('viewport-fit=cover');
  const hasTouchAction = c.includes('touch-action');
  const hasSmooth = c.includes('scroll-smooth') || c.includes('scroll-behavior');
  
  console.log(`${rel.padEnd(25)} | css:${hasGlassCss ? '✓' : '✗'} js:${hasGlassJs ? '✓' : '✗'} dock:${hasDock ? '✓' : '✗'} vp:${hasViewportFit ? '✓' : '✗'} touch:${hasTouchAction ? '✓' : '✗'}`);
});
