// the bedroom (K2): bed under the window wall, desk with the LED clock (02:17) and the empty bottle,
// standing fan (later: auditory pareidolia), wardrobe, hooks with clothes (later: clothes-pile shapes),
// wall socket (later: socket face), poster, backpack. The door is the hallway DoorSet (Kos.tsx).

import React from "react";
import { DoubleSide } from "three";
import { box, cyl, sphere, torus } from "../../../kits/worldforge/geo.ts";
import { basic, phys, weaveTex } from "../../../cine/mats.ts";
import { BED, BOTTLE, CEIL, CLOCK, CLOCK_YAW, DESK, FAN, HALL, ROOM, ROOM_WIN, SOCKET, WALL, WARDROBE } from "../layout.ts";
import { HoledWall, MAT, Slab } from "./parts.tsx";
import { ledTex, posterTex } from "../../../cine/set/tex.ts";
import type { KosState } from "./Kos.tsx";

const IN_X1 = HALL.x0 - WALL; // room-side face of the hallway wall

const Fan: React.FC<{ a: number }> = ({ a }) => {
  const body = MAT.plastic("#e9e6de");
  return (
    <group position={FAN} rotation={[0, Math.PI / 2 + 0.35, 0]}>
      <mesh geometry={cyl(0.2, 0.22, 0.04, 28)} material={body} position={[0, 0.02, 0]} castShadow receiveShadow />
      <mesh geometry={cyl(0.016, 0.016, 1.05, 10)} material={MAT.chrome()} position={[0, 0.56, 0]} castShadow />
      <group position={[0, 1.12, 0]} rotation={[-0.08, 0, 0]}>
        <mesh geometry={cyl(0.07, 0.07, 0.16, 20)} material={body} position={[0, 0, -0.09]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        <group position={[0, 0, 0.04]}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} geometry={sphere(0.08, 16, 8)} material={phys("blade", { color: "#9fc3d8", roughness: 0.3, transparent: true, opacity: 0.85 })} rotation={[0, 0, a + (k * Math.PI * 2) / 3]} position={[Math.cos(a + (k * Math.PI * 2) / 3) * 0.1, Math.sin(a + (k * Math.PI * 2) / 3) * 0.1, 0]} scale={[1.2, 0.55, 0.06]} />
          ))}
          <mesh geometry={sphere(0.035, 16, 10)} material={body} />
        </group>
        {[0.2, 0.13].map((r) => (
          <mesh key={r} geometry={torus(r, 0.003, 4, 48)} material={MAT.chrome()} position={[0, 0, 0.045]} />
        ))}
        {Array.from({ length: 16 }, (_, k) => (
          <mesh key={k} geometry={box(0.003, 0.2, 0.003, 0)} material={MAT.chrome()} position={[Math.cos((k / 16) * Math.PI * 2) * 0.1, Math.sin((k / 16) * Math.PI * 2) * 0.1, 0.05]} rotation={[0, 0, (k / 16) * Math.PI * 2 - Math.PI / 2]} />
        ))}
      </group>
    </group>
  );
};

const Bed: React.FC = () => {
  const cx = (BED.x0 + BED.x1) / 2, cz = (BED.z0 + BED.z1) / 2, L = BED.x1 - BED.x0, Wd = BED.z1 - BED.z0;
  const sheet = phys("sheet", { color: "#ffffff", map: weaveTex("sheet", "#7f8fa8", [4, 4]), roughness: 0.9, sheen: 0.5, sheenColor: "#c8d4ea" });
  const blanket = phys("blanket", { color: "#ffffff", map: weaveTex("blanket", "#8a4a3a", [5, 5], "#6f382c"), roughness: 0.92, sheen: 0.6, sheenColor: "#e0a090" });
  return (
    <group>
      <Slab min={[BED.x0, 0, BED.z0]} max={[BED.x1, 0.24, BED.z1]} m={MAT.matte("#5a3b26", 0.6)} />
      <mesh geometry={box(L - 0.04, 0.22, Wd - 0.04, 0.06)} material={sheet} position={[cx, 0.35, cz]} castShadow receiveShadow />
      <mesh geometry={box(0.42, 0.11, Wd - 0.22, 0.05)} material={phys("pillow", { color: "#e4e1da", roughness: 0.9, sheen: 0.4 })} position={[BED.x0 + 0.28, 0.51, cz]} rotation={[0, 0, 0.06]} castShadow receiveShadow />
      {/* blanket pushed toward the foot */}
      <mesh geometry={box(0.95, 0.09, Wd + 0.04, 0.045)} material={blanket} position={[BED.x1 - 0.55, 0.5, cz]} rotation={[0.03, 0, -0.04]} castShadow receiveShadow />
      <mesh geometry={box(0.5, 0.12, Wd - 0.1, 0.06)} material={blanket} position={[BED.x1 - 0.9, 0.55, cz + 0.05]} rotation={[0.08, 0.2, 0.1]} castShadow receiveShadow />
      {/* headboard */}
      <Slab min={[BED.x0 - 0.04, 0, BED.z0]} max={[BED.x0, 0.85, BED.z1]} m={MAT.matte("#5a3b26", 0.6)} />
    </group>
  );
};

const Desk: React.FC<{ colon: boolean }> = ({ colon }) => {
  const z0 = DESK.z - DESK.d, cx = (DESK.x0 + DESK.x1) / 2;
  const wood = MAT.matte("#8a6a4a", 0.55);
  return (
    <group>
      <Slab min={[DESK.x0, DESK.top - 0.03, z0]} max={[DESK.x1, DESK.top, DESK.z]} m={wood} />
      {[DESK.x0 + 0.03, DESK.x1 - 0.03].map((x) => (
        <Slab key={x} min={[x - 0.025, 0, z0 + 0.03]} max={[x + 0.025, DESK.top - 0.03, DESK.z - 0.03]} m={wood} />
      ))}
      {/* LED clock (02:17) */}
      <group position={CLOCK} rotation={[0, CLOCK_YAW, 0]}>
        <mesh geometry={box(0.16, 0.07, 0.05, 0.012)} material={MAT.plastic("#141518")} position={[0, 0.035, 0]} castShadow />
        <mesh geometry={box(0.13, 0.045, 0.001, 0)} material={phys(`ledface${colon}`, { color: "#000", emissive: "#ffffff", emissiveMap: ledTex("02:17", colon), emissiveIntensity: 2.2 })} position={[0, 0.037, 0.0255]} />
      </group>
      {/* empty bottle */}
      <group position={BOTTLE}>
        <mesh geometry={cyl(0.034, 0.034, 0.2, 20)} material={phys("bottle", { color: "#cfe3ee", roughness: 0.05, transparent: true, opacity: 0.32, clearcoat: 1 })} position={[0, 0.1, 0]} />
        <mesh geometry={cyl(0.014, 0.03, 0.04, 16)} material={phys("bottle", { color: "#cfe3ee", roughness: 0.05, transparent: true, opacity: 0.32, clearcoat: 1 })} position={[0, 0.22, 0]} />
        <mesh geometry={cyl(0.015, 0.015, 0.02, 16)} material={MAT.plastic("#2d6db0")} position={[0, 0.25, 0]} />
        <mesh geometry={cyl(0.0345, 0.0345, 0.06, 20, true)} material={phys("label", { color: "#e8eef2", roughness: 0.6, side: DoubleSide })} position={[0, 0.11, 0]} />
      </group>
      {/* closed laptop with sleep LED, books, mug, lamp */}
      <group position={[cx - 0.12, DESK.top, z0 + 0.25]} rotation={[0, 0.12, 0]}>
        <mesh geometry={box(0.34, 0.018, 0.24, 0.008)} material={phys("laptop", { color: "#5b5f66", metalness: 0.7, roughness: 0.35 })} position={[0, 0.009, 0]} castShadow />
        <mesh geometry={sphere(0.0025, 8, 6)} material={basic("sleep", { color: "#dfe8ff" })} position={[0.0, 0.01, 0.121]} />
      </group>
      {[0, 1, 2].map((k) => (
        <mesh key={k} geometry={box(0.22, 0.03, 0.16, 0.004)} material={MAT.matte(["#7a2f2f", "#2f4f7a", "#c9b27a"][k], 0.7)} position={[DESK.x0 + 0.16, DESK.top + 0.015 + k * 0.03, z0 + 0.15]} rotation={[0, k * 0.15, 0]} castShadow />
      ))}
      <mesh geometry={cyl(0.04, 0.035, 0.09, 18)} material={MAT.plastic("#e3dbcf")} position={[cx + 0.2, DESK.top + 0.045, z0 + 0.12]} castShadow />
      <group position={[DESK.x0 + 0.12, DESK.top, DESK.z - 0.1]}>
        <mesh geometry={cyl(0.06, 0.07, 0.02, 20)} material={MAT.plastic("#2a2c30")} position={[0, 0.01, 0]} />
        <mesh geometry={cyl(0.008, 0.008, 0.36, 8)} material={MAT.plastic("#2a2c30")} position={[0.04, 0.19, 0]} rotation={[0, 0, -0.25]} />
        <mesh geometry={cyl(0.03, 0.07, 0.1, 18, true)} material={phys("shade", { color: "#2a2c30", roughness: 0.5, side: DoubleSide })} position={[0.12, 0.35, -0.02]} rotation={[0.3, 0, 0.9]} />
      </group>
      {/* chair */}
      <group position={[DESK.x0 + 0.3, 0, z0 - 0.3]} rotation={[0, -0.5, 0]}>
        <Slab min={[-0.21, 0.44, -0.2]} max={[0.21, 0.47, 0.2]} m={wood} />
        <Slab min={[-0.21, 0.47, -0.22]} max={[0.21, 0.9, -0.19]} m={wood} />
        {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
          <mesh key={i} geometry={box(0.03, 0.44, 0.03, 0.005)} material={wood} position={[x, 0.22, z]} castShadow />
        ))}
        {/* a shirt over the backrest */}
        <mesh geometry={box(0.44, 0.32, 0.05, 0.03)} material={phys("shirtChair", { color: "#ffffff", map: weaveTex("shirtC", "#2e3240", [4, 4]), roughness: 0.9 })} position={[0, 0.78, -0.2]} rotation={[0.1, 0, 0.03]} castShadow />
      </group>
    </group>
  );
};

/** Clothes on hooks beside the door (a jacket and a towel). */
const Hooks: React.FC = () => (
  <group position={[IN_X1 - 0.01, 1.72, -4.25]}>
    <mesh geometry={box(0.03, 0.05, 0.6, 0.01)} material={MAT.matte("#5a3b26", 0.6)} />
    <mesh geometry={box(0.12, 0.62, 0.36, 0.06)} material={phys("jacket", { color: "#ffffff", map: weaveTex("jacket", "#4a4f3a", [5, 5]), roughness: 0.9, sheen: 0.4 })} position={[-0.07, -0.33, 0.12]} rotation={[0, 0, 0.05]} castShadow receiveShadow />
    <mesh geometry={box(0.06, 0.55, 0.24, 0.03)} material={phys("towel", { color: "#ffffff", map: weaveTex("towel", "#c9b9a0", [6, 6]), roughness: 0.95, sheen: 0.6 })} position={[-0.04, -0.3, -0.2]} castShadow />
  </group>
);

const Window: React.FC<{ s: KosState }> = ({ s }) => {
  const x = ROOM.x0 - WALL / 2, zc = (ROOM_WIN.z0 + ROOM_WIN.z1) / 2, yc = (ROOM_WIN.y0 + ROOM_WIN.y1) / 2;
  const w = ROOM_WIN.z1 - ROOM_WIN.z0, h = ROOM_WIN.y1 - ROOM_WIN.y0;
  const fr = MAT.frame();
  const curtain = phys("curtain", { color: "#ffffff", map: weaveTex("curtain", "#3e5a74", [3, 3]), roughness: 0.95, side: DoubleSide, sheen: 0.5 });
  return (
    <group>
      <group position={[x, yc, zc]}>
        <Slab min={[-0.09, -h / 2 - 0.05, -w / 2 - 0.05]} max={[0.09, -h / 2, w / 2 + 0.05]} m={fr} />
        <Slab min={[-0.09, h / 2, -w / 2 - 0.05]} max={[0.09, h / 2 + 0.05, w / 2 + 0.05]} m={fr} />
        <Slab min={[-0.09, -h / 2, -w / 2 - 0.05]} max={[0.09, h / 2, -w / 2]} m={fr} />
        <Slab min={[-0.09, -h / 2, w / 2]} max={[0.09, h / 2, w / 2 + 0.05]} m={fr} />
        <Slab min={[-0.09, -0.02, -w / 2]} max={[0.09, 0.02, w / 2]} m={fr} />
        <Slab min={[-0.09, -h / 2, -0.02]} max={[0.09, h / 2, 0.02]} m={fr} />
        <mesh geometry={box(0.004, h, w, 0)} material={phys("glass", { color: "#9fb4c8", roughness: 0.08, transparent: true, opacity: 0.18, depthWrite: false })} />
        {/* night outside: a neighbour wall + sky glow */}
        <mesh geometry={box(0.001, 2.4, 3.2, 0)} material={s.day ? basic("roomSkyDay", { color: "#dbe6ee", side: DoubleSide }) : basic("roomSky", { color: "#14223c", side: DoubleSide })} position={[-1.6, 0.4, 0]} />
      </group>
      {/* curtains: one drawn, one gathered */}
      {Array.from({ length: 7 }, (_, k) => (
        <mesh key={k} geometry={cyl(0.035, 0.035, h + 0.35, 10, true)} material={curtain} position={[x + 0.12 + (k % 2) * 0.02, yc + 0.12, ROOM_WIN.z0 - 0.08 + k * 0.07]} castShadow />
      ))}
      {Array.from({ length: 4 }, (_, k) => (
        <mesh key={`g${k}`} geometry={cyl(0.04, 0.04, h + 0.35, 10, true)} material={curtain} position={[x + 0.13 + (k % 2) * 0.03, yc + 0.12, ROOM_WIN.z1 + 0.08 - k * 0.05]} castShadow />
      ))}
      <mesh geometry={cyl(0.01, 0.01, w + 0.8, 8)} material={MAT.chrome()} position={[x + 0.14, ROOM_WIN.y1 + 0.32, (ROOM_WIN.z0 + ROOM_WIN.z1) / 2]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};

/** A pile of clothes over the desk chair: in the dark it reads as someone sitting (pareidolia). */
const Pile: React.FC = () => {
  const z0 = DESK.z - DESK.d;
  const cloth = (k: string, c: string) => phys(`pile${k}`, { color: "#ffffff", map: weaveTex(`pile${k}`, c, [4, 4]), roughness: 0.92, sheen: 0.5 });
  return (
    <group position={[DESK.x0 + 0.3, 0, z0 - 0.3]} rotation={[0, -0.5, 0]}>
      <mesh geometry={sphere(0.17, 20, 14)} material={cloth("a", "#3c3f48")} position={[0, 1.06, -0.17]} scale={[1, 1.1, 0.9]} castShadow />
      <mesh geometry={box(0.46, 0.5, 0.2, 0.09)} material={cloth("b", "#4a4434")} position={[0, 0.74, -0.15]} rotation={[0.08, 0, 0]} castShadow />
      <mesh geometry={box(0.5, 0.16, 0.42, 0.07)} material={cloth("c", "#2e3a4e")} position={[0, 0.54, 0.02]} castShadow />
      <mesh geometry={box(0.12, 0.42, 0.14, 0.05)} material={cloth("c", "#2e3a4e")} position={[-0.2, 0.28, 0.2]} rotation={[0.1, 0, 0.05]} castShadow />
      <mesh geometry={box(0.12, 0.42, 0.14, 0.05)} material={cloth("b", "#4a4434")} position={[0.2, 0.3, 0.22]} rotation={[0.15, 0, -0.08]} castShadow />
      {[1, -1].map((s) => (
        <mesh key={s} geometry={box(0.1, 0.4, 0.12, 0.05)} material={cloth("a", "#3c3f48")} position={[s * 0.27, 0.72, -0.05]} rotation={[0.2, 0, s * 0.15]} castShadow />
      ))}
    </group>
  );
};

export const Room: React.FC<{ s: KosState }> = ({ s }) => (
  <group visible={s.room}>
    <Slab min={[ROOM.x0 - WALL, -0.1, ROOM.z0]} max={[IN_X1, 0, ROOM.z1]} m={MAT.tile([4.4, 4.25])} cast={false} />
    <group visible={s.roof !== false}>
      <Slab min={[ROOM.x0 - WALL, CEIL, ROOM.z0 - WALL]} max={[IN_X1, CEIL + 0.08, ROOM.z1 + WALL]} m={MAT.ceil([3, 3])} />
    </group>
    {s.pile ? <Pile /> : null}
    <HoledWall axis="z" c={ROOM.x0 - WALL / 2} a0={ROOM.z1 + WALL} a1={ROOM.z0 - WALL} holes={[{ a0: ROOM_WIN.z0, a1: ROOM_WIN.z1, y0: ROOM_WIN.y0, y1: ROOM_WIN.y1 }]} />
    <HoledWall axis="x" c={ROOM.z1 + WALL / 2} a0={ROOM.x0 - WALL} a1={IN_X1} holes={[]} />
    <HoledWall axis="x" c={ROOM.z0 - WALL / 2} a0={ROOM.x0 - WALL} a1={IN_X1} holes={[]} />
    <Bed />
    <Desk colon={s.colon} />
    <Fan a={s.fan} />
    <Hooks />
    <Window s={s} />
    {/* wardrobe */}
    <group>
      <Slab min={[WARDROBE.x0, 0, WARDROBE.z]} max={[WARDROBE.x1, WARDROBE.h, WARDROBE.z + WARDROBE.d]} m={MAT.matte("#6b4a32", 0.55)} />
      <Slab min={[(WARDROBE.x0 + WARDROBE.x1) / 2 - 0.004, 0.05, WARDROBE.z + WARDROBE.d]} max={[(WARDROBE.x0 + WARDROBE.x1) / 2 + 0.004, WARDROBE.h - 0.05, WARDROBE.z + WARDROBE.d + 0.004]} m={MAT.black()} />
      {[-0.06, 0.06].map((o) => (
        <mesh key={o} geometry={box(0.012, 0.12, 0.02, 0.004)} material={MAT.chrome()} position={[(WARDROBE.x0 + WARDROBE.x1) / 2 + o, 1.0, WARDROBE.z + WARDROBE.d + 0.012]} />
      ))}
      <mesh geometry={box(0.5, 0.3, 0.4, 0.04)} material={MAT.matte("#3e4a5a", 0.8)} position={[(WARDROBE.x0 + WARDROBE.x1) / 2, WARDROBE.h + 0.15, WARDROBE.z + 0.25]} castShadow />
    </group>
    {/* poster above the desk, socket, backpack, rug */}
    <mesh geometry={box(0.42, 0.59, 0.004, 0)} material={phys("poster", { color: "#ffffff", map: posterTex(), roughness: 0.7 })} position={[(DESK.x0 + DESK.x1) / 2, 1.55, ROOM.z1 - 0.004]} rotation={[0, Math.PI, 0]} />
    <group position={SOCKET} rotation={[0, Math.PI / 2, 0]}>
      <mesh geometry={box(0.075, 0.075, 0.012, 0.006)} material={MAT.plastic("#f0eee8")} />
      {[-0.012, 0.012].map((x) => (
        <mesh key={x} geometry={cyl(0.0035, 0.0035, 0.004, 8)} material={MAT.black()} position={[x, 0.004, 0.006]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
    </group>
    <group position={[DESK.x1 + 0.25, 0, DESK.z - 0.3]} rotation={[0, 0.6, 0.12]}>
      <mesh geometry={box(0.3, 0.42, 0.18, 0.07)} material={MAT.matte("#2a3a2e", 0.85)} position={[0, 0.21, 0]} castShadow receiveShadow />
      <mesh geometry={box(0.22, 0.16, 0.06, 0.04)} material={MAT.matte("#2a3a2e", 0.85)} position={[0, 0.15, 0.1]} castShadow />
    </group>
    <mesh geometry={box(1.4, 0.008, 0.9, 0.004)} material={phys("rug", { color: "#ffffff", map: weaveTex("rug", "#6a5a4a", [6, 4], "#4a3a2e"), roughness: 0.95 })} position={[-2.7, 0.004, -5.6]} receiveShadow />
  </group>
);
