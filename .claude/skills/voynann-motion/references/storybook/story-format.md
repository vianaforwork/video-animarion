# STORYBOOK script format (naskah.txt)

The buyer's guide in Indonesian is `FORMAT-NASKAH-BUKU.md` in the project; this is the exact grammar the director reads
(`src/director/book.ts`).

```
JUDUL: Mimi dan Payung Kuning                 ← cover + title page
OLEH: Voynann                                 ← optional: "oleh …" on the cover and the title page
PERSEMBAHAN: untuk yang suka berbagi payung   ← optional: title page dedication
SUARA: lembut, pendongeng                     ← optional note for the narration (not used by the director)
TOKOH: Raka = anak laki-laki, rambut pendek hitam, kaos kuning, celana pendek biru
TOKOH: Mimi = kucing oranye
TOKOH: Ibu = ibu berhijab hijau, baju krem

[SAMPUL] siang, kebun. Raka melambai, Mimi.   ← optional; lines under it are read over the closed cover

[HALAMAN] mendung, kebun, hujan, payung. Raka memegang payung, Mimi menangis.
Raka membagi payung kuningnya dengan si kucing kecil.     ← printed under the picture AND narrated

[PENUTUP] Tamat                               ← optional; printed in italics under the last page's text
```

- Every non-tag line after a `[HALAMAN]` is page text: one sentence or more per line; sentences are split at `. ! ? …`.
  Narration order = cover lines, then the pages' lines in order. The VO must read exactly these.
- `*kata*` is allowed but has no effect (the stars are removed from the print).
- Lines starting with `#` or `//` are comments.

## TOKOH (cast) — declared once, referred to by name
`TOKOH: <Name> = <description>` (`:` also works instead of `=`). The name must appear in the page lines' tag to put the
character on that page.
- **Animals / friends** (the first match wins unless the description says child / mother / …): `kucing`, `kelinci`,
  `anjing`, `burung` (pipit, merpati), `bebek` / itik, `ikan`, `kupu`, `bintang` (a living star). The first colour
  word anywhere colours it (`kucing oranye`, `burung biru`).
- **People:** build from words — `anak` → child; `ibu ayah bapak guru paman bibi tante om petani nelayan dewasa` →
  adult; `nenek kakek tua lansia` → elder (grey hair, slight stoop). Female if `perempuan ibu nenek bibi tante gadis
  putri`.
  - hair: `hijab / kerudung / jilbab` · `peci / kopiah / songkok` · `kuncir dua` (two puffs) · `sanggul / konde / cepol`
    (bun) · `rambut panjang` · `rambut pendek / cepak` · `botak` · `bob / poni`; defaults: girl bob, woman bun,
    male short.
  - outfit: `gaun` (dress) · `rok panjang / kebaya / kain` (long skirt) · `jubah / gamis` (robe) · `celana panjang /
    baju koko` · `celana pendek / kaos`; defaults: girl dress, woman long skirt, man shirt + trousers, boy shirt + shorts.
  - colours after the garment word (one word may sit between: `celana pendek biru`): `gaun / baju / kaos / kemeja /
    jubah / gamis / kebaya` → top; `celana / rok / kain / sarung` → bottom; `rambut` → hair; `hijab / kerudung` → scarf.
    Colours: merah, merah muda / pink, oranye / jingga, kuning, hijau, hijau muda, toska, biru, biru muda, biru tua,
    ungu, coklat, krem, putih, hitam, abu(-abu), emas, perak.
  - extras: `berbintik / polkadot` dots, `bergaris` stripes, `kacamata`, `jenggot / janggut`, `kulit sawo / gelap /
    terang`.

## [HALAMAN] tag line — what the picture shows
Free words, any order. Recognised (first match wins):
- **Time:** malam · senja / sore / petang · mendung / hujan / gerimis · siang · pagi. Default siang.
- **Place:** kamar / tempat tidur / ruang · sekolah / kelas · kota · pantai · laut · gunung · sawah / ladang · sungai /
  kali · hutan · desa / kampung · taman · langit / awan (no ground: flying pages) · kebun / halaman / rumah. Default kebun.
- **Props:** rumah, pohon, bunga, semak, awan, bulan, matahari, bintang, pelangi, hujan, perahu, layang(-layang), balon,
  lentera / lampion, kado / hadiah, buku, payung, tempat tidur, lampu, kupu(-kupu), burung, kelapa, cemara, kilau.
  Places add their own scenery (a garden has a house, a tree, hills and bushes; a bedroom a window and a rug; a beach
  sea, sand, a palm and a boat).
- **Actions:** for every declared name in the tag, the verb **after the name in its clause** (clauses split at `.`, `;`
  and `, <Capital>`): mengintip (needs the house: garden pages) · jatuh · terbang / melayang · berenang · layang (flies
  a kite) · memeluk <Name> (both hug) · menangis · sedih / murung · terkejut / kaget · senang / tertawa / gembira /
  tersenyum · tidur (bed in a bedroom, else on the grass) · duduk / jongkok · menunjuk · melambai · melompat · berlari ·
  berjalan / pulang / pergi / datang · menatap / melihat / mendongak · memegang / membawa (balloon, lantern, umbrella
  when that prop is on the page) · berdiri. A name with no verb stands.
- Up to 5 characters on the ground per page (slots across the picture); fliers, fallers and peekers do not take a slot.

## Timing
Without a VO the lines are paced at a read-aloud speed. With a VO every line keeps its own audio; the director only
inserts pauses between pages (≈ 2 s page turn) and keeps the narrator's own pauses inside a page. A page lasts at least
3.2 s. Cover lines play over the closed cover, then the cover opens (1.8 s).
