/**
 * SLIDEVAULT LOCAL NEURAL AI SUPERPOWER VERIFICATION SUITE
 * Tests: /teamwork, /learn, /boost, multi-model static hosting,
 * real-time SSE streaming speed, chat memory, and bulletproof fallbacks.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
}

async function runTests() {
  console.log('\n================================================================');
  console.log('🤖 SLIDEVAULT LOCAL NEURAL AI & WEB INFRASTRUCTURE TEST SUITE');
  console.log('================================================================\n');

  const BASE_URL = 'http://127.0.0.1:3000';

  // --- SECTION 1: Multi-Model File Integrity & ONNX WebGPU Assets ---
  console.log('📌 1. Kiểm tra Hệ sinh thái Đa Mô hình (SmolLM2, Qwen 2.5, Gemma 4):');
  const models = ['smollm-135m', 'qwen-0.5b', 'gemma-4-e2b'];
  for (const m of models) {
    const configRes = await fetch(`${BASE_URL}/models/${m}/config.json`);
    assert(configRes.status === 200, `Model ${m} config.json phục vụ thành công (HTTP 200)`);

    const tokRes = await fetch(`${BASE_URL}/models/${m}/tokenizer_config.json`);
    assert(tokRes.status === 200, `Model ${m} tokenizer_config.json phục vụ thành công (HTTP 200)`);

    const tokJsonRes = await fetch(`${BASE_URL}/models/${m}/tokenizer.json`);
    assert(tokJsonRes.status === 200, `Model ${m} tokenizer.json phục vụ thành công (HTTP 200)`);
  }

  // --- SECTION 2: /teamwork Multi-Agent Synergy ---
  console.log('\n📌 2. Kiểm tra Tính năng Đồng Thuận Đa Trí Tuệ (/teamwork):');
  const teamChatRes = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '/teamwork Chuyển đổi số doanh nghiệp 2026' })
  });
  assert(teamChatRes.model.includes('MultiAgent-Teamwork'), 'Model tag xác nhận MultiAgent-Teamwork');
  assert(teamChatRes.reply.includes('NekoChan AI ✨') && teamChatRes.reply.includes('Mano Titan ⚡'), 'Phản hồi chứa cả 2 góc nhìn NekoChan và Mano Titan');
  assert(teamChatRes.reply.includes('SlideArchitect'), 'SlideArchitect đưa ra cấu trúc slide đồng thuận');

  const teamSlideRes = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '/teamwork tạo 5 slide về chiến lược AI cục bộ', forSlides: true })
  });
  assert(Array.isArray(teamSlideRes.slides) && teamSlideRes.slides.length === 5, 'Hội đồng AI tạo thành công mảng 5 slide');
  assert(teamSlideRes.forSlides === true, 'Cờ forSlides được bật đúng trong Teamwork mode');

  // --- SECTION 3: /learn Continuous Learning System ---
  console.log('\n📌 3. Kiểm tra Hệ thống Dạy và Quản lý Tri thức AI (/learn):');
  const learnListRes = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '/learn list' })
  });
  assert(learnListRes.model.includes('ContinuousLearning'), 'Model tag xác nhận ContinuousLearning');
  assert(learnListRes.reply.includes('GDPT 2018/2026') && learnListRes.reply.includes('Minto'), 'Danh sách tri thức hiển thị đầy đủ các tiêu chuẩn cốt lõi');

  const uniqueRule = 'Quy tắc thử nghiệm chuẩn hóa 2026 #' + Date.now();
  const learnAddRes = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `/learn ${uniqueRule}` })
  });
  assert(learnAddRes.reply.includes('ĐÃ NẠP THÀNH CÔNG BÀI HỌC VÀO BỘ NÃO'), 'Ghi nhận bài học thành công');

  const learningStore = JSON.parse(fs.readFileSync('server AI/learning.json', 'utf8'));
  const foundInStore = Object.values(learningStore).flat().some(item => item.lesson.includes(uniqueRule));
  assert(foundInStore === true, 'Bài học được lưu trữ vĩnh viễn trong server AI/learning.json');

  // --- SECTION 4: /boost Turbo Acceleration ---
  console.log('\n📌 4. Kiểm tra Chế độ Tăng Tốc Turbo Hardware Acceleration (/boost):');
  const boostRes = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '/boost' })
  });
  assert(boostRes.model.includes('TurboBoost'), 'Model tag xác nhận TurboBoost');
  assert(boostRes.boost === true, 'Cờ boost: true được phản hồi cho máy khách');
  assert(boostRes.reply.includes('WebGPU') && boostRes.reply.includes('SSE Stream'), 'Báo cáo đầy đủ thông số WebGPU và SSE Stream');

  // --- SECTION 5: Real-time SSE Stream High Speed Chunking ---
  console.log('\n📌 5. Kiểm định Luồng SSE Thời Gian Thực (/api/ai-chat-stream):');
  const streamStartTime = Date.now();
  const streamRes = await fetch(`${BASE_URL}/api/ai-chat-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Chào bạn', assistant: 'neko' })
  });
  assert(streamRes.headers.get('content-type').includes('text/event-stream'), 'Content-Type chuẩn text/event-stream');

  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let streamChunks = 0;
  let receivedDone = false;
  let streamText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    streamChunks++;
    const str = decoder.decode(value);
    const lines = str.split('\n');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const payload = JSON.parse(line.replace('data:', '').trim());
          if (payload.token) streamText += payload.token;
          if (payload.done) receivedDone = true;
        } catch (e) {}
      }
    }
  }
  const streamDuration = Date.now() - streamStartTime;
  assert(receivedDone === true, 'Nhận gói tin done: true từ máy chủ');
  assert(streamChunks > 0 && streamChunks < 80, `Gói tin SSE tối ưu hóa đa từ (${streamChunks} chunks, không bị phân mảnh ký tự)`);
  assert(streamDuration < 3000, `Tốc độ phản hồi cực nhanh (${streamDuration}ms)`);

  // --- SECTION 6: Persistent Chat Memory Persistence ---
  console.log('\n📌 6. Kiểm tra Bộ nhớ Trò chuyện Vĩnh viễn (Long-term Chat Memory):');
  const testSessionId = 'test_suite_session_' + Date.now();
  const memSaveRes = await fetchJson(`${BASE_URL}/api/chat-memory/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      message: 'Tôi đang chuẩn bị thuyết trình môn Hóa học',
      reply: 'Tuyệt vời, NekoChan sẽ hỗ trợ bạn các công thức hóa sinh!',
      model: 'smollm-135m'
    })
  });
  assert(memSaveRes.success === true, 'Lưu trữ turn trao đổi vào memory thành công');

  const memGetRes = await fetchJson(`${BASE_URL}/api/chat-memory?sessionId=${testSessionId}`);
  assert(memGetRes.sessionCount === 2, 'Truy xuất đúng 2 messages (user + assistant) trong session');
  assert(memGetRes.turns[0].message.includes('Hóa học'), 'Nội dung ghi nhớ chính xác');

  // --- SECTION 7: Invariants and Accessibility ---
  console.log('\n📌 7. Kiểm tra Tính Tuân Thủ Invariants Hệ thống:');
  const aiHtml = fs.readFileSync('AI.html', 'utf8');
  assert(aiHtml.includes('/teamwork') && aiHtml.includes('/learn') && aiHtml.includes('/boost'), 'AI.html đã tích hợp 3 lệnh slash commands');
  assert(aiHtml.includes('handleChatActionClick'), 'AI.html có bộ xử lý click chip hành động');

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT: ${passedTests}/${totalTests} BÀI KIỂM THỬ THÀNH CÔNG (${Math.round((passedTests/totalTests)*100)}%)`);
  if (failedTests === 0) {
    console.log('🎉 TOÀN BỘ HỆ THỐNG AI CỤC BỘ & HẠ TẦNG WEB ĐÃ ĐẠT CHUẨN 100%!');
  } else {
    console.error(`⚠️ Có ${failedTests} bài kiểm thử thất bại!`);
  }
  console.log('================================================================\n');

  if (failedTests > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Lỗi thực thi kiểm thử:', err);
  process.exit(1);
});
