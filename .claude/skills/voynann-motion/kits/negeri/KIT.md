# NEGERI kit — story.json → one day of a "bikin negara dari nol" series (chibi host, comments, buildings rising)

A project of its own (`node SKILL_DIR/new-project.mjs <folder> --kit=negeri`). Remotion 4 + React Three Fiber, Node
≥ 22.18 (the director's `.ts` files run directly in node). Everything is procedural — no image or model assets.

```
npm ci
npm run check-env
npm run library                                   # beats, buildings (+ aliases), plots, cast + card codes, actions, expressions, gags
npm run menu                                      # kartu tokoh for the buyer → out/_menu/kartu-tokoh-1|2|3.jpg
npm run look                                      # the building library + map views → out/_look/_sheet.jpg (seconds)
node scripts/make.mjs <id> --cast                 # this episode's host + citizens (body + face, validated) → out/<id>/tokoh.jpg
node scripts/make.mjs <id> --save-tokoh host --nama "Pak Pres"   # keep the host → tokoh/tokoh-pak-pres.json
node scripts/make.mjs <id> --plan                 # compile stories/<id>/story.json + the series world: shot list + warnings
node scripts/make.mjs <id> --stills auto          # one still per shot → out/<id>/stills/_sheet.jpg (one page, seconds)
node scripts/make.mjs <id> --look                 # the story's own buildings (buildings.json) → out/<id>/look/_sheet.jpg
node scripts/make.mjs <id> --preview              # 540×960 preview (2× supersampled) + sound + QA gate report
node scripts/make.mjs <id> --final                # QA gate (stops on FAIL) + 1080×1920 @ 60 + delivery scan + writes the day into world.json
node scripts/make.mjs <id> --commit               # write the day into world.json without rendering (--no-commit: --final does not write)
```
Flags: `--silent` (no sound), `--no-music`, `--wide` (16:9, only when asked), `--no-qa`, `--force-qa`.
Voice: `stories/<id>/vo.mp3|wav|m4a` → word timings with whisper.cpp (`WHISPER_CLI` / `WHISPER_MODEL` env vars find a
non-standard install); without a voice the lines are paced at ≈ 3 words/s (Gen-Z host pace).

## What an episode is made of
- **The country** (one fixed template every series grows on): the plaza ("titik nol": the host's flag and first tent),
  a lawn in front of it, dirt roads, a rice field (west), a river (north, bridge place on the main road), a rail
  corridor, an open field (east, mini airport), **17 building plots** (S1–S4 small on the plaza, M/L around it, X1/X2
  extra large), **40 named-house slots** along the main road, and **lots**: every free spot fills with tents / small
  houses as the population grows (nearest the plaza first; above ≈ 30 000 citizens tents turn into houses).
- **The series** (`series/<name>/world.json`, from `"series": "<name>"` in the story): country name, flag colours, the
  host, and every finished day (population, builds with their plots, named houses with their slots, citizens). The
  state at the start of Day N = all days before N; `--final` (or `--commit`) writes this day in (re-running replaces
  it, never duplicates), so Day N+1 starts where Day N ended. Day 1 starts from empty land. A buyer can run several
  series side by side. No `series` = a one-off episode (only this episode's builds, population from `population`).
- **Host** (the recurring star): presets P1–P5 (presiden, presiden-hijab, raja kocak, ratu, lurah) — or any look, or a
  saved tokoh. Talks on the whole voice-over (mouth flaps on the words), stands where the story says.
- **Warga** (`cast`): presets T1–T13 with a `handle` (shown as a name tag in gags), or generated extras (`"n"` in a gag).
- **Buildings** (19 + aliases): tenda (posko), rumah (a commenter's house + name plate, goes to a named slot), pos-ronda,
  warung, musala, sekolah, puskesmas, lapangan, istana, pasar, kantor (generic civic office: name it DPR, kantor
  polisi, pengadilan…), jalan (the main road gets asphalt), jembatan (over the river), menara-air, taman, kolam,
  gapura (the country's name over the road), stasiun (with a rail line and a train), bandara (runway, tower, plane).
  Aliases: kantor-presiden, alun-alun, tandon, dpr, kantor-polisi, pengadilan, kantor-pos, balai-desa, rumah-sakit,
  masjid, posko, lapangan-bola, pos-kamling, toko. Each has labelled stages shown on the build card while it rises.
- **Look**: clean low-poly game world, warm late-afternoon light (also pagi / siang / malam), flat colours, soft
  shadows; chibi characters with big 2D anime faces (11 expressions, blinks); flat "papan pengumuman" UI (cream cards,
  ink borders, red + deep green) in Fredoka + Plus Jakarta Sans (OFL).
- **Sound**: original synth city-builder bed (pluck bass, marimba, shaker, soft kick; thinner at night) + SFX from the
  plan (card pops, comment ping, counter riser + ding, build knocks + a little fanfare, plate ticks, snore / claps /
  bonks for gags, crickets at night, CTA chime), ducked under the voice, −14 LUFS / −1.5 dBTP.

## story.json
```json
{
  "id": "hari-2", "title": "Hari 2: Warung Pertama", "series": "republik-komen", "day": 2,
  "population": 25310, "voice": "aku",
  "host": { "tokoh": "pak-pres" },
  "cast": { "sari": { "preset": "ibu", "handle": "@sari.kopi", "look": { "hat": { "kind": "kerudung", "color": "#d8412f" } } } },
  "comments": [ { "id": "c1", "handle": "@sari.kopi", "text": "pak pres warung dong, laper nih", "likes": 9120, "ago": "5 jam" },
                { "id": "c2", "handle": "@rizal.ngopi", "text": "bandara!!", "likes": 3301 } ],
  "builds": [ { "id": "warung", "kind": "warung", "by": "c1", "name": "WARUNG BU SARI" } ],
  "plates": ["@rizal.ngopi"],
  "lines": [
    { "text": "Hari kedua di Republik Komen.", "beat": "establish", "do": "wave" },
    { "text": "Pagi ini warganya udah dua puluh lima ribu.", "beat": "counter" },
    { "text": "Komen teratas: warung dong, laper nih.", "beat": "comment", "comment": ["c1", "c2"] },
    { "text": "Oke, warungnya aku bangun sekarang.", "beat": "build", "build": "warung", "do": "point" },
    { "text": "Baru buka, antreannya udah panjang.", "beat": "gag", "gag": "queue", "who": ["sari"], "n": 3, "place": "warung" },
    { "text": "Besok bangun apa? Komen!", "beat": "cta" }
  ]
}
```
- **Top level**: `id`, `title`, `series` (optional), `day`, `population` (citizens at the END of the episode — it is what
  the series remembers), `country` + `flag` [colour 1, colour 2] (day 1 of a series / one-offs; default Republik Komen,
  red-white), `voice` "aku" | "gue" (rule-card wording), `time` (sore default | pagi | siang | malam), `format`
  "landscape" (= `--wide`), `host`, `cast`, `comments`, `builds`, `plates`, `lines`.
- **comments**: `{ id?, handle, text, likes?, ago?, avatar? }` — the buyer's real top comments (never invent real
  handles). `id` defaults to c1, c2…
- **builds**: `{ id, kind, by?, name?, plot?, colors? }` — `kind` from the library / aliases / buildings.json; `by` =
  a comment id or a handle (build card "request @…", house plate); `name` = the sign + card text (UPPER CASE is
  applied); `plot` forces a plot (S1… or a house slot R1…; a used plot is replaced with a warning); `colors` fill the
  building's colour tokens (`wall`, `roof`, `accent`; flags use the country's colours). Placement is automatic: the
  smallest free plot that fits, nearest the plaza first (N0 is kept for the palace, W1 for the musala, X1 for the
  lapangan / pasar while others are free). Special builds go to their fixed place (gate, bridge, road, station, field).
- **plates**: new named houses this episode (`"@handle"` or `{ "handle", "colors": { "wall", "roof" } }`); numbered
  WARGA No. 002… in order across the series (No. 001 is the host).
- **lines**: one sentence of the voice-over each, verbatim, in order. A line is one beat (one shot, or several: a long
  line is cut automatically every ≈ 2 s), or several with `beats` — the first beat starts with the line, every next beat
  has `"at": "<word>"` (`"kata#2"` = its 2nd occurrence), the cut lands on that word.
- **beat fields**: `beat` (below), `do` / `expr` / `place` / `to` / `then` for the host, `cast` for citizens
  (`{ "<id>": { place?, do?, expr?, to?, gone? } }`), `shot` (optional override: wide, medium, close, low, orbit,
  insert), `side`, `move`, `time`, `dissolve`, `tag` (a green label card, e.g. "RUMAH WARGA PERTAMA").
- **beats** (state carries on; write only what changes):
  - `host` — the host talks / reacts. Default action talk, expression happy. Camera: medium / close / low / wide in turn.
  - `establish` — wide on the host in the country (an episode opener). Default wave.
  - `rules` — the two rule cards (FOLLOW = jadi WARGA, KOMEN TERATAS = aku/gue BANGUN; `"rules": [{small, big}, {small, big}]`
    to change the words). Host points at the lens.
  - `counter` — aerial over the settlement; the population counter enlarges and rolls from yesterday's number to
    `population`; tents / houses grow in as it counts. One per episode.
  - `comment` — the comment card (`"comment": "c1"` or `["c1", "c2", "c3"]`: the first is KOMEN TERATAS, the others a
    compact list). The host reads his phone.
  - `build` — `"build": "<id>"`: the building rises stage by stage over the beat (two build lines in a row = one longer
    build), the build card shows the stage and %, the host stands at the building's front (default proud / present).
    Camera: a slow orbit around the building; automatic cuts inside a long line alternate to the host.
  - `reveal` — close shot of the building's sign (`"build": "<id>"`).
  - `plates` — one shot per new name plate (a truck past them when the line is too short).
  - `gag` — citizens at a place: `"gag"`: sleep | sit | chat | eat (on the building's seats — pos-ronda, warung, taman,
    musala, stasiun, lapangan stand, kolam gazebo — or on a mat on the plaza) | queue (a line at the building's counter /
    door) | argue (two face each other, angry) | celebrate (cheering + clapping crowd) | watch; `"who"`: cast ids,
    `"n"`: extra citizens, `"place"`: a build id / a standing building's kind / plaza / lawn. The host keeps his spot
    (he steps aside if the gag sits next to him); name tags show the handles.
  - `night` — time jump: dissolve + card. `"time"`: pagi (default, "SEMALAM KEMUDIAN…"), malam ("MALAM HARINYA…", lit
    windows, crickets), siang, sore; `"tag"` changes the card text. Time carries on.
  - `cta` — the end card (Besok bangun apa? / KOMEN! / komen teratas = HARI N+1; `"cta": { line, button, sub }`).
  - `flyover` — aerial orbit over the whole country with its name and today's population.
- **host / cast place**: `plaza` (the host's home, default), `lawn`, `jalan`, a build id, the kind / name / plot of a
  standing building ("pos-ronda", "N0"), or a citizen id. A building place = its front yard (it stays free of houses).
- **actions** (`do`): stand, talk, wave, pointCam, point, present, proud, shocked, read (phone), facepalm, think,
  salute, cheer, shrug, clap, argue, queue, eat (bowl), and for citizens on seats sit, sitTalk, sitEat, sitFwd, sleep,
  sleepHang. **expressions** (`expr`): neutral, happy, talk, proud, shocked, annoyed (sweat drop), sleep, smug, laugh,
  sad, angry. Faces swap like a 2D cartoon; eyes blink; the host's mouth moves on every spoken word.
- **Captions**: the voice as speech bubbles over the host when he is on screen (else a caption card in the free part
  of the frame), 2–4 words at a time, swapped on the spoken word; words written in CAPITALS in the script turn red.

## Writing the script (when the buyer gives only the inputs)
The genre's engine is **the audience builds the country**: follower count = population, top comment = what gets built,
commenters become residents. One day = one build + one small comic drama + a hook for tomorrow.
1. **Hari + keadaan** (first line): "Hari ketiga di Republik Komen…" — where the country stands.
2. **Angka**: the population jump (`counter`), with a reaction ("SEMALAM 12 RIBU?!").
3. **Komen teratas** (`comment`): read the buyer's top comment (handle + text) — optionally the runner-ups and a
   playful refusal ("Bandara nanti dulu, duitnya belum ada").
4. **Bangun** (`build`, 2 lines): what goes up, stage by stage ("Tiang, atap, papan nama. Jadi!"), then `reveal` or
   `plates` (new houses with commenters' names).
5. **Drama kecil** (`gag`): something goes slightly wrong / funny with the citizens (asleep in the pos ronda, a queue,
   kids fighting over who's keeper) + the host's one-liner.
6. **CTA** (last line): "Besok bangun apa? Komen!" (+ optional `night` jump or `flyover` before it).
First person, Gen-Z Indonesian ("aku/kamu" or "gue/lo" — the buyer's choice, same as `voice`), 10–16 sentences,
4–14 words each, 30–60 s. Keep numbers as words the voice will say ("dua puluh lima ribu"). Hand the buyer the voice
text for ElevenLabs v3 with light tags (`[excited]`, `[laughs]`, `[sighs]`, `[whispers]`).

## Your own buildings (stories/<id>/buildings.json or series/<name>/buildings.json)
```json
{ "menara-pandang": { "about": "bamboo lookout tower", "name": "MENARA PANDANG", "size": [3.4, 3.4], "h": 9.5,
    "params": { "accent": "#8c3b2e" }, "front": [0, 2.6],
    "steps": [
      { "label": "KAKI BAMBU", "parts": [ { "shape": "rod", "a": [-1.4, 0, -1.4], "b": [-1.0, 7, -1.0], "r": 0.08, "color": "#c9b06a" } ] },
      { "label": "LANTAI", "parts": [ { "shape": "box", "size": [2.6, 0.14, 2.6], "pos": [0, 7, 0], "color": "#8c6542" } ] },
      { "label": "ATAP", "parts": [ { "macro": "roof", "type": "pyramid", "w": 2.6, "d": 2.6, "y": 8.64, "rise": 0.9, "color": "{accent}" } ] },
      { "label": "PAPAN", "parts": [ { "shape": "sign", "size": [2.0, 0.42, 0.06], "pos": [0, 0.75, 2.24], "text": "{name}", "ink": "{accent}" } ] } ] } }
```
Local frame: origin = centre of the footprint on the ground, FRONT = +z (it will face the road / plaza), metres.
`size` [w, d] decides which plot it fits (S ≤ 4.6 × 4, M ≤ 12 × 10, L ≤ 16 × 12, XL ≤ 20 × 14); `h` = height (camera).
Shapes: `box` {size [w,h,d]}, `cyl` {r (top), r2 (bottom), h}, `cone` {r, h}, `sphere` {r, half?}, `blob` {r, scale},
`prism` {w, h, l} (a gable roof volume, ridge along z — rotate 90° for x), `hip` {w, d, h, ridge}, `rod` {a, b, r},
`sign` {size, text, sub?, bg?, ink?}. `pos` = the BOTTOM centre (sphere / blob: centre), `rot` [x, y, z] degrees.
Macros: `walls` {w, d, h, y?, at?, color, trim?, base?, door? {x, w, h, color, side}, windows? {n, w, h, y, sides,
frame, glass}}, `roof` {type gable | hip | pyramid | flat | mono | joglo, w, d, y, rise, over, at?, color, ridge?},
`posts` {w, d, h, y?, r?, nx?, nz? (1 = a front row), at?, color, round?}, `fence` {w, d, h?, y?, color, gap?, open?},
`stairs` {w, d, h, n?, pos [x, z], yaw?, color}, `scaffold` {w, d, h} (leaves after the build), `tree` {kind round |
beringin | cemara | bush, pos [x, z], s?}, `lamp` {pos, h?}, `bench` {pos, y?, yaw?, w?, color?}. Every part may set
`anim` (drop | grow | pop | slide; `axis` x / z grows along the ground), `glass: true` (lit at night), `temp: true`.
Colour tokens `{wall}` `{roof}` `{accent}` `{flag1}` `{flag2}`; sign tokens `{name}` `{by}` `{no}` `{country}`.
Optional: `seats` [{ p: [x, seatY, z], yaw (deg), legs: "hang" | "fwd" }] (gags sit there), `front` [x, z] (where a
queue starts), `strike` (seconds the scaffold takes to leave). The make script validates it (plain messages) and the
series keeps the definition in world.json, so later days still draw it. Check it with `node scripts/make.mjs <id> --look`.

## QA
- `--plan`: no warnings (a warning names the line: a missing word, a shot under 0.85 s, a camera that cannot see, a
  place that is not a building, a build without a build beat).
- `--stills auto` (seconds): open the sheet; every shot shows its subject (host, building, sign, plate, gag group),
  faces readable, cards and bubbles not covering faces or each other, nothing through anything (people in walls,
  hands in the host), text readable.
- QA gate (after `--preview`, before `--final`): TEMBUS (host, citizens, buildings), one-frame jumps, blinks, camera
  snaps, a flicker scan of the 3D alone. The scene probe runs in one render tab. CHECK strips need `"ok: <why>"` in
  `out/<id>/qa-gate/qa-video.review.json`: eye blinks, the settlement growing during the counter, pieces of a building
  arriving, the flag waving, a gag's chatter are designed; anything else is a bug.

## Limits of this version
- One country template (the map is the same for every series; country name, flag colours, host and buildings
  differ). 17 building plots + 40 named-house slots; when full, `"plot"` replaces an old building.
- Chibi bodies posed by IK: no walking (people change place on a cut), no running, jumping, riding, swimming; the host
  stands (citizens sit / sleep on seats or a mat). No vehicles that move (the train and plane slide in once), no
  animals, no physics (nothing falls or collapses), no rain / weather (time of day only).
- Mouth movement is a flap on the spoken words, not lip-sync. One voice (the host's) — citizens do not speak.
- Portrait 9:16 by default, 16:9 with `--wide`. Tested on macOS Apple Silicon (GPU): a 42 s day renders its stills in
  ≈ 5 s, the preview in ≈ 30 s + the QA gate in ≈ 70 s, the 1080×1920 @ 60 final in ≈ 50 s.
