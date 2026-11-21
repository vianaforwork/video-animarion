// Script ↔ voice-over alignment without a speech recogniser, and script ↔ whisper word matching.
// Used by scripts/transcribe.mjs.
//
// alignScript(): the VO's speech segments (silence detection) are matched to the script's clauses by a global
// dynamic programme — every clause and every segment is used exactly once, in order, so an early mistake can
// not push later sentences off (no cumulative drift). A block of 1–6 clauses ↔ 1–6 segments costs how far its
// speaking rate (syllables per second) is from the narrator's local rate, plus penalties for sentence ends
// without a pause, long pauses inside a clause, and very short pauses at sentence ends. Breath / click segments
// can be skipped. Pass 1 uses the whole-VO rate, pass 2 the local rate around each block (slow dramatic
// passages and fast ones keep their own tempo). Inside a block words are placed by syllables over speech time.

import { spawnSync } from "node:child_process";

const run = (cmd, a) => spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 1 << 28 });

export const probeDuration = (file) =>
  Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).stdout.trim());

export function speechSegments(file, duration, noiseDb = -38, minSilence = 0.18) {
  const log = run("ffmpeg", ["-v", "info", "-i", file, "-af", `silencedetect=n=${noiseDb}dB:d=${minSilence}`, "-f", "null", "-"]).stderr;
  const st = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const en = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const segs = [];
  let cur = 0;
  st.forEach((s, i) => { if (s - cur > 0.06) segs.push([cur, s]); cur = en[i] ?? duration; });
  if (duration - cur > 0.06) segs.push([cur, duration]);
  return segs;
}

// ── Indonesian text helpers ───────────────────────────────────────────────────────────────────────────
const ONES = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
export function numberWords(n) {
  n = Math.floor(n);
  if (n === 0) return "nol";
  if (n < 10) return ONES[n];
  if (n === 10) return "sepuluh";
  if (n === 11) return "sebelas";
  if (n < 20) return `${ONES[n - 10]} belas`;
  if (n < 100) return `${ONES[Math.floor(n / 10)]} puluh ${ONES[n % 10]}`.trim();
  if (n < 200) return `seratus ${n % 100 ? numberWords(n % 100) : ""}`.trim();
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} ratus ${n % 100 ? numberWords(n % 100) : ""}`.trim();
  if (n < 2000) return `seribu ${n % 1000 ? numberWords(n % 1000) : ""}`.trim();
  if (n < 1e6) return `${numberWords(Math.floor(n / 1000))} ribu ${n % 1000 ? numberWords(n % 1000) : ""}`.trim();
  return `${numberWords(Math.floor(n / 1e6))} juta ${n % 1e6 ? numberWords(n % 1e6) : ""}`.trim();
}
// "02.13" → "dua tiga belas", "500" → "lima ratus", "13:00" → "tiga belas nol"
const spellDigits = (w) => w.replace(/\d+/g, (d) => ` ${numberWords(Number(d))} `);

export function syllables(token) {
  const raw = token.replace(/[^\p{L}\p{N}]/gu, "");
  if (!raw) return 0;
  if (/^\p{Lu}{2,6}$/u.test(raw)) return raw.length; // acronyms read letter by letter (CCTV, KTP)
  let total = 0;
  for (const part of spellDigits(token.toLowerCase()).split(/[^a-zà-ÿ]+/).filter(Boolean)) {
    const v = (part.match(/[aeiouéè]/g) || []).length;
    const diph = (part.match(/(ai|au|oi|ei)(?=[^aeiou]|$)/g) || []).length;
    total += Math.max(1, v - diph);
  }
  return Math.max(1, total);
}

export const norm = (w) => spellDigits(w.toLowerCase()).replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();

// tokens with the pause strength after each: 2 = sentence end / paragraph / ellipsis, 1 = comma-like, 0 = none
export function tokenize(text) {
  const out = [];
  const lines = text.replace(/\r/g, "").split("\n");
  lines.forEach((line, li) => {
    const toks = line.trim().split(/\s+/).filter(Boolean);
    toks.forEach((t, i) => {
      let p = 0;
      if (/(\.\.\.|…)["”'’)]*$/.test(t) || /[.?!]["”'’)]*$/.test(t)) p = 2;
      else if (/[,;:—–]["”'’)]*$/.test(t) || /^[—–]$/.test(t)) p = 1;
      if (i === toks.length - 1 && li < lines.length - 1) p = Math.max(p, 2); // end of a script line
      out.push({ w: t, p, syl: syllables(t) });
    });
  });
  // a dash on its own carries no sound: fold it into the previous token's pause
  return out.filter((t, i, a) => { if (t.syl > 0) return true; if (i > 0) a[i - 1].p = Math.max(a[i - 1].p, t.p); return false; });
}

export function clausesOf(toks) {
  const cl = [];
  let cur = [];
  for (const t of toks) { cur.push(t); if (t.p > 0) { cl.push({ toks: cur, syl: cur.reduce((s, x) => s + x.syl, 0), end: t.p }); cur = []; } }
  if (cur.length) cl.push({ toks: cur, syl: cur.reduce((s, x) => s + x.syl, 0), end: 2 });
  return cl;
}

// ── the aligner ───────────────────────────────────────────────────────────────────────────────────────
// Every speech segment receives a contiguous run of words (a pause never falls inside a word); a very short
// segment may receive none (breath, click). Cost of a segment = how far its rate is from the narrator's local
// rate (a phrase end is lengthened, so a constant is added to the expected time) + the cost of the pause that
// follows it (cheap after a sentence end, dearer after a comma, dear in the middle of a clause, more so the
// longer the pause) + the punctuation the narrator ran through without pausing.
const MAXW = 40, TAIL = 0.12;
const SKIP = [0, 0.08, 0.9]; // ran through: nothing, a comma, a sentence end / ellipsis
function solve(toks, segs, rateAt) {
  const N = toks.length, M = segs.length;
  const dur = segs.map(([a, b]) => b - a);
  const gapAfter = segs.map((s, j) => (j + 1 < M ? segs[j + 1][0] - s[1] : 9));
  const pre = [0]; for (const t of toks) pre.push(pre.at(-1) + t.syl);
  const skp = [0]; for (const t of toks) skp.push(skp.at(-1) + SKIP[t.p]);
  const INF = 1e18;
  const f = Array.from({ length: M + 1 }, () => new Float64Array(N + 1).fill(INF));
  const bk = Array.from({ length: M + 1 }, () => new Int32Array(N + 1).fill(-1));
  f[0][0] = 0;
  for (let j = 0; j < M; j++) {
    const R = rateAt(segs[j][0], segs[j][1]), g = gapAfter[j];
    for (let i = 0; i <= N; i++) {
      const base = f[j][i];
      if (base >= INF) continue;
      if (dur[j] < 0.45) { const c = base + 1.2 + 10 * dur[j]; if (c < f[j + 1][i]) { f[j + 1][i] = c; bk[j + 1][i] = i; } }
      for (let k = i + 1; k <= N && k - i <= MAXW; k++) {
        const sy = pre[k] - pre[i];
        const lr = Math.log(dur[j] / (sy / R + TAIL));
        const p = toks[k - 1].p;
        // the pause after this segment ends at word k-1 (none after the last segment)
        let pc = 0;
        if (j < M - 1) pc = p === 2 ? Math.max(0, 0.3 - g) * 3 : p === 1 ? 0.25 : 1.3 + 1.2 * Math.max(0, Math.min(g, 2) - 0.4);
        const c = base + 2.2 * lr * lr * Math.sqrt(sy) + pc + (skp[k - 1] - skp[i]);
        if (c < f[j + 1][k]) { f[j + 1][k] = c; bk[j + 1][k] = i; }
      }
    }
  }
  if (f[M][N] >= INF) return null;
  const groups = new Array(M);
  for (let j = M, k = N; j > 0; j--) { const i = bk[j][k]; groups[j - 1] = [i, k]; k = i; }
  return { groups, cost: f[M][N] };
}

function localRate(toks, segs, groups, fallback) {
  // syllables per second of the solved segments, smoothed over ±18 s
  const pts = groups.map(([i, k], j) => ({ t: (segs[j][0] + segs[j][1]) / 2, sy: toks.slice(i, k).reduce((s, t) => s + t.syl, 0), sp: Math.max(0.05, segs[j][1] - segs[j][0] - TAIL) })).filter((p) => p.sy > 0);
  return (t0, t1) => {
    const t = (t0 + t1) / 2;
    let sy = 0, sp = 0;
    for (const p of pts) { const w = Math.exp(-(((p.t - t) / 18) ** 2)); sy += w * p.sy; sp += w * p.sp; }
    return sp > 1 ? sy / sp : fallback;
  };
}

export function alignScript(text, segs) {
  const toks = tokenize(text);
  if (!segs.length || !toks.length) return null;
  const totSyl = toks.reduce((s, t) => s + t.syl, 0);
  const totSp = segs.reduce((s, [a, b]) => s + Math.max(0.05, b - a - TAIL), 0);
  const R0 = totSyl / totSp;
  let sol = solve(toks, segs, () => R0);
  if (!sol) return null;
  for (let pass = 0; pass < 2; pass++) { const s2 = solve(toks, segs, localRate(toks, segs, sol.groups, R0)); if (s2) sol = s2; }
  const rate = localRate(toks, segs, sol.groups, R0);
  const words = [], warnings = [];
  sol.groups.forEach(([i, k], j) => {
    if (k === i) return;
    const ts = toks.slice(i, k), [x, y] = segs[j];
    const sy = ts.reduce((s, t) => s + t.syl, 0), sp = y - x;
    let u = 0;
    for (const t of ts) { words.push([t.w, x + (sp * u) / sy, x + (sp * (u + t.syl)) / sy]); u += t.syl; }
    const dev = Math.log(sp / (sy / rate(x, y) + TAIL));
    if (Math.abs(dev) > 0.6 && sy >= 6) warnings.push(`${x.toFixed(1)} s "${ts.slice(0, 5).map((t) => t.w).join(" ")}…" is spoken ${dev < 0 ? "much faster" : "much slower"} than the rest — look at this line on the stills`);
  });
  for (let k = 1; k < words.length; k++) if (words[k][1] < words[k - 1][2]) words[k][1] = words[k - 1][2];
  return { words, warnings, clauses: clausesOf(toks).length, segments: segs.length, rate: R0 };
}

// ── script words with whisper timings ─────────────────────────────────────────────────────────────────
// Keeps the script's spelling (names, numbers as written) and takes the time of each word from whisper,
// matched by an edit-distance alignment of the normalised word streams; unmatched script words are
// interpolated between their matched neighbours.
export function scriptOnWhisper(text, hyp) {
  const toks = tokenize(text);
  const sw = toks.map((t) => norm(t.w));
  // whisper may write "13" for "tiga belas": expand both sides to single words for matching
  const S = [], sIdx = [];
  sw.forEach((w, i) => w.split(" ").filter(Boolean).forEach((p) => { S.push(p); sIdx.push(i); }));
  const H = [], hIdx = [];
  hyp.forEach(([w], i) => norm(w).split(" ").filter(Boolean).forEach((p) => { H.push(p); hIdx.push(i); }));
  const n = S.length, m = H.length;
  const D = Array.from({ length: n + 1 }, (_, i) => Int32Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  const near = (a, b) => a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++)
    D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (near(S[i - 1], H[j - 1]) ? 0 : 1));
  const startOf = new Array(toks.length).fill(null), endOf = new Array(toks.length).fill(null);
  let i = n, j = m, matched = 0;
  while (i > 0 && j > 0) {
    if (D[i][j] === D[i - 1][j - 1] + (near(S[i - 1], H[j - 1]) ? 0 : 1)) {
      if (near(S[i - 1], H[j - 1])) {
        const ti = sIdx[i - 1], h = hyp[hIdx[j - 1]];
        startOf[ti] = startOf[ti] === null ? h[1] : Math.min(startOf[ti], h[1]);
        endOf[ti] = endOf[ti] === null ? h[2] : Math.max(endOf[ti], h[2]);
        matched++;
      }
      i--; j--;
    } else if (D[i][j] === D[i - 1][j] + 1) i--; else j--;
  }
  const words = toks.map((t, k) => [t.w, startOf[k], endOf[k]]);
  // interpolate the unmatched words by syllables between matched neighbours
  for (let k = 0; k < words.length; k++) {
    if (words[k][1] !== null) continue;
    let a = k - 1; while (a >= 0 && words[a][1] === null) a--;
    let b = k; while (b < words.length && words[b][1] === null) b++;
    const t0 = a >= 0 ? words[a][2] : (b < words.length ? Math.max(0, words[b][1] - 0.4) : 0);
    const t1 = b < words.length ? words[b][1] : t0 + 0.4 * (b - a);
    const run = toks.slice(a + 1, b), tot = run.reduce((s, t) => s + t.syl, 0) || 1;
    let u = 0;
    run.forEach((t, r) => { words[a + 1 + r][1] = t0 + ((t1 - t0) * u) / tot; u += t.syl; words[a + 1 + r][2] = t0 + ((t1 - t0) * u) / tot; });
    k = b - 1;
  }
  for (const w of words) if (w[2] < w[1] + 0.06) w[2] = w[1] + 0.06; // whisper gives some words zero length
  for (let k = 1; k < words.length; k++) if (words[k][1] < words[k - 1][1]) words[k][1] = words[k - 1][1];
  return { words, matched: matched / Math.max(1, n) };
}
