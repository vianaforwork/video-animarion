# BEDAH kit — "how it's built, and why" explainers from a script (story.json) + voice-over

`node SKILL_DIR/new-project.mjs [folder] --kit=bedah` sets up a project of its own: it copies `kits/bedah/project/`
(not `starter/`) into the folder and marks it with `voynann-kit.json`. A BEDAH project never shares a folder with
another style's kit. Node ≥ 22.18 (the scripts import the TypeScript director directly).

| Folder (in the project) | Content |
|---|---|
| `src/director/` | `types.ts` (Story, DomainMeta / PartMeta, Plan), `plan.ts` (compiler: cut times from the sentences, cumulative build state, arrivals, parameter changes, camera, worker, pins / marks / tags, weather, warnings), `camera.ts` (10 shot kinds that fit the focus in 9:16, or in 16:9 with `--wide`), `acts.ts` (worker acts), `Film.tsx` (the generic film) |
| `src/domains/` | `index.ts` + `views.tsx` (registries); `rumah/`: `meta.ts` + `view.tsx` (roof topic), `pondasi.ts` + `pondasi.view.tsx` (foundation topic — the worked example of adding parts), `world.tsx` (village set), `props.tsx` (rain, kiln, mould, drying tiles…) |
| `src/kits/bedah/` | `tex.ts` (procedural PBR textures: brick, woven bamboo, thatch, wood, bamboo, clay, plaster, dirt, grass, soil section, rubble stone…), `mats.ts`, `geo.tsx` (metre-UV boxes, `Beam`, `Culm`), `Stage.tsx` (sun, cumulus sky, AO, DAY / RAIN looks), `Ground.tsx` (slab cut open at the front), `rig.ts` + `Worker.tsx` (IK mannequin), `roofmath.ts` + `roofing.tsx`, `props.tsx` (houses, trees, palms, power line), `Overlay.tsx` (captions, `Pin`, `Stroke`, `Tag`) |
| `stories/` | two examples: `atap` (16 sentences: thatch → tiles → truss → ceiling) and `pondasi` (7 sentences: wall → trench → stone footing → ground beam); no recordings |
| `scripts/` | `make.mjs` (story + VO → plan → sound → stills / preview / final → QA), `lib/vo.mjs` (whisper word timings), `lib/sound.mjs` (original synth bed + SFX from the plan, −14 LUFS), `qa-blink.mjs` (whole-frame pops), `qa-flicker.mjs` (per-area flicker map), `qa-pose.mjs`, `stills.mjs`, `check-env.mjs`, `gl.mjs` |

## Commands

```
node scripts/make.mjs --parts                 # everything that can be built: parts, parameters, anchors, marks, worker acts
node scripts/make.mjs <id> --plan             # stories/<id>/story.json → shot list + warnings (renders nothing)
node scripts/make.mjs <id> --stills 3s,9.5s   # → out/<id>/stills/_sheet.jpg
node scripts/make.mjs <id> --preview          # 540×960 (rendered at 2×, downscaled) + sound + QA
node scripts/make.mjs <id> --final            # 1080×1920 @ 60 + sound + QA → out/<id>/<id>_1080x1920_60fps.mp4
#   --wide (only when the buyer asks for landscape): 16:9 — stills-wide/, <id>_preview_960x540.mp4,
#   <id>_1920x1080_60fps.mp4, flicker-wide/; per shot `camWide` replaces a hand-set `cam`
#   voice: stories/<id>/vo.mp3|wav|m4a (word timings need whisper.cpp)  ·  --silent  ·  --no-music
```

Without a voice the sentences are paced (2.75 words/s) and the film gets music + SFX only. With `vo.*` every cut,
caption, pin and arrival follows the spoken words; the story's sentences must be the VO's words in the VO's order.

## The script pattern

One sentence = one shot = one cut. "**Kalau kamu …, kamu udah punya …**" (the simplest version of the thing) →
"**Tapi …**" (what goes wrong: show it happening) → "**Jadi kamu …**" (the fix: a new part arrives and is named with
a pin) → repeat Tapi / Jadi until the thing is complete → one line for the result and one inviting line. Sentences of
6–13 words; say a technical term in the sentence where the part appears.

## story.json

```json
{ "id": "pondasi", "title": "Pondasi", "domain": "rumah",
  "start": ["gubuk", "rangka-bambu:reng=0"],
  "lines": [
    { "text": "Paritnya kamu isi batu kali, bentuknya melebar ke bawah.",
      "build": [{ "part": "batu-kali", "at": 0.06, "over": 0.5 }],
      "shot": "section", "side": "right", "focus": "batu-kali",
      "mark": [{ "use": "batu-kali.trapesium", "at": "melebar" }],
      "pin": [{ "text": "Batu kali", "on": "batu-kali.badan", "at": "batu" }] } ] }
```

The state of the build **accumulates**: a part stays in the following shots until it is removed or replaced.

| Field | Meaning |
|---|---|
| `text` | The sentence exactly as spoken. |
| `start` (top level) | Parts present before the first shot. |
| `add` / `remove` / `only` | State changes **at the cut**. `only: []` clears everything. |
| `build` | Parts that **arrive during the shot**. `at` = when it starts, `over` = how long (fraction of the shot), `from` = already this far built (0…1) when the shot starts. |
| `set` | Parameter change: `{ "what": "rumbia.rot", "to": 1, "at": 0.2, "over": 0.6 }`; without `at` / `over` it jumps at the cut. Globals as `"g.slope"`. The end value carries into the next shots. |
| `focus` | What the camera frames: `"part"`, `"part.anchor"` or a list. Default: the parts being built, else the whole subject. |
| `shot` | `wide` (¾ view, the cut ground in frame) · `front` · `gable` (from the end) · `close` · `high` (¾ from above) · `top` (ridge) · `low` (from below) · `section` (straight at the cut) · `detail` (very close on one anchor) · `ground` (things on the ground). |
| `side` / `move` | `left` / `right` (default alternates) · `push` (default), `pull` (closing shot), `still`. |
| `weather` | `rain`; the next shot clears by itself unless it says `rain` again. |
| `worker` | `"cetak"` (stands at the focus part's work spot) or `{ "do": "lihat", "at": [x, z], "face": radians }`. |
| `pin` | A term pinned to a thing: `{ "text", "on": "part.anchor", "at" }` (flips side by itself near the frame edge). |
| `mark` | A ready-made white annotation of a part: `{ "use": "part.mark", "at" }` (flow arrows, load paths, outlines…). |
| `tag` | A short word or number without a leader: `{ "text": "30°", "on": "part.anchor", "at" }`. |
| `then` | More shots **inside the same sentence**, each starting at a word: `"then": [{ "at": "terus", … }]`. |
| `same` | `true`: no cut — the previous shot keeps running under this sentence (closing line). |
| `cam` | Escape hatch: exact camera `{ "from": { "pos", "target", "fov" }, "to": {…} }`. |

**Time (`at`)**: a word of the sentence (`"gording"` → when it is spoken; a part built `at` a word lands on that
word) or a fraction of the shot (`0.2`). **Part references**: `"name"`, `"name:param=1,other=0"`, `"name#2:x=3"` for
a second copy. Parts sharing a *slot* replace each other (tiles replace thatch; the truss replaces the bamboo frame).

`--plan` warns about unknown parts / parameters / anchors / marks, a word that is not spoken in that shot, and shots
under 1.2 s. Fix every warning before rendering.

## When the topic needs things that do not exist yet: add parts

The kit is not a warehouse of every object. Domain `rumah` has the roof parts and the foundation parts; another topic
(a well, a wall, a road, a bridge…) needs its own parts. `src/domains/rumah/pondasi.ts` + `pondasi.view.tsx` are the
pattern (4 parts ≈ 150 lines):

1. **Data** (`*.ts`, pure — no React): `about`, `params`, `box` (the volume the camera frames), `anchors` (points for
   pins / tags / focus), `marks` (annotation polylines in 3D with a style: `arrow` `line` `dash` `outline`
   `dashloop`), `build` (seconds of a natural arrival), `sound` (`wood` / `clay` / `soft`), `slot`, `work` (worker
   spot), `scenery`.
2. **Picture** (`*.view.tsx`): a component of `{ e, p, g, t }` — `e` = arrival 0…1 (**must grow from nothing**:
   rises, fills, lands, unrolls; never appears at full size), `p` = parameters now, `g` = globals now, `t` = film
   time. Use `tex.ts` + `mat()` and metre-UV geometry (`boxUV`, `planeUV`, `Beam`, `Culm`).
3. Merge both into the domain (`...PONDASI` in `meta.ts`, `...PONDASI_VIEW` in `view.tsx`). A different world →
   a new domain: `src/domains/<name>/meta.ts` + `view.tsx` (exports `PARTS`, `World`, `Weather`), registered in
   `src/domains/index.ts` and `views.tsx`.

Rules every new part keeps:
- **No interpenetration.** Things that sit on each other get real clearances; compute the stack (see `UNDER` in
  `roofmath.ts`). A deforming part keeps its supports fixed.
- **No flicker.** Parallel surfaces ≥ 2 cm apart; anything crossing the cut ends ≈ 6 mm proud of the cut face;
  box geometry always through `boxUV` (default 0…1 UVs squeeze a tiling texture into moiré); dense patterns keep
  their relief in the normal map, not as high-contrast albedo; no see-through striped alpha; no fast sine on
  emissives.
- **No pops.** Every arrival goes through `e`.
- Everything is a pure function of `{ e, p, g, t }` (no `useFrame`, clocks or unseeded randomness).
- After a render read `out/<id>/flicker/_all.jpg`: red in rain, on landing parts and under a `pull` camera is
  expected; a red blob on something that stands still is a bug.

## Things that cost time in testing
- **A hole in the ground** (a well, a pit, a pond): the domain's world is static, so a part cannot carve it. Either
  draw it on the cut face and as a dark mouth on the ground (the `galian` trench of `pondasi`), or — for a deep
  thing on the cut line — make a new domain whose `World` is its own ground with the notch built in.
- **A part with `e` = 0 is not drawn at all.** If the first frame of a shot must already show something of a part
  being built (a plug, the first ring), build it with a small `from` (e.g. `"from": 0.002`).
- **Tall or deep narrow subjects** (several metres below ground): `wide` frames them too tightly. Use `section`,
  give `focus` a larger box (a list of parts), or set the camera with `cam` for that shot.
- **Opaque beats transparent**: water, glass and smoke as see-through surfaces flicker against the cut and confuse
  the ambient-occlusion pass; an opaque tinted surface plus a flat patch on the cut face reads better.

## Check the kit on a new machine

`npm ci`, `npm run check-env`, then `npm run smoke` — plans the `pondasi` example and renders four stills to
`out/pondasi/stills/_sheet.jpg` (a brick wall with the worker, a trench in the cut ground, the stone footing with
its outline and pin, the finished wall on its ground beam with load arrows). Look at it before the first film.

Details: [references/bedah.md](../../references/bedah.md) (workflow, rules, limits, QA).

## QA gate

`scripts/make.mjs` runs the shared QA gate (`scripts/qa-gate.mjs` → `qa-scene.mjs` + `qa-video.mjs`, copied into every
project by `new-project.mjs`; see `references/quality-gates.md` › QA gate): after `--preview` as a report, before
`--final` as a stop (`--force-qa` / `--no-qa` exist for the user's explicit say-so only), then a hard scan of the delivered
file. Results in `out/<id>/qa-gate/` (`-wide` for 16:9). Tagged with `<Solid>` in this kit: the worker and the build (as one set: its parts may overlap each other). Tag anything you
add the same way.
