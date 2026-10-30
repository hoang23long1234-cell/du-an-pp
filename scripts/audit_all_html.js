const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.venv' && file !== '__pycache__' && file !== 'fix.html') {
        results = results.concat(getHtmlFiles(fullPath));
      }
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const htmlFiles = getHtmlFiles('.');
console.log(`Found ${htmlFiles.length} HTML files:`);

htmlFiles.forEach(f => {
  const rel = path.relative('.', f);
  const content = fs.readFileSync(f, 'utf8');
  const hasGlassCss = content.includes('glass-theme.css');
  const hasGlassJs = content.includes('glass-theme.js');
  const hasBottomDock = content.includes('mobile-glass-nav');
  const hasViewportFit = content.includes('viewport-fit=cover');
  const has3Dots = content.includes('more-horizontal') || content.includes('more-vertical');
  
  console.log(`- ${rel}: glassCss=${hasGlassCss}, glassJs=${hasGlassJs}, dock=${hasBottomDock}, viewportFit=${hasViewportFit}, 3Dots=${has3Dots}`);
});
