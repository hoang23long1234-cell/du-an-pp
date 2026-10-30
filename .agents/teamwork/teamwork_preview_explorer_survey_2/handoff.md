# Báo Cáo Chuyển Giao Khảo Sát Kỹ Thuật (Handoff Report - Phase 0 Survey)
## Thanh Số 3 (dynamicMobileIsland), phone.html và Kiến Trúc Modal Suppression

**Tác nhân thực hiện**: `teamwork_preview_explorer_survey_2` (Explorer Agent)  
**Tác nhân tiếp nhận**: `parent` (`e9dc4121-2484-46ae-b487-922789446901`)  
**Tài liệu phân tích chi tiết**: `c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_explorer_survey_2\analysis.md`  
**Ngày báo cáo**: 2026-10-24  

---

## 1. OBSERVATION (Quan Sát Trực Tiếp Từ Mã Nguồn)

### 1.1. Hiện Trạng "Thanh Số 3" (`dynamicMobileIsland`) & Nút Nổi
1. **Markup HTML trên 11 trang chính**:
   - Thẻ `<aside id="dynamicMobileIsland" class="mobile-dynamic-island">` đã được gỡ bỏ khỏi toàn bộ 11 trang HTML (`trangchudong.html`, `index.html`, `vault.html`, `thuvienmau.html`, `AI.html`, `setting.html`, `security.html`, `auth.html`, `analytics.html`, `admin.html`, `billing.html`) sau đợt chạy script dọn dẹp trước đó (`fix.html/remove_island_and_fix_sidebar.js`).
   - Tuy nhiên, một nút nổi độc lập mang tên **`#floatingQuickCamAi`** vẫn tồn tại nguyên vẹn trong mã nguồn HTML tại:
     - `trangchudong.html` (Dòng 611 - 615):
       ```html
       <button id="floatingQuickCamAi" type="button" data-sv-touch-toggle onclick="toggle3DTouchEngine()" class="fixed bottom-24 md:bottom-8 right-6 md:right-8 z-40 flex items-center gap-2 px-3 py-2 rounded-full glass-panel border border-brand-teal/40 text-xs font-semibold text-brand-teal shadow-xl backdrop-blur-md hover:scale-105 active:scale-95 transition-all group">
         <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
         <span>Camera AI 3D Touch</span>
       </button>
       ```
     - `index.html` (Dòng 611 - 615): Giống hệt từng byte với `trangchudong.html`.
     - `AI.html` (Dòng 3914 - 3918): Đoạn mã tương tự gắn tại góc đáy màn hình.
     - Vị trí `bottom-24` (96px từ đáy) trùng đúng cao độ của thanh số 3 cũ, đè trực tiếp lên nội dung cuộn và góc tương tác trên thiết bị di động.

2. **Mã CSS trong `tệp hệ thống/glass-theme.css`**:
   - Dòng 4879: Tiêu đề khối `/* 2. Dynamic Mobile Island (Thanh số 3 nổi dành riêng điện thoại & tablet) */`.
   - Dòng 5071 - 5100: Khai báo vị trí cố định của thanh số 3:
     ```css
     #dynamicMobileIsland,
     .mobile-dynamic-island {
       position: fixed !important;
       left: 50% !important;
       bottom: calc(76px + env(safe-area-inset-bottom, 12px)) !important;
       transform: translateX(-50%) translateY(0) scale(1) !important;
       width: min(390px, calc(100vw - 24px)) !important;
       z-index: 1025 !important;
       border-radius: 9999px;
       background: rgba(10, 16, 28, 0.94);
       backdrop-filter: blur(40px) saturate(220%);
     }
     ```
   - Dòng 5110 - 5112: Ẩn dải cuộn danh mục (`.island-category-scroller { display: none !important; }`).
   - Dòng 5115 - 5125: Quy tắc ẩn thanh khi mở drawer menu hoặc modal:
     ```css
     body.sidebar-drawer-open .mobile-dynamic-island,
     body:has(dialog[open]) .mobile-dynamic-island {
       opacity: 0 !important;
       pointer-events: none !important;
       transform: translateX(-50%) translateY(24px) scale(0.92) !important;
     }
     ```
   - Dòng 5166 - 5221: Hơn 55 dòng CSS định kiểu chi tiết cho `.island-main-row`, `.island-action-btn`, `.island-ai-btn`, `.island-cat-pill`.
   - Dòng 5373 - 5385: Bộ chọn đàn áp modal gộp chung:
     ```css
     body:has(dialog[open]) .mobile-glass-nav,
     body:has(dialog[open]) .mobile-dynamic-island,
     body:has(dialog[open]) #dynamicMobileIsland,
     body.modal-open .mobile-glass-nav,
     body.modal-open .mobile-dynamic-island,
     body.modal-open #dynamicMobileIsland {
       opacity: 0 !important;
       pointer-events: none !important;
       transform: translate3d(-50%, 28px, 0) scale(0.92) !important;
     }
     ```

3. **Mã JavaScript trong `tệp hệ thống/glass-theme.js`**:
   - Dòng 1317: Trong hàm `updateMobileNavScale`, script vẫn liên tục truy vấn phần tử không tồn tại:
     ```javascript
     const dynamicIsland = document.querySelector('.mobile-dynamic-island, #dynamicMobileIsland');
     ```
   - Dòng 1528 - 1637: Hàm `initDynamicMobileIsland()` được đăng ký tự động chạy trên mọi trang tại `DOMContentLoaded` (Dòng 1664, 1670):
     ```javascript
     function initDynamicMobileIsland() {
       const island = document.getElementById('dynamicMobileIsland') || document.querySelector('.mobile-dynamic-island');
       if (!island) return;
       // Gắn hàng loạt listener sự kiện cho sv-3dtouch-change, islandTouchToggle,
       // islandSlidePrev, islandSlideNext, islandAiTrigger, islandPhoneRemote...
     }
     ```
   - Dòng 1698 - 1753: Hàm `initModalIsolationObserver()` tạo `MutationObserver` lắng nghe `dialog[open]` và gán class `body.modal-open`, nhưng chỉ nhận diện thẻ `<dialog>` hoặc class `.modal:not(.hidden)`, bỏ sót các modal ẩn/hiện bằng `opacity-0 pointer-events-none` (như `#settingLogoutModal`).

---

### 1.2. Đặc Tả `phone.html` & Các Thành Phần Không Gian (Spatial Features)
- File `phone.html` (1411 dòng) là một ứng dụng di động hoàn chỉnh (**SlideVault Vision Remote**).
- Giao diện bao gồm:
  - Header & Profile Capsule (Dòng 329 - 365): Thông tin tài khoản, nút đổi Theme Sáng/Tối, nút về Trang Chủ, nút Đăng Xuất.
  - Presentation HUD & Trình Chiếu (Dòng 367 - 375): Bộ đếm slide, thời lượng thuyết trình.
  - Bàn Di Cảm Ứng 3D Touchpad (`#touchPadSurface`, Dòng 378 - 435): Vùng cảm ứng đa điểm, hỗ trợ Haptic Ripple, lực nhấn 3D Touch, cử chỉ 2 ngón cuộn slide.
  - Tactical Controller Deck (Dòng 437 - 458): 5 nút điều khiển vật lý: `btnSlidePrev`, `btnClickLaser`, `btnSlideNext`, `btnFullscreen`, `btnBlankScreen`.
  - Hàng Chuyển Chế Độ Cảm Biến (`#modeTrackpad`, `#modeGyro`, `#modeLaser`, `#modeCameraAi`, Dòng 461 - 487):
    - **Trackpad**: Di chuột ảo qua WebRTC/DataChannel.
    - **Gyro Air Mouse**: Chuột bay cảm biến con quay hồi chuyển (`DeviceOrientationEvent` alpha/beta/gamma).
    - **Laser Pointer**: Con trỏ laser ảo thời gian thực chiếu lên slide màn hình chính.
    - **Camera AI**: Nhận diện cử chỉ bàn tay (MediaPipe Hands qua camera trước điện thoại).
  - Form Nhập Lệnh AI Nhanh (`#quickPromptForm`, `#quickPromptInput`, Dòng 490 - 502): Gửi câu hỏi/yêu cầu cho AI Studio trên màn hình chính.
  - Spatial Status Dock (Dòng 505 - 520): Đèn báo trạng thái kết nối WebRTC (`#connectionPill`), pin (`#batteryStatusPill`), FPS (`#fpsCounterPill`).
- **Thư mục liên quan**: `3dtouch/touch-control.js` (1906 dòng) tự động inject các phần tử DOM nổi vào trang: `#sv-spatial-hud`, `#sv-touchpad-controller`, `#sv-touchpad-pill`, `#sv-spatial-pip`.

---

### 1.3. Kiểm Kê Các Thành Phần Giao Diện Bị Che Khuất Trên Các Trang Chính
1. **`AI.html`**:
   - Khung nhập liệu `#chatInputArea` (textarea) và nút gửi `#chatSendButton` (amber send button) cố định tại đáy màn hình (Dòng 3862 - 3910).
   - Khi thanh Bottom Dock hiển thị hoặc có thêm nút nổi `#floatingQuickCamAi`, toàn bộ ô gõ văn bản và nút gửi bị che lấp, người dùng di động không thể nhấn vào ô để nhập lệnh chat.
2. **`trangchudong.html` & `index.html`**:
   - Dải danh mục lọc `#categoryChipsGroup` (Dòng 600 - 608) và các thẻ sản phẩm cuối danh mục/phân trang bị đáy thanh Bottom Dock che một phần nếu trang không có đủ khoảng trống đệm (`padding-bottom`).
3. **`vault.html`**:
   - Thanh tiến độ dung lượng lưu trữ đám mây (Storage Quota Bar), các huy hiệu chỉ số (metric badges) và danh sách thẻ dự án phía đáy (Dòng 179 - 195).
4. **`thuvienmau.html`**:
   - Các chip lọc thể loại template và các card slide mẫu ở hàng dưới cùng (Dòng 188 - 212).
5. **`setting.html`**:
   - Nút lưu cấu hình hồ sơ (`#btnSaveName`) và nút kích hoạt đăng xuất ở cuối biểu mẫu (Dòng 340 - 360).
6. **`security.html`**:
   - Vùng dropzone tải file quét mã độc và nút kích hoạt kiểm tra sức khỏe API Vault (Dòng 250 - 310).

---

### 1.4. Kiểm Kê Toàn Bộ Modals & Popups Trên Các Trang

| Trang | Tên / ID Modal | Thẻ DOM & Cơ Chế Hiện | Các Nút Hành Động Quan Trọng Cần Bảo Vệ |
|---|---|---|---|
| `trangchudong.html` & `index.html` | `#quickViewDialog` | `<dialog id="quickViewDialog">` | Nút "Tải Slide Ngay" (`#qvBtnDownload`), Nút "Thêm Vào Giỏ" (`#qvBtnCart`), Đóng (`#qvBtnClose`) |
| `trangchudong.html` & `index.html` | `#checkoutDialog` | `<dialog id="checkoutDialog">` | Nút "Xác Nhận Đã Chuyển Khoản", Nút sao chép STK, Nút đóng dialog |
| `trangchudong.html` & `index.html` | `#commandPaletteModal` | `<dialog id="commandPaletteModal">` | Ô nhập phím tắt tìm kiếm, danh sách kết quả lệnh |
| `AI.html` | `#directEditModal` | `<dialog id="directEditModal">` | Nút "Lưu Thay Đổi Slide", "Hủy Bỏ" |
| `AI.html` | `#editScriptModal` | `<dialog id="editScriptModal">` | Nút "Cập Nhật Kịch Bản", "Đóng" |
| `AI.html` | `#presentationOverlay` | `<div id="presentationOverlay">` | Nút thoát trình chiếu, thanh điều khiển slide toàn màn hình |
| `AI.html` | `#airShareModal` | `<dialog id="airShareModal">` | Mã QR quét kết nối P2P, nút đóng modal |
| `thuvienmau.html` | `#templatePreviewModal` | `<dialog id="templatePreviewModal">` | Nút "Sử Dụng Mẫu Này" (`#modalUseBtn`), Nút tải mẫu, Nút đóng |
| `vault.html` | `#projectManageModal` | `<dialog id="projectManageModal">` | 8 nút hành động: Đổi tên, Nhân bản, Chia sẻ, Tải xuống, Khóa bảo mật, Xóa dự án |
| `setting.html` | `#settingLogoutModal` | `<div id="settingLogoutModal">` (sử dụng class `opacity-0 pointer-events-none`) | Nút "Đăng Xuất Khỏi Thiết Bị", Nút "Hủy Bỏ" |
| Tất cả các trang | `#saasAppSidebar` | `<aside id="saasAppSidebar">` (drawer mobile khi có `body.sidebar-drawer-open`) | Các liên kết điều hướng và nút đóng drawer |

---

## 2. LOGIC CHAIN (Chuỗi Suy Luận Logic Từ Quan Sát Đến Kết Luận)

1. **Từ Quan sát 1.1 (Thanh số 3 & Nút nổi)**:
   - *Bước suy luận 1.1*: Thẻ `<aside id="dynamicMobileIsland">` đã được xóa khỏi HTML, nghĩa là thanh số 3 không còn được render từ markup máy chủ.
   - *Bước suy luận 1.2*: Tuy nhiên, hàm `initDynamicMobileIsland()` trong `glass-theme.js` vẫn chạy trên mọi trang và `glass-theme.css` vẫn chứa hơn 160 dòng CSS cho thanh số 3. Điều này gây lãng phí bộ nhớ và CPU khi DOM liên tục bị truy vấn tìm kiếm phần tử null trong các sự kiện cuộn màn hình (`updateMobileNavScale`).
   - *Bước suy luận 1.3*: Nút nổi `#floatingQuickCamAi` ở tọa độ `bottom-24` chính là một biến thể rút gọn của thanh số 3. Trên mobile viewport (< 768px), chiều cao màn hình chỉ từ 667px - 852px; việc đặt một nút nổi ở tọa độ 96px từ đáy trong khi thanh Bottom Dock chiếm 64px + 16px tạo ra một vùng cấm tương tác rộng tới 160px ở đáy màn hình.
   - *Kết luận 1*: Cần loại bỏ hoàn toàn việc gọi `initDynamicMobileIsland` trên các trang nội dung, đồng thời bổ sung quy tắc CSS ẩn triệt để `#floatingQuickCamAi` trên màn hình di động (< 1024px) để giải phóng toàn bộ không gian nội dung.

2. **Từ Quan sát 1.2 (`phone.html` & Tính năng 3D Touch)**:
   - *Bước suy luận 2.1*: `phone.html` được thiết kế như một bộ điều khiển không gian (Spatial Remote Controller) độc lập, hoạt động qua WebRTC và cảm biến phần cứng thiết bị (Orientation, Gyroscope, Touch, Camera).
   - *Bước suy luận 2.2*: Người dùng duyệt slide trên các trang nội dung (`trangchudong.html`, `vault.html`, `thuvienmau.html`) chỉ cần điều hướng xem mẫu, tìm kiếm và tải tài liệu. Họ không cần và không nên bị quấy rầy bởi các lớp phủ Spatial HUD (`#sv-spatial-hud`, `#sv-touchpad-controller`).
   - *Kết luận 2*: Phải cô lập 100% tính năng 3D Spatial Touch, Chuột bay Air Mouse, Laser ảo và Camera AI vào duy nhất `phone.html`. Các trang nội dung tuyệt đối không tự động nạp hoặc kích hoạt `3dtouch/touch-control.js`.

3. **Từ Quan sát 1.3 & 1.4 (Các thành phần bị che khuất & Modals)**:
   - *Bước suy luận 3.1*: Khi một modal (như Xem trước slide `#quickViewDialog` hay Giỏ hàng `#checkoutDialog`) mở ra, hành vi người dùng là tập trung hoàn toàn vào nội dung modal và nhấn các nút hành động cốt lõi ("Tải Slide Ngay", "Thêm Vào Giỏ", "Xác Nhận Đã Chuyển Khoản").
   - *Bước suy luận 3.2*: Nếu thanh Bottom Dock (`.mobile-glass-nav`) hoặc nút Camera AI (`#floatingQuickCamAi`) vẫn hiển thị khi modal mở, chúng sẽ nằm đè lên chân của modal, che mất các nút hành động này hoặc khiến người dùng bấm nhầm vào nút điều hướng trang, làm mất trạng thái mua hàng/tải slide.
   - *Bước suy luận 3.3*: Bộ quan sát hiện tại trong `glass-theme.js` (`initModalIsolationObserver`) chỉ phát hiện thẻ `<dialog>` có thuộc tính `open`. Nó hoàn toàn bất lực trước các modal sử dụng class ẩn/hiện như `#settingLogoutModal` (`opacity-0 pointer-events-none`).
   - *Bước suy luận 3.4*: Trên màn hình di động, thẻ `<dialog>` nếu không có giới hạn `max-height` và `overflow-y: auto` kèm khoảng đệm safe-area ở đáy sẽ khiến nút CTA bị trôi xuống dưới cạnh màn hình thiết bị.
   - *Kết luận 3*: Phải thiết lập cơ chế **Modal Suppression kép (CSS + JS Observer)**:
     - CSS sử dụng bộ chọn bao quát: `body:has(dialog[open])`, `body.modal-open`, `body.sidebar-drawer-open` ẩn ngay lập tức toàn bộ thanh điều hướng đáy, nút nổi và overlay không gian.
     - JS Observer hook trực tiếp vào `HTMLDialogElement.prototype.showModal`/`close` và MutationObserver để đồng bộ gán class `modal-open` lên `<body>`, bao quát cả các modal dùng class ẩn/hiện.
     - Toàn bộ hộp thoại modal trên mobile phải có `max-height: 85dvh; overflow-y: auto; padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 24px) !important;`.

---

## 3. CAVEATS (Vùng Giới Hạn & Giả Định)

1. **Phạm vi khảo sát là Read-Only**: Báo cáo này hoàn thành khảo sát kỹ thuật, xác định tọa độ, mã nguồn và thiết kế kiến trúc. Explorer Agent **không trực tiếp chỉnh sửa mã nguồn** dự án theo đúng chỉ thị phân quyền. Việc triển khai code sẽ do Implementer Agent đảm nhiệm ở Phase 1.
2. **Khả năng tương thích CSS `:has()`**: Bộ chọn `:has()` được hỗ trợ trên 93%+ trình duyệt hiện đại (Chrome 105+, Safari 15.4+, Firefox 121+). Đối với các WebView Android/iOS đời cũ, hệ thống bắt buộc phải duy trì giải pháp kép là class `body.modal-open` được điều khiển bởi JavaScript.
3. **Cảm biến phần cứng trên thiết bị thật**: Tính năng Chuột bay Gyro và Camera AI trong `phone.html` phụ thuộc vào API quyền bảo mật trên Safari iOS (`DeviceOrientationEvent.requestPermission()`) và HTTPS/Localhost. Cần xác thực trên thiết bị iPhone/Android thật khi chạy máy chủ nội bộ.
4. **Không có cảnh báo phát sinh thêm**: Không phát hiện xung đột nào khác ngoài các điểm đã kiểm kê.

---

## 4. CONCLUSION (Đánh Giá Cuối Cùng & Khuyến Nghị Thực Thi)

1. **Về Thanh Số 3 (`dynamicMobileIsland`) & Nút Nổi**:
   - Thanh số 3 HTML đã sạch. Cần làm sạch mã thừa trong `glass-theme.js` (loại bỏ truy vấn DOM vô ích trong `updateMobileNavScale` và vô hiệu hóa hàm `initDynamicMobileIsland`).
   - Thêm quy tắc CSS ẩn `#floatingQuickCamAi` trên di động:
     ```css
     @media (max-width: 1023px) {
       #floatingQuickCamAi,
       [data-sv-touch-toggle] {
         display: none !important;
       }
     }
     ```
2. **Về Cô Lập `phone.html`**:
   - `phone.html` là hạt nhân duy nhất sở hữu các tính năng: 3D Touchpad, Gyro Air Mouse, Virtual Laser Pointer, MediaPipe Hand Tracking, Tactical Remote Deck.
   - Các trang nội dung (`trangchudong.html`, `AI.html`, `vault.html`, v.v.) chỉ phục vụ hiển thị nội dung và quản lý slide. Tuyệt đối không gắn các thanh nổi hay tự động kích hoạt `3dtouch/touch-control.js` trên các trang này.
3. **Về Kiến Trúc Modal Suppression**:
   - Triển khai bộ chọn CSS chuẩn Apple VisionOS vào `tệp hệ thống/glass-theme.css`:
     ```css
     body:has(dialog[open]) .mobile-glass-nav,
     body:has(dialog[open]) .mobile-dynamic-island,
     body:has(dialog[open]) #dynamicMobileIsland,
     body:has(dialog[open]) #floatingQuickCamAi,
     body:has(dialog[open]) #sv-spatial-hud,
     body:has(dialog[open]) #sv-touchpad-controller,
     body:has(dialog[open]) #sv-touchpad-pill,
     body.modal-open .mobile-glass-nav,
     body.modal-open .mobile-dynamic-island,
     body.modal-open #dynamicMobileIsland,
     body.modal-open #floatingQuickCamAi,
     body.modal-open #sv-spatial-hud,
     body.modal-open #sv-touchpad-controller,
     body.modal-open #sv-touchpad-pill,
     body.sidebar-drawer-open .mobile-glass-nav,
     body.sidebar-drawer-open #floatingQuickCamAi {
       opacity: 0 !important;
       pointer-events: none !important;
       transform: translate3d(-50%, 36px, 0) scale(0.9) !important;
       transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
       visibility: hidden !important;
     }
     ```
   - Cập nhật hàm `initModalIsolationObserver()` trong `glass-theme.js` theo đoạn mã mẫu tại Mục 5.3 của `analysis.md` để tự động hook vào `showModal`/`close` và bao quát cả `#settingLogoutModal`.
   - Bổ sung khoảng đệm an toàn `padding-bottom: calc(76px + env(safe-area-inset-bottom, 16px))` cho các container cuộn nội dung trên các trang chính và `max-height: 85dvh` cho toàn bộ thẻ modal/dialog trên mobile.
4. **Quy Tắc Bất Biến (Invariance Rule)**:
   - Bất kỳ can thiệp nào lên `trangchudong.html` đều phải được đồng bộ chính xác từng byte sang `index.html` (kích thước file và nội dung phải khớp tuyệt đối).

---

## 5. VERIFICATION METHOD (Phương Pháp Kiểm Tra & Xác Thực Độc Lập)

Người tiếp nhận (hoặc kiểm thử viên độc lập) có thể xác minh các phát hiện trên bằng các bước sau:

1. **Kiểm tra sự vắng mặt của thẻ dynamicMobileIsland trong HTML**:
   - Mở terminal và kiểm tra tìm kiếm chuỗi `dynamicMobileIsland` trong các file HTML:
     ```powershell
     Select-String -Path "*.html" -Pattern "dynamicMobileIsland"
     ```
   - *Kết quả kỳ vọng*: Không tìm thấy dòng nào chứa thẻ HTML `<aside id="dynamicMobileIsland">` trên 11 trang chính (chỉ còn lại trong các file hướng dẫn hoặc tài liệu backup).

2. **Kiểm tra sự hiện diện của `#floatingQuickCamAi`**:
   - Xem trực tiếp dòng 611 - 615 của `trangchudong.html` và `index.html`:
     ```powershell
     Get-Content -Path "trangchudong.html" | Select-Object -Skip 610 -First 6
     ```
   - *Kết quả kỳ vọng*: Xuất hiện thẻ `<button id="floatingQuickCamAi" ... class="fixed bottom-24 ...">`.

3. **Kiểm tra vết tích thanh số 3 trong CSS & JS**:
   - Kiểm tra `tệp hệ thống/glass-theme.css`: Xem dòng 5071 đến 5100 để xác nhận các quy tắc CSS vị trí `bottom: calc(76px + env(safe-area-inset-bottom, 12px))`.
   - Kiểm tra `tệp hệ thống/glass-theme.js`: Xem dòng 1317 (truy vấn `dynamicIsland`) và dòng 1528 (hàm `initDynamicMobileIsland`).

4. **Kiểm tra tính năng độc quyền trong `phone.html`**:
   - Mở `phone.html`: Kiểm tra các phần tử `#touchPadSurface` (dòng 378), `#modeGyro` (dòng 465), `#modeLaser` (dòng 470), `#modeCameraAi` (dòng 475), và các hàm xử lý sự kiện `handleOrientation`, `initCameraAiEngine`.
   - *Kết quả kỳ vọng*: `phone.html` là một ứng dụng điều khiển từ xa độc lập, hoàn toàn không phụ thuộc vào layout của các trang slide máy tính.

5. **Xác thực Modal Suppression sau khi triển khai**:
   - Mở `trangchudong.html` trên trình duyệt ở chế độ Responsive Viewport (390x844 - iPhone 14/15 Pro).
   - Nhấp vào bất kỳ slide nào để mở `#quickViewDialog`.
   - *Điều kiện thành công*:
     1. Thanh Bottom Dock (`.mobile-glass-nav`) biến mất hoàn toàn (`opacity: 0; visibility: hidden`).
     2. Nút `#floatingQuickCamAi` biến mất hoàn toàn.
     3. Hai nút "Tải Slide Ngay" (`#qvBtnDownload`) và "Thêm Vào Giỏ" (`#qvBtnCart`) hiển thị 100% rõ ràng, nằm hoàn toàn trong tầm với của ngón tay cái và bấm được ngay lập tức mà không bị che khuất.
     4. Khi đóng dialog, thanh Bottom Dock xuất hiện trở lại mượt mà với hiệu ứng trượt êm ái.
   - Lặp lại quy trình trên với `#checkoutDialog`, `#templatePreviewModal` (`thuvienmau.html`), `#projectManageModal` (`vault.html`), và `#settingLogoutModal` (`setting.html`).
