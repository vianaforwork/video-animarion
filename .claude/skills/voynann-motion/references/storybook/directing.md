# Directing a STORYBOOK book

## Pages
- One page = one moment the eye can take in: a place, one to three characters, one action. 4–8 pages for a 30–70 s
  book; 1–3 short sentences (≤ ~25 words) per page — the text is printed under the picture and must fit.
- Read the buyer's text and cut it where the picture changes (a new place, a new time, someone arrives, a feeling
  turns). Never cut inside a sentence; never move sentences between pages out of order.
- Write each `[HALAMAN]` tag from what the sentences show: time + place + the props the text names + every character
  on the page with its verb. If a sentence says it ("hujan turun", "pelangi muncul", "bintang jatuh"), put it in the tag.
- The cast is declared once (`TOKOH:`), and the same look is used on every page — describe colours that tell
  characters apart (a yellow shirt and a blue dress, not two blue outfits).

## Rhythm and variety
- Alternate places or times when the story allows (garden → rain → bedroom → rainbow → night); avoid two consecutive
  pages with the same place, time and action.
- Give every page a visible change: someone walks in, falls, jumps, peeks, hugs, starts crying, falls asleep.
- A page with three or more characters keeps the camera on the whole page (no close-up); one or two characters get a
  close-up on the picture in the middle of the page.
- The cover shows the lead (and a friend) on the story's mood (`[SAMPUL] malam, bukit, bulan. Nara melambai, Bintang.`).
- End softly: a hug, a sleep, a home-coming; `[PENUTUP] Tamat` or `[PENUTUP] Selamat tidur.`

## Writing an original story (idea only)
- Simple words, present the problem early (page 2), let the child character solve it with kindness or courage, end
  warm. Names that are easy to say (Nara, Raka, Mimi, Dodo).
- Indonesian for children: short sentences, a little repetition ("tinggi, tinggi sekali"), a quoted line now and then
  ("Aku mau pulang," bisiknya).
- Retold folk tales are fine (say "diceritakan kembali"); never use copyrighted or brand characters.

## The narration
- The VO reads the cover lines, then every page's lines in order — nothing else (no "halaman satu", no tags).
- For a VO the buyer generates: give `VO-elevenlabs.txt` with all lines in order and numbers written as words; for
  ElevenLabs v3 an expressive copy with tags such as `[softly]`, `[warmly]`, `[curious]`, `[whispers]`, `[pause]`,
  `[long pause]` between pages (tags are not part of the naskah).
- A calm storyteller voice, unhurried; pauses between pages are added by the director anyway.

## Example
`stories/mimi/naskah.txt` (rain, umbrella, a cat, a bedroom, a rainbow) and `stories/bintang/naskah.txt` (a star falls
past a lit window, cries, is sent home with a kite) show every feature. Never copy them into unrelated books.
