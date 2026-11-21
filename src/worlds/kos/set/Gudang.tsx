// The gudang (storage room) behind the end wall — used for the "two people, same room" experiment.
// Same building: its door is the gudang door at the end of the hallway, its vent is the hallway vent.

import React from "react";
import { box, cyl, sphere, torus } from "../../../kits/worldforge/geo.ts";
import { basic, phys } from "../../../cine/mats.ts";
import { CEIL, END_Z, GUDANG, VENT, WALL } from "../layout.ts";
import { HoledWall, MAT, Slab } from "./parts.tsx";
import type { KosState } from "./Kos.tsx";

export const GUD = { x0: -0.95, x1: 1.75, z0: -18.2, z1: END_Z - WALL };
export const GUD_SWITCH: [number, number, number] = [GUDANG.x - GUDANG.w / 2 - 0.22, 1.3, GUD.z1 - 0.012];
export const GUD_BULB: [number, number, number] = [0.4, CEIL - 0.35, -16.7];

export const Gudang: React.FC<{ s: KosState }> = ({ s }) => {
  const wood = MAT.matte("#6b5440", 0.8);
  const card = (c: string) => MAT.matte(c, 0.9);
  const bulbOn = (s.gudang ?? 0) > 1.5 ? 1 : 0;
  return (
    <group>
      <Slab min={[GUD.x0, -0.1, GUD.z0]} max={[GUD.x1, 0, GUD.z1]} m={MAT.concrete([2, 2])} cast={false} />
      <group visible={s.roof !== false}>
        <Slab min={[GUD.x0, CEIL, GUD.z0]} max={[GUD.x1, CEIL + 0.08, GUD.z1]} m={MAT.matte("#8d8a80", 0.95)} />
      </group>
      <HoledWall axis="z" c={GUD.x0 - WALL / 2} a0={GUD.z1} a1={GUD.z0} holes={[]} dado={false} />
      <HoledWall axis="z" c={GUD.x1 + WALL / 2} a0={GUD.z1} a1={GUD.z0} holes={[]} dado={false} />
      <HoledWall axis="x" c={GUD.z0 - WALL / 2} a0={GUD.x0 - WALL} a1={GUD.x1 + WALL} holes={[{ a0: 0.2, a1: 1.0, y0: 1.5, y1: 2.2 }]} dado={false} />
      {/* back window glow + bars */}
      <mesh geometry={box(0.8, 0.7, 0.001, 0)} material={basic("gudWin", { color: "#26395c" })} position={[0.6, 1.85, GUD.z0 - 0.2]} />
      {[0.3, 0.5, 0.7, 0.9].map((x) => (
        <mesh key={x} geometry={cyl(0.008, 0.008, 0.7, 6)} material={MAT.steel()} position={[x, 1.85, GUD.z0 - 0.05]} castShadow />
      ))}
      {/* shelves with boxes along the left wall */}
      {[0.35, 0.95, 1.55].map((y, i) => (
        <group key={y}>
          <Slab min={[GUD.x0, y - 0.02, -17.9]} max={[GUD.x0 + 0.45, y, -15.6]} m={wood} />
          {[0, 1, 2].map((k) => (
            <mesh key={k} geometry={box(0.36, 0.28 + 0.06 * ((i + k) % 2), 0.4 + 0.1 * (k % 2), 0.01)} material={card(["#a88a5e", "#8f7550", "#b49a6a"][(i + k) % 3])} position={[GUD.x0 + 0.22, y + 0.15, -17.5 + k * 0.7]} rotation={[0, (k - 1) * 0.06, 0]} castShadow receiveShadow />
          ))}
        </group>
      ))}
      {[-17.9, -15.6].map((z) => (
        <Slab key={z} min={[GUD.x0, 0, z - 0.02]} max={[GUD.x0 + 0.45, 1.6, z + 0.02]} m={wood} />
      ))}
      {/* an old bicycle against the right wall */}
      <group position={[GUD.x1 - 0.25, 0, -17.0]} rotation={[0, Math.PI / 2, 0.06]}>
        {[-0.5, 0.5].map((z) => (
          <mesh key={z} geometry={torus(0.32, 0.02, 8, 36)} material={MAT.matte("#151515", 0.8)} position={[z, 0.34, 0]} castShadow />
        ))}
        <mesh geometry={cyl(0.015, 0.015, 1.0, 8)} material={MAT.matte("#7a2a24", 0.4)} position={[0, 0.62, 0]} rotation={[0, 0, Math.PI / 2 + 0.15]} castShadow />
        <mesh geometry={cyl(0.015, 0.015, 0.6, 8)} material={MAT.matte("#7a2a24", 0.4)} position={[-0.25, 0.5, 0]} rotation={[0, 0, 0.6]} castShadow />
        <mesh geometry={box(0.22, 0.05, 0.1, 0.02)} material={MAT.matte("#222", 0.6)} position={[-0.28, 0.82, 0]} castShadow />
      </group>
      {/* a rolled mattress, paint cans, a bucket */}
      <mesh geometry={cyl(0.22, 0.22, 0.9, 20)} material={phys("matt", { color: "#9aa6a0", roughness: 0.9 })} position={[1.2, 0.22, -15.8]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow />
      {[0, 1, 2].map((k) => (
        <mesh key={k} geometry={cyl(0.1, 0.1, 0.22, 20)} material={phys(`can${k}`, { color: ["#c9c4b8", "#d8d0b0", "#b5bcc4"][k], metalness: 0.5, roughness: 0.4 })} position={[0.1 + k * 0.23, 0.11, -17.85]} castShadow />
      ))}
      {/* hanging bulb + switch by the door */}
      <mesh geometry={cyl(0.004, 0.004, 0.3, 6)} material={MAT.black()} position={[GUD_BULB[0], CEIL - 0.15, GUD_BULB[2]]} />
      <mesh geometry={sphere(0.045, 16, 12)} material={phys(`gbulb${bulbOn}`, { color: "#f5efe2", emissive: "#ffd9a0", emissiveIntensity: 5 * bulbOn, roughness: 0.3 })} position={GUD_BULB} />
      <mesh geometry={box(0.07, 0.11, 0.012, 0.004)} material={MAT.plastic("#efeee8")} position={GUD_SWITCH} />
      {/* the vent seen from inside (its flap faces the hallway) */}
      <mesh geometry={box(VENT.w + 0.06, VENT.y1 - VENT.y0 + 0.06, 0.02, 0.004)} material={MAT.frame()} position={[VENT.x, (VENT.y0 + VENT.y1) / 2, GUD.z1 - 0.01]} />
    </group>
  );
};
