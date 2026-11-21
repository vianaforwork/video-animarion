# CHRONICLE limits (say kindly when a wish is outside them, offer the closest thing)

- **People:** simple posable silhouettes — no faces, no lip-sync, no hands with fingers; poses from the verb list only
  (stand, hands on hips, point, telescope, pray, bow, kneel, sit, write, guard, rows, raise a fist / weapon, talk,
  look, carry, walk, run). No sword fights or battle choreography (use a camp at night, a burning village, raised
  weapons, a counter of the fallen), no horses, carts or riders, no swimming, no climbing.
- **Groups:** up to 40 per group (performance); crowds read as rows or a running stream; one lead per scene.
- **Places:** the 10 sets in story-format.md, each with fixed props (they are lit and staged for silhouettes). A
  different building (mosque, temple, palace façade, market, rice terraces) is approximated by the nearest set and
  named in text; building a new set is development work.
- **Weather / effects:** fire, smoke, embers, eruption + ash + volcanic lightning, fog, candle, light shafts, birds.
  No rain or storm drawn (only implied by sound and words), no snow, no explosions beyond fire and ash.
- **Ships:** European-style square-rigged ships (no junk, pinisi or galley models); they stand in the harbour / on the
  horizon and the deck rocks gently; journeys by sea are shown as map routes, not as sailing fleets. For non-European
  ships prefer the deck at dusk / night (the hull is barely seen) over the harbour set.
- **Buildings:** no temple, mosque, cave or palace façade set — use the hall interior (pillars, bright doorway), the
  forest / hills or the fort wall and name the real place in a `[NAMA]` tag.
- **Maps:** real coastlines for lon 86–160, lat −48–48 (Southeast Asia, Indonesia, the Philippines, northern
  Australia); no Europe, Middle East or Americas; each map scene builds its own relief region around its places (far-apart places → separate map scenes read better than one huge map); place names only from the gazetteer (add a
  line for a missing one); relief is stylised (volcano list + procedural hills), not survey data; borders are not drawn.
- **Text:** Indonesian; captions + date / name / counter / citation + end card. No subtitles file. Real people are named
  in text, never shown as likenesses.
- **Voice:** the buyer's VO, or a temporary macOS voice (Damayanti) only after approval; no new voices or dialogue.
  Word timing is within ~0.2 s with whisper.cpp, approximate (line starts usually within ±0.5 s) without it.
- **Sound:** an original synthesised score and effects; no licensed music, no vocals.
- **Format:** 9:16, 1080×1920 @ 60 fps (preview 540×960 @ 30) by default. Landscape 16:9, 1920×1080 @ 60 (preview
  960×540) only when the buyer asks: `--wide`. No square or 4:5.
- **Platform:** tested on macOS Apple Silicon with Node 24; Node ≥ 22.18 required; `--tts` needs macOS.
