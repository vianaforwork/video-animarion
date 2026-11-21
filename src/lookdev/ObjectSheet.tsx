// Object look sheet: frame 2k / 2k+1 = object k from the front-left and back-right, on a grey studio floor
// next to a 1.8 m person (scale check). Objects: the library registry + built-ins (sheet-list.json).
import React from "react";
import { useCurrentFrame } from "remotion";
import { Stage } from "../cine/Stage.tsx";
import { Lights, P_OFF, S_OFF, type LightState } from "../cine/Lights.tsx";
import { CameraRig, FilmPost, GRADE0, type Cam } from "../cine/Post.tsx";
import { Character } from "../cine/character/Character.tsx";
import { restPose } from "../cine/character/pose.ts";
import { lookSpec } from "../cine/character/looks.ts";
import { phys } from "../cine/mats.ts";
import { box } from "../kits/worldforge/geo.ts";
import { OBJECTS } from "../gen/objects/registry.ts";
import { objectInfo } from "../gen/build.ts";
import { Compound } from "../gen/objects/Compound.tsx";
import { Builtin } from "../gen/objects/builtin.tsx";
import LIST from "../gen/objects/sheet-list.json";

const L: LightState = {
  bg: "#9aa3ad", fog: { color: "#9aa3ad", density: 0.0 }, env: 0.5,
  hemi: { sky: "#dfe6ee", ground: "#5a5048", i: 0.9 },
  moon: { dir: [0.5, 0.8, 0.6], color: "#fff4e6", i: 2.6, box: { min: [-4, 0, -4], max: [4, 6, 4] } },
  spots: [S_OFF, S_OFF],
  pts: [{ pos: [-2.6, 2.6, 2.4], color: "#cfe0ff", i: 3.0, dist: 9 }, P_OFF, P_OFF, P_OFF, P_OFF, P_OFF],
};
export const OBJECT_SHEET_FRAMES = Math.max(2, (LIST as string[]).length * 2);

export const ObjectSheet: React.FC = () => {
  const f = useCurrentFrame();
  const names = LIST as string[];
  const id = names[Math.floor(f / 2)] ?? names[0];
  const objs = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));
  let info;
  try { info = objectInfo(id, objs); } catch { return null; }
  const [w, h, d] = info.bounds;
  const R = Math.max(w, h * 1.1, d, 1.2) * 1.55 + 0.8;
  const a = f % 2 ? 2.4 : -0.7;
  const cy = Math.max(0.5, h * 0.45);
  const cam: Cam = { pos: [Math.sin(a) * R, cy + R * 0.38, Math.cos(a) * R], target: [0, cy * 0.85, 0], fov: 34 };
  const p = restPose();
  p.x = -(w / 2 + 0.45); p.yaw = 0.4;
  return (
    <Stage overlay={() => <div style={{ position: "absolute", left: 40, top: 30, font: "600 40px Manrope", color: "#1d232b" }}>{id} · {w.toFixed(2)}×{h.toFixed(2)}×{d.toFixed(2)} m</div>}>
      <Lights s={L} />
      <mesh geometry={box(30, 0.1, 30, 0.01)} material={phys("osFloor", { color: "#8a9099", roughness: 0.9 })} position={[0, -0.05, 0]} receiveShadow />
      {info.builtin ? <Builtin id={id} /> : <Compound spec={objs[id]} />}
      {h < 4 ? <Character spec={lookSpec("ref", "pemuda")} pose={p} t={1} /> : null}
      <CameraRig cam={cam} />
      <FilmPost cam={cam} grade={{ ...GRADE0, vignette: 0.1, grain: 0.004 }} frame={f} />
    </Stage>
  );
};
