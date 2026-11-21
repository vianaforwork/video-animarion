// Kos world (an Indonesian boarding house, from Dunia Nabel EP01): a bedroom, the long hallway with seven
// room doors, the end of the hallway (gudang door, vent, a raincoat on a hook, small window, water
// dispenser) and the front yard with the terrace lamp, gate and street.

import { P_OFF, S_OFF, type LightState } from "../../cine/types.ts";
import type { Place, SetState, WorldData } from "../types.ts";
import { BED, CCTV, CEIL, DESK, DISPENSER, DOORS, END_Z, ENTRANCE_Z, FAN, GATE, HALL, MARK_CREEP, MARK_STOP, ROOM_DOOR, RAINCOAT_HOOK, ROOM, ROOM_WIN, SMALL_WIN, SOCKET, STREET_LAMP, TERRACE_LAMP, TUBES, VENT, WALL, WARDROBE, YARD } from "./layout.ts";
import { L_DAY_EXT, L_EXT, L_HALL, L_HALL_LIT, L_ROOM, L_ROOM_DAY } from "./looks.ts";

/** the hallway light switch beside the bedroom door (left wall) */
const SWITCH: [number, number, number] = [HALL.x0 + 0.01, 1.35, ROOM_DOOR.z + ROOM_DOOR.w / 2 + 0.2];

const room: Place = {
  id: "room", doc: "a small kos bedroom: bed under the window, desk with an LED clock, standing fan, wardrobe, door to the hallway",
  kind: "interior", floor: 0,
  marks: {
    bed: { p: [(BED.x0 + BED.x1) / 2, (BED.z0 + BED.z1) / 2], yaw: Math.PI / 2, bed: { head: [BED.x0 + 0.25, (BED.z0 + BED.z1) / 2], y: BED.top }, doc: "the bed (lie / sleep / wake / sitUp)" },
    desk: { p: [DESK.x0 + 0.42, DESK.z - DESK.d - 0.32], yaw: 0.35, seat: 0.45, doc: "the desk chair (sit)" },
    door: { p: [HALL.x0 - 0.65, ROOM_DOOR.z], yaw: Math.PI / 2, doc: "inside the door, facing it" },
    window: { p: [ROOM.x0 + 0.65, (ROOM_WIN.z0 + ROOM_WIN.z1) / 2], yaw: -Math.PI / 2, doc: "at the window" },
    middle: { p: [-2.6, -5.4], yaw: Math.PI / 2, doc: "middle of the room" },
  },
  pois: {
    door: [HALL.x0, 1.1, ROOM_DOOR.z], window: [ROOM.x0, 1.5, (ROOM_WIN.z0 + ROOM_WIN.z1) / 2], clock: [-2.68, DESK.top + 0.04, -4.17], fan: [FAN[0], 1.12, FAN[2]],
    bed: [(BED.x0 + BED.x1) / 2, BED.top + 0.2, (BED.z0 + BED.z1) / 2], desk: [(DESK.x0 + DESK.x1) / 2, DESK.top, DESK.z - DESK.d / 2], socket: SOCKET, wardrobe: [(WARDROBE.x0 + WARDROBE.x1) / 2, 1.2, WARDROBE.z - WARDROBE.d / 2],
  },
  box: { min: [ROOM.x0 + 0.25, 0.3, ROOM.z0 + 0.25], max: [ROOM.x1 - 0.25, 2.55, ROOM.z1 - 0.25] },
  solids: [
    { min: [BED.x0, 0, BED.z0], max: [BED.x1, 0.75, BED.z1] },
    { min: [DESK.x0, 0, DESK.z - DESK.d], max: [DESK.x1, 0.95, DESK.z] },
    { min: [WARDROBE.x0, 0, WARDROBE.z - WARDROBE.d], max: [WARDROBE.x1, WARDROBE.h, WARDROBE.z] },
  ],
  establish: { center: [-2.6, 1.0, -5.5], radius: 1.6, height: 1.5, yaw: 0.9 },
  view: "door", window: "window", ambience: "room", surface: "tile", reverb: 0.2,
};

const hall: Place = {
  id: "hall", doc: "the long kos hallway (16 m), room doors left and right, ceiling tube lamps, CCTV at the entrance; at the far end: gudang door, vent, raincoat on a hook, small window, water dispenser",
  kind: "interior", floor: 0,
  marks: {
    entrance: { p: [0, ENTRANCE_Z - 0.7], yaw: Math.PI, doc: "just inside the entrance, facing down the hallway" },
    "room-door": { p: [-0.25, ROOM_DOOR.z], yaw: -Math.PI / 2, doc: "outside room 2's door (the bedroom), facing it" },
    middle: { p: MARK_STOP, yaw: Math.PI, doc: "halfway down, facing the end" },
    near: { p: MARK_CREEP, yaw: Math.PI, doc: "a step closer to the end" },
    dispenser: { p: [DISPENSER[0] - 0.55, DISPENSER[2]], yaw: Math.PI / 2, doc: "at the water dispenser" },
    end: { p: [0.15, END_Z + 1.3], yaw: Math.PI, doc: "at the end of the hallway" },
    switch: { p: [HALL.x0 + 0.45, SWITCH[2]], yaw: -Math.PI / 2, doc: "at the light switch on the left wall (reach → switch, then set tubes: 1)" },
  },
  pois: {
    end: [0, 1.4, END_Z], coat: [RAINCOAT_HOOK[0], 1.45, RAINCOAT_HOOK[2] + 0.15], vent: [VENT.x, (VENT.y0 + VENT.y1) / 2, END_Z], "small-window": [SMALL_WIN.x, (SMALL_WIN.y0 + SMALL_WIN.y1) / 2, (SMALL_WIN.z0 + SMALL_WIN.z1) / 2],
    switch: SWITCH, dispenser: [DISPENSER[0], 1.0, DISPENSER[2]], entrance: [0, 1.4, ENTRANCE_Z + 1], cctv: CCTV, lamp: TUBES[0], "room-door": [HALL.x0, 1.1, ROOM_DOOR.z],
    ...Object.fromEntries(DOORS.map((d) => [`door-${d.label}`, [d.side * HALL.x1, 1.1, d.z] as [number, number, number]])),
  },
  box: { min: [HALL.x0 + 0.15, 0.3, END_Z + 0.25], max: [HALL.x1 - 0.15, 2.6, ENTRANCE_Z + 0.4] },
  solids: [{ min: [DISPENSER[0] - 0.2, 0, DISPENSER[2] - 0.2], max: [HALL.x1, 1.3, DISPENSER[2] + 0.2] }],
  establish: { center: [0, 1.3, -7], radius: 7.5, height: 0.6, yaw: 0.0 },
  view: "end", ambience: "hall", surface: "tile", reverb: 0.55,
};

const yard: Place = {
  id: "yard", doc: "outside the kos: front yard, terrace lamp over the entrance, low gate, the street with a sodium lamp, a parked scooter",
  kind: "exterior", floor: 0,
  marks: {
    terrace: { p: [0, ENTRANCE_Z + 0.9], yaw: 0, doc: "on the terrace, facing the gate" },
    "terrace-in": { p: [0, ENTRANCE_Z + 0.9], yaw: Math.PI, doc: "on the terrace, facing the entrance" },
    yard: { p: [1.4, 3.8], yaw: Math.PI, doc: "in the yard, facing the house" },
    gate: { p: [0, GATE.z - 0.6], yaw: Math.PI, doc: "inside the gate, facing the house" },
  },
  pois: { kos: [0, 2.2, ENTRANCE_Z], entrance: [0, 1.2, ENTRANCE_Z], gate: [0, 1, GATE.z], street: [STREET_LAMP[0], 1.2, STREET_LAMP[2]], "terrace-lamp": TERRACE_LAMP, sky: [0, 30, -20] },
  box: { min: [YARD.x0 + 0.3, 0.3, ENTRANCE_Z + 0.3], max: [YARD.x1 + 8, 14, YARD.z1 + 10] },
  // what the camera must not stand behind or inside (set/Exterior.tsx): fence walls and gate pillars, terrace posts,
  // the parked scooters, the neighbours' houses across the street
  solids: [
    { min: [YARD.x0, 0, GATE.z - 0.1], max: [GATE.x0 - 0.27, 1.6, GATE.z + 0.1] },
    { min: [GATE.x1 + 0.27, 0, GATE.z - 0.1], max: [YARD.x1, 1.6, GATE.z + 0.1] },
    ...[GATE.x0 - 0.12, GATE.x1 + 0.12].map((x) => ({ min: [x - 0.15, 0, GATE.z - 0.15] as [number, number, number], max: [x + 0.15, GATE.h + 0.25, GATE.z + 0.15] as [number, number, number] })),
    ...[ROOM.x0 - WALL + 0.3, -ROOM.x0 + WALL - 0.3].map((x) => ({ min: [x - 0.1, 0, ENTRANCE_Z + 1.5] as [number, number, number], max: [x + 0.1, CEIL + 0.1, ENTRANCE_Z + 1.7] as [number, number, number] })),
    ...[[-2.4, 3.6], [-3.5, 3.4]].map(([x, z]) => ({ min: [x - 0.45, 0, z - 0.95] as [number, number, number], max: [x + 0.45, 1.15, z + 0.95] as [number, number, number] })),
    ...[[-14, 12, 7, 4.6], [-5.5, 12, 6, 3.6], [3.5, 12, 7, 5.2], [12, 12, 6, 3.8]].map(([x, z, w, h]) => ({ min: [x - w / 2, 0, z - 2.5] as [number, number, number], max: [x + w / 2, h, z + 2.5] as [number, number, number] })),
  ],
  establish: { center: [0, 2.2, 1.5], radius: 9, height: 3.5, yaw: 0.25 },
  view: "kos", ambience: "outdoor", surface: "stone", reverb: 0.05,
};

const light = (place: string, time: string, s: SetState): LightState => {
  const day = time === "day";
  if (place === "room") return day ? L_ROOM_DAY : L_ROOM;
  if (place === "yard") return day ? L_DAY_EXT : L_EXT;
  const lit = (s.tubes ?? 0) > 0.5 || day;
  return lit ? L_HALL_LIT : L_HALL;
};
void P_OFF; void S_OFF;

export const KOS: WorldData = {
  id: "kos",
  doc: "an Indonesian boarding house (kos): bedroom, long hallway with seven doors, the front yard (from Dunia Nabel EP01)",
  places: { room, hall, yard },
  times: ["night", "day"],
  props: {
    door: { default: 0, doc: "the bedroom door (0 shut, 1 wide open)", sfx: { up: "door-open", down: "door-close" } },
    tubes: { default: 0, doc: "hallway ceiling lamps (0 off — moonlit, 1 on)", sfx: { up: "click", down: "click" } },
    fan: { default: 1, doc: "the standing fan in the bedroom turning (0 off, 1 on)" },
    vent: { default: 0, doc: "the loose vent flap at the end of the hallway rattles (0 still, 1 rattling)", sfx: { up: "knock" } },
    coat: { default: 1, doc: "the long black raincoat hanging at the end of the hallway (0 gone, 1 there)" },
    pile: { default: 0, doc: "clothes piled on the desk chair (0 none, 1 a pile that looks like someone sitting)" },
    gudang: { default: 0, doc: "the storage-room door at the end (0 shut, 1 open)", sfx: { up: "door-open", down: "door-close" } },
  },
  light: (p, t, s) => light(p, t, s),
};
void END_Z;
