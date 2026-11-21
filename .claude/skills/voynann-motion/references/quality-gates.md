# Art direction and render quality gates

## Non-negotiable visual standards

- The first frame is intentional and worth pausing on. No placeholder opening screen.
- Each shot has a subject, visual hierarchy, foreground/midground/background when applicable, and a narrative reason to exist.
- Materials and lighting explain physical form; do not hide basic geometry behind bloom, fog, gradients, or motion blur.
- The camera uses purposeful composition and restrained, physically legible motion. No perpetual orbit or purposeless zooms.
- Motion has anticipation and follow-through where appropriate; reactions occur because something happened.
- Typography appears only if needed and is clear on a phone display. No generic text-on-gradient montage.
- Transitions preserve visual or conceptual continuity; prevent sudden unexplained cut spam.
- Prefer readable midtones. Deep shadows may be used selectively, but the whole video must not be underexposed.
- For PAPERWORLD, check cut-edge thickness, stable matte paper grain, plausible overlap/contact shadows, coherent diorama scale and connected puppet limbs. For PRECISION, verify mechanical clearances and truthful materials. Do not apply the same material recipe to both.
- For INNERWORKS, verify meaningful true-3D cut surfaces, consistent connected mechanics, readable projected labels and unmistakable separation between force vectors and motion/direction arrows. Derive linked components and charts from the same machine state; enforce mechanism-specific physical invariants.
- Sound effects and music support the story and remain subordinate to VO where present.
- Avoid copying recognizable existing characters, games, or product trademarks.

- BEDAH has its own gates (`references/bedah.md` › Quality gates; pop scan + flicker map in `kits/bedah/KIT.md`).
- CERDIK has its own gates (`references/cerdik.md` › Quality gates; plan warnings, stills sheet, QA gate in `kits/cerdik/KIT.md` › QA).
- BONGKAR has its own gates (`references/bongkar.md` › Quality gates; four-side look sheet, `--plan` tembus check over the explode clock, stills sheet, QA gate run by `scripts/make.ts`).
- NEGERI, TIPIKAL and NEKAT have their own gates (`references/negeri.md`, `references/tipikal.md`, `references/nekat.md` › Quality gates; plan warnings, stills sheet, QA gate in their `KIT.md` › QA).
- CINÉSTORY, CHARACTER FLOW, PANELVERSE, STORYBOOK and CHRONICLE have their own gates (`references/cinestory/qa.md`, `references/characterflow/qa.md`, `references/panelverse/qa.md`, `references/storybook/qa.md`, `references/chronicle/qa.md`): preflight, automated checks and the visual review are required.
- For TIMEFORGE, verify parked parts never pop, per-era recognisable details, labels off during close-ups, readable year/descriptor safe zones. For WORLDFORGE, camera clearance above the terrain height function, coherent sun/shadows, no terrain seams. For BUILDFORGE, support order, no clashes, blueprint seats before installs. For CHARACTER FLOW, the acting person's face visible in every shot, actions readable, no camera inside trees/furniture/bedding, nobody blocking the lens, bubbles and captions never cut or over a face, 13/13 checks from `scripts/qa.mjs` and `out/<id>/qa/REVIEW.md` filled (see `references/characterflow/qa.md`).

## Global delivery standards

- Preview: 540×960 @ 30 FPS for every style (cheap, native-resolution 3D). Final: 1080×1920 @ 60 FPS H.264 yuv420p. Portrait is the default; landscape (preview 960×540 @ 30, final 1920×1080 @ 60) only when the buyer asks for it — directed for the wide frame, never a crop or a padded portrait (see production-kit.md › Landscape, or the style's own reference).
- Audio with VO: AAC 48 kHz, integrated loudness −14 LUFS (±0.5), true peak below −1 dBFS, measured on the delivered file (`scripts/deliver.mjs`). Sync verified by comparing silencedetect pauses of the delivered file and the source (shift = offset, ±1 frame).
- Motion: the QA gate below (scene probe + clean-frame scan before the final, hard scan of the delivered MP4); review the busiest seconds for camera speed.
- Compare look-dev and preview stills with `references/quality-bar/<style>.jpg` before presenting.

## QA gate — tembus, kedip, loncat (every style)

One gate for all nineteen styles, in the project's `scripts/` (copied from `starter/` into every project, standalone kits
too): `qa-scene.mjs` (scene probe + clean-frame scan), `qa-video.mjs` (video scan), `qa-gate.mjs` (both, used by the make
scripts and `render-final.mjs`).

**Tagging.** `<Solid id kind touch tol>` from `src/core/qa/scene-qa.tsx` wraps what acts; it renders as a plain group.
- `kind="body"`: a character (all its meshes, held props included when the rig draws them). Bodies never get `touch="*"`.
- `kind="prop"`: something held or moving near bodies (phone, bag, kite, cup, ball, a dynamic object), `touch={[holderId]}`.
- `kind="set"`: furniture and fixtures bodies sit on, lean on or walk past (chair, bed, bench, desk, stall, tree trunk,
  a build being assembled), usually `touch={["*"]}`. Set vs set is never checked (parts may overlap by design).
- Not tagged: ground, sky, walls far from the action, captions, particles, bubbles, glows.
- Touching pairs may press in 3 × deeper than `tol` (default 1.5 % of the smaller solid — ≈ 2.5 cm for a person).
  Model seats and tables as closed boxes, not single planes, so "inside" can be measured. Two open sheets (paper, cloth,
  a kite) count as tembus as soon as they cross.

**Checks (`qa-scene.mjs` on the PREVIEW composition, `--cuts` = the planned cuts in seconds).**
- TEMBUS — FAIL: a surface point of one solid deeper inside another than allowed, where the camera can see the seam.
  Overlaps behind something or off frame are listed as notes.
- LONCAT — FAIL: a part of a body / prop (mesh origins or bones, matched by id) snaps (one step ≥ 2.5 × the steps
  around it and ≥ 2 % of a body, ≈ 3.5 cm on a person) or flicks away for 1–2 frames and back (≥ 1.2 %, ≈ 2 cm), while
  the solid is in frame and not hidden (eye saccades and finger curls stay below that); the camera snapping or wobbling for one frame inside a shot;
  a camera jump where no cut is planned. Without `--cuts`, camera jumps are CHECK.
- KEDIP — FAIL: a tagged solid vanishing for 1–2 frames, or there for only 1–2 frames.
- Clean-frame scan (captions left out via `qaNoOverlay()`): KEDIP / LONCAT / FLICKER anywhere in the 3D, motion-tested,
  calm-neighbourhood-tested, particle fields and fast camera moves set aside. A blink over a quarter of the frame, black /
  white runs and an unplanned full-frame jump are FAIL; local ones are CHECK.

**CHECK.** Findings of one type in one shot that overlap in time are one item (a lighthouse beam, sea glitter). Flicker
counts from 0.6 × the frame rate (18 / s in a 30 fps preview). Numbers cannot tell a glitch from a designed instant change. Open each `qa-video_NN.jpg` (5 frames, red box);
write `"ok: <why it is intended>"` for its id in `qa-video.review.json` (a cartoon eye blink, typewriter letters, a counter,
a fast hand gesture) and fix the rest; run the gate again — it passes when every CHECK has an "ok" verdict. Planned instant
changes can be passed up front with `--allow=<seconds>` (PANELVERSE passes its panel fx this way).

**Delivered file.** `qa-video.mjs <final.mp4> --hard-only --cuts=…`: black / white runs, full-frame blinks, unplanned cuts.

**Typical fixes.** Tembus: grip at the rim, arc the hand around, sit on the seat edge, push the walk path out, shrink the
prop. Loncat: ease IK / branch switches, never switch a pose in one frame, keep smoothing filters from crossing a cut,
clamp the camera instead of teleporting it. Kedip: never toggle `visible` or ramp a lift to exactly 0 on something in view,
separate coplanar faces (offset ≥ 1 mm, or polygonOffset), fade instead of popping.

## Technical checks

1. Confirm exact dimensions, FPS, expected duration, audio sample timing, and scene bounds.
2. Confirm external assets and fonts are available and permitted for use; document their provenance if any are used.
3. Render a short lookdev segment before building the full film.
4. Inspect stills at start, quarter, middle, three-quarter and final; for an approximately 20-second film also inspect around 0, 2, 5, 8, 12, 16 and 20 seconds.
5. Check missing textures, WebGL errors, clipped silhouettes, flicker, black frames, text safe areas and exposure.
6. Render a low-resolution test with sound, then the final 1080x1920 / 60 FPS deliverable.
7. Report actual commands, outputs, and any failures. Never state a file exists without verifying it.

## Anti-slop diagnostic

If replacing the subject with a random primitive or replacing the story with a generic slogan leaves the video essentially unchanged, the design has not become specific enough. Return to the visual treatment and improve the story, animation purpose, and detail.
