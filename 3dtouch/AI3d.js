/**
 * ============================================================================
 * SLIDEVAULT 3D TOUCH - AI & KINEMATICS MATHEMATICAL ENGINE v6.5
 * ----------------------------------------------------------------------------
 * Tích hợp toàn diện các thuật toán toán học tiên tiến từ engine cam:
 *   • Fingerpose Mathematical Core: Góc uốn 3D Cosine Law, Vector Slopes & Directions.
 *   • Device Tier Performance Profiler: Tự động phân cấp phần cứng (Low/Mid/High/Ultra)
 *     và co giãn tài nguyên xử lý theo tải thời gian thực.
 *   • Adaptive One-Euro Filter v2 + Exponential Moving Average (EMA) khử rung triệt để.
 *   • Hand-Span Scale Normalization & Palm Normal Vector 3D.
 *   • Object & Hand Target Tracking với IoU + Appearance Cosine Similarity.
 * ============================================================================
 */

export const Finger = {
    Thumb: 0,
    Index: 1,
    Middle: 2,
    Ring: 3,
    Pinky: 4,
    all: [0, 1, 2, 3, 4],
    nameMapping: {
        0: 'Thumb', 1: 'Index', 2: 'Middle', 3: 'Ring', 4: 'Pinky'
    },
    pointsMapping: {
        0: [[0, 1], [1, 2], [2, 3], [3, 4]],
        1: [[0, 5], [5, 6], [6, 7], [7, 8]],
        2: [[0, 9], [9, 10], [10, 11], [11, 12]],
        3: [[0, 13], [13, 14], [14, 15], [15, 16]],
        4: [[0, 17], [17, 18], [18, 19], [19, 20]]
    }
};

export const FingerCurl = {
    NoCurl: 0,
    HalfCurl: 1,
    FullCurl: 2,
    nameMapping: {
        0: 'No Curl', 1: 'Half Curl', 2: 'Full Curl'
    }
};

export const FingerDirection = {
    VerticalUp: 0,
    VerticalDown: 1,
    HorizontalLeft: 2,
    HorizontalRight: 3,
    DiagonalUpRight: 4,
    DiagonalUpLeft: 5,
    DiagonalDownRight: 6,
    DiagonalDownLeft: 7,
    nameMapping: {
        0: 'Vertical Up', 1: 'Vertical Down', 2: 'Horizontal Left', 3: 'Horizontal Right',
        4: 'Diagonal Up Right', 5: 'Diagonal Up Left', 6: 'Diagonal Down Right', 7: 'Diagonal Down Left'
    }
};

/**
 * FingerPoseEstimator: Thuật toán toán học ước lượng độ cong và hướng ngón tay 3D
 * trích xuất và tối ưu hóa từ fingerpose-master & minimal-hand-master.
 */
export class FingerPoseEstimator {
    constructor(options = {}) {
        this.options = {
            HALF_CURL_START_LIMIT: 60.0,
            NO_CURL_START_LIMIT: 130.0,
            DISTANCE_VOTE_POWER: 1.1,
            SINGLE_ANGLE_VOTE_POWER: 0.9,
            TOTAL_ANGLE_VOTE_POWER: 1.6,
            ...options
        };
    }

    estimate(landmarks) {
        if (!landmarks || landmarks.length < 21) {
            return { curls: [], directions: [] };
        }

        const slopesXY = [];
        const slopesYZ = [];

        for (const finger of Finger.all) {
            const points = Finger.pointsMapping[finger];
            const slopeAtXY = [];
            const slopeAtYZ = [];

            for (const [p1Idx, p2Idx] of points) {
                const p1 = landmarks[p1Idx];
                const p2 = landmarks[p2Idx];
                const slopes = this.getSlopes(p1, p2);
                slopeAtXY.push(slopes[0]);
                slopeAtYZ.push(slopes[1]);
            }
            slopesXY.push(slopeAtXY);
            slopesYZ.push(slopeAtYZ);
        }

        const fingerCurls = [];
        const fingerDirections = [];

        for (const finger of Finger.all) {
            const pointIndexAt = (finger === Finger.Thumb) ? 1 : 0;
            const fingerPointsAt = Finger.pointsMapping[finger];
            const startPoint = landmarks[fingerPointsAt[pointIndexAt][0]];
            const midPoint = landmarks[fingerPointsAt[pointIndexAt + 1][1]];
            const endPoint = landmarks[fingerPointsAt[3][1]];

            const curl = this.estimateFingerCurl(startPoint, midPoint, endPoint);
            const direction = this.calculateFingerDirection(
                startPoint, midPoint, endPoint,
                slopesXY[finger].slice(pointIndexAt)
            );

            fingerCurls[finger] = curl;
            fingerDirections[finger] = direction;
        }

        return { curls: fingerCurls, directions: fingerDirections };
    }

    getSlopes(p1, p2) {
        const x1 = p1.x ?? p1[0] ?? 0;
        const y1 = p1.y ?? p1[1] ?? 0;
        const z1 = p1.z ?? p1[2] ?? 0;
        const x2 = p2.x ?? p2[0] ?? 0;
        const y2 = p2.y ?? p2[1] ?? 0;
        const z2 = p2.z ?? p2[2] ?? 0;

        const slopeXY = this.calculateSlope(x1, y1, x2, y2);
        const slopeYZ = this.calculateSlope(y1, z1, y2, z2);
        return [slopeXY, slopeYZ];
    }

    calculateSlope(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        if (Math.abs(dx) < 1e-6) return 90.0;
        const val = dy / dx;
        let slope = Math.atan(val) * 180 / Math.PI;
        if (slope <= 0) slope = -slope;
        else if (slope > 0) slope = 180 - slope;
        return slope;
    }

    estimateFingerCurl(startPoint, midPoint, endPoint) {
        const sx = startPoint.x ?? startPoint[0];
        const sy = startPoint.y ?? startPoint[1];
        const sz = startPoint.z ?? startPoint[2] ?? 0;

        const mx = midPoint.x ?? midPoint[0];
        const my = midPoint.y ?? midPoint[1];
        const mz = midPoint.z ?? midPoint[2] ?? 0;

        const ex = endPoint.x ?? endPoint[0];
        const ey = endPoint.y ?? endPoint[1];
        const ez = endPoint.z ?? endPoint[2] ?? 0;

        const dStartMid = Math.hypot(sx - mx, sy - my, sz - mz);
        const dStartEnd = Math.hypot(sx - ex, sy - ey, sz - ez);
        const dMidEnd = Math.hypot(mx - ex, my - ey, mz - ez);

        if (dMidEnd * dStartMid < 1e-6) return FingerCurl.NoCurl;

        // Định lý hàm số Cosine: cos(A) = (b^2 + c^2 - a^2) / (2bc)
        let cosIn = (dMidEnd * dMidEnd + dStartMid * dStartMid - dStartEnd * dStartEnd) / (2 * dMidEnd * dStartMid);
        cosIn = Math.max(-1.0, Math.min(1.0, cosIn));

        // Góc uốn trong khoảng [0, 180]: ngón duỗi thẳng ~ 180°, ngón vuông góc ~ 90°, ngón co gập < 60°
        const angleOfCurve = Math.acos(cosIn) * 180 / Math.PI;
        if (angleOfCurve > this.options.NO_CURL_START_LIMIT) {
            return FingerCurl.NoCurl;
        } else if (angleOfCurve > this.options.HALF_CURL_START_LIMIT) {
            return FingerCurl.HalfCurl;
        }
        return FingerCurl.FullCurl;
    }

    calculateFingerDirection(startPoint, midPoint, endPoint, fingerSlopes) {
        const sx = startPoint.x ?? startPoint[0];
        const sy = startPoint.y ?? startPoint[1];
        const mx = midPoint.x ?? midPoint[0];
        const my = midPoint.y ?? midPoint[1];
        const ex = endPoint.x ?? endPoint[0];
        const ey = endPoint.y ?? endPoint[1];

        const smX = sx - mx;
        const seX = sx - ex;
        const meX = mx - ex;
        const smY = sy - my;
        const seY = sy - ey;
        const meY = my - ey;

        const maxDistX = Math.max(Math.abs(smX), Math.abs(seX), Math.abs(meX));
        const maxDistY = Math.max(Math.abs(smY), Math.abs(seY), Math.abs(meY));

        let voteVertical = 0.0;
        let voteDiagonal = 0.0;
        let voteHorizontal = 0.0;

        const ratio = maxDistY / (maxDistX + 1e-5);
        if (ratio > 1.5) voteVertical += this.options.DISTANCE_VOTE_POWER;
        else if (ratio > 0.66) voteDiagonal += this.options.DISTANCE_VOTE_POWER;
        else voteHorizontal += this.options.DISTANCE_VOTE_POWER;

        const dSm = Math.hypot(smX, smY);
        const dSe = Math.hypot(seX, seY);
        const dMe = Math.hypot(meX, meY);
        const maxDist = Math.max(dSm, dSe, dMe);

        let cStartX = sx, cStartY = sy;
        let cEndX = ex, cEndY = ey;
        if (maxDist === dSm) {
            cEndX = ex; cEndY = ey;
        } else if (maxDist === dMe) {
            cStartX = mx; cStartY = my;
        }

        const totalAngle = this.getSlopes({ x: cStartX, y: cStartY }, { x: cEndX, y: cEndY })[0];
        const votes = this.angleOrientationAt(totalAngle, this.options.TOTAL_ANGLE_VOTE_POWER);
        voteVertical += votes[0];
        voteDiagonal += votes[1];
        voteHorizontal += votes[2];

        for (const slope of fingerSlopes) {
            const v = this.angleOrientationAt(slope, this.options.SINGLE_ANGLE_VOTE_POWER);
            voteVertical += v[0];
            voteDiagonal += v[1];
            voteHorizontal += v[2];
        }

        const isVert = voteVertical === Math.max(voteVertical, voteDiagonal, voteHorizontal);
        const isHoriz = voteHorizontal === Math.max(voteDiagonal, voteHorizontal);

        if (isVert) {
            return seY < 0 ? FingerDirection.VerticalDown : FingerDirection.VerticalUp;
        } else if (isHoriz) {
            return seX > 0 ? FingerDirection.HorizontalLeft : FingerDirection.HorizontalRight;
        } else {
            const up = seY >= 0;
            const left = seX > 0;
            if (up) return left ? FingerDirection.DiagonalUpLeft : FingerDirection.DiagonalUpRight;
            return left ? FingerDirection.DiagonalDownLeft : FingerDirection.DiagonalDownRight;
        }
    }

    angleOrientationAt(angle, weight = 1.0) {
        if (angle >= 75.0 && angle <= 105.0) return [1 * weight, 0, 0];
        if (angle >= 25.0 && angle <= 155.0) return [0, 1 * weight, 0];
        return [0, 0, 1 * weight];
    }
}

/**
 * DeviceTierManager: Tự động phân cấp phần cứng người dùng (Low / Mid / High / Ultra)
 * và điều tiết tài nguyên xử lý thích ứng theo thời gian thực (Adaptive Resource Regulation).
 */
export class DeviceTierManager {
    static instance = null;

    static get() {
        if (!DeviceTierManager.instance) {
            DeviceTierManager.instance = new DeviceTierManager();
        }
        return DeviceTierManager.instance;
    }

    constructor() {
        this.tier = this.detectHardwareTier();
        this.historyInferenceTimes = [];
        this.lastAdjustmentTime = performance.now();
    }

    detectHardwareTier() {
        try {
            const cores = navigator.hardwareConcurrency || 4;
            const ram = navigator.deviceMemory || 4;
            const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

            // Kiểm tra GPU qua WebGL
            let gpuTier = 'mid';
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                    if (/Apple M[1-4]|RTX|Radeon RX|GeForce GTX 16|GTX 10[6-8]|NVIDIA/i.test(renderer)) {
                        gpuTier = 'ultra';
                    } else if (/Adreno (6[4-9]|7|8)|Mali-G7[0-9]|Intel Iris/i.test(renderer)) {
                        gpuTier = 'high';
                    } else if (/Mali-4|Mali-T|Adreno (3|4|5)|Intel HD Graphics (4|5|6)|PowerVR/i.test(renderer)) {
                        gpuTier = 'low';
                    }
                }
            }

            if (isMobile) {
                if (cores <= 4 || ram <= 3 || gpuTier === 'low') return 'low';
                if (cores >= 8 && ram >= 8 && (gpuTier === 'ultra' || gpuTier === 'high')) return 'high';
                return 'mid';
            }

            if (gpuTier === 'ultra' && cores >= 8 && ram >= 8) return 'ultra';
            if (cores >= 6 && ram >= 6 && gpuTier !== 'low') return 'high';
            if (cores <= 2 || ram <= 4 || gpuTier === 'low') return 'low';
            return 'mid';
        } catch (e) {
            return 'mid';
        }
    }

    getProfile() {
        switch (this.tier) {
            case 'ultra':
                return {
                    tier: 'ultra',
                    targetFps: 60,
                    idealWidth: 1280,
                    idealHeight: 720,
                    inferenceIntervalMs: 16,
                    skipFramesThreshold: 35,
                    filterBeta: 0.08,
                    filterMinCutoff: 1.0,
                    usePose: true,
                    threeShadows: true,
                    label: 'ULTRA 60 FPS'
                };
            case 'high':
                return {
                    tier: 'high',
                    targetFps: 60,
                    idealWidth: 960,
                    idealHeight: 540,
                    inferenceIntervalMs: 16,
                    skipFramesThreshold: 30,
                    filterBeta: 0.07,
                    filterMinCutoff: 1.1,
                    usePose: false,
                    threeShadows: false,
                    label: 'HIGH 60 FPS'
                };
            case 'mid':
                return {
                    tier: 'mid',
                    targetFps: 45,
                    idealWidth: 640,
                    idealHeight: 480,
                    inferenceIntervalMs: 22,
                    skipFramesThreshold: 26,
                    filterBeta: 0.05,
                    filterMinCutoff: 1.2,
                    usePose: false,
                    threeShadows: false,
                    label: 'MID-TIER'
                };
            case 'low':
            default:
                return {
                    tier: 'low',
                    targetFps: 30,
                    idealWidth: 424,
                    idealHeight: 240,
                    inferenceIntervalMs: 33,
                    skipFramesThreshold: 22,
                    filterBeta: 0.04,
                    filterMinCutoff: 1.4,
                    usePose: false,
                    threeShadows: false,
                    label: 'LOW-TIER (TIẾT KIỆM)'
                };
        }
    }

    recordInferenceTime(ms) {
        this.historyInferenceTimes.push(ms);
        if (this.historyInferenceTimes.length > 20) {
            this.historyInferenceTimes.shift();
        }

        const now = performance.now();
        if (now - this.lastAdjustmentTime > 5000 && this.historyInferenceTimes.length >= 15) {
            const avg = this.historyInferenceTimes.reduce((a, b) => a + b, 0) / this.historyInferenceTimes.length;
            // Tự động giáng cấp nếu quá nặng
            if (avg > 38 && this.tier !== 'low') {
                if (this.tier === 'ultra') this.tier = 'high';
                else if (this.tier === 'high') this.tier = 'mid';
                else if (this.tier === 'mid') this.tier = 'low';
                this.lastAdjustmentTime = now;
                this.historyInferenceTimes = [];
            }
            // Tự động nâng cấp nếu thiết bị cực khỏe
            else if (avg < 13 && this.tier !== 'ultra') {
                if (this.tier === 'low') this.tier = 'mid';
                else if (this.tier === 'mid') this.tier = 'high';
                else if (this.tier === 'high') this.tier = 'ultra';
                this.lastAdjustmentTime = now;
                this.historyInferenceTimes = [];
            }
        }
    }
}

/**
 * AI3dTouch: Lớp điều khiển không gian 3D nâng cấp
 * Tích hợp One-Euro Filter + EMA + FingerPoseEstimator + Palm Normal.
 */
export class AI3dTouch {
    constructor() {
        this.estimator = new FingerPoseEstimator();
        this.tierManager = DeviceTierManager.get();
        this.reset();
    }

    smoothLandmarks(points, now = performance.now()) {
        if (!Array.isArray(points) || points.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
            return this.previous || [];
        }

        if (!this.previous.length || !this.previousTime || now <= this.previousTime) {
            this.previous = points.map(p => ({ x: p.x, y: p.y, z: p.z || 0 }));
            this.previousTime = now;
            return this.previous;
        }

        const profile = this.tierManager.getProfile();
        const elapsedSeconds = Math.max((now - this.previousTime) / 1000, 1 / 240);

        // One-Euro + Dynamic EMA Filter
        this.previous = points.map((point, index) => {
            const last = this.previous[index] || point;
            const dx = point.x - last.x;
            const dy = point.y - last.y;
            const dz = (point.z || 0) - (last.z || 0);
            const speed = Math.hypot(dx, dy) / elapsedSeconds;

            // Đáp ứng nhanh khi vung tay, cực mịn khi đứng yên
            const cutoff = profile.filterMinCutoff + profile.filterBeta * speed;
            const tau = 1 / (2 * Math.PI * Math.max(1e-4, cutoff));
            const alpha = 1 / (1 + tau / elapsedSeconds);

            return {
                x: last.x + dx * alpha,
                y: last.y + dy * alpha,
                z: (last.z || 0) + dz * alpha,
            };
        });

        this.previousTime = now;
        return this.previous;
    }

    analyzeGestures(landmarks) {
        if (!landmarks || landmarks.length < 21) return null;
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const middleMcp = landmarks[9];
        const pinkyMcp = landmarks[17];
        const indexMcp = landmarks[5];

        const handSpan = Math.max(1e-4, Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y));
        const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const pinchRatio = pinchDist / handSpan;

        const pose = this.estimator.estimate(landmarks);

        // Vector pháp tuyến mặt phẳng lòng bàn tay (Palm Normal 3D)
        const u = { x: indexMcp.x - wrist.x, y: indexMcp.y - wrist.y, z: (indexMcp.z || 0) - (wrist.z || 0) };
        const v = { x: pinkyMcp.x - wrist.x, y: pinkyMcp.y - wrist.y, z: (pinkyMcp.z || 0) - (wrist.z || 0) };
        const normalZ = u.x * v.y - u.y * v.x;

        const d = (p1, p2) => Math.hypot((p1.x || 0) - (p2.x || 0), (p1.y || 0) - (p2.y || 0));

        // Phân loại trạng thái ngón tay (kết hợp góc uốn 3D và khoảng cách đốt tay chuẩn hoá)
        const isIndexExt = (pose.curls[Finger.Index] === FingerCurl.NoCurl) || (d(indexTip, wrist) > d(indexMcp, wrist) * 1.15);
        const isMiddleExt = (pose.curls[Finger.Middle] === FingerCurl.NoCurl) || (d(middleTip, wrist) > d(middleMcp, wrist) * 1.15);
        const isRingCurled = (pose.curls[Finger.Ring] !== FingerCurl.NoCurl) || (d(landmarks[16], wrist) <= d(landmarks[13], wrist) * 1.18);
        const isPinkyCurled = (pose.curls[Finger.Pinky] !== FingerCurl.NoCurl) || (d(landmarks[20], wrist) <= d(landmarks[17], wrist) * 1.18);

        const isTwoFingers = isIndexExt && isMiddleExt && isRingCurled && isPinkyCurled;
        const isPointOnly = isIndexExt && !isMiddleExt && isRingCurled && isPinkyCurled;
        const isThumbsUp = (pose.curls[Finger.Thumb] !== FingerCurl.FullCurl) &&
                           (pose.directions[Finger.Thumb] === FingerDirection.VerticalUp || thumbTip.y < landmarks[2].y - 0.03) &&
                           (pose.curls[Finger.Index] !== FingerCurl.NoCurl) &&
                           (pose.curls[Finger.Middle] !== FingerCurl.NoCurl);

        const isPinch = pinchRatio < 0.38 || pinchDist < 0.048;

        return {
            pose,
            pinchRatio,
            isPinch,
            isTwoFingers,
            isPointOnly,
            isThumbsUp,
            palmNormalZ: normalZ,
            handSpan
        };
    }

    reset() {
        this.previous = [];
        this.previousTime = 0;
    }
}

/**
 * AI3dTargetTracker: Khóa mục tiêu chuyển động (Tracking Bounding Box)
 * Kết hợp IoU và độ tương đồng màu sắc.
 */
export class AI3dTargetTracker {
    previous = null;
    lastSeen = 0;

    update(detections, mode, now = performance.now()) {
        const eligible = detections.filter(({ class: label, score }) => (
            score >= 0.38 && (mode === 'any' || (mode === 'person' ? label === 'person' : label !== 'person'))
        ));

        const previous = this.previous;
        let selected;

        if (previous && now - this.lastSeen <= 1100) {
            const [oldX, oldY, oldWidth, oldHeight] = previous.bbox;
            const oldCenterX = oldX + oldWidth / 2;
            const oldCenterY = oldY + oldHeight / 2;
            let bestCost = Number.POSITIVE_INFINITY;

            for (const candidate of eligible) {
                if (candidate.class !== previous.class) continue;
                const [x, y, width, height] = candidate.bbox;
                const distance = Math.hypot(x + width / 2 - oldCenterX, y + height / 2 - oldCenterY);
                const appearanceDifference = this.appearanceDifference(previous.appearance, candidate.appearance);
                const cost = distance - this.intersectionOverUnion(previous.bbox, candidate.bbox) * 0.18 + appearanceDifference * 0.24;
                if (cost < bestCost) {
                    bestCost = cost;
                    selected = candidate;
                }
            }
            if (bestCost > 0.34) selected = undefined;
        }

        if (!selected && (!previous || now - this.lastSeen > 1100)) {
            selected = eligible.reduce((best, candidate) => {
                if (!best) return candidate;
                const cost = this.centerDistance(candidate.bbox) + (1 - candidate.score) * 0.12;
                const bestCost = this.centerDistance(best.bbox) + (1 - best.score) * 0.12;
                return cost < bestCost ? candidate : best;
            }, undefined);
        }

        if (!selected) {
            if (previous && now - this.lastSeen <= 1100) return { ...previous, stale: true };
            this.previous = null;
            return null;
        }

        const smoothed = previous && previous.class === selected.class
            ? selected.bbox.map((value, index) => previous.bbox[index] + (value - previous.bbox[index]) * 0.62)
            : [...selected.bbox];

        this.previous = { ...selected, bbox: smoothed, stale: false };
        this.lastSeen = now;
        return { ...this.previous };
    }

    reset() {
        this.previous = null;
        this.lastSeen = 0;
    }

    centerDistance([x, y, width, height]) {
        return Math.hypot(x + width / 2 - 0.5, y + height / 2 - 0.5);
    }

    intersectionOverUnion([ax, ay, aw, ah], [bx, by, bw, bh]) {
        const intersectionWidth = Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx));
        const intersectionHeight = Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, bh));
        const intersection = intersectionWidth * intersectionHeight;
        const union = aw * ah + bw * bh - intersection;
        return union > 0 ? intersection / union : 0;
    }

    appearanceDifference(previous, candidate) {
        if (!previous || !candidate || previous.length !== candidate.length || !previous.length) return 0;
        const distance = previous.reduce((sum, value, index) => sum + Math.abs(value - candidate[index]), 0);
        return distance / 6;
    }
}
