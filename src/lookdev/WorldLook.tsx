// World lookdev: one camera per frame over a world's places (establishing views + a few angles), with
// the set state given in props. Render with: node scripts/stills.mjs out/look/<world> 0,1,2,… world-<id>
import React from "react";
import { useCurrentFrame } from "remotion";
import { Stage } from "../cine/Stage.tsx";
import { Lights } from "../cine/Lights.tsx";
import { CameraRig, FilmPost, GRADE0, type Cam, type Grade } from "../cine/Post.tsx";
import { WORLDS } from "../worlds/index.ts";
import { SETS } from "../worlds/sets.tsx";
import { legalCam, type SetState } from "../worlds/types.ts";

export type LookView = { place: string; time: string; cam: Cam; s?: SetState; t?: number; label?: string };
export const NIGHT_GRADE: Grade = { ...GRADE0, exposure: 1.45, lift: [0.02, 0.03, 0.055], gain: [0.96, 1.0, 1.06], sat: 0.92, contrast: 1.06, vignette: 0.32, grain: 0.02, bloom: 0.3, bloomRadius: 0.55, bloomThreshold: 0.9 };

export const WorldLook: React.FC<{ world: string; views: LookView[] }> = ({ world, views }) => {
  const f = useCurrentFrame();
  const v = views[f % views.length];
  const W = WORLDS[world];
  const Set = SETS[world];
  const pl = W.places[v.place];
  const s: SetState = { ...Object.fromEntries(Object.entries(W.props).map(([k, p]) => [k, p.default])), ...v.s };
  const cam = { ...v.cam, pos: legalCam(pl, v.cam.pos) };
  const t = v.t ?? 3;
  return (
    <Stage overlay={() => <div style={{ position: "absolute", left: 30, top: 24, font: "600 30px Manrope", color: "#fff", textShadow: "0 2px 6px #000" }}>{v.label ?? `${v.place} · ${v.time}`}</div>}>
      <Lights s={W.light(v.place, v.time, s, t)} />
      <Set place={v.place} time={v.time} s={s} t={t} cam={cam} />
      <CameraRig cam={cam} />
      <FilmPost cam={cam} grade={v.time === "day" ? { ...GRADE0, exposure: 1.0 } : NIGHT_GRADE} frame={f} />
    </Stage>
  );
};
