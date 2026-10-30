const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../index.html');
const trangchuPath = path.resolve(__dirname, '../trangchudong.html');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Add mobile-optimization.css into <head> if not present
if (!html.includes('mobile-optimization.css')) {
  html = html.replace(
    '<link rel="stylesheet" href="font/fonts.css">',
    '<link rel="stylesheet" href="3dtouch/mobile-optimization.css?v=mobile-4">\n  <link rel="stylesheet" href="font/fonts.css">'
  );
}

// 2. Add fallback to catalog image
const targetImgTag = '<img src="${p.images[0]}" alt="${p.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">';
const replacementImgTag = `<img src="\${p.images[0]}" alt="\${p.title}" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'450\\' viewBox=\\'0 0 800 450\\'><defs><linearGradient id=\\'bg\\' x1=\\'0%\\' y1=\\'0%\\' x2=\\'100%\\' y2=\\'100%\\'><stop offset=\\'0%\\' stop-color=\\'%23090d16\\'/><stop offset=\\'100%\\' stop-color=\\'%231e293b\\'/></linearGradient></defs><rect width=\\'100%\\' height=\\'100%\\' fill=\\'url(%23bg)\\'/><circle cx=\\'400\\' cy=\\'225\\' r=\\'120\\' fill=\\'%2310b981\\' opacity=\\'0.15\\'/><text x=\\'50%\\' y=\\'48%\\' text-anchor=\\'middle\\' fill=\\'%2334d399\\' font-family=\\'sans-serif\\' font-size=\\'22\\' font-weight=\\'bold\\'>SLIDEVAULT PRO</text><text x=\\'50%\\' y=\\'58%\\' text-anchor=\\'middle\\' fill=\\'%2394a3b8\\' font-family=\\'sans-serif\\' font-size=\\'14\\'>PowerPoint 16:9 Presentation Deck</text></svg>';" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy">`;

if (html.includes(targetImgTag)) {
  html = html.replace(targetImgTag, replacementImgTag);
}

// 3. Add fallback to qvMainImage
const targetQvImg = '<img id="qvMainImage" src="" alt="Preview Mẫu Slide" class="w-full h-full object-cover" loading="lazy" decoding="async">';
const replacementQvImg = `<img id="qvMainImage" src="" alt="Preview Mẫu Slide" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'450\\' viewBox=\\'0 0 800 450\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23090d16\\'/><circle cx=\\'400\\' cy=\\'225\\' r=\\'100\\' fill=\\'%2310b981\\' opacity=\\'0.12\\'/><text x=\\'50%\\' y=\\'48%\\' text-anchor=\\'middle\\' fill=\\'%2334d399\\' font-family=\\'sans-serif\\' font-size=\\'22\\' font-weight=\\'bold\\'>SLIDEVAULT 16:9</text><text x=\\'50%\\' y=\\'58%\\' text-anchor=\\'middle\\' fill=\\'%2394a3b8\\' font-family=\\'sans-serif\\' font-size=\\'14\\'>Preview Mẫu Slide</text></svg>';" class="w-full h-full object-cover" loading="lazy" decoding="async">`;

if (html.includes(targetQvImg)) {
  html = html.replace(targetQvImg, replacementQvImg);
}

// Write identical content to both index.html and trangchudong.html
fs.writeFileSync(indexPath, html, 'utf8');
fs.writeFileSync(trangchuPath, html, 'utf8');
console.log('Successfully updated index.html and trangchudong.html with byte-for-byte binary parity.');
