// World builder (data side): world.json + object specs → a WorldData the director can use (places with
// marks, POIs, camera space, solids, light rig) plus the resolved geometry the renderer draws (walls with
// openings, doors, objects with world transforms and bounds, ground, paths, fixtures) and a navigation grid.
// Pure functions; importable by Node (compile, sound, QA) and the browser (render).

import { P_OFF, S_OFF, type LightState, type PointL, type SpotL } from "../cine/types.ts";
import type { Mark, Place, PropDoc, SetState, WorldData } from "../worlds/types.ts";
import { fbm } from "../kits/worldforge/noise.ts";
import { BUILTIN } from "./objects/builtin-data.ts";
import type { FixtureSpec, ObjectSpec, ObjectUse, OpeningSpec, PartSpec, RoomSpec, ScatterSpec, V2, V3, WorldSpec } from "./spec.ts";

export type Box3 = { min: V3; max: V3 };
export type ObjInfo = { id: string; doc: string; bounds: V3; center: V3; anchors: Record<string, V3>; walkable?: boolean; hand?: boolean; states: Record<string, number>; builtin: boolean };
export type Inst = { id: string; use: string; pos: V3; yaw: number; scale: number; info: ObjInfo; variant?: string; color?: string; states: Record<string, number>; box: Box3; parts: Box3[] };
export type Opening = OpeningSpec & { room: string; x: number; z: number; y: number; w: number; h: number; sill: number; axis: "x" | "z"; wallC: number; id: string };
export type Built = {
  spec: WorldSpec;
  rooms: (RoomSpec & { y: number; height: number })[];
  openings: Opening[];
  insts: Inst[];
  scatter: { use: string; info: ObjInfo; items: { pos: V3; yaw: number; scale: number }[]; variant?: string }[];
  fixtures: (FixtureSpec & { id: string })[];
  ground?: (x: number, z: number) => number;
  bounds: Box3;
  nav: Nav;
  objects: Record<string, ObjectSpec>;
};
export type Nav = { x0: number; z0: number; cell: number; nx: number; nz: number; free: Uint8Array; floor: (x: number, z: number) => number };

const deg = Math.PI / 180;
const rot3 = (p: V3, r: V3 = [0, 0, 0]): V3 => {
  let [x, y, z] = p;
  const [ax, ay, az] = [r[0] * deg, r[1] * deg, r[2] * deg];
  // XYZ euler (three.js default): apply X, then Y, then Z in object space = R = Rz·Ry·Rx? three uses intrinsic XYZ → R = Rx·Ry·Rz applied to the vector
  let c = Math.cos(az), s = Math.sin(az); [x, y] = [x * c - y * s, x * s + y * c];
  c = Math.cos(ay); s = Math.sin(ay); [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(ax); s = Math.sin(ax); [y, z] = [y * c - z * s, y * s + z * c];
  return [x, y, z];
};

/** Local bounds of one part (before its own repeat/mirror). */
const partBox = (p: PartSpec): Box3 => {
  const sc = p.scale ?? [1, 1, 1];
  let half: V3;
  switch (p.shape) {
    case "box": { const s = p.size ?? [0.1, 0.1, 0.1]; half = [s[0] / 2, s[1] / 2, s[2] / 2]; break; }
    case "plane": case "text": { const s = p.size ?? [0.5, 0.3]; half = [s[0] / 2, s[1] / 2, 0.005]; break; }
    case "cyl": case "cone": { const r = Math.max(p.r ?? 0.05, p.r2 ?? p.r ?? 0.05); half = [r, (p.h ?? 0.1) / 2, r]; break; }
    case "capsule": { const r = p.r ?? 0.05; half = [r, (p.h ?? 0.1) / 2 + r, r]; break; }
    case "sphere": { const r = p.r ?? 0.05; half = [r, r, r]; break; }
    case "torus": { const R = (p.R ?? 0.2) + (p.r ?? 0.02); half = [R, R, p.r ?? 0.02]; break; }
    case "lathe": { const pr = p.profile ?? [[0.1, 0], [0.1, 0.1]]; const R = Math.max(...pr.map((q) => q[0])); const y0 = Math.min(...pr.map((q) => q[1])), y1 = Math.max(...pr.map((q) => q[1])); return { min: add(p.at ?? [0, 0, 0], [-R * sc[0], y0 * sc[1], -R * sc[2]]), max: add(p.at ?? [0, 0, 0], [R * sc[0], y1 * sc[1], R * sc[2]]) }; }
    case "rod": { const a = p.from ?? [0, 0, 0], b = p.to ?? [0, 1, 0], r = p.r ?? 0.02; return { min: [Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.min(a[2], b[2]) - r], max: [Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r, Math.max(a[2], b[2]) + r] }; }
    case "pile": { const s = p.size ?? [0.4, 0.15, 0.3]; half = [s[0] / 2, s[1] / 2, s[2] / 2]; break; }
    default: half = [0.05, 0.05, 0.05];
  }
  half = [half[0] * sc[0], half[1] * sc[1], half[2] * sc[2]];
  const at = p.at ?? [0, 0, 0];
  const lo: V3 = [Infinity, Infinity, Infinity], hi: V3 = [-Infinity, -Infinity, -Infinity];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const q = rot3([half[0] * sx, half[1] * sy, half[2] * sz], p.rot);
    for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], at[k] + q[k]); hi[k] = Math.max(hi[k], at[k] + q[k]); }
  }
  return { min: lo, max: hi };
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const union = (a: Box3, b: Box3): Box3 => ({ min: [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1]), Math.min(a.min[2], b.min[2])], max: [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1]), Math.max(a.max[2], b.max[2])] });

/** Expand repeat / mirror into concrete parts (the renderer uses the same expansion). */
export const expandParts = (parts: PartSpec[]): PartSpec[] => {
  const out: PartSpec[] = [];
  const rotY = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
  for (const p of parts) {
    const n = p.repeat?.n ?? 1;
    for (let i = 0; i < n; i++) {
      const step = p.repeat?.step ?? [0, 0, 0], sr = p.repeat?.stepRot ?? [0, 0, 0];
      const off: V3 = [step[0] * i, step[1] * i, step[2] * i];
      let q: PartSpec;
      if (p.repeat?.around) {
        const a = sr[1] * i * deg;
        const r0 = p.rot ?? [0, 0, 0];
        q = { ...p, repeat: undefined, at: add(rotY(p.at ?? [0, 0, 0], a), off), rot: [r0[0], r0[1] + sr[1] * i, r0[2]] };
        if (p.from && p.to) { q.from = add(rotY(p.from, a), off); q.to = add(rotY(p.to, a), off); }
      } else {
        q = { ...p, repeat: undefined, at: add(p.at ?? [0, 0, 0], off), rot: add(p.rot ?? [0, 0, 0], [sr[0] * i, sr[1] * i, sr[2] * i]) };
        if (p.from && p.to) { q.from = add(p.from, off); q.to = add(p.to, off); }
      }
      out.push(q);
      if (p.mirror) {
        const k = p.mirror === "x" ? 0 : 2;
        const m = (v: V3): V3 => { const c: V3 = [...v]; c[k] = -c[k]; return c; };
        const r = q.rot ?? [0, 0, 0];
        out.push({ ...q, at: m(q.at ?? [0, 0, 0]), from: q.from ? m(q.from) : undefined, to: q.to ? m(q.to) : undefined, rot: p.mirror === "x" ? [r[0], -r[1], -r[2]] : [-r[0], -r[1], r[2]] });
      }
    }
  }
  return out;
};

export const objectInfo = (id: string, objects: Record<string, ObjectSpec>): ObjInfo => {
  const b = BUILTIN[id];
  if (b) return { id, doc: b.doc, bounds: b.bounds, center: [0, b.bounds[1] / 2, 0], anchors: b.anchors ?? {}, walkable: b.walkable, hand: b.hand, states: b.states ?? {}, builtin: true };
  const o = objects[id];
  if (!o) throw new Error(`object "${id}" is not in the library (built-in: ${Object.keys(BUILTIN).join(", ")}) and no objects/${id}.json was found`);
  let box: Box3 | null = null;
  for (const p of expandParts(o.parts)) box = box ? union(box, partBox(p)) : partBox(p);
  const bb = box ?? { min: [-0.1, 0, -0.1], max: [0.1, 0.2, 0.1] };
  const bounds: V3 = o.bounds ?? [bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]];
  return { id, doc: o.doc, bounds, center: [(bb.min[0] + bb.max[0]) / 2, (bb.min[1] + bb.max[1]) / 2, (bb.min[2] + bb.max[2]) / 2], anchors: o.anchors ?? {}, walkable: o.walkable, hand: o.hand, states: o.states ?? {}, builtin: false };
};

/** World AABBs of the visible parts of a compound object (precise collision / line of sight). Built-ins: one box. */
export const partBoxes = (id: string, objects: Record<string, ObjectSpec>, pos: V3, yaw: number, scale: number): Box3[] => {
  const o = objects[id];
  const sol = BUILTIN[id]?.solid;
  if (!o && !sol) return [];
  const out: Box3[] = [];
  for (const p of o ? expandParts(o.parts) : [null]) {
    const b: Box3 = p ? partBox(p) : { min: sol![0], max: sol![1] };
    const sz = [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];
    if (Math.max(...sz) < 0.06 || sz.filter((v) => v < 0.03).length >= 2) continue; // thin rods / tiny bits never block a camera
    const lo: V3 = [Infinity, pos[1] + b.min[1] * scale, Infinity], hi: V3 = [-Infinity, pos[1] + b.max[1] * scale, -Infinity];
    for (const x of [b.min[0], b.max[0]]) for (const z of [b.min[2], b.max[2]]) {
      const w = toWorld(pos, yaw, scale, [x, 0, z]);
      lo[0] = Math.min(lo[0], w[0]); hi[0] = Math.max(hi[0], w[0]); lo[2] = Math.min(lo[2], w[2]); hi[2] = Math.max(hi[2], w[2]);
    }
    out.push({ min: lo, max: hi });
  }
  return out;
};

/** World AABB of an object placed at pos/yaw/scale. */
export const placedBox = (info: ObjInfo, pos: V3, yaw: number, scale: number): Box3 => {
  const [w, h, d] = info.bounds, c = info.center;
  const lo: V3 = [Infinity, pos[1] + (c[1] - h / 2) * scale, Infinity], hi: V3 = [-Infinity, pos[1] + (c[1] + h / 2) * scale, -Infinity];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const lx = (c[0] + (sx * w) / 2) * scale, lz = (c[2] + (sz * d) / 2) * scale;
    const x = pos[0] + lx * Math.cos(yaw) + lz * Math.sin(yaw), z = pos[2] - lx * Math.sin(yaw) + lz * Math.cos(yaw);
    lo[0] = Math.min(lo[0], x); hi[0] = Math.max(hi[0], x); lo[2] = Math.min(lo[2], z); hi[2] = Math.max(hi[2], z);
  }
  return { min: lo, max: hi };
};
/** Object-space point → world. */
export const toWorld = (pos: V3, yaw: number, scale: number, p: V3): V3 => [pos[0] + (p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw)) * scale, pos[1] + p[1] * scale, pos[2] + (-p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw)) * scale];

const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// ── times of day ─────────────────────────────────────────────────────────────
type TimeLook = { bg: string; fog: string; hemiSky: string; hemiGround: string; hemi: number; key: string; keyI: number; dir: V3; env: number; dark: number };
export const TIMES: Record<string, TimeLook> = {
  night: { bg: "#050913", fog: "#0c1424", hemiSky: "#2b3f66", hemiGround: "#0b0c0e", hemi: 0.4, key: "#a8c0ff", keyI: 1.4, dir: [-0.35, 0.62, 0.7], env: 0.05, dark: 1 },
  dusk: { bg: "#2a2a3e", fog: "#6a5a68", hemiSky: "#7a7aa0", hemiGround: "#2a2018", hemi: 0.85, key: "#ffb27a", keyI: 2.4, dir: [0.7, 0.18, -0.65], env: 0.18, dark: 0.6 },
  dawn: { bg: "#5a6a88", fog: "#9a9aa8", hemiSky: "#a8b8d8", hemiGround: "#3a3028", hemi: 1.0, key: "#ffd2a0", keyI: 2.8, dir: [0.6, 0.2, -0.75], env: 0.3, dark: 0.35 },
  day: { bg: "#9ab8d8", fog: "#b8c8d8", hemiSky: "#cfe0f2", hemiGround: "#5a5040", hemi: 1.25, key: "#fff4e0", keyI: 3.2, dir: [0.45, 0.78, 0.4], env: 0.45, dark: 0 },
};

const FIX: Record<FixtureSpec["type"], { color: string; i: number; dist: number }> = {
  panel: { color: "#eaf2ff", i: 3.4, dist: 8 }, tube: { color: "#e8f4ff", i: 2.8, dist: 7.5 }, bulb: { color: "#ffcf8a", i: 1.7, dist: 5 },
  "lamp-post": { color: "#ffb05c", i: 9, dist: 16 }, string: { color: "#ffd08a", i: 2.2, dist: 6 }, spot: { color: "#fff2dc", i: 30, dist: 20 },
  "exit-sign": { color: "#4dff9a", i: 0.5, dist: 2.2 }, lantern: { color: "#ffb45e", i: 1.6, dist: 5 }, fire: { color: "#ff8a3a", i: 3.2, dist: 7 }, screen: { color: "#8fb8ff", i: 0.7, dist: 2.5 },
};
const flick = (t: number, seed: number) => { const a = Math.sin(t * 13.1 + seed) + Math.sin(t * 7.7 + seed * 2) + Math.sin(t * 2.3 + seed * 3); return a > 1.6 ? 0.15 : a > 1.2 ? 0.6 : 1; };
export const fixtureLevel = (f: FixtureSpec, s: SetState, t: number) => (f.prop ? s[f.prop] ?? 1 : 1) * (f.flicker ? flick(t, f.at[0] * 3 + f.at[2]) : 1);

// ── the builder ──────────────────────────────────────────────────────────────

export const buildWorld = (spec: WorldSpec, objectList: ObjectSpec[] = []): { data: WorldData; built: Built } => {
  const objects: Record<string, ObjectSpec> = Object.fromEntries(objectList.map((o) => [o.id, o]));
  const errs: string[] = [];
  const rooms = (spec.rooms ?? []).map((r) => ({ ...r, y: r.y ?? 0, height: r.height ?? 2.9 }));
  const roomById = Object.fromEntries(rooms.map((r) => [r.id, r]));
  // terrain
  const g = spec.ground;
  // under (and just around) a room the terrain sinks below its floor: never coplanar (flicker) or poking through
  const ground = g ? (x: number, z: number) => {
    const v = (g.y ?? 0) + (g.hills ?? 0) * fbm(x * 0.035 + (g.seed ?? 3), z * 0.035, 4) * 4;
    for (const r of rooms) if (x > r.rect[0] - 0.4 && x < r.rect[2] + 0.4 && z > r.rect[1] - 0.4 && z < r.rect[3] + 0.4) return Math.min(v, r.y - 0.03);
    return v;
  } : undefined;
  // paths flatten the terrain a little: compute height as is (characters follow it)
  const floorAt = (x: number, z: number) => {
    for (const r of rooms) if (x >= r.rect[0] - 0.01 && x <= r.rect[2] + 0.01 && z >= r.rect[1] - 0.01 && z <= r.rect[3] + 0.01) return r.y;
    return ground ? ground(x, z) : 0;
  };
  // openings
  const openings: Opening[] = [];
  for (const r of rooms) for (const o of r.openings ?? []) {
    const [x0, z0, x1, z1] = r.rect;
    const axis: "x" | "z" = o.wall === "north" || o.wall === "south" ? "x" : "z";
    const wallC = o.wall === "north" ? z0 : o.wall === "south" ? z1 : o.wall === "west" ? x0 : x1;
    const w = o.w ?? (o.type === "double-door" ? 1.5 : o.type === "window" ? 1.2 : o.type === "arch" ? 1.4 : 0.95);
    const h = o.h ?? (o.type === "window" ? 1.1 : 2.1);
    const sill = o.type === "window" ? o.sill ?? 0.95 : 0;
    const slug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const kindName = o.type === "window" ? "jendela" : o.type === "arch" ? "lengkung" : "pintu";
    let id = o.id ?? (o.sign ? `${kindName}-${slug(o.sign)}` : `${kindName}-${r.id}-${o.wall}`);
    while (openings.some((q) => q.id === id)) id += "-2";
    openings.push({ ...o, room: r.id, x: axis === "x" ? o.at : wallC, z: axis === "x" ? wallC : o.at, y: r.y, w, h, sill, axis, wallC, id });
  }
  // objects
  const inRoomXZ = (x: number, z: number) => rooms.some((r) => x >= r.rect[0] && x <= r.rect[2] && z >= r.rect[1] && z <= r.rect[3]);
  const insts: Inst[] = [];
  const surfaceOf = (ref: string) => {
    const [oid, anchor = "top"] = ref.split(":");
    const host = insts.find((i) => i.id === oid);
    if (!host) { errs.push(`object placed "on": "${ref}" but "${oid}" is not defined before it`); return undefined; }
    const a = host.info.anchors[anchor] ?? [0, host.info.bounds[1], 0];
    return toWorld(host.pos, host.yaw, host.scale, a);
  };
  (spec.objects ?? []).forEach((u: ObjectUse, k) => {
    let info: ObjInfo;
    try { info = objectInfo(u.use, objects); } catch (e) { errs.push((e as Error).message); return; }
    const yaw = u.yaw ?? 0, scale = u.scale ?? 1;
    let pos: V3;
    if (u.on) { const s = surfaceOf(u.on); pos = s ? [u.at.length === 3 ? s[0] + (u.at as V3)[0] : s[0] + u.at[0], s[1], u.at.length === 3 ? s[2] + (u.at as V3)[2] : s[2] + (u.at as V2)[1]] : [0, 0, 0]; }
    else if (u.at.length === 3) { const a3 = u.at as V3; pos = inRoomXZ(a3[0], a3[2]) || !ground ? a3 : [a3[0], ground(a3[0], a3[2]) + a3[1], a3[2]]; }
    else pos = [u.at[0], floorAt(u.at[0], u.at[1]), u.at[1]];
    const id = u.id ?? `${u.use}-${k + 1}`;
    insts.push({ id, use: u.use, pos, yaw, scale, info, variant: u.variant, color: u.color, states: { ...info.states, ...(u.states ?? {}) }, box: placedBox(info, pos, yaw, scale), parts: partBoxes(u.use, objects, pos, yaw, scale) });
  });
  // paths
  const paths = spec.paths ?? [];
  const nearPath = (x: number, z: number, m: number) => paths.some((p) => { for (let i = 1; i < p.points.length; i++) { const [ax, az] = p.points[i - 1], [bx, bz] = p.points[i]; const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1, k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)); if (Math.hypot(x - ax - dx * k, z - az - dz * k) < (p.width ?? 1.2) / 2 + m) return true; } return false; });
  const inRoom = (x: number, z: number, m = 0) => rooms.some((r) => x > r.rect[0] - m && x < r.rect[2] + m && z > r.rect[1] - m && z < r.rect[3] + m);
  // scatter
  const scatter = (spec.scatter ?? []).map((sc: ScatterSpec, k) => {
    let info: ObjInfo;
    try { info = objectInfo(sc.use, objects); } catch (e) { errs.push((e as Error).message); return null; }
    const r = rng(1000 + (sc.seed ?? k * 77)), items: { pos: V3; yaw: number; scale: number }[] = [];
    const [ax0, az0, ax1, az1] = sc.area, minD = sc.minDist ?? Math.max(info.bounds[0], info.bounds[2]) * 0.8;
    for (let tries = 0; items.length < sc.count && tries < sc.count * 40; tries++) {
      const x = ax0 + r() * (ax1 - ax0), z = az0 + r() * (az1 - az0);
      const av = sc.avoid ?? ["paths", "rooms", "objects"];
      // trees keep only their trunk off the path (crowns may overhang it, like a real forest track)
      if (av.includes("paths") && nearPath(x, z, sc.use.startsWith("tree") ? 1.3 : Math.max(info.bounds[0], info.bounds[2]) / 2 + 0.3)) continue;
      if (av.includes("rooms") && inRoom(x, z, 0.5)) continue;
      if (av.includes("objects") && insts.some((i) => x > i.box.min[0] - 0.6 && x < i.box.max[0] + 0.6 && z > i.box.min[2] - 0.6 && z < i.box.max[2] + 0.6)) continue;
      if (items.some((q) => Math.hypot(q.pos[0] - x, q.pos[2] - z) < minD)) continue;
      const s = (sc.scale?.[0] ?? 0.8) + r() * ((sc.scale?.[1] ?? 1.2) - (sc.scale?.[0] ?? 0.8));
      items.push({ pos: [x, floorAt(x, z) - 0.02, z], yaw: r() * Math.PI * 2, scale: s });
    }
    return { use: sc.use, info, items, variant: sc.variant };
  }).filter((x): x is NonNullable<typeof x> => !!x);
  // fixtures
  // outdoors (not inside a room) a fixture's y is its height above the ground
  const lift = (p: V3): V3 => (ground && !inRoomXZ(p[0], p[2]) ? [p[0], ground(p[0], p[2]) + p[1], p[2]] : p);
  // a lamp post given at its foot (y < 1.5) gets its head at the post height
  const head = (f: FixtureSpec): V3 => (f.type === "lamp-post" && f.at[1] < 1.5 ? [f.at[0], f.at[1] + 4.2, f.at[2]] : f.at);
  const fixtures = (spec.lights ?? []).map((f, i) => ({ ...f, at: lift(head(f)), to: f.to ? lift(f.to) : undefined, target: f.target ? lift(f.target) : undefined, id: f.id ?? `${f.type}-${i + 1}` }));
  // world bounds
  let wb: Box3 = { min: [-5, -1, -5], max: [5, 4, 5] };
  if (rooms.length) wb = rooms.map((r) => ({ min: [r.rect[0], r.y, r.rect[1]] as V3, max: [r.rect[2], r.y + r.height, r.rect[3]] as V3 })).reduce(union);
  if (g) wb = union(wb, { min: [-g.size / 2, -2, -g.size / 2], max: [g.size / 2, 20, g.size / 2] });
  // ── navigation grid: walkable floor minus solids ───────────────────────────
  const cell = 0.2, R = 0.28;
  const nx0 = Math.floor(wb.min[0]) - 1, nz0 = Math.floor(wb.min[2]) - 1;
  const nx = Math.ceil((wb.max[0] - nx0 + 1) / cell), nz = Math.ceil((wb.max[2] - nz0 + 1) / cell);
  const free = new Uint8Array(nx * nz);
  // per-part boxes that reach body height block walking (a stall's canopy or a hanging lamp does not)
  const solidsXZ = insts.filter((i) => !i.info.walkable && i.box.max[1] - i.box.min[1] > 0.12).flatMap((i) => {
    const fl0 = i.pos[1];
    const ps = (i.parts.length ? i.parts : [i.box]).filter((b) => b.min[1] < fl0 + 1.7 && b.max[1] > fl0 + 0.12);
    return ps.length ? ps : [];
  });
  // trees block with their trunk only; walkable undergrowth (ferns, grass) does not block
  const scatterSolids = scatter.filter((s) => !s.info.walkable).flatMap((s) => s.items.map((it): Box3 => {
    if (!s.use.startsWith("tree")) return placedBox(s.info, it.pos, it.yaw, it.scale);
    const r = 0.3 * it.scale;
    return { min: [it.pos[0] - r, it.pos[1], it.pos[2] - r], max: [it.pos[0] + r, it.pos[1] + 4.5 * it.scale, it.pos[2] + r] };
  }));
  const bld = (spec.buildings ?? []).map((b) => b.rect);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = nx0 + (i + 0.5) * cell, z = nz0 + (j + 0.5) * cell;
    let ok = false;
    if (rooms.length) {
      for (const r of rooms) if (x > r.rect[0] + R && x < r.rect[2] - R && z > r.rect[1] + R && z < r.rect[3] - R) ok = true;
      // doorways connect rooms
      for (const o of openings) if (o.type !== "window" && (o.axis === "x" ? Math.abs(z - o.wallC) < 0.5 && Math.abs(x - o.x) < o.w / 2 - 0.12 : Math.abs(x - o.wallC) < 0.5 && Math.abs(z - o.z) < o.w / 2 - 0.12)) ok = true;
    }
    if (g && !inRoom(x, z, 0.3)) ok = Math.abs(x) < g.size / 2 - 1 && Math.abs(z) < g.size / 2 - 1;
    if (ok && bld.some((b) => x > b[0] - R && x < b[2] + R && z > b[1] - R && z < b[3] + R)) ok = false;
    if (ok && solidsXZ.some((b) => x > b.min[0] - R && x < b.max[0] + R && z > b.min[2] - R && z < b.max[2] + R)) ok = false;
    if (ok && scatterSolids.some((b) => x > b.min[0] - R * 0.6 && x < b.max[0] + R * 0.6 && z > b.min[2] - R * 0.6 && z < b.max[2] + R * 0.6)) ok = false;
    free[j * nx + i] = ok ? 1 : 0;
  }
  const nav: Nav = { x0: nx0, z0: nz0, cell, nx, nz, free, floor: floorAt };
  const built: Built = { spec, rooms, openings, insts, scatter, fixtures, ground, bounds: wb, nav, objects };

  // ── places ──────────────────────────────────────────────────────────────────
  const places: Record<string, Place> = {};
  for (const [pid, ps] of Object.entries(spec.places)) {
    const pr = (ps.rooms ?? []).map((r) => roomById[r]).filter(Boolean);
    let area = ps.area;
    if (!area && pr.length) area = [Math.min(...pr.map((r) => r.rect[0])), Math.min(...pr.map((r) => r.rect[1])), Math.max(...pr.map((r) => r.rect[2])), Math.max(...pr.map((r) => r.rect[3]))];
    if (!area) area = [wb.min[0], wb.min[2], wb.max[0], wb.max[2]];
    const kind = ps.kind ?? (pr.length ? "interior" : "exterior");
    const inArea = (x: number, z: number, m = 0) => x >= area![0] - m && x <= area![2] + m && z >= area![1] - m && z <= area![3] + m;
    const fl = (x: number, z: number) => floorAt(x, z);
    // marks: explicit + automatic (object anchors, doors, room centres)
    const marks: Record<string, Mark> = {};
    for (const r of pr.length ? pr : rooms.filter((r) => inArea((r.rect[0] + r.rect[2]) / 2, (r.rect[1] + r.rect[3]) / 2))) marks[`${r.id}:center`] = { p: [(r.rect[0] + r.rect[2]) / 2, (r.rect[1] + r.rect[3]) / 2], y: r.y, doc: `middle of ${r.id}` };
    for (const o of openings) {
      if (o.type === "window" || !inArea(o.x, o.z, 1)) continue;
      const r = roomById[o.room];
      const inward = o.wall === "north" ? [0, 1] : o.wall === "south" ? [0, -1] : o.wall === "west" ? [1, 0] : [-1, 0];
      const facing = Math.atan2(-inward[0], -inward[1]);
      marks[`${o.id}:in`] = { p: [o.x + inward[0] * 0.75, o.z + inward[1] * 0.75], y: r.y, yaw: facing, doc: `inside ${o.room}, facing ${o.id}` };
      marks[`${o.id}:out`] = { p: [o.x - inward[0] * 0.75, o.z - inward[1] * 0.75], y: r.y, yaw: facing + Math.PI, doc: `outside ${o.room} at ${o.id}, facing it` };
    }
    for (const i of insts) {
      if (!inArea(i.pos[0], i.pos[2], 0.5)) continue;
      const a = i.info.anchors;
      const frontLocal: V3 = a.front ?? [0, 0, i.info.bounds[2] / 2 * (i.info.center[2] >= 0 ? 1 : 1) + 0.55];
      const fw = toWorld(i.pos, i.yaw, i.scale, frontLocal);
      marks[`${i.id}:front`] = { p: [fw[0], fw[2]], y: fl(fw[0], fw[2]), yaw: i.yaw + Math.PI, doc: `in front of ${i.id}, facing it` };
      if (a.seat) { const sw = toWorld(i.pos, i.yaw, i.scale, a.seat); marks[`${i.id}:seat`] = { p: [sw[0], sw[2]], y: fl(sw[0], sw[2]), yaw: i.yaw, seat: sw[1] - fl(sw[0], sw[2]), doc: `sitting on ${i.id}` }; }
      if (a.push) { const pw = toWorld(i.pos, i.yaw, i.scale, [a.push[0], 0, a.push[2] - 0.38]); marks[`${i.id}:push`] = { p: [pw[0], pw[2]], y: fl(pw[0], pw[2]), yaw: i.yaw, doc: `behind ${i.id}, hands on its handles` }; }
      // a bed (anchors "bed" = mattress top centre, "head" = pillow end): lie / sleep / wake / sitUp there
      if (a.bed) { const bw = toWorld(i.pos, i.yaw, i.scale, a.bed), hw = toWorld(i.pos, i.yaw, i.scale, a.head ?? [a.bed[0], a.bed[1], a.bed[2] - 0.8]); marks[`${i.id}:bed`] = { p: [bw[0], bw[2]], y: fl(bw[0], bw[2]), yaw: i.yaw, bed: { head: [hw[0], hw[2]], y: bw[1] }, doc: `lying in ${i.id}` }; }
      if (a.behind) { const bw = toWorld(i.pos, i.yaw, i.scale, a.behind); marks[`${i.id}:behind`] = { p: [bw[0], bw[2]], y: fl(bw[0], bw[2]), yaw: i.yaw, doc: `behind ${i.id} (the seller's side), facing over it` }; }
    }
    for (const [k, m] of Object.entries(ps.marks ?? {})) {
      const y = m.at.length === 3 ? (m.at as V3)[1] : fl(m.at[0], (m.at as V2)[1]);
      const p: [number, number] = m.at.length === 3 ? [(m.at as V3)[0], (m.at as V3)[2]] : [m.at[0], (m.at as V2)[1]];
      marks[k] = { p, y, yaw: m.yaw, seat: m.seat, bed: m.bed ? { head: m.bed.head, y: m.bed.y } : undefined, doc: m.doc };
    }
    // POIs: explicit + objects, openings, fixtures
    const pois: Record<string, V3> = {};
    for (const i of insts) if (inArea(i.pos[0], i.pos[2], 2)) pois[i.id] = [i.pos[0], i.box.max[1] - (i.box.max[1] - i.box.min[1]) * 0.35, i.pos[2]];
    for (const o of openings) if (inArea(o.x, o.z, 2)) pois[o.id] = [o.x, o.y + o.sill + o.h * 0.55, o.z];
    for (const f of fixtures) if (inArea(f.at[0], f.at[2], 2)) pois[f.id] = f.at;
    Object.assign(pois, ps.pois ?? {});
    // camera space and solids
    const yTop = pr.length ? Math.max(...pr.map((r) => r.y + r.height)) - 0.2 : 40;
    const yBot = pr.length ? Math.min(...pr.map((r) => r.y)) + 0.3 : (ground ? -5 : 0.3);
    const m = kind === "interior" ? -0.25 : 25;
    const solids = insts.filter((i) => !i.info.walkable && inArea(i.pos[0], i.pos[2], 8)).flatMap((i) => (i.parts.length ? i.parts : [i.box]));
    for (const b of spec.buildings ?? []) solids.push({ min: [b.rect[0], (b.y ?? 0) - 1, b.rect[1]], max: [b.rect[2], (b.y ?? 0) + b.height, b.rect[3]] });
    // seen from outside, a closed room is a building: cameras of an exterior place stay out of it
    if (kind === "exterior") for (const r of rooms) if (!pr.includes(r) && !(r.open?.length)) solids.push({ min: [r.rect[0] - 0.1, r.y - 0.5, r.rect[1] - 0.1], max: [r.rect[2] + 0.1, r.y + r.height + 0.3, r.rect[3] + 0.1] });
    for (const s of scatter) for (const it of s.items) {
      if (!inArea(it.pos[0], it.pos[2], 15) || s.info.bounds[1] <= 1.2) continue;
      // trees: the trunk blocks (crowns are above the action); other tall things: their box
      if (s.use.startsWith("tree")) { const r = 0.3 * it.scale; solids.push({ min: [it.pos[0] - r, it.pos[1], it.pos[2] - r], max: [it.pos[0] + r, it.pos[1] + 4.5 * it.scale, it.pos[2] + r] }); }
      else solids.push(placedBox(s.info, it.pos, it.yaw, it.scale));
    }
    // foliage the camera must not sit in (tree crowns, bushes) — scatter and placed built-ins
    const crownBox = (use: string, pos: V3, yaw: number, scale: number): Box3 | null => {
      const c = BUILTIN[use]?.crown;
      if (!c) return null;
      const lo: V3 = [Infinity, pos[1] + c[0][1] * scale, Infinity], hi: V3 = [-Infinity, pos[1] + c[1][1] * scale, -Infinity];
      for (const x of [c[0][0], c[1][0]]) for (const z of [c[0][2], c[1][2]]) { const w = toWorld(pos, yaw, scale, [x, 0, z]); lo[0] = Math.min(lo[0], w[0]); hi[0] = Math.max(hi[0], w[0]); lo[2] = Math.min(lo[2], w[2]); hi[2] = Math.max(hi[2], w[2]); }
      return { min: lo, max: hi };
    };
    const soft: Box3[] = [];
    for (const sc of scatter) for (const it of sc.items) if (inArea(it.pos[0], it.pos[2], 20)) { const b = crownBox(sc.use, it.pos, it.yaw, it.scale); if (b) soft.push(b); }
    for (const i of insts) if (inArea(i.pos[0], i.pos[2], 20)) { const b = crownBox(i.use, i.pos, i.yaw, i.scale); if (b) soft.push(b); }
    const cx = (area[0] + area[2]) / 2, cz = (area[1] + area[3]) / 2, rad = Math.max(area[2] - area[0], area[3] - area[1]) / 2;
    const est = ps.establish;
    const firstMark = Object.values(marks)[0];
    places[pid] = {
      id: pid, doc: ps.doc, kind, floor: fl(cx, cz), marks, pois,
      box: { min: [area[0] - m, yBot, area[1] - m], max: [area[2] + m, yTop, area[3] + m] },
      zones: kind === "interior" && pr.length ? pr.map((r) => ({ min: [r.rect[0] + 0.25, r.y + 0.3, r.rect[1] + 0.25] as V3, max: [r.rect[2] - 0.25, r.y + r.height - 0.2, r.rect[3] - 0.25] as V3 })) : undefined,
      solids, soft, ground: ground && kind === "exterior" ? ground : undefined,
      establish: est ? { center: [est[0], est[1], est[2]], radius: est[3], height: est[4], yaw: est[5] } : { center: [cx, fl(cx, cz) + 1.2, cz], radius: kind === "interior" ? Math.min(rad, 4) : Math.max(8, rad * 0.9), height: kind === "interior" ? 1.0 : Math.max(4, rad * 0.4), yaw: 0.7 },
      view: ps.view ?? Object.keys(pois)[0] ?? "",
      window: undefined,
      ambience: ps.ambience ?? (kind === "interior" ? "room" : "outdoor"), surface: (ps.surface ?? (kind === "interior" ? "tile" : "grass")) as Place["surface"], reverb: kind === "interior" ? 0.35 : 0.05,
    };
    void firstMark;
  }

  // wall pieces (full height, between openings) block the view: line-of-sight checks for cameras
  const occl: Box3[] = [];
  for (const r of rooms) {
    const [x0, z0, x1, z1] = r.rect, Tw = 0.15;
    const sides = [{ s: "north", ax: "x", c: z0 - Tw / 2, a0: x0, a1: x1 }, { s: "south", ax: "x", c: z1 + Tw / 2, a0: x0, a1: x1 }, { s: "west", ax: "z", c: x0 - Tw / 2, a0: z0, a1: z1 }, { s: "east", ax: "z", c: x1 + Tw / 2, a0: z0, a1: z1 }] as const;
    for (const w of sides) {
      if (r.open?.includes(w.s)) continue;
      const holes = openings.filter((o) => o.axis === w.ax && Math.abs(o.wallC - (w.ax === "x" ? (w.s === "north" ? z0 : z1) : (w.s === "west" ? x0 : x1))) < 0.05 && o.type !== "window").map((o) => [(w.ax === "x" ? o.x : o.z) - o.w / 2, (w.ax === "x" ? o.x : o.z) + o.w / 2]).sort((a, b) => a[0] - b[0]);
      let cur: number = w.a0;
      const piece = (a: number, b: number) => { if (b - a > 0.2) occl.push(w.ax === "x" ? { min: [a, r.y, w.c - Tw / 2], max: [b, r.y + r.height, w.c + Tw / 2] } : { min: [w.c - Tw / 2, r.y, a], max: [w.c + Tw / 2, r.y + r.height, b] }); };
      for (const [a, b] of holes) { piece(cur, a); cur = Math.max(cur, b); }
      piece(cur, w.a1);
    }
  }
  for (const P of Object.values(places)) P.occluders = occl;
  // the swing of every door leaf: cameras stay out of it (an open leaf would fill the frame)
  const swings: Box3[] = openings.filter((o) => o.type === "door" || o.type === "double-door").map((o) => {
    const into = o.wall === "north" || o.wall === "west" ? 1 : -1, sw = (o.swing ?? 1) * into;
    const lw = o.type === "double-door" ? o.w / 2 : o.w, d0 = Math.min(0, sw * lw), d1 = Math.max(0, sw * lw);
    return o.axis === "x" ? { min: [o.x - o.w / 2, o.y, o.z + d0], max: [o.x + o.w / 2, o.y + o.h, o.z + d1] } : { min: [o.x + d0, o.y, o.z - o.w / 2], max: [o.x + d1, o.y + o.h, o.z + o.w / 2] };
  });
  for (const P of Object.values(places)) P.swings = swings;

  // ── light rig per place ─────────────────────────────────────────────────────
  const light = (place: string, time: string, s: SetState, t: number): LightState => {
    const P = places[place];
    const Tl = TIMES[time] ?? TIMES.night;
    const interior = P?.kind === "interior";
    const c: V3 = P ? [(P.box.min[0] + P.box.max[0]) / 2, 1.5, (P.box.min[2] + P.box.max[2]) / 2] : [0, 1.5, 0];
    const near = fixtures.filter((f) => f.type !== "spot").map((f) => ({ f, d: Math.hypot(f.at[0] - c[0], f.at[2] - c[2]) })).sort((a, b) => a.d - b.d).slice(0, 5);
    const pts: PointL[] = near.map(({ f }) => {
      const k = FIX[f.type], lv = fixtureLevel(f, s, t) * (f.i ?? 1);
      const pos: V3 = f.type === "string" && f.to ? [(f.at[0] + f.to[0]) / 2, (f.at[1] + f.to[1]) / 2 - 0.2, (f.at[2] + f.to[2]) / 2] : f.type === "panel" || f.type === "tube" ? [f.at[0], f.at[1] - 0.5, f.at[2]] : f.at;
      return { pos, color: f.color ?? k.color, i: k.i * lv * (Tl.dark > 0.3 || interior ? 1 : 0.3), dist: k.dist };
    });
    while (pts.length < 5) pts.push(P_OFF);
    // a soft fill so night interiors never crush
    pts.push({ pos: [c[0], (P?.box.max[1] ?? 3) - 0.3, c[2]], color: interior ? "#8aa0c0" : Tl.hemiSky, i: interior ? 0.35 : 0.5, dist: interior ? 7 : 20 });
    const spotF = fixtures.find((f) => f.type === "spot");
    const spot0: SpotL = spotF ? { pos: spotF.at, target: spotF.target ?? [spotF.at[0], 0, spotF.at[2]], color: spotF.color ?? FIX.spot.color, i: FIX.spot.i * fixtureLevel(spotF, s, t) * (spotF.i ?? 1), angle: 0.6, penumbra: 0.6, dist: 20 } : S_OFF;
    const box = P ? { min: [P.box.min[0] - 2, P.box.min[1] - 1, P.box.min[2] - 2] as V3, max: [P.box.max[0] + 2, Math.min(P.box.max[1], (interior ? 4 : 18)), P.box.max[2] + 2] as V3 } : wb;
    const fog = spec.fog ?? (interior ? 0.1 : 0.3);
    return {
      bg: Tl.bg, fog: { color: Tl.fog, density: interior ? 0.006 + 0.01 * fog : 0.004 + 0.02 * fog }, env: Tl.env * (interior ? 0.5 : 1) + 0.02,
      hemi: { sky: interior ? spec.ambient ?? "#9aa8c0" : Tl.hemiSky, ground: Tl.hemiGround, i: interior ? 0.36 + Tl.hemi * 0.25 : Tl.hemi },
      moon: { dir: spec.sky?.sun ?? Tl.dir, color: Tl.key, i: Tl.keyI * (interior ? 0.8 : 1), box },
      spots: [spot0, S_OFF],
      pts: pts.slice(0, 6) as LightState["pts"],
    };
  };

  const props: Record<string, PropDoc> = {};
  for (const [k, p] of Object.entries(spec.props ?? {})) props[k] = { default: p.default, doc: p.doc, sfx: p.sfx ?? (p.door ? { up: "door-open", down: "door-close" } : p.lights ? { up: "click", down: "click" } : undefined) };
  // every door gets an open prop automatically: "<door id>" 0..1
  for (const o of openings) if ((o.type === "door" || o.type === "double-door") && !props[o.id]) props[o.id] = { default: 0, doc: `${o.id} (0 shut, 1 open)`, sfx: { up: "door-open", down: "door-close" } };
  for (const i of insts) for (const [k, v] of Object.entries(i.states)) props[`${i.id}.${k}`] = { default: v, doc: `${i.id} ${k} (0..1)` };
  // every object can appear / leave on a beat: "set": { "<id>.visible": 0 } (start hidden: "states": { "visible": 0 })
  for (const i of insts) if (!props[`${i.id}.visible`]) props[`${i.id}.visible`] = { default: 1, doc: `${i.id} on screen (1) or gone (0)` };
  for (const f of fixtures) if (f.prop && !props[f.prop]) props[f.prop] = { default: 1, doc: `lights ${f.prop} (0 off, 1 on)`, sfx: { up: "click", down: "click" } };
  if (errs.length) throw new Error(errs.join("\n"));
  const data: WorldData = { id: spec.id, doc: spec.doc, places, times: spec.times, props, light };
  return { data, built };
};

// ── navigation ───────────────────────────────────────────────────────────────

/** A* on the walk grid from a to b, then string-pulled to a few waypoints. Falls back to the straight line. */
export const navPath = (nav: Nav, a: V2, b: V2): V2[] => {
  const { x0, z0, cell, nx, nz, free } = nav;
  const ci = (x: number) => Math.max(0, Math.min(nx - 1, Math.floor((x - x0) / cell))), cj = (z: number) => Math.max(0, Math.min(nz - 1, Math.floor((z - z0) / cell)));
  const nearestFree = (i: number, j: number) => {
    if (free[j * nx + i]) return [i, j];
    for (let r = 1; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && free[jj * nx + ii]) return [ii, jj]; }
    return [i, j];
  };
  const [si, sj] = nearestFree(ci(a[0]), cj(a[1])), [ti, tj] = nearestFree(ci(b[0]), cj(b[1]));
  const N = nx * nz, g = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), open: number[] = [];
  const h = (k: number) => Math.hypot((k % nx) - ti, Math.floor(k / nx) - tj);
  const start = sj * nx + si, goal = tj * nx + ti;
  g[start] = 0; open.push(start);
  const f = new Float32Array(N).fill(Infinity); f[start] = h(start);
  const closed = new Uint8Array(N);
  let found = false, iter = 0;
  while (open.length && iter++ < 200000) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (f[open[k]] < f[open[bi]]) bi = k;
    const cur = open.splice(bi, 1)[0];
    if (cur === goal) { found = true; break; }
    closed[cur] = 1;
    const cx = cur % nx, cz = Math.floor(cur / nx);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = cx + dx, z = cz + dz;
      if (x < 0 || z < 0 || x >= nx || z >= nz) continue;
      const k = z * nx + x;
      if (!free[k] || closed[k]) continue;
      if (dx && dz && (!free[cz * nx + x] || !free[z * nx + cx])) continue;
      const ng = g[cur] + (dx && dz ? 1.414 : 1);
      if (ng < g[k]) { g[k] = ng; f[k] = ng + h(k); came[k] = cur; if (!open.includes(k)) open.push(k); }
    }
  }
  if (!found) return [a, b];
  const cells: V2[] = [];
  for (let k = goal; k !== -1; k = came[k]) cells.push([x0 + ((k % nx) + 0.5) * cell, z0 + (Math.floor(k / nx) + 0.5) * cell]);
  cells.reverse();
  // string pulling: keep a waypoint only where the straight line would cross a blocked cell
  const clear = (p: V2, q: V2) => { const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) / (cell * 0.5)); for (let s = 0; s <= n; s++) { const x = p[0] + ((q[0] - p[0]) * s) / Math.max(1, n), z = p[1] + ((q[1] - p[1]) * s) / Math.max(1, n); if (!free[cj(z) * nx + ci(x)]) return false; } return true; };
  const out: V2[] = [a];
  let anchor: V2 = a;
  for (let k = 1; k < cells.length; k++) if (!clear(anchor, cells[k])) { out.push(cells[k - 1]); anchor = cells[k - 1]; }
  out.push(b);
  return out;
};
