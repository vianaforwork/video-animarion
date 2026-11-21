# CERDIK — clever-trick story shorts with round-head stick figures in rich 3D worlds

**In this package:** the CERDIK project in `kits/cerdik/project/`:
- **Director:** a `story.json` (one VO sentence per line, cuts on chosen words) becomes the film: cut times from the
  voice, people placed at named places with actions, expressions, walking, holding and talking; props, effects,
  crowds, time of day, rain, dissolves; an **automatic camera per shot** that checks lines of sight against the world.
- **Look:** big white round heads with drawn 2D faces (10 expressions, blinks, a red flush), thin black stick limbs
  and mitten hands, costume torsos with ink outlines — inside saturated, detailed 3D worlds: a Nias-style village,
  a market street, a fishing beach, a family home, a Javanese palace. Glow highlights on the thing that matters,
  cutaways into vessels, word-by-word captions.
- **Sound:** original synth score + SFX from the plan, ducked under the voice, −14 LUFS.
- **QA gate** ([quality-gates.md](quality-gates.md) › QA gate): the make script runs it — after `--preview` as a report,
  before `--final` as a stop, then a scan of the delivered file. People and held / big props are tagged already.

Kit details, the full `story.json` format, how to add props and worlds: `kits/cerdik/KIT.md`.

## Identity
The "laughed at, then proven right" genre of short explainers: one narrator tells, in the present tense and fast,
how someone did something that looked stupid, everyone mocked it, the normal way seemed to win — until conditions
changed and the trick paid off on the very last line. Science, engineering, history and everyday wisdom shown, not
lectured: the cut opens the kendi, the stone glows under the post, steam rises from the glass jar. Cuts every ~2 s,
one or two words of caption at a time, warm saturated worlds, simple funny faces.

Choose CERDIK for **a clever trick, a hidden reason or a surprising twist told as a little story with characters**:
"kenapa kendi bikin air dingin", "kenapa rumah adat Nias tahan gempa", "nelayan yang bawa lampu paling terang",
"raja yang nggak percaya alat ini", "kenapa gelas es berkeringat" — the "diketawain dulu, terbukti benar" pattern,
or any short story explainer in that style. Prefer BEDAH when the script is a step-by-step "how it's built" in the
second person with the ground cut open, CHARACTER FLOW for relatable everyday feelings acted by realistic 3D
characters (no twist, no world building), CHRONICLE for documented history with dates, maps and sources,
STORYBOOK for children's tales read from a book.

## Workflow — zero-prompt (overrides the general guided flow for this style)
A request like **"Buatkan video CERDIK dari VO / naskah ini: …"**, "video cerita tokoh kepala bulat tentang …" or
"video 'diketawain dulu, terbukti benar' tentang …" is the complete brief **and** the go-ahead for setup, direction
and the final. Do not recap or stop for approval — except where step 2 says to. Ask only when truly blocked. Talk
friendly Indonesian; say once what you are doing and roughly how long it takes (≈ 25–45 min when a world fits,
+ 30–60 min when the story needs a new world).

1. **Project.** In an CERDIK project (`voynann-kit.json` says `cerdik`) continue there. Otherwise
   `node SKILL_DIR/new-project.mjs --kit=cerdik` sets one up in the current folder (allowed when it holds only hidden
   files and the buyer's VO / script); if it refuses, `node SKILL_DIR/new-project.mjs cerdik-project --kit=cerdik` and
   work inside that folder. Then `npm ci`, `npm run check-env`; on a machine's first project also `npm run smoke` and
   look at `out/kendi/stills/_sheet.jpg`.
2. **Script.** Choose the `id` once (a-z 0-9 -).
   - **VO + script text:** keep the buyer's sentences verbatim and in the VO's order, one per line of `story.json`.
     Copy the VO to `stories/<id>/vo.mp3` (or .wav / .m4a).
   - **VO only:** transcribe it with whisper.cpp to read the words; without whisper ask for the text.
   - **Topic only:** write the script with the six beats of `KIT.md` › Writing the script (8–14 sentences, 35–65 s,
     facts you are sure of — check uncertain ones with a web search when available). Show the buyer the script
     together with the cast card (`--cast`, see Tokoh) and wait for their OK on both in that one message. Then build the film without a narrator (paced captions, music + SFX) and hand over
     the ElevenLabs v3 voice text; when the recording comes, copy it to `stories/<id>/vo.mp3` and run `--final`
     again. Never add a synthetic narrator silently.
3. **World, cast, props.** `npm run library`. Pick the world whose places fit the story (or write a new one following
   `KIT.md` › Adding a world, then check it with `WorldLook`). **Cast:** when the buyer described people, named card
   codes or saved tokoh, or sent `tokoh-*.json`, build exactly those (see Tokoh); otherwise pick presets and recolour
   them so each person is recognisable (the hero in one clear colour, the rival in another). Add missing objects in
   `stories/<id>/props.json`.
4. **Story.** Write `stories/<id>/story.json`: per line, who stands where, what they do and feel, which shot, which
   word the next cut lands on (≈ every 2 s), effects on the key object (glow on the reveal word, cutaway for "inside",
   sweat / steam / chill / heat for temperature), a `dissolve` for time jumps, extras for crowds, `time` when the day
   changes, `weather: "rain"` when it rains (falling rain, grey light, rain sound — no need to build it). `node scripts/make.mjs <id> --plan` until there are **no warnings**.
5. **Stills.** `node scripts/make.mjs <id> --stills auto` → `out/<id>/stills/_sheet.jpg` (all stills from one page: seconds; for a new world check it with `WorldLook` as `KIT.md` shows, not one still per page). Look at every frame: the
   subject clear and not hidden, faces readable, the right expression, props on their surfaces, held props in the
   hands, nothing through anything, the background rich. Fix in the story (shot, `on`, `side`, places, timing) or in
   your props / world. Up to 3 rounds.
6. **Preview + QA.** `node scripts/make.mjs <id> --preview` in the **foreground** with the longest command timeout.
   Open the QA images; fix every FAIL; write verdicts for designed CHECKs (blinks, glows, expression swaps).
7. **Final.** `node scripts/make.mjs <id> --final` in the foreground (1080×1920 @ 60, sound at −14 LUFS).
8. **Deliver.** MP4 path, length, one line on the story, what was limited and how it was handled, 3 example
   revisions. Show `out/<id>/tokoh.jpg` (run `--cast` if it is missing) with one line: the people can be changed
   or saved for a series — "ketik *kartu tokoh* untuk lihat pilihannya". Revisions = edit `story.json` → `--final`
   again (a cast change: `--cast` to show it first, then `--final`).

## Tokoh — the buyer's characters (choose, change, save)
Buyers never touch code: they describe people in plain words or with the codes on the **kartu tokoh**, and you write
the matching `look` fields. `npm run library` prints every code with the field it sets.
- **Kartu tokoh:** `npm run menu` → `out/_menu/kartu-tokoh-1.jpg` (ready characters T1–T18), `-2.jpg` (hair R1–R6,
  head covers K1–K8), `-3.jpg` (face F1–F6, body B1–B5, colours W1–W16, clothing parts). Show all three when the
  buyer asks to see the choices ("kartu tokoh", "pilihan tokoh", "mau ganti tokoh", "tokohnya bisa apa aja?") and
  wait for their picks. Never send them unasked in the middle of the zero-prompt flow.
- **Translate words and codes:** "T5" → `"preset": "ibu"`; "rambut R4 cokelat" → `"hair": { "style": "bun",
  "color": "#8a5a3a" }`; "kerudung W2" → `"hat": { "kind": "kerudung", "color": "#e8833a" }`; "kacamata, kumis" →
  `"face": { "glasses": true, "mustache": true }`; "gemuk" → B5 `build`; "rompi W12" → `"costume": { "vest":
  "#8a5a3a" }`; "tanpa peci" → `"hat": { "kind": "none" }`. A colour not on the card → a flat hex close to it.
  Something the kit cannot make (a cat, a robot, a helmet, a hijab style other than kerudung, long hair, a real
  person's face) → say so in one line and offer the nearest card option; never edit `src/kits/cerdik/` for it.
- **Check:** `node scripts/make.mjs <id> --cast` → `out/<id>/tokoh.jpg` (full body + face of every person, with
  names). It also validates every look and names the wrong field. After a cast change show this card before
  rendering again.
- **Save for a series:** when the buyer wants to keep a character ("simpan tokoh ini", a recurring host, "pakai lagi
  di video berikutnya"): `node scripts/make.mjs <id> --save-tokoh bu --nama "Bu Sari"` → `tokoh/tokoh-bu-sari.json`
  (several: `--save-tokoh bu,saingan`, names from `"name"` in the cast entry). Next films use
  `"cast": { "bu": { "tokoh": "bu-sari" } }` — plus `"look"` on top for an outfit change in one film. Tell the buyer
  where the file is and that next time saying the name is enough; in another project or computer they copy the
  file into `tokoh/`. When the buyer attaches a `tokoh-*.json`, copy it into `tokoh/` and use it.
- Keep each film's people distinct from each other (different main colours); a series keeps the same saved tokoh.

## Landscape 16:9 (only when asked)
Portrait 9:16 is the default: never switch on your own. When the buyer asks for landscape / 16:9 / "versi YouTube",
add `--wide` to the same commands (or `"format": "landscape"` in story.json): stills in `stills-wide/`, preview
`<id>_preview_960x540.mp4`, final `<id>_1920x1080_60fps.mp4`. The automatic camera fits the wider frame; check the
wide stills like the portrait ones.

## Rules
- Per film write `stories/<id>/…` and, when needed, a new world file pair under `src/cerdik/worlds/`. Do not change the
  director (`src/cerdik/compile.ts`, `camera.ts`, `Film.tsx`), the character kit (`src/kits/cerdik/`) or the scripts for
  one film; a real engine limit → work around it in the story and say what is limited.
- **Facts:** the trick must be real (science, engineering, documented history); characters and the little drama may
  be invented — say so if the buyer asks. Round numbers with "kira-kira"; never invent statistics.
- Never speed up, trim or re-voice the buyer's VO; the story's sentences must match its words and order.
- Original only: no channel's name, mascot, catchphrase, character designs, intro / outro or exact stories. Use the
  kit's own cast and the buyer's own topic.

## Limits of this version
- Five worlds (desa, pasar, pantai, ruang, istana); other places need a new world written for the story.
- Stick-figure bodies posed by IK: no running, jumping, fighting, riding, swimming, climbing or lying down; walking in
  straight lines on flat ground; long dresses only for standing / sitting people. No animals, no moving vehicles,
  no physics (nothing falls, breaks or collapses), no lip-sync. Weather: rain only (no storm / lightning / snow / fog
  bank / flood water).
- Portrait 9:16 by default; 16:9 with `--wide`. No square or 4:5. Tested on macOS Apple Silicon.

## Quality gates
- `--plan` without warnings; `--stills auto` sheet opened and every shot checked.
- Cuts every 1.5–3 s on spoken words; at least four shot kinds in a film over 30 s; the payoff on the last line.
- The key object highlighted (glow / cutaway / effect) at the moment the voice names it.
- No interpenetration, no pops, no flicker; QA gate PASS with every CHECK given a verdict.

## Hard bans
- Copying any existing channel's look identity: name, handle, logo, characters, catchphrase, intro / outro, its
  scripts or shot lists. CERDIK's cast, worlds, type (Plus Jakarta Sans) and caption style are what you use.
- Copying the example stories (`kendi`, `nelayan`, `raja`, `rumah`) into unrelated films.
- Claiming QA passed without opening the stills sheet and the QA images.
