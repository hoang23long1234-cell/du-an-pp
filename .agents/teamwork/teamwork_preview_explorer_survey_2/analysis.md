# Khảo Sát Kỹ Thuật Chuyên Sâu (Phase 0 Survey)
## Thanh Số 3 (dynamicMobileIsland), phone.html và Kiến Trúc Modal Suppression

**Ngày khảo sát**: 2026-10-24  
**Tác nhân thực hiện**: `teamwork_preview_explorer_survey_2` (Explorer Agent)  
**Phạm vi khảo sát**: Dự án SlideVault (`c:\Users\admin\Downloads\dự án pp`)  
**Mục tiêu**: Rà soát triệt để thanh số 3 (`dynamicMobileIsland`), tối ưu hóa giao diện đáy, phân tích cô lập tính năng di động vào `phone.html`, kiểm kê toàn bộ Modals/Popups và thiết kế giải pháp Modal Suppression dứt điểm chống che khuất nút bấm.

---

## MỤC LỤC
1. [Khảo Sát Toàn Diện "Thanh Số 3" / dynamicMobileIsland](#1-khảo-sát-toàn-diện-thanh-số-3--dynamicmobileisland)
2. [Đặc Tả phone.html & Chiến Lược Cô Lập Tính Năng Di Động](#2-đặc-tả-phonehtml--chiến-lược-cô-lập-tính-năng-di-động)
3. [Kiểm Kê Các Thành Phần Giao Diện Bị Che Khuất Trên Các Trang Chính](#3-kiểm-kê-các-thành-phần-giao-diện-bị-che-khuất-trên-các-trang-chính)
4. [Bảng Kiểm Kê Chi Tiết Toàn Bộ Modals & Popups](#4-bảng-kiểm-kê-chi-tiết-toàn-bộ-modals--popups)
5. [Thiết Kế Kiến Trúc Modal Suppression Chuẩn Apple VisionOS](#5-thiết-kế-kiến-trúc-modal-suppression-chuẩn-apple-visionos)
6. [Kế Hoạch & Khuyến Nghị Thực Thi Cho Phase Tiếp Theo](#6-kế-hoạch--khuyến-nghị-thực-thi-cho-phase-tiếp-theo)

---

## 1. KHẢO SÁT TOÀN DIỆN "THANH SỐ 3" / dynamicMobileIsland

### 1.1. Khái Niệm & Nguồn Gốc "Thanh Số 3"
Trong kiến trúc điều hướng di động của SlideVault, giao diện từng có sự chồng lấn của 3 lớp điều hướng:
- **Thanh số 1**: Topbar trên cùng (`.saas-topbar`, `header.saas-topbar`) chứa logo, thanh tìm kiếm, chế độ sáng/tối, đăng nhập.
- **Thanh số 2**: Bottom Dock (`.mobile-glass-nav`, `.saas-bottom-dock`, `[data-mobile-nav]`) cố định ở đáy màn hình (`bottom: max(14px, env(safe-area-inset-bottom, 16px))`, cao 64px), chứa 5 mục: *Trang chủ*, *Vault*, *Mẫu*, *AI Studio*, *Menu*.
- **Thanh số 3**: Dynamic Mobile Island (`#dynamicMobileIsland`, `.mobile-dynamic-island`), là một thanh con nhộng (floating pill) nổi lơ lửng ngay **trên đầu** thanh Dock đáy tại tọa độ `bottom: calc(76px + env(safe-area-inset-bottom, 12px))` (khoảng 90px - 100px tính từ đáy màn hình).

### 1.2. Cấu Trúc Markup (DOM) Của dynamicMobileIsland
Thanh số 3 trước đây được nhúng dưới dạng thẻ `<aside id="dynamicMobileIsland" class="mobile-dynamic-island">` với 2 hàng chức năng:
1. **Hàng chính (`.island-main-row`)**:
   - Nút bật/tắt 3D Spatial Touch (`#islandTouchToggle`, `[data-island-touch]`) kèm đèn LED trạng thái (`.island-touch-dot`).
   - Cụm điều hướng slide nhanh (`#islandSlidePrev`, `#islandSlideNext`) kèm bộ đếm (`#islandSlideIndicator`, ví dụ: `1/4`).
   - Nút kích hoạt AI nhanh (`#islandAiTrigger`, `[data-island-ai]`).
   - Nút mở phòng chiếu điều khiển điện thoại (`#islandPhoneRemote`, `[data-island-remote]`).
2. **Hàng phụ (`.island-category-scroller`)**:
   - Thanh trượt ngang chứa các chip danh mục (`.island-cat-pill`): "Tất Cả", "Gần đây", "Pitch Deck", "Báo Cáo", v.v.

### 1.3. Vết Tích Hiện Tại Trong CSS (`tệp hệ thống/glass-theme.css`)
Mặc dù thẻ HTML đã được dọn khỏi một số trang, mã CSS liên quan đến thanh số 3 vẫn tồn tại dày đặc và chi phối layout:
- **Dòng 4879**: Khai báo Suite `2. Dynamic Mobile Island (Thanh số 3 nổi dành riêng điện thoại & tablet)`.
- **Dòng 5071 - 5100**: Định dạng vị trí `position: fixed !important; left: 50% !important; bottom: calc(76px + env(safe-area-inset-bottom, 12px)) !important; transform: translateX(-50%) translateY(0) scale(1) !important; width: min(390px, calc(100vw - 24px)) !important; z-index: 1025 !important; border-radius: 9999px; background: rgba(10, 16, 28, 0.94); backdrop-filter: blur(40px) saturate(220%);`.
- **Dòng 5102 - 5107**: Hiệu ứng cuộn xuống ẩn thanh (`.mobile-dynamic-island.island-compact, #dynamicMobileIsland.island-compact`).
- **Dòng 5110 - 5112**: Ẩn hàng danh mục thừa (`.island-category-scroller { display: none !important; }`).
- **Dòng 5115 - 5125**: Ẩn khi mở drawer menu hoặc modal (`body.sidebar-drawer-open .mobile-dynamic-island`, `body:has(dialog[open]) .mobile-dynamic-island`).
- **Dòng 5128 - 5137**: Ẩn trên trang AI (`body:has(#chatInputArea) .mobile-dynamic-island`, `.page-ai .mobile-dynamic-island`).
- **Dòng 5140 - 5147**: Ẩn khi người dùng chạm vào ô nhập văn bản (`body:has(input:focus) .mobile-dynamic-island`).
- **Dòng 5166 - 5221**: Định kiểu các phần tử con (`.island-main-row`, `.island-action-btn`, `.island-ai-btn`, `.island-cat-pill`).
- **Dòng 5374 - 5385**: Bộ chọn đàn áp modal (`body:has(dialog[open]) #dynamicMobileIsland`, `body.modal-open #dynamicMobileIsland`).

### 1.4. Vết Tích Hiện Tại Trong JS (`tệp hệ thống/glass-theme.js`)
- **Dòng 1317**: Trong hàm cuộn `updateMobileNavScale`, vẫn còn truy vấn DOM:
  ```javascript
  const dynamicIsland = document.querySelector('.mobile-dynamic-island, #dynamicMobileIsland');
  ```
  Khi cuộn xuống/lên, script liên tục thực hiện `dynamicIsland.classList.add('island-compact')` / `remove('island-compact')`.
- **Dòng 1528 - 1637**: Hàm khởi tạo `initDynamicMobileIsland()` được đăng ký chạy tự động trong sự kiện `DOMContentLoaded` (dòng 1664, 1670), thực hiện tìm kiếm `#dynamicMobileIsland, .mobile-dynamic-island` và lắng nghe sự kiện `sv-3dtouch-change`, click trên các nút `#islandTouchToggle`, `#islandSlidePrev`, `#islandSlideNext`, `#islandAiTrigger`, `#islandPhoneRemote`, `.island-cat-pill`.

### 1.5. Nút Nổi Độc Lập `#floatingQuickCamAi`
Bên cạnh thanh số 3, mã nguồn còn chứa nút nổi độc lập:
```html
<button id="floatingQuickCamAi" type="button" data-sv-touch-toggle onclick="toggle3DTouchEngine()" class="fixed bottom-24 md:bottom-8 right-6 md:right-8 z-40 ...">
  <span>Camera AI 3D Touch</span>
</button>
```
Nút này nằm tại:
- `trangchudong.html`: Dòng 611 - 615
- `index.html`: Dòng 611 - 615
- `AI.html`: Dòng 3914 - 3918
Nút này có tọa độ `bottom-24` (khoảng 96px từ đáy), trùng khớp vị trí của thanh số 3 và đè lên góc phải màn hình, gây cản trở nghiêm trọng trên điện thoại di động khi người dùng cuộn xem nội dung hoặc nhấn các nút hành động.

---

## 2. ĐẶC TẢ phone.html & CHIẾN LƯỢC CÔ LẬP TÍNH NĂNG DI ĐỘNG

### 2.1. Bản Chất & Cấu Trúc phone.html
`phone.html` (`c:\Users\admin\Downloads\dự án pp\phone.html`, 1411 dòng) là một **ứng dụng điều khiển từ xa chuyên dụng (Dedicated Remote Controller WebApp)** mang tên **SlideVault Vision Remote | Bộ Điều Khiển 3D Touch & Phòng Chiếu VIP**.

Nó được cấu trúc thành các khối chức năng độc lập:
1. **Header & Profile Capsule** (Dòng 329 - 365): Hiển thị Avatar, Tên người dùng VIP/Guest, địa chỉ LAN, nút đổi giao diện Sáng/Tối, nút về trang chủ máy tính, nút đăng xuất.
2. **Khối Ghép Đôi Phòng Chiếu LAN qua Mã PIN** (Dòng 368 - 396): Ô nhập mã PIN 4 số (`#roomPinInput`), nút "Ghép Đôi" (`#btnConnectPin`), hiển thị trạng thái Peer-to-Peer LAN.
3. **Bàn Di Cảm Ứng 3D Touch Trackpad** (Dòng 399 - 486):
   - Bề mặt Trackpad (`#touchPadSurface`, min-height 280px) tích hợp lưới radar HUD, khung ngắm điện tử HUD Brackets và con trỏ Crosshair (`#touchIndicator`).
   - Cung cấp 4 chế độ chuyển đổi linh hoạt:
     - **Chuột (Trackpad)**: Rê ngón tay để di chuyển chuột máy tính (điều phối qua `/api/3dtouch/dispatch` với nhịp throttle 16ms chuẩn 60/120fps); chạm nhẹ (tap < 280ms) là click chuột trái; vuốt nhanh ngang (swipe > 45px) là chuyển slide trước/tiếp.
     - **Con trỏ Laser ảo (Laser Pointer)**: Tạo tia laser đỏ rực với hiệu ứng xung năng lượng, truyền tọa độ thời gian thực lên màn hình máy tính.
     - **Chuột bay Air Mouse (Gyroscope Tilt)**: Tận dụng cảm biến gia tốc và con quay hồi chuyển (`DeviceOrientationEvent` - `gamma`, `beta`) trên điện thoại; người dùng chỉ cần nghiêng điện thoại trên không trung là con trỏ trên máy chiếu di chuyển theo góc nghiêng!
     - **Camera AI 3D Touch (Hand Tracking)**: Kích hoạt camera điện thoại (`#phoneCamAiVideo`, `#phoneCamAiCanvas`), nhận diện trực tiếp cử chỉ bàn tay (chĩa ngón trỏ để rê, chụm ngón để click, vuốt để chuyển trang).
4. **Bàn Điều Khiển Trình Chiếu Chiến Thuật (Tactical Controller Deck)** (Dòng 489 - 539):
   - Các nút bấm xúc giác lớn: *Trang trước* (`#btnSlidePrev`), *Con trỏ Laser* (`#btnClickLaser`), *Trang tiếp* (`#btnSlideNext`), *Chiếu Full* (`#btnFullscreen`).
   - Hàng phím tắt nhanh: *Màn Đen (Phím B)* (`#btnBlankScreen`), *Nhấp Chuột Thủ Công* (`#btnManualClick`), *Phím Thoát (Esc)* (`#btnEscapeKey`).
5. **Khung Gửi Lệnh AI & Nhắc Bài Từ Xa** (Dòng 542 - 567):
   - Chip câu lệnh gợi ý 1 chạm ("✨ Tóm tắt slide", "📊 Chuyển biểu đồ", "🎯 Slide kết luận").
   - Ô nhập lệnh AI / ghi chú diễn giả (`#remoteTextInput`) và nút gửi (`#remoteTextForm`).

### 2.2. Sự Dư Thừa & Xung Đột Khi Nhúng "Thanh Số 3" Vào Các Trang Nội Dung
- Trên các trang web nội dung máy tính/máy tính bảng (`trangchudong.html`, `vault.html`, `AI.html`...), người dùng cần xem slide, đọc tài liệu, chỉnh sửa kịch bản hoặc gõ prompt AI.
- Việc cố gắng "nhét" một thanh điều khiển mô phỏng thanh số 3 lên giao diện web thông thường vừa làm chật chội màn hình, vừa trùng lặp tính năng, vừa che mất các phần tử cốt lõi của trang.
- Trong khi đó, `phone.html` đã được xây dựng hoàn chỉnh, tối ưu 100% cho màn hình cảm ứng di động cầm tay, có phản hồi rung (Haptic Feedback `navigator.vibrate`), kết nối mạng LAN không độ trễ (Zero-latency P2P).

### 2.3. Chiến Lược Cô Lập Tuyệt Đối (Isolation Strategy)
1. **Triệt tiêu hoàn toàn thanh số 3 khỏi các trang nội dung**:
   - Loại bỏ triệt để mọi logic DOM, CSS, JS liên quan đến `#dynamicMobileIsland` và `.mobile-dynamic-island` trên `trangchudong.html`, `index.html`, `vault.html`, `thuvienmau.html`, `AI.html`, `setting.html`, `security.html`.
   - Vô hiệu hóa hoặc dọn sạch hàm `initDynamicMobileIsland` trong `glass-theme.js`.
   - Ẩn hoàn toàn nút `#floatingQuickCamAi` trên màn hình di động (< 1024px) để không che chắn nội dung góc phải.
2. **Biến `phone.html` thành trung tâm điều khiển di động duy nhất**:
   - Trên desktop/tablet, khi người dùng muốn điều khiển bằng điện thoại hoặc chuột bay/laser/3D Touch, chỉ cần hiển thị một mã QR kết nối (hoặc nút "Mở Điều Khiển Di Động" trong menu) dẫn trực tiếp đến `phone.html?pin=XXXX`.
   - `phone.html` giữ độc quyền toàn bộ các API cảm biến: Con quay hồi chuyển (Air Mouse), MediaDevices (Camera AI), Touchpad cử chỉ và Con trỏ Laser.
   - `phone.html` không chứa thanh Dock đáy `.mobile-glass-nav` của trang web chính, đảm bảo trải nghiệm toàn màn hình chuyên nghiệp 100%.

---

## 3. KIỂM KÊ CÁC THÀNH PHẦN GIAO DIỆN BỊ CHE KHUẤT TRÊN CÁC TRANG CHÍNH

Khi "thanh số 3" hoặc thanh Dock đáy không được ẩn đúng lúc (hoặc khi không có đủ khoảng đệm `padding-bottom`), các thành phần sau đây bị che khuất nghiêm trọng trên điện thoại (đặc biệt các kích thước màn hình 375px iPhone SE/Mini, 393px iPhone 15 Pro, 412px–430px Samsung/Pixel):

| Trang | Vị Trí / Dòng Code | Thành Phần Bị Che Khuất | Hậu Quả & Tác Động Người Dùng |
|---|---|---|---|
| **`AI.html`** | Dòng 928 - 933 | Ô nhập văn bản `#chatInputArea` và nút Gửi `#chatSendButton` | **Rất nghiêm trọng**: Người dùng không thể nhìn thấy nội dung đang gõ, không thể nhấn nút Gửi (Enter). Khi bàn phím ảo bật lên, thanh số 3 đè hoàn toàn lên khung chat. |
| **`AI.html`** | Dòng 885 - 924 | Các chip gợi ý ("Làm PP KHTN 10"...) & 3 menu chọn định dạng/số slide/mô hình AI | Người dùng không chọn được số slide (5, 8, 10...) hoặc mô hình AI (Gemini/Groq) trên thiết bị di động. |
| **`trangchudong.html` & `index.html`** | Dòng 542 - 564 | Nhóm chip lọc danh mục `#categoryChipsGroup` ("Tất Cả", "Pitch Deck", "Báo Cáo", "Giáo Dục", "Y Tế"...) | Thanh số 3 lơ lửng đè ngay trên thanh danh mục trượt ngang khiến người dùng bấm nhầm vào thanh nổi thay vì lọc mẫu slide. |
| **`trangchudong.html` & `index.html`** | Dòng 568 - 575 | Hàng sản phẩm cuối cùng `#catalogProductContainer` và thanh phân trang `#catalogPaginationNav` | Người dùng không thể chuyển trang (Trang 1, Trang 2...) hoặc xem chi tiết mẫu slide ở cuối trang. |
| **`trangchudong.html` & `index.html`** | Dòng 611 - 615 | Nút nổi `#floatingQuickCamAi` ở góc phải (`bottom-24`) | Nằm chồng lấn lên nút xem chi tiết slide và che mất các nút chia sẻ/yêu thích của thẻ sản phẩm. |
| **`vault.html`** | Dòng 470 - 505 | Đồng hồ đo hạn mức lưu trữ Cloud Storage (2.4 GB / 10 GB) & các chỉ số dự án | Bị che khuất khi cuộn, người dùng không thể nhấn xem liên kết sơ đồ quy trình dự án. |
| **`vault.html`** | Dòng 870 - 930 | Thẻ slide dự án cuối cùng và các nút tác vụ (Trình chiếu, Sửa AI, Tải file .pptx) | Không bấm được nút tải xuống hoặc nút chỉnh sửa slide trên điện thoại. |
| **`thuvienmau.html`** | Dòng 640 - 695 | Các thẻ mẫu slide dưới cùng (Cyber Neon Tech, AgriNova ESG) | Nút "Xem trước" và "Dùng mẫu này" bị thanh đáy đè lên, không tương tác được. |
| **`setting.html`** | Dòng 1260 - 1320 | Nút "Lưu Thay Đổi" tên tài khoản và nút "Đăng Xuất Tài Khoản" | Bị che khuất, người dùng tưởng rằng giao diện không có nút lưu hoặc không thể đăng xuất. |
| **`security.html`** | Dòng 1580 - 1630 | Kết quả quét mã độc (`#scanResult`), chỉ số băm SHA-256, nút "Kiểm Tra Sức Khỏe API Key" | Bị che lấp, làm mất niềm tin về tính minh bạch an ninh của hệ sinh thái. |

---

## 4. BẢNG KIỂM KÊ CHI TIẾT TOÀN BỘ MODALS & POPUPS

Dưới đây là danh mục tổng hợp đầy đủ 100% tất cả các hộp thoại (Modal), Dialog và Popup trên toàn bộ hệ thống SlideVault:

### 4.1. `trangchudong.html` & `index.html`
1. **`#quickViewDialog` (Xem trước mẫu slide & thông số)**
   - **Thẻ DOM**: `<dialog id="quickViewDialog" class="rounded-3xl border border-white/15 bg-slate-950/90 ...">` (Dòng 640 - 694).
   - **Hàm kích hoạt**: `openQuickView(id)` khi bấm vào bất kỳ mẫu slide nào trên lưới catalog.
   - **Các nút then chốt bên trong**:
     - `#qvBtnDownload`: Nút **"Tải Xuống File (.pptx) Ngay"** (màu xanh ngọc Emerald, kích thước lớn).
     - `#qvBtnCart`: Nút **"Thêm Vào Giỏ Hàng"**.
     - `#qvThumbsRow`: Hàng ảnh thu nhỏ cuộn ngang.
     - Nút đóng `quickViewDialog.close()`.
   - **Rủi ro che khuất**: Nếu thanh Dock đáy không tự ẩn, hai nút "Tải Xuống" và "Thêm Vào Giỏ" nằm ngay sát mép dưới và bị thanh Dock đè lên 100%, gây tê liệt thao tác mua sắm/tải về.

2. **`#checkoutDialog` (Giỏ hàng & Thanh toán VietQR)**
   - **Thẻ DOM**: `<dialog id="checkoutDialog" class="rounded-3xl border border-white/15 bg-slate-950/95 ...">` (Dòng 697 - 732).
   - **Hàm kích hoạt**: `openCartCheckout()` từ icon giỏ hàng Topbar hoặc sau khi thêm sản phẩm.
   - **Các nút then chốt bên trong**:
     - Danh sách đơn hàng `#cartItemsContainer`.
     - Nút **"Xác Nhận Đã Chuyển Khoản"** (`confirmPaymentDone()`).
     - Nút "Đóng" (`checkoutDialog.close()`).
   - **Rủi ro che khuất**: Nút xác nhận thanh toán bị Dock che mất, người dùng không thể hoàn tất giao dịch.

3. **`#commandPaletteModal` (macOS Spotlight / Linear Command Palette)**
   - **Thẻ DOM**: `<dialog id="commandPaletteModal" class="p-0 bg-transparent ...">` (Dòng 621 - 637).
   - **Hàm kích hoạt**: Phím tắt `Ctrl+K` / `Cmd+K` hoặc nhấn ô tìm kiếm trên Topbar.
   - **Phần tử bên trong**: Ô nhập lệnh `#cmdPaletteInput`, danh sách kết quả `#cmdPaletteResults`.

4. **`#saasAppSidebar` (Thanh bên di động dạng Drawer)**
   - **Thẻ DOM**: `<aside id="saasAppSidebar" class="saas-sidebar ...">` kèm backdrop `[data-sidebar-backdrop]`.
   - **Hàm kích hoạt**: Nút Menu Topbar, nút Menu Dock đáy (`[data-sidebar-toggle]`), hoặc vuốt ngón tay từ cạnh trái màn hình.

5. **`#svGlassThemeModal` (Tùy biến Kính Mờ & Phông Chữ)**
   - **Thẻ DOM**: Tạo động qua `tệp hệ thống/glass-theme.js`.
   - **Hàm kích hoạt**: `window.SlideVaultTheme.openGlassCustomizerModal()`.

6. **`#svWebCrashOverlay` (Cảnh báo sự cố máy chủ / mất mạng)**
   - **Thẻ DOM**: Tạo động qua `tệp hệ thống/glass-theme.js`.
   - **Hàm kích hoạt**: Sự kiện `offline` hoặc khi kiểm tra `/api/health` thất bại.

---

### 4.2. `AI.html`
1. **`#directEditModal` (Chỉnh sửa tiêu đề slide trực tiếp)**
   - **Thẻ DOM**: `<div id="directEditModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-center justify-center p-4">` (Dòng 954 - 982).
   - **Hàm kích hoạt**: `openDirectEditTitle()` khi nhấp chuột vào tiêu đề slide ở sân khấu 16:9.
   - **Nút hành động**: "Cập Nhật" (`saveDirectEdit()`), "Hủy" (`closeDirectEditModal()`).

2. **`#editScriptModal` (Chỉnh sửa kịch bản diễn thuyết Speaker Notes)**
   - **Thẻ DOM**: `<div id="editScriptModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-center justify-center p-4">` (Dòng 985 - 1016).
   - **Hàm kích hoạt**: `openEditScriptModal()` trong tab Speaker Notes.
   - **Nút hành động**: "Lưu Kịch Bản" (`saveEditedScript()`), "Hủy" (`closeEditScriptModal()`).

3. **`#presentationOverlay` (Chế độ trình chiếu toàn màn hình Cinema 16:9)**
   - **Thẻ DOM**: `<div id="presentationOverlay" class="fixed inset-0 z-50 bg-[#030712] hidden flex-col justify-between ...">` (Dòng 1020 - 1141).
   - **Hàm kích hoạt**: `launchPresentationMode()` (nút "Trình Chiếu").
   - **Phần tử bên trong**: Canvas vẽ bút mực, con trỏ Laser quang học, ngăn kéo nhắc bài `#presenterNotesDrawer`, nút Trang Trước, Trang Tiếp, Thoát (Esc).

4. **`#airShareModal` (Chia sẻ cử chỉ không chạm & QR AirShare)**
   - **Thẻ DOM**: `<div id="airShareModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden items-center justify-center p-4">` (Dòng 1144 - 1242).
   - **Hàm kích hoạt**: `openAirShareModal()`.
   - **Nút hành động**: "Bắn Toàn Bộ Slide", "Mô Phỏng Cử Chỉ Ném", "Sao chép link PIN".

5. **`#commandPaletteModal`**: Tương tự trang chủ.

---

### 4.3. `thuvienmau.html`
1. **`#templatePreviewModal` (Khung xem trước mẫu bản quyền đa slide)**
   - **Thẻ DOM**: `<div id="templatePreviewModal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-md hidden opacity-0 transition-opacity duration-300 flex items-center justify-center p-4">` (Dòng 703 - 757).
   - **Hàm kích hoạt**: `previewTemplateModal(title, count, cat)` khi bấm nút "Xem trước" trên bất kỳ thẻ template nào.
   - **Nút hành động**:
     - `#modalUseBtn`: Nút **"Dùng mẫu này ngay"** (dẫn sang `AI.html?template=...`).
     - Nút "Slide trước" (`navModalSlide(-1)`), "Slide tiếp" (`navModalSlide(1)`).
     - Nút "Đóng" (`closePreviewModal()`).

---

### 4.4. `vault.html`
1. **`#projectManageModal` (Trung tâm điều khiển tác vụ dự án chuyên sâu)**
   - **Thẻ DOM**: `<div id="projectManageModal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-3 sm:p-5 project-modal-backdrop">` (Dòng 1722 - 1911).
   - **Hàm kích hoạt**: `openProjectManageModal(id)` khi bấm vào bất kỳ dự án slide nào trong Vault.
   - **Các tác vụ quan trọng**:
     - Sửa tiêu đề, danh mục dự án.
     - 8 nút chức năng: *Sửa trong AI Studio*, *Trình chiếu Fullscreen*, *Xuất PowerPoint thật (.pptx)*, *Nhân bản dự án*, *Khóa dự án*, *Sao chép liên kết*, *Xuất dữ liệu JSON*, *Xóa dự án*.

---

### 4.5. `setting.html`
1. **`#settingLogoutModal` (Hộp thoại kính mờ xác nhận đăng xuất)**
   - **Thẻ DOM**: `<div id="settingLogoutModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md opacity-0 pointer-events-none transition-all duration-300">` (Dòng 1352 - 1373).
   - **Hàm kích hoạt**: `confirmLogoutSetting()`.
   - **Nút hành động**: "Hủy Bỏ" (`closeLogoutModalSetting()`), "Đăng Xuất" (`executeLogoutSetting()`).
   - **Đặc điểm kỹ thuật**: Modal này **không dùng class `.hidden`** mà dùng `opacity-0 pointer-events-none` kết hợp `scale-95`. Đây là một ngoại lệ quan trọng mà bộ chọn CSS hiện tại chưa bắt được!

---

## 5. THIẾT KẾ KIẾN TRÚC MODAL SUPPRESSION CHUẨN APPLE VISIONOS

### 5.1. Phân Tích Lỗ Hổng Của Cơ Chế Hiện Tại
Hiện tại, `glass-theme.css` (dòng 5373) và `glass-theme.js` (dòng 1698) đã có bước đầu triển khai Modal Suppression:
1. **Thiếu đối tượng đàn áp**: Bộ chọn hiện tại chỉ ẩn `.mobile-glass-nav` và `#dynamicMobileIsland`. Nó **bỏ quên**:
   - Nút nổi Camera AI `#floatingQuickCamAi` (vẫn nổi lơ lửng tại góc phải màn hình).
   - Cụm HUD cảm ứng `#sv-spatial-hud`, `#sv-touchpad-controller`, `#sv-touchpad-pill` (nếu người dùng đã kích hoạt 3D Touch).
2. **Lỗ hổng bắt trạng thái mở của Modal**:
   - Bộ chọn `body:has([id$="Modal"]:not(.hidden):not([style*="display: none"]))` giả định mọi modal đều dùng `.hidden`.
   - Tuy nhiên, `#settingLogoutModal` trên `setting.html` và `#templatePreviewModal` trên `thuvienmau.html` lại dùng cơ chế `opacity-0 pointer-events-none`. Do đó bộ chọn CSS `:not(.hidden)` có thể bắt nhầm khi modal đang đóng, hoặc không bắt kịp khi mở.
3. **Giới hạn tương thích `:has()`**: Một số trình duyệt di động hoặc WebKit nhúng đời cũ chưa hỗ trợ đầy đủ bộ chọn `:has()`.

### 5.2. Giải Pháp Kiến Trúc Đồng Bộ Hai Lớp (Dual-Layer Master Suppression)

#### Lớp 1: Master CSS Rules (Triệt Tiêu 100% Các Thành Phần Nổi)
Cần cập nhật bộ quy tắc trong `glass-theme.css`:
```css
/* ============================================================================
 * SLIDEVAULT MASTER MODAL SUPPRESSION (ZERO-COLLISION GUARANTEE)
 * ========================================================================== */

/* Khi mở BẤT KỲ Modal, Dialog hoặc Hộp thoại nào:
   Ẩn ngay lập tức 100% thanh Dock, thanh Island, nút nổi Cam AI và các thanh công cụ đáy */
body.modal-open .mobile-glass-nav,
body.modal-open .mobile-dynamic-island,
body.modal-open #dynamicMobileIsland,
body.modal-open #floatingQuickCamAi,
body.modal-open #sv-spatial-hud,
body.modal-open #sv-touchpad-controller,
body.modal-open #sv-touchpad-pill,
body:has(dialog[open]) .mobile-glass-nav,
body:has(dialog[open]) #floatingQuickCamAi,
body:has(dialog[open]) #dynamicMobileIsland,
body:has(.modal:not(.hidden)) .mobile-glass-nav,
body:has(.modal:not(.hidden)) #floatingQuickCamAi,
body:has([id$="Modal"]:not(.hidden):not(.opacity-0):not([style*="display: none"]):not([style*="display:none"])) .mobile-glass-nav,
body:has([id$="Modal"]:not(.hidden):not(.opacity-0):not([style*="display: none"]):not([style*="display:none"])) #floatingQuickCamAi,
body:has([id$="Dialog"][open]) .mobile-glass-nav,
body:has([id$="Dialog"][open]) #floatingQuickCamAi {
  display: none !important;
  transform: translateX(-50%) translateY(calc(100% + 180px)) scale(0.85) !important;
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease !important;
}

/* Tối ưu hóa kích thước hộp thoại để nút bấm luôn nhìn thấy rõ trên điện thoại */
@media (max-width: 1023.98px) {
  dialog[open],
  .modal:not(.hidden) > div,
  #quickViewDialog[open],
  #checkoutDialog[open],
  #commandPaletteModal[open],
  #templatePreviewModal:not(.hidden) > div,
  #projectManageModal:not(.hidden) > div {
    max-height: 85dvh !important;
    max-height: 85svh !important;
    overflow-y: auto !important;
    overscroll-behavior: contain !important;
    -webkit-overflow-scrolling: touch !important;
    margin: auto !important;
    z-index: 99999 !important;
    /* Khoảng trống an toàn phía dưới đáy hộp thoại: luôn cách thanh điều hướng ảo iPhone 24px */
    padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 24px) !important;
  }
}
```

#### Lớp 2: Universal JS Lifecycle Observer (`glass-theme.js`)
Nâng cấp hàm `initModalIsolationObserver()` trong `glass-theme.js`:
```javascript
(function initEnhancedModalSuppression() {
  if (typeof window === 'undefined') return;

  function isElementVisibleModal(el) {
    if (!el) return false;
    // 1. Thẻ dialog chuẩn HTML5
    if (el.tagName === 'DIALOG' && el.hasAttribute('open')) return true;
    // 2. Thẻ div modal có class hidden hoặc style display:none
    if (el.classList.contains('hidden')) return false;
    if (el.style.display === 'none') return false;
    // 3. Thẻ dùng opacity-0 pointer-events-none (như settingLogoutModal)
    if (el.classList.contains('opacity-0') && el.classList.contains('pointer-events-none')) return false;
    // 4. Kiểm tra kích thước hình học thực tế
    return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
  }

  function syncModalState() {
    const candidateSelectors = [
      'dialog[open]',
      '.modal:not(.hidden)',
      '[id$="Modal"]',
      '[id$="Dialog"]',
      '#quickViewDialog',
      '#checkoutDialog',
      '#templatePreviewModal',
      '#projectManageModal',
      '#settingLogoutModal',
      '#directEditModal',
      '#editScriptModal',
      '#airShareModal'
    ];

    const hasActiveModal = Array.from(document.querySelectorAll(candidateSelectors.join(',')))
      .some(el => isElementVisibleModal(el));

    if (hasActiveModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }

  // Hook vào phương thức showModal & close của native <dialog>
  if (typeof HTMLDialogElement !== 'undefined') {
    const origShowModal = HTMLDialogElement.prototype.showModal;
    if (origShowModal && !HTMLDialogElement.prototype._svSuppressionHooked) {
      HTMLDialogElement.prototype.showModal = function() {
        document.body.classList.add('modal-open');
        const res = origShowModal.apply(this, arguments);
        setTimeout(syncModalState, 30);
        return res;
      };
      const origClose = HTMLDialogElement.prototype.close;
      HTMLDialogElement.prototype.close = function() {
        const res = origClose.apply(this, arguments);
        setTimeout(syncModalState, 30);
        return res;
      };
      HTMLDialogElement.prototype._svSuppressionHooked = true;
    }
  }

  // MutationObserver giám sát toàn diện thay đổi DOM (class, open, style)
  const observer = new MutationObserver(() => syncModalState());
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open', 'class', 'style']
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['open', 'class', 'style']
      });
    });
  }

  // Khởi động đồng bộ ban đầu
  syncModalState();
})();
```

---

## 6. KẾ HOẠCH & KHUYẾN NGHỊ THỰC THI CHO PHASE TIẾP THEO

1. **Về Thanh Số 3 & Nút Nổi**:
   - Xác nhận thanh số 3 (`dynamicMobileIsland`) đã được xóa khỏi HTML. Cần làm sạch mã JS `initDynamicMobileIsland` trong `glass-theme.js` để loại bỏ các thao tác DOM thừa.
   - Thêm quy tắc CSS ẩn triệt để `#floatingQuickCamAi` trên di động (< 1024px) hoặc gom gọn vào mục Menu của Sidebar.
2. **Về phone.html**:
   - Giữ nguyên toàn bộ tính năng 3D Touch, Chuột bay Air Mouse, Laser ảo độc quyền trong `phone.html`.
   - Kiểm tra tương thích giao diện `phone.html` trên dải kích thước chuẩn 375px - 430px (iPhone 15 Pro, Pixel 8).
3. **Về Modal Suppression**:
   - Triển khai bộ chọn CSS cập nhật và Observer cải tiến vào `tệp hệ thống/glass-theme.css` và `glass-theme.js`.
   - Kiểm thử thực tế trên các modal: Xem trước mẫu slide (`quickViewDialog`), Giỏ hàng QR (`checkoutDialog`), Xem mẫu template (`templatePreviewModal`), Quản lý dự án (`projectManageModal`), và Đăng xuất (`settingLogoutModal`).
4. **Về Tính Bất Biến (Invariance Rule)**:
   - Đảm bảo mọi thay đổi giao diện trên `trangchudong.html` phải được sao chép nguyên vẹn từng byte sang `index.html` (trùng khớp SHA-256).
