# BONGKAR — an everyday object takes itself apart into labelled parts (exploded-view teardown, 3D)

**In this package:** the BONGKAR project in `kits/bongkar/project/`:
- **Director:** one `stories/<id>/object.json` (the object's parts, each built from simple 3D pieces in the
  assembled position) becomes the film. The planner works out **how the object comes apart**: for every part and
  every direction it checks which other parts would be hit sliding out, takes off what is free first (outer
  parts → inner parts), lands each part beyond what is left so the result is a classic exploded-view stack, and
  checks the whole motion mesh-against-mesh so nothing passes through anything. Then the counter, the labels
  (outer parts first, then the core), the push-in to the core, the reassembly and the loop.
- **Look:** a clean warm-white studio, soft shadows and reflections, real-looking paint / plastic / metal / rubber,
  white label chips with a red pin, a big "n / N part" counter, Plus Jakarta Sans captions. No glows, no gradients.
- **Voice:** wordless by default (music + SFX carry it). `--naskah` writes the narration in disassembly order; with
  the buyer's recording (`vo.mp3`) every part comes off on the word that names it (whisper.cpp when installed,
  otherwise the naskah laid onto the recording's speech runs).
- **Sound:** original synth score + SFX from the plan (unscrew ticks, part whooshes, landing clicks, the reassembly
  clack), voice ducking, −14 LUFS.
- **QA gate** ([quality-gates.md](quality-gates.md) › QA gate): every part is tagged; the make script runs the gate after
  `--preview` as a report and before `--final` as a stop, then scans the delivered file. `--plan` has its own tembus
  check over the whole explode clock.

Kit details: `kits/bongkar/KIT.md`; the full `object.json` format and the modelling rules: `stories/PANDUAN.md` in the project.

## Identity
The "what's inside / berapa part?" teardown loop: an ordinary object stands in a studio, the screws spin out, the
parts lift away one after another and settle into an exploded view with a counter rolling up, the camera pushes in
on the part that makes it work (the heart), then everything flies back together and it loops. 20–35 s.

Choose BONGKAR for **"bongkar <benda>", "isinya ada berapa part", "exploded view", "bagian-bagian <benda>",
"teardown", "dalamnya <benda> kayak apa"** about one physical object: household appliances (rice cooker, kipas
angin, setrika, blender, dispenser), tools, gadgets (mouse, remote, senter, speaker), toys, vehicles' simple
assemblies, kitchen things. Prefer INNERWORKS when the subject is how the machine *works* while running (flows,
moving mechanisms); PRECISION for a premium product ad; BEDAH for something built on a site (roof, foundation,
well); BUILDFORGE for a structure assembled in sequence; TIMEFORGE for an object evolving through eras.

## Workflow — zero-prompt (overrides the general guided flow for this style)
A request like **"Buatkan video BONGKAR rice cooker"**, "video bongkar kipas angin, isinya ada berapa part?",
"exploded view setrika", with or without the buyer's VO, is the complete brief **and** the go-ahead for setup,
modelling, direction and the final. Do not recap or stop for approval. Ask only when truly blocked (the object is
unclear: "Yang mana: setrika uap atau setrika biasa?"). Talk friendly Indonesian; say once what you are doing and
roughly how long it takes (≈ 20–40 min, most of it modelling and the render).

1. **Project.** In a BONGKAR project (`voynann-kit.json` says `bongkar`) continue there. Otherwise
   `node SKILL_DIR/new-project.mjs --kit=bongkar` in the current folder (allowed when it holds only hidden files and
   the buyer's VO / script); if it refuses, `node SKILL_DIR/new-project.mjs bongkar-project --kit=bongkar` and work
   inside that folder. Then `npm ci`, `npm run check-env`; on a machine's first project also `npm run smoke` and look
   at `out/rice-cooker/stills/_sheet.jpg`.
2. **Know the object.** List the real parts of a common, generic version of it (no brand): what the user sees
   outside, how it is held together (screws, clips, a nut on a shaft), what sits inside, and which part is its
   **heart** (heating element, motor, battery, pump…). 8–20 parts is the sweet spot (mirror twins count double);
   small things that matter (screws, a switch, a knob) are worth including. Use real Indonesian names a viewer
   would say ("tutup", "panci", "dinamo", "baling-baling").
3. **Model it** in `stories/<id>/object.json` — read `stories/PANDUAN.md` first and the two examples. Every piece in
   world metres at the assembled position, real proportions (a rice cooker is ~0.3 m wide). Parts that sit inside
   other parts must leave room (hollow lathes, holes): this is what makes a clean disassembly possible.
   `node scripts/make.ts <id> --look` → `out/<id>/look/_sheet.jpg` (the assembled object from four sides): it must
   read as the real thing at a glance — silhouette, colours, the details people know (buttons, vents, a logo-free
   panel). Fix and look again (up to 3 rounds).
4. **Plan.** `node scripts/make.ts <id> --plan` until it says **QA tembus: PASS** and only the real base is in
   `base (stays)`. A part listed there that should come off is modelled locked in (no room around it) → give it room
   or an `out` direction. The order line shows how it comes apart: if it is not how a person would do it, adjust
   `layer` hints.
5. **Voice.**
   - **No VO (default):** build straight away, wordless. At delivery offer the narration: run
     `node scripts/make.ts <id> --naskah` and give the buyer `stories/<id>/VO-elevenlabs-v3.txt` (ElevenLabs v3 with
     audio tags) or `naskah.txt` (plain).
   - **VO given:** copy it to `stories/<id>/vo.mp3` (or .wav / .m4a). If it was read from our naskah, keep
     `naskah.txt` as written; if the buyer wrote their own words, put their exact text in `naskah.txt` (one sentence
     per line). Part names in the VO should match `say` (add aliases to `say` rather than changing the voice). Re-run
     `--plan`: `VO sync: n part keys matched` should be close to the number of labelled parts.
6. **Stills.** `node scripts/make.ts <id> --stills` → `out/<id>/stills/_sheet.jpg` (assembled, two moments of the
   teardown, the exploded view with labels, the push-in on the heart, the reassembly). Check: parts large enough to
   read, labels not covering each other, the heart clearly framed with the rest faded back, nothing floating oddly.
7. **Preview + QA.** `node scripts/make.ts <id> --preview` in the **foreground** with the longest command timeout.
   Open the QA images; fix every FAIL; write verdicts for designed CHECKs (screws spinning out, a small fast part).
8. **Final.** `node scripts/make.ts <id> --final` in the foreground (1080×1920 @ 60, sound at −14 LUFS; with VO the
   voice is mixed at its own timing and the music ducks under it).
9. **Deliver.** MP4 path, length, the part count, one line on what comes apart, what was limited, 3 example
   revisions (another colour, a part named differently, landscape). Without a VO, offer the naskah (step 5).

## Landscape 16:9 (only when asked)
Portrait 9:16 is the default: never switch on your own. When the buyer asks for landscape / 16:9 / "versi YouTube",
add `--wide` to the same commands: outputs in `out/<id>-wide/`, preview `<id>_preview_960x540.mp4`, final
`<id>_1920x1080_60fps.mp4`. The object comes apart in the same order (one naskah and one VO serve both formats); the
camera refits for the wide frame and the counter moves to the left. Check the wide stills like the portrait ones.

## Rules
- Per film write `stories/<id>/…` only. Do not change the planner (`scripts/lib/planner.ts`), the film
  (`src/director/`), the studio or the scripts for one film; a real engine limit → work around it in the model and
  say what is limited.
- Never speed up, trim or re-voice the buyer's VO.
- Original and generic only: no brand names, logos, model numbers or a specific product's exact design; colours of
  a generic version (the buyer may choose colours).
- Simplified honestly: the caption says "versi sederhananya" — never claim the count is the real part count of a
  real product. Safety: no instructions for opening mains-powered or pressurised devices; it is a visual
  explainer, not a repair guide.

## Limits of this version
- Parts move in straight lines (one move each); no hinges swinging open, no unthreading along a spiral, no flexible
  parts (cables, belts, springs bending). A cable can be a rigid `tube`.
- Built from primitive pieces (box, rod, disc, torus, ball, tube, extrusions, lathes): simple to medium objects read
  well; organic shapes (a shoe, a teddy bear) and very detailed electronics do not.
- One object per film, standing on the floor; about 4–30 parts (more is slow to plan and crowded on screen).
- Labels for up to 7 outer parts and 6 core parts; screws are counted, not labelled.
- Portrait 9:16 by default, 16:9 with `--wide`. No square or 4:5. Tested on macOS Apple Silicon.

## Quality gates
- `--look` sheet reads as the real object; `--plan` says QA tembus PASS; only the true base stays.
- `--stills` sheet opened and checked; QA gate PASS with every CHECK given a verdict.
- With VO: part keys matched ≥ the labelled parts minus one; nothing comes off before its name is said.

## Hard bans
- Real brands, logos, model names or a copied product design.
- Copying the example objects (`rice-cooker`, `kipas-angin`) into a film about something else.
- Claiming QA passed without opening the look sheet, the stills sheet and the QA images.
