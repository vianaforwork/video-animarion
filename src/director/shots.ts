// Camera library. Every shot type is a function (context, film time) → Cam, computed from the people's
// performance and the place (POIs, establish hint, camera-safe box). Hand-held drift scales with the
// mood; positions are clamped legal (inside the place, out of walls); depth of field focuses on the
// shot's subject automatically.
// Portrait (9:16) has its own framings — not a crop of the landscape ones: subjects stay centred, eyes on
// the upper third, the frame is sized by how much of a person it should hold (face, waist-up, full figure),
// over-the-shoulder and two-shots are staggered in depth instead of side by side. Before a shot is used,
// every candidate framing is scored for: the lens pushed by walls, the view to the subject / target blocked,
// the subject outside the frame, and near surfaces (a wall at the lens) covering the picture.

import type { Cam } from "../cine/types.ts";
import { legalCam, type Place, type V3 } from "../worlds/types.ts";
import type { Mood, ShotName } from "./story.ts";

export type Subject = {
  /** root on the floor, smoothed over ±0.3 s (no walk bob) */
  pos: (t: number) => V3;
  head: (t: number) => V3;
  yaw: (t: number) => number;
  eye: (t: number) => { pos: V3; dir: V3 };
  hand: (t: number) => V3;
  /** where a raised phone is held */
  phone?: (t: number) => V3;
};

export type ShotCtx = {
  kind: ShotName;
  t0: number;
  t1: number;
  place: Place;
  subj?: Subject;
  subj2?: Subject;
  /** the thing looked at / shown */
  target?: (t: number) => V3;
  /** other people in the scene (they must not block the lens) */
  others?: (t: number) => V3[];
  side: 1 | -1;
  mood: Mood;
  fov?: number;
  seed: number;
  /** inserts: size (m) of the object handled — the camera stands back for big things */
  size?: number;
  /** frame width / height: 9 / 16 portrait (default), 16 / 9 landscape */
  aspect?: number;
  /** the person is using a phone (inserts look over the shoulder at its screen) */
  phone?: boolean;
};

const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const mix = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const ease = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
const fwd = (yaw: number): V3 => [Math.sin(yaw), 0, Math.cos(yaw)];
const right = (yaw: number): V3 => [-Math.cos(yaw), 0, Math.sin(yaw)];
/** Moving shots (track, lead) ride on the way the person travels, not on where the body points: a turn on the spot
 *  would swing the camera round them. Local heading over ±0.6 s, blended toward the shot's overall heading while they
 *  barely move (before the first step the camera already stands behind the way they will go). */
const travelYaw = (c: ShotCtx, s: Subject, t: number, body: number): number => {
  // sample inside the shot: at t1 itself the next shot (often another place) has begun
  const end = c.t1 - 1 / 60;
  const A = s.pos(c.t0), B = s.pos(end), gx = B[0] - A[0], gz = B[2] - A[2];
  if (Math.hypot(gx, gz) < 0.4) return body; // nobody really walks in this shot
  const g = Math.atan2(gx, gz);
  const a = s.pos(Math.max(c.t0, t - 0.6)), b = s.pos(Math.min(end, t + 0.6)), lx = b[0] - a[0], lz = b[2] - a[2], ll = Math.hypot(lx, lz);
  if (ll < 0.05) return g;
  let d = Math.atan2(lx, lz) - g;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return g + d * Math.min(1, Math.max(0, (ll - 0.2) / 0.5));
};
/** Where the face looks, steadied over ±0.3 s: a shiver, a nod or a saccade must not swing the camera that frames the
 *  face (it read as camera shake at the speed of the tremble). */
/** t moved inside the shot by the 0.3 s half-width of the steadying windows (the middle for a very short shot). */
const inShot = (c: ShotCtx, t: number) => {
  const a = c.t0 + 0.3, b = c.t1 - 0.3 - 1 / 60;
  return a <= b ? Math.min(b, Math.max(a, t)) : (c.t0 + c.t1) / 2;
};
const eyeMemo = new WeakMap<Subject, Map<number, V3>>();
const eyeAt = (s: Subject, t: number): V3 => {
  // samples on a 1/60 s grid, kept per person: the framing search asks for the same moments again and again
  const k = Math.round(t * 60);
  let m = eyeMemo.get(s);
  if (!m) eyeMemo.set(s, (m = new Map()));
  let v = m.get(k);
  if (!v) m.set(k, (v = s.eye(k / 60).dir));
  return v;
};
const eyeDir = (s: Subject, t: number): V3 => {
  let x = 0, y = 0, z = 0;
  for (let i = -6; i <= 6; i++) { const e = eyeAt(s, t + i * 0.05); x += e[0]; y += e[1]; z += e[2]; }
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};
const n1 = (t: number, s: number) => Math.sin(t * 1.31 + s) * 0.6 + Math.sin(t * 2.17 + s * 1.7) * 0.3 + Math.sin(t * 3.71 + s * 2.3) * 0.1;

export const SHAKE: Record<Mood, number> = { mystery: 0.32, tense: 0.5, told: 0.2, memory: 0.15, calm: 0.12, reveal: 0.1, science: 0.04, warm: 0.1, cctv: 0 };
const SHAKE_K: Partial<Record<ShotName, number>> = { pov: 1.7, track: 1.3, lead: 1.2, establish: 0.25, drone: 0.2, map: 0.1, long: 0.9, insert: 0.6, cu: 0.8, ecu: 0.6, orbit: 0.3 };
const APERTURE: Partial<Record<ShotName, number>> = { cu: 0.012, ecu: 0.016, insert: 0.012, medium: 0.006, ots: 0.007, profile: 0.006, push: 0.006, lead: 0.004, track: 0.003, low: 0.004, twoShot: 0.004 };

type Rig = { pos: V3; target: V3; fov: number; focus?: V3; free?: boolean };
const isPortrait = (c: ShotCtx) => (c.aspect ?? 16 / 9) < 1;
/** a vertical FOV (deg) that holds `h` metres at distance `d` */
const fovFor = (h: number, d: number) => (2 * Math.atan2(h / 2, Math.max(0.05, d)) * 180) / Math.PI;

const rig = (c: ShotCtx, t: number, rot = 0, dk = 1, from?: V3): Rig => {
  // an insert of something out of reach is really a long-lens shot of it
  if (c.kind === "insert" && c.subj && c.target && len(sub(c.target(t), c.subj.head(t))) > 1.6) return rig({ ...c, kind: "long" }, t, rot, dk, from);
  // a far target the subject cannot see from here: shoot it from a clear vantage point instead
  if (from && c.target && (c.kind === "long" || c.kind === "ots" || c.kind === "reveal")) {
    const look = c.target(t), d = len(sub(look, from));
    return { pos: from, target: look, fov: c.fov ?? Math.max(4, Math.min(30, (2 * Math.atan2(d > 30 ? 6 : 1.6, d) * 180) / Math.PI)), focus: look, free: true };
  }
  const u = ease((t - c.t0) / Math.max(0.01, c.t1 - c.t0));
  const s = c.subj;
  const tgt = c.target ? c.target(t) : undefined;
  const E = c.place.establish;
  const P = isPortrait(c);
  if (!s) {
    // no person in shot: frame the target or the place (rot / dk: the candidate search swings and pulls in)
    const look = tgt ?? (c.place.pois[c.place.view] as V3) ?? E.center;
    switch (c.kind) {
      case "long": case "pov": case "ots": {
        // from the establishing ring, toward the target
        const a = E.yaw + c.side * 0.15 + rot;
        const from: V3 = add(E.center, [Math.sin(a) * E.radius * dk, E.height * 0.5, Math.cos(a) * E.radius * dk]);
        const d = len(sub(look, from));
        const f = Math.max(3, Math.min(30, (2 * Math.atan2(9, d) * 180) / Math.PI));
        return { pos: from, target: look, fov: c.fov ?? (P ? (d < 3 ? 56 : Math.min(46, f * 1.6)) : f) };
      }
      case "map": return { pos: add(E.center, [0.3 * E.radius * c.side, 1.7 * E.radius, 0.6 * E.radius]), target: E.center, fov: P ? 54 : 42 };
      case "orbit": {
        const a = E.yaw + c.side * (0.4 * u - 0.2) + rot, R = E.radius * 0.7 * dk;
        return { pos: add(look, [Math.sin(a) * R, E.height * 0.5, Math.cos(a) * R]), target: look, fov: P ? 48 : 36 };
      }
      default: {
        const a = E.yaw + c.side * 0.12 * u + rot, R = E.radius * dk * (c.kind === "drone" ? 1.6 - 0.25 * u : 1.1 - 0.12 * u), H = E.height * (c.kind === "drone" ? 2.0 - 0.4 * u : 1.25 - 0.3 * u);
        return { pos: add(E.center, [Math.sin(a) * R, H, Math.cos(a) * R]), target: mix(E.center, look, 0.25), fov: c.fov ?? (P ? 56 : 38) };
      }
    }
  }
  if (P) { const pr = portraitRig(c, t, u, s, tgt, rot, dk); if (pr) return pr; }
  const p = s.pos(t), h = s.head(t);
  // faces are framed from where the face looks, bodies from where the body faces
  const faceShot = c.kind === "cu" || c.kind === "ecu" || c.kind === "medium" || c.kind === "push";
  // the ±0.3 s steadying windows stay inside this shot: a turn after the cut must not swing the camera before it
  const tin = inShot(c, t);
  const ed = eyeDir(s, tin), bodyYaw = s.yaw(tin);
  const axis = c.kind === "track" || c.kind === "lead" ? travelYaw(c, s, t, bodyYaw) : bodyYaw;
  const yaw = (faceShot && Math.hypot(ed[0], ed[2]) > 0.3 ? Math.atan2(ed[0], ed[2]) : bodyYaw) + rot, F = fwd(axis), Rt = right(axis);
  switch (c.kind) {
    case "establish": case "drone": {
      const a = E.yaw + c.side * 0.12 * u, R = E.radius * (c.kind === "drone" ? 1.6 - 0.25 * u : 1.05 - 0.15 * u), H = E.height * (c.kind === "drone" ? 2.0 - 0.4 * u : 1.2 - 0.35 * u);
      return { pos: add(E.center, [Math.sin(a) * R, H, Math.cos(a) * R]), target: mix(E.center, h, 0.45), fov: c.fov ?? 38 };
    }
    case "wide": {
      const a = yaw + c.side * 0.6, D = (c.place.kind === "interior" ? 3.4 : 6.5) * dk;
      const pos = add(add(p, fwd(a), D), [0, 1.55 + 0.1 * u, 0]);
      return { pos: add(pos, Rt, 0.25 * u * c.side), target: add(p, [0, 1.15, 0]), fov: c.fov ?? 42 };
    }
    case "mediumWide": {
      const a = yaw + c.side * 0.5;
      return { pos: add(add(p, fwd(a), (3.0 - 0.2 * u) * dk), [0, 1.35, 0]), target: add(p, [0, 0.95, 0]), fov: c.fov ?? (dk < 0.9 ? 44 : 36), focus: h };
    }
    case "medium": {
      const a = yaw + c.side * 0.42;
      return { pos: add(add(h, fwd(a), (1.75 - 0.15 * u) * dk), [0, -0.05, 0]), target: add(h, [0, -0.22, 0]), fov: c.fov ?? (dk < 0.9 ? 38 : 30), focus: h };
    }
    case "cu": {
      const a = yaw + c.side * 0.32;
      return { pos: add(add(h, fwd(a), 0.86 - 0.14 * u), [0, 0.0, 0]), target: add(h, [0, -0.02, 0]), fov: c.fov ?? 26, focus: h };
    }
    case "ecu": {
      const e = s.eye(t), a = yaw + c.side * 0.2;
      return { pos: add(add(e.pos, fwd(a), 0.42 - 0.06 * u), [0, 0.01, 0]), target: e.pos, fov: c.fov ?? 22, focus: e.pos };
    }
    case "ots": {
      const look = tgt ?? add(h, F, 6);
      const far = len(sub(look, h)) > 15;
      const back = sub(h, look);
      const bn = len(back) || 1;
      // a target well above the head (a bird in a tree, a window): drop to a low angle so the shoulder stays in frame
      const up = look[1] - h[1], low = up > 0.6;
      const pos = add(add(add(h, [back[0] / bn, 0, back[2] / bn], 1.25), Rt, 0.42 * c.side), [0, low ? 0.14 - Math.min(0.55, up * 0.25) : 0.14, 0]);
      return { pos, target: mix(look, h, far ? 0 : low ? 0.3 : 0.15), fov: c.fov ?? (far ? 30 : low ? 40 : 32), focus: look };
    }
    case "pov": {
      const e = s.eye(t), look = tgt ?? add(e.pos, e.dir, 8);
      const far = len(sub(look, e.pos)) > 15;
      return { pos: add(e.pos, F, 0.06), target: look, fov: c.fov ?? (far ? 24 : 40), focus: look };
    }
    case "long": {
      const look = tgt ?? add(h, F, 30);
      const win = c.place.window ? c.place.pois[c.place.window] : undefined;
      const through = c.place.kind === "interior" && !!win && len(sub(look, h)) > 15;
      // through a window: stand just outside the glass (a pane in front of a long lens reads as milk)
      const from = through ? add(win, sub(win, h), 0.12 / Math.max(0.3, len(sub(win, h)))) : add(add(h, Rt, 0.3 * c.side), [0, 0.05, 0]);
      const d = len(sub(look, from));
      const fov = c.fov ?? Math.max(2.5, Math.min(24, (2 * Math.atan2(d > 60 ? 9 : 3, d) * 180) / Math.PI));
      return { pos: from, target: look, fov: fov * (1 - 0.08 * u), focus: look, free: through };
    }
    case "track": {
      const pos = add(add(add(p, F, -2.3), Rt, 0.45 * c.side), [0, 1.62, 0]);
      return { pos, target: add(add(p, F, 3), [0, 1.3, 0]), fov: c.fov ?? 42, focus: h };
    }
    case "lead": {
      const pos = add(add(add(p, F, 2.6), Rt, 0.25 * c.side), [0, 1.5, 0]);
      return { pos, target: add(h, [0, -0.1, 0]), fov: c.fov ?? 34, focus: h };
    }
    case "profile": return { pos: add(add(p, right(yaw), 2.3 * c.side * dk), [0, 1.3, 0]), target: add(p, [0, 1.15, 0]), fov: c.fov ?? (dk < 0.9 ? 42 : 32), focus: h };
    case "low": return { pos: add(add(add(p, F, 1.9), Rt, 0.3 * c.side), [0, 0.42, 0]), target: add(h, [0, 0.1, 0]), fov: c.fov ?? 38, focus: h };
    case "high": return { pos: add(add(add(p, F, 1.4), Rt, 0.4 * c.side), [0, 3.3, 0]), target: add(p, [0, 0.7, 0]), fov: c.fov ?? 42, focus: h };
    case "insert": {
      // a phone in use and a thing the person looks at (not handles) are framed as in portrait: over the phone
      // hand's shoulder onto the screen; on the eye line, close to the thing's face
      if (c.phone) {
        const ph = s.phone?.(t) ?? s.hand(t);
        return { pos: add(add(add(h, F, -0.55), Rt, 0.45), [0, 0.18, 0]), target: ph, fov: c.fov ?? 26, focus: ph };
      }
      if (tgt && len(sub(tgt, s.hand(t))) > 0.45 && len(sub(tgt, h)) < 10) {
        const d = sub(tgt, h), dl = Math.hypot(d[0], d[2]) || 1, dn: V3 = [d[0] / dl, 0, d[2] / dl];
        const pos = add(add(tgt, dn, -0.75), [dn[2], 0, -dn[0]], 0.3 * c.side);
        return { pos: [pos[0], tgt[1] + 0.35, pos[2]], target: tgt, fov: c.fov ?? 30, focus: tgt };
      }
      // frame the hand AND what it handles: aim between them when the hand is near the target
      const hand = s.hand(t);
      const at = tgt && len(sub(tgt, h)) < 1.5 ? (len(sub(tgt, hand)) < 0.8 ? mix(tgt, hand, 0.45) : tgt) : hand;
      const fw = fwd(yaw);
      // from across the work, three-quarter on the working hand's side, looking down at hand + object;
      // the person is behind it, soft (the body can never cover the hand from here)
      const rt = right(yaw), hd = sub(hand, h), hs = Math.sign(hd[0] * rt[0] + hd[2] * rt[2]) || c.side;
      const sk = Math.min(2.6, Math.max(1, (c.size ?? 0) / 0.18));
      const pos = add(add(add(at, rt, 0.26 * hs * sk), fw, 0.34 * sk), [0, 0.4 * sk, 0]);
      return { pos, target: at, fov: c.fov ?? 38, focus: at };
    }
    case "orbit": {
      const look = tgt && len(sub(tgt, h)) < 6 ? mix(h, tgt, 0.5) : h;
      const a = yaw + c.side * (0.35 + 0.45 * u), R = 2.3;
      return { pos: add(look, [Math.sin(a) * R, 0.25, Math.cos(a) * R]), target: look, fov: c.fov ?? 34, focus: look };
    }
    case "push": {
      const a = yaw + c.side * 0.25;
      return { pos: add(add(h, fwd(a), 3.1 - 1.6 * u), [0, -0.05, 0]), target: add(h, [0, -0.08, 0]), fov: c.fov ?? 32, focus: h };
    }
    case "pull": {
      const a = yaw + c.side * 0.3;
      return { pos: add(add(h, fwd(a), 1.2 + 3.6 * u), [0, 0.1 + 0.8 * u, 0]), target: add(h, [0, -0.2 - 0.3 * u, 0]), fov: c.fov ?? 34, focus: h };
    }
    case "reveal": {
      const look = tgt ?? add(h, F, 10);
      const back = sub(h, look), bn = len(back) || 1;
      // from behind the shoulder, the head a third of the way in, then the view swings onto the thing
      const pos = add(add(add(h, [back[0] / bn, 0, back[2] / bn], 1.45), Rt, 0.62 * c.side), [0, 0.12, 0]);
      const k = ease((t - c.t0 - 0.4) / Math.max(0.5, (c.t1 - c.t0) * 0.6));
      return { pos, target: mix(mix(h, look, 0.3), look, k), fov: c.fov ?? 36, focus: k < 0.5 ? h : look };
    }
    case "map": return { pos: add(E.center, [0.3 * E.radius * c.side, 1.7 * E.radius, 0.6 * E.radius]), target: E.center, fov: 42 };
    case "twoShot": {
      const q = c.subj2 ? c.subj2.pos(t) : add(p, F, 1.5);
      const mid = mix(p, q, 0.5), d = sub(q, p), gap = Math.hypot(d[0], d[2]) || 1;
      const perp: V3 = [-d[2] / gap * c.side, 0, d[0] / gap * c.side];
      return { pos: add(add(mid, perp, Math.max(2.0, 1.15 * gap) * dk), [0, 1.45, 0]), target: add(mid, [0, 1.2, 0]), fov: c.fov ?? 40, focus: add(mid, [0, 1.5, 0]) };
    }
  }
  return { pos: add(h, F, 2), target: h, fov: 35 };
};

/** Portrait framings for a person (null = use the landscape one). Sizes are the frame height held at the
 *  subject (metres) — a 9:16 frame is 0.56 × as wide, so a face, a waist-up figure or a whole body fills it
 *  as it would on a phone; the aim point keeps the eyes on the upper third. */
/** Camera for a phone insert: behind / above one shoulder; k lifts and swings it out step by step. */
const phoneCam = (h: V3, F: V3, Rt: V3, k: number, side: number): V3 => add(add(add(h, F, -0.55 + 0.06 * k), Rt, (0.45 + 0.1 * k) * side), [0, 0.18 + 0.13 * k, 0]);
const PHONE_VIEW = new Map<string, { k: number; side: number }>();
/** The first lift / shoulder at which the head, neck and shoulders stay off the line to the phone (checked across the shot). */
const phoneView = (c: ShotCtx, s: Subject) => {
  const key = `${c.t0.toFixed(3)}:${c.t1.toFixed(3)}`;
  let v = PHONE_VIEW.get(key);
  if (v) return v;
  const ts = [0.25, 0.5, 0.8].map((f) => c.t0 + (c.t1 - c.t0) * f);
  const clear = (k: number, side: number) => ts.every((t) => {
    const h = s.head(t), yw = s.yaw(t), F = fwd(yw), Rt = right(yw), ph = s.phone?.(t) ?? s.hand(t), pos = legalCam(c.place, phoneCam(h, F, Rt, k, side), h);
    const neck = add(h, [0, -0.24, 0]), shoulder = add(add(h, [0, -0.34, 0]), Rt, 0.17 * side);
    return segDist(h, pos, ph) > 0.19 && segDist(neck, pos, ph) > 0.12 && segDist(shoulder, pos, ph) > 0.1;
  });
  v = { k: 5, side: 1 };
  search: for (let k = 0; k <= 5; k++) for (const side of [1, -1]) if (clear(k, side)) { v = { k, side }; break search; }
  PHONE_VIEW.set(key, v);
  return v;
};

function portraitRig(c: ShotCtx, t: number, u: number, s: Subject, tgt: V3 | undefined, rot: number, dk: number): Rig | null {
  const p = s.pos(t), h = s.head(t);
  const faceShot = c.kind === "cu" || c.kind === "ecu" || c.kind === "medium" || c.kind === "push";
  // the ±0.3 s steadying windows stay inside this shot: a turn after the cut must not swing the camera before it
  const tin = inShot(c, t);
  const ed = eyeDir(s, tin), bodyYaw = s.yaw(tin);
  const axis = c.kind === "track" || c.kind === "lead" ? travelYaw(c, s, t, bodyYaw) : bodyYaw;
  const yaw = (faceShot && Math.hypot(ed[0], ed[2]) > 0.3 ? Math.atan2(ed[0], ed[2]) : bodyYaw) + rot, F = fwd(axis), Rt = right(axis);
  const at = (H: number, d: number, fovDeg: number, aim: V3, from: V3): Rig => ({ pos: from, target: aim, fov: c.fov ?? fovDeg, focus: h });
  const interior = c.place.kind === "interior";
  switch (c.kind) {
    case "wide": {
      // the whole figure in its place, a little high, more depth than width
      const a = yaw + c.side * 0.38, D = (interior ? 3.5 : 6.0) * dk, fv = interior ? 54 : 50;
      const pos = add(add(p, fwd(a), D), [0, 1.62 + 0.1 * u, 0]);
      return { pos: add(pos, Rt, 0.12 * u * c.side), target: add(p, [0, 0.95, 0]), fov: c.fov ?? fv, focus: h };
    }
    case "mediumWide": {
      const a = yaw + c.side * 0.34, D = (2.55 - 0.15 * u) * dk;
      return { pos: add(add(p, fwd(a), D), [0, 1.4, 0]), target: add(p, [0, 0.98, 0]), fov: c.fov ?? fovFor(2.1, D), focus: h };
    }
    case "medium": {
      // waist up, eyes on the upper third
      const a = yaw + c.side * 0.3, D = (1.55 - 0.12 * u) * dk;
      return at(1.25, D, fovFor(1.25, D), add(h, [0, -0.3, 0]), add(add(h, fwd(a), D), [0, -0.04, 0]));
    }
    case "cu": {
      const a = yaw + c.side * 0.24, D = (0.95 - 0.1 * u) * Math.max(0.8, dk);
      return at(0.64, D, fovFor(0.64, D), add(h, [0, -0.12, 0]), add(add(h, fwd(a), D), [0, 0.0, 0]));
    }
    case "ecu": {
      const e = s.eye(t), a = yaw + c.side * 0.14, D = 0.5 - 0.05 * u;
      return { pos: add(add(e.pos, fwd(a), D), [0, 0.01, 0]), target: add(e.pos, [0, -0.04, 0]), fov: c.fov ?? fovFor(0.32, D), focus: e.pos };
    }
    case "push": {
      const a = yaw + c.side * 0.2, D = (2.6 - 1.45 * u) * Math.max(0.75, dk);
      return at(1.0, D, fovFor(1.05, 2.0), add(h, [0, -0.18 - 0.06 * (1 - u), 0]), add(add(h, fwd(a), D), [0, -0.04, 0]));
    }
    case "pull": {
      const a = yaw + c.side * 0.24, D = 1.1 + 3.2 * u;
      return { pos: add(add(h, fwd(a), D), [0, 0.1 + 0.7 * u, 0]), target: add(h, [0, -0.28 - 0.35 * u, 0]), fov: c.fov ?? 46, focus: h };
    }
    case "profile": {
      const D = 2.0 * dk;
      return { pos: add(add(p, right(yaw), D * c.side), [0, 1.32, 0]), target: add(p, [0, 1.12, 0]), fov: c.fov ?? fovFor(1.75, D), focus: h };
    }
    case "low": return { pos: add(add(add(p, F, 1.75 * dk), Rt, 0.18 * c.side), [0, 0.45, 0]), target: add(h, [0, -0.05, 0]), fov: c.fov ?? 50, focus: h };
    case "high": return { pos: add(add(add(p, F, 1.3 * dk), Rt, 0.25 * c.side), [0, 3.1, 0]), target: add(p, [0, 0.6, 0]), fov: c.fov ?? 52, focus: h };
    case "lead": {
      const D = 2.4 * dk;
      return { pos: add(add(add(p, F, D), Rt, 0.14 * c.side), [0, 1.5, 0]), target: add(h, [0, -0.3, 0]), fov: c.fov ?? fovFor(1.9, D), focus: h };
    }
    case "track": {
      // from behind, close to the line of the path: the figure low in frame, the way ahead above it
      const pos = add(add(add(p, F, -2.0 * dk), Rt, 0.16 * c.side), [0, 1.68, 0]);
      return { pos, target: add(add(p, F, 2.6), [0, 1.15, 0]), fov: c.fov ?? 54, focus: h };
    }
    case "orbit": {
      const look = tgt && len(sub(tgt, h)) < 6 ? mix(h, tgt, 0.5) : h;
      const a = yaw + c.side * (0.35 + 0.45 * u), R = 2.0 * dk;
      return { pos: add(look, [Math.sin(a) * R, 0.2, Math.cos(a) * R]), target: add(look, [0, -0.15, 0]), fov: c.fov ?? 44, focus: look };
    }
    case "insert": {
      // a phone in the hand: over the shoulder onto its screen
      if (c.phone) {
        // behind the phone hand's shoulder, wide enough of the big head that the ear stays out of the lens; lifted and
        // swung out (or to the other shoulder) until head, neck and shoulder leave the line to the phone
        const ph = s.phone?.(t) ?? s.hand(t);
        const { k, side } = phoneView(c, s);
        const pos = phoneCam(h, F, Rt, k, side);
        return { pos, target: ph, fov: c.fov ?? 30 + 3 * k, focus: ph };
      }
      const hand = s.hand(t);
      // a thing the person looks at, not one in the hand (a QR code, a sign, a screen on the counter), near or
      // across the room: on the line from the eyes, close to its face; the person is behind the lens
      if (tgt && len(sub(tgt, hand)) > 0.45 && len(sub(tgt, h)) < 10) {
        const d = sub(tgt, h), dl = Math.hypot(d[0], d[2]) || 1, dn: V3 = [d[0] / dl, 0, d[2] / dl];
        const pos = add(add(tgt, dn, -0.75), [dn[2], 0, -dn[0]], 0.3 * c.side);
        return { pos: [pos[0], tgt[1] + 0.35, pos[2]], target: tgt, fov: c.fov ?? 36, focus: tgt };
      }
      // from above, hand + thing in the middle of the tall frame
      const aim = tgt && len(sub(tgt, h)) < 1.5 ? (len(sub(tgt, hand)) < 0.8 ? mix(tgt, hand, 0.45) : tgt) : hand;
      const rt = right(yaw), fw = fwd(yaw), hd = sub(hand, h), hs = Math.sign(hd[0] * rt[0] + hd[2] * rt[2]) || c.side;
      const sk = Math.min(2.6, Math.max(1, (c.size ?? 0) / 0.18));
      const pos = add(add(add(aim, rt, 0.16 * hs * sk), fw, 0.26 * sk), [0, 0.52 * sk, 0]);
      return { pos, target: aim, fov: c.fov ?? 46, focus: aim };
    }
    case "ots": {
      // close behind the shoulder, almost on the line of sight: the shoulder is a dark edge low in frame
      const look = tgt ?? add(h, F, 6);
      const far = len(sub(look, h)) > 15;
      const back = sub(h, look), bn = len(back) || 1;
      const up = look[1] - h[1], low = up > 0.6;
      const pos = add(add(add(h, [back[0] / bn, 0, back[2] / bn], 1.5), Rt, 0.38 * c.side), [0, low ? 0.12 - Math.min(0.45, up * 0.22) : 0.24, 0]);
      return { pos, target: mix(look, h, low ? 0.12 : 0), fov: c.fov ?? (far ? 30 : low ? 46 : 40), focus: look };
    }
    case "reveal": {
      const look = tgt ?? add(h, F, 10);
      const back = sub(h, look), bn = len(back) || 1;
      const pos = add(add(add(h, [back[0] / bn, 0, back[2] / bn], 1.55), Rt, 0.34 * c.side), [0, 0.2, 0]);
      const k = ease((t - c.t0 - 0.4) / Math.max(0.5, (c.t1 - c.t0) * 0.6));
      return { pos, target: mix(mix(h, look, 0.2), look, k), fov: c.fov ?? 44, focus: k < 0.5 ? h : look };
    }
    case "twoShot": {
      // staggered in depth: past the first person's shoulder onto the second one's face
      if (!c.subj2) return null;
      const h2 = c.subj2.head(t), d = sub(h, h2), dn = Math.hypot(d[0], d[2]) || 1;
      const dir: V3 = [d[0] / dn, 0, d[2] / dn], perp: V3 = [-dir[2] * c.side, 0, dir[0] * c.side];
      const pos = add(add(add(h, dir, 1.0 * dk), perp, 0.32), [0, 0.12, 0]);
      return { pos, target: mix(add(h2, [0, -0.18, 0]), h, 0.22), fov: c.fov ?? 46, focus: h2 };
    }
    case "establish": case "drone": {
      const E = c.place.establish;
      const a = E.yaw + c.side * 0.12 * u + rot, R = E.radius * dk * (c.kind === "drone" ? 1.5 - 0.25 * u : 0.95 - 0.15 * u), H = E.height * (c.kind === "drone" ? 1.9 - 0.4 * u : 1.15 - 0.3 * u);
      return { pos: add(E.center, [Math.sin(a) * R, H, Math.cos(a) * R]), target: mix(E.center, h, 0.55), fov: c.fov ?? 56, focus: h };
    }
    case "long": {
      const look = tgt ?? add(h, F, 30);
      const from = add(add(h, Rt, 0.18 * c.side), [0, 0.05, 0]);
      const d = len(sub(look, from));
      const fv = Math.max(4, Math.min(40, (2 * Math.atan2(d > 60 ? 12 : 4.2, d) * 180) / Math.PI));
      return { pos: from, target: look, fov: c.fov ?? fv * (1 - 0.08 * u), focus: look };
    }
    case "pov": {
      const e = s.eye(t), look = tgt ?? add(e.pos, e.dir, 8);
      const far = len(sub(look, e.pos)) > 15;
      return { pos: add(e.pos, F, 0.06), target: look, fov: c.fov ?? (far ? 32 : 50), focus: look };
    }
  }
  return null;
}

// ── framing checks (shared by the candidate search and the preflight) ─────────────────────────────────
/** camera basis + projection of a world point to the frame: x, y in −1…1 inside the picture, z = depth */
export const frameOf = (pos: V3, target: V3, fov: number, aspect: number) => {
  const f = sub(target, pos), fl = len(f) || 1;
  const F: V3 = [f[0] / fl, f[1] / fl, f[2] / fl];
  let R: V3 = [F[2], 0, -F[0]];
  const rl = Math.hypot(R[0], R[2]) || 1;
  R = [-R[0] / rl, 0, -R[2] / rl];
  const U: V3 = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  const th = Math.tan((fov * Math.PI) / 360);
  const project = (w: V3) => { const d = sub(w, pos); const z = d[0] * F[0] + d[1] * F[1] + d[2] * F[2]; return { x: (d[0] * R[0] + d[1] * R[1] + d[2] * R[2]) / (z * th * aspect), y: (d[0] * U[0] + d[1] * U[1] + d[2] * U[2]) / (z * th), z }; };
  const ray = (x: number, y: number): V3 => { const v: V3 = [F[0] + R[0] * x * th * aspect + U[0] * y * th, F[1] + R[1] * x * th * aspect + U[1] * y * th, F[2] + R[2] * x * th * aspect + U[2] * y * th]; const l = len(v); return [v[0] / l, v[1] / l, v[2] / l]; };
  return { project, ray };
};
/** distance along a ray to a box (Infinity = miss); a ray starting inside the box never hits it */
const rayBox = (o: V3, d: V3, bx: { min: V3; max: V3 }) => {
  let t0 = 0, t1 = Infinity;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-9) { if (o[k] < bx.min[k] || o[k] > bx.max[k]) return Infinity; continue; }
    let a = (bx.min[k] - o[k]) / d[k], b = (bx.max[k] - o[k]) / d[k];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    if (t0 > t1) return Infinity;
  }
  return t0 > 1e-4 ? t0 : Infinity;
};
/** distance along a ray to the inside wall of a room box the ray starts in */
const rayExit = (o: V3, d: V3, bx: { min: V3; max: V3 }) => {
  let t = Infinity;
  for (let k = 0; k < 3; k++) { if (d[k] > 1e-9) t = Math.min(t, (bx.max[k] - o[k]) / d[k]); else if (d[k] < -1e-9) t = Math.min(t, (bx.min[k] - o[k]) / d[k]); }
  return Math.max(0, t);
};
/** Share of the picture covered by a surface right at the lens (a wall in a narrow corridor, a shelf edge, a
 *  door frame): rays through a grid of the frame, near = closer than 30 % of the focus distance (at least
 *  22 cm, at most 60 cm). Foreground furniture further away is composition, not an obstruction. */
export const nearCover = (place: Place, pos: V3, target: V3, fov: number, aspect: number, focusD: number, grid: [number, number] = aspect < 1 ? [4, 7] : [7, 4]) =>
  coverOf(place, pos, target, fov, aspect, focusD, grid).near;
/** near: share of rays hitting a surface right at the lens; fg: share hitting anything nearer than 85 % of the
 *  focus distance (an open door leaf, a wall running past the lens, furniture in front of the person) */
export const coverOf = (place: Place, pos: V3, target: V3, fov: number, aspect: number, focusD: number, grid: [number, number] = aspect < 1 ? [4, 7] : [7, 4]) => {
  const fr = frameOf(pos, target, fov, aspect);
  const lim = Math.min(0.6, Math.max(0.22, 0.3 * focusD)), fgLim = 0.85 * focusD;
  const boxes = [...place.solids, ...(place.occluders ?? []), ...(place.kind === "interior" ? [...(place.soft ?? []), ...(place.swings ?? [])] : [])].filter((b) => !inside(pos, b));
  const room = place.kind === "interior" ? (place.zones?.find((z) => inside(pos, z)) ?? (inside(pos, place.box) ? place.box : undefined)) : undefined;
  let near = 0, fg = 0, n = 0;
  for (let i = 0; i < grid[0]; i++) for (let j = 0; j < grid[1]; j++) {
    const x = -0.9 + (1.8 * (i + 0.5)) / grid[0], y = -0.9 + (1.8 * (j + 0.5)) / grid[1];
    const d = fr.ray(x, y);
    let hit = room ? rayExit(pos, d, room) : Infinity;
    for (const b of boxes) { if (hit < lim) break; hit = Math.min(hit, rayBox(pos, d, b)); }
    // the floor is not an obstruction (a high shot looks down at it on purpose)
    n++;
    if (d[1] < -0.35) continue;
    if (hit < lim) near++;
    if (hit < fgLim) fg++;
  }
  return { near: n ? near / n : 0, fg: n ? fg / n : 0 };
};

// framings placed around the subject: if the ideal spot is inside a wall/furniture, swing around the
// subject (once per shot, so the camera never jumps mid-shot) until the spot is free
const ORBITS: ShotName[] = ["wide", "mediumWide", "medium", "cu", "ecu", "profile", "low", "high", "push", "pull", "lead", "orbit", "insert", "twoShot"];
const SIDED: ShotName[] = ["long", "ots", "reveal", "track"];

/** Does the segment a→b pass through the box (shrunk by m)? (slab test) */
const hitsBox = (a: V3, b: V3, bx: { min: V3; max: V3 }, m = 0.03) => {
  let t0 = 0, t1 = 1;
  for (let k = 0; k < 3; k++) {
    const d = b[k] - a[k], lo = bx.min[k] + m, hi = bx.max[k] - m;
    if (Math.abs(d) < 1e-9) { if (a[k] < lo || a[k] > hi) return false; continue; }
    let u0 = (lo - a[k]) / d, u1 = (hi - a[k]) / d;
    if (u0 > u1) [u0, u1] = [u1, u0];
    t0 = Math.max(t0, u0); t1 = Math.min(t1, u1);
    if (t0 > t1) return false;
  }
  return t1 > 0.02 && t0 < 0.98;
};
const inside = (p: V3, bx: { min: V3; max: V3 }) => p[0] > bx.min[0] && p[0] < bx.max[0] && p[1] > bx.min[1] && p[1] < bx.max[1] && p[2] > bx.min[2] && p[2] < bx.max[2];
/** distance from point p to segment a→b */
const segDist = (p: V3, a: V3, b: V3) => {
  const ab = sub(b, a), ap = sub(p, a), L = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2] || 1;
  const k = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / L));
  return len(sub(p, add(a, ab, k)));
};

/** How bad a framing is at a few moments: camera pushed by walls/furniture, view blocked by walls,
 *  furniture or the subject's own head. Lower is better. */
const dbg = (k: string, v: number) => { const g = globalThis as { __shotDebug?: Record<string, number> }; if (g.__shotDebug && v) g.__shotDebug[k] = (g.__shotDebug[k] ?? 0) + v; };
const badness = (c: ShotCtx, rot: number, flip: number, dk = 1) => {
  let bad = 0;
  const cc = flip !== 1 ? { ...c, side: (c.side * flip) as 1 | -1 } : c;
  for (const k of [0.15, 0.5, 0.85]) {
    const t = c.t0 + (c.t1 - c.t0) * k, q = rig(cc, t, c.subj ? rot * cc.side : rot, dk);
    const pos = legalCam(c.place, q.pos, q.focus ?? q.target);
    bad += len(sub(pos, q.pos)) * 2; dbg("pushed by walls", len(sub(pos, q.pos)) * 2);
    const look = q.focus ?? q.target;
    const head = c.subj ? c.subj.head(t) : undefined;
    // what must be seen: the subject's head (people shots) and the target (shots aimed at something)
    const musts: V3[] = [];
    if (head && c.kind !== "long" && c.kind !== "pov") musts.push(head);
    // nobody in shot: what it shows must be seen
    if (!head && c.target && c.kind !== "map") musts.push(look);
    // body shots: the chest too (a post or a shelf across the torso spoils a medium-wide)
    if (head && (c.kind === "mediumWide" || c.kind === "wide" || c.kind === "medium" || c.kind === "twoShot")) musts.push([head[0], head[1] - 0.45, head[2]]);
    if (c.kind === "long" || c.kind === "ots" || c.kind === "reveal" || c.kind === "insert") musts.push(look);
    const people = (c.others?.(t) ?? []).map((p) => ({ min: [p[0] - 0.25, p[1], p[2] - 0.25] as V3, max: [p[0] + 0.25, p[1] + 1.75, p[2] + 0.25] as V3 }));
    // the lens at another person (a cashier behind the counter): the line-of-sight test below skips a box the
    // camera is inside, so their head would fill the frame unseen
    for (const b of people) if (Math.hypot(pos[0] - (b.min[0] + b.max[0]) / 2, pos[2] - (b.min[2] + b.max[2]) / 2) < 0.45 && pos[1] < b.max[1] + 0.2) { bad += 3; dbg("camera at a person", 3); }
    for (const m of musts) {
      for (const s of [...c.place.solids, ...(c.place.occluders ?? []), ...people]) {
        if (inside(m, s) || inside(pos, s)) continue;
        // grown by 5 cm: a thin post that only just misses the line still covers the face on screen
        if (hitsBox(pos, m, s, -0.05)) { bad += 1.5; dbg(`blocked ${m === head ? "head" : "target"}`, 1.5); break; }
      }
    }
    // portrait (and landscape) framing: what must be seen has to be inside the picture, and no near surface
    // may cover it (a wall at the lens in a narrow corridor)
    const asp = c.aspect ?? 16 / 9;
    const fr = frameOf(pos, q.target, q.fov, asp);
    const PEOPLE = ["wide", "mediumWide", "medium", "cu", "push", "pull", "profile", "low", "high", "lead", "orbit", "twoShot", "track", "establish"];
    const inFrame = [...new Set(musts)].filter((m) => m !== head || PEOPLE.includes(c.kind));
    for (const m of inFrame) {
      const pj = fr.project(m);
      if (pj.z <= 0.05) { bad += 3; continue; }
      const ox = Math.abs(pj.x) - 0.86, oy = Math.abs(pj.y) - 0.9;
      if (ox > 0) { bad += 1 + ox * 3; dbg("out of frame x", 1 + ox * 3); }
      if (oy > 0) { bad += 0.6 + oy * 2; dbg("out of frame y", 0.6 + oy * 2); }
    }
    if (c.kind !== "pov" && c.kind !== "ecu") {
      const fd = len(sub(look, pos));
      const cv = coverOf(c.place, pos, q.target, q.fov, asp, fd, asp < 1 ? [3, 5] : [5, 3]);
      if (cv.near > 0.22) bad += (cv.near - 0.22) * 9;
      if (head && PEOPLE.includes(c.kind) && cv.fg > 0.4) bad += (cv.fg - 0.4) * 6;
      // portrait: the person a shot is about stays near the middle of the narrow frame
      if (asp < 1 && head && !["ots", "reveal", "long", "insert", "pov", "twoShot", "track"].includes(c.kind)) { const hx = Math.abs(fr.project(head).x); if (hx > 0.42) bad += (hx - 0.42) * 1.6; }
    }
    // a face shot shows the face: the camera in front of / beside where the face looks, never behind the head
    if (head && c.subj && (c.kind === "cu" || c.kind === "ecu" || c.kind === "medium" || c.kind === "push")) {
      const e = c.subj.eye(t).dir, el = Math.hypot(e[0], e[2]) || 1, v = sub(pos, head), vl = Math.hypot(v[0], v[2]) || 1;
      const facing = (e[0] * v[0] + e[2] * v[2]) / (el * vl);
      if (facing < 0.05) { bad += 1.2 + (0.05 - facing) * 3; dbg("behind the face", 1.2 + (0.05 - facing) * 3); }
      // a profile from behind hides the face (hair covers the cheek): close-ups want ≤ 63° off the gaze, mediums ≤ 65°
      else { const lim = c.kind === "cu" || c.kind === "ecu" ? 0.45 : 0.42; if (facing < lim) { bad += (lim - facing) * 3; dbg("face turned away", (lim - facing) * 3); } }
    }
    // over the shoulder in a narrow frame: the head is an edge, not the picture
    if (head && asp < 1 && (c.kind === "ots" || c.kind === "reveal")) {
      const hd = len(sub(head, pos)), half = Math.tan((q.fov * Math.PI) / 360) * asp;
      const frac = 0.13 / Math.max(0.05, hd) / half;
      if (frac > 0.5) { bad += (frac - 0.5) * 4; dbg("head too big", (frac - 0.5) * 4); }
    }
    // the subject's own head in front of the lens on shots aimed past them
    if (head && (c.kind === "long" || c.kind === "ots" || c.kind === "insert" || c.kind === "reveal") && segDist(head, pos, look) < (c.kind === "long" ? 0.26 : c.kind === "insert" ? 0.16 : c.kind === "reveal" ? 0.18 : 0.12)) { bad += 3; dbg("own head in the lens", 3); }
    if (head && c.kind === "insert" && len(sub(pos, head)) < 0.22) bad += 3;
  }
  return bad;
};

type Pick = { rot: number; flip: number; dk: number; from?: V3 };
/** development aid: the score of a candidate framing (lower is better) */
export const scoreFraming = (c: ShotCtx, rot: number, flip: number, dk: number) => badness(c, rot, flip, dk);
export const pickOf = (c: ShotCtx) => pick(c);
const pickCache = new WeakMap<ShotCtx, Pick>();
const pick = (c: ShotCtx): Pick => {
  const hit = pickCache.get(c);
  if (hit) return hit;
  let best: Pick = { rot: 0, flip: 1, dk: 1 }, bestB = Infinity;
  if (c.subj && ORBITS.includes(c.kind)) {
    outer: for (const dk of [1, 0.75, 0.55]) {
      for (const r of [0, 0.45, -0.45, 0.9, -0.9, 1.35, -1.35, 1.9, -1.9, Math.PI]) {
        const b = badness(c, r, 1, dk) + (1 - dk) * 0.6;
        if (b < 0.1) { best = { rot: r, flip: 1, dk }; bestB = b; break outer; }
        if (b < bestB - 0.05) { best = { rot: r, flip: 1, dk }; bestB = b; }
      }
    }
    best = { ...best, rot: best.rot * c.side };
  } else if (!c.subj && c.kind !== "map") {
    // nobody in shot (a place, a thing): swing around the establishing ring and pull in until the view is clear
    outer2: for (const dk of [1, 0.8, 0.62]) {
      for (const r of [0, 0.35, -0.35, 0.7, -0.7, 1.15, -1.15, 1.7, -1.7, Math.PI]) {
        const b = badness(c, r, 1, dk) + (1 - dk) * 0.9 + Math.abs(r) * 0.18;
        if (b < 0.1) { best = { rot: r, flip: 1, dk }; bestB = b; break outer2; }
        if (b < bestB - 0.05) { best = { rot: r, flip: 1, dk }; bestB = b; }
      }
    }
  } else if (c.subj && SIDED.includes(c.kind)) {
    const a = badness(c, 0, 1), b = badness(c, 0, -1);
    best = b < a - 0.05 ? { rot: 0, flip: -1, dk: 1 } : { rot: 0, flip: 1, dk: 1 };
    bestB = Math.min(a, b);
    if (bestB >= 2.5 && c.target && c.kind !== "track") {
      // the subject cannot see it: find a clear vantage point (marks of the place at eye height)
      const tm = (c.t0 + c.t1) / 2, look = c.target(tm), me = c.subj.pos(tm);
      const blockers = [...c.place.solids, ...(c.place.occluders ?? [])];
      const cands = Object.values(c.place.marks).map((m) => [m.p[0], (m.y ?? c.place.floor) + 1.55, m.p[1]] as V3)
        .filter((q) => { const d = len(sub(look, q)); return d > 2.5 && d < 40 && segDist(c.subj!.head(tm), q, look) > 0.6 && !blockers.some((bx) => !inside(look, bx) && hitsBox(q, look, bx)); })
        .sort((q1, q2) => len(sub(q1, me)) - len(sub(q2, me)));
      if (cands[0]) best = { rot: 0, flip: 1, dk: 1, from: legalCam(c.place, cands[0], look) };
    }
  }
  pickCache.set(c, best);
  return best;
};

export const shotCam = (c0: ShotCtx, t: number): Cam => {
  const pk = pick(c0);
  const c = pk.flip !== 1 ? { ...c0, side: (c0.side * pk.flip) as 1 | -1 } : c0;
  const r = rig(c, t, pk.rot, pk.dk, pk.from);
  const k = SHAKE[c.mood] * (SHAKE_K[c.kind] ?? 1);
  let pos: V3 = [r.pos[0] + k * 0.012 * n1(t, 1 + c.seed), r.pos[1] + k * 0.01 * n1(t, 2 + c.seed), r.pos[2] + k * 0.012 * n1(t, 3 + c.seed)];
  // pushed out of walls on the side of what the shot looks at, so a path through a wall never flips sides
  if (c.kind !== "pov" && !r.free) pos = legalCam(c.place, pos, r.focus ?? r.target);
  const target: V3 = [r.target[0] + k * 0.03 * n1(t, 4 + c.seed), r.target[1] + k * 0.025 * n1(t, 5 + c.seed), r.target[2] + k * 0.03 * n1(t, 6 + c.seed)];
  const f = r.focus ?? r.target;
  const ap = APERTURE[c.kind] ?? 0.0015;
  return { pos, target, fov: r.fov, roll: k * 0.006 * n1(t, 7 + c.seed), focus: Math.max(0.3, len(sub(f, pos))), aperture: ap, maxBlur: ap > 0.005 ? 0.01 : 0.005, near: c.kind === "ecu" || c.kind === "insert" ? 0.02 : 0.05 };
};

/** The framing to use instead when the same framing would repeat. */
export const ALT: Record<ShotName, ShotName> = {
  establish: "wide", drone: "establish", wide: "mediumWide", mediumWide: "medium", medium: "cu", cu: "medium", ecu: "medium", ots: "long", pov: "cu",
  long: "ots", track: "lead", lead: "profile", profile: "medium", low: "medium", high: "mediumWide", insert: "medium", orbit: "medium", push: "cu",
  pull: "wide", reveal: "long", map: "establish", twoShot: "medium",
};
