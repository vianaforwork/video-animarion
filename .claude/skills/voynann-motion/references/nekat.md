# NEKAT — recurring duo + one escalating absurd challenge with a counter (toy-clay 3D)

**In this package:** the NEKAT project in `kits/nekat/project/`:
- **Director:** a `story.json` (a challenge question, 2–6 tool levels, a peak, a twist ending) becomes the film: the
  counter jumps on the punch word, each level's tool has its own choreography, the creatures backfire (multiply,
  dodge, chase, splash, stuck) and arrive (pop, burst, rain, march, climb), the crowd fills the set without passing
  through anything, an **automatic camera per shot** frames the hero, the tool and the new arrivals. With a narrator
  VO the cuts and flips follow the words (whisper.cpp); without one the captions are paced and music + SFX carry it.
- **Look:** soft matte "toy clay" 3D — chunky people with big heads and mitten hands, round toy animals by the
  hundred — in pastel Indonesian places (gang rumah, kebun + kandang, halaman sekolah), our own challenge-show
  graphics: a sticker counter with a ×N tag, a LEVEL chip with the tool's name, outlined captions with one orange
  punch word and a name chip, a PART card.
- **Series:** the duo is saved as tokoh files and each part's end state (counter, set, cast) in
  `series/<name>/state.json`; part n+1 continues from it.
- **Sound:** original synth score that escalates level by level + SFX from the plan, −14 LUFS.
- **QA gate** ([quality-gates.md](quality-gates.md) › QA gate): run by the make script — after `--preview` as a report,
  before `--final` as a stop, then a scan of the delivered file. People, tool heads, the truck / fan / chair and the
  crowd are tagged already.

Kit details, the full `story.json` format, how to add tools, animals and sets: `kits/nekat/KIT.md`.

## Identity
The trending short-form "challenge series": the SAME two characters every episode, one premise that escalates
("tiap diusir… malah nambah"), an on-screen counter and level, increasingly absurd tools, a twist or a PART
cliffhanger. Fast (a cut every ~2 s), bright, physical comedy, no lecture. 15–30 s without a voice, up to ~45 s with one.

Choose NEKAT for **a recurring character vs. a multiplying animal / a rule that gets worse every try**: "Bisa gak
Pak Darto ngusir Si Oren?", "kakek nangkep ayam tapi tiap ditangkep netes", "satpam ngusir bebek dari sekolah",
"Pak RT vs kambing", "video tantangan bersambung part 1/2/3", "makin diusir makin banyak", or any "counter + level +
part" comedy series. Prefer CERDIK when the story is a clever trick proven right (one narrator, science / history
payoff), CHARACTER FLOW for relatable everyday feelings acted by realistic characters without a challenge,
VOXELVERSE / MOGRAPH MABAR for game-world looks, STORYBOOK for children's tales.

## Workflow — zero-prompt (overrides the general guided flow for this style)
A request like **"Buatkan video NEKAT: Bisa gak Pak Darto ngusir kucing oren?"**, "video tantangan tiap diusir malah
nambah tentang …", "bikin part 2-nya" or a premise with a VO is the complete brief **and** the go-ahead for setup,
direction and the final. Do not recap or stop for approval. Ask only when truly blocked.
Talk friendly Indonesian; say once what you are doing and roughly how long it takes (≈ 15–30 min).

1. **Project.** In a NEKAT project (`voynann-kit.json` says `nekat`) continue there. Otherwise
   `node SKILL_DIR/new-project.mjs --kit=nekat` in the current folder (allowed when it holds only hidden files and the
   buyer's VO / script); if it refuses, `node SKILL_DIR/new-project.mjs nekat-project --kit=nekat` and work inside
   that folder. Then `npm ci`, `npm run check-env`; on a machine's first project also `npm run smoke` and look at
   `out/kucing-oren/stills/_sheet.jpg`.
2. **Episode.** Choose the `id` once (a-z 0-9 -). `npm run library`.
   - **Premise / topic only:** write the episode with `KIT.md` › Writing an episode (title question, 3–5 levels with a
     shout + a starred punch line each, peak, twist ending) and build it straight away — no approval stop (the film is
     wordless by default: captions + music + SFX, so nothing has to be recorded first). At delivery show the lines
     and the cast card; offer a VO text for ElevenLabs v3 only if they want a narrator.
   - **Script given:** keep the buyer's lines verbatim and in order (title, then per level, peak, ending).
   - **VO given:** transcribe it with whisper.cpp, split it into the episode's lines (keep the words exactly), copy it
     to `stories/<id>/vo.mp3`. Every level needs at least one spoken line; mark on-screen-only lines `"vo": false`.
   - **Part 2+ of a series:** `"series": "<name>", "continue": true, "part": n` — the duo, set and counter carry over
     from the saved state; write only what is new.
3. **Set, cast, tools.** Pick the set that fits (gang / kebun / sekolah); a missing object the topic needs (a
   gerobak, a stall, a scarecrow) goes in `stories/<id>/props.json` (KIT.md › Your own objects). **Cast:** when the buyer described people,
   named card codes, saved tokoh or sent `tokoh-*.json`, build exactly those (see Tokoh); otherwise pick a person
   preset + an animal preset and recolour them so the duo is recognisable. Pick tools that escalate (ordinary →
   absurd), vary the backfires (at least two different ones) and end on the biggest tool.
4. **Story.** Write `stories/<id>/story.json` (KIT.md format). The counter jumps on the starred word — put it on the
   payoff word of the punch line. `node scripts/make.mjs <id> --plan` until there are **no warnings**.
5. **Stills.** `node scripts/make.mjs <id> --stills auto` → `out/<id>/stills/_sheet.jpg` (all stills from one page,
   taken just after each flip). Look at every frame: the hero and his tool clear, the arrivals visible, faces readable,
   no caption over a face (the engine moves captions off heads itself; a plan warning says when it can't), nothing
   through anything. Fix in the story (tool, backfire, arrive, line timing, set) — up to 3 rounds.
6. **Preview + QA.** `node scripts/make.mjs <id> --preview` in the **foreground** with the longest command timeout.
   Open the QA images; fix every FAIL; write verdicts for designed CHECKs (creature pop-ins / rain / bursts, puffs).
7. **Final.** `node scripts/make.mjs <id> --final` in the foreground (1080×1920 @ 60, sound at −14 LUFS).
8. **Deliver.** MP4 path, length, one line on the episode, what was limited, 3 example revisions (another tool, a
   different backfire, part 2). Show `out/<id>/tokoh.jpg` (run `--cast` if missing) with one line: the duo can be
   changed or saved for the series — "ketik *kartu tokoh* untuk lihat pilihannya". When the story has `"series"`,
   say that part 2 can continue from this episode's end.

## Tokoh — the buyer's characters (choose, change, save)
Buyers never touch code: they describe people and animals in plain words or with the codes on the **kartu tokoh**, and
you write the matching `look` fields. `npm run library` prints every code with the field it sets.
- **Kartu tokoh:** `npm run menu` → `out/_menu/kartu-tokoh-1.jpg` (people T1–T9, animals H1–H11), `-2.jpg` (hair
  R1–R6, head covers K1–K5, face F1–F6), `-3.jpg` (body B1–B5, tops A1–A4, bottoms S1–S4, colours W1–W16, skin
  KL1–KL4). Show all three when the buyer asks to see the choices ("kartu tokoh", "pilihan tokoh", "tokohnya bisa apa
  aja?") and wait for their picks. Never send them unasked in the middle of the zero-prompt flow.
- **Translate words and codes:** "T3" → `"preset": "bocil"`; "H6" → `"creature": "ayam-cokelat"`; "rambut R5 cokelat"
  → `"hair": { "style": "long", "color": "#8a5a3a" }`; "kerudung W2" → `"hat": { "kind": "kerudung", "color":
  "#e8833a" }`; "kumis, kacamata" → `"face": { "moustache": true, "glasses": true }`; "gendut" → B4 `"build": {
  "belly": 1.3 }`; "kaos W7 belang putih" → `"top": { "kind": "kaos", "color": "#3a7bd5", "color2": "#f6f3ea",
  "stripes": true }`; "sarung marun" → `"bottom": { "kind": "sarung", "color": "#a3262e" }`; "kulit KL2" → `"skin":
  "#dcaa80"`; "kucing abu polos" → `"creature": "kucing-abu", "look": { "pattern": "plain" }`. A colour not on the card
  → a flat hex close to it. Something the kit cannot make (a dog, a cow, a robot, long dresses other than daster/rok,
  a real person's face) → say so in one line and offer the nearest option; never edit the kit for one film.
- **Check:** `node scripts/make.mjs <id> --cast` → `out/<id>/tokoh.jpg` (full body + face of each person, the animal
  sitting and resting, with names). It validates every look and names the wrong field. After a cast change show it.
- **Save for a series** (the duo recurs — offer it after the first episode): `node scripts/make.mjs <id> --save-tokoh
  darto,oren` → `tokoh/tokoh-pak-darto.json`, `tokoh/tokoh-si-oren.json` (names from `"name"`; one id with `--nama
  "…"` renames). Next films use `"cast": { "darto": { "tokoh": "pak-darto" }, "oren": { "tokoh": "si-oren" } }` —
  plus `"look"` on top for an outfit change. Tell the buyer where the files are; in another project they copy them
  into `tokoh/`. When the buyer attaches `tokoh-*.json`, copy it into `tokoh/` and use it.

## Landscape 16:9 (only when asked)
Portrait 9:16 is the default: never switch on your own. When the buyer asks for landscape / 16:9 / "versi YouTube",
add `--wide` to the same commands (or `"format": "landscape"`): stills in `stills-wide/`, preview
`<id>_preview_960x540.mp4`, final `<id>_1920x1080_60fps.mp4`. The cameras refit for the wide frame, the counter and
level chip move to the top-left; check the wide stills like the portrait ones.

## Rules
- Per film write `stories/<id>/…` only. Do not change the director (`src/nekat/compile.ts`, `acts.ts`, `camera.ts`,
  `Film.tsx`), the cast kit or the scripts for one film; a real engine limit → work around it in the story (another
  tool, set or ending) and say what is limited. A new tool / animal / set is a kit change (KIT.md › Adding things):
  only when the buyer asks for it and it fits the time.
- Never speed up, trim or re-voice the buyer's VO; the lines must match its words and order.
- Original only: no channel's name, mascot, characters, catchphrases, title art, intro / outro or exact jokes; no real
  people, politicians, parties, brands, logos or real plates. The kit's cast, sets, Lilita / Plus Jakarta type and
  show graphics are what you use.
- Animals are cartoon toys: no cruelty played for laughs (tools scare, sweep, spray, catch and release — nobody hurt).

## Limits of this version
- Three sets (gang, kebun, sekolah); another place needs a new set or the story moved to one of these.
- One multiplying species per film (cats, chickens, ducks or goats, with colour variants); two people on screen.
- 13 tools with fixed choreographies; the hero stays at his spot (or rides the mini fire truck, fitted to any
  build); no walking around, no fights; the run ending is a dash past the camera.
- The set fills at a few hundred to ~1000 drawn creatures; bigger counters show the full set.
- Mouth flap on spoken lines, no lip-sync; captions are whole lines.
- Portrait 9:16 by default, 16:9 with `--wide`. No square or 4:5. Tested on macOS Apple Silicon.

## Quality gates
- `--plan` without warnings; `--stills auto` sheet opened and every shot checked.
- 3–5 levels, each with a visible tool, a backfire and a counter jump on the starred word; at least two different
  backfires; the biggest tool last; a peak and a twist ending; PART card on the last beat.
- No interpenetration, no pops, no flicker (counter ≤ 1 change per flip with a slide); QA gate PASS with every CHECK
  given a verdict.

## Hard bans
- Copying any existing channel's identity: name, handle, logo, characters, catchphrase, intro / outro, scripts or shot
  lists (the genre grammar is free; their characters and jokes are not).
- Real people's likeness, real politicians / parties / brands, deepfake-style footballers or celebrities.
- Copying the example stories (`kucing-oren`, `kucing-oren-2`, `ayam-kebun`, `bebek-sekolah`, `kambing-gang`) into
  unrelated films.
- Claiming QA passed without opening the stills sheet and the QA images.
