const fs = require('fs');

const files = [
  'AI.html',
  'index.html',
  'trangchudong.html',
  'vault.html',
  'thuvienmau.html',
  'setting.html',
  'security.html',
  'phoimau.html',
  'vebieudonhanh.html',
  'trinhchieuchiase.html',
  'vanban.html'
];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log(`\n=================== ${f} ===================`);
  // Topbar
  const topbar = content.match(/<header\b[^>]*>|<nav\b[^>]*class=['"][^'"]*topbar[^'"]*['"]/i);
  console.log('Topbar element:', topbar ? topbar[0].slice(0, 100) : 'none');
  
  // Sidebar
  const sidebar = content.match(/<aside\b[^>]*>|<div\b[^>]*class=['"][^'"]*sidebar[^'"]*['"]/i);
  console.log('Sidebar element:', sidebar ? sidebar[0].slice(0, 100) : 'none');
  
  // Bottom Dock
  const dock = content.match(/<nav\b[^>]*class=['"][^'"]*mobile-glass-nav[^'"]*['"]|<nav\b[^>]*class=['"][^'"]*sv-bottom-dock[^'"]*['"]/i);
  console.log('Mobile Dock element:', dock ? dock[0].slice(0, 100) : 'none');

  // Main container
  const main = content.match(/<main\b[^>]*>/i);
  console.log('Main element:', main ? main[0].slice(0, 100) : 'none');

  // Check 3-dots menus (more-vertical, etc.)
  const dots = content.match(/more-vertical|more-horizontal|lucide-ellipsis/gi);
  console.log('3-dots menu icons:', dots ? dots.length : 0);

  // Check touch targets under 44px
  const smallPaddings = content.match(/\bp-1\b|\bp-0\.5\b|\bh-6\b|\bw-6\b|\bh-7\b|\bw-7\b|\bh-8\b|\bw-8\b/gi);
  console.log('Small elements count (p-1, h-6, etc.):', smallPaddings ? smallPaddings.length : 0);
});
