// Performance helpers shared by every character: walking along plan paths with exact arrival times,
// world → chest space for arm IK, aiming the head, and the exact eye position (mirrors Character.tsx's
// transform chain) for POV cameras and eye close-ups. All pure functions of time.

import { Euler, Object3D, Vector3 } from "three";
import { planPath, type P2, type PlanPath } from "../../kits/worldforge/path.ts";
import { lerpN, type Pose } from "./pose.ts";
import type { CharSpec } from "./Character.tsx";
import type { V3 } from "../Lights.tsx";

export { planPath, type P2, type PlanPath };

/** Distance along a path with a trapezoid speed profile that ends exactly at the path end at t1. */
export const along = (path: PlanPath, t: number, t0: number, t1: number, acc: number, dec: number, v0 = 0) => {
  const T = t1 - t0, L = path.length;
  const v = (L - (v0 * acc) / 2) / (T - acc / 2 - dec / 2);
  const u = Math.min(Math.max(t - t0, 0), T);
  let s: number;
  if (u < acc) s = v0 * u + ((v - v0) * u * u) / (2 * acc);
  else if (u < T - dec) s = (v0 + v) * acc / 2 + v * (u - acc);
  else {
    const w = u - (T - dec);
    s = (v0 + v) * acc / 2 + v * (T - dec - acc) + v * w - (v * w * w) / (2 * dec);
  }
  return { s: Math.min(s, L), speed: u < acc ? v0 + ((v - v0) * u) / acc : u < T - dec ? v : v * (1 - (u - (T - dec)) / dec) };
};

export const yawOf = (d: P2) => Math.atan2(d[0], d[1]);

export const walkState = (path: PlanPath, t: number, t0: number, t1: number, acc: number, dec: number, stride: number, amt: number, v0 = 0) => {
  const { s, speed } = along(path, t, t0, t1, acc, dec, v0);
  const { p, dir } = path.at(s);
  return { p, yaw: yawOf(dir), phase: s / stride, moving: Math.min(1, speed / 0.5) * amt, speed };
};

const headH = (c: CharSpec) => (0.96 + 0.1 + 0.2 + 0.27 + 0.09 + 0.09) * c.scale;

/** World point → the character's chest space (unscaled rig units), for arm IK. Right arm: negate x. */
export const toChest = (p: Pose, w: V3, c: CharSpec): [number, number, number] => {
  // through the real hips → spine → chest rotations (a leaning or seated body moves its shoulders)
  trunk(p, c);
  const v = chain.chest.worldToLocal(new Vector3(w[0], w[1], w[2]));
  return [v.x, v.y, v.z];
};

/** Aim neck+head at a world point (k blends from the current pose). */
export const lookAt = (p: Pose, w: V3, c: CharSpec, k = 1) => {
  const dx = w[0] - p.x, dy = w[1] - (p.y + headH(c) + p.hipY * c.scale), dz = w[2] - p.z;
  const co = Math.cos(-p.yaw), s = Math.sin(-p.yaw);
  const lx = dx * co + dz * s, lz = -dx * s + dz * co;
  let yaw = Math.atan2(lx, lz);
  yaw = Math.max(-1.4, Math.min(1.4, yaw));
  const pitch = Math.max(-0.7, Math.min(0.7, Math.atan2(-dy, Math.hypot(lx, lz))));
  p.neck = [lerpN(p.neck[0], pitch * 0.4, k), lerpN(p.neck[1], yaw * 0.35, k), p.neck[2]];
  p.head = [lerpN(p.head[0], pitch * 0.6, k), lerpN(p.head[1], yaw * 0.65, k), p.head[2]];
};

const chain = (() => {
  const root = new Object3D(), hips = new Object3D(), spine = new Object3D(), chest = new Object3D(), neck = new Object3D(), head = new Object3D(), content = new Object3D(), eye = new Object3D();
  root.add(hips); hips.add(spine); spine.add(chest); chest.add(neck); neck.add(head); head.add(content); content.add(eye);
  return { root, hips, spine, chest, neck, head, content, eye };
})();

/** Pose the root → hips → spine → chest part of the chain exactly like Character.tsx does. */
const trunk = (p: Pose, c: CharSpec) => {
  const k = chain;
  k.root.position.set(p.x, p.y, p.z);
  k.root.rotation.set(0, p.yaw, 0);
  k.root.scale.setScalar(c.scale);
  k.hips.position.set(0, 0.96 + p.hipY, 0);
  k.hips.rotation.copy(new Euler(p.hips[0], p.hips[1], -p.hips[2], "YXZ"));
  k.spine.position.set(0, 0.1, 0);
  k.spine.rotation.copy(new Euler(p.spine[0], p.spine[1], -p.spine[2], "YXZ"));
  k.chest.position.set(0, 0.2, 0);
  k.chest.rotation.copy(new Euler(p.chest[0], p.chest[1], -p.chest[2], "YXZ"));
  k.root.updateMatrixWorld(true);
};

/** World position of the character's left eye (or any head-local point) and the head's forward direction. */
export const eyeExact = (p: Pose, c: CharSpec, local: V3 = [0.0375, 0.009, 0.0905]): { pos: V3; dir: V3; head: V3 } => {
  const k = chain;
  k.root.position.set(p.x, p.y, p.z);
  k.root.rotation.set(0, p.yaw, 0);
  k.root.scale.setScalar(c.scale);
  k.hips.position.set(0, 0.96 + p.hipY, 0);
  k.hips.rotation.copy(new Euler(p.hips[0], p.hips[1], -p.hips[2], "YXZ"));
  k.spine.position.set(0, 0.1, 0);
  k.spine.rotation.copy(new Euler(p.spine[0], p.spine[1], -p.spine[2], "YXZ"));
  k.chest.position.set(0, 0.2, 0);
  k.chest.rotation.copy(new Euler(p.chest[0], p.chest[1], -p.chest[2], "YXZ"));
  k.neck.position.set(0, 0.27, -0.01);
  k.neck.rotation.copy(new Euler(p.neck[0], p.neck[1], -p.neck[2], "YXZ"));
  k.head.position.set(0, 0.09, 0.01);
  k.head.rotation.copy(new Euler(p.head[0], p.head[1], -p.head[2], "YXZ"));
  k.content.position.set(0, 0.09, 0.01);
  k.content.scale.setScalar(c.headScale);
  k.eye.position.set(...local);
  k.root.updateMatrixWorld(true);
  const pos = new Vector3().setFromMatrixPosition(k.eye.matrixWorld);
  const ahead = new Vector3(local[0], local[1], local[2] + 0.2).applyMatrix4(k.content.matrixWorld);
  const dir = ahead.sub(pos).normalize();
  const hc = new Vector3(0, 0, 0).applyMatrix4(k.content.matrixWorld);
  return { pos: [pos.x, pos.y, pos.z], dir: [dir.x, dir.y, dir.z], head: [hc.x, hc.y, hc.z] };
};

/** Chest space (rig units, as used by IK targets) → world. Inverse of toChest. */
export const fromChest = (p: Pose, l: [number, number, number], c: CharSpec): V3 => {
  trunk(p, c);
  const v = new Vector3(l[0], l[1], l[2]).applyMatrix4(chain.chest.matrixWorld);
  return [v.x, v.y, v.z];
};

export const add3 = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
