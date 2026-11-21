// Renders a generated world (Built): rooms (floor, ceiling, walls with openings, wainscot, handrails),
// doors that open with their prop, windows, signs, terrain + paths, buildings, objects (compound or
// built-in, moved by the story when pushed/carried), scatter, light fixtures, sky and dust.

import React, { useMemo } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide } from "three";
import { box, cached, cyl, sphere } from "../kits/worldforge/geo.ts";
import { canvasTex, phys } from "../cine/mats.ts";
import { HoledWall, MAT, Slab, Window, type Hole } from "../cine/set/parts.tsx";
import { SKIES, SkyDome } from "../cine/env/Sky.tsx";
import { Dust, Glow } from "../cine/FX.tsx";
import type { Cam } from "../cine/types.ts";
import type { SetState } from "../worlds/types.ts";
import { fixtureLevel, TIMES, type Built, type Inst, type Opening } from "./build.ts";
import { Compound, matOf } from "./objects/Compound.tsx";
import { Builtin, BuiltinScatter } from "./objects/builtin.tsx";
import type { V3 } from "./spec.ts";

import type { Dyn } from "./dyn.ts";
import { Solid } from "../core/qa/scene-qa.tsx";
export type { Dyn };
const T = 0.15;

const signTex = (text: string, bg = "#1d4f8a", ink = "#ffffff") =>
  canvasTex(`sign${text}${bg}`, 512, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "middle";
    let s = 74; g.font = `700 ${s}px Manrope, sans-serif`;
    while (g.measureText(text).width > w * 0.88 && s > 20) { s -= 4; g.font = `700 ${s}px Manrope, sans-serif`; }
    g.fillText(text, w / 2, h / 2 + 4);
  });

const windowTex = (key: string, lit: number) =>
  canvasTex(`bwin${key}${lit}`, 256, 256, (g, w, h) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
    let seed = key.length * 7 + 3;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const on = r() < lit; g.fillStyle = on ? `rgba(255,${200 + r() * 40},${120 + r() * 60},1)` : "#20242c"; g.fillRect(x * 64 + 14, y * 64 + 12, 36, 40); }
  }, [1, 1]);

/** A door leaf (or two) in an opening, hinged at the jamb, opening `open` 0..1 into the room. */
const DoorLeaves: React.FC<{ o: Opening; open: number; color: string }> = ({ o, open, color }) => {
  const leafM = phys(`gdoor${color}`, { color, roughness: 0.45, clearcoat: 0.35 });
  const frameM = phys("gdoorframe", { color: "#d8dcdc", roughness: 0.5 });
  const rot = o.axis === "x" ? 0 : Math.PI / 2;
  // inward direction (into the room) in the opening's local frame (local +z)
  const into = o.wall === "north" || o.wall === "west" ? 1 : -1;
  const sw = (o.swing ?? 1) * into;
  const leaves = o.type === "double-door" ? [[-o.w / 2, 1], [o.w / 2, -1]] : [[-o.w / 2, 1]];
  const lw = o.type === "double-door" ? o.w / 2 : o.w;
  return (
    <group position={[o.x, o.y, o.z]} rotation={[0, rot, 0]}>
      <Slab min={[-o.w / 2 - 0.07, 0, -T / 2 - 0.02]} max={[-o.w / 2, o.h + 0.07, T / 2 + 0.02]} m={frameM} />
      <Slab min={[o.w / 2, 0, -T / 2 - 0.02]} max={[o.w / 2 + 0.07, o.h + 0.07, T / 2 + 0.02]} m={frameM} />
      <Slab min={[-o.w / 2 - 0.07, o.h, -T / 2 - 0.02]} max={[o.w / 2 + 0.07, o.h + 0.07, T / 2 + 0.02]} m={frameM} />
      {leaves.map(([hx, dir], i) => (
        <group key={i} position={[hx, 0, 0]} rotation={[0, -open * 1.6 * dir * sw, 0]}>
          <group position={[(dir * lw) / 2, 0, 0]}>
            <Slab min={[-lw / 2 + 0.005, 0.01, -0.022]} max={[lw / 2 - 0.005, o.h - 0.005, 0.022]} m={leafM} r={0.006} />
            {o.glass ? <mesh geometry={box(lw * 0.45, 0.42, 0.05, 0.004)} material={matOf("glass")} position={[0, 1.45, 0]} /> : null}
            {[1, -1].map((s) => <mesh key={s} geometry={box(0.12, 0.025, 0.025, 0.006)} material={matOf("chrome")} position={[(-dir * lw) / 2 + dir * 0.1, 1.02, s * 0.04]} castShadow />)}
          </group>
        </group>
      ))}
      {o.sign ? <mesh geometry={box(Math.min(1.4, o.w + 0.3), 0.28, 0.03, 0.006)} material={phys(`gsign${o.sign}`, { color: "#ffffff", map: signTex(o.sign), emissive: "#ffffff", emissiveMap: signTex(o.sign), emissiveIntensity: 0.35, roughness: 0.5 })} position={[0, o.h + 0.32, (into * (T / 2 + 0.03))]} /> : null}
    </group>
  );
};

const Room: React.FC<{ b: Built; ri: number; s: SetState }> = ({ b, ri, s }) => {
  const r = b.rooms[ri];
  const [x0, z0, x1, z1] = r.rect;
  const wallM = matOf(r.walls ?? "paint:#dfe3e0");
  const dado = r.wainscot ? phys(`gdado${r.wainscot}`, { color: r.wainscot, roughness: 0.5, clearcoat: 0.2 }) : null;
  const sides: { side: "north" | "south" | "west" | "east"; axis: "x" | "z"; c: number; a0: number; a1: number }[] = [
    { side: "north", axis: "x", c: z0 - T / 2, a0: x0 - T, a1: x1 + T },
    { side: "south", axis: "x", c: z1 + T / 2, a0: x0 - T, a1: x1 + T },
    { side: "west", axis: "z", c: x0 - T / 2, a0: z0, a1: z1 },
    { side: "east", axis: "z", c: x1 + T / 2, a0: z0, a1: z1 },
  ];
  // a wall shared with an earlier room (same line, fully covered) is built once
  const covered = (axis: "x" | "z", c: number, a0: number, a1: number) =>
    b.rooms.slice(0, ri).some((q) => {
      const [qx0, qz0, qx1, qz1] = q.rect;
      if (axis === "x") return (Math.abs(qz0 - T / 2 - c) < T * 1.5 || Math.abs(qz1 + T / 2 - c) < T * 1.5) && qx0 - T <= a0 + 0.01 && qx1 + T >= a1 - 0.01;
      return (Math.abs(qx0 - T / 2 - c) < T * 1.5 || Math.abs(qx1 + T / 2 - c) < T * 1.5) && qz0 <= a0 + 0.01 && qz1 >= a1 - 0.01;
    });
  return (
    <group>
      {/* floors of neighbouring rooms overlap under the shared wall: a hair of height per room so they never flicker */}
      <Slab min={[x0 - T, r.y - 0.12, z0 - T]} max={[x1 + T, r.y + 0.0015 * (ri % 4), z1 + T]} m={matOf(r.floor ?? "vinyl:#d6dcd8")} cast={false} />
      {r.ceiling !== "none" ? <Slab min={[x0 - T, r.y + r.height, z0 - T]} max={[x1 + T, r.y + r.height + 0.1, z1 + T]} m={matOf(r.ceiling ?? "paint:#eceeed")} /> : null}
      {sides.map((w) => {
        if (r.open?.includes(w.side) || covered(w.axis, w.c, w.a0, w.a1)) return null;
        const holes: Hole[] = b.openings.filter((o) => o.axis === w.axis && Math.abs(o.wallC + (w.side === "north" || w.side === "west" ? -T / 2 : T / 2) - w.c) < T * 1.6 && (w.axis === "x" ? o.x : o.z) > w.a0 && (w.axis === "x" ? o.x : o.z) < w.a1)
          .map((o) => { const a = w.axis === "x" ? o.x : o.z; return { a0: a - o.w / 2, a1: a + o.w / 2, y0: o.sill, y1: o.sill + o.h }; });
        return <HoledWall key={w.side} axis={w.axis} c={w.c} a0={w.a0} a1={w.a1} holes={holes} t={T} y0={r.y} top={r.height} m={wallM} dado={dado} />;
      })}
      {r.handrail ? sides.map((w) => (r.open?.includes(w.side) ? null : (
        <mesh key={`hr${w.side}`} geometry={cyl(0.025, 0.025, +(w.a1 - w.a0 - 2 * T).toFixed(3), 10)} material={phys(`ghr${r.handrail}`, { color: r.handrail!, roughness: 0.4, clearcoat: 0.4 })}
          position={w.axis === "x" ? [(w.a0 + w.a1) / 2, r.y + 0.9, w.c + (w.side === "north" ? T / 2 + 0.07 : -T / 2 - 0.07)] : [w.c + (w.side === "west" ? T / 2 + 0.07 : -T / 2 - 0.07), r.y + 0.9, (w.a0 + w.a1) / 2]}
          rotation={w.axis === "x" ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]} castShadow />
      ))) : null}
      {void s}
    </group>
  );
};

const Ground: React.FC<{ b: Built }> = ({ b }) => {
  const g = b.spec.ground!;
  const geo = useMemo(() => cached(`gground${b.spec.id}`, () => {
    const n = Math.min(220, Math.round(g.size / 0.8)), half = g.size / 2;
    const pos = new Float32Array((n + 1) * (n + 1) * 3), uv = new Float32Array((n + 1) * (n + 1) * 2);
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const x = -half + (g.size * i) / n, z = -half + (g.size * j) / n, k = j * (n + 1) + i;
      pos[k * 3] = x; pos[k * 3 + 1] = b.ground!(x, z); pos[k * 3 + 2] = z;
      uv[k * 2] = x / 6; uv[k * 2 + 1] = z / 6;
    }
    const idx: number[] = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, c = a + n + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
    const geom = new BufferGeometry();
    geom.setAttribute("position", new BufferAttribute(pos, 3));
    geom.setAttribute("uv", new BufferAttribute(uv, 2));
    geom.setIndex(idx);
    geom.computeVertexNormals();
    return geom;
  }), [b, g]);
  const m = matOf(g.material ?? "grass");
  const mm = m as unknown as { map?: { repeat: { set: (a: number, b: number) => void } } };
  if (mm.map) mm.map.repeat.set(1, 1);
  return <mesh geometry={geo} material={m} receiveShadow />;
};

const Paths: React.FC<{ b: Built }> = ({ b }) => {
  const geos = useMemo(() => (b.spec.paths ?? []).map((p, pi) => cached(`gpath${b.spec.id}${pi}`, () => {
    const w = (p.width ?? 1.2) / 2, pts = p.points;
    // densify
    const dense: [number, number][] = [];
    for (let i = 1; i < pts.length; i++) { const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / 0.5)); for (let k = 0; k < n; k++) dense.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]); }
    dense.push(pts[pts.length - 1]);
    const pos: number[] = [], idx: number[] = [], uv: number[] = [];
    dense.forEach(([x, z], i) => {
      const [nx, nz] = dense[Math.min(dense.length - 1, i + 1)], [px, pz] = dense[Math.max(0, i - 1)];
      const dx = nx - px, dz = nz - pz, L = Math.hypot(dx, dz) || 1, ox = -dz / L, oz = dx / L;
      const wob = w * (1 + 0.15 * Math.sin(i * 0.9));
      for (const s of [-1, 1]) { const X = x + ox * wob * s, Z = z + oz * wob * s; pos.push(X, (b.ground ? b.ground(X, Z) : b.nav.floor(X, Z)) + 0.025, Z); uv.push((s + 1) / 2, i * 0.3); }
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    });
    const geom = new BufferGeometry();
    geom.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    geom.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
    geom.setIndex(idx);
    geom.computeVertexNormals();
    return geom;
  })), [b]);
  return <group>{geos.map((g, i) => <mesh key={i} geometry={g} material={matOf(b.spec.paths![i].material ?? "dirt")} receiveShadow />)}</group>;
};

const Buildings: React.FC<{ b: Built; dark: number }> = ({ b, dark }) => (
  <group>
    {(b.spec.buildings ?? []).map((bd, i) => {
      const [x0, z0, x1, z1] = bd.rect, y = bd.y ?? 0, w = x1 - x0;
      const winM = phys(`gbwin${i}${Math.round(dark * 4)}`, { color: "#ffffff", map: windowTex(`${i}`, dark > 0.5 ? 0.35 : 0), emissive: "#ffffff", emissiveMap: windowTex(`${i}`, dark > 0.5 ? 0.35 : 0), emissiveIntensity: dark > 0.5 ? 1.4 : 0, roughness: 0.5 });
      return (
        <group key={i}>
          <Slab min={[x0, y, z0]} max={[x1, y + bd.height, z1]} m={matOf(`paint:${bd.color ?? "#cfc6b8"}`)} />
          <Slab min={[x0 - 0.2, y + bd.height, z0 - 0.2]} max={[x1 + 0.2, y + bd.height + 0.25, z1 + 0.2]} m={matOf(bd.roof ?? "#7a4a36")} />
          {bd.windows !== false ? [z0 - 0.01, z1 + 0.01].map((z, k) => <mesh key={k} geometry={cached(`gbw${w},${bd.height}`, () => { const g = new BufferGeometry(); const hw = w * 0.42, hh = bd.height * 0.36; g.setAttribute("position", new BufferAttribute(new Float32Array([-hw, -hh, 0, hw, -hh, 0, hw, hh, 0, -hw, hh, 0]), 3)); g.setAttribute("uv", new BufferAttribute(new Float32Array([0, 0, Math.max(1, w / 3), 0, Math.max(1, w / 3), Math.max(1, bd.height / 3), 0, Math.max(1, bd.height / 3)]), 2)); g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; })} material={winM} position={[(x0 + x1) / 2, y + bd.height * 0.55, z]} rotation={[0, k ? 0 : Math.PI, 0]} />) : null}
          {bd.sign ? <mesh geometry={box(Math.min(w * 0.8, 4), 0.6, 0.06, 0.01)} material={phys(`gbsign${bd.sign}`, { color: "#ffffff", map: signTex(bd.sign, "#b0302a"), emissive: "#ffffff", emissiveMap: signTex(bd.sign, "#b0302a"), emissiveIntensity: dark > 0.5 ? 0.9 : 0.1 })} position={[(x0 + x1) / 2, y + Math.min(3.4, bd.height - 0.5), z1 + 0.08]} /> : null}
        </group>
      );
    })}
  </group>
);

const Fixture: React.FC<{ f: Built["fixtures"][number]; lv: number; cam: Cam; dark: number }> = ({ f, lv, cam, dark }) => {
  const k = Math.max(0, lv);
  const em = (c: string, i: number) => phys(`gfx${c}${Math.round(i * 20)}`, { color: "#ffffff", emissive: c, emissiveIntensity: i, roughness: 0.4 });
  const dist = Math.hypot(cam.pos[0] - f.at[0], cam.pos[1] - f.at[1], cam.pos[2] - f.at[2]);
  const glowK = Math.min(1, Math.max(0, (dist - 2) / 8));
  switch (f.type) {
    case "panel": return <mesh geometry={box(0.6, 0.05, 1.2, 0.01)} material={em(f.color ?? "#eef4ff", 0.3 + 1.6 * k)} position={f.at} />;
    case "tube": return <group position={f.at}><mesh geometry={box(0.12, 0.05, 1.24, 0.01)} material={MAT.plastic("#e6e6e1")} /><mesh geometry={cyl(0.015, 0.015, 1.18, 10)} material={em("#eaf4ff", 0.2 + 1.3 * k)} position={[0, -0.035, 0]} rotation={[Math.PI / 2, 0, 0]} /></group>;
    case "bulb": return <group position={f.at}><mesh geometry={cyl(0.004, 0.004, 0.4, 5)} material={MAT.steel()} position={[0, 0.22, 0]} /><mesh geometry={sphere(0.05, 14, 10)} material={em(f.color ?? "#ffcf8a", 0.4 + 2.5 * k)} /><Glow pos={[0, 0, 0]} size={0.9 * glowK + 0.2} color={f.color ?? "#ffcf8a"} i={0.35 * k * dark} /></group>;
    case "lamp-post": return (
      <group position={[f.at[0], f.at[1] - 4.2, f.at[2]]}>
        <mesh geometry={cyl(0.06, 0.09, 4.4, 10)} material={MAT.steel()} position={[0, 2.2, 0]} castShadow />
        <mesh geometry={box(0.5, 0.12, 0.25, 0.03)} material={MAT.steel()} position={[0.2, 4.4, 0]} />
        <mesh geometry={box(0.36, 0.04, 0.18, 0.01)} material={em(f.color ?? "#ffb05c", 0.3 + 2.4 * k)} position={[0.2, 4.33, 0]} />
        <Glow pos={[0.2, 4.2, 0]} size={2.6 * glowK + 0.3} color={f.color ?? "#ffb05c"} i={0.4 * k * dark} />
      </group>
    );
    case "string": {
      const to = f.to ?? f.at, n = Math.max(4, Math.round(Math.hypot(to[0] - f.at[0], to[2] - f.at[2]) / 0.6));
      return <group>{Array.from({ length: n + 1 }, (_, i) => { const u = i / n, sag = Math.sin(u * Math.PI) * 0.35; const p: V3 = [f.at[0] + (to[0] - f.at[0]) * u, f.at[1] + (to[1] - f.at[1]) * u - sag, f.at[2] + (to[2] - f.at[2]) * u]; return <group key={i} position={p}><mesh geometry={sphere(0.035, 10, 8)} material={em(f.color ?? "#ffd08a", 0.5 + 2.5 * k)} /><Glow pos={[0, 0, 0]} size={0.5 * glowK + 0.1} color={f.color ?? "#ffd08a"} i={0.3 * k * dark} /></group>; })}</group>;
    }
    case "exit-sign": return <mesh geometry={box(0.4, 0.16, 0.05, 0.01)} material={phys(`gexit${Math.round(k * 10)}`, { color: "#ffffff", map: signTex("KELUAR", "#0e9a52"), emissive: "#ffffff", emissiveMap: signTex("KELUAR", "#0e9a52"), emissiveIntensity: 0.4 + 1.2 * k })} position={f.at} />;
    case "lantern": return <group position={f.at}><mesh geometry={cyl(0.07, 0.08, 0.18, 12)} material={em("#ffb45e", 0.4 + 2.4 * k)} /><Glow pos={[0, 0, 0]} size={1.2 * glowK + 0.3} color="#ffb45e" i={0.4 * k} /></group>;
    // the fire's glow shrinks near the lens like the bulb's and lantern's (full size it filled the frame as a blur)
    case "fire": return <group position={f.at}><mesh geometry={cyl(0.03, 0.05, 0.5, 6)} material={matOf("bark")} rotation={[0, 0, 1.2]} /><mesh geometry={cyl(0.03, 0.05, 0.5, 6)} material={matOf("bark")} rotation={[0, 1.6, 1.2]} /><Glow pos={[0, 0.25, 0]} size={0.5 + 0.9 * Math.min(1, Math.max(0, (dist - 1.5) / 4.5))} color="#ff8a3a" i={0.7 * k} /></group>;
    case "screen": return <mesh geometry={box(0.5, 0.32, 0.03, 0.005)} material={em(f.color ?? "#8fb8ff", 0.3 + 1.2 * k)} position={f.at} />;
    case "spot": return <mesh geometry={cyl(0.08, 0.12, 0.2, 12)} material={MAT.steel()} position={f.at} />;
  }
  return null;
};

const ObjectAt: React.FC<{ inst: Inst; b: Built; s: SetState; dyn?: Dyn[string] }> = ({ inst, b, s, dyn }) => {
  if (dyn?.hidden || (s[`${inst.id}.visible`] ?? inst.states.visible ?? 1) < 0.5) return null;
  const pos = dyn?.pos ?? inst.pos, yaw = dyn?.yaw ?? inst.yaw;
  const states: Record<string, number> = { ...inst.states };
  for (const k of Object.keys(states)) if (s[`${inst.id}.${k}`] !== undefined) states[k] = s[`${inst.id}.${k}`];
  return (
    // tagged for the scene QA: people may touch / sit on it (touch "*"), nobody may walk through it
    <Solid id={inst.id} kind={dyn ? "prop" : "set"} touch={["*"]} position={pos} rotation={[0, yaw, 0]} scale={inst.scale}>
      {inst.info.builtin ? <Builtin id={inst.use} color={inst.color} /> : <Compound spec={b.objects[inst.use]} states={states} />}
    </Solid>
  );
};

export const GenSet: React.FC<{ b: Built; place: string; time: string; s: SetState; t: number; cam: Cam; dyn: Dyn; area?: [number, number, number, number] }> = ({ b, time, s, t, cam, dyn, area }) => {
  const Tl = TIMES[time] ?? TIMES.night;
  const skyLook = SKIES[time] ?? SKIES.night;
  return (
    <group>
      <SkyDome look={skyLook} dir={b.spec.sky?.sun ?? Tl.dir} cam={cam.pos} t={t} />
      {b.spec.ground ? <Ground b={b} /> : null}
      <Paths b={b} />
      {b.rooms.map((_, i) => <Room key={i} b={b} ri={i} s={s} />)}
      {b.openings.map((o) => (o.type === "window" ? (
        <Window key={o.id} at={[o.x, o.y + o.sill, o.z]} axis={o.axis} w={o.w} h={o.h} />
      ) : o.type === "arch" ? null : (
        <DoorLeaves key={o.id} o={o} open={s[o.id] ?? 0} color={o.glass ? "#e9ecea" : "#c9d6d2"} />
      )))}
      <Buildings b={b} dark={Tl.dark} />
      {b.insts.map((i) => <ObjectAt key={i.id} inst={i} b={b} s={s} dyn={dyn[i.id]} />)}
      {b.scatter.map((sc, i) => (sc.info.builtin ? <BuiltinScatter key={i} id={sc.use} items={sc.items} seed={i} /> : (
        <group key={i}>{sc.items.map((it, k) => <group key={k} position={it.pos} rotation={[0, it.yaw, 0]} scale={it.scale}><Compound spec={b.objects[sc.use]} /></group>)}</group>
      )))}
      {b.fixtures.map((f) => <Fixture key={f.id} f={f} lv={fixtureLevel(f, s, t)} cam={cam} dark={Tl.dark} />)}
      {area ? <Dust min={[area[0], 0.2, area[1]]} max={[area[2], 2.6, area[3]]} n={220} t={t} i={0.22} size={0.01} /> : null}
      {void DoubleSide}
    </group>
  );
};
