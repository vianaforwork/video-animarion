// Story analyzer: script + word-timed VO → what the story needs, before any world or story.json is written.
//   node scripts/analyze.mjs stories/<id> [--lexicon=library/lexicon-id.json]
// Reads stories/<id>/script.txt and words.json ([word, t0, t1] in VO seconds). Writes
//   stories/<id>/analysis.json   sentences with times + pauses, suggested scene cuts, and the story read in
//                                context (scripts/story-nlp.mjs): time of day with its evidence and the story's
//                                clock, location + areas, characters (named, roles, figures, a double), who does
//                                what to which object and whether it is acted / on a screen / dialogue / written /
//                                hypothetical / negated, state changes of things, sounds, dialogue and written text
//   stories/<id>/REQUIREMENTS.md what can be reused (worlds, library objects, looks, actions, SFX), what must be
//                                generated (world, objects from primitives) and what is not supported
// Words the lexicon does not know are still listed ("unlisted things"), so read the report, not only the tables.

import fs from "node:fs";
import path from "node:path";
import { analyzeStory } from "./story-nlp.mjs";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `=${d}`).split("=").slice(1).join("=");
if (!dir || !fs.existsSync(path.join(dir, "words.json"))) {
  console.error("usage: node scripts/analyze.mjs stories/<id>   (needs script.txt and words.json there)");
  process.exit(1);
}
const id = path.basename(dir);
const LEX = JSON.parse(fs.readFileSync(opt("lexicon", "library/lexicon-id.json"), "utf8"));
const words = JSON.parse(fs.readFileSync(path.join(dir, "words.json"), "utf8")).map((w) => (Array.isArray(w) ? w : [w.w ?? w.word, w.t0 ?? w.start, w.t1 ?? w.end]));
const script = fs.existsSync(path.join(dir, "script.txt")) ? fs.readFileSync(path.join(dir, "script.txt"), "utf8") : words.map((w) => w[0]).join(" ");
const r2 = (x) => Math.round(x * 100) / 100;

// ── sentences, pauses, paragraphs ─────────────────────────────────────────
const sentences = [];
let cur = null;
words.forEach(([w, t0, t1], i) => {
  if (!cur) cur = { i: sentences.length, text: "", t0, t1, w0: i, w1: i };
  cur.text += (cur.text ? " " : "") + w;
  cur.t1 = t1; cur.w1 = i;
  if (/[.!?…]["”']?$/.test(w) || i === words.length - 1) { sentences.push(cur); cur = null; }
});
sentences.forEach((s, k) => {
  s.pauseAfter = r2((sentences[k + 1]?.t0 ?? s.t1) - s.t1);
  s.t0 = r2(s.t0); s.t1 = r2(s.t1);
  s.cue = words[s.w0][0].replace(/[^\p{L}\p{N}-]/gu, "");
});
const pauses = [];
for (let i = 1; i < words.length; i++) { const g = words[i][1] - words[i - 1][2]; if (g >= 0.3) pauses.push({ after: words[i - 1][0], before: words[i][0], at: r2(words[i - 1][2]), len: r2(g) }); }
const paras = script.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const perPara = paras.map((p) => p.split(/(?<=[.!?…]["”]?)\s+/).filter((x) => /\p{L}/u.test(x)).length);
const paraOk = perPara.reduce((a, b) => a + b, 0) === sentences.length;
let k0 = 0;
const paraOf = [];
if (paraOk) perPara.forEach((n, pi) => { for (let k = 0; k < n; k++) paraOf[k0 + k] = pi; k0 += n; });
// Scene cuts: paragraphs when the script has real multi-sentence paragraphs; otherwise the narrator's long pauses
// and turn words ("Tapi", "Tiba-tiba", "Sore itu", "Beberapa detik kemudian"), kept between ~6 and ~25 s.
// (an ellipsis is a pause, not a sentence end, when judging whether paragraphs hold several sentences)
const fullStops = paras.map((p) => p.split(/(?<=[^.][.!?]["”]?)\s+(?=["“]?\p{Lu})/u).filter((x) => /\p{L}/u.test(x)).length);
const multi = paraOk && fullStops.filter((n) => n > 1).length >= Math.max(2, paras.length / 3);
const gaps = sentences.slice(0, -1).map((s) => s.pauseAfter).sort((a, b) => a - b);
const longGap = Math.max(0.8, gaps[Math.floor(gaps.length * 0.7)] ?? 0.8);
const TURN = /^(tapi|namun|tiba-tiba|lalu|kemudian|sementara|keesokan|beberapa|sore|malam|pagi|siang|subuh|dan|padahal|kali|saat|ketika)$/i;
const scenes = [];
sentences.forEach((s, k) => {
  if (k === 0) return scenes.push({ at: s.cue, t0: s.t0, sentences: [k], why: "start" });
  const last = scenes.at(-1), len = s.t0 - last.t0, gap = sentences[k - 1].pauseAfter;
  let why = null;
  const startsSentence = /^["“]?\p{Lu}/u.test(words[s.w0][0]); // never cut inside a sentence ("…dua pagi... jangan …")
  if (!startsSentence) why = null;
  else if (multi) { if (paraOf[k] !== paraOf[k - 1]) why = "paragraph break in the script"; }
  else if (len >= 6 && gap >= longGap) why = `pause ${gap}s before it`;
  else if (len >= 6 && gap >= 0.6 && TURN.test(s.cue)) why = `turn word “${s.cue}” after a ${gap}s pause`;
  else if (len >= 25 && gap >= 0.45) why = `the scene is ${Math.round(len)} s long`;
  if (why) scenes.push({ at: s.cue, t0: s.t0, sentences: [k], why }); else last.sentences.push(k);
});

// ── the story in context ──────────────────────────────────────────────────
const S = analyzeStory(script, words, LEX);

// ── requirements: reuse / generate / unsupported ──────────────────────────
const ls = (d, ext) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(ext)).map((f) => path.join(d, f)) : []);
const objDirs = ["assets/objects", path.join(dir, "objects"), "library/objects"];
const objFile = (oid) => objDirs.map((d) => path.join(d, `${oid}.json`)).find((f) => fs.existsSync(f));
const BUILTIN = ["tree-pine", "tree-broad", "tree-palm", "bush", "fern", "rock", "log", "grass-tuft"];
const PROPS = ["phone", "binoculars", "lantern", "flashlight", "mug", "book"];
const ACTIONS = ["stand", "look", "turn", "walk", "run", "startle", "freeze", "peer", "point", "reach", "wave", "phone", "binoculars", "raise", "think", "nod", "shake", "sigh", "talk", "shiver", "sit", "standUp", "write", "lie", "sleep", "wake", "sitUp", "push", "pickUp", "putDown", "give", "receive", "open", "close", "kneel", "pickUp+putDown"];
const looksSrc = fs.existsSync("src/cine/character/looks.ts") ? fs.readFileSync("src/cine/character/looks.ts", "utf8") : "";
const LOOKS = [...looksSrc.matchAll(/^ {2}"?([a-z][a-z-]*)"?: \{/gm)].map((m) => m[1]);
const sfxSrc = fs.existsSync("scripts/sound-story.ts") ? fs.readFileSync("scripts/sound-story.ts", "utf8") : "";
const SFX = [...sfxSrc.matchAll(/case "([a-z-]+)":/g)].map((m) => m[1]);
const BUILTIN_WORLDS = { kos: "built-in world 'kos' (boarding house: room, corridor, stairs, yard)", coast: "built-in world 'coast' (lighthouse, beach, sea)" };
const worldFiles = [...ls("worlds", ".world.json"), ...ls("library/worlds", ".world.json"), ...(fs.existsSync("stories") ? fs.readdirSync("stories", { withFileTypes: true }).filter((e) => e.isDirectory()).flatMap((e) => ls(path.join("stories", e.name), ".world.json")) : [])];
const worldDocs = worldFiles.map((f) => { try { const w = JSON.parse(fs.readFileSync(f, "utf8")); return { file: f, id: w.id, doc: w.doc ?? "" }; } catch { return null; } }).filter(Boolean);
const KIND_WORDS = { hospital: ["hospital", "ward", "clinic"], corridor: ["corridor"], market: ["market", "stall"], forest: ["forest", "track", "camp"], school: ["school", "classroom"], office: ["office"], house: ["house", "home", "room", "kitchen"], street: ["street", "road", "sidewalk"], coast: ["coast", "beach", "lighthouse"], kos: ["kos", "boarding"], shop: ["shop", "store", "kiosk"], library: ["library", "reading"], park: ["park"] };
const kinds = Object.entries(S.location.kinds).sort((a, b) => b[1] - a[1]).filter(([, w], i, all) => w >= 1 && w >= all[0][1] * 0.5).map(([k]) => k);
const worldReq = kinds.map((k) => {
  if (BUILTIN_WORLDS[k]) return { kind: k, status: "reuse", use: BUILTIN_WORLDS[k] };
  // best match, not the first: the kind's main word counts most ("house" beats a passing "room")
  const words = KIND_WORDS[k] ?? [k];
  const score = (d) => words.reduce((n, x, i) => n + (new RegExp(`\\b${x}`).test(d.doc.toLowerCase()) ? (i === 0 ? 3 : 1) : 0), 0);
  const w = worldDocs.map((d) => ({ d, s: score(d) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)[0]?.d;
  return w ? { kind: k, status: "reuse-or-adapt", use: w.file, note: w.doc } : { kind: k, status: "generate", use: `write ${id}.world.json (${k}): rooms/ground/paths/objects/scatter/lights + places with marks` };
});
const objReq = [];
for (const o of [...S.objects].sort((a, b) => Number(b.used) - Number(a.used))) {
  const [kind, name] = o.value.includes(":") ? o.value.split(/:(.*)/s) : ["library", o.value];
  let status, note;
  if (kind === "library") { const f = objFile(name); status = f ? "reuse" : "generate"; note = f ? f : `library id "${name}" missing — author it`; }
  else if (kind === "builtin") { status = BUILTIN.includes(name) ? "reuse" : "generate"; note = `built-in ${name}`; }
  else if (kind === "prop") { status = PROPS.includes(name) ? "reuse" : "unsupported"; note = `held prop "${name}" (cast "prop")`; }
  else if (kind === "world") { status = "world"; note = `made by the world DSL (${name})`; }
  else if (kind === "ui") { status = "ui"; note = `${name}: show as a screen / card insert (ui card, text, a cut to a full-frame view) — screens cannot show live pictures`; }
  else if (kind === "look") { status = "look"; note = `${name} on a person: choose the look / custom colours (references/cinestory/characters.md); accessories the rig lacks are said, not shown`; }
  else if (kind === "generate") { status = "generate"; note = `no library object for "${name}" — build from primitives into assets/objects/<id>.json, check it on the object sheet`; }
  else { status = "complex"; note = `"${name}" is too organic/detailed for primitives — needs a model asset, an agreed simplified stand-in, or keep it off screen (do NOT silently substitute)`; }
  objReq.push({ word: o.word, t: o.mentions[0], mentions: o.mentions.length, story: o.used, need: name, status, note });
}
const acted = S.interactions.filter((i) => i.mode === "acted" || i.mode === "state");
const actReq = acted.map((a) => ({ t: a.t, word: a.word, who: a.who, action: a.action, obj: a.obj, with: a.with, target: a.target, mode: a.mode, status: a.supported === false ? "unsupported" : ACTIONS.includes(a.action) ? "supported" : "unsupported" }));
const notActed = S.interactions.filter((i) => !(i.mode === "acted" || i.mode === "state"));
const lookFor = (p) => p.look ?? (p.kind === "figure" && p.double ? `same look as ${p.double.of}` : undefined);
const lookReq = [...S.characters.map((c) => ({ who: c.name, look: lookFor(c) })), ...S.unnamed.map((u) => ({ who: u.id, look: lookFor(u), double: u.double }))].map((x) => ({ ...x, status: x.look && (LOOKS.includes(x.look) || x.look.startsWith("same look")) ? "reuse" : "choose" }));
const sfxReq = S.sounds.map((s) => ({ word: s.word, t: s.t, sfx: s.sfx, status: SFX.includes(s.sfx) ? "available" : "missing" }));

const analysis = {
  id, vo: { words: words.length, start: r2(words[0][1]), end: r2(words.at(-1)[2]) },
  sentences: sentences.map(({ i, text, t0, t1, pauseAfter, cue }) => ({ i, text, t0, t1, pauseAfter, cue, para: paraOk ? paraOf[i] : undefined })),
  pauses, scenes: scenes.map((s) => ({ ...s, text: s.sentences.map((k) => sentences[k].text).join(" ") })),
  protagonist: S.protagonist, explanation: S.explanation, unmapped: S.unmapped, characters: S.characters, unnamed: S.unnamed, time: S.time, location: S.location,
  objects: S.objects, mentions: S.mentions, interactions: S.interactions, states: S.states, sounds: S.sounds, emotions: S.emotions, dialogue: S.dialogue, texts: S.texts,
  requirements: { implied: LEX.implied?.[S.location.main] ?? [], world: worldReq, time: S.time.stated ? S.time.value : "day (nothing said — decide from the story)", clock: S.time.clocks.find((c) => !c.rule)?.clock, objects: objReq, actions: actReq, looks: lookReq, sfx: sfxReq },
};
fs.writeFileSync(path.join(dir, "analysis.json"), JSON.stringify(analysis, null, 1));

const who = (w) => (w ?? "?").replace(/^role:/, "");
const md = [
  `# Requirements — ${id}`, "",
  `VO ${analysis.vo.start}–${analysis.vo.end} s · ${sentences.length} sentences · ${scenes.length} suggested scenes · time: **${analysis.requirements.time}**${analysis.requirements.clock ? ` · clock ${analysis.requirements.clock}` : ""} · place: **${S.location.main ?? "?"}**`, "",
  "## Time of day", "", ...(S.time.evidence.length ? S.time.evidence.map((e) => `- ${e}`) : ["- nothing in the script says it — decide from the story"]), ...S.time.ignored.map((e) => `- ignored: ${e}`), ...S.time.clocks.map((c) => `- clock ${c.t}s “${c.text}” → **${c.clock}**${c.rule ? " (a rule / not now)" : ""}`), "",
  "## Location", "", `- main: **${S.location.main ?? "?"}** (${Object.entries(S.location.kinds).map(([k, v]) => `${k} ${Math.round(v * 10) / 10}`).join(", ")})`, ...S.location.areas.map((a) => `- area: ${a.name} (${a.kind}, first at ${a.t}s)`), "",
  "## World", "", ...(worldReq.length ? worldReq.map((w) => `- ${w.kind}: **${w.status}** — ${w.use}`) : ["- no place found — decide from the script"]), "",
  "Ready-made worlds in this project (reuse or adapt a copy before writing a new one; `node scripts/worlds.mjs <id>` lists places, marks, seats and props):", "",
  ...Object.entries(BUILTIN_WORLDS).map(([k, v]) => `- \`${k}\` — ${v}`), ...worldDocs.map((d) => `- \`${d.id}\` (${d.file}) — ${d.doc}`), "",
  "## Characters", "", ...(S.characters.length + S.unnamed.length ? [
    ...S.characters.map((c) => `- **${c.name}**${c.role ? ` (${c.role})` : ""}${c.name === S.protagonist ? " — protagonist" : ""} — ${c.mentions.length} mentions from ${c.mentions[0]}s`),
    ...S.unnamed.map((u) => `- ${u.kind === "figure" ? `a figure (“${u.role}”)` : `unnamed ${u.role}`} — from ${u.mentions[0]}s${u.double ? ` — **a double of ${u.double.of}** (${u.double.evidence.join(", ")}): same look` : ""}`)] : ["- none found (pronouns only? read the script)"]), "",
  "## Objects (story objects first)", "", "| word | needs | status | story object | note |", "|---|---|---|---|---|", ...objReq.map((o) => `| ${o.word} (${o.t}s, ×${o.mentions}) | ${o.need} | **${o.status}** | ${o.story ? "yes" : ""} | ${o.note} |`), "",
  ...((LEX.implied?.[S.location.main] ?? []).length ? [`## Implied by the place (${S.location.main}) — dress the set, the script does not name them`, "", ...LEX.implied[S.location.main].map((x) => `- ${x}`), ""] : []),
  ...(S.mentions.length ? ["## Unlisted things (not in the lexicon — decide: build, world, or ignore)", "", ...S.mentions.map((m) => `- ${m.t}s **${m.word}** — “${m.context}”`), ""] : []),
  "## Interactions — acted on screen", "", ...(actReq.length ? actReq.map((a) => `- ${a.t}s “${a.word}” → **${who(a.who)}: ${a.action}**${a.obj ? ` ${a.obj}` : ""}${a.with ? ` with ${a.with}` : ""}${a.target ? ` → ${a.target}` : ""}${a.mode === "state" ? " (a pose, not a movement)" : ""}${a.status === "unsupported" ? " — **unsupported**: stage around it" : ""}`) : ["- none"]), "",
  ...(S.unmapped.length ? ["## Verbs the lexicon does not know (decide: an action, a state, a face, or nothing)", "", ...S.unmapped.map((u) => `- ${u.t}s **${u.word}** — “${u.sentence}”`), ""] : []),
  "## Not acted (do NOT stage these as actions)", "", ...(notActed.length ? notActed.map((a) => `- ${a.t}s “${a.word}” (${who(a.who)}: ${a.action}) — ${{ "on-screen": "seen on a screen / photo: show it in that view", dialogue: "said in dialogue", written: "written text: show as an insert / card", hypothetical: "a rule / an 'if' / 'as if'", negated: "negated", said: "a rule or words handed over, not an object", "unclear who": "who does it is not said (heard in the dark?)", "non-cast": "done by an animal / thing: off screen or by sound" }[a.mode] ?? a.mode}`) : ["- none"]), "",
  "## State changes (set props / object states on these words)", "", ...(S.states.length ? S.states.map((s) => `- ${s.t}s ${s.thing}: **${s.state}**${s.by ? ` (by ${who(s.by)})` : ""}${s.mode !== "acted" ? ` — ${s.mode}` : ""}`) : ["- none"]), "",
  ...(S.explanation.length ? ["## Explanation passages (explain with graphics: mood \"science\", the mind studio or ui cards — not acted by the cast)", "", ...S.explanation.map((e) => `- ${e.t}s ${e.text}`), ""] : []),
  "## Dialogue and written text", "", ...(S.dialogue.length + S.texts.length ? [...S.dialogue.map((d) => `- ${d.t}s said by **${who(d.speaker)}**: “${d.text}” → a \`talk\` beat`), ...S.texts.map((d) => `- ${d.t}s written on **${d.on}**: “${d.text}” → insert / ui card`)] : ["- none"]), "",
  "## Sounds", "", ...(sfxReq.length ? sfxReq.map((s) => `- ${s.t}s “${s.word}” → ${s.sfx} (${s.status})`) : ["- none"]), "",
  "## Emotions", "", ...(S.emotions.length ? S.emotions.map((e) => `- ${e.t}s “${e.word}” → face ${e.face}${e.who ? ` (${who(e.who)})` : ""}`) : ["- none"]), "",
  "## Looks", "", ...lookReq.map((l) => `- ${who(l.who)}: ${l.look ?? "?"} (${l.status})`), "",
  "## Scenes (cue → text)", "", ...analysis.scenes.map((s) => `- **${s.t0}s "${s.at}"** (${s.why}): ${s.text}`), "",
  "## Pauses to keep (≥ 0.3 s)", "", ...(pauses.length ? pauses.map((p) => `- ${p.at}s, ${p.len}s after "${p.after}"`) : ["- none"]), "",
  "Read in context (quotes, conditions, negation, screens, pronouns), but it is still a reading aid: check the interactions against the script before directing.", "",
].join("\n");
fs.writeFileSync(path.join(dir, "REQUIREMENTS.md"), md);

const count = (arr, st) => arr.filter((x) => x.status === st).length;
console.log(`${id}: ${sentences.length} sentences, ${scenes.length} scenes, ${pauses.length} pauses ≥0.3 s`);
console.log(`  time: ${analysis.requirements.time}${analysis.requirements.clock ? ` (clock ${analysis.requirements.clock})` : ""} · place: ${S.location.main ?? "?"} · areas: ${S.location.areas.map((a) => a.name).join(", ") || "-"}`);
console.log(`  characters: ${[...S.characters.map((c) => c.name), ...S.unnamed.map((u) => (u.double ? `${u.id} (double of ${u.double.of})` : who(u.id)))].join(", ") || "-"}`);
console.log(`  world: ${worldReq.map((w) => `${w.kind}→${w.status}`).join(", ") || "-"}`);
console.log(`  objects: ${count(objReq, "reuse")} reuse · ${count(objReq, "generate")} generate · ${count(objReq, "world")} world-built · ${count(objReq, "ui")} ui · ${count(objReq, "look")} look · ${count(objReq, "complex")} complex · ${count(objReq, "unsupported")} unsupported · ${S.mentions.length} unlisted`);
console.log(`  acted: ${actReq.map((a) => `${who(a.who)}:${a.action}${a.obj ? "(" + a.obj + ")" : ""}${a.status === "supported" ? "" : "!"}`).join(", ") || "-"}`);
console.log(`  not acted: ${notActed.map((a) => `${a.action}[${a.mode}]`).join(", ") || "-"} · states: ${S.states.length} · dialogue: ${S.dialogue.length} · written: ${S.texts.length}`);
console.log(`  → ${path.join(dir, "analysis.json")} · ${path.join(dir, "REQUIREMENTS.md")}`);
