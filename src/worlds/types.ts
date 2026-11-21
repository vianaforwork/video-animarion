// World contract (data side). A world = one consistent place made of named sub-locations ("places").
// Stories only ever name places, marks (where people stand/sit), POIs (what they look at) and set props
// (things that change: lamps, doors, a light at sea). Everything here is plain data + pure functions,
// importable by the director and the sound script (no JSX).

import type { LightState, V3 } from "../cine/types.ts";

export type { V3 };
export type Box = { min: V3; max: V3 };
export type Surface = "grass" | "wood" | "tile" | "stone" | "sand" | "metal" | "carpet";

/** A spot a person can stand at. `yaw` = facing (0 = +z), `seat` = seat height (sit), `bed` = lie here. */
export type Mark = { p: [number, number]; y?: number; yaw?: number; seat?: number; bed?: { head: [number, number]; y: number }; doc?: string };

export type Place = {
  id: string;
  doc: string;
  kind: "interior" | "exterior" | "studio";
  /** floor height under the people standing here */
  floor: number;
  marks: Record<string, Mark>;
  pois: Record<string, V3>;
  /** cameras are clamped into `box` and pushed out of every solid */
  box: Box;
  /** generated interiors: the camera must also be inside one of these (the rooms of the place) */
  zones?: Box[];
  /** walls etc. that block the view (line-of-sight checks only) */
  occluders?: Box[];
  solids: Box[];
  /** foliage (tree crowns, bushes): cameras are kept out, the view may pass through */
  soft?: Box[];
  /** the swing of every door leaf (cameras keep off it like off a solid; a shut door is air, so only a small margin) */
  swings?: Box[];
  /** ground height for cameras (exteriors with terrain) */
  ground?: (x: number, z: number) => number;
  /** hint for establishing shots: what to frame and from how far */
  establish: { center: V3; radius: number; height: number; yaw: number };
  /** the default looking direction for wides (a POI name) */
  view: string;
  /** interiors: a window POI to shoot far things through (long lens from just outside it) */
  window?: string;
  ambience: string;
  surface: Surface;
  /** 0 dry … 1 big hall (sound reverb) */
  reverb: number;
};

export type PropDoc = { default: number; doc: string; sfx?: { up?: string; down?: string } };
export type SetState = Record<string, number>;

export type WorldData = {
  id: string;
  doc: string;
  places: Record<string, Place>;
  times: string[];
  props: Record<string, PropDoc>;
  /** light rig for a place at a time of day, given the set state */
  light: (place: string, time: string, s: SetState, t: number) => LightState;
};

export const inBox = (p: V3, b: Box, m = 0) => p[0] > b.min[0] - m && p[0] < b.max[0] + m && p[1] > b.min[1] - m && p[1] < b.max[1] + m && p[2] > b.min[2] - m && p[2] < b.max[2] + m;

/** Keep a camera position legal for a place: inside its box, out of solids, above the ground. */
/** A camera position the set allows: inside the place, out of solids. `toward` (what the shot looks at) decides the
 *  side: the lens is pulled into the room the subject is in and pushed out of a wall on the subject's side. Without
 *  it the nearest room / face wins — and a camera path running through a thick wall then flips from one side to the
 *  other in a single frame (seen as flash cuts inside ↔ outside). Pure per frame: same input, same side, every frame. */
export const legalCam = (pl: Place, p: V3, toward?: V3): V3 => {
  const q: V3 = [
    Math.min(pl.box.max[0], Math.max(pl.box.min[0], p[0])),
    Math.min(pl.box.max[1], Math.max(pl.box.min[1], p[1])),
    Math.min(pl.box.max[2], Math.max(pl.box.min[2], p[2])),
  ];
  if (pl.zones?.length && !pl.zones.some((z) => inBox(q, z))) {
    // pull into the subject's room, else the nearest room
    const home = toward ? pl.zones.filter((z) => inBox(toward, z)) : [];
    let best = q, bd = Infinity;
    for (const z of home.length ? home : pl.zones) {
      const c: V3 = [Math.min(z.max[0], Math.max(z.min[0], q[0])), Math.min(z.max[1], Math.max(z.min[1], q[1])), Math.min(z.max[2], Math.max(z.min[2], q[2]))];
      const d = Math.hypot(c[0] - q[0], c[1] - q[1], c[2] - q[2]);
      if (d < bd) { bd = d; best = c; }
    }
    q[0] = best[0]; q[1] = best[1]; q[2] = best[2];
  }
  // solids keep 12 cm off the lens; foliage (irregular, bigger than its box) half a metre
  for (const [s, m] of [...pl.solids.map((b) => [b, 0.12] as const), ...(pl.swings ?? []).map((b) => [b, 0.12] as const), ...(pl.soft ?? []).map((b) => [b, 0.5] as const)]) {
    if (!inBox(q, s, m)) continue;
    // push out through the nearest face — among the faces on the subject's side when there are any
    const d = [q[0] - (s.min[0] - m), s.max[0] + m - q[0], q[1] - (s.min[1] - m), s.max[1] + m - q[1], q[2] - (s.min[2] - m), s.max[2] + m - q[2]];
    const facing = toward ? [toward[0] < s.min[0], toward[0] > s.max[0], toward[1] < s.min[1], toward[1] > s.max[1], toward[2] < s.min[2], toward[2] > s.max[2]] : [];
    const pickFrom = facing.some(Boolean) ? d.map((v, i) => (facing[i] ? v : Infinity)) : d;
    const k = pickFrom.indexOf(Math.min(...pickFrom));
    if (k === 0) q[0] = s.min[0] - m; else if (k === 1) q[0] = s.max[0] + m;
    else if (k === 2) q[1] = s.min[1] - m; else if (k === 3) q[1] = s.max[1] + m;
    else if (k === 4) q[2] = s.min[2] - m; else q[2] = s.max[2] + m;
  }
  if (pl.ground) q[1] = Math.max(q[1], pl.ground(q[0], q[2]) + 0.35);
  return q;
};
