# Contoh prompt

Ketik setelah `/voynann-motion`. Nama gaya tidak wajib ditulis; Claude memilihnya sendiri.

CINÉSTORY 3D, CHARACTER FLOW, PANELVERSE, STORYBOOK, CHRONICLE, BEDAH, CERDIK, NEGERI, TIPIKAL, NEKAT, BONGKAR, keenam gaya dengan mesin khusus, dan dua gaya dengan mesin inti bisa dipakai semua; PRECISION dan INNERWORKS biasanya perlu satu putaran preview tambahan (lihat `START_HERE.md`).

| Gaya | Hasilnya seperti | Contoh prompt |
|---|---|---|
| **PIXELSTORY** | kisah karakter pixel-art sinematik, 2.5D | "Animasi pixel tentang penjaga mercusuar yang menyalakan lampu saat badai. Musik saja." |
| **VOXELVERSE** | dunia miniatur 3D dari balok voxel | "Kota mini voxel saat malam hujan, robot kecil mengantar surat bercahaya. Aku punya VO." |
| **PRECISION** | iklan produk 3D premium | "Iklan 3D botol minum fiktif, close-up material, bagian-bagiannya terpisah lalu menyatu." |
| **PAPERWORLD** | cerita miniatur dari kertas | "Cerita kertas tentang tukang kebun kecil yang mengembalikan warna ke kota kertas." |
| **INNERWORKS** | membedah cara kerja benda | "Cara kerja kipas angin listrik, casingnya terbuka dan bagian dalamnya kelihatan. VO menyusul." |
| **WORLDFORGE** | menjelajahi dunia 3D | "Bayangkan kota di dasar laut dengan kubah kaca dan terowongan transparan. Ini MP3-nya: @/path/narasi.mp3" |
| **TIMEFORGE** | satu benda berevolusi dari masa ke masa | "Evolusi televisi dari TV tabung sampai TV tipis sekarang." |
| **BUILDFORGE** | bangunan dirakit tahap demi tahap | "Rumah dua lantai dibangun dari tanah kosong sampai jadi, fondasi, rangka, dinding, atap, taman." |
| **CINÉSTORY 3D** (#09) | film pendek 3D sinematik dari voice-over, di lokasi yang dibangun untuk ceritanya | "Buatkan video CINÉSTORY 3D dari VO ini: @/Users/kamu/Downloads/vo.mp3 (naskahnya: @/Users/kamu/Downloads/naskah.txt)" |
| **CHARACTER FLOW** (#10) | tokoh 3D ekspresif memerankan voice-over | "Buatkan video CHARACTER FLOW dari VO ini: @/Users/kamu/Downloads/vo.mp3" |
| **PANELVERSE** (#11) | komik pop retro yang hidup: panel, halftone, tulisan komik, efek suara | "Buatkan video PANELVERSE dari VO ini: @/Users/kamu/Downloads/vo.mp3" |
| **STORYBOOK** (#12) | buku cerita anak dari kertas: sampul, balik halaman, boneka kertas, tulisan tercetak | "Buatkan video STORYBOOK dari naskah ini: @/Users/kamu/Downloads/naskah-buku.txt" |
| **CHRONICLE** (#13) | dokumenter sejarah 3D: tokoh siluet, peta relief, tanggal, sumber | "Buatkan video CHRONICLE tentang letusan Tambora 1815. Belum punya VO." |
| **BEDAH** (#14) | penjelasan "gimana dibikinnya dan kenapa": lokasi bangunan realistis, tanah terpotong, tukang, label | "Buatkan video BEDAH tentang kenapa rumah butuh pondasi. Belum punya VO." |
| **CERDIK** (#15) | cerita trik cerdik "diketawain dulu, terbukti benar": tokoh kepala bulat di dunia 3D kaya warna | "Buatkan video CERDIK tentang nelayan yang bawa lampu paling terang. Belum punya VO." |
| **NEGERI** (#16) | serial harian "bikin negara dari nol": follower jadi warga, komen teratas jadi bangunan | "Buatkan video NEGERI hari 1: follower 12.480, komen teratas @budi.santuy 'bikin pos ronda dong'." |
| **TIPIKAL** (#17) | komedi "tipe-tipe orang …": tokoh kartun 3D di jalan, kelas, kantor, kondangan, rumah; kartu tipe + reaksi lucu | "Buatkan video TIPIKAL tentang tipe-tipe murid pas ujian." |
| **NEKAT** (#18) | tantangan bersambung: tokoh tetap vs hewan yang makin banyak, penghitung + level + PART, 3D mainan | "Bisa gak Pak Darto ngusir Si Oren? Tiap diusir kucingnya nambah." |
| **BONGKAR** (#19) | benda sehari-hari membongkar dirinya jadi part-part berlabel (exploded view), penghitung part, lalu menyatu lagi | "Buatkan video BONGKAR rice cooker, isinya ada berapa part?" |

## Dengan naskah + voice-over

```
/voynann-motion Ini naskah dan voice-over untuk video tentang evolusi kamera.
Naskah: (tempel naskahmu)
VO: @/Users/kamu/Downloads/vo-kamera.mp3
```

## CINÉSTORY 3D — cukup satu kalimat

```
/voynann-motion Buatkan video CINÉSTORY 3D dari VO ini: /Users/kamu/Downloads/vo.mp3 (naskahnya: /Users/kamu/Downloads/naskah.txt)
```

- Sedikit arahan (opsional): "Tokohnya perempuan berhijab, latar kos malam hari." · "Akhiri dengan suasana pagi yang hangat."
- Versi YouTube: tambahkan "versi landscape 16:9" (subtitle-nya berupa file `.srt`, kecuali kamu minta ditempel di video).
- Dengan brand kit: "pakai brand kit aku (voynann-brand.json)" — nama channel, logo, dan ajakan di penutup video.
- Belum pasang whisper.cpp? Sertakan teks naskah yang sama persis dengan VO.
- Revisi: "Di bagian lampu laut, kabutnya lebih tebal." · "Tambahkan close-up saat dia kaget." · "Ganti tokohnya jadi bapak berkacamata." · "Subtitle-nya matikan saja (cukup file .srt)."

## CHARACTER FLOW — cukup satu kalimat

```
/voynann-motion Buatkan video CHARACTER FLOW dari VO ini: /Users/kamu/Downloads/vo.mp3
```

- Mau sedikit mengarahkan? Tambahkan: "Tokohnya cewek." · "Di kamar malam hari." · "Dua tokoh di kampus, dibuat lucu." · "Di kafe, tokohnya cewek berhijab." · "Pindah-pindah: rumah, sekolah, kantor."
- Belum pasang whisper.cpp (lihat `INSTALLATION_GUIDE.md`)? Sertakan teks naskahnya: `Naskahnya: …`
- Belum punya VO? "Aku mau video CHARACTER FLOW tentang susah bangun pagi, tapi belum punya VO." Claude menawarkan naskah + suara TTS dan baru membuatnya setelah kamu setuju.
- Revisi setelah video jadi: "Di bagian 'tapi tangan malah membuka HP', ambil gambar lebih dekat." · "Tokohnya ganti jadi Raka." · "Suasananya sore." · "Musiknya lebih hangat."

## PANELVERSE — cukup satu kalimat

```
/voynann-motion Buatkan video PANELVERSE dari VO ini: /Users/kamu/Downloads/vo.mp3
```

- Cocok untuk cerita relatable yang punya "belokan": overthinking, ekspektasi vs realita, "pernah ga…", daftar kemungkinan, lalu punchline ("padahal…", "ternyata…").
- Mau sedikit mengarahkan? Tambahkan: "Tokohnya ibu-ibu berhijab." · "Endingnya dicap LUNAS." · "Bagian tiga alasan dibuat tiga panel." · "Warnanya dominan merah-kuning."
- Belum pasang whisper.cpp? Sertakan teks naskahnya: `Naskahnya: …`
- Belum punya VO? "Aku mau video PANELVERSE tentang gaji yang cepat habis, tapi belum punya VO." Claude menawarkan naskah + suara TTS dan baru membuatnya setelah kamu setuju.
- Revisi: "Panel pertama ganti jadi layar terbelah." · "Tulisan BOROS lebih besar." · "Tambahkan suara uang jatuh saat kata 'habis'." · "Ending-nya ditahan lebih lama."

## STORYBOOK — buku cerita bergambar

```
/voynann-motion Buatkan video STORYBOOK dari naskah ini: /Users/kamu/Downloads/naskah-buku.txt (VO: /Users/kamu/Downloads/vo.mp3)
```

- Format naskahnya: `JUDUL:`, `TOKOH: Nama = deskripsi`, lalu `[HALAMAN] waktu, tempat, benda. Siapa melakukan apa.` dan teks halamannya (lihat `FORMAT-NASKAH-BUKU.md` di proyek).
- Ide saja juga bisa: "Buatkan buku cerita anak tentang kelinci yang takut gelap, 6 halaman, untuk anak 5 tahun." Claude menulis naskahnya dulu untuk kamu setujui.
- Revisi: "Halaman 3 suasananya malam." · "Raka pakai kaos merah." · "Tambahkan kucing di halaman terakhir." · "Penutupnya 'Selamat tidur'."

## CHRONICLE — dokumenter sejarah siluet

```
/voynann-motion Buatkan video CHRONICLE dari VO ini: /Users/kamu/Downloads/vo.mp3 (naskahnya: /Users/kamu/Downloads/naskah.txt)
```

- Format naskahnya: tag `[PETA]`, `[RUTE]`, `[TEMPAT] … TOKOH: …`, `[TANGGAL]`, `[NAMA]`, `[ANGKA]`, `[SUMBER]`, `[PENUTUP]` (lihat `FORMAT-NASKAH.md` di proyek). Naskah polos tanpa tag juga jalan.
- Cukup topik: "Video CHRONICLE: kenapa Pangeran Diponegoro dimakamkan di Makassar." Claude menyusun naskah + sumbernya dulu dan memberi teks VO siap tempel ke ElevenLabs (bisa dengan tag ekspresi v3).
- Revisi: "Adegan benteng jadi malam." · "Perwira Belanda outline merah." · "Tambahkan rute kapal Batavia ke Ambon." · "Tanggalnya 20 Juli 1825."

## BEDAH — "gimana dibikinnya, dan kenapa"

```
/voynann-motion Buatkan video BEDAH dari VO ini: /Users/kamu/Downloads/vo.mp3 (naskahnya: /Users/kamu/Downloads/naskah.txt)
```

- Pola naskah: "Kalau kamu …, kamu udah punya …. Tapi …. Jadi kamu …", satu kalimat pendek per adegan, ditutup satu kalimat hasil + satu ajakan.
- Cukup topik: "Video BEDAH tentang kenapa genteng disusun tumpang-tindih." Claude menulis naskahnya dulu untuk kamu setujui, membuat videonya dengan musik saja, dan memberi teks VO siap rekam.
- Revisi: "Adegan kuda-kuda dari samping." · "Label 'Reng' muncul lebih awal." · "Kalimat ketiga tambahkan hujan." · "Penutupnya ganti: 'Besok kita bedah apa?'"

## CERDIK — "diketawain dulu, terbukti benar"

```
/voynann-motion Buatkan video CERDIK dari VO ini: /Users/kamu/Downloads/vo.mp3 (naskahnya: /Users/kamu/Downloads/naskah.txt)
```

- Pola cerita: aksi aneh di kalimat pertama → taruhannya apa → diketawain (boleh satu kutipan) → cara biasa kelihatan menang → keadaan berubah → triknya terbukti di kalimat terakhir. 8–14 kalimat, 35–65 detik.
- Cukup topik: "Video CERDIK tentang kenapa rumah adat Nias tahan gempa." Claude menulis naskahnya dulu untuk kamu setujui, membuat videonya dengan musik saja, dan memberi teks VO siap rekam di ElevenLabs.
- Revisi: "Penjualnya pakai kerudung hijau." · "Adegan ketiga dari bawah." · "Kendinya dibelah lebih lama." · "Tambah antrean di akhir." · "Jadikan malam hari."
- Tokoh sendiri: ketik **"kartu tokoh"** → 3 gambar pilihan bernomor. Lalu tulis pilihanmu, kode atau kata biasa:
  "Tokoh utama T5, baju W7, kerudung W2, kacamata. Saingannya T3, rambut R2, kumis, badan gemuk."
- Serial dengan tokoh yang sama: "Simpan tokoh ibu ini namanya Bu Sari." → video berikutnya: "Pakai tokoh Bu Sari."

## NEGERI — serial "bikin negara dari nol"

```
/voynann-motion Buatkan video NEGERI hari 1. Negaranya "Republik Komen", presidennya pakai peci dan batik tosca.
Follower sekarang 12.480. Komen teratas: @budi.santuy "bikin pos ronda dong pak pres" (4.812 like).
Rumah warga pertama buat @sari.kopi, @dimas_07, @uci.nyemil.
```

```
/voynann-motion Lanjut NEGERI hari 2: follower 25.310. Komen teratas @sari.kopi "warung dong, laper nih" (9.120 like),
lalu @rizal.ngopi "bandara!!" (3.301). Bangun warungnya, bandaranya ditolak dulu.
```

- Dari VO: "Buatkan video NEGERI dari VO ini: hari5.mp3 (naskahnya: hari5.txt). Kerajaan Rebahan, rajanya pakai mahkota, gaya bahasa gue-lo."
- Bangunan yang belum ada: "NEGERI hari 6: warga minta menara pandang biar bisa lihat sawah — bikinin bangunannya ya."
- Tokoh: ketik **"kartu tokoh"** untuk melihat pilihan pemimpin, warga, rambut, penutup kepala, dan warna; "simpan presidennya" supaya dipakai lagi tiap hari.
- Revisi: "Papan nama rumahnya lebih lama." · "Drama warganya ganti rebutan jadi kiper." · "Adegan malamnya ditahan lebih lama."

## TIPIKAL — cukup topiknya

```
/voynann-motion Buatkan video TIPIKAL tentang tipe-tipe orang di kondangan.
```

```
/voynann-motion Video tipe-tipe pengendara motor. Tipenya: 1) sein kiri belok kanan, 2) bonceng anak tiga + galon,
3) ngerem pakai sandal, 4) lampu merah maju sampai tengah.
```

- "Buatkan video TIPIKAL tipe-tipe bos di kantor, tokoh utamanya pakai T9 jas W11. Versi 16:9 juga."
- Tokoh: ketik **"kartu tokoh"** untuk melihat pilihan tokoh, rambut, helm/kerudung, baju, dan warna; "simpan tokoh ini" untuk serial.
- Revisi: "Tipe 2 ganti jadi yang main HP sambil nyetir." · "Tambah tulisan GUBRAK! waktu jatuh." · "Jadikan sore hari."

## NEKAT — tantangan bersambung yang makin kacau

```
/voynann-motion Buatkan video NEKAT: Bisa gak Pak Darto ngusir Si Oren? Tiap diusir kucingnya nambah.
```

- "Video tantangan: satpam sekolah ngusir bebek, alatnya toa, payung, drone, ember. Akhirnya dia kabur."
- "Bikin NEKAT di kebun: kakek mau nangkep ayam pakai jaring dan kardus, tapi tiap ditangkep malah netes. Ending ayamnya dipelihara aja."
- "Tokohnya bocil T3 rambut R6, hewannya kambing H10. Akhirnya bocilnya menyerah pakai bendera putih."
- Serial: "Simpan Pak Darto dan Si Oren, terus bikin part 2: Pak Darto ngusir 1.024 kucing, ending cliffhanger."
- Dengan VO: "Pakai VO aku ini, gaya NEKAT, versi YouTube 16:9: @/Users/kamu/Downloads/vo.mp3"
- Revisi: "Level 3 ganti kipas raksasa." · "Angkanya lompat ke 64, jangan 16." · "Endingnya dia menyerah aja."

## BONGKAR — isinya ada berapa part?

```
/voynann-motion Buatkan video BONGKAR rice cooker, isinya ada berapa part?
```

- "Bongkar kipas angin berdiri, jantungnya dinamo."
- "Exploded view setrika listrik biasa, warna biru muda."
- "Video bongkar senter LED: baterai, lampu, saklar, per."
- Dengan VO: "Ini VO-ku dari naskah yang kamu kasih: @/Users/kamu/Downloads/vo.mp3"
- Revisi: "Badannya warna hijau tosca." · "Tombolnya juga dikasih label." · "Bikin versi landscape-nya."

## Versi landscape (YouTube)

Tanpa permintaan khusus, video selalu vertikal 9:16. Untuk layar lebar, tambahkan kalimatnya di gaya apa pun:

- "Buatkan video CHRONICLE dari naskah ini, **versi landscape 16:9**."
- "Animasi voxel kota hujan malam hari, **untuk YouTube (16:9)**."
- "Yang tadi sudah bagus. **Buatkan juga versi landscape-nya.**"
- "Buat dua versi: vertikal untuk TikTok dan landscape untuk YouTube."

## Revisi setelah preview

- "Bagian terowongan terlalu cepat, perlambat."
- "Tambahkan judul di awal: 'KOTA DI DASAR LAUT'."
- "Warnanya lebih hangat."
- "Ending-nya tahan lebih lama sebelum fade."
- "Oke, render final."
