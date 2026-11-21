// Fixed light rig for a whole film. The set of lights never changes (three.js never recompiles a shader
// mid-film); shots only move them and change colour/intensity. Three lights cast shadows: the moon
// (directional, frustum fitted to the shot's box) and two spots (practical lamp, moving headlight…).
// Six unshadowed points carry practicals, bounce and fill.

import React, { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Color, DirectionalLight, FogExp2, HemisphereLight, Matrix4, Object3D, PMREMGenerator, PointLight, SpotLight, Vector3 } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { P_OFF, S_OFF, type LightState, type PointL, type SpotL, type V3 } from "./types.ts";
export { P_OFF, S_OFF, type LightState, type PointL, type SpotL, type V3 };

const makeSpot = (map: number) => {
  const s = new SpotLight("#ffd9a8", 0);
  s.castShadow = true;
  s.shadow.mapSize.set(map, map);
  s.shadow.bias = -0.0005;
  s.shadow.normalBias = 0.02;
  s.shadow.radius = 4;
  s.shadow.camera.near = 0.05;
  const t = new Object3D();
  s.target = t;
  return { s, t };
};

export const Lights: React.FC<{ s: LightState }> = ({ s }) => {
  const { scene, gl } = useThree();
  const rig = useMemo(() => {
    const hemi = new HemisphereLight("#8899bb", "#221a14", 0.5);
    const moon = new DirectionalLight("#9fb8ff", 1);
    moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.bias = -0.0004;
    moon.shadow.normalBias = 0.025;
    moon.shadow.radius = 3;
    const mt = new Object3D();
    moon.target = mt;
    const spots = [makeSpot(2048), makeSpot(1024)];
    const pts = [0, 1, 2, 3, 4, 5].map(() => new PointLight("#fff", 0, 1, 2));
    const pm = new PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    return { hemi, moon, mt, spots, pts, env };
  }, [gl]);

  useLayoutEffect(() => {
    scene.environment = rig.env;
    scene.background = new Color(s.bg);
    if (!(scene.fog instanceof FogExp2)) scene.fog = new FogExp2(s.fog.color, s.fog.density);
    (scene.fog as FogExp2).color.set(s.fog.color);
    (scene.fog as FogExp2).density = s.fog.density;
    scene.environmentIntensity = s.env;

    rig.hemi.color.set(s.hemi.sky);
    rig.hemi.groundColor.set(s.hemi.ground);
    rig.hemi.intensity = s.hemi.i;

    // moon: fixed frustum fitted around the shot box in light space
    const { min, max } = s.moon.box;
    const L = new Vector3(...s.moon.dir).normalize();
    const c = new Vector3(...min).add(new Vector3(...max)).multiplyScalar(0.5);
    rig.mt.position.copy(c);
    rig.mt.updateMatrixWorld();
    rig.moon.position.copy(c).addScaledVector(L, 60);
    const view = new Matrix4().lookAt(rig.moon.position, c, Math.abs(L.y) > 0.98 ? new Vector3(0, 0, 1) : new Vector3(0, 1, 0));
    const inv = new Matrix4().makeTranslation(rig.moon.position.x, rig.moon.position.y, rig.moon.position.z).multiply(view).invert();
    const lo = new Vector3(Infinity, Infinity, Infinity), hi = new Vector3(-Infinity, -Infinity, -Infinity);
    for (let k = 0; k < 8; k++) {
      const p = new Vector3(k & 1 ? max[0] : min[0], k & 2 ? max[1] : min[1], k & 4 ? max[2] : min[2]).applyMatrix4(inv);
      lo.min(p);
      hi.max(p);
    }
    const sc = rig.moon.shadow.camera;
    sc.left = lo.x; sc.right = hi.x; sc.bottom = lo.y; sc.top = hi.y;
    sc.near = Math.max(0.5, -hi.z - 5);
    sc.far = -lo.z + 5;
    sc.updateProjectionMatrix();
    rig.moon.color.set(s.moon.color);
    rig.moon.intensity = s.moon.i;
    // shadow maps render every frame even for a dark light: an unrendered shadow map makes WebGL
    // reject every draw call ("mismatch between texture format and sampler type")
    rig.moon.shadow.autoUpdate = true;

    s.spots.forEach((sp, i) => {
      const { s: l, t } = rig.spots[i];
      l.position.set(...sp.pos);
      t.position.set(...sp.target);
      t.updateMatrixWorld();
      l.color.set(sp.color);
      l.intensity = sp.i;
      l.angle = sp.angle;
      l.penumbra = sp.penumbra;
      l.distance = sp.dist;
      l.decay = 2;
      l.shadow.camera.far = sp.dist;
      l.shadow.autoUpdate = true;
    });

    s.pts.forEach((p, i) => {
      const l = rig.pts[i];
      l.position.set(...p.pos);
      l.color.set(p.color);
      l.intensity = p.i;
      l.distance = p.dist;
      l.decay = 2;
    });
  }, [s, rig, scene]);

  return (
    <>
      <primitive object={rig.hemi} />
      <primitive object={rig.moon} />
      <primitive object={rig.mt} />
      {rig.spots.map(({ s: l, t }, i) => (
        <React.Fragment key={i}>
          <primitive object={l} />
          <primitive object={t} />
        </React.Fragment>
      ))}
      {rig.pts.map((p, i) => (
        <primitive key={i} object={p} />
      ))}
    </>
  );
};

// ── blending (lamp switching on, set changes, light passing) ─────────────────

const mixN = (a: number, b: number, k: number) => a + (b - a) * k;
const mix3 = (a: V3, b: V3, k: number): V3 => [mixN(a[0], b[0], k), mixN(a[1], b[1], k), mixN(a[2], b[2], k)];
const _a = new Color(), _b = new Color();
export const mixC = (a: string, b: string, k: number) => `#${_a.set(a).lerp(_b.set(b), k).getHexString()}`;
const mixP = (a: PointL, b: PointL, k: number): PointL => {
  // a light fading out keeps its position (no sliding across the room)
  const pos = a.i === 0 ? b.pos : b.i === 0 ? a.pos : mix3(a.pos, b.pos, k);
  return { pos, color: mixC(a.color, b.color, k), i: mixN(a.i, b.i, k), dist: mixN(a.dist, b.dist, k) };
};
const mixS = (a: SpotL, b: SpotL, k: number): SpotL =>
  a.i === 0 ? { ...b, i: b.i * k } : b.i === 0 ? { ...a, i: a.i * (1 - k) } : { ...b, color: mixC(a.color, b.color, k), i: mixN(a.i, b.i, k) };

export const mixLight = (a: LightState, b: LightState, k: number): LightState => {
  if (k <= 0) return a;
  if (k >= 1) return b;
  return {
    bg: mixC(a.bg, b.bg, k),
    fog: { color: mixC(a.fog.color, b.fog.color, k), density: mixN(a.fog.density, b.fog.density, k) },
    env: mixN(a.env, b.env, k),
    hemi: { sky: mixC(a.hemi.sky, b.hemi.sky, k), ground: mixC(a.hemi.ground, b.hemi.ground, k), i: mixN(a.hemi.i, b.hemi.i, k) },
    moon: { dir: a.moon.dir, box: a.moon.box, color: mixC(a.moon.color, b.moon.color, k), i: mixN(a.moon.i, b.moon.i, k) },
    spots: [mixS(a.spots[0], b.spots[0], k), mixS(a.spots[1], b.spots[1], k)],
    pts: [0, 1, 2, 3, 4, 5].map((i) => mixP(a.pts[i], b.pts[i], k)) as LightState["pts"],
  };
};
