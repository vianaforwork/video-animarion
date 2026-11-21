// Acting library: every action is a pure function (segment, film time) → Pose for the procedural rig.
// Postures (stand / sit / lie / bedsit) give the base body; actions layer head, arms, face and timing on
// top. Blinks, saccades, weight shift and breathing keep everyone alive between actions.

import { blend, FACE0, lerpN, phoneArm, restPose, runCycle, walkCycle, type Face, type HoldKind, type Pose } from "../cine/character/pose.ts";
import { fromChest, lookAt, toChest, walkState, type PlanPath } from "../cine/character/rig.ts";
import type { CharSpec } from "../cine/character/Character.tsx";
import type { V3 } from "../worlds/types.ts";
import type { ActionName, FaceName } from "./story.ts";

const face = (o: Partial<Face>): Face => ({ ...FACE0, ...o });
export const FACE: Record<FaceName, Face> = {
  neutral: face({}),
  calm: face({ lid: 0.78, mouth: 0.1 }),
  alert: face({ browUp: 0.55, browIn: 0.2, lid: 1.0, mouth: -0.05 }),
  fear: face({ browUp: 0.9, browIn: 0.85, lid: 1.1, mouth: -0.3, open: 0.12 }),
  panic: face({ browUp: 1, browIn: 1, lid: 1.3, mouth: -0.4, open: 0.5 }),
  squint: face({ browUp: 0.15, browIn: 0.9, lid: 0.66, mouth: -0.2, open: 0.05 }),
  read: face({ browUp: 0.35, browIn: 0.4, lid: 0.8, mouth: -0.1, eyeY: -0.25 }),
  sleep: face({ lid: 0, mouth: 0.05 }),
  drowsy: face({ lid: 0.45, browUp: 0.1, mouth: 0 }),
  smile: face({ mouth: 0.55, lid: 0.8, browUp: 0.15 }),
  laugh: face({ mouth: 0.9, open: 0.55, lid: 0.45, browUp: 0.3 }),
  sad: face({ browUp: 0.45, browIn: 0.9, lid: 0.7, mouth: -0.45 }),
  think: face({ browUp: 0.3, browIn: 0.5, lid: 0.8, mouth: -0.1, eyeX: 0.15, eyeY: 0.18 }),
  uneasy: face({ browUp: 0.4, browIn: 0.7, lid: 0.95, mouth: -0.15 }),
  serious: face({ browUp: 0.2, browIn: 0.4, lid: 0.85, mouth: -0.05 }),
  relief: face({ browUp: 0.3, browIn: -0.1, lid: 0.82, mouth: 0.5, open: 0.06 }),
  surprised: face({ browUp: 1, browIn: 0.2, lid: 1.25, mouth: -0.1, open: 0.35 }),
  curious: face({ browUp: 0.55, browIn: 0.2, lid: 0.95, mouth: 0.1 }),
};

export const DEFAULT_FACE: Partial<Record<ActionName, FaceName>> = {
  stand: "calm", look: "alert", turn: "alert", walk: "calm", run: "panic", startle: "surprised", freeze: "fear", peer: "squint",
  point: "serious", reach: "serious", wave: "smile", phone: "read", binoculars: "squint", raise: "alert", think: "think", nod: "calm",
  shake: "serious", sigh: "relief", talk: "serious", shiver: "uneasy", sit: "calm", standUp: "calm", write: "read", lie: "calm",
  sleep: "sleep", wake: "drowsy", sitUp: "drowsy", push: "calm", pickUp: "calm", putDown: "calm", give: "smile", receive: "smile", open: "calm", close: "calm", kneel: "calm",
};

export type Posture = "stand" | "sit" | "lie" | "bedsit";
export type CState = { x: number; z: number; y: number; yaw: number; posture: Posture; seat?: number; bedHead?: [number, number]; bedY?: number; on?: string; onT?: number };

export type Seg = {
  who: string;
  act: ActionName;
  t0: number;
  t1: number;
  from: CState;
  to: CState;
  path?: PlanPath;
  moveT0?: number;
  moveT1?: number;
  target?: V3;
  face: FaceName;
  hold: HoldKind | null;
  seed: number;
  /** terrain height under the feet (exteriors with hills) */
  floor?: (x: number, z: number) => number;
  /** both hands on world points (push handles), weight 0..1 */
  hands?: (t: number) => { L: V3; R: V3; w: number } | null;
  /** carrying an object in the right hand */
  carry?: (t: number) => boolean;
  /** seated on / riding an object that moves: world displacement of the seat since the segment began */
  ride?: (t: number) => { dx: number; dz: number; dyaw: number; px: number; pz: number } | null;
  /** the same hand gesture again soon after the last one: played with the head only */
  again?: boolean;
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ss = (a: number, b: number, x: number) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const wrap = (a: number) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
export const yawTo = (x: number, z: number, p: V3) => Math.atan2(p[0] - x, p[2] - z);

// ── postures ────────────────────────────────────────────────────────────────

const seated = (st: CState, c: CharSpec): Pose => {
  const p = restPose();
  Object.assign(p, { x: st.x, z: st.z, yaw: st.yaw, y: st.y + (st.seat ?? 0.45) - 0.96 * c.scale });
  p.legL = { sw: 1.45, ab: 0.12, tw: 0, kn: 1.5, an: 0.1 };
  p.legR = { sw: 1.4, ab: 0.08, tw: 0, kn: 1.55, an: 0.1 };
  p.chest = [0.06, 0, 0];
  p.armL = { ...p.armL, sw: 0.55, el: 1.0, ab: 0.15 };
  p.armR = { ...p.armR, sw: 0.55, el: 1.0, ab: 0.15 };
  return p;
};

const lying = (st: CState, c: CharSpec): Pose => {
  const p = restPose();
  const head = st.bedHead ?? [st.x, st.z];
  const dir = [head[0] - st.x, head[1] - st.z], L = Math.hypot(dir[0], dir[1]) || 1;
  const ux = dir[0] / L, uz = dir[1] / L;
  // hips sit ~0.74 body-units from the head end; the body's up axis points at the head
  Object.assign(p, { x: head[0] - ux * 0.74 * c.scale, z: head[1] - uz * 0.74 * c.scale, y: (st.bedY ?? 0.55) + st.y + 0.1 - 0.96 * c.scale, yaw: Math.atan2(-ux, -uz) });
  p.hips = [-Math.PI / 2, 0, 0];
  p.neck = [0.3, 0, 0];
  p.head = [0.12, 0.15, 0.05];
  p.armL = { ...p.armL, sw: 0.05, ab: 0.1, el: 0.35 };
  p.armR = { ...p.armR, sw: 0.0, ab: 0.08, el: 0.3 };
  p.legL = { ...p.legL, sw: 0.02, kn: 0.12 };
  p.legR = { ...p.legR, sw: 0.0, ab: 0.08, kn: 0.25 };
  p.breath = 0.8;
  return p;
};

const bedSit = (st: CState, c: CharSpec): Pose => {
  const p = lying(st, c);
  p.hips = [0, 0, 0];
  p.y += 0.02;
  p.spine = [0.12, 0, 0];
  p.neck = [0.1, 0, 0];
  p.head = [0.1, 0, 0];
  p.legL = { ...p.legL, sw: Math.PI / 2 - 0.12, kn: 0.35 };
  p.legR = { ...p.legR, sw: Math.PI / 2 - 0.1, kn: 0.3 };
  p.armL = { ...p.armL, sw: 0.25, ab: 0.2, el: 0.25 };
  p.armR = { ...p.armR, sw: 0.25, ab: 0.2, el: 0.25 };
  p.breath = 1;
  return p;
};

const standing = (st: CState): Pose => {
  const p = restPose();
  Object.assign(p, { x: st.x, z: st.z, yaw: st.yaw, y: st.y });
  return p;
};

export const base = (st: CState, c: CharSpec): Pose => (st.posture === "sit" ? seated(st, c) : st.posture === "lie" ? lying(st, c) : st.posture === "bedsit" ? bedSit(st, c) : standing(st));

// ── life: blinks, saccades, weight shift ────────────────────────────────────

const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
export const blinkAt = (t: number, seed: number) => {
  const period = 3.2 + 1.4 * hash(seed);
  const k = Math.floor((t + seed * 0.37) / period), ph = (t + seed * 0.37) - k * period - period * 0.3 * hash(k + seed);
  return ph > 0 && ph < 0.17 ? Math.sin((ph / 0.17) * Math.PI) : 0;
};
const alive = (p: Pose, t: number, seed: number, sleeping: boolean) => {
  if (!sleeping) {
    const b = blinkAt(t, seed);
    if (b > 0) p.face = { ...p.face, lid: lerpN(p.face.lid, 0, b) };
    const sk = Math.floor(t * 0.9 + seed);
    p.face = { ...p.face, eyeX: p.face.eyeX + 0.05 * (hash(sk) - 0.5), eyeY: p.face.eyeY + 0.03 * (hash(sk + 9) - 0.5) };
  }
  p.head = [p.head[0] + 0.012 * Math.sin(t * 0.7 + seed), p.head[1] + 0.02 * Math.sin(t * 0.43 + seed * 2), p.head[2]];
  return p;
};
const shift = (p: Pose, t: number, seed: number) => {
  const w = Math.sin(t * 0.38 + seed);
  p.hips = [p.hips[0], p.hips[1], p.hips[2] + 0.025 * w];
  p.chest = [p.chest[0], p.chest[1], p.chest[2] - 0.015 * w];
  p.legL = { ...p.legL, kn: p.legL.kn + 0.04 * Math.max(0, w) };
  p.legR = { ...p.legR, kn: p.legR.kn + 0.04 * Math.max(0, -w) };
  return p;
};

// ── helpers ─────────────────────────────────────────────────────────────────

const look = (p: Pose, target: V3 | undefined, c: CharSpec, k: number) => {
  if (!target || k <= 0) return;
  lookAt(p, target, c, k);
  // eyes take the rest of the way
  const dx = target[0] - p.x, dz = target[2] - p.z;
  const rel = wrap(Math.atan2(dx, dz) - p.yaw - p.head[1] - p.neck[1]);
  p.face = { ...p.face, eyeX: p.face.eyeX + Math.max(-0.3, Math.min(0.3, rel)) * 0.5 * k };
};
const armIK = (p: Pose, side: 1 | -1, t: [number, number, number], w: number, pole: [number, number, number] = [0.5, -0.7, -0.2]) => {
  const key = side === 1 ? "armL" : "armR";
  p[key] = { ...p[key], ik: { t: side === 1 ? t : [-t[0], t[1], t[2]], pole, w } };
};
/** World point → IK target for the right arm (true chest coordinates, like every armIK target), clamped to reach. */
const reachR = (p: Pose, w: V3, c: CharSpec, reach = 0.5): [number, number, number] => {
  const l = toChest(p, w, c);
  const S = [-0.19, 0.2, -0.01];
  const d = [l[0] - S[0], l[1] - S[1], l[2] - S[2]], n = Math.hypot(d[0], d[1], d[2]) || 1;
  const k = Math.min(1, reach / n);
  // true chest coordinates: armIK's mirror for the right arm and Character's side sign cancel out
  return [S[0] + d[0] * k, S[1] + d[1] * k, S[2] + d[2] * k];
};

/** A point on a surface (desk, counter) the right hand can reach: when the real point is too far, the
 *  nearest reachable point at the SAME height toward it — never a shortened reach down into the furniture. */
const onSurface = (p: Pose, w: V3, c: CharSpec, reach: number): V3 => {
  const sh = fromChest(p, [-0.19, 0.2, -0.01], c);
  const R = reach * c.scale * 0.97, dy = w[1] - sh[1];
  const dx = w[0] - sh[0], dz = w[2] - sh[2], hd = Math.hypot(dx, dz);
  if (Math.hypot(hd, dy) <= R || Math.abs(dy) >= R) return w;
  const hmax = Math.sqrt(R * R - dy * dy), k = hmax / (hd || 1);
  return [sh[0] + dx * k, w[1], sh[2] + dz * k];
};

// ── the actions ─────────────────────────────────────────────────────────────

export type ActCtx = { seg: Seg; t: number; c: CharSpec; talk: (t: number) => number };

const idle = ({ seg, t, c }: ActCtx, lookK = 1): Pose => {
  const p = base(seg.to, c);
  if (seg.to.posture === "stand") shift(p, t, seg.seed);
  p.face = FACE[seg.face];
  look(p, seg.target, c, lookK * ss(seg.t0, seg.t0 + 0.7, t));
  return p;
};

const ACT: Record<ActionName, (x: ActCtx) => Pose> = {
  stand: (x) => idle(x, 0.85),
  look: (x) => idle(x, 1),
  turn: (x) => {
    const { seg, t, c } = x;
    const k = ss(seg.t0, seg.t0 + 0.9, t);
    const p = base({ ...seg.to, yaw: seg.from.yaw + wrap(seg.to.yaw - seg.from.yaw) * k }, c);
    const step = Math.sin(k * Math.PI);
    p.legL = { ...p.legL, sw: 0.25 * step * Math.sin(k * Math.PI * 2), kn: 0.35 * step };
    p.legR = { ...p.legR, sw: -0.2 * step * Math.sin(k * Math.PI * 2), kn: 0.2 * step };
    p.face = FACE[seg.face];
    look(p, seg.target, c, ss(seg.t0, seg.t0 + 0.5, t));
    return p;
  },
  walk: (x) => move(x, false),
  run: (x) => move(x, true),
  startle: (x) => {
    const { seg, t, c } = x;
    const p = idle(x, 0);
    const u = t - seg.t0, jolt = Math.exp(-Math.max(0, u) * 4) * ss(0, 0.06, u);
    p.chest = [p.chest[0] - 0.12 * jolt, p.chest[1], p.chest[2]];
    p.spine = [p.spine[0] - 0.05 * jolt, p.spine[1], p.spine[2]];
    p.armL = { ...p.armL, ab: p.armL.ab + 0.25 * jolt + 0.05, el: p.armL.el + 0.5 * jolt };
    p.armR = { ...p.armR, ab: p.armR.ab + 0.25 * jolt + 0.05, el: p.armR.el + 0.5 * jolt };
    p.handL = { curl: 0.1, index: 0.05, thumb: 0.4 };
    p.handR = { curl: 0.1, index: 0.05, thumb: 0.4 };
    p.breath = 1.6;
    if (seg.to.posture === "stand") { const back = 0.12 * ss(0, 0.35, u); p.x -= Math.sin(p.yaw) * back; p.z -= Math.cos(p.yaw) * back; }
    look(p, seg.target, c, ss(seg.t0, seg.t0 + 0.25, t));
    return p;
  },
  freeze: (x) => {
    const { seg, t, c } = x;
    const p = base(seg.to, c);
    p.face = FACE[seg.face];
    p.breath = 1.9;
    p.tremble = 0.6;
    if (seg.to.posture === "stand") {
      p.hipY = -0.03;
      p.legL = { ...p.legL, kn: 0.15 };
      p.legR = { ...p.legR, kn: 0.12 };
      p.armL = { ...p.armL, ab: 0.15, el: 0.45 };
      p.armR = { ...p.armR, ab: 0.15, el: 0.42 };
    }
    look(p, seg.target, c, ss(seg.t0, seg.t0 + 0.4, t));
    return p;
  },
  peer: (x) => {
    const { seg, t, c } = x;
    const p = idle(x, 0);
    const k = ss(seg.t0, seg.t0 + 0.8, t);
    // leans in, head forward, squinting (hands stay down: a raised hand reads as a salute and hides the face)
    p.spine = [p.spine[0] + 0.06 * k, p.spine[1], p.spine[2]];
    p.chest = [p.chest[0] + 0.1 * k, p.chest[1], p.chest[2]];
    p.neck = [p.neck[0] + 0.08 * k, p.neck[1], p.neck[2]];
    p.armL = { ...p.armL, el: p.armL.el + 0.25 * k };
    p.armR = { ...p.armR, el: p.armR.el + 0.25 * k };
    look(p, seg.target, c, ss(seg.t0, seg.t0 + 0.5, t));
    return p;
  },
  point: (x) => {
    const { seg, t, c } = x;
    const p = idle(x, 1);
    const k = ss(seg.t0 + 0.1, seg.t0 + 0.7, t) * (1 - ss(seg.t1 - 0.5, seg.t1, t));
    if (seg.target) armIK(p, -1, reachR(p, seg.target, c, 0.53), k, [0.3, -0.8, 0.1]);
    p.handR = { curl: lerpN(0.35, 1, k), index: lerpN(0.3, 0, k), thumb: 0.5 };
    return p;
  },
  reach: (x) => {
    const { seg, t, c } = x;
    const p = idle(x, 1);
    const k = ss(seg.t0 + 0.1, seg.t0 + 0.8, t) * (1 - ss(seg.t1 - 0.6, seg.t1, t));
    if (seg.target) armIK(p, -1, reachR(p, seg.target, c, 0.55), k, [0.4, -0.8, -0.1]);
    p.chest = [p.chest[0] + 0.08 * k, p.chest[1], p.chest[2]];
    p.handR = { curl: 0.25, index: 0.15, thumb: 0.3 };
    return p;
  },
  wave: (x) => {
    const { seg, t } = x;
    const p = idle(x, 1);
    const k = ss(seg.t0, seg.t0 + 0.4, t) * (1 - ss(seg.t1 - 0.4, seg.t1, t));
    p.armR = { ...p.armR, sw: lerpN(p.armR.sw, 0.3, k), ab: lerpN(p.armR.ab, 1.3, k), el: lerpN(p.armR.el, 0.9 + 0.35 * Math.sin(t * 9), k), wr: [0, 0, 0.2 * Math.sin(t * 9)] };
    p.handR = { curl: 0.05, index: 0.0, thumb: 0.3 };
    return p;
  },
  phone: (x) => {
    const { seg, t, c } = x;
    const p = idle(x, 0);
    const k = ss(seg.t0, seg.t0 + 0.7, t) * (1 - ss(seg.t1 - 0.5, seg.t1, t));
    p.phone = 2;
    p.phoneOn = ss(seg.t0, seg.t0 + 0.3, t);
    const arm = phoneArm();
    p.armL = { ...arm, ik: { ...arm.ik!, w: k } };
    p.head = [lerpN(p.head[0], 0.45, k), p.head[1], p.head[2]];
    p.neck = [lerpN(p.neck[0], 0.12, k), p.neck[1], p.neck[2]];
    if (k < 0.5) look(p, seg.target, c, 1 - k * 2);
    return p;
  },
  binoculars: (x) => {
    const { seg, t } = x;
    const p = idle(x, 1);
    const k = ss(seg.t0 + 0.1, seg.t0 + 0.9, t) * (1 - ss(seg.t1 - 0.6, seg.t1, t));
    // both hands up to the eyes (binoculars sit on the face once raised)
    const head = p.head, aimDown = Math.max(-0.4, Math.min(0.3, head[0] + p.neck[0]));
    armIK(p, 1, [0.06, 0.42 - 0.2 * aimDown, 0.26], k, [0.7, -0.6, -0.1]);
    armIK(p, -1, [0.06, 0.42 - 0.2 * aimDown, 0.26], k, [0.7, -0.6, -0.1]);
    p.armL = { ...p.armL, wr: [0.2, 0, 0.6] };
    p.armR = { ...p.armR, wr: [0.2, 0, 0.6] };
    p.handL = { curl: 0.6, index: 0.5, thumb: 0.4 };
    p.handR = { curl: 0.6, index: 0.5, thumb: 0.4 };
    p.hold = { kind: "binoculars", side: -1, on: k };
    return p;
  },
  raise: (x) => {
    const { seg, t, c } = x;
    const p = idle(x, 1);
    const k = ss(seg.t0 + 0.1, seg.t0 + 0.8, t) * (1 - ss(seg.t1 - 0.6, seg.t1, t));
    // aim at the target when there is one (the arm points the light at it), else straight ahead
    const tgt: [number, number, number] = seg.target ? reachR(p, seg.target, c, 0.56) : seg.hold === "lantern" ? [0.1, 0.32, 0.42] : [0.0, 0.15, 0.5];
    armIK(p, -1, tgt, k, [0.5, -0.8, 0.0]);
    if (seg.hold === "flashlight") p.armR = { ...p.armR, wr: [-0.9 * k, 0, 0] };
    if (seg.target && k > 0.3) p.aim = seg.target;
    return p;
  },
  think: (x) => {
    const { seg, t } = x;
    const p = idle(x, 0.5);
    const k = ss(seg.t0 + 0.1, seg.t0 + 0.8, t) * (1 - ss(seg.t1 - 0.5, seg.t1, t));
    // the hand raised under the jaw for a moment, clear of the mouth (higher lands on the mouth / nose and reads as
    // biting nails or rubbing it; held, or every time, a hand in front of the face is all a close-up shows) — the head
    // and the eyes keep thinking
    const off = Math.min(seg.t1 - 0.5, seg.t0 + 2.2);
    const kh = seg.again ? 0 : ss(seg.t0 + 0.1, seg.t0 + 0.8, t) * (1 - ss(off, off + 0.6, t));
    if (kh > 0) armIK(p, -1, [0.0, 0.25, 0.235], kh, [0.6, -0.8, 0.2]);
    if (kh > 0) p.handR = { curl: 0.7, index: 0.4, thumb: 0.5 };
    p.head = [p.head[0] + 0.08 * k, p.head[1] + 0.12 * k, p.head[2] + 0.08 * k];
    return p;
  },
  nod: (x) => {
    const { seg, t } = x;
    const p = idle(x, 1);
    const u = t - seg.t0;
    p.head = [p.head[0] + 0.16 * Math.sin(u * 9) * Math.exp(-u * 1.1) * ss(0, 0.1, u), p.head[1], p.head[2]];
    return p;
  },
  shake: (x) => {
    const { seg, t } = x;
    const p = idle(x, 1);
    const u = t - seg.t0;
    p.head = [p.head[0], p.head[1] + 0.22 * Math.sin(u * 8) * Math.exp(-u * 0.9) * ss(0, 0.1, u), p.head[2]];
    return p;
  },
  sigh: (x) => {
    const { seg, t } = x;
    const p = idle(x, 0.6);
    const u = t - seg.t0, k = Math.sin(Math.min(1, u / 2.2) * Math.PI);
    p.chest = [p.chest[0] + 0.1 * k, p.chest[1], p.chest[2]];
    p.head = [p.head[0] + 0.18 * k, p.head[1], p.head[2]];
    p.breath = 1.4;
    return p;
  },
  talk: (x) => {
    const { seg, t, talk } = x;
    const p = idle(x, 1);
    const a = talk(t);
    p.talk = Math.min(0.6, a * 1.3);
    const g = Math.sin(t * 2.1 + seg.seed) * 0.5 + 0.5;
    p.armR = { ...p.armR, sw: p.armR.sw + 0.35 * a + 0.1 * g, el: p.armR.el + 0.7 * a + 0.3 * g, ab: p.armR.ab + 0.1 };
    p.handR = { curl: 0.2, index: 0.1, thumb: 0.3 };
    p.head = [p.head[0] + 0.05 * Math.sin(t * 5.3) * a, p.head[1] + 0.04 * Math.sin(t * 1.7), p.head[2]];
    return p;
  },
  shiver: (x) => {
    const { seg, t } = x;
    const p = idle(x, 0.6);
    const k = ss(seg.t0, seg.t0 + 0.6, t);
    armIK(p, 1, [-0.12, 0.1, 0.16], k, [0.6, -0.6, -0.2]);
    armIK(p, -1, [-0.12, 0.06, 0.18], k, [0.6, -0.6, -0.2]);
    p.chest = [p.chest[0] + 0.12 * k, p.chest[1], p.chest[2]];
    p.tremble = 0.8 * k;
    p.chest = [p.chest[0], p.chest[1] + 0.02 * Math.sin(t * 31) * k, p.chest[2]];
    return p;
  },
  sit: (x) => {
    const { seg, t, c } = x;
    // walk to the seat (if needed) is a separate segment; here: stand → sit over 1 s
    const k = ss(seg.t0, seg.t0 + 1.1, t);
    const st = base({ ...seg.to, posture: "stand" }, c), si = base(seg.to, c);
    const p = blend(st, si, k);
    p.chest = [p.chest[0] + 0.25 * Math.sin(k * Math.PI), p.chest[1], p.chest[2]];
    p.face = FACE[seg.face];
    look(p, seg.target, c, ss(seg.t0 + 0.8, seg.t0 + 1.5, t));
    return p;
  },
  standUp: (x) => {
    const { seg, t, c } = x;
    const k = ss(seg.t0, seg.t0 + 1.1, t);
    const si = base(seg.from, c), st = base(seg.to, c);
    const p = blend(si, st, k);
    p.chest = [p.chest[0] + 0.3 * Math.sin(k * Math.PI), p.chest[1], p.chest[2]];
    p.face = FACE[seg.face];
    look(p, seg.target, c, ss(seg.t0 + 0.9, seg.t0 + 1.6, t));
    return p;
  },
  write: (x) => {
    const { seg, t, c } = x;
    const p = base(seg.to, c);
    const k = ss(seg.t0, seg.t0 + 0.8, t) * (1 - ss(seg.t1 - 0.5, seg.t1, t));
    p.face = FACE[seg.face];
    // lean over the desk — further when the paper is further away — so the forearm comes over the edge
    const far = seg.target ? Math.max(0, Math.min(0.28, (Math.hypot(seg.target[0] - seg.to.x, seg.target[2] - seg.to.z) - 0.3) * 0.9)) : 0;
    p.spine = [p.spine[0] + far * 0.5 * k, p.spine[1], p.spine[2]];
    p.chest = [p.chest[0] + (0.22 + far * 0.5) * k, p.chest[1], p.chest[2]];
    p.neck = [p.neck[0] + 0.15 * k, p.neck[1], p.neck[2]];
    p.head = [p.head[0] + 0.32 * k, p.head[1], p.head[2]];
    // write on the target (papers on the desk) when given, else just in front of the chest;
    // the hand rests ON the paper (its centre ~5 cm above the surface), never inside the desk
    const base3: [number, number, number] = seg.target ? reachR(p, onSurface(p, [seg.target[0], seg.target[1] + 0.05, seg.target[2]], c, 0.6), c, 0.6) : [-0.08, -0.12, 0.36];
    const wob: [number, number, number] = [base3[0] + 0.04 * Math.sin(t * 7.3), base3[1] + 0.012 * Math.sin(t * 19), base3[2] + 0.02 * Math.sin(t * 2.3)];
    // elbow out to the side and up, as when writing at a desk
    armIK(p, -1, [wob[0], wob[1], wob[2]], k, [0.8, -0.35, -0.2]);
    armIK(p, 1, [0.14, -0.16, 0.32], 0.8 * k, [0.6, -0.8, -0.2]);
    p.hold = { kind: "pen", side: -1, on: 1 };
    p.handR = { curl: 0.7, index: 0.5, thumb: 0.6 };
    return p;
  },
  push: (x) => move(x, false),
  pickUp: (x) => reachTo(x, 0.55),
  putDown: (x) => reachTo(x, 0.55),
  give: (x) => reachTo(x, 0.42),
  receive: (x) => reachTo(x, 0.42),
  open: (x) => reachTo(x, 0.55),
  close: (x) => reachTo(x, 0.55),
  kneel: (x) => {
    const { seg, t, c } = x;
    const p = idle(x, 1);
    const k = ss(seg.t0, seg.t0 + 0.8, t) * (1 - ss(seg.t1 - 0.6, seg.t1, t));
    p.hipY = -0.42 * k;
    p.legL = { ...p.legL, sw: 1.25 * k, kn: 2.0 * k, an: -0.2 * k };
    p.legR = { ...p.legR, sw: -0.15 * k, kn: 1.75 * k, an: 0.9 * k };
    p.chest = [p.chest[0] + 0.12 * k, p.chest[1], p.chest[2]];
    if (seg.target) armIK(p, -1, reachR(p, seg.target, c, 0.55), ss(seg.t0 + 0.5, seg.t0 + 1.1, t) * (1 - ss(seg.t1 - 0.6, seg.t1, t)), [0.4, -0.8, -0.1]);
    return p;
  },
  lie: (x) => { const p = idle(x, 0.6); return p; },
  sleep: (x) => {
    const p = base(x.seg.to, x.c);
    p.face = FACE.sleep;
    p.breath = 0.7;
    return p;
  },
  wake: (x) => {
    const { seg, t, c } = x;
    const p = base(seg.to, c);
    const k = ss(seg.t0 + 0.2, seg.t0 + 1.4, t);
    p.face = { ...blend({ ...p, face: FACE.sleep }, { ...p, face: FACE[seg.face] }, k).face };
    look(p, seg.target, c, 0.6 * ss(seg.t0 + 1.0, seg.t0 + 2.0, t));
    return p;
  },
  sitUp: (x) => {
    const { seg, t, c } = x;
    const k = ss(seg.t0, seg.t0 + 1.4, t);
    const p = blend(lying(seg.from, c), bedSit(seg.to, c), k);
    p.face = FACE[seg.face];
    look(p, seg.target, c, ss(seg.t0 + 1.2, seg.t0 + 1.9, t));
    return p;
  },
};

/** reach toward the target (hold on it in the middle of the beat), used by pickUp / putDown / give / open */
function reachTo(x: ActCtx, reach: number): Pose {
  const { seg, t, c } = x;
  const p = idle(x, 1);
  const dur = Math.min(1.6, seg.t1 - seg.t0);
  const k = ss(seg.t0 + 0.05, seg.t0 + 0.55, t) * (1 - ss(seg.t0 + dur - 0.4, seg.t0 + dur, t));
  if (seg.target) {
    const low = seg.target[1] < p.y + 0.75;
    if (low) { p.spine = [p.spine[0] + 0.25 * k, p.spine[1], p.spine[2]]; p.chest = [p.chest[0] + 0.3 * k, p.chest[1], p.chest[2]]; p.hipY -= 0.08 * k; p.legL = { ...p.legL, kn: p.legL.kn + 0.4 * k }; p.legR = { ...p.legR, kn: p.legR.kn + 0.4 * k }; }
    armIK(p, -1, reachR(p, seg.target, c, reach), k, [0.4, -0.8, -0.1]);
  }
  p.handR = { curl: lerpN(0.35, 0.15, k), index: 0.1, thumb: 0.3 };
  return p;
}

function move(x: ActCtx, running: boolean): Pose {
  const { seg, t, c } = x;
  if (!seg.path || seg.moveT0 === undefined || seg.moveT1 === undefined) return idle(x);
  const t0 = seg.moveT0, t1 = seg.moveT1;
  if (t <= t1) {
    const w = running ? walkState(seg.path, t, t0, t1, 0.35, 0.45, 1.9, 1.0) : walkState(seg.path, t, t0, t1, 0.4, 0.6, 1.15, 0.85);
    // turn into the path first: the body comes round from where it faced (0.2–0.6 s by the angle) while the first
    // steps ease in — never a jump to the path direction on the first frame of the walk
    const dYaw = wrap(w.yaw - seg.from.yaw);
    const turnT = Math.min(0.6, Math.max(0.2, (Math.abs(dYaw) / Math.PI) * 0.6));
    const yaw = Math.abs(dYaw) > 0.05 ? seg.from.yaw + dYaw * ss(t0, t0 + turnT, t) : w.yaw;
    let p = base({ ...seg.from, x: w.p[0], z: w.p[1], yaw, posture: "stand" }, c);
    p = running ? runCycle(p, w.phase, Math.min(1, w.speed / 2.4)) : walkCycle(p, w.phase, w.moving);
    p.face = FACE[seg.face];
    look(p, seg.target, c, 0.7);
    return p;
  }
  // arrived: settle into the mark's facing
  const k = ss(t1, t1 + 0.6, t);
  const endYaw = Math.atan2(seg.path.at(seg.path.length).dir[0], seg.path.at(seg.path.length).dir[1]);
  const p = base({ ...seg.to, yaw: endYaw + wrap(seg.to.yaw - endYaw) * k }, c);
  shift(p, t, seg.seed);
  p.face = FACE[seg.face];
  look(p, seg.target, c, 0.8 * k);
  if (running) p.breath = 1.8;
  return p;
}

/** The pose for one segment at film time t, alive (blinks etc.). */
export const actPose = (x: ActCtx): Pose => {
  const { seg, t, c } = x;
  const p = ACT[seg.act](x);
  const r = seg.ride?.(t);
  if (r) {
    // rotate around the object's pivot, then move with it
    const ox = p.x - r.px, oz = p.z - r.pz, cs = Math.cos(r.dyaw), sn = Math.sin(r.dyaw);
    p.x = r.px + ox * cs + oz * sn + r.dx; p.z = r.pz - ox * sn + oz * cs + r.dz; p.yaw += r.dyaw;
  }
  if (seg.floor && seg.to.posture === "stand") p.y = seg.floor(p.x, p.z);
  if (seg.carry?.(t) && !(p.armR.ik && p.armR.ik.w > 0.4)) {
    p.armR = { ...p.armR, sw: 0.28, ab: 0.14, el: 0.95, wr: [0.15, 0, 0.1], ik: undefined };
    p.handR = { curl: 0.85, index: 0.8, thumb: 0.6 };
  }
  const h = seg.hands?.(t);
  if (h && h.w > 0) {
    armIK(p, 1, toChest(p, h.L, c), h.w, [0.3, -0.8, -0.4]);
    const R = toChest(p, h.R, c);
    armIK(p, -1, [R[0], R[1], R[2]], h.w, [0.3, -0.8, -0.4]);
    p.handL = { curl: 0.8, index: 0.7, thumb: 0.5 }; p.handR = { curl: 0.8, index: 0.7, thumb: 0.5 };
    p.chest = [p.chest[0] + 0.1 * h.w, p.chest[1], p.chest[2]];
  }
  return alive(p, t, seg.seed, seg.act === "sleep" || seg.face === "sleep");
};
/** Where an object held in the right hand sits, in chest space (matches the carry arm pose). */
export const CARRY_CHEST: [number, number, number] = [-0.21, -0.36, 0.2];

/** Which actions need which posture before they start. */
export const NEEDS: Partial<Record<ActionName, Posture[]>> = {
  walk: ["stand"], run: ["stand"], turn: ["stand"], push: ["stand"], kneel: ["stand"], wave: ["stand", "sit", "bedsit"], sit: ["stand"], standUp: ["sit"], write: ["sit"],
  lie: ["lie", "stand"], sleep: ["lie"], wake: ["lie"], sitUp: ["lie"],
};
