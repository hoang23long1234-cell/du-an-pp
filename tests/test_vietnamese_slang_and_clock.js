// ============================================================================
// BÀI TEST KIỂM THỬ: TIẾNG LÓNG VIỆT NAM, ĐỒNG HỒ THỜI GIAN THỰC & HỘI THOẠI
// SlideVault Neural Engine & Superpower Local Server
// ============================================================================

const assert = require('assert');

async function testQuery(port, endpoint, payload) {
  const url = `http://127.0.0.1:${port}${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return await res.json();
}

async function runTests() {
  console.log('================================================================');
  console.log('⏰ KIỂM THỬ ĐỒNG HỒ THỜI GIAN THỰC & TIẾNG LÓNG VIỆT NAM');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function check(name, condition) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      process.exitCode = 1;
    }
  }

  // --- 1. Node Server (Port 3000) ---
  console.log('📌 1. Kiểm tra Node Server (Port 3000):');

  // Test 1: "mấy g"
  const res1 = await testQuery(3000, '/api/ai-chat', { message: 'mấy g', assistant: 'neko' });
  check('Hỏi "mấy g" trả về giờ Việt Nam GMT+7 chính xác', res1.reply && res1.reply.includes('Bây giờ là') && res1.reply.includes('GMT+7'));
  check('Hỏi "mấy g" không bị văn mẫu rập khuôn', !res1.reply.includes('Đây là một chủ đề rất thú vị!'));

  // Test 2: "mấy giờ rồi"
  const res2 = await testQuery(3000, '/api/ai-chat', { message: 'mấy giờ rồi', assistant: 'mano' });
  check('Hỏi "mấy giờ rồi" (Mano Titan) trả về thời gian hiện tại', res2.reply && res2.reply.includes('Thời gian hiện tại tại Việt Nam'));

  // Test 3: "hôm nay ngày mấy"
  const res3 = await testQuery(3000, '/api/ai-chat', { message: 'hôm nay ngày mấy' });
  check('Hỏi "hôm nay ngày mấy" trả về thứ, ngày, tháng, năm', res3.reply && res3.reply.includes('Hôm nay là') && res3.reply.includes('2026'));

  // Test 4: Frustration query with "mấy g"
  const complaintMsg = 'nói tht này nha m con nguuu lắm Ai éo phải tht âu hỏi mấy g còn k bt đáp bỏ mịa i';
  const res4 = await testQuery(3000, '/api/ai-chat', { message: complaintMsg });
  check('Nhận diện phản ánh bực mình và xin lỗi chân thành', res4.reply && res4.reply.includes('Thành thật xin lỗi bạn'));
  check('Giải thích rõ lý do thiếu sót từ lóng "mấy g"', res4.reply && res4.reply.includes('mấy g'));
  check('Cung cấp ngay giờ hiện tại cho người dùng', res4.reply && res4.reply.includes('Bây giờ chính xác là'));
  check('Khẳng định năng lực AI Cục Bộ 100% On-Device', res4.reply && res4.reply.includes('AI Cục Bộ'));

  // Test 5: "ăn cơm chưa"
  const res5 = await testQuery(3000, '/api/ai-chat', { message: 'ăn cơm chưa' });
  check('Hỏi "ăn cơm chưa" trả lời tự nhiên, hóm hỉnh', res5.reply && (res5.reply.includes('bữa') || res5.reply.includes('nạp')));

  // Test 6: "đang làm gì đấy"
  const res6 = await testQuery(3000, '/api/ai-chat', { message: 'đang làm gì đấy' });
  check('Hỏi "đang làm gì" trả lời sẵn sàng hỗ trợ 24/7', res6.reply && res6.reply.includes('sẵn sàng'));

  // --- 2. Python AI Server (Port 8001) ---
  console.log('\n📌 2. Kiểm tra Python AI Server (Port 8001):');

  try {
    const pyRes1 = await testQuery(8001, '/api/chat', { message: 'mấy g' });
    check('Python 8001: "mấy g" trả về giờ Việt Nam GMT+7', pyRes1.reply && pyRes1.reply.includes('Bây giờ là') && pyRes1.reply.includes('GMT+7'));

    const pyRes2 = await testQuery(8001, '/api/chat', { message: 'hôm nay ngày mấy' });
    check('Python 8001: "hôm nay ngày mấy" trả về lịch chuẩn xác', pyRes2.reply && pyRes2.reply.includes('Hôm nay là') && pyRes2.reply.includes('2026'));

    const pyRes3 = await testQuery(8001, '/api/chat', { message: complaintMsg });
    check('Python 8001: Phản hồi thấu hiểu khi người dùng thắc mắc lỗi hỏi giờ', pyRes3.reply && pyRes3.reply.includes('Thành thật xin lỗi bạn'));
  } catch (pyErr) {
    console.warn('  ⚠️ Python 8001 warning:', pyErr.message);
  }

  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT: ${passed}/${total} BÀI TEST THÀNH CÔNG (${Math.round(passed/total*100)}%)`);
  console.log('================================================================');
}

runTests();
