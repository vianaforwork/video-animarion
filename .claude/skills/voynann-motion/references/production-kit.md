# VOYNANN production kit (starter + style kits)

The skill ships a small, tested Remotion + React Three Fiber code base so every buyer project starts
from the same proven foundation instead of re-inventing camera, light, post-processing and render
scripts. `SKILL_DIR` = the folder containing `SKILL.md`.

| Folder | What it is | Reference builds |
|---|---|---|
| `starter/` | A complete, empty 3D project: core library + scripts + `Showcase` check scene | Typechecked; smoke stills; previews and 1080×1920/60 finals with muxed VO |
| `kits/timeforge/` | Object-evolution engine (parameter-tree morphs, rewind, subject contract, year odometer, time rail) + a 3-era example subject | Phone-evolution film; **TV evolution** subject built from this kit in an empty project, preview + final |
| `kits/worldforge/` | Outdoor world kit: seeded terrain heightfields, near/far terrain mesh, baked sun/AO, sky dome + environment, outdoor stage with sun shadow box, geometry factories, plants, path travel + a fort example | Mars and Rome films; **underwater city** film (31 s, with VO) built from this kit in an empty project at 1080×1920/60 |
| `kits/buildforge/` | Construction engine: components with seats, placement methods (crane lower, slide, fill, pour front, drive, draw, grow, coat, lay pieces), phase schedule, GPU-free order/clash check, terrain grading/excavation, materials with wet concrete and finish sweeps, crane rigging, blueprint ghosts, world builder, stage labels + a garden-pavilion example | A two-storey house film; the **pavilion** example built in an empty project, check OK, stills at every stage |
| `kits/paperworld/` | Paper-diorama engine: procedural paper stock, cut shapes with holes, extruded cards, hinges and pop-up mechanisms, buildings, doors, puppet character with walk/blink/colours, clock, hills/trees/clouds/lamps, stage with portals between worlds + a paper-village example | A door-portal paper film; the **paper village** example built in an empty project |
| `kits/pixelstory/` | 2.5D pixel engine (no WebGL): palette ramps, ASCII sprites + sel-out finish, painted albedo sets relit per frame, sprite lighting, layered pinhole camera with depth of field, light shafts, dust, pixel typography + four OFL fonts + a moonlit-room example with a walking cat | A pixel-art creator film; the **moonlit room** example built in an empty project |
| `kits/characterflow/` | Character engine + automatic director: procedural rig with leg/arm IK, 10 looks + outfits (incl. hijab), 26 expressions, 38 actions, walking/sitting/bed locomotion, phone + sling-bag props, six environments (campus, bedroom, classroom, office, café, living room — rooms from one data-driven room kit) and several places per video, 18 automatic shots, thought bubbles, comedy props, word captions, synthesized sound, story validation, transcription (whisper.cpp or script), macOS TTS, automated QA (13 checks) + REVIEW.md gate; one `stories/<id>/story.json` per video | Validation films on campus (2 people), in a bedroom (1 person) and across seven places (all six environments); fresh-project tests from the ZIP alone and from a new Claude session given one sentence, 1080×1920/60, QA 13/13 |
| `kits/cinestory/` | CINÉSTORY 3D as a **project of its own** (`project/`): automatic director (portrait + landscape cameras, pacing, captions, light, grade), world builder (rooms, doors, terrain, streets, scatter, fixtures) and object builder from JSON, character rig and acting, story analyzer, VO alignment, synthesized sound, geometry preflight, 13 automated QA checks + a visual review gate, example stories | Fresh buyer tests: an office horror night, a minimarket "what if", a smoky city street — each with its own world built in the session |
| `kits/voxelverse/` | Voxel engine: chamfered-box modelling merged per material, architecture kit, spec-driven buildings with instanced glow windows, diorama plinth, dusk sky/environment/fog, rain, Hermite camera shots, post chain + a dusk-street example | A voxel city film; the **dusk street** example built in an empty project |

PRECISION and INNERWORKS have no dedicated kit: build on the core below (its studio, post chain, slab geometry and materials come from PRECISION) and follow the style reference; budget extra look-development rounds (a new INNERWORKS machine typically needs two fix iterations).

## Creating a project (always with the buyer's permission)

1. Pick a folder (ask; default `~/VOYNANN/<short-name>`). Never write into an unrelated project.
2. `node SKILL_DIR/new-project.mjs <folder> --kit=<style>` copies the starter (all files, including `package-lock.json`) plus the style's kit: `src/` into the project's `src/`; for PIXELSTORY also `public/` (fonts), for BUILDFORGE, CHARACTER FLOW and PANELVERSE also `scripts/` (PANELVERSE also `public/`: fonts). `--kit=precision` / `--kit=innerworks` copy the starter alone (those styles have no kit). `--kit=cinestory`, `--kit=storybook` and `--kit=chronicle` copy their own `project/` instead of the starter and mark it with `voynann-kit.json`. The starter's and the kits' source ships packed in `PACKED_SOURCE*.txt` (the Claude app's skill upload takes at most 200 files), so set projects up with `new-project.mjs` only — never copy those folders by hand.
3. CINÉSTORY instead: `--kit=cinestory` copies the kit's own `project/` as the whole project (not the starter); never add another style's kit to it. Read the kit's `KIT.md`.
4. `npm ci` (≈370 MB of packages; minutes on a first install). Then `npm run check-env`. Budget ≈1.2 GB of disk per project after the first render; `node_modules/.cache` (bundler cache) grows with every bundle and can be deleted any time.
5. `npm run smoke` — renders three stills of the `ShowcasePreview` check scene (first run also downloads Remotion's headless Chrome, ≈170 MB). **Look at `out/smoke/_sheet.jpg`.** If it fails or is black, stop and use `references/setup.md` troubleshooting before promising any video.
6. On the first project on a machine with a kit, register the kit's example (see its `KIT.md`) and look at its stills once.
7. Create the film in `src/scenes/<name>/` (or `src/subjects/<name>/` for TIMEFORGE) and register a **preview** and a **final** composition in `src/Root.tsx` from `PRESETS` (`src/core/film/frame.ts`). Kit examples are technical checks: start a film by copying the example's structure, never its subject, set or characters.

## Core library (`src/core`)

| Module | Use |
|---|---|
| `film/Stage3D.tsx` | The frame: waits for the font, mounts `ThreeCanvas` with the standard settings, draws a 2D `overlay(k, layout)` (laid out at 1080×1920 — in a landscape composition 1920×1080 —, auto-scaled) and an optional fade |
| `film/Posed.tsx` | Place a group by a world matrix computed for this frame |
| `film/Voiceover.tsx` | VO at an offset (Studio preview; finals mux the same file/offset) |
| `film/frame.ts` | `PRESETS.preview` 540×960@30, `PRESETS.final` 1080×1920@60 (the default); on request `PRESETS_WIDE` 960×540@30 / 1920×1080@60, `layoutOf(width, height)` (the 2D canvas of a render size), `wideFov(fov)` |
| `motion/track.ts` | `keys(...)`/`sample()` — C1 Catmull–Rom keyframe tracks with monotone clamp and `hold` keys (used in every reference film) |
| `motion/easing.ts` | `ease.*` named curves, `remap`, `mix`, `seg`, `settle` |
| `camera/director.ts` | `shotAt(rig, t, lens)` — rig keys `[tx,ty,tz, azDeg, elDeg, dist, fovDeg]` → `Shot` |
| `render/Post.tsx` | `CameraRig` + `Post`: MSAA → GTAO → bokeh DOF → bloom → PBR Neutral tone map → grade (`aoRadius` per scale) |
| `studio/Studio.tsx` | Bright studio: PMREM softbox light stage, cyclorama with tint pool, optional plinth + ring, PCF key shadow, blob contact shadow; `NEUTRAL_LOOK`, `PLINTH`, `shadow` bounds for other scales |
| `materials/sweep.ts` | `MatState` numbers (`mat()`), `plainMaterial()` (any mesh), `sweepMaterial()` (Slab meshes only — needs the `tfPos` attribute), `applyMat(m, A, B, sweep)` |
| `materials/presets.ts` | `MATERIALS.*` starting recipes: plastics, aluminium, polished metal, ceramic, dark glass, rubber, paper, concrete, wood |
| `materials/softboxOnly.ts`, `textures.ts` | highlights only from area lights; procedural perforation/board textures |
| `geometry/slab.ts` | Fixed-topology rounded slab (per-corner radius, fillets, seam, bulge; becomes a sphere) — morphs without remeshing |
| `geometry/lathe.ts` | `lathe(profile)` for turned parts; `BARREL` profile |
| `type/fonts.ts` | `FONT` (Manrope, bundled in `public/fonts` and loaded with `FontFace` — no network needed), `INK`, `INK_SOFT` |
| `type/brand.ts` | `BRAND` (buyer brand kit from `src/brand.json`), `brandName()`, `brandAccent(bg, styleColour)` (contrast-checked), `contrast()` |
| `type/project.ts` | `projector(shot, 1080, 1920)` (landscape: `projector(shot, 1920, 1080)`) — world point → overlay pixels for labels/callouts |

### Patterns that keep renders deterministic and good

- Compute everything from `t = frame / fps` (or a cut clock); geometry updates in `useLayoutEffect`; the only `useFrame` is the post composer render. No `Math.random()` at render time — seed.
- One coordinate/layout module per film: geometry, labels and camera targets read the same numbers.
- Objects that change shape: one parameter tree, parked (not deleted) parts, staggered per-part timing (see `kits/timeforge`).
- Studio objects: pose with `Posed`, keep the plinth top at `PLINTH.top`, size blob shadow to the footprint. Outdoor scenes: use `kits/worldforge` (sun, sky, terrain) instead of the studio.
- Labels: project a 3D anchor with `projector`, show one label at a time in portrait, keep text out of the top ~17% / bottom ~9% when other typography lives there.
- Close-ups: verify the important part is not occluded (choose the camera side opposite the moving parts) and that removed shells move *away* from the camera.
- **Custom shaders:** keep math finite — clamp before `pow`, guard `normalize` of possibly zero vectors, avoid division by values that can reach 0. Every post chain (`src/core/render/Post.tsx`, and in the kits WORLDFORGE `Stage.tsx`, BUILDFORGE and VOXELVERSE `Post.tsx`, PAPERWORLD `Stage.tsx`) includes a NaN guard right after the scene render, because one NaN pixel spread by bloom once blanked whole frames silently; with the guard a faulty shader shows local black specks instead — still a bug to fix, so inspect stills.
- **Bump/normal maps on thin parts** (paper, slats): screen-space bump mapping can produce NaN on surfaces seen exactly edge-on; the PAPERWORLD material guards it — copy that guard into any new bump-mapped material.
- **Additive / volumetric effects** (light shafts, glows, beams): put the mesh on `FX_LAYER` (`mesh.layers.set(FX_LAYER)`, exported by both post chains) so GTAO and depth of field ignore it; prefer drawing open-water light rays in a background dome shader.
- **Particles** (`Points`): never let them reach the lens — push flakes that come within a few metres outward, and use a soft round sprite; otherwise they render as large squares.
- **Outdoor kit in open water/sky:** the kit's GTAO darkens distant terrain into a visible horizon band; lower `look.ao` for shots without near geometry.
- **Underwater:** not built in — fog colour + gradient background dome, caustics in the terrain shader, rays in the dome, marine snow and fish must be authored (budget about 1 hour of look development).

## Scripts (`starter/scripts`)

| Command | Purpose |
|---|---|
| `npm run check-env` | Node/npm/ffmpeg/disk/platform report; installs nothing |
| `npm run smoke` | Environment + WebGL proof (3 stills of the check scene); falls back to software WebGL and writes `.gl-mode` when the GPU path fails |
| `npm run stills -- out/qa 0.5s,3s,6s <Comp>` | Stills + contact sheet (frames or seconds) |
| `npm run vo -- public/audio/vo.mp3` | Duration, pauses, phrases → `vo.timing.json` (word timings if `WHISPER_CLI`/`WHISPER_MODEL` are set) |
| `npx remotion render <PreviewComp> out/preview.mp4 --codec=h264 --crf=18` | Preview MP4 |
| `node scripts/qa-scene.mjs --comp=<PreviewComp> --cuts=4.2,9.8` | QA gate before showing a preview: tembus / loncat / kedip of the `<Solid>`-tagged things, camera snaps, scan of the 3D alone (quality-gates.md › QA gate) |
| `npm run render:final -- --comp=<FinalComp> --out=out/final.mp4 --vo=public/audio/vo.mp3 --offset=0.4 --cuts=4.2,9.8` | Restartable segmented final, VO mux at offset, −14 LUFS master (`scripts/deliver.mjs`); runs the QA gate on `<Name>Preview` first (stops on FAIL / unreviewed CHECK) and scans the delivered file after |
| `node scripts/qa-video.mjs out/final.mp4 --cuts=… [--hard-only]` | Video scan alone (any MP4) |
| `node scripts/compare-stills.mjs dirA dirB` | Regression check after edits (GPU noise tolerant) |

`--cuts` is the list of planned hard cuts in film seconds (the shot list's start times after the first); the gate lets the
camera jump only there. Tag the film's characters, held props and touched furniture with `<Solid>` as you build them
(`import { Solid } from "../../core/qa/scene-qa.tsx"`) — an untagged film still gets the clean-frame scan, but nothing
can tell it that a hand went through a cup. If you mount your own `ThreeCanvas` instead of `Stage3D`, put `<QaProbe />`
last inside it and leave the 2D overlay out when `qaNoOverlay()` is true.

## Quality bar

`references/quality-bar/<style>.jpg` holds seven frames from each reference film (`cinestory.jpg`: a CINÉSTORY film that passed QA and review). Before showing a preview, compare your stills against the style's strip: subject detail, material separation, light, shadow contact, framing and typography should be in the same class. If they are clearly weaker, iterate before presenting (a new film usually needs 1–2 iterations).

## Landscape 16:9 (only when the buyer asks)

Portrait 9:16 is the default for every style and every request that does not name a format. Make a landscape film
only when the buyer asks in words ("landscape", "16:9", "horizontal", "mendatar", "versi YouTube", "untuk YouTube
panjang"); never offer it instead of portrait, never deliver both unless asked. CINÉSTORY, CHARACTER FLOW,
PANELVERSE, STORYBOOK, CHRONICLE and BEDAH have a switch in their own references. For the other styles (PIXELSTORY,
VOXELVERSE, PRECISION, PAPERWORLD, INNERWORKS, WORLDFORGE, TIMEFORGE, BUILDFORGE) landscape is directed, never
converted — do not crop, pad, scale or letterbox a portrait render:

1. **Register** the same film component again from `PRESETS_WIDE`: `<Name>PreviewWide` (960×540 @ 30) and
   `<Name>FinalWide` (1920×1080 @ 60). The portrait pair stays registered.
2. **One component, two framings.** `const { width, height } = useVideoConfig(); const wide = width > height;` and
   branch on `wide` only where the frame matters: camera keys, staging, 2D layout.
3. **Camera.** The same vertical fov shows three times the width in 16:9.
   - Studio / object films (PRECISION, TIMEFORGE, INNERWORKS): the object keeps its share of the frame height, so
     the keys usually stand; check that top typography and the object do not meet, and use the free width (object
     off-centre with the label beside it, exploded parts spread sideways instead of stacked).
   - Places (VOXELVERSE, PAPERWORLD, WORLDFORGE, BUILDFORGE): the wide frame reveals set edges, backdrop ends,
     unbuilt sides and the void. Narrow the lens (`wideFov(fov)` ≈ twice the portrait width) or re-key the shot, dress
     the set to the new edges, and stage people and buildings side by side instead of in depth.
4. **2D layer.** `Stage3D` hands the overlay `(k, layout)` with a 1920×1080 canvas: position from `layout.w` /
   `layout.h`, never from 1080 / 1920. Kit overlays take the render `height` and lay themselves out for landscape
   (TIMEFORGE `Overlay` / `TimeforgeFilm`, BUILDFORGE `StageLabel`). Labels: `projector(shot, 1920, 1080)`; a label
   column beside the object, ordered by the projected anchor height so leaders never cross. Captions
   sit in the lower fifth, at most two lines; keep text out of the top ~12 % / bottom ~8 % when other typography
   lives there.
5. **PIXELSTORY:** `SCREEN_WIDE` (1920×1080: `<CinematicCamera screen={SCREEN_WIDE}>`, the stage div and `Grain`
   sized with it); paint the set for a 240×135 art-pixel frame — a 135×240 set does not fill it. **PAPERWORLD:**
   `FORMAT_WIDE`; build the street across the width. Exploded views (PRECISION, INNERWORKS) travel sideways and
   need more width than the closed object: frame the open state, not the closed one.
6. **Review and deliver** like portrait: wide stills at every beat
   (`node scripts/stills.mjs out/stills-wide <times> <Name>PreviewWide`), preview `out/<id>_preview_960x540.mp4`,
   final `npm run render:final -- --comp=<Name>FinalWide --out=out/<id>_1920x1080_60fps.mp4 …`; ffprobe must say
   1920×1080. When the buyer wants both formats: finish and get portrait approved first, then direct the wide one —
   each format gets its own stills review.
