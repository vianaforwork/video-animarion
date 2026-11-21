// Character pose (CINÉSTORY rig): a plain number tree, computed per frame from film time (no state, no clocks).
// Angles in radians. Conventions (character faces +Z, his left is +X):
//   spine/chest/neck/head [pitch fwd +, yaw to his left +, roll to his left +]
//   legs [swing fwd +, abduct out +, twist], knee bend +, ankle toes-up +
//   arms: either FK [swing fwd +, abduct out +, twist] + elbow bend, or an IK target in chest space.

export type E3 = [number, number, number];
export type Face = {
  browUp: number; // 0 neutral, 1 raised
  browIn: number; // 1 = inner ends up (worry)
  lid: number; // 1 open, 0 closed, >1 wide
  mouth: number; // −1 frown … 1 smile
  open: number; // 0 closed … 1 open
  eyeX: number; // gaze yaw (rad, to his left +)
  eyeY: number; // gaze pitch (rad, up +)
};
export type Hand = { curl: number; index: number; thumb: number };
export type Arm = { sw: number; ab: number; tw: number; el: number; wr: E3; ik?: { t: [number, number, number]; pole: [number, number, number]; w: number } };
export type Leg = { sw: number; ab: number; tw: number; kn: number; an: number };

export type Pose = {
  x: number; y: number; z: number; yaw: number;
  hipY: number; hips: E3;
  spine: E3; chest: E3; neck: E3; head: E3;
  armL: Arm; armR: Arm;
  legL: Leg; legR: Leg;
  handL: Hand; handR: Hand;
  face: Face;
  /** 0 none, 1 in the right hand, 2 in the left hand; screen brightness. */
  phone: number; phoneOn: number;
  /** breathing amplitude (0..1) and tremble (0..1) of the hands */
  breath: number; tremble: number;
  /** a held prop other than the phone (binoculars sit at the eyes; the rest in one hand, side 1 = left) */
  hold: Hold | null;
  /** mouth flap 0..1 added on top of face.open (dialogue) */
  talk: number;
  /** where a held light points (flashlight / lantern raised toward a target) */
  aim?: [number, number, number];
};
export type HoldKind = "binoculars" | "lantern" | "flashlight" | "mug" | "book" | "pen";
export type Hold = { kind: HoldKind; side: 1 | -1; on: number };

const arm = (): Arm => ({ sw: 0.04, ab: 0.09, tw: 0, el: 0.18, wr: [0, 0, 0] });
const leg = (): Leg => ({ sw: 0, ab: 0.02, tw: 0, kn: 0.04, an: 0 });
export const FACE0: Face = { browUp: 0, browIn: 0, lid: 0.88, mouth: 0.05, open: 0, eyeX: 0, eyeY: 0 };

export const restPose = (): Pose => ({
  x: 0, y: 0, z: 0, yaw: 0,
  hipY: 0, hips: [0, 0, 0],
  spine: [0, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [0, 0, 0],
  armL: arm(), armR: arm(),
  legL: leg(), legR: leg(),
  handL: { curl: 0.35, index: 0.3, thumb: 0.2 }, handR: { curl: 0.35, index: 0.3, thumb: 0.2 },
  face: { ...FACE0 },
  phone: 0, phoneOn: 0,
  breath: 1, tremble: 0,
  hold: null, talk: 0,
});

export const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: E3, b: E3, k: number): E3 => [lerpN(a[0], b[0], k), lerpN(a[1], b[1], k), lerpN(a[2], b[2], k)];
const lerpArm = (a: Arm, b: Arm, k: number): Arm => ({
  sw: lerpN(a.sw, b.sw, k), ab: lerpN(a.ab, b.ab, k), tw: lerpN(a.tw, b.tw, k), el: lerpN(a.el, b.el, k), wr: lerp3(a.wr, b.wr, k),
  ik: a.ik || b.ik ? {
    t: lerp3((a.ik ?? b.ik)!.t, (b.ik ?? a.ik)!.t, k),
    pole: lerp3((a.ik ?? b.ik)!.pole, (b.ik ?? a.ik)!.pole, k),
    w: lerpN(a.ik?.w ?? 0, b.ik?.w ?? 0, k),
  } : undefined,
});
const lerpLeg = (a: Leg, b: Leg, k: number): Leg => ({ sw: lerpN(a.sw, b.sw, k), ab: lerpN(a.ab, b.ab, k), tw: lerpN(a.tw, b.tw, k), kn: lerpN(a.kn, b.kn, k), an: lerpN(a.an, b.an, k) });
const lerpHand = (a: Hand, b: Hand, k: number): Hand => ({ curl: lerpN(a.curl, b.curl, k), index: lerpN(a.index, b.index, k), thumb: lerpN(a.thumb, b.thumb, k) });
const lerpFace = (a: Face, b: Face, k: number): Face => {
  const o = { ...a };
  for (const key of Object.keys(a) as (keyof Face)[]) o[key] = lerpN(a[key], b[key], k);
  return o;
};

/** Blend two whole poses (yaw shortest way). */
export const blend = (a: Pose, b: Pose, k: number): Pose => {
  if (k <= 0) return a;
  if (k >= 1) return b;
  let dy = b.yaw - a.yaw;
  while (dy > Math.PI) dy -= Math.PI * 2;
  while (dy < -Math.PI) dy += Math.PI * 2;
  return {
    x: lerpN(a.x, b.x, k), y: lerpN(a.y, b.y, k), z: lerpN(a.z, b.z, k), yaw: a.yaw + dy * k,
    hipY: lerpN(a.hipY, b.hipY, k), hips: lerp3(a.hips, b.hips, k),
    spine: lerp3(a.spine, b.spine, k), chest: lerp3(a.chest, b.chest, k), neck: lerp3(a.neck, b.neck, k), head: lerp3(a.head, b.head, k),
    armL: lerpArm(a.armL, b.armL, k), armR: lerpArm(a.armR, b.armR, k),
    legL: lerpLeg(a.legL, b.legL, k), legR: lerpLeg(a.legR, b.legR, k),
    handL: lerpHand(a.handL, b.handL, k), handR: lerpHand(a.handR, b.handR, k),
    face: lerpFace(a.face, b.face, k),
    phone: k < 0.5 ? a.phone : b.phone, phoneOn: lerpN(a.phoneOn, b.phoneOn, k),
    breath: lerpN(a.breath, b.breath, k), tremble: lerpN(a.tremble, b.tremble, k),
    hold: a.hold && b.hold && a.hold.kind === b.hold.kind ? { ...b.hold, on: lerpN(a.hold.on, b.hold.on, k) } : k < 0.5 ? a.hold : b.hold,
    talk: lerpN(a.talk, b.talk, k),
  };
};

const TAU = Math.PI * 2;
const D = Math.PI / 180;

/**
 * Walk cycle at gait phase `p` (cycles; left heel strike near p = 0.25). `amt` scales the stride
 * (1 = normal walk, 0.6 = careful), `climb` adds stair knee lift.
 */
export const walkCycle = (pose: Pose, p: number, amt = 1, climb = 0): Pose => {
  const o = { ...pose, legL: { ...pose.legL }, legR: { ...pose.legR }, armL: { ...pose.armL }, armR: { ...pose.armR } };
  const legAt = (ph: number, l: Leg) => {
    const s = Math.sin(TAU * ph), c = Math.cos(TAU * ph);
    l.sw = (22 * D * s + climb * 26 * D * Math.max(0, c) + climb * 10 * D) * amt;
    l.kn = (6 * D + 52 * D * Math.pow(Math.max(0, c), 1.4) + climb * 40 * D * Math.max(0, c)) * (0.55 + 0.45 * amt) + climb * 12 * D;
    l.an = (10 * D * Math.max(0, c) - 14 * D * Math.max(0, -Math.sin(TAU * ph + 0.9))) * amt;
  };
  legAt(p, o.legL);
  legAt(p + 0.5, o.legR);
  o.hipY = pose.hipY - (0.012 + 0.012 * amt) * (0.5 - 0.5 * Math.cos(TAU * 2 * p - Math.PI)) - climb * 0.04;
  const sway = Math.sin(TAU * p);
  o.hips = [pose.hips[0] + climb * 8 * D, pose.hips[1] + 5 * D * sway * amt, pose.hips[2] + 2 * D * Math.cos(TAU * p) * amt];
  o.chest = [pose.chest[0] + climb * 5 * D, pose.chest[1] - 7 * D * sway * amt, pose.chest[2]];
  if (!o.armL.ik) { o.armL.sw = pose.armL.sw - 0.32 * sway * amt; o.armL.el = pose.armL.el + 0.12 * amt + 0.1 * Math.max(0, -sway) * amt; }
  if (!o.armR.ik && !o.phone) { o.armR.sw = pose.armR.sw + 0.32 * sway * amt; o.armR.el = pose.armR.el + 0.12 * amt + 0.1 * Math.max(0, sway) * amt; }
  return o;
};

/** Run cycle at gait phase `p`: long stride, flight phase, forward lean, pumping arms (elbows ~90°). */
export const runCycle = (pose: Pose, p: number, amt = 1): Pose => {
  const o = { ...pose, legL: { ...pose.legL }, legR: { ...pose.legR }, armL: { ...pose.armL }, armR: { ...pose.armR } };
  const legAt = (ph: number, l: Leg) => {
    const s = Math.sin(TAU * ph), c = Math.cos(TAU * ph);
    l.sw = (34 * D * s + 12 * D) * amt;
    l.kn = (14 * D + 95 * D * Math.pow(Math.max(0, c), 1.2) + 20 * D * Math.max(0, s)) * amt;
    l.an = (16 * D * Math.max(0, c) - 22 * D * Math.max(0, -Math.sin(TAU * ph + 0.9))) * amt;
  };
  legAt(p, o.legL);
  legAt(p + 0.5, o.legR);
  o.hipY = pose.hipY - 0.05 * amt + 0.035 * amt * Math.abs(Math.sin(TAU * p));
  const sway = Math.sin(TAU * p);
  o.hips = [pose.hips[0] + 0.1 * amt, pose.hips[1] + 8 * D * sway * amt, pose.hips[2]];
  o.spine = [pose.spine[0] + 0.12 * amt, pose.spine[1], pose.spine[2]];
  o.chest = [pose.chest[0], pose.chest[1] - 12 * D * sway * amt, pose.chest[2]];
  if (!o.armL.ik) { o.armL.sw = pose.armL.sw - 0.75 * sway * amt; o.armL.el = 1.45 * amt + 0.2; o.armL.ab = 0.16; }
  if (!o.armR.ik) { o.armR.sw = pose.armR.sw + 0.75 * sway * amt; o.armR.el = 1.45 * amt + 0.2; o.armR.ab = 0.16; }
  return o;
};

/** Holding the phone in front of the chest, screen toward the face. */
export const phoneArm = (): Arm => ({ sw: 0.25, ab: 0.12, tw: 0, el: 1.7, wr: [0.2, 0, 0], ik: { t: [-0.05, 0.1, 0.33], pole: [-0.6, -0.7, -0.2], w: 1 } });
