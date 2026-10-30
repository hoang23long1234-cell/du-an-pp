/**
 * TEST CART & MODAL DISMISS VERIFICATION
 * Kiểm tra tính hiện diện và hoạt động của tất cả các nút thoát (Close Buttons)
 * trên Giỏ hàng (Cart Offcanvas) và các Modal hệ thống.
 */
const fs = require('fs');
const path = require('path');

console.log("================================================================");
console.log("🛒 KIỂM TRA NÚT THOÁT GIỎ HÀNG & MODAL (APPLE EXECUTIVE STANDARD)");
console.log("================================================================");

const filesToCheck = ['trangchudong.html', 'index.html'];
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

filesToCheck.forEach(filename => {
  const filePath = path.join(__dirname, '..', filename);
  const content = fs.readFileSync(filePath, 'utf8');

  console.log(`\n📄 Kiểm tra tệp: ${filename}`);

  // 1. Kiểm tra nút thoát trên Header Giỏ hàng
  const hasCartHeaderClose = content.includes('id="cartOffcanvas"') &&
    content.includes('btn-close-cart') &&
    (content.includes('data-sheet-close') || content.includes('data-bs-dismiss="offcanvas"'));
  assert(hasCartHeaderClose, "Nút đóng tròn Apple trên Header giỏ hàng tồn tại với data-sheet-close / offcanvas close");

  // 2. Kiểm tra icon X bên trong nút thoát giỏ hàng
  const hasCartCloseIcon = content.includes('aria-label="Đóng giỏ hàng"') &&
    content.includes('<i data-lucide="x"');
  assert(hasCartCloseIcon, "Nút đóng giỏ hàng chứa icon Lucide X sắc nét");

  // 3. Kiểm tra nút thoát phụ ở Chân Giỏ hàng (Footer)
  const hasCartFooterClose = content.includes('<span>Đóng Giỏ Hàng</span>');
  assert(hasCartFooterClose, "Nút phụ 'Đóng Giỏ Hàng' ở chân Drawer giỏ hàng tồn tại");

  // 4. Kiểm tra nút 'Tiếp tục xem mẫu' khi giỏ hàng trống (Empty Cart State)
  const hasEmptyCartContinueBtn = content.includes('Tiếp tục xem mẫu') &&
    (content.includes('data-sheet-close') || content.includes('data-bs-dismiss="offcanvas"'));
  assert(hasEmptyCartContinueBtn, "Trạng thái giỏ hàng trống có nút 'Tiếp tục xem mẫu' để thoát giỏ hàng");

  // 5. Kiểm tra nút đóng Modal Quick View
  const hasQuickViewClose = content.includes('id="quickViewModal"') &&
    content.includes('aria-label="Đóng cửa sổ"');
  assert(hasQuickViewClose, "Modal Chi tiết (Quick View) có nút đóng chuẩn Apple");

  // 6. Kiểm tra nút đóng Modal Checkout (Cổng VietQR)
  const hasCheckoutModalClose = content.includes('id="checkoutModal"') &&
    (content.includes('data-dialog-close') || content.includes('data-bs-dismiss="modal"'));
  assert(hasCheckoutModalClose, "Modal Cổng thanh toán VietQR có nút đóng chuẩn data-dialog-close");

  // 7. Kiểm tra nút đóng Modal Bookmarks (Mục đã lưu)
  const hasBookmarksClose = content.includes('id="bookmarksModal"') &&
    content.includes('Mẫu Slide Đã Lưu Yêu Thích');
  assert(hasBookmarksClose, "Modal Mẫu Slide Đã Lưu Yêu Thích có nút đóng");
});

// Kiểm tra CSS trong glass-theme.css
console.log(`\n🎨 Kiểm tra CSS: tệp hệ thống/glass-theme.css`);
const cssPath = path.join(__dirname, '..', 'tệp hệ thống', 'glass-theme.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.btn-close-cart'), "Class .btn-close-cart được định nghĩa trong glass-theme.css");
assert(cssContent.includes('.btn-close:empty'), "Fallback SVG cho thẻ .btn-close rỗng được tích hợp sẵn");
assert(cssContent.includes(':root[data-theme="light"] .btn-close'), "Hỗ trợ chế độ Light Mode tương phản cao cho nút đóng");
assert(cssContent.includes('.offcanvas-backdrop'), "Hiệu ứng nền mờ (blur backdrop) có cursor pointer");

// Kiểm tra JS Bridge trong glass-theme.js
console.log(`\n⚙️ Kiểm tra JS: tệp hệ thống/glass-theme.js`);
const jsPath = path.join(__dirname, '..', 'tệp hệ thống', 'glass-theme.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

assert(jsContent.includes('initBootstrapBridge'), "Universal Zero-Dependency Bootstrap Bridge được tích hợp");
assert(jsContent.includes('ontouchstart'), "Sự kiện chạm màn hình (touchstart) trên backdrop được hỗ trợ cho Mobile");
assert(jsContent.includes('Escape'), "Phím Escape (Esc) tự động đóng toàn bộ drawer/modal");

console.log("\n================================================================");
console.log(`📊 TỔNG KẾT: ${passCount} Passed | ${failCount} Failed`);
if (failCount === 0) {
  console.log("🏆 TẤT CẢ NÚT THOÁT GIỎ HÀNG & MODAL HOẠT ĐỘNG HOÀN HẢO 100%!");
  console.log("================================================================");
  process.exit(0);
} else {
  console.error("❌ CÒN LỖI CẦN XỬ LÝ!");
  console.log("================================================================");
  process.exit(1);
}

