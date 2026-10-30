# Bản đồ 34 bộ trong `skill AI`

Ngày khảo sát: 30/10/2026. `Sâu` nghĩa là đã đọc các hồ sơ và/hoặc đoạn mã chọn lọc liên quan, không phải toàn bộ repository. `Tổng quan` nghĩa là đọc tài liệu giới thiệu/khả năng; chưa kiểm chứng runtime. `SKILL.md` trong test/example hoặc dành cho nội bộ repo không được tự áp cho PP.

| Bộ | Bản chất và giá trị | Mức đọc | Cách dùng phù hợp cho PP |
|---|---|---|---|
| awesome-design-md-main | Bộ tham chiếu ngôn ngữ hình ảnh và DESIGN.md | Tổng quan | Học cách ghi màu, chữ, bố cục; chọn theo nhận diện đã có |
| awesome-llm-apps-main | Bộ sưu tập ứng dụng/agent/RAG và một số skill | Sâu chọn lọc | Học pipeline RAG, phân loại lỗi và kiểm soát phạm vi; demo cần thích nghi |
| awesome-python-master | Danh mục thư viện Python; skill nội bộ để quản lý danh mục | Tổng quan | Tìm ứng viên theo nhu cầu; danh sách không thay đánh giá package |
| browser-use-main | Agent và công cụ điều khiển trình duyệt, có lựa chọn local/cloud | Tổng quan | Tham khảo browser automation; khác với bộ test hồi quy xác định |
| code-review-graph-staging | Graph cấu trúc mã, phân tích ảnh hưởng và MCP | Sâu chọn lọc | Thu hẹp vùng review/refactor; vẫn phải đọc mã và test |
| ComfyUI-master | Engine/workflow tạo nội dung bằng đồ thị node | Tổng quan | Tham khảo tạo ảnh/minh họa sau này; có model/GPU và API riêng |
| context7-master | Tra cứu tài liệu thư viện theo câu hỏi/phiên bản | Sâu chọn lọc | Tìm đúng tài liệu trước khi dùng API; source có sẵn không có nghĩa server đã kết nối |
| cursor-designer-main | Quy tắc UX/UI/IA và accessibility | Sâu chọn lọc | Trạng thái hệ thống rõ, phục hồi lỗi, progressive disclosure |
| cursor-rules-and-prompts-main | Bộ quy tắc/prompt cho Cursor | Tổng quan + LICENSE | Học cách tổ chức ngữ cảnh; có điều khoản riêng, không tự sao chép/cài đồng bộ |
| galaxy-main | Bộ sưu tập thành phần UI từ Uiverse | Tổng quan | Tìm mẫu tương tác; cần kiểm tra semantic, focus, hiệu năng và nguồn trước khi dùng |
| github-mcp-server-main | MCP server kết nối GitHub | Tổng quan | Công cụ cho quản lý mã/PR khi có nhu cầu và quyền phù hợp; không phải tính năng slide |
| gsap-skills-main | Các skill về GSAP core, timeline, plugin, framework và hiệu năng | Sâu chọn lọc | Vòng đời animation, batching, cleanup, reduced motion; không mặc định cần thêm GSAP |
| HTMLHint-main | Công cụ lint HTML, repo nằm trong thư mục lồng | Tổng quan | Bổ sung kiểm tra HTML; lint không chứng minh UX hoặc accessibility đầy đủ |
| impeccable-main | Hướng dẫn thiết kế, nhiều playbook và detector | Sâu chọn lọc | Phân biệt bề mặt giới thiệu/vận hành; giữ tính nhất quán của editor |
| invisible_playwright_mcp-main | Browser agent/MCP với cách triển khai và browser riêng | Tổng quan | Biết khả năng và phụ thuộc; không cần cho kiểm thử PP cơ bản |
| langchain-master | Framework ghép model, tool, retriever và agent | Tổng quan | Học ranh giới thành phần; chỉ thêm orchestration khi pipeline cần đến |
| last30days-skill-main | Quy trình nghiên cứu nhiều nguồn gần đây | Tổng quan | Nghiên cứu thị trường khi có yêu cầu; độ phổ biến không chứng minh đúng kỹ thuật |
| liquid-high-fidelity | Demo HTML/CSS/video, không có SKILL.md | Đọc chọn lọc mã demo | Tham chiếu vật liệu, token, theme; phải đo chi phí hiệu ứng và bảo đảm khả dụng |
| mediapipe-master | Thư viện ML on-device, Tasks và framework | Sâu chọn lọc mã | Đúng chế độ ảnh/video, timestamp, vòng đời và nhịp inference cho 3dtouch |
| modelcontextprotocol-main | Đặc tả, schema và tài liệu MCP | Tổng quan + MCP builder ở bộ skills | Hiểu giao thức; phải xác nhận bản đặc tả được client/server hỗ trợ khi tích hợp |
| opencode-main | Bản Go CLI/TUI agent tự ghi đã archived/chuyển dự án | Tổng quan | Học session/tool abstraction; không nhầm với sản phẩm khác cùng tên |
| playwright-main | Framework tự động hóa và kiểm thử web | Sâu chọn lọc tài liệu | Test hành vi, context riêng, locators, assertion, trace; tránh chờ thời gian tùy tiện |
| private-gpt-main | Lớp API/workflow cho AI riêng trên inference server | Sâu chọn lọc mã | Tách retrieval, postprocess và nguồn trích dẫn; không nhầm nó với runtime model |
| qwen-code-main | Coding agent nhiều giao diện, có skill hệ thống và nội bộ | Tổng quan + danh mục skill | Tham khảo tổ chức phiên/tool; Qwen Code không phải model Qwen |
| skills-main | Bộ skill mẫu, tài liệu và script; điều khoản từng phần khác nhau | Sâu chọn lọc | Đọc frontend-design, webapp-testing, pptx, mcp-builder; kiểm tra môi trường/giấy phép |
| SkillSpector-main | Scanner và phương pháp rà soát skill | Sâu chọn lọc | Phân biệt phát hiện tĩnh và kết luận ngữ nghĩa; fixture không phải skill để kích hoạt |
| storybook-next | Workshop component và hệ sinh thái kiểm thử/tài liệu | Sâu chọn lọc | Học state coverage và đưa bài học vào cơ chế kiểm tra; chưa cài vào PP |
| strix-main | Nền tảng/agent kiểm thử bảo mật có phạm vi và cấu hình riêng | Tổng quan | Tham khảo quy trình rà soát; chưa chạy pentest hoặc gửi code ra ngoài |
| superpowers-main | Phương pháp phát triển bằng các skill có quy trình | Sâu chọn lọc | Tái hiện, tìm nguyên nhân, test hồi quy, kiểm chứng rồi mới kết luận |
| SwiftUI-Agent-Skill-main | Hướng dẫn native SwiftUI, state và profiling | Sâu hồ sơ chính | Biết phạm vi native; không dùng API SwiftUI vào web HTML |
| taste-skill-main | Nhiều hướng thiết kế, redesign và tham chiếu tạo ảnh | Sâu chọn lọc | Tách trang quảng bá khỏi editor; lọc quy tắc thẩm mỹ và không bịa dữ liệu |
| twenty-main | CRM lớn, SDK/app và skill nội bộ riêng | Tổng quan + danh mục skill | Tham khảo ranh giới module; không bê kiến trúc CRM hoặc skill migration nội bộ vào PP |
| ui-main | shadcn/ui và skill quản lý component theo stack | Sâu hồ sơ chính | Semantic token, cấu trúc component và preview diff; không coi tên thư mục PP là bằng chứng dùng React/shadcn |
| ui-ux-pro-max-skill-main | Cơ sở hướng dẫn tra cứu UI/UX, design system, slides và script | Sâu + thực hành local | Tra theo vấn đề/stack, đọc kết quả, áp phù hợp; dùng token có mục đích |

## Cấu trúc thư mục cần nhớ

- `HTMLHint-main/HTMLHint-main/` mới là root source của HTMLHint trong bản này.
- `liquid-high-fidelity/liquid-high-fidelity-html/` chứa demo.
- SwiftUI, UI/UX Pro Max và GitHub MCP có các bản lồng bên trong; cần xác định bản chuẩn trước khi chỉnh sửa hoặc cài.
- Impeccable có các biến thể cho nhiều agent; một số khác nhau về đường dẫn/chỉ dẫn harness dù cùng tên.
- Storybook có 14 tệp `SKILL.md` chỉ là dòng `@...` trỏ sang file khác. Chúng không phải hồ sơ độc lập bị thiếu toàn bộ nội dung.
- Nhãn test/example trong danh mục được suy ra từ đường dẫn. Đó là cách phân loại hỗ trợ tra cứu, không phải một cuộc đánh giá bảo mật.
