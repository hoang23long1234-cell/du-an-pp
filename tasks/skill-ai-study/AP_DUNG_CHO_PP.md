# Áp dụng kiến thức `skill AI` vào PP

Ngày ghi: 30/10/2026. Đây là hướng dẫn chọn nguồn cho công việc tiếp theo, chưa phải các thay đổi đã triển khai vào ứng dụng. Đối chiếu với bản phân tích dự án trong `tasks/phan-tich-huong-di-2026-10-30.md`.

## Chọn nguồn theo nhiệm vụ

| Việc cần làm | Nguồn học chính | Kết quả cần kiểm chứng |
|---|---|---|
| Sửa lỗi mất nội dung khi mở Vault | Superpowers debugging/TDD; code-review-graph | Mọi trường nội dung vẫn giữ sau lưu, tải lại và mở từ Vault |
| Kiểm thử luồng người dùng | Playwright best practices; webapp-testing để tham khảo cách tổ chức | Thao tác thực trên trình duyệt; kiểm tra nội dung, lỗi và trạng thái sau cùng |
| Tinh chỉnh AI Studio/Vault | Impeccable Operate; Cursor UX flows; UI/UX Pro Max | Dễ tìm hành động chính; trạng thái lưu đúng; thao tác bàn phím và mobile hoạt động |
| Thống nhất giao diện | design-system; shadcn để học nguyên tắc component | Một hệ token, các trạng thái nhất quán, không gây xung đột CSS mới |
| Nâng chất lượng xuất PowerPoint | skills-main/pptx; skill slides để học bố cục HTML | Nội dung đủ, tệp mở được, hình ảnh render đúng và đối tượng cần sửa vẫn sửa được |
| Tạo slide từ tài liệu | Qwen RAG demo; PrivateGPT retrieval; RAG diagnostics | Có nguồn cho các ý chính, không lẫn tài liệu giữa tài khoản, xử lý trường hợp không tìm thấy |
| Tối ưu chuyển động | GSAP performance/core; mã hiện tại của PP | Không thêm animation vô hạn ngoài ý muốn; cleanup đúng; đo trên thiết bị mục tiêu |
| Cải thiện điều khiển cử chỉ | MediaPipe HandLandmarker và VisionTaskRunner | Đúng running mode/timestamp; xử lý mất tay/camera; đo FPS và độ trễ thực |
| Tham khảo giao diện trang chủ | frontend-design; taste; awesome-design-md; galaxy | Giữ nhận diện đã chọn; nội dung thật; không làm hỏng đường đến tạo bài |
| Dùng thêm skill/MCP | SkillSpector methodology; MCP builder/spec; Context7 | Đọc mã/phụ thuộc, hiểu dữ liệu ra ngoài, tra đúng phiên bản và chỉ bật công cụ phù hợp |

## Luồng sửa một lỗi ở PP

1. Viết kết quả mong muốn và dữ liệu mẫu, ví dụ một deck có tiêu đề, nội dung, hai concept và ghi chú.
2. Tái hiện bằng luồng thực hoặc hàm thực; ghi dữ liệu đi qua editor, bộ lưu, Vault, bộ nạp và exporter.
3. Tạo ca kiểm tra thất bại vì chính hành vi đó. Không chỉ tìm một chuỗi trong source.
4. Sửa tại nơi làm biến đổi sai dữ liệu; giữ phạm vi nhỏ.
5. Chạy lại ca lỗi và các kiểm tra liên quan. Với giao diện, quan sát trên trình duyệt; với PPTX, kiểm tra cả tệp và bản render.
6. Báo đúng phần đã kiểm chứng và phần chưa chạy. Nếu chỉ kiểm tra logic, không gọi đó là kiểm thử trình duyệt.

## Những quyết định cần giữ nhất quán

- Dữ liệu deck đầy đủ là nguồn chính; bản tóm tắt chỉ phục vụ danh sách. Khi thay schema cần giữ khả năng đọc dữ liệu cũ.
- Quyền sở hữu được kiểm tra ở server theo danh tính đã xác minh; thông tin người dùng trong localStorage không đủ để cấp quyền.
- Phân biệt rõ lưu trên thiết bị, đang đồng bộ, đã đồng bộ và đồng bộ thất bại. Không báo thành công trước khi có kết quả tương ứng.
- Phân biệt suy luận trong tab, suy luận trên máy chủ riêng và gọi cloud. Cơ chế dự phòng cũng cần báo đúng nơi xử lý.
- Giao diện editor phục vụ thao tác; trang chủ phục vụ giới thiệu. Không áp cùng mức chuyển động, độ tương phản thị giác và mật độ cho cả hai.
- Các thành phần native SwiftUI, React/shadcn hoặc server CRM không được đưa vào web HTML chỉ vì có ví dụ đẹp trong kho.
- Chỉ bổ sung dependency khi có nhu cầu cụ thể và xác nhận stack/phiên bản thực tế. Không cài cả framework để giải quyết một lỗi nhỏ.
- Kho tài liệu học và source của 34 repo cần nằm ngoài đầu ra public khi tổ chức lại deployment.

## Hai cấp chất lượng slide

Bản xem trong trình duyệt cần có bố cục dễ đọc, điều hướng, chỉnh sửa và trạng thái tương tác. Bản xuất Office cần thêm font phù hợp, giới hạn hình học, quan hệ OOXML đúng và loại đối tượng phù hợp với yêu cầu chỉnh sửa. Không dùng một bài kiểm tra duy nhất để suy ra cả hai cấp đều đạt.

Khi bài có nhiều chữ, ưu tiên tóm ý/chia slide hoặc đổi bố cục có chủ đích. Không thu nhỏ chữ không giới hạn để làm hết cảnh báo tràn. Không áp công thức canh giữa toàn bộ nội dung từ một skill trình bày marketing vào mọi bài giảng.

## Cách đo AI tạo slide

Dùng một tập đề tiếng Việt cố định có cả chủ đề phổ thông, nội dung dài, dữ liệu số và yêu cầu thiếu thông tin. Chấm riêng: đúng dữ kiện, bám tài liệu nguồn, không bỏ ý quan trọng, cấu trúc slide hợp lệ, tiếng Việt rõ và khả năng sửa sau sinh. Đo thêm thời gian đến kết quả dùng được, tỷ lệ lỗi và chi phí. Chưa thực hiện benchmark này trong lượt học.

Với RAG, gắn nguồn/tài liệu/trang vào dữ liệu trung gian, kiểm tra phạm vi truy cập trước khi truy xuất và có câu trả lời rõ khi nguồn không đủ. Bật web fallback là một lựa chọn sản phẩm riêng, không tự biến dữ liệu nội bộ thành truy vấn bên ngoài.

## Thực hành đã chạy

Công cụ: `skill AI/ui-ux-pro-max-skill-main/.claude/skills/ui-ux-pro-max/scripts/search.py`.

- `--help`: xác nhận tham số thực có trong bản cục bộ.
- `focus not obscured --domain ux -n 2 --json`: trả hai mức hướng dẫn khác nhau; cần đọc kỹ để không trộn mức yêu cầu.
- `error summary validation --domain ux -n 2 --json`: trả hướng dẫn về tóm tắt lỗi có điểm focus và liên kết đến trường sai, cùng phản hồi lỗi được thông báo.
- `chip badge overflow nowrap --stack html-tailwind -n 2 --json`: trả hướng dẫn về wrap bộ nhãn, giới hạn nhãn riêng lẻ và giữ chỗ cho nút.

Cả bốn lệnh thoát 0; đầu ra nằm trong `practical-checks.json`. Đây là xác nhận công cụ tra cứu hoạt động cục bộ, không phải chứng nhận PP đạt các tiêu chí đó. Không bật lưu design system hoặc ghi đè cấu hình ứng dụng.

## Tra lại ở phiên sau

Bắt đầu từ tài liệu này, mở `REPO_MAP.md`, rồi đọc hồ sơ skill và tài liệu nguồn đúng phạm vi trước khi sửa. Khi code hoặc package thay đổi, kết quả kiểm thử cũ chỉ là lịch sử. Không tự coi việc có ghi chú là đã kiểm tra lại phiên bản mới.
