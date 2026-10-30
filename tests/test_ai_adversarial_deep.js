/**
 * SLIDEVAULT DEEP ADVERSARIAL & LOCAL AI INTEGRITY TEST SUITE
 * Attacks:
 * 1. Missing tokenizer / special tokens on all models (SmolLM2, Qwen 2.5, Gemma 4)
 * 2. /teamwork title sanitization (eradicates "tạo về..." garbage topic titles)
 * 3. /teamwork multi-curriculum fidelity (KNTT, Cánh Diều, Chân Trời, C-Suite)
 * 4. /learn XSS & script injection defense
 * 5. /learn short-input boundary validation
 * 6. /learn help/list alias resolution
 * 7. slide_engine.js dynamic lesson application into slides & notes
 * 8. Real-time SSE streaming concurrency burst (5 parallel streams)
 * 9. AI.html client-side invariance, timeout auto-unlock, and dead-chip eradication
 */

const fs = require('fs');
const path = require('path');

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, desc) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${desc}`);
  } else {
    failed++;
    console.error(`  ❌ [FAIL] ${desc}`);
  }
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json();
}

async function runAdversarialSuite() {
  console.log('\n================================================================');
  console.log('🛡️ SLIDEVAULT ADVERSARIAL & MULTI-MODEL DEEP RE-VERIFICATION');
  console.log('================================================================\n');

  const BASE_URL = 'http://127.0.0.1:3000';

  // --- ATTACK 1: Verify all 3 models serve special_tokens_map.json ---
  console.log('📌 1. Kiểm tra Toàn Diện Tokenizer & Special Tokens 3 Mô Hình:');
  const models = ['smollm-135m', 'qwen-0.5b', 'gemma-4-e2b'];
  for (const m of models) {
    const spRes = await fetch(`${BASE_URL}/models/${m}/special_tokens_map.json`);
    assert(spRes.status === 200, `Model ${m} phục vụ special_tokens_map.json (HTTP 200)`);
    const tokConfigRes = await fetch(`${BASE_URL}/models/${m}/tokenizer_config.json`);
    assert(tokConfigRes.status === 200, `Model ${m} phục vụ tokenizer_config.json (HTTP 200)`);
  }

  // --- ATTACK 2: /teamwork Title Sanitization ---
  console.log('\n📌 2. Kiểm tra Làm Sạch Chủ Đề /teamwork (Loại bỏ rác cú pháp "tạo về..."):');
  const teamSanitizeRes = await postJson(`${BASE_URL}/api/ai-chat`, {
    message: '/teamwork tạo 5 slide về Chuyển Đổi Số Doanh Nghiệp 2026',
    forSlides: true
  });
  assert(teamSanitizeRes.slides && teamSanitizeRes.slides.length === 5, 'Tạo thành công mảng 5 slide trong Teamwork');
  const firstSlideTitle = teamSanitizeRes.slides[0].title;
  assert(firstSlideTitle.includes('Chuyển Đổi Số Doanh Nghiệp 2026'), 'Tiêu đề slide chứa đúng chủ đề cốt lõi');
  assert(!firstSlideTitle.toLowerCase().includes('tạo về'), 'Tiêu đề slide KHÔNG bị dính rác chữ "tạo về"');
  assert(!teamSanitizeRes.reply.includes('Về chủ đề tạo về'), 'Lời thoại NekoChan KHÔNG bị dính "Về chủ đề tạo về"');

  // --- ATTACK 3: /teamwork Multi-Curriculum & Custom Slide Count ---
  console.log('\n📌 3. Kiểm tra Độ Trung Thực Chương Trình & Số Lượng Slide /teamwork:');
  const teamCanhDieuRes = await postJson(`${BASE_URL}/api/ai-chat`, {
    message: '/teamwork soạn 7 slide về Quang hợp và Năng lượng sinh học',
    standard: 'SGK_CANHDIEU',
    forSlides: true
  });
  assert(teamCanhDieuRes.slides && teamCanhDieuRes.slides.length === 7, 'Teamwork tạo đúng số lượng 7 slide theo yêu cầu');
  assert(teamCanhDieuRes.slides[0].curriculum === 'Cánh Diều 2026', 'Chuẩn giáo dục được tôn trọng: Cánh Diều 2026');

  // --- ATTACK 4: /learn XSS & Script Injection Defense ---
  console.log('\n📌 4. Kiểm định Phòng Thủ Tấn Công Mã Độc XSS Trong /learn & WAF Shield:');
  const maliciousTag = '<script>alert("XSS_ATTACK_VECTOR")</script>';
  const cleanRuleText = 'Quy chuẩn phòng thủ an toàn ' + Date.now();

  // 4a. Kiểm tra lớp phòng thủ ngoại vi WAF: raw <script> bị chặn ngay lập tức với HTTP 403
  const wafRes = await fetch(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `/learn ${maliciousTag} ${cleanRuleText}` })
  });
  assert(wafRes.status === 403, 'Hệ thống WAF Security Shield chặn đứng thẻ <script> ở tầng mạng (HTTP 403)');
  const wafJson = await wafRes.json();
  assert(wafJson.code === 'SEC_WAF_BLOCK' && wafJson.threatType === 'XSS Attack', 'WAF trả về mã định danh SEC_WAF_BLOCK và threatType XSS Attack');

  // 4b. Kiểm tra lớp phòng thủ ứng dụng (defense-in-depth): lọc sạch thuộc tính sự kiện độc hại (onload, onerror, onclick) và iframe
  const sanitizeRes = await postJson(`${BASE_URL}/api/ai-chat`, {
    message: `/learn <span onclick="triggerEvilAction()" onerror="handleFail()"><iframe src="about:blank"></iframe>${cleanRuleText}</span>`
  });
  assert(!sanitizeRes.reply.includes('onclick') && !sanitizeRes.reply.includes('onerror') && !sanitizeRes.reply.includes('iframe'), 'Phản hồi /learn đã loại bỏ sạch iframe và các thuộc tính sự kiện độc hại');
  assert(sanitizeRes.reply.includes(cleanRuleText), 'Nội dung quy tắc an toàn được giữ lại nguyên vẹn');

  const learningStore = JSON.parse(fs.readFileSync('server AI/learning.json', 'utf8'));
  const allStored = Object.values(learningStore).flat();
  const rawScriptFound = allStored.some(item => item.lesson.includes('<script>') || item.lesson.includes('onclick'));
  assert(rawScriptFound === false, 'Kho learning.json hoàn toàn sạch mã script và event handler độc hại');

  // --- ATTACK 5: /learn Boundary Validation ---
  console.log('\n📌 5. Kiểm tra Ranh Giới Đầu Vào Quá Ngắn Của /learn:');
  const learnShortRes = await postJson(`${BASE_URL}/api/ai-chat`, {
    message: '/learn a'
  });
  assert(learnShortRes.reply.includes('quá ngắn'), 'Chặn thành công bài học quá ngắn dưới 3 ký tự');

  // --- ATTACK 6: /learn Help & List Aliases ---
  console.log('\n📌 6. Kiểm tra Các Bí Danh /learn help, /learn ?:');
  const learnHelpRes = await postJson(`${BASE_URL}/api/ai-chat`, {
    message: '/learn help'
  });
  assert(learnHelpRes.reply.includes('CƠ SỞ DỮ LIỆU BÀI HỌC') && learnHelpRes.reply.includes('GDPT 2018/2026'), '/learn help trả về cẩm nang chuẩn xác');

  // --- ATTACK 7: slide_engine.js Dynamic Lesson Incorporation ---
  console.log('\n📌 7. Kiểm tra slide_engine Áp Dụng Thực Tế Quy Tắc Đã Học Vào Slide:');
  const { generateIntelligentDeck } = require('../fix.html/slide_engine');
  const uniquePedagogy = 'Bắt buộc liên hệ thực tiễn doanh nghiệp Việt Nam #' + Date.now();
  await postJson(`${BASE_URL}/api/ai-chat`, { message: `/learn ${uniquePedagogy}` });

  const generatedDeck = generateIntelligentDeck('Chiến Lược Kinh Doanh Bán Lẻ', 5, 'CSUITE');
  assert(generatedDeck.slides && generatedDeck.slides.length === 5, 'Tạo thành công 5 slide từ slide_engine');
  assert(generatedDeck.learnedLessonsApplied > 0, `Đã ghi nhận ${generatedDeck.learnedLessonsApplied} bài học áp dụng`);
  const slide1HasDirective = generatedDeck.slides[0].bullets.some(b => b.includes('Chuẩn hóa áp dụng') || b.includes('liên hệ thực tiễn'));
  assert(slide1HasDirective === true, 'Slide 1 đã tích hợp trực tiếp quy chuẩn học được vào bullet points');

  // --- ATTACK 8: SSE Real-Time Concurrency Burst (5 luồng đồng thời) ---
  console.log('\n📌 8. Kiểm tra Chịu Tải Đồng Thời (5 Concurrent SSE Streams):');
  const burstStartTime = Date.now();
  const burstPromises = [1, 2, 3, 4, 5].map(async (i) => {
    const res = await fetch(`${BASE_URL}/api/ai-chat-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Xin chào luồng ${i}`, assistant: i % 2 === 0 ? 'neko' : 'mano', boost: true })
    });
    if (!res.ok) throw new Error(`Stream ${i} failed: ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let gotDone = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const str = decoder.decode(value);
      if (str.includes('"done":true')) gotDone = true;
    }
    return gotDone;
  });

  const burstResults = await Promise.all(burstPromises);
  const burstDuration = Date.now() - burstStartTime;
  const allStreamsFinished = burstResults.every(r => r === true);
  assert(allStreamsFinished === true, 'Tất cả 5 luồng SSE đồng thời nhận gói tin done: true');
  assert(burstDuration < 5000, `Hoàn thành 5 luồng đồng thời trong thời gian cực ngắn (${burstDuration}ms)`);

  // --- ATTACK 9: AI.html Client Invariants & Dead-Chip Eradication ---
  console.log('\n📌 9. Kiểm tra Invariants Mã Nguồn Client (AI.html):');
  const aiHtml = fs.readFileSync('AI.html', 'utf8');
  assert(aiHtml.includes('window.aiGenerationStartTime'), 'AI.html đã trang bị cờ aiGenerationStartTime chống đóng băng');
  assert(aiHtml.includes('TOKENIZER_CONFIG_URL') && aiHtml.includes('SPECIAL_TOKENS_URL'), 'AI.html đã lưu trữ tokenizer_config và special_tokens vào CacheStorage');
  assert(aiHtml.includes('cleanPrompt.toLowerCase() === \'chủ đề này\''), 'AI.html đã khắc phục triệt để lỗi chip chết "chủ đề này"');
  assert(aiHtml.includes('Tạo Slide Teamwork'), 'AI.html có bộ điều hướng chuyên biệt cho chip "Tạo Slide Teamwork"');

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT: ${passed}/${total} BÀI KIỂM THỬ ĐỐI KHÁNG THÀNH CÔNG (${Math.round((passed/total)*100)}%)`);
  if (failed === 0) {
    console.log('🎉 TOÀN BỘ CÁC LỖ HỔNG & TÌNH HUỐNG BIÊN ĐÃ ĐƯỢC GIẢI QUYẾT TRIỆT ĐỂ!');
  } else {
    console.error(`⚠️ Có ${failed} bài kiểm thử thất bại!`);
  }
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runAdversarialSuite().catch(err => {
  console.error('Lỗi thực thi kiểm thử đối kháng:', err);
  process.exit(1);
});
