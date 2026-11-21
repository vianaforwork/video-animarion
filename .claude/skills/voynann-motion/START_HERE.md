# VOYNANN Motion 3D — Mulai di sini

*Versi 1.12 · Early Access*

**VOYNANN Motion** adalah *skill* untuk Claude yang membuat **video animasi 3D sinematik vertikal (9:16)**
dari ide, atau dari naskah + voice-over MP3. Kamu tidak perlu bisa coding. Kamu cukup bercerita;
Claude yang memilih gaya, menyiapkan proyek, membuat preview, lalu merender video final
**1080×1920, 60 FPS**. Mau untuk YouTube? Tulis "versi landscape 16:9" di permintaanmu dan videonya dibuat
**1920×1080** untuk layar lebar, di semua gaya. Kalau tidak diminta, hasilnya selalu vertikal 9:16.

## 3 langkah singkat

1. **Siapkan komputer** (sekali saja): Claude Code, Node.js, dan ffmpeg → lihat `INSTALLATION_GUIDE.md`.
2. **Pasang skill** ini → lihat `INSTALLATION_GUIDE.md`, bagian "Pasang skill".
3. **Ketik di Claude Code:**

   ```
   /voynann-motion Aku mau bikin video evolusi kamera dari kamera film sampai mirrorless.
   ```

   Claude akan bertanya apakah kamu memakai voice-over, lalu mulai bekerja.

   **Baru — CINÉSTORY 3D (gaya #09):** punya voice-over yang bercerita — misteri, horor, kisah sehari-hari, "bagaimana kalau…"? Cukup satu kalimat:

   ```
   /voynann-motion Buatkan video CINÉSTORY 3D dari VO ini: /Users/kamu/Downloads/vo.mp3 (naskahnya: /Users/kamu/Downloads/naskah.txt)
   ```

   Claude membangun lokasi ceritamu (kantor malam, toko, jalan kota, pesisir…), menyutradarai tokoh, kamera, cahaya, teks, musik, dan efek suara, lalu memberikan video final vertikal 9:16 (versi YouTube 16:9 kalau diminta) — tanpa storyboard, tanpa tanya-jawab.

   **CHARACTER FLOW (gaya #10):** punya voice-over tentang kehidupan sehari-hari? Cukup satu kalimat:

   ```
   /voynann-motion Buatkan video CHARACTER FLOW dari VO ini: /Users/kamu/Downloads/vo.mp3
   ```

   Claude langsung menyutradarai tokoh 3D yang memerankan ceritamu dan memberikan video final — tanpa storyboard, tanpa tanya-jawab.

   **PANELVERSE (gaya #11):** mau ceritamu jadi komik pop retro yang hidup? Cukup satu kalimat:

   ```
   /voynann-motion Buatkan video PANELVERSE dari VO ini: /Users/kamu/Downloads/vo.mp3
   ```

   Claude menyusun ceritamu jadi halaman komik yang bergerak — panel membanting dan membesar jadi adegan 3D, titik halftone, tulisan komik, dan efek suara — dengan tokoh, tempat, dan benda yang dirancang khusus untuk naskahmu, lalu memberikan video final.

   **STORYBOOK (gaya #12):** punya dongeng atau cerita anak? Jadikan buku cerita bergambar sungguhan:

   ```
   /voynann-motion Buatkan video STORYBOOK dari naskah ini: /Users/kamu/Downloads/naskah-buku.txt
   ```

   Sampul dibuka, halaman demi halaman dibalik, gambar kertas yang dicat dengan boneka kertas yang bergerak, dan tulisan ceritanya tercetak di halaman. Format naskahnya ada di `FORMAT-NASKAH-BUKU.md` di dalam proyek; ide saja juga boleh, nanti Claude yang menulis ceritanya.

   **CHRONICLE (gaya #13):** cerita sejarah jadi dokumenter 3D bergaya siluet:

   ```
   /voynann-motion Buatkan video CHRONICLE dari VO ini: /Users/kamu/Downloads/vo.mp3 (naskahnya: /Users/kamu/Downloads/naskah.txt)
   ```

   Lokasi 3D hangat dengan tokoh siluet hitam, peta relief 3D dengan rute dan titik kota, tanggal besar, angka, dan kutipan sumber. Cukup topiknya juga boleh: Claude menyusun naskah lengkap dengan sumbernya dulu untuk kamu setujui.

   **BEDAH (gaya #14):** jelaskan gimana sebuah benda dibangun dan kenapa begitu, kalimat demi kalimat:

   ```
   /voynann-motion Buatkan video BEDAH dari VO ini: /Users/kamu/Downloads/vo.mp3 (naskahnya: /Users/kamu/Downloads/naskah.txt)
   ```

   Lokasi bangunan 3D yang realistis, tanah dipotong sehingga pondasi kelihatan, tukang yang bekerja, dan tiap bagian muncul saat disebut lengkap dengan labelnya. Pola naskahnya: "Kalau kamu … Tapi … Jadi kamu …". Cukup topiknya juga boleh, misalnya "video BEDAH tentang pondasi rumah".

   **CERDIK (gaya #15):** cerita trik cerdik yang awalnya diketawain lalu terbukti benar:

   ```
   /voynann-motion Buatkan video CERDIK tentang kenapa kendi tanah liat bikin air tetap dingin.
   ```

   Tokoh kepala bulat putih berwajah lucu di dunia 3D yang kaya warna (desa, pasar, pantai, rumah, istana), potongan adegan cepat, teks satu kata, sorotan bercahaya di benda kuncinya. Kirim VO + naskah, atau cukup topiknya: Claude menulis naskahnya dulu untuk kamu setujui.

   **NEGERI (gaya #16):** serial harian "bikin negara dari nol" — follower jadi warga, komen teratas jadi bangunan,
   negaranya diingat dari hari ke hari:

   ```
   /voynann-motion Buatkan video NEGERI hari 1: follower 12.480, komen teratas @budi.santuy "bikin pos ronda dong".
   ```

   Pemimpin chibi, angka warga berputar, kartu komen, bangunan berdiri bertahap, papan nama warga, drama kecil, dan
   kartu "besok bangun apa?". Hari berikutnya cukup "lanjut hari 2: follower …, komen teratas …".

   **TIPIKAL (gaya #17):** video komedi "tipe-tipe orang …" yang bikin penonton nge-tag temannya:

   ```
   /voynann-motion Buatkan video TIPIKAL tentang tipe-tipe pengendara motor.
   ```

   Tokoh kartun 3D di tempat yang akrab (jalan raya, gang, kelas, kantor, kondangan, rumah), kartu tipe bernomor,
   muka kaget, tanda "?" / "!", tulisan bunyi komik, musik dan efek suara — tanpa narator. Cukup topiknya, atau
   kirim sendiri tipe-tipenya.

   **NEKAT (gaya #18):** tantangan bersambung — tokoh yang sama melawan hewan yang makin banyak tiap dicoba:

   ```
   /voynann-motion Buatkan video NEKAT: Bisa gak Pak Darto ngusir Si Oren? Tiap diusir kucingnya nambah.
   ```

   Penghitung yang melompat (1 → 2 → 4 → … → 1.024), alat yang makin absurd tiap level, akhir lucu atau "PART 2",
   dalam 3D gaya mainan tanah liat. Simpan duonya, lalu "bikin part 2" melanjutkan angkanya.

   **BONGKAR (gaya #19):** benda sehari-hari membongkar dirinya sendiri — isinya ada berapa part?

   ```
   /voynann-motion Buatkan video BONGKAR rice cooker, isinya ada berapa part?
   ```

   Baut berputar keluar, part terangkat satu per satu jadi susunan berlabel dengan hitungan "n / N part", kamera
   masuk ke bagian jantungnya, lalu semuanya menyatu lagi. Tanpa narator juga jadi; Claude memberi naskah VO yang
   urutannya sama dengan urutan bongkar.

## Panduan lain

| File | Isi |
|---|---|
| `INSTALLATION_GUIDE.md` | Kebutuhan komputer dan cara memasang skill |
| `USER_GUIDE.md` | Alur membuat video, review preview, revisi, dan video final |
| `EXAMPLE_PROMPTS.md` | Contoh ide untuk kesembilan belas gaya |
| `TROUBLESHOOTING.md` | Solusi masalah yang sering terjadi |
| `LICENSE_AND_REQUIREMENTS.md` | Lisensi pihak ketiga dan syarat penggunaan |
| `BRAND_KIT.md` | Nama channel, warna, dan logo kamu dalam satu file untuk semua skill VOYNANN |
| `CHANGELOG.md` | Apa yang baru di tiap versi |

## Penting diketahui sebelum mulai

- Video dibuat **di komputermu sendiri** lewat **Claude Code** (tab *Code* di aplikasi desktop Claude, atau terminal). Chat biasa di claude.ai **tidak bisa** merender video ini.
- Paling disarankan **Mac dengan chip Apple (M1 ke atas)**, atau PC dengan kartu grafis (GPU). Tanpa GPU, render 3D jauh lebih lambat. Sebelum mulai, Claude otomatis mengecek komputermu dan merender tes kecil.
- Satu video bisa memakan puluhan menit kerja Claude. Di paket **Pro**, batas pemakaian bisa tercapai di tengah jalan; paket **Max** lebih lega untuk video panjang.
- Proyek pertama perlu internet dan ±1,2 GB ruang disk.
- Hasil untuk setiap ide baru biasanya perlu 1–2 putaran perbaikan preview sebelum final. CINÉSTORY 3D, CHARACTER FLOW, PANELVERSE, STORYBOOK, CHRONICLE, BEDAH, CERDIK, NEGERI, TIPIKAL, NEKAT, dan BONGKAR langsung memberikan video final; revisi bisa diminta setelahnya.

## Status gaya

| Status | Gaya | Artinya |
|---|---|---|
| **Sutradara otomatis** | CINÉSTORY 3D (#09) | Cukup kirim voice-over (+ naskah): Claude membangun lokasi dan benda yang dibutuhkan cerita, menyutradarai tokoh, kamera, cahaya, teks, musik, dan efek suara otomatis. Vertikal 9:16 (16:9 kalau diminta). Tokoh bergaya stylized, tanpa lip-sync, 1–2 tokoh per adegan; bangunan luar, benda rumit, dan sosok/makhluk berbentuk sederhana; kebakaran besar, ledakan, hujan, keramaian, hewan bergerak, dan kendaraan ditampilkan lewat suasana, suara, atau di luar layar. VO berbahasa Indonesia; diuji di Mac Apple Silicon |
| **Sutradara otomatis** | CHARACTER FLOW (#10) | Cukup kirim voice-over: Claude menulis alur adegan, tokoh berakting, kamera, teks, musik, dan efek suara otomatis. 6 lokasi (kampus, kamar, kelas, kantor, kafe, ruang tamu), boleh pindah lokasi dalam satu video, 10 tokoh termasuk berhijab, 1–2 tokoh per lokasi, tanpa lip-sync |
| **Sutradara per naskah** | PANELVERSE (#11) | Cukup kirim voice-over: Claude menyusun beat, memilih tokoh dan tempat, merancang benda khusus untuk naskahmu, lalu membuat komik 3D yang hidup — panel, halftone, tulisan komik, efek suara. Vertikal 9:16 (16:9 kalau diminta); tokoh stylized tanpa lip-sync; tanpa adegan berkelahi, menari, atau keramaian; tulisan di layar singkat (bukan subtitle penuh); diuji di Mac Apple Silicon |
| **Sutradara naskah** | STORYBOOK (#12) | Kirim naskah buku (dan VO kalau ada): halaman, tokoh boneka kertas (anak, dewasa, nenek/kakek, berhijab/berpeci, hewan), tempat, dan aksi disusun otomatis; tulisan tercetak di halaman, musik kotak musik dan suara kertas. 13 tempat, 20 aksi, sampai 5 tokoh per halaman; tanpa kendaraan; vertikal 9:16; diuji di Mac Apple Silicon |
| **Sutradara naskah** | CHRONICLE (#13) | Kirim naskah sejarah + VO, atau cukup topik: adegan, peta relief 3D, tokoh siluet, kostum sesuai zaman, tanggal, angka, kutipan, dan kartu sumber disusun otomatis; musik orisinal bernuansa gamelan. 10 lokasi, peta Asia Tenggara–Australia utara; tanpa adegan pertempuran berkoreografi atau kuda; tokoh nyata hanya sebagai siluet; vertikal 9:16; diuji di Mac Apple Silicon |
| **Sutradara naskah** | BEDAH (#14) | Kirim naskah berpola "Kalau kamu… Tapi… Jadi…" + VO, atau cukup topik: adegan per kalimat, kamera, tukang, label istilah, panah penjelas, musik, dan efek suara disusun otomatis. Bagian atap dan pondasi rumah sudah tersedia; topik lain dibuatkan dulu bendanya (lebih lama). Satu tukang tanpa wajah, satu lokasi desa siang hari (+ hujan); vertikal 9:16; bukan panduan teknik |
| **Sutradara naskah** | CERDIK (#15) | Kirim naskah + VO, atau cukup topik: dunia, tokoh kepala bulat, ekspresi, gerakan, kamera otomatis yang memastikan tokohnya selalu kelihatan, sorotan, potongan isi benda, keramaian, teks, musik, dan efek suara disusun otomatis. 5 dunia (desa adat, pasar, pantai, rumah, istana), 18 tokoh yang bisa kamu ganti dan simpan (ketik "kartu tokoh"), 30 gerakan; tanpa lari, berkelahi, hewan, atau kendaraan bergerak; vertikal 9:16; diuji di Mac Apple Silicon |
| **Sutradara serial** | NEGERI (#16) | Kirim input hari ini (nomor hari, jumlah follower, komen teratas) atau VO + naskah: pemimpin chibi, angka warga berputar, kartu komen, bangunan berdiri bertahap, papan nama warga, drama kecil, kartu "besok bangun apa?", musik dan efek suara disusun otomatis; negara disimpan dan dilanjutkan tiap hari. 19 bangunan (+ bangunan baru per cerita), 5 pemimpin + 13 warga yang bisa kamu ganti dan simpan (ketik "kartu tokoh"); tanpa tokoh berjalan, kendaraan bergerak, atau hujan; vertikal 9:16 (16:9 kalau diminta); diuji di Mac Apple Silicon |
| **Sutradara otomatis** | TIPIKAL (#17) | Cukup kirim topik (atau tipe-tipenya sendiri, atau VO): 3–5 tipe, tempat, tokoh, gerakan, kendaraan, kamera otomatis yang memastikan tokohnya selalu kelihatan, reaksi, tanda "?"/"!", tulisan bunyi, musik, dan efek suara disusun otomatis. 6 tempat (jalan raya, gang + warung, kelas, kantor, kondangan, rumah), 17 tokoh yang bisa kamu ganti dan simpan (ketik "kartu tokoh"), 52 gerakan, motor/sepeda/mobil/angkot; tanpa narator kecuali kamu kirim VO; tanpa lip-sync, hewan, atau berkelahi; vertikal 9:16 (16:9 kalau diminta); diuji di Mac Apple Silicon |
| **Sutradara serial** | NEKAT (#18) | Cukup kirim premisnya ("Bisa gak … ngusir …? Tiap diusir malah nambah"): judul pertanyaan, 3–5 level alat, penghitung ×N, akhir lucu atau PART 2, musik dan efek suara disusun otomatis; part berikutnya melanjutkan angka dan tokohnya. 3 tempat (gang, kebun + kandang, sekolah), 9 tokoh orang + kucing/ayam/bebek/kambing dalam 11 warna yang bisa kamu ganti dan simpan (ketik "kartu tokoh"), 13 alat; tanpa narator kecuali kamu kirim VO; satu jenis hewan dan paling banyak 2 orang per video; vertikal 9:16 (16:9 kalau diminta); diuji di Mac Apple Silicon |
| **Sutradara otomatis** | BONGKAR (#19) | Cukup sebut bendanya: Claude membuat model part-partnya, lalu mesin menentukan sendiri urutan bongkar, arah lepas, susunan exploded view, pemeriksaan anti-tembus, kamera, label, hitungan part, musik, dan efek suara; dengan VO-mu tiap part lepas tepat saat namanya disebut. Benda sederhana sampai menengah (peralatan rumah, alat, mainan, gadget), ±4–30 part, desain umum tanpa merek; part bergerak lurus (tanpa engsel atau ulir); vertikal 9:16 (16:9 kalau diminta); diuji di Mac Apple Silicon |
| **Dengan mesin khusus** | PIXELSTORY, VOXELVERSE, PAPERWORLD, WORLDFORGE, TIMEFORGE, BUILDFORGE | Mesin gaya dan contoh teknisnya sudah disertakan; Claude tinggal menyusun cerita, tokoh, dan dunianya |
| **Dengan mesin inti** | PRECISION, INNERWORKS | Dibangun di atas mesin inti VOYNANN (studio, cahaya, efek kamera); biasanya perlu satu putaran perbaikan preview lebih banyak |

Gambar contoh di folder `references/quality-bar/` adalah acuan kualitas, bukan jaminan hasil yang sama persis.
