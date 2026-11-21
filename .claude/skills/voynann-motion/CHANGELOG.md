# Changelog — VOYNANN Motion 3D

## v1.12.0
Satu gaya baru; ke-18 gaya yang sudah ada tidak berubah.
- **Gaya baru #19 — BONGKAR:** benda sehari-hari **membongkar dirinya sendiri** — "isinya ada berapa part?". Di studio
  putih yang bersih, baut berputar keluar, part terangkat satu per satu dari luar ke dalam dan tersusun jadi exploded
  view berlabel, angka "n / N part" bertambah, kamera masuk ke bagian jantungnya (bagian lain memudar), lalu semuanya
  menyatu lagi dan berulang. Cukup sebut bendanya.
  - **Mesinnya yang menentukan:** urutan bongkar, arah lepas tiap part, posisi akhirnya, dan pemeriksaan bahwa tidak
    ada part yang menembus part lain sepanjang gerakan — Claude cukup membuat model part-partnya (dicek dulu dari
    empat sisi supaya mirip benda aslinya).
  - **Suara:** tanpa narator juga jadi (musik + efek suara: baut, desing part, klik saat mendarat). Claude memberi
    naskah VO (juga versi ElevenLabs v3) yang urutannya sama dengan urutan bongkar; dengan VO-mu tiap part lepas tepat
    saat namanya disebut — pakai whisper.cpp kalau terpasang, tanpa itu tetap jalan.
  - Contoh: rice cooker dan kipas angin. Vertikal 9:16, landscape 16:9 kalau diminta.

## v1.11.0
Tiga gaya baru dari tren Shorts/Reels yang sedang ramai; ke-15 gaya yang sudah ada tidak berubah.
- **Gaya baru #16 — NEGERI:** serial harian **"bikin negara dari nol"** — follower jadi WARGA, komen teratas jadi
  bangunan berikutnya. Pemimpin chibi (presiden, presiden berkerudung, raja kocak, ratu, pak lurah) di dunia 3D
  low-poly yang bersih dan hangat; angka populasi berputar sambil tenda dan rumah bermunculan, kartu komen teratas
  dibacakan, bangunan yang diminta berdiri tahap demi tahap dengan kartu progres, papan nama rumah dengan nama
  komentator, drama kecil warga, lompatan waktu (malam dengan lampu rumah menyala), kartu "Besok bangun apa? KOMEN!".
  - **Negaranya diingat:** tiap hari yang selesai disimpan — besok lanjut dari hari ini (bangunan, rumah warga, jumlah
    warga). Bisa punya beberapa serial sekaligus.
  - **Yang sudah ada:** 19 bangunan (tenda posko, rumah warga, pos ronda, warung, musala, sekolah, puskesmas,
    lapangan, istana, pasar, kantor — jadi DPR/kantor polisi/bank, jalan, jembatan, menara air, taman, kolam, gapura,
    stasiun + kereta, bandara mini) plus bangunan baru yang dibuat per cerita; 5 pemimpin + 13 warga, 24 gerakan,
    11 ekspresi, 8 jenis drama warga; pagi, siang, sore, malam.
- **Gaya baru #17 — TIPIKAL:** video komedi **"tipe-tipe orang …"** — satu situasi sehari-hari (naik motor, ujian,
  kondangan, kantor, buka puasa) dibagi jadi 3–5 tipe bernomor. Tiap tipe 3–6 detik: kartu tipe muncul, tokohnya
  beraksi, lalu punchline — muka kaget orang lain, tanda "?" / "!", tulisan bunyi komik (CIIIT! GUBRAK!), adegan
  dibekukan dengan label. Ditutup "Kamu tipe yang mana?". Tanpa narator; VO boleh ditambahkan.
  - **Yang sudah ada:** 6 tempat 3D (jalan raya + lampu merah, gang + warung, ruang kelas, kantor, tenda kondangan,
    rumah); 17 tokoh dengan 21 ekspresi dan jari sungguhan; 52 gerakan; motor matic, motor bebek, sepeda, mobil, dan
    angkot yang benar-benar jalan, lengkap dengan boncengan dan barang bawaan; 33 benda; keramaian; siang/sore/malam.
- **Gaya baru #18 — NEKAT:** tantangan bersambung — **tokoh yang sama melawan hewan yang makin banyak tiap dicoba**
  ("Bisa gak Pak Darto ngusir Si Oren? Tiap diusir… kucingnya nambah"). Penghitung dengan tanda ×N, LEVEL tiap alat
  (sapu, selang, penyedot debu, mobil damkar mini, kipas raksasa, jaring, umpan, toa, terompet, payung, drone, kardus
  jebakan, ember), akhir lucu (tidur di gunung kucing, dipelihara, kabur, menyerah, atau "PART 2" dengan hewan
  raksasa), dalam 3D gaya mainan tanah liat: gang rumah, kebun + kandang, halaman sekolah. Tanpa narator juga jadi.
  Part berikutnya melanjutkan angka penghitung, tempat, dan tokohnya.
- **Ketiganya:** cukup satu kalimat; tokoh bisa dipilih, diganti, dan disimpan lewat **kartu tokoh**; kamera otomatis
  yang memastikan tokohnya kelihatan; musik dan efek suara orisinal; lolos pemeriksaan anti-tembus/kedip/loncat;
  vertikal 9:16 (16:9 kalau diminta).

## v1.10.1
CERDIK: **tokoh bisa dipilih, diganti dan disimpan** oleh pembeli. Gaya lain tidak berubah.
- **Kartu tokoh:** ketik "kartu tokoh" → 3 gambar pilihan bernomor: 18 tokoh siap pakai (T1–T18), rambut (R),
  penutup kepala (K: kerudung, peci, blangkon, caping, topi, ikat kepala, mahkota), wajah (F: kacamata, kumis,
  jenggot, …), badan (B: anak sampai gemuk), 16 warna (W) dan bagian pakaian. Cukup tulis, misalnya
  "Tokoh utama T5, baju W7, kerudung W2" atau dengan kata-kata biasa.
- **Cek tokoh sebelum render:** gambar semua tokoh di video (badan + wajah, dengan nama). Ikut ditunjukkan bersama
  naskah kalau kamu cuma kasih topik, dan saat video dikirim.
- **Simpan tokoh untuk serial:** "simpan tokoh ini" → file `tokoh/tokoh-<nama>.json`. Video berikutnya cukup sebut
  namanya, tokohnya sama persis (baju bisa diganti per video).
- Pilihan tokoh yang salah tulis langsung ketahuan sebelum render, dengan penjelasan yang jelas.

## v1.10.0
Satu gaya baru; ke-14 gaya yang sudah ada tidak berubah.
- **Gaya baru #15 — CERDIK:** cerita singkat trik cerdik yang **diketawain dulu, terbukti benar** — tokoh kepala bulat
  putih berwajah 2D lucu, kaki-tangan lidi, kostum berwarna, di dunia 3D yang kaya detail. Potongan adegan cepat tiap
  ±2 detik tepat di kata VO, teks satu kata, sorotan bercahaya di benda kuncinya, benda yang bisa dibelah untuk
  memperlihatkan isinya (air di dalam kendi), keramaian, siang/terik/malam/subuh, hujan (langit kelabu, rintik yang
  berhenti di atap/tenda, riak di tanah, suara hujan), musik dan efek suara orisinal.
  Cukup satu kalimat ("Buatkan video CERDIK dari VO ini: …"); topik saja juga bisa (naskah ditulis dulu untuk disetujui).
  - **Yang sudah ada:** 5 dunia — desa adat ala Nias, pasar tradisional, pantai nelayan, ruang rumah, istana/pendopo
    Jawa; 19 tokoh siap pakai (warna bisa diganti; berkerudung, berpeci, bercaping, bermahkota, berkacamata, …),
    10 ekspresi, 30 gerakan (termasuk jalan, duduk, membungkuk, minum, pegang barang); ±25 benda siap pakai plus
    benda baru yang dibuat per cerita.
  - **Kamera otomatis yang "melihat":** tiap adegan, kamera mencoba banyak sudut dan menolak yang membuat tokoh
    tertutup tiang, lapak, atau orang lain — jadi tokohnya selalu kelihatan di frame vertikal yang sempit.
  - **Batas:** belum ada lari, lompat, berkelahi, hewan, kendaraan bergerak, atau benda yang jatuh/runtuh; tempat di
    luar 5 dunia dibuatkan dulu (lebih lama). Vertikal 9:16 (16:9 kalau diminta).

## v1.9.0
Semua gaya sekarang lewat **pemeriksaan otomatis anti-tembus, anti-kedip dan anti-loncat** sebelum video final dibuat.
Tampilan ke-14 gaya tidak berubah.
- **Anti-tembus:** tangan yang menembus cangkir, badan yang masuk ke meja, dua orang yang saling menembus — dicari
  langsung di adegan 3D-nya (bukan ditebak dari gambar), hanya yang benar-benar terlihat kamera yang dianggap salah.
- **Anti-loncat:** tangan, kepala, properti atau kamera yang tiba-tiba melompat satu frame lalu kembali, atau kamera
  yang meloncat di tengah adegan tanpa potongan yang direncanakan.
- **Anti-kedip:** benda yang hilang atau muncul hanya satu-dua frame, permukaan yang berkedip (z-fighting), bayangan
  atau tekstur yang bergetar, layar yang berkedip putih/hitam.
- **Cara kerjanya untuk kamu:** tidak ada yang perlu kamu lakukan. Claude menjalankannya sendiri sebelum preview
  ditunjukkan dan sebelum video final dirender; kalau ada yang salah, itu diperbaiki dulu. Perubahan yang memang
  disengaja (kedipan mata kartun, huruf mesin ketik, angka yang berputar) diperiksa satu per satu dan dicatat.
- **Waktu:** pemeriksaan ini makan waktu kira-kira sepanjang render preview (±1 menit untuk video 30 detik).
- **Batas:** yang dicek tembus-nya adalah tokoh, properti yang dipegang dan perabot yang disentuh. Benda lain tetap
  dicek kedip dan getarnya lewat gambar.
- **CINÉSTORY — perbaikan yang ditemukan pemeriksaan ini:** tokoh yang mulai berjalan sekarang berbalik badan dengan
  mulus (sebelumnya badannya berputar sampai 170° dalam satu frame); kamera "mengikuti dari belakang" mengikuti arah
  jalan, bukan arah badan, jadi tidak lagi berpindah-pindah sisi; kamera yang terdorong keluar dari dinding selalu
  ke sisi tokohnya; tokoh di tempat yang tinggi (balkon mercusuar, atap, dermaga) tidak lagi "jatuh" ke tanah di bawahnya.

## v1.8.0
Semua gaya sekarang bisa dibuat **landscape 16:9** kalau kamu memintanya. Tanpa permintaan, hasilnya tetap vertikal
9:16 seperti sebelumnya — tidak ada yang berubah untuk video vertikal.
- **Cara minta:** tambahkan "versi landscape 16:9" (atau "untuk YouTube", "horizontal") di permintaanmu, di gaya
  apa pun. Bisa juga menyusul: "buatkan juga versi landscape-nya". Mau dua-duanya? "Buat versi vertikal dan
  landscape" — yang vertikal diselesaikan dulu.
- **Hasilnya:** 1920×1080 @ 60 fps (preview 960×540), disutradarai ulang untuk frame lebar: kamera, tata letak, dan
  teks disusun lagi. Bukan video vertikal yang dipotong atau diberi bingkai hitam.
- **Gaya dengan sutradara otomatis** (CINÉSTORY, CHARACTER FLOW, PANELVERSE, STORYBOOK, CHRONICLE, BEDAH): naskah dan
  VO yang sama dipakai untuk kedua format; kamu tidak perlu menulis dua versi.
- **Gaya lainnya** (PIXELSTORY, VOXELVERSE, PRECISION, PAPERWORLD, INNERWORKS, WORLDFORGE, TIMEFORGE, BUILDFORGE):
  Claude menata ulang kamera dan teks untuk frame lebar; set yang lebih lebar butuh waktu sedikit lebih lama.
- **Perbaikan kecil:** bayangan lembut di bawah benda di studio terang tidak lagi terlihat sebagai kotak samar di
  samping alas saat kamera menjauh.
- **Batas:** format persegi 1:1 dan 4:5 belum tersedia.

## v1.7.0
Satu gaya baru; ke-13 gaya yang sudah ada tidak berubah.
- **Gaya baru #14 — BEDAH:** video penjelasan "gimana sih dibikinnya, dan kenapa begitu" dengan pola kalimat
  "Kalau kamu … kamu udah punya …. Tapi …. Jadi kamu …". Lokasi bangunan 3D yang realistis di siang cerah, desa di
  belakang, **tanah dipotong di depan** sehingga pondasi dan lapisan tanah kelihatan, tukang bercaping yang bekerja,
  tiap bagian datang tepat saat kalimatnya diucapkan dan diberi label, plus panah dan garis penjelas putih.
  Cukup satu kalimat ("Buatkan video BEDAH dari VO ini: …"); topik saja juga bisa. Claude menyusun adegan, kamera,
  label, musik, dan efek suara, mengecek gambarnya sendiri, lalu memberikan video final 1080×1920 @ 60 fps.
  - **Yang sudah ada:** rumah kecil berdinding anyaman bambu, atap rumbia yang bisa lapuk, genteng tanah liat yang
    tersusun tumpang-tindih, rangka bambu yang bisa melendut, kuda-kuda kayu, gording, usuk, reng, kerpus, plafon,
    pojok pembuat genteng (cetakan, jemuran, tungku), dan set pondasi (tembok bata, galian, batu kali, sloof).
  - **Topik lain** (tembok, sumur, jalan, lantai, …): Claude membuat dulu benda-bendanya untuk naskahmu, jadi
    waktunya lebih lama.
  - **Suara:** VO-mu tidak dipotong; cut, teks, dan label mengikuti kata yang diucapkan. Musik dan efek suara
    orisinal, −14 LUFS. Tanpa VO, video dibuat dulu dengan musik saja dan kamu dapat teks VO siap rekam.
  - **Contoh:** "Atap" (16 kalimat) dan "Pondasi" (7 kalimat).
  - **Batas versi ini:** satu tukang (tanpa wajah, tanpa jalan kaki), satu lokasi desa siang hari (+ hujan),
    tampilan realistis-bergaya (bukan foto-nyata), vertikal 9:16. Videonya menjelaskan ide, bukan panduan teknik.

## v1.6.0
Dua gaya baru; ke-11 gaya yang sudah ada tidak berubah.
- **Gaya baru #12 — STORYBOOK:** naskah cerita anak jadi buku cerita bergambar sungguhan di atas meja, di bawah lampu
  baca. Sampul tertutup lalu dibuka, halaman demi halaman dibalik, gambar kertas yang dicat (cat air, krayon, guas),
  boneka kertas berpaku kuningan yang bergerak, tulisan cerita tercetak di bawah gambar, dan lampu meredup di akhir.
  Cukup satu kalimat ("Buatkan video STORYBOOK dari naskah ini: …"); ide saja juga bisa. Claude menyusun halaman,
  tokoh, dan tempat, mengecek gambarnya sendiri, lalu memberikan video final 1080×1920 @ 60 fps.
  - **Tokoh:** anak, dewasa, dan nenek/kakek; 8 gaya rambut termasuk hijab dan peci; 5 jenis pakaian dengan warna dan
    motif bebas; kucing, kelinci, anjing, burung, bebek, ikan, kupu-kupu, dan bintang hidup.
  - **Gerak dan tempat:** 20 aksi (jalan, lari, melompat, melambai, menangis, tidur, memeluk, mengintip dari jendela,
    jatuh dari langit, terbang, menerbangkan layang-layang…); 13 tempat; 5 suasana waktu; ±40 benda.
  - **Suara:** VO-mu tidak dipotong; halaman diberi jeda supaya tiap balik halaman jatuh di antara kalimat. Musik kotak
    musik orisinal dan suara kertas, −14 LUFS.
  - **Contoh:** buku "Mimi dan Payung Kuning" dan "Bintang Kecil yang Jatuh". Panduan naskah pembeli:
    `FORMAT-NASKAH-BUKU.md`.
- **Gaya baru #13 — CHRONICLE:** naskah sejarah jadi dokumenter 3D bergaya siluet. Lokasi 3D hangat berlatar cahaya,
  tokoh siluet hitam dengan garis tepi berwarna untuk tokoh penting, dan peta relief 3D dari garis pantai asli (Natural
  Earth) dengan rute, titik kota, dan cincin dentuman. Tanggal besar, angka bergulir, kutipan sumber, caption per kata,
  dan kartu penutup berisi daftar sumber. Cukup satu kalimat ("Buatkan video CHRONICLE dari VO ini: …"), atau cukup
  topiknya: Claude menyusun naskah lengkap dengan sumbernya dulu untuk kamu setujui.
  - **Lokasi dan suasana:** 10 lokasi (makam, pendopo/istana, kamar, dek kapal, pelabuhan, benteng, hutan, desa, pantai,
    medan/kemah) dalam 8 suasana (senja, malam berbulan, pagi berkabut, siang, terbakar, interior siang/malam…).
  - **Tokoh:** kostum mengikuti peran dan zaman: serdadu shako atau topi segitiga, perwira bicorne, destar, peci,
    blangkon, sorban, caping, sarung, kain, jubah.
  - **Peta:** ±180 nama tempat untuk Indonesia dan sekitarnya.
  - **Suara:** musik orisinal per adegan (string, drone, metalofon bernuansa gamelan, kendang, gong) dan efek suara per
    lokasi, diredam saat narator bicara, −14 LUFS.
  - **Contoh:** "Ditangkap Saat Lebaran" (Diponegoro) dan "Dentuman dari Timur" (Tambora 1815), lengkap dengan teks VO
    untuk ElevenLabs, termasuk versi dengan tag ekspresi v3. Panduan naskah pembeli: `FORMAT-NASKAH.md`.
- **Teks VO saja:** kedua gaya menerima VO dengan atau tanpa whisper.cpp. Tanpa whisper, kalimat naskah dicocokkan ke
  jeda VO.
- `new-project.mjs`: proyek dari gaya yang berdiri sendiri (CINÉSTORY, STORYBOOK, CHRONICLE) diberi penanda
  `voynann-kit.json`. Gaya lain tidak bisa ditambahkan ke folder itu, sedangkan memakai gaya yang sama di folder itu tetap
  bisa (proyek lama).

## v1.5.0
Gaya baru, tanpa perubahan pada 10 gaya yang sudah ada.
- **Gaya baru #11 — PANELVERSE:** voice-over diceritakan sebagai komik pop retro yang hidup. Panel membanting ke halaman,
  terbelah, membesar jadi adegan 3D, pecah, dan membeku; titik halftone di bayangan, garis tinta tebal, warna pop,
  tulisan komik, cap stempel, garis kejut, banjir tinta, dan efek suara. Cukup satu kalimat ("Buatkan video PANELVERSE
  dari VO ini: …"): Claude menyusun beat per kalimat, memilih perangkat komik yang berbeda untuk tiap momen, memilih dan
  menyesuaikan tokoh serta tempat, merancang minimal satu benda khusus untuk naskahmu, mengecek gambarnya sendiri, lalu
  memberikan video final 1080×1920 @ 60 fps dengan efek suara (−14 LUFS).
- Isi mesin PANELVERSE:
  - tokoh parametrik (11 gaya rambut termasuk hijab, 7 jenis atasan, 5 bentuk tubuh, kacamata, kumis, dasi) dengan
    23 ekspresi;
  - 58 benda bergaya komik, 10 set siap remix, 8 panggung komik abstrak;
  - 12 tata letak panel, 12 transisi, 11 efek komik;
  - 45 efek suara sintesis yang ditempatkan otomatis dan diredam saat narasi bicara;
  - pemeriksa cerita (lint) yang menolak video monoton (tata letak, transisi, dan perangkat harus berganti) dan tulisan
    di luar area aman.
- Font komik baru (Bangers, Luckiest Guy, Comic Neue — SIL OFL 1.1) disertakan di `kits/panelverse/public/fonts`.
- `new-project.mjs`: folder cerita PANELVERSE (`src/pv-stories/`) di proyek yang sudah ada tidak pernah ditimpa.
- **Upload di aplikasi Claude kini bisa (cara A).** Upload skill di aplikasi menerima maksimal 200 file, sedangkan v1.4.x
  berisi 444 file sehingga ditolak ("Zip contains too many files"). Kode starter dan tiap kit kini dikemas di file
  `PACKED_SOURCE*.txt` dan dibuka otomatis oleh `new-project.mjs`, jadi skill ini hanya berisi 150 file. Dokumen, contoh,
  dan font tetap berupa file biasa. Proyek yang dihasilkan identik byte per byte dengan sebelumnya untuk ke-11 gaya.

## v1.4.1
Patch perbaikan sebelum distribusi. Tidak ada fitur baru; 10 gaya dan semua peningkatan v1.4.0 tetap.
- **Perbaikan setup:** `new-project.mjs --kit=precision` dan `--kit=innerworks` kini menyiapkan proyek dari starter
  (mesin inti). Sebelumnya ditolak karena kedua gaya itu memang tidak punya folder kit. Gaya lain tidak berubah.
- **Kebutuhan Node.js disamakan** di semua dokumen: minimal 22.18 untuk CINÉSTORY 3D, 22.13 untuk gaya lain
  (versi 22.18 ke atas cukup untuk semua gaya).
- **Acuan kualitas CINÉSTORY 3D** (`references/quality-bar/cinestory.jpg`): tujuh frame dari render uji CINÉSTORY yang
  lolos 13 cek otomatis dan review visual.
- **Batasan CINÉSTORY 3D ditulis lebih lengkap dan konsisten:**
  - 1–2 tokoh per adegan;
  - bangunan dari luar, benda rumit, dan sosok/makhluk dibuat sebagai bentuk sederhana;
  - kendaraan dan hewan bergerak tidak ditampilkan;
  - adegan berkelahi, olahraga, menari, berenang, memanjat, berpelukan, makan/minum, dan jatuh belum bisa;
  - VO berbahasa Indonesia;
  - versi 16:9 memakai subtitle file `.srt`;
  - baru diuji di Mac Apple Silicon.

  Contoh di dokumen yang bisa terbaca sebagai hewan bergerak atau badai dengan hujan sudah diperbaiki.
- **CHARACTER FLOW:** ikon di gelembung pikiran (?, !, ×) tidak lagi terpotong tepi atas frame. Ukuran dan posisinya
  menyesuaikan shot. Di close-up yang tidak menyisakan ruang di atas kepala, ikon tidak dimunculkan, dan ekspresi
  wajah yang membawa momennya. Gambar lain tidak berubah. Temuan ini muncul dari uji ulang sebelum rilis.

## v1.4.0
- **Gaya baru #09 — CINÉSTORY 3D:** film pendek 3D sinematik dari voice-over. Cukup satu kalimat ("Buatkan video
  CINÉSTORY 3D dari VO ini: …"): Claude membaca VO dan naskah, membangun lokasi dan benda yang dibutuhkan cerita (kantor,
  toko, jalan kota, rumah, hutan, pesisir…), menyutradarai tokoh, kamera, cahaya, teks, musik, dan efek suara otomatis,
  mengecek hasilnya (cek geometri, 13 cek otomatis, review visual), lalu memberikan video final **vertikal 9:16
  1080×1920 60 FPS** dengan subtitle di area aman TikTok/Reels + file `.srt`. Versi YouTube 16:9 kalau diminta. Brand kit
  opsional untuk penutup, watermark, dan intro.
- Proyek CINÉSTORY berdiri sendiri (`new-project.mjs --kit=cinestory`), sehingga gaya lain tidak berubah.
- CINÉSTORY menjaga variasi shot dan wajah: close-up tidak beruntun, insert ponsel dibuka dengan layar terlihat, gestur
  berpikir tanpa tangan menutupi wajah di close-up, kamera menghindari tubuh orang lain, dan cek baru menghentikan
  close-up yang hanya memperlihatkan belakang kepala.
- Dunia bawaan `kos`: pagar, tiang gerbang, tiang teras, motor, dan rumah tetangga kini dikenali kamera (tidak ada lagi
  shot dari balik tembok halaman). Kartu judul tidak menimpa wajah close-up. Callout bisa ditempel ke tokoh.
- **CINÉSTORY siap pakai berulang:** 5 world jadi yang sudah dites — `rumah` (ruang tamu, dapur, kamar, lorong belakang dengan lemari tua, teras),
  `sekolah` (kelas, koridor, lapangan), `kantor`, `minimarket` (+ jalan), `perpustakaan` — dan 38 objek siap pakai
  (perabot rumah, sekolah, kantor, toko). Film berikutnya tinggal memakai lokasi yang ada; `node scripts/worlds.mjs`
  menampilkan isi tiap world. Analyzer kini memilih world yang paling cocok, menuliskan semua pilihan di
  REQUIREMENTS.md, dan mengenali 47 kata benda (lemari, sofa, kulkas, kasur, TV, papan tulis, printer, CCTV…) sebagai
  objek library yang siap dipakai.
- **CHARACTER FLOW diperbarui besar:**
  - 6 lokasi: kampus, kamar, ruang kelas, kantor, kafe, ruang tamu;
  - satu video boleh pindah-pindah lokasi (`scenes`), lengkap dengan suasana suara per tempat;
  - 10 tokoh, termasuk dua berhijab, ibu, ayah, dan anak sekolah;
  - warna baju, rambut, hijab, dan rok bisa diganti per video;
  - sampai 4 tokoh per cerita (maksimal 2 per lokasi);
  - QA otomatis kini 13 cek, ditambah lembar review visual.
- CHARACTER FLOW lebih rapi di layar:
  - HP di tangan tetap masuk frame;
  - pose tangan (berpikir, bicara) turun sendiri dan tidak menempel sampai beat berikutnya;
  - gelembung pikiran tidak terpotong close-up dan membesar di shot lebar;
  - lampu kamar malam tidak lagi membuat titik silau di dinding, dan seprai siang tidak pecah putih;
  - tidak ada lagi shot "over-the-shoulder" ke diri sendiri;
  - shot berdua di ruangan memilih sudut yang memuat keduanya;
  - tidak ada cut yang terlalu cepat (< 0,7 dtk);
  - teks caption tidak menimpa wajah maupun gelembung pikiran;
  - ruangan siang dan baju putih tidak pecah putih.
- CINÉSTORY: insert HP mencari sudut di atas bahu yang tidak terhalang kepala/leher, termasuk pindah ke bahu lain
  (sebelumnya bisa menampilkan tengkuk). Kamera tidak lagi didorong jauh dari pintu yang tertutup.
- CHARACTER FLOW: urutan adegan dicek. Cue yang jatuh sebelum adegan sebelumnya (kata yang diucapkan berulang)
  dihentikan dengan saran `kata#n`.
- Proyek berisi banyak video: satu cerita yang sedang salah tidak lagi menggagalkan render cerita lain (CINÉSTORY dan
  CHARACTER FLOW).
- Paket npm: `zod` ditambal (GHSA-mrhx-c7xc-m3w5) — `npm ci` kini 0 kerentanan.
- Node.js minimum kini 22.18 untuk CINÉSTORY (gaya lain tetap 22.13).

## v1.3.0
- **Gaya baru #10 — CHARACTER FLOW:** tokoh 3D ekspresif memerankan cerita dari voice-over. Cukup satu kalimat
  ("Buatkan video CHARACTER FLOW dari VO ini: …"): Claude membaca VO, menyusun adegan, memilih tokoh, aksi, ekspresi,
  dan kamera otomatis, membuat musik + efek suara, mengecek hasilnya, lalu memberikan video final 1080×1920 60 FPS.
  Versi ini: lokasi kampus (siang/sore) dan kamar tidur (malam/siang), 5 tokoh (maks 2 per video), 38 aksi,
  26 ekspresi, HP dan tas selempang, gelembung pikiran, papan dan tumbleweed lucu. Tanpa lip-sync.
- Transkripsi VO otomatis dengan whisper.cpp (opsional), atau dari teks naskah. Narasi TTS offline (macOS) hanya
  dengan persetujuanmu.
- `new-project.mjs`: Claude menyiapkan proyek + mesin gaya dengan satu perintah.
- Pesan progres render lebih ringkas; `check-env` juga melaporkan whisper.cpp dan suara TTS bila tersedia.
- Nomor gaya #09 dicadangkan untuk gaya yang masih dikembangkan.

## v1.2.0
- **Empat gaya kini punya mesin khusus:** PIXELSTORY (pixel art 2.5D dengan cahaya per piksel), VOXELVERSE (dunia miniatur voxel), PAPERWORLD (diorama kertas, termasuk pintu tembus ke dunia lain), dan BUILDFORGE (bangunan dirakit tahap demi tahap, dengan pengecekan urutan konstruksi otomatis). Masing-masing disertai contoh teknis, jadi tampilannya konsisten dari film ke film.
- Semua gaya sekarang bisa dipilih tanpa label "eksperimental"; PRECISION dan INNERWORKS tetap dibangun di atas mesin inti.
- Empat font pixel dan judul berlisensi OFL (Anton, Instrument Serif, Silkscreen, Space Grotesk) ikut di paket PIXELSTORY.
- Pengaman tambahan di efek kamera: satu piksel bermasalah tidak lagi bisa membuat seluruh frame tampak putih atau pudar.

## v1.1.0
- **Brand kit:** `voynann-brand.json` (nama channel, handle, CTA, warna) dipakai di teks judul, penutup, dan label. Warna aksen hanya dipakai kalau tetap terbaca di atas latar gayanya. File yang sama berlaku untuk semua skill VOYNANN.

## v1.0.1
- **Font ikut di dalam paket.** Manrope sekarang disertakan, jadi render tidak lagi bergantung pada koneksi ke Google Fonts dan hasil teks sama di semua komputer.
- **Volume final lebih konsisten.** Mastering mengukur ulang hasilnya dan mengoreksi otomatis sampai sekitar −14 LUFS, standar media sosial.
- **Komputer tanpa kartu grafis (GPU).** Kalau render 3D lewat GPU tidak bisa dipakai, render otomatis pindah ke mode software, tanpa perlu setting manual. Pilihan ini diingat untuk render berikutnya.
- **Panduan instalasi** diperbarui ke menu Claude terbaru (Customize → Skills) dan sinkronisasi ke Claude Code.
- **Status tiap gaya** sekarang dijelaskan di `START_HERE.md`.
- Perbaikan format `SKILL.md` agar terbaca di semua versi Claude Code.

## v1.0
- Rilis pertama: 8 gaya sinematik (PIXELSTORY, VOXELVERSE, PRECISION, PAPERWORLD, INNERWORKS, WORLDFORGE, TIMEFORGE, BUILDFORGE), starter Remotion + React Three Fiber, mesin TIMEFORGE dan WORLDFORGE, preview 540×960 dan final 1080×1920 60 FPS dengan voice-over.
