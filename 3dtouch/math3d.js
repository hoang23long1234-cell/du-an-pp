/* =============================================================================
 * SlideVault math3d — Thư viện toán học cho 3D Touch
 * -----------------------------------------------------------------------------
 * Chạy được trên cả trình duyệt (ESM) lẫn Node (test), không phụ thuộc lib.
 * Cung cấp: bộ lọc One-Euro thích ứng, vùng chết chống rung, ngưỡng hysteresis,
 * ước lượng vận tốc/độ dịch chuyển, chuẩn hoá cỡ bàn tay, IoU + suy đoán mục tiêu.
 *
 *   import { OneEuroVec2, Deadzone, Hysteresis, pinchRatio } from './math3d.js';
 * ========================================================================== */

/** Giới hạn giá trị về đoạn [lo, hi]; giá trị NaN được coi là lo để không lan NaN. */
export const clamp = (value, lo, hi) => (Number.isNaN(value) ? lo : value < lo ? lo : value > hi ? hi : value);

/** Nội suy tuyến tính. */
export const lerp = (a, b, t) => a + (b - a) * t;

/** Hàm trơn bậc ba (đường cong chuyển tiếp mượt). */
export function smoothstep(edge0, edge1, x) {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/* ------------------------------------------------------------------ *
 * One-Euro Filter — bộ lọc kinh điển cho con trỏ cử chỉ.
 * Chậm thì mượt (giảm rung), nhanh thì bám tức thì (không tụt hậu).
 * Công thức: cutoff = minCutoff + beta * |dx|, alpha = 1/(1 + tau/dt)
 * ------------------------------------------------------------------ */
export class OneEuroFilter {
  constructor({ minCutoff = 1.2, beta = 0.05, dCutoff = 1.0 } = {}) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.reset();
  }

  /** Hệ số trượt cho một tần số cắt cho trước. */
  alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * Math.max(1e-6, cutoff));
    return 1 / (1 + tau / dt);
  }

  filter(value, timestampMs) {
    if (!Number.isFinite(value)) return this.x ?? 0;
    if (this.t === null || this.x === null) {
      this.x = value;
      this.t = timestampMs;
      return value;
    }
    // dt âm (thời gian đảo lộn) hoặc quá lớn (tab bị ẩn) đều bị chặn về biên an toàn
    const rawDt = (timestampMs - this.t) / 1000;
    const dt = rawDt > 0 ? clamp(rawDt, 1 / 240, 1 / 3) : 1 / 60;
    const dValue = (value - this.x) / dt;
    const aD = this.alpha(this.dCutoff, dt);
    this.dx = aD * dValue + (1 - aD) * this.dx;
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    const a = this.alpha(cutoff, dt);
    this.x = a * value + (1 - a) * this.x;
    this.t = timestampMs;
    return this.x;
  }

  reset() { this.x = null; this.dx = 0; this.t = null; }
}

/** Bộ lọc One-Euro cho điểm 2D {x, y}. */
export class OneEuroVec2 {
  constructor(opts) {
    this.fx = new OneEuroFilter(opts);
    this.fy = new OneEuroFilter(opts);
  }
  filter(point, timestampMs) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    return { x: this.fx.filter(point.x, timestampMs), y: this.fy.filter(point.y, timestampMs) };
  }
  reset() { this.fx.reset(); this.fy.reset(); }
}

/* ------------------------------------------------------------------ *
 * Deadzone (vùng chết) — di chuyển nhỏ hơn ngưỡng sẽ bị coi là đứng yên.
 * Giữ nguyên tín hiệu khi vượt ngưỡng (đẩy bù trừ) để con trỏ không nhảy.
 * ------------------------------------------------------------------ */
export class Deadzone {
  constructor(radius = 0.012) { this.radius = radius; this.last = null; }

  /** Trả về {x, y} đã lọc; null nếu chưa có tín hiệu đầu vào. */
  apply(point) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    if (!this.last) { this.last = { ...point }; return { ...point }; }
    const dx = point.x - this.last.x;
    const dy = point.y - this.last.y;
    const dist = Math.hypot(dx, dy);
    if (dist < this.radius) return { ...this.last };
    // Trừ đúng phần deadzone để con trỏ trôi mượt chứ không bị hẫng
    const scale = (dist - this.radius) / dist;
    this.last = { x: this.last.x + dx * scale, y: this.last.y + dy * scale };
    return { ...this.last };
  }

  reset() { this.last = null; }
}

/* ------------------------------------------------------------------ *
 * Hysteresis — ngưỡng bật/tắt KHÁC nhau, chống rung qua lại (chatter).
 * Dùng cho chạm-chụm: bật ở ngưỡng thấp, nhả ở ngưỡng cao hơn.
 * ------------------------------------------------------------------ */
export class Hysteresis {
  constructor(thresholdOn, thresholdOff = thresholdOn) {
    this.on = thresholdOn;
    this.off = thresholdOff;
    this.state = false;
  }
  update(value) {
    if (!Number.isFinite(value)) return this.state;
    if (this.state) { if (value > this.off) this.state = false; }
    else if (value < this.on) { this.state = true; }
    return this.state;
  }
  reset() { this.state = false; }
}

/* ------------------------------------------------------------------ *
 * Ước lượng vận tốc (đơn vị/giây) có làm mượt EMA, chống spike do jitter.
 * ------------------------------------------------------------------ */
export function estimateVelocity(previous, current, dtSeconds, { ema = 0.35 } = {}) {
  if (!previous || !current || !Number.isFinite(dtSeconds) || dtSeconds <= 0) {
    return { vx: 0, vy: 0, speed: 0, prev: current ? { ...current } : null };
  }
  const vx = (current.x - previous.x) / dtSeconds;
  const vy = (current.y - previous.y) / dtSeconds;
  const smooth = (now, old) => old === null ? now : old + (now - old) * ema;
  const svx = smooth(vx, previous.vx ?? null);
  const svy = smooth(vy, previous.vy ?? null);
  return { vx: svx, vy: svy, speed: Math.hypot(svx, svy) };
}


/* ------------------------------------------------------------------ *
 * HÌNH HỌC BÀN TAY — chuẩn hoá theo cỡ bàn tay để ngưỡng hoạt động
 * đúng ở mọi cự ly (tay gần camera hay xa camera đều như nhau).
 * ------------------------------------------------------------------ */
const dist2 = (a, b) => Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.y ?? 0) - (b?.y ?? 0));

/** Cỡ bàn tay = khoảng cách cổ tay → đốt giữa ngón giữa (landmark 0 → 9). */
export function handScale(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length < 10) return 0;
  const s = dist2(landmarks[0], landmarks[9]);
  return Number.isFinite(s) && s > 1e-5 ? s : 0;
}

/** Khoảng cách chụm (ngón cái–ngón trỏ) đã CHUẨN HOÁ theo cỡ bàn tay. */
export function pinchRatio(landmarks) {
  const s = handScale(landmarks);
  if (!s || !Array.isArray(landmarks) || landmarks.length < 9) return Number.POSITIVE_INFINITY;
  return dist2(landmarks[4], landmarks[8]) / s;
}

/** Ngón có duỗi ra không: đầu ngón phải xa cổ tay hơn đốt gấp của chính nó. */
export function fingerExtended(landmarks, tipIndex, jointIndex) {
  if (!Array.isArray(landmarks) || landmarks.length < 21) return false;
  const wrist = landmarks[0];
  return dist2(landmarks[tipIndex], wrist) > dist2(landmarks[jointIndex], wrist) * 1.12;
}

/** Đếm số ngón đang duỗi (trỏ, giữa, áp út, út). */
export function countExtended(landmarks) {
  const pairs = [[8, 6], [12, 10], [16, 14], [20, 18]];
  let n = 0;
  for (const [tip, joint] of pairs) if (fingerExtended(landmarks, tip, joint)) n += 1;
  return n;
}

/* ------------------------------------------------------------------ *
 * IoU + Suy đoán mục tiêu (dự đoán vị trí tiếp theo bằng vận tốc).
 * ------------------------------------------------------------------ */
export function iouBox(a, b) {
  if (!a || !b) return 0;
  const iw = Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]));
  const ih = Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  const inter = iw * ih;
  const union = a[2] * a[3] + b[2] * b[3] - inter;
  return union > 0 ? inter / union : 0;
}

/** Suy đoán bbox ở bước thời gian tiếp theo theo vận tốc đã đo (trung tâm dịch chuyển). */
export function extrapolateBox(box, velocity, dtSeconds) {
  if (!box || !velocity || !Number.isFinite(dtSeconds) || dtSeconds <= 0) return box ? [...box] : box;
  const dx = (velocity.vx ?? 0) * dtSeconds;
  const dy = (velocity.vy ?? 0) * dtSeconds;
  return [box[0] + dx, box[1] + dy, box[2], box[3]];
}

/** Làm trơn bbox bằng trung bình có trọng số (alpha cao = bám nhanh, thấp = mượt). */
export function smoothBox(previous, next, alpha) {
  if (!previous || !next) return next ? [...next] : previous ? [...previous] : null;
  const a = clamp(alpha, 0, 1);
  return previous.map((v, i) => v + ((next[i] ?? v) - v) * a);
}
