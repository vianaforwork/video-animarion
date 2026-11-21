// Coast world, picture side: sky, sea, the headland terrain with rocks and grass, fence and bench, the
// lighthouse (turning lamp + beams), the keeper's cottage (exterior + furnished interior) and the fishing
// boat whose lamps are "the light at sea". Pure function of (place, time, set state, t).

import React, { useMemo } from "react";
import { BufferAttribute, BufferGeometry, Color, ConeGeometry, DoubleSide, IcosahedronGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Shape, ShapeGeometry, Vector3 } from "three";
import { box, cached, cyl, sphere, torus } from "../../kits/worldforge/geo.ts";
import { expAxis } from "../../kits/worldforge/heightfield.ts";
import { fbm, mulberry32 } from "../../kits/worldforge/noise.ts";
import { canvasTex, phys } from "../../cine/mats.ts";
import { Beam, Dust, Glow } from "../../cine/FX.tsx";
import { SKIES, SkyDome } from "../../cine/env/Sky.tsx";
import { Ocean, waveHeight, waveSlope } from "../../cine/env/Ocean.tsx";
import { Bed, Chair, Desk, Door, HoledWall, MAT, OilLamp, Shelf, Slab, WallClock, Window } from "../../cine/set/parts.tsx";
import type { Cam } from "../../cine/Post.tsx";
import type { SetState, V3 } from "../types.ts";
import { BED_AT, BENCH, BOAT, BOAT_YAW, COTTAGE, C_DOOR, C_WIN, DECK_Y, DESK, DESK_TOP, LAMP, LANTERN, LH, MOON, SEA_LIGHT, SUN_DAWN, TOP, beamAngle, coastZ, ground } from "./layout.ts";

// ── terrain ─────────────────────────────────────────────────────────────────

const PATHS: [number, number, number, number][] = [[6.4, 0.6, 3.6, 0.0], [3.9, -0.2, 2.5, -6.4], [3.4, -2.6, 5.6, -5.2], [6.4, 0.6, 9.0, 4.5]];
const segDist = (x: number, z: number, [ax, az, bx, bz]: [number, number, number, number]) => {
  const dx = bx - ax, dz = bz - az, k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - ax - dx * k, z - az - dz * k);
};

const terrainGeo = () =>
  cached("coastTerrain", () => {
    const ax = expAxis(-260, 260, 0.4, 0.03), az = expAxis(-160, 260, 0.4, 0.03);
    const nx = ax.n, nz = az.n;
    const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3);
    const grass = new Color("#3e4a2c"), grass2 = new Color("#56603a"), path = new Color("#6e5d47"), rock = new Color("#5d5752"), wet = new Color("#26292a");
    const c = new Color();
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = ax.coord[i], z = az.coord[j], h = ground(x, z), k = j * nx + i;
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      const e = 0.3, slope = Math.hypot(ground(x + e, z) - ground(x - e, z), ground(x, z + e) - ground(x, z - e)) / (2 * e);
      c.copy(grass).lerp(grass2, 0.5 + 0.5 * fbm(x * 0.15, z * 0.15, 3));
      const pd = Math.min(...PATHS.map((p) => segDist(x, z, p)));
      if (h > TOP - 0.5) c.lerp(path, Math.max(0, Math.min(1, (0.55 - pd) / 0.25)) * 0.9);
      c.lerp(rock, Math.min(1, Math.max(0, (slope - 0.7) / 0.6)));
      if (h < 1.6) c.lerp(wet, Math.min(1, (1.6 - h) / 1.6));
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
    let n = 0;
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, cc = a + nx, d = cc + 1;
      idx[n++] = a; idx[n++] = cc; idx[n++] = b; idx[n++] = b; idx[n++] = cc; idx[n++] = d;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("color", new BufferAttribute(col, 3));
    g.setIndex(new BufferAttribute(idx, 1));
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
  });
const terrainMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });

const rockGeo = () =>
  cached("coastRock", () => {
    const g = new IcosahedronGeometry(1, 2);
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const v = new Vector3(a.getX(i), a.getY(i), a.getZ(i));
      v.multiplyScalar(1 + 0.28 * fbm(v.x * 1.7 + 3, v.y * 1.7 + v.z, 3));
      a.setXYZ(i, v.x, v.y * 0.75, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
const rockMat = new MeshStandardMaterial({ color: "#4a4643", roughness: 0.92, flatShading: true });

const Rocks: React.FC = () => {
  const mesh = useMemo(() => {
    const r = mulberry32(31), n = 330;
    const m = new InstancedMesh(rockGeo(), rockMat, n);
    const M = new Matrix4(), q = new Quaternion(), c = new Color();
    for (let i = 0; i < n; i++) {
      const face = i % 7 < 3;
      const x = (face ? -45 : -95) + r() * (face ? 90 : 190), zc = coastZ(x);
      const z = face ? zc - 0.2 - r() * 1.4 : zc - 0.5 - r() * r() * 9, s = face ? 0.45 + r() * 0.9 : 0.8 + r() * 3.2;
      const y = face ? 0.5 + r() * (TOP - 2) : Math.max(ground(x, z), -1.2 + r() * 1.5);
      q.setFromAxisAngle(new Vector3(r(), r(), r()).normalize(), r() * 6);
      M.compose(new Vector3(x, y, z), q, new Vector3(s * (0.8 + r() * 0.6), s * (0.6 + r() * 0.6), s));
      m.setMatrixAt(i, M);
      m.setColorAt(i, c.setHSL(0.07, 0.06, (face ? 0.3 : 0.2) + r() * 0.12));
    }
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, []);
  return <primitive object={mesh} />;
};

const Grass: React.FC<{ t: number }> = ({ t }) => {
  const { mesh, base } = useMemo(() => {
    const r = mulberry32(77), base: [number, number, number, number, number][] = [];
    while (base.length < 2200) {
      const x = -26 + r() * 56, z = -12 + r() * 40, h = ground(x, z);
      if (h < TOP - 0.3 || z < coastZ(x) + 0.6) continue;
      if (x > COTTAGE.x0 - 0.4 && x < COTTAGE.x1 + 0.4 && z > COTTAGE.z0 - 0.4 && z < COTTAGE.z1 + 0.4) continue;
      if (Math.hypot(x, z) < LH.r0 + 0.8) continue;
      if (Math.min(...PATHS.map((p) => segDist(x, z, p))) < 0.6) continue;
      base.push([x, h, z, 0.6 + r() * 0.9, r() * 6.28]);
    }
    const g = cached("grassBlade", () => new ConeGeometry(0.05, 0.42, 4, 1).translate(0, 0.21, 0));
    const m = new InstancedMesh(g, new MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 }), base.length);
    const c = new Color();
    base.forEach((_, i) => m.setColorAt(i, c.setHSL(0.2 + 0.05 * r(), 0.32, 0.17 + 0.08 * r())));
    m.receiveShadow = true;
    return { mesh: m, base };
  }, []);
  const M = new Matrix4(), q = new Quaternion(), e = new Vector3();
  base.forEach(([x, y, z, s, ph], i) => {
    const sway = 0.18 * Math.sin(t * 1.6 + x * 0.35 + ph * 0.3) + 0.08 * Math.sin(t * 3.1 + ph);
    q.setFromAxisAngle(e.set(1, 0, 0.3).normalize(), sway);
    M.compose(new Vector3(x, y - 0.02, z), q, new Vector3(s, s, s));
    mesh.setMatrixAt(i, M);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

const Fence: React.FC = () => {
  const posts: V3[] = [];
  for (let x = -7; x <= 9.01; x += 2) posts.push([x, ground(x, coastZ(x) + 1.1), coastZ(x) + 1.1]);
  const wood = MAT.wood("#5a4a3a");
  return (
    <group>
      {posts.map((p, i) => <mesh key={i} geometry={box(0.09, 1.05, 0.09, 0.01)} material={wood} position={[p[0], p[1] + 0.5, p[2]]} castShadow />)}
      {posts.slice(1).map((p, i) => {
        const a = posts[i], dx = p[0] - a[0], dz = p[2] - a[2], L = Math.hypot(dx, dz), yaw = Math.atan2(dx, dz);
        return [0.5, 0.92].map((hh) => (
          <mesh key={`${i}${hh}`} geometry={box(0.05, 0.07, L, 0.01)} material={wood} position={[(a[0] + p[0]) / 2, (a[1] + p[1]) / 2 + hh, (a[2] + p[2]) / 2]} rotation={[0, yaw, 0]} castShadow />
        ));
      })}
    </group>
  );
};

const Bench: React.FC = () => {
  const w = MAT.wood("#6a5038");
  return (
    <group position={BENCH}>
      <Slab min={[-0.85, 0.42, -0.2]} max={[0.85, 0.47, 0.22]} m={w} />
      <Slab min={[-0.85, 0.52, 0.2]} max={[0.85, 0.9, 0.25]} m={w} />
      {[-0.7, 0.7].map((x) => <Slab key={x} min={[x - 0.04, 0, -0.18]} max={[x + 0.04, 0.42, 0.2]} m={MAT.steel()} />)}
    </group>
  );
};

// ── lighthouse ──────────────────────────────────────────────────────────────

const Lighthouse: React.FC<{ t: number; beam: number; dark: number; cam: Cam }> = ({ t, beam, dark, cam }) => {
  const white = phys("lhWhite", { color: "#e7e3d9", roughness: 0.7 }), red = phys("lhRed", { color: "#a3302a", roughness: 0.6 });
  const stone = phys("lhStone", { color: "#8a857c", roughness: 0.9 }), iron = phys("lhIron", { color: "#1d2124", roughness: 0.5, metalness: 0.6 });
  const rAt = (y: number) => LH.r0 + (LH.r1 - LH.r0) * (y / LH.h);
  const bands = [0.7, 4, 8, 12, LH.h];
  const a = beamAngle(t);
  const glass = phys(`lhGlass${Math.round(beam * dark * 10)}`, { color: "#cfe0ef", roughness: 0.05, transparent: true, opacity: 0.25, emissive: "#ffe8c0", emissiveIntensity: 0.12 * beam * dark, side: DoubleSide, depthWrite: false });
  const core = phys(`lhCore${Math.round(beam * 10)}`, { color: "#fff6e0", emissive: "#fff0d0", emissiveIntensity: 0.3 + 2 * beam, roughness: 0.2 });
  // the beam's flare toward the camera
  const toCam = new Vector3(cam.pos[0] - LAMP[0], 0, cam.pos[2] - LAMP[2]).normalize();
  const face = Math.max(...[0, Math.PI].map((o) => Math.max(0, -Math.sin(a + o) * toCam.x - Math.cos(a + o) * toCam.z)));
  const camD = Math.hypot(cam.pos[0] - LAMP[0], cam.pos[1] - LAMP[1], cam.pos[2] - LAMP[2]);
  const near = Math.min(1, Math.max(0.06, (camD - 3) / 25));
  return (
    <group>
      <mesh geometry={cyl(2.95, 3.05, 0.8, 40)} material={stone} position={[0, TOP + 0.3, 0]} castShadow receiveShadow />
      {bands.slice(0, -1).map((y0, i) => {
        const y1 = bands[i + 1];
        return <mesh key={i} geometry={cyl(rAt(y1), rAt(y0), y1 - y0, 48)} material={i % 2 ? red : white} position={[0, TOP + (y0 + y1) / 2, 0]} castShadow receiveShadow />;
      })}
      {/* door (faces +x) and small windows */}
      <group position={[rAt(1) - 0.02, TOP + 0.7, 0]}>
        <Slab min={[-0.05, 0, -0.55]} max={[0.12, 2.15, 0.55]} m={stone} />
        <Slab min={[0.1, 0.02, -0.45]} max={[0.16, 2.0, 0.45]} m={phys("lhDoor", { color: "#2f4a3c", roughness: 0.55, clearcoat: 0.3 })} />
        <mesh geometry={sphere(0.035, 10, 8)} material={MAT.brass()} position={[0.18, 1.0, 0.33]} />
        <Slab min={[0.0, -0.7, -0.7]} max={[0.75, 0.0, 0.7]} m={stone} />
      </group>
      {[[5.5, -Math.PI / 2], [9.5, Math.PI], [13.2, -Math.PI / 2 + 0.6], [7.5, 0.4]].map(([y, ang], i) => {
        const r = rAt(y);
        return (
          <group key={i} position={[Math.sin(ang) * r, TOP + y, Math.cos(ang) * r]} rotation={[0, ang, 0]}>
            <mesh geometry={box(0.42, 0.72, 0.1, 0.02)} material={stone} />
            <mesh geometry={box(0.3, 0.58, 0.04, 0.01)} material={phys("lhWin", { color: "#0c0f14", emissive: "#ffb46a", emissiveIntensity: 0.25 * dark, roughness: 0.2 })} position={[0, 0, 0.04]} />
          </group>
        );
      })}
      {/* gallery deck, corbels, railing */}
      <mesh geometry={cyl(2.75, 2.6, 0.3, 48)} material={stone} position={[0, DECK_Y - 0.15, 0]} castShadow receiveShadow />
      {Array.from({ length: 16 }, (_, i) => {
        const ang = (i / 16) * Math.PI * 2;
        return <mesh key={i} geometry={box(0.18, 0.5, 0.6, 0.02)} material={white} position={[Math.sin(ang) * (LH.r1 + 0.35), DECK_Y - 0.5, Math.cos(ang) * (LH.r1 + 0.35)]} rotation={[0, ang, 0]} castShadow />;
      })}
      {Array.from({ length: 28 }, (_, i) => {
        const ang = (i / 28) * Math.PI * 2;
        return <mesh key={i} geometry={cyl(0.022, 0.022, 1.05, 6)} material={iron} position={[Math.sin(ang) * 2.6, DECK_Y + 0.52, Math.cos(ang) * 2.6]} castShadow />;
      })}
      {[1.05, 0.55].map((h) => <mesh key={h} geometry={torus(2.6, 0.028, 6, 96)} material={iron} position={[0, DECK_Y + h, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />)}
      {/* lamp room */}
      <mesh geometry={cyl(LANTERN.r + 0.08, LANTERN.r + 0.1, 0.8, 32)} material={white} position={[0, DECK_Y + 0.4, 0]} castShadow receiveShadow />
      <mesh geometry={cyl(LANTERN.r, LANTERN.r, 1.85, 32, true)} material={glass} position={[0, DECK_Y + 1.73, 0]} />
      {Array.from({ length: 10 }, (_, i) => {
        const ang = (i / 10) * Math.PI * 2;
        return <mesh key={i} geometry={box(0.05, 1.9, 0.05, 0.005)} material={iron} position={[Math.sin(ang) * LANTERN.r, DECK_Y + 1.73, Math.cos(ang) * LANTERN.r]} castShadow />;
      })}
      {[DECK_Y + 0.82, DECK_Y + 2.65].map((y) => <mesh key={y} geometry={torus(LANTERN.r, 0.04, 6, 48)} material={iron} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} />)}
      <mesh geometry={cyl(0.28, LANTERN.r + 0.32, 1.0, 32)} material={red} position={[0, LANTERN.y1 + 0.15, 0]} castShadow />
      <mesh geometry={sphere(0.3, 20, 14)} material={iron} position={[0, LANTERN.y1 + 0.85, 0]} castShadow />
      <mesh geometry={cyl(0.02, 0.02, 1.1, 6)} material={iron} position={[0, LANTERN.y1 + 1.5, 0]} />
      {/* lens + bright core, turning */}
      <group position={LAMP} rotation={[0, a, 0]}>
        <mesh geometry={sphere(0.14, 20, 14)} material={core} />
        {[-0.3, -0.15, 0, 0.15, 0.3].map((y) => <mesh key={y} geometry={torus(0.42 - Math.abs(y) * 0.6, 0.05, 8, 32)} material={phys("lens", { color: "#c8dce4", roughness: 0.02, transparent: true, opacity: 0.35 })} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} />)}
        {[1, -1].map((s) => <mesh key={s} geometry={cyl(0.38, 0.38, 0.04, 28)} material={phys(`bullseye${Math.round(beam * 10)}`, { color: "#e8f4f8", roughness: 0.02, transparent: true, opacity: 0.4, emissive: "#fff0d0", emissiveIntensity: 0.22 * beam })} position={[0, 0, s * -0.5]} rotation={[Math.PI / 2, 0, 0]} />)}
      </group>
      {/* beams read as volumes from afar; close to the lamp (on the gallery) they would be solid tubes */}
      {[0, Math.PI].map((o) => <Beam key={o} pos={LAMP} yaw={a + o} pitch={-0.015} len={160} radius={9} color="#fff2d6" i={0.55 * beam * dark * Math.min(1, Math.max(0, (camD - 5) / 6))} />)}
      <Glow pos={LAMP} size={(2.2 + 14 * face ** 24) * near} color="#ffe9c4" i={beam * (0.35 + 0.65 * dark) * (0.5 + 0.5 * face ** 6) * near} />
    </group>
  );
};

// ── cottage ─────────────────────────────────────────────────────────────────

const chartTex = () =>
  canvasTex("seaChart", 512, 360, (g, w, h) => {
    g.fillStyle = "#d9cfb3"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(60,80,110,0.55)"; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 60 + i * 50); for (let x = 0; x <= w; x += 16) g.lineTo(x, 60 + i * 50 + 18 * Math.sin(x * 0.02 + i)); g.stroke(); }
    g.fillStyle = "#8a7a58"; g.beginPath(); g.moveTo(w, 0); g.lineTo(w * 0.62, 0); g.bezierCurveTo(w * 0.7, h * 0.3, w * 0.55, h * 0.5, w * 0.72, h); g.lineTo(w, h); g.fill();
    g.strokeStyle = "rgba(120,30,30,0.8)"; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(w * 0.15, h * 0.8); g.lineTo(w * 0.6, h * 0.35); g.stroke();
  });
const logTex = () =>
  canvasTex("logbook", 512, 320, (g, w, h) => {
    g.fillStyle = "#efe6cf"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(90,110,160,0.35)"; g.lineWidth = 1;
    for (let y = 30; y < h; y += 18) { g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke(); }
    g.strokeStyle = "rgba(40,40,60,0.75)"; g.lineWidth = 2;
    const r = mulberry32(4);
    for (let y = 26; y < h - 40; y += 18) { g.beginPath(); let x = 20; g.moveTo(x, y); while (x < (y > 200 ? 180 : w / 2 - 30)) { x += 6 + r() * 10; g.lineTo(x, y - r() * 6); } g.stroke(); }
    g.fillStyle = "rgba(60,60,60,0.4)"; g.fillRect(w / 2 - 2, 0, 4, h);
  });

const Cottage: React.FC<{ s: SetState; dark: number; inside: boolean; t: number }> = ({ s, dark, inside, t }) => {
  const { x0, x1, z0, z1, y, h, t: th } = COTTAGE;
  const wallOut = MAT.wall("#d9dcd6"), dado = MAT.dado("#4f6b6a"), roofM = phys("roof", { color: "#6e3426", roughness: 0.75 });
  const lamp = s.lamp ?? 1;
  const rise = 1.5, ov = 0.45, halfW = (z1 - z0) / 2 + ov, slope = Math.atan2(rise, halfW), L = Math.hypot(rise, halfW);
  const gable = useMemo(() => {
    const sh = new Shape();
    sh.moveTo(z0 - 0.02, 0); sh.lineTo(z1 + 0.02, 0); sh.lineTo((z0 + z1) / 2, rise); sh.closePath();
    return new ShapeGeometry(sh);
  }, [z0, z1]);
  return (
    <group>
      {/* foundation + floor */}
      <Slab min={[x0 - 0.1, TOP - 1.5, z0 - 0.1]} max={[x1 + 0.1, y - 0.1, z1 + 0.1]} m={phys("found", { color: "#6d675e", roughness: 0.95 })} />
      <Slab min={[x0, y - 0.12, z0]} max={[x1, y, z1]} m={MAT.planks([3, 3], "#c9a27a")} />
      <Slab min={[x0 - 0.6, TOP - 0.3, C_DOOR.z - 0.6]} max={[x0, y - 0.05, C_DOOR.z + 0.6]} m={phys("found", { color: "#6d675e", roughness: 0.95 })} />
      {/* walls */}
      <HoledWall axis="z" c={x0 + th / 2} a0={z0} a1={z1} y0={y} top={h} t={th} m={wallOut} dado={dado} holes={[{ a0: C_DOOR.z - C_DOOR.w / 2, a1: C_DOOR.z + C_DOOR.w / 2, y0: 0, y1: 2.05 }]} />
      <HoledWall axis="z" c={x1 - th / 2} a0={z0} a1={z1} y0={y} top={h} t={th} m={wallOut} dado={dado} holes={[{ a0: -1.1, a1: -0.2, y0: 1.0, y1: 1.9 }]} />
      <HoledWall axis="x" c={z0 + th / 2} a0={x0} a1={x1} y0={y} top={h} t={th} m={wallOut} dado={dado} holes={[{ a0: C_WIN.x - C_WIN.w / 2, a1: C_WIN.x + C_WIN.w / 2, y0: C_WIN.y0, y1: C_WIN.y1 }]} />
      <HoledWall axis="x" c={z1 - th / 2} a0={x0} a1={x1} y0={y} top={h} t={th} m={wallOut} dado={dado} holes={[{ a0: 8.3, a1: 9.1, y0: 1.1, y1: 1.85 }]} />
      {/* windows, door */}
      <Window at={[C_WIN.x, y + C_WIN.y0, z0 + th / 2]} axis="x" w={C_WIN.w} h={C_WIN.y1 - C_WIN.y0} />
      <Window at={[x1 - th / 2, y + 1.0, -0.65]} axis="z" w={0.9} h={0.9} />
      <Window at={[8.7, y + 1.1, z1 - th / 2]} axis="x" w={0.8} h={0.75} />
      <Door at={[x0 + th / 2, y, C_DOOR.z]} axis="z" w={C_DOOR.w} open={s.door ?? 0} inside={-1} leaf={phys("cDoor", { color: "#3d5a6e", roughness: 0.5, clearcoat: 0.3 })} />
      {/* roof: two pitches along x + gables */}
      {[1, -1].map((k) => (
        <mesh key={k} geometry={box(x1 - x0 + 2 * ov, 0.09, L, 0.01)} material={roofM} position={[(x0 + x1) / 2, y + h + rise / 2, (z0 + z1) / 2 + k * (halfW / 2)]} rotation={[k * slope, 0, 0]} castShadow receiveShadow />
      ))}
      {[x0, x1].map((x) => <mesh key={x} geometry={gable} material={wallOut} position={[x + (x === x0 ? 0.02 : -0.02), y + h, 0]} rotation={[0, Math.PI / 2, 0]} castShadow />)}
      {/* ceiling */}
      <Slab min={[x0 + th, y + h - 0.05, z0 + th]} max={[x1 - th, y + h, z1 - th]} m={MAT.planks([2, 2], "#b89a78")} />
      {/* porch lamp */}
      <mesh geometry={box(0.16, 0.22, 0.16, 0.02)} material={phys(`porch${Math.round(lamp * dark * 10)}`, { color: "#2a2620", emissive: "#ffb76e", emissiveIntensity: 2.5 * lamp * dark, roughness: 0.4 })} position={[x0 - 0.12, y + 2.35, C_DOOR.z + 0.62]} />
      {inside ? <Interior lamp={lamp} t={t} /> : null}
      {/* warm window glow seen from outside */}
      {!inside ? <Glow pos={[C_WIN.x, y + 1.5, z0 - 0.05]} size={2.4} color="#ffb05a" i={0.22 * lamp * dark} /> : null}
    </group>
  );
};

const Interior: React.FC<{ lamp: number; t: number }> = ({ lamp, t }) => {
  const y = COTTAGE.y;
  return (
    <group>
      <Desk at={DESK} w={1.5} d={0.66} top={DESK_TOP} wood="#6e4c30" />
      <Chair at={[DESK[0], y, DESK[2] + 0.75]} yaw={Math.PI} />
      {/* open logbook + pen, radio, mug, oil lamp */}
      <group position={[DESK[0] - 0.15, y + DESK_TOP + 0.012, DESK[2] + 0.06]} rotation={[0, 0.08, 0]}>
        <mesh geometry={box(0.42, 0.016, 0.3, 0.004)} material={phys("logCover", { color: "#4a2c1e", roughness: 0.7 })} />
        <mesh geometry={box(0.4, 0.004, 0.28, 0)} material={phys("logPages", { color: "#ffffff", map: logTex(), roughness: 0.85 })} position={[0, 0.011, 0]} />
        <mesh geometry={cyl(0.004, 0.004, 0.14, 6)} material={phys("pen", { color: "#1d2b4a", roughness: 0.4 })} position={[0.12, 0.018, 0.05]} rotation={[Math.PI / 2, 0, 0.6]} />
      </group>
      <group position={[DESK[0] - 0.58, y + DESK_TOP, DESK[2] - 0.12]}>
        <mesh geometry={box(0.3, 0.2, 0.16, 0.02)} material={phys("radio", { color: "#5a4632", roughness: 0.6 })} position={[0, 0.1, 0]} castShadow />
        <mesh geometry={box(0.16, 0.06, 0.01, 0.004)} material={phys("dial", { color: "#1a2a1a", emissive: "#7aff9a", emissiveIntensity: 0.6, roughness: 0.3 })} position={[0.03, 0.13, 0.082]} />
        <mesh geometry={cyl(0.003, 0.003, 0.45, 6)} material={MAT.steel()} position={[-0.11, 0.42, 0]} rotation={[0, 0, 0.25]} />
      </group>
      <mesh geometry={cyl(0.04, 0.035, 0.09, 16)} material={MAT.plastic("#d9d2c2")} position={[DESK[0] + 0.15, y + DESK_TOP + 0.045, DESK[2] - 0.15]} castShadow />
      <OilLamp at={[DESK[0] + 0.5, y + DESK_TOP, DESK[2] - 0.05]} on={lamp * (0.94 + 0.06 * Math.sin(t * 13) * Math.sin(t * 7.3))} />
      <Bed at={BED_AT} yaw={Math.PI} L={1.9} W={0.92} blanket="#4a5a7a" />
      <Shelf at={[COTTAGE.x1 - COTTAGE.t, y + 1.55, 1.2]} yaw={-Math.PI / 2} w={1.2} />
      <WallClock at={[10.4, y + 2.05, COTTAGE.z1 - COTTAGE.t - 0.02]} yaw={Math.PI} time={2.3} />
      <mesh geometry={box(0.9, 0.62, 0.01, 0)} material={phys("chart", { color: "#ffffff", map: chartTex(), roughness: 0.8 })} position={[COTTAGE.x0 + COTTAGE.t + 0.01, y + 1.55, -1.3]} rotation={[0, Math.PI / 2, 0]} />
      {/* yellow raincoat on a hook by the door */}
      <mesh geometry={box(0.42, 0.95, 0.12, 0.05)} material={phys("raincoat", { color: "#d8a21e", roughness: 0.4, clearcoat: 0.6 })} position={[COTTAGE.x0 + COTTAGE.t + 0.08, y + 1.35, 1.55]} rotation={[0, Math.PI / 2, 0.04]} castShadow />
      <mesh geometry={box(1.6, 0.012, 1.0, 0.004)} material={MAT.fabric("rug", "#7a3a2a", "#c9a26a")} position={[9.3, y + 0.006, 0.4]} receiveShadow />
      <Dust min={[COTTAGE.x0 + 0.3, y + 0.2, COTTAGE.z0 + 0.3]} max={[COTTAGE.x1 - 0.3, y + 2.4, COTTAGE.z1 - 0.3]} n={200} t={t} i={0.25} size={0.008} color="#ffd9b0" />
    </group>
  );
};

// ── the boat and its lamps (the "light at sea") ─────────────────────────────

const Boat: React.FC<{ t: number; amp: number; seaLight: number; boat: number; fog: number; cam: Cam }> = ({ t, amp, seaLight, boat, fog, cam }) => {
  const hy = waveHeight(BOAT[0], BOAT[2], t, amp) * 0.85;
  const [sx, sz] = waveSlope(BOAT[0], BOAT[2], t, amp);
  const hull = phys("hull", { color: "#2c4a6a", roughness: 0.6 }), stripe = phys("hullStripe", { color: "#e6e0d0", roughness: 0.6 }), wood = MAT.wood("#5a4030");
  // blink: the lamps dip behind the swells now and then (their reflection on the water comes from the point light)
  const blink = 0.55 + 0.45 * Math.min(1, Math.max(0, 0.5 + 0.9 * (Math.sin(t * 1.25) + 0.6 * Math.sin(t * 0.71 + 1.0))));
  const on = Math.max(seaLight * blink, boat);
  const lampM = phys(`boatLamp${Math.round(on * 10)}`, { color: "#fff8e8", emissive: "#ffe4b0", emissiveIntensity: 8 * on, roughness: 0.2 });
  const dist = Math.hypot(cam.pos[0] - SEA_LIGHT[0], cam.pos[2] - SEA_LIGHT[2]);
  const far = Math.min(1, Math.max(0, (dist - 30) / 120));
  return (
    <group>
      <group position={[BOAT[0], hy, BOAT[2]]} rotation={[sz * 0.8, BOAT_YAW, -sx * 0.8]}>
        <mesh geometry={cached("boatHull", () => new IcosahedronGeometry(1, 3))} material={hull} scale={[1.15, 0.7, 5.0]} position={[0, 0.25, 0]} castShadow />
        <mesh geometry={box(1.7, 0.06, 7.6, 0.03)} material={wood} position={[0, 0.72, 0]} castShadow receiveShadow />
        <mesh geometry={box(2.2, 0.12, 0.12, 0.02)} material={stripe} position={[0, 0.62, 3.2]} />
        <mesh geometry={box(1.3, 0.85, 1.5, 0.05)} material={phys("cabin", { color: "#c9b48a", roughness: 0.7 })} position={[0, 1.18, 2.0]} castShadow />
        <mesh geometry={box(1.55, 0.06, 1.8, 0.02)} material={phys("cabinRoof", { color: "#3a5a7a", roughness: 0.6 })} position={[0, 1.64, 2.0]} rotation={[0.08, 0, 0]} castShadow />
        <mesh geometry={cyl(0.07, 0.09, 5.2, 8)} material={wood} position={[0, 2.95, -0.6]} castShadow />
        <mesh geometry={cyl(0.04, 0.04, 3.4, 6)} material={wood} position={[0, 4.2, -0.6]} rotation={[0, 0, Math.PI / 2]} />
        {[-1.5, -0.5, 0.5, 1.5].map((x) => <mesh key={x} geometry={sphere(0.14, 12, 8)} material={lampM} position={[x, 4.05, -0.6]} />)}
        {/* outriggers (cadik) */}
        {[1, -1].map((k) => (
          <group key={k}>
            <mesh geometry={cyl(0.12, 0.12, 8.5, 8)} material={wood} position={[k * 2.6, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} />
            {[-2.2, 2.2].map((z) => <mesh key={z} geometry={cyl(0.05, 0.05, 2.7, 6)} material={wood} position={[k * 1.35, 0.55, z]} rotation={[0, 0, Math.PI / 2 - k * 0.2]} />)}
          </group>
        ))}
      </group>
      {/* the light as seen from far away: glow + halo in fog + its streak on the water */}
      <Glow pos={[SEA_LIGHT[0], SEA_LIGHT[1] + hy, SEA_LIGHT[2]]} size={(3 + 4 * fog) * (0.4 + 0.6 * far)} color="#ffe8c4" i={on * (0.55 + 0.45 * far)} />
      <Glow pos={[SEA_LIGHT[0], SEA_LIGHT[1] + hy, SEA_LIGHT[2]]} size={(6 + 7 * fog) * far} color="#c8d8ff" i={on * fog * 0.14 * far} />
    </group>
  );
};

// ── the world ───────────────────────────────────────────────────────────────

const TIME_SKY: Record<string, { look: keyof typeof SKIES; dir: V3; dark: number; sea: string }> = {
  night: { look: "night", dir: MOON, dark: 1, sea: "#08141f" },
  dusk: { look: "dusk", dir: [0.6, 0.12, -0.78], dark: 0.6, sea: "#1a2232" },
  dawn: { look: "dawn", dir: SUN_DAWN, dark: 0.35, sea: "#1d3346" },
  day: { look: "day", dir: [0.4, 0.75, -0.5], dark: 0, sea: "#1d4258" },
};

export const CoastSet: React.FC<{ place: string; time: string; s: SetState; t: number; cam: Cam }> = ({ place, time, s, t, cam }) => {
  const T = TIME_SKY[time] ?? TIME_SKY.night;
  const inside = place === "cottage";
  const amp = s.waves ?? 1;
  return (
    <group>
      <SkyDome look={SKIES[T.look]} dir={T.dir} cam={cam.pos} t={t} />
      <Ocean t={t} amp={amp} color={T.sea} />
      <mesh geometry={terrainGeo()} material={terrainMat} receiveShadow castShadow />
      <Rocks />
      <Grass t={t} />
      <Fence />
      <Bench />
      <Lighthouse t={t} beam={s.beam ?? 1} dark={T.dark} cam={cam} />
      <Cottage s={s} dark={T.dark} inside={inside} t={t} />
      <Boat t={t} amp={amp} seaLight={(s.seaLight ?? 0) * (0.3 + 0.7 * T.dark)} boat={s.boat ?? 0} fog={s.fog ?? 0.3} cam={cam} />
      {place === "gallery" ? <Dust min={[-3, DECK_Y, -3]} max={[3, DECK_Y + 3, 3]} n={140} t={t} i={0.18} size={0.012} /> : null}
    </group>
  );
};
