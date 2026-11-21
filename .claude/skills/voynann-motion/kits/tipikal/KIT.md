# TIPIKAL kit — story.json → "Tipe-tipe …" relatable 3D comedy sketch

A project of its own (`node SKILL_DIR/new-project.mjs <folder> --kit=tipikal`). Remotion 4 + React Three Fiber, Node
≥ 22.18 (the director's `.ts` files run directly in node). Everything is procedural — no image or model assets; fonts
are OFL (Baloo 2, Barlow Condensed, Plus Jakarta Sans).

```
npm ci
npm run check-env
npm run library                                  # sets + places, cast + card codes, vehicles, props, actions, faces, shots, pops, sounds
npm run menu                                     # kartu tokoh for the buyer → out/_menu/kartu-tokoh-1|2|3.jpg
node scripts/make.mjs <id> --cast                # this story's people (full body + face, validated) → out/<id>/tokoh.jpg
node scripts/make.mjs <id> --save-tokoh dodi --nama "Mas Dodi"   # keep a person → tokoh/tokoh-mas-dodi.json
node scripts/make.mjs <id> --plan                # compile stories/<id>/story.json: shot list + warnings
node scripts/make.mjs <id> --stills auto         # one still per shot from ONE page → out/<id>/stills/_sheet.jpg
node scripts/make.mjs <id> --preview             # 540×960 preview (2× supersampled) + sound + QA gate report
node scripts/make.mjs <id> --final               # QA gate (stops on FAIL) + 1080×1920 @ 60 + delivery scan
```
Flags: `--silent` (no sound), `--no-music`, `--wide` (16:9, only when asked), `--no-qa`, `--force-qa`.
`--stills auto` (or `--stills 2s,9.5s`) renders every frame from ONE loaded page (composition `TipikalStills`):
seconds, not minutes. Images `out/<id>/stills/f<frame>-shot<n>.jpg`, sheet `_sheet.jpg` (5 per row, shot order).
Look development, the same way: `npx remotion render src/index.ts SetLook out/s --sequence --image-format=jpeg
--frames=0-40 --props='{"set":"kantor"}'` (frames 0–1 the intro view, 2… one view per place in `--library` order),
`CastSheet` (every preset), `VehLook` (every vehicle).
Times on an Apple Silicon Mac: stills 3–8 s per sheet, preview ≈ 20 s render (≈ 70 s with sound + QA), final
≈ 15 s render per 10 s of film (≈ 80–100 s for a 22 s film with QA and the delivery scan).

## The genre
A topic ("tipe-tipe pengendara motor") becomes 3–5 **types**. Each type is a 3–6 s vignette: the numbered type card
slams in ("Yang ngerem pakai *sandal*"), we see the person do it (wide/medium), then the **punchline**: someone
else's reaction face, a "?" / "!" pop, a comic sound word, a freeze with a label, a sound gag. The header card
("TIPE-TIPE / PENGENDARA MOTOR") stays on screen; the film ends on a frozen group shot with "Kamu tipe yang mana?".
**No narrator by default** — cards, pops, sound words, music and SFX carry it. A voice-over is optional (then each
type starts on its voice line).

## What a film is made of
- **Sets** (one per story, a type may switch with `"set"`): `jalan` (city street, two lanes, traffic light with
  countdown, zebra crossing, warung, gang mouth, parking), `gang` (kampung alley with a polisi tidur bump, warung
  kelontong + bench, pos ronda, terraces, clothesline, mushola, gapura), `kelas` (classroom, 18 seats depan /
  tengah / belakang 1–6, teacher's desk, board), `kantor` (open office meja-1…6, boss's glass room, meeting table
  rapat-1…6, pantry, dispenser, printer), `kondangan` (wedding tent: pelaminan with bride + groom, salaman line,
  prasmanan-1…3, guest chairs kursi-1…10, organ stage + dance floor, guestbook, envelope box), `rumah` (living +
  dining room: sofa-1…3, armchairs, TV, meja-makan-1…4, lesehan, door, kitchen). Named **places** with `[seat]`
  (sit there) and `[table]` (props stand on its surface; seated people use it) — `npm run library`.
- **Cast**: 17 presets (bapak, ibu, mas, mbak, bocil, nenek, kakek, guru, bos, kurir = ojek/courier jacket with
  NO brand, murid, murid-cewek, pegawai, parkir, pengantin-pria, pengantin-wanita, pedagang = card codes T1–T17)
  + any look override, or a saved tokoh. Toon bodies with real fingers (point, peace, thumb, grip), 21 drawn
  expressions, blinks, a talking mouth.
- **Vehicles** (props people `ride`): `motor` (matic: rider, 2 pillions, kid on the floorboard = seats 0–3),
  `bebek` (underbone, seats 0–1), `sepeda` (pedals; basket), `mobil` (driver right = seat 0, passenger 1; open
  windows), `angkot` (tinted: nobody visible inside — traffic / gags). `color`, `color2`, `plate` (made-up text
  only), `lamps` (brake / left / right / hazard). Cargo (`galon`, `kardus`, `karung` …) rides on racks / basket /
  roof with `"ride": "<vehicle>"`, stacking in order. Wheels turn, bikes lean and steer, lift over the speed bump.
- **Props**: 33 objects built from simple parts (hp, piring, sendok, gelas, kopi, botol, es-plastik, mangkok, buku,
  kertas, pensil, tas, kresek, payung, kado, amplop, kipas, galon, kardus, sapu, helm, mic, tongkat, remote,
  kerupuk, kue-toples, bola, laptop, kursi-plastik, meja-lipat, ember, karung, tumpeng) + your own in
  `stories/<id>/props.json`. Actions that need an object bring it (eat → piring + sendok, phone → hp …).
- **Actions** (`do`, 52): stand talk wave point shrug facepalm clap cheer dance laugh angry shock panic scared think
  akimbo cross sad cry nod shake look whisper stretch bow salam queue sleep eat drink phone call selfie write type
  read carry hold give fan umbrella sweep push fall jump sing relax peace salute raise thumb, ride ride-brake
  ride-paddle, sit. Any of them works standing, seated (upper body) or on a vehicle where it makes sense; at a desk,
  sleep / write / type use the desk.
- **Shots**: establish, wide, medium, close, reaction, low (hero), top, insert (a prop), follow (behind a mover),
  ots (`over`). **The camera is automatic**: per shot it tries many angles, rejects any where a wall, desk, car or
  another person hides a face (centre and both sides of every head must be clear — a thin post cannot cover half a
  face), keeps faces out of the label zones, and follows movers. `side` nudges it;
  `move` = push (default) / pull / still / orbit / rise / track.
- **Pops**: `?` `!` `?!` `...` `♥` `zzz`, `sticker` (round, short text), `bubble` (speech text; its owner talks),
  `sfx` (comic word: CIIIT! GUBRAK!), `tag` (label pill: REM SANDAL), `stamp` (big stamped word). Each brings its
  sound; a bubble makes the owner's mouth move. Texts fit themselves: a sticker wider than its badge becomes a pill
  ("100.000"), every pop stays inside the frame (a bubble flips to the side with room), and the type shrinks only
  when it must — `--plan` warns past ~15 letters (sticker), 28 (bubble), 24 (tag), 11 (sfx), 18 (stamp) in 9:16.
- **Labels**: header + numbered type cards + outro card in a theme per set (`jalan` road-sign green, `kelas` notebook
  + chalkboard, `kantor` navy file tab, `kondangan` maroon + gold, `rumah` warm brown, `warung` red shop sign).
  `"theme"` overrides. `*word*` in a card = accent colour.
- **Time**: `day`, `sore` (golden), `malam` (blue night light; rooms stay warm and bright) — story-wide or per type. `light` (jalan):
  red / yellow / green with countdown.
- **Crowds** (`extras`): n background people at a place — idle, queue, watch, laugh, dance, sit (fills the set's
  free seats nearest the place: students in kelas, staff in kantor, guests at the tent).
- **Sound**: original synth groove (118 bpm, plucks, bass, shaker; drops out on freezes), a SFX for every pop, cut,
  vehicle (engine putter, brake squeal, horn), fall, cheer … ducked under a voice when there is one; −14 LUFS /
  −1.5 dBTP, ≈ 35–45 cues per minute.

## story.json
```json
{
  "id": "motor", "title": "Tipe-tipe Pengendara Motor", "header": "PENGENDARA MOTOR", "set": "jalan",
  "cast": {
    "dodi": { "preset": "mas", "name": "Dodi", "look": { "hat": { "kind": "helmet", "color": "#e0412f", "color2": "#ffffff" } } },
    "pakman": { "preset": "bapak", "name": "Pak Man", "look": { "hat": { "kind": "half-helmet", "color": "#2f6b43" } } },
    "pak": { "preset": "bapak", "name": "Pak Warung" }
  },
  "types": [
    { "text": "Yang ngerem pakai *sandal*", "dur": 4.4,
      "props": { "m5": { "kind": "bebek", "color": "#3c9a62", "plate": "TPK 04", "at": { "at": "jalan-e", "ahead": -14 } } },
      "cast": { "pakman": { "ride": "m5", "go": { "at": "jalan-e", "ahead": -1.4 }, "speed": "fast", "do": "ride", "expr": "neutral" },
                "pak": { "at": "bangku-warung", "do": "sit" } },
      "beats": [
        { "shot": "follow", "on": "pakman" },
        { "at": 0.95, "shot": "medium", "on": "pakman", "side": "left",
          "cast": { "pakman": { "do": "ride-brake", "expr": "panic" } }, "pop": [{ "kind": "sfx", "text": "CIIIIT!", "on": "pakman" }] },
        { "at": 2.3, "shot": "low", "on": "pakman", "freeze": true,
          "cast": { "pakman": { "do": "ride", "expr": "relief" } }, "pop": [{ "kind": "tag", "text": "REM SANDAL", "on": "pakman", "at": 0.2 }] }
      ] }
  ]
}
```
- **Top level**: `id`, `title`, `header` ("PENGENDARA MOTOR" — the small line says TIPE-TIPE; or `{ "small", "big" }`,
  ≤ 30 letters), `set`, `theme`?, `time`?, `format`? (`"landscape"`), `intro` (default a 1 s view of the set under
  the header; `{ "say", "dur" }` or `false`), `outro` (default "Kamu tipe yang mana?"; a string, `{ "text", "say",
  "dur" }` or `false`), `cast`, `props` (story-wide), `extras`, `types`.
- **types** (3–5): `text` = the card (≤ 48 letters, `*word*` = accent), `say` (its voice line when it differs from
  the card), `dur` (seconds without a voice, default 4.4), `set`, `time`, `light`, and the beat fields; `beats`
  splits it: the first beat starts with the type, the next ones `"at": <seconds after the type start>` or
  `"<word>"` of its voice line. Without `beats` a type gets wide → medium → reaction on its people automatically.
  Shots under 0.6 s are merged (with a warning). People not mentioned in a type leave (`"keep": true` in `cast`
  keeps someone on stage); type props leave with their type.
- **beat fields**: `shot`, `on` (person / prop id or a list), `over` (ots), `move`, `side` (`left` / `right`), `cast`,
  `props`, `pop`, `sound` (extra cues: horn, brake, thud, crash, boing, slide, scratch, pop, whoosh, tick, ding,
  cheer, snore, splash, sting, stamp, slap, chomp, engine), `freeze` (the punchline picture holds; music drops; when
  the beat also changes someone's action, the freeze waits ~0.5 s so the gesture lands first),
  `light`.
- **cast entry in a beat**: `at` (place, or `{ "at", "side", "ahead" }` metres in the place's frame), `go` (walk /
  ride there; keeps going across cuts; walkers step around furniture), `from`, `via` [places], `speed` (slow / normal
  / fast / m/s), `pass` (enters already moving, does not stop: traffic), `ride` (vehicle id; `""` gets off), `seat`,
  `face` ("front" | id | degrees), `do`, `to` (target of point / salam / whisper / give / look), `expr`, `then` [{ `at`,
  `do`?, `expr`?, `to`? }], `hold` (prop id; `""` lets go), `says: true` (mouth moves), `gone: true`. State carries
  on: write only what changes. Every action change blends over 0.25 s (hands, fingers and palms too), so a `then` or
  a new beat may switch actions any time — even on a freeze beat.
- **props**: `kind`, `at` + `on: "surface"` (a `[table]` place) or the ground, `yaw`, `scale`, `color`, `color2`,
  `plate`, `lamps`, `go` / `from` / `via` / `speed` / `pass` (vehicles drive on their own too), `ride` (cargo), `gone`.
- **pop**: `{ "kind", "text"?, "on"?, "at"?: seconds | word, "until"?, "color"?, "side"?, "sound"? }`.
- **extras**: `{ "at", "n", "mode", "from"?, "until"? }` (seconds of the film), on the story's main set.

## Writing the types (when the buyer gives only a topic)
Pick 3–5 types everyone recognises, each with ONE clear visual gag the camera can show without words: an action
(rem sandal, tidur di kelas, foto terus), an exaggeration (anak tiga + galon di motor), a contrast (lampu merah →
maju sampai tengah). Card text = "Yang …" + the punchline word starred, short (≤ 48 letters). Per type: setup shot →
action → reaction / freeze / label. The funniest type last. No real people, brands, plates, parties or politicians;
no mocking religion, ethnicity, disability or bodies — the joke is the habit, never the person.

## Your own props (stories/<id>/props.json)
```json
{ "termos": { "about": "termos es (cool box)", "size": [0.4, 0.35, 0.3],
              "parts": [ { "shape": "box", "size": [0.4, 0.3, 0.3], "color": "#2f6fd0", "round": 0.1 },
                         { "shape": "box", "size": [0.42, 0.05, 0.32], "pos": [0, 0.3, 0], "color": "#f6f5f0" } ],
              "hold": { "hand": "both", "mode": "upright", "at": [0, 0.15, 0] } } }
```
Shapes: `box` {size, round?}, `cyl` {r, r2?, h}, `cone` {r, h}, `sphere` {r, scale?}, `torus` {r, tube, arc?}, `lathe`
{profile [[r, y]…]}. `pos` = BOTTOM centre (sphere / torus: centre), `rot` degrees, `mat` toon (default) | flat |
shiny | screen, every part has a flat `color`. `hold`: `hand` R | L | both, `mode` "hand" (follows the fingers:
phone, broom) or "upright" (cup, box), `at` = the point that sits in the palm, `rot` for "hand" mode. `noInk: true`
for thin things. Check with `--stills` on an insert shot.

## Adding a set (when no set fits)
Copy the pattern of `src/tipikal/sets/kantor.ts` + `Kantor.tsx`: a pure-data **meta** (`spots` with `pos`, `face`
(yaw; 0 = +z), `about`, `seat` (seat height) and `surface` {y, ahead} for desks/tables, `lane` for road places;
`colliders` = boxes the camera must stay out of and see past, and walkers step around (walls, desks, chairs,
counters, cars); `bounds`; `views.establish` a → b; `crowd` seats; `floor` raised areas; `bumps`; `indoor`) and a
**picture** (three.js meshes from `sets/pieces.tsx`: Bx, Tb, Cy, Floor, Wall, WindowPane, Ceiling, TubeLamp,
CeilingFan, Clock, PictureFrame, Plant, Tree, Chair, OfficeChair, PlasticChair, Table, Sofa, ParkedMotor,
SignBoard). Register it in `sets/index.ts` (SETS) and `sets/scenes.tsx` (SCENES); give it a theme. Rules: metres;
seats 0.38–0.40 m high and ≥ 0.46 m wide (toon hips); desk tops 0.64–0.72; every solid thing a person stands next
to has a collider; no coplanar faces — ground details (drains, lines, rugs, cloths) sit ≥ 1 cm above what they lie on,
  or clearly sunk below it, never in its plane (it flickers); stuff behind people at 3–15 m; flat saturated colours, no
brand, no real shop names. Check with `SetLook` (every place) and `--stills` before writing the story.

## QA
- `--plan`: no warnings (each names the type / beat and what to change: a card too long, a type under 2.4 s, a
  beat too close to the end, a place the camera cannot see, a wrong look field).
- `--stills auto`: open the sheet; every shot shows its subject, faces readable and not under the labels, the
  right expression, props in hands / on tables, riders on their seats, nothing through anything.
- QA gate (after `--preview`, before `--final`): TEMBUS (people × seats, desks, vehicles, co-riders, held props),
  one-frame jumps, blinks, camera snaps, a flicker scan of the 3D alone; one render tab (`--concurrency=1`).
  CHECK strips need `"ok: <why>"` in `out/<id>/qa-gate/qa-video.review.json`: eye blinks, fast designed gestures
  (shock, facepalm, raise), a pop landing are designed; anything else is a bug.

## Limits of this version
- Six sets; another place (pasar, masjid, kafe, sekolah outside…) needs a new set (≈ 30–60 min).
- No lip-sync (mouth flap while a bubble / `says` is on). One held object per hand; no physics (a fall is a pose,
  nothing breaks or spills); people touch only in `salam`; no animals, chases or fights. Angkot passengers are not visible. A long skirt is one drape standing / walking and a lap + shin drapes when
  seated / riding (chosen by where the person is, so a stride never flips it; a cartoon fall morphs between them).
  Speed bumps only in `gang`. Sleepers at a desk read best in medium shots.
- Portrait 9:16 by default, 16:9 with `--wide`. Tested on macOS Apple Silicon.
