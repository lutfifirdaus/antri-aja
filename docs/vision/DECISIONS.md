> **Archived long-term vision, not the v1 contract.** v1 is deliberately smaller (one organization, one event, one VPS). The current docs live at the repo root and in `docs/adr/`. Decisions here may be superseded for v1. Links to sibling files that do not exist (REQUIREMENTS, USER_FLOW, BUSINESS_RULES, ARCHITECTURE, ROADMAP) were never written.

# Keputusan Produk: AntriAja

Dokumen ini mencatat jawaban pengguna sesuai pilihan dan teks yang diberikan. Label `Dijawab` berarti opsi dipilih, bukan berarti semua detail dalam opsinya sudah ditentukan. Deskripsi opsi adalah konteks, bukan izin untuk mengarang nominal, SLA, atau kebijakan. Jika detail belum eksplisit, tandai `TBD` pada spesifikasi turunannya.

## DEC-001 — Bagaimana model monetisasi utama AntriAja sebagai SaaS?

**Status:** Dijawab

**Jawaban pengguna:** freemium + hybrid?

## DEC-002 — Karena model monetisasi hybrid dipilih, bagaimana batas antara event gratis dan event berbayar ditentukan?

**Status:** Dijawab

**Jawaban pengguna:** Kombinasi peserta & fitur: Ambang peserta menentukan tier, fitur menentukan add-on.

## DEC-003 — Segmen mana yang menjadi fokus utama AntriAja pada fase awal?

**Status:** Dijawab

**Jawaban pengguna:** Keduanya seimbang: Fitur dirancang untuk melayani kedua segmen sejak awal.

## DEC-004 — Metode verifikasi/pendaftaran peserta mana yang wajib ada di versi pertama?

**Status:** Dijawab

**Jawaban pengguna:** QR sekali scan: Setiap peserta mendapat QR unik yang hanya bisa discan sekali untuk mencegah duplikasi.

## DEC-005 — Fitur pembeda mana yang paling ingin ditonjolkan agar AntriAja unggul dari platform lain?

**Status:** Dijawab

**Jawaban pengguna:** Manajemen multi-petugas & pembagian loket: Beberapa petugas/loket dalam satu acara dengan pembagian antrian otomatis.

## DEC-006 — Berapa perkiraan jumlah peserta maksimal per acara yang harus didukung sistem?

**Status:** Dijawab

**Jawaban pengguna:** 5.000 - 50.000 peserta: Acara masif dengan banyak lokasi/loket.

## DEC-007 — Jika fitur multi-petugas/loket dipilih, bagaimana pengelolaan peran petugas dilakukan?

**Status:** Dijawab

**Jawaban pengguna:** Multi-admin dengan hak akses berbeda: Beberapa admin dengan izin berbeda (verifikator, operator loket, supervisor).
