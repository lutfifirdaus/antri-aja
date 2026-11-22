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

---

## v1 supersessions (added 2026-11-22)

DEC-001 to DEC-007 above are **not edited**. For v1 only, the owner decided the following. See `docs/adr/0001-v1-is-deliberately-small.md` and the root `PRD.md`.

## DEC-008 — v1 first user and scope

**Status:** Dijawab (supersedes DEC-003 for v1)

**Jawaban pengguna:** Start with one small event inside the owner's own organization. Social-event segment only. UMKM segment deferred.

## DEC-009 — v1 scale

**Status:** Dijawab (supersedes DEC-006 for v1)

**Jawaban pengguna:** Up to ~2,000 participants on one server and one Postgres. No Redis, no horizontal scaling. 5,000–50,000 stays a later goal.

## DEC-010 — v1 monetization

**Status:** Dijawab (defers DEC-001 and DEC-002)

**Jawaban pengguna:** No multi-tenancy, tiers, billing or payment gateway in v1. Deferred, not deleted.

## DEC-011 — v1 roles

**Status:** Dijawab (simplifies DEC-007; keeps DEC-005 in simple form)

**Jawaban pengguna:** Two roles: admin, and staff (scan and call next at an assigned station). No supervisor. Multi-counter distribution stays: assign to the open counter with the fewest waiting.

## DEC-012 — v1 check-in flow

**Status:** Dijawab (keeps DEC-004)

**Jawaban pengguna:** Register, get a QR, one scan at the gate creates the ticket and assigns a counter, counter staff call and serve. A second scan is rejected.
