# CHRONICLE kit — 3D silhouette history documentaries from a script (naskah) + voice-over

`node SKILL_DIR/new-project.mjs [folder] --kit=chronicle` sets up a project of its own: it copies
`kits/chronicle/project/` (not `starter/`) into the folder and marks it with `voynann-kit.json`. A CHRONICLE project
never shares a folder with another style's kit — its director, scripts and Root are its own (the `src/core` library is
the same as the starter's). Node ≥ 22.18 (the scripts import the TypeScript director directly).

| Folder (in the project) | Content |
|---|---|
| `src/director/` | `parse.ts` (naskah → scenes, tags, lines), `gazetteer.ts` (≈180 places + the volcanoes drawn on maps), `plan.ts` (timing, set / mood / effect rules, cast grammar, camera beats, overlays, one relief region per film), `types.ts` |
| `src/film/` | `ChronicleFilm.tsx` (generic renderer, overlay layout, end card), `PlaceScene.tsx`, `MapScene.tsx` (close / fit / sound rings / route-follow camera), `sets.tsx` (10 sets with anchors), `stage.ts` (stager + camera grammar), `fxextra.tsx` (flames, light shafts, candle) |
| `src/kits/chronicle/` | `Figure.tsx` (posable silhouette people, costumes, poses, gait), `outline.ts` (contour pass), `Stage.tsx` + `looks.ts` (light, fog, sky, grade; 9 moods), `relief.ts` + `Relief.tsx` (3D relief map from coastlines, volcano collapse, rings), `fx.tsx` (ash column, embers, lightning, birds), `props.tsx` (water, fort, ships, stilt houses, palms, volcano…), `Overlay.tsx` (captions, date stamp, name tag, counter, citation, map pins, route line), `cam.ts` |
| `src/data/map-nusantara.json` | Natural Earth land outlines (public domain), lon 86–160 / lat −48–48, 10 m detail for East Java – Sumbawa |
| `stories/` | two example stories: `diponegoro` (9 scenes, Java War) and `tambora` (5 scenes, 1815 eruption): `naskah.txt` + the texts their voice-overs were generated from (`VO-elevenlabs*.txt`); no recordings |
| `scripts/` | `make.mjs` (naskah + VO → plan → score/SFX → stills / preview / final → QA), `sound.mjs` (original synthesised score + SFX, ducking, −14 LUFS mix), `qa.mjs` (11 checks + contact sheets + REVIEW.md), `stills.mjs`, `check-env.mjs`, `gl.mjs` |
| `FORMAT-NASKAH.md` | the buyer's script guide (Indonesian) |

## Commands

```
node scripts/make.mjs <id> --plan                 # stories/<id>/naskah.txt → out/<id>/plan.json (+ warnings)
node scripts/make.mjs <id> --stills 3s,12s,25s    # → out/<id>/stills/_sheet.jpg (no voice needed)
node scripts/make.mjs <id> --preview              # 540×960 @ 30 with voice + score
node scripts/make.mjs <id> --final                # 1080×1920 @ 60, −14 LUFS, then scripts/qa.mjs → out/<id>/qa/
#   --wide (only when the buyer asks for landscape): 16:9 — stills-wide/, <id>_preview_960x540.mp4,
#   <id>_1920x1080_60fps.mp4, qa-wide/ (comps ChroniclePreviewWide / ChronicleFinalWide)
#   voice: stories/<id>/vo.mp3|wav|m4a  ·  --tts (macOS Damayanti, only after approval)  ·  --silent  ·  --no-music
```

Word timings: whisper.cpp when installed (`WHISPER_CLI` / `WHISPER_MODEL`, `whisper-cli` on PATH, Homebrew), then
every word is re-seated on the VO's speech runs (whisper squeezes expressive pauses; words stay within ~0.2 s);
without whisper the script lines are laid onto the VO's speech runs (line starts usually within ±0.5 s, words paced).
Either way the naskah text must be the VO's words in the VO's order.

Details: [references/chronicle.md](../../references/chronicle.md) (workflow) and `references/chronicle/` (story format,
directing, limits, QA).

## Check the kit on a new machine

`npm ci`, `npm run check-env`, then `npm run smoke` — plans the `diponegoro` example and renders four stills to
`out/smoke/_sheet.jpg` (a grave at dusk, a burning village, a misty forest, a lit hall — with a narrated plan the seconds shift). Look at it before
the first film. `npm run look:cast` renders the silhouette cast with its contour colours.

## Extending (development work, only when the buyer asks)

A missing **place** for maps is one line in `src/director/gazetteer.ts` (name, lon, lat) — allowed per film, with
coordinates checked against a reliable source. A new set, costume, pose or mood is engine work: edit `src/film/` or
`src/kits/chronicle/`, run `npx tsc --noEmit`, then re-plan and re-render the two example stories' stills and look at
them. Per film, write data only.

## QA gate

`scripts/make.mjs` runs the shared QA gate (`scripts/qa-gate.mjs` → `qa-scene.mjs` + `qa-video.mjs`, copied into every
project by `new-project.mjs`; see `references/quality-gates.md` › QA gate): after `--preview` as a report, before
`--final` as a stop (`--force-qa` / `--no-qa` exist for the user's explicit say-so only), then a hard scan of the delivered
file. Results in `out/<id>/qa-gate/` (`-wide` for 16:9). Tagged with `<Solid>` in this kit: every figure (silhouette). Tag anything you
add the same way.
