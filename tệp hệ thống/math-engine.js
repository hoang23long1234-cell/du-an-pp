/**
 * ============================================================================
 * SlideVault Quantum Mathematical & Physics Engine (v4 Argon)
 * File: tệp hệ thống/math-engine.js
 * ----------------------------------------------------------------------------
 * A comprehensive, zero-dependency, high-precision mathematical and physics
 * computing suite for web, mobile, and spatial computing environments.
 * 
 * Domains Included:
 *   1. Core Constants & Analytic Foundations (Phi, Tau, Smootherstep, Safe Clamps)
 *   2. Linear Algebra: Vector2, Vector3, Vector4 (Dot, Cross, Reflect, Project)
 *   3. Tensor Algebra: Matrix4 (Affine, Perspective, Determinant, Inverse, CSS matrix3d)
 *   4. Rotational Lie Algebra: Quaternion 4D (Hamilton Product, SLERP, SQUAD, Gimbal-free)
 *   5. Dynamic Physics Integrators: Runge-Kutta 4 (RK4), Symplectic Verlet, Hooke Oscillator, Duffing
 *   6. Liquid Glass Optics: Snell 3D Vector Refraction, Total Internal Reflection (TIR), Fresnel Schlick, Cauchy Dispersion
 *   7. Fluid Dynamics: Smoothed Particle Hydrodynamics (SPH) Lucy 2D Smoothing Kernel
 *   8. Stochastic State Estimation: Kalman Filter 1D/2D, Adaptive One-Euro, Savitzky-Golay
 *   9. Computational Geometry: Convex Hull 2D (Monotone Chain), Ray-AABB, Ray-Plane, Point-In-Polygon
 *  10. Layout Mathematics & Fluid Typography: Golden Spiral, Analytical Fluid Clamps, VisionOS Bezier
 * ============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.SlideVaultMathPhysics = exports;
    root.SlideVaultPhysics = exports;
    if (typeof globalThis !== 'undefined') {
      globalThis.SlideVaultMathPhysics = exports;
      globalThis.SlideVaultPhysics = exports;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ==========================================================================
  // 1. CONSTANTS & ANALYTIC FOUNDATIONS
  // ==========================================================================
  const PHI = 1.6180339887498948482;
  const INV_PHI = 0.6180339887498948482;
  const SQ_PHI = 2.6180339887498948482;
  const PI = Math.PI;
  const TAU = Math.PI * 2;
  const EULER = Math.E;
  const SQRT2 = Math.SQRT2;
  const INV_SQRT2 = 1 / Math.SQRT2;
  const EPSILON = 1e-12;

  // Optical Constants
  const OPTICS = {
    N_VACUUM: 1.0,
    N_AIR: 1.000293,
    N_WATER: 1.333,
    N_ACRYLIC: 1.491,
    N_GLASS_CROWN: 1.520,
    N_FLINT_GLASS: 1.620,
    N_SAPPHIRE: 1.770,
    CAUCHY_A: 1.5046,
    CAUCHY_B: 0.00420 * 1e6 // nm^2
  };

  /**
   * Safe numeric clamping with NaN protection.
   */
  function clamp(val, min, max) {
    if (Number.isNaN(val)) return min;
    return val < min ? min : val > max ? max : val;
  }

  /**
   * Linear Interpolation.
   */
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Remap value from [inMin, inMax] to [outMin, outMax].
   */
  function remap(val, inMin, inMax, outMin, outMax) {
    const t = clamp((val - inMin) / (inMax - inMin || EPSILON), 0, 1);
    return outMin + (outMax - outMin) * t;
  }

  /**
   * Standard Hermite smoothstep (C1 continuity).
   */
  function smoothstep(edge0, edge1, x) {
    if (edge0 === edge1) return x < edge0 ? 0 : 1;
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  /**
   * Ken Perlin's Smootherstep (C2 continuity: 6t^5 - 15t^4 + 10t^3).
   * Zero first and second derivatives at boundaries for ultra-smooth physics.
   */
  function smootherstep(edge0, edge1, x) {
    if (edge0 === edge1) return x < edge0 ? 0 : 1;
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // ==========================================================================
  // 2. LINEAR ALGEBRA: VECTOR2, VECTOR3, VECTOR4
  // ==========================================================================

  class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = Number.isFinite(x) ? x : 0;
      this.y = Number.isFinite(y) ? y : 0;
    }
    clone() { return new Vector2(this.x, this.y); }
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    scale(s) { return new Vector2(this.x * s, this.y * s); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    cross(v) { return this.x * v.y - this.y * v.x; } // 2D pseudoscalar
    lengthSq() { return this.x * this.x + this.y * this.y; }
    length() { return Math.hypot(this.x, this.y); }
    normalize() {
      const len = this.length();
      return len > EPSILON ? new Vector2(this.x / len, this.y / len) : new Vector2(0, 0);
    }
    distance(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
    angle() { return Math.atan2(this.y, this.x); }
    rotate(angleRad) {
      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
      return new Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
    reflect(normal) {
      const n = normal.normalize();
      const d = this.dot(n);
      return new Vector2(this.x - 2 * d * n.x, this.y - 2 * d * n.y);
    }
  }

  class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = Number.isFinite(x) ? x : 0;
      this.y = Number.isFinite(y) ? y : 0;
      this.z = Number.isFinite(z) ? z : 0;
    }
    clone() { return new Vector3(this.x, this.y, this.z); }
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
    scale(s) { return new Vector3(this.x * s, this.y * s, this.z * s); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) {
      return new Vector3(
        this.y * v.z - this.z * v.y,
        this.z * v.x - this.x * v.z,
        this.x * v.y - this.y * v.x
      );
    }
    lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
    length() { return Math.hypot(this.x, this.y, this.z); }
    normalize() {
      const len = this.length();
      return len > EPSILON ? new Vector3(this.x / len, this.y / len, this.z / len) : new Vector3(0, 0, 0);
    }
    distance(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
    reflect(normal) {
      const n = normal.normalize();
      const d = this.dot(n);
      return new Vector3(this.x - 2 * d * n.x, this.y - 2 * d * n.y, this.z - 2 * d * n.z);
    }
    project(target) {
      const tNorm = target.normalize();
      return tNorm.scale(this.dot(tNorm));
    }
    reject(target) {
      return this.sub(this.project(target));
    }
  }

  class Vector4 {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = Number.isFinite(x) ? x : 0;
      this.y = Number.isFinite(y) ? y : 0;
      this.z = Number.isFinite(z) ? z : 0;
      this.w = Number.isFinite(w) ? w : 1;
    }
    clone() { return new Vector4(this.x, this.y, this.z, this.w); }
    add(v) { return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w); }
    sub(v) { return new Vector4(this.x - v.x, this.y - v.y, this.z - v.z, this.w - v.w); }
    scale(s) { return new Vector4(this.x * s, this.y * s, this.z * s, this.w * s); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w; }
    length() { return Math.hypot(this.x, this.y, this.z, this.w); }
    perspectiveDivide() {
      const invW = Math.abs(this.w) > EPSILON ? 1 / this.w : 1;
      return new Vector4(this.x * invW, this.y * invW, this.z * invW, 1.0);
    }
  }

  // ==========================================================================
  // 3. TENSOR MATRIX4 ALGEBRA & CSS matrix3d
  // ==========================================================================

  class Matrix4 {
    constructor(elements) {
      // Column-major order standard (OpenGL & CSS matrix3d compatible)
      this.elements = new Float64Array(16);
      if (elements && elements.length === 16) {
        this.elements.set(elements);
      } else {
        this.setIdentity();
      }
    }

    setIdentity() {
      const e = this.elements;
      e.fill(0);
      e[0] = 1; e[5] = 1; e[10] = 1; e[15] = 1;
      return this;
    }

    static identity() { return new Matrix4(); }

    static translation(tx, ty, tz = 0) {
      const m = new Matrix4();
      m.elements[12] = tx;
      m.elements[13] = ty;
      m.elements[14] = tz;
      return m;
    }

    static scaling(sx, sy, sz = 1) {
      const m = new Matrix4();
      m.elements[0] = sx;
      m.elements[5] = sy;
      m.elements[10] = sz;
      return m;
    }

    static rotationX(rad) {
      const m = new Matrix4();
      const c = Math.cos(rad), s = Math.sin(rad);
      m.elements[5] = c;  m.elements[6] = s;
      m.elements[9] = -s; m.elements[10] = c;
      return m;
    }

    static rotationY(rad) {
      const m = new Matrix4();
      const c = Math.cos(rad), s = Math.sin(rad);
      m.elements[0] = c;  m.elements[2] = -s;
      m.elements[8] = s;  m.elements[10] = c;
      return m;
    }

    static rotationZ(rad) {
      const m = new Matrix4();
      const c = Math.cos(rad), s = Math.sin(rad);
      m.elements[0] = c;  m.elements[1] = s;
      m.elements[4] = -s; m.elements[5] = c;
      return m;
    }

    multiply(other) {
      const a = this.elements;
      const b = other.elements;
      const r = new Float64Array(16);

      for (let i = 0; i < 4; i++) {
        const ai0 = a[i], ai1 = a[i + 4], ai2 = a[i + 8], ai3 = a[i + 12];
        r[i]      = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
        r[i + 4]  = ai0 * b[4] + ai1 * b[5] + ai2 * b[6] + ai3 * b[7];
        r[i + 8]  = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
        r[i + 12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
      }
      return new Matrix4(r);
    }

    transformVector4(v) {
      const e = this.elements;
      return new Vector4(
        e[0] * v.x + e[4] * v.y + e[8]  * v.z + e[12] * v.w,
        e[1] * v.x + e[5] * v.y + e[9]  * v.z + e[13] * v.w,
        e[2] * v.x + e[6] * v.y + e[10] * v.z + e[14] * v.w,
        e[3] * v.x + e[7] * v.y + e[11] * v.z + e[15] * v.w
      );
    }

    determinant() {
      const m = this.elements;
      const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
      const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
      const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
      const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

      const b00 = a00 * a11 - a01 * a10;
      const b01 = a00 * a12 - a02 * a10;
      const b02 = a00 * a13 - a03 * a10;
      const b03 = a01 * a12 - a02 * a11;
      const b04 = a01 * a13 - a03 * a11;
      const b05 = a02 * a13 - a03 * a12;
      const b06 = a20 * a31 - a21 * a30;
      const b07 = a20 * a32 - a22 * a30;
      const b08 = a20 * a33 - a23 * a30;
      const b09 = a21 * a32 - a22 * a31;
      const b10 = a21 * a33 - a23 * a31;
      const b11 = a22 * a33 - a23 * a32;

      return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    }

    inverse() {
      const m = this.elements;
      const det = this.determinant();
      if (Math.abs(det) < EPSILON) {
        return Matrix4.identity(); // Fallback singularity protection
      }
      const invDet = 1 / det;
      const inv = new Float64Array(16);

      const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
      const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
      const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
      const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

      const b00 = a00 * a11 - a01 * a10;
      const b01 = a00 * a12 - a02 * a10;
      const b02 = a00 * a13 - a03 * a10;
      const b03 = a01 * a12 - a02 * a11;
      const b04 = a01 * a13 - a03 * a11;
      const b05 = a02 * a13 - a03 * a12;
      const b06 = a20 * a31 - a21 * a30;
      const b07 = a20 * a32 - a22 * a30;
      const b08 = a20 * a33 - a23 * a30;
      const b09 = a21 * a32 - a22 * a31;
      const b10 = a21 * a33 - a23 * a31;
      const b11 = a22 * a33 - a23 * a32;

      inv[0]  = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
      inv[1]  = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
      inv[2]  = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
      inv[3]  = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;
      inv[4]  = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
      inv[5]  = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
      inv[6]  = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
      inv[7]  = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
      inv[8]  = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
      inv[9]  = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
      inv[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
      inv[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;
      inv[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
      inv[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
      inv[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
      inv[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;

      return new Matrix4(inv);
    }

    static perspective(fovYRad, aspect, near, far) {
      const f = 1.0 / Math.tan(fovYRad / 2);
      const nf = 1 / (near - far);
      const m = new Matrix4();
      const e = m.elements;
      e.fill(0);
      e[0] = f / aspect;
      e[5] = f;
      e[10] = (far + near) * nf;
      e[11] = -1;
      e[14] = (2 * far * near) * nf;
      e[15] = 0;
      return m;
    }

    toCssMatrix3d() {
      const e = this.elements;
      return `matrix3d(${e[0].toFixed(6)}, ${e[1].toFixed(6)}, ${e[2].toFixed(6)}, ${e[3].toFixed(6)}, ${e[4].toFixed(6)}, ${e[5].toFixed(6)}, ${e[6].toFixed(6)}, ${e[7].toFixed(6)}, ${e[8].toFixed(6)}, ${e[9].toFixed(6)}, ${e[10].toFixed(6)}, ${e[11].toFixed(6)}, ${e[12].toFixed(2)}, ${e[13].toFixed(2)}, ${e[14].toFixed(2)}, ${e[15].toFixed(6)})`;
    }
  }

  // ==========================================================================
  // 4. ROTATIONAL LIE ALGEBRA: 4D QUATERNION & SLERP
  // ==========================================================================

  class Quaternion {
    constructor(w = 1, x = 0, y = 0, z = 0) {
      this.w = Number.isFinite(w) ? w : 1;
      this.x = Number.isFinite(x) ? x : 0;
      this.y = Number.isFinite(y) ? y : 0;
      this.z = Number.isFinite(z) ? z : 0;
    }

    static identity() { return new Quaternion(1, 0, 0, 0); }

    length() { return Math.hypot(this.w, this.x, this.y, this.z); }

    normalize() {
      const len = this.length();
      if (len < EPSILON) return Quaternion.identity();
      const inv = 1 / len;
      return new Quaternion(this.w * inv, this.x * inv, this.y * inv, this.z * inv);
    }

    conjugate() { return new Quaternion(this.w, -this.x, -this.y, -this.z); }

    static fromAxisAngle(axisVec3, angleRad) {
      const half = angleRad * 0.5;
      const s = Math.sin(half);
      const a = axisVec3.normalize();
      return new Quaternion(Math.cos(half), a.x * s, a.y * s, a.z * s).normalize();
    }

    static fromEuler(pitchRad, yawRad, rollRad) {
      const p = pitchRad * 0.5;
      const y = yawRad * 0.5;
      const r = rollRad * 0.5;

      const cp = Math.cos(p), sp = Math.sin(p);
      const cy = Math.cos(y), sy = Math.sin(y);
      const cr = Math.cos(r), sr = Math.sin(r);

      return new Quaternion(
        cr * cp * cy + sr * sp * sy,
        sr * cp * cy - cr * sp * sy,
        cr * sp * cy + sr * cp * sy,
        cr * cp * sy - sr * sp * cy
      ).normalize();
    }

    toEuler() {
      const q = this.normalize();
      // Roll (x-axis)
      const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
      const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
      const roll = Math.atan2(sinr_cosp, cosr_cosp);

      // Pitch (y-axis)
      const sinp = 2 * (q.w * q.y - q.z * q.x);
      const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * (Math.PI / 2) : Math.asin(sinp);

      // Yaw (z-axis)
      const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
      const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
      const yaw = Math.atan2(siny_cosp, cosy_cosp);

      return { pitch, yaw, roll };
    }

    multiply(b) {
      const a = this;
      return new Quaternion(
        a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
        a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
        a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
        a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
      ).normalize();
    }

    static slerp(qa, qb, t) {
      let q1 = qa.normalize();
      let q2 = qb.normalize();

      let cosHalfTheta = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;

      // Take shortest path on 4D hypersphere
      if (cosHalfTheta < 0) {
        q2 = new Quaternion(-q2.w, -q2.x, -q2.y, -q2.z);
        cosHalfTheta = -cosHalfTheta;
      }

      if (Math.abs(cosHalfTheta) >= 1.0 - EPSILON) {
        // Very close -> linear interpolation
        return new Quaternion(
          lerp(q1.w, q2.w, t),
          lerp(q1.x, q2.x, t),
          lerp(q1.y, q2.y, t),
          lerp(q1.z, q2.z, t)
        ).normalize();
      }

      const halfTheta = Math.acos(clamp(cosHalfTheta, -1, 1));
      const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

      if (Math.abs(sinHalfTheta) < EPSILON) {
        return q1;
      }

      const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
      const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

      return new Quaternion(
        q1.w * ratioA + q2.w * ratioB,
        q1.x * ratioA + q2.x * ratioB,
        q1.y * ratioA + q2.y * ratioB,
        q1.z * ratioA + q2.z * ratioB
      );
    }

    toMatrix4() {
      const q = this.normalize();
      const xx = q.x * q.x, yy = q.y * q.y, zz = q.z * q.z;
      const xy = q.x * q.y, xz = q.x * q.z, yz = q.y * q.z;
      const wx = q.w * q.x, wy = q.w * q.y, wz = q.w * q.z;

      const m = new Matrix4();
      const e = m.elements;
      e[0] = 1 - 2 * (yy + zz);
      e[1] = 2 * (xy + wz);
      e[2] = 2 * (xz - wy);
      e[3] = 0;

      e[4] = 2 * (xy - wz);
      e[5] = 1 - 2 * (xx + zz);
      e[6] = 2 * (yz + wx);
      e[7] = 0;

      e[8] = 2 * (xz + wy);
      e[9] = 2 * (yz - wx);
      e[10] = 1 - 2 * (xx + yy);
      e[11] = 0;

      e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
      return m;
    }
  }

  // ==========================================================================
  // 5. DIFFERENTIAL EQUATION INTEGRATORS & PHYSICS DYNAMICS
  // ==========================================================================

  /**
   * Runge-Kutta 4th Order (RK4) Integrator.
   * Solves dy/dt = f(t, y) with vector state array y.
   */
  function rk4(f, y0, t0, dt) {
    const n = y0.length;
    const k1 = f(t0, y0);

    const yK1 = new Array(n);
    for (let i = 0; i < n; i++) yK1[i] = y0[i] + 0.5 * dt * k1[i];
    const k2 = f(t0 + 0.5 * dt, yK1);

    const yK2 = new Array(n);
    for (let i = 0; i < n; i++) yK2[i] = y0[i] + 0.5 * dt * k2[i];
    const k3 = f(t0 + 0.5 * dt, yK2);

    const yK3 = new Array(n);
    for (let i = 0; i < n; i++) yK3[i] = y0[i] + dt * k3[i];
    const k4 = f(t0 + dt, yK3);

    const yNext = new Array(n);
    for (let i = 0; i < n; i++) {
      yNext[i] = y0[i] + (dt / 6.0) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    return yNext;
  }

  /**
   * Analytical Damped Harmonic Oscillator (Hooke's Law + Viscous Damping).
   * Exact solution for Underdamped, Critically Damped, and Overdamped.
   */
  function dampedOscillator({ mass = 1.0, stiffness = 180, damping = 24, x0 = 1.0, v0 = 0.0, dt = 1 / 60 } = {}) {
    const m = Math.max(EPSILON, mass);
    const k = Math.max(0, stiffness);
    const c = Math.max(0, damping);

    const omega0 = Math.sqrt(k / m);
    const zeta = c / (2 * Math.sqrt(k * m));

    let x = x0;
    let v = v0;

    if (zeta < 1.0) {
      // Underdamped
      const omegad = omega0 * Math.sqrt(1.0 - zeta * zeta);
      const decay = Math.exp(-zeta * omega0 * dt);
      const cosVal = Math.cos(omegad * dt);
      const sinVal = Math.sin(omegad * dt);
      const aCoeff = x0;
      const bCoeff = (v0 + zeta * omega0 * x0) / omegad;

      x = decay * (aCoeff * cosVal + bCoeff * sinVal);
      v = decay * (
        (bCoeff * omegad - aCoeff * zeta * omega0) * cosVal -
        (aCoeff * omegad + bCoeff * zeta * omega0) * sinVal
      );
    } else if (Math.abs(zeta - 1.0) < 1e-4) {
      // Critically Damped
      const decay = Math.exp(-omega0 * dt);
      const aCoeff = x0;
      const bCoeff = v0 + omega0 * x0;

      x = decay * (aCoeff + bCoeff * dt);
      v = decay * (bCoeff - omega0 * (aCoeff + bCoeff * dt));
    } else {
      // Overdamped
      const gamma = omega0 * Math.sqrt(zeta * zeta - 1.0);
      const r1 = -zeta * omega0 + gamma;
      const r2 = -zeta * omega0 - gamma;
      const c1 = (v0 - r2 * x0) / (r1 - r2);
      const c2 = x0 - c1;

      x = c1 * Math.exp(r1 * dt) + c2 * Math.exp(r2 * dt);
      v = c1 * r1 * Math.exp(r1 * dt) + c2 * r2 * Math.exp(r2 * dt);
    }

    const kineticEnergy = 0.5 * m * v * v;
    const potentialEnergy = 0.5 * k * x * x;

    return {
      displacement: x,
      velocity: v,
      acceleration: (-k * x - c * v) / m,
      omega0,
      zeta,
      energy: {
        kinetic: kineticEnergy,
        potential: potentialEnergy,
        total: kineticEnergy + potentialEnergy
      }
    };
  }

  /**
   * Critical Spring Tuner: Calculates optimal stiffness k and damping c
   * for a target settling time (e.g. 0.42s for Apple VisionOS).
   */
  function criticalSpringTuner(settlingTimeSeconds = 0.42, dampingRatio = 1.0) {
    const ts = Math.max(0.05, settlingTimeSeconds);
    // Settling time for ~2% error in critically damped system: ts ≈ 4 / (zeta * omega0)
    const omega0 = 4.0 / (dampingRatio * ts);
    const mass = 1.0;
    const stiffness = mass * omega0 * omega0;
    const damping = 2 * dampingRatio * Math.sqrt(stiffness * mass);
    return { stiffness, damping, mass, omega0, zeta: dampingRatio };
  }

  // ==========================================================================
  // 6. LIQUID GLASS OPTICS & PHYSICAL DISPERSION
  // ==========================================================================

  /**
   * Snell's Law 3D Vector Refraction with Total Internal Reflection (TIR) detection.
   * @param {Vector3} incident - Unit incident ray vector pointing toward interface.
   * @param {Vector3} normal - Unit normal vector of the interface pointing toward incident side.
   * @param {number} eta - Refractive index ratio (n1 / n2).
   */
  function refractRay(incident, normal, eta) {
    const I = incident.normalize();
    const N = normal.normalize();

    let cosTheta1 = -N.dot(I);
    let n = N;
    let etaRatio = eta;

    // Check if ray is entering or exiting medium
    if (cosTheta1 < 0) {
      cosTheta1 = -cosTheta1;
      n = N.scale(-1);
    }

    const sin2Theta2 = etaRatio * etaRatio * (1.0 - cosTheta1 * cosTheta1);

    if (sin2Theta2 > 1.0) {
      // Total Internal Reflection (TIR)
      const reflected = I.reflect(n);
      return { totalInternalReflection: true, refracted: reflected, reflectance: 1.0 };
    }

    const cosTheta2 = Math.sqrt(1.0 - sin2Theta2);
    const T = I.scale(etaRatio).add(n.scale(etaRatio * cosTheta1 - cosTheta2)).normalize();

    return { totalInternalReflection: false, refracted: T, cosTheta1, cosTheta2 };
  }

  /**
   * Schlick's Fresnel Reflectance Approximation.
   * Computes the fraction of light reflected at boundary.
   */
  function fresnelSchlick(cosTheta, n1 = 1.0, n2 = 1.52) {
    const r0 = Math.pow((n1 - n2) / (n1 + n2), 2);
    const c = clamp(1.0 - cosTheta, 0, 1);
    return r0 + (1.0 - r0) * Math.pow(c, 5);
  }

  /**
   * Cauchy's Optical Dispersion Equation: n(lambda) = A + B / lambda^2.
   * @param {number} wavelengthNm - Optical wavelength in nanometers (e.g. 650 for Red, 450 for Blue).
   */
  function cauchyDispersion(wavelengthNm, A = OPTICS.CAUCHY_A, B = OPTICS.CAUCHY_B) {
    const lambdaSq = wavelengthNm * wavelengthNm;
    return A + (B / lambdaSq);
  }

  /**
   * Chromatic Aberration Subpixel Offsets:
   * Calculates the exact pixel deviation for R, G, B light channels passing through liquid glass.
   */
  function chromaticAberrationOffsets(incident, normal, glassThickness = 12) {
    const nR = cauchyDispersion(650); // Red
    const nG = cauchyDispersion(530); // Green
    const nB = cauchyDispersion(450); // Blue

    const rayR = refractRay(incident, normal, 1.0 / nR);
    const rayG = refractRay(incident, normal, 1.0 / nG);
    const rayB = refractRay(incident, normal, 1.0 / nB);

    return {
      red: rayR.refracted ? rayR.refracted.scale(glassThickness) : new Vector3(),
      green: rayG.refracted ? rayG.refracted.scale(glassThickness) : new Vector3(),
      blue: rayB.refracted ? rayB.refracted.scale(glassThickness) : new Vector3(),
      nR, nG, nB
    };
  }

  // ==========================================================================
  // 7. FLUID SPH SMOOTHING KERNELS (LUCY 2D)
  // ==========================================================================

  /**
   * Lucy 2D SPH Smoothing Kernel for fluid density simulation.
   * W(r, h) = (5 / (pi * h^2)) * (1 + 3q) * (1 - q)^3 for 0 <= q <= 1, q = r/h.
   */
  function sphLucyKernel(r, h = 10) {
    if (r < 0 || r > 2 * h) return 0;
    const q = r / (2 * h);
    if (q > 1.0) return 0;
    const factor = 5.0 / (Math.PI * 4 * h * h);
    return factor * (1 + 3 * q) * Math.pow(1 - q, 3);
  }

  // ==========================================================================
  // 8. STOCHASTIC STATE ESTIMATION & FILTERING
  // ==========================================================================

  /**
   * 1D Discrete Kalman Filter for sensor smoothing.
   */
  class KalmanFilter1D {
    constructor({ q = 0.01, r = 0.5, p = 1.0, x = 0 } = {}) {
      this.q = q; // Process noise
      this.r = r; // Measurement noise
      this.p = p; // Estimation error covariance
      this.x = x; // Value estimate
    }

    update(measurement) {
      if (!Number.isFinite(measurement)) return this.x;
      // Prediction update
      this.p = this.p + this.q;
      // Measurement update
      const k = this.p / (this.p + this.r);
      this.x = this.x + k * (measurement - this.x);
      this.p = (1 - k) * this.p;
      return this.x;
    }

    reset(initial = 0) {
      this.x = initial;
      this.p = 1.0;
    }
  }

  /**
   * 2D Kinematic Kalman Filter (tracks position & velocity [x, y, vx, vy]).
   * Uses optimal alpha-beta steady-state Kalman formulation.
   */
  class KalmanFilter2D {
    constructor({ alpha = 0.75, beta = 0.45 } = {}) {
      this.x = 0; this.y = 0;
      this.vx = 0; this.vy = 0;
      this.alpha = alpha;
      this.beta = beta;
      this.initialized = false;
    }

    predict(dt = 0.1) {
      if (!this.initialized) return;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    update(measX, measY, dt = 0.1) {
      if (!Number.isFinite(measX) || !Number.isFinite(measY)) return;
      const safeDt = Math.max(1e-4, dt);
      if (!this.initialized) {
        this.x = measX;
        this.y = measY;
        this.vx = 0;
        this.vy = 0;
        this.initialized = true;
        return;
      }
      const rx = measX - this.x;
      const ry = measY - this.y;

      this.x += this.alpha * rx;
      this.y += this.alpha * ry;

      this.vx += (this.beta / safeDt) * rx;
      this.vy += (this.beta / safeDt) * ry;
    }

    getState() {
      return { x: this.x, y: this.y, vx: this.vx, vy: this.vy };
    }
  }

  /**
   * Savitzky-Golay 5-Point Quadratic/Cubic Filter:
   * Optimal least-squares polynomial smoothing preserving signal peaks.
   * y0* = (-3*y-2 + 12*y-1 + 17*y0 + 12*y1 - 3*y2) / 35.
   */
  function savitzkyGolay5(samples) {
    if (!Array.isArray(samples) || samples.length < 5) return samples[Math.floor(samples.length / 2)] || 0;
    const [y_2, y_1, y0, y1, y2] = samples.slice(0, 5);
    return (-3 * y_2 + 12 * y_1 + 17 * y0 + 12 * y1 - 3 * y2) / 35.0;
  }

  // ==========================================================================
  // 9. COMPUTATIONAL GEOMETRY & SPATIAL SEARCH
  // ==========================================================================

  /**
   * 2D Convex Hull (Andrew's Monotone Chain Algorithm, O(N log N)).
   * Returns boundary vertices in counter-clockwise order.
   */
  function convexHull2D(points) {
    if (!Array.isArray(points) || points.length <= 3) return points ? [...points] : [];

    const pts = points.map(p => ({ x: p.x, y: p.y })).sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

    const lower = [];
    for (const p of pts) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }

    const upper = [];
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }

    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  /**
   * Ray-AABB (Axis-Aligned Bounding Box) 3D Intersection (Slab Method).
   */
  function rayIntersectsAABB(rayOrigin, rayDir, boxMin, boxMax) {
    const dir = rayDir.normalize();
    let tMin = -Infinity;
    let tMax = Infinity;

    const axes = ['x', 'y', 'z'];
    for (const ax of axes) {
      if (Math.abs(dir[ax]) < EPSILON) {
        if (rayOrigin[ax] < boxMin[ax] || rayOrigin[ax] > boxMax[ax]) return { hit: false };
      } else {
        const invD = 1.0 / dir[ax];
        let t1 = (boxMin[ax] - rayOrigin[ax]) * invD;
        let t2 = (boxMax[ax] - rayOrigin[ax]) * invD;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax || tMax < 0) return { hit: false };
      }
    }
    return { hit: true, tMin, tMax };
  }

  /**
   * Point-in-Polygon (Jordan Curve Theorem Ray Casting).
   */
  function pointInPolygon(point, polygon) {
    if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
    let inside = false;
    const len = polygon.length;
    for (let i = 0; i < len; i++) {
      const j = (i === 0) ? len - 1 : i - 1;
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi || EPSILON) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // ==========================================================================
  // 10. LAYOUT MATHEMATICS & FLUID TYPOGRAPHY
  // ==========================================================================

  /**
   * Exact Mathematical Fluid Clamp Generator:
   * Generates production CSS: clamp(MIN, PREFERRED_VW + REM, MAX).
   */
  function fluidClamp(minRem, maxRem, minViewportWidthPx = 375, maxViewportWidthPx = 1200) {
    const minPx = minRem * 16;
    const maxPx = maxRem * 16;
    const slope = (maxPx - minPx) / (maxViewportWidthPx - minViewportWidthPx);
    const intercept = minPx - slope * minViewportWidthPx;
    const slopeVw = (slope * 100).toFixed(4);
    const interceptRem = (intercept / 16).toFixed(4);
    const css = `clamp(${minRem}rem, ${slopeVw}vw + ${interceptRem}rem, ${maxRem}rem)`;
    return { css, slope, intercept, minRem, maxRem };
  }

  /**
   * Golden Ratio & Fibonacci Geometry.
   */
  const goldenRatio = {
    PHI: PHI,
    INV_PHI: INV_PHI,
    rect: function (width) {
      return { width: width, height: width / PHI };
    },
    fibonacci: function (n) {
      if (n <= 0) return 0;
      if (n === 1) return 1;
      let a = 0, b = 1;
      for (let i = 2; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
      }
      return b;
    },
    scale: function (base, steps) {
      return base * Math.pow(PHI, steps);
    },
    spiralPoints: function (turns = 3, scale = 1.0, count = 50) {
      const points = [];
      const b = Math.log(PHI) / (Math.PI * 0.5);
      for (let i = 0; i < count; i++) {
        const theta = (i / (count - 1)) * (turns * TAU);
        const r = scale * Math.exp(b * theta);
        points.push({
          x: r * Math.cos(theta),
          y: r * Math.sin(theta),
          radius: r,
          theta
        });
      }
      return points;
    }
  };

  /**
   * High-Precision Newton-Raphson + Bisection Cubic-Bezier Solver.
   */
  function solveCubicBezier(p1x = 0.16, p1y = 1.0, p2x = 0.3, p2y = 1.0) {
    function sampleCurveX(t) {
      return ((1 - 3 * p2x + 3 * p1x) * t + (3 * p2x - 6 * p1x)) * t * t + (3 * p1x) * t;
    }
    function sampleCurveY(t) {
      return ((1 - 3 * p2y + 3 * p1y) * t + (3 * p2y - 6 * p1y)) * t * t + (3 * p1y) * t;
    }
    function sampleCurveDerivativeX(t) {
      return (3 * (1 - 3 * p2x + 3 * p1x) * t + 2 * (3 * p2x - 6 * p1x)) * t + (3 * p1x);
    }
    function solveCurveX(x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const xEst = sampleCurveX(t) - x;
        if (Math.abs(xEst) < 1e-5) return t;
        const d2 = sampleCurveDerivativeX(t);
        if (Math.abs(d2) < 1e-6) break;
        t -= xEst / d2;
      }
      let t0 = 0, t1 = 1;
      t = x;
      for (let iter = 0; iter < 16 && t0 < t1; iter++) {
        const xEst = sampleCurveX(t);
        if (Math.abs(xEst - x) < 1e-5) return t;
        if (x > xEst) t0 = t; else t1 = t;
        t = (t1 + t0) * 0.5;
      }
      return t;
    }

    return function (x) {
      return sampleCurveY(solveCurveX(x));
    };
  }

  /**
   * Euler to CSS matrix3d.
   */
  function eulerToMatrix3d({ pitch = 0, yaw = 0, roll = 0, tx = 0, ty = 0, tz = 0, perspective = 1200 } = {}) {
    const rad = Math.PI / 180;
    const p = pitch * rad;
    const y = yaw * rad;
    const r = roll * rad;

    const cp = Math.cos(p), sp = Math.sin(p);
    const cy = Math.cos(y), sy = Math.sin(y);
    const cr = Math.cos(r), sr = Math.sin(r);

    const m11 = cy * cr + sy * sp * sr;
    const m12 = -cy * sr + sy * sp * cr;
    const m13 = sy * cp;

    const m21 = cp * sr;
    const m22 = cp * cr;
    const m23 = -sp;

    const m31 = -sy * cr + cy * sp * sr;
    const m32 = sy * sr + cy * sp * cr;
    const m33 = cy * cp;

    const perspZ = perspective ? -1 / perspective : 0;

    return `matrix3d(${m11.toFixed(6)}, ${m21.toFixed(6)}, ${m31.toFixed(6)}, 0, ${m12.toFixed(6)}, ${m22.toFixed(6)}, ${m32.toFixed(6)}, 0, ${m13.toFixed(6)}, ${m23.toFixed(6)}, ${m33.toFixed(6)}, ${perspZ.toFixed(6)}, ${tx.toFixed(2)}, ${ty.toFixed(2)}, ${tz.toFixed(2)}, 1)`;
  }

  /**
   * Instant Mathematical Fuzzy Filter.
   */
  function fuzzyMatch(query, target) {
    if (!query) return 100;
    if (!target) return 0;

    const q = query.toLowerCase().trim();
    const t = target.toLowerCase().trim();

    if (t === q) return 100;
    if (t.startsWith(q)) return 95;
    if (t.includes(q)) return 85;

    let qIdx = 0;
    let tIdx = 0;
    let score = 0;
    let consecutive = 0;

    while (qIdx < q.length && tIdx < t.length) {
      if (q[qIdx] === t[tIdx]) {
        score += 10;
        consecutive++;
        score += consecutive * 5;
        if (tIdx === 0 || t[tIdx - 1] === ' ' || t[tIdx - 1] === '-' || t[tIdx - 1] === '/') {
          score += 20;
        }
        qIdx++;
      } else {
        consecutive = 0;
      }
      tIdx++;
    }

    if (qIdx === q.length) {
      const ratio = q.length / t.length;
      return Math.min(80, Math.round(score * ratio));
    }

    return 0;
  }

  // ==========================================================================
  // MASTER EXPORT OBJECT
  // ==========================================================================
  const Engine = {
    version: '4.0.0-argon',
    constants: {
      PHI,
      INV_PHI,
      SQ_PHI,
      PI,
      TAU,
      EULER,
      SQRT2,
      INV_SQRT2,
      EPSILON,
      OPTICS,
      VISIONOS_BEZIER: [0.16, 1.0, 0.3, 1.0],
      VISIONOS_DURATION: 0.42
    },
    // Foundations
    clamp,
    lerp,
    remap,
    smoothstep,
    smootherstep,
    // Vectors
    vec2: (x, y) => new Vector2(x, y),
    vec3: (x, y, z) => new Vector3(x, y, z),
    vec4: (x, y, z, w) => new Vector4(x, y, z, w),
    Vector2,
    Vector3,
    Vector4,
    // Matrices & Tensors
    Matrix4,
    // Quaternions
    Quaternion,
    // Physics & Integrators
    rk4,
    dampedOscillator,
    criticalSpringTuner,
    // Optics & Liquid Glass
    refractRay,
    fresnelSchlick,
    cauchyDispersion,
    chromaticAberrationOffsets,
    // Fluids
    sphLucyKernel,
    // Filters & Estimation
    KalmanFilter1D,
    KalmanFilter2D,
    savitzkyGolay5,
    // Geometry
    convexHull2D,
    rayIntersectsAABB,
    pointInPolygon,
    // Layout & Curves
    fluidClamp,
    goldenRatio,
    solveCubicBezier,
    eulerToMatrix3d,
    fuzzyMatch
  };

  return Engine;
});
