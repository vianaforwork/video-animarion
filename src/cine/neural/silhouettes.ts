// 2D silhouettes shared by the memory shadows, the expectation templates and the ending ghosts.
// Drawn on canvases (alpha masks, white on transparent) and as polylines in a unit box
// (x −0.5…0.5, y 0…1, y up), so the same shape can be a shadow, a glowing outline or points.

import { canvasTex } from "../mats.ts";

export type Poly = [number, number][];

/** Human standing figure outline (the "pattern" the brain completes). */
export const HUMAN: Poly = [
  [0, 1.0], [0.07, 0.985], [0.1, 0.93], [0.09, 0.87], [0.05, 0.835], [0.06, 0.81], [0.2, 0.78], [0.24, 0.72], [0.26, 0.5], [0.24, 0.42],
  [0.2, 0.44], [0.19, 0.62], [0.16, 0.55], [0.15, 0.3], [0.13, 0.02], [0.03, 0.02], [0.02, 0.3], [0, 0.4], [-0.02, 0.3], [-0.03, 0.02],
  [-0.13, 0.02], [-0.15, 0.3], [-0.16, 0.55], [-0.19, 0.62], [-0.2, 0.44], [-0.24, 0.42], [-0.26, 0.5], [-0.24, 0.72], [-0.2, 0.78],
  [-0.06, 0.81], [-0.05, 0.835], [-0.09, 0.87], [-0.1, 0.93], [-0.07, 0.985], [0, 1.0],
];

/** Kuntilanak: long hair, long gown, floating, arms hanging. */
export const KUNTI: Poly = [
  [0, 1.0], [0.08, 0.98], [0.12, 0.92], [0.15, 0.8], [0.19, 0.66], [0.27, 0.55], [0.3, 0.42], [0.26, 0.4], [0.24, 0.5], [0.22, 0.38],
  [0.28, 0.12], [0.36, 0.0], [0.18, 0.05], [0.06, 0.0], [-0.05, 0.04], [-0.2, 0.0], [-0.34, 0.03], [-0.27, 0.14], [-0.22, 0.38],
  [-0.24, 0.5], [-0.26, 0.4], [-0.3, 0.42], [-0.27, 0.55], [-0.19, 0.66], [-0.15, 0.8], [-0.12, 0.92], [-0.08, 0.98], [0, 1.0],
];

/** Pocong: a wrapped shroud tied above the head and at the feet. */
export const POCONG: Poly = [
  [0, 1.0], [0.05, 0.96], [0.03, 0.92], [0.11, 0.88], [0.15, 0.78], [0.17, 0.62], [0.17, 0.4], [0.15, 0.2], [0.1, 0.09], [0.06, 0.06],
  [0.1, 0.0], [-0.1, 0.0], [-0.06, 0.06], [-0.1, 0.09], [-0.15, 0.2], [-0.17, 0.4], [-0.17, 0.62], [-0.15, 0.78], [-0.11, 0.88],
  [-0.03, 0.92], [-0.05, 0.96], [0, 1.0],
];

/** Haunted house: crooked roof, a broken shutter, a dead tree. */
export const RUMAH: Poly = [
  [-0.5, 0.0], [-0.5, 0.42], [-0.56, 0.42], [-0.2, 0.78], [-0.16, 0.74], [-0.12, 0.9], [-0.05, 0.9], [-0.05, 0.82], [0.12, 0.98],
  [0.52, 0.5], [0.44, 0.5], [0.46, 0.0], [-0.5, 0.0],
];

const drawPoly = (g: CanvasRenderingContext2D, poly: Poly, w: number, h: number, pad = 0.06) => {
  const s = Math.min(w, h) * (1 - pad * 2);
  g.beginPath();
  poly.forEach(([x, y], i) => {
    const px = w / 2 + x * s, py = h - (pad * h + y * s);
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  });
  g.closePath();
};

/** Soft-edged white mask of a silhouette (for shadows on walls and dissolving ghosts). */
export const silhouetteTex = (key: string, poly: Poly, extra?: (g: CanvasRenderingContext2D, w: number, h: number) => void) =>
  canvasTex(`sil${key}`, 512, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.filter = "blur(6px)";
    g.fillStyle = "#fff";
    drawPoly(g, poly, w, h);
    g.fill();
    if (extra) extra(g, w, h);
    g.filter = "none";
  });

export const KUNTI_TEX = () =>
  silhouetteTex("kunti", KUNTI, (g, w, h) => {
    // hair strands falling past the shoulders
    g.strokeStyle = "#fff";
    g.lineWidth = 6;
    for (let i = -3; i <= 3; i++) {
      g.beginPath();
      g.moveTo(w / 2 + i * 9, h * 0.1);
      g.bezierCurveTo(w / 2 + i * 14, h * 0.3, w / 2 + i * 22, h * 0.42, w / 2 + i * 18, h * 0.58);
      g.stroke();
    }
  });
export const POCONG_TEX = () => silhouetteTex("pocong", POCONG);
export const RUMAH_TEX = () =>
  silhouetteTex("rumah", RUMAH, (g, w, h) => {
    // windows cut out like eyes
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = "#000";
    g.fillRect(w * 0.3, h * 0.55, w * 0.1, h * 0.12);
    g.fillRect(w * 0.58, h * 0.5, w * 0.1, h * 0.15);
    g.fillRect(w * 0.45, h * 0.78, w * 0.1, h * 0.16);
    g.globalCompositeOperation = "source-over";
  });
export const HUMAN_TEX = () => silhouetteTex("human", HUMAN);

/** Resample a closed polyline to n evenly spaced points. */
export const resample = (poly: Poly, n: number): Poly => {
  const seg: number[] = [];
  let L = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    const d = Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]);
    seg.push(d);
    L += d;
  }
  const out: Poly = [];
  for (let k = 0; k < n; k++) {
    let s = (k / (n - 1)) * L, i = 0;
    while (i < seg.length - 1 && s > seg[i]) { s -= seg[i]; i++; }
    const f = seg[i] > 0 ? Math.min(1, s / seg[i]) : 0;
    out.push([poly[i][0] + (poly[i + 1][0] - poly[i][0]) * f, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * f]);
  }
  return out;
};

/** Even-odd point-in-polygon test. */
export const inside = (poly: Poly, x: number, y: number) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
