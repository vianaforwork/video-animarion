// Open sea: a graded grid (dense near `center`, coarse to the horizon) displaced every frame by a sum of
// Gerstner waves — a pure function of time, so any frame renders the same. Fine ripples come from a
// scrolling procedural normal map, which also makes the moon/sun glitter path. `waveHeight` exposes the
// same surface for boats, floating lights and sound.

import React, { useMemo } from "react";
import { BufferAttribute, BufferGeometry, CanvasTexture, RepeatWrapping, Sphere, Vector2, Vector3 } from "three";
import { expAxis } from "../../kits/worldforge/heightfield.ts";
import { mulberry32 } from "../../kits/worldforge/noise.ts";
import { phys } from "../mats.ts";

const G = 9.81;
type Wave = { dx: number; dz: number; k: number; w: number; A: number; ph: number };
const WAVES: Wave[] = [
  [0.3, 62, 0.42, 0.0], [-0.5, 33, 0.24, 1.3], [0.9, 18, 0.13, 2.1], [-1.2, 9.5, 0.07, 0.4], [0.1, 5.2, 0.035, 3.3], [1.7, 2.7, 0.016, 5.1],
].map(([a, L, A, ph]) => {
  const k = (Math.PI * 2) / L;
  return { dx: Math.sin(a - Math.PI), dz: Math.cos(a - Math.PI), k, w: Math.sqrt(G * k), A, ph };
});
const Q = 0.55; // crest sharpness

/** Height of the sea surface at (x, z) and time t (amp scales every wave). */
export const waveHeight = (x: number, z: number, t: number, amp = 1) => {
  let y = 0;
  for (const v of WAVES) y += amp * v.A * Math.sin(v.k * (v.dx * x + v.dz * z) - v.w * t + v.ph);
  return y;
};
/** Surface slope (for boats to pitch/roll with the swell). */
export const waveSlope = (x: number, z: number, t: number, amp = 1): [number, number] => {
  let sx = 0, sz = 0;
  for (const v of WAVES) {
    const c = amp * v.A * v.k * Math.cos(v.k * (v.dx * x + v.dz * z) - v.w * t + v.ph);
    sx += c * v.dx; sz += c * v.dz;
  }
  return [sx, sz];
};

const rippleTex = () => {
  const n = 256, c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d")!;
  const r = mulberry32(17);
  const h = new Float32Array(n * n);
  for (let o = 0; o < 4; o++) {
    const cells = 4 << o, amp = 1 / (1 + o * 1.4), grid = Array.from({ length: cells * cells }, () => r());
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const fx = (x / n) * cells, fy = (y / n) * cells, ix = Math.floor(fx), iy = Math.floor(fy);
      const ux = fx - ix, uy = fy - iy, sx = ux * ux * (3 - 2 * ux), sy = uy * uy * (3 - 2 * uy);
      const at = (i: number, j: number) => grid[((j % cells) * cells + (i % cells))];
      h[y * n + x] += amp * ((at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx) * (1 - sy) + (at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx) * sy);
    }
  }
  const img = g.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const hx = h[y * n + ((x + 1) % n)] - h[y * n + ((x + n - 1) % n)], hy = h[((y + 1) % n) * n + x] - h[((y + n - 1) % n) * n + x];
    const v = new Vector3(-hx * 6, -hy * 6, 1).normalize(), i = (y * n + x) * 4;
    img.data[i] = (v.x * 0.5 + 0.5) * 255; img.data[i + 1] = (v.y * 0.5 + 0.5) * 255; img.data[i + 2] = (v.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(220, 220);
  return t;
};

let ripple: CanvasTexture | null = null;

export const Ocean: React.FC<{ t: number; amp?: number; color?: string; size?: number; level?: number }> = ({ t, amp = 1, color = "#0a1824", size = 900, level = 0 }) => {
  const geo = useMemo(() => {
    const ax = expAxis(-size, size, 0.7, 0.032), az = expAxis(-size, size, 0.7, 0.032);
    const nx = ax.n, nz = az.n;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(nx * nz * 3), 3));
    g.setAttribute("normal", new BufferAttribute(new Float32Array(nx * nz * 3), 3));
    const uv = new Float32Array(nx * nz * 2);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { uv[(j * nx + i) * 2] = (ax.coord[i] + size) / (2 * size); uv[(j * nx + i) * 2 + 1] = (az.coord[j] + size) / (2 * size); }
    g.setAttribute("uv", new BufferAttribute(uv, 2));
    const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
    let n = 0;
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d;
    }
    g.setIndex(new BufferAttribute(idx, 1));
    g.boundingSphere = new Sphere(new Vector3(0, 0, 0), size * 1.5);
    return { g, ax, az };
  }, [size]);
  useMemo(() => {
    const { g, ax, az } = geo;
    const P = g.attributes.position.array as Float32Array, N = g.attributes.normal.array as Float32Array;
    const nx = ax.n;
    for (let j = 0; j < az.n; j++) {
      const z0 = az.coord[j];
      for (let i = 0; i < nx; i++) {
        const x0 = ax.coord[i];
        // waves shorter than ~3 grid cells alias at the horizon: fade them with distance
        const cell = 0.7 + 0.032 * Math.max(Math.abs(x0), Math.abs(z0));
        let x = x0, y = 0, z = z0, nX = 0, nY = 1, nZ = 0;
        for (const v of WAVES) {
          const keep = Math.min(1, Math.max(0, ((2 * Math.PI) / v.k / cell - 3) / 3));
          if (keep <= 0) continue;
          const A = amp * v.A * keep, th = v.k * (v.dx * x0 + v.dz * z0) - v.w * t + v.ph, s = Math.sin(th), c = Math.cos(th);
          x += Q * A * v.dx * c; z += Q * A * v.dz * c; y += A * s;
          nX -= v.dx * v.k * A * c; nZ -= v.dz * v.k * A * c; nY -= Q * v.k * A * s;
        }
        const k = (j * nx + i) * 3, l = Math.hypot(nX, nY, nZ);
        P[k] = x; P[k + 1] = level + y; P[k + 2] = z;
        N[k] = nX / l; N[k + 1] = nY / l; N[k + 2] = nZ / l;
      }
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
  }, [geo, t, amp, level]);
  if (!ripple) ripple = rippleTex();
  ripple.offset.set((t * 0.011) % 1, (t * 0.0067) % 1);
  const m = phys(`ocean${color}`, { color, roughness: 0.3, metalness: 0, ior: 1.33, specularIntensity: 0.32, normalMap: ripple, normalScale: new Vector2(0.5, 0.5), envMapIntensity: 0.6 });
  return <mesh geometry={geo.g} material={m} receiveShadow frustumCulled={false} />;
};
