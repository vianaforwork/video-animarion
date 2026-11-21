// story.json — the ONE file written per video. Everything else (blocking, acting, cameras, light, grade,
// letterbox, UI, sound) is derived from it by the director (compile.ts). Plain data, validated with
// plain-language errors (validate.ts). Cues: a spoken word ("cahaya", "cahaya#1" = its 2nd occurrence,
// 0-based) or a number = VO seconds.

import type { CustomLook } from "../cine/character/looks.ts";
import type { HoldKind } from "../cine/character/pose.ts";

export type Cue = string | number;
export type Word = [string, number, number];

export const MOODS = ["mystery", "tense", "calm", "memory", "told", "reveal", "science", "warm", "cctv"] as const;
export type Mood = (typeof MOODS)[number];
export const CUTS = ["cut", "fade", "dip", "flash"] as const;
export type Transition = (typeof CUTS)[number];

export const ACTIONS = [
  "stand", "look", "turn", "walk", "run", "startle", "freeze", "peer", "point", "reach", "wave",
  "phone", "binoculars", "raise", "think", "nod", "shake", "sigh", "talk", "shiver",
  "sit", "standUp", "write", "lie", "sleep", "wake", "sitUp",
  "push", "pickUp", "putDown", "give", "receive", "open", "close", "kneel",
] as const;
export type ActionName = (typeof ACTIONS)[number];

export const SHOTS = [
  "establish", "drone", "wide", "mediumWide", "medium", "cu", "ecu", "ots", "pov", "long", "track", "lead", "profile",
  "low", "high", "insert", "orbit", "push", "pull", "reveal", "map", "twoShot",
] as const;
export type ShotName = (typeof SHOTS)[number];

export const FACES = ["neutral", "calm", "alert", "fear", "panic", "squint", "read", "sleep", "drowsy", "smile", "laugh", "sad", "think", "uneasy", "serious", "relief", "surprised", "curious"] as const;
export type FaceName = (typeof FACES)[number];

export const PROPS = ["phone", "binoculars", "lantern", "flashlight", "mug", "book"] as const;
export type PropName = (typeof PROPS)[number];
export type { HoldKind };

export type Ui =
  | { type: "title"; text: string; sub?: string; kicker?: string }
  | { type: "lower"; text: string; sub?: string }
  | { type: "tag"; text: string; sub?: string; pos?: "tl" | "tr" | "bl" | "br" | "c" }
  | { type: "callout"; text: string; sub?: string; poi: string }
  | { type: "card"; title?: string; lines: string[]; pos?: "l" | "r" }
  | { type: "stamp"; text: string }
  | { type: "clock"; text: string; sub?: string }
  | { type: "steps"; items: string[] };

export type ShotSpec = { type: ShotName; subject?: string; target?: string; side?: "left" | "right"; fov?: number };

export type Beat = {
  at: Cue;
  /** optional end (otherwise the next beat / scene end) */
  until?: Cue;
  do?: ActionName;
  who?: string | string[];
  /** a mark name (walk/run/sit destination) */
  to?: string;
  /** what to look at / point at / show: a POI name, a mark, or a cast id */
  target?: string;
  /** a camera-only beat: show this POI or person (no acting needed) */
  show?: string;
  face?: FaceName;
  shot?: ShotName | ShotSpec;
  set?: Record<string, number>;
  /** seconds for set changes to fade (default 0.6) */
  fade?: number;
  sfx?: string | string[];
  ui?: Ui | Ui[];
  /** music accent + sound hit on this beat */
  hit?: boolean;
  /** music drops out during this beat */
  quiet?: boolean;
  /** an object moves on its own (rolling, sliding): to a mark / POI / [x, z], over `dur` seconds */
  move?: { obj: string; to: string | [number, number]; dur?: number; yaw?: number };
  /** what the action handles: the object pushed / picked up / given, or the door opened */
  obj?: string;
};

export type SceneCast = { at: string; do?: "stand" | "sit" | "lie"; face?: FaceName; /** object id held in the hand from the scene start */ holding?: string };

export type Scene = {
  at: Cue;
  place: string;
  time?: string;
  mood?: Mood;
  set?: Record<string, number>;
  cast?: Record<string, SceneCast>;
  cut?: Transition;
  beats: Beat[];
};

export type CastMember = {
  id: string; look: string; name?: string; custom?: CustomLook; prop?: PropName;
  /** what the phone shows when this person reads it ("phone" action) */
  phoneText?: { from?: string; text?: string; time?: string; date?: string };
};

export type Story = {
  id: string;
  title: string;
  /** resolved by make.mjs when `world` names a world.json (dynamic world) */
  worldSpec?: import("../gen/spec.ts").WorldSpec;
  objectSpecs?: import("../gen/spec.ts").ObjectSpec[];
  vo: { file: string; offset?: number };
  words: string | Word[];
  world: string;
  cast: CastMember[];
  scenes: Scene[];
  titleCard?: { at: Cue; until?: Cue; text: string; sub?: string; kicker?: string };
  disclaimer?: { at: Cue; until?: Cue; text: string };
  endCard?: { text?: string; sub?: string; seconds?: number };
  /** seconds of picture after the VO ends before the end card (default 1.2) */
  tail?: number;
  /** VO loudness envelope (filled in by make.mjs; 60 values per second) */
  voenv?: number[];
  /** the mixed soundtrack in public/ (filled in by make.mjs once the sound step ran) */
  audio?: string;
  /** "portrait" 1080×1920 (default) or "landscape" 1920×1080 */
  format?: "portrait" | "landscape";
  /** "burn" = captions in the picture (portrait default), "off" = only the .srt (landscape default) */
  captions?: "burn" | "off";
  /** the user's brand kit (voynann-brand.json), resolved by make.mjs; false in story.json = no branding */
  brand?: { brand?: string; handle?: string; cta?: string; colors?: { primary?: string; accent?: string; background?: string }; logoFile?: string; watermark?: boolean; intro?: { seconds?: number } };
};
