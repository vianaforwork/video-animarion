// Kos world (from Dunia Nabel EP01): one coordinate module for the boarding house — the kos plan, every story-critical prop, character marks.
// Geometry, performances, cameras and the Act 5 reveal all read these numbers, so the building never
// changes between the mystery and the reveal. Units metres, y up. The hallway runs along −Z from the
// entrance (z = ENTRANCE_Z) to the end wall (z = END_Z); the hallway centre line is x = 0.

export type V3 = [number, number, number];


export const CEIL = 2.8;
export const HALL = { x0: -0.8, x1: 0.8, z0: 1.0, z1: -15.0 };
export const ENTRANCE_Z = HALL.z0;
export const END_Z = HALL.z1;
export const WALL = 0.15;

export type Door = { id: string; side: -1 | 1; z: number; w: number; h: number; label: string; hinge: -1 | 1 };
/** Room doors on the hallway walls (side −1 = left wall x = −0.8, +1 = right wall). `hinge` = which z end. */
export const DOORS: Door[] = [
  { id: "K1", side: -1, z: -2.0, w: 0.82, h: 2.05, label: "1", hinge: 1 },
  { id: "K2", side: -1, z: -5.5, w: 0.82, h: 2.05, label: "2", hinge: 1 },
  { id: "K3", side: -1, z: -9.0, w: 0.82, h: 2.05, label: "3", hinge: 1 },
  { id: "K5", side: 1, z: -3.5, w: 0.82, h: 2.05, label: "5", hinge: 1 },
  { id: "K6", side: 1, z: -7.0, w: 0.82, h: 2.05, label: "6", hinge: 1 },
  { id: "K7", side: 1, z: -10.5, w: 0.82, h: 2.05, label: "7", hinge: 1 },
  { id: "K8", side: 1, z: -13.6, w: 0.82, h: 2.05, label: "8", hinge: 1 },
];
export const ROOM_DOOR = DOORS[1];
export const EMPTY_ROOM_DOOR = DOORS[6];

/** the bedroom (K2) interior box. Door on its +X wall (the hallway wall). */
export const ROOM = { x0: -4.3, x1: HALL.x0, z0: -7.2, z1: -3.8 };
export const ROOM_WIN = { z0: -6.2, z1: -4.8, y0: 0.95, y1: 2.15 }; // on the outer wall x = ROOM.x0
export const BED = { x0: -4.25, x1: -2.25, z0: -7.15, z1: -6.2, top: 0.46 };
export const DESK = { x0: -3.75, x1: -2.55, z: -3.85, d: 0.55, top: 0.74 };
export const CLOCK: V3 = [-2.68, DESK.top, -4.17];
export const CLOCK_YAW = 0.42;
export const BOTTLE: V3 = [-3.08, DESK.top, -4.24];
export const FAN: V3 = [-3.95, 0, -5.3];
export const WARDROBE = { x0: -1.95, x1: -0.95, z: -7.15, d: 0.55, h: 1.95 };
export const SOCKET: V3 = [-4.3 + 0.012, 0.32, -4.25];
/** Key in the lock on the room side of the bedroom door (door closed). */
export const KEY: V3 = [HALL.x0 - WALL - 0.035, 0.955, ROOM_DOOR.z - ROOM_DOOR.w / 2 + 0.1];
/** Door handle (latch side), hallway face. */
export const HANDLE_Z = ROOM_DOOR.z - ROOM_DOOR.w / 2 + 0.085;

/** The end of the hallway: gudang door in the end wall, the vent above it, the raincoat on its hook. */
export const GUDANG = { x: 0.22, w: 0.8, h: 2.0 };
export const VENT = { x: GUDANG.x, y0: 2.18, y1: 2.5, w: 0.56 };
/** Hook position on the end wall; the raincoat hangs from here (hood up). */
export const RAINCOAT_HOOK: V3 = [-0.5, 2.0, END_Z + 0.02];
/** Small high window on the left wall near the end, opening onto the side passage (motorbike light enters here). */
export const SMALL_WIN = { x: HALL.x0, z0: -14.45, z1: -13.95, y0: 1.72, y1: 2.22 };
/** Water dispenser against the right wall between K7 and K8. */
export const DISPENSER: V3 = [HALL.x1 - 0.22, 0, -12.05];
/** Left rooms K1–K3 end here; beyond it, outside the left wall, an open side passage (gang samping). */
export const LEFT_ROOMS_END = -10.8;
export const PASSAGE = { x0: -3.4, x1: HALL.x0 - WALL, z0: LEFT_ROOMS_END, z1: END_Z - 1.2 };

/** Ceiling tube lamps (off at night) and the CCTV camera at the entrance. */
export const TUBES: V3[] = [[0, CEIL - 0.03, -4.0], [0, CEIL - 0.03, -10.0]];
export const CCTV: V3 = [0.6, 2.42, 0.25];
export const CCTV_LOOK: V3 = [-0.1, 0.6, -13.5];

/** Outside. Terrace + yard at the entrance side, gate further out; side alley along the left. */
export const TERRACE_LAMP: V3 = [0.95, 2.55, 1.6];
export const YARD = { z0: 1.0, z1: 6.5, x0: -4.6, x1: 4.6 };
export const GATE = { z: 6.5, x0: -1.4, x1: 1.4, h: 1.75 };
export const ALLEY_X = -6.2;
export const STREET_LAMP: V3 = [5.6, 4.2, 8.4];

/** Character marks in the hallway (Act 1). */
export const MARK_STOP: [number, number] = [0.08, -7.6];
export const MARK_CREEP: [number, number] = [0.04, -8.6];
