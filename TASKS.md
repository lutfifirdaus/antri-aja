# TASKS.md: AntriAja

## 1. Ruang Lingkup Dokumen

Dokumen ini mendefinisikan backlog implementasi AntriAja sebagai rangkaian **slice end-to-end yang terlihat pengguna** (user-visible slices), diurutkan berdasarkan dependensi. Setiap tugas memuat: ID stabil `TASK-XX`, tujuan, sumber kebutuhan (`FR-XX`, `FR-UXX`, `F-XX`, `NFR-XX`), keputusan produk terkait (`DEC-XXX`), daftar `Blocked by`, kriteria penerimaan konkret, dan metode verifikasi.

Dokumen ini **tidak** memuat: skema database lengkap (lihat `DATABASE.md`), kontrak endpoint lengkap (lihat `API.md`), deskripsi fitur naratif (lihat `FEATURES.md`), keputusan arsitektur runtime (lihat `ARCHITECTURE.md`), atau rencana fase rilis (lihat `ROADMAP.md`). Referensi silang digunakan alih-alih duplikasi.

Aturan kepatuhan SPEC-DRIVEN CONTRACT:

- Setiap nilai yang belum ditetapkan pengguna (harga tier, ambang kuota tier, provider notifikasi/payment, threshold `NO_SHOW`, batas import, retensi data) ditandai `TBD`.
- Tugas yang bergantung pada keputusan `TBD` **MUST** ditandai `BLOCKED` beserta nama keputusan yang menghambat. Nilai `TBD` **MUST NOT** diisi dengan asumsi.
- Status penyelesaian implementasi **tidak** diklaim di dokumen ini; seluruh tugas berstatus backlog sampai diverifikasi melalui metode verifikasi yang tercantum.

Konvensi status tugas: `READY` (dapat dikerjakan, seluruh dependensi selesai atau tidak ada), `BLOCKED` (menunggu keputusan `TBD` atau tugas prasyarat).

---

## 2. Legenda & Konvensi

| Kolom | Arti |
|:---|:---|
| ID | `TASK-XX`, stabil dan tidak didaur ulang |
| Tujuan | Hasil yang terlihat pengguna atau kapabilitas sistem yang dapat diverifikasi |
| Sumber | Kode kebutuhan dari `PRD.md`/`REQUIREMENTS.md`/`FEATURES.md` |
| DEC | Keputusan produk dari `DECISIONS.md` |
| Blocked by | ID tugas prasyarat; `—` bila tidak ada |
| Status | `READY` atau `BLOCKED` |
| Verifikasi | Metode uji konkret (unit, integrasi, E2E, load, manual) |

Urutan slice mengikuti dependensi fondasi → diferensiator → monetisasi → skala. Setiap slice berakhir pada kemampuan yang dapat didemonstrasikan kepada pengguna akhir.

---

## 3. Ringkasan Backlog

| ID | Slice | Modul | Status | Blocked by |
|:---|:---|:---|:---|:---|
| TASK-01 | Fondasi multi-tenant & autentikasi Clerk | Multi-tenancy & RBAC | READY | — |
| TASK-02 | Manajemen peran & undangan petugas | Multi-tenancy & RBAC | READY | TASK-01 |
| TASK-03 | Pembuatan & publikasi event | Manajemen Event & Kuota | READY | TASK-01 |
| TASK-04 | Wilayah cakupan event | Manajemen Event & Kuota | READY | TASK-03 |
| TASK-05 | Manajemen loket & penugasan petugas | Multi-Petugas & Loket | READY | TASK-02, TASK-03 |
| TASK-06 | Pendaftaran peserta publik + validasi | Pendaftaran Peserta | READY | TASK-03 |
| TASK-07 | Penerbitan QR sekali scan | Verifikasi QR | READY | TASK-06 |
| TASK-08 | Verifikasi QR sekali scan (idempotent) | Verifikasi QR | READY | TASK-07, TASK-05 |
| TASK-09 | Mesin antrian & pembagian loket otomatis | Mesin Antrian | READY | TASK-05, TASK-08 |
| TASK-10 | Siklus hidup antrian di loket (call/serve/no-show) | Mesin Antrian | BLOCKED | TASK-09 |
| TASK-11 | Papan antrian publik real-time | Papan Antrian Publik | READY | TASK-09 |
| TASK-12 | Status antrian peserta real-time | Mesin Antrian | READY | TASK-09 |
| TASK-13 | Notifikasi peserta (WhatsApp/Email/SMS) | Notifikasi | BLOCKED | TASK-06, TASK-10 |
| TASK-14 | Dashboard & analitik | Dashboard & Analitik | READY | TASK-09 |
| TASK-15 | Estimasi tier & penegakan kuota | Monetisasi | BLOCKED | TASK-03 |
| TASK-16 | Pembayaran & invoice | Monetisasi | BLOCKED | TASK-15 |
| TASK-17 | Import peserta massal (CSV/Excel) | Pendaftaran Peserta | READY | TASK-06, TASK-07 |
| TASK-18 | Aplikasi petugas PWA (scan + panggil) | PWA | READY | TASK-08, TASK-10 |
| TASK-19 | Audit log & keamanan data pribadi | Audit & Keamanan | READY | TASK-01, TASK-08 |
| TASK-20 | Pencarian & filter peserta | Dashboard & Analitik | READY | TASK-14 |
| TASK-21 | Broadcast pengumuman | Notifikasi | READY | TASK-13 |
| TASK-22 | Pengawasan supervisor & pemindahan antrian | Mesin Antrian | READY | TASK-10 |
| TASK-23 | Pengujian beban 50.000 peserta | Non-Functional | READY | TASK-09, TASK-11, TASK-12 |

---

## 4. Detail Tugas

### TASK-01 — Fondasi Multi-Tenant & Autentikasi Clerk

**Tujuan:** Pengguna internal dapat login melalui Clerk v6, membuat/masuk ke tenant, dan setiap request HTTP membawa konteks tenant yang tervalidasi.

**Sumber:** FR-12, FR-11, FR-18, NFR Keamanan.
**DEC:** DEC-007, DEC-003.
**Blocked by:** —
**Status:** READY.

**Cakupan:**

- Integrasi Clerk v6 (middleware Express 5) untuk verifikasi `Clerk Session JWT`.
- Model `Tenant`, `User`, `TenantMember` (lihat `DATABASE.md` §3.1–3.3).
- Middleware `X-Tenant-Id` yang memvalidasi keanggotaan user pada tenant.
- Endpoint: `GET /api/v1/tenants`, `POST /api/v1/tenants`, `GET /api/v1/me`.

**Kriteria Penerimaan:**

1. Request tanpa `Authorization` pada endpoint tenant mengembalikan HTTP 401.
2. Request dengan `X-Tenant-Id` yang bukan milik user mengembalikan HTTP 403.
3. `POST /api/v1/tenants` membuat tenant dengan `tier = FREE` dan `quotaLimit` default (lihat `DATABASE.md` §3.1).
4. Satu user dapat menjadi anggota dua tenant dengan peran berbeda dan berpindah konteks via header.

**Verifikasi:** Uji integrasi middleware (401/403), uji E2E login Clerk → buat tenant → akses tenant. Uji unit isolasi query per `tenantId`.

---

### TASK-02 — Manajemen Peran & Undangan Petugas

**Tujuan:** Owner dapat mengundang petugas dan menetapkan peran (`ADMIN_EVENT`, `SUPERVISOR`, `VERIFIER`, `COUNTER_OPERATOR`); perubahan peran tercatat.

**Sumber:** FR-11, FR-18, matriks izin `PRD.md`.
**DEC:** DEC-007.
**Blocked by:** TASK-01.
**Status:** READY.

**Cakupan:**

- Endpoint: `POST /api/v1/tenants/:tenantId/members/invite`, `PATCH /api/v1/tenants/:tenantId/members/:memberId`, `DELETE /api/v1/tenants/:tenantId/members/:memberId`.
- Onboarding via tautan (Clerk invitation).
- Penegakan aturan: Owner terakhir tidak dapat menghapus dirinya sendiri; user tidak dapat mengubah perannya sendiri.
- Pencatatan aksi perubahan peran ke `AuditLog`.

**Kriteria Penerimaan:**

1. Owner mengundang petugas dengan peran `VERIFIER`; petugas menerima tautan onboarding dan muncul di daftar anggota setelah bergabung.
2. `DELETE` pada Owner terakhir mengembalikan HTTP 409 dan tidak menghapus record.
3. `PATCH` peran diri sendiri mengembalikan HTTP 403.
4. Setiap perubahan peran menghasilkan satu baris `AuditLog` dengan `action = ROLE_CHANGED`.

**Verifikasi:** Uji integrasi endpoint invite/update/delete; uji unit aturan Owner terakhir; verifikasi baris `AuditLog`.

---

### TASK-03 — Pembuatan & Publikasi Event

**Tujuan:** Owner/Admin Event dapat membuat event, menyimpan sebagai `DRAFT`, dan mempublikasikannya dengan validasi kuota serta jadwal.

**Sumber:** FR-01, FR-15, F-01, FR-F01-01…07.
**DEC:** DEC-002, DEC-006.
**Blocked by:** TASK-01.
**Status:** READY.

**Cakupan:**

- Model `Event` (lihat `DATABASE.md`).
- Endpoint: `POST /api/v1/events`, `PATCH /api/v1/events/:eventId`, `POST /api/v1/events/:eventId/publish`, `POST /api/v1/events/:eventId/cancel`.
- State machine: `DRAFT → PUBLISHED → PAUSED → COMPLETED` / `CANCELLED`.
- Validasi `quota ≥ 1` (`ERR-EV-001`), `endsAt > startsAt` (`ERR-EV-002`), `quota ≤ 50000` (DEC-006).
- Event `PUBLISHED` tidak dapat dihapus, hanya `CANCELLED`.
- Event `DRAFT` tidak memengaruhi kuota tenant.

**Kriteria Penerimaan:**

1. `quota = 0` → HTTP 422 `ERR-EV-001`, tidak ada record tersimpan.
2. `endsAt ≤ startsAt` → HTTP 422 `ERR-EV-002`.
3. `DELETE` pada event `PUBLISHED` mengembalikan HTTP 405/409 dan event tetap ada.
4. `POST publish` pada event `DRAFT` mengubah status menjadi `PUBLISHED` dan mengembalikan tautan pendaftaran publik.
5. Estimasi tier ditampilkan pada respons `publish` dengan nilai ambang `TBD` (lihat TASK-15).

**Verifikasi:** Uji integrasi endpoint; uji unit state machine; uji E2E buat → publish → verifikasi tautan publik.

---

### TASK-04 — Wilayah Cakupan Event

**Tujuan:** Admin Event dapat membatasi pendaftaran berdasarkan wilayah administratif; peserta di luar wilayah ditolak.

**Sumber:** FR-02, F-02.
**DEC:** Ide pengguna (cakupan wilayah).
**Blocked by:** TASK-03.
**Status:** READY.

**Cakupan:**

- Model `EventRegion` (lihat `DATABASE.md`).
- Endpoint: `PUT /api/v1/events/:eventId/coverage`.
- Validasi wilayah pada pendaftaran (TASK-06) berdasarkan kode provinsi/kabupaten/kecamatan/kelurahan.
- Perubahan wilayah pada event `PUBLISHED` hanya oleh Owner dan memicu notifikasi ke peserta yang tidak lagi memenuhi syarat.
- Tanpa `coverage` → event publik nasional.

**Kriteria Penerimaan:**

1. Event dengan `coverage` provinsi `31` menolak pendaftaran peserta domisili provinsi lain dengan `ERR-REG-005` (kode wilayah tidak memenuhi syarat — konsisten dengan `PRD.md`).
2. Perubahan `coverage` oleh Admin Event (bukan Owner) pada event `PUBLISHED` mengembalikan HTTP 403.
3. Perubahan `coverage` oleh Owner memicu event notifikasi ke peserta terdampak.

**Verifikasi:** Uji integrasi validasi wilayah; uji unit pengecekan kode wilayah; uji E2E perubahan coverage + notifikasi.

---

### TASK-05 — Manajemen Loket & Penugasan Petugas

**Tujuan:** Owner/Supervisor dapat membuat loket, menetapkan kapasitas paralel, dan menugaskan petugas; loket tanpa petugas aktif menjadi `INACTIVE`.

**Sumber:** FR-03, F-07, F-08.
**DEC:** DEC-005, DEC-007.
**Blocked by:** TASK-02, TASK-03.
**Status:** READY.

**Cakupan:**

- Model `Counter`, `CounterAssignment` (lihat `DATABASE.md`).
- Endpoint: `POST /api/v1/events/:eventId/counters`, `PATCH /api/v1/counters/:counterId`, `POST /api/v1/counters/:counterId/assignments`, `DELETE /api/v1/counters/:counterId/assignments/:assignmentId`.
- Aturan: loket tanpa petugas aktif → `INACTIVE`, tidak menerima antrian baru.
- Satu petugas dapat bertugas di beberapa loket.
- Penghapusan petugas dari loket mempertahankan riwayat aksi (audit).

**Kriteria Penerimaan:**

1. Membuat loket dengan `initialCounters` dan menugaskan `VERIFIER` berhasil tersimpan.
2. Menghapus seluruh penugasan aktif dari loket mengubah status loket menjadi `INACTIVE`.
3. Loket `INACTIVE` tidak dapat menerima antrian baru (diverifikasi pada TASK-09).
4. Menghapus petugas dari loket tidak menghapus baris `AuditLog` historis.

**Verifikasi:** Uji integrasi CRUD loket & penugasan; uji unit transisi status loket.

---

### TASK-06 — Pendaftaran Peserta Publik + Validasi

**Tujuan:** Peserta dapat mendaftar pada halaman publik event; sistem memvalidasi NIK, nomor HP, duplikasi, kuota, dan wilayah.

**Sumber:** FR-05, FR-U01, F-03, FR-REG-001…004.
**DEC:** DEC-004.
**Blocked by:** TASK-03.
**Status:** READY.

**Cakupan:**

- Model `Participant` (lihat `DATABASE.md`).
- Endpoint: `POST /api/v1/events/:eventId/registrations` (Public).
- Validasi NIK 16 digit (`ERR-REG-001`), nomor HP format Indonesia (`ERR-REG-002`), duplikat NIK per event (`ERR-REG-003`), kuota penuh (`ERR-REG-004`).
- Enkripsi NIK/HP at rest (AES-256) dan penyimpanan `nikHash` untuk deteksi duplikat.
- Validasi wilayah bila `coverage` aktif (TASK-04).

**Kriteria Penerimaan:**

1. NIK 15 digit → HTTP 422 `ERR-REG-001`.
2. Nomor HP tidak sesuai regex → HTTP 422 `ERR-REG-002`.
3. Pendaftaran kedua dengan NIK identik pada event sama → HTTP 409 `ERR-REG-003`.
4. Setelah `quota` tercapai, pendaftaran berikutnya → HTTP 409 `ERR-REG-004`.
5. NIK/HP tersimpan terenkripsi; respons tidak mengembalikan NIK mentah.

**Verifikasi:** Uji integrasi validasi; uji unit enkripsi/hash; uji E2E pendaftaran sukses & gagal.

---

### TASK-07 — Penerbitan QR Sekali Scan

**Tujuan:** Setiap pendaftaran valid menerbitkan QR unik bertanda tangan yang hanya dapat dipindai satu kali.

**Sumber:** FR-06, FR-U02, F-04, FR-QR-001…005.
**DEC:** DEC-004.
**Blocked by:** TASK-06.
**Status:** READY.

**Cakupan:**

- Model `QRToken` (lihat `DATABASE.md`).
- Payload QR: `event_id`, `participant_id`, `signature` (HMAC/JWT ter-sign).
- Kolom `scanState` dengan unique index parsial untuk idempotensi.
- Endpoint: `GET /api/v1/events/:eventId/registrations/:participantId/qr` (mengembalikan payload QR + gambar via `qrcode.react`).
- Masa berlaku QR mengikuti `expiresAt` (nilai `TBD`).

**Kriteria Penerimaan:**

1. Pendaftaran sukses menghasilkan satu `QRToken` dengan `status = ACTIVE`.
2. Payload QR memuat ketiga klaim wajib dan signature valid.
3. QR dengan signature dimodifikasi satu karakter gagal verifikasi (diuji pada TASK-08).

**Verifikasi:** Uji unit pembuatan signature; uji integrasi endpoint QR; verifikasi unique index `scanState`.

---

### TASK-08 — Verifikasi QR Sekali Scan (Idempotent)

**Tujuan:** Verifikator/Operator Loket dapat memindai QR; hanya scan pertama yang mengubah status menjadi `VERIFIED`; scan berikutnya ditolak.

**Sumber:** FR-06, FR-U02, F-04, FR-QR-001…005, NFR Idempotensi.
**DEC:** DEC-004, DEC-007.
**Blocked by:** TASK-07, TASK-05.
**Status:** READY.

**Cakupan:**

- Endpoint: `POST /api/v1/events/:eventId/verify`.
- Redis lock per `participant_id` + transaksi `SELECT ... FOR UPDATE` untuk menjamin exactly-once.
- Penanganan error: `ERR-QR-001` (expired), `ERR-QR-002` (already used), `ERR-QR-003` (invalid signature), `ERR-QR-004` (not found), `ERR-QR-005` (forbidden).
- Pengecekan izin scan terhadap peran (`VERIFIER`, `COUNTER_OPERATOR`, `SUPERVISOR`, `ADMIN_EVENT`, `OWNER`).
- Pencatatan `SECURITY_WARN` untuk scan tanpa izin.

**Kriteria Penerimaan:**

1. Scan pertama QR valid → HTTP 200, status peserta `VERIFIED`, `scanAt` terisi.
2. Scan kedua QR sama → HTTP 409 `ERR-QR-002`, status peserta tidak berubah.
3. QR dengan signature dimodifikasi → HTTP 400 `ERR-QR-003`.
4. QR milik event lain → HTTP 404 `ERR-QR-004`.
5. Petugas tanpa izin scan → HTTP 403 `ERR-QR-005` + baris `AuditLog` `SECURITY_WARN`.
6. Uji konkurensi: 100 scan simultan pada satu QR menghasilkan tepat satu sukses.

**Verifikasi:** Uji integrasi seluruh kode error; uji konkurensi (race condition); verifikasi baris audit.

---

### TASK-09 — Mesin Antrian & Pembagian Loket Otomatis

**Tujuan:** Sistem menetapkan peserta ke loket secara otomatis dengan strategi `LEAST_LOADED` (default) atau `ROUND_ROBIN`, dan mempublikasikan perubahan status real-time.

**Sumber:** FR-04, FR-07, F-05, F-06.
**DEC:** DEC-005.
**Blocked by:** TASK-05, TASK-08.
**Status:** READY.

**Cakupan:**

- Model `QueueLog` (lihat `DATABASE.md`).
- Algoritma `LEAST_LOADED` dan `ROUND_ROBIN` (lihat `ARCHITECTURE.md`).
- `WAITING_POOL` untuk peserta tanpa loket saat semua loket sibuk.
- Publikasi status via Socket.IO + Redis Pub/Sub (kontrak event dirujuk ke `ARCHITECTURE.md`).
- Nomor antrian otomatis berurutan per event (per loket = `TBD`).

**Kriteria Penerimaan:**

1. Peserta `VERIFIED` masuk ke loket dengan beban aktif paling sedikit (`LEAST_LOADED`).
2. Strategi `ROUND_ROBIN` mendistribusikan peserta bergilir antar loket aktif.
3. Saat semua loket sibuk, peserta masuk `WAITING_POOL`.
4. Perubahan status dipublikasikan via Socket.IO dalam < 500 ms (NFR realtime).

**Verifikasi:** Uji unit algoritma distribusi; uji integrasi publikasi Redis; uji E2E distribusi multi-loket.

---

### TASK-10 — Siklus Hidup Antrian di Loket

**Tujuan:** Operator Loket dapat memanggil peserta, menandai `SERVING`, `DONE`, atau `NO_SHOW`; sistem otomatis memanggil peserta berikutnya.

**Sumber:** FR-07, F-06.
**DEC:** DEC-005, DEC-007.
**Blocked by:** TASK-09.
**Status:** BLOCKED — menunggu keputusan threshold `NO_SHOW` (jumlah panggilan sebelum `NO_SHOW` = `TBD` per `PRD.md` FR-04).

**Cakupan:**

- Endpoint: `POST /api/v1/counters/:counterId/call-next`, `PATCH /api/v1/participants/:participantId/status`.
- Transisi status: `WAITING → CALLED → SERVING → DONE` / `NO_SHOW` / `CANCELLED`.
- Auto-call peserta berikutnya setelah `DONE`.
- Peserta `NO_SHOW` tidak dapat dipanggil lagi kecuali Supervisor reset status.

**Kriteria Penerimaan:**

1. `call-next` memanggil peserta `WAITING` berikutnya pada loket tersebut.
2. Setelah `DONE`, sistem otomatis memanggil peserta berikutnya.
3. Peserta `CANCELLED` tidak dapat divalidasi/dipanggil.
4. Threshold panggilan sebelum `NO_SHOW` **MUST** menggunakan nilai `TBD` yang ditetapkan (bukan asumsi).

**Verifikasi:** Uji integrasi transisi status; uji E2E siklus panggil → layani → selesai; uji unit auto-call.

---

### TASK-11 — Papan Antrian Publik Real-time

**Tujuan:** Halaman display publik tanpa login menampilkan nomor yang dipanggil, loket tujuan, 10 antrian berikutnya, dan total sisa antrian.

**Sumber:** FR-08, FR-U04, F-09.
**DEC:** DEC-005.
**Blocked by:** TASK-09.
**Status:** READY.

**Cakupan:**

- Halaman `/display/{eventId}` (Next.js 15 SSR).
- Langganan Socket.IO; tanpa polling manual.
- Token akses untuk event privat (`Display Access Token`).
- Penyimpanan tampilan terakhir saat koneksi terputus + reconnect otomatis.

**Kriteria Penerimaan:**

1. Membuka `/display/{eventId}` tanpa login menampilkan nomor `CALLED` aktif dan 10 antrian berikutnya.
2. Saat koneksi terputus, tampilan terakhir tetap terlihat dan reconnect otomatis dalam < 10 detik.
3. Membuka papan event privat tanpa token → HTTP 403.

**Verifikasi:** Uji E2E tampilan display; uji integrasi reconnect WebSocket; uji manual event privat.

---

### TASK-12 — Status Antrian Peserta Real-time

**Tujuan:** Peserta melihat status antriannya secara real-time pada halaman peserta tanpa polling.

**Sumber:** FR-07, FR-U03, F-05.
**DEC:** DEC-005.
**Blocked by:** TASK-09.
**Status:** READY.

**Cakupan:**

- Halaman peserta dengan langganan Socket.IO (`queue:status_changed`).
- Notifikasi in-app saat status menjadi `CALLED` meskipun kanal eksternal gagal.
- Menampilkan salah satu status: `WAITING`, `CALLED`, `SERVING`, `DONE`, `NO_SHOW`, `CANCELLED`.

**Kriteria Penerimaan:**

1. Saat Operator memanggil peserta, halaman menerima event `queue:status_changed` dalam < 500 ms.
2. Jika notifikasi WhatsApp gagal, peserta tetap melihat status `CALLED` pada halaman publik.

**Verifikasi:** Uji E2E langganan Socket.IO; uji integrasi fallback in-app.

---

### TASK-13 — Notifikasi Peserta

**Tujuan:** Peserta menerima notifikasi pendaftaran (berisi QR), panggilan loket, dan pembatalan/jadwal ulang event.

**Sumber:** FR-09, FR-U05, F-10, F-18.
**DEC:** DEC-003.
**Blocked by:** TASK-06, TASK-10.
**Status:** BLOCKED — menunggu keputusan provider notifikasi (`TBD` per `PRD.md` FR-09; kandidat WhatsApp/Email/SMS).

**Cakupan:**

- Kanal WhatsApp (prioritas), Email, SMS — provider `TBD`.
- Retry maksimal 3 kali; log status pengiriman.
- Notifikasi panggilan telat tetap tersedia sebagai pesan in-app.

**Kriteria Penerimaan:**

1. Pendaftaran sukses mengirim notifikasi berisi QR melalui kanal terpilih.
2. Notifikasi gagal di-retry maksimal 3 kali; status tercatat.
3. Nomor HP tidak valid → notifikasi gagal; peserta tetap melihat status di halaman publik.

**Verifikasi:** Uji integrasi adapter notifikasi (mock provider); uji unit retry; uji E2E alur notifikasi.

---

### TASK-14 — Dashboard & Analitik

**Tujuan:** Admin/Supervisor melihat metrik operasional event dan mengekspor data agregat.

**Sumber:** FR-10, F-11, NFR Performa.
**DEC:** DEC-006.
**Blocked by:** TASK-09.
**Status:** READY.

**Cakupan:**

- Metrik: total terdaftar, terverifikasi, menunggu, dilayani, no-show; rata-rata waktu tunggu; throughput per jam; beban per loket.
- Filter: event, loket, tanggal, status peserta.
- Ekspor CSV agregat.
- Query agregasi < 2 detik untuk 50.000 peserta (index komposit, agregasi ter-denormalisasi — lihat `DATABASE.md`).

**Kriteria Penerimaan:**

1. Dashboard menampilkan seluruh metrik dengan filter yang berfungsi.
2. Ekspor CSV menghasilkan file berisi data agregat sesuai filter.
3. Query agregasi pada dataset 50.000 peserta selesai < 2 detik.

**Verifikasi:** Uji integrasi endpoint metrik; uji performa query (benchmark); uji E2E ekspor CSV.

---

### TASK-15 — Estimasi Tier & Penegakan Kuota

**Tujuan:** Sistem menghitung estimasi tier berdasarkan kombinasi ambang peserta dan fitur add-on, serta menolak event yang kuotanya melebihi paket aktif tenant.

**Sumber:** FR-13, FR-15, F-12, F-15, FR-F01-03, FR-F01-07.
**DEC:** DEC-001, DEC-002.
**Blocked by:** TASK-03.
**Status:** BLOCKED — menunggu keputusan ambang kuota tier (`FREE`/`SMALL`/`MEDIUM`/`LARGE`) dan harga add-on (`TBD` per `PRD.md` FR-13 dan `BUSINESS.md`).

**Cakupan:**

- Endpoint: `GET /api/v1/events/:eventId/tier-estimate`, `POST /api/v1/tenants/:tenantId/upgrade`.
- Penegakan `quota ≤ tier aktif` saat publikasi (`ERR-BILL-001`).
- Peringatan upgrade pada 80% kuota; penolakan pada 100% (`ERR-EV-003`).
- Event `CANCELLED` mengembalikan kuota terpakai.

**Kriteria Penerimaan:**

1. Event kategori `SOSIAL` dengan `quota = 30.000` pada tenant `FREE` → `ERR-BILL-001`.
2. Peringatan muncul saat pemakaian mencapai 80% kuota.
3. Pembatalan event mengembalikan `quotaUsed` tenant.
4. Ambang tier **MUST** menggunakan nilai `TBD` yang ditetapkan, bukan asumsi.

**Verifikasi:** Uji unit kalkulasi tier; uji integrasi penegakan kuota; uji E2E upgrade → publikasi.

---

### TASK-16 — Pembayaran & Invoice

**Tujuan:** Owner dapat melakukan upgrade paket/pembelian add-on; invoice otomatis dibuat dan statusnya dilacak.

**Sumber:** FR-14, F-14.
**DEC:** DEC-001, DEC-002.
**Blocked by:** TASK-15.
**Status:** BLOCKED — menunggu keputusan payment gateway (`TBD` per `PRD.md` FR-14; kandidat Midtrans/Xendit/Stripe).

**Cakupan:**

- Model `Invoice` (lihat `DATABASE.md`).
- Endpoint: `POST /api/v1/tenants/:tenantId/invoices`, `GET /api/v1/tenants/:tenantId/invoices`.
- Status invoice: `PENDING`, `PAID`, `FAILED`, `EXPIRED`.
- Retry pembayaran 1x setelah gagal (`ERR-BILL-002`).
- Invoice `PENDING` melewati batas waktu → `EXPIRED`; tier tetap lama.

**Kriteria Penerimaan:**

1. Upgrade paket membuat invoice `PENDING`.
2. Pembayaran sukses mengubah status menjadi `PAID` dan mengaktifkan tier baru.
3. Pembayaran gagal → `ERR-BILL-002`; pengguna dapat mengulang.
4. Invoice `PENDING` kedaluwarsa → `EXPIRED`; tier tidak berubah.

**Verifikasi:** Uji integrasi webhook payment gateway (mock); uji unit transisi status invoice; uji E2E upgrade → bayar → tier aktif.

---

### TASK-17 — Import Peserta Massal (CSV/Excel)

**Tujuan:** Owner/Admin Event dapat mengimpor peserta massal; sistem memvalidasi tiap baris, membuat QR untuk baris valid, dan melaporkan baris gagal.

**Sumber:** FR-16, F-13, FR-IMP-001…003.
**DEC:** DEC-004.
**Blocked by:** TASK-06, TASK-07.
**Status:** READY.

**Cakupan:**

- Endpoint: `POST /api/v1/events/:eventId/participants/import`.
- Validasi kolom minimal sesuai formulir pendaftaran (FR-05).
- Duplikat NIK dalam file → `ERR-IMP-001`.
- File > 5MB → `ERR-IMP-002`.
- Baris valid melebihi kuota → `ERR-IMP-003`.
- Batas satu kali import: 10.000 baris (`TBD`).

**Kriteria Penerimaan:**

1. Import file valid menghasilkan QR untuk setiap baris valid.
2. Duplikat NIK dalam file ditolak dengan `ERR-IMP-001`.
3. File > 5MB → `ERR-IMP-002`.
4. Baris valid melebihi kuota event → `ERR-IMP-003`.
5. Laporan baris gagal disertakan dalam respons.

**Verifikasi:** Uji integrasi parser CSV/Excel; uji unit validasi baris; uji E2E import → QR terbit.

---

### TASK-18 — Aplikasi Petugas PWA (Scan + Panggil)

**Tujuan:** Petugas mengakses dashboard ringkas via PWA mobile untuk scan QR, melihat antrian loket, memanggil peserta, dan menandai status.

**Sumber:** FR-17, F-17.
**

<!-- SDD_SOURCE_DOCS: api,architecture,business,database,decisions,design,features,prd,requirements,roadmap,userflow -->
