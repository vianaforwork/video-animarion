// Additive "light" materials for the neural world: fresnel glow shells, soft point sprites, 3D noise.

import { AdditiveBlending, CanvasTexture, Color, DoubleSide, PointsMaterial, ShaderMaterial, type Side } from "three";

const h3 = (x: number, y: number, z: number) => {
  let n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
const sm = (t: number) => t * t * (3 - 2 * t);
/** Smooth 3D value noise in 0..1. */
export const noise3 = (x: number, y: number, z: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => h3(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
};

export type GlowOpts = { color: string; rim?: number; core?: number; power?: number; side?: Side; opacity?: number };

/** Fresnel glow (additive): bright silhouettes, faint faces. Uniform `uOpacity` fades it. */
export const glowMat = (o: GlowOpts) =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: o.side ?? DoubleSide,
    fog: false,
    uniforms: {
      uColor: { value: new Color(o.color) },
      uRim: { value: o.rim ?? 1.0 },
      uCore: { value: o.core ?? 0.15 },
      uPow: { value: o.power ?? 2.0 },
      uOpacity: { value: o.opacity ?? 1 },
    },
    vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uRim; uniform float uCore; uniform float uPow; uniform float uOpacity;
      varying vec3 vN; varying vec3 vV;
      void main(){ float f = clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
        float g = uCore + uRim * pow(f, uPow);
        gl_FragColor = vec4(uColor * g * uOpacity, 1.0); }`,
  });

let sprite: CanvasTexture | null = null;
/** Soft round sprite for points (never square). */
export const spriteTex = () => {
  if (sprite) return sprite;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.25, "rgba(255,255,255,0.55)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  sprite = new CanvasTexture(c);
  return sprite;
};

export const pointsMat = (size: number, opacity = 1) =>
  new PointsMaterial({
    size, map: spriteTex(), vertexColors: true, transparent: true, opacity, depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true, fog: false,
  });

export const CYAN = "#5fe3ff";
export const ORANGE = "#ff9a3d";
export const BLUE = "#2f7bff";
