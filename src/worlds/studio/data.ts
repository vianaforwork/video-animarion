// Studio places available in EVERY world (for the explanation passages): "mind" — a deep-blue neural
// space with the glass brain from Dunia Nabel EP01. Far away from every set, never shares a frame with it.

import { P_OFF, S_OFF, type LightState } from "../../cine/types.ts";
import type { Place, V3 } from "../types.ts";

export const MIND_O: V3 = [0, 0, 500];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const mind: Place = {
  id: "mind", doc: "studio: the glass brain floating in a deep-blue neural space (any world) — for explaining perception, memory, fear",
  kind: "studio", floor: MIND_O[1],
  marks: {},
  pois: { brain: MIND_O, front: add(MIND_O, [0, 0.1, 0.9]), top: add(MIND_O, [0, 0.8, 0]), back: add(MIND_O, [0, 0.1, -0.9]), left: add(MIND_O, [-0.9, 0, 0]), right: add(MIND_O, [0.9, 0, 0]) },
  box: { min: add(MIND_O, [-12, -6, -12]), max: add(MIND_O, [12, 8, 12]) },
  solids: [{ min: add(MIND_O, [-1.1, -0.9, -1.1]), max: add(MIND_O, [1.1, 1.0, 1.1]) }],
  establish: { center: MIND_O, radius: 4.2, height: 0.8, yaw: 0.6 },
  view: "brain", ambience: "studio", surface: "carpet", reverb: 0.6,
};

export const STUDIO: Record<string, Place> = { mind };

export const studioLight = (): LightState => ({
  bg: "#061426", fog: { color: "#061426", density: 0.0 }, env: 0.25,
  hemi: { sky: "#6fa8d8", ground: "#0b1a2c", i: 0.5 },
  moon: { dir: [0.3, 0.8, 0.5], color: "#cfe6ff", i: 1.6, box: { min: add(MIND_O, [-4, -3, -4]), max: add(MIND_O, [4, 4, 4]) } },
  spots: [S_OFF, S_OFF],
  pts: [{ pos: add(MIND_O, [0, 1.5, 3]), color: "#8fdcff", i: 3, dist: 9 }, { pos: add(MIND_O, [-2.5, 0.5, 1]), color: "#ffbf73", i: 1.6, dist: 7 }, P_OFF, P_OFF, P_OFF, P_OFF],
});
