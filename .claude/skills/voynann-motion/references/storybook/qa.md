# Checking a STORYBOOK film

## Gate 1 — the plan (`--plan`)
Read every printed page: place / time, props, and `name:action` for each character. Is that what the page's text says?
Fix every warning (undeclared character, VO line count ≠ naskah line count, no pages, too many pages).

## Gate 2 — stills (`--stills <seconds>`, up to 3 rounds)
Pick the cover (≈ 1.5 s) and one moment per page — the middle of each page (`--plan` prints page times). Look at
`out/<id>/stills/_sheet.jpg` tile by tile:
- **Story:** the picture shows the text printed under it (the right place, time, characters and action).
- **Cast:** every named character is there, recognisable, the same look as on other pages; nobody cut by the panel
  edge, hidden behind a bush, floating above the ground or sunk into it; a peeking face is inside the window, a sleeper
  lies on the bed under the blanket.
- **Paper:** nothing pokes through the page, no hole in a cut-out, no z-fighting blotch; text sharp and not covered.
- **Camera:** a close-up shows the action, never half a printed line (a moving frame between full page and close-up is
  fine); the cover shows the title fully.
Fix by editing the naskah (place / time / props words, verbs, splitting a page, fewer characters on a page) and run
`--stills` again.

For a 16:9 book add `--wide` → `out/<id>/stills-wide/_sheet.jpg`. Also check: the whole spread is in the frame when
the camera is back (no page or cover edge cut, only table around it); the left page's text is complete, large and
inside the page (first spread: title, dedication and text do not collide); the picture sits in the middle of the
right page; a close-up shows only the picture (no half line of the left page, no page margin).

## Gate 3 — final (`--final`)
`node scripts/book-make.mjs <id> --final` (foreground, longest timeout) renders, then `scripts/book-qa.mjs` runs:
1080×1920 · 60 fps · duration = plan · audio stream · −14 ±1.5 LUFS · true peak ≤ −1 dBTP · no black frames before the
lamp dims · no white frames · no flicker / pops (a STORYBOOK film has no cuts: any frame-difference spike is a bug) ·
every page has text · every page turn falls between lines · plan without warnings. Output: `out/<id>/qa/report.json`,
`sheet_01.jpg …` (one frame per second, 24 per page) and `REVIEW.md`.

Open `REVIEW.md`, look at **every** contact-sheet page and at the film around every page turn, fill every row (OK / FIX +
what you saw), and set `STATUS: PASS` only when nothing you saw is unfixed. `node scripts/book-qa.mjs <id>` re-runs the
checks on an existing final.

`--final --wide` → `out/<id>/<id>_1920x1080_60fps.mp4`, checked at 1920×1080, report in `out/<id>/qa-wide/`
(`node scripts/book-qa.mjs <id> --wide` re-runs it). Same checks otherwise; fill that REVIEW.md too.
