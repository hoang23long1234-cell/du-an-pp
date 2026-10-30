# Handoff Report - Phase 0 Survey

**Tác nhân**: `teamwork_preview_explorer_survey_3`  
**Chuyên môn**: Explorer / Khảo Sát & Phân Tích Kỹ Thuật Chuyên Sâu  
**Ngày bàn giao**: 2026-10-24T14:42:00Z  
**Báo cáo phân tích đầy đủ**: `c:\Users\admin\Downloads\dự án pp\.agents\teamwork\teamwork_preview_explorer_survey_3\analysis.md`

---

## 1. Observation (Các Quan Sát Thực Nghiệm Cụ Thể)

1. **Khớp mã băm SHA-256 giữa index.html và trangchudong.html**:
   - Lệnh thực thi: `Get-FileHash -Algorithm SHA256 index.html, trangchudong.html`
   - Kết quả: Cả 2 file đều có SHA-256 là `B2FB0551120D44F05588F1BA581002C98C1C178366F323D977BE1FF80EDB7722`, dung lượng 98,755 bytes.
2. **Cơ chế cuộn hiện tại trong `tệp hệ thống/glass-theme.js`**:
   - Dòng 1308: `let lastScrollY = window.scrollY || 0; let scrollTicking = false;`
   - Dòng 1320-1336: Khi cuộn xuống `diff > 4 && currentScrollY > 35`, thêm `topbar-compact`, `dock-compact`, `island-compact`. Khi cuộn lên `diff < -4 || currentScrollY <= 20`, gỡ các lớp này.
   - **Quan sát thực nghiệm**: Hoàn toàn không có bất kỳ bộ đếm thời gian hoặc sự kiện `scrollend` / `touchend` nào để tự động phục hồi Topbar & Bottom Dock khi người dùng dừng chạm hoặc dừng cuộn (`scroll stop`).
3. **Chuyển động Keyframe bị nhảy tọa độ trong `tệp hệ thống/glass-theme.css`**:
   - Dòng 4989: `.saas-topbar.topbar-compact` có `transform: translateY(calc(-100% - 24px)) !important;`
   - Dòng 5022: `.mobile-glass-nav.dock-compact` có `transform: translateX(-50%) translateY(calc(100% + 40px)) scale(0.92) !important;`
   - Dòng 5060-5068: Khi gỡ lớp compact, `@keyframes svTopbarSpringExpand` bắt đầu từ `translateY(-2px)`, và `@keyframes svDockSpringExpand` bắt đầu từ `translateY(4px)`.
   - **Hậu quả trực quan**: Phần tử nhảy cóc lập tức từ vị trí ngoài màn hình về gần 0px trước khi rung nhẹ, triệt tiêu chuyển động trượt êm VisionOS.
4. **Cấu trúc cuộn và cử chỉ vuốt Sidebar Drawer trong `tệp hệ thống/glass-theme.css` và `glass-theme.js`**:
   - Trong `glass-theme.css` dòng 4341: Khung ngoài `.saas-sidebar` có `overflow-y: auto !important;` nhưng thiếu `-webkit-overflow-scrolling: touch !important;`.
   - Trong `glass-theme.css` dòng 4935: Khung con bên trong `nav.sidebar-nav-scroll` cũng có `overflow-y: auto !important;`.
   - Trong `glass-theme.js` dòng 1384-1388:
     ```javascript
     if (isInsideSidebar && isDrawerOpen) {
       isSwiping = false;
       return;
     }
     ```
     Đoạn mã này chủ động hủy bỏ toàn bộ cử chỉ chạm bắt đầu trong sidebar, khiến người dùng không thể vuốt sang trái để đóng thanh bên.
   - Trong `glass-theme.js` dòng 1390: `const isNearLeftEdge = touchStartX <= 30;` kích hoạt chế độ kéo thanh bên khi chạm gần mép trái màn hình, cướp cử chỉ cuộn dọc của trang chính.
5. **Kích thước vùng chạm trong Sidebar Drawer**:
   - Nút đóng `data-sidebar-close` trong `trangchudong.html` dòng 86: `p-1.5 rounded-xl` với icon 16px (tổng diện tích chỉ 28px × 28px, không đạt chuẩn 48px).
   - Nút theme toggle và login button ở footer sidebar: chỉ 28px × 28px (không đạt chuẩn 48px).
   - Các mục menu `.saas-sidebar .nav-pill-item`: `height: 48px !important; min-height: 48px !important;` (Đạt chuẩn 48px).
6. **Tình trạng nút 3 chấm**:
   - Quét regex trên 19 file HTML: 0 nút 3 chấm tồn tại trong DOM tĩnh.
   - Nút số 5 ở Bottom Dock trên tất cả các trang là nút Menu hamburger (`data-sidebar-toggle`).
   - Lớp bảo vệ CSS trong `glass-theme.css` dòng 4477-4495 ẩn toàn bộ các nút dạng 3 chấm (`display: none !important;`).
7. **Tràn khung hình ngang (Horizontal Overflow) trên `AI.html`**:
   - Dòng 537-541 trên `AI.html`: Nút `#open-hand-control` hiển thị đầy đủ văn bản `<span class="inline font-bold">Camera AI 3D Touch</span>` mà không có lớp `hidden sm:inline` như các trang khác, gây tràn ngang thanh Topbar trên iPhone 15 Pro (393px).

---

## 2. Logic Chain (Chuỗi Lập Luận Kỹ Thuật)

1. Từ **Quan sát 2 & 3** -> Vì thiếu bộ định thời `scrollRestorationTimer` và vì CSS `@keyframes` đặt tọa độ bắt đầu tại `-2px` và `4px` thay vì `-100%` và `100%`, nên hệ thống cuộn hiện tại vừa không thể tự động hiện lại khi dừng cuộn, vừa bị giật hình nhảy cóc khi cuộn ngược lên. -> Giải pháp: Bổ sung timer phục hồi khi nhấc tay/dừng cuộn trong JS và chuẩn hóa CSS chuyển sang `transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)` đối xứng hai chiều.
2. Từ **Quan sát 4** -> Việc lồng hai khung cuộn dọc (`.saas-sidebar` và `nav`) cùng với việc thiếu `-webkit-overflow-scrolling: touch` trên khung ngoài là nguyên nhân trực tiếp gây ra hiện tượng kẹt vuốt và giật lag 60fps trên WebKit iOS. Việc dòng mã 1385 cố tình trả về `return` khi `isInsideSidebar && isDrawerOpen` khiến cử chỉ vuốt đóng bị vô hiệu hóa hoàn toàn từ bên trong thanh bên. Việc mép trái `touchStartX <= 30` cướp cử chỉ khi người dùng cuộn trang ngoài mép trái gây ra lỗi gesture hijacking. -> Giải pháp: Khung ngoài `.saas-sidebar` đặt `overflow: hidden !important;`, chỉ cho khung trong `nav` cuộn quán tính; cho phép vuốt sang trái để đóng drawer; và tăng ngưỡng phân biệt cử chỉ ngang/dọc.
3. Từ **Quan sát 5** -> Người dùng di động bấm trượt nút Đóng vì kích thước 28px quá nhỏ so với ngón tay cái. -> Giải pháp: Mở rộng vùng chạm của nút `data-sidebar-close` lên tối thiểu 48px × 48px.
4. Từ **Quan sát 6** -> Nút 3 chấm đã được dọn sạch trong cấu trúc HTML và được khóa chặt bằng CSS, không còn là nguồn lỗi.
5. Từ **Quan sát 7** -> `AI.html` bị phình ngang Topbar trên iPhone 15 Pro do dòng chữ "Camera AI 3D Touch" chiếm hơn 140px chiều rộng không cần thiết trên mobile. -> Giải pháp: Thêm `hidden sm:inline` vào nhãn này.

---

## 3. Caveats (Các Điểm Lưu Ý & Giả Định)

1. **Invariance Rule**: Bất kỳ sửa đổi nào được thực hiện trên `trangchudong.html` đều phải được sao chép nguyên vẹn từng byte sang `index.html` và xác thực lại bằng lệnh `Get-FileHash`.
2. **Quyền hạn**: Tác nhân hiện tại là Explorer (chỉ đọc), không trực tiếp sửa đổi mã nguồn dự án. Mọi giải pháp và đoạn mã đề xuất đã được biên soạn chi tiết trong `analysis.md` để tác nhân triển khai (Coder / Implementer) tiếp quản thực thi.
3. **Thanh số 3 (`mobile-dynamic-island`)**: Theo yêu cầu R1, thanh số 3 đã được ẩn trên các trang chính và chỉ tổ chức sâu trong `phone.html`. Các lớp CSS ẩn thanh số 3 khi mở modal vẫn cần được duy trì nhất quán.

---

## 4. Conclusion (Kết Luận Toàn Diện)

1. Đã xác định chính xác và đầy đủ căn nguyên của 6 vấn đề kỹ thuật trọng tâm:
   - Cơ chế cuộn thiếu bộ định thời phục hồi khi dừng chạm và bị lỗi gián đoạn do `@keyframes`.
   - Thanh bên Sidebar Drawer bị kẹt và cướp cử chỉ do lồng 2 container cuộn dọc, thiếu cuộn quán tính gốc trên container ngoài, chặn vuốt đóng bên trong và bắt mép trái quá rộng.
   - Header thanh bên trên mobile còn cồng kềnh; nút đóng chỉ có 28px, cần nâng lên >= 48px.
   - Nút 3 chấm đã được triệt tiêu hoàn toàn.
   - Breakpoints và hiện tượng tràn ngang trên `AI.html` được định vị chính xác tại nhãn nút 3D Touch cố định `inline`.
2. Toàn bộ tài liệu phân tích, vị trí dòng mã, nguyên nhân và mã sửa đổi mẫu đã sẵn sàng trong `analysis.md`.

---

## 5. Verification Method (Phương Pháp Xác Minh Độc Lập)

Sau khi tác nhân triển khai áp dụng các sửa đổi đề xuất:

1. **Kiểm tra tính bất biến giữa index.html và trangchudong.html**:
   ```powershell
   Get-FileHash -Algorithm SHA256 index.html, trangchudong.html
   ```
   *Điều kiện hợp lệ*: Cả hai giá trị Hash SHA-256 phải trùng khớp nhau 100%.

2. **Kiểm tra cuộn phục hồi (Scroll Stop Recovery)**:
   - Mở `trangchudong.html` trên khung nhìn iPhone 15 Pro (393px × 852px).
   - Cuộn nhanh xuống 200px: Topbar và Bottom Dock phải trượt ẩn hoàn toàn ra ngoài màn hình.
   - Dừng ngón tay hoặc thả tay khỏi màn hình: Sau 1 giây, cả hai thanh phải tự động trượt êm ái trở lại vị trí hiển thị ban đầu với hiệu ứng lò xo VisionOS mà không cần người dùng phải cuộn ngược lên.

3. **Kiểm tra thanh bên Sidebar Drawer**:
   - Bấm nút Menu trên Bottom Dock: Drawer mở mượt mà 60fps.
   - Cuộn lên xuống danh sách menu: Danh sách cuộn mượt bằng cuộn quán tính gốc iOS (`-webkit-overflow-scrolling: touch`), không bị khựng hay kẹt ở hai đầu.
   - Đặt ngón tay bên trong danh sách menu và vuốt sang trái: Drawer trượt đóng nhẹ nhàng về bên trái.
   - Bấm nút X (Đóng): Diện tích chạm rộng rãi (>= 48px), phản hồi tức thì.

4. **Kiểm tra Topbar trang `AI.html` trên iPhone 15 Pro (393px)**:
   - Khung hình đạt đúng 393px chiều rộng, không xuất hiện thanh cuộn ngang (`overflow-x: hidden`), Topbar nằm gọn gàng bên trong màn hình.
