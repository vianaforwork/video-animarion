# BONGKAR kit — object.json → an object takes itself apart into labelled parts (exploded-view teardown, 3D)

A project of its own (`node SKILL_DIR/new-project.mjs <folder> --kit=bongkar`). Remotion 4 + React Three Fiber +
three-mesh-bvh, Node ≥ 22.18 (the director's `.ts` files run directly in node). Everything is procedural — no image
or model assets; the only files besides code are Plus Jakarta Sans (OFL).

```
npm ci
npm run check-env
npm run smoke                                   # rice-cooker stills → out/rice-cooker/stills/_sheet.jpg
node scripts/make.ts <id> --look                # the assembled model from four sides → out/<id>/look/_sheet.jpg
node scripts/make.ts <id> --plan                # disassembly order, tembus QA, timing, labels → stories/<id>/plan.json
node scripts/make.ts <id> --naskah              # narration in disassembly order → naskah.txt + VO-elevenlabs-v3.txt
node scripts/make.ts <id> --stills              # six key moments → out/<id>/stills/_sheet.jpg
node scripts/make.ts <id> --preview             # 540×960 @ 30 silent + QA gate report
node scripts/make.ts <id> --final               # QA gate (stops on FAIL / open CHECK) + 1080×1920 @ 60 + sound + delivery scan
```
Flags: `--wide` (16:9, only when asked; outputs in `out/<id>-wide/`), `--no-vo` (ignore the VO), `--no-qa`,
`--force-qa`. Every command re-plans when `object.json`, the VO or `naskah.txt` changed.

## What a film is
Hook (the assembled object, "… ada berapa part?") → the screws spin out → parts come off one after another (outer
→ inner), each landing beyond what is left, the counter rolling up → the exploded view holds with labels on the
outer parts ("n part, satu …") → push-in to eye level on the **core** parts, everything else fades back, core labels
→ pull out → everything flies back together → "Mau kita bongkar apa lagi?" → loop.

## Files
- `stories/<id>/object.json` — the object (format: `stories/PANDUAN.md`). Examples: `rice-cooker` (13 parts + 3
  screws, everything lifts off upward), `kipas-angin` (11 parts + 3 screws, grilles / blade / nut slide off along
  the shaft; its grille spokes were written by a small script).
- `stories/<id>/vo.mp3|wav|m4a` + `naskah.txt` — optional voice and its words.
- `scripts/make.ts` — the CLI. `scripts/lib/planner.ts` — blocking graph, greedy disassembly, landing, tembus QA,
  VO sync, camera fit table. `scripts/lib/dsound.ts` — score + SFX + mix. `scripts/lib/vo.mjs` — word timing.
- `src/director/` — `spec.ts` (object.json → meshes, same in node and in the browser), `runtime.ts` (plan → per-frame
  offsets, camera, counter), `Film.tsx` (studio, parts, screws, labels, HUD, captions). `src/bongkar/` — studio
  (`Stage.tsx`), piece builders (`geo.ts`), materials (`mats.ts`), fonts.

## How the planner decides
1. Every part gets a BVH. For each part and each direction (its `out` first, then ±x ±y ±z) it sweeps the part out
   and records which parts it would hit. A part seated in another (a peg in a hole) may slide a short way through
   its seat (≤ 45 % of its depth, or its whole depth along its declared `out`).
2. Greedy: of the parts that can leave unblocked, take the best one (lowest `layer`, pointing outward, short
   travel, up preferred); it lands just beyond what is left of the assembly (at least 13 % of the object's size
   away). Parts that already landed in its way are pushed further out along their own direction.
3. Moves overlap (a new part starts while the last is still flying); if any pair collides over the clock the whole
   plan falls back to one part at a time. `QA tembus: FAIL` lists the pairs that still collide.
4. Timing: paced from the part count, or keyed to the VO (each part on its `say` word; "bongkar", "baut",
   "versi/total", "jantung/inti", "pasang/rakit", "terakhir", "mau" mark the beats).
5. Camera: azimuth with the least silhouette overlap in the exploded view; a fit table keeps everything inside the
   safe area under the title and above the captions; the push-in frames the core at eye level.

## Gotchas
- `base (stays)` = parts with no free way out. Normally just the base; anything else is modelled locked in.
- A part inside another needs real room: a closed lathe profile (inner + outer wall) or `holes`, not a solid.
- `mirror: "z"` twins share the label (only the original gets the chip) and come off on their own.
- Very small parts far from the body make the exploded view wide → everything small; prefer to keep them as pieces
  of their parent part unless they matter to the story.
- Colours: `colors.paint` / `paintDark` / `stripe` / `satin` / `alu` re-tint those materials for the whole object.
