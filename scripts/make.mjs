// One command from a story to a checked video.
//   node scripts/make.mjs stories/<id>/story.json [--stills=3,10,18.5] [--preview] [--final] [--no-sound] [--no-qa] [--force]
//
//   1. resolve   story.json (+ words.json, VO envelope) → src/stories/data/<id>.json, regenerate the registry
//   2. direct    compile the story (blocking, acting, shots, sound cues), print the plan; stops on errors
//   3. sound     scripts/sound-story.ts → public/audio/<id>-mix.wav (+ captions out/<id>/<id>.srt)
//   4. render    --stills: contact sheet · --preview: 540×960@30 with audio (landscape 960×540) · --final (default):
//                1080×1920@60 portrait (story "format": "landscape" → 1920×1080@60), mastered to −14 LUFS
//                (interrupted? run the same command again — finished segments are reused)
//   --from=12 --to=30  render only that part of the film (preview / final): a section to review
//   5. QA        QA gate (scripts/qa-gate.mjs: tembus / loncat / kedip of the tagged people, props and furniture,
//                camera snaps, a scan of the 3D alone for flicker) — after --preview as a report, before --final as
//                a stop (--force-qa goes on anyway); then scripts/qa.mjs → out/<id>/qa/ (frame scan, sync, loudness)

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { deliveryScan, sceneGate } from "./qa-gate.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const flag = (k) => args.includes(`--${k}`);
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `=${d ?? ""}`).split("=").slice(1).join("=");
if (!file || !fs.existsSync(file)) {
  console.error("usage: node scripts/make.mjs stories/<id>/story.json [--stills=…] [--preview] [--final] [--no-sound] [--no-qa]");
  process.exit(1);
}
const step = (s) => console.log(`\n▶ ${s}`);
const sh = (cmd, a, opts = {}) => {
  const r = spawnSync(cmd, a, { stdio: "inherit", ...opts });
  if (r.status !== 0) { console.error(`✗ ${cmd} ${a.join(" ")} failed`); process.exit(r.status ?? 1); }
};

// 1 ── resolve ───────────────────────────────────────────────────────────────
step("resolve story");
const dir = path.dirname(file);
const story = JSON.parse(fs.readFileSync(file, "utf8"));
if (!/^[a-z0-9-]+$/.test(story.id ?? "")) { console.error(`story.id "${story.id}" must use only a-z, 0-9 and "-"`); process.exit(1); }
if (typeof story.words === "string") story.words = JSON.parse(fs.readFileSync(path.join(dir, story.words), "utf8"));
if (!Array.isArray(story.words) || !story.words.length) { console.error("story.words is missing (run scripts/transcribe.mjs first)"); process.exit(1); }
// dynamic world: worlds/<name>.world.json (project) or stories/<id>/<name>.world.json, plus every object it
// or the story uses from library/objects and assets/objects (project objects win)
{
  const cands = [path.join(dir, `${story.world}.world.json`), path.join("worlds", `${story.world}.world.json`), path.join("library", "worlds", `${story.world}.world.json`)];
  const wf = cands.find((f) => fs.existsSync(f));
  delete story.worldSpec; delete story.objectSpecs;
  if (wf) {
    story.worldSpec = JSON.parse(fs.readFileSync(wf, "utf8"));
    const objDirs = ["assets/objects", path.join(dir, "objects"), "library/objects"];
    const need = new Set([...(story.worldSpec.objects ?? []).map((o) => o.use), ...(story.worldSpec.scatter ?? []).map((o) => o.use)]);
    const { BUILTIN } = await import(path.resolve("src/gen/objects/builtin-data.ts"));
    story.objectSpecs = [];
    const missing = [];
    for (const id of need) {
      if (BUILTIN[id]) continue;
      const f = objDirs.map((d) => path.join(d, `${id}.json`)).find((x) => fs.existsSync(x));
      if (!f) { missing.push(id); continue; }
      story.objectSpecs.push(JSON.parse(fs.readFileSync(f, "utf8")));
    }
    if (missing.length) { console.error(`✗ objects not found: ${missing.join(", ")} — write assets/objects/<id>.json (see references/cinestory/objects.md) or use a library object`); process.exit(1); }
    console.log(`  world ${wf}: ${(story.worldSpec.rooms ?? []).length} rooms, ${(story.worldSpec.objects ?? []).length} objects, ${(story.worldSpec.scatter ?? []).length} scatters · object specs: ${story.objectSpecs.map((o) => o.id).join(", ") || "built-in only"}`);
  }
}
// branding: only the user's own brand kit (voynann-brand.json in the project or the story folder); "brand": false
// in story.json switches it off. The logo is copied to public/brand/.
{
  const given = story.brand;
  delete story.brand;
  const kitFile = [path.join(dir, "voynann-brand.json"), "voynann-brand.json"].find((f) => fs.existsSync(f));
  if (given !== false && kitFile) {
    const kit = JSON.parse(fs.readFileSync(kitFile, "utf8"));
    const b = { brand: kit.brand, handle: kit.handle, cta: kit.cta, colors: kit.colors, watermark: !!kit.watermark, intro: kit.intro };
    if (kit.logo) {
      const src = path.join(path.dirname(kitFile), kit.logo);
      if (fs.existsSync(src)) { fs.mkdirSync("public/brand", { recursive: true }); fs.copyFileSync(src, path.join("public/brand", path.basename(src))); b.logoFile = `brand/${path.basename(src)}`; }
      else console.log(`  ⚠ brand logo ${src} not found — the brand is used without a logo`);
    }
    story.brand = b;
    console.log(`  brand kit ${kitFile}: ${[kit.brand, kit.handle].filter(Boolean).join(" ")}${b.logoFile ? " + logo" : ""}`);
  }
}
const voPath = path.join("public", story.vo?.file ?? "");
if (!story.vo?.file || !fs.existsSync(voPath)) { console.error(`VO not found: ${voPath}`); process.exit(1); }
// VO loudness envelope, 60 per second (mouth flaps for "talk", music ducking hints)
{
  const raw = spawnSync("ffmpeg", ["-v", "error", "-i", voPath, "-f", "f32le", "-ac", "1", "-ar", "6000", "-"], { maxBuffer: 1 << 28 }).stdout;
  const x = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 4));
  const env = [];
  for (let i = 0; i < x.length; i += 100) { let s = 0; for (let k = i; k < Math.min(x.length, i + 100); k++) s += x[k] * x[k]; env.push(Math.sqrt(s / 100)); }
  const peak = Math.max(...env.slice().sort((a, b) => a - b).slice(Math.floor(env.length * 0.98))) || 1;
  story.voenv = env.map((v) => +Math.min(1, v / peak).toFixed(2));
}
const mix = `audio/${story.id}-mix.wav`;
const willSound = !flag("no-sound");
if (willSound || fs.existsSync(path.join("public", mix))) story.audio = mix;
const writeResolved = () => {
  fs.mkdirSync("src/stories/data", { recursive: true });
  fs.writeFileSync(`src/stories/data/${story.id}.json`, JSON.stringify(story));
  const ids = fs.readdirSync("src/stories/data").filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
  const v = (s) => "s_" + s.replace(/-/g, "_");
  fs.writeFileSync("src/stories/registry.ts", `// Generated by scripts/make.mjs — every story in src/stories/data becomes two compositions.\nimport type { Story } from "../director/story.ts";\n${ids.map((id) => `import ${v(id)} from "./data/${id}.json";`).join("\n")}\n\nexport const STORIES: Story[] = [${ids.map((id) => `${v(id)} as unknown as Story`).join(", ")}];\n`);
};
// compositions must not reference a mix that does not exist yet
if (story.audio && !fs.existsSync(path.join("public", story.audio))) { const a = story.audio; delete story.audio; writeResolved(); story.audio = a; } else writeResolved();
console.log(`  ${story.id}: ${story.words.length} words, world ${story.world}, cast ${(story.cast ?? []).map((c) => `${c.id} (${c.look})`).join(" + ") || "none"}, ${story.scenes?.length ?? 0} scenes`);

// 2 ── direct ────────────────────────────────────────────────────────────────
step("direct (compile the story)");
const { compile } = await import(path.resolve("src/director/compile.ts"));
let P;
try { P = compile(story); } catch (e) { console.error(`✗ story problems:\n${String(e.message).split("\n").map((l) => "  - " + l).join("\n")}`); process.exit(1); }
console.log(`  ${P.format} ${P.format === "portrait" ? "1080×1920" : "1920×1080"} · duration ${P.duration}s · ${P.scenes.length} scenes · ${P.shots.length} shots · ${P.ui.length} overlays · ${P.captions.length} caption lines · ${P.sound.sfx.length} SFX · ${P.sound.steps.length} footsteps`);
for (const s of P.shots) console.log(`  ${s.t0.toFixed(2).padStart(6)}–${Math.min(s.t1, P.duration).toFixed(2).padEnd(6)} sc${s.scene + 1} ${P.scenes[s.scene].place.id.padEnd(8)} ${s.kind.padEnd(10)} ${s.who ?? "-"}${s.target ? " → " + s.target : ""}`);
for (const w of P.warnings) console.log(`  ⚠ ${w}`);
const outDir = path.join("out", story.id);

// 2b ── geometry preflight (objects, marks, bodies, cameras, continuity) — before any render
step("preflight (geometry QC)");
{
  const { preflight } = await import(path.resolve("src/director/preflight.ts"));
  const t0 = Date.now();
  const pf = preflight(P);
  fs.mkdirSync(path.join(outDir, "qa"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "qa", "preflight.json"), JSON.stringify(pf, null, 1));
  for (const e of pf.errors) console.log(`  ✗ ${e.check}: ${e.msg}`);
  for (const w of pf.warnings) console.log(`  ⚠ ${w.check}: ${w.msg}`);
  console.log(`  ${pf.errors.length} errors · ${pf.warnings.length} warnings · ${Object.entries(pf.stats).map(([k, v]) => `${k} ${v}`).join(" · ")} · ${((Date.now() - t0) / 1000).toFixed(1)} s → ${path.join(outDir, "qa", "preflight.json")}`);
  if (pf.errors.length && !flag("force")) { console.error("✗ preflight found geometry errors — fix the world/story (or --force to render anyway)"); process.exit(1); }
}
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "shots.json"), JSON.stringify({ duration: P.duration, voOffset: P.offset, shots: P.shots.map((s) => ({ kind: s.kind, who: s.who, target: s.target, scene: s.scene, t0: s.t0, t1: Math.min(s.t1, P.duration) })) }, null, 1));
// captions (.srt): sentences from the VO words, in film time
{
  const W = story.words, cues = [];
  let cur = [];
  const flush = () => { if (cur.length) cues.push([cur[0][1] + P.offset, cur[cur.length - 1][2] + P.offset, cur.map((w) => w[0]).join(" ")]); cur = []; };
  W.forEach((w, i) => { cur.push(w); const next = W[i + 1]; if (/[.?!]$/.test(w[0]) || cur.length >= 12 || (next && next[1] - w[2] > 0.6)) flush(); });
  flush();
  const ts = (t) => { const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
  fs.writeFileSync(path.join(outDir, `${story.id}.srt`), cues.map((c, i) => `${i + 1}\n${ts(c[0])} --> ${ts(c[1])}\n${c[2]}\n`).join("\n"));
}

// 3 ── sound ─────────────────────────────────────────────────────────────────
if (willSound) {
  step("sound");
  sh("node", ["--max-old-space-size=4096", "scripts/sound-story.ts", `src/stories/data/${story.id}.json`]);
  writeResolved();
}

// 4 ── render ────────────────────────────────────────────────────────────────
const stills = opt("stills");
if (stills) {
  step("stills");
  const all = stills.split(",").map((x) => parseFloat(x)).filter((x) => Number.isFinite(x));
  const ok = all.filter((x) => x >= 0 && x < P.duration - 0.05);
  if (ok.length < all.length) console.log(`  (skipped stills past the end of the ${P.duration}s film: ${all.filter((x) => !ok.includes(x)).join(", ")})`);
  if (!ok.length) { console.error("✗ no stills inside the film"); process.exit(1); }
  sh("node", ["scripts/stills.mjs", path.join(outDir, "stills"), ok.map((x) => `${x}s`).join(","), `${story.id}-preview`]);
}
const preview = flag("preview"), final = flag("final") || (!preview && !stills);
let video = null;
const portrait = P.format === "portrait";
const size = portrait ? "1080x1920" : "1920x1080";
const from = opt("from"), to = opt("to");
const range = from || to ? [Math.max(0, Number(from || 0)), Math.min(P.duration, Number(to || P.duration))] : null;
// planned cuts (the shot list): the camera may jump there, nowhere else
const cuts = P.shots.slice(1).map((x) => x.t0);
const gateDir = path.join(outDir, "qa-gate");
const gate = { comp: `${story.id}-preview`, cuts, out: gateDir, extra: range ? [`--from=${Math.round(range[0] * 30)}`, `--to=${Math.round(range[1] * 30) - 1}`] : [] };
let gateWord = null, deliveredWord = null;
if (preview) {
  step(`render preview (${portrait ? "540×960" : "960×540"} @ 30, with audio)${range ? ` ${range[0]}–${range[1]} s` : ""}`);
  video = path.join(outDir, `${story.id}_preview${range ? `_${range[0]}-${range[1]}s` : ""}.mp4`);
  sh("npx", ["remotion", "render", `${story.id}-preview`, video, "--codec=h264", "--crf=22", `--concurrency=${opt("concurrency", "4")}`, ...(range ? [`--frames=${Math.round(range[0] * 30)}-${Math.round(range[1] * 30) - 1}`] : [])]);
  if (!flag("no-qa")) gateWord = sceneGate({ ...gate, force: true }); // a report: fix every FAIL before the preview is shown
}
if (final && !flag("no-qa")) gateWord = sceneGate({ ...gate, force: flag("force-qa") });
if (final) {
  step(`render final (${portrait ? "1080×1920" : "1920×1080"} @ 60, H.264 + AAC, −14 LUFS)${range ? ` ${range[0]}–${range[1]} s` : ""}`);
  const seg = path.join(outDir, "seg"), stamp = path.join(seg, "story.json");
  const resolved = fs.readFileSync(`src/stories/data/${story.id}.json`, "utf8");
  if (!fs.existsSync(stamp) || fs.readFileSync(stamp, "utf8") !== resolved) fs.rmSync(seg, { recursive: true, force: true });
  fs.mkdirSync(seg, { recursive: true });
  fs.writeFileSync(stamp, resolved);
  video = path.join(outDir, `${story.id}_${size}_60fps${range ? `_${range[0]}-${range[1]}s` : ""}.mp4`);
  sh("node", ["scripts/render-final.mjs", `--comp=${story.id}-final`, `--out=${video}`, `--vo=public/${mix}`, "--offset=0", `--parts=${opt("parts", range ? "2" : "6")}`, `--concurrency=${opt("concurrency", "3")}`, `--seg=${seg}${range ? `-${range[0]}-${range[1]}` : ""}`, ...(range ? [`--from=${range[0]}`, `--to=${range[1]}`] : []), "--no-qa"]);
  if (!flag("no-qa")) deliveredWord = deliveryScan({ file: video, cuts: range ? cuts.filter((t) => t > range[0] && t < range[1]).map((t) => t - range[0]) : cuts, out: path.join(gateDir, "delivered") });
}

// 5 ── QA ────────────────────────────────────────────────────────────────────
if (video && !flag("no-qa")) {
  step("QA");
  sh("node", ["scripts/qa.mjs", video, `--vo=${voPath}`, `--offset=${range ? P.offset - range[0] : P.offset}`, `--expect=${range ? range[1] - range[0] : P.duration}`, `--shots=${path.join(outDir, "shots.json")}`, `--size=${size}`, ...(range ? [`--from=${range[0]}`] : []), ...(final ? ["--final"] : [])]);
  // visual review gate: automated checks never see a post through a face — a person has to look.
  // REVIEW.md stays "PENDING" until every row is filled; never call the video QA PASS before that.
  const pf = JSON.parse(fs.readFileSync(path.join(outDir, "qa", "preflight.json"), "utf8"));
  const rows = ["object clipping / sinking", "floating objects", "people inside objects or each other", "feet / hands / contact plausible", "camera inside walls or blocked view", "continuity across cuts (position, props, light)", "frame errors (black / white / frozen / flicker)", "VO sync and pauses kept", "every object reads as what the script says", "story logic: nothing seen before its reveal, nothing left after it leaves", "no head / back of head covering > 1/4 of a frame (except close-ups)", ...(portrait ? ["text inside the safe area, never over a face (captions, tags, cards, titles)", "faces and key objects readable on a phone (not too dark)"] : []), "pacing: no long stretch of one view / one graphic; reactions on the words"];
  fs.writeFileSync(path.join(outDir, "qa", "REVIEW.md"), [
    `# Visual review — ${story.id} (${path.basename(video)})`, "", "STATUS: PENDING VISUAL REVIEW", "",
    `QA gate (${gateDir}): ${gateWord ?? "not run"}${deliveredWord ? ` · delivered-file scan: ${deliveredWord}` : ""} — STATUS may be PASS only when the gate is PASS (or every CHECK strip has an "ok: …" verdict) and the delivered scan is not FAIL.`, "",
    `Look at EVERY page of the 1-fps contact sheet — ${(JSON.parse(fs.readFileSync(path.join(outDir, "qa", "qa.json"), "utf8")).contactPages ?? []).map((p) => `${p.file} (${p.from}–${p.to} s)`).join(", ") || "contact_1fps_*.jpg"} — one tile per second, left→right then top→bottom; together they cover the whole video — and shots_start_mid_end.jpg (open the video for anything doubtful). Tick each page below.`, "", ...(JSON.parse(fs.readFileSync(path.join(outDir, "qa", "qa.json"), "utf8")).contactPages ?? []).map((p) => `- [ ] ${p.file} (${p.from}–${p.to} s) seen`), "", "Then fill every row with PASS / FIX + what you saw. Set STATUS to PASS only when no FIX is left.", "",
    "| check | verdict | notes |", "|---|---|---|", ...rows.map((r) => `| ${r} | | |`), "",
    `## Preflight (${pf.errors.length} errors, ${pf.warnings.length} warnings) — confirm each on screen`, "",
    ...(pf.errors.length + pf.warnings.length ? [...pf.errors, ...pf.warnings].map((w) => `- [ ] ${w.level === "error" ? "ERROR" : "warn"} ${w.check}: ${w.msg}`) : ["- none"]), "",
  ].join("\n"));
  console.log(`  review gate → ${path.join(outDir, "qa", "REVIEW.md")} (PENDING until a visual review is written)`);
}
console.log(`\n✓ done${video ? `: ${video}` : ""}`);
