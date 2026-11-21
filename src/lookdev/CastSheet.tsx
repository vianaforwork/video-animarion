// Character bible sheet: frame 2k = look k full body (3/4), frame 2k+1 = its face. Neutral studio light.
import React from "react";
import { useCurrentFrame } from "remotion";
import { Stage } from "../cine/Stage.tsx";
import { Lights, P_OFF, S_OFF, type LightState } from "../cine/Lights.tsx";
import { CameraRig, FilmPost, GRADE0, type Cam } from "../cine/Post.tsx";
import { Character } from "../cine/character/Character.tsx";
import { restPose } from "../cine/character/pose.ts";
import { LOOKS, lookSpec } from "../cine/character/looks.ts";
import { phys } from "../cine/mats.ts";
import { box } from "../kits/worldforge/geo.ts";

export const CAST_SHEET_FRAMES = Object.keys(LOOKS).length * 2;

const L: LightState = {
  bg: "#9aa3ad", fog: { color: "#9aa3ad", density: 0.0 }, env: 0.5,
  hemi: { sky: "#dfe6ee", ground: "#5a5048", i: 0.9 },
  moon: { dir: [0.5, 0.8, 0.6], color: "#fff4e6", i: 2.6, box: { min: [-1.5, 0, -1.5], max: [1.5, 2.2, 1.5] } },
  spots: [S_OFF, S_OFF],
  pts: [{ pos: [-1.6, 1.8, 1.4], color: "#cfe0ff", i: 2.2, dist: 6 }, P_OFF, P_OFF, P_OFF, P_OFF, P_OFF],
};

export const CastSheet: React.FC<{ hold?: string }> = () => {
  const f = useCurrentFrame();
  const names = Object.keys(LOOKS);
  const name = names[Math.floor(f / 2) % names.length];
  const face = f % 2 === 1;
  const spec = lookSpec(name, name);
  const p = restPose();
  p.yaw = -0.45;
  const h = 1.8 * spec.scale;
  const cam: Cam = face
    ? { pos: [-0.25, h * 0.93, 0.62], target: [0, h * 0.91, 0], fov: 24 }
    : { pos: [-1.0, h * 0.62, 3.6], target: [0, h * 0.5, 0], fov: 32 };
  return (
    <Stage overlay={() => <div style={{ position: "absolute", left: 40, top: 30, font: "600 40px Manrope", color: "#1d232b" }}>{name}</div>}>
      <Lights s={L} />
      <mesh geometry={box(8, 0.1, 8, 0.01)} material={phys("sheetFloor", { color: "#8a9099", roughness: 0.9 })} position={[0, -0.05, 0]} receiveShadow />
      <Character spec={spec} pose={p} t={1} />
      <CameraRig cam={cam} />
      <FilmPost cam={cam} grade={{ ...GRADE0, vignette: 0.1, grain: 0.004 }} frame={f} />
    </Stage>
  );
};
