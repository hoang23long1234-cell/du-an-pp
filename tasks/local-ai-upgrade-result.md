# Nâng cấp đường chạy AI local — 30/10/2026

Đã thay đổi mã, chưa triển khai ra ngoài máy.

## Thay đổi

- Thêm `server AI/local_service.py`: hợp đồng suy luận local dùng chung, lịch sử hội thoại, tài liệu đầu vào có giới hạn, kiểm tra dữ liệu slide và lỗi rõ ràng.
- Hỗ trợ model Ollama đã có trên máy qua địa chỉ loopback cố định; không tải model tự động. Chặn tên model cloud ở đường local.
- ONNX kiểm tra header, khóa suy luận để các yêu cầu không lẫn cache, nhận ngữ cảnh hội thoại, kiểm tra độ dài và đo token từ bộ sinh thực.
- API chat/SSE/generate-slides kết nối dịch vụ trên; SSE chạy worker riêng, hàng đợi có giới hạn và hủy khi client ngắt.
- Node chuyển các yêu cầu chat local đến Python, trả lỗi thay vì giả lập streaming khi Python không chạy. Có endpoint trạng thái và danh sách model Ollama cục bộ.
- UI mặc định chọn máy chủ local; không tự tải model vào trình duyệt. Khóa hai lựa chọn artifact không hợp lệ, sửa cache khi chuyển model, sửa dtype Qwen q8, hiển thị model/provider/số đo thực và thêm nút Dừng.
- Bổ sung dependency còn thiếu trong requirements.

## Kiểm chứng

- 13 test dịch vụ: đạt.
- 5 test API qua ASGI TestClient với engine thay thế: đạt. Đây là kiểm tra tích hợp API, không phải 5 bài suy luận model thật.
- Node server syntax: đạt; các script inline trong AI.html đã parse thành công ở lượt kiểm tra trước thay đổi cuối chỉ liên quan Python/Node.
- Trạng thái HTTP qua Python và Node đã trả 200, đúng Qwen nạp, hai artifact placeholder bị đánh dấu không hợp lệ.
- Model thực đã sinh qua dịch vụ mới: 4 token, provider CPU, khoảng 0,68 token/giây trong phép thử ngắn; log ở local-ai-upgrade-runtime.json. Phép thử này không chứng minh chất lượng câu trả lời tốt.
- SHA-256 model Qwen khớp LFS của nguồn chính thức; tokenizer.json và tokenizer_config.json khớp nguồn. Không thay trọng số. Artifact quantized q8 từng được đặt tên q4; trình duyệt đã được sửa chọn dtype phù hợp.

## Giới hạn còn lại

- Qwen 0.5B vẫn yếu trong các câu thử. Chưa nâng lên model lớn hơn hoặc huấn luyện model.
- Ollama chưa được phát hiện trong PATH; đường Ollama đã kiểm tra bằng mock, chưa chạy với một model Ollama thật.
- Kiểm tra giao diện đã thấy model không hợp lệ bị khóa, nhưng lượt xác nhận cuối cùng bị Browser timeout. Cần kiểm tra lại nút Dừng, metadata và luồng slide trên trình duyệt sau khi mở lại dịch vụ.
- Lượt thử SSE dài bị timeout; đã dừng tiến trình Python thử nghiệm. Không hứa hiệu năng khi chưa benchmark lại trên phần cứng mục tiêu.
- Các endpoint lệnh chuyên biệt/bridge cũ ngoài đường chat local được nâng cấp vẫn cần một đợt rà soát riêng; chưa coi mọi nhãn trong toàn dự án đã được sửa.

## Chạy lại

Từ thư mục gốc, chạy Python và web server ở hai terminal:

```powershell
python -m uvicorn AI:app --app-dir "server AI" --host 127.0.0.1 --port 8001 --lifespan off
```

```powershell
$env:SV_BIND_HOST="127.0.0.1"
$env:SV_DISABLE_PORT80="1"
node "fix.html/server.js"
```

Mở http://127.0.0.1:3000/AI.html và chọn Máy chủ local. `--lifespan off` dùng cho kiểm chứng suy luận độc lập, không khởi động vòng tự cập nhật kiến thức cũ.

Bản sao trước sửa: `tasks/local-ai-upgrade-backup/`. Thư mục chưa có git repository; không tạo commit.
