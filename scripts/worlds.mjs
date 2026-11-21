// The world catalog: every reusable world in this project, so a film starts from a finished set instead of a
// new one. Without an id it lists them; with an id it prints what a story can name in that world.
//   node scripts/worlds.mjs            → id, times, places and a one-line description of every world
//   node scripts/worlds.mjs rumah      → its places with marks, seats / beds, POIs and set props

import fs from "node:fs";
import path from "node:path";

const ls = (dir, ext) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => path.join(dir, f)) : []);
const files = [...ls("worlds", ".world.json"), ...(fs.existsSync("stories") ? fs.readdirSync("stories", { withFileTypes: true }).filter((e) => e.isDirectory()).flatMap((e) => ls(path.join("stories", e.name), ".world.json")) : [])];
const worlds = files.map((f) => { try { return { file: f, ...JSON.parse(fs.readFileSync(f, "utf8")) }; } catch (e) { console.error(`✗ ${f}: ${e.message}`); return null; } }).filter(Boolean);
// object anchors decide the automatic marks (<id>:seat, <id>:bed, <id>:behind …)
const anchors = {};
for (const f of [...ls("library/objects", ".json"), ...ls("assets/objects", ".json")]) { try { const o = JSON.parse(fs.readFileSync(f, "utf8")); anchors[o.id] = Object.keys(o.anchors ?? {}); } catch { /* not an object file */ } }
const BUILTIN = { kos: "boarding house (kos): room, long hallway, front yard — see references/cinestory/worlds.md", coast: "rocky headland with a lighthouse, the keeper's cottage and the sea — see references/cinestory/worlds.md" };

const id = process.argv[2];
if (!id) {
  console.log("Built-in worlds:");
  for (const [k, v] of Object.entries(BUILTIN)) console.log(`  ${k.padEnd(14)} ${v}`);
  console.log("\nReady-made worlds (world.json):");
  for (const w of worlds) console.log(`  ${String(w.id).padEnd(14)} [${(w.times ?? []).join(", ")}] places: ${Object.keys(w.places ?? {}).join(", ")}\n  ${"".padEnd(14)} ${w.doc ?? ""}\n  ${"".padEnd(14)} ${w.file}`);
  console.log("\nDetails: node scripts/worlds.mjs <id>   ·   use it in story.json: \"world\": \"<id>\"");
  process.exit(0);
}
if (BUILTIN[id]) { console.log(`${id}: ${BUILTIN[id]}`); process.exit(0); }
const w = worlds.find((x) => x.id === id);
if (!w) { console.error(`✗ no world "${id}" — available: ${[...Object.keys(BUILTIN), ...worlds.map((x) => x.id)].join(", ")}`); process.exit(1); }

const inRect = (p, r) => p[0] >= r[0] && p[0] <= r[2] && p[1] >= r[1] && p[1] <= r[3];
const rooms = Object.fromEntries((w.rooms ?? []).map((r) => [r.id, r.rect]));
const where = (pl, at) => (pl.kind === "interior" ? (pl.rooms ?? []).some((r) => rooms[r] && inRect(at, rooms[r])) : pl.area ? inRect(at, pl.area) : false);
const xz = (o) => (o.at.length === 3 ? [o.at[0], o.at[2]] : o.at);
console.log(`# ${w.id} — ${w.doc}\n\nfile: ${w.file}\ntimes: ${(w.times ?? []).join(", ")}\n`);
for (const [pid, pl] of Object.entries(w.places ?? {})) {
  console.log(`## place "${pid}" (${pl.kind}) — ${pl.doc ?? ""}`);
  for (const [m, v] of Object.entries(pl.marks ?? {})) console.log(`  mark   ${m.padEnd(22)} ${v.doc ?? ""}`);
  const here = (w.objects ?? []).filter((o) => o.id && where(pl, xz(o)));
  const auto = here.flatMap((o) => (anchors[o.use] ?? []).filter((a) => ["seat", "bed", "behind", "push"].includes(a)).map((a) => `${o.id}:${a}`));
  if (auto.length) console.log(`  seats / beds / sides: ${auto.join(", ")}`);
  if (here.length) console.log(`  objects (targets, <id>:front): ${here.map((o) => `${o.id} (${o.use})`).join(", ")}`);
  const doors = (pl.rooms ?? []).flatMap((r) => ((w.rooms ?? []).find((x) => x.id === r)?.openings ?? []).filter((o) => o.id && o.type !== "arch" && o.type !== "window").map((o) => o.id));
  if (doors.length) console.log(`  doors (set "<id>": 1 opens): ${[...new Set(doors)].join(", ")}`);
  console.log(`  ambience ${pl.ambience ?? "room"} · footsteps ${pl.surface ?? "-"} · view ${pl.view ?? "-"}\n`);
}
if (w.props && Object.keys(w.props).length) {
  console.log("## set props (scene / beat \"set\")");
  for (const [k, v] of Object.entries(w.props)) console.log(`  ${k.padEnd(18)} default ${v.default} — ${v.doc ?? ""}`);
}
