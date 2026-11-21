// VOYNANN video QA gate: finds, in any rendered MP4 of any style, the glitches a viewer reads as cheap:
//   KEDIP  (pop)    part of the picture changes for 1–3 frames and comes back: a blink, a one-frame pose,
//                   z-fighting, a flash, a camera shake
//   LONCAT (jump)   part of the picture steps far more in one frame than in the frames around it and stays:
//                   a limb / prop / camera snapping, something appearing from nowhere, an unplanned cut
//   FLICKER         a region oscillating up-down-up for a sustained time: shimmer, z-fighting, shadow acne
//   BLACK / WHITE   near-black or burnt-white runs in the middle of the film
// Planned cuts are skipped (±2 frames). Fades, smooth moves and eased pop-ins pass.
//   node scripts/qa-video.mjs <video.mp4> [--cuts=s,s,…] [--allow=s,s,…] [--ignore=x0,y0,x1,y1;…] [--out=dir]
//     --cuts    planned hard cuts in seconds (from the plan). Without it, full-frame jumps count as cuts and are
//               listed for the visual review; with it, a full-frame jump that is not in the list fails.
//     --allow   seconds where an instant change is intended (a title slam, a page that is meant to snap);
//               every allowed second must be justified in the review — never allow a glitch away
//     --ignore  regions (0…1 picture coordinates) where instant changes are by design, e.g. a word-caption band
//               that switches words without a fade: --ignore=0,0.70,1,0.86
//     --hard-only  only the FAIL tier (for the delivered film with its captions; the local scan runs on the clean 3D
//               frames from scripts/qa-scene.mjs)
// Writes <out>/qa-video.json and <out>/qa-video_<n>.jpg (5 frames around each finding, red box on the place).
// Exit code 1 when anything is found.

import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`));
  return a ? a.slice(k.length + 3) : d;
};
if (!file || !fs.existsSync(file)) {
  console.error("usage: node scripts/qa-video.mjs <video.mp4> [--cuts=s,s,…] [--allow=s,s,…] [--ignore=x0,y0,x1,y1;…] [--out=dir]");
  process.exit(2);
}
const nums = (s) => (s ?? "").split(",").filter((x) => x.trim() !== "").map(Number).filter(Number.isFinite);
const planned = opt("cuts") !== undefined ? nums(opt("cuts")) : null;
const allow = nums(opt("allow"));
const skip = nums(opt("skip")); // set by qa-scene.mjs: frames where the camera whips (no justification needed)
const ignore = (opt("ignore") ?? "").split(";").filter(Boolean).map((r) => r.split(",").map(Number));
const outDir = opt("out", path.join(path.dirname(file), `${path.basename(file, path.extname(file))}_qa-video`));
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (/^qa-video(_\d+\.jpg|\.json)$/.test(f)) fs.rmSync(path.join(outDir, f));

// thresholds (luma levels 0…255, means over an 8×8 block of the analysis frame ≈ 60 px of a 1080-wide film)
const T_POP = 10; // a block that changes by this much and comes back within 3 frames
const T_JUMP = 14; // a one-frame step this big …
const JUMP_RATIO = 3; // … and this many times the steps around it
const T_FLICK = 3; // a block-mean step this big, not explained by motion, counts toward a flicker …
const F_FLICK = 20; // … failing when its direction flips this often per second (at most 0.6 × the frame rate) for 1 s
const T_CUT = 8;
const R_MOVE = 10; // analysis pixels (≈ 75 px of a 1080-wide film) a block may move per frame and still read as motion
const S_MIN = 24; // a KEDIP / LONCAT finding needs this much total strength (one strong block or a few weaker ones)

// ---- decode a small grey copy (one pass) ----
const st = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", file], { encoding: "utf8" })).streams[0];
const [rn, rd] = st.r_frame_rate.split("/").map(Number);
const fps = rn / (rd || 1);
const portrait = st.height >= st.width;
const W = portrait ? 144 : 256, H = portrait ? 256 : 144, PX = W * H;
const B = 8, BX = W / B, BY = H / B, NB = BX * BY, BP = B * B;
const raw = await new Promise((res, rej) => {
  const p = spawn("ffmpeg", ["-v", "error", "-i", file, "-an", "-vf", `scale=${W}:${H}:flags=area,format=gray`, "-f", "rawvideo", "-"]);
  const chunks = [];
  let err = "";
  p.stdout.on("data", (c) => chunks.push(c));
  p.stderr.on("data", (c) => (err += c));
  p.on("close", (code) => (code === 0 ? res(Buffer.concat(chunks)) : rej(new Error(`ffmpeg: ${err}`))));
});
const N = Math.floor(raw.length / PX);
if (N < 8) {
  console.error(`only ${N} frames decoded`);
  process.exit(2);
}
const tOf = (f) => f / fps;

const blk = new Int16Array(PX);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) blk[y * W + x] = ((y / B) | 0) * BX + ((x / B) | 0);
const ignored = new Uint8Array(NB);
for (let k = 0; k < NB; k++) {
  const cx = ((k % BX) + 0.5) / BX, cy = (((k / BX) | 0) + 0.5) / BY;
  if (ignore.some(([x0, y0, x1, y1]) => cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1)) ignored[k] = 1;
}

// per-block mean absolute step between consecutive frames, frame mean luma
const D1 = [new Float32Array(NB)];
const G = new Float32Array(N);
const Y = new Float32Array(N);
const M = []; // block mean luma per frame
for (let f = 0; f < N; f++) {
  const a = f * PX;
  let s = 0;
  const m = new Float32Array(NB);
  for (let p = 0; p < PX; p++) {
    s += raw[a + p];
    m[blk[p]] += raw[a + p];
  }
  for (let k = 0; k < NB; k++) m[k] /= BP;
  M.push(m);
  Y[f] = s / PX;
  if (!f) continue;
  const d = new Float32Array(NB), b = a - PX;
  for (let p = 0; p < PX; p++) d[blk[p]] += Math.abs(raw[a + p] - raw[b + p]);
  let g = 0;
  for (let k = 0; k < NB; k++) g += (d[k] /= BP);
  D1.push(d);
  G[f] = g / NB;
}
/** mean |frame i − frame j| inside block k */
const bd = (i, j, k) => {
  const x0 = (k % BX) * B, y0 = ((k / BX) | 0) * B, a = i * PX, b = j * PX;
  let s = 0;
  for (let y = 0; y < B; y++) {
    const r = (y0 + y) * W + x0;
    for (let x = 0; x < B; x++) s += Math.abs(raw[a + r + x] - raw[b + r + x]);
  }
  return s / BP;
};
/** Can block k of frame j be built from frame i moved by up to R_MOVE pixels? Returns the best mean difference. */
const moved = (i, j, k) => {
  const x0 = (k % BX) * B, y0 = ((k / BX) | 0) * B, a = i * PX, b = j * PX;
  const sad = (dx, dy) => {
    let s = 0;
    for (let y = 0; y < B; y++) {
      const yy = Math.min(H - 1, Math.max(0, y0 + y + dy)), r = (y0 + y) * W + x0, rs = yy * W;
      for (let x = 0; x < B; x++) s += Math.abs(raw[b + r + x] - raw[a + rs + Math.min(W - 1, Math.max(0, x0 + x + dx))]);
    }
    return s / BP;
  };
  let best = sad(0, 0), bx = 0, by = 0;
  for (let dy = -R_MOVE; dy <= R_MOVE; dy += 2)
    for (let dx = -R_MOVE; dx <= R_MOVE; dx += 2) {
      const v = sad(dx, dy);
      if (v < best) (best = v), (bx = dx), (by = dy);
    }
  for (let dy = by - 1; dy <= by + 1; dy++) for (let dx = bx - 1; dx <= bx + 1; dx++) best = Math.min(best, sad(dx, dy));
  return best;
};
/** Share of block k's pixels that changed clearly between frames i and j (a thin line or a raindrop: low). */
const cover = (i, j, k) => {
  const x0 = (k % BX) * B, y0 = ((k / BX) | 0) * B, a = i * PX, b = j * PX;
  let n = 0;
  for (let y = 0; y < B; y++) {
    const r = (y0 + y) * W + x0;
    for (let x = 0; x < B; x++) if (Math.abs(raw[a + r + x] - raw[b + r + x]) > 12) n++;
  }
  return n / BP;
};
const COVER = 0.35;
/** Largest step of block k's 3×3 neighbourhood into frame f (0 outside the film or across a cut). */
const around = (f, k) => {
  if (f < 1 || f >= N) return 0;
  const bx = k % BX, by = (k / BX) | 0;
  let m = 0;
  for (let y = Math.max(0, by - 1); y <= Math.min(BY - 1, by + 1); y++)
    for (let x = Math.max(0, bx - 1); x <= Math.min(BX - 1, bx + 1); x++) m = Math.max(m, D1[f][y * BX + x]);
  return m;
};
/** A glitch happens in a calm place: the neighbourhood barely changes in the two frames before and after it.
 *  Fast moves, page turns, bubbles that grow and settle, counters and pans all keep their neighbourhood busy. */
const calm = (f0, f1, k, step) => {
  const lim = Math.max(4, 0.3 * step);
  for (const g of [f0 - 2, f0 - 1, f1 + 1, f1 + 2]) if (!nearCut(g) && around(g, k) > lim) return false;
  return true;
};
// both ways: on a flat surface a darkened patch "matches" plain surface a few pixels away, but not the other way round
const isMotion = (i, j, k, step) => {
  const lim = Math.max(3, 0.35 * step);
  return moved(i, j, k) < lim && moved(j, i, k) < lim;
};
const fd = (i, j) => {
  let s = 0;
  for (let k = 0; k < NB; k++) s += bd(i, j, k);
  return s / NB;
};

// ---- cuts: a full-frame step that does not come back and is far bigger than its neighbours ----
const detected = [];
for (let f = 1; f < N; f++) {
  const g = G[f], nb = Math.max(G[f - 1] ?? 0, G[f + 1] ?? 0);
  if (g < T_CUT || g < 1.6 * nb) continue;
  let many = 0;
  for (let k = 0; k < NB; k++) if (D1[f][k] > 6) many++;
  if (many < 0.5 * NB) continue;
  if (f + 1 < N && fd(f - 1, f + 1) < 0.6 * g) continue; // comes back: a blink, handled below
  detected.push(f);
}
const plannedF = (planned ?? []).map((t) => Math.round(t * fps));
const isPlanned = (f) => plannedF.some((c) => Math.abs(c - f) <= 2);
const unplanned = planned ? detected.filter((f) => !isPlanned(f)) : [];
const cutF = [...plannedF, ...detected];
const nearCut = (f) => cutF.some((c) => f >= c - 2 && f <= c + 2);

// ---- hits per block ----
const hits = [];
for (const f of unplanned) hits.push({ type: "LONCAT", f, k: -1, mag: G[f], note: "full-frame jump that is not a planned cut (camera snap or unplanned cut)" });
for (let f = 1; f < N - 1; f++) {
  if (nearCut(f)) continue;
  const d = D1[f];
  for (let k = 0; k < NB; k++) {
    if (ignored[k]) continue;
    const step = d[k];
    // KEDIP: in at f, out at f+len, frame f−1 ≈ frame f+len, the frames between stay away from f−1
    if (step > T_POP && cover(f - 1, f, k) >= COVER) {
      let found = false;
      for (let len = 1; len <= 3 && f + len < N; len++) {
        if (nearCut(f + len)) break;
        const out = D1[f + len][k];
        if (out < 0.7 * T_POP) continue;
        const back = bd(f - 1, f + len, k);
        if (back >= 0.35 * Math.min(step, out)) continue;
        let away = true;
        for (let j = 1; j < len; j++) if (bd(f - 1, f + j, k) < 0.5 * step) away = false;
        if (!away || !calm(f, f + len, k, Math.min(step, out))) continue;
        hits.push({ type: "KEDIP", f, len, k, mag: Math.min(step, out) });
        found = true;
        break;
      }
      if (found) continue;
    }
    // LONCAT: one step far bigger than the steps around it, and it stays
    if (step > T_JUMP && f >= 2 && f + 2 < N) {
      const ctx = Math.max(D1[f - 2][k], D1[f - 1][k], D1[f + 1][k], D1[f + 2][k]);
      if (step > JUMP_RATIO * Math.max(ctx, 1.5) && bd(f - 1, f + 1, k) >= 0.6 * step && cover(f - 1, f, k) >= COVER && calm(f, f, k, step)) hits.push({ type: "LONCAT", f, k, mag: step, ctx });
    }
  }
}

// ---- FLICKER: the block's mean brightness going up-down-up, sustained over a 1 s window. Block means ignore film
// grain and thin rain; z-fighting, shadow acne and shimmering patches move them. ----
{
  const win = Math.max(2, Math.round(fps));
  const sign = new Int8Array(NB);
  const ring = Array.from({ length: win }, () => new Uint8Array(NB));
  const sum = new Float32Array(NB);
  const flagged = new Int32Array(NB).fill(-1e9);
  const flickRate = Math.min(F_FLICK, 0.6 * fps); // 18 at a 30 fps preview: sparkle and thin-edge shimmer stay below, z-fights alternate faster
  for (let f = 1; f < N; f++) {
    const slot = ring[f % win];
    for (let k = 0; k < NB; k++) sum[k] -= slot[k];
    slot.fill(0);
    if (nearCut(f)) {
      sign.fill(0);
      for (const r of ring) r.fill(0);
      sum.fill(0);
      continue;
    }
    for (let k = 0; k < NB; k++) {
      const dv = M[f][k] - M[f - 1][k];
      if (dv >= T_FLICK || dv <= -T_FLICK) {
        const s = dv > 0 ? 1 : -1;
        if (sign[k] && sign[k] !== s) slot[k] = 1;
        sign[k] = s;
      }
      sum[k] += slot[k];
      if (ignored[k]) continue;
      const rate = sum[k] * (fps / win); // flips per second
      if (rate >= flickRate && f - flagged[k] > win) {
        // recount without the steps that are only motion (a moving camera, a turning page, a waving hand)
        let n = 0, sg = 0;
        for (let g = Math.max(1, f - win + 1); g <= f; g++) {
          const dv = M[g][k] - M[g - 1][k];
          if (Math.abs(dv) < T_FLICK || isMotion(g - 1, g, k, D1[g][k])) continue;
          const s = dv > 0 ? 1 : -1;
          if (sg && sg !== s) n++;
          sg = s;
        }
        const real = n * (fps / win);
        if (real >= flickRate) {
          hits.push({ type: "FLICKER", f: f - win + 1, f1: f, k, mag: real });
          flagged[k] = f;
        }
      }
    }
  }
}

// ---- BLACK / WHITE runs (the first 0.5 s and the last 3 s may fade on purpose) ----
const runs = (test) => {
  const out = [];
  let s = -1;
  for (let f = 0; f <= N; f++) {
    const on = f < N && test(Y[f]);
    if (on && s < 0) s = f;
    if (!on && s >= 0) {
      if (f - s > 0.7 * fps && s > 0.5 * fps && f < N - 3 * fps) out.push([s, f - 1]);
      s = -1;
    }
  }
  return out;
};
for (const [a, b] of runs((y) => y < 20)) hits.push({ type: "BLACK", f: a, f1: b, k: -1, mag: (b - a + 1) / fps });
for (const [a, b] of runs((y) => y > 232)) hits.push({ type: "WHITE", f: a, f1: b, k: -1, mag: (b - a + 1) / fps });

// ---- group hits into findings: same type, touching blocks, within 1 frame (flicker: overlapping windows) ----
const ev = [];
hits.sort((a, b) => a.f - b.f);
for (const h of hits) {
  const bx = h.k < 0 ? -1 : h.k % BX, by = h.k < 0 ? -1 : (h.k / BX) | 0;
  const f1 = h.f1 ?? h.f + (h.len ?? 1) - 1;
  const gap = h.type === "FLICKER" ? Math.round(fps / 2) : 1;
  const e = ev.find((q) => q.type === h.type && h.f <= q.f1 + gap && (h.k < 0 ? q.x0 < 0 : q.x0 >= 0 && bx >= q.x0 - 1 && bx <= q.x1 + 1 && by >= q.y0 - 1 && by <= q.y1 + 1));
  if (e) {
    e.f1 = Math.max(e.f1, f1);
    if (bx >= 0) Object.assign(e, { x0: Math.min(e.x0, bx), x1: Math.max(e.x1, bx), y0: Math.min(e.y0, by), y1: Math.max(e.y1, by) });
    e.blocks++;
    e.per.set(h.f, (e.per.get(h.f) ?? 0) + 1);
    e.mag = Math.max(e.mag, h.mag);
    e.sum += h.mag;
  } else ev.push({ type: h.type, f0: h.f, f1, x0: bx, x1: bx, y0: by, y1: by, blocks: 1, per: new Map([[h.f, 1]]), mag: h.mag, sum: h.mag, note: h.note });
}
// A KEDIP / LONCAT chain longer than 4 frames is either something fast moving through the picture (its box keeps
// growing: motion, fine) or the same place blinking again and again (a flicker).
const info = { motion: 0, particles: 0, faint: 0, edge: 0 };
for (const e of ev) {
  if (e.type === "FLICKER" || e.x0 < 0 || e.f1 - e.f0 < 4) continue;
  const area = (e.x1 - e.x0 + 1) * (e.y1 - e.y0 + 1), perMax = Math.max(...e.per.values());
  if (area > 2.5 * perMax) (e.drop = "motion"), info.motion++;
  else e.type = "FLICKER";
}
// Many small short events spread over the picture within half a second = a particle field (rain, snow, sparks,
// dust), not a glitch. Big ones (a quarter of the frame) always count. A flicker inside such a shot can't be told
// from the particles by numbers: it is left to the visual review of that shot.
const shotOf = (f) => cutF.filter((c) => c <= f).length;
const small = ev.filter((e) => e.type !== "FLICKER" && e.x0 >= 0 && e.blocks < NB / 4);
const busy = (f) => small.filter((q) => shotOf(q.f0) === shotOf(f) && Math.abs(q.f0 - f) <= fps / 2).length >= 7;
const edge = (e) => e.x0 === 0 || e.y0 === 0 || e.x1 === BX - 1 || e.y1 === BY - 1;
for (const e of ev) {
  if (e.drop || e.x0 < 0) continue;
  // something small entering or leaving at the frame edge while the camera moves
  if (e.type !== "FLICKER" && edge(e) && e.blocks < 6) {
    e.drop = "edge";
    info.edge++;
    continue;
  }
  if (e.type === "FLICKER" ? busy(e.f0) || busy(e.f1) : e.blocks < NB / 4 && busy(e.f0)) (e.drop = "particles"), info.particles++;
  else if (e.type !== "FLICKER" && e.sum < S_MIN) (e.drop = "faint"), info.faint++;
}
const live = ev.filter((e) => !e.drop);
const near = (list) => (e) => list.some((t) => t >= tOf(e.f0) - 0.15 && t <= tOf(e.f1) + 0.15);
const isAllowed = near(allow), isSkipped = near(skip);
const skippedEv = live.filter((e) => isSkipped(e) && !isAllowed(e));
const findings0 = live.filter((e) => !isAllowed(e) && !isSkipped(e));
const allowedEv = live.filter(isAllowed);
// Tiers. FAIL: black / white runs, an unplanned full-frame jump, a blink over a quarter of the frame — never by design.
// CHECK: every other KEDIP / LONCAT / FLICKER. Numbers can't tell a glitch from an instant change that is designed
// (a cartoon eye blink, typewriter letters, a counter, a part placed without animation), so a person looks at the strip
// and writes a verdict in <out>/qa-video.review.json: "ok: <why it is intended>" or anything else (= still to fix).
const hardOnly = args.includes("--hard-only"); // on a delivered file with captions: only what is never by design
const isHard = (e) => e.type === "BLACK" || e.type === "WHITE" || e.x0 < 0 || (e.type === "KEDIP" && e.blocks >= NB / 4);
// one review item per happening: CHECK findings of one type in one shot that overlap in time (± ½ s) are merged
// (a lighthouse beam or sea glitter shows as many neighbouring blocks — one look, one verdict)
const merged = [];
for (const e of [...findings0].sort((a, b) => a.f0 - b.f0)) {
  const m = !isHard(e) && merged.find((q) => !isHard(q) && q.type === e.type && shotOf(q.f0) === shotOf(e.f0) && e.f0 <= q.f1 + fps / 2);
  if (m) {
    Object.assign(m, { f1: Math.max(m.f1, e.f1), x0: Math.min(m.x0, e.x0), x1: Math.max(m.x1, e.x1), y0: Math.min(m.y0, e.y0), y1: Math.max(m.y1, e.y1), mag: Math.max(m.mag, e.mag), sum: m.sum + e.sum, blocks: m.blocks + e.blocks });
    m.parts = (m.parts ?? 1) + 1;
  } else merged.push({ ...e });
}
const findings = hardOnly ? merged.filter(isHard) : merged;
const severity = (e) => (isHard(e) ? 1e6 : 0) + e.mag * Math.sqrt(e.blocks);
findings.sort((a, b) => severity(b) - severity(a));
const idOf = (e) => `${e.type}@${tOf(e.f0).toFixed(2)}`;
const reviewFile = path.join(outDir, "qa-video.review.json");
let verdicts = {};
try {
  verdicts = JSON.parse(fs.readFileSync(reviewFile, "utf8"));
} catch {}
const accepted = (e) => !isHard(e) && /^ok\b.{6,}/i.test(String(verdicts[idOf(e)] ?? "").trim());

// ---- strips: 5 frames around each finding, red box on the place ----
const SW = portrait ? 216 : 384, SH = Math.round((SW * st.height) / st.width / 2) * 2;
findings.slice(0, 30).forEach((e, i) => {
  const F0 = Math.max(0, Math.min(N - 5, e.f0 - 2));
  const name = `qa-video_${String(i + 1).padStart(2, "0")}.jpg`;
  const box = e.x0 < 0 ? `drawbox=x=0:y=0:w=iw:h=ih:color=red@0.9:t=4` : `drawbox=x=${Math.round(((e.x0 * B) / W) * SW) - 2}:y=${Math.round(((e.y0 * B) / H) * SH) - 2}:w=${Math.round((((e.x1 - e.x0 + 1) * B) / W) * SW) + 4}:h=${Math.round((((e.y1 - e.y0 + 1) * B) / H) * SH) + 4}:color=red@0.9:t=2`;
  try {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", (F0 / fps).toFixed(4), "-i", file, "-an", "-vf", `scale=${SW}:${SH},${box},tile=5x1:padding=3:color=black`, "-frames:v", "1", path.join(outDir, name)]);
    e.strip = name;
  } catch {}
});

const pct = (v, n) => Math.round((v / n) * 100);
const rows = findings.map((e) => ({
  id: idOf(e),
  tier: isHard(e) ? "FAIL" : accepted(e) ? "OK" : "CHECK",
  type: e.type,
  from: +tOf(e.f0).toFixed(3),
  to: +tOf(e.f1).toFixed(3),
  frames: [e.f0, e.f1],
  where: e.x0 < 0 ? "whole frame" : `x ${pct(e.x0, BX)}–${pct(e.x1 + 1, BX)} %, y ${pct(e.y0, BY)}–${pct(e.y1 + 1, BY)} %`,
  size: e.blocks,
  strength: +e.mag.toFixed(1),
  ...(e.note ? { note: e.note } : {}),
  ...(e.strip ? { strip: e.strip } : {}),
  ...(verdicts[idOf(e)] ? { verdict: verdicts[idOf(e)] } : {}),
}));
const hard = rows.filter((r) => r.tier === "FAIL"), open = rows.filter((r) => r.tier === "CHECK");
// keep the verdict file in step with this render: every finding has a line, old ids are dropped
const nextVerdicts = Object.fromEntries(rows.filter((r) => r.tier !== "FAIL").map((r) => [r.id, verdicts[r.id] ?? ""]));
if (Object.keys(nextVerdicts).length) fs.writeFileSync(reviewFile, JSON.stringify(nextVerdicts, null, 2) + "\n");
else fs.rmSync(reviewFile, { force: true });
const report = {
  file: path.resolve(file),
  size: `${st.width}x${st.height}`,
  fps: +fps.toFixed(3),
  frames: N,
  cuts: { planned: planned ?? "not given", detected: detected.map((f) => +tOf(f).toFixed(3)), unplanned: unplanned.map((f) => +tOf(f).toFixed(3)) },
  ignore,
  ignoredAsMotion: info.motion,
  ignoredAsParticles: info.particles,
  ignoredAsFaint: info.faint,
  ignoredAtEdge: info.edge,
  allowed: allowedEv.map((e) => ({ type: e.type, from: +tOf(e.f0).toFixed(3), to: +tOf(e.f1).toFixed(3) })),
  ...(args.includes("--debug") ? { dropped: ev.filter((e) => e.drop).map((e) => ({ type: e.type, why: e.drop, from: +tOf(e.f0).toFixed(3), to: +tOf(e.f1).toFixed(3), x: [e.x0, e.x1], y: [e.y0, e.y1], blocks: e.blocks, mag: +e.mag.toFixed(1) })) } : {}),
  findings: rows,
  result: hard.length ? "FAIL" : open.length ? "CHECK" : "PASS",
};
fs.writeFileSync(path.join(outDir, "qa-video.json"), JSON.stringify(report, null, 2) + "\n");

console.log(`qa-video ${path.basename(file)}: ${N} frames @ ${fps.toFixed(2)} fps, ${planned ? `${plannedF.length} planned cuts` : `${detected.length} cuts detected (no plan given — check each is intended)`}`);
for (const r of rows.slice(0, 30)) console.log(`  ${r.tier.padEnd(5)} ${r.id.padEnd(15)} ${r.from.toFixed(2)}–${r.to.toFixed(2)} s, ${r.where}, strength ${r.strength}${r.strip ? ` → ${path.join(outDir, r.strip)}` : ""}${r.verdict ? `  [${r.verdict}]` : ""}`);
if (rows.length > 30) console.log(`  … ${rows.length - 30} more in ${path.join(outDir, "qa-video.json")}`);
if (info.particles) console.log(`  note: ${info.particles} changes inside a particle field (rain, sparks…) were left to the eye — look at those shots in the review`);
if (allowedEv.length) console.log(`  allowed by --allow: ${allowedEv.length} (justify each in the review)`);
if (skippedEv.length) console.log(`  ${skippedEv.length} change${skippedEv.length > 1 ? "s" : ""} during fast camera moves not scanned (the scene checks cover them)`);
if (hard.length) console.log(`qa-video: FAIL (${hard.length}) — a real glitch: open the strips, fix the cause, render again`);
else if (open.length) console.log(`qa-video: CHECK (${open.length}) — open each strip; in ${reviewFile} write "ok: <why it is intended>" for designed changes, fix the rest, then run qa-video again`);
else console.log("qa-video: PASS");
process.exit(hard.length ? 1 : open.length ? 3 : 0);
