import { Vector3 } from "three";
import type { Cam } from "../cine/Post.tsx";
import type { V3 } from "../cine/Lights.tsx";

/** Project a world point to overlay pixels (W × H: 1080×1920 portrait, 1920×1080 landscape); z < 0 = behind. */
export const project = (cam: Cam, p: V3, W = 1920, H = 1080): { x: number; y: number; z: number } => {
  const pos = new Vector3(...cam.pos), f = new Vector3(...cam.target).sub(pos).normalize();
  const right = new Vector3().crossVectors(f, new Vector3(0, 1, 0)).normalize();
  let up = new Vector3().crossVectors(right, f).normalize();
  const r = cam.roll ?? 0;
  if (r) {
    const u2 = up.clone().multiplyScalar(Math.cos(r)).addScaledVector(right, Math.sin(r));
    right.crossVectors(f, u2).normalize();
    up = u2;
  }
  const d = new Vector3(...p).sub(pos);
  const z = d.dot(f), x = d.dot(right), y = d.dot(up);
  const th = Math.tan((cam.fov * Math.PI) / 360);
  return { x: W / 2 + (x / (z * th * (W / H))) * (W / 2), y: H / 2 - (y / (z * th)) * (H / 2), z };
};
