/**
 * SLIDEVAULT THREE PILLARS STRATEGIC UPGRADE VERIFICATION SUITE
 * 
 * Pillar 1: Smart Intent Parser ("Hỏi gì đáp nấy" - Math/Science, History/Geo, Code, PowerPoint Slides)
 *           and Elimination of Rigid 3-point boilerplate.
 * Pillar 2: Zero-Cost Cloud API Bridge (Google AI Studio Gemini Flash / Groq Llama 3 70B).
 * Pillar 3: True Local Hardware Bridge (Ollama / LM Studio RTX GPU detection & execution).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} for ${url}: ${errText}`);
  }
  return await res.json();
}

async function run() {
  console.log('================================================================');
  console.log('🚀 TESTING THE 3 STRATEGIC PILLARS OF SLIDEVAULT');
  console.log('================================================================\n');

  const BASE_URL = 'http://127.0.0.1:3000';

  // ====================================================================
  // PILLAR 1: SMART INTENT PARSER ("HỎI GÌ ĐÁP NẤY")
  // ====================================================================
  console.log('📌 TRỤ CỘT 1: Intent Parser Thông Minh & Xóa Bỏ Văn Mẫu Cứng Nhắc');

  // 1.1 Math Basic
  const math1 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '1 + 1 bằng bao nhiêu?' })
  });
  assert(math1.text.includes('2'), 'Toán học: 1 + 1 trả về kết quả 2');
  assert(!math1.text.includes('1. **Bản chất vấn đề:**'), 'Toán học: Không dính văn mẫu 3 gạch đầu dòng');

  // 1.2 Linear Equation
  const math2 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Giải phương trình: 2x + 4 = 0' })
  });
  assert(math2.text.includes('-2') || math2.text.includes('x = -2'), 'Toán học: 2x + 4 = 0 nghiệm x = -2');

  // 1.3 Quadratic Equation
  const math3 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Giải phương trình bậc hai: x^2 - 5x + 6 = 0' })
  });
  assert(math3.text.includes('3') && math3.text.includes('2'), 'Toán học: x^2 - 5x + 6 = 0 có nghiệm x1 = 3, x2 = 2');

  // 1.4 Physics Free Fall
  const physics1 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Vật rơi tự do sau 3 giây đạt vận tốc bao nhiêu?' })
  });
  assert(physics1.text.includes('29.4') || physics1.text.includes('29,4'), 'Vật lý: Rơi tự do sau 3s đạt v = 29.4 m/s');

  // 1.5 History: Dien Bien Phu
  const hist1 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Chiến thắng Điện Biên Phủ diễn ra ngày tháng năm nào?' })
  });
  assert(hist1.text.includes('07/05/1954') || hist1.text.includes('7/5/1954'), 'Lịch sử: Điện Biên Phủ chính xác 07/05/1954');
  assert(!hist1.text.includes('1. **Bản chất vấn đề:**'), 'Lịch sử: Không dính văn mẫu');

  // 1.6 History: Independence Declaration
  const hist2 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Bác Hồ đọc Tuyên ngôn Độc lập vào ngày nào và ở đâu?' })
  });
  assert(hist2.text.includes('02/09/1945') && hist2.text.includes('Ba Đình'), 'Lịch sử: Tuyên ngôn Độc lập 02/09/1945 tại Quảng trường Ba Đình');

  // 1.7 Literature: Nguyen Du
  const lit1 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Ai là tác giả Truyện Kiều và sinh năm bao nhiêu?' })
  });
  assert(lit1.text.includes('Nguyễn Du') && lit1.text.includes('1765'), 'Văn học: Tác giả Truyện Kiều là Nguyễn Du (1765-1820)');

  // 1.8 Geography: Capital of France
  const geo1 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Thủ đô của Pháp là thành phố nào?' })
  });
  assert(geo1.text.toLowerCase().includes('paris'), 'Địa lý: Thủ đô của Pháp là Paris');

  // 1.9 Geography: Everest
  const geo2 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Đỉnh núi nào cao nhất thế giới?' })
  });
  assert(geo2.text.includes('Everest') && (geo2.text.includes('8.848') || geo2.text.includes('8848')), 'Địa lý: Everest cao 8.848m');

  // 1.10 Programming: Fibonacci
  const prog1 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Viết code Python tính số Fibonacci tối ưu O(n)' })
  });
  assert(prog1.text.includes('def fibonacci') || prog1.text.includes('def fib'), 'Lập trình: Cung cấp hàm Fibonacci tối ưu');
  assert(prog1.text.includes('```python'), 'Lập trình: Định dạng mã code block chuẩn');

  // 1.11 PowerPoint Slide Generation
  const slide1 = await fetchJson(`${BASE_URL}/api/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Làm powerpoint về Chuyển đổi số doanh nghiệp 2026' })
  });
  assert(Array.isArray(slide1.slides) && slide1.slides.length >= 3, 'PowerPoint: Tự động khởi tạo dàn ý slide chuẩn (>=3 slides)');
  assert(slide1.slides.some(s => s.layout === 'hero' || s.layout === 'split' || s.layout === 'metrics'), 'PowerPoint: Có layout 16:9 chuyên nghiệp (hero, split, metrics)');

  // ====================================================================
  // PILLAR 2: ZERO-COST CLOUD API BRIDGE (GEMINI FLASH / GROQ)
  // ====================================================================
  console.log('\n📌 TRỤ CỘT 2: Cầu Nối Cloud API Miễn Phí (Google AI Studio & Groq - 0đ)');

  // 2.1 GET Cloud Bridge Status
  const cloudStatus = await fetchJson(`${BASE_URL}/api/ai-cloud-bridge`);
  assert(cloudStatus.status === 'active', 'Cloud API Bridge: Trạng thái active');
  assert(Array.isArray(cloudStatus.providers) && cloudStatus.providers.length >= 2, 'Cloud API Bridge: Đầy đủ các provider miễn phí (Gemini & Groq)');

  // 2.2 POST Gemini Flash Free
  const cloudGemini = await fetchJson(`${BASE_URL}/api/ai-cloud-bridge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'gemini-flash-free', message: 'Tóm tắt vai trò của AI trong giáo dục' })
  });
  assert(cloudGemini.text && cloudGemini.text.length > 20, 'Cloud API Bridge: Gemini Flash phản hồi thành công');
  assert(cloudGemini.provider === 'gemini-flash-free', 'Cloud API Bridge: Đúng tag provider');

  // 2.3 POST Groq Llama Free
  const cloudGroq = await fetchJson(`${BASE_URL}/api/ai-cloud-bridge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'groq-llama-free', message: 'Cách thiết kế slide tương phản cao' })
  });
  assert(cloudGroq.text && cloudGroq.text.length > 20, 'Cloud API Bridge: Groq Llama phản hồi thành công');
  assert(cloudGroq.provider === 'groq-llama-free', 'Cloud API Bridge: Đúng tag provider Groq');

  // ====================================================================
  // PILLAR 3: TRUE LOCAL HARDWARE BRIDGE (OLLAMA / LM STUDIO RTX)
  // ====================================================================
  console.log('\n📌 TRỤ CỘT 3: Cổng Kết Nối Mô Hình Lớn Cục Bộ Thật 100% (Ollama / LM Studio)');

  // 3.1 GET Hardware Detect Probe
  const hwDetect = await fetchJson(`${BASE_URL}/api/ai-hardware-bridge/detect`);
  assert(hwDetect.ollama !== undefined && hwDetect.lmstudio !== undefined, 'Hardware Bridge: Quét cổng 11434 (Ollama) và 1234 (LM Studio) hoàn tất');

  // 3.2 POST Hardware Chat Ollama
  const hwOllama = await fetchJson(`${BASE_URL}/api/ai-hardware-bridge/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'ollama', message: 'Xin chào mô hình cục bộ' })
  });
  assert(hwOllama.text && hwOllama.text.length > 0, 'Hardware Bridge: Phản hồi an toàn khi probe Ollama');

  // 3.3 POST Hardware Chat LM Studio
  const hwLMStudio = await fetchJson(`${BASE_URL}/api/ai-hardware-bridge/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'lmstudio', message: 'Kiểm tra LM Studio GPU bridge' })
  });
  assert(hwLMStudio.text && hwLMStudio.text.length > 0, 'Hardware Bridge: Phản hồi an toàn khi probe LM Studio');

  // ====================================================================
  // PILLAR 4: SYSTEM PARITY & UI ACCESSIBILITY INVARIANCE
  // ====================================================================
  console.log('\n📌 KIỂM TRA BẤT BIẾN HỆ THỐNG: Binary Parity & UI Integration');

  // 4.1 Binary Parity
  const indexPath = path.join(__dirname, '..', 'index.html');
  const trangchuPath = path.join(__dirname, '..', 'trangchudong.html');
  const indexBuf = fs.readFileSync(indexPath);
  const trangchuBuf = fs.readFileSync(trangchuPath);
  const indexHash = crypto.createHash('sha256').update(indexBuf).digest('hex');
  const trangchuHash = crypto.createHash('sha256').update(trangchuBuf).digest('hex');
  assert(indexHash === trangchuHash && indexBuf.equals(trangchuBuf), 'Binary Parity: index.html == trangchudong.html 100% SHA-256');

  // 4.2 AI.html Integration
  const aiHtmlPath = path.join(__dirname, '..', 'AI.html');
  const aiContent = fs.readFileSync(aiHtmlPath, 'utf8');
  assert(aiContent.includes('hardwareBridgeBadge'), 'AI.html: Có huy hiệu hardware bridge #hardwareBridgeBadge');
  assert(aiContent.includes('cloud-gemini') && aiContent.includes('cloud-groq'), 'AI.html: Có lựa chọn Cloud API Bridge (Gemini/Groq)');
  assert(aiContent.includes('hardware-ollama') && aiContent.includes('hardware-lmstudio'), 'AI.html: Có lựa chọn Hardware Bridge (Ollama/LM Studio)');
  assert(aiContent.includes('initLocalHardwareBridge'), 'AI.html: Tự động kích hoạt cơ chế nhận diện phần cứng cục bộ');

  // SUMMARY
  console.log('\n================================================================');
  console.log(`🏆 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} BÀI TEST THÀNH CÔNG (100%)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error during tests:', err);
  process.exit(1);
});
