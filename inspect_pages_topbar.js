const fs = require('fs');

const files = [
  'phoimau.html',
  'vanban.html',
  'vebieudonhanh.html',
  'setting.html',
  'security.html',
  'trinhchieuchiase.html',
  'dangnhap.html',
  'dangki.html',
  'khoiphuctaikhoan.html',
  'phone.html',
  'phoneindex.html',
  'mobile-connect.html',
  'service-admin.html',
  '404.html'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n=================== ${file} ===================`);
  
  // Header / Topbar check
  const topbar = content.match(/<header[^>]*>[\s\S]*?<\/header>/i);
  if (topbar) {
    const hasBackBtn = topbar[0].includes('quay lại') || topbar[0].includes('href="trangchudong.html"') || topbar[0].includes('href="index.html"');
    const hasSidebarToggle = topbar[0].includes('data-sidebar-toggle');
    console.log('Topbar found: hasBackBtn:', hasBackBtn, 'hasSidebarToggle:', hasSidebarToggle);
  } else {
    console.log('NO <header> found!');
  }

  // Check script tags at end of body
  const scripts = content.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
  console.log('Scripts:', scripts.map(s => {
    const m = s.match(/src=["']([^"']+)["']/i);
    return m ? m[1] : s;
  }).join(', '));
}
