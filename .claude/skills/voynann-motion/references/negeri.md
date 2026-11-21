# NEGERI — "bikin negara dari nol": a daily participatory 3D series (followers = citizens, top comment = the build)

**In this package:** the NEGERI project in `kits/negeri/project/`:
- **Director:** a `story.json` (one VO sentence per line, beats like *counter*, *comment*, *build*, *gag*, *cta*) becomes
  one day of the series: cut times from the voice, an **automatic camera per beat** (line-of-sight against buildings,
  houses, trees and people, framed around the cards for 9:16 or 16:9), the host acting the voice (mouth on every
  word), the population counter rolling while the settlement grows, comment cards, a building rising stage by stage
  with a build card, name plates, citizen gags, time jumps, the CTA, a flyover.
- **Series memory:** `series/<name>/world.json` keeps the country (name, flag colours, host, every day's population,
  buildings with their plots, named houses, citizens). `--final` writes the day in, so Day N+1 starts where Day N
  ended (re-rendering a day replaces it, never duplicates). Day 1 starts from empty land. Several series side by side.
- **Look:** clean low-poly game world (plaza with the flag and the host's first tent, dirt roads, rice field, river,
  coconut palms, hills), warm late-afternoon light (pagi / siang / malam too), chibi characters with big 2D anime
  faces, flat "papan pengumuman" cards (cream paper, ink borders, red + deep green), Fredoka + Plus Jakarta Sans.
- **Library:** 19 buildings with labelled build stages (+ 15 aliases: DPR, masjid, alun-alun, rumah sakit…), 5 leader
  presets + 13 citizen presets, 24 actions (18 standing, 6 seated), 11 expressions, 8 gag kinds, 12 beat kinds; buyer buildings from a JSON
  parts DSL (`buildings.json`).
- **Sound:** original synth city-builder score + SFX from the plan, ducked under the voice, −14 LUFS.
- **QA gate** ([quality-gates.md](quality-gates.md) › QA gate): the make script runs it — after `--preview` as a report,
  before `--final` as a stop, then a scan of the delivered file. The host, citizens and buildings are tagged already.

Kit details, the full `story.json` format, the building DSL: `kits/negeri/KIT.md`.

## Identity
The trending Indonesian format where a host builds a country live with the audience: "HARI 3 bikin negara dari nol",
FOLLOW = jadi WARGA, KOMEN TERATAS = aku BANGUN. Every episode: where the country stands, the population jump
(counter), the top comment read out, one build rising on screen, commenters' names on new houses, one small comic
drama with the citizens, "Besok bangun apa? Komen!". Chatty first-person Gen-Z voice, cuts every ~2 s, warm and cute,
a daily numbered series that drives follows and comments.

Choose NEGERI for **a numbered participatory series where followers / comments shape a growing place**: "video
bikin negara dari nol hari 1", "kerajaan netizen", "kota yang dibangun dari komen", "desa warganet hari 5", "lanjut
hari berikutnya, komen teratas minta bandara", or a buyer pasting today's top comments + follower count. Prefer
CERDIK for a clever-trick story with a narrator (no series, no audience mechanic), BEDAH for how one structure is
built step by step with the ground cut open, WORLDFORGE for a cinematic world / landscape reveal without a host or an
audience, TIPIKAL for "tipe-tipe…" relatable sketches, NEKAT for a squad's escalating challenge, CHARACTER FLOW for
relatable feelings acted by realistic characters.

## Workflow — zero-prompt (overrides the general guided flow for this style)
A request like **"Buatkan video NEGERI hari 4: follower 31.200, komen teratas @x 'bikinin sekolah', …"**, "lanjut
negara netizen hari berikutnya", or "video bikin negara dari nol dari VO ini" is the complete brief **and** the
go-ahead for setup, direction and the final. Do not recap or stop for approval — except where step 2 says to. Ask
only when truly blocked (no follower number and no VO to hear it from → use the last day's number + a small growth and
say so). Talk friendly Indonesian; say once what you are doing and roughly how long it takes (≈ 15–30 min; + 15–30 min
when a building must be designed for the story).

1. **Project.** In a NEGERI project (`voynann-kit.json` says `negeri`) continue there (the series lives in it).
   Otherwise `node SKILL_DIR/new-project.mjs --kit=negeri` sets one up in the current folder (allowed when it holds
   only hidden files and the buyer's VO / script); if it refuses, `node SKILL_DIR/new-project.mjs negeri-project
   --kit=negeri` and work inside that folder. Then `npm ci`, `npm run check-env`; on a machine's first project also
   `npm run smoke` and look at `out/hari-1/stills/_sheet.jpg`. When the buyer sends a `world.json` from another
   computer, copy it to `series/<name>/world.json` (and their `tokoh-*.json` into `tokoh/`).
2. **Inputs → script.** Choose the `id` once (e.g. `hari-4`; a-z 0-9 -) and the series name (the country's slug,
   e.g. `republik-komen`; keep it for every later day). Day number = last day in world.json + 1 unless the buyer says.
   - **VO + script text:** keep the buyer's sentences verbatim and in the VO's order, one per line. Copy the VO to
     `stories/<id>/vo.mp3` (or .wav / .m4a).
   - **VO only:** transcribe it with whisper.cpp to read the words; without whisper ask for the text.
   - **Inputs only** (day, followers, top comments, what wins): write the script with the six beats of `KIT.md` ›
     Writing the script, in the buyer's register (aku/kamu or gue/lo), 10–16 sentences, 30–60 s. Show the buyer the
     script together with the cast card (`--cast`, see Tokoh) and wait for their OK on both in that one message. Then
     build the film without a voice (paced bubbles, music + SFX) and hand over the ElevenLabs v3 voice text; when the
     recording comes, copy it to `stories/<id>/vo.mp3` and run `--final` again. Never add a synthetic voice silently.
   Use only handles / comments the buyer gave (never invent real people's handles; invented extras are unnamed).
3. **Build, cast, places.** `npm run library`. Map the winning comment to a building or alias (`"bikinin DPR"` →
   `dpr`, `"rumah buat aku"` → `rumah` with `by`); runner-up comments go in the comment list. A building the library
   lacks (waterboom, menara pandang, monumen…) → write it in `stories/<id>/buildings.json` (or `series/<name>/
   buildings.json` for the whole series) with the parts DSL and check it with `node scripts/make.mjs <id> --look`
   before the story; never edit `src/`. **Cast:** the host comes from the series (world.json) — on day 1 from the
   buyer's description, card codes or a saved tokoh (see Tokoh), else `presiden`. Citizens: commenters become warga
   with their `handle` (pick presets; keep the same look for the same handle across days — world.json lists them).
4. **Story.** Write `stories/<id>/story.json`: `series`, `day`, `population` (followers at the end of the day),
   `comments`, `builds`, `plates`, and per line the beat (counter on the number, comment on the reading, build on
   "aku bangun…", reveal / plates, a gag, cta last), host action + expression where they help the joke, extra cuts
   with `beats` + `"at": "<word>"` (≈ every 2 s). `node scripts/make.mjs <id> --plan` until there are **no warnings**.
5. **Stills.** `node scripts/make.mjs <id> --stills auto` → `out/<id>/stills/_sheet.jpg` (all stills from one page:
   seconds). Look at every frame: the subject clear (host face, the building, the sign, the plate, the gag group), the
   right expression, cards / bubbles not over faces or each other, nothing through anything, text readable. Fix in the
   story (beat, `place`, `shot`, `side`, timing, who) or the building JSON. Up to 3 rounds.
6. **Preview + QA.** `node scripts/make.mjs <id> --preview` in the **foreground** with the longest command timeout.
   Open the QA images; fix every FAIL; write verdicts for designed CHECKs (eye blinks, the settlement growing during
   the counter, building pieces arriving, gag chatter).
7. **Final.** `node scripts/make.mjs <id> --final` in the foreground (1080×1920 @ 60, −14 LUFS). It writes the day
   into `series/<name>/world.json` (say so: tomorrow's episode continues from it).
8. **Deliver.** MP4 path, length, one line on the day (what was built, for whom, the gag), what was limited and how it
   was handled, 3 example revisions, and the next-day hook ("kirim komen teratas besok + jumlah follower"). Show
   `out/<id>/tokoh.jpg` (run `--cast` if missing) with one line: the leader and citizens can be changed or saved —
   "ketik *kartu tokoh* untuk lihat pilihannya". Revisions = edit `story.json` → `--final` again (same day: world.json
   is replaced, not duplicated).

## Tokoh — the host and the citizens (choose, change, save)
Buyers never touch code: they describe people in plain words or with the codes on the **kartu tokoh**, and you write
the matching `look` fields. `npm run library` prints every code with the field it sets.
- **Kartu tokoh:** `npm run menu` → `out/_menu/kartu-tokoh-1.jpg` (leaders P1–P5, citizens T1–T13), `-2.jpg` (hair
  R1–R6, head covers K1–K7, face F1–F6), `-3.jpg` (skin S1–S4, body B1–B4, batik motif M1–M4, colours W1–W16, clothing
  parts). Show all three when the buyer asks to see the choices ("kartu tokoh", "pilihan tokoh", "ganti presidennya")
  and wait for their picks. Never send them unasked in the middle of the zero-prompt flow.
- **Translate words and codes:** "P2" → `"preset": "presiden-hijab"`; "T10" → `"preset": "tukang"`; "kerudung W11" →
  `"hat": { "kind": "kerudung", "color": "#8c2a35" }`; "batik parang W12" → `"shirt": { "motif": "parang",
  "motifColor": "#7a4a2a" }`; "kacamata, kumis" → `"face": { "glasses": true, "mustache": true }`; "gendut" → B4
  `belly`; "kulit S4" → `"skin": "#8e5a3a"`; "rompi oranye" → `"vest": "#e8833a"`; "tanpa tali ID" → `"lanyard":
  false`; "tulisan di kartunya GUBERNUR" → `"lanyard": { "strap": "#c8252f", "text": "GUBERNUR" }` (≤ 10 letters).
  A colour not on the card → a flat hex close to it. Something the kit cannot make (an animal mascot, a robot, a cape,
  long dresses / skirts, a real person's face, a politician's likeness, a party symbol) → say so in one line and offer
  the nearest card option; never edit `src/kits/negeri/`.
- **Check:** `node scripts/make.mjs <id> --cast` → `out/<id>/tokoh.jpg` (full body + face of the host and every
  citizen, with handles). It validates every look and names the wrong field. After a cast change show this card.
- **Save for the series** (the host is THE recurring character — save him / her on day 1): `node scripts/make.mjs
  <id> --save-tokoh host --nama "Pak Pres"` → `tokoh/tokoh-pak-pres.json` (citizens: `--save-tokoh budi`). The series'
  world.json also remembers the host, so later days need no `host` at all; `"host": { "tokoh": "pak-pres" }` uses the
  file (in another series too), plus `"look"` on top for an outfit change (e.g. a batik for Independence Day). Tell the
  buyer where the file is; on another computer they copy it into `tokoh/`. A buyer's `tokoh-*.json` → copy into `tokoh/`.
- Keep the citizens distinct (different shirt colours); the same handle keeps the same look across days.

## Landscape 16:9 (only when asked)
Portrait 9:16 is the default: never switch on your own. When the buyer asks for landscape / 16:9 / "versi YouTube",
add `--wide` to the same commands (or `"format": "landscape"` in story.json): stills in `stills-wide/`, preview
`<id>_preview_960x540.mp4`, final `<id>_1920x1080_60fps.mp4`. Cards move to a side column, the camera puts the subject
in the free side; check the wide stills like the portrait ones.

## Rules
- Per episode write `stories/<id>/…` (and `buildings.json` when needed); the series file is written by the make
  script — edit world.json by hand only to fix a mistake the buyer asks about (a wrong population, a building to
  remove: delete its entry in that day's `builds`). Do not change the director (`src/negeri/compile.ts`, `camera.ts`,
  `Film.tsx`), the kit (`src/kits/negeri/`) or the scripts for one film; a real engine limit → work around it in the
  story and say what is limited.
- The country is **fictional**: never real politicians, parties, state emblems or a real country's leader / palace;
  the red-white flag only as a generic flag of an Indonesian-flavoured made-up country (the buyer may pick other
  colours). Handles only as the buyer supplies them.
- Never speed up, trim or re-voice the buyer's VO; the story's sentences must match its words and order.
- Original only: no channel's name, mascot, logo, title art, catchphrase or exact jokes (e.g. no "DAY 8" yellow chip
  clone, no blob mascot, no black-suit slick-hair president). Use the kit's cast, UI and the buyer's own country.

## Limits of this version
- One country map template (17 building plots + 40 named-house slots; when full, `"plot"` replaces an old building).
- Chibi bodies posed by IK: no walking (people change place on a cut), running, jumping, riding, swimming; the host
  stands; citizens sit / sleep only on seats or a mat. No moving vehicles (the train and plane slide in once), no
  animals, no physics, no weather (time of day only). One voice — citizens do not speak (gag chatter is mouth only).
- Portrait 9:16 by default; 16:9 with `--wide`. No square or 4:5. Tested on macOS Apple Silicon.

## Quality gates
- `--plan` without warnings; `--stills auto` sheet opened and every shot checked.
- Cuts every 1.5–3 s on spoken words; the counter beat on the number, the build beat on "aku bangun", CTA last.
- The winning comment readable for ≥ 1.5 s; the building visibly rising (≥ 2 s) with the build card; name plates
  readable.
- No interpenetration, no pops, no flicker; QA gate PASS with every CHECK given a verdict.

## Hard bans
- Copying any existing channel's identity: name, handle, logo, mascot, host design, UI chips, catchphrase, intro /
  outro, scripts. NEGERI's cast, map, cards, type (Fredoka + Plus Jakarta Sans) are what you use.
- Real politicians, parties, state symbols or institutions' logos; invented real-looking handles of real people.
- Copying the example stories (`hari-1`, `hari-2`, `kerajaan-1`, `desa-5`) into unrelated films.
- Claiming QA passed without opening the stills sheet and the QA images.
