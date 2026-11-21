// Renders a compound object (ObjectSpec): primitives + materials from the JSON, the same part expansion
// (repeat/mirror) the builder used for bounds. Materials are cached by their spec; text signs are canvas
// textures; piles are instanced spheres.

import React, { useMemo } from "react";
import { Color, DoubleSide, InstancedMesh, Matrix4, type Material, Quaternion, SphereGeometry, Vector3 } from "three";
import { box, cached, cyl, lathe, sphere, torus } from "../../kits/worldforge/geo.ts";
import { canvasTex, phys, plankTex, tileTex, weaveTex } from "../../cine/mats.ts";
import { plasterTex, concreteTex } from "../../cine/set/tex.ts";
import { CapsuleGeometry, ConeGeometry, PlaneGeometry } from "three";
import { expandParts } from "../build.ts";
import type { MatSpec, ObjectSpec, PartSpec, V3 } from "../spec.ts";

const deg = Math.PI / 180;
const noiseTex = (key: string, color: string) =>
  canvasTex(`noise${key}`, 256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + r() * 0.06})`; g.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5); }
  }, [3, 3]);

// a light-coloured screen / sign at full glow burns white over a close shot (and blooms over its frame): the glow
// is capped by the colour's brightness so a pale screen tops out just under white; saturated colours keep theirs
const glow = (hex: string, i: number) => { const c = new Color(hex); return Math.min(i, 1.05 / Math.max(0.3, 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b)); };

/** Material from a spec string ("steel", "paint:#cfe", "fabric:#a33", …) or object. */
export const matOf = (m: MatSpec | undefined, fallback = "#b0b0b0"): Material => {
  if (!m) return phys(`gm${fallback}`, { color: fallback, roughness: 0.7 });
  if (typeof m === "object") {
    const key = `gmo${JSON.stringify(m)}`;
    const tex = m.texture === "weave" ? weaveTex(key, m.color ?? fallback, [4, 4]) : m.texture === "planks" ? plankTex([2, 2]) : m.texture === "tiles" ? tileTex([2, 2]) : m.texture === "noise" ? noiseTex(key, m.color ?? fallback) : undefined;
    return phys(key, {
      color: tex && m.texture !== "planks" && m.texture !== "tiles" ? "#ffffff" : m.color ?? fallback, map: tex, roughness: m.roughness ?? 0.6, metalness: m.metal ?? 0,
      emissive: m.emissive ?? "#000000", emissiveIntensity: m.emissive ? glow(m.emissive, m.glow ?? 1.5) : 0, transparent: m.opacity !== undefined && m.opacity < 1, opacity: m.opacity ?? 1, depthWrite: !(m.opacity !== undefined && m.opacity < 0.9), side: m.opacity !== undefined ? DoubleSide : undefined,
    });
  }
  const [name, arg] = m.split(":");
  const c = arg ?? fallback;
  switch (name) {
    case "wood": return phys("gwood", { color: arg ?? "#8a6440", roughness: 0.62, clearcoat: 0.1 });
    case "darkwood": return phys("gdwood", { color: "#4a3020", roughness: 0.6, clearcoat: 0.1 });
    case "steel": return phys("gsteel", { color: "#8d939a", metalness: 0.8, roughness: 0.38 });
    case "chrome": return phys("gchrome", { color: "#d4d8de", metalness: 1, roughness: 0.18 });
    case "aluminium": return phys("galu", { color: "#bcc2ca", metalness: 0.85, roughness: 0.32 });
    case "rubber": return phys("grubber", { color: "#1b1b1d", roughness: 0.92 });
    case "glass": return phys("gglass", { color: "#bfd3e6", roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false, side: DoubleSide });
    case "ceramic": return phys(`gcer${c}`, { color: arg ?? "#f1f1ec", roughness: 0.22, clearcoat: 0.6 });
    case "paper": return phys(`gpaper${c}`, { color: arg ?? "#f3efe4", roughness: 0.9 });
    case "bark": return phys("gbark", { color: "#4a3a2c", roughness: 0.95, map: noiseTex("bark", "#4a3a2c") });
    case "stone": return phys(`gstone${c}`, { color: "#ffffff", map: noiseTex(`stone${c}`, arg ?? "#7a7670"), roughness: 0.95 });
    case "plastic": return phys(`gplastic${c}`, { color: c, roughness: 0.42, clearcoat: 0.25 });
    case "paint": return phys(`gpaint${c}`, { color: c, roughness: 0.85, map: plasterTex("gp", [1, 1], 0.1) });
    case "fabric": case "cloth": return phys(`gfab${c}`, { color: "#ffffff", map: weaveTex(`gfab${c}`, c, [4, 4]), roughness: 0.9, sheen: 0.4, sheenColor: "#ffffff" });
    case "leaf": return phys(`gleaf${c}`, { color: c, roughness: 0.75, sheen: 0.3, sheenColor: "#c8ffb0", side: DoubleSide });
    case "metal": return phys(`gmetal${c}`, { color: c, metalness: 0.7, roughness: 0.4 });
    case "emissive": return phys(`gemis${c}`, { color: "#000000", emissive: c, emissiveIntensity: glow(c, 2.2), roughness: 0.4 });
    // floors stay satin: glossier ones mirror the ceiling lights into a white pool across the floor
    case "vinyl": return phys(`gvinyl${c}`, { color: c, map: tileTex([1, 1]), roughness: 0.55, clearcoat: 0.06 });
    case "tiles": return phys(`gtiles${c}`, { color: c, map: tileTex([1, 1]), roughness: 0.5, clearcoat: 0.08 });
    case "planks": return phys(`gplanks${c}`, { color: arg ?? "#ffffff", map: plankTex([1, 1]), roughness: 0.7 });
    case "concrete": return phys(`gconc${c}`, { color: arg ?? "#ffffff", map: concreteTex([1, 1]), roughness: 0.95 });
    case "asphalt": return phys("gasph", { color: "#ffffff", map: noiseTex("asph", "#3a3b3e"), roughness: 0.9 });
    case "dirt": return phys(`gdirt${c}`, { color: "#ffffff", map: noiseTex(`dirt${c}`, arg ?? "#6b5640"), roughness: 0.95 });
    case "grass": return phys(`ggrass${c}`, { color: "#ffffff", map: noiseTex(`grass${c}`, arg ?? "#4a5a30"), roughness: 0.95 });
    default: return phys(`gm${m}`, { color: name.startsWith("#") ? name : fallback, roughness: 0.7 });
  }
};

const textTex = (text: string, ink: string, bg: string, w: number, h: number) =>
  canvasTex(`txt${text}${ink}${bg}${w}${h}`, 512, Math.max(64, Math.round((512 * h) / w)), (g, W, H) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = ink; g.textAlign = "center"; g.textBaseline = "middle";
    let size = H * 0.62;
    g.font = `700 ${size}px Manrope, sans-serif`;
    while (g.measureText(text).width > W * 0.9 && size > 10) { size *= 0.9; g.font = `700 ${size}px Manrope, sans-serif`; }
    g.fillText(text, W / 2, H / 2);
  });

const Pile: React.FC<{ p: PartSpec }> = ({ p }) => {
  const mesh = useMemo(() => {
    const [w, h, d] = (p.size ?? [0.4, 0.15, 0.3]) as number[];
    const n = p.count ?? 20, r = p.r ?? 0.035, cols = p.colors ?? ["#c0392b"];
    let seed = (p.seed ?? 3) * 7919 + 13;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const m = new InstancedMesh(cached(`pileS${r}`, () => new SphereGeometry(r, 12, 9)), phys("pileMat", { color: "#ffffff", roughness: 0.45, clearcoat: 0.3 }), n);
    const M = new Matrix4(), q = new Quaternion(), c = new Color();
    for (let i = 0; i < n; i++) {
      // a heap: more items low and in the middle
      const u = rnd() * 2 - 1, v = rnd() * 2 - 1, k = 1 - Math.max(Math.abs(u), Math.abs(v)) * 0.6;
      const y = r + rnd() * Math.max(0, h - 2 * r) * k;
      M.compose(new Vector3((u * (w / 2 - r)), y, (v * (d / 2 - r))), q.setFromAxisAngle(new Vector3(0, 1, 0), rnd() * 6), new Vector3(1 + (rnd() - 0.5) * 0.25, 0.9 + rnd() * 0.2, 1 + (rnd() - 0.5) * 0.25));
      m.setMatrixAt(i, M);
      m.setColorAt(i, c.set(cols[Math.floor(rnd() * cols.length)]).offsetHSL(0, 0, (rnd() - 0.5) * 0.08));
    }
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }, [p]);
  return <primitive object={mesh} position={[0, -(p.size?.[1] ?? 0.15) / 2, 0]} />;
};

const Part: React.FC<{ p: PartSpec; states: Record<string, number> }> = ({ p, states }) => {
  if (p.when && (states[p.when] ?? 0) < 0.5) return null;
  let mat = matOf(p.mat);
  if (p.glowState) {
    const k = states[p.glowState] ?? 0;
    const base = typeof p.mat === "string" && p.mat.startsWith("emissive:") ? p.mat.split(":")[1] : (typeof p.mat === "object" ? p.mat.emissive : undefined) ?? "#ffd9a0";
    mat = phys(`glow${base}${Math.round(k * 20)}`, { color: "#111111", emissive: base, emissiveIntensity: 0.05 + glow(base, 2.4) * k, roughness: 0.4 });
  }
  const cast = p.castShadow !== false;
  const rot: V3 = [(p.rot?.[0] ?? 0) * deg, (p.rot?.[1] ?? 0) * deg, (p.rot?.[2] ?? 0) * deg];
  const sc = p.scale ?? [1, 1, 1];
  const at = p.at ?? [0, 0, 0];
  switch (p.shape) {
    case "box": { const s = p.size ?? [0.1, 0.1, 0.1]; return <mesh geometry={box(s[0], s[1], s[2], p.round ?? Math.min(0.01, Math.min(s[0], s[1], s[2]) * 0.2), 2)} material={mat} position={at} rotation={rot} scale={sc} castShadow={cast} receiveShadow />; }
    case "cyl": return <mesh geometry={cyl(p.r ?? 0.05, p.r2 ?? p.r ?? 0.05, p.h ?? 0.1, 24)} material={mat} position={at} rotation={rot} scale={sc} castShadow={cast} receiveShadow />;
    case "cone": return <mesh geometry={cached(`gcone${p.r},${p.h}`, () => new ConeGeometry(p.r ?? 0.05, p.h ?? 0.1, 24))} material={mat} position={at} rotation={rot} scale={sc} castShadow={cast} receiveShadow />;
    case "sphere": return <mesh geometry={sphere(p.r ?? 0.05, 24, 16)} material={mat} position={at} rotation={rot} scale={sc} castShadow={cast} receiveShadow />;
    case "torus": return <mesh geometry={torus(p.R ?? 0.2, p.r ?? 0.02, 10, 40, p.arc ?? Math.PI * 2)} material={mat} position={at} rotation={rot} scale={sc} castShadow={cast} />;
    case "capsule": return <mesh geometry={cached(`gcap${p.r},${p.h}`, () => new CapsuleGeometry(p.r ?? 0.05, p.h ?? 0.1, 6, 14))} material={mat} position={at} rotation={rot} scale={sc} castShadow={cast} receiveShadow />;
    case "lathe": return <mesh geometry={lathe(JSON.stringify(p.profile), (p.profile ?? [[0.1, 0], [0.1, 0.1]]) as [number, number][], 40)} material={mat} position={at} rotation={rot} scale={sc} castShadow={cast} receiveShadow />;
    case "plane": { const s = p.size ?? [0.5, 0.3]; return <mesh geometry={cached(`gpl${s}`, () => new PlaneGeometry(s[0], s[1]))} material={mat} position={at} rotation={rot} scale={sc} receiveShadow />; }
    case "text": {
      const s = p.size ?? [0.6, 0.2];
      const tm = phys(`gtext${p.text}${p.ink}${p.bg}`, { color: "#ffffff", map: textTex(p.text ?? "", p.ink ?? "#111111", p.bg ?? "#ffffff", s[0], s[1]), roughness: 0.6, emissive: "#ffffff", emissiveMap: textTex(p.text ?? "", p.ink ?? "#111111", p.bg ?? "#ffffff", s[0], s[1]), emissiveIntensity: p.glowState ? (states[p.glowState] ?? 0) * 0.8 : 0 });
      return <mesh geometry={cached(`gpl${s}`, () => new PlaneGeometry(s[0], s[1]))} material={tm} position={at} rotation={rot} scale={sc} />;
    }
    case "rod": {
      const a = new Vector3(...(p.from ?? [0, 0, 0])), b = new Vector3(...(p.to ?? [0, 1, 0]));
      const d = b.clone().sub(a), L = d.length();
      const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.clone().normalize());
      return <mesh geometry={cyl(p.r ?? 0.015, p.r ?? 0.015, +L.toFixed(4), 12)} material={mat} position={a.add(b).multiplyScalar(0.5).toArray() as V3} quaternion={q} castShadow={cast} />;
    }
    case "pile": return <group position={at} rotation={rot}><Pile p={p} /></group>;
  }
  return null;
};

export const Compound: React.FC<{ spec: ObjectSpec; states?: Record<string, number> }> = ({ spec, states = {} }) => {
  const parts = useMemo(() => expandParts(spec.parts), [spec]);
  return <group>{parts.map((p, i) => <Part key={i} p={p} states={{ ...(spec.states ?? {}), ...states }} />)}</group>;
};
