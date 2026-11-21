# Lisensi dan persyaratan

## Persyaratan perangkat lunak

| Perangkat lunak | Versi | Siapa yang memasang | Catatan |
|---|---|---|---|
| Claude Code | terbaru | kamu | Butuh paket Claude berbayar (Pro/Max/Team/Enterprise) atau akun API Anthropic |
| Node.js + npm | ≥ 22.18 untuk CINÉSTORY 3D, STORYBOOK, CHRONICLE, BEDAH, CERDIK, NEGERI, TIPIKAL, NEKAT, dan BONGKAR; ≥ 22.13 untuk gaya lain | kamu | <https://nodejs.org> |
| ffmpeg + ffprobe | terbaru | kamu | Analisis VO, contact sheet, audio final |
| Remotion 4.0.539 | dikunci di proyek | Claude, lewat `npm ci` | Kerangka render video |
| three.js 0.186.1, React 19.2.3, @react-three/fiber 9.8.2, TypeScript 5.9.3 | dikunci di proyek | Claude, lewat `npm ci` | Mesin 3D dan bahasa kode |
| Chrome Headless Shell | dipilih Remotion | otomatis saat render pertama | ±170 MB per proyek |

Komputer yang disarankan: **Mac dengan chip Apple (M1 ke atas)** atau PC dengan kartu grafis (GPU). Tanpa GPU, render 3D jauh lebih lambat.

## Lisensi pihak ketiga

| Komponen | Lisensi | Yang perlu kamu ketahui |
|---|---|---|
| **Remotion** | Remotion License (bukan open-source murni) | Saat dokumen ini ditulis, Remotion gratis untuk perorangan, organisasi nirlaba, dan perusahaan dengan maksimal 3 karyawan. **Perusahaan yang lebih besar wajib membeli Remotion Company License.** Cek ketentuan terbaru di <https://remotion.dev/license> sebelum memakai video untuk usaha. |
| three.js | MIT | Bebas dipakai |
| React, React DOM | MIT | Bebas dipakai |
| @react-three/fiber | MIT | Bebas dipakai |
| TypeScript | Apache-2.0 | Bebas dipakai |
| Font Manrope | SIL Open Font License 1.1 | Disertakan di `starter/public/fonts` (lisensi `OFL-manrope.txt` ikut tersalin ke `public/fonts` proyek); boleh dipakai di video |
| Font Anton, Instrument Serif, Silkscreen, Space Grotesk | SIL Open Font License 1.1 | Disertakan di `kits/pixelstory/public/fonts` (lisensinya ikut tersalin ke `public/fonts/licenses` proyek); boleh dipakai di video |
| Font Bangers, Luckiest Guy, Comic Neue | SIL Open Font License 1.1 | Disertakan di `kits/panelverse/public/fonts` (lisensi `OFL-pv-*.txt` ikut tersalin ke `public/fonts` proyek); boleh dipakai di video |
| Font Newsreader, Kalam | SIL Open Font License 1.1 | Disertakan di proyek STORYBOOK (`public/fonts`, lisensi `OFL-newsreader.txt`, `OFL-kalam.txt`); boleh dipakai di video |
| Font Anton, Barlow Condensed, Plus Jakarta Sans, Instrument Serif | SIL Open Font License 1.1 | Disertakan di proyek CHRONICLE (`public/fonts`, lisensi `OFL-*.txt`); boleh dipakai di video |
| Font Plus Jakarta Sans Bold | SIL Open Font License 1.1 | Disertakan di proyek BEDAH, CERDIK, NEKAT, dan BONGKAR (`public/fonts`, lisensi `OFL-plus-jakarta-sans.txt` di folder proyek); boleh dipakai di video |
| Font Fredoka, Plus Jakarta Sans | SIL Open Font License 1.1 | Disertakan di proyek NEGERI (`public/negeri`, lisensi `OFL-fredoka.txt`, `OFL-plus-jakarta-sans.txt`); boleh dipakai di video |
| Font Baloo 2, Barlow Condensed | SIL Open Font License 1.1 | Disertakan di proyek TIPIKAL (`public/tipikal`, lisensi `OFL-baloo2.txt`, `OFL-barlow-condensed.txt`); boleh dipakai di video |
| Font Lilita One | SIL Open Font License 1.1 | Disertakan di proyek NEKAT (`public/nekat`, lisensi `OFL-LilitaOne.txt`); boleh dipakai di video |
| Data peta Natural Earth (garis pantai) | Domain publik | Dipakai untuk peta relief CHRONICLE (`src/data/map-nusantara.json`); bebas dipakai, atribusi tidak wajib |
| Chrome Headless Shell | Lisensi Chromium/Google | Diunduh otomatis oleh Remotion |
| ffmpeg | LGPL/GPL (tergantung build) | Dipasang sendiri olehmu |
| whisper.cpp (opsional, CHARACTER FLOW, CINÉSTORY, PANELVERSE, STORYBOOK, CHRONICLE, BEDAH, CERDIK, NEGERI, TIPIKAL, NEKAT, dan BONGKAR) | MIT | Dipasang sendiri olehmu |
| Node.js | MIT | Dipasang sendiri olehmu |

## Aset

- Paket ini **tidak** berisi musik, voice-over, model 3D, foto, atau logo pihak ketiga. Semua geometri dan tekstur dibuat secara prosedural oleh kode.
- Gambar di `references/quality-bar/` adalah cuplikan render asli milik pembuat VOYNANN Motion. Gambar itu hanya acuan kualitas untuk Claude dan **tidak** untuk dipakai ulang di videomu.
- Voice-over (misalnya ElevenLabs), musik, logo, dan gambar yang kamu berikan harus milikmu atau berlisensi untuk penggunaanmu. Periksa syarat paket ElevenLabs-mu untuk pemakaian komersial.
- Jangan meminta tiruan merek, produk, karakter, atau game yang dilindungi hak cipta.
- CHARACTER FLOW, CINÉSTORY 3D, PANELVERSE, STORYBOOK, CHRONICLE, BEDAH, CERDIK, NEGERI, TIPIKAL, NEKAT, dan BONGKAR: tokoh, lokasi, benda, musik, dan efek suara dibuat sepenuhnya oleh kode (sintesis). Suara TTS dari macOS (`say`) disediakan Apple untuk komputermu; untuk video komersial, VO rekaman/berlisensi lebih disarankan.

## Lisensi VOYNANN Motion

- Kamu boleh memakai skill ini untuk membuat video, baik pribadi maupun komersial. Video yang kamu hasilkan menjadi milikmu, dengan tetap mematuhi lisensi pihak ketiga di atas, terutama Remotion.
- Skill, kode, dan dokumen di dalam paket ini **tidak boleh dijual ulang, dibagikan ulang, atau diunggah publik** tanpa izin tertulis dari penjual.
- Paket disediakan apa adanya. Hasil video bergantung pada ide, perangkat, dan iterasi, dan tidak dijamin sama persis dengan contoh.
- Animasi konstruksi (BUILDFORGE) bersifat ilustrasi, **bukan** panduan teknik. Desain masa depan adalah **konsep**, bukan prediksi.
