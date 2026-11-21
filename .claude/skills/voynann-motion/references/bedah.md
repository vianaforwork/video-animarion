# BEDAH — "how it's built, and why": realistic 3D build-up explainers directed from a script

**In this package:** the BEDAH project in `kits/bedah/project/`:
- **Director:** a `story.json` (one sentence per shot) becomes the film: cut times from the voice, the state of the
  build at every cut, parts arriving on their words, an automatic camera per shot (10 shot kinds), the worker, pinned
  terms, white marker annotations, weather, captions.
- **Look:** a real-looking building site on a clear day — hard sun, deep blue sky with cumulus, a village behind
  (houses, trees, palms, power line), **the ground cut open at the front** so foundations and soil show in section,
  procedural PBR materials (brick, woven bamboo, thatch, clay tiles, timber, bamboo, plaster, stone).
- **Worker:** one jointed mannequin in a caping, posed by inverse kinematics (tie, press a mould, lay at a height,
  stand and look).
- **Parts so far (domain `rumah`):** small house bodies (bamboo or timber posts, woven walls, section view), roof
  frames (bamboo that can sag; timber trusses, purlins, rafters, battens), coverings (thatch that rots, clay tiles
  with real overlap, ridge tiles), ceiling, tile maker's corner (mould, drying rows, kiln), and the foundation set
  (brick wall, trench, stone footing, ground beam).
- **Sound:** an original synth bed + effects from the plan (rain, timber knocks, clay ticks, chimes on pins),
  ducked under the voice, −14 LUFS.
- **Checks:** plan warnings, stills review, whole-frame pop scan, per-area flicker map, pose QA.
- **QA gate** ([quality-gates.md](quality-gates.md) › QA gate): the make script runs it — after `--preview` as a report (fix every FAIL before the preview is shown), before `--final` as a stop (`--force-qa` only when the user explicitly accepts a known issue), then a hard scan of the delivered file. CHECK strips need an `ok: <why>` verdict in `out/<id>/qa-gate/qa-video.review.json` after you looked at them. People, props and furniture of the kit are tagged with `<Solid>` already; tag anything you add (a new prop, a new set piece).

Kit details, the full `story.json` format and how to add parts: `kits/bedah/KIT.md`.

## Identity
An everyday built thing explained as a chain of small problems and fixes, said to the viewer in the second person:
"Kalau kamu … kamu udah punya …. Tapi …. Jadi kamu …". Every sentence is one shot; the thing grows on screen exactly
as the sentence says; the term appears pinned to the part when it is spoken. Sunny, plain, practical — a patient
tukang showing you, not a lecture.

Choose BEDAH when the script explains **why a built thing is the way it is, step by step** — atap, pondasi, tembok,
lantai, sumur, jalan, jembatan kecil: "kenapa genteng disusun tumpang-tindih", "kenapa rumah butuh pondasi",
"gimana sih bikin …" in the Kalau / Tapi / Jadi pattern. Prefer BUILDFORGE for a whole building assembling in
sequence without that problem-and-fix narration, INNERWORKS for the inside of a machine, TIMEFORGE for one product
changing through dated eras, CHRONICLE for history.

## Workflow — zero-prompt (overrides the general guided flow for this style)
A request like **"Buatkan video BEDAH dari VO / naskah ini: …"**, "video bedah tentang …" or "gaya 'kalau kamu…
tapi… jadi…' tentang …" is the complete brief **and** the go-ahead for setup, direction and the final. Do not recap
or stop for approval — except where step 2 says to. Ask only when truly blocked. Talk friendly Indonesian; say once
what you are doing and roughly how long it takes (≈ 20–40 min when the parts exist, ≈ 40–90 min when the topic needs
new parts).

1. **Project.** In a BEDAH project (`voynann-kit.json` says `bedah`) continue there. Otherwise
   `node SKILL_DIR/new-project.mjs --kit=bedah` sets one up in the current folder (allowed when it holds only hidden
   files and the buyer's VO / script); if it refuses, `node SKILL_DIR/new-project.mjs bedah-project --kit=bedah` and
   work inside that folder. Then `npm ci`, `npm run check-env`; on a machine's first project also `npm run smoke` and
   look at `out/pondasi/stills/_sheet.jpg`.
2. **Script.** Choose the `id` once (a-z 0-9 -).
   - **VO + script text:** keep the buyer's sentences verbatim and in the VO's order, one sentence per line of
     `story.json`. Copy the VO to `stories/<id>/vo.mp3` (or .wav / .m4a).
   - **VO only:** transcribe it with whisper.cpp to read the words; without whisper ask for the text.
   - **Topic only:** write a 35–65 s script in the pattern of `KIT.md` (6–13 words per sentence, 8–18 sentences)
     from what you are sure of (check uncertain facts with a web search when available). Show the buyer the script
     and wait for their OK on the text. Then build the film without a narrator (paced captions, music + SFX) and hand
     over a voice text (same sentences; for ElevenLabs v3 light tags like `[casual]`, `[curious]`, `[cheerful]`);
     when the buyer brings the recording, copy it to `stories/<id>/vo.mp3` and run `--final` again. Never add a
     synthetic narrator silently.
3. **Parts.** `node scripts/make.mjs --parts` lists what exists. Go through the script sentence by sentence: what is
   on screen, what arrives, what goes wrong, what gets named. Anything the domain lacks, **write as new parts**
   following "add parts" in `KIT.md` (data + picture, the rules there). Keep each part simple and correct in scale
   (metres). Then `npx tsc --noEmit`.
4. **Story.** Write `stories/<id>/story.json`. `node scripts/make.mjs <id> --plan` until there are **no warnings**
   and every shot is what you meant (which parts are present, what is built, where the pins sit).
5. **Stills.** `node scripts/make.mjs <id> --stills <one time inside every shot, late in the shot>` →
   `out/<id>/stills/_sheet.jpg`. Look at every frame: the subject is in frame and not hidden; nothing passes through
   anything; arrivals are complete by the end of their sentence; pins point at the right thing and stay inside the
   frame; marks sit on the surface they explain; underground things are seen in the cut. Fix in the story (focus,
   shot kind, side, timing) or in your parts. Up to 3 rounds.
6. **Final.** `node scripts/make.mjs <id> --final` in the **foreground** with the longest command timeout
   (1080×1920 @ 60, sound at −14 LUFS). It prints the pop scan and the flicker table and writes
   `out/<id>/flicker/_all.jpg`: **open that image**. Fix real flicker (see the rules in `KIT.md`) and render again.
7. **Deliver.** MP4 path, length, one line on the story, what was limited and how it was handled, 3 example
   revisions. Revisions = edit `story.json` (or a part) → `--final` again.

## Landscape 16:9 (only when asked)
Portrait 9:16 is the default: never switch on your own. When the buyer asks for landscape / 16:9 / "versi YouTube",
add `--wide` to the same commands: `--stills` → `out/<id>/stills-wide/` (960×540), `--preview` →
`<id>_preview_960x540.mp4`, `--final` → `out/<id>/<id>_1920x1080_60fps.mp4` (flicker map in `flicker-wide/`). Same
story.json: the automatic camera fits every focus to the wide frame (narrower lens, more room above and below, aimed
a little lower so the cut ground shows), captions sit at 80 % of the height, pins flip away from the frame edges. A
shot with a hand-set `cam` keeps that camera in landscape too — give it a `camWide` (`{ "from": …, "to": … }`) when
its wide still is badly framed. Review the wide stills like the portrait ones. Both formats: finish portrait first.

## Rules
- Per film write `stories/<id>/…` and, when the topic needs them, new part files under `src/domains/`. Do not change
  the director (`src/director/`), the kit (`src/kits/bedah/`) or the scripts for one film; a real engine limit →
  work around it in the story and say what is limited.
- **Facts:** building practice varies by place; say "kira-kira" for numbers, never invent a standard or a figure,
  and never present the film as engineering instruction — it explains the idea, it does not replace a builder or an
  engineer.
- Never speed up, trim or re-voice the buyer's VO; the story's sentences must match its words and order.
- The closing line is the buyer's own; do not reuse another channel's catchphrase.

## Limits of this version
- One domain (`rumah`) with roof and foundation parts; **most new topics need new parts written for them** (allow
  the time, and keep the first version of a part simple).
- One worker, six acts (ikat, cetak, pasang, lihat, lihat-atas, berdiri); no walking, no carrying, no face, no
  lip-sync; no vehicles, machines, animals or crowds.
- One outdoor village set in daylight (+ rain); no night, no interiors other than the section view of the house.
- Procedural materials: the look is clean stylised-realistic, not photoreal.
- Portrait 9:16 by default; landscape 16:9 only when the buyer asks (`--wide`). No square or 4:5. Tested on macOS
  Apple Silicon.

## Quality gates
- `--plan` without warnings.
- Every sentence shows what it says, on its words: the build arrives while it is being named.
- No interpenetration, no pops, no flicker on still objects (flicker map read, not just produced).
- Pins and tags readable, inside the frame, never covering the thing they name; captions never hide the action for
  a whole shot.
- A film over 30 s uses at least four different shot kinds and shows the cut ground at least twice.

## Hard bans
- Copying any channel's look identity: its watermark / handle, logo, intro or outro, catchphrase, its exact script
  or shot list, its character. BEDAH's own worker (caping, teal shirt), type (Plus Jakarta Sans) and layout are what
  you use.
- Copying the example stories (`atap`, `pondasi`) into unrelated films.
- Claiming QA passed without opening the stills sheet and the flicker map.
