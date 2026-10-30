# Sổ học tập `skill AI` — 30/10/2026

Đây là ghi chú học từ bản tài liệu và mã nguồn đang nằm trong dự án PP. Mục đích là biết chọn đúng kiến thức cho từng việc, hiểu giới hạn của từng bộ và giữ nguồn để tra lại. Đây không phải cài đặt toàn bộ skill, huấn luyện mô hình hay xác nhận đã kiểm chứng mọi công cụ.

## Phạm vi đã thực hiện

- Kiểm kê 34 thư mục cấp đầu và 299 tệp mang tên `SKILL.md`, bỏ qua `.git`, môi trường ảo, node_modules và đầu ra build.
- Đọc tài liệu giới thiệu hoặc mã demo đại diện của cả 34 bộ để xác định chúng là skill, thư viện, ứng dụng, công cụ hay bộ sưu tập.
- Đọc toàn văn 20 hồ sơ skill được chọn theo mức liên quan đến PP, cùng các tài liệu bổ trợ về giao diện vận hành, chất lượng thiết kế và công cụ tìm kiếm UI. Một số lượt xuất nội dung bị cắt đã được đọc bổ sung theo file/đoạn.
- Đọc thêm các đoạn mã và tài liệu về MediaPipe HandLandmarker, RAG với Qwen, pipeline retrieval của PrivateGPT, kiểm thử Playwright, quy tắc UX và Storybook.
- Đọc mã công cụ tìm kiếm UI/UX trước khi thử; chạy `--help` và ba truy vấn cục bộ, cả bốn lệnh trả mã thoát 0. Không bật `--persist`, không cài thêm dependency và không thay đổi giao diện PP.
- Chưa đọc toàn văn mọi file nguồn trong 34 repository, chưa chạy toàn bộ ứng dụng/model, chưa chạy quét bảo mật toàn kho. Các phần chỉ được lập chỉ mục không được coi là đã học sâu.

## Bản đồ để đọc tiếp

- [Bản đồ 34 bộ](REPO_MAP.md): chức năng, mức liên quan và giới hạn áp dụng.
- [Cách áp dụng vào PP](AP_DUNG_CHO_PP.md): tình huống cụ thể, tiêu chí kiểm chứng và thứ tự làm việc.
- [Kiểm kê](inventory.json): thư mục, số tệp và đường dẫn tài liệu.
- [Danh mục 299 tệp skill](skill-catalog.json): tên, mô tả, tiêu đề, độ dài, hash và đánh dấu test/example theo đường dẫn.
- [Nhật ký đọc](read-log.json): nguồn và các dòng được yêu cầu hiển thị qua công cụ đọc; đây là nhật ký thao tác, không phải bằng chứng hiểu toàn bộ tệp. Có thể có lượt đọc lặp.
- [Kết quả thực hành](practical-checks.json): câu lệnh, đầu ra và mã thoát của công cụ tra cứu UI/UX.
- [Phạm vi và nguồn bổ sung](COVERAGE.md): phân biệt đọc sâu, đọc chọn lọc và kiểm kê.

## 1. Skill là hướng dẫn thao tác, không phải một mô hình mới

`skills-main` cho thấy một skill thường có metadata để xác định khi dùng, phần hướng dẫn, tài liệu tham chiếu và script. Đọc metadata giúp tìm đúng skill; muốn dùng thật còn phải đọc phần quy trình, file tham chiếu và kiểm tra khả năng của môi trường.

`superpowers-main` là phương pháp tổ chức công việc: làm rõ kết quả cần đạt, lên kế hoạch, thực hiện từng phần và kiểm chứng. Các hướng dẫn nội bộ của Qwen Code, Storybook, Twenty hoặc Playwright có nhiều phần dành cho chính việc phát triển repository của họ; không tự biến thành quy tắc chung cho PP.

MCP là giao thức kết nối công cụ/tài nguyên/ngữ cảnh. Nó không tự làm AI thông minh hơn, không thay thế xác thực và cũng không phải mô hình ngôn ngữ. `github-mcp-server-main` là một triển khai cụ thể cho GitHub; `context7-master` phục vụ tra tài liệu; không phải cứ có mã nguồn của chúng là phiên hiện tại có công cụ đang hoạt động.

## 2. Sửa lỗi bằng bằng chứng

Từ `systematic-debugging`: bắt đầu bằng tái hiện, lần theo dữ liệu qua từng ranh giới, so sánh với trường hợp hoạt động và thử một giả thuyết mỗi lần. Một bản vá không thể được coi là đúng chỉ vì hết thông báo lỗi.

Từ `test-driven-development`: với lỗi logic hoặc hành vi, ca kiểm thử phải thể hiện kết quả người dùng cần và phải phát hiện được lỗi trước khi sửa. Test hỏng vì import/thiết lập không tương đương test đã tái hiện đúng lỗi.

Từ `verification-before-completion`: kết luận cần gắn với lệnh đã chạy, phạm vi và đầu ra. Kiểm tra một module không chứng minh toàn hệ thống; số lượng ca đạt không thay thế chất lượng của các ca đó.

Từ `code-review-graph`: bản đồ phụ thuộc giúp thu hẹp vùng đọc và xác định phần có thể bị ảnh hưởng. Nó không thay thế mã nguồn hoặc test, và các con số tiết kiệm token trong README không phải bảo đảm cho PP.

## 3. Kiểm thử trình duyệt phải quan sát hành vi

Playwright cung cấp cách tìm phần tử qua vai trò/nhãn, chờ khả năng tương tác, assertion có retry, context riêng cho mỗi test và trace để chẩn đoán thất bại. Các nguyên tắc này phù hợp cho kiểm tra lưu/mở lại dự án và phân quyền giữa hai tài khoản.

Điểm đã đối chiếu: `skills-main/skills/webapp-testing/SKILL.md` khuyên chờ `networkidle` và có ví dụ chờ thời gian cố định; tài liệu API Playwright trong cùng kho lại khuyên dùng assertion để xác định sẵn sàng và chỉ dùng timer cho debug. Với PP có SSE/chat và kết nối dài, nên chờ điều kiện cụ thể như slide xuất hiện, trạng thái lưu đổi hoặc request cần thiết hoàn thành. Không áp nguyên ví dụ mẫu.

Storybook giúp kiểm tra trạng thái component độc lập. Nó có giá trị khi PP đã tách component; chưa phải lý do để đổi toàn bộ ứng dụng HTML hiện tại sang framework khác. Các skill release/canary nội bộ của Storybook không phải quy trình release của PP.

## 4. Thiết kế theo công việc của người dùng

Impeccable phân biệt các bề mặt thuyết phục, vận hành, đọc và trải nghiệm. AI Studio/Vault thuộc nhóm vận hành: ưu tiên thao tác quen thuộc, trạng thái nhất quán, phản hồi đúng và hạn chế trang trí cản trở công việc. Trang chủ có thể dùng ngôn ngữ hình ảnh mạnh hơn.

UI/UX Pro Max cung cấp dữ liệu tra cứu theo vấn đề, domain và stack. Cần kiểm tra kết quả có đúng loại vấn đề hay không; kết quả rỗng phải được báo rõ. Dữ liệu gợi ý không thay thế kiểm chứng trên giao diện thật hoặc tài liệu chính thức khi triển khai.

Ba lớp token trong `design-system`: giá trị gốc → tên theo mục đích → token của component. Điều này giúp kiểm soát light/dark, trạng thái và sự nhất quán tốt hơn việc rải giá trị màu, khoảng cách khắp HTML.

Taste và frontend-design hữu ích cho định hướng thị giác, nhưng không phải quy định kỹ thuật tuyệt đối. Taste v2 tự giới hạn vào landing/portfolio/redesign; không dùng toàn bộ công thức đó cho editor nhiều bước. PP đang có phong cách Liquid Glass; việc tinh chỉnh không đồng nghĩa tự ý thay nhận diện.

## 5. Chuyển động phải có vòng đời và chi phí đo được

GSAP performance nhấn mạnh chọn thuộc tính ít gây layout khi phù hợp, gom thao tác đọc/ghi DOM, tái sử dụng animation và dọn chúng khi rời màn hình. Không tạo timeline hoặc tween mới ở mỗi frame chỉ để cập nhật một vị trí.

Với PP, ưu tiên phản hồi chọn slide, mở panel, lưu và chuyển trang. Chỉ thêm thư viện animation nếu hành vi cần đến nó; CSS/WAAPI hiện có có thể đã đủ. Blur, backdrop-filter, số lớp và camera inference đều cần thử trên thiết bị mục tiêu; không hứa tốc độ chỉ dựa vào tên kỹ thuật.

MediaPipe HandLandmarker trong source có `detect` cho ảnh và `detectForVideo` cho video; đường video nhận timestamp theo mili giây và kiểm tra running mode. Lời gọi xử lý chờ kết quả đồng bộ trong API đã đọc, nên phải cân nhắc công việc trên luồng giao diện, nhịp xử lý và giải phóng tài nguyên. Chưa đo FPS/camera thật trong lần học này.

## 6. Slide HTML và PPTX có hai hợp đồng khác nhau

Skill `slides` trong UI/UX Pro Max hướng tới HTML presentation với design token và Chart.js. Skill `pptx` trong `skills-main` hướng tới tệp Office, cấu trúc OOXML và kiểm chứng đầu ra. Một biểu đồ đẹp trên canvas không tự trở thành biểu đồ PowerPoint chỉnh sửa được.

Tệp PPTX cần kiểm tra ít nhất ba mặt: nội dung, cấu trúc và hình ảnh đã render. Tệp ZIP/XML hợp lệ vẫn có thể sai font, tràn chữ hoặc chứa biểu đồ mà PowerPoint xử lý khác. Kiểm tra cần áp dụng cho đúng phiên bản thư viện PP đang dùng; các lỗi API cụ thể trong skill chỉ là đầu mối cần xác nhận.

Bài học cho PP: lưu cấu trúc dữ liệu deck đầy đủ làm nguồn chính; preview và exporter cùng đọc cấu trúc đó. Không để thông tin quan trọng chỉ tồn tại trong DOM, CSS hoặc bản tóm tắt danh sách dự án.

## 7. AI dựa trên tài liệu cần pipeline và phép đo

Ví dụ Qwen local RAG cho thấy các bước tách biệt: nạp PDF/URL, chia đoạn, embedding, truy xuất, lựa chọn nguồn và sinh câu trả lời. Metadata giúp truy ngược nguồn. Tuy nhiên ví dụ này là demo; collection chung và cơ chế web fallback không thể bê nguyên vào ứng dụng nhiều người dùng.

PrivateGPT trong bản đang có là lớp API/pipeline phía trên inference server tương thích, không phải chính runtime chạy model. Đây là khác biệt cần giữ rõ khi thiết kế kiến trúc.

RAG Failure Diagnostics Clinic chia lỗi thành các nhóm hữu ích: truy xuất sai, cắt đoạn sai, embedding không khớp, index cũ, định tuyến sai, mất ràng buộc qua nhiều bước, dùng tool sai, lẫn bộ nhớ phiên, thiếu bài đánh giá, sai thứ tự khởi động, lệch cấu hình và giao thoa giữa người dùng. Đây là từ vựng chẩn đoán, không phải chứng minh rằng chạy LLM phân loại sẽ tự sửa được pipeline.

Đối với PP, nên đo riêng độ chính xác nội dung, mức bao phủ tài liệu nguồn, cấu trúc JSON, thời gian và chi phí trước khi thêm model hoặc framework. Nạp prompt, lưu chat, tìm kiếm RAG và huấn luyện/fine-tuning là các cơ chế khác nhau.

## 8. Những hướng dẫn cần lọc hoặc không áp dụng

- Một số hướng dẫn redesign gợi ý làm số liệu/ngày tháng trông tự nhiên hơn. Không dùng cách này cho dữ liệu sản phẩm; dữ liệu mẫu phải được nhận diện rõ, số liệu thực phải có nguồn.
- Quy tắc cấm một font, bắt buộc thêm texture, bắt buộc canh giữa hoặc bắt buộc thêm animation là sở thích/ngữ cảnh của từng bộ. Chọn theo nội dung và yêu cầu người dùng.
- Các hồ sơ SwiftUI dành cho ứng dụng native Apple, không điều khiển cách viết HTML/CSS cho web.
- shadcn/ui cung cấp mã component cho hệ sinh thái tương ứng; tên `tailwind-shadcn` của thư mục PP không đủ chứng minh dự án đang dùng đúng shadcn/ui và API React trong kho.
- README `opencode-main` tại bản cục bộ tự ghi đã lưu trữ và chuyển dự án. Không dùng tên thư mục để suy ra đây là một sản phẩm khác cùng tên hoặc phiên bản đang được duy trì.
- Các tool nghiên cứu gần đây, cloud browser, GitHub automation, pentest và tạo ảnh có cấu hình, quyền truy cập và phụ thuộc riêng. Đọc tài liệu không đồng nghĩa đã cài hoặc được phép chạy mọi tác vụ của chúng.

## 9. Đọc kho skill có chọn lọc

Kiểm kê phát hiện 33 tệp trùng nội dung theo SHA-256 ngoài bản đầu, 38 đường dẫn thuộc test/fixture/example và 14 tệp một dòng chuyển hướng của Storybook. Có nhiều bản khác nhau giữa các harness và thư mục repo bị lồng. Các con số này có thể chồng lấp; không dùng để suy ra số kỹ năng độc lập.

Các fixture cố ý có nội dung nguy hiểm được coi là dữ liệu kiểm thử, không nạp làm hướng dẫn hoạt động. Phương pháp SkillSpector đáng học là phối hợp dấu hiệu tĩnh với việc đọc ngữ nghĩa và kiểm tra hành vi có phù hợp mục đích hay không. Lần này chưa chạy scanner và không kết luận toàn kho an toàn.

Giấy phép cũng không đồng nhất. `skills-main` phân biệt phần mã mở và phần source-available; tài liệu PPTX và `cursor-rules-and-prompts-main` có điều khoản riêng trong tệp LICENSE. Ghi chú này tóm tắt nguyên tắc chung, không sao chép bộ skill để tái phân phối. Khi thực sự tích hợp mã/tài nguyên, cần kiểm tra đúng giấy phép của phần đó.

## Cách dùng ghi chú ở phiên sau

Đọc `AP_DUNG_CHO_PP.md`, xác định việc đang làm, rồi mở đúng nguồn được chỉ ra. Đọc lại phiên bản thư viện và file hiện tại trước khi thay đổi. Ghi chú giúp khôi phục ngữ cảnh; nó không tự tạo bộ nhớ vô hạn hoặc tự kích hoạt tất cả skill cho mọi yêu cầu.
