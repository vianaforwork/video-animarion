# Panduan penggunaan

## Alur membuat video

1. **Panggil skill dan ceritakan idemu**, dengan bahasa sehari-hari:
   ```
   /voynann-motion Aku mau video yang memperlihatkan cara kerja kipas angin, bagian dalamnya kelihatan.
   ```
   Kamu tidak perlu menyebut nama gaya; Claude memilih yang paling cocok.
2. **Jawab pertanyaan singkat.** Claude bertanya satu hal setiap kali. Yang terpenting: **pakai voice-over atau cukup musik/efek suara?**
3. **Kirim voice-over (jika ada):** file **MP3 atau WAV**, misalnya dari ElevenLabs. Lampirkan file-nya, atau tulis lokasinya, misalnya `@/Users/kamu/Downloads/narasi.mp3`. Claude mengukur durasi dan jeda suaramu. Video disusun mengikuti suaramu; suara **tidak** dipercepat atau dipotong.
   Belum punya naskah? Minta Claude membantu menulisnya, rekam dulu, lalu kirim file-nya.
4. **Setujui konsep.** Claude merangkum ide, gaya, durasi, dan audio dalam beberapa baris.
5. **Izinkan persiapan proyek.** Ini hanya sekali per proyek (lihat `INSTALLATION_GUIDE.md`).
6. **Review preview.** Claude mengirim video **preview 540×960** (lebih cepat dibuat). Minta perubahan dengan bahasa biasa:
   - "Kameranya lebih pelan di bagian awal."
   - "Warnanya lebih terang."
   - "Teks di akhir lebih besar."
   - "Ganti gayanya jadi kertas."
7. **Video final.** Setelah kamu setuju, Claude merender **1080×1920, 60 FPS**, menyelaraskan suara (−14 LUFS, standar media sosial), mengecek sinkronisasi, lalu memberi tahu lokasi file MP4-nya.

## Vertikal atau landscape

Semua video dibuat **vertikal 9:16** (TikTok, Reels, Shorts) kecuali kamu memintanya lain. Untuk layar lebar, tulis
**"versi landscape 16:9"** (atau "untuk YouTube", "horizontal") di permintaanmu — berlaku di semua gaya. Hasilnya
1920×1080, 60 FPS, dan disutradarai ulang untuk frame lebar: kamera, tata letak, dan teksnya disusun lagi, bukan
video vertikal yang dipotong atau diberi bingkai hitam. Mau dua-duanya? Bilang "buat versi vertikal dan landscape";
Claude menyelesaikan yang vertikal dulu, lalu yang landscape. Sudah punya video vertikalnya? Cukup "buatkan juga
versi landscape-nya".

## CINÉSTORY 3D: alur satu kalimat

Untuk film cerita 3D dari voice-over, langkah 2–6 di atas juga dilewati: ketik
`/voynann-motion Buatkan video CINÉSTORY 3D dari VO ini: <file VO> (naskahnya: <file naskah>)`, lalu Claude menyiapkan
proyek, membaca VO dan naskah, membangun lokasi dan benda yang dibutuhkan, menyutradarai, mengecek gambarnya sendiri,
dan memberikan **video final** 1080×1920 60 FPS dengan subtitle di area aman TikTok/Reels + file `.srt` (sekitar 20–45
menit kerja Claude untuk VO ±1 menit di Mac Apple Silicon; render finalnya sendiri ±2 menit). Mau versi YouTube?
Tambahkan "versi landscape 16:9" (subtitle-nya berupa file `.srt`; minta kalau mau ditempel di video). Minta revisi dengan bahasa biasa setelahnya.

## CHARACTER FLOW: alur satu kalimat

Untuk video tokoh 3D dari voice-over, langkah 2–6 di atas dilewati: ketik
`/voynann-motion Buatkan video CHARACTER FLOW dari VO ini: <file VO>`, lalu Claude menyiapkan proyek, membaca VO,
menyusun adegan, mengecek gambarnya sendiri, dan memberikan **video final** (sekitar 5–15 menit untuk VO 30–40 detik
di Mac Apple Silicon setelah proyek siap). Minta revisi dengan bahasa biasa setelahnya.

## PANELVERSE: alur satu kalimat

Untuk video komik pop dari voice-over, langkah 2–6 di atas juga dilewati: ketik
`/voynann-motion Buatkan video PANELVERSE dari VO ini: <file VO>` (tambahkan file naskah kalau whisper.cpp belum
terpasang). Claude membaca VO, menyusun beat per kalimat, memilih perangkat komik yang berbeda untuk tiap momen
(panel membanting, layar terbelah, panel pecah, zoom ke gelembung pikiran, cap stempel, banjir tinta…), merancang
minimal satu benda khusus untuk ceritamu, mengecek gambarnya sendiri, lalu memberikan **video final** 1080×1920 60 FPS
dengan efek suara (sekitar 15–30 menit untuk VO 15–40 detik di Mac Apple Silicon). Minta revisi dengan bahasa biasa
setelahnya, misalnya "panel ketiga ganti jadi layar terbelah" atau "tokohnya pakai kacamata".

## STORYBOOK, CHRONICLE, BEDAH, CERDIK, NEGERI, TIPIKAL, NEKAT, dan BONGKAR: alur dari naskah atau topik

Delapan gaya ini disutradarai dari **naskah** (atau cukup topik/inputnya), dengan atau tanpa VO; langkah 2–6 di atas juga dilewati.
- **STORYBOOK:** `/voynann-motion Buatkan video STORYBOOK dari naskah ini: <file naskah> (VO: <file>)`. Tiap `[HALAMAN]`
  jadi satu halaman buku dengan gambar kertas dan tulisan tercetak; halaman dibalik saat narator berhenti sejenak.
- **CHRONICLE:** `/voynann-motion Buatkan video CHRONICLE dari VO ini: <file VO> (naskahnya: <file>)`, atau cukup
  topiknya. Tiap kalimat dapat sudut kamera sendiri; peta, tanggal, nama, angka, dan sumber muncul dari tag di naskah.
- **BEDAH:** `/voynann-motion Buatkan video BEDAH dari VO ini: <file VO> (naskahnya: <file>)`, atau cukup topiknya
  ("video BEDAH tentang pondasi rumah"). Tulis naskah dengan pola "Kalau kamu … kamu udah punya …. Tapi …. Jadi kamu
  …", satu kalimat pendek per adegan; sebut nama istilah di kalimat tempat bendanya muncul.
- **CERDIK:** `/voynann-motion Buatkan video CERDIK dari VO ini: <file VO> (naskahnya: <file>)`, atau cukup topiknya
  ("video CERDIK tentang kenapa kendi bikin air dingin"). Pola ceritanya "diketawain dulu, terbukti benar": aksi aneh di
  kalimat pertama, diejek, lawan kelihatan benar, keadaan berubah, dan triknya terbukti di kalimat terakhir. Claude
  memilih dunianya (desa, pasar, pantai, rumah, istana), tokoh, ekspresi, kamera, sorotan cahaya, dan potongan adegan.
- **NEGERI:** `/voynann-motion Buatkan video NEGERI hari 1: negaranya Republik Komen, follower 12.480, komen teratas
  @budi.santuy "bikin pos ronda dong pak pres"`, atau kirim VO + naskahnya. Hari berikutnya cukup: "lanjut hari 2:
  follower 25.310, komen teratas @sari.kopi 'warung dong'". Claude melanjutkan negaramu dari hari sebelumnya, memilih
  kavling, dan menulis naskah (kalau belum ada) dengan pola: keadaan hari ini → angka warga → komen teratas → bangun →
  drama kecil warga → "besok bangun apa?". Pemimpinnya disimpan sekali dan dipakai tiap hari. Nama akun yang muncul
  hanya yang kamu kirim.
- **TIPIKAL:** `/voynann-motion Buatkan video TIPIKAL tentang tipe-tipe pengendara motor`, atau kirim sendiri tipe-
  tipenya ("Tipe 1: yang sein kiri belok kanan. Tipe 2: …"), atau VO + naskahnya. Claude memilih 3–5 tipe (kalau kamu
  cuma kasih topik), tempat, tokoh, gerakan, kamera, reaksi, tulisan bunyi, musik, dan efek suara. Tanpa narator
  kecuali kamu kirim VO; kalau pakai VO, ucapkan satu kalimat per tipe sesuai urutannya. Videonya ditutup "Kamu tipe
  yang mana?" supaya penonton ramai berkomentar.
- **NEKAT:** `/voynann-motion Buatkan video NEKAT: Bisa gak Pak Darto ngusir Si Oren? Tiap diusir kucingnya nambah.`
  Claude menulis judul pertanyaan, 3–5 level alat yang makin absurd (tiap level ada teriakan si tokoh dan satu kata
  lucu saat penghitung melompat), puncak, dan akhir yang lucu. Narator boleh; tanpa narator juga jadi (teks + musik +
  efek suara). Simpan duonya ("simpan tokoh ini"), lalu "bikin part 2": angka penghitung, tempat, dan tokoh lanjut
  dari episode sebelumnya.
- **BONGKAR:** `/voynann-motion Buatkan video BONGKAR rice cooker, isinya ada berapa part?` Claude mencari tahu
  part-part benda itu, membuat modelnya, lalu mesinnya menentukan urutan bongkar, susunan exploded view, kamera,
  label, dan hitungan. Videonya jadi tanpa narator; di akhir Claude memberi naskah VO (urutan sebut = urutan bongkar).
  Rekam VO dari naskah itu, kirim, dan tiap part akan lepas tepat saat namanya disebut.

Tanpa VO, Claude bisa memberi teks VO siap tempel ke ElevenLabs atau membuat suara sementara (macOS) setelah kamu
setuju. VO-mu tidak dipercepat atau dipotong. Hasil: video final 1080×1920 60 FPS dengan musik dan efek suara orisinal
(sekitar 15–40 menit kerja di Mac Apple Silicon).

## Di mana hasilnya?

Di folder proyek yang kamu setujui, di dalam subfolder `out/`, misalnya `~/VOYNANN/kipas-angin/out/final.mp4`.

## Perkiraan waktu (Mac Apple Silicon)

| Tahap | Waktu |
|---|---|
| Persiapan proyek pertama | 2–15 menit (tergantung internet) |
| Claude membangun adegan baru | puluhan menit sampai sekitar 1 jam, termasuk perbaikan |
| Render preview 30 detik | ±20 detik |
| Render final 30 detik (1080×1920 atau 1920×1080, 60 FPS) | ±1 menit |
| Render final 110 detik | ±3–6 menit |

Komputer yang lebih lemah akan lebih lambat.

## Tips agar hasilnya bagus

- **Sebut satu momen kuat**, misalnya "lensa memanjang keluar", "kubah kaca terbuka", atau "fondasi dicor".
- **Kirim voice-over final**, bukan draf, agar timing tidak perlu diulang.
- **Mulai dari video pendek (15–40 detik; CINÉSTORY 3D mulai ±25 detik).**
- Untuk topik sejarah atau sains, minta Claude memeriksa faktanya. Desain masa depan selalu disebut sebagai konsep.
- Gunakan hanya musik, logo, atau gambar milikmu sendiri atau yang berlisensi.

## Yang tidak cocok untuk skill ini

CINÉSTORY 3D versi ini: tokoh bergaya stylized tanpa lip-sync, 1–2 tokoh per adegan; bangunan dari luar, benda rumit, dan sosok/makhluk (misalnya hantu) dibuat sebagai bentuk sederhana. Kebakaran besar, ledakan, hujan/salju, keramaian, hewan bergerak, dan kendaraan (mobil, motor, sepeda) tidak ditampilkan langsung (lewat suasana, suara, atau di luar layar). Adegan berkelahi, olahraga, menari, berenang, memanjat atau naik tangga, berpelukan, makan/minum, dan jatuh belum bisa. VO dan naskah berbahasa Indonesia. Baru diuji di Mac Apple Silicon.

CHARACTER FLOW versi ini: 6 lokasi (kampus, kamar tidur, ruang kelas, kantor, kafe, ruang tamu) dan satu video boleh pindah-pindah lokasi; 10 tokoh (termasuk berhijab, ibu, ayah, anak sekolah) yang warna bajunya bisa diganti; maksimal 2 tokoh per lokasi; tanpa lip-sync, tanpa adegan lari, kendaraan, hewan, atau keramaian.


PANELVERSE versi ini: tokoh komik 3D stylized (tangan bulat tanpa jari terpisah), tanpa lip-sync; tanpa adegan berkelahi, menari, olahraga, atau keramaian; tempat berupa ruangan, jalan/taman sederhana, atau panggung komik abstrak; tulisan di layar berupa kata singkat dan kotak narasi (bukan subtitle penuh); hanya format vertikal 9:16.

STORYBOOK versi ini: tokoh boneka kertas (anak, dewasa, nenek/kakek; hijab, peci; kucing, kelinci, anjing, burung, bebek, ikan, kupu-kupu, bintang); 13 tempat (kebun, taman, desa, hutan, pantai, laut, gunung, sawah, sungai, kamar, sekolah, kota, langit); sampai 5 tokoh per halaman; tanpa kendaraan, berkelahi, atau menari; tulisan berbahasa Indonesia tercetak di halaman (tanpa subtitle); hanya vertikal 9:16.

CHRONICLE versi ini: tokoh siluet (tanpa wajah, tanpa lip-sync) dengan kostum sesuai peran dan zaman; 10 lokasi (makam, pendopo/istana, kamar, dek kapal, pelabuhan, benteng, hutan, desa, pantai, medan/kemah); peta untuk Asia Tenggara, Indonesia, dan Australia utara; tanpa pertempuran berkoreografi, kuda, atau armada kapal berlayar (perjalanan laut lewat rute di peta); tokoh nyata hanya sebagai siluet; fakta wajib bersumber; hanya vertikal 9:16.

BEDAH versi ini: bagian atap (rumbia, genteng, rangka bambu, kuda-kuda, gording, usuk, reng, kerpus, plafon) dan pondasi (tembok bata, galian, batu kali, sloof) sudah tersedia; untuk topik lain Claude membuat bendanya dulu, jadi lebih lama. Satu tukang tanpa wajah, satu lokasi desa siang hari (+ hujan), tampilan realistis-bergaya, vertikal 9:16 (16:9 kalau diminta). Videonya menjelaskan ide, bukan pengganti tukang atau insinyur.

CERDIK versi ini: 18 tokoh siap pakai (tukang, kepala desa, pedagang, ibu berkerudung, anak, kakek, nenek, petani, nelayan, ilmuwan, raja, prajurit, priyayi, warga, …) yang bisa kamu ganti sendiri lewat **kartu tokoh** (ketik "kartu tokoh": pilih tokoh T1–T18, rambut, penutup kepala, wajah, badan, warna, pakaian — mis. "Tokoh utama T5, baju W7, kerudung W2") dan bisa disimpan untuk serial ("simpan tokoh ini" → video berikutnya cukup sebut namanya), 10 ekspresi, 30 gerakan (tunjuk, ketawa, kaget, mikir, duduk, membungkuk, minum, kipas-kipas kepanasan, jalan, …); 5 dunia (desa adat, pasar, pantai nelayan, ruang rumah, istana/pendopo) dengan siang, sore keemasan, terik, malam, dan subuh; benda-benda (kendi, toples kaca, gelas, lampu, keranjang, …) yang bisa dibelah untuk memperlihatkan isinya; efek sorotan, keringat embun, uap, kilau, dingin, panas. Belum bisa: lari, lompat, berkelahi, naik kendaraan, hewan, benda jatuh/runtuh, lip-sync. Tempat di luar 5 dunia dibuatkan dulu (lebih lama). Vertikal 9:16 (16:9 kalau diminta).

NEGERI versi ini: serial harian "bikin negara dari nol" dengan negara yang diingat dari hari ke hari; 19 bangunan yang berdiri bertahap (tenda posko, rumah warga + papan nama, pos ronda, warung, musala, sekolah, puskesmas, lapangan, istana, pasar, kantor — bisa jadi DPR/kantor polisi/bank —, jalan, jembatan, menara air, taman, kolam, gapura, stasiun, bandara mini) plus bangunan baru yang dibuat per cerita; 5 pemimpin + 13 warga yang bisa kamu ganti dan simpan (ketik "kartu tokoh"), 24 gerakan, 11 ekspresi, drama warga (tidur, duduk, ngobrol, makan, antre, ribut, merayakan, menonton), pagi/siang/sore/malam. Belum bisa: tokoh berjalan, lari, naik kendaraan, hewan, hujan, benda jatuh/runtuh, lip-sync; warga tidak bicara (hanya suara pemimpin). Satu peta negara (17 kavling bangunan + 40 rumah warga bernama). Vertikal 9:16 (16:9 kalau diminta).

TIPIKAL versi ini: 17 tokoh siap pakai (bapak, ibu berkerudung, mas, mbak, bocil, nenek, kakek, guru, bos, kurir/ojek tanpa merek, murid cowok/cewek, pegawai kantoran, tukang parkir, pengantin pria/wanita, pedagang) yang bisa kamu ganti sendiri lewat **kartu tokoh** (ketik "kartu tokoh": tokoh T1–T17, rambut, penutup kepala termasuk helm dan kerudung, atasan, bawahan, alas kaki, wajah, badan, kulit, warna — mis. "Tipe 1 pakai T3, jaket W1, helm K2 W7") dan bisa disimpan untuk serial ("simpan tokoh ini"); 21 ekspresi, 52 gerakan (naik motor, rem pakai sandal, maju-maju dikit, makan, minum, main HP, telepon, selfie, tidur, nulis, ngetik, angkat galon, antre, joget, jatuh, kaget, ketawa, marah, bisik-bisik, salaman, …); 6 tempat (jalan raya + lampu merah, gang + warung, ruang kelas, kantor, tenda kondangan, rumah) dengan siang, sore, malam; motor matic, motor bebek, sepeda, mobil, dan angkot yang benar-benar jalan; 33 benda; keramaian; tanda "?" / "!", balon kata, tulisan bunyi komik, label, dan stempel. Belum bisa: lip-sync, hewan, kejar-kejaran, berkelahi, benda pecah/tumpah. Tempat di luar 6 tempat dibuatkan dulu (lebih lama). Vertikal 9:16 (16:9 kalau diminta), ±15–30 detik.

NEKAT versi ini: 3D gaya mainan tanah liat di 3 tempat (gang rumah, kebun + kandang, halaman sekolah); satu jenis hewan yang makin banyak per video (kucing, ayam, bebek, atau kambing, dengan 11 variasi warna) dan paling banyak 2 orang di layar (9 tokoh orang T1–T9 + hewan H1–H11 yang bisa kamu ganti dan simpan lewat "kartu tokoh"); 13 alat (sapu, selang, penyedot debu, mobil damkar mini, kipas raksasa, jaring, umpan, toa, terompet, payung, drone, kardus jebakan, ember); 5 akhir (tidur di gunung hewan, dipelihara, kabur, menyerah, "PART 2" dengan hewan raksasa). Tokohnya tetap di tempat (atau naik mobil damkar mini), tanpa berjalan keliling atau berkelahi, tanpa lip-sync. Tempat terisi sampai ±1.000 hewan; angka lebih besar tampil sebagai tempat yang penuh. Vertikal 9:16 (16:9 kalau diminta), 15–30 detik tanpa narator, sampai ±45 detik dengan narator.

BONGKAR versi ini: satu benda per video di studio putih yang bersih, ±4–30 part (baut ikut dihitung), dibuat dari bentuk dasar (kotak, silinder, cincin, pipa, profil putar) dengan cat, plastik, logam, dan karet yang tampak nyata; warna bisa kamu pilih. Part bergerak lurus keluar (tanpa engsel yang membuka, ulir yang diputar, atau kabel yang melengkung); benda organik (sepatu, boneka) dan elektronik yang sangat detail belum cocok. Desain umum tanpa merek, dan jumlah part adalah "versi sederhana", bukan jumlah part produk asli. Vertikal 9:16 (16:9 kalau diminta), ±20–35 detik.

Video penjelasan 2D/infografik, grafik data, video teks saja, slideshow foto, editing video asli, atau talking-head. Claude akan memberi tahu bila idemu kurang cocok.
