# CERDIK kit — story.json → round-head stick-figure story short in a rich 3D world

A project of its own (`node SKILL_DIR/new-project.mjs <folder> --kit=cerdik`). Remotion 4 + React Three Fiber, Node
≥ 22.18 (the director's `.ts` files run directly in node). Everything is procedural — no image or model assets.

```
npm ci
npm run check-env
npm run library                                  # worlds + places, cast, props, actions, expressions, shots, effects + card codes
npm run menu                                     # kartu tokoh for the buyer → out/_menu/kartu-tokoh-1|2|3.jpg
node scripts/make.mjs <id> --cast                # this story's people (body + face, validated) → out/<id>/tokoh.jpg
node scripts/make.mjs <id> --save-tokoh bu --nama "Bu Sari"   # keep a person → tokoh/tokoh-bu-sari.json
node scripts/make.mjs <id> --plan                # compile stories/<id>/story.json: shot list + warnings
node scripts/make.mjs <id> --stills auto         # one still per shot → out/<id>/stills/_sheet.jpg
node scripts/make.mjs <id> --preview             # 540×960 preview (2× supersampled) + sound + QA gate report
node scripts/make.mjs <id> --final               # QA gate (stops on FAIL) + 1080×1920 @ 60 + delivery scan
```
Flags: `--silent` (no sound), `--no-music`, `--wide` (16:9, only when asked), `--no-qa`, `--force-qa`.
`--stills` renders every requested frame from ONE loaded page (composition `CerdikStills`), so even a heavy world
takes seconds: images in `out/<id>/stills/` named `f<frame>-shot<n>.jpg`, sheet `_sheet.jpg` (4 per row, in shot
order). Never render stills one page per frame (each page rebuilds every procedural texture).
Look development, the same way (one page): `npx remotion render src/index.ts CastSheet out/cast --sequence
--image-format=jpeg` (every cast preset), and `npx remotion render src/index.ts WorldLook out/w --sequence
--image-format=jpeg --frames=0-15 --props=world.json` with `world.json` = `{"world":"pantai"}` (frames 0–1 establish,
2–3 aerial, 4… one view per place in `--library` order).

## What a film is made of
- **World** (one per film): `desa` (Nias-style stilt-house village, stone street), `pasar` (market street, stalls,
  shophouses, mosque), `pantai` (fishing beach, sea, boats, pier, huts), `ruang` (inside a family home), `istana`
  (Javanese palace pendopo, throne, gamelan, courtyard, gate). Each has named **places** (spots) — `npm run library`.
- **Cast**: presets (tukang, kades, saingan, pedagang, ibu, pemudi, pemuda, anak, kakek, nenek, petani, nelayan,
  ilmuwan, raja, prajurit, priyayi, warga, warga2 = card codes T1–T18) with any look override (costume colours, hat,
  hair, face, build), or a saved character: `"bu": { "tokoh": "bu-sari" }` reads `tokoh/tokoh-bu-sari.json` (its own
  `"look"` merges on top). Look fields are validated (`--plan`, `--cast`): `costume` {base, vest, collar, belt,
  buttons, sash, hem, scarf, trim, stripes: hex; long: bool}, `hair` {color, style: none|tuft|cap|side|bald-ring|bun|
  neat}, `face` {brows: thin|thick|bushy, mustache, beard, glasses, lashes, blush: bool, ink}, `hat` {kind: none|
  headband|peci|crown|caping|kerudung|topi|blangkon, color, color2}, `build` {s 0.6–1.2, wide/deep 0.8–1.6, head
  0.8–1.3}, `necklace`, `towel` (hex).
- **Props**: a library of objects built from simple parts (kendi, toples, gelas, ember, meja, peti, karung,
  keranjang, buah, semangka, pisang, es, lampu, koin, kursi, payung, tiang, kipas, batu-kali, rangka-batu,
  rangka-silang, rangka-tanam) + your own in `stories/<id>/props.json`.
- **Actions** (`do`): stand, akimbo, crossed, peer, laugh, mock, point, present, talk, shock, think, shrug, cheer,
  wave, angry, sad, hot, wipe, drink, nod, shake, squat, hold, offer, queue, sit, sit-talk, bow, walk.
- **Expressions** (`expr`): neutral, smug, happy, laugh, angry, surprised, worried, proud, sly, scared. Faces swap like
  a 2D cartoon; eyes blink; quoted words move the speaker's mouth; `flush` turns the head red (`flushColor` for
  purple anger etc.).
- **Shots**: establish / aerial (the world's authored move), wide, medium, close, reaction, low (hero), ots (`over`),
  insert (a prop), cutaway (a vessel cut open — liquid inside shows), top, ground. **The camera is automatic**: for
  each shot it tries many angles and distances, rejects any where a wall, a stall, a post or another person hides
  the subject, fits a group into the narrow 9:16 frame, prefers faces toward the lens, depth behind the subject and
  a different angle from the previous shot. `side` nudges it; `move` = push (default) / pull / still / orbit / rise /
  track.
- **Effects** (`fx`): glow (the genre's highlight on the thing that matters), sweat (water beads on a vessel),
  vapor, steam, sparkle, chill (cold blue glow + frost), heat (hot-air lines), dust, cut (open a vessel).
- **Time of day**: day, gold, hot (scorching dry season), night (lamps glow), dawn. It carries on to later lines.
- **Weather** (`weather`): `rain` — grey sky (dark blue-grey at night), falling rain that stops on awnings, roofs
  and tables (people under a shelter stay dry), ripples on the ground, a rain hiss under the music — until a later
  line says `clear`. Works with any time of day. Indoor worlds (`ruang`) get the grey light and the sound only.
- **Crowds** (`extras`): n people at a place — idle, queue (a line along the stall front), laugh, cheer, watch, hot
  — from a word until a word.
- **Captions**: one or two words at a time, white heavy type with a dark outline, swapped on the spoken word.
- **Sound**: original synth score (pizzicato, marimba, pad, shaker; thinner in hot / night shots, a landing chord)
  + SFX from the plan (cuts, dissolves, glow ding, sparkles, sizzle, frost, heat drone, rain), ducked under the voice,
  −14 LUFS / −1.5 dBTP.

## story.json
```json
{
  "id": "kendi", "title": "Kendi yang Diketawain", "world": "pasar", "time": "day",
  "cast": { "bu": { "preset": "ibu", "look": { "hat": { "kind": "kerudung", "color": "#e8833a" } } }, "saingan": { "preset": "saingan" } },
  "props": { "kendi1": { "kind": "kendi", "at": "lapak-a", "on": "surface" },
             "toples1": { "kind": "toples", "at": { "at": "lapak-b", "side": -0.5 }, "on": "surface", "fill": { "color": "#f2a54a", "level": 0.7 } } },
  "extras": [{ "at": "lapak-a-depan", "n": 6, "mode": "queue", "from": "antreannya" }],
  "lines": [
    { "text": "Dia jualan es teh, tapi airnya nggak disimpan di toples kaca.",
      "cast": { "bu": { "at": "lapak-a", "do": "present", "expr": "happy" }, "saingan": { "at": "lapak-b", "do": "crossed", "expr": "sly" } },
      "beats": [ { "shot": "establish" },
                 { "at": "tapi", "shot": "medium", "on": "bu" },
                 { "at": "toples", "shot": "insert", "on": "toples1", "fx": [{ "kind": "sparkle", "on": "toples1" }] } ] },
    { "text": "Kendinya malah diketawain. \"Kendimu bocor tuh!\"",
      "cast": { "saingan": { "do": "mock", "to": "kendi1", "expr": "laugh", "flush": 0.5, "says": true } },
      "shot": "close", "on": "saingan" }
  ]
}
```
- **lines**: one sentence of the voice-over each, verbatim, in order. A line is one shot, or several with `beats`:
  the first beat starts with the line, every next beat has `"at": "<word>"` (`"kata#2"` = its 2nd occurrence) — the
  cut lands on that word. A long line without beats is cut automatically every ~2.3 s (the genre cuts every
  1.5–2.5 s; aim for that).
- **beat / line fields**: `shot`, `on` (person or prop id, or a list for a group), `over` (ots), `move`, `side`,
  `cast`, `props`, `fx`, `time`, `weather` (`rain` / `clear`; also top level), `dissolve` (cross-dissolve in — use
  for time jumps: "paginya", "lalu kemarau", "lalu hujan turun").
- **cast entry in a beat**: `at` (place name, or `{ "at", "side", "ahead" }` metres in the place's own frame: side =
  to its right), `walk: true` (walk there during the beat), `face` ("front" | a person / prop id | degrees), `do`,
  `to` (target of point / mock: person, prop or place), `expr`, `flush` 0–1, `flushColor`, `hold` (prop id; `""`
  lets go), `says: true` (speaks the quoted words of this line), `gone: true`, `then: [{ "at": "<word>", "do"?,
  "expr"?, "flush"? }]` (change on a word inside the beat). State carries on: write only what changes.
- **props**: `kind`, `at` + `on: "surface"` (stands on the place's table / counter; places marked `[table]` in the
  library) or the ground, `yaw` (deg), `scale`, `fill` (`color`, `level` 0–1 for vessels), `gone`. A held prop
  follows the hands.
- **fx**: `{ "kind", "on": "<prop or person>", "at"?: word | seconds, "until"?: word | seconds | "end", "color"?,
  "amount"? }` — default window = the beat. `cut` opens a vessel (shot it with `"shot": "cutaway"`); `glow` and
  `chill` light the prop's outline; `sweat`, `vapor`, `steam` keep running until `until`.
- **extras**: `{ "at", "n", "mode", "from"?, "until"? }`; they join at the start of the shot their word falls in.

## Writing the script (when the buyer gives only a topic)
The genre's engine is **"diketawain dulu, terbukti benar"** — a clever trick everyone mocks until reality proves it:
1. **Aksi aneh** (the very first words): someone does something that looks wrong. "Dia bikin rumah, tapi tiangnya
   nggak ditanam."
2. **Taruhan**: what is at stake (a contest, a market, a kingdom, a season).
3. **Diketawain**: a vivid mocking reaction, often a short quote ("Ditendang kambing juga geser itu!").
4. **Lawan kelihatan benar**: the "normal" way wins for a while; the hero keeps going.
5. **Titik balik**: conditions change (summer, an earthquake, a drought, night).
6. **Payoff di kalimat terakhir**: the trick pays off — end right there, no lecture; the last line can loop into the
   first. Never name the science term; show it (a cutaway, a glow, beads of sweat, steam).
Present tense, one narrator, 8–14 sentences, 6–16 words each, 35–65 s. Concrete sensory details and numbers
("selebar jari", "muat koin", "sehangat teh baru diseduh"). Real science / history only: check facts you are not sure
of; characters may be fictional. Hand the buyer a voice text for ElevenLabs v3 with light tags (`[storytelling]`,
`[amused]`, `[tense]`, `[calm]`, `[soft]`).

## Your own props (stories/<id>/props.json)
```json
{ "obor": { "about": "torch", "size": [0.12, 0.7, 0.12],
            "parts": [ { "shape": "cyl", "r": 0.025, "h": 0.6, "mat": "woodDark" },
                       { "shape": "sphere", "r": 0.06, "pos": [0, 0.66, 0], "mat": "glow", "color": "#ffb347" } ],
            "grips": { "L": [-0.075, 0.25, 0], "R": [-0.075, 0.25, 0] }, "holdAt": [-0.18, 0.55, 0.25] } }
```
Shapes: `box` {size}, `cyl` {r, r2?, h}, `cone` {r, h}, `sphere` {r, scale?}, `torus` {r, tube}, `lathe` {profile
[[r, y]…] bottom→top, `cut`: true lets it open in a cutaway, `wall`}. `pos` = the BOTTOM centre (sphere / torus:
centre), `rot` in degrees. Materials: clay, clayDark, glass, water, ice, wood, woodDark, bamboo, metal, gold, cloth,
plastic, stone, paint, leaf, fruit, paper, rope, glow, liquid (+ any `color`). Grips are where the **wrists** go
(the mitten hand reaches ~4.5 cm further toward the prop): put them a hand's width outside the surface; equal L and
R = held in the right hand. A vessel that can be cut open adds `"vessel": { "part": <index of its lathe>, "inner":
[[r, y]…], "level", "liquid" }`. Check a new prop with a `--stills` of an insert on it.

## Adding a world (when no world fits the story)
Copy the pattern of `src/cerdik/worlds/pasar.meta.ts` + `Pasar.tsx`: a pure-data **meta** (`spots` with `pos`, `face`
(yaw; 0 = +z), `about`, optional `surface`; `colliders` = boxes the camera must stay out of and see past — walls,
stalls, houses, posts, big furniture, scene-dressing people; `bounds`; `views.establish` and `views.aerial` a → b
camera keys; `crowd` places; `floor` heights for raised platforms; `indoor: true` for a room — rain then stays
outside) and a **picture** (a React component of three.js
meshes; build from `src/kits/bedah/geo.tsx` (boxUV, Rod), `mats.ts` (flat, mat), `tex.ts` (wood, plaster, thatch,
brick, rubble, grass, dirt, weave…), `props.tsx` (Trees, Palm, Banana, TreeLine), `src/kits/cerdik/backdrop.tsx`
(Hills, Backdrop, tileFloor) and the prop library). Register it in `src/cerdik/worlds/index.ts` and `scenes.tsx`.
Rules: metres; floors at the `floor` heights; every solid thing a person stands next to has a collider (roofs and
awnings too: rain stops on collider tops, so a shelter without one lets rain through); ground layers (wet sand,
paths, mats) lie side by side or ≥ 1 cm above the ground, never 1 mm over another plane (it flickers through); the world
must look rich from every place (stuff behind people at 3–15 m: stalls, houses, trees, goods); saturated, flat
colours; no text on signs. Check with `WorldLook` (every place) before writing the story.

## QA
- `--plan`: no warnings (a warning names the line and what to change: a missing word, a place the camera cannot
  see, a shot under 0.85 s).
- `--stills auto` (seconds, not minutes): open the sheet; every shot shows its subject clearly, faces readable, nothing through anything
  (a hand in a jar, a body in a table), props on their surfaces, captions not covering the face for a whole shot.
- QA gate (after `--preview`, before `--final`): TEMBUS (people × held props × big props), one-frame jumps, blinks,
  camera snaps, a flicker scan of the 3D alone. The scene probe runs in one render tab (several tabs can read a
  pose from another frame and report false one-frame flicks). CHECK strips need `"ok: <why>"` in
  `out/<id>/qa-gate/qa-video.review.json`: eye blinks, a glow lighting up, an expression swap, a dust puff are
  designed; anything else is a bug to fix.

## Limits of this version
- Five worlds; another place needs a new world (allow ≈ 30–60 min) or a story set in an existing one.
- Bodies are rigid stick figures posed by IK: no running, jumping, fighting, riding, swimming, climbing, lying down
  or carrying a person; walking only on flat ground in a straight line; long dresses (`costume.long`) only for
  standing / sitting characters. No animals, no vehicles that move (boats bob), no physics (nothing falls or breaks).
- Mouth movement is a simple flap on quoted words, not lip-sync.
- Portrait 9:16 by default, 16:9 with `--wide`. Tested on macOS Apple Silicon. Final render ≈ 1.5–3 min per 10 s.
