// Scene QA gate (anti-tembus, anti-loncat): renders a composition WITHOUT images and lets the probe in
// src/core/qa/scene-qa.tsx read the 3D scene on every frame. Checks the solids tagged with <Solid>:
//   TEMBUS  one tagged solid inside another deeper than its tolerance, where the camera can see it
//   LONCAT  a part of a tagged body / prop (or the solid as a whole) jumping in one frame far more than in the
//           frames around it; or the camera jumping where no cut is planned
//   KEDIP   a tagged solid vanishing or appearing for one or two frames
// In the same pass it records small frames of the 3D alone (captions and titles left out) and runs scripts/qa-video.mjs
// on them: KEDIP / LONCAT / FLICKER anywhere in the picture, tagged or not (z-fighting, popping parts, shimmer).
// Run it on the preview composition before rendering the final (it takes about as long as the preview render).
//   node scripts/qa-scene.mjs --comp=<id> [--props=props.json] [--cuts=s,s,…] [--every=3] [--out=dir]
//                             [--from=frame --to=frame] [--concurrency=2] [--require-solids] [--no-video]
//     --cuts   planned cuts in seconds (the camera may jump there); without it camera jumps are listed for review
//     --every  check tembus on every n-th frame (default: 10 checks per second)
//     --allow / --ignore   passed on to the video scan (designed instant changes: a panel reveal, a counter)
// Writes <out>/qa-scene.json, <out>/qa-scene_<n>.jpg (the frame, red box on the place) and the video scan's
// qa-video.json / qa-video_<n>.jpg / qa-video.review.json next to them.
// Exit 1 on a finding (FAIL), 3 when something needs a look (CHECK: write the verdicts, run again), 0 when clean.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderFrames, renderStill, selectComposition } from "@remotion/renderer";
import { glMode, isWebGLError, switchToSoftware, tolerateClosedTargets } from "./gl.mjs";

tolerateClosedTargets();
const args = process.argv.slice(2);
const opt = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.slice(k.length + 3) : d;
};
const id = opt("comp");
if (!id) {
  console.error("usage: node scripts/qa-scene.mjs --comp=<id> [--props=props.json] [--cuts=s,s,…] [--every=3] [--out=dir] [--from=f --to=f]");
  process.exit(2);
}
const props = opt("props") ? JSON.parse(fs.readFileSync(opt("props"), "utf8")) : {};
const outDir = opt("out", path.join("out", "qa-scene", id));
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (/^qa-scene(_\d+\.jpg|\.json)$/.test(f)) fs.rmSync(path.join(outDir, f));
const nums = (s) => (s ?? "").split(",").filter((x) => x.trim() !== "").map(Number).filter(Number.isFinite);
const planned = opt("cuts") !== undefined ? nums(opt("cuts")) : null;

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const cleanup = () => fs.rmSync(serveUrl, { recursive: true, force: true });
process.on("exit", cleanup);
const composition = await selectComposition({ serveUrl, id, inputProps: props, logLevel: "error" });
const fps = composition.fps;
const every = Math.max(1, Number(opt("every", Math.round(fps / 10))));
const from = Number(opt("from", 0)), to = Number(opt("to", composition.durationInFrames - 1));
const withVideo = !args.includes("--no-video");
const inputProps = { ...props, voynannQa: { clipEvery: every, noOverlay: withVideo } };
// small frames of the 3D for the video scan (short side ≈ 256 px; the scan works at 144 × 256)
const vscale = Math.min(1, 256 / Math.min(composition.width, composition.height));
const frameDir = path.join(outDir, "_frames");
if (withVideo) {
  fs.rmSync(frameDir, { recursive: true, force: true });
  fs.mkdirSync(frameDir, { recursive: true });
}

const recs = new Map();
let bad = 0;
const run = async (gl) => {
  const browser = await openBrowser("chrome", { chromiumOptions: { gl } });
  try {
    recs.clear();
    let last = Date.now();
    await renderFrames({
      composition,
      serveUrl,
      inputProps,
      imageFormat: withVideo ? "jpeg" : "none",
      ...(withVideo ? { jpegQuality: 95 } : {}),
      scale: withVideo ? vscale : 1,
      outputDir: null,
      ...(withVideo ? { onFrameBuffer: (buf, frame) => fs.writeFileSync(path.join(frameDir, `f${String(frame).padStart(6, "0")}.jpg`), buf) } : {}),
      frameRange: [from, to],
      concurrency: Number(opt("concurrency", 2)),
      chromiumOptions: { gl },
      puppeteerInstance: browser,
      timeoutInMilliseconds: 240000,
      logLevel: "error",
      onStart: () => {},
      onFrameUpdate: (n) => {
        if (Date.now() - last > 5000) (last = Date.now()), process.stdout.write(`  ${n}/${to - from + 1} frames\r`);
      },
      onBrowserLog: (l) => {
        if (!l.text.startsWith("VOYNANN_QA")) return;
        try {
          const r = JSON.parse(l.text.slice(10));
          // two canvases on one frame (a scene under a scene): one record with both sets of solids and hits
          const o = recs.get(r.f);
          recs.set(r.f, o ? { ...o, s: { ...o.s, ...r.s }, ...(o.clip || r.clip ? { clip: 1, hits: [...(o.hits ?? []), ...(r.hits ?? [])] } : {}) } : r);
        } catch {
          bad++;
        }
      },
    });
  } finally {
    await browser.close({ silent: true }).catch(() => {});
  }
};
const gl = glMode();
try {
  await run(gl);
} catch (e) {
  if (gl === "swangle" || !isWebGLError(e)) throw e;
  await run(switchToSoftware());
}
process.stdout.write("\n");

const frames = [...recs.keys()].sort((a, b) => a - b);
if (args.includes("--dump")) fs.writeFileSync(path.join(outDir, "probe.jsonl"), frames.map((f) => JSON.stringify(recs.get(f))).join("\n") + "\n");
if (!frames.length) {
  console.error("qa-scene: the probe sent nothing — is <QaProbe /> inside the ThreeCanvas (Stage3D mounts it)?");
  process.exit(2);
}
const tOf = (f) => +(f / fps).toFixed(3);
const ids = [...new Set(frames.flatMap((f) => Object.keys(recs.get(f).s)))];
const findings = [];
const add = (x) => findings.push(x);

// ---- camera: cuts and jumps ----
const plannedF = (planned ?? []).map((t) => Math.round(t * fps));
// angle between two view directions; atan2 stays exact for tiny angles where acos(dot) does not
const angle = (a, b) => {
  const cx = a[4] * b[5] - a[5] * b[4], cy = a[5] * b[3] - a[3] * b[5], cz = a[3] * b[4] - a[4] * b[3];
  return Math.atan2(Math.hypot(cx, cy, cz), a[3] * b[3] + a[4] * b[4] + a[5] * b[5]);
};
const camStep = (f) => {
  const a = recs.get(f - 1)?.cam, b = recs.get(f)?.cam;
  if (!a || !b) return null;
  const pos = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const ang = angle(a, b);
  return { pos, ang };
};
// scene scale: the median size of the tagged solids (camera distances are compared with it)
const diags = frames.flatMap((f) => Object.values(recs.get(f).s).map((s) => s.d)).sort((a, b) => a - b);
const scale = diags.length ? diags[Math.floor(diags.length / 2)] : 1;
const camJump = new Set();
for (const f of frames) {
  const c = camStep(f), p = camStep(f - 1), n = camStep(f + 1);
  if (!c) continue;
  const big = c.pos > 0.25 * scale || c.ang > 0.14;
  const lone = c.pos > 3 * Math.max(p?.pos ?? 0, n?.pos ?? 0, 1e-4 * scale) || c.ang > 3 * Math.max(p?.ang ?? 0, n?.ang ?? 0, 1e-4);
  if (big && lone) camJump.add(f);
}
// with a plan, an unplanned camera jump is a finding, not a cut: the solids are still checked across it
const cutF = new Set([...plannedF, ...(planned ? [] : camJump)]);
// small camera snaps / one-frame wobbles inside a shot (a smoothing filter crossing a cut, a solver flip)
{
  const near = (f) => [...cutF].some((c) => f >= c - 1 && f <= c + 1);
  const st = (f) => camStep(f);
  for (const f of frames) {
    if (near(f) || near(f + 1) || camJump.has(f)) continue;
    const c = st(f), p = st(f - 1), n = st(f + 1);
    if (!c || !p || !n) continue;
    const v = c.pos / scale + c.ang, before = p.pos / scale + p.ang, after = n.pos / scale + n.ang;
    const a = recs.get(f - 1).cam, b = recs.get(f + 1).cam;
    const home = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / scale + angle(a, b);
    const min = 0.004 * (60 / fps);
    if (v > min && after > min && home < 0.35 * Math.min(v, after)) add({ type: "LONCAT", tier: "FAIL", what: "camera", from: tOf(f), frame: f, note: "the camera wobbles for one frame and comes back" });
    else if (v > min && v > 3 * Math.max(before, after, 0.001)) add({ type: "LONCAT", tier: "FAIL", what: "camera", from: tOf(f), frame: f, note: `the camera snaps inside a shot (${(v / Math.max(before, after, 1e-6)).toFixed(1)} × the steps around it)` });
  }
}
const nearCut = (f, r = 1) => [...cutF].some((c) => f >= c - r && f <= c + r);
for (const f of camJump) {
  if (planned && plannedF.some((c) => Math.abs(c - f) <= 2)) continue;
  add({ type: "LONCAT", tier: planned ? "FAIL" : "CHECK", what: "camera", from: tOf(f), frame: f, note: planned ? "the camera jumps where no cut is planned" : "camera jump (a cut?) — no plan given, check it is intended" });
}

// ---- KEDIP: a solid missing for 1–2 frames, or there for only 1–2 frames ----
for (const sid of ids) {
  const on = (f) => !!recs.get(f)?.s[sid];
  for (const f of frames) {
    if (nearCut(f, 2)) continue;
    for (const len of [1, 2]) {
      if (!recs.has(f - 1) || !recs.has(f + len)) continue;
      const mid = Array.from({ length: len }, (_, i) => on(f + i));
      if (on(f - 1) && on(f + len) && mid.every((x) => !x)) add({ type: "KEDIP", tier: "FAIL", what: sid, from: tOf(f), frame: f, note: `vanishes for ${len} frame${len > 1 ? "s" : ""}` });
      if (!on(f - 1) && !on(f + len) && mid.every((x) => x)) add({ type: "KEDIP", tier: "FAIL", what: sid, from: tOf(f), frame: f, note: `appears for only ${len} frame${len > 1 ? "s" : ""}` });
    }
  }
}

const offscreen = [];
// ---- LONCAT: a part that snaps (one big step, calm around it) or flicks away for 1–2 frames and comes back ----
// parts are matched by their own id from frame to frame; the mean point only while the set of parts is unchanged
for (const sid of ids) {
  const at = (f) => recs.get(f)?.s[sid];
  for (const f of frames) {
    const a0 = at(f - 2), a1 = at(f - 1), a2 = at(f), a3 = at(f + 1), a4 = at(f + 2);
    if (!a1 || !a2 || !a3 || !a2.j || nearCut(f) || nearCut(f + 1)) continue;
    // small props ride in fast hands: measure against at least half a typical solid (a person), not the prop alone
    const ref = Math.max(a2.d, 0.5 * scale);
    // visible sizes, whatever the frame rate: a flick ≥ 1.2 % of a body (≈ 2 cm on a person), a snap ≥ 2 % (≈ 3.5 cm);
    // smaller instant moves are eye saccades, finger curls and the like, by design
    const min = 0.012 * ref, minSnap = 0.02 * ref, floor = 0.001 * ref;
    const P = (r, k) => (!r ? null : k === "c" ? (r.n === a2.n ? r.c : null) : r.p?.[k] ?? null);
    const step = (p, q) => (p && q ? Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) : null);
    let worst = null;
    for (const k of ["c", ...Object.keys(a2.p ?? {})]) {
      const v = step(P(a1, k), P(a2, k));
      if (v === null || v <= min) continue;
      // flick: away at f, back at f+1 (or f+2) to where it was
      for (const [len, back] of [[1, a3], [2, a4]]) {
        const out = step(P(len === 1 ? a2 : a3, k), P(back, k)), home = step(P(a1, k), P(back, k));
        if (out !== null && home !== null && out > min && home < 0.35 * Math.min(v, out) && (!worst || v > worst.v)) worst = { v, kind: `flicks away for ${len} frame${len > 1 ? "s" : ""} and back`, part: k };
      }
      // snap: one step far bigger than the steps before and after (both must be known)
      const before = step(P(a0, k), P(a1, k)), after = step(P(a2, k), P(a3, k));
      if (before !== null && after !== null && v > minSnap && v > 2.5 * Math.max(before, after, floor) && (!worst || v > worst.v)) worst = { v, kind: `snaps (before ${(before / ref * 100).toFixed(1)} %, after ${(after / ref * 100).toFixed(1)} % per frame)`, part: k };
    }
    // a jump the camera cannot see (out of frame or hidden) is noted, not failed
    if (worst && !(a1.v || a2.v)) offscreen.push({ what: sid, from: tOf(f) });
    else if (worst) add({ type: "LONCAT", tier: "FAIL", what: sid, from: tOf(f), frame: f, note: `${worst.part === "c" ? "the whole solid" : `a part (#${worst.part})`} ${worst.kind}: ${(worst.v / ref * 100).toFixed(1)} % of a body size in one frame` });
  }
}
// a flick shows as two steps: keep the first
for (let i = findings.length - 1; i > 0; i--) {
  const x = findings[i];
  if (x.type === "LONCAT" && findings.some((y, j) => j < i && y.type === "LONCAT" && y.what === x.what && x.frame - y.frame <= 2 && x.frame > y.frame)) findings.splice(i, 1);
}

// ---- TEMBUS: group the sampled hits per pair over time ----
const clipFrames = frames.filter((f) => recs.get(f).clip);
const events = [];
for (const f of clipFrames) {
  for (const h of recs.get(f).hits ?? []) {
    const key = `${h.a}|${h.b}`;
    let e = events.find((q) => q.key === key && f - q.last <= every);
    if (!e) events.push((e = { key, a: h.a, b: h.b, first: f, last: f, depth: 0, tol: h.tol, vis: 0, best: null, touch: h.touch }));
    e.last = f;
    if (h.vis) e.vis++;
    if (h.vis && (!e.best || h.depth > e.best.depth)) e.best = { ...h, f };
    e.depth = Math.max(e.depth, h.depth);
  }
}
const hidden = [];
for (const e of events) {
  if (!e.best) {
    hidden.push({ a: e.a, b: e.b, from: tOf(e.first), to: tOf(e.last), depth: e.depth });
    continue;
  }
  add({
    type: "TEMBUS",
    tier: "FAIL",
    what: `${e.a} × ${e.b}`,
    from: tOf(e.first),
    to: tOf(e.last),
    frame: e.best.f,
    sx: e.best.sx,
    sy: e.best.sy,
    note: `${e.best.cross ? "surfaces cross" : `${(e.best.depth / e.best.tol).toFixed(1)} × deeper than allowed (${e.best.depth} vs ${e.best.tol} scene units)`}${e.touch ? ", even for a touching pair" : ""}; visible in ${e.vis} checked frame${e.vis > 1 ? "s" : ""}`,
  });
}

// ---- review images ----
const order = { FAIL: 0, CHECK: 1 };
findings.sort((a, b) => order[a.tier] - order[b.tier] || a.from - b.from);
const shots = findings.slice(0, 12);
if (shots.length) {
  const browser = await openBrowser("chrome", { chromiumOptions: { gl: glMode() } });
  try {
    for (const [i, x] of shots.entries()) {
      const name = `qa-scene_${String(i + 1).padStart(2, "0")}.jpg`;
      const k = 0.5;
      const W = Math.round(composition.width * k), H = Math.round(composition.height * k);
      const fr = x.type === "TEMBUS" ? [x.frame] : [x.frame - 1, x.frame, x.frame + 1].filter((g) => g >= 0 && g < composition.durationInFrames);
      const pngs = [];
      for (const g of fr) {
        const png = path.join(outDir, `_f${g}.png`);
        await renderStill({ composition, serveUrl, inputProps: props, output: png, frame: g, scale: k, chromiumOptions: { gl: glMode() }, puppeteerInstance: browser, timeoutInMilliseconds: 180000, logLevel: "error" });
        pngs.push(png);
      }
      const box = x.sx !== undefined ? `,drawbox=x=${Math.round(x.sx * W) - 40}:y=${Math.round(x.sy * H) - 40}:w=80:h=80:color=red@0.9:t=4` : "";
      const vf = pngs.length > 1 ? `hstack=inputs=${pngs.length}` : `null${box}`;
      execFileSync("ffmpeg", ["-v", "error", "-y", ...pngs.flatMap((p) => ["-i", p]), ...(pngs.length > 1 ? ["-filter_complex", vf] : ["-vf", vf]), "-frames:v", "1", path.join(outDir, name)]);
      for (const p of pngs) fs.rmSync(p, { force: true });
      x.image = name;
    }
  } catch (e) {
    console.log(`(review images skipped: ${String(e?.message ?? e).split("\n")[0]})`);
  } finally {
    await browser.close({ silent: true }).catch(() => {});
  }
}

// ---- the video scan of the clean 3D frames ----
let video = null;
if (withVideo) {
  const clean = path.join(outDir, "qa-clean.mp4");
  try {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(fps), "-start_number", String(from), "-i", path.join(frameDir, "f%06d.jpg"), "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-c:v", "libx264", "-crf", "8", "-pix_fmt", "yuv420p", clean]);
    fs.rmSync(frameDir, { recursive: true, force: true });
    const cutsArg = planned ? [`--cuts=${planned.map((t) => (t - from / fps).toFixed(3)).join(",")}`] : [];
    // while the camera whips (over ~50°/s, or a fast dolly) thin lines streak through the picture: the video scan
    // can't read those frames, the scene checks above still do
    const whip = frames.filter((f) => {
      const c = camStep(f);
      return c && !cutF.has(f) && (c.ang > 0.03 * (30 / fps) || c.pos / scale > 0.06 * (30 / fps));
    });
    for (const k of ["allow", "ignore"]) if (opt(k)) cutsArg.push(`--${k}=${opt(k)}`);
    if (whip.length) cutsArg.push(`--skip=${whip.map((f) => ((f - from) / fps).toFixed(3)).join(",")}`);
    const r = spawnSync(process.execPath, [path.join(path.dirname(fileURLToPath(import.meta.url)), "qa-video.mjs") /* fileURLToPath: folders with spaces */, clean, `--out=${outDir}`, ...cutsArg], { encoding: "utf8" });
    video = { code: r.status, text: (r.stdout || "").trim() };
  } catch (e) {
    video = { code: 2, text: `video scan skipped: ${String(e?.message ?? e).split("\n")[0]}` };
  }
}
const fail = findings.filter((x) => x.tier === "FAIL"), check = findings.filter((x) => x.tier === "CHECK");
const report = {
  composition: id,
  fps,
  frames: [from, to],
  every,
  solids: ids,
  cuts: { planned: planned ?? "not given", cameraJumps: [...camJump].sort((a, b) => a - b).map(tOf) },
  hiddenTembus: hidden,
  offscreenJumps: offscreen,
  findings,
  result: fail.length ? "FAIL" : check.length ? "CHECK" : "PASS",
};
fs.writeFileSync(path.join(outDir, "qa-scene.json"), JSON.stringify(report, null, 2) + "\n");
console.log(`qa-scene ${id}: ${frames.length} frames, ${clipFrames.length} tembus checks, ${ids.length} tagged solid${ids.length === 1 ? "" : "s"}${ids.length ? ` (${ids.join(", ")})` : ""}${bad ? `, ${bad} unreadable probe lines` : ""}`);
if (!ids.length) {
  console.log(`qa-scene: nothing is tagged — wrap every character, held prop and touched furniture in <Solid> (src/core/qa/scene-qa.tsx)`);
  if (args.includes("--require-solids")) fail.push({ type: "SETUP", tier: "FAIL" });
}
for (const x of findings.slice(0, 30)) console.log(`  ${x.tier.padEnd(5)} ${x.type.padEnd(6)} ${String(x.from.toFixed(2)).padStart(6)} s  ${x.what}: ${x.note}${x.image ? ` → ${path.join(outDir, x.image)}` : ""}`);
if (findings.length > 30) console.log(`  … ${findings.length - 30} more in ${path.join(outDir, "qa-scene.json")}`);
if (offscreen.length) console.log(`  note: ${offscreen.length} jump${offscreen.length > 1 ? "s" : ""} of solids the camera does not see (${[...new Set(offscreen.map((x) => x.what))].join(", ")}) — not failed`);
if (hidden.length) console.log(`  note: ${hidden.length} overlap${hidden.length > 1 ? "s" : ""} the camera cannot see (hidden behind something or off frame) — fine as long as no shot shows them`);
const sceneCode = fail.length ? 1 : check.length ? 3 : 0;
if (fail.length) console.log(`qa-scene: FAIL (${fail.length}) — fix the choreography / geometry (grip at the rim, arc around, sit on the seat edge), then run again`);
else if (check.length) console.log(`qa-scene: CHECK (${check.length}) — pass --cuts so camera jumps can be told from cuts`);
else console.log("qa-scene: PASS");
if (video) console.log(`\n— video scan of the 3D alone (captions left out) —\n${video.text}`);
// worst of both: 1 FAIL > 3 CHECK > 0 PASS (2 = could not run)
const rank = (c) => (c === 1 ? 3 : c === 2 ? 2 : c === 3 ? 1 : 0);
const worst = [sceneCode, video?.code ?? 0].sort((a, b) => rank(b) - rank(a))[0];
console.log(`\nQA gate: ${worst === 1 ? "FAIL" : worst === 3 ? "CHECK" : worst === 2 ? "INCOMPLETE" : "PASS"}`);
process.exit(worst);
