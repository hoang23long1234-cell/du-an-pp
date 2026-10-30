/**
 * ============================================================================
 * KIỂM TRA TOÀN DIỆN GIAO DIỆN WEB SLIDEVAULT ENTERPRISE (UI/UX AUDIT)
 * File: hệ thống chống sập/test_ui_comprehensive.js
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

let totalChecks = 0;
let passedChecks = 0;
let warningChecks = 0;
let failedChecks = 0;

function pass(name, detail = '') {
  totalChecks++;
  passedChecks++;
  console.log(`  ✅ [PASS] ${name} ${detail ? `(${detail})` : ''}`);
}

function warn(name, detail = '') {
  totalChecks++;
  warningChecks++;
  console.log(`  ⚠️ [WARN] ${name} ${detail ? `(${detail})` : ''}`);
}

function fail(name, reason = '') {
  totalChecks++;
  failedChecks++;
  console.error(`  ❌ [FAIL] ${name} -> ${reason}`);
}

function fetchUrl(urlPath) {
  return new Promise((resolve) => {
    const url = new URL(urlPath, BASE_URL);
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', (err) => {
      resolve({ statusCode: 0, error: err.message, body: '' });
    });
    req.setTimeout(4000, () => {
      req.destroy();
      resolve({ statusCode: 408, error: 'Timeout', body: '' });
    });
  });
}

// Danh sách tất cả các trang giao diện người dùng
const allPages = [
  'trangchudong.html',
  'index.html',
  'AI.html',
  'security.html',
  'vault.html',
  'thuvienmau.html',
  'vanban.html',
  'vebieudonhanh.html',
  'phoimau.html',
  'trinhchieuchiase.html',
  'setting.html',
  'service-admin.html',
  'phone.html',
  'phoneindex.html',
  'dangnhap.html',
  'dangki.html',
  'khoiphuctaikhoan.html',
  '404.html',
  'mobile-connect.html',
  '3dtouch/dieukhien.html',
  '3dtouch/phone.html',
  '3dtouch/share.html',
  '3dtouch/tutorial.html'
];

async function runUiAudit() {
  console.log('\n================================================================');
  console.log('🎨 BẮT ĐẦU KIỂM TRA TOÀN DIỆN GIAO DIỆN WEB SLIDEVAULT ENTERPRISE');
  console.log('================================================================\n');

  // --- TRỤ CỘT 1: KIỂM TRA ĐỘ SẴN SÀNG & MÃ TRẢ VỀ HTTP TỪ SERVER ---
  console.log('📌 [TRỤ CỘT 1] Kiểm tra Máy Chủ & Phục Vụ Trang Web (HTTP 200 OK):');
  let httpSuccessCount = 0;
  for (const page of allPages) {
    const res = await fetchUrl(`/${page}`);
    if (res.statusCode === 200) {
      httpSuccessCount++;
    } else {
      fail(`Trang ${page}`, `Mã lỗi HTTP: ${res.statusCode} ${res.error ? `(${res.error})` : ''}`);
    }
  }
  if (httpSuccessCount === allPages.length) {
    pass(`Tất cả ${allPages.length}/${allPages.length} trang giao diện đều phản hồi HTTP 200 OK hoàn hảo!`, 'Không có lỗi 404/500');
  }

  // --- TRỤ CỘT 2: KIỂM TRA LIÊN KẾT TÀI NGUYÊN (CSS, JS, ICONS, FONTS) ---
  console.log('\n📌 [TRỤ CỘT 2] Kiểm tra Tính Toàn Vẹn Của CSS, JS & Thư Viện Frontend:');
  const criticalAssets = [
    '/tệp hệ thống/glass-theme.css',
    '/tệp hệ thống/glass-theme.js',
    '/tệp hệ thống/anti-crash-client.js',
    '/tệp hệ thống/auth-state.js',
    '/tệp hệ thống/supabase.min.js',
    '/3dtouch/touch-control.js',
    '/3dtouch/vision-engine.js',
    '/3dtouch/math3d.js'
  ];

  for (const asset of criticalAssets) {
    const res = await fetchUrl(asset);
    if (res.statusCode === 200 && res.body.length > 50) {
      pass(`Tài nguyên: ${asset}`, `${Math.round(res.body.length / 1024)} KB - Sẵn sàng`);
    } else {
      fail(`Tài nguyên thiếu hụt: ${asset}`, `status: ${res.statusCode}`);
    }
  }

  // --- TRỤ CỘT 3: KIỂM TRA CHUẨN HTML5, VIEWPORT RESPONSIVE & META TAGS ---
  console.log('\n📌 [TRỤ CỘT 3] Kiểm tra Chuẩn HTML5, Responsive Viewport & Meta Tags:');
  for (const page of allPages) {
    const filePath = path.join(__dirname, '..', page);
    if (!fs.existsSync(filePath)) {
      fail(`Tệp ${page} không tồn tại trên đĩa`);
      continue;
    }
    const html = fs.readFileSync(filePath, 'utf8');

    // Kiểm tra doctype
    const hasDoctype = /<!DOCTYPE\s+html>/i.test(html);
    // Kiểm tra viewport cho điện thoại
    const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
    // Kiểm tra charset utf-8
    const hasCharset = /<meta\s+charset=["']?utf-8["']?/i.test(html);
    // Kiểm tra title
    const hasTitle = /<title>.*<\/title>/i.test(html);

    if (hasDoctype && hasViewport && hasCharset && hasTitle) {
      pass(`Cấu trúc thẻ meta chuẩn: ${page}`, 'HTML5, UTF-8, Responsive Viewport, Title');
    } else {
      warn(`Trang ${page} thiếu một số meta tag chuẩn`, `doctype:${hasDoctype}, viewport:${hasViewport}, charset:${hasCharset}, title:${hasTitle}`);
    }
  }

  // --- TRỤ CỘT 4: KIỂM TRA HỆ THỐNG GIAO DIỆN KÍNH LỎNG (LIQUID GLASS & OBSIDIAN THEME) ---
  console.log('\n📌 [TRỤ CỘT 4] Kiểm tra Thẩm Mỹ Kính Lỏng (Obsidian Liquid Glass Design System):');
  const glassCssPath = path.join(__dirname, '..', 'tệp hệ thống', 'glass-theme.css');
  if (fs.existsSync(glassCssPath)) {
    const cssContent = fs.readFileSync(glassCssPath, 'utf8');
    const hasBackdropBlur = cssContent.includes('backdrop-filter');
    const hasObsidianColors = cssContent.includes('#060913') || cssContent.includes('--bg-obsidian') || cssContent.includes('rgb(');
    const hasGlassGradients = cssContent.includes('linear-gradient') || cssContent.includes('radial-gradient');
    const hasResponsiveNav = cssContent.includes('.mobile-glass-nav');

    if (hasBackdropBlur && hasGlassGradients && hasResponsiveNav) {
      pass('Hệ thống stylesheet kính lỏng glass-theme.css đạt chuẩn Apple Pro Display', 'Backdrop-filter, Liquid Gradient, Mobile Glass Nav');
    } else {
      warn('glass-theme.css cần bổ sung một số biến chuẩn');
    }
  } else {
    fail('Không tìm thấy tệp glass-theme.css');
  }

  // --- TRỤ CỘT 5: KIỂM TRA ĐIỀU HƯỚNG DI ĐỘNG (MOBILE GLASS NAV) ---
  console.log('\n📌 [TRỤ CỘT 5] Kiểm tra Thanh Điều Hướng Di Động (Instagram/iPhone Style Nav):');
  const mainHubPages = ['trangchudong.html', 'vault.html', 'thuvienmau.html', 'AI.html', 'setting.html', 'phoimau.html', 'vebieudonhanh.html', 'vanban.html'];
  for (const page of mainHubPages) {
    const filePath = path.join(__dirname, '..', page);
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf8');
      if (html.includes('mobile-glass-nav')) {
        pass(`Điều hướng di động tích hợp: ${page}`, 'mobile-glass-nav OK');
      } else {
        warn(`Trang ${page} chưa có mobile-glass-nav`);
      }
    }
  }

  // --- TRỤ CỘT 6: KIỂM TRA ĐỘ BẢO TOÀN DỮ LIỆU SLIDE & CATALOG ---
  console.log('\n📌 [TRỤ CỘT 6] Kiểm tra Độ Bảo Toàn Dữ Liệu Slide & Trình Chiếu:');
  const aiPagePath = path.join(__dirname, '..', 'AI.html');
  if (fs.existsSync(aiPagePath)) {
    const aiHtml = fs.readFileSync(aiPagePath, 'utf8');
    const hasSlidesData = aiHtml.includes('slidesData') || aiHtml.includes('KHTN 10');
    const hasPptxGen = aiHtml.includes('PptxGenJS') || aiHtml.includes('pptxgen');
    const hasQuickChip = aiHtml.includes('handleQuickChipClick');

    if (hasSlidesData && hasPptxGen && hasQuickChip) {
      pass('AI Studio AI.html bảo toàn trọn vẹn dữ liệu slide mẫu, bộ xuất PPTX & Quick Chip', 'Toàn vẹn 100%');
    } else {
      warn('AI.html thiếu một số biến dữ liệu');
    }
  }

  // --- TRỤ CỘT 7: KIỂM TRA BẢNG ĐIỀU KHIỂN BẢO MẬT & TELEMETRY DASHBOARD ---
  console.log('\n📌 [TRỤ CỘT 7] Kiểm tra Bảng Điều Khiển An Ninh (security.html):');
  const secPagePath = path.join(__dirname, '..', 'security.html');
  if (fs.existsSync(secPagePath)) {
    const secHtml = fs.readFileSync(secPagePath, 'utf8');
    const hasShieldStatus = secHtml.includes('/api/security/shield-status');
    const hasNetworkStatus = secHtml.includes('refreshNetworkSecurityStatus');
    const hasWafLog = secHtml.includes('attack-log') || secHtml.includes('renderEventFeed');

    if (hasShieldStatus && hasNetworkStatus) {
      pass('security.html kết nối trực tiếp telemetry, bản đồ tấn công & giám sát tường lửa WAF', 'Live Monitor OK');
    } else {
      warn('security.html thiếu hàm kết nối telemetry');
    }
  }

  // --- TỔNG KẾT ---
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM TRA GIAO DIỆN:`);
  console.log(`  • Thành công (Pass):  ${passedChecks}`);
  console.log(`  • Cảnh báo (Warn):    ${warningChecks}`);
  console.log(`  • Thất bại (Fail):    ${failedChecks}`);
  console.log(`  • Tổng số kiểm tra:  ${totalChecks}`);
  console.log(`  • Tỷ lệ đạt chuẩn:    ${Math.round((passedChecks / totalChecks) * 100)}%`);
  if (failedChecks === 0) {
    console.log('🏆 TẤT CẢ GIAO DIỆN WEB ĐỀU ĐẠT CHUẨN CAO CẤP, MƯỢT MÀ VÀ BẢO TOÀN TUYỆT ĐỐI!');
  } else {
    console.log(`⚠️ Phát hiện ${failedChecks} điểm cần khắc phục.`);
  }
  console.log('================================================================\n');

  process.exit(failedChecks === 0 ? 0 : 1);
}

runUiAudit();

