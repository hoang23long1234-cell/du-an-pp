# Implementation Plan: Tích Hợp Lõi AI Nơ-ron Cục Bộ 100% Thật (True On-Device Neural LLM)

## Overview
Hiện thực hóa 100% Local AI thực thụ (Option 1) chạy trực tiếp trên thiết bị (On-Device WebGPU & CPU WebAssembly) trong `AI.html`:
1. **Lõi Suy Luận Nơ-ron Trình Duyệt (WebGPU / WASM Inference Engine):**
   - Tích hợp Transformers.js (ONNX Runtime Web) trực tiếp vào `AI.html`.
   - Tự động phát hiện WebGPU (Hardware Acceleration) và tự động fallback về đa luồng CPU WebAssembly (WASM).
   - Nạp trực tiếp trọng số nơ-ron cục bộ (SmolLM2-135M / Qwen 2.5 0.5B / Google Gemma 4) đã có sẵn trên máy.
2. **Hiệu Ứng Sinh Ngữ Từng Từ Thực Thụ (Token-by-Token Streaming Generation):**
   - Sinh câu trả lời theo thời gian thực (streaming token) với hiệu ứng gõ phím mượt mà và con trỏ `▊` nhấp nháy.
   - Đo lường và hiển thị tốc độ suy luận thật: `⚡ Tốc độ: ~28.5 tokens/s • 420ms`, `Phần cứng: 🟢 WebGPU (GPU) / ⚡ WASM (CPU Multi-thread) / 🖥️ Node Cục Bộ`.
3. **Tương Tác Tạo Slide Tự Động (Neural SlideCraft Co-Pilot):**
   - AI tự động suy luận dàn ý và bắn trực tiếp vào khung chiếu Slide 16:9 Cinema 3D trên màn hình.
4. **Đảm Bảo Bất Biến (Parity & Invariance):**
   - Giữ nguyên 100% tính toàn vẹn nhị phân giữa `index.html` và `trangchudong.html`.
   - Đạt 0 lỗi a11y và vượt qua toàn bộ 28 bài toán học/vật lý, 160 ca kiểm thử E2E và 21 bài stress test.

## Task Breakdown
- [x] Task 1: Tích hợp thư viện suy luận nơ-ron ONNX Runtime Web / Transformers.js vào `AI.html`.
- [x] Task 2: Xây dựng module `SlideVaultNeuralEngine` quản lý nạp mô hình, nhận diện WebGPU/WASM, và cơ chế TextStreamer sinh từng token.
- [x] Task 3: Nối luồng chat `handleGeneralChatAndContentWriting` và `triggerAICoPilotSlideGeneration` vào bộ sinh token thời gian thực.
- [x] Task 4: Hiển thị trạng thái nơ-ron thật: nhãn WebGPU/WASM, đo tốc độ tokens/s, thời gian phản hồi.
- [x] Task 5: Chạy toàn bộ các bộ test hồi quy (Binary Parity, A11y, Math Physics, E2E 160 ca, Stress Challenger 21 ca).
