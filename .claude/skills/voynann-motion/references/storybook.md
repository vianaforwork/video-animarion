# STORYBOOK — a picture-book script told as a real paper storybook

**In this package:** the STORYBOOK project in `kits/storybook/project/`:
- **Director:** a picture-book script (`naskah.txt`) in a simple tagged format becomes a book automatically: cover with
  the title, the opening, a title page (title, author, dedication), one page turn per page, the page text printed under
  each picture, a closing word ("Tamat") on the last page and the reading lamp dimming.
- **Book:** a hardcover on a wooden table under a warm reading lamp; pages curl when they turn (true bend, soft
  shadows); every picture is painted cut paper (watercolour wash, crayon, gouache) lifted in layers.
- **Cast:** paper puppets on brass split pins — children, adults and elders (8 hair styles incl. hijab and peci,
  5 outfits, any colours, dots / stripes, glasses, beard) — and paper animals (cat, rabbit, dog, bird, duck, fish,
  butterfly) plus a living star. 20 actions: walk, run, jump, wave, point, look up, happy, sad, cry, surprised, sit,
  sleep (in bed or on the grass), hug, peek from a window, fall from the sky, fly, swim, fly a kite, hold a balloon /
  lantern / umbrella.
- **Places:** garden with a house, park, village, forest, beach, sea, mountains, rice fields, river, bedroom, school,
  town, open sky; morning, day, dusk, night, rain; props from a library of ~40 painted pieces.
- **Sound:** the narration (whole lines, moved apart so every page turn falls into a pause), an original music-box
  lullaby ducked under the voice, cover, page turns, footsteps, sparkles, wind, rain, the lamp click; −14 LUFS.
- **Checks:** plan warnings, stills review, automated QA and a visual review gate.

Kit details: `kits/storybook/KIT.md`; references in [storybook/](storybook/): [story-format.md](storybook/story-format.md),
[directing.md](storybook/directing.md), [limits.md](storybook/limits.md), [qa.md](storybook/qa.md).

## Identity
A bedtime picture book, read aloud: warm, gentle, handmade. The viewer sees a real book — the paper, the printed words,
the turn of every page — and in each picture small paper people and animals move on their pins. One page = one moment
of the story; the words under the picture are exactly what the narrator reads. Soft colours, no glow, no UI, no
captions on the video (the text is printed on the paper).

Choose STORYBOOK when the script is **a children's story, a fable, a bedtime story, a moral tale or a gentle family
story** — "dongeng", "cerita anak", "buku cerita", "sebelum tidur", animals that talk, a lesson about sharing / honesty /
courage — or when the buyer asks for a storybook / paper / picture-book look. Prefer PAPERWORLD for a standing pop-up
diorama world, CHARACTER FLOW for realistic everyday acting, PANELVERSE for jokes and twists.

## Workflow — zero-prompt (overrides the general guided flow for this style)
A request like **"Buatkan video STORYBOOK dari naskah / VO ini: …"**, "jadikan buku cerita anak", "dongeng bergambar
tentang …" is the complete brief **and** the go-ahead for setup, direction and the final. Do not recap or stop for
approval — except where step 2 says to (text and voice of a narration you write). Ask only when truly blocked. Talk
friendly Indonesian; say once what you are doing and roughly how long it takes (≈ 15–30 min for a 30–70 s book).

1. **Project.** In a STORYBOOK project (`voynann-kit.json` says `storybook`) continue there. Otherwise
   `node SKILL_DIR/new-project.mjs --kit=storybook` sets one up in the current folder (allowed when it holds only hidden
   files and the buyer's VO / script); if it refuses, `node SKILL_DIR/new-project.mjs storybook-project --kit=storybook`
   and work inside that folder. Then `npm ci`, `npm run check-env`; on a machine's first project also `npm run smoke`
   and look at `out/smoke/_sheet.jpg`.
2. **Story.** Choose the `id` once (a-z 0-9 -) and write `stories/<id>/naskah.txt`
   ([storybook/story-format.md](storybook/story-format.md), [storybook/directing.md](storybook/directing.md)).
   - **Script (+ VO):** keep the buyer's sentences verbatim and in order; split them into pages (1–3 sentences each),
     declare every character once with `TOKOH:`, write each `[HALAMAN]` line from what the sentences show. Copy the VO
     to `stories/<id>/vo.mp3` (or .wav / .m4a). Lines read over the closed cover go under `[SAMPUL]`.
   - **VO only:** with whisper.cpp transcribe it once to read the words; without whisper ask for the text.
   - **Idea only:** write an original 4–8 page story for the age the buyer names (default 4–8 years): short sentences,
     one clear moment per page, a gentle ending. Show the naskah first. Then offer: (a) the buyer records or generates
     the narration — give them `VO-elevenlabs.txt` (all lines in order, numbers as words; for ElevenLabs v3 an expressive
     version with tags like `[softly]`, `[warmly]`, `[curious]`, `[whispers]`, `[pause]`), or (b) a temporary offline
     macOS voice (`--tts`) **only after the buyer approves the text and the voice**. Never add a narrator silently.
3. **Plan.** `node scripts/book-make.mjs <id> --plan` prints every page (place / time, props, who does what) and
   warnings. Edit the naskah until there are no warnings and every page shows what its text says.
4. **Stills.** `node scripts/book-make.mjs <id> --stills <the cover + one moment per page>` → `out/<id>/stills/_sheet.jpg`;
   review with [storybook/qa.md](storybook/qa.md). Fix by editing the naskah. Up to 3 rounds.
5. **Final.** `node scripts/book-make.mjs <id> --final` in the **foreground** with the longest command timeout →
   `out/<id>/<id>_1080x1920_60fps.mp4` (−14 LUFS) + automated checks → `out/<id>/qa/report.json`, `sheet_*.jpg`,
   `REVIEW.md`. Look at every contact-sheet page, fill every REVIEW row, set STATUS. Never call it PASS while a problem
   you saw is unfixed.
   **Landscape (only when the buyer asks; portrait stays the default):** the same naskah and VO with `--wide` on
   every command — `--stills … --wide` → `out/<id>/stills-wide/_sheet.jpg`, `--preview --wide` →
   `<id>_preview_960x540.mp4`, `--final --wide` → `out/<id>/<id>_1920x1080_60fps.mp4` + `out/<id>/qa-wide/`. The film
   shows the open book as a two-page spread (text page left, picture page right); review it with the 16:9 notes in
   [storybook/qa.md](storybook/qa.md). Both formats: finish portrait first.
6. **Deliver.** MP4 path, length, the page list in one line, what was limited and how it was handled, 3 example
   revisions. Revisions = edit the naskah → `--final` again.

## Rules
- Per book write only `stories/<id>/…` (naskah, VO copy, voice texts). Never edit `src/` or `scripts/` for one book.
- The printed text of a page = the narration of that page, word for word. Keep it short; long paragraphs do not fit.
- Original stories and characters only: no copyrighted or brand characters, no real children's likeness. Retelling a
  folk tale is fine (say it is a retelling).
- Child-appropriate: no violence, fear kept gentle, no products.
- Never speed up, trim or re-voice the buyer's VO; pauses are only added between pages.
- Wishes outside [storybook/limits.md](storybook/limits.md) (vehicles, many characters on one page, specific
  buildings, pop-up 3D world): say kindly it is not in this version and offer the closest thing.

## Quality gates
- **QA gate** ([quality-gates.md](quality-gates.md) › QA gate): the make script runs it — after `--preview` as a report (fix every FAIL before the preview is shown), before `--final` as a stop (`--force-qa` only when the user explicitly accepts a known issue), then a hard scan of the delivered file. CHECK strips need an `ok: <why>` verdict in `out/<id>/qa-gate/qa-video.review.json` after you looked at them. Puppets are not tagged (stepped paper poses and stacked pages are by design): the scan of the 3D alone is the check — any blink, pop or shimmer it lists is looked at and fixed (bend clearance, never a visibility toggle on a visible page).
- `--plan` without warnings; every page has text and at least one character or a clear picture.
- Every named character appears on its pages, recognisable (the same look on every page), never cut by the panel edge.
- Books over 30 s use ≥ 2 places or times; no two consecutive pages with the same place, time and action.
- Automated checks all pass and REVIEW.md is filled honestly.

## Hard bans
- Copying the example books (`bintang`, `mimi`) into unrelated films.
- Captions or subtitles over the video (the text lives on the paper).
- Claiming QA passed without running it and looking at every contact-sheet page.
