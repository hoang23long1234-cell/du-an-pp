# SlideVault 3D Touch · Hướng dẫn hệ thống (v2 — 04/2026)

> Nâng cấp toàn diện: tối ưu lấy nét PC & điện thoại, hiệu năng thích ứng,
> cử chỉ giống người thật, bàn tay 3D + trang hướng dẫn có video, và
> **AirShare** — chia sẻ file kiểu Huawei bằng cử chỉ.

---

## 1. Chạy hệ thống

```bash
# Từ thư mục gốc dự án
npm install
npm run touch:server        # Server điều phối + PeerJS + QR + relay  (mặc định cổng 9000)
```

Mở các trang (server tự phục vụ thư mục `/3dtouch`):

| Trang | Đường dẫn | Việc gì |
|-------|-----------|---------|
| Motion Lab | `/3dtouch/dieukhien.html` | Điều khiển máy tính bằng cử chỉ (camera máy tính hoặc webcam điện thoại) |
| Điện thoại | `/3dtouch/phone.html` | Điện thoại làm remote: trackpad, gõ chữ, truyền webcam P2P |
| Hướng dẫn | `/3dtouch/tutorial.html` | **Bàn tay 3D minh họa + video + 4 bước sử dụng + hướng dẫn AirShare** |
| AirShare | `/3dtouch/share.html` | **Chia sẻ file/folder/PowerPoint bằng cử chỉ giữa các máy** |

Biến môi trường hữu ích:

- `SV_TOUCH_PORT` — đổi cổng server (mặc định 9000)
- `SV_TURN_URL` + `SV_TURN_USERNAME` + `SV_TURN_CREDENTIAL` — thêm TURN cho mạng bị chặn P2P
- `SV_TLS_KEY_PATH` / `SV_TLS_CERT_PATH` hoặc `SV_TLS_PFX_PATH` — bật HTTPS (bắt buộc để **dùng camera trên điện thoại**)
- `SV_PUBLIC_URL` — URL công khai khi server nằm sau reverse proxy

---

## 2. Nâng cấp mới cho PC & điện thoại

### 2.1 Tối ưu LẤY NÉT (`vision-engine.js`)

- `getUserMediaOptimized()` thử **ladder độ phân giải** 1280×720 → 960×540 → 640×480, luôn xin `focusMode: 'continuous'`.
- `tuneFocus(track)` đọc `getCapabilities()` và áp `advanced: [{ focusMode: 'continuous' }]`, kèm **zoom quang** nếu thiết bị hỗ trợ — nét liên tục khi người di chuyển.
- Trang hướng dẫn hiển thị rõ trạng thái “lấy nét liên tục ✓”.

### 2.2 Tối ưu XỬ LÝ

- **GPU delegate** (MediaPipe Tasks Vision) tự fallback **CPU** nếu máy không hỗ trợ.
- **Nhịp suy luận thích ứng**: máy yếu tự thưa nhịp (30 → 22 → 15 → 12 FPS) theo thời gian suy luận thực tế.
- **Tiết kiệm pin**: `navigator.getBattery()` hạ nhịp khi pin < 20% và không sạc.
- Tự **tạm dừng khi tab bị ẩn**; mọi frame lỗi đều bị bắt để không vỡ vòng lặp.
- Thống kê realtime: FPS, ms suy luận, loại delegate.

### 2.3 Cử chỉ GIỐNG NGƯỜI THẬT

- **One-Euro filter** làm mượt điểm bàn tay: chậm thì mượt như tay người, nhanh thì bám tức thì.
- **FSM cử chỉ** (máy trạng thái) có: giữ-thời-gian (nắm 0.14s mới tính là cầm), **hysteresis** chống rung, **vận tốc thật** (đơn vị/giây) cho vuốt/ném, **cooldown riêng** từng hành động.
- Bộ cử chỉ: `move` (con trỏ), `click` (chụm ngón cái + trỏ), `swipe` (xòe vuốt ngang/dọc), `grab` (nắm giữ), `release` (thả), `air-drop` (ném về phía camera), `lost` (mất tay).

### 2.4 Đo khoảng cách & khóa người

- Pose Landmarker ước lượng **cự ly vàng 85–115cm** từ bề rộng vai; cảnh báo lệch cự ly.
- `SpatialCoreEngine` giữ nguyên API cũ, bổ sung `OneEuroFilter`, `computeMotionVelocity()`, `optimizeCameraTrack()`.

---

## 3. AirShare — chia sẻ kiểu Huawei bằng cử chỉ

### 3.1 Cách dùng nhanh (không cần camera)

1. Mở `/3dtouch/share.html` trên máy A.
2. Bấm **“Mở tab khác (thử ngay)”** để mô phỏng máy B (hoặc kết nối điện thoại qua PIN/QR).
3. Chọn file/folder/PPT → nắm/“Cầm” rồi thả vào chip thiết bị đích → file bay sang máy B, máy B rung + tự tải.

### 3.2 Chia sẻ bằng CỬ CHỈ (đưa tay là xong)

1. Bật **“Điều khiển bằng cử chỉ”** (camera máy này hoặc webcam điện thoại P2P).
2. Chỉ tay vào thẻ file → **nắm tay** (giữ 0.14s) → thẻ sáng lên: file đã “dính” vào tay.
3. Chỉ vào chip thiết bị đích rồi **mở tay** (hoặc xòe đẩy về phía camera) → file bay sang máy nhận.

### 3.3 Kỹ thuật bên trong

- Truyền **P2P WebRTC datachannel** theo từng chunk 16KB, có **backpressure** (chờ khi `bufferedAmount` > 4MB) nên không tràn kênh.
- **Folder** = danh sách nhiều file gửi tuần tự; **PowerPoint** nhận về mở ngay qua URL cục bộ.
- **Dự phòng relay**: khi P2P bị chặn, `POST /api/share/relay` → `PUT` dữ liệu → trả link tải (RAM, TTL 30 phút, tối đa 50MB/file).
- **Nhận diện thiết bị**: `BroadcastChannel` cho cùng trình duyệt, PeerJS cho máy khác (HELLO handshake).
- Hiệu ứng: `flyTo()` (WAAPI) bay thẻ file + pulse chip đích + rung khi nhận.

---

## 4. Cấu trúc tệp mới

```
3dtouch/
├── vision-engine.js     # Engine MediaPipe Tasks Vision v2 (lấy nét, hiệu năng, cử chỉ)
├── hand3d.js            # Bàn tay 3D phát sáng (Three.js) — demo + live
├── gesture-share.js     # AirShare: FileTransfer + ShareSession + hiệu ứng
├── tutorial.html        # Trang hướng dẫn (bàn tay 3D + video minh họa)
├── share.html           # Trang AirShare (chọn file, thiết bị, cử chỉ, nhật ký)
├── 3d.ts                # + OneEuroFilter, computeMotionVelocity, optimizeCameraTrack
└── server.ts            # + /api/share/relay (fallback), ICE mở rộng
```

Video minh họa: đặt tệp `3dtouch/assets/tutorial-3dtouch.mp4` — trang hướng dẫn tự nhận;
chưa có tệp thì trang hiển thị thông báo thân thiện và dùng minh họa 3D thay thế.

---

## 5. Checklist kiểm thử

- [ ] Mở `/3dtouch/tutorial.html`: bàn tay 3D quay + đổi được 5 động tác.
- [ ] Bấm “Bật camera thật”: thấy skeleton xanh, FPS/ms hiển thị, lấy nét liên tục ✓ (nếu máy hỗ trợ).
- [ ] Mở 2 tab `share.html`: tab kia xuất hiện trong “Thiết bị nhận” trong ≤ 3 giây.
- [ ] Gửi 1 file PPTX: tab nhận rung + tự tải; thanh tiến trình chạy đúng.
- [ ] Chọn folder: nhiều file gửi tuần tự, không treo.
- [ ] Rút mạng giữa chừng: hệ thống không sập, có dòng nhật ký lỗi.
- [ ] Điện thoại qua PIN/QR: điều khiển được con trỏ + nhận/gửi file.
