# NEKAT kit — story.json → recurring duo + one escalating absurd challenge with a counter (toy-clay 3D)

A project of its own (`node SKILL_DIR/new-project.mjs <folder> --kit=nekat`). Remotion 4 + React Three Fiber, Node
≥ 22.18 (the director's `.ts` files run directly in node). Everything is procedural — no image or model assets; the
only files besides code are two OFL fonts (Lilita One for the show graphics, Plus Jakarta Sans).

```
npm ci
npm run check-env
npm run library                                  # sets, tools, backfires, arrivals, endings, curves, cast + card codes
npm run menu                                     # kartu tokoh for the buyer → out/_menu/kartu-tokoh-1|2|3.jpg
node scripts/make.mjs <id> --cast                # this story's duo + creature (validated) → out/<id>/tokoh.jpg
node scripts/make.mjs <id> --save-tokoh darto,oren          # keep them → tokoh/tokoh-<nama>.json (people AND animals)
node scripts/make.mjs <id> --plan                # compile stories/<id>/story.json: parts, flips, shots + warnings
node scripts/make.mjs <id> --stills auto         # one still per shot (after each flip) → out/<id>/stills/_sheet.jpg
node scripts/make.mjs <id> --preview             # 540×960 preview (2× supersampled) + sound + QA gate report
node scripts/make.mjs <id> --final               # QA gate (stops on FAIL / open CHECK) + 1080×1920 @ 60 + delivery scan
```
Flags: `--silent` (no sound), `--no-music`, `--wide` (16:9, only when asked), `--no-qa`, `--force-qa`.
`--stills` renders every requested frame from ONE loaded page (composition `NekatStills`): seconds, not minutes.
Look development: `npx remotion render src/index.ts SetLook out/look --sequence --image-format=jpeg
--props='{"set":"kebun","creature":"ayam-putih"}'` (frames: 0 authored wide, 1 the hero's spot, 2 left, 3 right,
4 high crane, 5 the set filled with 600 creatures).

## The genre grammar (what a film is)
Title question → LEVEL 1…N (each: the hero tries a tool on the creatures → it backfires → the counter jumps with a
×N tag) → peak (close on his face while the crowd keeps growing; one lands on his head) → twist ending + PART card.
A cut every ~1.5–3 s (each level is one shot, or two when the voice makes it long: attempt + result).

- **Sets** (one per film): `gang` (pastel row houses, the hero's house with teras and a low fence, paving street,
  parked motor, pots, jemuran, power pole), `kebun` (farm yard, wooden kandang, hay bales, farmhouse, well, cart,
  bamboo saung, banana + coconut trees, rice terraces), `sekolah` (classroom block with selasar and columns, tiled
  courtyard, benches, trees in planters, flag pole, notice board). `"time": "siang"` (default) or `"sore"` (warm
  late afternoon). The hero always stands at the set's hero spot facing the cameras; the cameras are automatic.
- **Duo**: a person (the hero) + the animal that multiplies (the pest), optionally a second person (the partner:
  watches, laughs, points, shocks, talks). Humans: `bapak, ibu, bocil, kakek, nenek, satpam, pemuda, mbak, pakrt`
  (T1–T9). Animals: `kucing-oren, kucing-hitam, kucing-belang, kucing-abu, ayam-putih, ayam-cokelat, bebek-putih,
  bebek-cokelat, kambing-putih, kambing-cokelat, kambing-hitam` (H1–H11). Every look field can be overridden.
- **Tools** (a level's `"tool"`, 13): `sapu, selang, ember, vacuum, damkar, kipas, jaring, umpan, toa, terompet,
  payung, drone, kardus`. Each has its own choreography, its own default backfire + arrival and its own sound.
  `damkar` is built around its rider: seat height / depth, backrest, foot well, cab length and the steering wheel
  follow the hero's build (any preset or kartu tokoh B1–B5, any bottom: the sarung / rok drapes over the lap and
  shins, trousers show the legs); hands sit on the rim within reach, a wide belly gets a wider wheel, a very wide
  hero a slightly bigger truck. A build with no wheel fit gives a `--plan` warning.
- **Backfire** (`"backfire"`): `multiply` (they just multiply), `dodge` (they dodge before it lands, copies pop up),
  `chase` (the crowd turns on him; he backs off, arms up), `splash` (it bounces back on him: water drips / a puff),
  `stuck` (the tool jams; he tugs while more arrive anyway).
- **Arrival** (`"arrive"`): `pop` (wave of pop-ins with clay puffs), `burst` (fly out of the canister / net / box in
  volleys), `rain` (fall from the sky with a landing squash), `march` (hop in from outside the frame), `climb` (hop up
  onto fences / benches).
- **Counter**: `"counter": { "label": "KUCING", "start": 1, "curve": "escalate" }` — curves `escalate` (×2 ×2 ×4 ×8
  ×8 ×10…), `x2`, `x4`, `x8`, a list of multipliers `[3, 3, 4, 5]`, or `"to"` per level. The number slides (≤ 1 change
  per flip), the ×N tag pops. Drawn creatures: exact up to 40, then logarithmic up to the set's capacity (gang ≈ 760
  cats, kebun ≈ 1000 chickens, kambing ≈ 420) — "1.024" or "8.192" shows a full set.
- **Endings** (`"ending": { "kind" }`): `nap` (he naps on his back on the creature mountain, face up to the camera, Zzz, crane up), `adopt` (sits on a
  chair, the named one on his lap — "dipelihara aja"), `run` (runs off past the camera, the crowd pours after him),
  `cliffhanger` (relief… a GIANT one rises over the roof, he turns: shock), `menyerah` (sits down, they pile round
  him, a white flag goes up). `"part": "PART 2"`, `"next": "BERSAMBUNG…"` on the PART card.
- **Captions**: chunky outlined Lilita lines, one punch word in orange (`*like this*`), a name chip when `"by"` a cast
  member (his mouth moves), long lines wrap to two lines automatically; the hook title shows in 1–3 stacked lines.
  Captions keep off faces by themselves: per line the engine projects the hero's and the partner's heads (and the
  tool's working end in a level) for the whole line and moves the caption + name chip to the nearest free height
  (between the counter/level chips and the platform UI, never over the title or the PART card); if no height is free
  it tilts / slightly widens that shot's camera; still covered → a `--plan` warning naming the line.
- **Sound**: original synth score that escalates each level (a layer more + a semitone up), stop-time hit at the peak,
  an ending mood (lullaby / warm / chase / suspense / falling), tool noises, hops, the counter tick + ×N ding, pop
  waves, small synth creature voices, −14 LUFS / −1.5 dBTP; ducked under a narrator when there is one.

## story.json
```json
{
  "id": "kucing-oren",
  "title": "Bisa gak Pak Darto ngusir Si Oren?",
  "set": "gang",
  "part": 1,
  "series": "darto-oren",
  "cast": {
    "darto": { "preset": "bapak", "name": "Pak Darto" },
    "oren": { "creature": "kucing-oren", "name": "Si Oren" },
    "bu": { "preset": "ibu", "name": "Bu Darto", "look": { "hat": { "kind": "kerudung", "color": "#e8833a" } } }
  },
  "hero": "darto", "pest": "oren", "partner": "bu",
  "counter": { "label": "KUCING", "start": 1, "curve": "escalate" },
  "hook": { "lines": [ { "text": "Pak, kucingnya naik motor lagi!", "by": "bu" } ] },
  "levels": [
    { "tool": "sapu", "to": 2, "lines": [ { "text": "HUSH! SANA!", "by": "darto" }, { "text": "…kok jadi *DUA*?" } ] },
    { "tool": "selang", "backfire": "splash", "lines": [ { "text": "Tiap diusir…" }, { "text": "kucingnya *NAMBAH*." } ] },
    { "tool": "vacuum", "lines": [ { "text": "Sedot semua!", "by": "darto" }, { "text": "Isinya malah *16*." } ] }
  ],
  "peak": { "to": 1024, "lines": [ { "text": "*1.024* ekor." }, { "text": "Yaudah lah…", "by": "darto" } ] },
  "ending": { "kind": "nap", "lines": [ { "text": "Gak bisa ngusir?\nYa udah, *TIDUR*." } ], "part": "PART 1", "next": "BERSAMBUNG…" }
}
```
- **title**: the challenge question (or `["BISA GAK", "PAK RT", "NGUSIR KAMBING?"]` for exact lines). Spoken first
  when there is a narrator (`"hook": { "say": false }` keeps it on screen only).
- **cast**: people have `"preset"`, animals `"creature"`; both take `"look"` overrides, `"name"` (shown on name chips)
  or `"tokoh": "<saved name>"`. `hero` / `pest` / `partner` default to the first person / first animal / second person.
- **levels** (2–6; the genre runs 3–5): `tool`, optional `to`, `backfire`, `arrive`, `label` (chip text), `flip`
  (the word the counter jumps on), `lines` [{ `text`, `by`?, `vo`? }]. **The counter jumps on the starred word** of
  the punch line (`*DUA*`): with a voice exactly on that word, without one at the start of that line. Put the
  character's shout first and the narrator's punch line (with the star) last.
- **peak** (optional, recommended): `to` (default ×8) and lines; without it the film goes straight to the ending.
- **ending**: `kind`, `lines`, `part`, `next`.
- **series**: `"series": "<name>"` saves the end state (counter, set, cast) of part `part` to `series/<name>/state.json`
  on every `--plan`; the next part with `"continue": true` (and `"part": 2`) starts from it — cast, set and counter
  carry over; add or override anything in its own story.json.
- **Voice (optional)**: `stories/<id>/vo.mp3|wav|m4a`, reading every line in order (title first unless `say: false`;
  lines with `"vo": false` stay on screen only). Cut and flip times then come from the words (whisper.cpp); a level
  needs at least one spoken line. Without a voice the captions are paced (≈ 2.3–3 s per level) and music + SFX carry it.

## Writing an episode (when the buyer gives a premise or just a topic)
1. **Judul pertanyaan**: "Bisa gak <tokoh> ngusir / nangkep / ngabisin <hewan>?" — short, the name in the middle.
2. **Aturan tantangan**: one line that says the rule ("Tiap diusir… kucingnya nambah.") in level 1 or 2.
3. **Level 1…N**: an ordinary tool first (sapu, selang), then bigger and sillier (vacuum, kipas raksasa, damkar). Each
   level: a 1–4 word shout by the hero ("HUSH! SANA!", "Sedot semua!") + a narrator punch with ONE starred word that
   says how it backfired ("Isinya malah *16*.", "Malah pada *NGADEM*."). 3–7 words per caption.
4. **Peak**: the absurd number in stars + a tired line by the hero or the partner.
5. **Twist ending**: pick the kind that pays off the premise (nap = gives up; adopt = makes peace; run = flees;
   cliffhanger = something bigger → PART 2; menyerah = white flag). One short last line.
Total 15–30 s without a voice, up to ~45 s with one. Indonesian, everyday, playful; no mean jokes about real groups.

## Your own objects (stories/<id>/props.json — no engine edits)
Dress a set for one story (a gerobak bakso, a scarecrow, a stall, a stack of crates) with simple clay parts:
```json
{ "gerobak": { "about": "gerobak bakso", "at": [4.1, 2.75], "yaw": -8, "footprint": [1.5, 0.85], "height": 1.6, "stand": true,
               "parts": [ { "shape": "box", "size": [1.2, 0.55, 0.62], "pos": [0, 0.68, 0], "color": "#3f86c9" },
                          { "shape": "cyl", "r": 0.22, "h": 0.06, "pos": [-0.35, 0.22, 0.33], "rot": [90, 0, 0], "color": "#2d2a2a" },
                          { "shape": "box", "size": [1.4, 0.05, 0.8], "pos": [0, 1.6, 0], "color": "#e2574c" } ] } }
```
`at` = [x, z] in the set (metres; see the set's hero spot in `--library` / SetLook), `yaw` degrees, `footprint` [w, d]
and `height` = the solid box the crowd keeps out of and the camera sees past; `"stand": true` lets creatures climb onto
its top (the crowd uses it at higher counts). Shapes: `box` {size}, `cyl` {r, h}, `cone` {r, h}, `ball` {r}; `pos` =
the part's centre above the object's ground point, `rot` degrees, flat `color`. `--plan` refuses an object on the
hero's spot / stage, in the vehicle lane or outside the set, and names it. Check it with `--stills auto`.

## Adding things to the kit (new tools, animals, sets — kit changes)
- **A tool** = a data entry in `src/nekat/tools.ts` (label, effect, timing, targets zone, defaults, sound) + a
  choreography function in `src/nekat/acts.ts › ACTS` (hero pose keys in hero-local metres, tool descriptors in world
  space) + a prop component in `src/nekat/kit/props.tsx` drawn by `Film.tsx › ToolView`. Copy the closest existing
  tool (a swing → `sapu`/`jaring`, a spray → `selang`/`ember`, a device → `vacuum`/`kipas`, a held gadget → `toa`).
  Hands are mittens with very short arms (reach ≈ 0.40 m from the shoulder): keep held things within reach and put
  the hand a hand's width (≈ 7 cm) outside a surface it holds; tag only the working end with `<Head>` (handles inside
  the fist are not measured by the QA probe).
- **A creature** = a species in `src/nekat/species.ts` (clay blobs per pose: 0 = rest/stackable, 1 = sitting/standing;
  footprint + stacking height map are computed from the blobs) + presets in `cast.ts › CREATURES` + a HUD badge in
  `kit/Hud.tsx › CreatureBadge`.
- **A set** = `src/nekat/sets/<id>.meta.ts` (hero spot facing +z with ≥ 1.2 m free to each side and 2.7 m in front;
  partner spot; perch for the named creature in the hook — beside / in front of the hero, not behind him; crowd
  ground areas nearest first; `tops` boxes creatures can stand on; ledges; roofs; blockers for the camera; vehicle
  lane free from `laneFrom` to the hero along z = hero.z + 0.75; giant spot behind a roof with `over` = the roof ridge
  point in front of it; bounds; authored wide + top views) + a picture `<Id>.tsx` built from `sets/parts.tsx`,
  registered in `sets/index.ts` and `sets/scenes.tsx`. Check it with `SetLook` frames 0–5 before writing a story.
- **People / animals for one film** never need code: look overrides in the cast entry.

## QA
- `--plan`: no warnings (a warning names the level and what to change: a missing word, a too-short level in the voice,
  a long caption, a caption that cannot get off a face, a shot where the hero is not clearly visible).
- `--stills auto` (seconds): open the sheet; every level shows the hero, the tool in his hands and the new arrivals;
  faces readable; no caption or name chip over a face (the engine moves them; check anyway); nothing through anything.
- QA gate (after `--preview`, before `--final`): TEMBUS (hero / partner × tool heads × truck / fan / chair × crowd),
  one-frame jumps (LONCAT), blinks of tagged solids (KEDIP), camera snaps, a clean-frame scan of the 3D alone. The
  probe runs in one render tab. CHECK strips need `"ok: <why>"` in `out/<id>/qa-gate/qa-video.review.json`: creature
  pop-ins / rain-ins / bursts, dust puffs, sound rings and water drops are designed; anything else is a bug.

## Limits of this version
- Three sets; another place needs a new set (≈ 45–90 min) or a story set in an existing one.
- One animal species multiplies per film (one pest look; copies vary slightly in tint). Two humans on screen at most.
- Hero choreography is per tool; the hero stands at his spot (or rides the truck). No walking around the set, no
  fights, no swimming; the run ending is a short dash past the camera.
- The set fills at a few hundred to ~1000 drawn creatures; bigger numbers show the full set (the counter says it).
- No lip-sync (a mouth flap on his lines). Captions are whole lines (the genre style), not word-by-word.
- Portrait 9:16 by default, 16:9 with `--wide`. Tested on macOS Apple Silicon (GPU). Render times on an M-series Mac:
  stills ≈ 5–10 s per sheet, preview + QA gate ≈ 1 min per 20 s of film, final (gate + 1080×1920 @ 60 + scan) ≈ 75 s
  for a 23 s episode.
