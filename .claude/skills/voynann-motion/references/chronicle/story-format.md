# CHRONICLE story format — `stories/<id>/naskah.txt`

Plain text, UTF-8. The buyer's Indonesian version of this guide is `FORMAT-NASKAH.md` in the project.

## Lines
- **Header** (optional, before the first scene): `JUDUL: …`, `SERI: …` (shown above the end-card title), `SUARA: …`
  (a note on the voice; not used by the engine).
- **Narration:** every other line is spoken text. Long lines are split into sentences automatically. One sentence per
  line is best: each line becomes a caption chunk and (usually) a camera beat.
- **Keywords:** `*kata*` or `*dua kata*` → bold, brighter caption words. 1–2 per sentence.
- **Scene tags** start a new scene and apply to the narration below them until the next scene tag:
  `[PETA] …`, `[RUTE] …`, `[TEMPAT] … TOKOH: …`, `[PENUTUP] …`.
- **Overlay tags** attach to the next narration line (or to the scene start when placed before its first line):
  `[TANGGAL] …`, `[NAMA] …`, `[ANGKA] …`, `[SUMBER] …`.
- Narration without any scene tag is allowed: each paragraph (blank-line separated) becomes its own scene — a map when
  it names a known place and no set keyword, otherwise a set picked from its words. Tagged scripts direct better.
- `#` or `//` lines are comments.

## Scene tags
| Tag | Content | Result |
|---|---|---|
| `[PETA] Yogyakarta` | one known place | close oblique view, slow push, pin |
| `[PETA] Tambora sampai Batavia, cincin dentuman dari Tambora` | several places; `cincin` / `gelombang` / `dentum` | starts close on the first place, sound rings expand, camera pulls out until all fit; pins appear in order |
| `[PETA] Tambora meletus` | `meletus` / `letusan` + a volcano | ash column on that volcano |
| `[RUTE] Magelang → Batavia → Manado → Makassar, kapal` | places in travel order (or `→` / `->` in a [PETA]) | dashed route drawn over the scene, the camera travels with its head, then shows the whole trip |
| `[TEMPAT] pendopo karesidenan, siang. TOKOH: …` | location + time + effects, then the cast | one of 10 sets, a mood, staged cast, camera beats |
| `[PENUTUP] Bersambung — Tahun Tanpa Musim Panas` | end-card title (`—` splits title / subtitle) | 4 s card over the dimmed map with the sources |

A map scene lasts at least 3 s (route 4.4 s) when paced; with a VO it lasts as long as its sentences.

## Set keywords (first match in the `[TEMPAT]` text wins; default `medan`)
| Set | Keywords | What it is |
|---|---|---|
| `makam` | makam, kuburan, nisan, pusara, astana | grave with headstones, low fence, frangipani, an old roofed grave, trees |
| `balai` | pendopo, balairung, istana, keraton, kraton, aula, singgasana, karesidenan, balai, ruang sidang, loji | hall interior: pillars, table and chair, red carpet, bright doorway and windows, light shafts |
| `kamar` | kamar, ruang, bilik, penjara, sel, pengasingan | small room: barred window, desk with paper and candle, chair, bed |
| `dek` | geladak, di atas kapal, dek kapal, haluan | ship deck at the rail: mast, rigging, sail, sea and sun |
| `pelabuhan` | pelabuhan, dermaga, bandar, syahbandar | wooden pier into the water, crates, lantern, ships at anchor |
| `benteng` | benteng, kubu, bastion | stone curtain wall with gate, bastion, battlements and flag, courtyard in front (lit from the front-left) |
| `hutan` | hutan, rimba, perbukitan, bukit, gua, goa, lembah, sungai | tall trees, clearing, light shafts, undergrowth |
| `desa` | desa, kampung, rumah, dusun, permukiman | stilt houses, coconut palms, open ground |
| `pantai` | pantai, pesisir, tepi laut | sand, sea, palms, a boat on the beach |
| `medan` | medan, perang, kemah, perkemahan, lapangan, alun, sawah, padang | open field: tents, red banners, distant hills |

## Time, mood and effects (from the `[TEMPAT]` text)
- **Mood:** `terbakar / kebakaran / api / membara / meletus / letusan` → fire light; `malam / gelap / lilin` → moonlit
  night; `senja / sore / petang` → golden dusk; `fajar / subuh / pagi` → misty morning; `siang / terik` → hazy day;
  default dusk. Interiors (`balai`, `kamar`) use their own day / night lighting.
- **Effects:** `terbakar / api` → flames, smoke, embers on the houses (village) or a campfire (field);
  `meletus / letusan / gunung api` → an erupting volcano with ash (village); `kabut` → denser fog;
  `lilin / pelita / lampu minyak` → a candle (room). `hujan` only cools the room's window (no rain is drawn).

## Cast — `TOKOH:` grammar
Groups separated by commas (commas inside parentheses are fine):
`<count> <role or name> (<attributes>) <verb> = <colour>` — every part except the role/name is optional.
- **count:** a number or `satu, seorang, dua … sepuluh, beberapa (4), banyak (14), puluhan (16), ratusan (24),
  ribuan (30)`; up to 40 per group.
- **role → costume** (the era comes from the first year in the script: before 1790 Europeans wear tricornes, later
  shakos / bicornes):
  - `perwira, opsir, jenderal, gubernur, residen, kapten, laksamana, komandan, kolonel, mayor` (+ names like De Kock,
    Daendels, Raffles, Speelman, Coen) → officer, coat, tricorne / bicorne;
  - `serdadu, tentara, kompeni, marsose, garnisun, VOC` → soldier, coat, musket, tricorne / shako;
  - `ulama, kyai, syekh, imam, wali` → turban + robe; `peziarah, haji, santri` → peci + sarong;
  - `pangeran, raja, sultan, sunan, karaeng, arung, bangsawan, adipati, bupati, patih, tumenggung, panglima, datu` →
    destar + sarong + keris;
  - `laskar, pengikut, pejuang, prajurit, pasukan, gerilyawan, pendekar, pengawal` → destar + sarong + spear;
  - `perempuan, wanita, ibu, istri, putri, ratu, permaisuri, gadis, nyai` → bun + long kain;
  - `anak, bocah` → child; `pelaut, awak, kelasi, nakhoda` → bareheaded sailor; `warga, rakyat, penduduk, petani,
    nelayan, orang, pedagang, kuli, pekerja` → caping + sarong;
  - any other word (a name such as *Diponegoro*) → destar + sarong, overridden by the attributes.
- **attributes** (in parentheses): hats `sorban, peci / kopiah / songkok, destar / ikat kepala / passapu / udeng,
  blangkon, caping, shako, bicorne / topi perwira, tricorne / topi laken, sanggul / konde, rambut, tanpa topi`;
  clothes `jubah, sarung, kain / jarik / kebaya, jas / seragam, celana`; things `senapan / bedil, tombak, obor,
  teropong, bendera / panji, dayung, keris, buntelan / bawaan / karung (on the back), di kepala (load on the head)`.
- **verbs → pose:** `lari / kabur / mengungsi` run, `jalan / berjalan / datang / pergi` walk, `berdiri` stand,
  `tolak pinggang` hands on hips, `menunjuk` point, `meneropong` telescope, `berdoa` pray (kneeling, palms up),
  `sujud / menyembah / menghadap` bow, `berlutut / bersimpuh / jongkok` kneel, `duduk / bersila` sit (chair in `balai`
  / `kamar`, cross-legged elsewhere), `menulis` write at the desk, `berjaga / siaga / mengawal` guard, `berbaris` stand in
  rows, `mengangkat / menyerang / bertempur / melawan` raise a fist / weapon, `berunding / berbicara` talk with gestures,
  `menatap / melihat` look up, `membawa / menjunjung` carry. Without a verb: officers stand, soldiers guard, others stand.
- **colour → contour:** `emas / kuning / utama` amber (hero), `cyan / biru / sekutu` ally, `merah / musuh / lawan` crimson
  (enemy), `ungu / korban / duka` violet (victims, grief, the fallen), `gading / putih / netral` ivory (a named figure
  without a side). No colour = plain silhouette (in dark sets a faint ivory edge is added so it still reads).
- **lead** = the first single person with a colour (else the first single person) — the camera frames the lead.
  A second single person stands opposite and faces the lead (conversations, confrontations). Groups of more than six
  or `berbaris` stand in rows; kneeling / praying groups form an arc in front of the set's focus; runners stream along
  the set's path toward the camera; others take the set's guard / bystander positions.

## Overlay tags
| Tag | Write | Shows |
|---|---|---|
| `[TANGGAL]` | `TEMPAT / TANGGAL` (e.g. `MAGELANG / 28 MARET 1830`) or just a date | kicker + big date stamp with a red rule, ~3.4 s |
| `[NAMA]` | `Nama — peran` (em dash or ` - `) | name in caps + role in italic, ~3.8 s; top of frame, or the lower third when a date / counter / citation is on screen |
| `[ANGKA]` | `200.000 jiwa, korban Perang Jawa` or `4.300 → 2.850 m, Tinggi Tambora` | a number rolling from 0 (or the first value) to the target, unit, label; until the scene ends; that camera beat is kept wide |
| `[SUMBER]` | `paraphrase — source` inside a scene; under `[PENUTUP]`: `source; source; …` | inside a scene: the paraphrase with the source line at the top for the rest of the scene; under PENUTUP: the end-card list (else all scene sources) |

## Place names on maps (gazetteer)
Matched case-insensitively as whole words, longest name first. Missing a place → add `P("Name", lon, lat)` to
`src/director/gazetteer.ts` (checked coordinates). The map covers lon 86–160, lat −48–48 (Southeast Asia to Australia).
- **cities / sites:** Batavia, Jakarta, Sunda Kelapa, Banten, Serang, Bogor, Buitenzorg, Bandung, Cirebon, Tegal,
  Pekalongan, Semarang, Demak, Kudus, Jepara, Rembang, Tuban, Gresik, Surabaya, Sidoarjo, Pasuruan, Probolinggo, Malang,
  Ngantang, Kediri, Madiun, Ponorogo, Surakarta, Solo, Kartasura, Yogyakarta, Jogja, Tegalrejo, Kotagede, Plered,
  Selarong, Magelang, Mataram (Java), Banyumas, Kebumen, Banyuwangi, Blambangan, Jember, Lumajang, Sumenep, Bangkalan,
  Pamekasan, Trowulan, Majapahit, Klungkung, Gelgel, Buleleng, Singaraja, Denpasar, Badung, Karangasem, Ampenan,
  Cakranegara, Sumbawa Besar, Bima, Dompu, Sanggar, Pekat, Ende, Larantuka, Kupang, Dili, Makassar, Ujung Pandang,
  Benteng Rotterdam, Gowa, Somba Opu, Tallo, Maros, Bone, Watampone, Wajo, Soppeng, Luwu, Palopo, Mandar, Bulukumba,
  Bau-Bau, Kendari, Manado, Minahasa, Gorontalo, Palu, Ambon, Saparua, Banda, Banda Neira, Ternate, Tidore, Jayapura,
  Hollandia, Fakfak, Merauke, Banjarmasin, Martapura, Pontianak, Sambas, Kutai, Tenggarong, Samarinda, Balikpapan, Aceh,
  Banda Aceh, Kutaraja, Pidie, Medan, Deli, Padang, Bukittinggi, Pagaruyung, Palembang, Sriwijaya, Jambi, Bengkulu,
  Bencoolen, Lampung, Siak, Pekanbaru, Malaka, Melaka, Johor, Singapura, Temasek, Penang, Kedah, Manila, Sulu, Brunei,
  Darwin
- **islands / regions / rivers:** Jawa, Java, Madura, Bali, Lombok, Sumbawa, Flores, Timor, Sumba, Solor, Buton, Sulawesi,
  Halmahera, Seram, Papua, Kalimantan, Borneo, Bangka, Belitung, Nias, Sumatra, Sumatera, Maluku, Minangkabau, Riau,
  Sungai Brantas, Bengawan Solo
- **seas (labels):** Selat Sunda, Selat Malaka, Laut Jawa, Selat Makassar, Selat Bali, Laut Banda, Laut Flores
- **volcanoes:** Tambora, Gunung Tambora, Krakatau, Merapi, Bromo, Semeru, Kelud, Rinjani, Agung, Galunggung,
  Papandayan, Toba, Sinabung, Tangkuban Parahu

## Timing
- With a VO (`stories/<id>/vo.*`): captions, scene cuts (0.3 s before the next scene's first word) and camera beats
  follow the voice. The naskah must contain the VO's words in order; numbers may be digits in the naskah and words in
  the VO.
- Without a VO (`--plan`, `--stills`): paced at ~2.5 words per second with sentence pauses.
- Camera beats: one per sentence (merged when shorter than 1.7 s); solo casts cycle wide → medium → close → low →
  medium, groups wide → medium → group → close → wide; a running lead keeps wide / group framing.
