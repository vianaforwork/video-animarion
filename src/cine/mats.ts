// Materials and procedural canvas textures for the film. Every material is built once per key and
// shared; textures are drawn deterministically (seeded) on canvases, so nothing depends on files.

import {
  CanvasTexture,
  Color,
  type Material,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  type MeshPhysicalMaterialParameters,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";
import { mulberry32 } from "../kits/worldforge/noise.ts";

const cache = new Map<string, Material>();

export const phys = (key: string, p: MeshPhysicalMaterialParameters): MeshPhysicalMaterial => {
  let m = cache.get(key) as MeshPhysicalMaterial | undefined;
  if (!m) {
    m = new MeshPhysicalMaterial(p);
    cache.set(key, m);
  }
  return m;
};

export const basic = (key: string, p: ConstructorParameters<typeof MeshBasicMaterial>[0]): MeshBasicMaterial => {
  let m = cache.get(key) as MeshBasicMaterial | undefined;
  if (!m) {
    m = new MeshBasicMaterial(p);
    cache.set(key, m);
  }
  return m;
};

// ── canvas textures ─────────────────────────────────────────────────────────

const texCache = new Map<string, Texture>();
export const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number], srgb = true) => {
  let t = texCache.get(key);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    draw(g, w, h);
    t = new CanvasTexture(c);
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    if (repeat) {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(...repeat);
    }
    texCache.set(key, t);
  }
  return t;
};

const shade = (hex: string, k: number) => {
  const c = new Color(hex);
  c.multiplyScalar(k);
  return `#${c.getHexString()}`;
};

/** Large-format ceramic floor tiles with thin grout. */
export const tileTex = (rep: [number, number]) =>
  canvasTex(`tile${rep}`, 512, 512, (g, w, h) => {
    const r = mulberry32(7);
    g.fillStyle = "#b9b4ab";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        const v = 0.94 + r() * 0.1;
        g.fillStyle = shade("#d2cdc4", v);
        g.fillRect(i * 256 + 3, j * 256 + 3, 250, 250);
        for (let k = 0; k < 140; k++) {
          g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "120,110,100"},${0.03 + r() * 0.04})`;
          const x = i * 256 + 3 + r() * 250, y = j * 256 + 3 + r() * 250;
          g.beginPath();
          g.ellipse(x, y, 4 + r() * 22, 2 + r() * 8, r() * 3, 0, Math.PI * 2);
          g.fill();
        }
      }
  }, rep);

/** Oak plank floor. */
export const plankTex = (rep: [number, number]) =>
  canvasTex(`plank${rep}`, 512, 1024, (g, w, h) => {
    const r = mulberry32(11);
    const pw = w / 4;
    for (let i = 0; i < 4; i++) {
      let y = -r() * 300;
      while (y < h) {
        const len = 380 + r() * 320;
        const base = shade("#9a7352", 0.82 + r() * 0.3);
        g.fillStyle = base;
        g.fillRect(i * pw, y, pw, len);
        for (let k = 0; k < 26; k++) {
          g.strokeStyle = `rgba(60,36,20,${0.06 + r() * 0.1})`;
          g.lineWidth = 0.6 + r() * 1.6;
          const x = i * pw + r() * pw;
          g.beginPath();
          g.moveTo(x, y);
          g.bezierCurveTo(x + (r() - 0.5) * 12, y + len * 0.3, x + (r() - 0.5) * 12, y + len * 0.7, x + (r() - 0.5) * 8, y + len);
          g.stroke();
        }
        g.fillStyle = "rgba(40,24,14,0.55)";
        g.fillRect(i * pw, y, pw, 2);
        y += len;
      }
      g.fillStyle = "rgba(40,24,14,0.5)";
      g.fillRect(i * pw, 0, 2, h);
    }
  }, rep);

/** Soft woven fabric (sofa, rug). */
export const weaveTex = (key: string, color: string, rep: [number, number], stripe?: string) =>
  canvasTex(`weave${key}`, 256, 256, (g, w, h) => {
    const r = mulberry32(3);
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4)
      for (let x = 0; x < w; x += 4) {
        g.fillStyle = `rgba(${(x + y) % 8 ? "255,255,255" : "0,0,0"},${0.025 + r() * 0.035})`;
        g.fillRect(x, y, 4, 2);
      }
    if (stripe) {
      g.fillStyle = stripe;
      for (let y = 0; y < h; y += 64) g.fillRect(0, y + 20, w, 10);
    }
  }, rep);

/** Rough render on exterior walls. */
export const renderTex = (key: string, color: string, rep: [number, number]) =>
  canvasTex(`render${key}`, 256, 256, (g, w, h) => {
    const r = mulberry32(5);
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 1600; k++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.02 + r() * 0.03})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
    }
  }, rep);

/** Wooden wall planks (memory room). */
export const boardTex = (rep: [number, number]) =>
  canvasTex(`board${rep}`, 512, 512, (g, w, h) => {
    const r = mulberry32(21);
    const bw = w / 5;
    for (let i = 0; i < 5; i++) {
      g.fillStyle = shade("#7a5534", 0.78 + r() * 0.35);
      g.fillRect(i * bw, 0, bw, h);
      for (let k = 0; k < 30; k++) {
        g.strokeStyle = `rgba(40,22,10,${0.08 + r() * 0.12})`;
        g.lineWidth = 0.5 + r() * 1.5;
        const x = i * bw + r() * bw;
        g.beginPath();
        g.moveTo(x, 0);
        g.bezierCurveTo(x + (r() - 0.5) * 20, h * 0.3, x + (r() - 0.5) * 20, h * 0.7, x + (r() - 0.5) * 10, h);
        g.stroke();
      }
      g.fillStyle = "rgba(25,14,6,0.8)";
      g.fillRect(i * bw, 0, 3, h);
    }
  }, rep);

/** Woven pandan mat (tikar). */
export const matTex = (rep: [number, number]) =>
  canvasTex(`tikar${rep}`, 256, 256, (g, w, h) => {
    const r = mulberry32(9);
    g.fillStyle = "#c9a56b";
    g.fillRect(0, 0, w, h);
    const s = 16;
    for (let y = 0; y < h; y += s)
      for (let x = 0; x < w; x += s) {
        const hor = ((x + y) / s) % 2 === 0;
        g.fillStyle = shade(hor ? "#d6b57c" : "#b58f58", 0.92 + r() * 0.14);
        g.fillRect(x + 1, y + 1, s - 2, s - 2);
        g.strokeStyle = "rgba(90,60,25,0.35)";
        g.lineWidth = 1;
        for (let k = 3; k < s - 2; k += 4) {
          g.beginPath();
          if (hor) { g.moveTo(x + 2, y + k); g.lineTo(x + s - 2, y + k); } else { g.moveTo(x + k, y + 2); g.lineTo(x + k, y + s - 2); }
          g.stroke();
        }
      }
    g.strokeStyle = "rgba(160,40,40,0.55)";
    g.lineWidth = 6;
    g.strokeRect(10, 10, w - 20, h - 20);
  }, rep);

/** Batik-like repeat for the grandmother's kebaya and sarong. */
export const batikTex = (key: string, base: string, ink: string, rep: [number, number]) =>
  canvasTex(`batik${key}`, 256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = ink;
    g.fillStyle = ink;
    g.lineWidth = 3;
    for (let y = 0; y <= h; y += 64)
      for (let x = 0; x <= w; x += 64) {
        const ox = (y / 64) % 2 ? 32 : 0;
        g.beginPath();
        g.arc(x + ox, y, 18, 0, Math.PI * 2);
        g.stroke();
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2 + Math.PI / 4;
          g.beginPath();
          g.ellipse(x + ox + Math.cos(a) * 18, y + Math.sin(a) * 18, 9, 4, a, 0, Math.PI * 2);
          g.fill();
        }
        g.beginPath();
        g.arc(x + ox, y, 5, 0, Math.PI * 2);
        g.fill();
      }
  }, rep);

/** Stripes for the child's t-shirt. */
export const stripeTex = (rep: [number, number]) =>
  canvasTex(`stripe${rep}`, 64, 64, (g, w, h) => {
    g.fillStyle = "#e9e2d2";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#3f6f8f";
    g.fillRect(0, 0, w, 22);
  }, rep);

/** Eye: equirectangular sphere texture with the iris centred on +Z (u = 0.25, v = 0.5). Limbal ring,
 *  radial fibres and crypts, a soft collarette, sclera that greys toward the back with faint veins. */
export const eyeTex = (key: string, iris: string) =>
  canvasTex(`eye${key}`, 1024, 512, (g, w, h) => {
    const r = mulberry32(17);
    const sc = g.createLinearGradient(0, 0, w, 0);
    sc.addColorStop(0, "#b8ada3");
    sc.addColorStop(0.25, "#d9d0c6");
    sc.addColorStop(0.5, "#b2a79c");
    sc.addColorStop(0.75, "#9e9389");
    sc.addColorStop(1, "#b8ada3");
    g.fillStyle = sc;
    g.fillRect(0, 0, w, h);
    const cx = w * 0.25, cy = h * 0.5;
    const rx = w * 0.088, ry = h * 0.178;
    // veins toward the corners
    g.strokeStyle = "rgba(170,70,60,0.10)";
    for (let k = 0; k < 22; k++) {
      g.lineWidth = 0.6 + r() * 1.1;
      const a = r() * Math.PI * 2;
      let x = cx + Math.cos(a) * rx * 3.2, y = cy + Math.sin(a) * ry * 2.4;
      g.beginPath();
      g.moveTo(x, y);
      for (let s2 = 0; s2 < 6; s2++) {
        x += (cx - x) * 0.12 + (r() - 0.5) * 14;
        y += (cy - y) * 0.12 + (r() - 0.5) * 10;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rx);
    gr.addColorStop(0, shade(iris, 1.25));
    gr.addColorStop(0.42, shade(iris, 1.55));
    gr.addColorStop(0.62, iris);
    gr.addColorStop(0.88, shade(iris, 0.62));
    gr.addColorStop(1, "#140d08");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
    // fibres and crypts
    for (let k = 0; k < 220; k++) {
      const a = r() * Math.PI * 2, r0 = 0.36 + r() * 0.1, r1 = 0.7 + r() * 0.25;
      g.strokeStyle = r() > 0.5 ? `rgba(255,214,160,${0.06 + r() * 0.1})` : `rgba(20,10,4,${0.08 + r() * 0.12})`;
      g.lineWidth = 0.7 + r() * 1.3;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * rx * r0, cy + Math.sin(a) * ry * r0);
      g.lineTo(cx + Math.cos(a + (r() - 0.5) * 0.08) * rx * r1, cy + Math.sin(a + (r() - 0.5) * 0.08) * ry * r1);
      g.stroke();
    }
    g.strokeStyle = "rgba(255,200,140,0.18)";
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(cx, cy, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#050302";
    g.beginPath();
    g.ellipse(cx, cy, rx * 0.36, ry * 0.36, 0, 0, Math.PI * 2);
    g.fill();
  });

/** Phone lock screen: 02:00. */
export const phoneTex = () =>
  canvasTex("phone", 256, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#1b3a5c");
    gr.addColorStop(0.6, "#0f2238");
    gr.addColorStop(1, "#2a1f3d");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#eaf4ff";
    g.textAlign = "center";
    g.font = "500 22px Manrope, sans-serif";
    g.fillText("Sabtu, 1 November", w / 2, 92);
    g.font = "300 92px Manrope, sans-serif";
    g.fillText("02:00", w / 2, 180);
    g.fillStyle = "rgba(255,255,255,0.16)";
    g.beginPath();
    g.roundRect(28, 380, w - 56, 54, 14);
    g.fill();
    g.fillStyle = "#eaf4ff";
    g.font = "500 15px Manrope, sans-serif";
    g.textAlign = "left";
    g.fillText("Baterai 9% · Sambungkan pengisi daya", 44, 412);
  });

/** Wall clock face. */
export const clockTex = () =>
  canvasTex("clock", 256, 256, (g, w, h) => {
    g.fillStyle = "#f1ede4";
    g.fillRect(0, 0, w, h);
    g.translate(w / 2, h / 2);
    g.fillStyle = "#2a2a2a";
    for (let i = 0; i < 12; i++) {
      g.save();
      g.rotate((i / 12) * Math.PI * 2);
      g.fillRect(-3, -112, 6, i % 3 ? 14 : 26);
      g.restore();
    }
  });

/** Woven bamboo wall (gedek / anyaman bambu). */
export const bambooTex = (rep: [number, number]) =>
  canvasTex(`bamboo${rep}`, 256, 256, (g, w, h) => {
    const r = mulberry32(13);
    g.fillStyle = "#cdb38a";
    g.fillRect(0, 0, w, h);
    const s = 32;
    for (let y = 0; y < h; y += s)
      for (let x = 0; x < w; x += s) {
        const diag = ((x + y) / s) % 2 === 0;
        g.fillStyle = shade(diag ? "#d2b98f" : "#c6aa7f", 0.95 + r() * 0.08);
        g.fillRect(x + 1, y + 1, s - 2, s - 2);
        g.strokeStyle = "rgba(110,80,40,0.22)";
        g.lineWidth = 1.2;
        for (let k = 5; k < s - 3; k += 6) {
          g.beginPath();
          if (diag) { g.moveTo(x + 2, y + k); g.lineTo(x + s - 2, y + k); } else { g.moveTo(x + k, y + 2); g.lineTo(x + k, y + s - 2); }
          g.stroke();
        }
      }
  }, rep);

/** Wall calendar page. */
export const calendarTex = () =>
  canvasTex("calendar", 256, 360, (g, w, h) => {
    g.fillStyle = "#f2ece0";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#b8463a";
    g.fillRect(0, 0, w, 120);
    g.fillStyle = "#f8efe0";
    g.font = "600 34px Manrope, sans-serif";
    g.textAlign = "center";
    g.fillText("2009", w / 2, 75);
    g.fillStyle = "#3a3330";
    g.font = "500 15px Manrope, sans-serif";
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) g.fillText(String(r * 7 + c + 1), 22 + c * 35, 160 + r * 40);
  });

/** Sheer curtain with soft vertical folds (alpha + brightness), lit from behind by the moon. */
export const sheerTex = () =>
  canvasTex("sheer", 256, 256, (g, w, h) => {
    for (let x = 0; x < w; x++) {
      const f = 0.62 + 0.22 * Math.sin(x * 0.11) + 0.12 * Math.sin(x * 0.37 + 1) + 0.05 * Math.sin(x * 0.9);
      const v = Math.round(255 * Math.min(1, f));
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(x, 0, 1, h);
    }
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "rgba(0,0,0,0.25)");
    gr.addColorStop(0.5, "rgba(0,0,0,0)");
    gr.addColorStop(1, "rgba(0,0,0,0.35)");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
