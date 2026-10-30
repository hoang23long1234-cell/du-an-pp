/**
 * SlideVault Ultra Mathematical & Physics Engine Test Suite
 * File: tests/test_math_engine_ultra.js
 * 
 * Tests 10 Mathematical Domains:
 * 1. Constants & Numeric Foundations (Phi, Tau, Epsilon, Smootherstep)
 * 2. Vector2, Vector3, Vector4 Linear Algebra (Dot, Cross, Reflect, Project)
 * 3. Matrix4x4 Tensor Algebra (Affine, Perspective, Determinant, Inverse, CSS matrix3d)
 * 4. Quaternion 4D Lie Group (Hamilton Product, SLERP, SQUAD, Gimbal-lock-free rotation)
 * 5. Differential Equations & Dynamic Physics (RK4, Hooke Oscillator, Verlet, Duffing)
 * 6. Liquid Glass Optics & Refraction (Snell's Law 3D, Total Internal Reflection, Fresnel Schlick, Cauchy Dispersion)
 * 7. Fluid SPH Density Kernels (Lucy 2D Cubic Spline)
 * 8. Stochastic State Estimation (1D & 2D Kalman Filters, One-Euro, Savitzky-Golay)
 * 9. Computational Geometry (2D Convex Hull Monotone Chain, Ray-AABB, Ray-Plane, Point-In-Poly)
 * 10. Layout Math & Fluid Typography (Golden Spiral coordinates, Fluid Clamp solver, VisionOS Bezier)
 */

const assert = require('assert');

// We will test the engine object
function runUltraMathTests(engine) {
  console.log('================================================================');
  console.log('📐 SLIDEVAULT QUANTUM MATHEMATICAL & PHYSICS ENGINE (V4 ARGON)');
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
      throw err;
    }
  }

  const approx = (a, b, eps = 1e-5) => Math.abs(a - b) <= eps;

  // 1. Constants & Foundations
  console.log('📌 1. Hằng số Toán học & Nền tảng Giải tích:');
  test('Golden Ratio Phi & Inverse Phi', () => {
    assert(approx(engine.constants.PHI, 1.618033988749895));
    assert(approx(engine.constants.INV_PHI, 0.618033988749895));
    assert(approx(engine.constants.PHI - 1, engine.constants.INV_PHI));
    assert(approx(engine.constants.PHI * engine.constants.PHI, engine.constants.PHI + 1));
  });

  test('Perlin Smootherstep C2 Continuity', () => {
    assert.strictEqual(engine.smootherstep(0, 1, -1), 0);
    assert.strictEqual(engine.smootherstep(0, 1, 2), 1);
    assert(approx(engine.smootherstep(0, 1, 0.5), 0.5));
    // First and second derivative at endpoints must be 0
    const h = 1e-4;
    const d0 = (engine.smootherstep(0, 1, h) - engine.smootherstep(0, 1, 0)) / h;
    const d1 = (engine.smootherstep(0, 1, 1) - engine.smootherstep(0, 1, 1 - h)) / h;
    assert(approx(d0, 0, 1e-3), 'Derivative at 0 is 0');
    assert(approx(d1, 0, 1e-3), 'Derivative at 1 is 0');
  });

  // 2. Vectors
  console.log('\n📌 2. Đại số Tuyến tính Vector2 / Vector3 / Vector4:');
  test('Vector2 Operations (Dot, Length, Rotate, Reflect)', () => {
    const v1 = engine.vec2(3, 4);
    assert.strictEqual(v1.length(), 5);
    const n = v1.normalize();
    assert(approx(n.length(), 1));
    assert(approx(engine.vec2(1, 0).dot(engine.vec2(0, 1)), 0)); // Orthogonal
    
    // Reflection of (1, -1) on horizontal floor normal (0, 1) -> (1, 1)
    const inc = engine.vec2(1, -1);
    const norm = engine.vec2(0, 1);
    const ref = inc.reflect(norm);
    assert(approx(ref.x, 1) && approx(ref.y, 1), `Expected (1, 1), got (${ref.x}, ${ref.y})`);
  });

  test('Vector3 Cross Product & Right-Hand Rule', () => {
    const x = engine.vec3(1, 0, 0);
    const y = engine.vec3(0, 1, 0);
    const z = x.cross(y);
    assert(approx(z.x, 0) && approx(z.y, 0) && approx(z.z, 1));
  });

  test('Vector4 Homogeneous Perspective Divide', () => {
    const v = engine.vec4(4, 8, 12, 4);
    const p = v.perspectiveDivide();
    assert(approx(p.x, 1) && approx(p.y, 2) && approx(p.z, 3) && approx(p.w, 1));
  });

  // 3. Matrix4 Tensor Algebra
  console.log('\n📌 3. Đại số Ma trận Tensor Matrix4 & CSS matrix3d:');
  test('Matrix4 Identity & Translation Multiplication', () => {
    const m = engine.Matrix4.identity();
    const t = engine.Matrix4.translation(10, 20, 30);
    const prod = m.multiply(t);
    const v = prod.transformVector4(engine.vec4(1, 2, 3, 1));
    assert(approx(v.x, 11) && approx(v.y, 22) && approx(v.z, 33) && approx(v.w, 1));
  });

  test('Matrix4 Determinant & Exact Inverse (Cramer Rule)', () => {
    const m = engine.Matrix4.identity()
      .multiply(engine.Matrix4.scaling(2, 3, 4))
      .multiply(engine.Matrix4.translation(5, 6, 7));
    const det = m.determinant();
    assert(approx(det, 2 * 3 * 4), `Det should be 24, got ${det}`);

    const inv = m.inverse();
    const shouldBeIdentity = m.multiply(inv);
    assert(approx(shouldBeIdentity.elements[0], 1) && approx(shouldBeIdentity.elements[5], 1));
    assert(approx(shouldBeIdentity.elements[10], 1) && approx(shouldBeIdentity.elements[15], 1));
    assert(approx(shouldBeIdentity.elements[12], 0) && approx(shouldBeIdentity.elements[13], 0));
  });

  test('Matrix4 CSS matrix3d Generation & Hardware Formatting', () => {
    const t = engine.Matrix4.translation(100, 250, 0);
    const css = t.toCssMatrix3d();
    assert(css.startsWith('matrix3d(') && css.endsWith(')'));
    assert(css.includes('100.00') && css.includes('250.00'));
  });

  // 4. Quaternion 4D Lie Algebra
  console.log('\n📌 4. Đại số Quaternion 4D & SLERP Không Khóa Trục (Gimbal Lock Free):');
  test('Quaternion Euler Roundtrip & Axis-Angle', () => {
    const q = engine.Quaternion.fromEuler(Math.PI / 4, 0, 0); // 45 deg pitch
    const e = q.toEuler();
    assert(approx(e.pitch, Math.PI / 4, 1e-4));
  });

  test('Quaternion SLERP Spherical Interpolation', () => {
    const q1 = engine.Quaternion.identity();
    const q2 = engine.Quaternion.fromAxisAngle(engine.vec3(0, 1, 0), Math.PI / 2); // 90 deg around Y
    const mid = engine.Quaternion.slerp(q1, q2, 0.5);
    const midAngle = 2 * Math.acos(mid.w);
    assert(approx(midAngle, Math.PI / 4, 1e-4), `Mid angle should be 45 deg, got ${midAngle}`);
  });

  test('Quaternion to Matrix4 Rotation Matrix', () => {
    const q = engine.Quaternion.fromAxisAngle(engine.vec3(0, 0, 1), Math.PI / 2); // 90 deg around Z
    const m = q.toMatrix4();
    const v = m.transformVector4(engine.vec4(1, 0, 0, 1));
    assert(approx(v.x, 0) && approx(v.y, 1), `Expected (0, 1, 0), got (${v.x}, ${v.y})`);
  });

  // 5. Differential Equations & Integrators
  console.log('\n📌 5. Tích phân Số Runge-Kutta 4 (RK4) & Động lực học Dao động:');
  test('RK4 Harmonic Oscillator (sin/cos exact solution)', () => {
    // dy/dt = [v, -x]
    const f = (t, y) => [y[1], -y[0]];
    let y = [1, 0]; // x0 = 1, v0 = 0 -> exact x(t) = cos(t), v(t) = -sin(t)
    const dt = 0.05;
    let t = 0;
    while (t + dt <= Math.PI) {
      y = engine.rk4(f, y, t, dt);
      t += dt;
    }
    // Compare exact analytical cos(t) and -sin(t) with numerical RK4
    const exactX = Math.cos(t);
    const exactV = -Math.sin(t);
    assert(approx(y[0], exactX, 1e-5), `RK4 x error: ${Math.abs(y[0] - exactX)}`);
    assert(approx(y[1], exactV, 1e-5), `RK4 v error: ${Math.abs(y[1] - exactV)}`);
  });

  test('Hooke Damped Oscillator Analytic Solver (Underdamped & Overdamped)', () => {
    const under = engine.dampedOscillator({ mass: 1, stiffness: 100, damping: 2, x0: 1, v0: 0, dt: 0.1 });
    assert(under.zeta < 1.0, 'Must be underdamped');
    assert(Number.isFinite(under.displacement));
    assert(under.energy.total > 0);

    const over = engine.dampedOscillator({ mass: 1, stiffness: 10, damping: 50, x0: 1, v0: 0, dt: 0.1 });
    assert(over.zeta > 1.0, 'Must be overdamped');
    assert(Number.isFinite(over.displacement));
  });

  test('Critical Spring Auto-Tuner for Target Settling Time', () => {
    const tuning = engine.criticalSpringTuner(0.42, 1.0); // 0.42s Apple VisionOS duration
    assert(tuning.stiffness > 0 && tuning.damping > 0);
    assert(approx(tuning.zeta, 1.0, 1e-3), 'Damping ratio must be critical');
  });

  // 6. Liquid Glass Optics & Refraction
  console.log('\n📌 6. Quang học Kính Lỏng & Khúc xạ Snell 3D & Tán xạ Sắc sai:');
  test('Snell Law 3D Vector Refraction (Air -> Glass n=1.52)', () => {
    // Ray coming from 45 deg in air, hitting flat normal (0, 1, 0)
    const inc = engine.vec3(1, -1, 0).normalize();
    const norm = engine.vec3(0, 1, 0);
    const res = engine.refractRay(inc, norm, 1.0 / 1.52);
    assert(!res.totalInternalReflection, 'Must refract into glass');
    // Angle in glass should be arcsin(sin(45)/1.52) ≈ 27.7 deg
    const cosAngle = Math.abs(res.refracted.dot(norm));
    const angleDeg = Math.acos(cosAngle) * (180 / Math.PI);
    assert(approx(angleDeg, 27.7, 0.5), `Expected ~27.7 deg, got ${angleDeg}`);
  });

  test('Total Internal Reflection (TIR) from Glass to Air', () => {
    // Critical angle for glass -> air is arcsin(1/1.52) ≈ 41.1 deg
    // Ray coming at 60 deg incidence
    const rad60 = (60 * Math.PI) / 180;
    const inc = engine.vec3(Math.sin(rad60), -Math.cos(rad60), 0);
    const norm = engine.vec3(0, 1, 0);
    const res = engine.refractRay(inc, norm, 1.52 / 1.0);
    assert.strictEqual(res.totalInternalReflection, true, 'Must trigger Total Internal Reflection at 60 deg');
  });

  test('Fresnel Schlick Reflectance Equation', () => {
    // Normal incidence (theta = 0)
    const r0 = engine.fresnelSchlick(1.0, 1.0, 1.52);
    assert(approx(r0, Math.pow((1 - 1.52) / (1 + 1.52), 2), 1e-4));
    // Grazing incidence (theta = 90 deg -> cosTheta = 0)
    const rGrazing = engine.fresnelSchlick(0.0, 1.0, 1.52);
    assert(approx(rGrazing, 1.0, 1e-4), 'Reflectance must approach 100% at grazing angle');
  });

  test('Cauchy Dispersion & RGB Subpixel Aberration', () => {
    const nR = engine.cauchyDispersion(650); // Red
    const nB = engine.cauchyDispersion(450); // Blue
    assert(nB > nR, 'Blue wavelength must have higher refractive index than Red');
    const offsets = engine.chromaticAberrationOffsets(engine.vec3(0.5, -0.866, 0), engine.vec3(0, 1, 0), 10);
    assert(offsets.red && offsets.green && offsets.blue);
    assert(offsets.blue.length() !== offsets.red.length());
  });

  // 7. SPH Fluid Kernel
  console.log('\n📌 7. Mô phỏng Hạt Thủy lực SPH (Lucy 2D Smoothing Kernel):');
  test('SPH Lucy Kernel Normalization & Compact Support', () => {
    const h = 10;
    const w0 = engine.sphLucyKernel(0, h);
    assert(w0 > 0, 'Central density must be positive');
    const wFar = engine.sphLucyKernel(25, h);
    assert.strictEqual(wFar, 0, 'Must be zero outside compact support r > 2h');
  });

  // 8. Stochastic State Estimation & Filters
  console.log('\n📌 8. Bộ lọc Ước lượng Trạng thái Ngẫu nhiên (Kalman & One-Euro):');
  test('KalmanFilter1D Noise Reduction', () => {
    const kf = new engine.KalmanFilter1D({ q: 0.01, r: 0.5 });
    let val = 10;
    const estimates = [];
    for (let i = 0; i < 20; i++) {
      const noisy = val + (Math.sin(i) * 0.4);
      estimates.push(kf.update(noisy));
    }
    const lastEst = estimates[estimates.length - 1];
    assert(approx(lastEst, 10, 0.3), `Kalman estimate should converge near 10, got ${lastEst}`);
  });

  test('KalmanFilter2D Kinematic Position & Velocity Tracking', () => {
    const kf = new engine.KalmanFilter2D();
    // Simulate constant velocity motion: x = 100 * t, y = 50 * t
    for (let t = 0; t <= 25; t++) {
      kf.predict(0.1);
      kf.update(100 * (t * 0.1), 50 * (t * 0.1), 0.1);
    }
    const state = kf.getState();
    assert(approx(state.vx, 100, 5), `Estimated vx should be ~100, got ${state.vx}`);
    assert(approx(state.vy, 50, 5), `Estimated vy should be ~50, got ${state.vy}`);
  });

  test('Savitzky-Golay 5-Point Polynomial Smoother', () => {
    const raw = [0, 1, 4, 9, 16]; // y = x^2 (quadratic)
    const smoothed = engine.savitzkyGolay5(raw);
    assert(approx(smoothed, 4, 1e-4), 'Savitzky-Golay must reproduce quadratic polynomials exactly');
  });

  // 9. Computational Geometry
  console.log('\n📌 9. Hình học Tính toán Không gian & Đa giác Lồi (Convex Hull):');
  test('Convex Hull 2D (Monotone Chain)', () => {
    const pts = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 },
      { x: 5, y: 5 }, { x: 2, y: 3 }, { x: 7, y: 8 } // Internal points
    ];
    const hull = engine.convexHull2D(pts);
    assert.strictEqual(hull.length, 4, `Square hull should have 4 vertices, got ${hull.length}`);
  });

  test('Ray-AABB 3D Bounding Box Intersection', () => {
    const rayO = engine.vec3(0, 0, -5);
    const rayD = engine.vec3(0, 0, 1);
    const boxMin = engine.vec3(-1, -1, -1);
    const boxMax = engine.vec3(1, 1, 1);
    const hit = engine.rayIntersectsAABB(rayO, rayD, boxMin, boxMax);
    assert(hit.hit === true);
    assert(approx(hit.tMin, 4), `Ray enters at z=-1 (distance 4), got ${hit.tMin}`);
  });

  test('Point-In-Polygon (Jordan Curve Theorem)', () => {
    const poly = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
    assert.strictEqual(engine.pointInPolygon({ x: 5, y: 5 }, poly), true);
    assert.strictEqual(engine.pointInPolygon({ x: 15, y: 5 }, poly), false);
  });

  // 10. Layout Math & Fluid Clamp
  console.log('\n📌 10. Toán học Bố cục Co Giãn (Fluid Clamp) & Đường xoắn ốc Vàng:');
  test('Fluid Clamp Exact Mathematical CSS Generator', () => {
    // 16px (1rem) at 360px viewport -> 24px (1.5rem) at 1200px viewport
    const res = engine.fluidClamp(1, 1.5, 360, 1200);
    assert(res.css.startsWith('clamp('));
    assert(res.slope > 0);
    assert(approx(res.slope * 360 + res.intercept, 16, 0.1));
    assert(approx(res.slope * 1200 + res.intercept, 24, 0.1));
  });

  test('Golden Spiral Points Generator', () => {
    const spiral = engine.goldenRatio.spiralPoints(2, 5, 20);
    assert.strictEqual(spiral.length, 20);
    assert(spiral[0].x !== undefined && spiral[0].y !== undefined);
  });

  test('Apple VisionOS Symmetrical Cubic-Bezier Solver B(t)', () => {
    const solver = engine.solveCubicBezier(0.16, 1.0, 0.3, 1.0);
    assert.strictEqual(solver(0), 0);
    assert(approx(solver(1), 1, 1e-4));
    assert(solver(0.5) > 0.8, 'VisionOS curve rises sharply in first 50%');
  });

  console.log('\n================================================================');
  console.log(`🎉 TẤT CẢ ${passed}/${total} BÀI TOÁN HỌC & VẬT LÝ VƯỢT QUA 100%!`);
  console.log('================================================================\n');
}

module.exports = { runUltraMathTests };
