# Troubleshooting

| Masalah | Penyebab umum | Solusi |
|---|---|---|
| `/voynann-motion` tidak muncul | Skill belum terpasang atau di folder yang salah | Pastikan ada `~/.claude/skills/voynann-motion/SKILL.md` (cara B di `INSTALLATION_GUIDE.md`), lalu buka ulang Claude Code |
| Ada dua skill VOYNANN | Versi lama masih terpasang | Hapus atau nonaktifkan versi lama |
| Upload skill ditolak: "Zip contains too many files (maximum 200)" | File ZIP versi lama (1.4.x memuat lebih dari 200 file) | Upload `VOYNANN_Motion_v1.11.0.zip` (di bawah 200 file). Isi gaya dikemas di file `PACKED_SOURCE*.txt` dan dibuka otomatis saat proyek dibuat. Jangan ekstrak lalu ZIP ulang dengan tambahan file lain |
| Saat render muncul peringatan versi `zod` ("version mismatch", 4.6.7 vs 4.5.4) | Versi `zod` sengaja dikunci di proyek; Remotion hanya memberi tahu | Aman, abaikan saja: video tetap dirender normal |
| Claude bilang tidak bisa merender | Kamu memakai chat claude.ai biasa | Gunakan Claude Code (tab *Code* di aplikasi desktop, atau terminal) |
| "Node.js belum terpasang" atau versinya lama | Node belum diinstal, atau di bawah 22.18 (CINÉSTORY 3D) / 22.13 (gaya lain) | Instal Node LTS dari nodejs.org, lalu buka ulang Claude |
| STORYBOOK: halaman tidak menampilkan yang ada di teks | Kata kuncinya belum tertulis di baris `[HALAMAN]` | Tulis tempat, waktu, benda, dan "Nama + kata kerja" di baris `[HALAMAN]` (lihat `FORMAT-NASKAH-BUKU.md`); Claude memperbaikinya kalau kamu sebut halaman mana |
| STORYBOOK: tokoh tidak muncul | Tokoh belum dideklarasikan, atau namanya tidak ditulis di baris `[HALAMAN]` | Tambahkan `TOKOH: Nama = deskripsi` di atas naskah dan sebut namanya di halaman itu |
| CHRONICLE: kota tidak muncul di peta | Nama tempat belum dikenal | Claude menambahkan satu baris koordinat yang dicek; atau tulis nama kota besar terdekat |
| CHRONICLE: minta adegan perang dengan pedang / kuda / kapal berlayar | Di luar fitur versi ini | Claude menawarkan versi terdekat: kemah malam, desa terbakar, rute kapal di peta, angka korban |
| CERDIK: tempat ceritanya bukan desa, pasar, pantai, rumah, atau istana — pengerjaannya lama | Dunia baru dibuatkan dulu untuk ceritamu (±30–60 menit tambahan) | Biarkan Claude selesai, atau minta ceritanya dipindah ke salah satu dari 5 dunia yang ada |
| CERDIK: tokoh tertutup barang di meja atau kamera terasa terlalu dekat | Kamera otomatis memilih sudut yang terlihat; kadang kompromi | Minta "adegan ke-N dari samping / lebih jauh", atau tokohnya dipindah ke tempat lain |
| NEGERI: hari berikutnya mulai dari nol, bukan dari negara kemarin | Hari sebelumnya belum dirender final (negara baru tercatat saat video final dibuat), atau kamu memakai folder proyek lain | Pakai folder proyek yang sama dan pastikan hari sebelumnya sudah final; dari komputer lain, kirim file `series/<nama>/world.json`-nya ke Claude |
| NEGERI: bangunan yang diminta komen belum ada | Belum termasuk 19 bangunan bawaan | Claude merancang bangunan baru untuk ceritamu (±15–30 menit tambahan), atau memakai bangunan bawaan yang paling dekat |
| TIPIKAL: tempatnya bukan jalan, gang, kelas, kantor, kondangan, atau rumah — pengerjaannya lama | Tempat baru dibuatkan dulu untuk ceritamu | Biarkan Claude selesai, atau minta tipe-tipenya dipindah ke salah satu dari 6 tempat |
| TIPIKAL: ide tipenya berubah sedikit dari permintaanku | Benda panjang/lentur (kertas sepanjang jalan, kain berkibar) atau hewan belum bisa; Claude menggantinya dengan versi terdekat dan memberitahumu | Minta versi lain dengan benda biasa, atau ganti tipe itu |
| NEKAT: part 2 tidak melanjutkan angka part 1 | Part 1 dibuat di folder proyek lain, atau belum disimpan | Buat part berikutnya di folder yang sama; dari komputer lain, kirim file `series/<nama>/state.json` dan `tokoh-*.json`-nya |
| NEKAT: hewan raksasa dari akhir part 1 tidak muncul di awal part 2 | Hewan raksasa hanya ada di akhir cliffhanger | Claude membuka part 2 dengan kerumunan yang tersisa; minta akhir lain (tidur, dipelihara, kabur, menyerah) kalau mau |
| BONGKAR: ada part yang tidak ikut lepas | Di modelnya, part itu terkunci di dalam part lain tanpa ruang untuk keluar | Minta Claude memberi rongga atau arah lepas untuk part itu, lalu render ulang |
| BONGKAR: part tidak lepas tepat saat namanya disebut | Nama part di VO berbeda dari naskah, atau whisper.cpp belum terpasang | Baca nama part persis seperti di naskah; atau minta Claude menambahkan sebutanmu sebagai nama lain part itu. Pasang whisper.cpp (INSTALLATION_GUIDE.md langkah 3b) supaya lebih tepat |
| BEDAH: topiknya bukan atap atau pondasi, pengerjaannya lama | Benda-bendanya belum ada di kit, jadi Claude membuatnya dulu | Wajar: biasanya 40–90 menit. Persingkat dengan naskah yang lebih pendek (8–10 kalimat) atau topik yang dekat dengan atap/pondasi rumah |
| BEDAH: teks dan label tidak pas dengan suara | whisper.cpp belum terpasang, jadi kata-kata VO tidak bisa dibaca | Pasang whisper.cpp (INSTALLATION_GUIDE.md langkah 3b), lalu minta Claude merender ulang |
| CINÉSTORY: Claude minta teks naskah | whisper.cpp belum terpasang | Kirim teks naskah yang sama persis dengan VO, atau pasang whisper (`INSTALLATION_GUIDE.md` langkah 3b) |
| CINÉSTORY: teks/aksi tidak pas dengan suara | Naskah berbeda dari yang diucapkan di VO | Jangan ubah waktu manual; kirim naskah yang sama persis lalu minta Claude membuat ulang |
| CINÉSTORY: nama/angka di subtitle salah | Kata salah dengar dari VO | Minta Claude memperbaiki ejaan kata itu (waktunya tidak diubah) |
| Claude bilang "pemeriksaan QA gagal" sebelum render final | Ada yang tembus, berkedip atau meloncat di preview | Wajar: Claude memperbaikinya dulu lalu memeriksa lagi. Kalau kamu sudah lihat dan memang mau dibiarkan, bilang saja — Claude mencatatnya |
| Ada bagian yang tembus / berkedip yang lolos | Benda itu belum ditandai untuk dicek, atau terjadinya di gerakan sangat cepat | Sebut detiknya; Claude menandai benda itu, memperbaiki, dan memeriksa ulang seluruh video |
| Mau versi YouTube 16:9 (gaya apa pun) | Default-nya vertikal 9:16 | Minta "versi landscape 16:9" — Claude menyutradarai ulang untuk frame lebar (bukan crop) |
| Videonya keluar vertikal padahal mau landscape | Format tidak disebut di permintaan | Tulis "versi landscape 16:9"; tanpa itu hasilnya selalu 9:16 |
| Versi landscape ada bagian kosong / tepi set kelihatan | Frame lebar memperlihatkan lebih banyak sisi kiri-kanan | Sebut detiknya; Claude mengatur ulang kamera atau menambah isi set di bagian itu |
| CINÉSTORY: teks tertutup tombol TikTok | — | Laporkan detiknya; semua teks seharusnya di area aman, Claude memindahkan atau memendekkannya |
| CINÉSTORY: nama channel/logo tidak muncul | Tidak ada `voynann-brand.json` | Taruh brand kit di folder kerja (lihat `BRAND_KIT.md`); tanpa file itu video memang tanpa branding |
| CINÉSTORY: Claude menolak menambah gaya lain ke proyek | Proyek CINÉSTORY berdiri sendiri | Buat video gaya lain di folder baru |
| CHARACTER FLOW meminta teks naskah | whisper.cpp belum terpasang | Kirim teks naskahnya, atau pasang whisper (`INSTALLATION_GUIDE.md` langkah 3b) |
| CHARACTER FLOW: teks/aksi sedikit lebih cepat/lambat dari suara | Timing tanpa whisper (rata-rata ±0,3 detik, di beberapa kata sampai ±0,5 detik) | Pasang whisper.cpp lalu minta Claude membuat ulang |
| CHARACTER FLOW: minta lokasi/aksi yang tidak ada | Di luar fitur versi ini (6 lokasi: kampus, kamar, kelas, kantor, kafe, ruang tamu; maks 2 tokoh per lokasi; tanpa lip-sync) | Claude menawarkan lokasi terdekat; satu video boleh pindah-pindah di antara 6 lokasi itu |
| CHARACTER FLOW: mau tokoh berhijab / baju lain | — | Minta saja ("tokohnya cewek berhijab biru", "pakai seragam putih"); warna baju, rambut, hijab, dan rok bisa diganti per video |
| CINÉSTORY: mau lokasi rumah / sekolah / kantor / toko | Sudah ada world jadi | Claude memakai world `rumah`, `sekolah`, `kantor`, `minimarket`, atau `perpustakaan` lebih dulu, jadi lebih cepat dan konsisten |
| PANELVERSE meminta teks naskah | whisper.cpp belum terpasang | Kirim teks naskahnya (tanda baca seperti yang diucapkan: koma dan titik di tempat jeda), atau pasang whisper (`INSTALLATION_GUIDE.md` langkah 3b) |
| PANELVERSE: tulisan di layar terlalu banyak / ingin subtitle penuh | PANELVERSE memakai tulisan komik singkat (1–3 kata) dan kotak narasi | Minta kata yang mau ditonjolkan; subtitle penuh tidak termasuk gaya ini |
| PANELVERSE: minta adegan berkelahi, menari, keramaian, atau tokoh asli/terkenal | Di luar fitur versi ini | Claude menawarkan versi komik yang mendekati (mis. benturan diganti efek "BRAK!" dan panel pecah) |
| PANELVERSE: video terasa mirip video sebelumnya | — | Minta "ganti gaya panel dan tempatnya"; setiap video seharusnya punya susunan panel, tempat, dan benda khusus sendiri |
| Render final terhenti di tengah | Sesi/komputer terputus | Minta Claude menjalankan render final lagi; bagian yang sudah selesai dipakai ulang |
| "ffmpeg tidak ditemukan" | ffmpeg belum diinstal | macOS: `brew install ffmpeg`; Windows: `winget install ffmpeg` |
| Persiapan pertama sangat lama | Mengunduh paket (±370 MB) dan browser render (±170 MB); diulang untuk tiap proyek baru | Tunggu sampai selesai; pastikan internet stabil |
| Render sangat lambat atau muncul pesan "switched to software rendering" | Kartu grafis (GPU) tidak bisa dipakai untuk 3D, jadi render otomatis pindah ke mode software | Normal, video tetap jadi tapi jauh lebih lama. Komputer dengan GPU atau Mac chip Apple jauh lebih cepat |
| Gambar tes hitam atau polos | Ada efek/shader yang salah | Minta Claude mengecek dan memperbaikinya |
| Ada titik-titik hitam di beberapa frame | Efek visual buatan Claude menghasilkan nilai tidak valid | Minta Claude memperbaiki efek tersebut (sistem mencegah frame kosong total) |
| Render berhenti atau "disk penuh" | Ruang disk kurang; cache proyek membesar | Kosongkan ruang, minta Claude menghapus `node_modules/.cache` proyek (aman), lalu lanjutkan render. Bagian yang sudah selesai dipakai ulang |
| Teks gagal dimuat atau render macet di awal | File font proyek hilang | Minta Claude memastikan folder `public/fonts` dari starter ikut tersalin, lalu ulangi |
| Suara tidak pas dengan gambar | VO diganti setelah timing disusun | Kirim VO final; Claude menghitung ulang timing |
| Suara terlalu pelan atau keras | — | Final dinormalkan ke −14 LUFS. Minta Claude menyesuaikan jika perlu |
| Hasil kurang "premium" | Ide terlalu umum | Beri detail: benda/tokoh spesifik, satu momen kuat, suasana warna. Minta satu putaran perbaikan preview |

Masih gagal? Salin pesan error dari Claude dan kirimkan ke penjual.
