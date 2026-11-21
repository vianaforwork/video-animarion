// The neural world (a metaphor, not a scan): a glass brain with sulci, a neuron network carrying
// signals, hero neurons for macro shots, the optic-fibre tunnel, the prediction core with its two
// streams (information = cyan, experience = orange), the pareidolia point cloud and the socket face.
// Brain-local units: the cerebrum spans z −1…1.

import React, { useLayoutEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Points,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FX_LAYER } from "../../core/render/Post.tsx";
import { ease, remap } from "../../core/motion/easing.ts";
import { cached, cyl, sphere, torus, box } from "../../kits/worldforge/geo.ts";
import { mulberry32 } from "../../kits/worldforge/noise.ts";
import { canvasTex, phys } from "../mats.ts";
import { planeG } from "./plane.ts";
import { HUMAN, resample, inside, type Poly } from "./silhouettes.ts";
import { BLUE, CYAN, glowMat, noise3, ORANGE, pointsMat } from "./glow.ts";

const fx = (o: { layers: { set: (n: number) => void } } | null) => o?.layers.set(FX_LAYER);

// ── brain shell ─────────────────────────────────────────────────────────────

const ridged = (x: number, y: number, z: number) => {
  const wx = x + 0.6 * noise3(x * 0.7 + 3, y * 0.7, z * 0.7);
  const wz = z + 0.6 * noise3(x * 0.7, y * 0.7 + 5, z * 0.7);
  const a = 1 - Math.abs(2 * noise3(wx, y, wz) - 1);
  const b = 1 - Math.abs(2 * noise3(wx * 2.1 + 9, y * 2.1, wz * 2.1) - 1);
  return Math.pow(a, 1.6) * 0.72 + b * 0.28;
};

export const brainGeo = () =>
  cached("brainShell", () => {
    let g: BufferGeometry = new IcosahedronGeometry(1, 6);
    g.deleteAttribute("normal");
    g.deleteAttribute("uv");
    g = mergeVertices(g);
    const a = g.attributes.position;
    const fold = new Float32Array(a.count);
    for (let i = 0; i < a.count; i++) {
      const v = new Vector3(a.getX(i), a.getY(i), a.getZ(i));
      const p = new Vector3(v.x * 0.8, v.y * 0.68, v.z * 1.0);
      // longitudinal fissure between the hemispheres
      const fis = Math.exp(-((v.x / 0.09) ** 2)) * Math.min(1, Math.max(0, (v.y + 0.25) * 1.6));
      p.y -= 0.1 * fis;
      p.x *= 1 + 0.04 * fis;
      // flatter base, temporal lobes, narrower occipital
      if (p.y < -0.2) p.y = -0.2 + (p.y + 0.2) * 0.55;
      const temp = Math.exp(-(((Math.abs(v.x) - 0.85) / 0.25) ** 2) - ((v.y + 0.35) / 0.3) ** 2 - ((v.z - 0.15) / 0.45) ** 2);
      p.x += Math.sign(v.x) * 0.06 * temp;
      p.y -= 0.05 * temp;
      if (v.z < -0.3) p.x *= 1 - 0.1 * (-0.3 - v.z);
      const f = ridged(v.x * 4.2, v.y * 4.2, v.z * 4.2);
      fold[i] = f;
      const n = p.clone().normalize();
      p.addScaledVector(n, (f - 0.55) * 0.055 * (1 - 0.7 * fis));
      a.setXYZ(i, p.x, p.y, p.z);
    }
    g.setAttribute("fold", new Float32BufferAttribute(fold, 1));
    g.computeVertexNormals();
    return g;
  });

const cerebellumGeo = () =>
  cached("cerebellum", () => {
    let g: BufferGeometry = new IcosahedronGeometry(1, 4);
    g.deleteAttribute("normal");
    g.deleteAttribute("uv");
    g = mergeVertices(g);
    const a = g.attributes.position;
    const fold = new Float32Array(a.count);
    for (let i = 0; i < a.count; i++) {
      const v = new Vector3(a.getX(i), a.getY(i), a.getZ(i));
      const f = 0.5 + 0.5 * Math.sin(v.y * 34 + v.z * 6);
      fold[i] = f;
      const p = new Vector3(v.x * 0.5, v.y * 0.24, v.z * 0.3).addScaledVector(v, (f - 0.5) * 0.015);
      a.setXYZ(i, p.x, p.y, p.z);
    }
    g.setAttribute("fold", new Float32BufferAttribute(fold, 1));
    g.computeVertexNormals();
    return g;
  });

const shellMat = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: false,
    uniforms: {
      uCyan: { value: new Color(CYAN) },
      uOrange: { value: new Color(ORANGE) },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uOrangeAmt: { value: 1 },
    },
    vertexShader: /* glsl */ `attribute float fold; varying vec3 vN; varying vec3 vV; varying float vFold; varying vec3 vP;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vFold = fold; vP = position; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform vec3 uCyan; uniform vec3 uOrange; uniform float uTime; uniform float uOpacity; uniform float uOrangeAmt;
      varying vec3 vN; varying vec3 vV; varying float vFold; varying vec3 vP;
      void main(){
        float f = clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
        float rim = f * f;
        float sulc = 1.0 - smoothstep(0.08, 0.42, vFold);
        float crest = smoothstep(0.72, 1.0, vFold);
        vec3 c = uCyan * (0.02 + 0.5 * rim + 0.1 * crest) + vec3(0.2, 0.5, 1.0) * 0.025;
        float wave = sin(vP.z * 6.0 - uTime * 2.2 + sin(vP.x * 5.0 + vP.y * 3.0) * 1.7);
        c += uOrange * smoothstep(0.86, 1.0, wave) * sulc * uOrangeAmt * 1.2;
        c += uCyan * sulc * 0.06;
        gl_FragColor = vec4(c * uOpacity, 1.0);
      }`,
  });

export const BrainShell: React.FC<{ t: number; opacity?: number; orange?: number }> = ({ t, opacity = 1, orange = 1 }) => {
  const m = useMemo(shellMat, []);
  const m2 = useMemo(shellMat, []);
  m.uniforms.uTime.value = t;
  m.uniforms.uOpacity.value = opacity;
  m.uniforms.uOrangeAmt.value = orange;
  m2.uniforms.uTime.value = t + 3;
  m2.uniforms.uOpacity.value = opacity * 0.8;
  m2.uniforms.uOrangeAmt.value = orange * 0.5;
  const stem = useMemo(() => glowMat({ color: CYAN, rim: 0.8, core: 0.05 }), []);
  (stem.uniforms.uOpacity as { value: number }).value = opacity;
  return (
    <group>
      <mesh geometry={brainGeo()} material={m} ref={fx} renderOrder={5} />
      <mesh geometry={cerebellumGeo()} material={m2} position={[0, -0.36, -0.72]} ref={fx} renderOrder={5} />
      <mesh geometry={cyl(0.1, 0.07, 0.55, 20, true)} material={stem} position={[0, -0.55, -0.35]} rotation={[0.35, 0, 0]} ref={fx} renderOrder={5} />
    </group>
  );
};

// ── neuron network ──────────────────────────────────────────────────────────

export type Net = { pts: Vector3[]; edges: [number, number][] };
export const makeNet = (seed: number, n: number, accept: (p: Vector3) => boolean, rng: () => Vector3, k = 2): Net => {
  const r = mulberry32(seed);
  const pts: Vector3[] = [];
  let guard = 0;
  while (pts.length < n && guard++ < n * 50) {
    const p = rng();
    if (accept(p)) pts.push(p);
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const d = pts.map((q, j) => [q.distanceToSquared(pts[i]), j] as const).sort((a, b) => a[0] - b[0]);
    for (let m = 1; m <= k; m++) if (d[m] && (r() < 0.9 || m === 1)) edges.push([i, d[m][1]]);
  }
  return { pts, edges };
};

const inBrain = (p: Vector3) => (p.x / 0.74) ** 2 + ((p.y + 0.03) / 0.58) ** 2 + (p.z / 0.93) ** 2 < 1 && p.y > -0.42;

export const brainNet = (n = 760) =>
  cached(`brainNet${n}`, () => {
    const r = mulberry32(17);
    const net = makeNet(9, n, inBrain, () => new Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1));
    const g = new BufferGeometry();
    g.userData.net = net;
    return g;
  });

/** Somas + connections + travelling signals. `pulse` scales signal traffic, `tint` 0 cyan … 1 orange share. */
export const Network: React.FC<{ net: Net; t: number; opacity?: number; pulse?: number; orangeShare?: number; size?: number; seed?: number }> = ({ net, t, opacity = 1, pulse = 1, orangeShare = 0.25, size = 0.028, seed = 1 }) => {
  const objs = useMemo(() => {
    const somaG = new BufferGeometry();
    const sp: number[] = [], sc: number[] = [];
    const r = mulberry32(seed);
    const cy = new Color(CYAN), bl = new Color(BLUE), or = new Color(ORANGE);
    for (const p of net.pts) {
      sp.push(p.x, p.y, p.z);
      const c = r() < 0.12 ? or.clone() : cy.clone().lerp(bl, r() * 0.6);
      c.multiplyScalar(0.6 + r() * 0.6);
      sc.push(c.r, c.g, c.b);
    }
    somaG.setAttribute("position", new Float32BufferAttribute(sp, 3));
    somaG.setAttribute("color", new Float32BufferAttribute(sc, 3));
    const lineG = new BufferGeometry();
    const lp: number[] = [], lc: number[] = [];
    for (const [a, b] of net.edges) {
      const A = net.pts[a], B = net.pts[b];
      lp.push(A.x, A.y, A.z, B.x, B.y, B.z);
      const k = 0.25 + r() * 0.35;
      lc.push(0.25 * k, 0.75 * k, 1.0 * k, 0.25 * k, 0.75 * k, 1.0 * k);
    }
    lineG.setAttribute("position", new Float32BufferAttribute(lp, 3));
    lineG.setAttribute("color", new Float32BufferAttribute(lc, 3));
    const lineM = new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false, fog: false });
    const P = 260;
    const pulses = Array.from({ length: P }, () => ({ e: Math.floor(r() * net.edges.length), sp: 0.4 + r() * 1.1, ph: r(), orange: r() }));
    const pulseG = new BufferGeometry();
    pulseG.setAttribute("position", new Float32BufferAttribute(new Float32Array(P * 3), 3));
    pulseG.setAttribute("color", new Float32BufferAttribute(new Float32Array(P * 3), 3));
    return { somaG, lineG, lineM, pulses, pulseG, somaM: pointsMat(size * 2.2), pulseM: pointsMat(size * 2.6) };
  }, [net, seed, size]);
  useLayoutEffect(() => {
    const pos = objs.pulseG.attributes.position as Float32BufferAttribute;
    const col = objs.pulseG.attributes.color as Float32BufferAttribute;
    const cy = new Color(CYAN), or = new Color(ORANGE);
    objs.pulses.forEach((q, i) => {
      const u = (t * q.sp + q.ph) % 1;
      const [a, b] = net.edges[(q.e + Math.floor(t * q.sp + q.ph) * 7) % net.edges.length];
      const A = net.pts[a], B = net.pts[b];
      pos.setXYZ(i, A.x + (B.x - A.x) * u, A.y + (B.y - A.y) * u, A.z + (B.z - A.z) * u);
      const c = q.orange < orangeShare ? or : cy;
      const k = Math.sin(u * Math.PI) * pulse * 1.6;
      col.setXYZ(i, c.r * k, c.g * k, c.b * k);
    });
    pos.needsUpdate = true;
    col.needsUpdate = true;
    objs.somaM.opacity = opacity;
    objs.pulseM.opacity = opacity;
    objs.lineM.opacity = 0.45 * opacity;
  });
  return (
    <group>
      <lineSegments geometry={objs.lineG} material={objs.lineM} ref={fx} renderOrder={4} />
      <points geometry={objs.somaG} material={objs.somaM} ref={fx} renderOrder={6} />
      <points geometry={objs.pulseG} material={objs.pulseM} ref={fx} renderOrder={7} frustumCulled={false} />
    </group>
  );
};

// ── hero neurons (macro) ───────────────────────────────────────────────────

const neuronGeo = (seed: number) =>
  cached(`neuron${seed}`, () => {
    const r = mulberry32(seed);
    const tubes: BufferGeometry[] = [];
    const branch = (o: Vector3, dir: Vector3, len: number, rad: number, depth: number) => {
      const pts = [o.clone()];
      let p = o.clone(), d = dir.clone();
      for (let i = 0; i < 5; i++) {
        d.add(new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.7)).normalize();
        p = p.clone().addScaledVector(d, len / 5);
        pts.push(p);
      }
      const curve = new CatmullRomCurve3(pts);
      const tg = new TubeGeometry(curve, 24, rad, 6, false);
      // taper
      const a = tg.attributes.position;
      for (let i = 0; i < a.count; i++) {
        const seg = Math.floor(i / 7) / 24;
        const c = curve.getPoint(Math.min(1, seg));
        const v = new Vector3(a.getX(i), a.getY(i), a.getZ(i)).sub(c).multiplyScalar(1 - 0.7 * seg).add(c);
        a.setXYZ(i, v.x, v.y, v.z);
      }
      tubes.push(tg);
      if (depth > 0) for (let k = 0; k < 2; k++) branch(p, d.clone().add(new Vector3(r() - 0.5, r() - 0.5, r() - 0.5)).normalize(), len * 0.62, rad * 0.6, depth - 1);
    };
    for (let k = 0; k < 6; k++) {
      const d = new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      branch(d.clone().multiplyScalar(0.12), d, 0.55 + r() * 0.3, 0.03, 2);
    }
    branch(new Vector3(0, -0.1, 0), new Vector3(0.2, -1, 0.3).normalize(), 1.6, 0.035, 0);
    const parts = tubes.map((g) => { g.deleteAttribute("uv"); return g.index ? g.toNonIndexed() : g; });
    const merged = new BufferGeometry();
    let total = 0;
    for (const p of parts) total += p.attributes.position.count;
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3);
    let off = 0;
    for (const p of parts) {
      pos.set(p.attributes.position.array as Float32Array, off * 3);
      nor.set(p.attributes.normal.array as Float32Array, off * 3);
      off += p.attributes.position.count;
    }
    merged.setAttribute("position", new Float32BufferAttribute(pos, 3));
    merged.setAttribute("normal", new Float32BufferAttribute(nor, 3));
    return merged;
  });

export const HeroNeuron: React.FC<{ seed: number; p: [number, number, number]; s: number; color?: string; t: number; opacity?: number }> = ({ seed, p, s, color = CYAN, t, opacity = 1 }) => {
  const m = useMemo(() => glowMat({ color, rim: 0.9, core: 0.1, power: 1.6 }), [color]);
  const soma = useMemo(() => glowMat({ color: "#ffffff", rim: 0.8, core: 0.35, power: 1.4 }), []);
  const halo = useMemo(() => glowMat({ color, rim: 0.0, core: 0.2, power: 1 }), [color]);
  const beat = 0.75 + 0.25 * Math.sin(t * 2.4 + seed);
  (m.uniforms.uOpacity as { value: number }).value = opacity;
  (soma.uniforms.uOpacity as { value: number }).value = opacity * beat;
  (halo.uniforms.uOpacity as { value: number }).value = opacity * 0.25 * beat;
  return (
    <group position={p} scale={s}>
      <mesh geometry={neuronGeo(seed)} material={m} ref={fx} renderOrder={6} />
      <mesh geometry={sphere(0.13, 24, 16)} material={soma} ref={fx} renderOrder={7} />
      <mesh geometry={sphere(0.3, 24, 16)} material={halo} ref={fx} renderOrder={7} />
    </group>
  );
};

// ── optic tunnel ───────────────────────────────────────────────────────────

const tunnelGeo = () =>
  cached("tunnel", () => {
    const r = mulberry32(31);
    const pos: number[] = [], col: number[] = [];
    for (let f = 0; f < 220; f++) {
      const r0 = 0.18 + r() * 0.32, a0 = r() * Math.PI * 2, tw = 0.6 + r() * 0.6;
      const k = 0.4 + r() * 0.6;
      let prev: Vector3 | null = null;
      for (let i = 0; i <= 60; i++) {
        const z = 1.4 + (i / 60) * 5.5;
        const rr = r0 * (0.65 + 0.35 * Math.min(1, (z - 1.4) / 2.5));
        const a = a0 + z * tw;
        const p = new Vector3(Math.cos(a) * rr, Math.sin(a) * rr, z);
        if (prev) {
          pos.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
          const c = r() < 0.15 ? [1, 0.6, 0.24] : [0.37, 0.89, 1];
          col.push(c[0] * k, c[1] * k, c[2] * k, c[0] * k, c[1] * k, c[2] * k);
        }
        prev = p;
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new Float32BufferAttribute(col, 3));
    return g;
  });

const OpticTunnel: React.FC<{ t: number; opacity: number }> = ({ t, opacity }) => {
  const m = useMemo(() => new LineBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false }), []);
  m.opacity = opacity;
  const streaks = useMemo(() => {
    const r = mulberry32(5);
    const g = new BufferGeometry();
    const n = 300;
    g.setAttribute("position", new Float32BufferAttribute(new Float32Array(n * 3), 3));
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const o = r() < 0.2; c.set(o ? [1, 0.6, 0.25] : [0.5, 0.92, 1], i * 3); }
    g.setAttribute("color", new Float32BufferAttribute(c, 3));
    return { g, seeds: Array.from({ length: n }, () => [r() * Math.PI * 2, 0.05 + r() * 0.45, r(), 0.6 + r()]), m: pointsMat(0.035) };
  }, []);
  useLayoutEffect(() => {
    const a = streaks.g.attributes.position as Float32BufferAttribute;
    streaks.seeds.forEach(([ang, rr, ph, sp], i) => {
      const z = 6.9 - (((t * sp * 2.2 + ph) % 1) * 5.5);
      a.setXYZ(i, Math.cos(ang + z) * rr, Math.sin(ang + z) * rr, z);
    });
    a.needsUpdate = true;
    streaks.m.opacity = opacity;
  });
  return (
    <group>
      <lineSegments geometry={tunnelGeo()} material={m} ref={fx} renderOrder={4} />
      <points geometry={streaks.g} material={streaks.m} ref={fx} frustumCulled={false} renderOrder={6} />
    </group>
  );
};

// ── photo card (the "camera" idea that the brain does not follow) ──────────

const photoTex = () =>
  canvasTex("photo", 512, 640, (g, w, h) => {
    g.fillStyle = "#a9a396";
    g.fillRect(0, 0, w, h);
    const x0 = 28, y0 = 28, W = w - 56, H = h - 150;
    const gr = g.createLinearGradient(0, y0, 0, y0 + H);
    gr.addColorStop(0, "#152034");
    gr.addColorStop(1, "#0a0f18");
    g.fillStyle = gr;
    g.fillRect(x0, y0, W, H);
    g.strokeStyle = "rgba(120,150,200,0.35)";
    g.lineWidth = 2;
    const vx = x0 + W * 0.55, vy = y0 + H * 0.45;
    for (const [ax, ay] of [[x0, y0], [x0 + W, y0], [x0, y0 + H], [x0 + W, y0 + H]]) { g.beginPath(); g.moveTo(ax, ay); g.lineTo(vx + (ax - vx) * 0.2, vy + (ay - vy) * 0.2); g.stroke(); }
    g.fillStyle = "#7d9fd8";
    g.fillRect(vx - 40, vy - 70, 80, 95);
    g.fillStyle = "#04060a";
    g.beginPath(); g.arc(vx, vy - 52, 13, 0, Math.PI * 2); g.fill();
    g.fillRect(vx - 22, vy - 38, 44, 92);
    g.fillRect(vx - 12, vy + 54, 9, 22); g.fillRect(vx + 3, vy + 54, 9, 22);
    g.fillStyle = "#3a3f47";
    g.font = "600 30px Manrope, sans-serif";
    g.textAlign = "center";
    g.fillText("02:01", w / 2, h - 62);
  });

// ── pareidolia point cloud ─────────────────────────────────────────────────

/** The coat stand as the eye actually received it: helmet, coat, sleeves, tote, pole, boots. */
const standPoints = () =>
  cached("standPts", () => {
    const r = mulberry32(77);
    const inStand = (x: number, y: number) =>
      Math.hypot(x - 0.0, y - 0.9) < 0.085 ||
      (y > 0.32 && y < 0.82 && Math.abs(x) < 0.17 + (0.82 - y) * 0.05 && !(y > 0.78 && Math.abs(x) > 0.12)) ||
      (y > 0.48 && y < 0.8 && Math.abs(Math.abs(x) - 0.2) < 0.035) ||
      (x < -0.18 && x > -0.27 && y > 0.4 && y < 0.62) ||
      (Math.abs(x) < 0.012 && y > 0.12 && y < 0.34) ||
      (y < 0.13 && Math.abs(Math.abs(x) - 0.05) < 0.035);
    const pos: number[] = [], col: number[] = [], home: number[] = [];
    while (pos.length < 2200 * 3) {
      const x = r() - 0.5, y = r() * 1.02;
      if (!inStand(x, y)) continue;
      const z = (r() - 0.5) * 0.12;
      pos.push(x, y, z);
      home.push(x, y, z);
      const k = 0.9 + r() * 0.8;
      col.push(1.0 * k, 0.95 * k, 0.85 * k);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new Float32BufferAttribute(col, 3));
    g.userData.home = home;
    return g;
  });

const lineFrom = (poly: Poly, z = 0.02) => {
  const g = new BufferGeometry();
  const pts = resample(poly, 220);
  g.setAttribute("position", new Float32BufferAttribute(pts.flatMap(([x, y]) => [x, y, z]), 3));
  return g;
};

export const PatternCloud: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  const pts = standPoints();
  const m = useMemo(() => pointsMat(0.026), []);
  const lineG = useMemo(() => lineFrom(HUMAN), []);
  const lineM = useMemo(() => new LineBasicMaterial({ color: ORANGE, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false }), []);
  const glowG = useMemo(() => {
    const g = new BufferGeometry();
    const p = resample(HUMAN, 90);
    g.setAttribute("position", new Float32BufferAttribute(p.flatMap(([x, y]) => [x, y, 0.02]), 3));
    g.setAttribute("color", new Float32BufferAttribute(p.flatMap(() => [1, 0.55, 0.2]), 3));
    return g;
  }, []);
  const glowM = useMemo(() => pointsMat(0.03), []);
  const u = t - t0;
  // points flicker into view blurry (0..1.2), the outline is drawn (2.7..3.4), holds, then flickers out (4.4..5.2)
  const appear = ease.out(remap(u, 0, 1.2));
  const draw = ease.inOut(remap(u, 2.6, 3.5));
  const flick = u > 4.35 && u < 4.75 ? (Math.floor(u * 22) % 2 ? 0.25 : 1) : 1;
  const out = 1 - ease.inOut(remap(u, 4.7, 5.25));
  useLayoutEffect(() => {
    const a = pts.attributes.position as Float32BufferAttribute;
    const home = pts.userData.home as number[];
    const jit = 0.06 * (1 - ease.out(remap(u, 0, 2.4)));
    for (let i = 0; i < a.count; i++) {
      const s = Math.sin(i * 12.9898 + t * 3.1) * 0.5;
      a.setXYZ(i, home[i * 3] + s * jit, home[i * 3 + 1] + Math.cos(i * 4.1 + t * 2.3) * 0.5 * jit, home[i * 3 + 2]);
    }
    a.needsUpdate = true;
    m.opacity = appear * (0.75 + 0.25 * Math.sin(t * 9));
    lineG.setDrawRange(0, Math.floor(220 * draw));
    lineM.opacity = draw * flick * out;
    glowM.opacity = draw * flick * out * 0.9;
  });
  return (
    <group>
      <points geometry={pts} material={m} ref={fx} frustumCulled={false} renderOrder={6} />
      <primitive object={useMemo(() => new Line(lineG, lineM), [lineG, lineM])} ref={fx} renderOrder={8} />
      <points geometry={glowG} material={glowM} ref={fx} renderOrder={8} />
    </group>
  );
};

/** Wall socket with a face drawn over it. */
export const SocketFace: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  const u = t - t0;
  const ring = useMemo(() => {
    const mk = (cx: number, cy: number, r: number, a0 = 0, a1 = Math.PI * 2, n = 48) => {
      const g = new BufferGeometry();
      const p: number[] = [];
      for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.09); }
      g.setAttribute("position", new Float32BufferAttribute(p, 3));
      return g;
    };
    return [mk(-0.06, 0.02, 0.042), mk(0.06, 0.02, 0.042), mk(0, -0.02, 0.105, Math.PI * 1.22, Math.PI * 1.78)];
  }, []);
  const lm = useMemo(() => new LineBasicMaterial({ color: ORANGE, transparent: true, blending: AdditiveBlending, depthWrite: false, fog: false }), []);
  const draw = ease.inOut(remap(u, 0.5, 1.3));
  lm.opacity = draw;
  ring.forEach((g) => g.setDrawRange(0, Math.floor(49 * draw)));
  const plate = phys("bigPlate", { color: "#8f99a4", roughness: 0.45, clearcoat: 0.4 });
  const holeM = phys("bigHole", { color: "#0d0f12", roughness: 0.9 });
  const lines = useMemo(() => ring.map((g) => new Line(g, lm)), [ring, lm]);
  return (
    <group rotation={[0, 0.25 * (1 - ease.out(remap(u, 0, 2.4))), 0]}>
      <mesh geometry={box(0.5, 0.5, 0.06, 0.04)} material={plate} castShadow />
      <mesh geometry={cyl(0.17, 0.17, 0.05, 48)} material={phys("bigRecess", { color: "#d9dde1", roughness: 0.5 })} position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]} />
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} geometry={cyl(0.022, 0.022, 0.06, 20)} material={holeM} position={[x, 0.02, 0.04]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
      <mesh geometry={box(0.08, 0.012, 0.02, 0.004)} material={phys("ground", { color: "#a9adb2", metalness: 0.9, roughness: 0.3 })} position={[0, -0.1, 0.06]} />
      {lines.map((l, i) => <primitive key={i} object={l} ref={fx} renderOrder={8} />)}
    </group>
  );
};

// ── backdrop ───────────────────────────────────────────────────────────────

export const NeuralBackdrop: React.FC<{ top: string; bottom: string; glow: string; r?: number }> = ({ top, bottom, glow, r = 140 }) => {
  const m = useMemo(
    () =>
      new ShaderMaterial({
        side: 1, depthWrite: false, fog: false,
        uniforms: { uTop: { value: new Color(top) }, uBot: { value: new Color(bottom) }, uGlow: { value: new Color(glow) } },
        vertexShader: /* glsl */ `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `uniform vec3 uTop; uniform vec3 uBot; uniform vec3 uGlow; varying vec3 vD;
          float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
          void main(){ vec3 d = normalize(vD); vec3 c = mix(uBot, uTop, d.y * 0.5 + 0.5);
            c += uGlow * pow(max(0.0, 1.0 - length(d.xy - vec2(0.0, 0.05))), 3.0) * 0.35 * smoothstep(-0.2, 0.6, d.z);
            gl_FragColor = vec4(c, 1.0); }`,
      }),
    [top, bottom, glow],
  );
  (m.uniforms.uTop.value as Color).set(top);
  (m.uniforms.uBot.value as Color).set(bottom);
  (m.uniforms.uGlow.value as Color).set(glow);
  return <mesh geometry={sphere(r, 32, 16)} material={m} renderOrder={-10} />;
};

/** Dust motes of light drifting in the neural space. */
export const Motes: React.FC<{ t: number; n?: number; R?: number; opacity?: number }> = ({ t, n = 500, R = 4, opacity = 1 }) => {
  const o = useMemo(() => {
    const r = mulberry32(55);
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(new Float32Array(n * 3), 3));
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const k = 0.2 + r() * 0.5; const orn = r() < 0.15; c.set(orn ? [k, 0.55 * k, 0.2 * k] : [0.4 * k, 0.8 * k, k], i * 3); }
    g.setAttribute("color", new Float32BufferAttribute(c, 3));
    return { g, s: Array.from({ length: n }, () => [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, r() * 6]), m: pointsMat(0.02 * R) };
  }, [n, R]);
  useLayoutEffect(() => {
    const a = o.g.attributes.position as Float32BufferAttribute;
    o.s.forEach(([x, y, z, ph], i) => a.setXYZ(i, (x + Math.sin(t * 0.21 + ph) * 0.05) * R, (y + ((t * 0.02 + ph) % 2) * 0.05) * R, (z + Math.cos(t * 0.17 + ph) * 0.05) * R));
    a.needsUpdate = true;
    o.m.opacity = opacity;
  });
  return <points geometry={o.g} material={o.m} ref={fx} frustumCulled={false} renderOrder={3} />;
};

// ── streams into the prediction core ───────────────────────────────────────

export const Stream: React.FC<{ curve: CatmullRomCurve3; color: string; t: number; on: number; n?: number; thin?: boolean }> = ({ curve, color, t, on, n = 90, thin }) => {
  const tube = useMemo(() => new TubeGeometry(curve, 80, thin ? 0.004 : 0.012, 6, false), [curve, thin]);
  const tm = useMemo(() => glowMat({ color, rim: 1.2, core: 0.25 }), [color]);
  (tm.uniforms.uOpacity as { value: number }).value = on * 0.8;
  const o = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(new Float32Array(n * 3), 3));
    const c = new Color(color);
    g.setAttribute("color", new Float32BufferAttribute(Array.from({ length: n }, () => [c.r * 1.5, c.g * 1.5, c.b * 1.5]).flat(), 3));
    return { g, m: pointsMat(thin ? 0.022 : 0.05) };
  }, [n, color, thin]);
  useLayoutEffect(() => {
    const a = o.g.attributes.position as Float32BufferAttribute;
    for (let i = 0; i < n; i++) {
      const u = ((i / n) + t * 0.32) % 1;
      const p = curve.getPoint(u);
      a.setXYZ(i, p.x + Math.sin(i * 7.3) * 0.02, p.y + Math.cos(i * 3.1) * 0.02, p.z);
    }
    a.needsUpdate = true;
    o.m.opacity = on;
  });
  return (
    <group>
      <mesh geometry={tube} material={tm} ref={fx} renderOrder={6} />
      <points geometry={o.g} material={o.m} ref={fx} frustumCulled={false} renderOrder={7} />
    </group>
  );
};

export const CORE: [number, number, number] = [0, 0.06, -0.15];
const INFO_CURVE = new CatmullRomCurve3([new Vector3(0.05, 0.12, 1.25), new Vector3(0.25, 0.2, 0.7), new Vector3(0.1, 0.1, 0.2), new Vector3(...CORE)]);
const EXP_CURVE = new CatmullRomCurve3([new Vector3(-0.42, -0.32, -0.55), new Vector3(-0.35, -0.15, -0.2), new Vector3(-0.15, 0.0, -0.1), new Vector3(...CORE)]);

const PredictionCore: React.FC<{ t: number; on: number; info: number; exp: number }> = ({ t, on, info, exp }) => {
  const m = useMemo(() => glowMat({ color: "#ffd9a8", rim: 0.9, core: 0.55, power: 1.5 }), []);
  const h = useMemo(() => glowMat({ color: ORANGE, rim: 0, core: 0.3, power: 1 }), []);
  const ringM = useMemo(() => glowMat({ color: CYAN, rim: 1, core: 0.6 }), []);
  const beat = 0.8 + 0.2 * Math.sin(t * 5.2) + 0.25 * info * exp;
  (m.uniforms.uOpacity as { value: number }).value = on * beat;
  (h.uniforms.uOpacity as { value: number }).value = on * 0.22 * beat;
  (ringM.uniforms.uOpacity as { value: number }).value = on * 0.6;
  return (
    <group>
      <group position={CORE}>
        <mesh geometry={sphere(0.06, 32, 20)} material={m} ref={fx} renderOrder={8} />
        <mesh geometry={sphere(0.17, 32, 20)} material={h} ref={fx} renderOrder={8} />
        <mesh geometry={torus(0.12, 0.003, 6, 64)} material={ringM} rotation={[Math.PI / 2 + Math.sin(t) * 0.3, t * 0.7, 0]} ref={fx} renderOrder={8} />
        <mesh geometry={torus(0.15, 0.002, 6, 64)} material={ringM} rotation={[0.4, -t * 0.5, 0.3]} ref={fx} renderOrder={8} />
      </group>
      <Stream curve={INFO_CURVE} color={CYAN} t={t} on={info} />
      <Stream curve={EXP_CURVE} color={ORANGE} t={t * 0.8 + 0.3} on={exp} />
    </group>
  );
};

// ── the whole neural set for scene 5 ───────────────────────────────────────

export const BrainSet: React.FC<{ t: number }> = ({ t }) => {
  const net = brainNet().userData.net as Net;
  const tunnel = 1 - ease.inOut(remap(t, 34.3, 35.0));
  const photoIn = ease.out(remap(t, 35.5, 36.1));
  const photoGone = ease.inOut(remap(t, 36.6, 37.5));
  // dimmer while the camera is inside it, and behind the pattern / socket close-ups
  const shell = ease.inOut(remap(t, 33.6, 34.8)) * (1 - 0.72 * ease.inOut(remap(t, 37.2, 37.9)) + 0.1 * ease.inOut(remap(t, 42.8, 43.6)));
  const info = ease.inOut(remap(t, 37.9, 38.8));
  const heroOn = ease.inOut(remap(t, 36.5, 37.3)) * (1 - ease.inOut(remap(t, 42.7, 43.3)));
  const exp = ease.inOut(remap(t, 39.8, 40.6));
  const photo = useMemo(() => phys("photoCard", { map: photoTex(), roughness: 0.5, emissive: "#ffffff", emissiveMap: photoTex(), emissiveIntensity: 0.08, transparent: true }), []);
  photo.opacity = photoIn * (1 - photoGone);
  return (
    <group>
      <NeuralBackdrop top="#0f3b66" bottom="#06162b" glow="#3aa6e8" r={60} />
      <Motes t={t} R={4} />
      {t < 35.2 ? <OpticTunnel t={t} opacity={tunnel} /> : null}
      <BrainShell t={t} opacity={shell} orange={t > 38 ? 1.2 : 0.6} />
      <Network net={net} t={t} opacity={Math.min(1, shell * 1.3) * (t > 42.9 ? 0.55 : 1)} pulse={1 + info + exp} orangeShare={0.2 + 0.25 * exp} />
      {t > 36.5 && t < 43.4 ? (
        <>
          <HeroNeuron seed={3} p={[0.62, 0.34, 0.18]} s={0.3} t={t} opacity={heroOn} />
          <HeroNeuron seed={7} p={[-0.32, 0.05, 0.25]} s={0.28} color={ORANGE} t={t} opacity={heroOn} />
          <HeroNeuron seed={11} p={[0.2, -0.18, -0.35]} s={0.3} t={t} opacity={heroOn} />
          <PredictionCore t={t} on={ease.inOut(remap(t, 37.0, 37.8)) * (1 - ease.inOut(remap(t, 42.8, 43.3)))} info={info} exp={exp} />
        </>
      ) : null}
      {photo.opacity > 0.01 ? (
        <mesh geometry={planeG(0.3, 0.37)} material={photo} position={[0.45 - photoGone * 0.3, 0.25 - photoGone * 0.12, 2.2 - photoGone * 0.8]} rotation={[0.02, 0.25 + photoGone * 0.2, 0.05]} />
      ) : null}
      {t > 36.6 && t < 37.8 ? <PhotoDust t={t} /> : null}
      {t > 42.9 && t < 48.4 ? (
        <group position={[0, -0.32, 1.55]} scale={0.6}>
          <PatternCloud t={t} t0={43.0} />
        </group>
      ) : null}
      {t > 48.2 ? (
        <group position={[0, 0.0, 1.62]} scale={0.55}>
          <SocketFace t={t} t0={48.4} />
        </group>
      ) : null}
    </group>
  );
};

const PhotoDust: React.FC<{ t: number }> = ({ t }) => {
  const o = useMemo(() => {
    const r = mulberry32(91);
    const n = 600;
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(new Float32Array(n * 3), 3));
    const c: number[] = [];
    for (let i = 0; i < n; i++) { const w = r() < 0.5; c.push(w ? 0.9 : 0.4, w ? 0.9 : 0.75, 1); }
    g.setAttribute("color", new Float32BufferAttribute(c, 3));
    return { g, s: Array.from({ length: n }, () => [r() - 0.5, r() - 0.5, r(), r()]), m: pointsMat(0.012) };
  }, []);
  useLayoutEffect(() => {
    const u = ease.inOut(remap(t, 36.6, 37.8));
    const a = o.g.attributes.position as Float32BufferAttribute;
    o.s.forEach(([x, y, d, w], i) => {
      const k = Math.min(1, u * (1 + w));
      a.setXYZ(i, 0.45 + x * 0.3 * (1 - k * 0.8) - k * 0.4, 0.25 + y * 0.37 * (1 - k * 0.8) - k * 0.2, 2.2 - k * (1.2 + d * 0.7));
    });
    a.needsUpdate = true;
    o.m.opacity = 1 - ease.in(remap(t, 37.3, 37.8));
  });
  return <points geometry={o.g} material={o.m} ref={fx} frustumCulled={false} renderOrder={8} />;
};

export { inside, Mesh, MeshBasicMaterial, Points, LineSegments };
