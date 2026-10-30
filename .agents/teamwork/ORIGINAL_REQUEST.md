# Original User Request

## 2026-10-24T13:53:08Z

Đại tu, rà soát và khắc phục dứt điểm toàn bộ các lỗi giao diện trên Điện Thoại (ưu tiên tối đa iPhone 15 Pro, Android 375px - 430px) và Máy Tính Bảng (768px - 1024px) cho dự án SlideVault. Triệt tiêu hoàn toàn hiện tượng che khuất nội dung, tối ưu hóa cơ chế ẩn/hiện điều hướng (Topbar, Bottom Dock) và hoàn thiện thanh bên (Sidebar) chuyển động mượt mà 60fps chuẩn Apple VisionOS.

Working directory: c:\Users\admin\Downloads\dự án pp
Integrity mode: development
Requested team: Đội Ngũ Đa Tác Nhân Toàn Diện (Full Multi-Agent Team)

## Requirements

### R1. Tối Ưu Hóa Giao Diện Đáy & Triệt Tiêu Che Khuất Nội Dung
- Xóa bỏ hoặc ẩn hoàn toàn thanh số 3 (dynamicMobileIsland) trên toàn bộ các trang nội dung chính (trangchudong.html, vault.html, thuvienmau.html, AI.html, setting.html, security.html...) để không che lấp các thanh lọc danh mục (Tất cả, Gần đây...) và ô nhập liệu AI.
- Thanh số 3 và các tính năng thuần di động (3D Spatial Touch, Chuột bay Air Mouse, Laser ảo) được tổ chức riêng biệt, chuyên sâu trong phòng chiếu phone.html.
- Tích hợp cơ chế Modal Suppression: Tự động ẩn 100% thanh Dock đáy và các thành phần cố định khi mở bất kỳ hộp thoại hay popup nào (xem mẫu slide, giỏ hàng, thanh toán QR), đảm bảo nút "Tải xuống" và "Giỏ hàng" luôn nhìn thấy rõ và bấm được ngay.

### R2. Cơ Chế Thu Nhỏ & Ẩn Hiện Tự Động Theo Hướng Cuộn (Scroll-Driven Engine)
- Khi người dùng cuộn xuống trên điện thoại và tablet: Thanh Topbar trượt ẩn lên trên, Bottom Dock trượt ẩn xuống dưới để giải phóng 100% diện tích màn hình cho nội dung slide.
- Khi người dùng cuộn nhẹ lên hoặc dừng chạm: Cả hai thanh lập tức trượt trở lại vị trí hiển thị tiêu chuẩn với hiệu ứng lò xo Apple VisionOS đàn hồi êm ái (cubic-bezier(0.16, 1, 0.3, 1)).

### R3. Hoàn Thiện Thanh Bên (Sidebar Drawer) & Triệt Tiêu Giật Lag
- Cho phép người dùng cuộn lên xuống mượt mà 60fps bên trong thanh bên bằng cuộn quán tính gốc (-webkit-overflow-scrolling: touch; overscroll-behavior-y: contain;), loại bỏ triệt để hiện tượng kẹt vuốt hoặc cướp cử chỉ ngang (gesture hijacking).
- Tinh gọn tiêu đề trên cùng của Sidebar trên thiết bị di động, bố trí các mục điều hướng cân đối với vùng chạm tối thiểu 48px Touch Target.
- Loại bỏ hoàn toàn các nút 3 chấm thừa trên toàn bộ giao diện.

### R4. Bảo Đảm Tính Bất Biến (Invariance Rule) & Tương Thích Mọi Độ Phân Giải
- Duy trì đồng bộ tuyệt đối 100% từng byte mã nguồn giữa trangchudong.html và index.html (khớp mã băm SHA-256).
- Tối ưu khít khao cho các dải kích thước màn hình: Ưu tiên Điện Thoại (375px–430px iPhone 15 Pro & Android), sau đó tối ưu Tablet dọc (768px iPad Mini) và Tablet ngang (820px–1024px iPad Air/Pro).

## Acceptance Criteria

### 1. Trải Nghiệm Màn Hình Cảm Ứng Di Động (Mobile Touch & Viewport)
- [ ] Không có hiện tượng tràn màn hình ngang (overflow-x: hidden), trang web khít 100% chiều rộng màn hình.
- [ ] Khi cuộn xuống trên điện thoại, Topbar và Bottom Dock biến mất hoàn toàn, không che lấp bất kỳ dòng nội dung hay thẻ slide nào.
- [ ] Khi cuộn lên, các thanh điều hướng xuất hiện lại ngay lập tức mà không bị giật khung hình (60fps).
- [ ] Khi mở modal xem mẫu slide, không có bất kỳ thanh điều hướng nào nổi đè lên nút tải xuống hoặc giỏ hàng.
- [ ] Trên trang AI.html, ô nhập chat Prompt AI và nút Gửi hiển thị thông thoáng 100%, không bị che chắn bởi bàn phím ảo hay thanh nổi.

### 2. Thanh Bên (Sidebar) & Cấu Trúc Menu
- [ ] Mở và đóng thanh bên mượt mà bằng cả nút Menu lẫn cử chỉ chạm.
- [ ] Khi thanh bên đang mở, người dùng có thể vuốt cuộn lên xuống tự nhiên từ đầu đến cuối danh sách mà không bị giật, kẹt hay tắt drawer đột ngột.
- [ ] Không còn tiêu đề thương hiệu cồng kềnh trên mobile; không còn nút 3 chấm thừa.

### 3. Tính Toàn Vẹn Mã Nguồn
- [ ] Hash SHA-256 của trangchudong.html và index.html hoàn toàn trùng khớp.
- [ ] Mã trạng thái HTTP 200 OK trên mọi trang, không có lỗi 404 cho CSS, JS hay tài sản cục bộ.
- [ ] Giao diện kính lỏng (Liquid Glass) có độ đục chống xuyên thấu chữ nền (Zero Bleed-Through).

## 2026-10-25T01:56:07Z

Tiếp tục tiến trình kiểm thử và hoàn thiện nghiệm thu SlideVault UI Overhaul.

