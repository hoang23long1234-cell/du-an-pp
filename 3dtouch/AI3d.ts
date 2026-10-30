export interface AI3DPoint {
  x: number;
  y: number;
}

export type AI3DTargetMode = 'person' | 'object' | 'any';

export interface AI3DDetection {
  bbox: [number, number, number, number];
  class: string;
  score: number;
  appearance?: number[];
}

export interface AI3DTrackedTarget extends AI3DDetection {
  stale: boolean;
}

export class AI3dTouch {
  private previous: AI3DPoint[] = [];
  private previousTime = 0;

  public smoothLandmarks(points: AI3DPoint[], now = performance.now()): AI3DPoint[] {
    if (points.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
      throw new TypeError('Landmark coordinates must be finite numbers.');
    }

    if (points.length !== this.previous.length || !this.previousTime || now <= this.previousTime) {
      this.previous = points.map(({ x, y }) => ({ x, y }));
      this.previousTime = now;
      return this.previous.map(({ x, y }) => ({ x, y }));
    }

    const elapsedSeconds = Math.max((now - this.previousTime) / 1000, 1 / 120);
    this.previous = points.map((point, index) => {
      const last = this.previous[index];
      const speed = Math.hypot(point.x - last.x, point.y - last.y) / elapsedSeconds;
      const response = Math.min(0.82, Math.max(0.34, 0.34 + speed * 0.23));
      return {
        x: last.x + (point.x - last.x) * response,
        y: last.y + (point.y - last.y) * response,
      };
    });
    this.previousTime = now;
    return this.previous.map(({ x, y }) => ({ x, y }));
  }

  public reset(): void {
    this.previous = [];
    this.previousTime = 0;
  }
}

export class AI3dTargetTracker {
  private previous: AI3DTrackedTarget | null = null;
  private lastSeen = 0;

  public update(
    detections: AI3DDetection[],
    mode: AI3DTargetMode,
    now = performance.now(),
  ): AI3DTrackedTarget | null {
    const eligible = detections.filter(({ class: label, score }) => (
      score >= 0.38
      && (mode === 'any' || (mode === 'person' ? label === 'person' : label !== 'person'))
    ));
    const previous = this.previous;
    let selected: AI3DDetection | undefined;

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
        const cost = distance - this.intersectionOverUnion(previous.bbox, candidate.bbox) * 0.18
          + appearanceDifference * 0.24;
        if (cost < bestCost) {
          bestCost = cost;
          selected = candidate;
        }
      }
      if (bestCost > 0.34) selected = undefined;
    }

    if (!selected && (!previous || now - this.lastSeen > 1100)) {
      selected = eligible.reduce<AI3DDetection | undefined>((best, candidate) => {
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
      ? selected.bbox.map((value, index) => previous.bbox[index] + (value - previous.bbox[index]) * 0.62) as AI3DDetection['bbox']
      : [...selected.bbox] as AI3DDetection['bbox'];
    this.previous = { ...selected, bbox: smoothed, stale: false };
    this.lastSeen = now;
    return { ...this.previous };
  }

  public reset(): void {
    this.previous = null;
    this.lastSeen = 0;
  }

  private centerDistance([x, y, width, height]: AI3DDetection['bbox']): number {
    return Math.hypot(x + width / 2 - 0.5, y + height / 2 - 0.5);
  }

  private intersectionOverUnion(
    [ax, ay, aw, ah]: AI3DDetection['bbox'],
    [bx, by, bw, bh]: AI3DDetection['bbox'],
  ): number {
    const intersectionWidth = Math.max(0, Math.min(ax + aw, bx + bw) - Math.max(ax, bx));
    const intersectionHeight = Math.max(0, Math.min(ay + ah, by + bh) - Math.max(ay, by));
    const intersection = intersectionWidth * intersectionHeight;
    const union = aw * ah + bw * bh - intersection;
    return union > 0 ? intersection / union : 0;
  }

  private appearanceDifference(previous?: number[], candidate?: number[]): number {
    if (!previous || !candidate || previous.length !== candidate.length || !previous.length) return 0;
    const distance = previous.reduce((sum, value, index) => sum + Math.abs(value - candidate[index]), 0);
    return distance / 6;
  }
}