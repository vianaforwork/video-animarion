// The VOYNANN QA gate in two steps, used by every make / render script (and runnable alone):
//   1. before the final render: scripts/qa-scene.mjs on the PREVIEW composition — tembus, one-frame jumps and blinks
//      of tagged solids, camera snaps, and a video scan of the 3D alone (captions left out) for kedip / loncat / flicker
//   2. after the final render: scripts/qa-video.mjs --hard-only on the delivered MP4 — black / white runs, full-frame
//      blinks, cuts that are not in the plan
//   node scripts/qa-gate.mjs --comp=<PreviewComp> [--cuts=s,s,…] [--out=dir] [--props=file] [--final=film.mp4]
// A FAIL stops the build. A CHECK stops it too until every strip has a verdict in <out>/qa-video.review.json
// ("ok: <why it is intended>"); --force-qa goes on anyway and writes that into the review (never for a delivery
// the buyer has not seen).
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const node = (script, args) => spawnSync(process.execPath, [path.join(here, script), ...args], { stdio: "inherit" }).status;
const WORD = { 0: "PASS", 1: "FAIL", 2: "INCOMPLETE", 3: "CHECK" };

/** Step 1. `allow`: seconds of designed instant changes (a panel reveal, a page snap) the video scan should accept.
 *  Returns "PASS" | "CHECK" | "FAIL" | "INCOMPLETE" (and exits the process on FAIL / CHECK unless force). */
export const sceneGate = ({ comp, cuts, out, props, allow, force = false, extra = [] }) => {
  console.log(`\n▶ QA gate (scene + clean video scan) on ${comp}`);
  const code = node("qa-scene.mjs", [`--comp=${comp}`, ...(cuts ? [`--cuts=${cuts.map((t) => (+t).toFixed(3)).join(",")}`] : []), ...(allow?.length ? [`--allow=${allow.map((t) => (+t).toFixed(3)).join(",")}`] : []), `--out=${out}`, ...(props ? [`--props=${props}`] : []), ...extra]);
  const word = WORD[code] ?? "INCOMPLETE";
  if ((word === "FAIL" || word === "CHECK") && !force) {
    console.error(
      word === "FAIL"
        ? `\n✗ QA gate FAIL — open the images in ${out}, fix the cause (choreography, geometry, a z-fight), then run again. The final is not rendered.`
        : `\n✗ QA gate CHECK — open each qa-video_*.jpg in ${out}; for a change that is designed, write "ok: <why>" for its id in ${path.join(out, "qa-video.review.json")}; fix the rest; then run again.`,
    );
    process.exit(1);
  }
  return word;
};

/** Step 2. Returns "PASS" | "FAIL" | "INCOMPLETE". */
export const deliveryScan = ({ file, cuts, out }) => {
  console.log(`\n▶ QA scan of the delivered film ${path.basename(file)}`);
  const code = node("qa-video.mjs", [file, "--hard-only", `--out=${out}`, ...(cuts ? [`--cuts=${cuts.map((t) => (+t).toFixed(3)).join(",")}`] : [])]);
  return WORD[code] ?? "INCOMPLETE";
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (k) => args.find((x) => x.startsWith(`--${k}=`))?.slice(k.length + 3);
  const comp = opt("comp");
  if (!comp && !opt("final")) {
    console.error("usage: node scripts/qa-gate.mjs --comp=<PreviewComp> [--cuts=s,s,…] [--out=dir] [--props=file] [--final=film.mp4]");
    process.exit(2);
  }
  const cuts = opt("cuts") !== undefined ? opt("cuts").split(",").filter(Boolean).map(Number) : null;
  const out = opt("out") ?? path.join("out", "qa", comp ?? "final");
  const a = comp ? sceneGate({ comp, cuts, out, props: opt("props"), force: args.includes("--force-qa") }) : "PASS";
  const b = opt("final") ? deliveryScan({ file: opt("final"), cuts, out: path.join(out, "delivered") }) : "PASS";
  console.log(`\nQA gate: scene ${a}${opt("final") ? `, delivered film ${b}` : ""}`);
  process.exit(b === "FAIL" ? 1 : 0);
}
