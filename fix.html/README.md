# Dự án SlideVault (pp) — Hệ sinh thái trình diễn & bảo mật

Kho lưu trữ gồm hai hệ thống phối hợp:

| Thư mục | Nội dung |
|---------|----------|
| **`3dtouch/`** | SlideVault 3D Touch v2 — điều khiển bằng cử chỉ (MediaPipe Tasks Vision), bàn tay 3D, **AirShare** chia sẻ file/folder/PowerPoint kiểu Huawei bằng cử chỉ, server PeerJS/PIN/QR + relay dự phòng |
| **`fix.html/`** | SlideVault Web v1.1 — trang chủ + quản trị + trung tâm bảo mật + AI Studio + bảng giá, giao diện **Liquid Glass**, SEO, nén gzip, đa nền tảng |

> Ghi chú học tập thư mục `skill AI/` (17 dự án tham khảo): [`GHI_CHU_SKILL_AI.md`](GHI_CHU_SKILL_AI.md)

---

## 1. Chạy nhanh

### Web (`fix.html`)

```bash
cd fix.html
node server.js          # http://localhost:3000   (hoặc nhấp đôi start.bat)
```

Chỉ cần Node 18+ (đã có `express`); **multer và mọi dependency khác đều không bắt buộc** — server tự dùng bộ phân tích multipart nội bộ. Đặt `GROQ_API_KEY` để bật AI trả lời thật.

### 3D Touch (`3dtouch`)

```bash
node 3dtouch/server.ts           # Node 22.6+ (khuyến nghị Node 24 — chạy TS trực tiếp)
# hoặc: npm run touch:server     # nếu dùng tsx
```

Mở `http://<IP-LAN>:9000/3dtouch/tutorial.html` để xem hướng dẫn + bàn tay 3D, `/3dtouch/share.html` để thử AirShare, `/3dtouch/phone.html` cho điện thoại.

---

## 2. Kiểm thử tự động

```bash
node kiem_thu_web.js        # 26 bài: HTTP trang/API, chặn tệp nhạy cảm, upload multipart, nén gzip…
node kiem_thu_3dtouch.js    # 17 bài: health, WebRTC config, relay chia sẻ file, PIN phòng, trang mới…
```

Cả hai script tự khởi động server trong tiến trình con rồi tự tắt, không cần bật sẵn.

**Kết quả lần chạy gần nhất:** `kiem_thu_web.js` 26/26 đạt · `kiem_thu_3dtouch.js` 17/17 đạt.

---

## 3. Đối chiếu yêu cầu đã hoàn thành

### 3D Touch (PC & điện thoại)

- **Tối ưu lấy nét**: ladder độ phân giải + `focusMode: continuous` + zoom quang (`vision-engine.js`).
- **Tối ưu xử lý**: GPU delegate có fallback CPU, nhịp suy luận thích ứng 30→12 FPS, tiết kiệm pin theo `getBattery`, tạm dừng khi tab ẩn.
- **Động tác giống người**: One-Euro filter + FSM cử chỉ có hold/hysteresis/vận tốc thật/cooldown.
- **Bàn tay 3D + hướng dẫn**: `tutorial.html` (bàn tay 3D Three.js, 5 động tác demo, camera thật, video minh họa có fallback), `hand3d.js`.
- **Chia sẻ kiểu Huawei**: `gesture-share.js` + `share.html` — nắm tay cầm file, ném/chạm chip thiết bị để gửi; chunk 16KB có backpressure; folder nhiều file; relay dự phòng `/api/share/relay`.
- **Hạ tầng**: relay RAM TTL 30 phút (tối đa 50MB/file), ICE mở rộng, QR/PIN giữ nguyên.

### Web (`fix.html`)

- **Sửa lỗi nghiêm trọng**: tạo lại các trang từng thiếu (`trangchudong.html`, `service-admin.html`, `security.html`, `dangnhap/dangki/khoiphuctaikhoan`, `shop.html`, `AI.html`) — trước đây server trỏ tới các tệp không tồn tại.
- **Giao diện**: sidebar kính lỏng (blur + saturate + highlight, fallback `@supports`), icon SVG, animation tinh tế, tôn trọng `prefers-reduced-motion`.
- **Đa thiết bị**: PC ≥1040px sidebar đầy đủ; iPad thu gọn icon; iPhone dock dưới + `safe-area-inset` + `100dvh`.
- **Đa trình duyệt**: `-webkit-backdrop-filter` + fallback nền đặc, không dùng API thử nghiệm, WebAPI đều có feature-detect.
- **Tối ưu & SEO**: nén gzip/brotli (trang + asset), `robots.txt`, `sitemap.xml`, favicon SVG, meta OG, JSON-LD.
- **Bảo mật**: chặn tải `server.js`/`package.json`/log/`.py`/`.bat`, API 404 JSON, CSP + security headers.
- **Sẵn sàng deploy**: hướng dẫn Google Cloud Run / Render / Railway trong `fix.html/README.md`.

---

## 4. Cấu trúc nhanh

```
dự án pp/
├─ 3dtouch/            # hệ điều khiển cử chỉ + AirShare (+ HUONG_DAN_3DTOUCH.md)
├─ fix.html/           # web + API bảo mật (+ README.md, assets/site.css, assets/site.js)
├─ GHI_CHU_SKILL_AI.md # ghi chú 17 dự án trong skill AI/
├─ kiem_thu_web.js     # tự kiểm thử web
└─ kiem_thu_3dtouch.js # tự kiểm thử 3D Touch
```
