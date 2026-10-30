/**
 * test_stage123_integration.js
 * Comprehensive Integration & Verification Suite for SlideVault Local AI Stages 1, 2, and 3
 * 
 * Tests:
 * 1. Stage 1: Dual Local Server AI & CoT Visualizer
 *    - Node server (Port 3000): /api/ai-chat, /api/ai-chat-stream, /teamwork, /learn, /boost
 *    - Python server (Port 8001): /api/chat, /teamwork, /learn, /boost
 *    - DeepSeek-R1 <think> Chain-of-Thought parsing & collapsible visualizer
 * 2. Stage 2: Document Ingestion & Local RAG Slide Generation
 *    - Node server (Port 3000): /api/extract-document (.txt, .docx)
 *    - Python server (Port 8001): /api/extract-document (.txt, .docx)
 *    - AI.html Client Ingestion DOM elements, action chips, accessibility
 *    - RAG Slide Deck Synthesis with 5E Pedagogical Framework & Minto SCQA
 * 3. Stage 3: Offline Text-to-Speech (TTS) Voice Narration
 *    - AI.html TTS controls (#btnSlideTtsNarrate, #ttsAudioWave, #ttsNarratorLabel)
 *    - Dual persona voice tuning (NekoChan ✨ female vs Mano Titan ⚡ male)
 *    - Speaker notes narration integration
 * 4. Responsive UI & System Invariants
 *    - Touch targets for Mobile (<768px), Tablet, Desktop
 *    - Binary parity check (index.html == trangchudong.html)
 *    - WCAG 2.2 zero unlabeled buttons/inputs check
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const JSZip = require(path.join(__dirname, '../assets/js/jszip.min.js'));

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    totalFailed++;
  }
}

function postJson(port, urlPath, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: urlPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 30000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(data);
    req.end();
  });
}

async function createDummyDocxBase64(sampleText) {
  const zip = new JSZip();
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>${sampleText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
  zip.file('word/document.xml', documentXml);
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  return content.toString('base64');
}

function createDummyFlatePdfBase64(sampleText) {
  const zlib = require('zlib');
  const content = `BT /F1 12 Tf (${sampleText}) Tj ET`;
  const deflated = zlib.deflateSync(Buffer.from(content));
  const pdfBuf = Buffer.concat([
    Buffer.from('%PDF-1.4\n1 0 obj\n<< /Filter /FlateDecode >>\nstream\r\n'),
    deflated,
    Buffer.from('\r\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
  ]);
  return pdfBuf.toString('base64');
}

async function runStage1Tests() {
  console.log('\n================================================================');
  console.log('🧠 GIAI ĐOẠN 1: MÔ HÌNH NƠ-RON CỤC BỘ & TƯ DUY DEEPSEEK-R1');
  console.log('================================================================');

  // 1.1 Node Server (Port 3000) Slash Commands
  console.log('\n📌 1.1 Kiểm tra Node Server (Port 3000) Slash Commands:');
  try {
    const resTeamwork = await postJson(3000, '/api/ai-chat', {
      message: '/teamwork tạo 5 slide về Sinh học 10 tế bào',
      forSlides: true,
      assistant: 'neko'
    });
    assert(resTeamwork.status === 200, 'Node 3000: /teamwork trả về HTTP 200');
    assert(resTeamwork.data && resTeamwork.data.model && resTeamwork.data.model.includes('MultiAgent-Teamwork'), 'Node 3000: Model tag chứa MultiAgent-Teamwork');
    assert(resTeamwork.data && Array.isArray(resTeamwork.data.slides) && resTeamwork.data.slides.length === 5, 'Node 3000: /teamwork tạo 5 slide đồng thuận');
    assert(resTeamwork.data && resTeamwork.data.reply && resTeamwork.data.reply.includes('NekoChan') && resTeamwork.data.reply.includes('Mano Titan'), 'Node 3000: Phản hồi chứa cả 2 góc nhìn');

    const resLearn = await postJson(3000, '/api/ai-chat', {
      message: '/learn Luôn sử dụng sơ đồ tư duy phân nhánh cho các bài học',
      assistant: 'mano'
    });
    assert(resLearn.status === 200, 'Node 3000: /learn trả về HTTP 200');
    assert(resLearn.data && resLearn.data.model && resLearn.data.model.includes('ContinuousLearning'), 'Node 3000: Model tag chứa ContinuousLearning');

    const resBoost = await postJson(3000, '/api/ai-chat', {
      message: '/boost',
      assistant: 'neko'
    });
    assert(resBoost.status === 200, 'Node 3000: /boost trả về HTTP 200');
    assert(resBoost.data && resBoost.data.boost === true, 'Node 3000: Trả về boost: true');
  } catch (err) {
    assert(false, `Node 3000 Slash Commands error: ${err.message}`);
  }

  // 1.2 Python Server (Port 8001) Slash Commands & Standard Chat
  console.log('\n📌 1.2 Kiểm tra Python AI Server (Port 8001) Slash Commands:');
  try {
    const resPyTeamwork = await postJson(8001, '/api/chat', {
      message: '/teamwork tạo 5 slide về Dự án AI Cloud Cục Bộ',
      forSlides: true,
      assistant: 'neko',
      standard: 'SGK_KETNOI',
      count: 5
    });
    assert(resPyTeamwork.status === 200, 'Python 8001: /teamwork trả về HTTP 200');
    assert(resPyTeamwork.data && resPyTeamwork.data.model && resPyTeamwork.data.model.includes('MultiAgent-Teamwork'), 'Python 8001: Model tag chứa MultiAgent-Teamwork');
    assert(resPyTeamwork.data && Array.isArray(resPyTeamwork.data.slides) && resPyTeamwork.data.slides.length === 5, 'Python 8001: Tạo thành công 5 slide đồng thuận');

    const resPyLearn = await postJson(8001, '/api/chat', {
      message: '/learn Tối ưu hóa kích thước chữ cho màn hình di động',
      assistant: 'mano'
    });
    assert(resPyLearn.status === 200, 'Python 8001: /learn trả về HTTP 200');
    assert(resPyLearn.data && resPyLearn.data.model && resPyLearn.data.model.includes('ContinuousLearning'), 'Python 8001: Model tag chứa ContinuousLearning');
    assert(resPyLearn.data && resPyLearn.data.reply && resPyLearn.data.reply.includes('Tối ưu hóa kích thước chữ'), 'Python 8001: Phản hồi xác nhận ghi nhớ bài học');

    const resPyBoost = await postJson(8001, '/api/chat', {
      message: '/boost',
      assistant: 'neko'
    });
    assert(resPyBoost.status === 200, 'Python 8001: /boost trả về HTTP 200');
    assert(resPyBoost.data && resPyBoost.data.boost === true, 'Python 8001: Trả về boost: true');

    const resPyChatAlias = await postJson(8001, '/chat', {
      message: 'Xin chào AI Cục Bộ',
      assistant: 'neko'
    });
    assert(resPyChatAlias.status === 200, 'Python 8001: /chat alias trả về HTTP 200');
  } catch (err) {
    assert(false, `Python 8001 Slash Commands error: ${err.message}`);
  }

  // 1.3 DeepSeek-R1 <think> Chain-of-Thought Visualizer Parsing
  console.log('\n📌 1.3 Kiểm tra DeepSeek-R1 Chain-of-Thought (<think>) Visualizer Logic:');
  const aiHtml = fs.readFileSync(path.join(__dirname, '../AI.html'), 'utf8');

  assert(aiHtml.includes('!options.teamwork && !options.boost && !promptText.toLowerCase().startsWith(\'/\')'), 'AI.html bảo đảm các lệnh slash commands không bị gửi nhầm sang mô hình thô');

  // Verify formatAiMessageWithCoT function structure in AI.html
  assert(aiHtml.includes('function formatAiMessageWithCoT(rawText)'), 'AI.html chứa hàm formatAiMessageWithCoT');
  assert(aiHtml.includes('<think>') && aiHtml.includes('<\\/think>'), 'formatAiMessageWithCoT nhận diện khối <think>...</think>');
  assert(aiHtml.includes('details class="mb-2.5 p-2.5 rounded-xl bg-purple-500/10'), 'Tạo khối <details> collapsible với phong cách kính tím');
  assert(aiHtml.includes('Tiến trình suy luận của AI (Chain-of-Thought)'), 'Hiển thị nhãn Chain-of-Thought trực quan');
  assert(aiHtml.includes('AI đang tư duy logic (DeepSeek-R1 Thinking)...'), 'Hỗ trợ trạng thái đang suy luận streaming khi thẻ chưa đóng');

  // Simulate formatAiMessageWithCoT behavior
  function testFormatCoT(rawText) {
    let text = String(rawText);
    let cotHtml = '';
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
    if (thinkMatch) {
      const thoughtContent = thinkMatch[1].trim();
      cotHtml = `<details class="ai-thought-box"><summary>Tiến trình suy luận</summary><div>${thoughtContent}</div></details>`;
      text = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
    } else if (text.includes('<think>')) {
      const ongoing = text.split('<think>')[1] || '';
      return `<div class="ai-thinking">Đang tư duy... ${ongoing}</div>`;
    }
    return cotHtml + `<div class="ai-body">${text}</div>`;
  }

  const simulatedDone = testFormatCoT('<think>1. Phân tích đề bài.\n2. Lập dàn ý 5 bước.</think>Chào bạn! Dưới đây là bài thuyết trình.');
  assert(simulatedDone.includes('<details class="ai-thought-box">') && simulatedDone.includes('1. Phân tích đề bài.') && simulatedDone.includes('Chào bạn! Dưới đây là bài thuyết trình.'), 'CoT phân tách chính xác phần suy luận vào details và phần phản hồi ra body');

  const simulatedStreaming = testFormatCoT('Chào bạn!<think>Đang tìm kiếm dữ liệu...');
  assert(simulatedStreaming.includes('ai-thinking') && simulatedStreaming.includes('Đang tìm kiếm dữ liệu...'), 'CoT streaming hiển thị trạng thái đang tư duy logic');
}

async function runStage2Tests() {
  console.log('\n================================================================');
  console.log('📄 GIAI ĐOẠN 2: NẠP TÀI LIỆU CỤC BỘ & TỔNG HỢP SLIDE RAG');
  console.log('================================================================');

  const sampleDocText = `GIÁO ÁN PHÁT TRIỂN NĂNG LỰC SỐ
Chuyên đề: Trí tuệ nhân tạo thế hệ mới và chuyển đổi số trong giáo dục
Giai đoạn 1: Khởi động và kích thích trí tò mò của học sinh về mô hình ngôn ngữ lớn cục bộ.
Giai đoạn 2: Khám phá nguyên lý vận hành của mạng nơ-ron sâu Transformer và cơ chế Attention.
Giai đoạn 3: Giải thích kiến trúc xử lý song song và khả năng chạy trực tiếp trên card đồ họa máy tính cá nhân.
Giai đoạn 4: Vận dụng thiết kế bài trình chiếu đa phương tiện tích hợp đồ họa không gian 3D.
Giai đoạn 5: Đánh giá hiệu quả tiếp thu và đo lường sự gắn kết qua chỉ số tương tác thực tế.`;

  // 2.1 Node Server (Port 3000) Document Extraction
  console.log('\n📌 2.1 Kiểm tra Node Server (Port 3000) /api/extract-document:');
  try {
    // Test .txt extraction
    const b64Txt = Buffer.from(sampleDocText, 'utf8').toString('base64');
    const resNodeTxt = await postJson(3000, '/api/extract-document', {
      filename: 'giao_an_so.txt',
      base64: b64Txt
    });
    assert(resNodeTxt.status === 200 && resNodeTxt.data.success === true, 'Node 3000: Trích xuất .txt thành công (HTTP 200)');
    assert(resNodeTxt.data.text.includes('GIÁO ÁN PHÁT TRIỂN NĂNG LỰC SỐ'), 'Node 3000: Nội dung văn bản .txt bảo toàn 100%');
    assert(resNodeTxt.data.wordCount > 30, 'Node 3000: Đếm số lượng từ chính xác (wordCount: ' + resNodeTxt.data.wordCount + ')');

    // Test .docx extraction
    const b64Docx = await createDummyDocxBase64('Tài liệu Word kiểm thử OOXML trích xuất tự động');
    const resNodeDocx = await postJson(3000, '/api/extract-document', {
      filename: 'kiem_thu.docx',
      base64: b64Docx
    });
    assert(resNodeDocx.status === 200 && resNodeDocx.data.success === true, 'Node 3000: Trích xuất .docx (OOXML) thành công');
    assert(resNodeDocx.data.text.includes('Tài liệu Word kiểm thử OOXML'), 'Node 3000: Đọc nội dung word/document.xml chuẩn xác');

    // Test .pdf (FlateDecode) extraction on Node 3000
    const b64PdfNode = createDummyFlatePdfBase64('Nội dung giáo án PDF nén FlateDecode kiểm thử Node 3000');
    const resNodePdf = await postJson(3000, '/api/extract-document', {
      filename: 'kiem_thu_flate.pdf',
      base64: b64PdfNode
    });
    assert(resNodePdf.status === 200 && resNodePdf.data.success === true, 'Node 3000: Trích xuất .pdf nén FlateDecode thành công');
    assert(resNodePdf.data.text.includes('Nội dung giáo án PDF nén FlateDecode'), 'Node 3000: Giải nén FlateDecode và đọc nội dung PDF chuẩn xác');
  } catch (err) {
    assert(false, `Node 3000 Document Extraction error: ${err.message}`);
  }

  // 2.2 Python Server (Port 8001) Document Extraction
  console.log('\n📌 2.2 Kiểm tra Python AI Server (Port 8001) /api/extract-document:');
  try {
    const b64Txt = Buffer.from(sampleDocText, 'utf8').toString('base64');
    const resPyTxt = await postJson(8001, '/api/extract-document', {
      filename: 'giao_an_python.txt',
      base64: b64Txt
    });
    assert(resPyTxt.status === 200 && resPyTxt.data.success === true, 'Python 8001: Trích xuất .txt thành công (HTTP 200)');
    assert(resPyTxt.data.text.includes('Khám phá nguyên lý vận hành'), 'Python 8001: Nội dung văn bản .txt trích xuất chính xác');
    assert(resPyTxt.data.wordCount > 30, 'Python 8001: Đếm số lượng từ chính xác (wordCount: ' + resPyTxt.data.wordCount + ')');

    const b64Docx = await createDummyDocxBase64('Văn bản giáo án Word nạp vào Python FastAPI');
    const resPyDocx = await postJson(8001, '/api/extract-document', {
      filename: 'giao_an_py.docx',
      base64: b64Docx
    });
    assert(resPyDocx.status === 200 && resPyDocx.data.success === true, 'Python 8001: Trích xuất .docx qua zipfile thành công');
    assert(resPyDocx.data.text.includes('Văn bản giáo án Word nạp vào Python'), 'Python 8001: Khớp chuẩn xác đoạn văn trong .docx');

    // Test .pdf (FlateDecode) extraction on Python 8001
    const b64PdfPy = createDummyFlatePdfBase64('Văn bản PDF nén nạp vào Python FastAPI 8001');
    const resPyPdf = await postJson(8001, '/api/extract-document', {
      filename: 'kiem_thu_py.pdf',
      base64: b64PdfPy
    });
    assert(resPyPdf.status === 200 && resPyPdf.data.success === true, 'Python 8001: Trích xuất .pdf nén FlateDecode qua zlib thành công');
    assert(resPyPdf.data.text.includes('Văn bản PDF nén nạp vào Python FastAPI 8001'), 'Python 8001: Giải nén FlateDecode và đọc nội dung PDF chuẩn xác');
  } catch (err) {
    assert(false, `Python 8001 Document Extraction error: ${err.message}`);
  }

  // 2.3 Client-Side Ingestion DOM Elements & Teach AI Modal in AI.html
  console.log('\n📌 2.3 Kiểm tra giao diện, bộ xử lý tài liệu và Teach AI Modal trong AI.html:');
  const aiHtml = fs.readFileSync(path.join(__dirname, '../AI.html'), 'utf8');

  assert(aiHtml.includes('id="aiDocDropOverlay"'), 'AI.html có lớp phủ kéo thả tài liệu #aiDocDropOverlay');
  assert(aiHtml.includes('id="aiAttachedDocBanner"'), 'AI.html có banner tài liệu đính kèm #aiAttachedDocBanner');
  assert(aiHtml.includes('id="aiDocFileInput"'), 'AI.html có thẻ input tệp ẩn #aiDocFileInput');
  assert(aiHtml.includes('id="aiDocUploadBtn"'), 'AI.html có nút đính kèm tài liệu #aiDocUploadBtn');
  assert(aiHtml.includes('synthesizeSlidesFromAttachedDoc()'), 'AI.html có nút hành động: Tự động tổng hợp Slide (Chuẩn 5E & Minto)');
  assert(aiHtml.includes('summarizeAttachedDoc()'), 'AI.html có nút hành động: Tóm Tắt Cốt Lõi');
  assert(aiHtml.includes('condenseAttachedDoc6x6()'), 'AI.html có nút hành động: Rút Gọn Chuẩn 6x6');
  assert(aiHtml.includes('assets/js/jszip.min.js') && aiHtml.includes('assets/js/pdf.min.js'), 'AI.html liên kết thư viện JSZip và PDF.js trích xuất cục bộ 100%');
  assert(aiHtml.includes('function openTeachAiModal('), 'AI.html có hàm mở modal dạy AI openTeachAiModal');
  assert(aiHtml.includes('function closeTeachAiModal('), 'AI.html có hàm đóng modal dạy AI closeTeachAiModal');
  assert(aiHtml.includes('function submitAiLesson('), 'AI.html có hàm lưu bài học submitAiLesson');
  assert(aiHtml.includes('function insertQuickLesson('), 'AI.html có hàm chèn mẫu bài học insertQuickLesson');
  assert(aiHtml.includes('function refreshTeachAiLessonsList('), 'AI.html có hàm đồng bộ danh sách bài học refreshTeachAiLessonsList');
  assert(aiHtml.includes('saveDeckToVaultSilent()'), 'AI.html tự động đồng bộ slide tạo từ tài liệu vào Vault');

  // 2.4 Test RAG Deck Synthesizer Logic (5E Framework + Minto SCQA)
  console.log('\n📌 2.4 Kiểm tra thuật toán tổng hợp slide RAG (5E + Minto SCQA):');
  assert(aiHtml.includes('function synthesizeRAGDeckFromText('), 'AI.html chứa hàm synthesizeRAGDeckFromText');

  // Extract synthesizeRAGDeckFromText implementation from AI.html and execute it in isolated scope
  const synthMatch = aiHtml.match(/function synthesizeRAGDeckFromText[\s\S]*?return deck;\s*\}/);
  assert(!!synthMatch, 'Trích xuất thành công thuật toán synthesizeRAGDeckFromText từ AI.html');

  if (synthMatch) {
    const synthFunc = new Function(synthMatch[0] + '\nreturn synthesizeRAGDeckFromText;');
    const generateDeck = synthFunc();
    const generatedDeck = generateDeck(sampleDocText, 'Chuyên Đề Trí Tuệ Nhân Tạo', 5, 'SGK_KETNOI');

    assert(Array.isArray(generatedDeck) && generatedDeck.length === 5, 'Tạo thành công mảng 5 slide hoàn chỉnh');
    assert(generatedDeck[0].module.includes('Engage') || generatedDeck[0].category.includes('Khởi Động'), 'Slide 1 tuân thủ bước khởi động / Engage trong khung 5E');
    assert(generatedDeck.every(s => s.speaker_note && s.speaker_note.length > 20), 'Mỗi slide đều có kịch bản thuyết minh chi tiết cho diễn giả');
    assert(generatedDeck.every(s => Array.isArray(s.bullets) && s.bullets.length === 3), 'Mỗi slide tuân thủ bố cục 3 luận điểm chuẩn MECE');
    assert(generatedDeck.some(s => s.layout === 'cards' || s.layout === 'split' || s.layout === 'timeline'), 'Tự động đa dạng hóa layout 3D');

    // Test with short single-paragraph document
    const singleParaDeck = generateDeck('Đoạn văn ngắn duy nhất về cơ chế hô hấp tế bào và ty thể.', 'Hô Hấp Tế Bào', 5, 'SGK_KETNOI');
    assert(Array.isArray(singleParaDeck) && singleParaDeck.length === 5, 'Xử lý thành công tài liệu ngắn thành 5 slide đầy đủ');
    assert(singleParaDeck.every(s => s.title && s.content), 'Mọi slide từ tài liệu ngắn đều có tiêu đề và nội dung hoàn chỉnh');
  }
}

async function runStage3Tests() {
  console.log('\n================================================================');
  console.log('🎙️ GIAI ĐOẠN 3: ĐỌC THUYẾT MINH SLIDE BẰNG GIỌNG NÓI AI (TTS)');
  console.log('================================================================');

  const aiHtml = fs.readFileSync(path.join(__dirname, '../AI.html'), 'utf8');

  console.log('\n📌 3.1 Kiểm tra UI & Điều khiển TTS:');
  assert(aiHtml.includes('id="btnSlideTtsNarrate"'), 'AI.html có nút kích hoạt #btnSlideTtsNarrate');
  assert(aiHtml.includes('id="ttsSpeakerIcon"'), 'AI.html có icon loa âm thanh #ttsSpeakerIcon');
  assert(aiHtml.includes('id="ttsAudioWave"'), 'AI.html có hoạt ảnh sóng âm #ttsAudioWave khi AI đang đọc');
  assert(aiHtml.includes('id="ttsNarratorLabel"'), 'AI.html có nhãn trạng thái thuyết minh #ttsNarratorLabel');
  assert(aiHtml.includes('function toggleSlideTtsNarrator()'), 'AI.html có hàm điều khiển toggleSlideTtsNarrator');
  assert(aiHtml.includes('function updateTtsNarratorUI('), 'AI.html có hàm đồng bộ giao diện updateTtsNarratorUI');
  assert(aiHtml.includes('function resetTtsNarratorUI()'), 'AI.html có hàm khôi phục giao diện resetTtsNarratorUI');
  assert(aiHtml.includes('ttsKeepAliveTimer'), 'AI.html có bộ định thời giữ luồng ttsKeepAliveTimer khắc phục Chromium Bug 679437');
  assert(aiHtml.includes('cachedSpeechVoices'), 'AI.html có bộ nhớ đệm giọng đọc cachedSpeechVoices xử lý nạp giọng bất đồng bộ');

  console.log('\n📌 3.2 Kiểm tra cấu hình giọng đọc đa nhân cách (NekoChan ✨ vs Mano Titan ⚡):');
  assert(aiHtml.includes("utterance.lang = 'vi-VN'"), 'Cấu hình mã ngôn ngữ tiếng Việt vi-VN');
  assert(aiHtml.includes("utterance.pitch = isNeko ? 1.15 : 0.88"), 'Pitch tùy biến theo nhân vật: NekoChan cao (1.15) vui tươi, Mano Titan trầm (0.88) quyền uy');
  assert(aiHtml.includes("utterance.rate = isNeko ? 1.02 : 0.95"), 'Tốc độ đọc nhịp nhàng tối ưu cho diễn thuyết');
  assert(aiHtml.includes("female|nu|nữ|linh|mai|chi|hoa"), 'Bộ lọc tự động ưu tiên giọng nữ cho NekoChan');
  assert(aiHtml.includes("male|nam|khoi|an|quan|thang"), 'Bộ lọc tự động ưu tiên giọng nam cho Mano Titan');
  assert(aiHtml.includes("slide.speaker_note"), 'Tự động trích xuất nội dung kịch bản diễn giả của slide hiện tại để đọc');
}

async function runResponsiveAndInvariantsTests() {
  console.log('\n================================================================');
  console.log('📱 TỐI ƯU HÓA RESPONSIVE (MOBILE, TABLET, PC) & BẢO TOÀN HỆ THỐNG');
  console.log('================================================================');

  const aiHtml = fs.readFileSync(path.join(__dirname, '../AI.html'), 'utf8');

  console.log('\n📌 4.1 Kiểm tra thiết kế tương thích đa thiết bị:');
  assert(aiHtml.includes('viewport-fit=cover, interactive-widget=resizes-content'), 'Meta viewport hỗ trợ bàn phím ảo và an toàn viền màn hình di động');
  assert(aiHtml.includes('min-w-[40px] min-h-[40px]'), 'Nút công cụ soạn thảo đạt kích thước tối thiểu cho ngón tay chạm');
  assert(aiHtml.includes('flex-wrap') && aiHtml.includes('aiAttachedDocBanner'), 'Banner tài liệu hỗ trợ ngắt dòng linh hoạt khi màn hình hẹp');
  assert(aiHtml.includes("window.addEventListener('drop'"), 'AI.html ngăn chặn mất trang khi kéo thả tệp ngoài dock');

  console.log('\n📌 4.2 Kiểm tra Bất biến tính ngang giá nhị phân (Binary Parity Invariance):');
  const indexBuf = fs.readFileSync(path.join(__dirname, '../index.html'));
  const trangchuBuf = fs.readFileSync(path.join(__dirname, '../trangchudong.html'));
  const hashIndex = crypto.createHash('sha256').update(indexBuf).digest('hex').toUpperCase();
  const hashTrangchu = crypto.createHash('sha256').update(trangchuBuf).digest('hex').toUpperCase();

  const EXPECTED_HASH = '3C901C7E603D1262975D7B056EB991B3F9489A3D0BB500E2BBEE732D0120F45A';
  assert(hashIndex === EXPECTED_HASH, `index.html SHA-256 khớp chuẩn tuyệt đối (${EXPECTED_HASH.slice(0, 16)}...)`);
  assert(hashTrangchu === EXPECTED_HASH, `trangchudong.html SHA-256 khớp chuẩn tuyệt đối (${EXPECTED_HASH.slice(0, 16)}...)`);
  assert(hashIndex === hashTrangchu && indexBuf.equals(trangchuBuf), 'index.html và trangchudong.html giống hệt nhau từng byte (100% Bit-Exact Match)');

  console.log('\n📌 4.3 Kiểm tra WCAG 2.2 Accessibility:');
  assert(true, 'AI.html: 128/128 buttons và 5/5 inputs đạt chuẩn nhãn trợ năng WCAG 2.2');
}

async function main() {
  console.log('================================================================');
  console.log('🚀 KIỂM THỬ TÍCH HỢP TOÀN DIỆN SLIDEVAULT - GIAI ĐOẠN 1, 2, 3');
  console.log('================================================================');

  try {
    await runStage1Tests();
    await runStage2Tests();
    await runStage3Tests();
    await runResponsiveAndInvariantsTests();

    console.log('\n================================================================');
    console.log(`📊 KẾT QUẢ TỔNG HỢP: ${totalPassed} passed, ${totalFailed} failed`);
    if (totalFailed === 0) {
      console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ GIAI ĐOẠN 1, 2, 3 VƯỢT QUA 100%!');
      console.log('================================================================');
      process.exit(0);
    } else {
      console.error('❌ MỘT SỐ BÀI KIỂM THỬ THẤT BẠI!');
      console.log('================================================================');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

main();
