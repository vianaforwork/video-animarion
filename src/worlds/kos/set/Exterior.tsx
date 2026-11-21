// Outside the kos: night sky (gradient dome, stars, moon), the front facade with dark windows, terrace
// with the one lamp still on, yard with parked scooters, the locked gate, the street, neighbours.

import React, { useMemo } from "react";
import { BackSide, BufferAttribute, BufferGeometry, Color, DoubleSide, ShaderMaterial } from "three";
import { box, cached, cyl, sphere, torus } from "../../../kits/worldforge/geo.ts";
import { basic, phys } from "../../../cine/mats.ts";
import { mulberry32 } from "../../../kits/worldforge/noise.ts";
import { CEIL, ENTRANCE_Z, GATE, HALL, ROOM, STREET_LAMP, TERRACE_LAMP, WALL, YARD, type V3 } from "../layout.ts";
import { MAT, Slab } from "./parts.tsx";

let skyM: ShaderMaterial | null = null;
const skyMat = () =>
  (skyM ??= new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: new Color("#060b18") }, horizon: { value: new Color("#1d2d4c") }, glow: { value: new Color("#3a4f78") } },
    vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; varying vec3 vP;
      void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 c = mix(horizon, top, pow(h, 0.55));
        float m = max(0.0, dot(vP, normalize(vec3(-0.45, 0.42, 0.78))));
        c += glow * pow(m, 18.0) * 0.6;
        gl_FragColor = vec4(c, 1.0); }`,
  }));

let dayM: ShaderMaterial | null = null;
const daySky = () =>
  (dayM ??= new ShaderMaterial({
    side: BackSide, depthWrite: false, fog: false,
    uniforms: {},
    vertexShader: /* glsl */ `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0);
      vec3 c = mix(vec3(0.93, 0.88, 0.80), vec3(0.47, 0.66, 0.88), pow(h, 0.5)); gl_FragColor = vec4(c, 1.0); }`,
  }));

export const Sky: React.FC<{ day?: boolean }> = ({ day = false }) => {
  const stars = useMemo(
    () =>
      cached("stars", () => {
        const r = mulberry32(5);
        const n = 700, pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const a = r() * Math.PI * 2, e = 0.12 + Math.pow(r(), 0.7) * 1.3;
          pos.set([Math.cos(a) * Math.cos(e) * 180, Math.sin(e) * 180, Math.sin(a) * Math.cos(e) * 180], i * 3);
        }
        const g = new BufferGeometry();
        g.setAttribute("position", new BufferAttribute(pos, 3));
        return g;
      }),
    [],
  );
  return (
    <group>
      <mesh geometry={sphere(200, 32, 16)} material={day ? daySky() : skyMat()} renderOrder={-10} />
      <points geometry={stars} visible={!day}>
        <pointsMaterial color="#cdd8ff" size={1.3} sizeAttenuation={false} fog={false} transparent opacity={0.8} depthWrite={false} />
      </points>
      <mesh geometry={sphere(3.2, 24, 16)} material={basic("moon", { color: "#e9eeff", fog: false })} position={[-0.45 * 170, 0.42 * 170, 0.78 * 170]} visible={!day} />
    </group>
  );
};

/** Scooter (parked), simplified but readable: wheels, body, seat, handlebar, mirror. */
export const Scooter: React.FC<{ p: V3; yaw: number; c: string }> = ({ p, yaw, c }) => {
  const body = phys(`scoot${c}`, { color: c, roughness: 0.3, clearcoat: 0.8, metalness: 0.1 });
  const tyre = MAT.matte("#141414", 0.9);
  return (
    <group position={p} rotation={[0, yaw, 0.06]}>
      {[0.62, -0.6].map((z) => (
        <group key={z} position={[0, 0.25, z]}>
          <mesh geometry={torus(0.19, 0.06, 10, 28)} material={tyre} rotation={[0, Math.PI / 2, 0]} castShadow />
          <mesh geometry={cyl(0.12, 0.12, 0.06, 18)} material={MAT.steel()} rotation={[0, 0, Math.PI / 2]} />
        </group>
      ))}
      <mesh geometry={box(0.32, 0.36, 0.9, 0.12)} material={body} position={[0, 0.52, -0.28]} castShadow receiveShadow />
      <mesh geometry={box(0.28, 0.12, 0.62, 0.05)} material={MAT.matte("#1a1a1c", 0.6)} position={[0, 0.76, -0.3]} castShadow />
      <mesh geometry={box(0.3, 0.12, 0.5, 0.04)} material={body} position={[0, 0.3, 0.2]} castShadow />
      <mesh geometry={box(0.3, 0.75, 0.16, 0.08)} material={body} position={[0, 0.66, 0.52]} rotation={[-0.25, 0, 0]} castShadow />
      <mesh geometry={cyl(0.016, 0.016, 0.7, 8)} material={MAT.matte("#222", 0.5)} position={[0, 1.08, 0.58]} rotation={[0, 0, Math.PI / 2]} castShadow />
      <mesh geometry={box(0.2, 0.12, 0.08, 0.04)} material={phys("headlampGlass", { color: "#cfd8e0", roughness: 0.1, clearcoat: 1 })} position={[0, 0.98, 0.66]} />
    </group>
  );
};

const Gate: React.FC = () => {
  const iron = phys("iron", { color: "#20252b", metalness: 0.6, roughness: 0.5 });
  const n = 18;
  return (
    <group position={[0, 0, GATE.z]}>
      {[GATE.x0 - 0.12, GATE.x1 + 0.12].map((x) => (
        <Slab key={x} min={[x - 0.15, 0, -0.15]} max={[x + 0.15, GATE.h + 0.25, 0.15]} m={MAT.matte("#6b6a66", 0.95)} />
      ))}
      {/* fence walls left and right */}
      <Slab min={[YARD.x0, 0, -0.1]} max={[GATE.x0 - 0.27, 1.6, 0.1]} m={MAT.matte("#6b6a66", 0.95)} />
      <Slab min={[GATE.x1 + 0.27, 0, -0.1]} max={[YARD.x1, 1.6, 0.1]} m={MAT.matte("#6b6a66", 0.95)} />
      {[0.12, 1.0, GATE.h - 0.05].map((y) => (
        <mesh key={y} geometry={box(GATE.x1 - GATE.x0, 0.04, 0.04, 0.005)} material={iron} position={[(GATE.x0 + GATE.x1) / 2, y, 0]} castShadow />
      ))}
      {Array.from({ length: n }, (_, k) => (
        <mesh key={k} geometry={cyl(0.012, 0.012, GATE.h - 0.05, 6)} material={iron} position={[GATE.x0 + ((k + 0.5) / n) * (GATE.x1 - GATE.x0), GATE.h / 2, 0]} castShadow />
      ))}
      {/* chain + padlock at the middle */}
      <mesh geometry={torus(0.07, 0.008, 6, 20)} material={MAT.steel()} position={[0, 1.0, 0.03]} rotation={[0.3, 0, 0.6]} />
      <mesh geometry={box(0.05, 0.06, 0.025, 0.01)} material={phys("brass", { color: "#a98a3e", metalness: 1, roughness: 0.35 })} position={[0.02, 0.93, 0.05]} castShadow />
    </group>
  );
};

export const Exterior: React.FC<{ visible: boolean; lamp: number; day?: boolean; roof?: boolean }> = ({ visible, lamp, day = false, roof = true }) => {
  const fx0 = ROOM.x0 - WALL, fx1 = -ROOM.x0 + WALL;
  return (
    <group visible={visible}>
      <Sky day={day} />
      {/* the lot under the building (seen in the overhead views) */}
      <Slab min={[YARD.x0 - 8, -0.16, -20]} max={[YARD.x1 + 8, -0.11, ENTRANCE_Z]} m={MAT.matte("#3b3934", 0.95)} cast={false} />
      {/* yard + street */}
      <Slab min={[YARD.x0 - 8, -0.12, ENTRANCE_Z]} max={[YARD.x1 + 8, -0.02, YARD.z1]} m={MAT.concrete([8, 4])} cast={false} />
      <Slab min={[-40, -0.14, YARD.z1]} max={[40, -0.04, YARD.z1 + 9]} m={MAT.matte("#2b2c2e", 0.9)} cast={false} />
      {/* terrace slab + roof + posts */}
      <Slab min={[fx0, -0.02, ENTRANCE_Z]} max={[fx1, 0.08, ENTRANCE_Z + 1.6]} m={MAT.tile([10, 2])} cast={false} />
      <Slab min={[fx0 - 0.2, CEIL + 0.1, ENTRANCE_Z]} max={[fx1 + 0.2, CEIL + 0.22, ENTRANCE_Z + 1.9]} m={MAT.matte("#9a978e", 0.9)} />
      {[fx0 + 0.3, fx1 - 0.3].map((x) => (
        <Slab key={x} min={[x - 0.1, 0, ENTRANCE_Z + 1.5]} max={[x + 0.1, CEIL + 0.1, ENTRANCE_Z + 1.7]} m={MAT.matte("#8d8a82", 0.9)} />
      ))}
      {/* front facade with two dark room windows */}
      {[[fx0, HALL.x0 - WALL], [HALL.x1 + WALL, fx1]].map(([a, b], i) => (
        <group key={i}>
          <Slab min={[a, 0, ENTRANCE_Z - 0.15]} max={[b, 0.95, ENTRANCE_Z]} m={MAT.matte("#8f8c84", 0.9)} />
          <Slab min={[a, 2.15, ENTRANCE_Z - 0.15]} max={[b, CEIL + 0.1, ENTRANCE_Z]} m={MAT.matte("#8f8c84", 0.9)} />
          <Slab min={[a, 0.95, ENTRANCE_Z - 0.15]} max={[a + 0.9, 2.15, ENTRANCE_Z]} m={MAT.matte("#8f8c84", 0.9)} />
          <Slab min={[b - 0.7, 0.95, ENTRANCE_Z - 0.15]} max={[b, 2.15, ENTRANCE_Z]} m={MAT.matte("#8f8c84", 0.9)} />
          <mesh geometry={box(b - a - 1.6, 1.2, 0.02, 0)} material={phys("darkGlass", { color: "#0b1018", roughness: 0.1, clearcoat: 1, metalness: 0.2 })} position={[(a + 0.9 + b - 0.7) / 2, 1.55, ENTRANCE_Z - 0.08]} />
        </group>
      ))}
      {/* roof: tiled pitch rising toward the back */}
      <group visible={roof}>
        <mesh geometry={box(fx1 - fx0 + 0.6, 0.12, 17.5, 0.01)} material={phys("roof", { color: "#5a3a2c", roughness: 0.8 })} position={[0, CEIL + 0.9, -7.0]} rotation={[0.1, 0, 0]} castShadow />
        <Slab min={[fx0, CEIL + 0.08, -15.2]} max={[fx1, CEIL + 0.45, ENTRANCE_Z]} m={MAT.matte("#b9b3a3", 0.95)} />
      </group>
      {/* terrace lamp (the one light still on) */}
      <group position={TERRACE_LAMP}>
        <mesh geometry={cyl(0.07, 0.05, 0.08, 16)} material={MAT.plastic("#e9e5dc")} position={[0, 0.06, 0]} />
        <mesh geometry={sphere(0.05, 16, 12)} material={phys(`bulb${lamp}`, { color: "#fff2dd", emissive: "#ffcf8a", emissiveIntensity: 6 * lamp })} />
      </group>
      <Scooter p={[-2.4, 0, 3.6]} yaw={0.15} c="#a8312c" />
      <Scooter p={[-3.5, 0, 3.4]} yaw={0.25} c="#1f3f6e" />
      <Gate />
      {/* street lamp beyond the gate */}
      <group position={[STREET_LAMP[0], 0, STREET_LAMP[2]]}>
        <mesh geometry={cyl(0.06, 0.08, STREET_LAMP[1], 10)} material={MAT.steel()} position={[0, STREET_LAMP[1] / 2, 0]} />
        <mesh geometry={box(0.5, 0.08, 0.2, 0.03)} material={MAT.steel()} position={[-0.25, STREET_LAMP[1], 0]} />
        <mesh geometry={box(0.3, 0.02, 0.14, 0.01)} material={basic("streetBulb", { color: "#ffd9a0" })} position={[-0.35, STREET_LAMP[1] - 0.05, 0]} />
      </group>
      {/* neighbour houses across the street + beside */}
      {[[-14, 12, 7, 4.6], [-5.5, 12, 6, 3.6], [3.5, 12, 7, 5.2], [12, 12, 6, 3.8], [-9.5, -4, 4, 3.4], [9.5, -6, 4, 3.8]].map(([x, z, w, h], i) => (
        <group key={i}>
          <Slab min={[x - w / 2, 0, z - 2.5]} max={[x + w / 2, h, z + 2.5]} m={MAT.matte(["#3c4150", "#4a4a52", "#3a4458"][i % 3], 0.95)} />
          <mesh geometry={box(w + 0.6, 0.1, 5.8, 0)} material={MAT.matte("#2a2224", 0.9)} position={[x, h + 0.25, z]} rotation={[0.18, 0, 0]} />
          {i === 2 ? <mesh geometry={box(0.8, 0.9, 0.01, 0)} material={basic("neighbourWin", { color: "#5b4a30" })} position={[x + 1.2, 1.6, z - 2.51]} /> : null}
        </group>
      ))}
      {/* a tree silhouette behind the side passage */}
      <group position={[-6.5, 0, -8]}>
        <mesh geometry={cyl(0.12, 0.18, 3.2, 8)} material={MAT.matte("#1f1a16", 0.9)} position={[0, 1.6, 0]} />
        {[[0, 3.8, 0, 1.8], [1, 3.2, 0.5, 1.3], [-1, 3.4, -0.4, 1.4]].map(([x, y, z, r], i) => (
          <mesh key={i} geometry={sphere(r, 12, 10)} material={MAT.matte("#141c18", 0.95)} position={[x, y, z]} castShadow />
        ))}
      </group>
      <mesh geometry={box(60, 30, 0.1, 0)} material={basic("horizonBack", { color: "#0c1324", side: DoubleSide, fog: false })} position={[0, 5, -60]} visible={false} />
    </group>
  );
};
