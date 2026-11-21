// Atmosphere: fake volumetric light shafts (additive prisms from an opening along a light direction)
// and floating dust motes. Both live on FX_LAYER only, so GTAO/DOF never see them (large transparent
// volumes on the default layer corrupt those passes and can blank a frame).

import React, { useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, ConeGeometry, DoubleSide, type Object3D, ShaderMaterial, Vector3 } from "three";
import { FX_LAYER } from "../core/render/Post.tsx";
import { mulberry32 } from "../kits/worldforge/noise.ts";
import type { V3 } from "./Lights.tsx";

const fxLayer = (o: Object3D | null) => {
  if (o) o.layers.set(FX_LAYER);
};

const shaftGeo = (corners: V3[], dir: V3, len: number, spread: number) => {
  const d = new Vector3(...dir).normalize();
  const c0 = corners.map((c) => new Vector3(...c));
  const ctr = c0.reduce((a, b) => a.add(b.clone()), new Vector3()).multiplyScalar(1 / c0.length);
  const c1 = c0.map((c) => c.clone().sub(ctr).multiplyScalar(1 + spread).add(ctr).addScaledVector(d, len));
  const pos: number[] = [], uv: number[] = [];
  for (let i = 0; i < 4; i++) {
    const a0 = c0[i], b0 = c0[(i + 1) % 4], a1 = c1[i], b1 = c1[(i + 1) % 4];
    pos.push(...a0.toArray(), ...b0.toArray(), ...b1.toArray(), ...a0.toArray(), ...b1.toArray(), ...a1.toArray());
    uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  return g;
};

const shaftMat = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: false,
    uniforms: { uColor: { value: new Color("#9fb8ff") }, uI: { value: 0.1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uI; varying vec2 vUv;
      void main(){
        float edge = pow(sin(3.14159 * clamp(vUv.x, 0.0, 1.0)), 1.6);
        float along = smoothstep(0.0, 0.08, vUv.y) * pow(1.0 - clamp(vUv.y, 0.0, 1.0), 1.4);
        float a = clamp(edge * along * uI, 0.0, 1.0);
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
  });

/** A light shaft from an opening (4 corners, in order around the rectangle) along `dir`. */
export const Shaft: React.FC<{ corners: V3[]; dir: V3; len: number; spread?: number; color: string; i: number }> = ({ corners, dir, len, spread = 0.15, color, i }) => {
  const key = JSON.stringify([corners, dir, len, spread]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(() => shaftGeo(corners, dir, len, spread), [key]);
  const mat = useMemo(() => shaftMat(), []);
  mat.uniforms.uColor.value.set(color);
  mat.uniforms.uI.value = i;
  return <mesh ref={fxLayer} geometry={geo} material={mat} visible={i > 0.001} renderOrder={5} />;
};

let dotTex: CanvasTexture | null = null;
const dot = () => {
  if (dotTex) return dotTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.35, "rgba(255,255,255,0.45)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  dotTex = new CanvasTexture(c);
  return dotTex;
};

/** Dust motes drifting inside a box (deterministic in t). */
export const Dust: React.FC<{ min: V3; max: V3; n?: number; t: number; color?: string; i?: number; size?: number; seed?: number }> = ({ min, max, n = 220, t, color = "#c8d6ff", i = 0.5, size = 0.012, seed = 3 }) => {
  const base = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: n }, () => [r(), r(), r(), r() * 6.28, 0.3 + r() * 0.7] as const);
  }, [n, seed]);
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  }, [n]);
  const a = geo.attributes.position as BufferAttribute;
  base.forEach(([u, v, w, ph, sp], k) => {
    const x = min[0] + (max[0] - min[0]) * ((u + 0.03 * Math.sin(t * 0.21 * sp + ph)) % 1);
    const y = min[1] + (max[1] - min[1]) * ((((v - 0.012 * t * sp) % 1) + 1) % 1);
    const z = min[2] + (max[2] - min[2]) * ((w + 0.03 * Math.cos(t * 0.17 * sp + ph * 1.3)) % 1);
    a.setXYZ(k, x, y, z);
  });
  a.needsUpdate = true;
  geo.computeBoundingSphere();
  return (
    <points ref={fxLayer} geometry={geo} renderOrder={6}>
      <pointsMaterial map={dot()} color={color} size={size} sizeAttenuation transparent opacity={i} depthWrite={false} blending={AdditiveBlending} fog={false} />
    </points>
  );
};

export { fxLayer };

/** Soft additive glow (camera-facing) — lamps, distant lights, halos in fog. Size in metres. */
export const Glow: React.FC<{ pos: V3; size: number; color: string; i: number; stretch?: number }> = ({ pos, size, color, i, stretch = 1 }) => (
  <sprite ref={fxLayer} position={pos} scale={[size, size * stretch, 1]} renderOrder={7} visible={i > 0.002}>
    <spriteMaterial map={dot()} color={color} opacity={Math.min(1, i)} transparent depthWrite={false} blending={AdditiveBlending} fog={false} />
  </sprite>
);

const beamMat = () =>
  new ShaderMaterial({
    transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide, fog: false,
    uniforms: { uColor: { value: new Color("#fff2d8") }, uI: { value: 0.1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `uniform vec3 uColor; uniform float uI; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float along = pow(clamp(vUv.y, 0.0, 1.0), 2.2) * smoothstep(1.0, 0.95, vUv.y);
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.5);
        float a = clamp(along * edge * uI, 0.0, 1.0);
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
  });

/** A light beam (open cone) from `pos` toward (−sin yaw, 0, −cos yaw), tilted up by `pitch` (rad). */
export const Beam: React.FC<{ pos: V3; yaw: number; pitch?: number; len: number; radius: number; color: string; i: number }> = ({ pos, yaw, pitch = 0, len, radius, color, i }) => {
  const mat = useMemo(() => beamMat(), []);
  mat.uniforms.uColor.value.set(color);
  mat.uniforms.uI.value = i;
  return (
    <group position={pos} rotation={[0, yaw, 0]} visible={i > 0.002}>
      <group rotation={[Math.PI / 2 + pitch, 0, 0]}>
        <mesh ref={fxLayer} geometry={beamGeo(len, radius)} material={mat} position={[0, -len / 2, 0]} renderOrder={6} frustumCulled={false} />
      </group>
    </group>
  );
};
const beamCache = new Map<string, ConeGeometry>();
const beamGeo = (len: number, r: number) => {
  const k = `${len},${r}`;
  let g = beamCache.get(k);
  if (!g) { g = new ConeGeometry(r, len, 32, 1, true); beamCache.set(k, g); }
  return g;
};
