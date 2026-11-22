> **Archived long-term vision, not the v1 contract.** v1 is deliberately smaller (one organization, one event, one VPS). The current docs live at the repo root and in `docs/adr/`. Decisions here may be superseded for v1. Links to sibling files that do not exist (REQUIREMENTS, USER_FLOW, BUSINESS_RULES, ARCHITECTURE, ROADMAP) were never written.

# FEATURES.md: AntriAja

## 1. Ruang Lingkup Dokumen

Dokumen ini mendefinisikan spesifikasi fitur AntriAja secara rinci: tujuan fitur, user story, functional requirement yang dapat diuji, acceptance criteria, edge case, dan kode error terkait. Setiap fitur dipetakan ke keputusan produk (DEC-XXX) dan dipisahkan menurut modul sistem yang didefinisikan pada PRD.

Dokumen ini **tidak** memuat skema database, definisi endpoint REST, diagram ERD, atau rencana rilis. Untuk hal tersebut lihat `ARCHITECTURE.md`, `API.md`, `DATABASE.md`, dan `ROADMAP.md`. Setiap nilai yang belum ditetapkan secara eksplisit oleh pengguna ditandai `TBD` sesuai SPEC-DRIVEN CONTRACT.

Pemetaan modul ke fitur:

| Modul | Fitur | DEC Terkait |
|---|---|---|
| Manajemen Event & Kuota | F-01, F-02, F-15 | DEC-002, DEC-006 |
| Pendaftaran & Verifikasi Peserta | F-03, F-04, F-13 | DEC-004 |
| Mesin Antrian Real-time | F-05, F-06 | DEC-005 |
| Manajemen Multi-Petugas & Loket | F-07, F-08 | DEC-005, DEC-007 |
| Papan Antrian Publik | F-09 | DEC-005 |
| Notifikasi Peserta | F-10, F-18 | DEC-003 |
| Dashboard & Analitik | F-11 | DEC-006 |
| Monetisasi Freemium + Hybrid | F-12, F-14 | DEC-001, DEC-002 |
| Multi-tenancy & RBAC | F-16, F-17 | DEC-003, DEC-007 |
| Audit Log & Keamanan | F-19 | DEC-004, DEC-007 |

---

## 2. F-01 — Pembuatan & Konfigurasi Event

**Tujuan:** Memungkinkan Owner/Admin Event mendefinisikan event baru lengkap dengan kuota, jadwal, lokasi, dan estimasi tier biaya.

**Sumber keputusan:** DEC-002 (tier ditentukan oleh ambang peserta + fitur), DEC-006 (skala 5.000–50.000 peserta).

### User Story

- Sebagai **Owner Tenant**, saya ingin membuat event dengan kuota dan jadwal yang jelas, sehingga saya dapat membuka pendaftaran peserta secara terkontrol.
- Sebagai **Admin Event**, saya ingin melihat estimasi tier gratis/berbayar sebelum mempublikasikan event, sehingga saya dapat memutuskan upgrade paket lebih awal.

### Atribut Event Wajib

| Field | Tipe | Validasi | Catatan |
|:---|:---|:---|:---|
| `name` | string | 3–120 karakter | Wajib |
| `description` | string | ≤ 2.000 karakter | Opsional |
| `category` | enum | `SOSIAL` / `UMKM` / `INSTANSI` | Wajib |
| `startsAt` | datetime | > `now()` | Wajib |
| `endsAt` | datetime | > `startsAt` | Wajib |
| `timezone` | string | IANA tz | Default `Asia/Jakarta` |
| `quota` | integer | 1 ≤ quota ≤ 50.000 | Wajib, batas atas dari DEC-006 |
| `location` | object | alamat + koordinat | Wajib untuk event fisik |
| `coverage` | object | lihat F-02 | Opsional |
| `initialCounters` | integer | ≥ 1 | Default 1 |
| `schedulingStrategy` | enum | `LEAST_LOADED` / `ROUND_ROBIN` | Default `LEAST_LOADED` (DEC-005) |

### Functional Requirements

- **FR-F01-01** Sistem harus memvalidasi `quota ≥ 1`. Jika gagal → `ERR-EV-001`.
- **FR-F01-02** Sistem harus memvalidasi `endsAt > startsAt`. Jika gagal → `ERR-EV-002`.
- **FR-F01-03** Sistem harus menghitung estimasi tier menggunakan kombinasi `quota` dan fitur add-on aktif (DEC-002). Nominal ambang tier per level = TBD.
- **FR-F01-04** Status event mengikuti state machine: `DRAFT → PUBLISHED → PAUSED → COMPLETED` atau `CANCELLED` dari `DRAFT`/`PUBLISHED`/`PAUSED`.
- **FR-F01-05** Event `PUBLISHED` tidak dapat dihapus; hanya dapat di-`CANCELLED`.
- **FR-F01-06** Event `DRAFT` tidak memengaruhi kuota tenant (lihat F-15).
- **FR-F01-07** Saat publikasi, sistem menolak jika `quota` melebihi tier aktif tenant → `ERR-BILL-001`.

### Acceptance Criteria

1. Membuat event dengan `quota = 0` mengembalikan `ERR-EV-001` dan tidak menyimpan record.
2. Membuat event dengan `endsAt ≤ startsAt` mengembalikan `ERR-EV-002`.
3. Setelah publikasi, tombol "Hapus" berubah menjadi "Batalkan Event".
4. Estimasi tier tampil sebelum publikasi; nilai `TBD` selama pricing belum ditetapkan.
5. Event kategori `SOSIAL` dengan `quota = 30.000` dan tenant pada paket `FREE` mengembalikan `ERR-BILL-001`.

### Edge Cases

- Kuota diubah dari 30.000 → 5.000 pada event `PUBLISHED` dengan 12.000 peserta terdaftar: sistem menolak (`ERR-EV-004` — kuota baru < jumlah peserta terdaftar; kode internal).
- Zona waktu berbeda dengan zona server: semua timestamp disimpan UTC, ditampilkan sesuai `timezone` event.
- Event duplikat (nama + waktu identik) diperbolehkan; tidak ada unique constraint pada nama.

---

## 3. F-02 — Wilayah Cakupan Event

**Tujuan:** Membatasi pendaftaran peserta berdasarkan wilayah administratif Indonesia.

**Sumber keputusan:** Ide pengguna ("cakupan wilayah").

### Functional Requirements

- **FR-F02-01** Event dapat mendefinisikan hierarki wilayah: `province`, `city`, `district`, `village`. Setiap level opsional; minimal salah satu.
- **FR-F02-02** Jika tidak ada level wilayah yang diisi, event bersifat publik nasional.
- **FR-F02-03** Saat pendaftaran, sistem memvalidasi wilayah peserta terhadap cakupan event. Ketidaksesuaian → `ERR-REG-005` (di luar cakupan wilayah).
- **FR-F02-04** Validasi silang dengan Dukcapil = TBD; versi awal hanya memvalidasi format dan pencocokan string wilayah.
- **FR-F02-05** Perubahan cakupan wilayah pada event `PUBLISHED` hanya dapat dilakukan Owner dan memicu notifikasi ke peserta yang tidak lagi memenuhi syarat.
- **FR-F02-06** Peserta yang sudah `VERIFIED` tidak dibatalkan otomatis saat wilayah dipersempit; keputusan manual oleh Owner (kebijakan TBD).

### Acceptance Criteria

1. Event dengan `coverage.province = "DKI Jakarta"` menolak pendaftaran dengan `province = "Jawa Barat"` → `ERR-REG-005`.
2. Event tanpa `coverage` menerima pendaftaran dari semua provinsi.
3. Perubahan wilayah pada event `PUBLISHED` mencatat entri audit log dengan `action = "EVENT_COVERAGE_UPDATED"`.

### Edge Cases

- Peserta mengisi wilayah tidak ada dalam referensi master → `ERR-REG-006` (wilayah tidak dikenal).
- Perubahan wilayah saat event `PAUSED` tidak memicu notifikasi karena pendaftaran tertutup.

---

## 4. F-03 — Pendaftaran Peserta

**Tujuan:** Menyediakan formulir pendaftaran publik per event dengan validasi identitas dan kuota.

**Sumber keputusan:** DEC-004 (QR sekali scan wajib), DEC-006 (skala besar).

### Atribut Pendaftaran Wajib

| Field | Tipe | Validasi | Catatan |
|:---|:---|:---|:---|
| `fullName` | string | 3–120 karakter | Wajib |
| `nik` | string | 16 digit numerik | Wajib, unik per event |
| `phone` | string | format E.164 atau `+62…` | Wajib |
| `province` | string | referensi master | Wajib |
| `city` | string | referensi master | Wajib |
| `district` | string | referensi master | Opsional |
| `village` | string | referensi master | Opsional |
| `customFields` | object | per event | Opsional; skema TBD |

### Functional Requirements

- **FR-F03-01** Sistem memvalidasi NIK 16 digit numerik → `ERR-REG-001`.
- **FR-F03-02** Sistem memvalidasi nomor HP → `ERR-REG-002`.
- **FR-F03-03** Sistem menolak NIK yang sudah terdaftar pada event yang sama → `ERR-REG-003`.
- **FR-F03-04** Sistem menolak pendaftaran jika kuota penuh → `ERR-REG-004` (alias `ERR-EV-003`).
- **FR-F03-05** Setelah pendaftaran berhasil, sistem membuat `participant_id` dan QR unik (lihat F-04).
- **FR-F03-06** Nomor antrian peserta dibuat berurutan per event atau per loket = TBD (lihat F-06).
- **FR-F03-07** Sistem menolak pendaftaran pada event yang bukan `PUBLISHED` → `ERR-REG-007`.

### Acceptance Criteria

1. NIK dengan 15 digit → `ERR-REG-001`.
2. NIK duplikat pada event yang sama → `ERR-REG-003`.
3. Nomor HP `0812abc` → `ERR-REG-002`.
4. Pendaftaran sukses mengembalikan `participant_id`, `queue_number`, dan URL QR.
5. Pendaftaran pada event `DRAFT`/`PAUSED`/`COMPLETED`/`CANCELLED` → `ERR-REG-007`.

### Edge Cases

- Dua pendaftaran dengan NIK sama dikirim bersamaan: constraint unik di database menang, request kedua → `ERR-REG-003`.
- NIK valid secara format tetapi tidak ada di Dukcapil: tetap diterima (validasi Dukcapil TBD).
- Peserta mendaftar ke dua event berbeda dengan NIK sama: diperbolehkan.

---

## 5. F-04 — Verifikasi QR Sekali Scan

**Tujuan:** Verifikasi kehadiran peserta melalui QR unik yang hanya dapat dipindai satu kali.

**Sumber keputusan:** DEC-004 (wajib, anti-duplikasi).

### Struktur Payload QR

```
{
  "event_id": "evt_xxx",
  "participant_id": "prt_xxx",
  "signature": "jwt-or-hmac"
}
```

Signature diverifikasi terhadap secret per event. Rotasi secret = TBD.

### Functional Requirements

- **FR-F04-01** QR bersifat *single-use*. Setelah scan pertama sukses, status peserta berubah menjadi `VERIFIED`.
- **FR-F04-02** Scan kedua ditolak dengan `ERR-QR-002` ("QR sudah digunakan").
- **FR-F04-03** Verifikasi signature gagal → `ERR-QR-003`.
- **FR-F04-04** QR milik event lain → `ERR-QR-004`.
- **FR-F04-05** QR di luar jendela waktu event → `ERR-QR-001`.
- **FR-F04-06** Petugas tanpa izin scan → `ERR-QR-005`.
- **FR-F04-07** Scan harus idempoten: dua request scan bersamaan untuk QR sama hanya boleh sukses satu kali (exactly-once).
- **FR-F04-08** Setiap scan (sukses/gagal) dicatat di audit log dengan `actor_id`, `participant_id`, `timestamp`, `ip`.

### Acceptance Criteria

1. Scan pertama QR valid → `200 OK`, status peserta `VERIFIED`.
2. Scan kedua QR yang sama → `ERR-QR-002`.
3. QR dengan signature diubah → `ERR-QR-003`.
4. QR dari event A dipindai di event B → `ERR-QR-004`.
5. Petugas dengan peran `PESERTA` mencoba scan → `ERR-QR-005`.

### Edge Cases

- Dua perangkat scan QR sama pada milidetik yang sama: Redis lock per `participant_id` memastikan hanya satu sukses.
- QR dipindai setelah event `COMPLETED` → `ERR-QR-001`.
- Kamera gagal membaca QR → fallback input kode manual (lihat F-17).

---

## 6. F-05 — Mesin Antrian Real-time

**Tujuan:** Mengelola siklus hidup peserta dalam antrian secara real-time.

**Sumber keputusan:** DEC-005 (multi-loket), DEC-006 (skala besar).

### State Machine Peserta

```
WAITING → CALLED → SERVING → DONE
   │         │
   │         └→ NO_SHOW
   └→ CANCELLED
```

Transisi valid:

| From | To | Trigger |
|:---|:---|:---|
| `WAITING` | `CALLED` | Operator memanggil |
| `CALLED` | `SERVING` | Peserta tiba di loket |
| `CALLED` | `NO_SHOW` | 3 kali panggilan tanpa respon (threshold TBD) |
| `SERVING` | `DONE` | Operator menyelesaikan |
| `WAITING` | `CANCELLED` | Peserta/Admin membatalkan |
| `NO_SHOW` | `WAITING` | Supervisor reset (lihat F-08) |

### Functional Requirements

- **FR-F05-01** Setiap perubahan status dipublikasikan ke Socket.IO channel per event.
- **FR-F05-02** Latensi broadcast status < 500 ms end-to-end.
- **FR-F05-03** Nomor antrian dibuat unik per event (atau per loket = TBD).
- **FR-F05-04** Peserta `NO_SHOW` tidak dapat dipanggil kembali tanpa reset Supervisor.
- **FR-F05-05** Peserta `CANCELLED` tidak dapat diverifikasi QR-nya.
- **FR-F05-06** Setiap transisi status dicatat di audit log.

### Acceptance Criteria

1. Perubahan status `WAITING → CALLED` terlihat di Papan Antrian Publik < 500 ms.
2. Peserta `NO_SHOW` yang dipanggil lagi tanpa reset → `ERR-Q-001` (state invalid).
3. Peserta `CANCELLED` yang scan QR → `ERR-QR-002` atau `ERR-Q-002` (kebijakan TBD).

### Edge Cases

- Operator memanggil peserta yang sudah `DONE` → ditolak `ERR-Q-001`.
- Dua operator memanggil peserta sama pada loket berbeda: lock per peserta; request kedua gagal.

---

## 7. F-06 — Pembagian Antrian Otomatis Antar Loket

**Tujuan:** Mendistribusikan peserta ke loket secara otomatis sesuai strategi.

**Sumber keputusan:** DEC-005 (diferensiator utama).

### Strategi Distribusi

| Strategi | Deskripsi |
|:---|:---|
| `LEAST_LOADED` | Pilih loket dengan antrian aktif paling sedikit |
| `ROUND_ROBIN` | Distribusi bergilir antar loket aktif |

Default `LEAST_LOADED` (DEC-005).

### Functional Requirements

- **FR-F06-01** Sistem menetapkan peserta ke loket saat peserta masuk `WAITING` atau saat dipanggil, sesuai implementasi = TBD.
- **FR-F06-02** Jika semua loket sibuk, peserta masuk `WAITING_POOL` tanpa loket.
- **FR-F06-03** Saat Operator menyelesaikan peserta, sistem otomatis memanggil peserta berikutnya pada loket tersebut.
- **FR-F06-04** Loket tanpa petugas aktif berstatus `INACTIVE` dan tidak menerima antrian baru.
- **FR-F06-05** Loket yang dinonaktifkan saat memiliki antrian → antrian dialihkan ke loket aktif lain oleh Supervisor.
- **FR-F06-06** Loket kosong menampilkan status `IDLE`.

### Acceptance Criteria

1. Dengan 3 loket aktif dan strategi `LEAST_LOADED`, peserta ke-4 dialokasikan ke loket dengan antrian terpendek.
2. Dengan `ROUND_ROBIN`, peserta dialokasikan bergilir loket 1 → 2 → 3 → 1.
3. Loket dinonaktifkan saat punya 5 antrian: 5 peserta dialihkan ke loket aktif lain; audit log mencatat `QUEUE_REASSIGNED`.

### Edge Cases

- Semua loket dinonaktifkan → peserta tetap di `WAITING_POOL` dan sistem menampilkan peringatan ke Supervisor.
- Loket baru ditambahkan saat event berjalan: peserta dari `WAITING_POOL` dialokasikan ulang (kebijakan TBD).

---

## 8. F-07 — Manajemen Multi-Petugas & Loket

**Tujuan:** Mengelola loket dan penugasan petugas dengan peran berbeda.

**Sumber keputusan:** DEC-005, DEC-007.

### Peran Petugas

| Peran | Izin Utama | Batasan |
|:---|:---|:---|
| `VERIFIER` | Scan QR, tandai hadir | Tidak dapat memanggil antrian |
| `COUNTER_OPERATOR` | Panggil, `SERVING`, `DONE`, `NO_SHOW` | Hanya pada loket yang ditugaskan |
| `SUPERVISOR` | Pantau semua loket, pindahkan antrian, nonaktifkan loket | Tidak dapat mengubah billing/tenant |

### Functional Requirements

- **FR-F07-01** Satu petugas dapat ditugaskan ke beberapa loket.
- **FR-F07-02** Satu loket dapat memiliki beberapa petugas paralel dengan kapasitas paralel maksimal yang dikonfigurasi.
- **FR-F07-03** Petugas yang dihapus dari loket tetap memiliki riwayat aksi di audit log.
- **FR-F07-04** Perubahan peran dicatat di audit log.
- **FR-F07-05** Petugas tidak dapat mengubah perannya sendiri.

### Acceptance Criteria

1. Petugas `VERIFIER` mencoba memanggil antrian → `ERR-AUTH-001`.
2. Petugas `COUNTER_OPERATOR` mencoba memanggil di loket yang tidak ditugaskan → `ERR-AUTH-002`.
3. Menghapus petugas dari loket tidak menghapus entri audit log terkait.

### Edge Cases

- Petugas ditugaskan ke loket yang dinonaktifkan: petugas tidak menerima antrian baru, tetapi dapat menyelesaikan antrian yang sedang berjalan.
- Kapasitas paralel loket terlampaui: peserta tetap di `WAITING_POOL`.

---

## 9. F-08 — Manajemen Peran & Hak Akses (RBAC)

**Tujuan:** Menyediakan kontrol akses berbasis peran dengan multi-admin dalam satu tenant.

**Sumber keputusan:** DEC-007 (multi-admin dengan hak akses berbeda).

### Functional Requirements

- **FR-F08-01** Owner mengundang petugas melalui email atau nomor HP.
- **FR-F08-02** Undangan menghasilkan tautan onboarding dengan masa berlaku = TBD.
- **FR-F08-03** Perubahan peran berlaku pada request berikutnya (token di-refresh).
- **FR-F08-04** Owner terakhir tidak dapat menghapus dirinya sendiri dari tenant → `ERR-AUTH-003`.
- **FR-F08-05** Sesi aktif yang perannya berubah menerima izin baru pada request berikutnya.

### Acceptance Criteria

1. Owner terakhir mencoba keluar dari tenant → `ERR-AUTH-003`.
2. Perubahan peran dari `VERIFIER` → `SUPERVISOR` berlaku pada request berikutnya, bukan pada request yang sedang berjalan.
3. Undangan yang kedaluwarsa tidak dapat digunakan → `ERR-AUTH-004`.

### Edge Cases

- Dua Owner menghapus satu sama lain secara bersamaan: sistem memastikan minimal satu Owner tetap ada.
- Petugas yang diundang dengan email yang sudah terdaftar di tenant lain: diperbolehkan (multi-tenant).

---

## 10. F-09 — Papan Antrian Publik

**Tujuan:** Menyediakan tampilan real-time untuk peserta dan layar display.

**Sumber keputusan:** DEC-005.

### Functional Requirements

- **FR-F09-01** Menampilkan nomor antrian sedang dipanggil dan loket tujuan.
- **FR-F09-02** Menampilkan daftar antrian berikutnya (maksimal 10).
- **FR-F09-03** Menampilkan total antrian tersisa.
- **FR-F09-04** Dapat diakses tanpa login untuk event publik; event private memerlukan token akses.
- **FR-F09-05** Refresh otomatis via WebSocket; tidak ada polling manual.
- **FR-F09-06** Jika koneksi terputus, tampilan terakhir disimpan dan reconnect otomatis.

### Acceptance Criteria

1. Papan menampilkan pembaruan dalam < 500 ms setelah perubahan status.
2. Event private tanpa token → `ERR-PUB-001`.
3. Reconnect otomatis berhasil dalam < 5 detik setelah koneksi pulih.

### Edge Cases

- 1.000 koneksi WebSocket bersamaan: sistem tetap stabil (target NFR).
- Display dengan layar kecil: layout responsif.

---

## 11. F-10 — Notifikasi Peserta

**Tujuan:** Mengirim notifikasi transaksional ke peserta.

**Sumber keputusan:** DEC-003 (segmen seimbang).

### Kanal

| Kanal | Prioritas | Provider |
|:---|:---|:---|
| WhatsApp | Tinggi | TBD |
| Email | Sedang | TBD |
| SMS | Rendah | TBD |

### Functional Requirements

- **FR-F10-01** Notifikasi dikirim saat: pendaftaran berhasil (berisi QR), peserta dipanggil, event dibatalkan/dijadwalkan ulang.
- **FR-F10-02** Retry maksimal 3 kali dengan exponential backoff.
- **FR-F10-03** Status pengiriman dicatat: `QUEUED`, `SENT`, `FAILED`, `DELIVERED`.
- **FR-F10-04** Nomor HP tidak valid → notifikasi gagal, tetapi peserta tetap dapat melihat status di halaman publik.
- **FR-F10-05** Notifikasi panggilan yang telat diterima tetap muncul sebagai in-app message.

### Acceptance Criteria

1. Pendaftaran sukses memicu notifikasi WhatsApp berisi tautan QR.
2. Notifikasi gagal 3 kali → status `FAILED`, tercatat di log.
3. Peserta dipanggil → notifikasi terkirim < 1 detik setelah status `CALLED`.

### Edge Cases

- Provider WhatsApp down: fallback ke Email (kebijakan TBD).
- Peserta memblokir nomor pengirim: status `FAILED`, tidak ada retry tambahan.

---

## 12. F-11 — Dashboard & Analitik

**Tujuan:** Memberikan visibilitas operasional real-time dan historis.

**Sumber keputusan:** DEC-006 (skala 50.000 peserta).

### Metrik

| Metrik | Deskripsi | Target |
|:---|:---|:---|
| Total terdaftar | Jumlah peserta terdaftar | Real-time |
| Total terverifikasi | Jumlah `VERIFIED` | Real-time |
| Menunggu | Jumlah `WAITING` | Real-time |
| Dilayani | Jumlah `DONE` | Real-time |
| No-show | Jumlah `NO_SHOW` | Real-time |
| Rata-rata waktu tunggu | `CALLED - WAITING` | Per loket + keseluruhan |
| Throughput per jam | Jumlah `DONE`/jam | Per loket |
| Beban aktif per loket | Antrian aktif | Real-time |

### Functional Requirements

- **FR-F11-01** Query agregasi untuk 50.000 peserta < 2 detik.
- **FR-F11-02** Filter: event, loket, tanggal, status peserta.
- **FR-F11-03** Ekspor CSV data agregat.
- **FR-F11-04** Hanya peran Super Admin, Owner, Admin Event, Supervisor yang dapat mengakses.

### Acceptance Criteria

1. Dashboard dengan event 50.000 peserta memuat < 2 detik.
2. Ekspor CSV menghasilkan file dengan header sesuai filter.
3. Verifier/Operator tidak dapat mengakses → `ERR-AUTH-005`.

### Edge Cases

- Filter tanggal tanpa hasil: tampilkan empty state.
- Ekspor > 100.000 baris: streaming CSV (implementasi TBD).

---

## 13. F-12 — Monetisasi Freemium + Hybrid

**Tujuan:** Mengimplementasikan model freemium + hybrid dengan tier berbasis peserta dan add-on berbasis fitur.

**Sumber keputusan:** DEC-001, DEC-002.

### Paket (nilai TBD)

| Paket | Kuota Peserta/Event | Loket Aktif | Petugas | Fitur |
|:---|:---|:---|:---|:---|
| Free | 1.000 (TBD) | 2 (TBD) | 5 (TBD) | Antrian, QR, papan antrian |
| Small | TBD | TBD | TBD | + branding dasar |
| Medium | TBD | TBD | TBD | + notifikasi premium |
| Large | TBD | TBD | TBD | + API, retensi panjang |

### Add-on (nilai TBD)

- Tambahan loket
- Tambahan petugas
- Custom branding
- Notifikasi premium (WhatsApp/Email/SMS)
- API akses
- Retensi data lebih lama

### Functional Requirements

- **FR-F12-01** Sistem menghitung tier saat pembuatan event.
- **FR-F12-02** Event dengan `quota` melebihi tier aktif → `ERR-BILL-001`.
- **FR-F12-03** Event mencapai 80% kuota → peringatan upgrade.
- **FR-F12-04** Event mencapai 100% kuota → penolakan pendaftaran baru (`ERR-EV-003`) kecuali upgrade dilakukan.
- **FR-F12-05** Upgrade/downgrade bersifat prorata (mekanisme TBD).

### Acceptance Criteria

1. Tenant Free membuat event `quota = 2.000` → `ERR-BILL-001`.
2. Event dengan 800/1.000 peserta → peringatan 80% muncul di dashboard.
3. Event dengan 1.000/1.000 peserta → pendaftaran baru `ERR-EV-003`.

### Edge Cases

- Downgrade saat event aktif melebihi kuota baru: event tetap berjalan, tetapi pendaftaran baru diblokir (kebijakan TBD).
- Add-on dibeli saat event berjalan: berlaku segera setelah pembayaran `PAID`.

---

## 14. F-13 — Import Peserta Massal

**Tujuan:** Memungkinkan import peserta massal via CSV/Excel.

**Sumber keputusan:** DEC-006 (skala besar).

### Functional Requirements

- **FR-F13-01** Format kolom minimal sama dengan F-03.
- **FR-F13-02** Validasi per baris; baris valid dibuatkan QR; baris gagal dilaporkan.
- **FR-F13-03** Duplikat NIK dalam file ditolak → `ERR-IMP-001`.
- **FR-F13-04** Batas ukuran file 5 MB → `ERR-IMP-002`.
- **FR-F13-05** Batas baris per import 10.000 (TBD) → `ERR-IMP-003`.
- **FR-F13-06** Baris valid melebihi kuota event → `ERR-IMP-003`.

### Acceptance Criteria

1. File 6 MB → `ERR-IMP-002`.
2. File dengan 2 baris NIK sama → baris kedua `ERR-IMP-001`.
3. Import 5.000 baris valid pada event kuota 3.000 → `ERR-IMP-003`, tidak ada baris disimpan.

### Edge Cases

- File dengan encoding non-UTF-8: ditolak dengan pesan jelas (kode `ERR-IMP-004`, TBD).
- Import bersamaan oleh dua admin: lock per event.

---

## 15. F-14 — Pembayaran & Invoice

**Tujuan:** Menangani pembayaran upgrade paket dan add-on.

**Sumber keputusan:** DEC-001, DEC-002.

### Functional Requirements

- **FR-F14-01** Payment gateway = TBD (kandidat Midtrans/Xendit/Stripe).
- **FR-F14-02** Invoice otomatis dibuat saat upgrade atau pembelian add-on.
- **FR-F14-03** Status invoice: `PENDING`, `PAID`, `FAILED`, `EXPIRED`.
- **FR-F14-04** Notifikasi pembayaran ke Owner; retry 1x setelah gagal.
- **FR-F14-05** Invoice `PENDING` melewati batas waktu → `EXPIRED`; tier tetap lama.
- **FR-F14-06** Pembayaran `FAILED` → `ERR-BILL-002`; pengguna dapat mengulang.

### Acceptance Criteria

1. Upgrade paket membuat invoice `PENDING`.
2. Pembayaran sukses → invoice `PAID`, tier aktif.
3. Invoice `PENDING` melewati batas waktu (TBD) → `EXPIRED`.

### Edge Cases

- Pembayaran ganda untuk invoice yang sama: idempotensi berbasis `invoice_id`.
- Refund = TBD.

---

## 16. F-15 — Manajemen Kuota & Tier

**Tujuan:** Memantau dan menegakkan kuota peserta per tenant.

### Functional Requirements

- **FR-F15-01** Sistem memeriksa kuota peserta per event terhadap paket tenant sebelum publikasi.
- **FR-F15-02** Kuota bulanan agregat per tenant (jika berlaku, TBD) dipantau di dashboard.
- **FR-F15-03** Peringatan 80%; blokir 100% (DEC-002).
- **FR-F15-04** Event `DRAFT` tidak memengaruhi kuota.
- **FR-F15-05** Event `CANCELLED` mengembalikan kuota yang sudah terpakai.

### Acceptance Criteria

1. Mempublikasikan event melebihi kuota tenant → `ERR-BILL-001`.
2. Membatalkan event mengembalikan kuota di dashboard.

### Edge Cases

- Event `CANCELLED` setelah peserta `VERIFIED`: kuota dikembalikan, tetapi data peserta dipertahankan untuk audit.

---

## 17. F-16 — Multi-tenancy

**Tujuan:** Isolasi data antar tenant.

**Sumber keputusan:** DEC-003 (segmen seimbang).

### Functional Requirements

- **FR-F16-01** Setiap tenant memiliki data terisolasi penuh.
- **FR-F16-02** Satu user dapat menjadi anggota beberapa tenant dengan peran berbeda.
- **FR-F16-03** Super Admin platform hanya melihat metadata tenant (nama, paket, status), bukan data peserta.
- **FR-F16-04** Tenant dihapus/dinonaktifkan → data peserta dipertahankan sesuai kebijakan retensi (TBD) atau dihapus permanen setelah masa tenggang (TBD).

### Acceptance Criteria

1. User dengan akses ke tenant A tidak dapat mengakses data tenant B tanpa izin → `ERR-AUTH-006`.
2. Super Admin mencoba mengakses data peserta → `ERR-AUTH-007`.

### Edge Cases

- User diundang ke tenant baru saat sudah aktif di tenant lain: sesi tetap, konteks tenant dipilih per request.

---

## 18. F-17 — Aplikasi Petugas (PWA)

**Tujuan:** Menyediakan antarmuka ringan