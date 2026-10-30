/* Unit test thư viện toán 3D Touch — chạy bằng Node, không cần server.
 * Dùng: node 3dtouch/kiem_thu_toan.js
 * Tự ghi kết quả ra %TEMP%\svlog\math_result.txt
 */
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const LOG = [];
const log = (...a) => { LOG.push(a.join(' ')); };
let checks = 0;
let failures = 0;
const check = (name, ok, detail) => {
  checks += 1;
  if (!ok) failures += 1;
  log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== undefined ? ' -> ' + JSON.stringify(detail) : ''}`);
};
const approx = (a, b, eps = 1e-6) => Number.isFinite(a) && Math.abs(a - b) <= eps;

function finish(code) {
  const dir = path.join(os.tmpdir(), 'svlog');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'math_result.txt'),
    LOG.join('\n') + `\n\n=== TOAN 3DTOUCH: ${checks - failures}/${checks} dat ===\n`, 'utf8');
  process.exit(code);
}

(async () => {
  const {
    clamp, lerp, smoothstep, OneEuroFilter, OneEuroVec2, Deadzone, Hysteresis,
    estimateVelocity, handScale, pinchRatio, fingerExtended, countExtended,
    iouBox, extrapolateBox, smoothBox,
  } = await import('./math3d.js');

  /* ---------- 1. Hàm cơ bản ---------- */
  check('clamp giữa', clamp(5, 0, 10) === 5);
  check('clamp dưới', clamp(-3, 0, 10) === 0);
  check('clamp trên', clamp(99, 0, 10) === 10);
  check('clamp NaN về biên', Number.isFinite(clamp(NaN, 0, 10)));
  check('lerp đầu', approx(lerp(2, 8, 0), 2));
  check('lerp cuối', approx(lerp(2, 8, 1), 8));
  check('lerp giữa', approx(lerp(2, 8, 0.5), 5));
  check('smoothstep ngoài trái', smoothstep(0, 1, -5) === 0);
  check('smoothstep ngoài phải', smoothstep(0, 1, 5) === 1);
  check('smoothstep giữa = 0.5', approx(smoothstep(0, 1, 0.5), 0.5));
  check('smoothstep biên bằng nhau không chia 0', Number.isFinite(smoothstep(1, 1, 1)));

  /* ---------- 2. OneEuroFilter ---------- */
  const f = new OneEuroFilter();
  check('OneEuro lần đầu trả đúng giá trị', f.filter(10, 0) === 10);
  check('OneEuro tín hiệu đứng yên giữ nguyên', approx(f.filter(10, 16), 10, 1e-9));

  const f2 = new OneEuroFilter({ minCutoff: 1, beta: 0.1 });
  f2.filter(0, 0);
  let last = 0;
  for (let i = 1; i <= 30; i += 1) last = f2.filter(1, i * 16);
  check('OneEuro hội tụ về giá trị mới sau 30 khung', last > 0.9, last);

  const f3 = new OneEuroFilter();
  f3.filter(0, 0);
  const jump = f3.filter(100, 16);
  check('OneEuro vung mạnh không vượt giá trị thật', jump > 0 && jump < 100, jump);

  const f4 = new OneEuroFilter();
  f4.filter(5, 1000);
  const afterHidden = f4.filter(7, 11000);
  check('OneEuro không NaN khi dt khổng lồ', Number.isFinite(afterHidden), afterHidden);

  const f5 = new OneEuroFilter();
  f5.filter(3, 500);
  const reversed = f5.filter(4, 400);
  check('OneEuro chịu được timestamp đi ngược', Number.isFinite(reversed), reversed);

  const f6 = new OneEuroFilter();
  check('OneEuro bỏ qua giá trị NaN', f6.filter(NaN, 0) === 0);
  check('OneEuro không mất trạng thái sau NaN', Number.isFinite(f6.filter(1, 16)));
  f6.reset();
  check('OneEuro reset về ban đầu', f6.x === null && f6.t === null);
  check('OneEuro alpha luôn trong (0,1)',
    (() => { const a = new OneEuroFilter().alpha(1.5, 1 / 30); return a > 0 && a < 1; })());
  check('OneEuro alpha tăng khi cutoff tăng',
    (() => { const o = new OneEuroFilter(); return o.alpha(10, 0.05) > o.alpha(0.5, 0.05); })());

  /* ---------- 3. OneEuroVec2 ---------- */
  const v = new OneEuroVec2();
  check('Vec2 lần đầu đúng', v.filter({ x: 1, y: 2 }, 0).x === 1);
  check('Vec2 từ chối NaN', v.filter({ x: NaN, y: 1 }, 16) === null);
  check('Vec2 từ chối null', v.filter(null, 32) === null);
  v.reset();
  check('Vec2 reset được', v.fx.x === null);

  /* ---------- 4. Deadzone ---------- */
  const dz = new Deadzone(0.01);
  check('Deadzone lần đầu lấy nguyên', dz.apply({ x: 0.5, y: 0.5 }).x === 0.5);
  const jitter = dz.apply({ x: 0.502, y: 0.5 });
  check('Deadzone chặn rung nhỏ', jitter.x === 0.5, jitter);
  const moved = dz.apply({ x: 0.55, y: 0.5 });
  check('Deadzone cho phép di chuyển lớn', moved.x > 0.5 && moved.x < 0.55, moved.x);
  check('Deadzone bù trừ đúng phần bị trừ', approx(moved.x, 0.54, 1e-9), moved.x);
  dz.reset();
  check('Deadzone reset', dz.last === null);

  /* ---------- 5. Hysteresis ---------- */
  const h = new Hysteresis(0.4, 0.55);
  check('Hysteresis ban đầu tắt', h.update(0.5) === false);
  check('Hysteresis bật khi dưới ngưỡng on', h.update(0.3) === true);
  check('Hysteresis giữ trạng thái trong vùng chết', h.update(0.48) === true);
  check('Hysteresis tắt khi vượt ngưỡng off', h.update(0.6) === false);
  check('Hysteresis bỏ qua NaN', h.update(NaN) === false);
  h.reset();
  check('Hysteresis reset', h.state === false);

  /* ---------- 6. estimateVelocity ---------- */
  check('Velocity = 0 khi thiếu mốc', estimateVelocity(null, { x: 1, y: 1 }, 0.1).speed === 0);
  check('Velocity = 0 khi dt <= 0', estimateVelocity({ x: 0, y: 0 }, { x: 1, y: 0 }, 0).speed === 0);
  const vel = estimateVelocity({ x: 0, y: 0 }, { x: 1, y: 0 }, 0.5);
  check('Velocity đúng độ lớn (1/0.5 = 2)', approx(vel.vx, 2, 1e-9), vel);
  check('Velocity speed = hypot', approx(vel.speed, 2, 1e-9), vel.speed);
  const velSm = estimateVelocity({ x: 0, y: 0, vx: 100, vy: 0 }, { x: 1, y: 0 }, 0.1, { ema: 0.5 });
  check('Velocity EMA làm mượt spike', velSm.vx < 100, velSm.vx);

  globalThis.__MATH__ = { handScale, pinchRatio, fingerExtended, countExtended,
                          iouBox, extrapolateBox, smoothBox };
  part2();
})().catch((e) => {
  log('ERROR ' + (e && e.stack ? e.stack : String(e)));
  finish(1);
});

function part2() {
  /* ---------- 7. Hình học bàn tay ---------- */
  const { handScale, pinchRatio, fingerExtended, countExtended,
          iouBox, extrapolateBox, smoothBox } = globalThis.__MATH__;

  const mkHand = (spread, pinchGap) => {
    const g = [];
    g[0] = { x: 0.5, y: 0.8 };
    g[9] = { x: 0.5, y: 0.7 };
    g[4] = { x: 0.5, y: 0.8 - spread }; // ngón cái cùng chiều cao với ngón trỏ để khoảng chụm thuần ngang
    for (const [tip, joint] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
      g[tip] = { x: 0.4 + tip * 0.01, y: 0.8 - spread };
      g[joint] = { x: 0.4 + tip * 0.01, y: 0.8 - spread * 0.5 };
    }
    g[8] = { x: 0.5 + pinchGap, y: 0.8 - spread };
    return g;
  };

  const openHand = mkHand(0.3, 0.2);
  check('handScale đúng (0.1)', approx(handScale(openHand), 0.1, 1e-9), handScale(openHand));
  check('handScale = 0 với mảng rỗng', handScale([]) === 0);
  check('handScale = 0 với null', handScale(null) === 0);
  check('pinchRatio = khoảng cách/cỡ tay', approx(pinchRatio(openHand), 2, 1e-6), pinchRatio(openHand));
  check('pinchRatio = Infinity khi thiếu tay', pinchRatio(null) === Infinity);

  const pinched = mkHand(0.3, 0.005);
  check('pinchRatio nhỏ khi chụm', pinchRatio(pinched) < pinchRatio(openHand));
  check('countExtended tay xòe = 4', countExtended(openHand) === 4, countExtended(openHand));
  check('fingerExtended đúng cặp', fingerExtended(openHand, 8, 6) === true);
  check('fingerExtended mảng ngắn = false', fingerExtended(openHand.slice(0, 5), 8, 6) === false);

  const curled = mkHand(0.3, 0.2);
  for (const [tip, joint] of [[8, 6], [12, 10], [16, 14], [20, 18]]) {
    curled[tip] = { x: 0.5, y: 0.79 };
    curled[joint] = { x: 0.5, y: 0.7 };
  }
  check('countExtended tay nắm = 0', countExtended(curled) === 0, countExtended(curled));

  /* ---------- 8. IoU / extrapolate / smoothBox ---------- */
  check('IoU hộp trùng nhau = 1', approx(iouBox([0, 0, 1, 1], [0, 0, 1, 1]), 1));
  check('IoU không chồng lấn = 0', iouBox([0, 0, 1, 1], [2, 2, 1, 1]) === 0);
  check('IoU nửa chồng = 1/3', approx(iouBox([0, 0, 2, 2], [1, 0, 2, 2]), 1 / 3, 1e-9),
    iouBox([0, 0, 2, 2], [1, 0, 2, 2]));
  check('IoU với null = 0', iouBox(null, [0, 0, 1, 1]) === 0);
  check('IoU với hộp rỗng = 0', iouBox([0, 0, 0, 0], [0, 0, 0, 0]) === 0);

  const ex = extrapolateBox([0.1, 0.1, 0.2, 0.2], { vx: 1, vy: -0.5 }, 0.5);
  check('extrapolate dịch đúng X', approx(ex[0], 0.6, 1e-9), ex);
  check('extrapolate dịch đúng Y', approx(ex[1], -0.15, 1e-9), ex);
  check('extrapolate giữ kích thước', ex[2] === 0.2 && ex[3] === 0.2);
  check('extrapolate dt <= 0 giữ nguyên', extrapolateBox([1, 1, 1, 1], { vx: 5, vy: 5 }, 0)[0] === 1);
  check('extrapolate thiếu hộp = null', extrapolateBox(null, { vx: 1, vy: 1 }, 1) === null);
  check('extrapolate dt NaN giữ nguyên', extrapolateBox([1, 2, 3, 4], { vx: 1, vy: 1 }, NaN)[1] === 2);

  const sb = smoothBox([0, 0, 1, 1], [1, 1, 1, 1], 0.5);
  check('smoothBox trung bình', approx(sb[0], 0.5, 1e-9), sb);
  check('smoothBox alpha=1 lấy nguyên', smoothBox([0, 0, 1, 1], [1, 1, 1, 1], 1)[0] === 1);
  check('smoothBox alpha=0 giữ cũ', smoothBox([0, 0, 1, 1], [1, 1, 1, 1], 0)[0] === 0);
  check('smoothBox alpha âm bị clamp', smoothBox([0, 0, 1, 1], [1, 1, 1, 1], -5)[0] === 0);
  check('smoothBox alpha > 1 bị clamp', smoothBox([0, 0, 1, 1], [1, 1, 1, 1], 9)[0] === 1);
  check('smoothBox thiếu cũ lấy mới', smoothBox(null, [2, 2, 3, 3], 0.5)[0] === 2);
  check('smoothBox thiếu mới giữ cũ', smoothBox([2, 2, 3, 3], null, 0.5)[0] === 2);
  check('smoothBox cả hai null', smoothBox(null, null, 0.5) === null);

  log(`\n=== TOAN 3DTOUCH: ${checks - failures}/${checks} dat ===`);
  finish(failures ? 1 : 0);
}