# Phân tích dự án PP / SlideVault — 30/10/2026

## Kết luận

SlideVault đã có nền tảng sản phẩm đáng kể: AI Studio, xuất PowerPoint, kho mẫu, Vault, phối màu, chuyển đổi tài liệu, biểu đồ và điều khiển bằng điện thoại/cử chỉ. Đánh giá từ mã nguồn: đây là bản thử nghiệm nhiều chức năng, cần hoàn thiện độ tin cậy của luồng sử dụng chính trước khi mở rộng hoặc phát hành công khai.

Định hướng đề xuất: công cụ tạo bài trình chiếu tiếng Việt từ chủ đề/tài liệu, cho phép sửa trực tiếp, lưu an toàn và xuất PowerPoint tiếp tục chỉnh sửa được. Nhóm thử nghiệm đầu tiên đề xuất là giáo viên; đây là giả thuyết dựa trên các cấu trúc SGK, bài giảng và ví dụ giáo dục trong mã nguồn, chưa phải kết luận từ nghiên cứu người dùng. Nếu chủ dự án tiếp cận sinh viên dễ hơn, có thể thử nhóm đó trước, nhưng chỉ chọn một nhóm cho đợt thử đầu.

## Phạm vi đã xem

- 20 trang HTML ở thư mục gốc; tập trung vào AI Studio, Vault và các tài nguyên dùng chung.
- Express backend trong `fix.html/server.js`, lưu trữ trong `fix.html/db.js`, FastAPI và neural engine trong `server AI/`, server điều khiển trong `3dtouch/`.
- Cấu hình Firebase Hosting/App Hosting, xác thực phía trình duyệt và các bộ kiểm thử liên quan.
- Không sửa mã ứng dụng, không đọc nội dung `.env`, không kiểm thử phá hủy hoặc thao tác dữ liệu thật.
- Backend tại localhost:3000 không chạy lúc kiểm tra. Chưa xác minh giao diện bằng trình duyệt, chất lượng suy luận AI, camera thật hoặc bản triển khai công khai.

## Những điểm nên giữ

- Đã có mã xuất tệp thực: bộ chuyển đổi tạo DOCX/PPTX/XLSX/PDF và kiểm tra cấu trúc tệp.
- Luồng chỉnh sửa và trình chiếu đã có nhiều thành phần để hoàn thiện thành một sản phẩm hẹp.
- Điện thoại làm remote và điều khiển cử chỉ là hướng khác biệt có thể phát triển sau.
- Đã có bộ kiểm thử toán và chuyển đổi tệp làm nền tảng hồi quy.

## Những vấn đề cần xử lý theo ưu tiên

### P0 — Bảo toàn dữ liệu khi lưu và mở lại

`AI.html:5544` lưu đầy đủ vào `slidevault_saved_decks` nhưng đồng thời ghi các slide dạng tóm tắt vào `slidevault_projects_v2`. Khối mở dự án tại khoảng dòng 6520 ưu tiên `slidevault_projects_v2`. Đã chạy riêng đúng hai phép ánh xạ trong mã với dữ liệu mẫu: trường `content` bị thay bằng `hook` qua `note`, và `concept1` bị thay bằng nội dung mặc định. Đây là kiểm chứng logic trong môi trường cô lập, chưa phải thao tác trình duyệt từ đầu đến cuối.

Hướng sửa: có một bản dữ liệu deck đầy đủ làm nguồn chính; danh sách Vault chỉ lưu thông tin hiển thị/tham chiếu. Bảo toàn dữ liệu cũ khi chuyển đổi. Kiểm chứng bằng tạo slide → sửa các trường → lưu → tải lại → mở từ Vault → so sánh toàn bộ nội dung.

### P0 — Xác thực và quyền sở hữu phía server

Các route `/api/decks`, `/api/decks/:id`, thao tác xóa và các route quản trị không gắn middleware xác thực trong mã đã đọc. `db.listDecks()` trả toàn bộ deck khi thiếu userId. Có khai báo `verifyAuth` nhưng tìm kiếm trong file chỉ thấy định nghĩa, không thấy được gắn vào route. Route `/api/auth/oauth-login` tạo phiên từ thông tin email/provider do client gửi mà chưa thấy xác minh chứng thực của nhà cung cấp.

Hướng sửa: chọn một hệ xác thực chính; xác minh token ở server, suy ra userId từ token, kiểm tra chủ sở hữu cho từng deck và vai trò cho từng thao tác quản trị. Tiêu chí đạt: người chưa đăng nhập bị từ chối; tài khoản A không đọc/sửa/xóa deck của B; tài khoản thường không gọi được API quản trị.

Supabase đã được dùng ở frontend nên có thể cân nhắc tiếp tục dùng nó để giảm số cơ chế song song. Tài liệu chính thức về xác minh JWT: https://supabase.com/docs/reference/javascript/auth-getclaims

### P0 — Tách dữ liệu riêng khỏi vùng phục vụ tệp công khai

Express phục vụ cả `__dirname` và thư mục gốc bằng `express.static`. Bộ chặn đã đọc chưa bao gồm `slidevault_data.json` và `db.js`. Firebase Hosting cũng đặt `public` là `.` và chưa loại toàn bộ thư mục dữ liệu/backend. Đây là rủi ro theo cấu hình mã nguồn, chưa xác minh bằng yêu cầu tới bản triển khai thật.

Hướng sửa: tạo thư mục đầu ra public riêng, chỉ đưa tài nguyên cần cho website vào đó; giữ dữ liệu, mã server và nhật ký bên ngoài. Kiểm chứng rằng các URL dữ liệu riêng và mã backend bị từ chối trên từng hình thức triển khai được hỗ trợ.

### P1 — Thống nhất thông báo lưu và mô hình dữ liệu

Nút lưu tại `AI.html:3776` ghi localStorage rồi thông báo đã lưu vào Vault đám mây. Vault có thêm đường nạp deck từ server, nhưng thao tác ghi localStorage không chứng minh đã đồng bộ server.

Hướng sửa: phân biệt rõ đang lưu trên máy, đang đồng bộ, đã đồng bộ và lỗi đồng bộ; chỉ báo thành công tương ứng với kết quả thực. Có một hợp đồng dữ liệu deck có phiên bản, dùng chung cho editor, lưu trữ và xuất tệp.

### P1 — Giảm độ phức tạp ở các phần đang phát triển

`AI.html` khoảng 6.990 dòng; `fix.html/server.js` khoảng 4.503 dòng; CSS dùng chung khoảng 6.531 dòng. Có đồng thời frontend localStorage/Supabase, backend JSON và cấu hình Firebase; package gốc thiếu lệnh start/test, còn script package con trỏ tới đường dẫn 3dtouch cần đối chiếu thư mục làm việc. Python neural engine nhập numpy/onnxruntime/tokenizers nhưng requirements hiện chưa khai báo chúng.

Hướng sửa: tách dần phần lưu deck, gọi AI và xuất PPTX theo từng thay đổi nhỏ; thống nhất một lệnh chạy và một lệnh kiểm thử từ thư mục gốc; xác minh cài đặt mới từ đầu. Chưa có lý do từ lần khảo sát này để viết lại toàn bộ bằng framework khác.

### P1 — Kiểm thử hành vi người dùng thật

Bộ được gọi E2E có lớp mô phỏng DOM/CSS và nhiều kiểm tra dựa trên nội dung mã nguồn. Các kiểm tra đó hữu ích nhưng không thay thế trình duyệt thật hoặc xác minh kết quả xuất PowerPoint bằng mắt.

Hướng sửa: ưu tiên kiểm thử tạo → sửa → lưu → tải lại → xuất, quyền giữa hai tài khoản, lỗi mạng và mở deck lớn trên điện thoại. Với PPTX, kiểm tra dấu tiếng Việt, font, tràn chữ, hình ảnh và khả năng chỉnh sửa trong PowerPoint.

## Định hướng AI

Chọn một đường sinh nội dung mặc định, đo chất lượng tiếng Việt và độ đúng cấu trúc slide trên cùng tập đề bài trước khi thêm model. Các chế độ cloud, browser và local server cần báo đúng nơi xử lý; không gọi suy luận trên máy chủ là suy luận trên điện thoại.

Nếu mục tiêu là dịch vụ web dễ dùng, đề xuất thử đường cloud/server làm mặc định và local AI là tùy chọn. Nếu offline là yêu cầu chính, cần đổi thứ tự: hoàn thiện cài đặt mô hình, chạy ngoại tuyến và thử trên thiết bị mục tiêu trước. WebGPU vẫn phụ thuộc trình duyệt/thiết bị; hướng dẫn chính thức: https://huggingface.co/docs/transformers.js/guides/webgpu

## Lộ trình đề xuất theo mốc nghiệm thu

Thời lượng dưới đây là khung lập kế hoạch khoảng một tháng, phụ thuộc nhân lực và lỗi phát hiện khi kiểm thử.

| Mốc | Công việc | Điều kiện hoàn thành |
|---|---|---|
| Tuần 1 | Sửa lưu/mở lại; bảo vệ API; tách vùng public | Nội dung không đổi sau tải lại; kiểm tra quyền giữa hai tài khoản đạt; tệp riêng không truy cập công khai |
| Tuần 2 | Hoàn thiện một luồng chủ đề/tài liệu → slide → sửa → PPTX | Một bộ đề mẫu tiếng Việt chạy trọn luồng; tệp mở được và chỉnh sửa được; không mất dữ liệu |
| Tuần 3 | Thử với 5–10 người thuộc một nhóm | Quan sát người dùng tự tạo/xuất bài; ghi thời gian, số lỗi, lượng sửa và lý do bỏ cuộc |
| Tuần 4 | Sửa trở ngại lớn nhất và thử lại | Có kết quả so sánh trước/sau; xác định có người quay lại dùng cho bài tiếp theo |

Sau mốc thử nghiệm mới quyết định ưu tiên thu phí, mở rộng kho mẫu hay đầu tư sâu remote/cử chỉ. Chưa ưu tiên thêm model, hiệu ứng kính/3D hoặc cộng tác phức tạp nếu các phần đó không giải quyết trở ngại được người dùng thực tế ghi nhận.

## Kết quả kiểm tra trong lần khảo sát

- `node tests/check_binary_parity.js`: đạt, index và trangchudong giống từng byte.
- `node tests/test_converter_engine.js`: đạt 8/8 nhóm; kiểm tra cấu trúc tệp, chưa xác minh bố cục bằng ứng dụng Office.
- Chạy `runUltraMathTests` với `tệp hệ thống/math-engine.js`: đạt 28/28.
- Tái hiện lỗi ánh xạ dữ liệu Vault bằng đúng đoạn mã lưu/đọc trong môi trường VM, không ghi dữ liệu người dùng.
- Chưa chạy lại toàn bộ E2E/stress, chưa benchmark mô hình AI hoặc kiểm thử thiết bị thật.
- Thư mục hiện tại không được git nhận diện là repository; cần xác định kho mã chuẩn và thiết lập lịch sử/khôi phục trước các đợt sửa lớn.
