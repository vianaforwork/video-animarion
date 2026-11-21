// Set up a VOYNANN Motion project: copies this skill's starter/ (dotfiles included) and, with --kit, that style's
// kit (src/, scripts/, public/) into a folder. Uses Node only, so no shell copy permissions are needed.
//   node <SKILL_DIR>/new-project.mjs [folder] [--kit=<style>]      (folder default: the current one)
// A folder that already is a VOYNANN project only gets the kit added; a folder with other files is refused.
// A kit with its own project/ (CINÉSTORY, CHRONICLE, STORYBOOK…) is a project of its own: it is copied instead of
// starter/, marked with voynann-kit.json, and it never shares a folder with another style's kit.
// The skill upload in the Claude app takes at most 200 files, so the release ships the source of starter/ and of
// each kit packed into PACKED_SOURCE*.txt in that folder (docs, examples and fonts stay plain files). tree() reads
// a folder as packed files plus plain files, so a packed and an unpacked copy of the skill set up the same project.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACK = /^PACKED_SOURCE(-\d+)?\.txt$/;
/** Files of a folder: relative path ("/"-separated) -> { abs } for a plain file or { data } for a packed one. */
function tree(dir) {
  const files = new Map();
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(d, e.name), r);
      else if (rel || !PACK.test(e.name)) files.set(r, { abs: path.join(d, e.name) });
    }
  };
  if (!fs.existsSync(dir)) return files;
  walk(dir, "");
  // pack format: a header, then per file "\n==== <byte length> <path>\n" followed by exactly that many bytes
  for (const name of fs.readdirSync(dir).filter((f) => PACK.test(f)).sort()) {
    const buf = fs.readFileSync(path.join(dir, name));
    let at = buf.indexOf("\n==== ");
    while (at >= 0 && at < buf.length) {
      const eol = buf.indexOf("\n", at + 1);
      const m = /^==== (\d+) (.+)$/.exec(buf.toString("utf8", at + 1, eol));
      if (!m) throw new Error(`${path.join(dir, name)} is damaged — download the skill again`);
      const start = eol + 1, end = start + Number(m[1]);
      files.set(m[2], { data: buf.subarray(start, end) });
      at = end;
    }
  }
  return files;
}
/** Copies the files under `sub` ("" = all) of a tree into `to`; skip(sourcePath) leaves a file out. */
function copyTree(files, dir, sub, to, skip = () => false) {
  for (const [rel, src] of files) {
    if (sub && !rel.startsWith(`${sub}/`)) continue;
    if (skip(path.join(dir, rel))) continue;
    const out = path.join(to, sub ? rel.slice(sub.length + 1) : rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    if (src.abs) fs.copyFileSync(src.abs, out);
    else fs.writeFileSync(out, src.data);
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
// The QA gate (video scan + scene probe) lives once, in starter/, and goes into every project, standalone kits too.
const SHARED_QA = ["scripts/qa-video.mjs", "scripts/qa-scene.mjs", "scripts/qa-gate.mjs", "src/core/qa/scene-qa.tsx"];
const shareQa = (to) => {
  const st = tree(path.join(here, "starter"));
  for (const rel of SHARED_QA) {
    const src = st.get(rel);
    if (!src) continue;
    const out = path.join(to, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    if (src.abs) fs.copyFileSync(src.abs, out);
    else fs.writeFileSync(out, src.data);
  }
};
// Files a standalone kit's project takes from another folder of this skill instead of shipping its own copy (the
// bytes are identical; this keeps the skill under the 200-file upload limit). [source folder, path prefix there, files]
const SHARED_FROM = {
  cinestory: [["starter", "", ["public/fonts/OFL-manrope.txt", ...[200, 300, 400, 500, 600].map((w) => `public/fonts/manrope-latin-${w}-normal.woff2`)]]],
  cerdik: [["kits/bedah", "project/", [
    "package-lock.json", "OFL-plus-jakarta-sans.txt", "public/fonts/PlusJakartaSans_700Bold.ttf",
    "scripts/check-env.mjs", "scripts/gl.mjs", "scripts/lib/vo.mjs", "src/core/motion/track.ts",
    ...["Ground.tsx", "Overlay.tsx", "cam.ts", "fonts.ts", "geo.tsx", "mats.ts", "props.tsx", "tex.ts"].map((f) => `src/kits/bedah/${f}`),
  ]]],
  negeri: [["kits/bedah", "project/", ["package-lock.json", "scripts/check-env.mjs", "scripts/gl.mjs", "scripts/lib/vo.mjs"]]],
  tipikal: [["kits/bedah", "project/", ["package-lock.json", "scripts/check-env.mjs", "scripts/gl.mjs", "scripts/lib/vo.mjs"]]],
  bongkar: [
    ["kits/bedah", "project/", ["package-lock.json", "OFL-plus-jakarta-sans.txt", "scripts/check-env.mjs", "scripts/gl.mjs", "scripts/lib/vo.mjs"]],
    ["kits/chronicle", "project/", ["public/fonts/PlusJakartaSans_500Medium.ttf", "public/fonts/PlusJakartaSans_700Bold.ttf", "public/fonts/PlusJakartaSans_800ExtraBold.ttf"]],
  ],
  nekat: [["kits/bedah", "project/", [
    "package-lock.json", "OFL-plus-jakarta-sans.txt", "public/fonts/PlusJakartaSans_700Bold.ttf",
    "scripts/check-env.mjs", "scripts/gl.mjs", "scripts/lib/vo.mjs",
  ]]],
};
const shareFrom = (kitName, to) => {
  for (const [src, prefix, list] of SHARED_FROM[kitName] ?? []) {
    const t = tree(path.join(here, src));
    for (const rel of list) {
      const f = t.get(prefix + rel);
      if (!f) { console.error(`missing shared file ${src}/${prefix}${rel} — download the skill again`); process.exit(1); }
      const out = path.join(to, rel);
      if (fs.existsSync(out)) continue;
      fs.mkdirSync(path.dirname(out), { recursive: true });
      if (f.abs) fs.copyFileSync(f.abs, out);
      else fs.writeFileSync(out, f.data);
    }
  }
};
const args = process.argv.slice(2);
const kit = (args.find((a) => a.startsWith("--kit=")) ?? "").slice(6);
const dest = path.resolve(args.find((a) => !a.startsWith("--")) ?? ".");
const kits = fs.readdirSync(path.join(here, "kits"));
// PRECISION and INNERWORKS have no kit folder: their projects are the starter (core) alone, built from their references
const CORE_ONLY = ["precision", "innerworks"];
const coreOnly = CORE_ONLY.includes(kit);
if (kit && !coreOnly && !kits.includes(kit)) { console.error(`no kit "${kit}" (available: ${[...kits, ...CORE_ONLY].sort().join(", ")})`); process.exit(1); }

const kitDir = kit && !coreOnly ? path.join(here, "kits", kit) : "";
const kitFiles = kitDir ? tree(kitDir) : new Map();
const standalone = [...kitFiles.keys()].some((f) => f.startsWith("project/"));
// A project made from a standalone kit (one with its own project/: CINÉSTORY, CHRONICLE, STORYBOOK…) carries a marker
// voynann-kit.json {"kit": …}; CINÉSTORY projects made before the marker existed are recognised by their director.
const MARKER = "voynann-kit.json";
const NAMES = { cinestory: "CINÉSTORY", chronicle: "CHRONICLE", storybook: "STORYBOOK", cerdik: "CERDIK", negeri: "NEGERI", tipikal: "TIPIKAL", nekat: "NEKAT", bongkar: "BONGKAR" };
const nameOf = (k) => NAMES[k] ?? k.toUpperCase();
let ownKit = null;
try { ownKit = JSON.parse(fs.readFileSync(path.join(dest, MARKER), "utf8")).kit ?? null; } catch {}
if (!ownKit && fs.existsSync(path.join(dest, "src/director/compile.ts")) && fs.existsSync(path.join(dest, "src/gen"))) ownKit = "cinestory";
const isProject = fs.existsSync(path.join(dest, "src/core/film/Stage3D.tsx"));
if (ownKit && ownKit !== kit) {
  console.error(`${dest} is a ${nameOf(ownKit)} project — ${kit || "another style"} needs a folder of its own: use a new folder name as the first argument`);
  process.exit(1);
}
if (standalone) {
  if (ownKit === kit) {
    shareFrom(kit, dest);
    shareQa(dest);
    console.log(`existing ${kit} project: ${dest} (QA tools refreshed)`);
  }
  else if (isProject) {
    console.error(`${dest} is a project of another style — ${kit} needs a folder of its own: use a new folder name as the first argument`);
    process.exit(1);
  } else {
    const other = fs.existsSync(dest) ? fs.readdirSync(dest).filter((f) => !f.startsWith(".") && !/\.(mp3|wav|m4a|aac|txt|md)$/i.test(f)) : [];
    if (other.length) {
      console.error(`${dest} already has other files (${other.slice(0, 4).join(", ")}${other.length > 4 ? ", …" : ""}) — use a new folder name as the first argument`);
      process.exit(1);
    }
    fs.mkdirSync(dest, { recursive: true });
    copyTree(kitFiles, kitDir, "project", dest);
    shareFrom(kit, dest);
    shareQa(dest);
    fs.writeFileSync(path.join(dest, MARKER), JSON.stringify({ kit }, null, 2) + "\n");
    console.log(`project ready: ${dest}`);
  }
  console.log(`kit: ${kit} (read ${path.join(here, "kits", kit, "KIT.md")})`);
  console.log("next (inside the project): npm ci, then npm run check-env");
  process.exit(0);
}
if (!isProject) {
  // hidden files (.claude, .git) and the buyer's own VO / script may already be there
  const other = fs.existsSync(dest) ? fs.readdirSync(dest).filter((f) => !f.startsWith(".") && !/\.(mp3|wav|m4a|aac|txt)$/i.test(f)) : [];
  if (other.length) {
    console.error(`${dest} already has other files (${other.slice(0, 4).join(", ")}${other.length > 4 ? ", …" : ""}) — use a new folder name as the first argument`);
    process.exit(1);
  }
  fs.mkdirSync(dest, { recursive: true });
  copyTree(tree(path.join(here, "starter")), path.join(here, "starter"), "", dest);
  console.log(`project ready: ${dest}`);
} else console.log(`existing VOYNANN project: ${dest}`);

if (coreOnly) console.log(`style: ${kit} — built on the core in src/core, no kit to add (read ${path.join(here, "references", kit + ".md")})`);
else if (kit) {
  for (const part of ["src", "scripts", "public"]) {
    // never overwrite the buyer's own stories or audio in an existing project
    copyTree(kitFiles, kitDir, part, path.join(dest, part), (f) => isProject && /[\\/](stories[\\/](data|registry)|pv-stories[\\/])/.test(f));
  }
  // a kit whose films are registered by a component (root.json) is added to src/Root.tsx once
  const reg = kitFiles.get("root.json"), rootFile = path.join(dest, "src", "Root.tsx");
  if (reg && fs.existsSync(rootFile)) {
    const r = JSON.parse(reg.abs ? fs.readFileSync(reg.abs, "utf8") : reg.data.toString("utf8")), root = fs.readFileSync(rootFile, "utf8");
    const lastImport = [...root.matchAll(/^import .*;$/gm)].pop(), close = root.lastIndexOf("</>");
    if (root.includes(r.marker)) {
      // already registered
    } else if (!lastImport || close < 0) console.log(`  add ${r.element} to src/Root.tsx by hand (${r.import})`);
    else {
      const at = lastImport.index + lastImport[0].length;
      const withEl = root.slice(0, close) + `  ${r.element}\n  ` + root.slice(close);
      fs.writeFileSync(rootFile, withEl.slice(0, at) + `\n${r.import}` + withEl.slice(at));
      console.log(`  registered ${r.element} in src/Root.tsx`);
    }
  }
  console.log(`kit added: ${kit} (read ${path.join(here, "kits", kit, "KIT.md")})`);
}
console.log("next (inside the project): npm ci, then npm run check-env");
