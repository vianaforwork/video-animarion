// The kos building (one layout for the whole episode): hallway shell with room doors, breeze-block vents,
// ceiling tube lamps, conduit, CCTV at the entrance, everyday clutter (sandals, rack, chair, bin), the end
// of the hallway (End.tsx), the bedroom (Room.tsx), the outside (Exterior.tsx).

import React from "react";
import { box, cyl, sphere } from "../../../kits/worldforge/geo.ts";
import { basic, phys } from "../../../cine/mats.ts";
import { CCTV, CCTV_LOOK, CEIL, DOORS, END_Z, ENTRANCE_Z, HALL, LEFT_ROOMS_END, ROOM_DOOR, ROOM, SMALL_WIN, TUBES, WALL, type V3 } from "../layout.ts";
import { DoorSet, doorHoles, HoledWall, MAT, Slab } from "./parts.tsx";
import { End } from "./End.tsx";
import { Room } from "./Room.tsx";
import { Gudang } from "./Gudang.tsx";

export type KosState = {
  /** the bedroom (room 2) door open angle (rad, into the room) */
  roomDoor: number;
  /** key rotation 0..1 (locked at 1) */
  key: number;
  /** the bedroom door lever pressed 0..1 */
  lever: number;
  /** vent flap angle (rad) */
  vent: number;
  /** ceiling tubes 0..1 */
  tubes: number;
  /** CCTV LED 0..1 */
  led: number;
  /** clock colon on */
  colon: boolean;
  /** fan blade angle (rad) */
  fan: number;
  /** raincoat sway (rad) */
  coat: number;
  /** show the room interior / hallway (culling for speed) */
  room: boolean;
  hall: boolean;
  /** roofs + ceilings (off for the overhead "dollhouse" views) */
  roof?: boolean;
  /** gudang (storage room) interior */
  gudang?: number;
  /** clothes piled on the desk chair (pareidolia) */
  pile?: boolean;
  /** daylight outside the windows */
  day?: boolean;
  /** the raincoat hangs at the end of the hallway */
  coatOn?: boolean;
};

const LW = HALL.x0 - WALL / 2; // left wall centre
const RW = HALL.x1 + WALL / 2; // right wall centre

const Sandals: React.FC<{ p: V3; yaw: number; c: string }> = ({ p, yaw, c }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    {[-0.07, 0.07].map((x, i) => (
      <group key={i} position={[x, 0, i * 0.04]} rotation={[0, (i - 0.5) * 0.18, 0]}>
        <mesh geometry={box(0.095, 0.016, 0.26, 0.008)} material={MAT.plastic(c)} position={[0, 0.008, 0]} castShadow receiveShadow />
        {[1, -1].map((k) => (
          <mesh key={k} geometry={box(0.008, 0.01, 0.11, 0.004)} material={MAT.plastic("#e8e3d8")} position={[k * 0.028, 0.03, 0.03]} rotation={[0.22, k * 0.4, 0]} />
        ))}
      </group>
    ))}
  </group>
);

const Tube: React.FC<{ p: V3; on: number }> = ({ p, on }) => (
  <group position={p}>
    <mesh geometry={box(0.12, 0.05, 1.24, 0.01)} material={MAT.plastic("#e6e6e1")} castShadow />
    <mesh geometry={cyl(0.014, 0.014, 1.18, 12)} material={phys(`tube${on > 0.5}`, { color: "#dfe7ea", emissive: "#e8f4ff", emissiveIntensity: on * 1.25, roughness: 0.3 })} position={[0, -0.035, 0]} rotation={[Math.PI / 2, 0, 0]} />
  </group>
);

const Cctv: React.FC<{ led: number }> = ({ led }) => {
  const d = [CCTV_LOOK[0] - CCTV[0], CCTV_LOOK[1] - CCTV[1], CCTV_LOOK[2] - CCTV[2]];
  const yaw = Math.atan2(d[0], d[2]);
  const pitch = -Math.atan2(d[1], Math.hypot(d[0], d[2]));
  return (
    <group position={CCTV}>
      <mesh geometry={box(0.02, 0.1, 0.08, 0.006)} material={MAT.plastic("#ecebe6")} position={[HALL.x1 - CCTV[0] - 0.01, 0.05, 0]} />
      <mesh geometry={cyl(0.012, 0.012, HALL.x1 - CCTV[0], 10)} material={MAT.plastic("#ecebe6")} position={[(HALL.x1 - CCTV[0]) / 2, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} />
      <group rotation={[pitch, yaw, 0]} rotation-order="YXZ">
        <mesh geometry={box(0.085, 0.08, 0.2, 0.02)} material={MAT.plastic("#5e5d58")} castShadow />
        <mesh geometry={box(0.1, 0.012, 0.23, 0.004)} material={MAT.plastic("#5e5d58")} position={[0, 0.046, 0.02]} />
        <mesh geometry={cyl(0.03, 0.03, 0.012, 24)} material={phys("lens", { color: "#05070a", roughness: 0.05, metalness: 0.3, clearcoat: 1 })} position={[0, 0, 0.102]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={sphere(0.005, 10, 8)} material={basic(`led${led > 0.5}`, { color: led > 0.5 ? "#ff2a1a" : "#3a0806" })} position={[0.028, -0.026, 0.1]} />
      </group>
    </group>
  );
};

/** Plastic chair (kursi plastik) outside room 5. */
const Chair: React.FC<{ p: V3; yaw: number }> = ({ p, yaw }) => {
  const m = MAT.plastic("#2f6f9a");
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <mesh geometry={box(0.42, 0.04, 0.4, 0.03)} material={m} position={[0, 0.44, 0]} castShadow receiveShadow />
      <mesh geometry={box(0.42, 0.4, 0.04, 0.03)} material={m} position={[0, 0.68, -0.2]} rotation={[-0.12, 0, 0]} castShadow />
      {[[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]].map(([x, z], i) => (
        <mesh key={i} geometry={cyl(0.018, 0.024, 0.44, 10)} material={m} position={[x, 0.22, z]} rotation={[z * 0.3, 0, -x * 0.3]} castShadow />
      ))}
    </group>
  );
};

/** Hallway: floor, ceiling, both side walls with doors, entrance lintel, lamps, CCTV, clutter. */
export const Kos: React.FC<{ s: KosState }> = ({ s }) => {
  const len = ENTRANCE_Z - END_Z;
  const leftHoles = DOORS.filter((d) => d.side < 0).flatMap(doorHoles).concat([{ a0: SMALL_WIN.z0, a1: SMALL_WIN.z1, y0: SMALL_WIN.y0, y1: SMALL_WIN.y1 }]);
  const rightHoles = DOORS.filter((d) => d.side > 0).flatMap(doorHoles);
  return (
    <group>
      <group visible={s.hall}>
        {/* floor + ceiling */}
        <Slab min={[HALL.x0 - WALL, -0.1, END_Z - WALL]} max={[HALL.x1 + WALL, 0, ENTRANCE_Z]} m={MAT.tile([2, len / 0.8])} cast={false} />
        <group visible={s.roof !== false}>
          <Slab min={[HALL.x0 - WALL, CEIL, END_Z - WALL]} max={[HALL.x1 + WALL, CEIL + 0.08, ENTRANCE_Z]} m={MAT.ceil([1, len / 1.2])} />
        </group>
        {/* skirting */}
        {[HALL.x0 + 0.006, HALL.x1 - 0.006].map((x) => (
          <Slab key={x} min={[x - 0.006, 0, END_Z]} max={[x + 0.006, 0.09, ENTRANCE_Z]} m={MAT.trim()} cast={false} />
        ))}
        <HoledWall axis="z" c={LW} a0={ENTRANCE_Z} a1={END_Z} holes={leftHoles} />
        <HoledWall axis="z" c={RW} a0={ENTRANCE_Z} a1={END_Z} holes={rightHoles} />
        {/* entrance lintel (the hallway opens to the terrace) */}
        <Slab min={[HALL.x0 - WALL, 2.35, ENTRANCE_Z - 0.15]} max={[HALL.x1 + WALL, CEIL + 0.08, ENTRANCE_Z]} m={MAT.wall()} />
        {DOORS.map((d) => {
          const isRoom = d.id === ROOM_DOOR.id;
          return (
            <DoorSet
              key={d.id}
              d={d}
              wx={d.side < 0 ? LW : RW}
              open={isRoom ? s.roomDoor : 0}
              lever={isRoom ? s.lever : 0}
              lockKey={isRoom ? s.key : undefined}
              leaf={MAT.door(d.id === "K8" ? "dusty" : "std", d.id === "K8" ? "#4a3326" : undefined)}
              extra={
                d.id === "K8" ? (
                  // the empty room: a hasp and padlock on the hallway side
                  <group position={[RW - WALL / 2 - 0.03, 1.08, d.z - d.w / 2 + 0.07]}>
                    <mesh geometry={box(0.012, 0.03, 0.12, 0.004)} material={MAT.steel()} />
                    <mesh geometry={box(0.03, 0.05, 0.04, 0.008)} material={phys("brass", { color: "#a98a3e", metalness: 1, roughness: 0.35 })} position={[-0.02, -0.04, 0.03]} castShadow />
                  </group>
                ) : null
              }
            />
          );
        })}
        {/* conduit along the ceiling corner + switches beside each door */}
        <mesh geometry={cyl(0.012, 0.012, len, 8)} material={MAT.plastic("#e9e7e0")} position={[HALL.x1 - 0.03, CEIL - 0.03, (ENTRANCE_Z + END_Z) / 2]} rotation={[Math.PI / 2, 0, 0]} />
        {DOORS.map((d) => (
          <mesh key={`sw${d.id}`} geometry={box(0.012, 0.11, 0.07, 0.004)} material={MAT.plastic("#efeee8")} position={[(d.side < 0 ? HALL.x0 : HALL.x1) - d.side * 0.006, 1.35, d.z + d.w / 2 + 0.2]} />
        ))}
        {TUBES.map((p, i) => (
          <Tube key={i} p={p} on={s.tubes} />
        ))}
        <Cctv led={s.led} />
        {/* clutter */}
        <Sandals p={[HALL.x0 + 0.25, 0, ROOM_DOOR.z + 0.62]} yaw={1.3} c="#7b2a2a" />
        <Sandals p={[HALL.x1 - 0.24, 0, -3.5 + 0.6]} yaw={-1.7} c="#2a5b3c" />
        <Sandals p={[HALL.x1 - 0.22, 0, -10.5 - 0.62]} yaw={-1.45} c="#3a3a3a" />
        <Sandals p={[HALL.x0 + 0.22, 0, -9.0 + 0.6]} yaw={1.6} c="#b07a2a" />
        <Chair p={[HALL.x1 - 0.3, 0, -7.0 - 0.75]} yaw={-1.35} />
        {/* shoe rack by K1 */}
        <group position={[HALL.x0 + 0.17, 0, -0.4]}>
          {[0.08, 0.3, 0.52].map((y) => (
            <mesh key={y} geometry={box(0.3, 0.02, 0.8, 0.005)} material={MAT.matte("#4a3a2c", 0.6)} position={[0, y, 0]} castShadow receiveShadow />
          ))}
          {[[-0.13, -0.38], [0.13, -0.38], [-0.13, 0.38], [0.13, 0.38]].map(([x, z], i) => (
            <mesh key={i} geometry={box(0.02, 0.56, 0.02, 0.004)} material={MAT.matte("#4a3a2c", 0.6)} position={[x, 0.28, z]} />
          ))}
          {[-0.22, 0.05, 0.27].map((z, i) => (
            <mesh key={z} geometry={box(0.11, 0.09, 0.27, 0.035)} material={MAT.matte(["#d8d2c6", "#2c2c30", "#8a5a3a"][i], 0.7)} position={[0, 0.35, z]} rotation={[0, 1.57, 0]} castShadow />
          ))}
        </group>
        {/* trash bin near the entrance */}
        <mesh geometry={cyl(0.17, 0.14, 0.48, 20)} material={MAT.plastic("#3e6b4c")} position={[HALL.x1 - 0.22, 0.24, 0.55]} castShadow receiveShadow />
      </group>
      {/* outer walls of both room blocks (keep the moon out except through real openings) */}
      <Slab min={[ROOM.x0 - WALL, 0, ROOM.z1 + WALL]} max={[ROOM.x0, CEIL + 0.1, ENTRANCE_Z]} m={MAT.matte("#9a978c", 0.95)} />
      <Slab min={[ROOM.x0 - WALL, 0, LEFT_ROOMS_END]} max={[ROOM.x0, CEIL + 0.1, ROOM.z0 - WALL]} m={MAT.matte("#9a978c", 0.95)} />
      <Slab min={[-ROOM.x0, 0, END_Z - WALL]} max={[-ROOM.x0 + WALL, CEIL + 0.1, ENTRANCE_Z]} m={MAT.matte("#9a978c", 0.95)} />
      <Slab min={[HALL.x1 + WALL, 0, END_Z - WALL]} max={[-ROOM.x0 + WALL, CEIL + 0.1, END_Z]} m={MAT.matte("#9a978c", 0.95)} />
      <group visible={s.roof !== false}>
        <Slab min={[ROOM.x0 - WALL, CEIL + 0.08, LEFT_ROOMS_END]} max={[-ROOM.x0 + WALL, CEIL + 0.2, ENTRANCE_Z]} m={MAT.matte("#8a877c", 0.95)} />
        <Slab min={[HALL.x0 - WALL, CEIL + 0.08, END_Z - WALL]} max={[-ROOM.x0 + WALL, CEIL + 0.2, LEFT_ROOMS_END]} m={MAT.matte("#8a877c", 0.95)} />
      </group>
      {/* left building block ends at LEFT_ROOMS_END: an exterior face toward the side passage */}
      <Slab min={[ROOM.x0 - WALL, 0, LEFT_ROOMS_END - WALL]} max={[HALL.x0 - WALL, 3.0, LEFT_ROOMS_END]} m={MAT.matte("#9a978c", 0.95)} />
      <Room s={s} />
      <End s={s} />
      {s.gudang ? <Gudang s={s} /> : null}
    </group>
  );
};
