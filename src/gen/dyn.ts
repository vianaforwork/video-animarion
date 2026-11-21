import type { V3 } from "./spec.ts";
/** Per-frame transforms of objects that moved (pushed, carried, rolling) — by object id. */
export type Dyn = Record<string, { pos: V3; yaw: number; hidden?: boolean }>;
