// Sky dome for exterior worlds: elevation gradient, glow around the moon/sun, the disk itself, a seeded
// star field and soft cloud bands, all in one fog-free shader on a sphere that follows the camera.

import React, { useMemo } from "react";
import { BackSide, Color, ShaderMaterial, SphereGeometry, Vector3 } from "three";
import type { V3 } from "../Lights.tsx";

export type SkyLook = { zenith: string; horizon: string; glow: string; disk: string; diskSize: number; stars: number; clouds: number; cloud: string };

export const SKIES: Record<string, SkyLook> = {
  night: { zenith: "#03060f", horizon: "#16233d", glow: "#5c7ab8", disk: "#f2f0e6", diskSize: 0.018, stars: 1, clouds: 0.45, cloud: "#2a3550" },
  dusk: { zenith: "#1a2240", horizon: "#e0875a", glow: "#ffb36e", disk: "#fff1d0", diskSize: 0.02, stars: 0.15, clouds: 0.55, cloud: "#7a5a6a" },
  dawn: { zenith: "#2b3f66", horizon: "#e8b48c", glow: "#ffd9a8", disk: "#fff6e0", diskSize: 0.02, stars: 0.05, clouds: 0.5, cloud: "#a8909a" },
  day: { zenith: "#4f86c6", horizon: "#cfe0ee", glow: "#ffffff", disk: "#fffaf0", diskSize: 0.016, stars: 0, clouds: 0.55, cloud: "#f2f4f6" },
  storm: { zenith: "#0a0d12", horizon: "#2a3038", glow: "#4a5566", disk: "#c8ccd4", diskSize: 0.0, stars: 0, clouds: 1, cloud: "#1c2028" },
};

const geo = new SphereGeometry(800, 64, 32);

export const SkyDome: React.FC<{ look: SkyLook; dir: V3; cam: V3; t: number }> = ({ look, dir, cam, t }) => {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uDir: { value: new Vector3() }, uZen: { value: new Color() }, uHor: { value: new Color() }, uGlow: { value: new Color() },
          uDisk: { value: new Color() }, uSize: { value: 0 }, uStars: { value: 0 }, uClouds: { value: 0 }, uCloud: { value: new Color() }, uT: { value: 0 },
        },
        vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uDir, uZen, uHor, uGlow, uDisk, uCloud; uniform float uSize, uStars, uClouds, uT;
          varying vec3 vDir;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }
          float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
          void main(){
            vec3 d = normalize(vDir);
            float e = clamp(d.y, -1.0, 1.0);
            vec3 col = mix(uHor, uZen, pow(max(e, 0.0), 0.5));
            if (e < 0.0) col = uHor * 0.55;
            float c = max(dot(d, normalize(uDir)), 0.0);
            col += uGlow * (pow(c, 8.0) * 0.35 + pow(c, 64.0) * 0.5) * smoothstep(-0.05, 0.1, e);
            // stars: one jittered point per cell in (azimuth, elevation)
            if (uStars > 0.0 && e > 0.0) {
              vec2 g = vec2(atan(d.z, d.x) * 90.0, e * 140.0);
              vec2 id = floor(g), f = fract(g);
              float r = h21(id);
              vec2 p = vec2(h21(id + 7.1), h21(id + 3.7));
              float s = smoothstep(0.09, 0.0, length(f - p)) * step(0.82, r) * (0.5 + 0.5 * sin(uT * (1.0 + r * 3.0) + r * 40.0));
              col += vec3(0.85, 0.9, 1.0) * s * uStars * smoothstep(0.02, 0.25, e) * (0.6 + 1.6 * fract(r * 13.0));
            }
            // clouds: stretched fbm bands, lit toward the moon/sun
            if (uClouds > 0.0 && e > -0.02) {
              vec2 q = d.xz / (e + 0.18) * 1.6 + vec2(uT * 0.004, 0.0);
              float n = fbm(q * vec2(1.0, 2.6));
              float cl = smoothstep(0.52, 0.85, n) * uClouds * smoothstep(-0.02, 0.12, e);
              vec3 cc = uCloud + uGlow * pow(c, 6.0) * 0.6;
              col = mix(col, cc, cl * 0.85);
            }
            // the disk
            float disk = smoothstep(cos(uSize), cos(uSize * 0.9), dot(d, normalize(uDir)));
            col = mix(col, uDisk * 2.2, disk * step(0.0001, uSize));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  const u = mat.uniforms;
  u.uDir.value.set(...dir);
  u.uZen.value.set(look.zenith);
  u.uHor.value.set(look.horizon);
  u.uGlow.value.set(look.glow);
  u.uDisk.value.set(look.disk);
  u.uSize.value = look.diskSize;
  u.uStars.value = look.stars;
  u.uClouds.value = look.clouds;
  u.uCloud.value.set(look.cloud);
  u.uT.value = t;
  return <mesh geometry={geo} material={mat} position={cam} renderOrder={-10} frustumCulled={false} />;
};
