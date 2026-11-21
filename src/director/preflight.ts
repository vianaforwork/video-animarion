// Geometry preflight: checks a compiled plan BEFORE anything is rendered. Pure data (no TSX), run by
// scripts/make.mjs after "direct". Errors stop the render (--force overrides); warnings are listed in
// out/<id>/qa/preflight.json for the visual review. What it checks:
//   objects   floating (not on the floor, not resting on / hanging from anything), sunk into each other or a wall
//   marks     standing marks inside an object / wall (nobody can stand there)
//   people    body inside an object or wall, two people inside each other, feet off the ground
//   cameras   lens inside a solid / under the ground, subject hidden behind something for most of a shot,
//             subject outside the (9:16 or 16:9) frame, a near surface (a wall at the lens) covering the picture
//   continuity small position jumps across a cut in the same place, held prop appearing / vanishing
// Boxes are axis-aligned part boxes, so this catches the big mistakes, not millimetre contact.

import type { Plan } from "./compile.ts";
import type { Box, V3 } from "../worlds/types.ts";
import { partBoxes, type Built } from "../gen/build.ts";
import { frameOf, nearCover } from "./shots.ts";

export type Issue = { check: string; level: "error" | "warn"; t?: number; msg: string };
export type Preflight = { errors: Issue[]; warnings: Issue[]; stats: Record<string, number> };

const depth = (a: Box, b: Box, m = 0) => {
  let d = Infinity;
  for (let k = 0; k < 3; k++) d = Math.min(d, Math.min(a.max[k], b.max[k]) - Math.max(a.min[k], b.min[k]) + m);
  return d;
};
const grow = (b: Box, m: number): Box => ({ min: [b.min[0] - m, b.min[1] - m, b.min[2] - m], max: [b.max[0] + m, b.max[1] + m, b.max[2] + m] });
const inside = (p: V3, b: Box, m = 0) => p[0] > b.min[0] + m && p[0] < b.max[0] - m && p[1] > b.min[1] + m && p[1] < b.max[1] - m && p[2] > b.min[2] + m && p[2] < b.max[2] - m;
/** segment a→b crosses box (slab test), ignoring the first/last `trim` of the segment */
const crosses = (a: V3, b: V3, box: Box, trim = 0.25) => {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]);
  if (L < 2 * trim) return false;
  let t0 = trim / L, t1 = 1 - trim / L;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-9) { if (a[k] < box.min[k] || a[k] > box.max[k]) return false; continue; }
    let u = (box.min[k] - a[k]) / d[k], v = (box.max[k] - a[k]) / d[k];
    if (u > v) [u, v] = [v, u];
    t0 = Math.max(t0, u); t1 = Math.min(t1, v);
    if (t0 > t1) return false;
  }
  return true;
};
const trunks = (b: Built): Box[] => b.scatter.filter((s) => s.use.startsWith("tree")).flatMap((s) => s.items.map((it) => {
  const r = 0.3 * it.scale;
  return { min: [it.pos[0] - r, it.pos[1], it.pos[2] - r] as V3, max: [it.pos[0] + r, it.pos[1] + 4.5 * it.scale, it.pos[2] + r] as V3 };
}));

export function preflight(P: Plan): Preflight {
  const out: Issue[] = [];
  const add = (check: string, level: Issue["level"], msg: string, t?: number) => out.push({ check, level, msg, t: t === undefined ? undefined : Math.round(t * 100) / 100 });
  const stats: Record<string, number> = {};
  const b = P.built;
  const walls: Box[] = b ? (Object.values(P.world.places)[0]?.occluders ?? []) : [];
  const tr = b ? trunks(b) : [];
  const fps = 10;

  // ── objects (where the world puts them) ──────────────────────────────────
  if (b) {
    const insts = b.insts.filter((i) => !i.info.walkable);
    stats.objects = insts.length;
    // objects already in someone's hand (or moving) at the start are placed by the timeline, not the world
    const dyn0 = P.objectsAt(0);
    for (const i of insts) {
      if (dyn0[i.id]) continue;
      const floor = b.nav.floor(i.pos[0], i.pos[2]);
      const gap = i.box.min[1] - floor;
      if (i.box.max[1] < floor - 0.01) add("buried", "error", `"${i.id}" (${i.use}) is entirely under the floor`);
      else if (gap > 0.05) {
        const others = [...insts.filter((o) => o !== i).flatMap((o) => (o.parts.length ? o.parts : [o.box])), ...walls, ...tr];
        if (!others.some((o) => depth(i.box, o, 0.04) > 0)) add("floating", "error", `"${i.id}" (${i.use}) floats ${gap.toFixed(2)} m above the floor and touches nothing — set "on": "<object>:top" or lower it`);
      }
    }
    // part against part between different objects; resting contact (a few cm) is fine
    for (let a = 0; a < insts.length; a++) for (let c = a + 1; c < insts.length; c++) {
      const A = insts[a], C = insts[c];
      if (depth(A.box, C.box) <= 0.04) continue;
      let worst = 0;
      for (const pa of A.parts.length ? A.parts : [A.box]) for (const pc of C.parts.length ? C.parts : [C.box]) worst = Math.max(worst, depth(pa, pc));
      if (worst > 0.06) add("objects-overlap", worst > 0.15 ? "error" : "warn", `"${A.id}" and "${C.id}" sink ${worst.toFixed(2)} m into each other`);
    }
    for (const i of insts) for (const w of walls) {
      let worst = 0;
      for (const pa of i.parts.length ? i.parts : [i.box]) worst = Math.max(worst, depth(pa, w));
      if (worst > 0.06) add("object-in-wall", worst > 0.15 ? "error" : "warn", `"${i.id}" sticks ${worst.toFixed(2)} m into a wall`);
    }
  }

  // ── surroundings: an open side / exterior must look onto something, not bare ground to the horizon
  if (b) {
    const sp = b.spec;
    // an open side counts only when no other room continues on that side (a nurse station open to its corridor is inside)
    const rooms = sp.rooms ?? [];
    const outward = (r: (typeof rooms)[number], side: string) => !rooms.some((o) => o !== r && (
      side === "north" ? Math.abs(o.rect[3] - r.rect[1]) < 0.3 && o.rect[0] < r.rect[2] && o.rect[2] > r.rect[0]
      : side === "south" ? Math.abs(o.rect[1] - r.rect[3]) < 0.3 && o.rect[0] < r.rect[2] && o.rect[2] > r.rect[0]
      : side === "west" ? Math.abs(o.rect[2] - r.rect[0]) < 0.3 && o.rect[1] < r.rect[3] && o.rect[3] > r.rect[1]
      : Math.abs(o.rect[0] - r.rect[2]) < 0.3 && o.rect[1] < r.rect[3] && o.rect[3] > r.rect[1]));
    const opens = rooms.some((r) => (r.open ?? []).some((sd) => outward(r, sd))) || Object.values(sp.places).some((p) => p.kind === "exterior");
    // per direction: is there a building, or a scatter reaching beyond the action, on that side?
    const ax = Object.values(b.spec.places).map((p) => p.area).find(Boolean) ?? [b.bounds.min[0] + 3, b.bounds.min[2] + 3, b.bounds.max[0] - 3, b.bounds.max[2] - 3];
    const rs = rooms.map((r) => r.rect);
    const box = rs.length ? [Math.min(...rs.map((r) => r[0])), Math.min(...rs.map((r) => r[1])), Math.max(...rs.map((r) => r[2])), Math.max(...rs.map((r) => r[3]))] : ax;
    const cx = (box[0] + box[2]) / 2, cz = (box[1] + box[3]) / 2;
    const dirOf = (x: number, z: number) => (Math.abs(x - cx) > Math.abs(z - cz) ? (x > cx ? "east" : "west") : z > cz ? "south" : "north");
    const covered = new Set<string>();
    for (const bd of sp.buildings ?? []) covered.add(dirOf((bd.rect[0] + bd.rect[2]) / 2, (bd.rect[1] + bd.rect[3]) / 2));
    for (const sc of (sp.scatter ?? []).filter((x) => !["grass-tuft", "fern"].includes(x.use) && x.count >= 8)) {
      if (sc.area[0] < box[0] - 4) covered.add("west"); if (sc.area[2] > box[2] + 4) covered.add("east");
      if (sc.area[1] < box[1] - 4) covered.add("north"); if (sc.area[3] > box[3] + 4) covered.add("south");
    }
    const empty = ["north", "south", "east", "west"].filter((d) => !covered.has(d));
    if (opens && empty.length) add("empty-surroundings", "warn", `nothing stands to the ${empty.join(" / ")} of the action: shots looking that way show bare ground to the horizon — add "buildings" (a street, shops) or tree/bush "scatter" on ${empty.length > 1 ? "those sides" : "that side"}`);
  }

  // ── marks the story uses ─────────────────────────────────────────────────
  if (b) {
    const used = new Set<string>();
    for (const sc of P.story.scenes) {
      for (const c of Object.values(sc.cast ?? {})) used.add(`${sc.place}|${c.at}`);
      for (const bt of sc.beats) if (bt.to && !bt.to.includes(":")) used.add(`${sc.place}|${bt.to}`);
    }
    const free = (x: number, z: number) => {
      const i = Math.floor((x - b.nav.x0) / b.nav.cell), j = Math.floor((z - b.nav.z0) / b.nav.cell);
      return i >= 0 && j >= 0 && i < b.nav.nx && j < b.nav.nz && b.nav.free[j * b.nav.nx + i] === 1;
    };
    for (const k of used) {
      const [pid, name] = k.split("|");
      const m = P.world.places[pid]?.marks[name];
      if (!m || m.seat !== undefined || m.bed) continue;
      // a standing spot needs some free floor around it (nav cells shrink solids by the body radius)
      const ok = [[0, 0], [0.12, 0], [-0.12, 0], [0, 0.12], [0, -0.12]].some(([dx, dz]) => free(m.p[0] + dx, m.p[1] + dz));
      if (!ok) add("mark-blocked", "error", `mark "${name}" in "${pid}" is inside an object or wall — move it to open floor`);
    }
    stats.marks = used.size;
  }

  // ── people over time ─────────────────────────────────────────────────────
  const end = P.voEnd + 0.5;
  const hits = new Map<string, { t0: number; n: number; d: number }>();
  const note = (key: string, t: number, d: number) => { const h = hits.get(key); if (h) { h.n++; h.d = Math.max(h.d, d); } else hits.set(key, { t0: t, n: 1, d }); };
  let samples = 0;
  for (let t = 0; t < end; t += 1 / fps) {
    const S = P.sceneAt(t);
    const dyn = P.objectsAt(t);
    const set = P.setAt(t) as Record<string, number>;
    const people = S.cast.map((who) => ({ who, p: P.poseOf(who, t) })).filter((x): x is { who: string; p: NonNullable<typeof x.p> } => !!x.p);
    samples++;
    const solids: { id: string; box: Box }[] = [];
    if (b) {
      for (const i of b.insts) {
        if (i.info.walkable) continue;
        const d = dyn[i.id];
        if (d?.hidden || (set[`${i.id}.visible`] ?? 1) < 0.5) continue;
        const boxes = d ? partBoxes(i.use, b.objects, d.pos, d.yaw, i.scale) : i.parts;
        for (const box of boxes.length ? boxes : [i.box]) solids.push({ id: i.id, box });
      }
      for (const w of walls) solids.push({ id: "wall", box: w });
      for (const x of tr) solids.push({ id: "tree", box: x });
    }
    for (const { who, p } of people) {
      // lying = hips pitched flat (in a bed); standing = upright with the feet at floor height
      const lying = Math.abs(p.hips[0]) > 0.8;
      const standing = !lying && p.hipY > -0.15 && Math.abs(p.y - (b ? b.nav.floor(p.x, p.z) : S.place.floor)) < 0.12;
      // torso cylinder (standing) or chest only (sitting / kneeling)
      const lo = standing ? 0.4 : 0.85 + p.hipY, hi = standing ? 1.45 : 1.25 + p.hipY;
      const body: Box = { min: [p.x - 0.14, p.y + lo, p.z - 0.14], max: [p.x + 0.14, p.y + hi, p.z + 0.14] };
      for (const s of solids) {
        if (dyn[s.id]) {
          // objects being handled (pushed, carried, given) sit right at the body
          const d = dyn[s.id];
          if (Math.hypot(d.pos[0] - p.x, d.pos[2] - p.z) < 1.0) continue;
        }
        if (!standing && s.box.min[0] < p.x && s.box.max[0] > p.x && s.box.min[2] < p.z && s.box.max[2] > p.z) continue;
        if (lying) continue; // the bed holds the body; a lying body is checked by its bed mark, not by boxes
        const dd = depth(body, s.box);
        if (dd > 0.06) note(`body|${who}|${s.id}`, t, dd);
      }
      // feet on the ground while walking (terrain following); standing still is set by the mark height
      const q = P.poseOf(who, t + 0.1);
      if (b && q && Math.hypot(q.x - p.x, q.z - p.z) > 0.04 && p.hipY > -0.1) {
        const gap = p.y - b.nav.floor(p.x, p.z);
        if (Math.abs(gap) > 0.08) note(`feet|${who}`, t, Math.abs(gap));
      }
    }
    for (let a = 0; a < people.length; a++) for (let c = a + 1; c < people.length; c++) {
      const A = people[a].p, C = people[c].p, d = Math.hypot(A.x - C.x, A.z - C.z);
      if (d < 0.4) note(`pair|${people[a].who}|${people[c].who}`, t, 0.4 - d);
    }
  }
  stats.peopleSamples = samples;
  for (const [k, h] of hits) {
    const [kind, a, c] = k.split("|");
    const dur = h.n / fps;
    if (kind === "body") add("person-in-object", dur > 0.3 && h.d > 0.1 ? "error" : "warn", `${a}'s body is inside ${c === "wall" ? "a wall" : c === "tree" ? "a tree trunk" : `"${c}"`} (${h.d.toFixed(2)} m deep, ${dur.toFixed(1)} s from ${h.t0.toFixed(1)} s)`, h.t0);
    if (kind === "feet") add("feet-off-ground", dur > 0.5 && h.d > 0.15 ? "error" : "warn", `${a}'s feet are ${h.d.toFixed(2)} m off the ground (${dur.toFixed(1)} s from ${h.t0.toFixed(1)} s)`, h.t0);
    if (kind === "pair") add("people-overlap", dur > 0.3 ? "error" : "warn", `${a} and ${c} stand inside each other (${dur.toFixed(1)} s from ${h.t0.toFixed(1)} s)`, h.t0);
  }

  // ── cameras ──────────────────────────────────────────────────────────────
  let camFrames = 0;
  P.shots.forEach((sh, si) => {
    const S = P.scenes[sh.scene];
    const pl = S.place;
    const blockers = [...pl.solids, ...(pl.occluders ?? [])];
    // named copies for the messages (what is in the way)
    const named: { id: string; box: Box }[] = b ? [...b.insts.filter((i) => !i.info.walkable).flatMap((i) => (i.parts.length ? i.parts : [i.box]).map((box) => ({ id: i.id, box }))), ...walls.map((box) => ({ id: "a wall", box })), ...tr.map((box) => ({ id: "a tree trunk", box }))] : blockers.map((box) => ({ id: "an object", box }));
    const why = new Map<string, number>();
    let inSolid = 0, under = 0, blocked = 0, n = 0, firstBad = -1;
    let crowd = 0, crowdBad = 0, outF = 0, fn = 0, crowdMax = 0, firstCrowd = -1, lastFrameT = -1, away = 0, faceN = 0;
    const faceShot = sh.who && sh.ctx.subj && ["cu", "ecu", "medium", "push"].includes(sh.kind), faceLim = sh.kind === "cu" || sh.kind === "ecu" ? 0.45 : 0.42;
    for (let t = sh.t0 + 0.05; t < Math.min(sh.t1, P.duration) - 0.02; t += 1 / fps) {
      n++; camFrames++;
      const c = P.cam(t);
      const g = pl.ground ? pl.ground(c.pos[0], c.pos[2]) : b ? b.nav.floor(c.pos[0], c.pos[2]) : pl.floor;
      if (c.pos[1] < g + 0.08) { under++; if (firstBad < 0) firstBad = t; }
      if ([...blockers, ...(pl.soft ?? []), ...(pl.swings ?? [])].some((x) => inside(c.pos, grow(x, 0.02)))) { inSolid++; if (firstBad < 0) firstBad = t; }
      // framing on screen, sampled every 0.25 s: near surfaces over the picture, the subject outside the frame
      if (t - lastFrameT >= 0.25) {
        lastFrameT = t; fn++;
        if (sh.kind !== "pov" && sh.kind !== "ecu") {
          const focus = c.focus ?? Math.hypot(c.target[0] - c.pos[0], c.target[1] - c.pos[1], c.target[2] - c.pos[2]);
          const cov = nearCover(pl, c.pos, c.target, c.fov, P.aspect, focus);
          crowdMax = Math.max(crowdMax, cov);
          if (cov > 0.3) { crowd++; if (firstCrowd < 0) firstCrowd = t; }
          if (cov > 0.45) crowdBad++;
        }
        // a face shot shows the face: the lens within ~63° (close-up) / 65° (medium) of where the person looks
        if (faceShot) {
          const e = sh.ctx.subj!.eye(t).dir, h = sh.ctx.subj!.head(t), vx = c.pos[0] - h[0], vz = c.pos[2] - h[2];
          faceN++;
          if ((e[0] * vx + e[2] * vz) / ((Math.hypot(e[0], e[2]) * Math.hypot(vx, vz)) || 1) < faceLim) away++;
        }
        // only framings that are about the person (inserts frame the hands, reveals swing to the thing, OTS / long look past them)
        if (sh.who && ["wide", "mediumWide", "medium", "cu", "push", "pull", "profile", "low", "high", "lead", "track", "orbit", "twoShot"].includes(sh.kind)) {
          const p = P.poseOf(sh.who, t);
          if (p) {
            const pj = frameOf(c.pos, c.target, c.fov, P.aspect).project([p.x, p.y + 1.45 + p.hipY, p.z]);
            if (pj.z <= 0 || Math.abs(pj.x) > 0.98 || Math.abs(pj.y) > 0.98) outF++;
          }
        }
      }
      if (sh.who && sh.kind !== "pov") {
        const p = P.poseOf(sh.who, t);
        if (p) {
          const head: V3 = [p.x, p.y + 1.45 + p.hipY, p.z];
          // the box the subject stands in / sits on never counts as a blocker
          const hit = named.find((x) => !inside(head, grow(x.box, 0.3)) && !inside([p.x, p.y + 0.5 + p.hipY, p.z], grow(x.box, 0.2)) && crosses(c.pos, head, x.box));
          if (hit) { blocked++; why.set(hit.id, (why.get(hit.id) ?? 0) + 1); }
        }
      }
    }
    const label = `shot ${si + 1} (${sh.kind}${sh.who ? " " + sh.who : ""}, ${sh.t0.toFixed(1)}–${sh.t1.toFixed(1)} s)`;
    if (inSolid > 0) add("camera-in-solid", inSolid / Math.max(1, n) > 0.1 ? "error" : "warn", `${label}: lens inside an object / wall / foliage on ${inSolid}/${n} samples`, firstBad);
    if (under > 0) add("camera-underground", "error", `${label}: lens below the ground on ${under}/${n} samples`, firstBad);
    if (fn && crowd / fn > 0.3) add("camera-crowded", crowdBad / fn > 0.4 ? "error" : "warn", `${label}: a surface right at the lens covers up to ${Math.round(100 * crowdMax)}% of the picture on ${Math.round((100 * crowd) / fn)}% of the shot (a wall / furniture too close) — move the people / force another shot or side`, firstCrowd);
    if (fn && outF / fn > 0.25) add("subject-out-of-frame", outF / fn > 0.6 ? "error" : "warn", `${label}: ${sh.who}'s head is outside the ${P.format} frame on ${Math.round((100 * outF) / fn)}% of the shot`, sh.t0);
    if (faceN && away / faceN > 0.5) add("face-turned-away", away / faceN > 0.7 && (sh.kind === "cu" || sh.kind === "ecu") ? "error" : "warn", `${label}: ${sh.who}'s face is turned away from the camera on ${Math.round((100 * away) / faceN)}% of the shot (only the side / back of the head shows) — they face a wall, window or thing too close for a camera in front: give the mark ≥ 1.5 m in front of the face, turn them to the room, or show what they look at over the shoulder (ots)`, sh.t0);
    if (n && blocked / n > 0.4) add("subject-hidden", blocked / n > 0.75 ? "error" : "warn", `${label}: ${sh.who} hidden behind ${[...why.entries()].sort((x, y) => y[1] - x[1]).slice(0, 2).map(([k]) => (k.startsWith("a ") ? k : `"${k}"`)).join(" / ")} on ${Math.round((100 * blocked) / n)}% of the shot`, sh.t0);
  });
  stats.cameraSamples = camFrames;
  stats.shots = P.shots.length;

  // ── continuity across scene cuts ─────────────────────────────────────────
  for (let k = 1; k < P.scenes.length; k++) {
    const A = P.scenes[k - 1], B = P.scenes[k];
    if (A.place.id !== B.place.id || B.cut !== "cut") continue;
    for (const who of B.cast) {
      if (!A.cast.includes(who)) continue;
      const pa = P.poseOf(who, B.t0 - 0.05), pb = P.poseOf(who, B.t0 + 0.05);
      if (!pa || !pb) continue;
      const jump = Math.hypot(pa.x - pb.x, pa.z - pb.z);
      if (jump > 0.12 && jump < 1.2) add("jump-cut", "warn", `scene ${k + 1} at ${B.t0.toFixed(1)} s: ${who} jumps ${jump.toFixed(2)} m across a hard cut in the same place (reads as a glitch — start the scene where the last one ended, or move further)`, B.t0);
      const ha = pa.hold?.kind, hb = pb.hold?.kind;
      if (ha !== hb && (ha === "lantern" || ha === "flashlight" || hb === "lantern" || hb === "flashlight")) add("prop-continuity", "warn", `scene ${k + 1}: ${who}'s ${ha ?? hb} ${ha ? "vanishes" : "appears"} across the cut`, B.t0);
    }
  }

  return { errors: out.filter((x) => x.level === "error"), warnings: out.filter((x) => x.level === "warn"), stats };
}
