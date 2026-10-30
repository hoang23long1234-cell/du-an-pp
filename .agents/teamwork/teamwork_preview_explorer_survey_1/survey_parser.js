const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../..');
console.log('Project root:', rootDir);

const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html') && fs.statSync(path.join(rootDir, f)).isFile());
// Also check 3dtouch folder
const touchDir = path.join(rootDir, '3dtouch');
let touchFiles = [];
if (fs.existsSync(touchDir)) {
  touchFiles = fs.readdirSync(touchDir).filter(f => f.endsWith('.html') && fs.statSync(path.join(touchDir, f)).isFile()).map(f => path.join('3dtouch', f));
}

const allFiles = [...files, ...touchFiles];

const results = [];

for (const relPath of allFiles) {
  const fullPath = path.join(rootDir, relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const stat = fs.statSync(fullPath);

  // Extract title
  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract linked stylesheets
  const linkMatches = [...content.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*>/gi)];
  const stylesheets = linkMatches.map(m => {
    const href = m[0].match(/href=["']([^"']+)["']/i);
    return href ? href[1] : m[0];
  });

  // Extract script sources
  const scriptMatches = [...content.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  const scripts = scriptMatches.map(m => m[1]);

  // Inline styles and scripts
  const inlineStyles = [...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
  const inlineStylesTotalLen = inlineStyles.reduce((acc, m) => acc + m[1].length, 0);

  const inlineScripts = [...content.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  const inlineScriptsTotalLen = inlineScripts.reduce((acc, m) => acc + m[1].length, 0);

  // Layout features detection
  const hasSaasLayoutWrapper = content.includes('saas-layout-wrapper');
  const hasSaasSidebar = content.includes('saas-sidebar') || content.includes('data-sidebar') || content.includes('saasAppSidebar');
  const hasSidebarBackdrop = content.includes('data-sidebar-backdrop');
  const hasSaasTopbar = content.includes('saas-topbar') || content.includes('data-topbar') || content.includes('saasAppTopbar') || content.includes('<header');
  const hasDynamicMobileIsland = content.includes('dynamicMobileIsland') || content.includes('id="dynamicMobileIsland"') || content.includes('mobile-island') || content.includes('bottom-dock');
  const hasThreeDots = content.includes('more-vertical') || content.includes('more-horizontal') || content.includes('lucide-more-vertical') || content.includes('lucide-more-horizontal') || content.includes('data-lucide="more-vertical"') || content.includes('data-lucide="more-horizontal"');
  
  // Modals
  const hasModal = content.includes('modal') || content.includes('data-modal') || content.includes('dialog') || content.includes('popup');
  const hasCartModal = content.includes('cartModal') || content.includes('cart-modal') || content.includes('giỏ hàng') || content.includes('gio-hang');
  const hasPreviewModal = content.includes('previewModal') || content.includes('preview-modal') || content.includes('xem mẫu') || content.includes('xem-mau');
  const hasCheckoutModal = content.includes('checkoutModal') || content.includes('thanh toán') || content.includes('qrModal');

  // Input elements (e.g. AI prompt)
  const hasPromptInput = content.includes('prompt-input') || content.includes('chat-input') || content.includes('id="promptInput"') || content.includes('id="userPrompt"');

  results.push({
    file: relPath.replace(/\\/g, '/'),
    size: stat.size,
    title,
    stylesheets,
    scripts,
    inlineStyleCount: inlineStyles.length,
    inlineStyleLen: inlineStylesTotalLen,
    inlineScriptCount: inlineScripts.length,
    inlineScriptLen: inlineScriptsTotalLen,
    layout: {
      hasSaasLayoutWrapper,
      hasSaasSidebar,
      hasSidebarBackdrop,
      hasSaasTopbar,
      hasDynamicMobileIsland,
      hasThreeDots,
      hasModal,
      hasCartModal,
      hasPreviewModal,
      hasCheckoutModal,
      hasPromptInput
    }
  });
}

const outputPath = path.join(__dirname, 'survey_results.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
console.log('Results written to', outputPath);
console.log('Analyzed', results.length, 'files');
