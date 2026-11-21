// Dynamic worlds and objects as DATA. A story that needs a location the built-in worlds cannot stage gets a
// `world.json` (rooms with openings, terrain + paths, objects, scatter, light fixtures, places) and, for
// objects the library lacks, `objects/<id>.json` (compound objects from primitives). The engine builds the
// 3D set, the camera space, collision, navigation and the light rig from these — no code per story.

export type V2 = [number, number];
export type V3 = [number, number, number];

// ── objects ──────────────────────────────────────────────────────────────────

/** Named material presets, or a custom material. Presets: wood, darkwood, steel, chrome, aluminium,
 *  plastic:#hex, paint:#hex, fabric:#hex, rubber, glass, ceramic, paper, leaf:#hex, bark, stone, metal:#hex,
 *  emissive:#hex, cloth:#hex (woven). */
export type MatSpec = string | { color?: string; roughness?: number; metal?: number; emissive?: string; glow?: number; opacity?: number; texture?: "weave" | "planks" | "tiles" | "noise" };

export type PartSpec = {
  shape: "box" | "cyl" | "cone" | "sphere" | "torus" | "capsule" | "rod" | "lathe" | "plane" | "text" | "pile";
  /** box: [w, h, d]; plane: [w, h] */
  size?: number[];
  /** cyl/cone/sphere/capsule/rod radius; cyl top radius = r, bottom = r2 (default r) */
  r?: number; r2?: number;
  /** cyl/cone/capsule height */
  h?: number;
  /** torus: ring radius R, tube r, arc (rad) */
  R?: number; arc?: number;
  /** rod from → to (a tube between two points) */
  from?: V3; to?: V3;
  /** lathe profile [[radius, y], …] around Y */
  profile?: V2[];
  /** text on a plane (signs): the words, colours */
  text?: string; ink?: string; bg?: string;
  /** pile: `count` small round items (radius r) heaped inside `size`, coloured from `colors` */
  count?: number; colors?: string[]; seed?: number;
  /** rounded box corner */
  round?: number;
  at?: V3;
  /** rotation in degrees [x, y, z] */
  rot?: V3;
  /** non-uniform scale */
  scale?: V3;
  mat?: MatSpec;
  /** repeat the part n times, moving by `step` (and rotating by `stepRot` degrees) each time; with
   *  `around: true` the copies swing around the object's vertical axis by stepRot[1] (radial legs, spokes) */
  repeat?: { n: number; step?: V3; stepRot?: V3; around?: boolean };
  /** also add the part mirrored across this axis */
  mirror?: "x" | "z";
  /** only shown when this object state is > 0.5 (e.g. "open", "on") */
  when?: string;
  /** glow follows this object state 0..1 */
  glowState?: string;
  castShadow?: boolean;
};

export type ObjectSpec = {
  id: string;
  doc: string;
  parts: PartSpec[];
  /** named points in object space: "seat", "push" (handles), "top" (surface), "grab", "handle", "front" */
  anchors?: Record<string, V3>;
  /** a person can stand here (floor-level items like rugs) */
  walkable?: boolean;
  /** footprint/bounds override [w, h, d]; normally computed from the parts */
  bounds?: V3;
  /** carried in one hand */
  hand?: boolean;
  /** states with defaults (doors "open", lamps "on") */
  states?: Record<string, number>;
};

// ── worlds ───────────────────────────────────────────────────────────────────

export type OpeningSpec = {
  /** wall of the room: north (−z side), south (+z), west (−x), east (+x) */
  wall: "north" | "south" | "west" | "east";
  /** position along the wall (world x for north/south, world z for west/east) */
  at: number;
  type: "door" | "double-door" | "window" | "arch";
  w?: number; h?: number; sill?: number;
  id?: string;
  /** door with a glass panel */
  glass?: boolean;
  /** text sign above it */
  sign?: string;
  /** door swings into this room (+1) or out (−1) */
  swing?: 1 | -1;
};

export type RoomSpec = {
  id: string;
  /** floor rectangle [x0, z0, x1, z1] and floor height */
  rect: [number, number, number, number];
  y?: number;
  height?: number;
  floor?: string;
  walls?: string;
  /** lower wall band colour (wainscot) */
  wainscot?: string;
  /** handrail along the walls (hospitals) */
  handrail?: string;
  ceiling?: string | "none";
  openings?: OpeningSpec[];
  /** walls not built (open sides, e.g. a market hall) */
  open?: ("north" | "south" | "west" | "east")[];
};

export type PathSpec = { points: V2[]; width?: number; material?: string; id?: string };

export type ObjectUse = {
  use: string;
  id?: string;
  /** [x, z] on the floor/ground, or [x, y, z] */
  at: V2 | V3;
  yaw?: number;
  scale?: number;
  /** stand it on another object's anchor ("table-1:top") */
  on?: string;
  states?: Record<string, number>;
  /** extra colour override for library objects that support it */
  color?: string;
  /** a variant/parameter string for library objects (e.g. goods "tomato") */
  variant?: string;
};

export type ScatterSpec = { use: string; count: number; area: [number, number, number, number]; avoid?: ("paths" | "rooms" | "objects")[]; minDist?: number; scale?: [number, number]; seed?: number; variant?: string };

export type FixtureSpec = {
  type: "panel" | "tube" | "bulb" | "lamp-post" | "string" | "spot" | "exit-sign" | "lantern" | "fire" | "screen";
  at: V3;
  /** string lights: to point */
  to?: V3;
  color?: string;
  /** light strength (1 = normal for the type) */
  i?: number;
  /** a set prop that switches/dims it (0..1) */
  prop?: string;
  /** flickers (broken tube) */
  flicker?: boolean;
  /** spot direction target */
  target?: V3;
  id?: string;
};

export type GroundSpec = { size: number; material?: string; hills?: number; seed?: number; y?: number };
export type SkySpec = { sun?: V3 };

/** `bed`: lie here (lie / sleep / wake / sitUp) — `head`: [x, z] of the pillow end, `y`: mattress top height */
export type MarkSpec = { at: V2 | V3; yaw?: number; seat?: number; bed?: { head: V2; y: number }; doc?: string };

export type PlaceSpec = {
  doc: string;
  kind?: "interior" | "exterior";
  /** blocking + camera area [x0, z0, x1, z1] (default: the rooms named in `rooms`, or the whole world) */
  area?: [number, number, number, number];
  rooms?: string[];
  marks?: Record<string, MarkSpec>;
  pois?: Record<string, V3>;
  view?: string;
  ambience?: string;
  surface?: string;
  /** establishing hint: where to look from [cx, cy, cz, radius, height, yaw] */
  establish?: [number, number, number, number, number, number];
};

export type PropSpec = { default: number; doc: string; sfx?: { up?: string; down?: string }; door?: string; lights?: string[] };

export type WorldSpec = {
  id: string;
  doc: string;
  times: string[];
  rooms?: RoomSpec[];
  ground?: GroundSpec;
  paths?: PathSpec[];
  objects?: ObjectUse[];
  scatter?: ScatterSpec[];
  lights?: FixtureSpec[];
  /** buildings seen from outside: simple massing with windows, signs */
  buildings?: { rect: [number, number, number, number]; height: number; color?: string; roof?: string; sign?: string; windows?: boolean; y?: number }[];
  places: Record<string, PlaceSpec>;
  props?: Record<string, PropSpec>;
  /** atmosphere: fog 0..1, wind 0..1, interior ambient light colour */
  fog?: number;
  ambient?: string;
  sky?: SkySpec;
};
