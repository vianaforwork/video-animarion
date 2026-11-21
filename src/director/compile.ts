// The director: story.json → a complete film plan. Resolves word cues, blocks and performs every person
// (walks, sits, looks, props), picks a camera for every beat (cutting in VO pauses), tracks the set state,
// grade and letterbox per scene, places UI overlays and writes the sound department's cue sheet. Pure
// data + functions of film time; the same plan drives the picture (Film.tsx) and the sound (sound-story.ts).

import type { CharSpec } from "../cine/character/Character.tsx";
import { lookSpec, LOOKS } from "../cine/character/looks.ts";
import { blend, type HoldKind, type Pose } from "../cine/character/pose.ts";
import { eyeExact, fromChest, planPath, walkState } from "../cine/character/rig.ts";
import type { Cam, Grade } from "../cine/types.ts";
import { WORLDS } from "../worlds/index.ts";
import type { Place, SetState, V3, WorldData } from "../worlds/types.ts";
import { STUDIO } from "../worlds/studio/data.ts";
import { buildWorld, navPath, toWorld, type Built } from "../gen/build.ts";
import type { Dyn } from "../gen/dyn.ts";
import { actPose, CARRY_CHEST, DEFAULT_FACE, NEEDS, yawTo, type CState, type Seg } from "./actions.ts";
import { makeCues, type Cues } from "./cues.ts";
import { BARS, DARK, gradeFor } from "./grade.ts";
import { ALT, shotCam, type ShotCtx, type Subject } from "./shots.ts";
import { ACTIONS, CUTS, FACES, MOODS, PROPS, SHOTS, type ActionName, type Beat, type Mood, type Scene, type ShotName, type Story, type Transition, type Ui, type Word } from "./story.ts";

export type SceneP = { i: number; t0: number; t1: number; place: Place; time: string; mood: Mood; cut: Transition; cast: string[]; dark: number };
export type ShotP = { t0: number; t1: number; scene: number; kind: ShotName; who?: string; target?: string; ctx: ShotCtx; forced?: boolean };
export type UiP = { t0: number; t1: number; ui: Ui; scene: number };
/** a burned-in caption line: the words of a short phrase with their film times */
export type CaptionP = { t0: number; t1: number; words: { w: string; t0: number; t1: number }[] };
export type Format = "portrait" | "landscape";
export type BrandP = { name?: string; handle?: string; cta?: string; accent?: string; logo?: string; intro?: { t0: number; t1: number }; watermark?: boolean };
export type SoundPlan = {
  duration: number; offset: number; voFile: string; voEnd: number;
  amb: { t0: number; t1: number; id: string; time: string; reverb: number }[];
  music: { t0: number; t1: number; mood: Mood; dark: number }[];
  hits: number[];
  quiet: [number, number][];
  steps: { t: number; run: boolean; surface: string; g: number }[];
  sfx: { t: number; name: string; dur?: number; g?: number }[];
  cuts: { t: number; kind: Transition }[];
  title?: number;
  endCard: number;
};
export type Plan = {
  story: Story;
  world: WorldData;
  duration: number;
  offset: number;
  voEnd: number;
  scenes: SceneP[];
  shots: ShotP[];
  ui: UiP[];
  specs: Record<string, CharSpec>;
  props: Record<string, HoldKind | "phone" | undefined>;
  sceneAt: (t: number) => SceneP;
  shotAt: (t: number) => ShotP;
  poseOf: (who: string, t: number) => Pose | null;
  setAt: (t: number) => SetState;
  cam: (t: number) => Cam;
  grade: (t: number) => Grade;
  bars: (t: number) => number;
  titleCard?: { t0: number; t1: number; text: string; sub?: string; kicker?: string };
  disclaimer?: { t0: number; t1: number; text: string };
  endCard: { t0: number; t1: number; text: string; sub?: string };
  /** 9:16 portrait (default) or 16:9 landscape */
  format: Format;
  aspect: number;
  captions: CaptionP[];
  brand?: BrandP;
  sound: SoundPlan;
  warnings: string[];
  /** generated world geometry (dynamic worlds) */
  built?: Built;
  /** where every movable object is at film time t (pushed, carried, rolling) */
  objectsAt: (t: number) => Dyn;
};

const WALK = 1.15, WALK_MAX = 1.75, RUN = 3.0, RUN_MAX = 4.2, BLEND = 0.45;
/** Feet follow the terrain only where the place stands on it. A raised place (a lighthouse gallery, a rooftop, a
 *  jetty) shares the world's terrain function but its marks are well above it: there the mark height holds, or the
 *  people would sink to the ground below (inside the tower). */
const floorFn = (pl: Place) => {
  if (pl.kind !== "exterior" || !pl.ground) return undefined;
  const raised = Object.values(pl.marks).some((m) => (m.y ?? pl.floor) - pl.ground!(m.p[0], m.p[1]) > 1);
  return raised ? undefined : pl.ground;
};
const ease = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
const seedOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
const list = <T,>(x: T | T[] | undefined): T[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
/** a story's "fov" is a landscape lens: in portrait keep the same width of view (capped at 62°) */
const portraitFov = (f: number) => Math.min(62, (2 * Math.atan(Math.tan((f * Math.PI) / 360) * (16 / 9) / (9 / 16)) * 180) / Math.PI);

export const compile = (story: Story): Plan => {
  const errs: string[] = [], warnings: string[] = [];
  const err = (m: string) => errs.push(m);
  // ── 0. inputs ──────────────────────────────────────────────────────────────
  if (!Array.isArray(story.words)) throw new Error("story.words must be resolved (run make.mjs)");
  const gen = story.worldSpec ? buildWorld(story.worldSpec, story.objectSpecs ?? []) : null;
  const W = gen ? gen.data : WORLDS[story.world];
  if (!W) throw new Error(`world "${story.world}" does not exist (built-in: ${Object.keys(WORLDS).join(", ")}; or write worlds/${story.world}.world.json)`);
  const built: Built | undefined = gen?.built;
  const offset = story.vo.offset ?? 1.5;
  const format: Format = story.format === "landscape" ? "landscape" : "portrait";
  const aspect = format === "portrait" ? 9 / 16 : 16 / 9;
  const cues: Cues = makeCues(story.words as Word[], offset);
  const T = (c: Beat["at"], label: string, after = -1) => cues.at(c, label, after) + offset;
  const specs: Record<string, CharSpec> = {};
  const props: Plan["props"] = {};
  for (const m of story.cast ?? []) {
    if (!/^[a-z0-9-]+$/.test(m.id)) err(`cast id "${m.id}": use only a-z, 0-9 and "-"`);
    if (!LOOKS[m.look]) { err(`cast "${m.id}": unknown look "${m.look}" (looks: ${Object.keys(LOOKS).join(", ")})`); continue; }
    specs[m.id] = lookSpec(m.id, m.look, m.custom);
    if (m.prop && !PROPS.includes(m.prop)) err(`cast "${m.id}": unknown prop "${m.prop}" (props: ${PROPS.join(", ")})`);
    props[m.id] = m.prop;
  }
  if (!story.scenes?.length) throw new Error("story.scenes is empty");
  // two people sharing a scene must be told apart at a glance (top colour / pattern)
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  for (const sc of story.scenes) {
    const ids = Object.keys(sc.cast ?? {}).filter((id) => specs[id]);
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      const A = specs[ids[a]], B = specs[ids[b]];
      const [x, y] = [rgb(A.topColor ?? "#808080"), rgb(B.topColor ?? "#808080")];
      const d = Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
      const msg = `${ids[a]} and ${ids[b]} wear similar tops — give one a clearly different "custom": { "topColor": … }`;
      if (d < 70 && !!A.batik === !!B.batik && !warnings.includes(msg)) warnings.push(msg);
    }
  }
  const tail = story.tail ?? 1.2, endSec = story.endCard?.seconds ?? 4;
  const voEndT = cues.voEnd + offset;
  const duration = Math.round((voEndT + tail + endSec) * 100) / 100;

  // ── 1. scenes ──────────────────────────────────────────────────────────────
  const scenes: SceneP[] = [];
  const sceneV: number[] = [];
  let lastV = -1;
  story.scenes.forEach((sc, i) => {
    const place = W.places[sc.place] ?? STUDIO[sc.place];
    if (!place) { err(`scene ${i + 1}: place "${sc.place}" is not in world "${W.id}" (places: ${[...Object.keys(W.places), ...Object.keys(STUDIO)].join(", ")})`); return; }
    const time = sc.time ?? (i > 0 ? scenes[i - 1]?.time : undefined) ?? W.times[0];
    if (!W.times.includes(time) && place.kind !== "studio") err(`scene ${i + 1}: time "${time}" not available (times: ${W.times.join(", ")})`);
    const mood = sc.mood ?? (i > 0 ? scenes[i - 1]?.mood : undefined) ?? "mystery";
    if (!MOODS.includes(mood)) err(`scene ${i + 1}: mood "${mood}" unknown (moods: ${MOODS.join(", ")})`);
    if (sc.cut && !CUTS.includes(sc.cut)) err(`scene ${i + 1}: cut "${sc.cut}" unknown (cuts: ${CUTS.join(", ")})`);
    let t0 = 0;
    try {
      const v = i === 0 ? 0 : cues.at(sc.at, `scene ${i + 1} "at"`, lastV);
      if (i > 0) lastV = v;
      t0 = i === 0 ? 0 : cues.cutFor(v) + offset;
      sceneV.push(v);
    } catch (e) { err((e as Error).message); sceneV.push(lastV); }
    for (const id of Object.keys(sc.cast ?? {})) {
      if (!specs[id]) err(`scene ${i + 1}: "${id}" is not in story.cast`);
      const m = sc.cast![id];
      if (!place.marks[m.at]) err(`scene ${i + 1}: mark "${m.at}" for ${id} is not in place "${sc.place}" (marks: ${Object.keys(place.marks).join(", ") || "none"})`);
      else if (m.do === "sit" && place.marks[m.at].seat === undefined) err(`scene ${i + 1}: ${id} starts sitting at "${m.at}", which has no seat`);
      else if (m.do === "lie" && !place.marks[m.at].bed) err(`scene ${i + 1}: ${id} starts lying at "${m.at}", which is not a bed`);
    }
    scenes.push({ i, t0, t1: 0, place, time, mood, cut: sc.cut ?? "cut", cast: Object.keys(sc.cast ?? {}), dark: DARK[time] ?? 1 });
  });
  if (errs.length) throw new Error(errs.join("\n"));
  scenes.forEach((s, i) => (s.t1 = i + 1 < scenes.length ? scenes[i + 1].t0 : duration));
  scenes.forEach((s, i) => { if (s.t1 - s.t0 < 0.8) err(`scene ${i + 1} is only ${(s.t1 - s.t0).toFixed(2)} s long — scenes must start in time order`); });

  // ── 2. performance ─────────────────────────────────────────────────────────
  const segs = new Map<string, Seg[]>(); // key `${scene}|${who}`
  // ── objects that move: rolling on their own, pushed, carried, put down, handed over ──
  type ObjEv = { t0: number; t1: number; kind: "move" | "push" | "carry" | "place"; who?: string; from?: V3; to?: V3; yaw0?: number; yaw1?: number; seg?: Seg; d?: number };
  const objEv = new Map<string, ObjEv[]>();
  const instById = new Map((built?.insts ?? []).map((i) => [i.id, i]));
  const evs = (id: string) => { if (!objEv.has(id)) objEv.set(id, []); return objEv.get(id)!; };
  const extraSets: { k: string; t: number; v: number; fade: number }[] = [];
  const objSfx: { t: number; name: string; dur?: number }[] = [];
  let poseRef: (who: string, t: number) => Pose | null = () => null;
  const floorAt = (x: number, z: number) => (built ? built.nav.floor(x, z) : 0);
  const objectAt = (id: string, t: number): { pos: V3; yaw: number } => {
    const inst = instById.get(id)!;
    let cur = { pos: inst.pos, yaw: inst.yaw };
    for (const e of objEv.get(id) ?? []) {
      if (e.t0 > t) break;
      const u = Math.min(1, Math.max(0, (t - e.t0) / Math.max(0.01, e.t1 - e.t0)));
      if (e.kind === "move") { const k = u * u * (3 - 2 * u); cur = { pos: [e.from![0] + (e.to![0] - e.from![0]) * k, e.from![1] + (e.to![1] - e.from![1]) * k, e.from![2] + (e.to![2] - e.from![2]) * k], yaw: e.yaw0! + (e.yaw1! - e.yaw0!) * k }; }
      else if (e.kind === "push" && e.seg?.path) {
        const sg = e.seg, tt = Math.min(Math.max(t, sg.moveT0!), sg.moveT1!);
        const w = walkState(sg.path!, tt, sg.moveT0!, sg.moveT1!, 0.4, 0.6, 1.15, 0.85);
        const ox = w.p[0] + Math.sin(w.yaw) * e.d!, oz = w.p[1] + Math.cos(w.yaw) * e.d!;
        cur = { pos: [ox, floorAt(ox, oz), oz], yaw: w.yaw };
      } else if (e.kind === "carry" && e.who) {
        const p = poseRef(e.who, t);
        if (p) { const hp = fromChest(p, CARRY_CHEST, specs[e.who]); cur = { pos: [hp[0], hp[1] - inst.info.bounds[1] * 0.55 * inst.scale, hp[2]], yaw: p.yaw }; }
      } else if (e.kind === "place") cur = { pos: e.to!, yaw: e.yaw1 ?? cur.yaw };
    }
    return cur;
  };
  const holderOf = (id: string, t: number) => { let h: string | undefined; for (const e of objEv.get(id) ?? []) { if (e.t0 > t) break; h = e.kind === "carry" ? e.who : undefined; } return h; };
  const carriedBy = (who: string, t: number) => [...objEv.keys()].find((id) => holderOf(id, t) === who);
  /** a mark, recomputed from the object's current transform when it belongs to an object ("<obj>:push") */
  const markAt = (place: Place, name: string, t: number) => {
    const [oid, anc] = name.split(":");
    const inst = instById.get(oid);
    const mk = place.marks[name];
    if (!inst || !anc || !mk) return mk;
    const o = objectAt(oid, t);
    const a = inst.info.anchors;
    const local: V3 | undefined = anc === "push" && a.push ? [a.push[0], 0, a.push[2] - 0.38] : anc === "seat" ? a.seat : anc === "front" ? (a.front ?? [0, 0, inst.info.bounds[2] / 2 + 0.55]) : anc === "behind" ? a.behind : undefined;
    if (!local) return mk;
    const w = toWorld(o.pos, o.yaw, inst.scale, local);
    return { ...mk, p: [w[0], w[2]] as [number, number], yaw: anc === "front" ? o.yaw + Math.PI : o.yaw, seat: anc === "seat" ? w[1] - floorAt(w[0], w[2]) : mk.seat };
  };
  /** a point to reach for: "<obj>:<anchor>", an object id, a POI or a mark */
  const pointAt = (place: Place, name: string | undefined, t: number): V3 | undefined => {
    if (!name) return undefined;
    const [oid, anc] = name.split(":");
    const inst = instById.get(oid);
    if (inst) { const o = objectAt(oid, t); const a = anc ? inst.info.anchors[anc] : undefined; return a ? toWorld(o.pos, o.yaw, inst.scale, a) : [o.pos[0], o.pos[1] + inst.info.bounds[1] * 0.6 * inst.scale, o.pos[2]]; }
    return place.pois[name] ?? (place.marks[name] ? [place.marks[name].p[0], (place.marks[name].y ?? place.floor) + 0.9, place.marks[name].p[1]] : undefined);
  };
  const rideFor = (st: CState): Seg["ride"] => {
    if (!st.on || !instById.has(st.on)) return undefined;
    const id = st.on, t0 = st.onT ?? 0;
    return (tt) => { const a = objectAt(id, t0), b2 = objectAt(id, tt); return { dx: b2.pos[0] - a.pos[0], dz: b2.pos[2] - a.pos[2], dyaw: b2.yaw - a.yaw, px: a.pos[0], pz: a.pos[2] }; };
  };
  const pathOf = (a: [number, number], b: [number, number]) => planPath(built ? navPath(built.nav, a, b) : [a, b]);

  const beatT: number[][] = [];
  const poiOf = (place: Place, name: string | undefined, sceneI: number, at: number): V3 | undefined => {
    if (!name) return undefined;
    if (instById.has(name.split(":")[0])) return pointAt(place, name, at);
    if (place.pois[name]) return place.pois[name];
    const mk = place.marks[name];
    if (mk) return [mk.p[0], (mk.y ?? place.floor) + 1.5, mk.p[1]];
    if (specs[name]) {
      const st = stateAt(sceneI, name, at);
      if (st) return [st.x, st.y + 1.55 * specs[name].scale / 0.92, st.z];
    }
    return undefined;
  };
  const stateAt = (sceneI: number, who: string, at: number): CState | null => {
    const list = segs.get(`${sceneI}|${who}`);
    if (!list?.length) return null;
    let s = list[0];
    for (const x of list) if (x.t0 <= at) s = x;
    return s.to;
  };
  story.scenes.forEach((sc, si) => {
    const S = scenes[si];
    const place = S.place;
    const times: number[] = [];
    // start states
    for (const [who, m] of Object.entries(sc.cast ?? {})) {
      const mk = markAt(place, m.at, S.t0)!;
      const y = mk.y ?? place.floor;
      const posture = m.do === "sit" ? "sit" : m.do === "lie" ? "lie" : "stand";
      const onObj = m.at.endsWith(":seat") && instById.has(m.at.split(":")[0]) ? m.at.split(":")[0] : undefined;
      const st: CState = { x: mk.p[0], z: mk.p[1], y, yaw: mk.yaw ?? 0, posture, seat: mk.seat, bedHead: mk.bed?.head, bedY: mk.bed?.y, on: onObj, onT: S.t0 };
      const act: ActionName = posture === "lie" ? "lie" : "stand";
      if (m.holding) { if (instById.has(m.holding)) evs(m.holding).push({ t0: S.t0, t1: S.t0, kind: "carry", who }); else err(`scene ${si + 1}: ${who} holding "${m.holding}" — not an object of this world`); }
      segs.set(`${si}|${who}`, [{ who, act, t0: S.t0, t1: S.t1, from: st, to: st, face: m.face ?? (posture === "lie" ? "sleep" : "calm"), hold: holdFor(who, act), seed: seedOf(who), floor: floorFn(place), carry: (tt) => !!carriedBy(who, tt), ride: rideFor(st) }]);
    }
    let after = sceneV[si] ?? -1;
    (sc.beats ?? []).forEach((b, bi) => {
      const label = `scene ${si + 1} beat ${bi + 1}`;
      let t = S.t0;
      try { t = T(b.at, `${label} "at"`, after); after = t - offset; } catch (e) { err((e as Error).message); }
      times.push(t);
      if (t < S.t0 - 0.05 || t >= S.t1) err(`${label}: "${b.at}" (${(t - offset).toFixed(2)} s in the VO) is outside its scene — beats must fall inside their scene, in time order`);
      if (b.do && !ACTIONS.includes(b.do)) { err(`${label}: unknown action "${b.do}" (actions: ${ACTIONS.join(", ")})`); return; }
      if (b.face && !FACES.includes(b.face)) err(`${label}: unknown face "${b.face}"`);
      const shotName = typeof b.shot === "string" ? b.shot : b.shot?.type;
      if (shotName && !SHOTS.includes(shotName)) err(`${label}: unknown shot "${shotName}" (shots: ${SHOTS.join(", ")})`);
      for (const k of Object.keys(b.set ?? {})) if (!W.props[k]) err(`${label}: set prop "${k}" does not exist in world "${W.id}" (props: ${Object.keys(W.props).join(", ")})`);
      const isObj = (n?: string) => !!n && instById.has(n.split(":")[0]) && (!n.includes(":") || !!instById.get(n.split(":")[0])!.info.anchors[n.split(":")[1]]);
      if (b.show && !isObj(b.show) && !place.pois[b.show] && !place.marks[b.show] && !specs[b.show]) err(`${label}: show "${b.show}" is not a POI/mark of "${place.id}" or a cast id (POIs: ${Object.keys(place.pois).join(", ")})`);
      if (b.target && !isObj(b.target) && !place.pois[b.target] && !place.marks[b.target] && !specs[b.target]) err(`${label}: target "${b.target}" is not a POI/mark of "${place.id}" or a cast id (POIs: ${Object.keys(place.pois).join(", ")}; marks: ${Object.keys(place.marks).join(", ")})`);
      if (b.move) {
        const inst = instById.get(b.move.obj);
        if (!inst) err(`${label}: move: "${b.move.obj}" is not an object of this world (objects: ${[...instById.keys()].join(", ") || "none"})`);
        else {
          const cur = objectAt(b.move.obj, t);
          let to: V3 | undefined;
          if (Array.isArray(b.move.to)) to = [b.move.to[0], floorAt(b.move.to[0], b.move.to[1]), b.move.to[1]];
          else { const m = place.marks[b.move.to], pp = place.pois[b.move.to]; to = m ? [m.p[0], floorAt(m.p[0], m.p[1]), m.p[1]] : pp ? [pp[0], floorAt(pp[0], pp[2]), pp[2]] : undefined; }
          if (!to) err(`${label}: move.to "${b.move.to}" is not a mark/POI of "${place.id}" (or give [x, z])`);
          else { evs(b.move.obj).push({ t0: t, t1: t + (b.move.dur ?? 3), kind: "move", from: cur.pos, to, yaw0: cur.yaw, yaw1: b.move.yaw ?? cur.yaw }); objSfx.push({ t, name: "roll", dur: b.move.dur ?? 3 }); }
        }
      }
      if (!b.do) return;
      const whos = list(b.who).length ? list(b.who) : S.cast.slice(0, 1);
      if (!whos.length) { err(`${label}: "${b.do}" but nobody is in this scene (add scene.cast)`); return; }
      for (const who of whos) {
        const key = `${si}|${who}`;
        const L = segs.get(key);
        if (!L) { err(`${label}: ${who} is not in this scene's cast (add "${who}": { "at": <mark> } to scene.cast)`); continue; }
        const prev = L[L.length - 1];
        prev.t1 = Math.min(prev.t1, t);
        let from: CState = { ...prev.to };
        // a walk still under way when the next beat starts: stop where they are
        if (prev.path && prev.moveT1 !== undefined && t < prev.moveT1) {
          const w = walkState(prev.path, t, prev.moveT0!, prev.moveT1, 0.4, 0.6, 1.15, 0.85);
          from = { ...from, x: w.p[0], z: w.p[1], yaw: w.yaw };
          prev.to = from;
          prev.moveT1 = t;
          warnings.push(`${label}: ${who} had not finished walking — stopped mid-way`);
        }
        const need = NEEDS[b.do];
        if (need && !need.includes(from.posture)) { err(`${label}: ${who} cannot "${b.do}" while ${from.posture === "sit" ? "sitting (standUp first)" : from.posture === "lie" ? "lying (sitUp/wake first, or start the scene standing)" : from.posture === "bedsit" ? "sitting up in bed" : "standing"}`); continue; }
        const target = poiOf(place, b.target, si, t);
        const faceName = b.face ?? DEFAULT_FACE[b.do] ?? "calm";
        const mk = b.to ? markAt(place, b.to, t) : undefined;
        if (b.to && !mk) { err(`${label}: mark "${b.to}" is not in place "${place.id}" (marks: ${Object.keys(place.marks).join(", ")})`); continue; }
        // a phone in hand as the scene opens is already up at the cut (raising it takes 0.7 s)
        const mkSeg = (act: ActionName, t0: number, to: CState, extra: Partial<Seg> = {}): Seg => ({ who, act, t0: act === "phone" && t0 < S.t0 + 0.35 ? t0 - 0.7 : t0, t1: S.t1, from, to, target, face: faceName, hold: holdFor(who, act), seed: seedOf(who) + bi, floor: floorFn(place), carry: (tt) => !!carriedBy(who, tt), ride: rideFor(to), ...extra });
        if (b.do === "push") {
          const oid = b.obj ?? b.target ?? "";
          const inst = instById.get(oid);
          if (!inst || !inst.info.anchors.push) { err(`${label}: push needs "obj": an object with handles (pushable here: ${[...instById.values()].filter((i) => i.info.anchors.push).map((i) => i.id).join(", ") || "none"})`); continue; }
          if (!mk) { err(`${label}: push needs "to": the mark to walk to while pushing`); continue; }
          const grip = markAt(place, `${oid}:push`, t)!;
          let t1 = t;
          if (Math.hypot(grip.p[0] - from.x, grip.p[1] - from.z) > 0.35) {
            const path0 = pathOf([from.x, from.z], grip.p), d0 = path0.length / WALK + 0.8;
            const at0: CState = { ...from, x: grip.p[0], z: grip.p[1], yaw: grip.yaw ?? from.yaw, posture: "stand" };
            L.push(mkSeg("walk", t, at0, { path: path0, moveT0: t, moveT1: t + d0, face: "calm", target: undefined }));
            from = at0; t1 = t + d0;
          }
          const D = 0.38 - inst.info.anchors.push[2] * inst.scale;
          const path = planPath([[from.x, from.z], ...(built ? navPath(built.nav, [from.x + Math.sin(from.yaw) * 0.3, from.z + Math.cos(from.yaw) * 0.3], mk.p).slice(1) : [mk.p])] as [number, number][]);
          const next = nextBeatT(sc, bi, who, cues, offset, S.t1, t - offset);
          let dur = path.length / 0.85 + 1.0;
          if (dur > next - t1 - 0.2) dur = Math.max(path.length / 1.3 + 0.6, next - t1 - 0.2);
          const ed = path.at(path.length).dir;
          const arrive: CState = { ...from, x: mk.p[0], z: mk.p[1], yaw: Math.atan2(ed[0], ed[1]), posture: "stand" };
          const pseg = mkSeg("push", t1, arrive, { path, moveT0: t1, moveT1: t1 + dur, face: faceName, target: undefined });
          const a = inst.info.anchors.push;
          pseg.hands = (tt) => {
            const w = Math.min(1, Math.max(0, (tt - t1 + 0.35) / 0.35)) * (1 - Math.min(1, Math.max(0, (tt - t1 - dur - 0.2) / 0.4)));
            if (w <= 0) return null;
            const o = objectAt(oid, tt);
            return { L: toWorld(o.pos, o.yaw, inst.scale, [a[0] + 0.22, a[1], a[2]]), R: toWorld(o.pos, o.yaw, inst.scale, [a[0] - 0.22, a[1], a[2]]), w };
          };
          evs(oid).push({ t0: t1, t1: t1 + dur, kind: "push", seg: pseg, d: D });
          objSfx.push({ t: t1 + 0.2, name: "roll", dur: dur - 0.3 });
          L.push(pseg);
          continue;
        }
        if (b.do === "walk" || b.do === "run" || (b.do === "sit" && mk && Math.hypot(mk.p[0] - from.x, mk.p[1] - from.z) > 0.3)) {
          const dest = mk ?? (b.do === "sit" ? undefined : undefined);
          if (!dest) { err(`${label}: "${b.do}" needs "to": a mark name`); continue; }
          const run = b.do === "run";
          const path = pathOf([from.x, from.z], dest.p);
          const next = nextBeatT(sc, bi, who, cues, offset, Infinity, t - offset);
          let dur = path.length / (run ? RUN : WALK) + (run ? 0.6 : 0.9);
          const room = next - t - (b.do === "sit" ? 1.3 : 0.2);
          // no later beat for this person in the scene: walk at a natural pace, the cut takes us away
          if (dur > room && Number.isFinite(next)) {
            const fast = path.length / (run ? RUN_MAX : WALK_MAX) + 0.6;
            if (fast > room) warnings.push(`${label}: ${who} needs ${dur.toFixed(1)} s to ${run ? "run" : "walk"} to "${b.to}" but has ${Math.max(0, room).toFixed(1)} s — the walk will be cut short`);
            dur = Math.max(fast, Math.min(dur, room));
          }
          const endYaw = dest.yaw ?? yawTo(dest.p[0], dest.p[1], target ?? [dest.p[0] + Math.sin(from.yaw), 0, dest.p[1] + Math.cos(from.yaw)]);
          const arrive: CState = { x: dest.p[0], z: dest.p[1], y: dest.y ?? place.floor, yaw: target && dest.yaw === undefined ? yawTo(dest.p[0], dest.p[1], target) : endYaw, posture: "stand", seat: dest.seat, bedHead: dest.bed?.head, bedY: dest.bed?.y };
          const walkSeg = mkSeg(run ? "run" : "walk", t, arrive, { path, moveT0: t, moveT1: t + dur, face: b.do === "sit" ? "calm" : faceName });
          L.push(walkSeg);
          if (b.do === "sit") {
            from = arrive;
            const on = b.to?.endsWith(":seat") && instById.has(b.to.split(":")[0]) ? b.to.split(":")[0] : undefined;
            const sat: CState = { ...arrive, posture: "sit", on, onT: t + dur };
            L.push(mkSeg("sit", t + dur, sat, { ride: rideFor(sat) }));
          }
          continue;
        }
        let to: CState = { ...from };
        if (b.do === "sit") {
          const here = mk ?? Object.values(place.marks).find((m) => Math.hypot(m.p[0] - from.x, m.p[1] - from.z) < 0.35 && m.seat !== undefined);
          if (!here || here.seat === undefined) { err(`${label}: ${who} can only sit at a mark with a seat ("to": ${Object.entries(place.marks).filter(([, m]) => m.seat !== undefined).map(([k]) => `"${k}"`).join(" / ") || "none here"})`); continue; }
          const on = b.to?.endsWith(":seat") && instById.has(b.to.split(":")[0]) ? b.to.split(":")[0] : undefined;
          to = { ...from, x: here.p[0], z: here.p[1], yaw: here.yaw ?? from.yaw, posture: "sit", seat: here.seat, on, onT: t };
        } else if (b.do === "standUp") {
          to = { ...from, posture: "stand", x: from.x + Math.sin(from.yaw) * 0.22, z: from.z + Math.cos(from.yaw) * 0.22 };
        } else if (b.do === "sitUp") {
          to = { ...from, posture: "bedsit" };
        } else if (b.do === "turn") {
          to = { ...from, yaw: target ? yawTo(from.x, from.z, target) : mk?.yaw ?? from.yaw + Math.PI };
        } else if (b.do === "look" && target && from.posture === "stand") {
          let rel = yawTo(from.x, from.z, target) - from.yaw;
          while (rel > Math.PI) rel -= Math.PI * 2;
          while (rel < -Math.PI) rel += Math.PI * 2;
          if (Math.abs(rel) > 1.25) to = { ...from, yaw: from.yaw + rel - Math.sign(rel) * 0.9 };
        }
        if (b.do === "look" && to.yaw !== from.yaw) {
          L.push(mkSeg("turn", t, to));
          continue;
        }
        if (b.do === "pickUp" || b.do === "putDown" || b.do === "give" || b.do === "open" || b.do === "close") {
          let pt: V3 | undefined;
          if (b.do === "pickUp") {
            const oid = b.obj ?? b.target ?? "";
            const inst = instById.get(oid);
            if (!inst) { err(`${label}: pickUp needs "obj": an object id (objects: ${[...instById.keys()].join(", ") || "none"})`); continue; }
            if (!inst.info.hand && inst.info.bounds[1] * inst.scale > 0.6) warnings.push(`${label}: "${oid}" is big for one hand (${inst.info.bounds.map((v) => v.toFixed(2)).join("×")} m)`);
            pt = pointAt(place, oid, t);
            if (pt && Math.hypot(pt[0] - from.x, pt[2] - from.z) > 1.3) { err(`${label}: ${who} is ${Math.hypot(pt[0] - from.x, pt[2] - from.z).toFixed(1)} m from "${oid}" — walk to "${oid}:front" first`); continue; }
            evs(oid).push({ t0: t + 0.55, t1: t + 0.55, kind: "carry", who });
          } else if (b.do === "putDown") {
            const oid = b.obj ?? carriedBy(who, t + 0.7);
            if (!oid) { err(`${label}: ${who} is not carrying anything to put down`); continue; }
            pt = pointAt(place, b.target, t);
            if (!pt) { err(`${label}: putDown needs "target": where to put it ("<object>:top", a POI or a mark)`); continue; }
            const tp = Math.max(t + 0.55, ...(objEv.get(oid) ?? []).map((e) => e.t0 + 0.35));
            evs(oid).push({ t0: tp, t1: tp, kind: "place", to: [pt[0], pt[1], pt[2]], yaw1: from.yaw });
          } else if (b.do === "give") {
            const oid = b.obj ?? carriedBy(who, t + 0.7);
            const to2 = b.target && specs[b.target] ? b.target : undefined;
            if (!oid || !to2) { err(`${label}: give needs "target": the person, and ${who} must carry something (or "obj")`); continue; }
            const RL = segs.get(`${si}|${to2}`);
            if (!RL) { err(`${label}: ${to2} is not in this scene`); continue; }
            const rst = stateAt(si, to2, t)!;
            pt = [(from.x + rst.x) / 2, from.y + 1.0, (from.z + rst.z) / 2];
            const rprev = RL[RL.length - 1];
            rprev.t1 = Math.min(rprev.t1, t);
            RL.push({ who: to2, act: "receive", t0: t + 0.15, t1: S.t1, from: rst, to: rst, target: pt, face: "smile", hold: holdFor(to2, "receive"), seed: seedOf(to2) + bi, carry: (tt) => !!carriedBy(to2, tt), ride: rideFor(rst) });
            const tg = Math.max(t + 0.75, ...(objEv.get(oid) ?? []).map((e) => e.t0 + 0.35));
            evs(oid).push({ t0: tg, t1: tg, kind: "carry", who: to2 });
          } else {
            const door = b.obj ?? b.target ?? "";
            if (!W.props[door]) { err(`${label}: ${b.do} needs a door / openable prop (here: ${Object.keys(W.props).join(", ")})`); continue; }
            pt = place.pois[door] ? [place.pois[door][0], place.floor + 1.0, place.pois[door][2]] : undefined;
            if (pt && Math.hypot(pt[0] - from.x, pt[2] - from.z) > 0.95) warnings.push(`${label}: ${who} is ${Math.hypot(pt[0] - from.x, pt[2] - from.z).toFixed(1)} m from "${door}" — the hand cannot reach it; stand at a mark ≤ 0.8 m in front of it`);
            extraSets.push({ k: door, t: t + 0.45, v: b.do === "open" ? 1 : 0, fade: 0.9 });
          }
          L.push(mkSeg(b.do, t, to, { target: pt }));
          continue;
        }
        if (b.do === "binoculars" && props[who] !== "binoculars") err(`${label}: ${who} needs "prop": "binoculars" in story.cast`);
        if (b.do === "phone" && props[who] !== "phone") err(`${label}: ${who} needs "prop": "phone" in story.cast`);
        if (b.do === "raise" && props[who] !== "lantern" && props[who] !== "flashlight") err(`${label}: "raise" needs a lantern or flashlight prop for ${who}`);
        if (b.do === "write" && target && Math.hypot(target[0] - from.x, target[2] - from.z) > 0.62) warnings.push(`${label}: ${who} sits ${Math.hypot(target[0] - from.x, target[2] - from.z).toFixed(2)} m from "${b.target}" — the hand cannot reach it (insert shows no hand); put that anchor ≤ 0.3 m from the desk edge or the seat closer`);
        // aiming a light / pointing at something behind or beside: turn the body toward it first
        if ((b.do === "raise" || b.do === "point") && target && from.posture === "stand") {
          let rel = yawTo(from.x, from.z, target) - from.yaw;
          while (rel > Math.PI) rel -= Math.PI * 2;
          while (rel < -Math.PI) rel += Math.PI * 2;
          if (Math.abs(rel) > 0.5) {
            const turned: CState = { ...from, yaw: from.yaw + rel * 0.85 };
            L.push(mkSeg("turn", t, turned));
            from = turned;
            L.push(mkSeg(b.do, t + 0.55, turned));
            continue;
          }
        }
        L.push(mkSeg(b.do, t, to));
      }
    });
    beatT.push(times);
  });
  if (errs.length) throw new Error(errs.join("\n"));
  // the same hand gesture over and over reads as a tic: thinking again within 12 s keeps the hand down
  {
    const last = new Map<string, number>();
    for (const sg of [...segs.values()].flat().filter((x) => x.act === "think").sort((a, b) => a.t0 - b.t0)) {
      const l = last.get(sg.who);
      if (l !== undefined && sg.t0 - l < 12) sg.again = true;
      else last.set(sg.who, sg.t0);
    }
  }
  function holdFor(who: string, act: ActionName): HoldKind | null {
    const p = props[who];
    if (act === "write") return "pen";
    if (p === "binoculars") return act === "binoculars" ? "binoculars" : null;
    if (p === "lantern" || p === "flashlight" || p === "mug" || p === "book") return p;
    return null;
  }
  const voenv = story.voenv ?? [];
  const talk = (t: number) => voenv[Math.max(0, Math.min(voenv.length - 1, Math.round((t - offset) * 60)))] ?? 0;
  const cache = new Map<string, Pose | null>();
  const sceneAt = (t: number) => { let s = scenes[0]; for (const x of scenes) if (x.t0 <= t) s = x; return s; };
  const poseOf = (who: string, t: number): Pose | null => {
    const key = `${who}@${t.toFixed(4)}`;
    if (cache.has(key)) return cache.get(key)!;
    if (cache.size > 4000) cache.clear();
    const S = sceneAt(t);
    const L = segs.get(`${S.i}|${who}`);
    let p: Pose | null = null;
    if (L) {
      let i = 0;
      for (let k = 0; k < L.length; k++) if (L[k].t0 <= t) i = k;
      const c = specs[who];
      p = actPose({ seg: L[i], t, c, talk });
      const u = t - L[i].t0;
      if (i > 0 && u < BLEND && L[i].act !== "walk" && L[i].act !== "run") {
        const q = actPose({ seg: L[i - 1], t, c, talk });
        p = blend(q, p, ease(u / BLEND));
      }
      if (L[i].hold && !p.hold) p.hold = { kind: L[i].hold!, side: L[i].hold === "mug" || L[i].hold === "book" ? 1 : -1, on: 1 };
      if (L[i].hold === "pen" && p.hold) p.hold = { ...p.hold, kind: "pen" };
    }
    cache.set(key, p);
    return p;
  };
  poseRef = poseOf;
  // smoothed subjects for cameras
  const subject = (who: string): Subject => {
    const c = specs[who];
    const root = (t: number): V3 => { const p = poseOf(who, t); return p ? [p.x, p.y + (p.hipY > -0.3 ? 0 : 0), p.z] : [0, 0, 0]; };
    // smoothing never reaches into another scene (the person may be somewhere else entirely)
    const within = (t: number, d: number) => { const S = sceneAt(t); return Math.min(S.t1 - 0.002, Math.max(S.t0, t + d)); };
    const sm = (t: number): V3 => {
      let x = 0, y = 0, z = 0;
      for (const d of [-0.3, -0.15, 0, 0.15, 0.3]) { const r = root(within(t, d)); x += r[0]; y += r[1]; z += r[2]; }
      return [x / 5, y / 5, z / 5];
    };
    const eye = (t: number) => { const p = poseOf(who, t); return p ? eyeExact(p, c) : { pos: [0, 1.6, 0] as V3, dir: [0, 0, 1] as V3, head: [0, 1.6, 0] as V3 }; };
    return {
      pos: (t) => { const s = sceneAt(t); const p = poseOf(who, t); const floor = s.place.marks && p ? p.y : 0; return [sm(t)[0], floor, sm(t)[2]]; },
      head: (t) => { const e = eye(t); const s = sm(t); const r = root(t); return [e.head[0] + (s[0] - r[0]), e.head[1], e.head[2] + (s[2] - r[2])]; },
      yaw: (t) => { let a = 0, b = 0; for (const d of [-0.3, 0, 0.3]) { const p = poseOf(who, within(t, d)); if (p) { a += Math.sin(p.yaw); b += Math.cos(p.yaw); } } return Math.atan2(a, b); },
      eye: (t) => { const e = eye(t); return { pos: e.pos, dir: e.dir }; },
      hand: (t) => { const p = poseOf(who, t); return p ? fromChest(p, [-0.15, -0.15, 0.35], c) : [0, 1, 0]; },
      // where phoneArm holds the phone (also while it is still being raised: the camera waits there)
      phone: (t) => { const p = poseOf(who, t); return p ? fromChest(p, [-0.05, 0.1, 0.33], c) : [0, 1, 0]; },
    };
  };

  // ── 3. shots ───────────────────────────────────────────────────────────────
  const shots: ShotP[] = [];
  story.scenes.forEach((sc, si) => {
    const S = scenes[si];
    const beats = sc.beats ?? [];
    type Cut = { t: number; b?: Beat; bi: number };
    // only beats that change what we should see make a cut (set/ui/sfx-only beats play inside the shot)
    const cuts: Cut[] = [{ t: S.t0, bi: -1 }];
    beats.forEach((b, bi) => {
      if (!(b.do || b.show || b.shot || b.hit)) return;
      if (cuts.length === 1 && cuts[0].bi < 0 && beatT[si][bi] < S.t0 + 1.4) { cuts[0] = { t: S.t0, b, bi }; return; }
      const vt = beatT[si][bi] - offset;
      const ct = Math.max(S.t0 + 0.6, cues.cutFor(vt) + offset);
      if (ct - cuts[cuts.length - 1].t < 0.9 && !b.shot && !b.hit) return; // too close: plays inside the previous shot
      cuts.push({ t: Math.min(ct, beatT[si][bi]), b, bi });
    });
    const firstVisit = !scenes.slice(0, si).some((x) => x.place.id === S.place.id);
    // the framing before the cut, also across a scene cut within the same place (same person, same framing = a jump)
    const before = shots[shots.length - 1];
    let prev: ShotName | undefined = before && scenes[before.scene].place.id === S.place.id && before.who === S.cast[0] ? before.kind : undefined;
    // when this person's last close-up ended (portrait: a face again and again tells nothing new)
    const lastCu = (w: string) => { for (let i = shots.length - 1; i >= 0; i--) if (shots[i].who === w && (shots[i].kind === "cu" || shots[i].kind === "ecu")) return shots[i].t1; return -99; };
    cuts.forEach((c, ci) => {
      const t0 = c.t, t1 = ci + 1 < cuts.length ? cuts[ci + 1].t : S.t1;
      if (t1 - t0 < 0.05) return;
      const b = c.b;
      const who = b ? (list(b.who)[0] ?? (b.show && specs[b.show] ? b.show : S.cast[0])) : S.cast[0];
      const tgtName = b?.show && !specs[b.show] ? b.show : b?.target;
      let kind: ShotName;
      const forced = b ? (typeof b.shot === "string" ? b.shot : b.shot?.type) : undefined;
      kind = forced ?? choose(b, ci === 0 && firstVisit, S, prev, tgtName, who || tgtName ? poiOf(S.place, tgtName, si, t0) : undefined, who ? subject(who).head(t0) : undefined, format === "portrait");
      // portrait: a reaction close-up only when the last one of this face ended ≥ 4 s ago (a startle keeps its own)
      const spaced = !forced && format === "portrait" && !!who && !["startle", "freeze"].includes(b?.do ?? "") && t0 - lastCu(who) < 4;
      if (spaced && kind === "cu") kind = "medium";
      if (!forced && kind === prev) kind = spaced && ALT[kind] === "cu" ? "mediumWide" : ALT[kind];
      const parts: [number, number, ShotName][] = [];
      // long shots get a second angle in a VO pause near the middle
      if (!forced && t1 - t0 > 5.6) {
        const mid = (t0 + t1) / 2 - offset;
        const p = cues.pauses.map((x) => (x[0] + x[1]) / 2).filter((x) => x + offset > t0 + 2 && x + offset < t1 - 2).sort((a, b2) => Math.abs(a - mid) - Math.abs(b2 - mid))[0];
        if (p !== undefined) {
          const second = kind === "ots" && tgtName ? "long" : ALT[kind] === kind ? "medium" : ALT[kind];
          parts.push([t0, p + offset, kind], [p + offset, t1, second]);
        }
      }
      if (!parts.length) parts.push([t0, t1, kind]);
      for (const [a, z, k] of parts) {
        const spec = b && typeof b.shot === "object" ? b.shot : undefined;
        const subjWho = spec?.subject ?? (k === "long" && !who ? undefined : who);
        const tgt = spec?.target ?? tgtName;
        const side: 1 | -1 = spec?.side === "left" ? 1 : spec?.side === "right" ? -1 : (shots.length % 2 ? 1 : -1);
        const target = tgt ? (specs[tgt] && tgt !== subjWho ? (t: number) => subject(tgt).head(t) : (() => { const p = poiOf(S.place, tgt, si, a); return p ? () => p : undefined; })()) : undefined;
        const other = tgt && specs[tgt] && tgt !== subjWho ? tgt : S.cast.find((x) => x !== subjWho);
        const others = S.cast.filter((x) => x !== subjWho && x !== tgt);
        // inserts frame the handled thing by its size: a sheet of paper close, a basket on a scale further back
        const sizeOf = (id?: string) => { const i = id ? instById.get(id) : undefined; return i ? Math.max(...i.info.bounds) * i.scale : 0; };
        const size = k === "insert" ? Math.max(sizeOf(tgt && !tgt.includes(":") ? tgt : undefined), sizeOf(subjWho ? carriedBy(subjWho, (a + z) / 2) : undefined)) : 0;
        const ctx: ShotCtx = { kind: k, t0: a, t1: z, place: S.place, subj: subjWho && specs[subjWho] && S.cast.includes(subjWho) ? subject(subjWho) : undefined, subj2: other ? subject(other) : undefined, target, side, mood: S.mood, fov: spec?.fov === undefined ? undefined : format === "portrait" ? portraitFov(spec.fov) : spec.fov, seed: shots.length * 3.1, size, aspect, phone: b?.do === "phone",
          others: others.length ? (tt: number) => others.map((o) => { const p = poseOf(o, tt); return p ? ([p.x, p.y, p.z] as V3) : ([0, -99, 0] as V3); }) : undefined };
        shots.push({ t0: a, t1: z, scene: si, kind: k, who: subjWho, target: tgt, ctx, forced: !!forced });
        prev = k;
      }
    });
  });
  // pacing: a long static hold tells nothing new on a phone — split it into a second framing (portrait
  // > 4.6 s, landscape > 6.4 s; moving shots may run longer), cutting in a VO pause when there is one
  const MAXS = format === "portrait" ? 4.6 : 6.4;
  const MOVING: ShotName[] = ["track", "lead", "push", "pull", "orbit", "reveal", "drone"];
  for (let i = 0; i < shots.length; i++) {
    const sh = shots[i], lim = MOVING.includes(sh.kind) ? MAXS * 1.5 : MAXS;
    if (sh.t1 - sh.t0 <= lim) continue;
    const n = Math.ceil((sh.t1 - sh.t0) / lim), step = (sh.t1 - sh.t0) / n;
    const cutsAt: number[] = [];
    for (let k = 1; k < n; k++) {
      const want = sh.t0 + step * k;
      const pz = cues.pauses.map((x) => (x[0] + x[1]) / 2 + offset).filter((x) => x > sh.t0 + 1.6 && x < sh.t1 - 1.6 && Math.abs(x - want) < step * 0.4).sort((a, b) => Math.abs(a - want) - Math.abs(b - want))[0];
      cutsAt.push(pz ?? want);
    }
    const bounds = [sh.t0, ...cutsAt, sh.t1];
    const pieces: ShotP[] = [];
    for (let k = 0; k + 1 < bounds.length; k++) {
      // forced framings keep their type and change side (a forced face framing alternates too: the same face from
      // the other side is a jump cut); automatic ones alternate with their ALT framing
      const keep = sh.forced && !FACE.includes(sh.kind) && sh.kind !== "insert";
      const kind = keep || k % 2 === 0 ? sh.kind : ALT[sh.kind] === sh.kind ? "medium" : ALT[sh.kind];
      const side = (k % 2 ? -sh.ctx.side : sh.ctx.side) as 1 | -1;
      pieces.push({ ...sh, t0: bounds[k], t1: bounds[k + 1], kind, ctx: { ...sh.ctx, kind, t0: bounds[k], t1: bounds[k + 1], side, seed: sh.ctx.seed + k * 1.7 } });
    }
    shots.splice(i, 1, ...pieces);
    i += pieces.length - 1;
  }
  // a flash of a shot (< 0.85 s) reads as a glitch: fold it into the shot before it (same scene, not forced)
  for (let i = shots.length - 1; i > 0; i--) {
    const s = shots[i], p = shots[i - 1];
    if (s.t1 - s.t0 < 0.85 && !s.forced && p.scene === s.scene) { p.t1 = s.t1; p.ctx.t1 = s.t1; shots.splice(i, 1); }
  }
  // a phone insert opens on the screen: the phone comes up (0.7 s) just before the cut, in the shot before, instead of
  // the insert opening on a shoulder while it rises
  for (const sh of shots) {
    if (sh.kind !== "insert" || !sh.ctx.phone || !sh.who) continue;
    const L = segs.get(`${sh.scene}|${sh.who}`) ?? [];
    const i = L.findIndex((sg) => sg.act === "phone" && sg.t0 > sh.t0 - 0.7 && sg.t0 >= sh.t0 - 0.25 && sg.t0 < sh.t1);
    if (i < 0) continue;
    L[i].t0 = Math.max(sh.t0 - 0.7, i > 0 ? L[i - 1].t0 + 0.4 : -Infinity);
    cache.clear();
  }
  const shotAt = (t: number) => { let s = shots[0]; for (const x of shots) if (x.t0 <= t) s = x; return s; };
  {
    // storytelling: the script's own story first — an explainer studio or one graphic object repeated over
    // many scenes tells the viewer nothing new
    const studioT = scenes.filter((x) => x.place.kind === "studio").reduce((a, x) => a + (x.t1 - x.t0), 0);
    const storyT = Math.max(1, scenes.reduce((a, x) => a + (x.t1 - x.t0), 0));
    if (studioT / storyT > 0.25) warnings.push(`pacing: the "mind" studio fills ${Math.round((100 * studioT) / storyT)} % of the film — visualise the script's own places, objects and people for the explanation (use the studio only where the script is about the brain / thoughts)`);
    let run = 1;
    for (let i = 1; i < shots.length; i++) {
      const a = shots[i - 1], b2 = shots[i];
      const same = a.target && a.target === b2.target && !a.who && !b2.who;
      run = same ? run + 1 : 1;
      if (run === 4) warnings.push(`pacing: "${b2.target}" is the only thing on screen for 4+ shots in a row from ${shots[i - 3].t0.toFixed(1)} s — show other parts of the story there`);
    }
    // people holding one pose for long with nothing new: add a reaction / gesture beat
    for (const sc of scenes) for (const who of sc.cast) {
      const held = shots.filter((x) => x.scene === sc.i && x.who === who).reduce((a, x) => a + (x.t1 - x.t0), 0);
      const beatsOf = (story.scenes[sc.i].beats ?? []).filter((b) => b.do && (list(b.who).length ? list(b.who).includes(who) : true)).length;
      if (held > 9 && beatsOf <= 1) warnings.push(`pacing: ${who} is on screen ${held.toFixed(0)} s in scene ${sc.i + 1} with ${beatsOf} action — add reactions / gestures on the words (look, turn, sigh, startle, reach…)`);
    }
  }

  // ── 4. set state ───────────────────────────────────────────────────────────
  type Key = { t: number; v: number; fade: number };
  const keys: Record<string, Key[]> = {};
  for (const [k, d] of Object.entries(W.props)) keys[k] = [{ t: -1, v: d.default, fade: 0 }];
  story.scenes.forEach((sc, si) => {
    for (const [k, v] of Object.entries(sc.set ?? {})) {
      if (!keys[k]) { err(`scene ${si + 1}: set prop "${k}" does not exist in world "${W.id}" (props: ${Object.keys(W.props).join(", ")})`); continue; }
      keys[k].push({ t: scenes[si].t0, v, fade: 0 });
    }
    (sc.beats ?? []).forEach((b, bi) => {
      for (const [k, v] of Object.entries(b.set ?? {})) if (keys[k]) keys[k].push({ t: beatT[si][bi], v, fade: b.fade ?? 0.6 });
    });
  });
  for (const e of extraSets) if (keys[e.k]) keys[e.k].push({ t: e.t, v: e.v, fade: e.fade });
  for (const k of Object.keys(keys)) keys[k].sort((a, b) => a.t - b.t);
  const setAt = (t: number): SetState => {
    const out: SetState = {};
    for (const [k, L] of Object.entries(keys)) {
      let v = L[0].v;
      for (let i = 1; i < L.length; i++) {
        if (L[i].t > t) break;
        const prevV = v;
        v = L[i].fade > 0 ? prevV + (L[i].v - prevV) * ease((t - L[i].t) / L[i].fade) : L[i].v;
      }
      out[k] = v;
    }
    return out;
  };

  // ── 5. UI, cards ───────────────────────────────────────────────────────────
  const ui: UiP[] = [];
  story.scenes.forEach((sc, si) => {
    (sc.beats ?? []).forEach((b, bi) => {
      for (const u of list(b.ui)) {
        const t0 = beatT[si][bi];
        let t1 = bi + 1 < (sc.beats ?? []).length ? beatT[si][bi + 1] : scenes[si].t1;
        if (b.until !== undefined) { try { t1 = T(b.until, `scene ${si + 1} beat ${bi + 1} "until"`, t0 - offset); } catch (e) { err((e as Error).message); } }
        if (u.type === "callout" && !scenes[si].place.pois[u.poi] && !specs[u.poi]) err(`scene ${si + 1} beat ${bi + 1}: callout poi "${u.poi}" is not a POI of "${scenes[si].place.id}"`);
        ui.push({ t0, t1: Math.min(t1, scenes[si].t1), ui: u, scene: si });
      }
    });
  });
  // portrait: a face filling the frame leaves no room for a title / stamp / card — use a waist-up framing while
  // such text is on screen (not for forced shots)
  if (format === "portrait") {
    const big = ui;
    for (const sh of shots) {
      if (sh.forced || (sh.kind !== "cu" && sh.kind !== "ecu")) continue;
      const covered = big.filter((u) => ["title", "stamp", "card", "clock", "steps"].includes(u.ui.type)).reduce((a2, u) => a2 + Math.max(0, Math.min(u.t1, sh.t1) - Math.max(u.t0, sh.t0)), 0);
      if (covered > 0.5 * (sh.t1 - sh.t0)) { sh.kind = "medium"; sh.ctx = { ...sh.ctx, kind: "medium" }; }
    }
  }
  // the same face (or the same hands' insert) in the same framing twice in a row (across beats and scenes) is a jump
  // cut: the automatic one of the two changes to a framing neither neighbour has
  for (let i = 1; i < shots.length; i++) {
    const a = shots[i - 1], b = shots[i];
    if (!b.who || a.who !== b.who || a.kind !== b.kind || !(FACE.includes(b.kind) || b.kind === "insert")) continue;
    // both forced: the later one changes (two forced close-ups of one face in a row are a jump cut too)
    const j = !b.forced ? i : !a.forced ? i - 1 : i;
    const sh = shots[j], near = [shots[j - 1], shots[j + 1]].filter((x) => x && x.who === sh.who).map((x) => x.kind);
    const kind = (sh.kind === "cu" || sh.kind === "ecu" || sh.kind === "insert" ? ["medium", "mediumWide"] : ["mediumWide", "cu"] as ShotName[]).find((k) => !near.includes(k as ShotName)) as ShotName | undefined;
    if (kind) { sh.kind = kind; sh.ctx = { ...sh.ctx, kind }; }
  }
  // a hand at the chin in a close-up covers the face: thinking inside a cu / ecu is played with the head only
  for (const sh of shots) {
    if (!sh.who || (sh.kind !== "cu" && sh.kind !== "ecu")) continue;
    for (const sg of segs.get(`${sh.scene}|${sh.who}`) ?? []) if (sg.act === "think" && sg.t0 + 2.8 > sh.t0 && sg.t0 < sh.t1) sg.again = true;
  }
  cache.clear();
  if (errs.length) throw new Error(errs.join("\n"));
  const card = (c: { at: Beat["at"]; until?: Beat["at"] } | undefined, dflt: number) => {
    if (!c) return undefined;
    const t0 = T(c.at, "card");
    return { t0, t1: c.until !== undefined ? T(c.until, "card until", t0 - offset) : t0 + dflt };
  };
  const tc = card(story.titleCard, 3.5), dc = card(story.disclaimer, 4);
  // portrait: the title card sits across the middle of the frame — over a close-up it covers the eyes; hold waist-up
  if (format === "portrait" && tc) for (let i = 0; i < shots.length; i++) {
    const sh = shots[i];
    if (sh.forced || (sh.kind !== "cu" && sh.kind !== "ecu") || Math.min(tc.t1, sh.t1) - Math.max(tc.t0, sh.t0) <= 0.5 * (sh.t1 - sh.t0)) continue;
    const near = [shots[i - 1], shots[i + 1]].filter((x) => x && x.who === sh.who).map((x) => x.kind);
    const kind: ShotName = near.includes("medium") ? "mediumWide" : "medium";
    sh.kind = kind; sh.ctx = { ...sh.ctx, kind };
  }
  const endCard = { t0: voEndT + tail, t1: duration, text: story.endCard?.text ?? story.title, sub: story.endCard?.sub };
  // branding is the user's own and optional (voynann-brand.json, resolved by make.mjs): never invented
  const B = story.brand;
  const brand: BrandP | undefined = B ? { name: B.brand, handle: B.handle, cta: B.cta, accent: B.colors?.accent, logo: B.logoFile, watermark: B.watermark, intro: B.intro && offset >= 0.9 ? { t0: 0, t1: Math.min(offset, B.intro.seconds ?? offset) } : undefined } : undefined;
  if (B?.intro && offset < 0.9) warnings.push(`brand intro needs the VO to start ≥ 0.9 s in (vo.offset is ${offset}) — skipped`);
  // burned-in captions: short phrases (portrait ≤ 4 words / 26 characters a line), cut at punctuation and pauses
  const captions: CaptionP[] = [];
  const capOn = story.captions ? story.captions === "burn" : format === "portrait";
  if (capOn) {
    const maxW = format === "portrait" ? 4 : 7, maxC = format === "portrait" ? 26 : 42;
    let cur: CaptionP["words"] = [];
    const flush = () => { if (cur.length) captions.push({ t0: cur[0].t0, t1: cur[cur.length - 1].t1, words: cur }); cur = []; };
    const Ws = story.words as Word[];
    Ws.forEach((w, i) => {
      const word = { w: w[0].replace(/^["“]|["”]$/g, ""), t0: w[1] + offset, t1: w[2] + offset };
      const chars = cur.reduce((a, x) => a + x.w.length + 1, 0) + word.w.length;
      if (cur.length && (cur.length >= maxW || chars > maxC)) flush();
      cur.push(word);
      const next = Ws[i + 1];
      if (/[.?!…,;:]["”]?$/.test(w[0]) || (next && next[1] - w[2] > 0.45)) flush();
    });
    flush();
    // hold each line until the next one starts (short gaps), never into the end card
    captions.forEach((c, i) => { const n = captions[i + 1]; c.t1 = Math.min(n ? Math.min(n.t0, c.t1 + 0.6) : c.t1 + 0.6, voEndT + tail); });
  }

  // ── 6. look ────────────────────────────────────────────────────────────────
  const grade = (t: number): Grade => {
    const S = sceneAt(t);
    let g = gradeFor(S.mood, S.dark, S.place.kind === "interior", S.place.kind === "studio", format === "portrait");
    // transitions around scene starts
    const i = S.i, inT = t - S.t0;
    const nxt = scenes[i + 1], outT = nxt ? nxt.t0 - t : 99;
    const fadeIn = S.cut === "fade" && i > 0 ? 1 - ease(inT / 0.45) : 0;
    const fadeOut = nxt?.cut === "fade" ? 1 - ease(outT / 0.45) : 0;
    const dip = (S.cut === "dip" && i > 0 ? 1 - ease(inT / 0.35) : 0) + (nxt?.cut === "dip" ? 1 - ease(outT / 0.2) : 0);
    const flash = S.cut === "flash" && i > 0 ? Math.max(0, 1 - inT / 0.18) : 0;
    const opening = 1 - ease(t / 0.8);
    const ending = ease((t - (duration - 1.0)) / 1.0);
    g = { ...g, black: Math.max(g.black, fadeIn, fadeOut, opening, ending), flash: Math.max(g.flash, Math.min(1, dip), flash), flashColor: "#ffffff" };
    return g;
  };
  const bars = (t: number) => {
    const S = sceneAt(t);
    const target = format === "portrait" ? 0 : BARS[S.mood];
    const prevS = scenes[S.i - 1];
    if (!prevS) return target;
    const from = format === "portrait" ? 0 : BARS[prevS.mood];
    return from + (target - from) * ease((t - S.t0) / 0.6);
  };
  const cam = (t: number) => shotCam(shotAt(t).ctx, t);

  // ── 7. sound cue sheet ─────────────────────────────────────────────────────
  const sound: SoundPlan = { duration, offset, voFile: story.vo.file, voEnd: voEndT, amb: [], music: [], hits: [], quiet: [], steps: [], sfx: [], cuts: [], title: tc?.t0, endCard: endCard.t0 };
  scenes.forEach((S) => {
    sound.amb.push({ t0: S.t0, t1: S.t1, id: S.place.ambience, time: S.time, reverb: S.place.reverb });
    sound.music.push({ t0: S.t0, t1: S.t1, mood: S.mood, dark: S.dark });
    if (S.i > 0) sound.cuts.push({ t: S.t0, kind: S.cut });
  });
  story.scenes.forEach((sc, si) => {
    (sc.beats ?? []).forEach((b, bi) => {
      const t = beatT[si][bi];
      if (b.hit) sound.hits.push(t);
      if (b.quiet) { let t1 = bi + 1 < (sc.beats ?? []).length ? beatT[si][bi + 1] : scenes[si].t1; if (b.until !== undefined) t1 = T(b.until, "until", t - offset); sound.quiet.push([t - 0.3, t1]); }
      for (const n of list(b.sfx)) sound.sfx.push({ t, name: n });
      for (const [k, v] of Object.entries(b.set ?? {})) {
        const before = setAt(t - 0.01)[k];
        const sfx = W.props[k]?.sfx;
        if (sfx && v > before + 0.01 && sfx.up) sound.sfx.push({ t, name: sfx.up });
        if (sfx && v < before - 0.01 && sfx.down) sound.sfx.push({ t, name: sfx.down });
      }
    });
  });
  const AUTO: Partial<Record<ActionName, [string, number][]>> = {
    startle: [["hit", 0]], freeze: [["heartbeat", 0.2]], sit: [["creak", 0.7]], standUp: [["creak", 0.25]], phone: [["rustle", 0]], binoculars: [["rustle", 0.05]],
    turn: [["rustle", 0]], reach: [["rustle", 0.1]], wake: [["breath", 0.3]], sitUp: [["creak", 0.4], ["breath", 0.5]], shiver: [["breath", 0.2]], sigh: [["breath", 0.1]], point: [["rustle", 0.1]], raise: [["rustle", 0.05]],
  };
  for (const [key, L] of segs) {
    const si = Number(key.split("|")[0]);
    const surface = scenes[si].place.surface;
    for (const s of L) {
      for (const [n, d] of AUTO[s.act] ?? []) if (s.t0 > scenes[si].t0 + 0.05) sound.sfx.push({ t: s.t0 + d, name: n, dur: s.act === "freeze" ? Math.min(6, s.t1 - s.t0) : undefined });
      if (s.act === "write") sound.sfx.push({ t: s.t0 + 0.8, name: "scribble", dur: Math.max(0.5, s.t1 - s.t0 - 1.3) });
      if (s.path && s.moveT0 !== undefined && s.moveT1 !== undefined) {
        const run = s.act === "run";
        let last = -1;
        for (let t = s.moveT0; t <= s.moveT1 + 0.5; t += 1 / 120) {
          const w = run ? walkState(s.path, t, s.moveT0, s.moveT1, 0.35, 0.45, 1.9, 1.0) : walkState(s.path, t, s.moveT0, s.moveT1, 0.4, 0.6, 1.15, 0.85);
          const k = Math.floor(w.phase * 2 + 0.5);
          if (last >= 0 && k !== last && w.speed > 0.15) sound.steps.push({ t, run, surface, g: Math.min(1, w.speed / (run ? 3 : 1.1)) });
          last = k;
        }
      }
    }
  }
  sound.sfx.push(...objSfx);
  sound.sfx.sort((a, b) => a.t - b.t);
  sound.steps.sort((a, b) => a.t - b.t);

  return {
    story, world: W, duration, offset, voEnd: voEndT, scenes, shots, ui, specs, props, sceneAt, shotAt, poseOf, setAt, cam, grade, bars, format, aspect, captions, brand,
    titleCard: tc && story.titleCard ? { ...tc, text: story.titleCard.text, sub: story.titleCard.sub, kicker: story.titleCard.kicker } : undefined,
    disclaimer: dc && story.disclaimer ? { ...dc, text: story.disclaimer.text } : undefined,
    endCard, sound, warnings, built,
    objectsAt: (t: number) => { const out: Dyn = {}; for (const id of objEv.keys()) out[id] = objectAt(id, t); return out; },
  };
};

function nextBeatT(sc: Scene, bi: number, who: string, cues: Cues, offset: number, end: number, after: number) {
  let a = after;
  for (let k = bi + 1; k < (sc.beats ?? []).length; k++) {
    const b = sc.beats[k];
    let v: number;
    try { v = cues.at(b.at, "", a); } catch { return end; }
    a = v;
    if (!b.do) continue;
    const ws = Array.isArray(b.who) ? b.who : b.who ? [b.who] : [];
    if (ws.length && !ws.includes(who)) continue;
    return v + offset;
  }
  return end;
}

/** framings that hold a face */
const FACE: ShotName[] = ["cu", "ecu", "medium"];

/** The automatic shot for a beat. */
function choose(b: Beat | undefined, first: boolean, S: SceneP, prev: ShotName | undefined, tgtName: string | undefined, tgt: V3 | undefined, head: V3 | undefined, portrait = false): ShotName {
  const far = tgt && head ? Math.hypot(tgt[0] - head[0], tgt[2] - head[2]) > 12 : false;
  // on a phone a reaction reads on the face: close-up first, waist-up the next time; a gesture with the hands (a
  // hand to the chin, arms round the body) reads waist-up — in a close-up the forearm crosses the face
  if (portrait && b?.do && !first && ["peer", "look", "sigh", "nod", "shake"].includes(b.do) && !far) return prev === "cu" ? "medium" : "cu";
  if (portrait && b?.do && !first && ["think", "shiver"].includes(b.do)) return prev === "medium" ? "mediumWide" : "medium";
  if (first) return S.place.kind === "interior" ? "wide" : S.place.kind === "studio" ? "orbit" : "establish";
  if (!b) return "wide";
  // nobody here: something high up (a lamp, a window, a bird) is seen from eye height, the rest orbited
  if (!S.cast.length) return b.show || tgtName ? (tgt && tgt[1] - S.place.floor > 2.5 ? "long" : prev === "orbit" ? "long" : "orbit") : prev === "establish" ? "orbit" : "establish";
  if (b.show && !b.do) return far ? "long" : prev === "reveal" ? "ots" : "reveal";
  switch (b.do) {
    case "walk": return prev === "track" ? "lead" : "track";
    case "push": return prev === "profile" ? "track" : "profile";
    case "kneel": case "pickUp": case "putDown": case "open": case "close": return "mediumWide";
    case "give": case "receive": return "twoShot";
    case "run": return "track";
    case "startle": case "freeze": return "cu";
    case "peer": case "binoculars": case "look": return far ? (prev === "ots" ? "long" : "ots") : "medium";
    case "point": return far ? "ots" : "mediumWide";
    // a light aimed at something: from behind the shoulder, along the beam
    case "raise": return tgt ? "ots" : "mediumWide";
    case "phone": case "write": return "insert";
    case "reach": return "mediumWide";
    case "sit": case "standUp": case "sitUp": return "mediumWide";
    case "lie": case "sleep": case "wake": return "high";
    case "think": case "sigh": case "nod": case "shake": case "talk": return prev === "medium" ? "cu" : "medium";
    case "shiver": case "turn": case "wave": return "medium";
    case "stand": return "wide";
  }
  return "medium";
}
