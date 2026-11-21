# TIPIKAL — "Tipe-tipe …" relatable 3D comedy sketches

**In this package:** the TIPIKAL project in `kits/tipikal/project/`:
- **Director:** a `story.json` (a header + 3–5 types, each a short vignette) becomes the film: people placed at named
  places in a set, actions, expressions, walking around furniture, riding motorbikes / bikes / cars, held props,
  crowds, pops ("?", "!", speech bubbles, comic sound words, labels, stamps), freezes, time of day, traffic light;
  an **automatic camera per shot** that checks lines of sight and keeps faces clear of the labels.
- **Look:** chunky toon people with drawn cartoon faces (21 expressions, blinks, a talking mouth), real fingers, ink
  outlines, flat saturated colours — in 6 detailed Indonesian sets: jalan raya + lampu merah, gang + warung, ruang
  kelas, kantor, tenda kondangan, rumah (ruang tamu + makan). A persistent header, a numbered type card that slams in
  per type, themed per set (road-sign green, notebook, office tab, wedding maroon + gold, warm home, shop sign), and
  the closing "Kamu tipe yang mana?".
- **Sound:** original synth groove + a SFX for every pop, cut, engine, brake, fall and cheer; ducked under a voice
  when there is one; −14 LUFS.
- **QA gate** ([quality-gates.md](quality-gates.md) › QA gate): the make script runs it — after `--preview` as a report,
  before `--final` as a stop, then a scan of the delivered file. People, seats, desks, vehicles and held props are
  tagged already.

Kit details, the full `story.json` format, how to add props and sets: `kits/tipikal/KIT.md`.

## Identity
The "tipe-tipe orang …" genre of relatable comedy shorts: a topic everybody knows (riding a motorbike, an exam, a
wedding, the office, breaking the fast) split into 3–5 **types**, each a 3–6 s vignette — the numbered card ("Yang
ngerem pakai *sandal*"), the person doing it, then the punchline: somebody's reaction face, a "?" pop, a comic sound
word, a freeze with a label. Wordless by default: cards, faces, pops, sound effects and a bouncy groove carry it; the
last frame asks "Kamu tipe yang mana?" so viewers tag themselves in the comments.

Choose TIPIKAL for **a list of recognisable types of people in one everyday situation**: "tipe-tipe pengendara
motor", "jenis-jenis murid pas ujian", "macam-macam tamu kondangan", "tipe orang kantor pas gajian", "orang Indonesia
kalau buka puasa", "kamu tipe yang mana?". Prefer CHARACTER FLOW when a voice-over tells ONE relatable feeling or
inner monologue (no list of types), PANELVERSE for a joke told in comic beats ("ekspektasi vs realita", "pernah
ga…"), CERDIK for a clever trick that is mocked and then proven right, NEKAT for an escalating challenge (one person
vs more and more animals), NEGERI for the daily "build a country" serial.

## Workflow — zero-prompt (overrides the general guided flow for this style)
A request like **"Buatkan video TIPIKAL tentang tipe-tipe pengendara motor"**, "video tipe-tipe orang di kondangan",
"jenis-jenis murid pas ujian" — with or without the buyer's own types, script or VO — is the complete brief **and**
the go-ahead for setup, direction and the final. Do not recap or stop for approval; ask only when truly blocked.
Talk friendly Indonesian; say once what you are doing and roughly how long it takes (≈ 15–25 min when a set fits,
+ 30–60 min when the topic needs a new set).

1. **Project.** In a TIPIKAL project (`voynann-kit.json` says `tipikal`) continue there. Otherwise
   `node SKILL_DIR/new-project.mjs --kit=tipikal` sets one up in the current folder (allowed when it holds only
   hidden files and the buyer's VO / script); if it refuses, `node SKILL_DIR/new-project.mjs tipikal-project
   --kit=tipikal` and work inside that folder. Then `npm ci`, `npm run check-env`; on a machine's first project also
   `npm run smoke` and look at `out/motor/stills/_sheet.jpg`.
2. **Types.** Choose the `id` once (a-z 0-9 -).
   - **Buyer's types:** keep their wording and order; tidy a card over ~45 letters to its punchline (say so in one
     line at delivery).
   - **Topic only:** write 3–5 types with ONE visual gag each (KIT.md › Writing the types), funniest last. No
     approval stop — list them at delivery and offer swaps. **No narrator** (the genre works without one); never
     add a synthetic voice.
   - **VO:** copy it to `stories/<id>/vo.mp3` (or .wav / .m4a). The recording must contain one line per type in
     order (+ optional intro / outro lines): put each spoken line in the type's `"say"` (and `intro.say` /
     `outro.say`) exactly as spoken; whisper.cpp times the cards to it. Without whisper ask for the text.
3. **Set, cast, props.** `npm run library`. Pick the set whose places fit (a type may use another set with `"set"`;
   a missing place → a new set, KIT.md › Adding a set, checked with `SetLook`). **Cast:** when the buyer described
   people, named card codes or saved tokoh, or sent `tokoh-*.json`, build exactly those (see Tokoh); otherwise pick
   presets and recolour them so every type's star is recognisable. Own objects in `stories/<id>/props.json`.
4. **Story.** Write `stories/<id>/story.json`: header, per type who is where, what they do and feel, 2–4 beats
   (setup → action → punchline: a reaction shot of someone else, a pop, a `freeze` with a `tag` or `stamp`, a sound),
   vehicles that drive (`go`, `pass` for traffic), extras for a full room. `node scripts/make.mjs <id> --plan` until
   there are **no warnings**.
5. **Stills.** `node scripts/make.mjs <id> --stills auto` → `out/<id>/stills/_sheet.jpg` (one page: seconds). Look
   at every frame: the subject clear and not hidden, faces readable and not under the header / card / outro, the
   right expression, props in hands and on tables, riders on their seats, nothing through anything. Fix in the story
   (shot, `on`, `side`, places, timing). Up to 3 rounds.
6. **Preview + QA.** `node scripts/make.mjs <id> --preview` in the **foreground** with the longest command timeout.
   Open the QA images; fix every FAIL; write verdicts for designed CHECKs (blinks, fast designed gestures).
7. **Final.** `node scripts/make.mjs <id> --final` in the foreground (1080×1920 @ 60, sound at −14 LUFS).
8. **Deliver.** MP4 path, length, the types in one line each, what was limited and how it was handled, 3 example
   revisions (swap a type, add a type, change who plays it). Show `out/<id>/tokoh.jpg` (run `--cast` if missing) with
   one line: the people can be changed or saved for a series — "ketik *kartu tokoh* untuk lihat pilihannya".
   Revisions = edit `story.json` → `--final` again (a cast change: `--cast` to show it first).

## Tokoh — the buyer's characters (choose, change, save)
Buyers never touch code: they describe people in plain words or with the codes on the **kartu tokoh**, and you write
the matching `look` fields. `npm run library` prints every code with the field it sets.
- **Kartu tokoh:** `npm run menu` → `out/_menu/kartu-tokoh-1.jpg` (ready characters T1–T17), `-2.jpg` (hair R1–R11,
  head covers K1–K7), `-3.jpg` (tops A1–A6, bottoms C1–C4, footwear D1–D3, face F1–F7, body B1–B5, skin S1–S5,
  colours W1–W16, extras: tie, vest, apron, ID lanyard, reflective band, backpack, towel). Show all three when the
  buyer asks to see the choices ("kartu tokoh", "pilihan tokoh", "mau ganti tokoh") and wait for their picks. Never
  send them unasked in the middle of the zero-prompt flow.
- **Translate words and codes:** "T10" → `"preset": "kurir"`; "rambut R8 cokelat" → `"hair": { "style": "ponytail",
  "color": "#8a5a3a" }`; "helm K2 W1" → `"hat": { "kind": "helmet", "color": "#d63b30" }`; "kerudung W4" → `"hat":
  { "kind": "kerudung", "color": "#3fa45b" }`; "jaket W8" → `"top": { "kind": "jacket", "color": "#2c3e63" }`;
  "rok panjang" → `"bottom": { "kind": "long-skirt" }`; "kacamata, kumis" → `"face": { "glasses": true, "mustache":
  true }`; "gendut" → B5 `build`; "pakai ransel merah" → `"bag": "#d63b30"`; "tanpa helm" → `"hat": { "kind": "none" }`.
  A colour not on the card → a flat hex close to it. Vehicles take `color` / `color2` the same way. Something the
  kit cannot make (a cat, a costume, a hijab style other than kerudung, a real person's face, a brand jacket) → say
  so in one line and offer the nearest card option; never edit `src/kits/tipikal/` for it.
- **Check:** `node scripts/make.mjs <id> --cast` → `out/<id>/tokoh.jpg` (full body + face of every person, with
  names); it also validates every look and names the wrong field. After a cast change show this card first.
- **Save for a series:** "simpan tokoh ini" → `node scripts/make.mjs <id> --save-tokoh dodi --nama "Mas Dodi"` →
  `tokoh/tokoh-mas-dodi.json` (several: `--save-tokoh dodi,rina`, names from `"name"`). Next films:
  `"cast": { "dodi": { "tokoh": "mas-dodi" } }` (+ `"look"` on top for one film's outfit). Tell the buyer where the
  file is; in another project they copy it into `tokoh/`. A buyer's attached `tokoh-*.json` goes into `tokoh/`.
- Keep a film's people distinct (different main colours); a series keeps the same saved tokoh.

## Landscape 16:9 (only when asked)
Portrait 9:16 is the default: never switch on your own. When the buyer asks for landscape / 16:9 / "versi YouTube",
add `--wide` to the same commands (or `"format": "landscape"` in story.json): stills in `stills-wide/`, preview
`<id>_preview_960x540.mp4`, final `<id>_1920x1080_60fps.mp4`. Labels and the camera re-fit the wide frame; check
the wide stills like the portrait ones.

## Rules
- Per film write `stories/<id>/…` and, when needed, a new set pair under `src/tipikal/sets/`. Do not change the
  director (`src/tipikal/compile.ts`, `camera.ts`, `Film.tsx`), the character kit (`src/kits/tipikal/`) or the
  scripts for one film; a real engine limit → work around it in the story and say what is limited.
- The joke is the habit, never the person: no mocking religion, ethnicity, disability, bodies, poverty; no real
  people, politicians, parties, brands, shop names, ride-hailing liveries or real plate numbers (plates are made-up
  text like "TPK 04").
- Never speed up, trim or re-voice the buyer's VO; `say` lines must match its words and order.
- Original only: no channel's name, mascot, catchphrase, character designs, card design, intro / outro or exact
  jokes. Use the kit's own cast, sets and label themes and the buyer's own topic.

## Limits of this version
- Six sets (jalan, gang, kelas, kantor, kondangan, rumah); other places need a new set written for the story.
- No lip-sync (mouth flap with bubbles / `says`); one held object per hand; no physics (a fall is a pose, nothing
  spills or breaks); people touch only in `salam`; no animals, chases or fights; angkot passengers
  not visible; long skirts become separate leg drapes when seated or riding; speed bump only in `gang`.
- Portrait 9:16 by default; 16:9 with `--wide`. No square or 4:5. Tested on macOS Apple Silicon.

## Quality gates
- `--plan` without warnings; `--stills auto` sheet opened and every shot checked.
- Every type: card → action → a punchline the eye gets without sound (reaction face, pop, freeze + label); 2–4 cuts
  per type, no shot under 0.6 s; at least four shot kinds in the film.
- Faces never under the header, type card or outro card; card text ≤ ~45 letters, header ≤ ~28.
- No interpenetration, no pops, no flicker; QA gate PASS with every CHECK given a verdict.

## Hard bans
- Copying any existing channel's look identity: name, handle, logo, characters, catchphrase, card design, intro /
  outro, its jokes or shot lists. TIPIKAL's cast, sets, label themes and fonts (Baloo 2, Barlow Condensed) are what
  you use.
- A synthetic narrator in a delivered film; real brands, liveries, plates, people or politicians on screen.
- Copying the example stories (`motor`, `ujian`, `kondangan`, `bukapuasa`, `kantor`) into a buyer's film on the
  same topic without changing the types and cast — write the buyer's own.
- Claiming QA passed without opening the stills sheet and the QA images.
