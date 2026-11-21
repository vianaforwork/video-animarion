// One generic renderer for every story: compile once, then per frame — scene, set state, light rig
// (+ props carried by people), the world's set, the people, the camera, the grade, the overlay, audio.

import React, { useMemo } from "react";
import { Html5Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Stage } from "../cine/Stage.tsx";
import { Lights, type LightState } from "../cine/Lights.tsx";
import { CameraRig, FilmPost } from "../cine/Post.tsx";
import { Character } from "../cine/character/Character.tsx";
import { fromChest } from "../cine/character/rig.ts";
import { phys } from "../cine/mats.ts";
import { phoneScreenTex, type PhoneMsg } from "../cine/set/tex.ts";
import { compile } from "../director/compile.ts";
import type { Story } from "../director/story.ts";
import { SETS } from "../worlds/sets.tsx";
import { studioLight } from "../worlds/studio/data.ts";
import { MindStudio } from "../worlds/studio/Mind.tsx";
import { GenSet } from "../gen/GenSet.tsx";
import { FilmOverlay } from "./Overlay.tsx";
import { Solid } from "../core/qa/scene-qa.tsx";

const phoneScreen = (msg?: PhoneMsg) => phys(`phoneOn${JSON.stringify(msg ?? {})}`, { color: "#000000", emissive: "#ffffff", emissiveMap: phoneScreenTex("notif", msg), emissiveIntensity: 0.62, roughness: 0.08, clearcoat: 1 });

export const Film: React.FC<{ story: Story; audio?: string }> = ({ story, audio }) => {
  const plan = useMemo(() => compile(story), [story]);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const S = plan.sceneAt(t);
  const shot = plan.shotAt(t);
  const cam = plan.cam(t);
  const s = plan.setAt(t);
  const Set = SETS[plan.world.id] ?? (() => null);
  const people = S.cast.map((who) => ({ who, p: plan.poseOf(who, t) })).filter((x) => x.p);
  const studio = S.place.kind === "studio";
  let L: LightState = studio ? studioLight() : plan.world.light(S.place.id, S.time, s, t);
  // light carried by people: a lantern glows (point 4), a flashlight throws a spot (spot 1)
  for (const { who, p } of people) {
    if (!p?.hold) continue;
    const hand = fromChest(p, p.armR.ik && p.armR.ik.w > 0.3 ? [-p.armR.ik.t[0], p.armR.ik.t[1], p.armR.ik.t[2]] : [-0.2, -0.4, 0.1], plan.specs[who]);
    if (p.hold.kind === "lantern") L = { ...L, pts: [L.pts[0], L.pts[1], L.pts[2], L.pts[3], { pos: [hand[0], hand[1] - 0.15, hand[2]], color: "#ffb45e", i: 2.4, dist: 6 }, L.pts[5]] };
    if (p.hold.kind === "flashlight") {
      const f = [Math.sin(p.yaw), 0, Math.cos(p.yaw)];
      const aim: [number, number, number] = p.aim ?? [hand[0] + f[0] * 6, hand[1] - 0.9, hand[2] + f[2] * 6];
      L = { ...L, spots: [L.spots[0], { pos: hand, target: aim, color: "#fff4dc", i: 55, angle: 0.3, penumbra: 0.55, dist: 26 }] };
    }
  }
  // overview shots (establish, drone, map) see through the haze a little more: cinematic licence
  if (shot.kind === "map" || shot.kind === "drone" || shot.kind === "establish") L = { ...L, fog: { ...L.fog, density: L.fog.density * 0.45 } };
  const pov = shot.kind === "pov" ? shot.who : undefined;
  // portrait / phone: a soft eye-light from the camera side on the subject's face in dark scenes, short
  // reach (it lights the face, not the room) — the night stays dark, the face reads on a small screen
  let fill = { pos: [0, -60, 0] as [number, number, number], i: 0 };
  const fp = shot.who ? people.find((x) => x.who === shot.who)?.p : undefined;
  if (plan.format === "portrait" && fp && S.dark > 0.3 && !studio && !["pov", "long", "establish", "drone", "map"].includes(shot.kind)) {
    const head: [number, number, number] = [fp.x, fp.y + 1.45 + fp.hipY, fp.z];
    const d = [cam.pos[0] - head[0], cam.pos[1] - head[1], cam.pos[2] - head[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1;
    const k = Math.min(1.1, dl);
    fill = { pos: [head[0] + (d[0] / dl) * k, head[1] + (d[1] / dl) * k + 0.28, head[2] + (d[2] / dl) * k], i: 1.5 * Math.min(1, S.dark) };
  }
  return (
    <Stage overlay={() => <FilmOverlay plan={plan} t={t} cam={cam} />}>
      <Lights s={L} />
      <pointLight position={fill.pos} intensity={fill.i} distance={3.2} decay={2} color="#dfe8ff" />
      {studio ? <MindStudio t={t} /> : plan.built ? (
        <GenSet b={plan.built} place={S.place.id} time={S.time} s={s} t={t} cam={cam} dyn={plan.objectsAt(t)} area={[S.place.box.min[0], S.place.box.min[2], S.place.box.max[0], S.place.box.max[2]]} />
      ) : <Set place={S.place.id} time={S.time} s={s} t={t} cam={cam} />}
      {/* <Solid>: the people for the scene QA (scripts/qa-scene.mjs) — what they carry is part of them */}
      {people.map(({ who, p }) => <Solid key={who} id={who}><Character spec={plan.specs[who]} pose={p!} t={t} visible={who !== pov} phoneScreen={phoneScreen(plan.story.cast.find((c) => c.id === who)?.phoneText)} /></Solid>)}
      <CameraRig cam={cam} />
      <FilmPost cam={cam} grade={plan.grade(t)} frame={frame} />
      {audio ? <Html5Audio src={staticFile(audio)} /> : null}
    </Stage>
  );
};
