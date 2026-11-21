# Checking a CHRONICLE film

## Gate 1 — the plan (`--plan`)
Read every printed scene: is the set the place the sentence talks about, the mood the right time of day, the cast the
right people with the right verb, the map showing the right places? Fix every warning (`ANGKA tidak terbaca`, map
without known places, scene without TOKOH). A missing place → gazetteer line.

## Gate 2 — stills (`--stills <seconds>`, up to 3 rounds)
Pick 8–12 seconds: the middle of every scene and every camera change (`--plan` prints scene times; one beat per
sentence). Look at `out/<id>/stills/_sheet.jpg` tile by tile:
- **Story:** does each frame show what the voice says at that second (the right place, the right people doing it)?
- **Silhouettes read:** the lead is a clean black shape against light — not merged into a dark wall, tree or another
  figure; contours only on the named roles, one meaning per colour; nobody's head or the lead cut by the frame edge in
  a key shot; no figure inside a wall, table or another figure.
- **Camera:** close / low shots show the lead, not an empty corner; wide shots show the place; consecutive beats differ.
- **Maps:** the places of the sentence are inside the frame, pins and labels readable and not cut by the edge, route
  and rings visible; nothing outside the land data visible as a straight edge.
- **Text:** date, name, counter, citation readable, never over the lead's head; captions below, never cut.
- **Light:** no blown-out frame (a doorway or sky may glow, the people must not dissolve in it), no black frame.
Fix by editing the naskah (set keywords, time of day, verbs, counts, colours, splitting a scene, moving a tag) and run
`--stills` again.

## Gate 3 — final (`--final`)
`node scripts/make.mjs <id> --final` (foreground, longest timeout) renders, then `scripts/qa.mjs` runs 11 checks:
1080×1920 (with `--wide`: 1920×1080, report in `out/<id>/qa-wide/`) · 60 fps · duration = plan · audio stream · −14 ±1.5 LUFS · true peak ≤ −1 dBTP · no black frames before the
end card · no white frames · no flicker / pops outside planned cuts (frame-difference scan) · every caption word timed in
order · plan without warnings. Output: `out/<id>/qa/report.json`, `sheet_01.jpg …` (one frame per second, 24 per page,
left→right, top→bottom) and `REVIEW.md`.

Then open `REVIEW.md`, look at **every** contact-sheet page and at the film around every scene cut, fill every row
(OK / FIX + what you saw) and set `STATUS: PASS` only when nothing you saw is unfixed. A flicker spike, a lost lead or a
cut label is never "just a transition". `node scripts/qa.mjs <id>` re-runs the checks on an existing final.
