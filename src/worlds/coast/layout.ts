// The coast: one coordinate plan for the headland, lighthouse, keeper's cottage, sea and the boat. Units
// metres, y up, sea level y = 0, the sea lies toward −z. Every place, light and camera reads these numbers.

import { fbm } from "../../kits/worldforge/noise.ts";
import type { V3 } from "../types.ts";

/** Plateau height of the headland. */
export const TOP = 12;
/** Coastline (cliff edge) z for an x; land is z greater than this. */
export const coastZ = (x: number) => -9 + 0.0035 * x * x + 0.8 * Math.sin(x * 0.21) + 0.5 * Math.sin(x * 0.53 + 1);

const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Terrain height (headland plateau, cliff, seabed). Flattened around the buildings and paths. */
export const ground = (x: number, z: number) => {
  const d = z - coastZ(x) + 0.5 * fbm(x * 0.3 + 11, z * 0.3, 3);
  const flat = sstep(14, 6, Math.hypot(Math.max(0, Math.abs(x - 5) - 7), Math.max(0, Math.abs(z) - 4)));
  const plateau = TOP + 2.8 * sstep(10, 70, z) + (1 - flat) * 0.35 * fbm(x * 0.05, z * 0.05, 3) + 0.07 * fbm(x * 0.6, z * 0.6, 2);
  const cliff = sstep(-2.2, 1.0, d);
  const rock = (1 - cliff) * cliff * 3.5 * fbm(x * 0.9, z * 0.9 + 3, 3);
  const sea = -4 - 0.06 * Math.max(0, -d);
  return sea + (plateau - sea) * cliff + rock;
};

export const LH = { x: 0, z: 0, r0: 2.3, r1: 1.62, h: 16 };
export const DECK_Y = TOP + LH.h + 0.3;
export const LANTERN = { r: 1.35, y0: DECK_Y, y1: DECK_Y + 3.0 };
export const LAMP: V3 = [0, DECK_Y + 1.5, 0];
/** Seconds per revolution of the lamp (two opposite beams). */
export const BEAM_PERIOD = 10;
export const beamAngle = (t: number) => (t / BEAM_PERIOD) * Math.PI * 2;

export const COTTAGE = { x0: 7, x1: 13, z0: -2.6, z1: 2.6, y: TOP + 0.15, h: 2.6, t: 0.18 };
export const C_DOOR = { z: 0.6, w: 0.9 };
export const C_WIN = { x: 10.2, w: 1.4, y0: 0.95, y1: 2.05 };
export const DESK: V3 = [10.2, COTTAGE.y, -2.08];
export const DESK_TOP = 0.76;
export const BED_AT: V3 = [11.9, COTTAGE.y, 1.5];

/** The light at sea (a fishing boat's lamps, seen from the headland). */
export const BOAT: V3 = [-48, 0, -235];
export const BOAT_YAW = 0.6;
export const SEA_LIGHT: V3 = [BOAT[0], 4.2, BOAT[2]];

/** Direction toward the moon (over the sea, a little left). */
export const MOON: V3 = [-0.33, 0.42, -0.84];
/** Direction toward the low sun at dawn (rises over the sea, right). */
export const SUN_DAWN: V3 = [0.55, 0.16, -0.82];

export const BENCH: V3 = [6.0, TOP, -5.5];
