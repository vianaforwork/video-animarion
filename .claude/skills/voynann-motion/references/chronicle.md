# CHRONICLE — 3D silhouette history documentaries directed from a script

**In this package:** the CHRONICLE project in `kits/chronicle/project/`:
- **Director:** a script (`naskah.txt`) in a simple tagged format becomes a film plan automatically — scenes, set, time
  of day, cast, poses, camera beats per sentence, maps, on-screen text, end card with sources.
- **People:** posable 3D people rendered as flat black silhouettes; named roles carry a thin coloured contour
  (amber hero, cyan ally, crimson enemy, violet victim / grief, ivory neutral). Costumes from the role and the era
  (shako or tricorne soldiers, bicorne officers, destar / peci / blangkon / sorban / caping, sarong, kain, robe…).
- **Places:** 10 sets (grave garden, hall interior, small room, ship deck, harbour, fort wall, forest, village, beach,
  open field / camp) in 8 moods (dusk, blue hour, moonlit night, misty morning, hazy day, fire, interior day / night).
- **Maps:** a 3D relief map built from real coastlines (Natural Earth): pins, route lines with a travelling camera,
  sound / shock rings, eruptions, north always up.
- **Overlays:** big date stamps, name tags, rolling counters, source citations, word-by-word captions.
- **Sound:** an original synthesised score per scene (strings, drone, a gamelan-coloured metallophone, frame drums,
  gongs) + ambience and effects, ducked under the voice, mixed to −14 LUFS.
- **Checks:** plan warnings, stills review, 11 automated QA checks and a visual review gate.

Kit details: `kits/chronicle/KIT.md`; references in [chronicle/](chronicle/): [story-format.md](chronicle/story-format.md),
[directing.md](chronicle/directing.md), [limits.md](chronicle/limits.md), [qa.md](chronicle/qa.md).

## Identity
A history told like a documentary short: warm low-poly 3D places lit from behind (sunset, fire, a bright doorway), the
people as black cut-outs against the light, a few of them outlined in colour so the viewer always knows who is who;
between places, a relief map that flies, draws routes and pins cities. Text is sparse and big (a date, a name, one
number, a source). Calm, serious, cinematic — never cartoonish, never gory.

Choose CHRONICLE when the script is **history, a historical figure, a kingdom, a war, an expedition, an exile, a
disaster or the origin of a place** — "kenapa X dimakamkan di Y", "asal-usul…", "kisah…", "tahun 1815…", a story that
moves between dated events and places on a map. Prefer CINÉSTORY for present-day fiction in one location with
recognisable people, PANELVERSE for jokes and relatable twists, WORLDFORGE for explorable worlds without a narrator.

## Workflow — zero-prompt (overrides the general guided flow for this style)
A request like **"Buatkan video CHRONICLE dari VO / naskah ini: …"**, "video sejarah siluet tentang …" or "gaya dokumenter
sejarah seperti itu" is the complete brief **and** the go-ahead for setup, direction and the final. Do not recap or stop
for approval — except where step 2 says to (text and voice of a narration you write). Ask only when truly blocked.
Talk friendly Indonesian; say once what you are doing and roughly how long it takes (≈ 20–40 min for a 45–90 s film).

1. **Project.** In a CHRONICLE project (`voynann-kit.json` says `chronicle`) continue there. Otherwise
   `node SKILL_DIR/new-project.mjs --kit=chronicle` sets one up in the current folder (allowed when it holds only hidden
   files and the buyer's VO / script); if it refuses, `node SKILL_DIR/new-project.mjs chronicle-project --kit=chronicle`
   and work inside that folder. Then `npm ci`, `npm run check-env`; on a machine's first project also `npm run smoke`
   and look at `out/smoke/_sheet.jpg`.
2. **Story.** Choose the `id` once (from the topic, a-z 0-9 -) and write `stories/<id>/naskah.txt`
   ([chronicle/story-format.md](chronicle/story-format.md), [chronicle/directing.md](chronicle/directing.md)).
   - **VO + script text:** keep the buyer's sentences verbatim and in the VO's order, one sentence per line; add the
     tags around them. Copy the VO to `stories/<id>/vo.mp3` (or .wav / .m4a).
   - **VO only:** with whisper.cpp, transcribe it once to read the words (`ffmpeg -i vo.mp3 -ar 16000 -ac 1 vo16k.wav`,
     then `whisper-cli -m <model> -f vo16k.wav -l id -otxt`); correct names and numbers by ear and context. Without
     whisper ask for the script text.
   - **Topic only:** research it (web search if available; otherwise only what you are sure of), then write a 45–90 s
     naskah with a `[SUMBER …]` behind every date, number and quote. Show the buyer the naskah first. Then offer:
     (a) the buyer records or generates the VO — give them a voice text (numbers spelled out as words, the same
     sentence order; for ElevenLabs v3 add expression tags like `[serious]`, `[dramatic]`, `[whispers]`, `[sighs]`,
     `[pause]`, `[long pause]` and CAPS for one stressed word — see the example `VO-elevenlabs-v3-ekspresi.txt`), or
     (b) a temporary offline macOS voice (`--tts`) **only after the buyer approves the text and the voice**. Never add a
     narrator silently.
3. **Plan.** `node scripts/make.mjs <id> --plan` prints every scene (set / mood, cast, map points) and warnings. Read it
   all; edit the naskah until there are no warnings and every scene is what you meant. Places missing from the map →
   add one line to `src/director/gazetteer.ts` with checked coordinates.
4. **Stills.** `node scripts/make.mjs <id> --stills <8–12 seconds: every scene and every camera change>` →
   `out/<id>/stills/_sheet.jpg`; review it with [chronicle/qa.md](chronicle/qa.md). Fix by editing the naskah (set
   keywords, time of day, cast verbs, counts, colours). Up to 3 rounds.
5. **Final.** `node scripts/make.mjs <id> --final` in the **foreground** with the longest command timeout. It renders
   1080×1920 @ 60 with the score and the voice at −14 LUFS and runs the 11 automated checks →
   `out/<id>/qa/report.json`, `sheet_*.jpg`, `REVIEW.md`. Then gate 3: look at every contact-sheet page and at the film
   around every scene cut, fill every REVIEW row, set STATUS. Never call it PASS while a problem you saw is unfixed.
6. **Deliver.** MP4 path (`out/<id>/<id>_1080x1920_60fps.mp4`; landscape `…_1920x1080_60fps.mp4`), length, one line on the story, the sources shown on the
   end card, what was limited and how it was handled, 3 example revisions. Revisions = edit the naskah → `--final` again.

## Landscape 16:9 (only when asked)
Portrait 9:16 is the default: never switch on your own. When the buyer asks for landscape / 16:9 / "versi YouTube",
add `--wide` to the same commands: `--stills` → `out/<id>/stills-wide/`, `--preview` → `<id>_preview_960x540.mp4`,
`--final` → `out/<id>/<id>_1920x1080_60fps.mp4` + `out/<id>/qa-wide/`. Same naskah, same plan: the director re-frames
every place shot for the wide frame (not a crop) and lays text out on a 1920×1080 canvas. Review the wide stills like
the portrait ones; a citation on a map scene sits above the captions and can meet a high pin — move the tag. When the
buyer wants both formats, finish and review portrait first, then run `--wide --final`.

## Rules
- Per film write only `stories/<id>/…` (naskah, VO copy, voice texts) and, when needed, one gazetteer line. Never edit
  `src/` or `scripts/` for one film; a real engine limit → work around it in the naskah and say what is limited.
- **Facts:** never invent dates, numbers, names or quotes. Every claim on screen or in the narration has a `[SUMBER]`
  (book / article / archive the buyer can check). Disputed numbers get "sekitar" / ranges; legends are told as legends
  ("menurut legenda…"). On-screen citations are paraphrases unless you have the exact wording.
- Real people appear only as anonymous silhouettes identified by text — no portraits, no likeness, no photos.
- Never speed up, trim or re-voice the buyer's VO; the naskah must match its words and order.
- Wishes outside [chronicle/limits.md](chronicle/limits.md) (battles with choreography, horses, sailing fleets on
  screen, places outside the map area): say kindly it is not in this version and offer the closest
  thing (a map route, a camp at night, a harbour, a counter, sound).

## Quality gates
- **QA gate** ([quality-gates.md](quality-gates.md) › QA gate): the make script runs it — after `--preview` as a report (fix every FAIL before the preview is shown), before `--final` as a stop (`--force-qa` only when the user explicitly accepts a known issue), then a hard scan of the delivered file. CHECK strips need an `ok: <why>` verdict in `out/<id>/qa-gate/qa-video.review.json` after you looked at them. People, props and furniture of the kit are tagged with `<Solid>` already; tag anything you add (a new prop, a new set piece).
- `--plan` without warnings; each scene is a deliberate place / map with the right cast.
- Films over 40 s use ≥ 3 different sets or maps; no scene longer than ~12 s without a second camera beat or a map move.
- The lead reads in every key frame (silhouette against light, not lost on a dark wall, not cut by the frame edge);
  contours keep one meaning per colour through the film; text never covers the lead.
- 11/11 automated checks and REVIEW.md filled honestly.

## Hard bans
- Copying any channel's look identity: its watermark / handle, logo, intro or outro, end-card layout, colour gradients
  on titles, or its exact scenes. CHRONICLE's own type (Anton, Barlow Condensed, Plus Jakarta Sans, Instrument Serif),
  palette and layout are what you use.
- Copying the example stories (`diponegoro`, `tambora`) into unrelated films.
- Gore, mocking a religion, ethnicity or victims; presenting one side of a contested history as the only truth.
- Claiming QA passed without running it and looking at every contact-sheet page.
