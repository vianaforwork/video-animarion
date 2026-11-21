// Coast world, data side: places (marks, POIs, camera space), set props and the light rig per time.

import { P_OFF, S_OFF, type LightState, type PointL } from "../../cine/types.ts";
import type { Place, SetState, WorldData } from "../types.ts";
import { BED_AT, BENCH, BOAT, COTTAGE, C_DOOR, C_WIN, DECK_Y, DESK, DESK_TOP, LAMP, LANTERN, LH, MOON, SEA_LIGHT, SUN_DAWN, TOP, beamAngle, ground } from "./layout.ts";

const SEA = { sea: [-40, 1, -200] as [number, number, number], light: SEA_LIGHT, horizon: [0, 2, -600] as [number, number, number], boat: [BOAT[0], 1.5, BOAT[2]] as [number, number, number] };
const towerSolid = { min: [-LH.r0 - 0.4, -8, -LH.r0 - 0.4] as [number, number, number], max: [LH.r0 + 0.4, DECK_Y - 0.1, LH.r0 + 0.4] as [number, number, number] };
const lanternSolid = { min: [-LANTERN.r - 0.15, DECK_Y, -LANTERN.r - 0.15] as [number, number, number], max: [LANTERN.r + 0.15, LANTERN.y1 + 1.6, LANTERN.r + 0.15] as [number, number, number] };
const cottageSolid = { min: [COTTAGE.x0 - 0.2, TOP - 2, COTTAGE.z0 - 0.2] as [number, number, number], max: [COTTAGE.x1 + 0.2, TOP + COTTAGE.h + 1.9, COTTAGE.z1 + 0.2] as [number, number, number] };

const cliff: Place = {
  id: "cliff", doc: "the headland outside: lighthouse, keeper's cottage, bench and fence at the cliff edge, the open sea below",
  kind: "exterior", floor: TOP,
  marks: {
    "cottage-door": { p: [6.3, C_DOOR.z], yaw: -Math.PI / 2, doc: "outside the cottage door" },
    "lighthouse-door": { p: [3.2, 0], yaw: -Math.PI / 2, doc: "at the lighthouse door" },
    path: { p: [4.6, -2.8], yaw: Math.PI, doc: "on the path between the buildings, facing the sea" },
    edge: { p: [2.4, -6.7], yaw: Math.PI, doc: "at the fence on the cliff edge, facing the sea" },
    "edge-left": { p: [-3.2, -6.3], yaw: Math.PI, doc: "further left along the fence" },
    bench: { p: [BENCH[0], BENCH[2] + 0.12], yaw: Math.PI, seat: 0.45, doc: "the bench facing the sea (sit)" },
  },
  pois: { ...SEA, "lighthouse-top": [0, LANTERN.y0 + 1.5, 0], lighthouse: [0, TOP + 8, 0], cottage: [10, TOP + 1.6, 0], "cottage-window": [C_WIN.x, TOP + 1.6, COTTAGE.z0], "cottage-door": [COTTAGE.x0, TOP + 1.1, C_DOOR.z], bench: [BENCH[0], TOP + 0.5, BENCH[2]], moon: [MOON[0] * 500, MOON[1] * 500, MOON[2] * 500] },
  box: { min: [-60, TOP - 6, -120], max: [60, 70, 60] },
  solids: [towerSolid, cottageSolid],
  ground,
  establish: { center: [2, TOP + 8, -3], radius: 42, height: 9, yaw: 2.4 },
  view: "sea", ambience: "coast", surface: "grass", reverb: 0.1,
};

const gallery: Place = {
  id: "gallery", doc: "the balcony around the lamp room at the top of the lighthouse, railing, the sea far below",
  kind: "exterior", floor: DECK_Y,
  marks: {
    "gallery-sea": { p: [0.35, -1.95], y: DECK_Y, yaw: Math.PI, doc: "at the railing facing the sea" },
    "gallery-left": { p: [-1.75, -1.0], y: DECK_Y, yaw: Math.PI + 0.9, doc: "railing, left side" },
    "gallery-door": { p: [1.95, 0.4], y: DECK_Y, yaw: -Math.PI / 2, doc: "by the lamp-room door" },
  },
  pois: { ...SEA, lamp: LAMP, cottage: [10, TOP + 1.6, 0], below: [2, TOP, -8] },
  box: { min: [-30, DECK_Y - 3, -30], max: [30, DECK_Y + 25, 30] },
  solids: [towerSolid, lanternSolid],
  ground,
  establish: { center: [0, DECK_Y + 1.2, 0], radius: 9, height: 4, yaw: 2.3 },
  view: "sea", ambience: "gallery", surface: "metal", reverb: 0.05,
};

const cottage: Place = {
  id: "cottage", doc: "inside the keeper's cottage: desk with logbook, oil lamp and radio under the sea window, bed, door",
  kind: "interior", floor: COTTAGE.y,
  marks: {
    desk: { p: [DESK[0], DESK[2] + 0.72], y: COTTAGE.y, yaw: Math.PI, seat: 0.46, doc: "the chair at the desk, facing the window (sit)" },
    window: { p: [11.55, -1.75], y: COTTAGE.y, yaw: Math.PI, doc: "standing at the window" },
    door: { p: [7.75, C_DOOR.z], y: COTTAGE.y, yaw: Math.PI / 2, doc: "just inside the door" },
    middle: { p: [9.4, 0.4], y: COTTAGE.y, yaw: Math.PI, doc: "middle of the room" },
    bed: { p: [BED_AT[0], BED_AT[2]], y: COTTAGE.y, yaw: -Math.PI / 2, bed: { head: [12.65, BED_AT[2]], y: 0.58 }, doc: "the bed (lie / sit up / wake)" },
  },
  pois: { ...SEA, window: [C_WIN.x, COTTAGE.y + 1.5, COTTAGE.z0], logbook: [DESK[0] - 0.15, COTTAGE.y + DESK_TOP + 0.02, DESK[2] + 0.05], lamp: [DESK[0] + 0.5, COTTAGE.y + DESK_TOP + 0.2, DESK[2] - 0.05], radio: [DESK[0] - 0.55, COTTAGE.y + DESK_TOP + 0.12, DESK[2] - 0.1], door: [COTTAGE.x0, COTTAGE.y + 1.1, C_DOOR.z], bed: [BED_AT[0], COTTAGE.y + 0.6, BED_AT[2]] },
  box: { min: [COTTAGE.x0 + 0.3, COTTAGE.y + 0.3, COTTAGE.z0 + 0.3], max: [COTTAGE.x1 - 0.3, COTTAGE.y + COTTAGE.h - 0.2, COTTAGE.z1 - 0.3] },
  solids: [
    { min: [DESK[0] - 0.7, COTTAGE.y, DESK[2] - 0.35], max: [DESK[0] + 0.7, COTTAGE.y + DESK_TOP + 0.3, DESK[2] + 0.35] },
    { min: [BED_AT[0] - 1.0, COTTAGE.y, BED_AT[2] - 0.5], max: [BED_AT[0] + 1.0, COTTAGE.y + 0.7, BED_AT[2] + 0.5] },
  ],
  establish: { center: [10, COTTAGE.y + 1.1, -0.6], radius: 2.6, height: 1.6, yaw: -0.6 },
  view: "window", window: "window", ambience: "cottage", surface: "wood", reverb: 0.25,
};

const sea: Place = {
  id: "sea", doc: "out on the water near the fishing boat (outrigger perahu with a lamp pole); the headland far behind",
  kind: "exterior", floor: 0,
  marks: {},
  pois: { boat: [BOAT[0], 1.5, BOAT[2]], lamps: [BOAT[0], 4.1, BOAT[2]], lighthouse: [0, LANTERN.y0 + 1.5, 0], cliff: [2, TOP, -8], horizon: [0, 2, -600] },
  box: { min: [-140, 0.9, -330], max: [60, 80, -60] },
  solids: [{ min: [BOAT[0] - 5, -2, BOAT[2] - 6], max: [BOAT[0] + 5, 5, BOAT[2] + 6] }],
  establish: { center: [BOAT[0], 2, BOAT[2]], radius: 26, height: 7, yaw: 0.9 },
  view: "boat", ambience: "sea", surface: "wood", reverb: 0.0,
};

type TimeLook = { bg: string; fog: string; hemiSky: string; hemiGround: string; hemi: number; key: string; keyI: number; dir: [number, number, number]; env: number; fill: string; dark: number };
const TIMES: Record<string, TimeLook> = {
  night: { bg: "#050913", fog: "#0c1626", hemiSky: "#2b3f66", hemiGround: "#0b0c0e", hemi: 0.5, key: "#a8c0ff", keyI: 2.4, dir: MOON, env: 0.05, fill: "#3e5c96", dark: 1 },
  dusk: { bg: "#2a2a3e", fog: "#6a5a68", hemiSky: "#7a7aa0", hemiGround: "#2a2018", hemi: 0.9, key: "#ffb27a", keyI: 2.6, dir: [0.6, 0.12, -0.78], env: 0.18, fill: "#8a6a7a", dark: 0.6 },
  dawn: { bg: "#5a6a88", fog: "#9a9aa8", hemiSky: "#a8b8d8", hemiGround: "#3a3028", hemi: 1.1, key: "#ffd2a0", keyI: 3.0, dir: SUN_DAWN, env: 0.3, fill: "#a0a8c0", dark: 0.35 },
  day: { bg: "#9ab8d8", fog: "#b8c8d8", hemiSky: "#cfe0f2", hemiGround: "#5a5040", hemi: 1.4, key: "#fff4e0", keyI: 3.4, dir: [0.4, 0.75, -0.5], env: 0.5, fill: "#c0d0e0", dark: 0 },
};

const pt = (pos: [number, number, number], color: string, i: number, dist: number): PointL => (i > 0.001 ? { pos, color, i, dist } : P_OFF);

const light = (place: string, time: string, s: SetState, t: number): LightState => {
  const T = TIMES[time] ?? TIMES.night;
  const fog = s.fog ?? 0.3, beam = s.beam ?? 1, lamp = s.lamp ?? 1, seaL = s.seaLight ?? 0, boat = s.boat ?? 0;
  const dark = T.dark;
  if (place === "cottage") {
    // the lamp beam sweeps past the sea window twice a revolution: a cold flash through the glass
    const a = beamAngle(t), toWin = Math.atan2(C_WIN.x, COTTAGE.z0);
    const flash = beam * dark * Math.max(0, Math.cos(a - toWin)) ** 40 + beam * dark * Math.max(0, Math.cos(a + Math.PI - toWin)) ** 40;
    return {
      bg: T.bg, fog: { color: T.fog, density: 0.0035 + 0.011 * fog }, env: T.env * 0.6 + 0.03,
      hemi: { sky: T.hemiSky, ground: "#1a120c", i: T.hemi * 0.55 },
      moon: { dir: T.dir, color: T.key, i: T.keyI * 0.75, box: { min: [COTTAGE.x0, COTTAGE.y - 0.2, COTTAGE.z0 - 0.5], max: [COTTAGE.x1, COTTAGE.y + COTTAGE.h, COTTAGE.z1] } },
      spots: [S_OFF, S_OFF],
      pts: [
        pt([DESK[0] + 0.5, COTTAGE.y + DESK_TOP + 0.3, DESK[2] + 0.1], "#ffb257", 1.7 * lamp * (0.4 + 0.6 * dark), 6),
        pt([DESK[0] + 0.3, COTTAGE.y + COTTAGE.h - 0.1, DESK[2] + 0.8], "#ff9a50", 0.7 * lamp * dark, 6),
        pt([C_WIN.x, COTTAGE.y + 1.6, COTTAGE.z0 + 0.6], T.fill, 0.6 + 0.6 * (1 - dark), 4.5),
        pt([C_WIN.x, COTTAGE.y + 1.5, COTTAGE.z0 + 1.4], "#fff2d8", 3 * flash, 7),
        P_OFF, P_OFF,
      ],
    };
  }
  const gal = place === "gallery";
  const atSea = place === "sea";
  const box = atSea ? { min: [BOAT[0] - 10, -2, BOAT[2] - 10] as [number, number, number], max: [BOAT[0] + 10, 8, BOAT[2] + 10] as [number, number, number] } : gal ? { min: [-4, DECK_Y - 1, -4] as [number, number, number], max: [4, DECK_Y + 4, 4] as [number, number, number] } : { min: [-14, TOP - 3, -12] as [number, number, number], max: [15, TOP + 18, 6] as [number, number, number] };
  return {
    bg: T.bg, fog: { color: T.fog, density: 0.0035 + 0.011 * fog }, env: T.env,
    hemi: { sky: T.hemiSky, ground: T.hemiGround, i: T.hemi },
    moon: { dir: T.dir, color: T.key, i: T.keyI, box },
    spots: [
      dark > 0.2 ? { pos: [COTTAGE.x0 - 0.35, TOP + 2.55, C_DOOR.z], target: [COTTAGE.x0 - 2.2, TOP, C_DOOR.z], color: "#ffb76e", i: 7 * lamp * dark, angle: 0.95, penumbra: 0.8, dist: 10 } : S_OFF,
      S_OFF,
    ],
    pts: [
      pt(LAMP, "#ffdcaa", (gal ? 1.6 : 9) * beam * (0.3 + 0.7 * dark), gal ? 6 : 22),
      pt([C_WIN.x, TOP + 1.5, COTTAGE.z0 - 0.7], "#ffb46a", 1.4 * lamp * dark, 6),
      pt([SEA_LIGHT[0], SEA_LIGHT[1] + 1, SEA_LIGHT[2] + 3], "#ffe9c0", 60 * Math.max(seaL, boat), 70),
      pt([BOAT[0] + 6, 6, BOAT[2] + 10], "#ffe2b0", 40 * boat, 30),
      P_OFF,
      pt(atSea ? [BOAT[0] + 8, 10, BOAT[2] + 14] : gal ? [2.5, DECK_Y + 2.5, -3] : [4, TOP + 5, -4], T.fill, 0.8, gal ? 9 : 26),
    ],
  };
};

export const COAST: WorldData = {
  id: "coast",
  doc: "a rocky headland with a red-and-white lighthouse, the keeper's cottage and the open sea (Indonesian coast)",
  places: { cliff, gallery, cottage, sea },
  times: ["night", "dusk", "dawn", "day"],
  props: {
    beam: { default: 1, doc: "lighthouse lamp turning, beams sweep the sea (0 off, 1 on)", sfx: { up: "machine", down: "click" } },
    lamp: { default: 1, doc: "oil lamp in the cottage + porch light (0 off, 1 on)", sfx: { up: "click", down: "click" } },
    seaLight: { default: 0, doc: "the light far out at sea (0 none, 1 bright); it bobs and seems to blink", sfx: { up: "shimmer" } },
    boat: { default: 0, doc: "the fishing boat under the sea light is revealed and lit (0 hidden in the dark, 1 clearly visible)", sfx: { up: "reveal" } },
    fog: { default: 0.3, doc: "sea fog (0 clear, 1 thick; the sea light gets a big halo)" },
    waves: { default: 1, doc: "swell height (0.5 calm, 1 normal, 1.6 rough)" },
    door: { default: 0, doc: "cottage door (0 shut, 1 open)", sfx: { up: "door-open", down: "door-close" } },
  },
  light,
};
