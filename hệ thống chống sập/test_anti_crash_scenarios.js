/**
 * ============================================================================
 * KIỂM THỬ TOÀN DIỆN HỆ THỐNG CHỐNG SẬP & PHÒNG THỦ BẢO MẬT SLIDEVAULT PRO
 * Tệp: hệ thống chống sập/test_anti_crash_scenarios.js
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const API_KEY = 'sv_sec_9942a78fbc310d2e8417';
const ADMIN_KEY = 'sv_admin_master_e49bc701f28d';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function pass(name, detail = '') {
  totalTests++;
  passedTests++;
  console.log(`  ✅ [PASS] ${name} ${detail ? `(${detail})` : ''}`);
}

function fail(name, reason = '') {
  totalTests++;
  failedTests++;
  console.error(`  ❌ [FAIL] ${name} -> ${reason}`);
}

function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      path: url.pathname + url.search
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (options.body) {
      req.write(typeof options.body === 'object' ? JSON.stringify(options.body) : options.body);
    }
    req.end();
  });
}

async function unbanSelf() {
  try {
    await request('/api/security/unban', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ADMIN_KEY
      },
      body: { ip: '127.0.0.1' }
    });
  } catch (e) {}
}

async function runAllScenarios() {
  console.log('\n================================================================');
  console.log('🛡️ BẮT ĐẦU KIỂM THỬ HỆ THỐNG CHỐNG SẬP & BẢO MẬT HACK SLIDEVAULT');
  console.log('================================================================\n');

  // Đảm bảo dọn dẹp trạng thái trước khi chạy
  await unbanSelf();

  // --- KỊCH BẢN 1: BẢO MẬT & XÁC THỰC API KEY ---
  console.log('📌 [KỊCH BẢN 1] Kiểm tra Xác thực API Key môi trường (.env):');
  try {
    const resNoKey = await request('/api/security/shield-status');
    if (resNoKey.statusCode === 200 && resNoKey.json?.authenticated === false) {
      pass('Truy cập không API Key', 'authenticated: false đúng quy chuẩn');
    } else {
      fail('Truy cập không API Key', `status: ${resNoKey.statusCode}, auth: ${resNoKey.json?.authenticated}`);
    }

    const resBadKey = await request('/api/security/shield-status', {
      headers: { 'X-API-Key': 'key_gia_mao_hack_123' }
    });
    if (resBadKey.statusCode === 200 && resBadKey.json?.authenticated === false) {
      pass('Truy cập với API Key giả mạo', 'Từ chối xác thực thành công');
    } else {
      fail('Truy cập với API Key giả mạo', 'Không phát hiện key giả');
    }

    const resGoodKey = await request('/api/security/shield-status', {
      headers: { 'X-API-Key': API_KEY }
    });
    if (resGoodKey.statusCode === 200 && resGoodKey.json?.authenticated === true) {
      pass('Truy cập với API Key hệ thống (SLIDEVAULT_API_KEY)', 'authenticated: true');
    } else {
      fail('Truy cập với API Key hệ thống', `status: ${resGoodKey.statusCode}`);
    }

    const resAdminKey = await request('/api/security/shield-status', {
      headers: { 'X-API-Key': ADMIN_KEY }
    });
    if (resAdminKey.statusCode === 200 && resAdminKey.json?.authenticated === true) {
      pass('Truy cập với Admin Master Key (ADMIN_API_KEY)', 'Xác thực đặc quyền thành công');
    } else {
      fail('Truy cập với Admin Master Key', 'Thất bại');
    }
  } catch (err) {
    fail('Kịch bản 1 lỗi ngoại lệ', err.message);
  }

  // --- KỊCH BẢN 2: WAF WEB APPLICATION FIREWALL CHỐNG HACK ---
  console.log('\n📌 [KỊCH BẢN 2] Kiểm thử WAF Chống Tấn Công (SQLi, XSS, Path Traversal, Shell):');
  try {
    // 2.1 SQL Injection
    const resSql = await request("/api/chat?search=' OR '1'='1");
    if (resSql.statusCode === 403 && resSql.json?.code === 'SEC_WAF_BLOCK') {
      pass('Chặn tấn công SQL Injection', resSql.json?.threatType);
    } else {
      fail('Chặn SQL Injection', `status: ${resSql.statusCode}`);
    }

    // 2.2 XSS Attack
    const resXss = await request('/api/chat?query=<script>alert("hacked")</script>');
    if (resXss.statusCode === 403 && resXss.json?.code === 'SEC_WAF_BLOCK') {
      pass('Chặn tấn công Cross-Site Scripting (XSS)', resXss.json?.threatType);
    } else {
      fail('Chặn XSS', `status: ${resXss.statusCode}`);
    }

    // 2.3 Path Traversal
    const resPath = await request('/api/download?file=../../win.ini');
    if (resPath.statusCode === 403 || resPath.statusCode === 404) {
      pass('Chặn tấn công Path Traversal (Directory Traversal)', `status: ${resPath.statusCode}`);
    } else {
      fail('Chặn Path Traversal', `status: ${resPath.statusCode}`);
    }

    // 2.4 Command Injection
    const resCmd = await request('/api/tools?opt=; rm -rf /');
    if (resCmd.statusCode === 403 && resCmd.json?.code === 'SEC_WAF_BLOCK') {
      pass('Chặn tấn công Remote Command Injection', resCmd.json?.threatType);
    } else {
      fail('Chặn Command Injection', `status: ${resCmd.statusCode}`);
    }

    // 2.5 Null Byte Injection
    const resNull = await request('/api/data?id=1%00admin');
    if (resNull.statusCode === 403 && resNull.json?.code === 'SEC_WAF_BLOCK') {
      pass('Chặn tấn công Null Byte Poisoning', resNull.json?.threatType);
    } else {
      fail('Chặn Null Byte', `status: ${resNull.statusCode}`);
    }
  } catch (err) {
    fail('Kịch bản 2 lỗi ngoại lệ', err.message);
  }

  // Đảm bảo IP sạch sẽ sau bài kiểm tra WAF
  await unbanSelf();

  // --- KỊCH BẢN 3: PROCESS CRASH IMMUNITY (TỰ PHỤC HỒI KHI CÓ SỰ CỐ MÃ) ---
  console.log('\n📌 [KỊCH BẢN 3] Kiểm thử Cơ Chế Chống Sập Máy Chủ (Process Crash Immunity):');
  try {
    // 3.1 Bắn lỗi Unhandled Promise Rejection
    const resRejection = await request(`/api/test-crash?type=rejection&apiKey=${API_KEY}`);
    if (resRejection.statusCode === 200) {
      pass('Kích hoạt mô phỏng Promise Rejection khẩn cấp', resRejection.json?.message);
    } else {
      fail('Kích hoạt Promise Rejection', `status: ${resRejection.statusCode}`);
    }

    // 3.2 Bắn lỗi Uncaught Exception (Ngoại lệ nghiêm trọng)
    const resException = await request(`/api/test-crash?type=exception&apiKey=${API_KEY}`);
    if (resException.statusCode === 200) {
      pass('Kích hoạt mô phỏng Uncaught Exception đột ngột', resException.json?.message);
    } else {
      fail('Kích hoạt Uncaught Exception', `status: ${resException.statusCode}`);
    }

    // Chờ 300ms xem tiến trình máy chủ có bị crash hay không
    await new Promise((r) => setTimeout(r, 400));

    // 3.3 Kiểm tra máy chủ có còn sống và ghi nhận crashesPrevented
    const resHealth = await request('/api/security/shield-status', {
      headers: { 'X-API-Key': API_KEY }
    });
    if (resHealth.statusCode === 200 && resHealth.json?.status === 'active') {
      pass('Máy chủ vẫn sống sót 100% sau sự cố ngoại lệ!', `crashesPrevented: ${resHealth.json?.stats?.crashesPrevented}`);
    } else {
      fail('Máy chủ bị sập sau Exception!', `status: ${resHealth.statusCode}`);
    }
  } catch (err) {
    fail('Kịch bản 3 lỗi ngoại lệ', err.message);
  }

  // --- KỊCH BẢN 4: GIAO DIỆN LỖI 404 KHI WEB CÓ SỰ CỐ HOẶC KHÔNG TÌM THẤY ---
  console.log('\n📌 [KỊCH BẢN 4] Kiểm thử Hiển Thị 404 (Từ 404.txt SVG Animated Face):');
  try {
    // 4.1 Truy cập route lạ -> Hiện 404.html
    const res404Route = await request('/duong-dan-khong-ton-tai-abc-xyz');
    if (res404Route.statusCode === 404 && res404Route.body.includes('face__eyes') && res404Route.body.includes('404')) {
      pass('Đường dẫn không tồn tại tự động trả về 404.html với Animated Face SVG', 'HTTP 404 Verified');
    } else {
      fail('Trả về 404.html cho đường dẫn sai', `status: ${res404Route.statusCode}`);
    }

    // 4.2 Truy cập trực tiếp /404.html
    const resDirect404 = await request('/404.html');
    if ((resDirect404.statusCode === 200 || resDirect404.statusCode === 404) && resDirect404.body.includes('my-custom-face-container')) {
      pass('Trang 404.html tích hợp đầy đủ mẫu từ 404.txt', 'Tương thích 100%');
    } else {
      fail('Trang 404.html trực tiếp', `status: ${resDirect404.statusCode}`);
    }
  } catch (err) {
    fail('Kịch bản 4 lỗi ngoại lệ', err.message);
  }

  // --- KỊCH BẢN 5: TÍCH HỢP CLIENT WATCHDOG TRÊN TẤT CẢ CÁC TRANG HTML ---
  console.log('\n📌 [KỊCH BẢN 5] Kiểm tra Tiêm Mã Bảo Vệ Watchdog Trên Toàn Bộ Giao Diện:');
  const projectPages = [
    'AI.html', 'setting.html', 'trangchudong.html', 'dangnhap.html',
    'dangki.html', 'khoiphuctaikhoan.html', 'vault.html', 'thuvienmau.html',
    'security.html', 'service-admin.html', 'trinhchieuchiase.html',
    'phoimau.html', 'phoneindex.html', 'vebieudonhanh.html', 'vanban.html',
    'index.html', '404.html'
  ];

  let pagesWithShield = 0;
  for (const page of projectPages) {
    const filePath = path.join(__dirname, '..', page);
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf8');
      if (html.includes('anti-crash-client.js')) {
        pagesWithShield++;
      }
    }
  }

  if (pagesWithShield === projectPages.length) {
    pass(`Tất cả ${projectPages.length}/${projectPages.length} trang HTML chính đều được bảo vệ bởi anti-crash-client.js`, 'Toàn diện 100%');
  } else {
    fail(`Độ phủ trang HTML: ${pagesWithShield}/${projectPages.length}`, 'Một số trang thiếu mã bảo vệ');
  }

  // Kiểm tra file static client
  try {
    const resClientJs = await request('/tệp hệ thống/anti-crash-client.js');
    if (resClientJs.statusCode === 200 && resClientJs.body.includes('SlideVaultShield')) {
      pass('Tệp chống sập client được máy chủ phân phối thành công', 'HTTP 200 OK');
    } else {
      fail('Phân phối tệp chống sập client', `status: ${resClientJs.statusCode}`);
    }
  } catch (err) {
    fail('Tải anti-crash-client.js thất bại', err.message);
  }

  // --- KỊCH BẢN 6: ANTI-DDOS RATE LIMIT & IP BAN / UNBAN ---
  console.log('\n📌 [KỊCH BẢN 6] Kiểm thử Giới Hạn Tần Suất (Rate Limiting) & Tự Động Khóa IP:');
  try {
    // Gửi 105 request liên tục tới API để kích hoạt phòng thủ Rate Limit
    let rateLimited = false;
    for (let i = 0; i < 110; i++) {
      const resFlood = await request('/api/attack-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { testFlood: i }
      });
      if (resFlood.statusCode === 429) {
        rateLimited = true;
        break;
      }
    }

    if (rateLimited) {
      pass('Hệ thống Anti-DDoS phát hiện yêu cầu dồn dập và trả về HTTP 429 Too Many Requests', 'Tự động khóa IP thành công');
    } else {
      fail('Anti-DDoS Rate Limiter', 'Không kích hoạt mã 429 khi gửi >100 requests');
    }

    // Mở khóa IP lại bằng Admin API Key
    const resUnban = await request('/api/security/unban', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ADMIN_KEY
      },
      body: { ip: '127.0.0.1' }
    });

    if (resUnban.statusCode === 200 && resUnban.json?.success === true) {
      pass('Mở khóa IP quản trị qua /api/security/unban với ADMIN_API_KEY', 'Khôi phục kết nối thành công');
    } else {
      fail('Mở khóa IP qua admin API', `status: ${resUnban.statusCode}`);
    }

    // Kiểm tra kết nối lại sau khi unban
    const resPostUnban = await request('/api/security/shield-status', {
      headers: { 'X-API-Key': API_KEY }
    });
    if (resPostUnban.statusCode === 200) {
      pass('IP kết nối bình thường trở lại sau khi mở khóa', 'Hệ thống hoạt động mượt mà');
    } else {
      fail('Kết nối lại sau unban', `status: ${resPostUnban.statusCode}`);
    }
  } catch (err) {
    fail('Kịch bản 6 lỗi ngoại lệ', err.message);
  }

  // --- KỊCH BẢN 7: KIỂM THỬ ĐIỀU KHIỂN & MÔ PHỎNG PHÒNG THỦ TRỰC TIẾP ---
  console.log('\n📌 [KỊCH BẢN 7] Kiểm thử Điều Khiển & Mô Phỏng Phòng Thủ (/api/security/simulate-threat):');
  try {
    const resSimWaf = await request('/api/security/simulate-threat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { type: 'sqli' }
    });
    if (resSimWaf.statusCode === 403 && resSimWaf.json?.status === 'BLOCKED') {
      pass('Mô phỏng thử nghiệm SQL Injection: WAF chặn lập tức HTTP 403', 'status: BLOCKED');
    } else {
      fail('Mô phỏng thử nghiệm SQLi', `status: ${resSimWaf.statusCode}`);
    }

    const resSimCrash = await request('/api/security/simulate-threat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { type: 'crash_exception' }
    });
    if (resSimCrash.statusCode === 200 && resSimCrash.json?.status === 'AUTO_HEALED') {
      pass('Mô phỏng thử nghiệm Uncaught Exception: Máy chủ tự phục hồi 100%', `Crashes: ${resSimCrash.json?.crashesPrevented}`);
    } else {
      fail('Mô phỏng thử nghiệm Uncaught Exception', `status: ${resSimCrash.statusCode}`);
    }
  } catch (err) {
    fail('Kịch bản 7 lỗi ngoại lệ', err.message);
  }

  // --- KỊCH BẢN 8: KIỂM THỬ GIÁM SÁT SỨC KHỎE & THÔNG SỐ BỘ NHỚ ---
  console.log('\n📌 [KỊCH BẢN 8] Kiểm thử Giám Sát Sức Khỏe & Trạng Thái Bộ Nhớ Máy Chủ:');
  try {
    const resMetrics = await request('/api/security/shield-status');
    const data = resMetrics.json;
    if (resMetrics.statusCode === 200 && data?.memory?.heapUsedMB !== undefined) {
      pass('Endpoint /api/security/shield-status trả về RAM Heap & Uptime chuẩn xác', `Heap: ${data.memory.heapUsedMB}MB / ${data.memory.heapTotalMB}MB, Uptime: ${data.uptimeFormatted}`);
    } else {
      fail('Endpoint kiểm tra sức khỏe RAM', `status: ${resMetrics.statusCode}`);
    }

    if (data?.protectionLevel === 'ENTERPRISE_IMMUNE') {
      pass('Cấp độ bảo vệ hệ thống đạt chuẩn Enterprise: ENTERPRISE_IMMUNE', 'Bất tử trước tấn công');
    } else {
      fail('Cấp độ bảo vệ hệ thống', `level: ${data?.protectionLevel}`);
    }
  } catch (err) {
    fail('Kịch bản 8 lỗi ngoại lệ', err.message);
  }

  // --- TỔNG KẾT ---
  console.log('\n================================================================');
  console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT CHUẨN (${Math.round((passedTests/totalTests)*100)}%)`);
  if (failedTests === 0) {
    console.log('🏆 TẤT CẢ KỊCH BẢN CHỐNG SẬP & BẢO MẬT HACK ĐỀU VƯỢT QUA XUẤT SẮC!');
  } else {
    console.log(`⚠️ Có ${failedTests} bài kiểm thử chưa đạt. Cần tinh chỉnh thêm.`);
  }
  console.log('================================================================\n');

  process.exit(failedTests === 0 ? 0 : 1);
}

runAllScenarios();
