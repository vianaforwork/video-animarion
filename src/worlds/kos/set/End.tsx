// The end of the hallway — every element of the mystery lives here from the first frame and is reused
// unchanged in the Act 5 reveal: the end wall + gudang door, the vent with its loose flap (the three
// knocks), the long black raincoat on its hook (the "figure"), the small window onto the side passage
// (the motorbike light), the water dispenser, the empty room K8 (door in Kos.tsx).

import React, { useMemo } from "react";
import { BufferGeometry, DoubleSide, LatheGeometry, Vector2 } from "three";
import { box, cached, cyl, sphere, torus } from "../../../kits/worldforge/geo.ts";
import { basic, phys } from "../../../cine/mats.ts";
import { mulberry32 } from "../../../kits/worldforge/noise.ts";
import { CEIL, DISPENSER, END_Z, GUDANG, HALL, LEFT_ROOMS_END, PASSAGE, RAINCOAT_HOOK, SMALL_WIN, VENT, WALL } from "../layout.ts";
import { HoledWall, MAT, Slab } from "./parts.tsx";
import { plankDoorTex } from "../../../cine/set/tex.ts";
import type { KosState } from "./Kos.tsx";

const EW = END_Z - WALL / 2; // end wall centre

export const coatMat = () => phys("raincoat", { color: "#0d0e12", roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.18, sheen: 0.2, sheenColor: "#4a5570" });

/** Long raincoat body: lathe from shoulders to hem with vertical folds, flattened front-to-back. */
export const coatBody = () =>
  cached("coatBody", () => {
    const pts: Vector2[] = [];
    const prof: [number, number][] = [[0.0, -0.22], [0.13, -0.235], [0.215, -0.29], [0.235, -0.36], [0.24, -0.6], [0.255, -0.95], [0.285, -1.35], [0.33, -1.7], [0.335, -1.74], [0.31, -1.745]];
    for (const [r, y] of prof) pts.push(new Vector2(r, y));
    const g: BufferGeometry = new LatheGeometry(pts, 72);
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i), y = a.getY(i), z = a.getZ(i);
      const ang = Math.atan2(z, x);
      const k = Math.min(1, Math.max(0, (-y - 0.4) / 1.3));
      const fold = 1 + k * (0.05 * Math.sin(ang * 7 + 0.6) + 0.03 * Math.sin(ang * 13 + 2.1));
      // flatten the back against the wall
      const zz = z < 0 ? z * 0.42 : z * 0.62;
      a.setXYZ(i, x * fold, y, zz * fold);
    }
    g.computeVertexNormals();
    return g;
  });

/** Hood: an ellipsoid shell, front opening facing +z. */
export const hoodGeo = () =>
  cached("hood", () => {
    const g = new LatheGeometry(
      [[0.0, -0.17], [0.07, -0.16], [0.115, -0.11], [0.135, -0.03], [0.13, 0.05], [0.1, 0.11], [0.05, 0.14], [0.0, 0.145]].map(([r, y]) => new Vector2(r, y)),
      48,
    );
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i), y = a.getY(i), z = a.getZ(i);
      // pointed peak at the back-top, deeper forward brim
      a.setXYZ(i, x, y + (z < 0 ? -z * 0.25 : 0), z * 1.08 + (y > 0 ? 0.02 : 0));
    }
    g.computeVertexNormals();
    return g;
  });

/** The "figure": hood (dark void face), cords + flap strips hanging like hair, shoulders, sleeves. */
const Raincoat: React.FC<{ sway: number }> = ({ sway }) => {
  const m = coatMat();
  const strands = useMemo(() => {
    const r = mulberry32(19);
    return Array.from({ length: 11 }, (_, i) => {
      const x = -0.085 + (i / 10) * 0.17 + (r() - 0.5) * 0.02;
      return { x, len: 0.26 + r() * 0.22, w: 0.012 + r() * 0.016, rz: (r() - 0.5) * 0.12, z: 0.11 + Math.cos((x / 0.09) * 1.2) * 0.035 };
    });
  }, []);
  return (
    <group position={RAINCOAT_HOOK}>
      {/* hook + loop */}
      <mesh geometry={cyl(0.006, 0.006, 0.07, 8)} material={MAT.steel()} position={[0, 0.0, 0.035]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={torus(0.018, 0.004, 6, 16)} material={m} position={[0, -0.005, 0.07]} />
      <group position={[0, -0.02, 0.15]} rotation={[sway, 0, sway * 0.6]}>
        {/* hood */}
        <group position={[0, -0.13, 0]} rotation={[0.18, 0, 0]}>
          <mesh geometry={hoodGeo()} material={m} castShadow receiveShadow />
          <mesh geometry={sphere(0.1, 24, 16)} material={basic("void", { color: "#000000" })} position={[0, -0.03, 0.06]} scale={[0.82, 1.05, 0.55]} />
          <mesh geometry={torus(0.1, 0.014, 8, 32, Math.PI * 1.25)} material={m} position={[0, -0.02, 0.085]} rotation={[0.1, 0, -Math.PI * 0.125 + Math.PI / 2 - Math.PI * 0.5]} scale={[0.86, 1.12, 1]} castShadow />
          {/* flap strips + cords hanging over the opening: the "long hair" */}
          {strands.map((s, i) => (
            <mesh key={i} geometry={box(s.w, s.len, 0.004, 0.002)} material={m} position={[s.x, 0.06 - s.len / 2, s.z]} rotation={[0.06, 0, s.rz]} castShadow />
          ))}
          {[-0.045, 0.045].map((x) => (
            <mesh key={x} geometry={cyl(0.003, 0.003, 0.42, 6)} material={phys("cord", { color: "#15161a", roughness: 0.6 })} position={[x, -0.25, 0.115]} castShadow />
          ))}
        </group>
        {/* body */}
        <mesh geometry={coatBody()} material={m} position={[0, 0.02, 0]} castShadow receiveShadow />
        {/* placket with snaps */}
        <mesh geometry={box(0.035, 1.38, 0.01, 0.004)} material={m} position={[0, -1.03, 0.155]} rotation={[-0.045, 0, 0]} castShadow />
        {[0, 1, 2, 3, 4].map((k) => (
          <mesh key={k} geometry={cyl(0.007, 0.007, 0.004, 10)} material={phys("snap", { color: "#3b3e44", metalness: 0.8, roughness: 0.4 })} position={[0, -0.45 - k * 0.27, 0.163 + k * 0.012]} rotation={[Math.PI / 2, 0, 0]} />
        ))}
        {/* sleeves hanging from the shoulders */}
        {[1, -1].map((s) => (
          <group key={s} position={[s * 0.215, -0.31, 0.02]} rotation={[0.05, 0, s * 0.07]}>
            <mesh geometry={cyl(0.06, 0.074, 0.72, 20)} material={m} position={[0, -0.36, 0]} castShadow receiveShadow />
            <mesh geometry={cyl(0.058, 0.058, 0.01, 20)} material={basic("void", { color: "#000000" })} position={[0, -0.72, 0]} />
          </group>
        ))}
      </group>
    </group>
  );
};

/** Vent above the gudang door: fixed louvres, a hinged loose flap (rotates about its top edge). */
const Vent: React.FC<{ flap: number }> = ({ flap }) => {
  const w = VENT.w, h = VENT.y1 - VENT.y0, cy = (VENT.y0 + VENT.y1) / 2;
  const fr = MAT.frame();
  const panel = phys("ventPanel", { color: "#6c675c", roughness: 0.6, metalness: 0.3 });
  return (
    <group position={[VENT.x, cy, END_Z]}>
      {/* frame */}
      <Slab min={[-w / 2 - 0.03, -h / 2 - 0.03, -0.02]} max={[w / 2 + 0.03, -h / 2, 0.025]} m={fr} />
      <Slab min={[-w / 2 - 0.03, h / 2, -0.02]} max={[w / 2 + 0.03, h / 2 + 0.03, 0.025]} m={fr} />
      <Slab min={[-w / 2 - 0.03, -h / 2, -0.02]} max={[-w / 2, h / 2, 0.025]} m={fr} />
      <Slab min={[w / 2, -h / 2, -0.02]} max={[w / 2 + 0.03, h / 2, 0.025]} m={fr} />
      {/* fixed louvres, deeper in the wall */}
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <mesh key={k} geometry={box(w, 0.006, 0.07, 0.002)} material={panel} position={[0, -h / 2 + 0.03 + k * 0.05, -0.08]} rotation={[0.7, 0, 0]} castShadow />
      ))}
      {/* moonlit gudang behind */}
      <mesh geometry={box(w, h, 0.001, 0)} material={basic("ventGlow", { color: "#2e4466" })} position={[0, 0, -0.16]} />
      {/* the loose flap: hinged at the top edge, swings toward the hallway */}
      <group position={[0, h / 2, 0.03]} rotation={[-flap, 0, 0]}>
        <mesh geometry={box(w - 0.02, h - 0.02, 0.008, 0.003)} material={panel} position={[0, -h / 2, 0]} castShadow receiveShadow />
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} geometry={box(w - 0.08, 0.026, 0.004, 0.001)} material={basic("slot", { color: "#05070b" })} position={[0, -h / 2 - 0.09 + k * 0.06, 0.005]} />
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={cyl(0.007, 0.007, 0.05, 8)} material={MAT.steel()} position={[s * (w / 2 - 0.06), 0, 0]} rotation={[0, 0, Math.PI / 2]} />
        ))}
      </group>
    </group>
  );
};

const SmallWindow: React.FC = () => {
  const zc = (SMALL_WIN.z0 + SMALL_WIN.z1) / 2, yc = (SMALL_WIN.y0 + SMALL_WIN.y1) / 2;
  const w = SMALL_WIN.z1 - SMALL_WIN.z0, h = SMALL_WIN.y1 - SMALL_WIN.y0;
  const fr = MAT.frame();
  const x = HALL.x0 - WALL / 2;
  return (
    <group position={[x, yc, zc]}>
      <Slab min={[-0.08, -h / 2 - 0.04, -w / 2 - 0.04]} max={[0.08, -h / 2, w / 2 + 0.04]} m={fr} />
      <Slab min={[-0.08, h / 2, -w / 2 - 0.04]} max={[0.08, h / 2 + 0.04, w / 2 + 0.04]} m={fr} />
      <Slab min={[-0.08, -h / 2, -w / 2 - 0.04]} max={[0.08, h / 2, -w / 2]} m={fr} />
      <Slab min={[-0.08, -h / 2, w / 2]} max={[0.08, h / 2, w / 2 + 0.04]} m={fr} />
      <mesh geometry={box(0.004, h, w, 0)} material={phys("glass", { color: "#9fb4c8", roughness: 0.08, transparent: true, opacity: 0.18, depthWrite: false })} position={[-0.04, 0, 0]} />
      {[-0.15, 0, 0.15].map((z) => (
        <mesh key={z} geometry={cyl(0.008, 0.008, h, 8)} material={MAT.steel()} position={[0.03, 0, z * (w / 0.5)]} castShadow />
      ))}
    </group>
  );
};

const Dispenser: React.FC = () => (
  <group position={DISPENSER} rotation={[0, -Math.PI / 2, 0]}>
    <mesh geometry={box(0.32, 0.95, 0.32, 0.02)} material={MAT.plastic("#d9dbd9")} position={[0, 0.475, 0]} castShadow receiveShadow />
    <mesh geometry={box(0.28, 0.06, 0.12, 0.01)} material={MAT.plastic("#9aa0a4")} position={[0, 0.5, 0.16]} castShadow />
    {[-0.06, 0.06].map((x, i) => (
      <mesh key={x} geometry={box(0.04, 0.05, 0.05, 0.01)} material={MAT.plastic(i ? "#c0392b" : "#2e6fb5")} position={[x, 0.62, 0.17]} castShadow />
    ))}
    <mesh geometry={cyl(0.135, 0.135, 0.44, 32)} material={phys("galon", { color: "#2f5f8f", roughness: 0.12, transparent: true, opacity: 0.6, clearcoat: 1 })} position={[0, 1.2, 0]} castShadow />
    <mesh geometry={cyl(0.05, 0.13, 0.08, 24)} material={phys("galonNeck", { color: "#2f5f8f", roughness: 0.1, transparent: true, opacity: 0.6 })} position={[0, 0.95, 0]} />
    <mesh geometry={cyl(0.04, 0.035, 0.08, 16)} material={MAT.plastic("#e8e4dc")} position={[0.09, 1.0 - 0.04, 0.12]} />
  </group>
);

const GudangDoor: React.FC<{ open: number }> = ({ open }) => {
  const x0 = GUDANG.x - GUDANG.w / 2, x1 = GUDANG.x + GUDANG.w / 2, fw = 0.06;
  const fr = MAT.frame();
  return (
    <group>
      <Slab min={[x0 - fw, 0, EW - 0.09]} max={[x0, GUDANG.h + fw, EW + 0.09]} m={fr} />
      <Slab min={[x1, 0, EW - 0.09]} max={[x1 + fw, GUDANG.h + fw, EW + 0.09]} m={fr} />
      <Slab min={[x0 - fw, GUDANG.h, EW - 0.09]} max={[x1 + fw, GUDANG.h + fw, EW + 0.09]} m={fr} />
      {/* hinged on the right (x1), swings into the gudang */}
      <group position={[x1, 0, EW]} rotation={[0, -open * 1.45, 0]}>
        <Slab min={[x0 - x1, 0.01, -0.02]} max={[0, GUDANG.h, 0.02]} m={phys("gudangDoor", { color: "#ffffff", map: plankDoorTex(), roughness: 0.85 })} />
        <mesh geometry={box(0.14, 0.03, 0.012, 0.004)} material={MAT.steel()} position={[x0 - x1 + 0.1, 1.05, 0.03]} />
        <mesh geometry={box(0.035, 0.05, 0.025, 0.008)} material={phys("brass", { color: "#a98a3e", metalness: 1, roughness: 0.35 })} position={[x0 - x1 + 0.06, 1.0, 0.045]} castShadow />
      </group>
    </group>
  );
};

export const End: React.FC<{ s: KosState }> = ({ s }) => (
  <group visible={s.hall}>
    <HoledWall
      axis="x"
      c={EW}
      a0={HALL.x0 - WALL}
      a1={HALL.x1 + WALL}
      holes={[{ a0: GUDANG.x - GUDANG.w / 2 - 0.06, a1: GUDANG.x + GUDANG.w / 2 + 0.06, y0: 0, y1: CEIL }]}
    />
    {/* the vent shares its x-range with the door: wall around the vent above the door head */}
    <Slab min={[GUDANG.x - GUDANG.w / 2 - 0.06, GUDANG.h + 0.06, EW - WALL / 2]} max={[VENT.x - VENT.w / 2, CEIL, EW + WALL / 2]} m={MAT.wall()} />
    <Slab min={[VENT.x + VENT.w / 2, GUDANG.h + 0.06, EW - WALL / 2]} max={[GUDANG.x + GUDANG.w / 2 + 0.06, CEIL, EW + WALL / 2]} m={MAT.wall()} />
    <Slab min={[VENT.x - VENT.w / 2, GUDANG.h + 0.06, EW - WALL / 2]} max={[VENT.x + VENT.w / 2, VENT.y0, EW + WALL / 2]} m={MAT.wall()} />
    <Slab min={[VENT.x - VENT.w / 2, VENT.y1, EW - WALL / 2]} max={[VENT.x + VENT.w / 2, CEIL, EW + WALL / 2]} m={MAT.wall()} />
    <GudangDoor open={Math.min(1, s.gudang ?? 0)} />
    <Vent flap={s.vent} />
    {s.coatOn !== false ? <Raincoat sway={s.coat} /> : null}
    <SmallWindow />
    <Dispenser />
    {/* a broom leaning by the dispenser */}
    <group position={[HALL.x1 - 0.08, 0, -12.55]} rotation={[0.0, 0, 0.12]}>
      <mesh geometry={cyl(0.012, 0.012, 1.2, 8)} material={MAT.plastic("#2f5aa0")} position={[0, 0.72, 0]} />
      <mesh geometry={cyl(0.03, 0.08, 0.16, 16)} material={MAT.matte("#c9a86a", 0.95)} position={[0, 0.08, 0]} castShadow />
    </group>
    {/* side passage seen through the small window: ground, neighbour wall, a potted plant */}
    <Slab min={[PASSAGE.x0, -0.1, PASSAGE.z1]} max={[PASSAGE.x1, 0, PASSAGE.z0]} m={MAT.concrete([3, 6])} cast={false} />
    <Slab min={[PASSAGE.x0 - 0.15, 0, PASSAGE.z1]} max={[PASSAGE.x0, 2.6, PASSAGE.z0]} m={MAT.matte("#7e7a70", 0.95)} />
    <Slab min={[PASSAGE.x0, 0, END_Z - WALL - 0.15]} max={[PASSAGE.x1, 2.6, END_Z - WALL]} m={MAT.matte("#7e7a70", 0.95)} />
    <group position={[PASSAGE.x0 + 0.4, 0, -12.6]}>
      <mesh geometry={cyl(0.18, 0.14, 0.32, 16)} material={MAT.matte("#7a4a32", 0.8)} position={[0, 0.16, 0]} castShadow />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <mesh key={k} geometry={box(0.05, 0.7, 0.005, 0.002)} material={MAT.matte("#2f4a2a", 0.8)} position={[Math.sin(k) * 0.08, 0.6, Math.cos(k) * 0.08]} rotation={[Math.cos(k * 2) * 0.4, k, Math.sin(k * 2) * 0.4]} castShadow />
      ))}
    </group>
    <mesh geometry={box(0.001, 2.0, 3.0, 0)} material={s.day ? basic("passageSkyDay", { color: "#dbe6ee", side: DoubleSide }) : basic("passageSky", { color: "#1b2a46", side: DoubleSide })} position={[PASSAGE.x0 - 0.3, 3.4, (LEFT_ROOMS_END + END_Z) / 2]} />
  </group>
);
