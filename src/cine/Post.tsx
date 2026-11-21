// CINÉSTORY camera + finishing chain: MSAA → NaN guard → GTAO → bokeh DOF → bloom → PBR Neutral tone
// map → film grade (lift/gain, saturation, contrast, landscape vignette, lens chromatic fringe, grain,
// flash, fade to black). The grade is driven per shot and blends across lamp changes and transitions.

import React, { useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, HalfFloatType, NeutralToneMapping, PerspectiveCamera, Vector2, Vector3, WebGLRenderTarget } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FX_LAYER, withoutFx } from "../core/render/Post.tsx";
import { mixC } from "./Lights.tsx";

import { GRADE0, type Cam, type Grade } from "./types.ts";
export { GRADE0, type Cam, type Grade };

export const CameraRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = camera as PerspectiveCamera;
    c.position.set(...cam.pos);
    const f = new Vector3(...cam.target).sub(c.position).normalize();
    const r = cam.roll ?? 0;
    // roll about the view axis
    const up = new Vector3(0, 1, 0);
    const side = new Vector3().crossVectors(f, up).normalize();
    const u2 = new Vector3().crossVectors(side, f).normalize();
    c.up.copy(u2.multiplyScalar(Math.cos(r)).addScaledVector(side, Math.sin(r)));
    c.lookAt(...cam.target);
    c.fov = cam.fov;
    c.near = cam.near ?? 0.05;
    c.far = cam.far ?? 900;
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
    c.layers.enable(FX_LAYER);
  }, [cam, camera]);
  return null;
};

const NanGuardShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
      gl_FragColor = clamp(c, 0.0, 64.0); }`,
};

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uRes: { value: new Vector2(1920, 1080) },
    uCA: { value: 0.0012 },
    uLift: { value: new Vector3() },
    uGain: { value: new Vector3(1, 1, 1) },
    uSat: { value: 1 },
    uContrast: { value: 1 },
    uVignette: { value: 0.2 },
    uGrain: { value: 0.015 },
    uFlash: { value: 0 },
    uFlashColor: { value: new Color("#fff") },
    uBlack: { value: 0 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes;
    uniform vec3 uLift; uniform vec3 uGain; uniform float uSat; uniform float uContrast;
    uniform float uVignette; uniform float uGrain; uniform float uFlash; uniform vec3 uFlashColor; uniform float uBlack; uniform float uCA;
    varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    void main(){
      vec2 cd = vUv - 0.5;
      float ca = uCA * dot(cd, cd) * 4.0;
      vec3 c = vec3(texture2D(tDiffuse, vUv - cd * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + cd * ca).b);
      vec3 x = clamp(c, 0.0, 1.0);
      x = x * uGain + uLift * (1.0 - x);
      float l = dot(x, vec3(0.2126, 0.7152, 0.0722));
      x = mix(vec3(l), x, uSat);
      x = clamp((x - 0.5) * uContrast + 0.5, 0.0, 1.0);
      x = mix(x, x * x * (3.0 - 2.0 * x), 0.18);
      vec2 d = (vUv - 0.5) * vec2(1.0, 0.86);
      x *= 1.0 - uVignette * smoothstep(0.28, 0.82, length(d));
      float g = hash(vUv * uRes + uTime * 17.0) - 0.5;
      x += g * uGrain * (0.5 + 0.5 * (1.0 - l));
      x = mix(x, uFlashColor, clamp(uFlash, 0.0, 1.0));
      x *= 1.0 - clamp(uBlack, 0.0, 1.0);
      gl_FragColor = vec4(x, 1.0);
    }`,
};

export const FilmPost: React.FC<{ cam: Cam; grade: Grade; frame: number }> = ({ cam, grade, frame }) => {
  const { gl, scene, camera, size } = useThree();
  const chain = useMemo(() => {
    const w = size.width, h = size.height;
    const rt = new WebGLRenderTarget(w, h, { type: HalfFloatType, samples: 4 });
    const composer = new EffectComposer(gl, rt);
    composer.setPixelRatio(1);
    composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new ShaderPass(NanGuardShader));
    const gtao = new GTAOPass(scene, camera, w, h);
    gtao.blendIntensity = 1.0;
    gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.6, thickness: 0.6, scale: 1.0, samples: 16, distanceFallOff: 1.0, screenSpaceRadius: false });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 16 });
    composer.addPass(withoutFx(gtao, camera));
    const dof = withoutFx(new BokehPass(scene, camera, { focus: 3, aperture: 0.002, maxblur: 0.008 }), camera);
    composer.addPass(dof);
    const bloom = new UnrealBloomPass(new Vector2(w, h), 0.25, 0.5, 0.85);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const g = new ShaderPass(GradeShader);
    g.uniforms.uRes.value.set(w, h);
    composer.addPass(g);
    return { composer, dof, bloom, gtao, g };
  }, [gl, scene, camera, size.width, size.height]);

  useLayoutEffect(() => {
    gl.toneMapping = NeutralToneMapping;
    gl.toneMappingExposure = grade.exposure;
    const u = chain.dof.uniforms as unknown as Record<string, { value: number }>;
    const dist = new Vector3(...cam.pos).distanceTo(new Vector3(...cam.target));
    u.focus.value = cam.focus ?? dist;
    u.aperture.value = cam.aperture ?? 0;
    u.maxblur.value = cam.maxBlur ?? 0;
    chain.dof.enabled = (cam.aperture ?? 0) > 0 && (cam.maxBlur ?? 0) > 0;
    chain.bloom.strength = grade.bloom;
    chain.bloom.radius = grade.bloomRadius;
    chain.bloom.threshold = grade.bloomThreshold;
    chain.gtao.blendIntensity = grade.ao;
    chain.gtao.enabled = grade.ao > 0.01;
    const U = chain.g.uniforms;
    U.uTime.value = frame % 997;
    U.uLift.value.set(...grade.lift);
    U.uGain.value.set(...grade.gain);
    U.uSat.value = grade.sat;
    U.uContrast.value = grade.contrast;
    U.uVignette.value = grade.vignette;
    U.uGrain.value = grade.grain;
    U.uFlash.value = grade.flash;
    U.uFlashColor.value.set(grade.flashColor);
    U.uBlack.value = grade.black;
    U.uCA.value = grade.ca;
  }, [frame, chain, cam, grade, gl]);

  useFrame(() => {
    chain.composer.render();
  }, 1);
  return null;
};

const mixN = (a: number, b: number, k: number) => a + (b - a) * k;
export const mixGrade = (a: Grade, b: Grade, k: number): Grade => {
  if (k <= 0) return a;
  if (k >= 1) return b;
  const o = { ...a };
  for (const key of Object.keys(a) as (keyof Grade)[]) {
    const va = a[key], vb = b[key];
    if (typeof va === "number" && typeof vb === "number") (o as Record<string, unknown>)[key] = mixN(va, vb, k);
    else if (Array.isArray(va) && Array.isArray(vb)) (o as Record<string, unknown>)[key] = [0, 1, 2].map((i) => mixN(va[i], vb[i], k));
    else if (typeof va === "string" && typeof vb === "string") (o as Record<string, unknown>)[key] = mixC(va, vb, k);
  }
  return o;
};
