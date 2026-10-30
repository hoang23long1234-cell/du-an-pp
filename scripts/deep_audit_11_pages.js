const fs = require('fs');
const path = require('path');

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

console.log('Deep auditing all 11 HTML files for layout, mobile/tablet/desktop navigation, scripts, and error resilience...\n');

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`==================== ${file} (${(content.length / 1024).toFixed(1)} KB) ====================`);
  
  // 1. Navigation elements
  const hasDesktopNav = content.includes('glass-topbar') || content.includes('<nav') || content.includes('sv-topbar') || content.includes('header');
  const hasMobileDock = content.includes('mobile-dock') || content.includes('mobile-glass-nav') || content.includes('mobile-nav') || content.includes('sv-bottom-dock');
  const hasDynamicIsland = content.includes('dynamicMobileIsland') || content.includes('mobile-dynamic-island');
  
  console.log(`Navigation: DesktopHeader=${hasDesktopNav}, MobileDock=${hasMobileDock}, DynamicIsland=${hasDynamicIsland}`);
  
  // 2. Responsive containers and layout classes
  const smMatches = (content.match(/\bsm:/g) || []).length;
  const mdMatches = (content.match(/\bmd:/g) || []).length;
  const lgMatches = (content.match(/\blg:/g) || []).length;
  const xlMatches = (content.match(/\bxl:/g) || []).length;
  const colMatches = (content.match(/grid-cols-|col-span-/g) || []).length;
  console.log(`Responsive breakpoints: sm:${smMatches}, md:${mdMatches}, lg:${lgMatches}, xl:${xlMatches}, grid/col:${colMatches}`);

  // 3. Script tags and potential console/fetch issues
  const scripts = [...content.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  let externalScripts = [];
  let inlineScriptsCount = 0;
  let fetchCount = 0;
  let hasCatchBlock = 0;

  scripts.forEach(s => {
    const srcMatch = s[1].match(/src=['"]([^'"]+)['"]/i);
    if (srcMatch) {
      externalScripts.push(srcMatch[1]);
    } else {
      inlineScriptsCount++;
      const body = s[2];
      const fetches = (body.match(/fetch\s*\(/g) || []).length;
      fetchCount += fetches;
      const catches = (body.match(/\.catch\(|try\s*\{/g) || []).length;
      hasCatchBlock += catches;
    }
  });
  console.log(`Scripts: ${externalScripts.length} external, ${inlineScriptsCount} inline blocks`);
  console.log(`Fetches: ${fetchCount}, Error handlers (try/catch): ${hasCatchBlock}`);

  // 4. Check for CSS stylesheets loaded
  const stylesheets = [...content.matchAll(/<link[^>]*rel=['"]stylesheet['"][^>]*href=['"]([^'"]+)['"][^>]*>/gi)].map(m => m[1]);
  console.log(`Stylesheets: ${stylesheets.join(', ')}`);

  // 5. Overflow and container check
  const hasOverflowHidden = content.includes('overflow-x-hidden') || content.includes('overflow-x: hidden') || content.includes('overflow-x: clip');
  console.log(`Overflow protection: ${hasOverflowHidden ? 'YES' : 'NO'}`);

  // 6. Meta viewport
  const viewportMatch = content.match(/<meta[^>]*viewport[^>]*content=['"]([^'"]+)['"]/i);
  console.log(`Viewport: ${viewportMatch ? viewportMatch[1] : 'MISSING'}\n`);
});
