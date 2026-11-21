# Requirements — onah

VO 0–45.76 s · 17 sentences · 4 suggested scenes · time: **night** · place: **office**

## Time of day

- 13.92s “malam” → night
- 37.03s “malam itu” → night

## Location

- main: **office** (street 0.4, office 2)
- area: kota (street, first at 8.15s)
- area: kantor (office, first at 21.55s)

## World

- office: **reuse-or-adapt** — worlds/kantor.world.json

Ready-made worlds in this project (reuse or adapt a copy before writing a new one; `node scripts/worlds.mjs <id>` lists places, marks, seats and props):

- `kos` — built-in world 'kos' (boarding house: room, corridor, stairs, yard)
- `coast` — built-in world 'coast' (lighthouse, beach, sea)
- `kantor` (worlds/kantor.world.json) — an open-plan office on the 11th floor of a city tower: four rows of workstations, one main desk with a monitor and a laptop near the east end, a printer/copier corner with a wall clock and a CCTV monitor, a CCTV camera high on the north wall, big north windows onto the city, a meeting room with a whiteboard behind a glass door on the east wall, the lift door in the south wall
- `minimarket` (worlds/minimarket.world.json) — a city minimarket: a bright shop room with a checkout counter, QRIS standee and gondola shelves of goods; outside a pavement, a street and shop façades across the road.
- `perpustakaan` (worlds/perpustakaan.world.json) — a small one-room library building in a city park: reading room with shelves, tables and windows; outside a lawn, a gravel path, benches, trees and lamp posts
- `rumah` (worlds/rumah.world.json) — an Indonesian family house: a living room (sofa, coffee table, TV, family photos, front door), a kitchen with a dining table, a small bedroom (bed, wardrobe, desk), a long back corridor with an old wardrobe at its end, and the front terrace with a small yard, a gate and the neighbours' houses across the lane
- `sekolah` (worlds/sekolah.world.json) — an Indonesian school: a classroom (blackboard, teacher's desk, three rows of school desks, windows, lockers), the open veranda corridor outside its door with the notice board (mading), and the school field with the flagpole and the other class blocks around it

## Characters

- **Jakarta** — protagonist — 1 mentions from 3.29s
- **Rina** (teman) — 1 mentions from 14.93s
- **Arga** (mas) — 1 mentions from 23.21s

## Objects (story objects first)

| word | needs | status | story object | note |
|---|---|---|---|---|
| tas (5.56s, ×1) | bag | **generate** |  | no library object for "bag" — build from primitives into assets/objects/<id>.json, check it on the object sheet |
| pintu (38.11s, ×1) | door | **world** |  | made by the world DSL (door) |

## Implied by the place (office) — dress the set, the script does not name them

- office desks with monitors / computers
- office chairs
- ceiling panel lights
- a printer / copier corner
- filing cabinets
- windows with the city outside

## Unlisted things (not in the lexicon — decide: build, world, or ignore)

- 8.51s **sebesar** — “di kota sebesar ini”
- 11.74s **mana** — “mulai dari mana Sampai”
- 41.34s **tempat** — “diam di tempat Dan”

## Interactions — acted on screen

- 1.9s “datang” → **Jakarta: walk**
- 15.33s “menawarkan” → **Rina: talk**
- 22.54s “bertemu” → **Rina: look** Arga
- 34.11s “pikir” → **Arga: think**

## Verbs the lexicon does not know (decide: an action, a state, a face, or nothing)

- 4.51s **membawa** — “Aku datang dari Bandung ke Jakarta, membawa satu tas dan banyak mimpi.”
- 24.56s **mengajariku** — “Dia yang mengajariku semuanya: cara tersenyum, cara menemani tamu, cara bertahan.”
- 27.79s **menemani** — “Dia yang mengajariku semuanya: cara tersenyum, cara menemani tamu, cara bertahan.”
- 29.72s **bertahan** — “Dia yang mengajariku semuanya: cara tersenyum, cara menemani tamu, cara bertahan.”
- 35.48s **berubah** — “Aku pikir hidupku akhirnya berubah.”

## Not acted (do NOT stage these as actions)

- none

## State changes (set props / object states on these words)

- none

## Dialogue and written text

- 17.61s said by **Rina**: “Jadi LC aja, Nah. Gajinya lumayan.” → a `talk` beat
- 39.64s said by **?**: “Polisi! Semua diam di tempat!” → a `talk` beat

## Sounds

- none

## Emotions

- 26.79s “tersenyum” → face smile (Arga)

## Looks

- Jakarta: ? (choose)
- Rina: pemuda (reuse)
- Arga: pemuda (reuse)

## Scenes (cue → text)

- **0s "Namaku"** (start): Namaku Onah. Aku datang dari Bandung ke Jakarta, membawa satu tas dan banyak mimpi.
- **7.6s "Tapi"** (turn word “Tapi” after a 0.78s pause): Tapi di kota sebesar ini… aku nggak tahu harus mulai dari mana. Sampai suatu malam, temanku Rina menawarkan pekerjaan. "Jadi LC aja, Nah. Gajinya lumayan."
- **21.38s "Di"** (pause 0.81s before it): Di kantor itu aku bertemu Mas Arga. Dia yang mengajariku semuanya: cara tersenyum, cara menemani tamu, cara bertahan. Pelan-pelan aku mulai terbiasa. Aku pikir hidupku akhirnya berubah. Sampai malam itu. Pintu didobrak. "Polisi! Semua diam di tempat!"
- **42.41s "Dan"** (turn word “Dan” after a 0.7s pause): Dan aku sadar… semuanya baru saja dimulai.

## Pauses to keep (≥ 0.3 s)

- 3.89s, 0.62s after "Jakarta,"
- 6.82s, 0.78s after "mimpi."
- 9.42s, 0.52s after "ini…"
- 12.07s, 0.85s after "mana."
- 16.94s, 0.67s after "pekerjaan."
- 20.57s, 0.81s after "lumayan.""
- 23.54s, 0.56s after "Arga."
- 25.95s, 0.44s after "semuanya:"
- 29s, 0.35s after "tamu,"
- 30.28s, 0.66s after "bertahan."
- 33.16s, 0.6s after "terbiasa."
- 36s, 0.59s after "berubah."
- 39.17s, 0.47s after "didobrak."
- 41.71s, 0.7s after "tempat!""
- 43.49s, 0.46s after "sadar…"

Read in context (quotes, conditions, negation, screens, pronouns), but it is still a reading aid: check the interactions against the script before directing.
