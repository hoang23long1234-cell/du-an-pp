const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '../../..');

// 1. Enumerate root HTML files and 3dtouch HTML files
const rootHtmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html') && fs.statSync(path.join(rootDir, f)).isFile());
const touchDir = path.join(rootDir, '3dtouch');
const touchHtmlFiles = fs.existsSync(touchDir) ? fs.readdirSync(touchDir).filter(f => f.endsWith('.html') && fs.statSync(path.join(touchDir, f)).isFile()).map(f => path.join('3dtouch', f)) : [];

const allHtmlFiles = [...rootHtmlFiles, ...touchHtmlFiles];

function getSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const pageDetails = [];
const globalStylesheets = new Map();
const globalScripts = new Map();
const interPageLinks = new Map();

for (const relPath of allHtmlFiles) {
  const fullPath = path.join(rootDir, relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const stat = fs.statSync(fullPath);
  const sha256 = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');

  // Title
  const titleM = content.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleM ? titleM[1].trim() : 'No Title';

  // Stylesheets
  const linkMatches = [...content.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi)];
  const stylesheets = linkMatches.map(m => {
    const href = m[0].match(/href=["']([^"']+)["']/i);
    return href ? href[1] : m[0];
  });
  stylesheets.forEach(s => {
    globalStylesheets.set(s, (globalStylesheets.get(s) || 0) + 1);
  });

  // Scripts
  const scriptMatches = [...content.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  const scripts = scriptMatches.map(m => m[1]);
  scripts.forEach(s => {
    globalScripts.set(s, (globalScripts.get(s) || 0) + 1);
  });

  // Inline styles
  const inlineStyles = [...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
  const inlineStyleSize = inlineStyles.reduce((acc, m) => acc + m[1].length, 0);

  // Inline scripts
  const inlineScripts = [...content.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  const inlineScriptSize = inlineScripts.reduce((acc, m) => acc + m[1].length, 0);

  // Links to other html pages
  const hrefMatches = [...content.matchAll(/href=["']([^"']+\.html(?:#[^"']*)?)["']/gi)];
  const linkedPages = [...new Set(hrefMatches.map(m => m[1]))];
  interPageLinks.set(relPath, linkedPages);

  // Architecture elements
  const hasSaasWrapper = content.includes('saas-layout-wrapper');
  const hasSidebar = content.includes('saas-sidebar') || content.includes('data-sidebar') || content.includes('saasAppSidebar');
  const hasSidebarBackdrop = content.includes('data-sidebar-backdrop');
  const hasTopbar = content.includes('saas-topbar') || content.includes('<header');
  const hasMobileGlassNav = content.includes('mobile-glass-nav');
  const hasDynamicMobileIsland = content.includes('dynamicMobileIsland') || content.includes('mobile-dynamic-island');
  const hasFloatingQuickCamAi = content.includes('floatingQuickCamAi');
  const hasCommandPalette = content.includes('commandPalette') || content.includes('data-command-palette');
  const hasCartModal = content.includes('cartModal') || content.includes('cart-modal') || content.includes('id="cartModal"');
  const hasPreviewModal = content.includes('previewModal') || content.includes('preview-modal') || content.includes('id="previewModal"');
  const hasCheckoutModal = content.includes('checkoutModal') || content.includes('id="checkoutModal"') || content.includes('id="qrModal"');
  const hasThreeDots = content.includes('more-vertical') || content.includes('more-horizontal') || content.includes('lucide-more-vertical') || content.includes('lucide-more-horizontal') || content.includes('data-lucide="more-vertical"') || content.includes('data-lucide="more-horizontal"');
  const hasPromptInput = content.includes('promptInput') || content.includes('userPrompt') || content.includes('chatInputArea') || content.includes('studioChatColumn');
  const hasSafeInset = content.includes('safe-area-inset') || content.includes('viewport-fit=cover');

  pageDetails.push({
    file: relPath.replace(/\\/g, '/'),
    size: stat.size,
    sha256,
    title,
    stylesheets,
    scripts,
    inlineStyleCount: inlineStyles.length,
    inlineStyleBytes: inlineStyleSize,
    inlineScriptCount: inlineScripts.length,
    inlineScriptBytes: inlineScriptSize,
    linkedPages,
    architecture: {
      hasSaasWrapper,
      hasSidebar,
      hasSidebarBackdrop,
      hasTopbar,
      hasMobileGlassNav,
      hasDynamicMobileIsland,
      hasFloatingQuickCamAi,
      hasCommandPalette,
      hasCartModal,
      hasPreviewModal,
      hasCheckoutModal,
      hasThreeDots,
      hasPromptInput,
      hasSafeInset
    }
  });
}

// Check index.html vs trangchudong.html SHA256 and diff
const indexPath = path.join(rootDir, 'index.html');
const trangChuPath = path.join(rootDir, 'trangchudong.html');
const indexBuf = fs.readFileSync(indexPath);
const trangChuBuf = fs.readFileSync(trangChuPath);
const indexSha = crypto.createHash('sha256').update(indexBuf).digest('hex');
const trangChuSha = crypto.createHash('sha256').update(trangChuBuf).digest('hex');
const isBinaryIdentical = indexBuf.equals(trangChuBuf);

const report = {
  summary: {
    totalHtmlFiles: allHtmlFiles.length,
    rootHtmlFilesCount: rootHtmlFiles.length,
    touchHtmlFilesCount: touchHtmlFiles.length,
    indexVsTrangChu: {
      indexSha,
      trangChuSha,
      isBinaryIdentical,
      sizeBytes: indexBuf.length
    }
  },
  globalStylesheets: Object.fromEntries(globalStylesheets),
  globalScripts: Object.fromEntries(globalScripts),
  pages: pageDetails
};

fs.writeFileSync(path.join(__dirname, 'detailed_survey.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('Detailed survey complete! Total pages analyzed:', allHtmlFiles.length);
console.log('index.html SHA:', indexSha);
console.log('trangchudong.html SHA:', trangChuSha);
console.log('Are index.html and trangchudong.html identical?', isBinaryIdentical);
