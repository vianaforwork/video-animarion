// Plain data types + constants shared by the picture (TSX) and Node scripts (director, sound): light rig
// state, camera, grade. No React / WebGL imports here, so Node's type stripping can load it.

export type V3 = [number, number, number];
export type PointL = { pos: V3; color: string; i: number; dist: number };
export type SpotL = { pos: V3; target: V3; color: string; i: number; angle: number; penumbra: number; dist: number };
export type LightState = {
  bg: string;
  fog: { color: string; density: number };
  env: number;
  hemi: { sky: string; ground: string; i: number };
  moon: { dir: V3; color: string; i: number; box: { min: V3; max: V3 } };
  spots: [SpotL, SpotL];
  pts: [PointL, PointL, PointL, PointL, PointL, PointL];
};

export const P_OFF: PointL = { pos: [0, -50, 0], color: "#ffffff", i: 0, dist: 1 };
export const S_OFF: SpotL = { pos: [0, 40, 0], target: [0, 0, 0], color: "#ffffff", i: 0, angle: 0.6, penumbra: 0.6, dist: 10 };

export type Cam = { pos: V3; target: V3; fov: number; roll?: number; focus?: number; aperture?: number; maxBlur?: number; near?: number; far?: number };

export type Grade = {
  exposure: number;
  /** additive lift in the shadows, multiplicative gain */
  lift: V3; gain: V3;
  sat: number; contrast: number;
  vignette: number; grain: number;
  bloom: number; bloomRadius: number; bloomThreshold: number;
  /** 0..1 flash toward `flashColor`, 0..1 fade to black */
  flash: number; flashColor: string; black: number;
  ao: number;
  /** lens chromatic fringe at the frame edge (0 = off) */
  ca: number;
};

export const GRADE0: Grade = {
  exposure: 1, lift: [0, 0, 0], gain: [1, 1, 1], sat: 1, contrast: 1, vignette: 0.22, grain: 0.016,
  bloom: 0.22, bloomRadius: 0.45, bloomThreshold: 1.05, flash: 0, flashColor: "#ffffff", black: 0, ao: 1, ca: 0.0012,
};

