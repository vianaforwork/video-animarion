// Set-building kit for any world: axis-aligned slabs, walls with openings, hinged doors, windows and a
// small furniture library (bed, desk, chair, oil lamp, shelf, wall clock). Geometry + materials cached.

import React from "react";
import { DoubleSide, type Material } from "three";
import { box, cyl, sphere, torus } from "../../kits/worldforge/geo.ts";
import { phys, plankTex, tileTex, weaveTex } from "../mats.ts";
import { ceilTex, concreteTex, doorTex, plasterTex } from "./tex.ts";
import type { V3 } from "../Lights.tsx";

export const MAT = {
  wall: (c = "#d3cdbb") => phys(`wall${c}`, { color: c, roughness: 0.92, map: plasterTex("up", [1, 1], 0.12) }),
  dado: (c = "#5d7a74") => phys(`dado${c}`, { color: c, roughness: 0.55, map: plasterTex("dado", [1, 1], 0.3), clearcoat: 0.15 }),
  trim: (c = "#3c4b47") => phys(`trim${c}`, { color: c, roughness: 0.5 }),
  ceil: (rep: [number, number]) => phys(`ceil${rep}`, { color: "#d9d9d4", roughness: 0.95, map: ceilTex(rep) }),
  tile: (rep: [number, number]) => phys(`tile${rep}`, { color: "#ffffff", map: tileTex(rep), roughness: 0.34, clearcoat: 0.18, clearcoatRoughness: 0.45 }),
  planks: (rep: [number, number], c = "#ffffff") => phys(`planks${rep}${c}`, { color: c, map: plankTex(rep), roughness: 0.7, clearcoat: 0.1 }),
  frame: (c = "#3a2416") => phys(`frame${c}`, { color: c, roughness: 0.5, clearcoat: 0.3 }),
  door: (key: string, base?: string) => phys(`door${key}`, { color: "#ffffff", map: doorTex(key, base), roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
  chrome: () => phys("chrome", { color: "#c9ccd1", metalness: 1, roughness: 0.22 }),
  steel: () => phys("steel", { color: "#55585e", metalness: 0.8, roughness: 0.45 }),
  brass: () => phys("brass", { color: "#b8973f", metalness: 1, roughness: 0.3 }),
  concrete: (rep: [number, number]) => phys(`concrete${rep}`, { color: "#ffffff", map: concreteTex(rep), roughness: 0.95 }),
  plastic: (c: string) => phys(`plastic${c}`, { color: c, roughness: 0.45, clearcoat: 0.2 }),
  matte: (c: string, r = 0.85) => phys(`matte${c}${r}`, { color: c, roughness: r }),
  wood: (c = "#7a5636") => phys(`wood${c}`, { color: c, roughness: 0.62, clearcoat: 0.12 }),
  glass: () => phys("glassPane", { color: "#b9cbe0", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18, clearcoat: 1, side: DoubleSide, depthWrite: false }),
  fabric: (key: string, c: string, stripe?: string) => phys(`fabric${key}`, { color: "#ffffff", map: weaveTex(key, c, [4, 4], stripe), roughness: 0.9, sheen: 0.5, sheenColor: "#d8dcea" }),
};

/** Axis-aligned slab from min to max corner. */
export const Slab: React.FC<{ min: V3; max: V3; m: Material; r?: number; cast?: boolean; recv?: boolean }> = ({ min, max, m, r = 0.004, cast = true, recv = true }) => {
  const w = max[0] - min[0], h = max[1] - min[1], d = max[2] - min[2];
  if (w <= 0 || h <= 0 || d <= 0) return null;
  return (
    <mesh geometry={box(+w.toFixed(4), +h.toFixed(4), +d.toFixed(4), r, 1)} material={m} position={[(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]} castShadow={cast} receiveShadow={recv} />
  );
};

export type Hole = { a0: number; a1: number; y0: number; y1: number };

/**
 * A wall along an axis with rectangular openings, from floor y0 to y0 + top. `axis` "z": runs along z at
 * x = c; "x": runs along x at z = c. Optional dado band (1 m) in a second material on both faces.
 */
export const HoledWall: React.FC<{ axis: "x" | "z"; c: number; a0: number; a1: number; holes: Hole[]; t?: number; y0?: number; top?: number; m?: Material; dado?: Material | null }> = ({ axis, c, a0, a1, holes, t = 0.15, y0 = 0, top = 2.8, m, dado = null }) => {
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  const hs = [...holes].sort((p, q) => Math.min(p.a0, p.a1) - Math.min(q.a0, q.a1)).map((h) => ({ ...h, a0: Math.min(h.a0, h.a1), a1: Math.max(h.a0, h.a1) }));
  const pieces: Hole[] = [];
  let cur = lo;
  for (const h of hs) {
    if (h.a0 > cur) pieces.push({ a0: cur, a1: h.a0, y0: 0, y1: top });
    if (h.y0 > 0) pieces.push({ a0: h.a0, a1: h.a1, y0: 0, y1: h.y0 });
    if (h.y1 < top) pieces.push({ a0: h.a0, a1: h.a1, y0: h.y1, y1: top });
    cur = Math.max(cur, h.a1);
  }
  if (cur < hi) pieces.push({ a0: cur, a1: hi, y0: 0, y1: top });
  const W = m ?? MAT.wall();
  const out: React.ReactNode[] = [];
  pieces.forEach((p, i) => {
    const mk = (ya: number, yb: number, mm: Material, k: string, inset = 0) => {
      if (yb <= ya) return;
      const min: V3 = axis === "z" ? [c - t / 2 - inset, y0 + ya, p.a0] : [p.a0, y0 + ya, c - t / 2 - inset];
      const max: V3 = axis === "z" ? [c + t / 2 + inset, y0 + yb, p.a1] : [p.a1, y0 + yb, c + t / 2 + inset];
      out.push(<Slab key={`${i}${k}`} min={min} max={max} m={mm} />);
    };
    if (dado && p.y0 < 1) {
      mk(p.y0, Math.min(1, p.y1), dado, "d", 0.004);
      mk(Math.max(1, p.y0), p.y1, W, "u");
    } else mk(p.y0, p.y1, W, "u");
  });
  return <>{out}</>;
};

/** Hinged door leaf in an opening: `at` = floor centre of the opening, `axis` = the wall direction,
 *  `open` 0..1 (swings 100° toward `inside` = +1/−1 across the wall). */
export const Door: React.FC<{ at: V3; axis: "x" | "z"; w?: number; h?: number; open?: number; inside?: 1 | -1; leaf?: Material; frame?: Material }> = ({ at, axis, w = 0.86, h = 2.02, open = 0, inside = 1, leaf, frame }) => {
  const L = leaf ?? MAT.door("plain", "#5a3a24");
  const F = frame ?? MAT.frame();
  const rot = axis === "x" ? 0 : Math.PI / 2;
  return (
    <group position={at} rotation={[0, rot, 0]}>
      {/* frame (local: wall along x, thickness along z) */}
      <Slab min={[-w / 2 - 0.06, 0, -0.1]} max={[-w / 2, h + 0.06, 0.1]} m={F} />
      <Slab min={[w / 2, 0, -0.1]} max={[w / 2 + 0.06, h + 0.06, 0.1]} m={F} />
      <Slab min={[-w / 2 - 0.06, h, -0.1]} max={[w / 2 + 0.06, h + 0.06, 0.1]} m={F} />
      <group position={[-w / 2, 0, 0]} rotation={[0, -open * 1.75 * inside, 0]}>
        <Slab min={[0.005, 0.01, -0.02]} max={[w - 0.005, h - 0.005, 0.02]} m={L} r={0.006} />
        {[1, -1].map((s) => <mesh key={s} geometry={sphere(0.028, 12, 8)} material={MAT.brass()} position={[w - 0.09, 1.0, s * 0.04]} castShadow />)}
      </group>
    </group>
  );
};

/** Window in a wall opening: frame, cross bars, glass, sill. Local like Door (wall along x). */
export const Window: React.FC<{ at: V3; axis: "x" | "z"; w: number; h: number; frame?: Material; bars?: number }> = ({ at, axis, w, h, frame, bars = 2 }) => {
  const F = frame ?? MAT.frame("#e8e2d4");
  const rot = axis === "x" ? 0 : Math.PI / 2;
  return (
    <group position={at} rotation={[0, rot, 0]}>
      <Slab min={[-w / 2, 0, -0.05]} max={[w / 2, 0.05, 0.05]} m={F} />
      <Slab min={[-w / 2, h - 0.05, -0.05]} max={[w / 2, h, 0.05]} m={F} />
      <Slab min={[-w / 2, 0, -0.05]} max={[-w / 2 + 0.05, h, 0.05]} m={F} />
      <Slab min={[w / 2 - 0.05, 0, -0.05]} max={[w / 2, h, 0.05]} m={F} />
      {Array.from({ length: bars - 1 }, (_, i) => -w / 2 + (w * (i + 1)) / bars).map((x) => <Slab key={x} min={[x - 0.02, 0, -0.03]} max={[x + 0.02, h, 0.03]} m={F} />)}
      <Slab min={[-w / 2, h / 2 - 0.02, -0.03]} max={[w / 2, h / 2 + 0.02, 0.03]} m={F} />
      <mesh geometry={box(w - 0.08, h - 0.08, 0.004, 0)} material={MAT.glass()} position={[0, h / 2, 0]} />
      <Slab min={[-w / 2 - 0.05, -0.04, -0.14]} max={[w / 2 + 0.05, 0.0, 0.14]} m={F} />
    </group>
  );
};

/** Bed with mattress, pillow and a folded blanket; head at −x, local origin = floor centre. */
export const Bed: React.FC<{ at: V3; yaw?: number; L?: number; W?: number; blanket?: string }> = ({ at, yaw = 0, L = 1.95, W = 0.95, blanket = "#8a4a3a" }) => (
  <group position={at} rotation={[0, yaw, 0]}>
    <Slab min={[-L / 2, 0, -W / 2]} max={[L / 2, 0.26, W / 2]} m={MAT.wood("#5a3b26")} />
    <mesh geometry={box(L - 0.04, 0.2, W - 0.04, 0.06)} material={MAT.fabric("sheet", "#7f8fa8")} position={[0, 0.36, 0]} castShadow receiveShadow />
    <mesh geometry={box(0.42, 0.11, W - 0.22, 0.05)} material={MAT.matte("#e4e1da", 0.9)} position={[-L / 2 + 0.28, 0.51, 0]} rotation={[0, 0, 0.06]} castShadow receiveShadow />
    <mesh geometry={box(0.9, 0.09, W + 0.04, 0.045)} material={MAT.fabric(`blanket${blanket}`, blanket)} position={[L / 2 - 0.52, 0.5, 0]} castShadow receiveShadow />
    <Slab min={[-L / 2 - 0.05, 0, -W / 2]} max={[-L / 2, 0.85, W / 2]} m={MAT.wood("#5a3b26")} />
  </group>
);

/** Table/desk: local origin = floor centre, top at `top`. */
export const Desk: React.FC<{ at: V3; yaw?: number; w?: number; d?: number; top?: number; wood?: string }> = ({ at, yaw = 0, w = 1.3, d = 0.62, top = 0.76, wood = "#7a5636" }) => {
  const m = MAT.wood(wood);
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      <Slab min={[-w / 2, top - 0.04, -d / 2]} max={[w / 2, top, d / 2]} m={m} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <Slab key={i} min={[sx * (w / 2 - 0.05) - 0.025, 0, sz * (d / 2 - 0.05) - 0.025]} max={[sx * (w / 2 - 0.05) + 0.025, top - 0.04, sz * (d / 2 - 0.05) + 0.025]} m={m} />)}
      <Slab min={[-w / 2 + 0.05, top - 0.16, -d / 2 + 0.04]} max={[w / 2 - 0.05, top - 0.04, -d / 2 + 0.06]} m={m} />
    </group>
  );
};

/** Wooden chair; the seat faces +z in local space (sitter looks toward +z). */
export const Chair: React.FC<{ at: V3; yaw?: number; wood?: string }> = ({ at, yaw = 0, wood = "#6a4a2e" }) => {
  const m = MAT.wood(wood);
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      <Slab min={[-0.21, 0.43, -0.2]} max={[0.21, 0.46, 0.2]} m={m} />
      <Slab min={[-0.21, 0.46, -0.22]} max={[0.21, 0.92, -0.19]} m={m} />
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => <mesh key={i} geometry={box(0.03, 0.43, 0.03, 0.005)} material={m} position={[x, 0.215, z]} castShadow />)}
    </group>
  );
};

/** Hurricane oil lamp (glass chimney glows with `on`). */
export const OilLamp: React.FC<{ at: V3; on: number }> = ({ at, on }) => (
  <group position={at}>
    <mesh geometry={cyl(0.06, 0.075, 0.08, 18)} material={MAT.brass()} position={[0, 0.04, 0]} castShadow />
    <mesh geometry={sphere(0.05, 18, 12)} material={phys(`oilChimney${Math.round(on * 20)}`, { color: "#fff0d8", emissive: "#ffb257", emissiveIntensity: 0.1 + 1.1 * on, roughness: 0.15, transparent: true, opacity: 0.85 })} position={[0, 0.15, 0]} scale={[1, 1.5, 1]} />
    <mesh geometry={cyl(0.03, 0.04, 0.06, 14, true)} material={phys("oilTop", { color: "#2a2620", metalness: 0.6, roughness: 0.4, side: DoubleSide })} position={[0, 0.25, 0]} />
    <mesh geometry={torus(0.06, 0.004, 6, 20, Math.PI)} material={MAT.steel()} position={[0, 0.27, 0]} />
  </group>
);

/** Wall shelf with a few books and jars. Local: back against −z. */
export const Shelf: React.FC<{ at: V3; yaw?: number; w?: number }> = ({ at, yaw = 0, w = 1.0 }) => (
  <group position={at} rotation={[0, yaw, 0]}>
    <Slab min={[-w / 2, 0, 0]} max={[w / 2, 0.03, 0.24]} m={MAT.wood("#5d4029")} />
    {[0, 1, 2, 3, 4].map((k) => <mesh key={k} geometry={box(0.05, 0.2 + (k % 3) * 0.03, 0.17, 0.006)} material={MAT.matte(["#7a2f2f", "#2f4f7a", "#c9b27a", "#3d5e3a", "#5a3b6a"][k], 0.7)} position={[-w / 2 + 0.1 + k * 0.06, 0.13 + (k % 3) * 0.015, 0.12]} castShadow />)}
    <mesh geometry={cyl(0.05, 0.05, 0.14, 16)} material={phys("jar", { color: "#b9d0c4", roughness: 0.1, transparent: true, opacity: 0.5 })} position={[w / 2 - 0.15, 0.1, 0.12]} />
  </group>
);

/** Round wall clock (hands from `time` in hours). Local: face toward +z. */
export const WallClock: React.FC<{ at: V3; yaw?: number; time: number }> = ({ at, yaw = 0, time }) => {
  const h = ((time % 12) / 12) * Math.PI * 2, m = ((time % 1) * Math.PI * 2);
  return (
    <group position={at} rotation={[0, yaw, 0]}>
      <mesh geometry={cyl(0.16, 0.16, 0.04, 32)} material={MAT.wood("#3e2a1a")} rotation={[Math.PI / 2, 0, 0]} castShadow />
      <mesh geometry={cyl(0.14, 0.14, 0.005, 32)} material={MAT.matte("#efe8d8", 0.6)} position={[0, 0, 0.022]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={box(0.012, 0.08, 0.004, 0)} material={MAT.matte("#141414")} position={[Math.sin(h) * 0.04, Math.cos(h) * 0.04, 0.027]} rotation={[0, 0, -h]} />
      <mesh geometry={box(0.008, 0.12, 0.004, 0)} material={MAT.matte("#141414")} position={[Math.sin(m) * 0.06, Math.cos(m) * 0.06, 0.029]} rotation={[0, 0, -m]} />
    </group>
  );
};
