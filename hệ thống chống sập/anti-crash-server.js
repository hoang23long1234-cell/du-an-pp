/**
 * ============================================================================
 * SlideVault Pro · Hệ Thống Phòng Thủ & Chống Sập Máy Chủ (anti-crash-server.js)
 * ----------------------------------------------------------------------------
 * 1. Process Crash Immunity (Tự phục hồi, bắt uncaughtException & unhandledRejection)
 * 2. WAF Web Application Firewall (Chống SQLi, XSS, Path Traversal, Shell Injection)
 * 3. Anti-DDoS & Adaptive Rate Limiting (Giới hạn tần suất & Tự động khóa IP tấn công)
 * 4. API Key Guard (Bảo vệ điểm cuối API với môi trường .env)
 * 5. Instant 404 / 500 Crash Shield (Tự động kích hoạt giao diện lỗi 404 khi sập)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

// Load .env from "hệ thống chống sập" or root
try {
  const dotenv = require('dotenv');
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
} catch (e) {
  // dotenv optional fallback
}

const CONFIG = {
  apiKey: process.env.SLIDEVAULT_API_KEY || 'sv_sec_9942a78fbc310d2e8417',
  adminApiKey: process.env.ADMIN_API_KEY || 'sv_admin_master_e49bc701f28d',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15000', 10),
  banDurationMs: parseInt(process.env.RATE_LIMIT_BAN_MINUTES || '5', 10) * 60 * 1000,
  autoRecover: process.env.CRASH_AUTO_RECOVER !== 'false',
  wafEnabled: process.env.SHIELD_WAF_ENABLED !== 'false',
  logPath: path.resolve(__dirname, '..', process.env.SECURITY_LOG_PATH || 'security-events.log')
};

// State stores
const ipRequestHistory = new Map(); // ip -> Array of timestamps
const bannedIps = new Map(); // ip -> unban timestamp
const attackScores = new Map(); // ip -> score

// Statistics
const stats = {
  uptimeStart: Date.now(),
  totalRequests: 0,
  blockedAttacks: 0,
  rateLimitedRequests: 0,
  crashesPrevented: 0,
  activeBannedIps: 0
};

// Recent security events ring-buffer (giữ 50 sự kiện gần nhất cho dashboard)
const recentEvents = [];
let securityEventListener = null;

function setSecurityEventListener(listener) {
  securityEventListener = listener;
}

// ----------------------------------------------------------------------------
// 1. GHI NHẬT KÝ BẢO MẬT (SECURITY EVENT LOGGING & SSE BROADCAST)
// ----------------------------------------------------------------------------
function logSecurityEvent(type, ip, details = {}) {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    ip: ip || 'unknown',
    details,
    action: details.action || (type.includes('BLOCKED') ? 'BLOCKED' : (type.includes('PREVENTED') || type.includes('CAUGHT') ? 'AUTO_HEALED' : 'INTERCEPTED'))
  };

  recentEvents.unshift(event);
  if (recentEvents.length > 50) recentEvents.pop();

  const line = JSON.stringify(event) + '\n';
  try {
    fs.appendFileSync(CONFIG.logPath, line, 'utf8');
  } catch (err) {
    console.error('[Shield Log Error]', err.message);
  }

  // Thông báo tới lắng nghe sự kiện (SSE stream trên security.html)
  if (typeof securityEventListener === 'function') {
    try {
      securityEventListener(event);
    } catch (e) {
      // Bỏ qua lỗi listener
    }
  }
}

// ----------------------------------------------------------------------------
// 2. TỰ PHỤC HỒI KHI CÓ SỰ CỐ MÃ NGUỒN (PROCESS CRASH IMMUNITY)
// ----------------------------------------------------------------------------
function setupProcessCrashGuard() {
  // Bắt lỗi không mong muốn chưa được try/catch
  process.on('uncaughtException', (error, origin) => {
    stats.crashesPrevented++;
    console.error('🛡️ [SHIELD CRASH PREVENTED] Uncaught Exception:', error?.message || error);
    if (error?.stack) console.error(error.stack);

    logSecurityEvent('UNCAUGHT_EXCEPTION_PREVENTED', 'system', {
      error: error?.message,
      origin: String(origin),
      crashesPrevented: stats.crashesPrevented
    });

    if (!CONFIG.autoRecover) {
      process.exit(1);
    }
  });

  // Bắt lỗi Promise bị reject chưa có .catch()
  process.on('unhandledRejection', (reason, promise) => {
    stats.crashesPrevented++;
    console.warn('🛡️ [SHIELD REJECTION CAUGHT] Unhandled Promise Rejection:', reason);

    logSecurityEvent('UNHANDLED_REJECTION_CAUGHT', 'system', {
      reason: String(reason)
    });
  });

  // Giám sát dung lượng RAM bộ nhớ tránh rò rỉ (Memory Leak Watchdog)
  setInterval(() => {
    const mem = process.memoryUsage();
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
    if (heapUsedMB > 450) {
      console.warn(`⚠️ [SHIELD MEMORY WARNING] Heap sử dụng cao: ${heapUsedMB} MB. Đang kích hoạt dọn rác...`);
      if (global.gc) {
        try { global.gc(); } catch (e) {}
      }
    }
  }, 30000);
}

// ----------------------------------------------------------------------------
// 3. WAF: BỘ LỌC CHỐNG TẤN CÔNG WEB TOÀN DIỆN (SQLI, XSS, TRAVERSAL, INJECTION, PROTOTYPE POLLUTION, SSRF)
// ----------------------------------------------------------------------------
const WAF_PATTERNS = [
  { name: 'Path Traversal', regex: /(\.\.[\/\\]|%2e%2e[\/\\]|etc[\/\\]passwd|win\.ini|system32|web\.config|\.env)/i },
  { name: 'SQL Injection', regex: /(\/\*|\*\/|;\s*drop\s+table|;\s*truncate\s+table|union\s+select|'\s*or\s*'1'='1|or\s+1\s*=\s*1|information_schema|benchmark\s*\(|sleep\s*\()/i },
  { name: 'XSS Attack', regex: /(<script\b[^>]*>|javascript:\s*alert|onerror\s*=\s*alert|document\.cookie|<svg\b[^>]*onload|alert\s*\(|prompt\s*\()/i },
  { name: 'Command Injection', regex: /(;\s*(rm\s+-rf|del\s+\/[a-z]|shutdown|netstat|whoami|cat\s+\/etc|type\s+c:\\)|\|\s*(rm|shutdown|del)\s+|`.*?`|\$\(.*?\))/i },
  { name: 'Prototype Pollution', regex: /(__proto__|constructor\s*(\.|\[|"\s*:\s*\{[^}]*")\s*prototype|Object\.prototype)/i },
  { name: 'Cloud Metadata / SSRF Probe', regex: /(169\.254\.169\.254|metadata\.google\.internal|latest\/meta-data|instance-data)/i },
  { name: 'Null Byte & CRLF Injection', regex: /(%00|\x00|\r\n|%0d%0a)/i }
];

function checkStringWaf(str) {
  if (!str || typeof str !== 'string') return null;
  for (const p of WAF_PATTERNS) {
    if (p.regex.test(str)) return p.name;
  }
  return null;
}

function scanObjectWaf(obj, depth = 0, parentKey = '') {
  if (!obj || depth > 5) return null;
  if (typeof obj === 'string') return checkStringWaf(obj);
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key === '__proto__' || (parentKey === 'constructor' && key === 'prototype')) {
        return 'Prototype Pollution';
      }
      const threatInKey = checkStringWaf(key);
      if (threatInKey) return `${threatInKey} in parameter key: ${key}`;
      const threatInVal = scanObjectWaf(obj[key], depth + 1, key);
      if (threatInVal) return threatInVal;
    }
  }
  return null;
}

function inspectWafThreat(target, urlPath = '') {
  let threat = null;
  if (typeof target === 'string') {
    threat = checkStringWaf(target);
    if (!threat) {
      try {
        const parsed = JSON.parse(target);
        threat = scanObjectWaf(parsed);
      } catch (e) {}
    }
  } else if (typeof target === 'object') {
    threat = scanObjectWaf(target);
  }
  if (!threat && urlPath) {
    threat = checkStringWaf(urlPath);
  }
  return threat ? { type: threat } : null;
}

// ----------------------------------------------------------------------------
// 4. TOÁN HỌC PHÒNG THỦ: TOKEN BUCKET RATE LIMITING & EXPONENTIAL PENALTY
// ----------------------------------------------------------------------------
const tokenBuckets = new Map(); // ip -> { tokens: number, lastRefill: number }
const penaltyLevels = new Map(); // ip -> number (consecutive violations)
const TOKEN_BUCKET_CAPACITY = parseInt(process.env.TOKEN_BUCKET_CAPACITY || '120', 10);
const TOKEN_REFILL_RATE_PER_SEC = parseFloat(process.env.TOKEN_REFILL_RATE || '12');

function normalizeIp(ip) {
  if (!ip) return '127.0.0.1';
  let str = String(ip).trim();
  if (str === '::1' || str === '::ffff:127.0.0.1') return '127.0.0.1';
  if (str.startsWith('::ffff:')) return str.substring(7);
  return str;
}

function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return normalizeIp(String(cfIp));
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return normalizeIp(String(forwarded).split(',')[0]);
  }
  return normalizeIp(req.socket?.remoteAddress || req.ip);
}

function isIpBanned(ip) {
  if (!bannedIps.has(ip)) return false;
  const unbanTime = bannedIps.get(ip);
  if (Date.now() > unbanTime) {
    bannedIps.delete(ip);
    attackScores.delete(ip);
    return false;
  }
  return true;
}

function calculateBanDuration(ip) {
  const currentPenalty = (penaltyLevels.get(ip) || 0) + 1;
  penaltyLevels.set(ip, currentPenalty);
  const multiplier = Math.pow(2, Math.min(currentPenalty - 1, 8));
  return Math.min(24 * 3600 * 1000, CONFIG.banDurationMs * multiplier);
}

function banIp(ip, reason = 'Excessive Requests') {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
    console.warn(`[SHIELD IP BAN BYPASS] Bỏ qua khóa IP máy cục bộ localhost / 127.0.0.1 (${reason})`);
    return;
  }
  const banDuration = calculateBanDuration(ip);
  const currentPenalty = penaltyLevels.get(ip) || 1;

  const unbanAt = Date.now() + banDuration;
  bannedIps.set(ip, unbanAt);
  stats.activeBannedIps = bannedIps.size;
  console.warn(`🚫 [SHIELD IP BAN] Tạm thời khóa IP: ${ip} trong ${Math.round(banDuration / 1000)}s (Mức phạt cấp ${currentPenalty}). Lý do: ${reason}`);
  logSecurityEvent('IP_BANNED', ip, { reason, penaltyLevel: currentPenalty, durationSeconds: Math.round(banDuration / 1000), unbanAt: new Date(unbanAt).toISOString() });
}

/**
 * Thuật toán Token Bucket: Tiêu thụ 1 token nếu khả dụng.
 * Trả về { allowed: boolean, remainingTokens: number }
 */
function consumeTokenBucket(ip) {
  const now = Date.now();
  let bucket = tokenBuckets.get(ip);
  if (!bucket) {
    bucket = { tokens: TOKEN_BUCKET_CAPACITY, lastRefill: now };
    tokenBuckets.set(ip, bucket);
  }

  // Bơm thêm token theo thời gian trôi qua: delta_t * refillRate
  const elapsedSeconds = (now - bucket.lastRefill) / 1000;
  if (elapsedSeconds > 0) {
    bucket.tokens = Math.min(TOKEN_BUCKET_CAPACITY, bucket.tokens + elapsedSeconds * TOKEN_REFILL_RATE_PER_SEC);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1.0) {
    bucket.tokens -= 1.0;
    return { allowed: true, remainingTokens: Math.floor(bucket.tokens) };
  } else {
    return { allowed: false, remainingTokens: 0 };
  }
}

// ----------------------------------------------------------------------------
// 5. TOÁN HỌC AN TOÀN BỘ NHỚ & MẬT MÃ TIMING-SAFE
// ----------------------------------------------------------------------------
function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  // Băm trước qua SHA-256 để đảm bảo độ dài buffer cố định 32 bytes, triệt tiêu rò rỉ độ dài
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function validateApiKey(providedKey) {
  if (!providedKey) return false;
  return timingSafeCompare(providedKey, CONFIG.apiKey) || timingSafeCompare(providedKey, CONFIG.adminApiKey);
}

// ----------------------------------------------------------------------------
// 5.1 TOÁN HỌC PHÒNG CHỐNG SSRF (SERVER-SIDE REQUEST FORGERY MITIGATION)
// ----------------------------------------------------------------------------
function isPrivateOrReservedIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const cleanIp = ip.trim();

  // IPv6 loopback & link-local
  if (cleanIp === '::1' || cleanIp === '::' || cleanIp.toLowerCase().startsWith('fe80:') || cleanIp.toLowerCase().startsWith('fc00:') || cleanIp.toLowerCase().startsWith('fd00:')) {
    return true;
  }

  // IPv4 mapping
  const ipv4 = cleanIp.startsWith('::ffff:') ? cleanIp.substring(7) : cleanIp;
  if (net.isIP(ipv4) !== 4) {
    return false; // Không phải IPv4 (có thể là tên miền bình thường)
  }
  const parts = ipv4.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (Private)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link-Local & Cloud Metadata AWS/GCP/Azure)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0/8 & 100.64.0.0/10 (CGNAT)
  if (parts[0] === 0) return true;
  if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

  return false;
}

function validateSsrfSafeUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'Chỉ chấp nhận giao thức HTTP/HTTPS.' };
    }
    const hostname = parsed.hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { safe: false, reason: 'Không được phép truy cập mạng nội bộ hoặc localhost (SSRF Blocked).' };
    }
    if (isPrivateOrReservedIp(hostname)) {
      return { safe: false, reason: 'Dải địa chỉ IP này thuộc mạng riêng tư nội bộ hoặc Cloud Metadata (SSRF Blocked).' };
    }
    return { safe: true, parsed };
  } catch (e) {
    return { safe: false, reason: 'URL không đúng định dạng.' };
  }
}

// ----------------------------------------------------------------------------
// 6. MAIN EXPRESS SHIELD MIDDLEWARE ATTACHMENT
// ----------------------------------------------------------------------------
function attachAntiCrashShield(app, options = {}) {
  setupProcessCrashGuard();
  const getHtmlFile = options.getHtmlFile || ((name) => path.join(__dirname, '..', name));

  if (typeof options.onSecurityEvent === 'function') {
    setSecurityEventListener(options.onSecurityEvent);
  }

  // 0. HUNG REQUEST WATCHDOG (Chống treo kết nối làm cạn kiệt tài nguyên)
  app.use((req, res, next) => {
    if (req.path === '/api/attack-sse' || req.path === '/api/ai-chat-stream' || req.path === '/api/3dtouch/stream') {
      return next(); // Bỏ qua SSE stream dài hạn
    }
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`⚠️ [SHIELD REQUEST TIMEOUT] Yêu cầu tới ${req.path} quá 28 giây.`);
        logSecurityEvent('REQUEST_TIMEOUT_HALTED', getClientIp(req), { path: req.path });
        res.status(504).json({
          error: 'Yêu cầu vượt quá thời gian phản hồi an toàn (28s Gateway Timeout).',
          code: 'SEC_TIMEOUT_ABORTED'
        });
      }
    }, 28000);
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  });

  // 1. REQUEST COUNTER & IP BAN CHECK
  app.use((req, res, next) => {
    stats.totalRequests++;
    const ip = getClientIp(req);

    const isStaticAsset = /\.(html|htm|css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|webp|mp3|mp4|webm)$/i.test(req.path || '');
    const isAdminOrUnban = req.path === '/api/security/unban' || validateApiKey(String(req.headers['x-api-key'] || req.query?.apiKey || ''));

    if (isIpBanned(ip)) {
      // Cho phép yêu cầu unban quản trị và tài nguyên trang tĩnh hoạt động để hiển thị trang lỗi 404
      if (isAdminOrUnban || isStaticAsset) {
        next();
        return;
      }

      stats.rateLimitedRequests++;
      res.setHeader('Retry-After', '300');
      res.status(429).json({
        error: 'Địa chỉ IP của bạn tạm thời bị khóa do có hành vi tấn công hoặc gửi quá nhiều yêu cầu.',
        code: 'SEC_IP_BANNED'
      });
      return;
    }

    if (!isStaticAsset && !isAdminOrUnban) {
      // Toán học Token Bucket & Sliding Window Rate Limiting per IP
      const tokenResult = consumeTokenBucket(ip);
      const now = Date.now();
      const history = ipRequestHistory.get(ip) || [];
      const validHistory = history.filter(t => now - t < CONFIG.rateLimitWindowMs);
      validHistory.push(now);
      ipRequestHistory.set(ip, validHistory);

      if (!tokenResult.allowed || validHistory.length > CONFIG.rateLimitMax) {
        stats.rateLimitedRequests++;
        banIp(ip, 'DDoS / Rate Limit Flood (Token Bucket Exhausted)');
        res.setHeader('Retry-After', '60');
        res.status(429).json({
          error: 'Tần suất gửi yêu cầu quá nhanh. Hệ thống đã giới hạn tự động (Token Bucket Defense).',
          code: 'SEC_RATE_LIMIT_EXCEEDED',
          retryAfterSeconds: 60
        });
        return;
      }
    }

    next();
  });

  // 2. WAF SHIELD (INJECTION & MALICIOUS PATTERNS)
  if (CONFIG.wafEnabled) {
    app.use((req, res, next) => {
      const ip = getClientIp(req);
      const urlThreat = checkStringWaf(req.url);
      const queryThreat = scanObjectWaf(req.query);
      const bodyThreat = req.body ? scanObjectWaf(req.body) : null;

      const threat = urlThreat || queryThreat || bodyThreat;
      if (threat) {
        stats.blockedAttacks++;
        const currentScore = (attackScores.get(ip) || 0) + 1;
        attackScores.set(ip, currentScore);

        console.warn(`🛡️ [SHIELD WAF BLOCKED] Phát hiện tấn công từ IP ${ip}: ${threat}`);
        logSecurityEvent('WAF_ATTACK_BLOCKED', ip, { threat, url: req.url });

        if (currentScore >= 10) {
          banIp(ip, `Lặp lại tấn công (${threat})`);
        }

        res.status(403).json({
          error: 'Yêu cầu của bạn đã bị chặn bởi hệ thống phòng thủ SlideVault Security Shield.',
          code: 'SEC_WAF_BLOCK',
          threatType: threat
        });
        return;
      }
      next();
    });
  }

  // 3. SECURE HEADERS INJECTION
  app.use((req, res, next) => {
    res.setHeader('X-Shield-Protection', 'SlideVault-Guardian-v3.0-Bulletproof');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // 4. SECURITY & HEALTH STATUS API
  app.get('/api/security/shield-status', (req, res) => {
    const key = req.headers['x-api-key'] || req.query.apiKey;
    const isAuth = validateApiKey(String(key || ''));

    const uptimeSec = Math.round((Date.now() - stats.uptimeStart) / 1000);
    const hours = Math.floor(uptimeSec / 3600);
    const mins = Math.floor((uptimeSec % 3600) / 60);
    const secs = uptimeSec % 60;
    const uptimeFormatted = `${hours > 0 ? hours + 'h ' : ''}${mins}m ${secs}s`;

    const mem = process.memoryUsage();
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
    const rssMB = Math.round(mem.rss / 1024 / 1024);

    res.json({
      shield: 'SlideVault Pro Enterprise Anti-Crash & Hack Guardian',
      version: '3.0.0-Bulletproof',
      status: 'active',
      protectionLevel: 'ENTERPRISE_IMMUNE',
      uptimeSeconds: uptimeSec,
      uptimeFormatted,
      stats: {
        totalRequests: stats.totalRequests,
        blockedAttacks: stats.blockedAttacks,
        rateLimitedRequests: stats.rateLimitedRequests,
        crashesPrevented: stats.crashesPrevented,
        activeBannedIps: bannedIps.size
      },
      memory: {
        heapUsedMB,
        heapTotalMB,
        rssMB,
        loadPercent: Math.min(99, Math.round((heapUsedMB / Math.max(1, heapTotalMB)) * 100))
      },
      defense: {
        autoRecover: CONFIG.autoRecover,
        waf: CONFIG.wafEnabled,
        rateLimitMax: CONFIG.rateLimitMax,
        rateLimitWindowSeconds: CONFIG.rateLimitWindowMs / 1000,
        ipWhitelist: ['127.0.0.1', '::1', 'localhost']
      },
      recentEvents: recentEvents.slice(0, 15),
      authenticated: isAuth
    });
  });

  // 5. UNBAN IP ENDPOINT (ADMIN AUTHENTICATED)
  app.post('/api/security/unban', (req, res) => {
    const key = req.headers['x-api-key'] || req.query.apiKey || req.body?.apiKey;
    if (!validateApiKey(String(key || ''))) {
      res.status(401).json({ error: 'Yêu cầu API Key để gỡ bỏ lệnh cấm IP.' });
      return;
    }
    const targetIp = normalizeIp(req.body?.ip || getClientIp(req));
    bannedIps.delete(targetIp);
    bannedIps.delete('127.0.0.1');
    bannedIps.delete('::1');
    bannedIps.delete('::ffff:127.0.0.1');
    attackScores.delete(targetIp);
    attackScores.delete('127.0.0.1');
    ipRequestHistory.delete(targetIp);
    ipRequestHistory.delete('127.0.0.1');
    stats.activeBannedIps = bannedIps.size;
    res.json({ success: true, message: `Đã mở khóa IP ${targetIp}`, activeBannedIps: bannedIps.size });
  });

  // 6. TEST CRASH SIMULATION ROUTE (FOR VERIFYING PROCESS NEVER DIES)
  app.get('/api/test-crash', (req, res) => {
    const key = req.headers['x-api-key'] || req.query.apiKey;
    if (!validateApiKey(String(key || ''))) {
      res.status(401).json({ error: 'Yêu cầu API Key để chạy thử nghiệm lỗi máy chủ.' });
      return;
    }

    const type = req.query.type || 'exception';
    if (type === 'rejection') {
      Promise.reject(new Error('Mô phỏng lỗi Promise Rejection khẩn cấp!'));
      res.json({ message: 'Đã kích hoạt Promise Rejection. Máy chủ vẫn hoạt động an toàn!' });
    } else {
      setTimeout(() => {
        throw new Error('Mô phỏng sự cố sập máy chủ đột ngột (Uncaught Exception Test)!');
      }, 50);
      res.json({ message: 'Đã kích hoạt Uncaught Exception. Bộ đệm phòng thủ tự động giữ tiến trình an toàn!' });
    }
  });

  // 7. INTERACTIVE THREAT SIMULATION (FOR SECURITY DASHBOARD)
  app.post('/api/security/simulate-threat', (req, res) => {
    const type = req.body?.type || req.query?.type || 'sqli';
    const clientIp = getClientIp(req);

    if (type === 'sqli') {
      stats.blockedAttacks++;
      logSecurityEvent('WAF_ATTACK_BLOCKED', clientIp, { threat: 'SQL Injection (Simulated Test)', url: '/?test=1%27%20OR%20%271%27=%271', action: 'BLOCKED' });
      res.status(403).json({ success: true, simulated: true, threat: 'SQL Injection', status: 'BLOCKED', code: 'SEC_WAF_BLOCK' });
    } else if (type === 'xss') {
      stats.blockedAttacks++;
      logSecurityEvent('WAF_ATTACK_BLOCKED', clientIp, { threat: 'XSS Attack (Simulated Test)', url: '/?q=<script>alert(1)</script>', action: 'BLOCKED' });
      res.status(403).json({ success: true, simulated: true, threat: 'XSS Attack', status: 'BLOCKED', code: 'SEC_WAF_BLOCK' });
    } else if (type === 'crash_exception') {
      stats.crashesPrevented++;
      logSecurityEvent('UNCAUGHT_EXCEPTION_PREVENTED', 'system', { error: 'Mô phỏng sự cố sập máy chủ đột ngột', origin: 'simulate-test', crashesPrevented: stats.crashesPrevented, action: 'AUTO_HEALED' });
      res.json({ success: true, simulated: true, type: 'Uncaught Exception', status: 'AUTO_HEALED', crashesPrevented: stats.crashesPrevented });
    } else if (type === 'crash_rejection') {
      stats.crashesPrevented++;
      logSecurityEvent('UNHANDLED_REJECTION_CAUGHT', 'system', { reason: 'Mô phỏng Promise Rejection khẩn cấp', action: 'AUTO_HEALED' });
      res.json({ success: true, simulated: true, type: 'Unhandled Promise Rejection', status: 'AUTO_HEALED', crashesPrevented: stats.crashesPrevented });
    } else {
      res.json({ success: true, message: 'Heartbeat ping nhận diện thành công.' });
    }
  });

  // 8. PERIODIC CACHE & MEMORY CLEANER (Tránh rò rỉ bộ nhớ dài hạn)
  setInterval(() => {
    const now = Date.now();
    for (const [ip, times] of ipRequestHistory.entries()) {
      const valid = times.filter(t => now - t < CONFIG.rateLimitWindowMs);
      if (valid.length === 0) {
        ipRequestHistory.delete(ip);
      } else {
        ipRequestHistory.set(ip, valid);
      }
    }
    for (const [ip, unbanTime] of bannedIps.entries()) {
      if (now > unbanTime) {
        bannedIps.delete(ip);
        attackScores.delete(ip);
      }
    }
    stats.activeBannedIps = bannedIps.size;
  }, 60000);

  console.log('🛡️ [SlideVault Shield] Hệ thống chống sập & phòng thủ bảo mật đã sẵn sàng!');
}

// ----------------------------------------------------------------------------
// 7. EXPRESS ERROR HANDLER MIDDLEWARE (FALLBACK 404/500 SHIELD)
// ----------------------------------------------------------------------------
function attachAntiCrashErrorHandler(app, options = {}) {
  const getHtmlFile = options.getHtmlFile || ((name) => path.join(__dirname, '..', name));

  app.use((err, req, res, next) => {
    stats.crashesPrevented++;
    console.error('🛡️ [SHIELD ROUTE ERROR PREVENTED]:', err?.message || err);

    if (req.path && req.path.startsWith('/api/')) {
      res.status(500).json({
        error: 'Sự cố máy chủ được bảo vệ thành công bởi SlideVault Shield.',
        code: 'SEC_INTERNAL_CRASH_PREVENTED'
      });
    } else {
      res.status(500).sendFile(getHtmlFile('404.html'));
    }
  });
}

// ----------------------------------------------------------------------------
// 8. EXPORT
// ----------------------------------------------------------------------------
module.exports = {
  CONFIG,
  attachAntiCrashShield,
  attachAntiCrashErrorHandler,
  validateApiKey,
  timingSafeCompare,
  isPrivateOrReservedIp,
  validateSsrfSafeUrl,
  consumeTokenBucket,
  calculateBanDuration,
  inspectWafThreat,
  tokenBuckets,
  penaltyLevels,
  ipRequestHistory,
  bannedIps,
  TOKEN_BUCKET_CAPACITY,
  getClientIp,
  logSecurityEvent,
  setSecurityEventListener,
  recentEvents,
  stats
};
