/**
 * Unit Test for Mathematical Security & Hardening Extensions in SlideVault
 * File: hệ thống chống sập/test_math_security.js
 */

const assert = require('assert');
const shield = require('./anti-crash-server.js');

console.log('\n================================================================');
console.log('📐 KIỂM THỬ ĐƠN VỊ TOÁN HỌC BẢO MẬT & PHÒNG THỦ MỞ RỘNG');
console.log('================================================================\n');

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name} -> ${err.message}`);
  }
}

// 1. SSRF & Private IP Math
console.log('📌 1. Kiểm tra Toán học Phân dải IP & Chống SSRF (RFC 1918, RFC 6598, RFC 3927, Loopback):');

test('Phát hiện chính xác Loopback (127.0.0.1, 127.255.255.255)', () => {
  assert.strictEqual(shield.isPrivateOrReservedIp('127.0.0.1'), true);
  assert.strictEqual(shield.isPrivateOrReservedIp('127.12.34.56'), true);
});

test('Phát hiện chính xác Dải RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)', () => {
  assert.strictEqual(shield.isPrivateOrReservedIp('10.0.0.1'), true);
  assert.strictEqual(shield.isPrivateOrReservedIp('10.254.1.99'), true);
  assert.strictEqual(shield.isPrivateOrReservedIp('172.16.0.1'), true);
  assert.strictEqual(shield.isPrivateOrReservedIp('172.31.255.254'), true);
  assert.strictEqual(shield.isPrivateOrReservedIp('192.168.1.1'), true);
  assert.strictEqual(shield.isPrivateOrReservedIp('192.168.2.121'), true);
  // IP công cộng hợp lệ
  assert.strictEqual(shield.isPrivateOrReservedIp('8.8.8.8'), false);
  assert.strictEqual(shield.isPrivateOrReservedIp('1.1.1.1'), false);
  assert.strictEqual(shield.isPrivateOrReservedIp('142.250.190.46'), false);
});

test('Phát hiện Cloud Metadata Service (169.254.169.254 & Link-local RFC 3927)', () => {
  assert.strictEqual(shield.isPrivateOrReservedIp('169.254.169.254'), true);
  assert.strictEqual(shield.isPrivateOrReservedIp('169.254.1.1'), true);
});

test('validateSsrfSafeUrl chặn scheme nguy hiểm và domain metadata', () => {
  assert.strictEqual(shield.validateSsrfSafeUrl('file:///etc/passwd').safe, false);
  assert.strictEqual(shield.validateSsrfSafeUrl('gopher://127.0.0.1:6379').safe, false);
  assert.strictEqual(shield.validateSsrfSafeUrl('http://169.254.169.254/latest/meta-data/').safe, false);
  assert.strictEqual(shield.validateSsrfSafeUrl('http://metadata.google.internal/computeMetadata/v1/').safe, false);
  assert.strictEqual(shield.validateSsrfSafeUrl('http://localhost:3000/api/secret').safe, false);
  assert.strictEqual(shield.validateSsrfSafeUrl('https://api.github.com/repos').safe, true);
});

// 2. Timing-Safe Constant Time Compare
console.log('\n📌 2. Kiểm tra Timing-Safe Crypto Comparison (SHA-256 Digest):');

test('So sánh chuỗi đúng/sai không bị rò rỉ độ dài chuỗi', () => {
  assert.strictEqual(shield.timingSafeCompare('secret-token-12345', 'secret-token-12345'), true);
  assert.strictEqual(shield.timingSafeCompare('short', 'very-long-string-that-would-leak-length'), false);
  assert.strictEqual(shield.timingSafeCompare('', 'non-empty'), false);
  assert.strictEqual(shield.timingSafeCompare('abc', 'abd'), false);
  assert.strictEqual(shield.timingSafeCompare(null, 'secret'), false);
});

// 3. Mathematical Token Bucket Algorithm
console.log('\n📌 3. Kiểm tra Toán học Token Bucket & Hồi phục Token theo thời gian:');

test('Token Bucket cho phép burst và chặn khi cạn kiệt tokens', () => {
  const testIp = '198.51.100.42'; // TEST-NET-3 IP
  shield.tokenBuckets.delete(testIp);

  // Gửi 120 tokens (dung lượng burst C=120)
  let allowedCount = 0;
  for (let i = 0; i < 120; i++) {
    const res = shield.consumeTokenBucket(testIp);
    if (res.allowed) allowedCount++;
  }
  assert.strictEqual(allowedCount, 120, 'Cho phép trọn vẹn 120 tokens burst');

  // Request thứ 121 phải bị từ chối ngay lập tức vì bucket đã rỗng
  const rejectedRes = shield.consumeTokenBucket(testIp);
  assert.strictEqual(rejectedRes.allowed, false, 'Chặn khi rỗng bucket');
});

// 4. Exponential Backoff Formula
console.log('\n📌 4. Kiểm tra Công thức Tăng hình phạt thời gian khóa IP (Exponential Backoff):');

test('Tính toán thời gian khóa IP theo hàm số mũ 2^(n-1)', () => {
  const testIp = '198.51.100.99';
  shield.penaltyLevels.delete(testIp);

  const base = shield.CONFIG.banDurationMs;
  const duration1 = shield.calculateBanDuration(testIp);
  assert.strictEqual(duration1, base, 'Lần 1: 5 phút cơ sở (hoặc cấu hình .env)');

  const duration2 = shield.calculateBanDuration(testIp);
  assert.strictEqual(duration2, base * 2, 'Lần 2: 10 phút (nhân đôi)');

  const duration3 = shield.calculateBanDuration(testIp);
  assert.strictEqual(duration3, base * 4, 'Lần 3: 20 phút (nhân bốn)');
});

// 5. WAF Prototype Pollution Protection
console.log('\n📌 5. Kiểm tra WAF Phòng thủ Prototype Pollution:');

test('WAF phát hiện và bắt giữ các payload Prototype Pollution', () => {
  const threat1 = shield.inspectWafThreat('{"__proto__": {"admin": true}}', '/api/user');
  assert.ok(threat1, 'Bắt giữ __proto__ payload');
  assert.strictEqual(threat1.type, 'Prototype Pollution');

  const threat2 = shield.inspectWafThreat('{"constructor": {"prototype": {"polluted": "yes"}}}', '/api/save');
  assert.ok(threat2, 'Bắt giữ constructor.prototype payload');
  assert.strictEqual(threat2.type, 'Prototype Pollution');
});

console.log('\n================================================================');
console.log(`📊 KẾT QUẢ KIỂM THỬ TOÁN HỌC: ${passed}/${total} ĐẠT CHUẨN (${Math.round((passed/total)*100)}%)`);
console.log('================================================================\n');

process.exit(passed === total ? 0 : 1);

