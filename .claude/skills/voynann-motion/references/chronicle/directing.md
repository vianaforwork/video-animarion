# Directing a CHRONICLE film (writing the naskah)

The engine directs shots, light, sound and text from the naskah — your job is the story, the facts and the tags.

## Shape of a good film (45–90 s ≈ 110–230 spoken words)
1. **Hook (1–2 sentences):** a mystery or a contrast told on a place — "Di Makassar, ada makam seorang pangeran dari
   Jawa. Bagaimana ia bisa dimakamkan sejauh ini?" A grave, a ruin, a map pin, a date.
2. **Context (map):** where and when — a `[PETA]` with a `[TANGGAL]`.
3. **Turns (2–5 scenes):** each a place with people doing one clear thing (flee, kneel, negotiate, write, march),
   alternating with maps for journeys and jumps in time (`[RUTE]`, a new `[TANGGAL]`).
4. **Weight:** one striking number (`[ANGKA]`) and one cited sentence (`[SUMBER]`) — not more per scene.
5. **Answer + close:** return to the hook's place or map, answer the question, then `[PENUTUP]` with the sources (and
   a "Bersambung — …" title when it is a series).

## Sentences
- One sentence per line, 6–14 words, said in ~2–5 s. Short sentences make cuts; a long sentence holds a shot.
- Put names and years where they are said; keywords (`*…*`) on the word the viewer must remember.
- Write numbers as digits in the naskah (`1825`, `200.000`); the voice text spells them out (see below).
- A scene of 2–3 sentences is ideal; more than 4 sentences in one place → split it with a map or a second place.

## Choosing places and people
- Pick the set by keyword (story-format.md). Say the time of day — it decides the light: dusk and fire for drama,
  misty morning for marches and journeys, night + candle for loneliness and exile, interior day for meetings.
- Every scene needs one lead the camera can hold: a single named person, optionally with a colour. Give groups a verb
  that matches the sentence (`lari` when they flee, `berbaris` when they gather, `berdoa` at a grave).
- Colours keep one meaning for the whole film: amber = the protagonist, crimson = the enemy, violet = victims / the
  dead, cyan = allies, ivory = a neutral named figure. Two or three contoured figures per scene at most.
- Two single people (`1 X …, 1 Y …`) face each other: use it for negotiations, arrests, betrayals.
- A burning village (`desa terbakar, malam`) for attacks, a forest in fog for guerrilla years, a hall for treaties and
  arrests, a small room with a candle for prison and exile, a harbour or deck for departures, a fort for colonial
  power, an open field / camp for armies, a grave for the beginning and the end.

## Maps
- One map every 2–3 scenes keeps the viewer oriented. `[PETA] X` for "where", `[RUTE] A → B → C` for journeys and
  exiles, rings for something heard or felt far away, `meletus` for eruptions.
- Maps stay north-up; the whole film shares one map region (all map places of the film + margin), so very distant
  places in one film make every map wide and small.

## Facts and sources (non-negotiable)
- Check every date, number, name and quote in at least one reliable source (academic books and articles, archives,
  museum or government heritage pages; Wikipedia only as a pointer to its sources). Prefer the source you cite.
- Write what the sources support: "sekitar 200.000", "menurut catatan Belanda", "menurut legenda". Never turn a guess
  into a fact, never add dialogue to real people.
- `[SUMBER]` inside a scene = a short paraphrase on screen + the source; under `[PENUTUP]` = the full list
  (`Author (year), Title; …`).
- Sensitive history (wars, religion, ethnic conflict, colonial violence): neutral wording, both sides' sources when
  contested, no gore, no mockery.

## The voice text (when the buyer generates the VO)
Give the buyer the narration only (no tags), the same sentence order, numbers as words ("seribu delapan ratus dua
puluh lima"), and — for ElevenLabs v3 — expression tags before sentences (`[calm]`, `[serious]`, `[curious]`, `[tense]`,
`[dramatic]`, `[sad]`, `[somber]`, `[whispers]`, `[sighs]`, `[short pause]`, `[pause]`, `[long pause]`), "…" for a held beat
and CAPS for one stressed word. These tags work only on the v3 model (Multilingual v2 reads them aloud). Suggest a deep,
calm documentary voice, Stability "Natural". Example: `stories/diponegoro/VO-elevenlabs-v3-ekspresi.txt`.

## Rhythm the engine adds (so you don't have to)
- A camera beat per sentence; hard cuts between beats and scenes; slow dolly and handheld drift inside a beat.
- Captions word by word; date / name / counter / citation layout that never stacks; music cue per scene, a gong on
  dates, a whoosh on cuts, ambience per place; the end card holds to the last frame.
