// Building blocks for the kos: axis-aligned slabs, walls with openings, door sets (frame, leaf, handle,
// number, breeze-block vent), shared materials. All geometry/materials cached by key.

import React from "react";
import { DoubleSide, type Material } from "three";
import { box, cyl, torus } from "../../../kits/worldforge/geo.ts";
import { basic, phys, tileTex } from "../../../cine/mats.ts";
import { ceilTex, concreteTex, doorTex, numberTex, plasterTex, rosterTex } from "../../../cine/set/tex.ts";
import { CEIL, WALL, type Door, type V3 } from "../layout.ts";

export const MAT = {
  wall: () => phys("wallUp", { color: "#d3cdbb", roughness: 0.92, map: plasterTex("up", [1, 1], 0.12) }),
  dado: () => phys("dado", { color: "#5d7a74", roughness: 0.55, map: plasterTex("dado", [1, 1], 0.3), clearcoat: 0.15 }),
  trim: () => phys("trim", { color: "#3c4b47", roughness: 0.5 }),
  ceil: (rep: [number, number]) => phys(`ceil${rep}`, { color: "#d9d9d4", roughness: 0.95, map: ceilTex(rep) }),
  tile: (rep: [number, number]) => phys(`tile${rep}`, { color: "#ffffff", map: tileTex(rep), roughness: 0.34, clearcoat: 0.18, clearcoatRoughness: 0.45 }),
  frame: () => phys("frame", { color: "#3a2416", roughness: 0.5, clearcoat: 0.3 }),
  door: (key: string, base?: string) => phys(`door${key}`, { color: "#ffffff", map: doorTex(key, base), roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
  chrome: () => phys("chrome", { color: "#c9ccd1", metalness: 1, roughness: 0.22 }),
  steel: () => phys("steel", { color: "#55585e", metalness: 0.8, roughness: 0.45 }),
  roster: () => phys("roster", { color: "#c9c4b4", roughness: 0.9, alphaMap: rosterTex(), alphaTest: 0.5, side: DoubleSide }),
  concrete: (rep: [number, number]) => phys(`concrete${rep}`, { color: "#ffffff", map: concreteTex(rep), roughness: 0.95 }),
  plastic: (c: string) => phys(`plastic${c}`, { color: c, roughness: 0.45, clearcoat: 0.2 }),
  matte: (c: string, r = 0.85) => phys(`matte${c}${r}`, { color: c, roughness: r }),
  black: () => basic("black", { color: "#000000" }),
  number: (label: string) => phys(`num${label}`, { color: "#ffffff", map: numberTex(label), roughness: 0.6 }),
};

/** Axis-aligned slab from min to max corner. */
export const Slab: React.FC<{ min: V3; max: V3; m: Material; r?: number; cast?: boolean; recv?: boolean }> = ({ min, max, m, r = 0.004, cast = true, recv = true }) => {
  const w = max[0] - min[0], h = max[1] - min[1], d = max[2] - min[2];
  if (w <= 0 || h <= 0 || d <= 0) return null;
  return (
    <mesh
      geometry={box(+w.toFixed(4), +h.toFixed(4), +d.toFixed(4), r, 1)}
      material={m}
      position={[(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]}
      castShadow={cast}
      receiveShadow={recv}
    />
  );
};

export type Hole = { a0: number; a1: number; y0: number; y1: number };

/**
 * A wall along an axis with rectangular openings. `axis` "z": the wall runs along z at x = c (thickness
 * across x); "x": runs along x at z = c. Upper paint + lower dado band (1.0 m) on both faces.
 */
export const HoledWall: React.FC<{ axis: "x" | "z"; c: number; a0: number; a1: number; holes: Hole[]; t?: number; top?: number; dado?: boolean }> = ({ axis, c, a0, a1, holes, t = WALL, top = CEIL, dado = true }) => {
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  const hs = [...holes].sort((p, q) => Math.min(p.a0, p.a1) - Math.min(q.a0, q.a1)).map((h) => ({ ...h, a0: Math.min(h.a0, h.a1), a1: Math.max(h.a0, h.a1) }));
  const pieces: { a0: number; a1: number; y0: number; y1: number }[] = [];
  let cur = lo;
  for (const h of hs) {
    if (h.a0 > cur) pieces.push({ a0: cur, a1: h.a0, y0: 0, y1: top });
    if (h.y0 > 0) pieces.push({ a0: h.a0, a1: h.a1, y0: 0, y1: h.y0 });
    if (h.y1 < top) pieces.push({ a0: h.a0, a1: h.a1, y0: h.y1, y1: top });
    cur = Math.max(cur, h.a1);
  }
  if (cur < hi) pieces.push({ a0: cur, a1: hi, y0: 0, y1: top });
  const DADO = 1.0;
  const out: React.ReactNode[] = [];
  pieces.forEach((p, i) => {
    const mk = (y0: number, y1: number, m: Material, k: string, inset = 0) => {
      if (y1 <= y0) return;
      const min: V3 = axis === "z" ? [c - t / 2 - inset, y0, p.a0] : [p.a0, y0, c - t / 2 - inset];
      const max: V3 = axis === "z" ? [c + t / 2 + inset, y1, p.a1] : [p.a1, y1, c + t / 2 + inset];
      out.push(<Slab key={`${i}${k}`} min={min} max={max} m={m} />);
    };
    if (dado && p.y0 < DADO) {
      mk(p.y0, Math.min(DADO, p.y1), MAT.dado(), "d", 0.004);
      mk(Math.max(DADO, p.y0), p.y1, MAT.wall(), "u");
      if (p.y1 > DADO) mk(DADO - 0.012, DADO + 0.012, MAT.trim(), "t", 0.008);
    } else mk(p.y0, p.y1, MAT.wall(), "u");
  });
  return <>{out}</>;
};

/** Holes for a hallway door + its breeze-block vent above. */
export const doorHoles = (d: Door): Hole[] => [{ a0: d.z - d.w / 2 - 0.06, a1: d.z + d.w / 2 + 0.06, y0: 0, y1: 2.5 }];

/**
 * A complete door set in a side wall at x = wx (wall centre): frame, leaf (open angle `open`, swinging
 * into the room, i.e. away from the hallway), lever handles both sides, number plate, breeze-block vent.
 */
export const DoorSet: React.FC<{ d: Door; wx: number; open?: number; leaf: Material; extra?: React.ReactNode; lever?: number; lockKey?: number }> = ({ d, wx, open = 0, leaf, extra, lever = 0, lockKey }) => {
  const s = d.side; // −1 left wall, +1 right wall
  const z0 = d.z - d.w / 2, z1 = d.z + d.w / 2;
  const fw = 0.06, depth = WALL + 0.03;
  const hingeZ = d.hinge > 0 ? z1 : z0;
  const latchDir = d.hinge > 0 ? -1 : 1; // from hinge toward the latch along z
  // leaf swings into the room: rotate about y at the hinge; positive angle for a left-wall door moves −x
  const ang = open * (s < 0 ? 1 : -1) * (d.hinge > 0 ? 1 : -1);
  const fr = MAT.frame();
  return (
    <group>
      <Slab min={[wx - depth / 2, 0, z0 - fw]} max={[wx + depth / 2, d.h + fw, z0]} m={fr} />
      <Slab min={[wx - depth / 2, 0, z1]} max={[wx + depth / 2, d.h + fw, z1 + fw]} m={fr} />
      <Slab min={[wx - depth / 2, d.h, z0 - fw]} max={[wx + depth / 2, d.h + fw, z1 + fw]} m={fr} />
      {/* lintel + breeze-block vent above the door */}
      <Slab min={[wx - WALL / 2, d.h + fw, z0 - fw]} max={[wx + WALL / 2, 2.2, z1 + fw]} m={MAT.wall()} />
      <Slab min={[wx - depth / 2, 2.2, z0 - fw]} max={[wx + depth / 2, 2.22, z1 + fw]} m={fr} />
      <Slab min={[wx - depth / 2, 2.48, z0 - fw]} max={[wx + depth / 2, 2.5, z1 + fw]} m={fr} />
      {[-0.06, 0.06].map((o) => (
        <mesh key={o} geometry={box(0.001, 0.26, d.w + 2 * fw, 0)} material={MAT.roster()} position={[wx + o, 2.35, d.z]} castShadow />
      ))}
      {/* leaf, pivoting at the hinge */}
      <group position={[wx + s * 0.02, 0, hingeZ]} rotation={[0, ang, 0]}>
        <group position={[0, 0, latchDir * d.w / 2]}>
          <Slab min={[-0.02, 0.01, -d.w / 2 + 0.005]} max={[0.02, d.h - 0.005, d.w / 2 - 0.005]} m={leaf} r={0.006} />
          {[1, -1].map((side) => (
            <group key={side} position={[side * 0.026, 1.0, latchDir * (d.w / 2 - 0.085)]}>
              <mesh geometry={box(0.012, 0.16, 0.045, 0.006)} material={MAT.chrome()} castShadow />
              <group position={[side * 0.025, 0.03, 0]} rotation={[-latchDir * lever, 0, 0]}>
                <mesh geometry={cyl(0.009, 0.009, 0.11, 12)} material={MAT.chrome()} position={[0, 0, -latchDir * 0.045]} rotation={[Math.PI / 2, 0, 0]} castShadow />
              </group>
              <mesh geometry={cyl(0.007, 0.007, 0.012, 10)} material={MAT.steel()} position={[side * 0.004, -0.045, 0]} rotation={[0, 0, Math.PI / 2]} />
            </group>
          ))}
          <mesh geometry={box(0.004, 0.09, 0.09, 0.002)} material={MAT.number(d.label)} position={[-s * 0.024, 1.62, 0]} />
          {lockKey !== undefined ? (
            // key in the lock on the room side (turns a quarter to lock)
            <group position={[s * 0.03, 0.955, latchDir * (d.w / 2 - 0.085)]} rotation={[lockKey * Math.PI / 2, 0, 0]}>
              <mesh geometry={box(0.012, 0.008, 0.008, 0.002)} material={phys("keyBrass", { color: "#b8973f", metalness: 1, roughness: 0.3 })} position={[s * 0.006, 0, 0]} />
              <mesh geometry={box(0.004, 0.028, 0.022, 0.003)} material={phys("keyBrass", { color: "#b8973f", metalness: 1, roughness: 0.3 })} position={[s * 0.016, 0, 0]} castShadow />
              <mesh geometry={torus(0.005, 0.0015, 6, 12)} material={MAT.steel()} position={[s * 0.016, 0.018, 0]} rotation={[0, Math.PI / 2, 0]} />
            </group>
          ) : null}
        </group>
      </group>
      {extra}
    </group>
  );
};
