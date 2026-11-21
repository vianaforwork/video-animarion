# STORYBOOK kit — a picture-book script told as a real paper storybook on a table

`node SKILL_DIR/new-project.mjs [folder] --kit=storybook` sets up a project of its own: it copies
`kits/storybook/project/` (not `starter/`) into the folder and marks it with `voynann-kit.json`. A STORYBOOK project
never shares a folder with another style's kit — its director, scripts and Root are its own (the `src/core` library is
the same as the starter's). Node ≥ 22.18 (the scripts import the TypeScript director directly).

| Folder (in the project) | Content |
|---|---|
| `src/director/book.ts` | the naskah parser (header, `TOKOH:` cast lines, `[SAMPUL]`, `[HALAMAN]`, `[PENUTUP]`), cast looks from plain Indonesian descriptions, page specs (place, time, props, who does what), and the planner (cover → opening → one page turn per page, VO lines kept whole and moved apart so turns fall into pauses) |
| `src/film/` | `BookFilm.tsx` (the book on the table, cover art, title page, printed text, the camera over the pages, the lamp dimming at the end), `PageArt.tsx` (a page from its spec: background per place and time, props, every actor's action) |
| `src/kits/storybook/` | the paper engine: `Book.tsx` (hardcover, page curl turns, page blocks), `bend.ts` (analytic page bend shared by every cut-out on a leaf), `Sheet.tsx` + `paint.ts` (painted cut-paper: wash / crayon / gouache, scissor edges, holes), `Person.tsx` (paper puppet: child / adult / elder, 8 hair styles incl. hijab and peci, 5 outfits), `Critter.tsx` (cat, rabbit, dog, bird, duck, fish, butterfly, living star), `library.tsx` (skies, sun / moon / stars / clouds / rainbow / rain, hills, sea, sand, mountains, fields, river, trees, palms, pines, bushes, flowers, houses, village, school, city, bedroom, bed, lamp, boat, kite, balloon, lantern, gift, book, umbrella, Zzz, sparkle), `Puppet.tsx` (brass pins + the prototype's Kid), `Stage.tsx` (reading lamp + grade), `fonts.ts` |
| `stories/` | two example books: `bintang` (night, falling star, peeking, kite, flying) and `mimi` (rain, umbrella, cat, bedroom, rainbow): `naskah.txt` + `VO-elevenlabs.txt` (the narration text); no recordings |
| `scripts/` | `book-make.mjs` (naskah + VO → plan → sound → stills / preview / final → QA), `book-sound.mjs` (VO placement + original music-box lullaby, paper and story sounds, −14 LUFS), `book-qa.mjs` (automated checks + contact sheets + REVIEW.md), `stills.mjs`, `check-env.mjs`, `gl.mjs` |
| `FORMAT-NASKAH-BUKU.md` | the buyer's script guide (Indonesian) |

## Commands

```
node scripts/book-make.mjs <id> --plan                 # stories/<id>/naskah.txt → out/<id>/plan.json (+ warnings)
node scripts/book-make.mjs <id> --stills 1.5s,6s,13s   # → out/<id>/stills/_sheet.jpg (no voice needed)
node scripts/book-make.mjs <id> --preview              # 540×960 @ 30 with narration + sound
node scripts/book-make.mjs <id> --final                # 1080×1920 @ 60, −14 LUFS, then book-qa → out/<id>/qa/
#   voice: stories/<id>/vo.mp3|wav|m4a  ·  --tts (macOS Damayanti, only after approval)
#   --wide with --stills / --preview / --final: the same book in 16:9 →
#     out/<id>/stills-wide/ · <id>_preview_960x540.mp4 · <id>_1920x1080_60fps.mp4 + out/<id>/qa-wide/
```

**16:9 (`--wide`, opt-in; 9:16 stays the default).** The same naskah, plan, timing and sound — nothing is written
twice. `BookFilm.tsx` stages the book for the wide frame (compositions `BookPreviewWide` / `BookFinalWide`): the open
book is read as a two-page spread — the page's text is printed large on the left page (on the first spread under the
title, author and dedication), the picture sits in the middle of the right page — the camera pulls back for the cover
opening and every page turn, and a page whose action fits a 16:9 frame (one or two characters on the ground, a flier
in the sky, a swimmer, a sleeper) gets a close-up inside the picture; other pages get a slow push on the spread.
`node scripts/book-qa.mjs <id> --wide` re-runs the checks on an existing 16:9 final.

Line timings: whisper.cpp when installed (`WHISPER_CLI` / `WHISPER_MODEL`, `whisper-cli` on PATH, Homebrew), snapped
to the real speech runs; without whisper the narration is cut at its pauses (sentence boundaries chosen by length).
Either way the narration must read the naskah's lines in order (cover lines first).

Details: [references/storybook.md](../../references/storybook.md) (workflow) and `references/storybook/` (story
format, directing, limits, QA).

## Check the kit on a new machine

`npm ci`, `npm run check-env`, then `npm run smoke` — plans the `bintang` example and renders four stills to
`out/smoke/_sheet.jpg` (the closed cover, the star falling past the lit window, the crying star, the kite). Look at it
before the first film.

## Extending (development work, only when the buyer asks)

A new place, prop, animal or action is engine work in `src/kits/storybook/library.tsx`, `Critter.tsx`, `Person.tsx`
or `src/film/PageArt.tsx` (+ its keyword in `src/director/book.ts`): run `npx tsc --noEmit`, then re-render both
examples' stills and look at them. Rules that keep the paper honest: sheet shapes are cached per id (animate with
x / y / rot / scale, never by changing a shape), never toggle a cut-out's visibility on a visible page except the
face parts, keep a puppet's z ≥ 0.1 below anything it stands behind, and only fronts of leaves carry cut-outs
(the left page is printed paper). Per book, write data only (`stories/<id>/`).

## QA gate

`scripts/book-make.mjs` runs the shared QA gate (`scripts/qa-gate.mjs` → `qa-scene.mjs` + `qa-video.mjs`, copied into every
project by `new-project.mjs`; see `references/quality-gates.md` › QA gate): after `--preview` as a report, before
`--final` as a stop (`--force-qa` / `--no-qa` exist for the user's explicit say-so only), then a hard scan of the delivered
file. Results in `out/<id>/qa-gate/` (`-wide` for 16:9). Tagged with `<Solid>` in this kit: nothing — paper puppets move in stepped poses by design and pages hide each other, so the scan of the 3D alone (blinks, pops, z-fights, shimmer) is the check here. Tag anything you
add the same way.
