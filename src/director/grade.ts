// Mood × time of day → film grade and letterbox. Night stories keep CINÉSTORY's readable moonlight
// (never crushed blacks); explanation moods open the frame to full 16:9.

import { GRADE0, type Grade } from "../cine/types.ts";
import type { Mood } from "./story.ts";

const NIGHT: Grade = { ...GRADE0, exposure: 1.5, lift: [0.02, 0.03, 0.058], gain: [0.96, 1.0, 1.07], sat: 0.9, contrast: 1.05, vignette: 0.36, grain: 0.022, bloom: 0.32, bloomRadius: 0.55, bloomThreshold: 0.92, ca: 0.0016 };
const DAY: Grade = { ...GRADE0, exposure: 0.98, lift: [0.01, 0.01, 0.012], gain: [1.02, 1.0, 0.98], sat: 1.0, contrast: 1.03, vignette: 0.2, grain: 0.012, bloom: 0.18, bloomThreshold: 1.05, ca: 0.0008 };

const MOOD: Record<Mood, (g: Grade) => Grade> = {
  mystery: (g) => g,
  tense: (g) => ({ ...g, contrast: g.contrast + 0.08, sat: g.sat * 0.88, vignette: g.vignette + 0.1, grain: g.grain + 0.008 }),
  calm: (g) => ({ ...g, sat: g.sat * 1.04, vignette: g.vignette - 0.05 }),
  memory: (g) => ({ ...g, lift: [0.045, 0.035, 0.02], gain: [1.06, 0.98, 0.86], sat: 0.7, vignette: 0.48, grain: 0.04, bloom: g.bloom + 0.1 }),
  told: (g) => ({ ...g, lift: [0.01, 0.03, 0.04], gain: [0.86, 0.98, 1.0], sat: 0.55, contrast: 1.12, vignette: 0.5, grain: 0.045 }),
  reveal: (g) => ({ ...g, exposure: g.exposure * 1.06, sat: 1.0, contrast: 1.0, vignette: 0.22, grain: 0.012, bloom: g.bloom * 0.7 }),
  science: (g) => ({ ...g, sat: 1.05, contrast: 1.04, vignette: 0.24, grain: 0.01 }),
  warm: (g) => ({ ...g, lift: [0.035, 0.025, 0.012], gain: [1.07, 1.0, 0.9], sat: 1.05, vignette: 0.3 }),
  cctv: () => ({ ...GRADE0, exposure: 1.35, lift: [0.04, 0.05, 0.04], gain: [0.92, 1.0, 0.9], sat: 0.0, contrast: 1.18, vignette: 0.5, grain: 0.06, bloom: 0.1, bloomThreshold: 1.2, ca: 0.003 }),
};

const MIND: Grade = { ...GRADE0, exposure: 1.1, lift: [0.0, 0.01, 0.02], sat: 1.05, contrast: 1.05, vignette: 0.3, grain: 0.014, bloom: 0.45, bloomRadius: 0.6, bloomThreshold: 0.75, ca: 0.0012, ao: 0 };

/** `dark` 1 = night, 0 = full day (from the world's time of day). */
export const gradeFor = (mood: Mood, dark: number, interior: boolean, studio = false, mobile = false): Grade => {
  if (studio) return mood === "science" ? MIND : MOOD[mood](MIND);
  const b = dark > 0.5 ? { ...NIGHT, exposure: NIGHT.exposure * (interior ? 1.0 : 1.0) } : dark > 0.2 ? { ...DAY, exposure: 1.12, sat: 0.95 } : DAY;
  const g = MOOD[mood](b);
  if (!mobile || mood === "cctv") return g;
  // a phone screen (small, often bright surroundings): open the shadows and ease the corners — the night
  // stays a night (blue, low key), but faces and the important shapes read
  const lift = dark > 0.5 ? 0.024 : 0.008;
  return { ...g, exposure: g.exposure * (dark > 0.5 ? 1.16 : 1.04), lift: [g.lift[0] + lift * 0.8, g.lift[1] + lift, g.lift[2] + lift * 1.2], contrast: Math.max(0.98, g.contrast - 0.04), vignette: g.vignette * 0.72 };
};

export const BARS: Record<Mood, number> = { mystery: 1, tense: 1, calm: 1, memory: 1, told: 1, reveal: 1, science: 0, warm: 1, cctv: 0 };

export const DARK: Record<string, number> = { night: 1, storm: 1, dusk: 0.6, dawn: 0.35, day: 0 };
