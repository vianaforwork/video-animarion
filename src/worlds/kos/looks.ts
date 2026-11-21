// Light + grade presets per location/mood for episode 01. Mystery = deep blue ambient, warm practical
// from the terrace behind the hero, cold moon from ahead; never crushed (lifted blue shadows).

import { GRADE0, type Grade } from "../../cine/types.ts";
import { P_OFF, S_OFF, type LightState, type PointL, type SpotL } from "../../cine/types.ts";
import { CLOCK, END_Z, GUDANG, ENTRANCE_Z, HALL, ROOM_DOOR, ROOM, SMALL_WIN, STREET_LAMP, TERRACE_LAMP, type V3 } from "./layout.ts";

const box = (min: V3, max: V3) => ({ min, max });

/** Moon direction (toward the moon): from the left (−x), high, slightly in front (+z). */
export const MOON: V3 = [-0.37, 0.61, 0.69];

/** Terrace lamp as a shadow spot pointing down the hallway (warm, from behind the hero). */
export const TERRACE_SPOT: SpotL = {
  pos: [TERRACE_LAMP[0] - 0.6, TERRACE_LAMP[1] - 0.15, TERRACE_LAMP[2] - 0.1], target: [0, 0.2, -9], color: "#ffb36a", i: 22, angle: 0.62, penumbra: 0.8, dist: 24,
};

const clockGlow: PointL = { pos: [CLOCK[0] + 0.03, CLOCK[1] + 0.06, CLOCK[2] - 0.08], color: "#ff3b2a", i: 0.035, dist: 0.7 };

export const L_ROOM: LightState = {
  bg: "#04070d", fog: { color: "#0a1222", density: 0.02 }, env: 0.06,
  hemi: { sky: "#3d5585", ground: "#120e0c", i: 0.32 },
  moon: { dir: MOON, color: "#8fb0ff", i: 4.2, box: box([ROOM.x0 - 0.3, -0.1, ROOM.z0 - 0.2], [ROOM.x1 + 0.2, 2.9, ROOM.z1 + 0.2]) },
  spots: [S_OFF, S_OFF],
  pts: [
    clockGlow,
    { pos: [-2.9, 1.4, -6.1], color: "#5c78b6", i: 0.9, dist: 4 }, // bounce off the moonlit floor
    { pos: [HALL.x0 - 0.3, 0.12, ROOM_DOOR.z], color: "#ffb36a", i: 0.25, dist: 1.6 }, // warm sliver under the door
    { pos: [-1.6, 2.2, -4.4], color: "#3a4d78", i: 0.5, dist: 4 },
    P_OFF, P_OFF,
  ],
};

export const L_HALL: LightState = {
  bg: "#04070d", fog: { color: "#0b1426", density: 0.045 }, env: 0.05,
  hemi: { sky: "#3b5384", ground: "#15110e", i: 0.34 },
  moon: { dir: MOON, color: "#8fb0ff", i: 5.0, box: box([HALL.x0 - 0.3, -0.1, END_Z - 0.4], [HALL.x1 + 0.3, 2.95, ENTRANCE_Z + 0.2]) },
  spots: [TERRACE_SPOT, S_OFF],
  pts: [
    { pos: [0, 2.0, ENTRANCE_Z - 0.6], color: "#ffb36a", i: 1.6, dist: 5 }, // terrace spill near the entrance
    { pos: [0.25, 1.7, END_Z + 1.6], color: "#4766a8", i: 0.8, dist: 5 }, // cold fill at the end (moonlit window bounce)
    { pos: [0.0, 2.3, -9.5], color: "#2c3f6a", i: 0.6, dist: 6 },
    { pos: [GUDANG.x, 2.34, END_Z - 0.3], color: "#5774b0", i: 0.25, dist: 1.0 }, // moon in the gudang behind the vent
    P_OFF, P_OFF,
  ],
};

/** Exterior establishing: moon, terrace lamp, street sodium lamp. */
export const L_EXT: LightState = {
  bg: "#060b18", fog: { color: "#16233e", density: 0.018 }, env: 0.12,
  hemi: { sky: "#4b5f8e", ground: "#1a1714", i: 0.34 },
  moon: { dir: MOON, color: "#a9c2ff", i: 0.9, box: box([-6, -0.3, -2], [6, 6, 9]) },
  spots: [{ ...TERRACE_SPOT, pos: [TERRACE_LAMP[0], TERRACE_LAMP[1] - 0.05, TERRACE_LAMP[2]], target: [TERRACE_LAMP[0], 0, TERRACE_LAMP[2] + 1.6], angle: 1.15, i: 9, dist: 9 }, S_OFF],
  pts: [
    { pos: [STREET_LAMP[0] - 0.35, STREET_LAMP[1] - 0.25, STREET_LAMP[2]], color: "#ffad5c", i: 14, dist: 14 },
    { pos: [0, 1.8, ENTRANCE_Z - 1.5], color: "#ffb36a", i: 0.8, dist: 4 },
    { pos: [-3, 2.5, 4], color: "#5a6fa0", i: 1.2, dist: 7 },
    P_OFF, P_OFF, P_OFF,
  ],
};

/** Motorbike headlight passing in the side passage, beam through the small window (u: 0..1 pass). */
export const bikeLight = (u: number): SpotL => {
  const k = Math.max(0, Math.min(1, u));
  const env = Math.sin(Math.PI * k);
  const zc = (SMALL_WIN.z0 + SMALL_WIN.z1) / 2;
  // through the window toward the end wall behind the raincoat: the patch (and the coat's shadow) slide
  return {
    pos: [-2.7, 2.5, zc + 2.4 - 2.2 * k],
    target: [-0.3, 1.45, END_Z],
    color: "#f4f1ff", i: 70 * env, angle: 0.3, penumbra: 0.45, dist: 9,
  };
};

export const G_NIGHT: Grade = {
  ...GRADE0, exposure: 1.5, lift: [0.02, 0.03, 0.058], gain: [0.96, 1.0, 1.07], sat: 0.9, contrast: 1.05,
  vignette: 0.36, grain: 0.024, bloom: 0.32, bloomRadius: 0.55, bloomThreshold: 0.92, ca: 0.0016,
};
export const G_EXT: Grade = { ...G_NIGHT, exposure: 1.0, sat: 0.9, vignette: 0.34 };

// ── Acts 2–6 ────────────────────────────────────────────────────────────────

/** Far-away sets for the science passages (never share a frame with the kos). */
export const MIND_O: V3 = [0, 0, 500];
export const LAB_O: V3 = [0, 0, -500];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const tubePt = (p: V3, i = 2.2): PointL => ({ pos: [p[0], p[1] - 0.6, p[2]], color: "#eaf2ff", i, dist: 7.5 });
/** Hallway at night with the ceiling tubes on (one hour earlier; the ending). */
export const L_HALL_LIT: LightState = {
  bg: "#0a0c10", fog: { color: "#20242c", density: 0.012 }, env: 0.07,
  hemi: { sky: "#d9e2ee", ground: "#4a4036", i: 0.55 },
  moon: { ...L_HALL.moon, i: 0.35 },
  spots: [{ ...TERRACE_SPOT, i: 1.5 }, S_OFF],
  pts: [tubePt([0, 2.77, -4.0]), tubePt([0, 2.77, -10.0]), { pos: [0, 1.4, -7.0], color: "#f2e6d4", i: 0.8, dist: 6 }, { pos: [0.2, 1.8, END_Z + 1.2], color: "#dfe6f0", i: 0.7, dist: 4 }, P_OFF, P_OFF],
};

/** Morning outside (Act 5): low warm sun, blue sky fill. */
export const L_DAY_EXT: LightState = {
  bg: "#cfe0ef", fog: { color: "#dfe8f0", density: 0.006 }, env: 0.7,
  hemi: { sky: "#c4daf2", ground: "#7a6a58", i: 1.1 },
  moon: { dir: [0.55, 0.62, 0.56], color: "#fff0d8", i: 3.4, box: box([-6, -0.3, -4], [6, 6, 9]) },
  spots: [S_OFF, S_OFF],
  pts: [{ pos: [0, 2.0, ENTRANCE_Z - 1.0], color: "#fff4e4", i: 1.5, dist: 5 }, P_OFF, P_OFF, P_OFF, P_OFF, P_OFF],
};

/** The hallway in clear light (Act 5 reveal, recreated angles): everything visible. */
export const L_HALL_CLEAR: LightState = {
  bg: "#d9e0e8", fog: { color: "#cfd6de", density: 0.004 }, env: 0.18,
  hemi: { sky: "#eef2f6", ground: "#6f655a", i: 0.95 },
  moon: { dir: [0.25, 0.55, 0.8], color: "#fff4e4", i: 2.4, box: L_HALL.moon.box },
  spots: [S_OFF, S_OFF],
  pts: [tubePt([0, 2.77, -4.0], 2.2), tubePt([0, 2.77, -10.0], 2.2), { pos: [0, 1.6, -13.2], color: "#f6f2ea", i: 1.6, dist: 5 }, { pos: [-0.3, 2.0, ENTRANCE_Z - 0.5], color: "#fff6e8", i: 2.5, dist: 6 }, P_OFF, P_OFF],
};

/** CCTV playback: flat, high-key monochrome (graded to grey in G_CCTV). */
export const L_CCTV: LightState = {
  bg: "#101010", fog: { color: "#202020", density: 0.01 }, env: 0.5,
  hemi: { sky: "#ffffff", ground: "#5a5a5a", i: 1.25 },
  moon: { ...L_HALL.moon, i: 1.4 },
  spots: [{ ...TERRACE_SPOT, i: 8 }, S_OFF],
  pts: [{ pos: [0.4, 2.4, 0.6], color: "#ffffff", i: 3.5, dist: 9 }, { pos: [0, 2.2, -7], color: "#ffffff", i: 2.2, dist: 7 }, { pos: [0, 2.0, -12.5], color: "#ffffff", i: 1.8, dist: 6 }, P_OFF, P_OFF, P_OFF],
};

/** Neural space (inside the head): emissive content on a deep teal backdrop. */
export const L_MIND: LightState = {
  bg: "#061426", fog: { color: "#061426", density: 0.0 }, env: 0.25,
  hemi: { sky: "#6fa8d8", ground: "#0b1a2c", i: 0.5 },
  moon: { dir: [0.3, 0.8, 0.5], color: "#cfe6ff", i: 1.6, box: box(add(MIND_O, [-4, -3, -4]), add(MIND_O, [4, 4, 4])) },
  spots: [S_OFF, S_OFF],
  pts: [{ pos: add(MIND_O, [0, 1.5, 3]), color: "#8fdcff", i: 3, dist: 9 }, { pos: add(MIND_O, [-2.5, 0.5, 1]), color: "#ffbf73", i: 1.6, dist: 7 }, P_OFF, P_OFF, P_OFF, P_OFF],
};

/** Clean science studio (cyclorama). */
export const L_LAB: LightState = {
  bg: "#aeb8c3", fog: { color: "#b4bdc7", density: 0.01 }, env: 0.32,
  hemi: { sky: "#f2f6fa", ground: "#7d8794", i: 0.55 },
  moon: { dir: [0.35, 0.85, 0.45], color: "#ffffff", i: 1.5, box: box(add(LAB_O, [-5, -0.2, -5]), add(LAB_O, [5, 4, 5])) },
  spots: [S_OFF, S_OFF],
  pts: [{ pos: add(LAB_O, [-2.5, 2.5, 3]), color: "#e8f4ff", i: 1.6, dist: 10 }, { pos: add(LAB_O, [3, 2, 2]), color: "#fff1e0", i: 1.2, dist: 10 }, P_OFF, P_OFF, P_OFF, P_OFF],
};

/** Overhead "dollhouse" view of the whole kos at night. */
export const L_DIORAMA: LightState = {
  ...L_HALL,
  fog: { color: "#0b1426", density: 0.004 },
  hemi: { sky: "#5b72a8", ground: "#1a1612", i: 0.75 },
  moon: { dir: [-0.25, 0.92, 0.3], color: "#a9c2ff", i: 2.6, box: box([-5, -0.3, -19], [5, 3.2, 2]) },
  spots: [{ ...TERRACE_SPOT, i: 14 }, S_OFF],
};

/** The gudang: moonlight from the back window + hallway spill; bulb on later. */
export const L_GUDANG: LightState = {
  bg: "#05070b", fog: { color: "#0b1220", density: 0.02 }, env: 0.12,
  hemi: { sky: "#4a5f8c", ground: "#16120f", i: 0.45 },
  moon: { dir: [0.2, 0.55, -0.8], color: "#8fb0ff", i: 3.2, box: box([-1.2, -0.1, -18.6], [2, 3, -14.8]) },
  spots: [S_OFF, S_OFF],
  pts: [{ pos: [0.22, 1.4, END_Z + 0.4], color: "#ffd9b0", i: 1.6, dist: 4 }, { pos: [0.4, 2.3, -16.7], color: "#ffd9a0", i: 0, dist: 7 }, { pos: [0.5, 1.5, -17.5], color: "#4a64a0", i: 0.5, dist: 4 }, P_OFF, P_OFF, P_OFF],
};

export const G_LIT: Grade = { ...GRADE0, exposure: 1.0, lift: [0.012, 0.01, 0.008], gain: [1.03, 1.0, 0.96], sat: 0.95, contrast: 1.04, vignette: 0.26, grain: 0.018, bloom: 0.14, bloomRadius: 0.45, bloomThreshold: 1.35, ca: 0.001 };
export const G_MEMORY: Grade = { ...G_LIT, lift: [0.03, 0.022, 0.012], gain: [1.05, 0.99, 0.9], sat: 0.82, contrast: 0.98, vignette: 0.34, grain: 0.03 };
export const G_STORY: Grade = { ...G_NIGHT, exposure: 1.2, lift: [0.01, 0.03, 0.04], gain: [0.86, 0.98, 1.0], sat: 0.55, contrast: 1.12, vignette: 0.5, grain: 0.045 };
export const G_DAY: Grade = { ...GRADE0, exposure: 0.95, lift: [0.01, 0.01, 0.012], gain: [1.02, 1.0, 0.98], sat: 1.0, contrast: 1.03, vignette: 0.18, grain: 0.012, bloom: 0.15, bloomThreshold: 1.1, ca: 0.0008 };
export const G_CLEAR: Grade = { ...G_DAY, exposure: 1.0, vignette: 0.2 };
export const G_CCTV: Grade = { ...GRADE0, exposure: 1.35, lift: [0.04, 0.05, 0.04], gain: [0.92, 1.0, 0.9], sat: 0.0, contrast: 1.18, vignette: 0.5, grain: 0.06, bloom: 0.1, bloomThreshold: 1.2, ca: 0.003 };
export const G_MIND: Grade = { ...GRADE0, exposure: 1.1, lift: [0.0, 0.01, 0.02], sat: 1.05, contrast: 1.05, vignette: 0.3, grain: 0.014, bloom: 0.45, bloomRadius: 0.6, bloomThreshold: 0.75, ca: 0.0012, ao: 0 };
export const G_LAB: Grade = { ...GRADE0, exposure: 1.0, sat: 0.95, contrast: 1.02, vignette: 0.14, grain: 0.008, bloom: 0.12, bloomThreshold: 1.1, ca: 0 };

/** the bedroom in the morning: sun through the window, bright sky fill. */
export const L_ROOM_DAY: LightState = {
  bg: "#cfe0ef", fog: { color: "#c9d6e2", density: 0.004 }, env: 0.5,
  hemi: { sky: "#e6eef6", ground: "#6f655a", i: 0.85 },
  moon: { dir: [-0.6, 0.55, 0.3], color: "#fff0d8", i: 3.6, box: L_ROOM.moon.box },
  spots: [S_OFF, S_OFF],
  pts: [{ pos: [-3.6, 1.6, -5.5], color: "#fff6ea", i: 1.6, dist: 5 }, { pos: [-1.6, 2.2, -4.6], color: "#eef3f8", i: 1.0, dist: 5 }, P_OFF, P_OFF, P_OFF, P_OFF],
};
