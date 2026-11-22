# PRD: AntriAja

## Executive Summary & Product Vision

AntriAja adalah platform SaaS untuk manajemen antrian massal pada acara spontan dan layanan publik/UMKM. Sistem didesain untuk menangani 5.000–50.000 peserta per acara dengan tetap menjaga kecepatan verifikasi, transparansi antrian, dan koordinasi multi-petugas.

Visi produk: menjadi infrastruktur antrian paling andal untuk acara sosial berskala besar (pembagian bansos, daging qurban, vaksinasi, pasar murah) sekaligus alat operasional ringan bagi UMKM dan instansi.

Keputusan produk yang telah ditetapkan:

- Model bisnis **freemium + hybrid** (DEC-001).
- Batas event gratis vs berbayar ditentukan oleh **kombinasi ambang peserta dan fitur add-on** (DEC-002).
- Fokus awal **seimbang** untuk segmen sosial dan UMKM/instansi (DEC-003).
- Verifikasi peserta wajib menggunakan **QR sekali scan** untuk mencegah duplikasi (DEC-004).
- Diferensiator utama: **manajemen multi-petugas & pembagian loket otomatis** (DEC-005).
- Dukungan skala peserta maksimal **5.000–50.000** per acara (DEC-006).
- Pengelolaan petugas memakai **multi-admin dengan hak akses berbeda**: verifikator, operator loket, supervisor (DEC-007).

AntriAja bukan sekadar antrian digital, melainkan sistem koordinasi acara real-time dengan penekanan pada pembagian beban loket, validasi QR anti-duplikat, dan isolasi data multi-tenant.

## Problem Statement & Target Users

### Masalah

Acara pembagian bansos, daging qurban, layanan UMKM baru, dan instansi publik sering menghadapi:

- Antrian fisik tidak terprediksi, membludak, dan memicu kericuhan.
- Verifikasi manual rentan duplikasi dan penyalahgunaan kuota.
- Koordinasi antar petugas/loket tidak transparan; beban satu loket menumpuk.
- Tidak ada data real-time jumlah peserta terlayani, waktu tunggu, atau no-show.
- Sulit mengelola ribuan peserta tanpa alat bantu terpusat.

### Target Pengguna

| Segmen | Profil | Kebutuhan Utama |
|---|---|---|
| Penyelenggara acara sosial | Panitia bansos, qurban, vaksinasi, pasar murah | Verifikasi cepat, anti-duplikat, koordinasi banyak loket, rekap real-time |
| UMKM / instansi | Klinik, bank, layanan publik, restoran baru | Antrian ringan, pengaturan loket, branding, data pengunjung |
| Petugas lapangan | Verifikator, operator loket, supervisor | Scan cepat, panggil antrian, lihat beban loket, audit sederhana |
| Peserta / pengantri | Warga, nasabah, pasien | Daftar mudah, terima QR, lihat status antrian, terima panggilan |

## System Scope & User Roles

### Modul Sistem

- Manajemen Event & Kuota
- Pendaftaran & Verifikasi Peserta (QR sekali scan)
- Mesin Antrian Real-time
- Manajemen Multi-Petugas & Loket
- Papan Antrian Publik
- Notifikasi Peserta
- Dashboard & Analitik
- Monetisasi Freemium + Hybrid
- Multi-tenancy & Role-Based Access Control
- Audit Log & Keamanan

### Peran Pengguna

| Peran | Deskripsi |
|---|---|
| Super Admin Platform | Mengelola seluruh tenant, paket langganan, health sistem. Tidak melihat data peserta tenant. |
| Owner Tenant | Pemilik organisasi/penyelenggara. Mengelola event, petugas, paket, dan pembayaran. |
| Admin Event | Mengelola satu atau beberapa event dalam tenant. Mengatur loket, kuota, dan pendaftaran. |
| Supervisor | Mengawasi antrian real-time, memindahkan antrian antar loket, menangani insiden. |
| Verifikator | Melakukan scan QR peserta, memvalidasi identitas, menandai hadir. |
| Operator Loket | Memanggil antrian ke loket, menandai sedang dilayani, selesai, atau no-show. |
| Peserta | Mendaftar, menerima QR, melihat status antrian, menerima notifikasi panggilan. |

### Matriks Izin

| Izin | Super Admin | Owner | Admin Event | Supervisor | Verifikator | Operator Loket | Peserta |
|---|---|---|---|---|---|---|---|
| Kelola tenant & billing | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Buat & konfigurasi event | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Atur loket & petugas | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Scan QR verifikasi | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Panggil antrian | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ubah status peserta | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Lihat dashboard analitik | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lihat papan antrian publik | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audit log | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Kelola langganan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Functional Requirements

### FR-01 — Pembuatan & Konfigurasi Event

- Owner/Admin Event membuat event baru dengan data:
  - Nama event, deskripsi, kategori (`SOSIAL` / `UMKM` / `INSTANSI`).
  - Lokasi acara (titik peta, alamat), wilayah cakupan (opsional, lihat FR-02).
  - Waktu mulai, waktu selesai, zona waktu.
  - Kuota maksimal peserta.
  - Jumlah loket awal dan petugas awal.
- Status event: `DRAFT`, `PUBLISHED`, `PAUSED`, `COMPLETED`, `CANCELLED`.
- Sistem menampilkan estimasi tier berbayar/gratis berdasarkan kuota dan fitur (DEC-002).
- Edge cases:
  - Kuota kurang dari 1 → error `ERR-EV-001`.
  - Waktu selesai sebelum waktu mulai → error `ERR-EV-002`.
  - Event `PUBLISHED` tidak dapat dihapus, hanya `CANCELLED`.
  - Event dengan kuota penuh otomatis menolak pendaftaran baru (`ERR-EV-003`).

### FR-02 — Wilayah Cakupan Event

- Event dapat dibatasi pada wilayah administratif: provinsi, kabupaten/kota, kecamatan, kelurahan.
- Peserta di luar wilayah yang ditentukan tidak dapat mendaftar.
- Verifikasi wilayah menggunakan data domisili/NIK yang diinput peserta; validasi silang dengan data Dukcapil bersifat TBD pada versi awal.
- Edge cases:
  - Jika wilayah tidak diatur, event bersifat publik nasional.
  - Perubahan wilayah pada event `PUBLISHED` hanya dapat dilakukan oleh Owner dan memicu notifikasi kepada peserta yang tidak memenuhi syarat.

### FR-03 — Manajemen Multi-Petugas & Loket

- Owner/Supervisor membuat loket dengan atribut:
  - Nama loket, jenis layanan, kapasitas paralel maksimal.
  - Daftar petugas yang ditugaskan; satu petugas bisa bertugas di beberapa loket.
- Peran petugas mengikuti DEC-007:
  - **Verifikator**: hanya bisa scan QR, tidak bisa memanggil.
  - **Operator Loket**: hanya bisa memanggil dan menyelesaikan peserta di loketnya.
  - **Supervisor**: bisa memantau semua loket, memindahkan antrian, menonaktifkan loket.
- Edge cases:
  - Loket tanpa petugas aktif otomatis berstatus `INACTIVE` dan tidak menerima antrian baru.
  - Petugas yang dihapus dari loket tidak kehilangan riwayat aksinya (audit log).

### FR-04 — Pembagian Antrian Otomatis Antar Loket

- Sistem menetapkan peserta ke loket secara otomatis dengan strategi default:
  - `LEAST_LOADED`: pilih loket dengan antrian aktif paling sedikit.
  - `ROUND_ROBIN`: distribusi bergilir antar loket aktif.
- Konfigurasi strategi per event oleh Admin; default `LEAST_LOADED` (DEC-005).
- Ketika Operator Loket menyelesaikan peserta, sistem otomatis memanggil peserta berikutnya pada loket tersebut.
- Antrian yang sudah dipanggil namun tidak hadir akan ditandai `NO_SHOW` setelah 3 kali panggilan (threshold TBD).
- Edge cases:
  - Semua loket sibuk → peserta masuk `WAITING_POOL` tanpa loket.
  - Loket dinonaktifkan saat memiliki antrian → antrian dialihkan ke loket aktif lain oleh Supervisor.
  - Antrian kosong pada loket → sistem menampilkan status `IDLE`.

### FR-05 — Pendaftaran Peserta

- Peserta mengakses halaman publik event dan mengisi formulir pendaftaran.
- Data minimal:
  - Nama lengkap
  - NIK (16 digit)
  - Nomor HP aktif
  - Wilayah domisili (provinsi/kabupaten/kecamatan/kelurahan)
- Penyelenggara dapat menambahkan field khusus per event (opsional; daftar field TBD).
- Setelah pendaftaran valid, sistem membuat QR unik sekali scan untuk peserta.
- Edge cases:
  - NIK tidak 16 digit → `ERR-REG-001`.
  - Nomor HP tidak valid → `ERR-REG-002`.
  - Peserta sudah terdaftar pada event yang sama → `ERR-REG-003` (duplikat berbasis NIK).
  - Kuota penuh → `ERR-REG-004`.

### FR-06 — Verifikasi QR Sekali Scan

- Setiap pendaftaran menghasilkan QR unik berisi payload terenkripsi: `event_id`, `participant_id`, `signature`.
- QR hanya dapat dipindai **satu kali** (DEC-004). Setelah scan pertama:
  - Status peserta berubah menjadi `VERIFIED`.
  - Scan kedua ditolak dengan pesan “QR sudah digunakan”.
- Verifikator atau Operator Loket memindai menggunakan kamera perangkat.
- Hasil scan menampilkan: nama peserta, status valid/tidak, waktu scan.
- Edge cases:
  - QR dipindai setelah event selesai → `ERR-QR-001` (expired).
  - QR dipindai kedua kali → `ERR-QR-002` (already used).
  - QR rusak/tidak sesuai signature → `ERR-QR-003` (invalid).
  - QR milik event lain → `ERR-QR-004` (not found).
  - QR dipindai oleh petugas tanpa izin scan → `ERR-QR-005` (forbidden).

### FR-07 — Status Antrian Real-time

- Status peserta: `WAITING`, `CALLED`, `SERVING`, `DONE`, `NO_SHOW`, `CANCELLED`.
- Perubahan status dipublikasikan real-time ke semua klien melalui Socket.IO + Redis Pub/Sub.
- Nomor antrian dibuat otomatis berurutan per event atau per loket (TBD).
- Edge cases:
  - Peserta dipanggil tetapi sudah `NO_SHOW` tidak dapat dipanggil lagi kecuali Supervisor reset status.
  - Peserta `CANCELLED` tidak dapat divalidasi.

### FR-08 — Papan Antrian Publik

- Halaman display real-time menampilkan:
  - Nomor antrian sedang dipanggil, loket tujuan.
  - Daftar antrian berikutnya (maksimal 10).
  - Total antrian tersisa.
- Dapat diakses melalui tautan publik tanpa login; event private membutuhkan token akses.
- Refresh otomatis via WebSocket; tidak ada polling manual.
- Edge cases:
  - Koneksi display terputus → tampilan terakhir disimpan; reconnect otomatis.

### FR-09 — Notifikasi Peserta

- Peserta menerima notifikasi saat:
  - Pendaftaran berhasil (berisi QR).
  - Dipanggil ke loket.
  - Event dibatalkan atau dijadwalkan ulang.
- Kanal: WhatsApp, Email, SMS (provider TBD; WhatsApp prioritas).
- Retry pengiriman maksimal 3 kali; log status pengiriman.
- Edge cases:
  - Nomor HP tidak valid → notifikasi gagal, peserta tetap dapat melihat status di halaman publik.
  - Notifikasi panggilan telat diterima → tetap ada pesan in-app.

### FR-10 — Dashboard & Analitik

- Admin/Supervisor dapat melihat metrik:
  - Total terdaftar, terverifikasi, menunggu, dilayani, no-show.
  - Rata-rata waktu tunggu per loket dan keseluruhan.
  - Throughput per jam.
  - Beban aktif per loket.
- Filter berdasarkan event, loket, tanggal, status peserta.
- Ekspor data agregat ke CSV.
- Dukungan 50.000 peserta per event; query agregasi harus < 2 detik (DEC-006).

### FR-11 — Manajemen Peran & Hak Akses

- Multi-admin dengan tingkatan izin terpisah (DEC-007).
- Owner mengundang petugas melalui email/nomor HP; petugas menerima tautan onboarding.
- Perubahan peran dicatat di audit log; tidak dapat mengubah peran sendiri.
- Edge cases:
  - Owner terakhir tidak dapat menghapus dirinya sendiri dari tenant.
  - Petugas dengan sesi aktif yang perannya diubah akan menerima token/izin baru pada request berikutnya.

### FR-12 — Multi-tenancy

- Setiap organisasi/tenant memiliki data terisolasi penuh di level database atau skema.
- Satu user dapat menjadi anggota beberapa tenant dengan peran berbeda.
- Super Admin platform hanya melihat metadata tenant (nama, paket, status), bukan data peserta/antrian.
- Edge cases:
  - Tenant dihapus/dinonaktifkan → data peserta dipertahankan sesuai kebijakan retensi (TBD) atau dihapus permanen setelah masa tenggang.

### FR-13 — Monetisasi Freemium + Hybrid

- Paket **Gratis** mencakup:
  - Maksimal peserta per event: 1.000 (TBD)
  - Maksimal loket aktif: 2 (TBD)
  - Maksimal petugas: 5 (TBD)
  - Fitur dasar: antrian, QR sekali scan, papan antrian.
- Paket **Berbayar** ditentukan oleh ambang peserta: tier Small, Medium, Large (TBD; sesuai DEC-002, batas pasti TBD).
- Fitur add-on yang dapat dibeli terpisah:
  - Tambahan loket
  - Tambahan petugas
  - Custom branding
  - Notifikasi premium (WhatsApp/Email/SMS)
  - API akses
  - Retensi data lebih lama
- Sistem menghitung tier saat pembuatan event dan menolak jika kuota melebihi paket aktif (`ERR-BILL-001`).
- Upgrade/downgrade paket bersifat prorata; mekanisme TBD.
- Edge cases:
  - Event mencapai 80% kuota → peringatan upgrade.
  - Event mencapai 100% kuota → penolakan pendaftaran baru (`ERR-EV-003`) kecuali upgrade dilakukan.

### FR-14 — Pembayaran & Invoice

- Payment gateway: TBD (kandidat Midtrans/Xendit/Stripe).
- Invoice otomatis dibuat saat upgrade paket atau pembelian add-on.
- Status invoice: `PENDING`, `PAID`, `FAILED`, `EXPIRED`.
- Notifikasi pembayaran ke Owner; retry 1x setelah gagal.
- Edge cases:
  - Pembayaran `PENDING` melewati batas waktu → `EXPIRED`; tier tetap lama.
  - Pembayaran `FAILED` → `ERR-BILL-002`; pengguna dapat mengulang.

### FR-15 — Manajemen Kuota & Tier

- Sistem memeriksa kuota peserta per event terhadap paket tenant sebelum mempublikasikan event.
- Kuota bulanan agregat per tenant (jika berlaku, TBD) dipantau dan ditampilkan di dashboard.
- Peringatan dini saat pemakaian 80%; blokir saat 100% (DEC-002).
- Edge cases:
  - Event dengan status `DRAFT` tidak memengaruhi kuota.
  - Event `CANCELLED` mengembalikan kuota yang sudah terpakai.

### FR-16 — Import Peserta Massal

- Owner/Admin Event dapat mengimpor CSV/Excel berisi data peserta.
- Format kolom minimal sama dengan formulir pendaftaran (FR-05).
- Sistem memvalidasi setiap baris, membuat QR untuk baris valid, dan melaporkan baris gagal.
- Duplikat NIK dalam file import otomatis ditolak (`ERR-IMP-001`).
- Batas import satu kali: 10.000 baris (TBD).
- Edge cases:
  - File melebihi batas ukuran (5MB) → `ERR-IMP-002`.
  - Jumlah baris valid melebihi kuota event → `ERR-IMP-003`.

### FR-17 — Aplikasi Petugas (PWA)

- Petugas mengakses dashboard ringkas melalui browser mobile (PWA).
- Fitur:
  - Scan QR via kamera.
  - Lihat antrian loket yang ditugaskan.
  - Panggil peserta berikutnya.
  - Tandai `SERVING`, `DONE`, `NO_SHOW`.
- Offline support TBD; versi awal membutuhkan koneksi internet.
- Edge cases:
  - Izin kamera ditolak → fallback input kode QR manual.

### FR-18 — Audit Log & Keamanan

- Semua aksi kritis dicatat: login, buat event, ubah event, undang petugas, scan QR, panggil antrian, ubah status, pembayaran.
- Log berisi: user ID, peran, aksi, timestamp, IP address, event ID, participant ID.
- Data pribadi peserta (NIK, nomor HP) dienkripsi di database; ditampilkan ter-mask di UI.
- Akses log dibatasi: Super Admin, Owner, Admin Event, Supervisor.
- Edge cases:
  - Percobaan scan QR tanpa izin dicatat sebagai `SECURITY_WARN`.

### FR-19 — Pencarian & Filter Peserta

- Panel admin menyediakan pencarian berdasarkan: nama, NIK, nomor HP, status, wilayah, loket.
- Hasil pencarian dapat diekspor CSV.
- Pencarian NIK hanya menampilkan 6 digit terakhir untuk non-Owner.
- Edge cases:
  - Pencarian kosong menampilkan daftar terbaru dengan pagination (100 baris/halaman).

### FR-20 — Broadcast Pengumuman

- Penyelenggara dapat mengirim pesan massal ke peserta event tertentu.
- Isi pesan: teks, maksimal 500 karakter.
- Peserta menerima via notifikasi (saluran terpilih).
- Edge cases:
  - Event dengan 0 peserta → broadcast ditolak `ERR-BC-001`.
  - Peserta yang sudah `DONE` tidak menerima broadcast (opsional TBD).

### Daftar Kode Error Kunci

| Kode Error | Konteks | Deskripsi |
|---|---|---|
| ERR-EV-001 | Event | Kuota event kurang dari 1 |
| ERR-EV-002 | Event | Waktu selesai sebelum mulai |
| ERR-EV-003 | Event | Kuota event penuh |
| ERR-REG-001 | Pendaftaran | NIK tidak valid |
| ERR-REG-002 | Pendaftaran | Nomor HP tidak valid |
| ERR-REG-003 | Pendaftaran | Duplikat NIK pada event |
| ERR-REG-004 | Pendaftaran | Kuota event habis |
| ERR-QR-001 | QR Scan | QR expired |
| ERR-QR-002 | QR Scan | QR sudah digunakan |
| ERR-QR-003 | QR Scan | QR invalid signature |
| ERR-QR-004 | QR Scan | QR tidak ditemukan |
| ERR-QR-005 | QR Scan | Petugas tidak memiliki izin scan |
| ERR-BILL-001 | Billing | Kuota event melebihi tier aktif |
| ERR-BILL-002 | Billing | Pembayaran gagal |
| ERR-IMP-001 | Import | Duplikat NIK dalam file |
| ERR-IMP-002 | Import | File melebihi ukuran maksimal |
| ERR-IMP-003 | Import | Baris valid melebihi kuota |
| ERR-BC-001 | Broadcast | Event tidak memiliki peserta |

## Non-Functional Requirements

| Kategori | Kebutuhan | Target / Ambang |
|---|---|---|
| Performa | API response p95 untuk baca antrian | < 200 ms |
| Performa | Verifikasi QR sekali scan selesai diproses | < 1 detik |
| Performa | Query dashboard agregat 50.000 peserta | < 2 detik |
| Skalabilitas | Peserta maksimal per event | 50.000 (DEC-006) |
| Skalabilitas | Koneksi WebSocket bersamaan per event | 1.000 |
| Ketersediaan | Uptime bulanan | 99,9% |
| Keamanan | Enkripsi data pribadi | AES-256 at rest, TLS 1.3 in transit |
| Keamanan | Proteksi OWASP Top 10 | Wajib lolos penetration test |
| Keamanan | Rate limiting endpoint publik | 100 req/menit per IP |
| Privasi | Kepatuhan UU PDP | Data NIK/HP terproteksi, hak hapus |
| Realtime | Latensi broadcast status antrian | < 500 ms end-to-end |
| Reliabilitas | Idempotensi scan QR | Exactly-once; tidak ada double scan |
| Observabilitas | Struktur log, metrics, tracing | 100% endpoint terinstrumentasi |
| Kompatibilitas | Browser | Chrome, Safari, Firefox 2 versi terakhir; PWA |

## Technology Stack & Rationale

| Component | Technology | Why |
|---|---|---|
| Frontend Framework | Next.js 15+ (App Router) + React 19 + Tailwind CSS v4 | SSR untuk halaman event publik, PWA support, komponen UI reusable, SEO ringan |
| Backend Runtime | Node.js 22 LTS + Express 5 + TypeScript 5.6 | I/O asinkron tinggi untuk ribuan koneksi WebSocket, tipe aman, ekosistem besar |
| Database & ORM | PostgreSQL 16+ + Prisma v6 | ACID untuk konsistensi status antrian, relasi multi-tenant kompleks, migrasi versioned |
| Autentikasi & Otorisasi | Clerk v6 | Multi-tenant, role-based access control siap pakai, sesi aman, integrasi cepat |
| Realtime & Antrian | Socket.IO v4 + Redis Pub/Sub (Upstash) | Publish/subscribe antar instance, sticky session tidak wajib, skalabel horizontal |
| Penyimpanan & QR | Cloudflare R2 + qrcode.react | Objek storage murah untuk QR, distribusi CDN global, generator QR sisi klien |
| Styling System | Tailwind CSS v4 + shadcn/ui | Pengembangan UI cepat, komponen aksesibel, konsistensi desain |

Alasan pemilihan stack berfokus pada kemampuan menangani 5.000–50.000 peserta, kebutuhan real-time, isolasi tenant, dan kecepatan pengembangan SaaS.

## Success Metrics & KPIs

| Metrik | Target | Cara Ukur |
|---|---|---|
| Waktu pendaftaran peserta | < 2 menit | Rata-rata dari mulai form sampai QR terbit |
| Akurasi anti-duplikat QR | 100% | Tidak ada QR kedua diterima; log `ERR-QR-002` |
| Penurunan waktu tunggu | 30% vs manual | Survei & data waktu `WAITING` → `CALLED` |
| Throughput layanan per loket | TBD | Jumlah `DONE` per jam per loket |
| Jumlah event dibuat per bulan | TBD | Metrik tenant aktif |
| Konversi free ke paid | TBD | Rasio tenant upgrade dalam 90 hari |
| Churn bulanan tenant berbayar | < 5% | Jumlah tenant berbayar nonaktif |
| Uptime sistem | 99,9% | Monitoring uptime bulanan |
| Latensi notifikasi panggilan | < 1 detik | Waktu status `CALLED` sampai notifikasi terkirim |

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Lonjakan 50.000 peserta scan QR bersamaan | Server crash, antrian gagal | Redis Pub/Sub, horizontal scaling, load test 50k virtual user, auto-scale backend |
| Duplikasi scan / fraud verifikasi | Distribusi tidak adil, sengketa | Token QR signed dengan JWT, unique constraint di database, audit log immutable |
| Koneksi internet tidak stabil di lapangan | Petugas tidak bisa scan, acara terhenti | PWA offline queue (TBD v1), fallback input kode manual, local retry |
| Kebocoran data NIK/HP peserta | Pelanggaran UU PDP, tuntutan hukum | Enkripsi AES-256, RBAC ketat, audit akses data pribadi, penetration test rutin |
| Ambang tier dan harga add-on belum pasti | Revenue tidak terprediksi | Beta test dengan 10 tenant, validasi willingness to pay sebelum launch, TBD pricing final |
| Adopsi pengguna non-teknologi rendah | Event sepi pengguna | UI sederhana, pelatihan petugas, dukungan WhatsApp, template event siap pakai |

## Constraints & Assumptions

### Constraints

- Versi pertama wajib mendukung QR sekali scan (DEC-004); tidak ada mode verifikasi lain.
- Skala maksimal 50.000 peserta per event (DEC-006); tidak boleh lebih pada versi awal.
- Multi-admin dengan setidaknya tiga peran petugas: verifikator, operator loket, supervisor (DEC-007).
- Model freemium + hybrid; ambang peserta dan fitur add-on sebagai penentu tier, tetapi nominal harga TBD.
- Provider notifikasi dan payment gateway TBD; harus diganti mudah karena belum dipilih.
- Kepatuhan UU PDP (Indonesia) wajib untuk data NIK, nomor HP, dan domisili.
- Semua dokumen spesifikasi mengikuti SPEC-DRIVEN CONTRACT: detail yang belum eksplisit ditandai TBD, bukan diasumsikan.

### Assumptions

- Peserta memiliki smartphone dengan browser modern dan kamera berfungsi.
- Lokasi acara memiliki koneksi internet minimal 4G.
- Penyelenggara dapat mengoperasikan dashboard tanpa pelatihan intensif.
- Field formulir pendaftaran minimal: nama, NIK, nomor HP, wilayah; field tambahan TBD.
- Harga paket dan fitur add-on akan ditentukan melalui riset beta sebelum production launch.
- Pengguna bersedia mengunduh/membuka aplikasi PWA; tidak membutuhkan aplikasi native.

## Out of Scope

Versi awal AntriAja secara eksplisit **tidak** mencakup:

- Aplikasi mobile native (Android/iOS) — hanya PWA dan web responsif.
- Mode offline penuh dengan sinkronisasi data saat sinyal hilang.
- Verifikasi NIK real-time langsung ke Dukcapil (validasi hanya format; integrasi TBD).
- Sistem penjualan tiket atau pungutan biaya dari peserta (bukan event ticketing).
- Gamifikasi antrian, loyalty points, atau referral.
- Dukungan multi-bahasa selain Bahasa Indonesia.
- Custom report builder atau business intelligence drag-and-drop.
- API publik untuk integrasi pihak ketiga (direncanakan sebagai add-on setelah v1).
- Prediksi waktu tunggu berbasis machine learning / prediksi no-show.