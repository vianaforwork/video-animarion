// Word timings for a voice-over → JSON [[word, start, end], …] (VO seconds).
//   node scripts/transcribe.mjs <vo.mp3> --out=stories/<id>/words.json [--script=script.txt] [--lang=id]
//   node scripts/transcribe.mjs <any/path/vo.mp3> --id=<id> [--script=…]   copies the VO to public/audio/<id>.<ext>
//                                                                          and writes stories/<id>/words.json
//
// 1. whisper.cpp when available (WHISPER_CLI + WHISPER_MODEL, or `whisper-cli` on PATH with a model in
//    ~/.cache/whisper.cpp or ./models) — real word timings; with --script the script's words are kept
//    (names and numbers spelled as written) and timed by whisper.
// 2. otherwise, with the script text: every speech segment of the VO (silence detection) is given its run of
//    script words by a global alignment (scripts/align.mjs) — sentence starts land on the right pause from
//    the first to the last line (no drift), word timing inside a phrase ≈ ±0.3 s.
// --method=script forces 2 even when whisper.cpp is installed.
// Without whisper and without a script there is nothing to align: the script text must be provided.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { alignScript, scriptOnWhisper, speechSegments } from "./align.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `=${d ?? ""}`).split("=").slice(1).join("=");
const id = opt("id");
if (id && !/^[a-z0-9-]+$/.test(id)) { console.error(`--id "${id}" must use only a-z, 0-9 and "-"`); process.exit(1); }
const out = opt("out") || (id ? `stories/${id}/words.json` : "");
if (file && fs.existsSync(file) && id) {
  const dst = path.join("public", "audio", `${id}${path.extname(file).toLowerCase() || ".mp3"}`);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (path.resolve(dst) !== path.resolve(file)) fs.copyFileSync(file, dst);
  console.log(`vo: ${dst}  →  story.json "vo": { "file": "${path.relative("public", dst)}", "offset": 1.5 }`);
}
if (!file || !fs.existsSync(file) || !out) {
  console.error("usage: node scripts/transcribe.mjs <vo.mp3> (--id=<id> | --out=stories/<id>/words.json) [--script=script.txt] [--lang=id] [--method=script]");
  process.exit(1);
}
const run = (cmd, a) => spawnSync(cmd, a, { encoding: "utf8", maxBuffer: 1 << 28 });
const duration = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).stdout.trim());

const findWhisper = () => {
  const home = os.homedir();
  const cands = [process.env.WHISPER_CLI, run("sh", ["-c", "command -v whisper-cli"]).stdout.trim(), "/opt/homebrew/bin/whisper-cli", "/usr/local/bin/whisper-cli"].filter(Boolean);
  const cli = cands.find((c) => fs.existsSync(c));
  const modelDirs = [path.join(home, ".cache/whisper.cpp"), path.resolve("models"), "/opt/homebrew/share/whisper-cpp"];
  let model = process.env.WHISPER_MODEL && fs.existsSync(process.env.WHISPER_MODEL) ? process.env.WHISPER_MODEL : null;
  if (!model) for (const d of modelDirs) { if (!fs.existsSync(d)) continue; const m = fs.readdirSync(d).filter((f) => f.endsWith(".bin")).sort((a, b) => (b.includes("large") ? 1 : 0) - (a.includes("large") ? 1 : 0))[0]; if (m) { model = path.join(d, m); break; } }
  return cli && model ? { cli, model } : null;
};

let words = null, method = "";
const method0 = opt("method", "auto");
const W = method0 === "script" ? null : findWhisper();
if (W) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cf-vo-"));
  const wav = path.join(tmp, "vo16k.wav");
  run("ffmpeg", ["-v", "error", "-y", "-i", file, "-ar", "16000", "-ac", "1", wav]);
  run(W.cli, ["-m", W.model, "-f", wav, "-l", opt("lang", "id"), "-ml", "1", "-sow", "-ojf", "-of", path.join(tmp, "w")]);
  try {
    const j = JSON.parse(fs.readFileSync(path.join(tmp, "w.json"), "utf8"));
    words = j.transcription.map((s) => [s.text.trim(), s.offsets.from / 1000, s.offsets.to / 1000]).filter((w) => w[0]);
    method = `whisper.cpp (${path.basename(W.model)})`;
    const sf = opt("script");
    if (sf && fs.existsSync(sf) && words.length) {
      const m = scriptOnWhisper(fs.readFileSync(sf, "utf8"), words);
      if (m.matched >= 0.6) { words = m.words; method += `, script words timed by whisper (${Math.round(m.matched * 100)} % matched)`; }
      else method += ` — the script matches only ${Math.round(m.matched * 100)} % of what was heard: whisper's own words kept (is it the right script?)`;
    }
  } catch { words = null; }
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (!words) {
  const scriptFile = opt("script");
  if (!scriptFile || !fs.existsSync(scriptFile)) {
    console.error("No whisper.cpp found and no --script given. Provide the narration text (e.g. --script=stories/<id>/script.txt) or install whisper.cpp (see the skill's references/cinestory/setup.md).");
    process.exit(2);
  }
  const segs = speechSegments(file, duration);
  const r = alignScript(fs.readFileSync(scriptFile, "utf8"), segs);
  if (!r) { console.error("Could not align: no speech found in the VO, or the script is empty."); process.exit(3); }
  words = r.words;
  method = `script aligned to ${r.segments} speech segments (${r.clauses} script phrases, ${r.rate.toFixed(1)} syllables/s); word timing inside a phrase ≈ ±0.3 s`;
  for (const w of r.warnings) console.log(`  ⚠ ${w}`);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(words.map(([w, a, b]) => [w, +a.toFixed(2), +b.toFixed(2)])));
console.log(`words: ${out} — ${words.length} words, ${duration.toFixed(2)} s, via ${method}`);
console.log(words.map(([w, a]) => `${a.toFixed(2)} ${w}`).join("  "));
