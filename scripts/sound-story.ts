// Automatic sound department for any CINÉSTORY story. Compiles the story exactly like the picture, then
// lays ambience per place (and per set state: lamps, beams, boats…), footsteps from the walk cycles, SFX
// per action / set change / story cue, a score per scene mood with hits, risers and strategic silence,
// and mixes it all under the untouched voice-over (ducked). All synthesised: no samples, no licences.
//   node scripts/sound-story.ts src/stories/data/<id>.json   → public/audio/<id>-mix.wav

import fs from "node:fs";
import path from "node:path";
import { compile } from "../src/director/compile.ts";
import type { Story } from "../src/director/story.ts";
import {
  Bus, S, SR, bell, biquad, boom, breath, click, creak, dbg, decode, doorClose, doorOpen, drone, duckEnvelope, envAR, envExp, ep, foghorn, freeverb,
  gull, heartbeat, kalimba, knock, noise, pad, pink, pluck, radio, riser, rng, rustle, scribble, shimmer, sine, smooth, subPulse, thud, waveCrash, whoosh, writeWav, type Out,
} from "./synth.ts";

const file = process.argv[2];
if (!file) { console.error("usage: node scripts/sound-story.ts src/stories/data/<id>.json"); process.exit(1); }
const story = JSON.parse(fs.readFileSync(file, "utf8")) as Story;
const P = compile(story);
const SP = P.sound;
const DUR = SP.duration, N = Math.round(DUR * SR);
const amb = new Bus(N), music = new Bus(N), sfx = new Bus(N), verb = new Bus(N);
const M: Out = { dry: music, verb }, F: Out = { dry: sfx, verb }, A: Out = { dry: amb, verb };
const R = rng(2026);

// ── set state, sampled (lamps, beams, boats change the ambience) ───────────
const STEP = 0.05;
const states = Array.from({ length: Math.ceil(DUR / STEP) + 1 }, (_, k) => P.setAt(k * STEP));
const st = (i: number, k: string) => states[Math.min(states.length - 1, Math.floor(i / SR / STEP))]?.[k] ?? 0;

// ── 1. ambience ─────────────────────────────────────────────────────────────
{
  const ids = [...new Set(SP.amb.map((a) => a.id))];
  const G: Record<string, Float32Array> = Object.fromEntries(ids.map((k) => [k, new Float32Array(N)]));
  const dark = new Float32Array(N);
  for (const a of SP.amb) {
    const d = { night: 1, storm: 1, dusk: 0.6, dawn: 0.35, day: 0 }[a.time] ?? 1;
    for (let i = S(a.t0); i < Math.min(N, S(a.t1)); i++) { G[a.id][i] = 1; dark[i] = d; }
  }
  for (const g of [...Object.values(G), dark]) { let s = g[0]; for (let i = 0; i < N; i++) { s += (g[i] - s) * 0.0008; g[i] = s; } }
  const has = (k: string) => G[k] !== undefined;
  const g0 = (k: string, i: number) => (G[k] ? G[k][i] : 0);
  const bed = (seed: number, f: (x: Float32Array) => Float32Array, gain: (i: number) => number, g: number, pan: number) => {
    const x = f(pink(N, seed));
    for (let i = 0; i < N; i++) x[i] *= gain(i);
    amb.add(0, x, g, pan);
  };
  // the sea: slow swells (periods 7–11 s) of surf, close (sea), below the cliff (coast), far (gallery), muffled (cottage)
  const swell = (i: number) => { const t = i / SR; return 0.55 + 0.25 * Math.sin(t * 0.71) + 0.2 * Math.sin(t * 0.43 + 1.3); };
  if (has("coast") || has("gallery") || has("cottage") || has("sea")) {
    bed(11, (x) => biquad(x, "lp", 520), (i) => swell(i) * (0.55 * g0("coast", i) + 0.3 * g0("gallery", i) + 0.35 * g0("cottage", i) + 0.45 * g0("sea", i)), 0.6, -0.1);
    bed(12, (x) => biquad(biquad(x, "hp", 900), "lp", 5200), (i) => swell(i) ** 2 * (0.12 * g0("coast", i) + 0.05 * g0("gallery", i) + 0.18 * g0("sea", i)), 0.5, 0.15);
    // crashes on the rocks
    for (let t = 1.5 + R() * 3; t < DUR; t += 6 + R() * 4) {
      const i = S(t), w = 0.5 * g0("coast", i) + 0.25 * g0("gallery", i) + 0.18 * g0("cottage", i);
      if (w > 0.05) waveCrash(A, t, 0.3 * w, R() * 1.2 - 0.6, g0("cottage", i) > 0.5 ? 1 : 0.4);
    }
    // water lapping on a hull (out at sea)
    if (has("sea")) for (let t = 0.3; t < DUR; t += 0.35 + R() * 0.6) { const w = g0("sea", S(t)); if (w < 0.05) continue; const x = envExp(biquad(noise(S(0.25), Math.round(t * 100)), "bp", 380 + R() * 500, 1.5), 0.06, 0.005); amb.add(t, x, 0.5 * w, R() * 1.4 - 0.7); }
  }
  // wind: gusting band of noise; a whistle on the gallery railing; low and muffled indoors
  if (has("coast") || has("gallery") || has("cottage") || has("sea")) {
    const gust = (i: number) => { const t = i / SR; return 0.5 + 0.3 * Math.sin(t * 0.37 + 2) + 0.2 * Math.sin(t * 1.13); };
    bed(21, (x) => biquad(x, "bp", (i) => 500 + 400 * gust(i), 0.6), (i) => gust(i) * (0.28 * g0("coast", i) + 0.55 * g0("gallery", i) + 0.18 * g0("sea", i)), 0.55, 0.25);
    bed(22, (x) => biquad(x, "lp", 260), (i) => gust(i) * 0.35 * g0("cottage", i), 0.5, 0.1);
    bed(23, (x) => biquad(x, "bp", (i) => 1150 + 260 * gust(i), 6), (i) => gust(i) ** 3 * 0.5 * g0("gallery", i), 0.4, -0.3);
  }
  // crickets in the grass at night (outside, faint indoors)
  {
    const L = new Float32Array(N), Rr = new Float32Array(N);
    for (let c = 0; c < 5; c++) {
      const r = rng(100 + c), f = 4100 + r() * 1000, rate = 0.5 + r() * 0.5, pan = r() * 1.6 - 0.8;
      for (let t = r(); t < DUR; t += rate * (0.85 + r() * 0.3)) for (let p = 0; p < 3; p++) {
        const o = S(t + p * 0.045), n = S(0.03);
        for (let i = 0; i < n; i++) { const x = Math.sin((2 * Math.PI * f * i) / SR) * Math.sin((Math.PI * i) / n) * 0.5; if (o + i < N) { L[o + i] += x * Math.cos(((pan + 1) * Math.PI) / 4); Rr[o + i] += x * Math.sin(((pan + 1) * Math.PI) / 4); } }
      }
    }
    for (let i = 0; i < N; i++) { const k = dark[i] > 0.7 ? (g0("coast", i) + 0.15 * g0("cottage", i) + 0.4 * g0("outdoor", i) + 0.15 * g0("room", i) + 1.2 * g0("forest", i)) * (dark[i] - 0.7) / 0.3 : 0; L[i] *= k; Rr[i] *= k; }
    amb.addSt(0, L, Rr, 0.02);
  }
  // gulls by day / dawn on the coast or at sea
  for (let t = 2 + R() * 3; t < DUR; t += 3 + R() * 5) { const i = S(t); const w = (1 - dark[i]) * (g0("coast", i) + g0("sea", i) + 0.4 * g0("gallery", i)); if (w > 0.25) gull(A, t, 0.05 * w, R() * 1.6 - 0.8); }
  // the lighthouse lamp: motor hum + clockwork tick when the beam turns
  if (has("coast") || has("gallery") || has("cottage")) {
    const x = new Float32Array(N);
    for (let i = 0; i < N; i++) { const t = i / SR, b = st(i, "beam"); const w = b * (0.06 * g0("coast", i) + 0.5 * g0("gallery", i) + 0.02 * g0("cottage", i)); x[i] = w * (Math.sin(2 * Math.PI * 60 * t) * 0.5 + Math.sin(2 * Math.PI * 120 * t) * 0.25 + Math.sin(2 * Math.PI * 180 * t) * 0.1); }
    amb.add(0, x, 0.05, 0.1);
    for (let t = 0.2; t < DUR; t += 0.5) { const i = S(t); const w = st(i, "beam") * g0("gallery", i); if (w > 0.05) click(A, t, 3200, 0.02 * w, 0.2, 0.006); }
  }
  // indoors: room tone, the wall clock, the oil lamp's hiss
  if (has("cottage") || has("room")) {
    bed(31, (x) => biquad(x, "lp", 170), (i) => 0.4 * (g0("cottage", i) + g0("room", i)), 0.5, 0);
    bed(32, (x) => biquad(x, "hp", 4000), (i) => 0.05 * st(i, "lamp") * g0("cottage", i), 0.4, 0.2);
    for (let t = 0.5; t < DUR; t += 1) { const w = g0("cottage", S(t)) + g0("room", S(t)); if (w > 0.1) click(A, t, 2600, 0.012 * w, -0.4, 0.008); }
  }
  // a boat's generator for its lamps (at sea)
  if (has("sea")) {
    const x = new Float32Array(N);
    for (let i = 0; i < N; i++) { const t = i / SR; const w = st(i, "boat") * g0("sea", i); x[i] = w * (Math.sin(2 * Math.PI * 47 * t) * 0.5 + Math.sin(2 * Math.PI * 94 * t + Math.sin(t * 3)) * 0.3) * (0.8 + 0.2 * Math.sin(t * 13)); }
    biquad(x, "lp", 400);
    amb.add(0, x, 0.04, -0.2);
  }
  // hospital: ventilation, fluorescent hum, a distant monitor beeping
  if (has("hospital")) {
    bed(51, (x) => biquad(biquad(x, "lp", 420), "hp", 60), (i) => 0.38 * g0("hospital", i), 0.55, 0);
    const hum = new Float32Array(N);
    for (let i = 0; i < N; i++) { const t = i / SR; hum[i] = (Math.sin(2 * Math.PI * 100 * t) * 0.6 + Math.sin(2 * Math.PI * 200 * t) * 0.25) * 0.004 * g0("hospital", i); }
    amb.add(0, hum, 1, 0.1);
    for (let t = 1.2; t < DUR; t += 1.0) { const w = g0("hospital", S(t)); if (w > 0.1) { const x = envAR(sine(0.09, 1180), 0.005, 0.03); amb.add(t, x, 0.01 * w, -0.6); } }
  }
  // market: crowd murmur, distant calls
  if (has("market")) {
    bed(52, (x) => biquad(biquad(x, "bp", 650, 0.5), "lp", 2400), (i) => (0.3 + 0.1 * Math.sin(i / SR * 0.4)) * g0("market", i), 0.6, 0.1);
    for (let t = 1 + R() * 2; t < DUR; t += 1.5 + R() * 2.5) { const w = g0("market", S(t)); if (w < 0.1) continue; const f0 = 180 + R() * 160, d = 0.4 + R() * 0.5, x = sine(d, (u) => f0 * (1 + 0.25 * Math.sin(u * 9))); for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * 2) * Math.sin(Math.PI * i / x.length); biquad(x, "bp", 900, 0.8); amb.add(t, x, 0.02 * w, R() * 1.6 - 0.8); }
  }
  // forest at night: crickets (below), wind in leaves, an owl now and then
  if (has("forest")) {
    bed(53, (x) => biquad(biquad(x, "hp", 900), "lp", 5000), (i) => (0.08 + 0.06 * Math.max(0, Math.sin(i / SR * 0.31))) * g0("forest", i), 0.5, -0.2);
    for (let t = 4 + R() * 4; t < DUR; t += 8 + R() * 7) { const w = g0("forest", S(t)); if (w < 0.1) continue; for (const [dt, f] of [[0, 410], [0.45, 380], [0.75, 390]]) { const x = envAR(sine(0.32, (u) => f * (1 - 0.06 * u)), 0.04, 0.15); amb.add(t + dt, x, 0.035 * w, 0.5); } }
  }
  // generic fallbacks for other worlds
  if (has("outdoor")) bed(41, (x) => biquad(x, "lp", 400), (i) => 0.35 * g0("outdoor", i), 0.5, 0.1);
  if (has("hall")) bed(42, (x) => biquad(biquad(x, "lp", 900), "hp", 120), (i) => 0.16 * g0("hall", i), 0.6, -0.05);
  if (has("studio")) bed(43, (x) => biquad(biquad(x, "hp", 2600), "lp", 9000), (i) => 0.06 * g0("studio", i), 0.5, 0);
}

// ── 2. foley: footsteps from the walk/run cycles ────────────────────────────
for (const s of SP.steps) {
  const g = (s.run ? 0.5 : 0.32) * (0.7 + 0.3 * s.g), pan = R() * 0.4 - 0.2;
  if (s.surface === "grass" || s.surface === "sand") { const x = envExp(biquad(noise(S(0.14), Math.round(s.t * 97)), "bp", 1400 + R() * 900, 0.8), 0.04, 0.004); sfx.add(s.t, x, g * 1.1, pan); }
  else if (s.surface === "wood") { thud(F, s.t, g * 0.8, 95, 0.06, pan); click(F, s.t + 0.005, 900, g * 0.25, pan, 0.02); if (R() > 0.75) creak(F, s.t + 0.05, 0.25, g * 0.25, 200 + R() * 80, pan); }
  else if (s.surface === "metal") { click(F, s.t, 1200, g * 0.5, pan, 0.05); thud(F, s.t, g * 0.4, 120, 0.05, pan); }
  else { click(F, s.t, 2100, g * 0.45, pan, 0.012); thud(F, s.t, g * 0.5, 80, 0.05, pan); }
}

// ── 3. SFX: action cues, set changes, story cues ────────────────────────────
const play = (t: number, name: string, dur = 1) => {
  switch (name) {
    case "knock": return knock(F, t, 0.5);
    case "door-open": return doorOpen(F, t, 0.5);
    case "door-close": return doorClose(F, t, 0.5);
    case "slam": thud(F, t, 1.0, 55, 0.3); return whoosh(F, t - 0.12, 0.15, 0.2, 400, 1600);
    case "click": return click(F, t, 1600, 0.25, 0.1, 0.01);
    case "creak": return creak(F, t, 0.6, 0.35, 190, 0);
    case "machine": thud(F, t, 0.5, 80, 0.2); return creak(F, t + 0.1, 0.8, 0.2, 120, 0);
    case "shimmer": return shimmer(F, t, 2.2, 0.16, 2600, 3);
    case "reveal": riser(F, t - 1.2, 1.2, 0.12); return bell(F, t, "D6", 0.08, 3);
    case "hit": boom(F, t, 0.5); return whoosh(F, t - 0.25, 0.3, 0.2, 2400, 300);
    case "heartbeat": for (let k = 0; k < Math.max(1, Math.floor(dur / 0.9)); k++) heartbeat(F, t + k * 0.9, 0.5 * (1 - (k / Math.max(1, dur / 0.9)) * 0.4)); return;
    case "rustle": return rustle(F, t, 0.4, 0.18, 0.1);
    case "breath": return breath(F, t, 0.8, 1.0, 0.18);
    case "scribble": return scribble(F, t, t + dur, 0.3);
    case "whoosh": return whoosh(F, t, 0.6, 0.3, 300, 2600);
    case "boom": return boom(F, t, 0.6);
    case "riser": return riser(F, t - 1.5, 1.5, 0.25);
    case "foghorn": return foghorn(F, t, 0.35);
    case "bell": return bell(F, t, "A5", 0.15, 3);
    case "radio": case "static": return radio(F, t, Math.max(0.6, dur), 0.25);
    case "wave-crash": return waveCrash(F, t, 0.45, -0.2);
    case "gull": return gull(F, t, 0.12, 0.3);
    case "notif": case "ping": return bell(F, t, "E6", 0.12, 1.2);
    case "tick": return click(F, t, 3000, 0.2, 0, 0.006);
    case "thunder": { boom(M, t, 0.4, 38); const x = envExp(biquad(pink(S(4), 77), "lp", 600), 1.2, 0.05); return sfx.add(t + 0.1, x, 0.5, -0.3); }
    case "splash": { const x = envExp(biquad(noise(S(0.8), 5), "bp", 1200, 0.5), 0.18, 0.004); return sfx.add(t, x, 0.4, 0); }
    case "engine": { const x = sine(Math.max(1, dur), (u) => 40 + 3 * Math.sin(u * 2)); for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * 4) * 0.5; biquad(x, "lp", 300); envAR(x, 0.4, 0.6); return sfx.add(t, x, 0.12, 0); }
    case "stamp": thud(F, t, 0.35, 70, 0.12); return click(F, t, 1400, 0.15, 0, 0.02);
    case "roll": { for (let k = 0; k < Math.max(1, dur / 0.55); k++) creak(F, t + k * 0.55 + R() * 0.1, 0.22, 0.1, 520 + R() * 160, 0.3); const x = biquad(pink(S(Math.max(0.5, dur)), 61), "bp", 300, 0.8); envAR(x, 0.3, 0.4); return sfx.add(t, x, 0.12, 0.2); }
    case "beep": return bell(F, t, "B5", 0.06, 0.4);
    case "twig": { const x = envExp(biquad(noise(S(0.12), 12), "hp", 1800), 0.02, 0.001); sfx.add(t, x, 0.5, 0.3); return click(F, t + 0.03, 2400, 0.2, 0.3, 0.01); }
    case "coins": for (let k = 0; k < 4; k++) bell(F, t + k * 0.06, ["E7", "G6", "C7", "A6"][k], 0.03, 0.4, 0.2); return;
    case "bag": return rustle(F, t, 0.6, 0.25, 0.1, 3200);
    case "wind-gust": { const x = biquad(pink(S(2.5), 9), "bp", 700, 0.7); envAR(x, 0.8, 1.2); return sfx.add(t, x, 0.3, 0.4); }
    default: console.log(`  (unknown sfx "${name}" skipped — see references/cinestory/sound.md)`);
  }
};
for (const x of SP.sfx) play(x.t, x.name, x.dur ?? 1);
for (const c of SP.cuts) {
  if (c.kind === "fade") whoosh(F, c.t - 0.45, 0.8, 0.07, 1800, 250);
  if (c.kind === "dip") { shimmer(F, c.t - 0.2, 1.0, 0.07, 3000, 4); }
  if (c.kind === "flash") { boom(F, c.t, 0.35); }
}
for (const t of SP.hits) { boom(M, t, 0.35); whoosh(M, t - 0.3, 0.35, 0.08, 2600, 400); }
if (SP.title !== undefined) { boom(M, SP.title + 0.05, 0.45, 42); riser(M, SP.title - 1.4, 1.4, 0.06); }

// ── 4. score: one section per scene mood (D minor world, resolving to D major) ──
const quietG = new Float32Array(N).fill(1);
for (const [a, b] of SP.quiet) for (let i = Math.max(0, S(a)); i < Math.min(N, S(b)); i++) quietG[i] = 0.12;
{ let s = 1; for (let i = 0; i < N; i++) { s += (quietG[i] - s) * 0.0006; quietG[i] = s; } }
const sections = SP.music.map((m, k) => ({ ...m, t1: Math.min(DUR, m.t1 + (k + 1 < SP.music.length ? 0.6 : 0)) }));
for (const m of sections) {
  const t0 = m.t0, t1 = m.t1, len = t1 - t0;
  if (len < 0.8) continue;
  const r = rng(Math.round(t0 * 13));
  switch (m.mood) {
    case "mystery":
      drone(M, t0, t1, [["D2", 0.5], ["A2", 0.32], ["D3", 0.12]], () => 0.42, (t) => 280 + 120 * Math.sin(t * 0.4));
      for (let t = t0 + 1.2; t < t1 - 1; t += 3.4 + r() * 1.8) bell(M, t, ["D5", "F5", "A4", "E5"][Math.floor(r() * 4)], 0.045, 3.5, r() - 0.5);
      for (let t = t0 + 2.5; t < t1 - 2; t += 7 + r() * 3) ep(M, t, [["D3", "A3"], ["Bb2", "F3"]][Math.floor(r() * 2)], 0.18, 3);
      break;
    case "tense": {
      drone(M, t0, t1, [["D2", 0.45], ["Eb2", 0.28], ["A2", 0.22]], (t) => 0.35 + 0.25 * (t / len), (t) => 260 + 900 * (t / len) ** 1.6);
      for (let t = t0 + 0.5; t < t1 - 0.2; t += 1.0) subPulse(M, t, 0.1 + 0.06 * ((t - t0) / len), 50);
      for (let t = t0 + 0.25; t < t1 - 0.2; t += 0.5) click(M, t, 1900, 0.012, 0.3, 0.01);
      if (len > 4) riser(M, t1 - 2.4, 2.2, 0.1);
      break;
    }
    case "calm":
      pad(M, t0, t1, ["D3", "A3", "F4"], 0.15, 700, 1.5, 1.5);
      for (let t = t0 + 1.0; t < t1 - 1; t += 4) bell(M, t, ["A4", "F4", "D5"][Math.floor(r() * 3)], 0.04, 3, r() - 0.5);
      break;
    case "memory":
      for (let i = 0, t = t0 + 0.2; t < t1 - 0.5; i++, t += 2.0) ep(M, t, [["D3", "F3", "A3"], ["Bb2", "D3", "F3"], ["G2", "Bb2", "D3"], ["A2", "C#3", "E3"]][i % 4], 0.3, 2.3);
      pad(M, t0, t1, ["D3", "A3"], 0.08, 600);
      break;
    case "told":
      pad(M, t0, t1, ["D3", "Ab3", "C4"], 0.14, 500, 1.2, 1.2);
      for (let t = t0 + 1; t < t1 - 1; t += 3) whoosh(M, t, 1.4, 0.03, 300, 1400);
      break;
    case "reveal":
      pad(M, t0, t1, ["D3", "F#3", "A3", "D4"], 0.22, 1000, 1.0, 1.6, 0, 0.5);
      ["D5", "F#5", "A5", "D6"].forEach((n, k) => bell(M, t0 + 0.6 + k * 0.35, n, 0.06, 3.5, (k - 1.5) * 0.3));
      break;
    case "science": {
      const notes = ["D3", "A3", "C4", "E4", "F4", "E4", "C4", "A3"];
      for (let i = 0, t = t0 + 0.3; t < t1 - 0.3; i++, t += 0.33) pluck(M, t, notes[i % notes.length], 0.06, ((i % 4) - 1.5) * 0.25, 0.995, 0.45);
      for (let t = t0 + 0.3; t < t1 - 0.3; t += 1.32) subPulse(M, t, 0.08, 55);
      pad(M, t0, t1, ["D3", "A3"], 0.08, 650);
      break;
    }
    case "warm":
      for (let i = 0, t = t0 + 0.2; t < t1 - 0.5; i++, t += 1.8) { ep(M, t, [["D3", "F#3", "A3"], ["G2", "B2", "D3"], ["B2", "D3", "F#3"], ["A2", "C#3", "E3"]][i % 4], 0.32, 2.1); if (i % 2 === 0) kalimba(M, t + 0.9, ["F#5", "A5", "D6", "E5"][i % 4], 0.12, 0.2); }
      pad(M, t0, t1, ["D3", "A3", "F#4"], 0.1, 900, 1.2, 1.5);
      break;
    case "cctv": {
      const x = new Float32Array(S(len));
      for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = (Math.sin(2 * Math.PI * 50 * t) + 0.4 * Math.sin(2 * Math.PI * 150 * t)) * 0.02; }
      music.add(t0, x, 1, 0);
      break;
    }
  }
}
// end card: a held resolve
pad(M, SP.endCard - 0.3, DUR, ["D3", "A3", "D4", "F#4"], 0.18, 900, 0.8, 1.6);
bell(M, SP.endCard + 0.1, "A5", 0.06, 4);
for (let i = 0; i < N; i++) { music.L[i] *= quietG[i]; music.R[i] *= quietG[i]; }
void sine; void kalimba;

// ── 5. mix under the VO ─────────────────────────────────────────────────────
const vL = freeverb(verb.L, 0, 0.8, 0.32), vR = freeverb(verb.R, 23, 0.8, 0.32);
for (const b of [music, amb, sfx]) { biquad(b.L, "hp", 32); biquad(b.R, "hp", 32); }
const voSrc = decode(path.join("public", SP.voFile));
const vo = new Float32Array(N);
vo.set(voSrc.subarray(0, Math.max(0, N - S(SP.offset))), S(SP.offset));
const duck = duckEnvelope(vo);
const MUSIC_DUCK = dbg(-9), AMB_DUCK = dbg(-5), SFX_DUCK = dbg(-3);
const gMusic = dbg(-1), gAmb = dbg(1), gSfx = dbg(1), gVerb = dbg(-6);
const L = new Float32Array(N), Rr = new Float32Array(N);
let eV = 0, eB = 0, nS = 0;
for (let i = 0; i < N; i++) {
  const d = duck[i];
  const km = gMusic * (1 + (MUSIC_DUCK - 1) * d), ka = gAmb * (1 + (AMB_DUCK - 1) * d), ks = gSfx * (1 + (SFX_DUCK - 1) * d), kv = gVerb * (1 + (MUSIC_DUCK - 1) * d * 0.6);
  const bl = music.L[i] * km + amb.L[i] * ka + sfx.L[i] * ks + vL[i] * kv, br = music.R[i] * km + amb.R[i] * ka + sfx.R[i] * ks + vR[i] * kv;
  const f = smooth(0, 0.3, i / SR) * (1 - smooth(DUR - 1.0, DUR - 0.02, i / SR));
  L[i] = (bl + vo[i]) * f;
  Rr[i] = (br + vo[i]) * f;
  if (d > 0.9 && i % 64 === 0) { eV += vo[i] ** 2; eB += (bl * bl + br * br) / 2; nS++; }
}
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rr[i]));
const norm = peak > dbg(-1) ? dbg(-1) / peak : 1;
const out = path.join("public", "audio", `${story.id}-mix.wav`);
fs.mkdirSync(path.dirname(out), { recursive: true });
writeWav(out, L, Rr, norm);
console.log(`mix: ${out} (${DUR}s; VO ${(voSrc.length / SR).toFixed(2)} s at ${SP.offset}s)`);
console.log(`bed under speech: ${nS ? (10 * Math.log10(eB / nS) - 10 * Math.log10(eV / nS)).toFixed(1) : "n/a"} dB vs voice · ${SP.sfx.length} SFX · ${SP.steps.length} steps · score: ${sections.map((m) => `${m.mood}@${m.t0.toFixed(1)}`).join(", ")}`);
