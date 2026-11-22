> **Archived long-term vision, not the v1 contract.** v1 is deliberately smaller (one organization, one event, one VPS). The current docs live at the repo root and in `docs/adr/`. Decisions here may be superseded for v1. Links to sibling files that do not exist (REQUIREMENTS, USER_FLOW, BUSINESS_RULES, ARCHITECTURE, ROADMAP) were never written.

# Panduan Blueprint: AntriAja

## Urutan kerja untuk AI agent

1. Baca `DECISIONS.md` sebagai rekaman jawaban pengguna. Jangan mengubah keputusan yang sudah dinyatakan tanpa meminta klarifikasi.
2. Baca `PRD.md` untuk tujuan dan batas produk, lalu `REQUIREMENTS.md` atau `FEATURES.md` untuk perilaku serta kriteria penerimaan.
3. Baca `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, dan dokumen teknis lain yang tersedia sebelum mengimplementasikan fitur terkait.
4. Kerjakan `TASKS.md` sesuai dependensi. Uji hasil terhadap kriteria penerimaan dan catat pekerjaan yang belum selesai.

## Aturan saat dokumen berbeda

- Jawaban eksplisit pengguna di `DECISIONS.md` memiliki prioritas tertinggi. Deskripsi pilihan hanya menjelaskan konteks; jangan menganggap seluruh contoh di dalamnya sebagai keputusan final.
- `TBD` berarti keputusan belum tersedia. Jangan mengubahnya menjadi angka atau perilaku final secara diam-diam.
- Untuk kontrak endpoint gunakan `API.md`; untuk struktur data gunakan `DATABASE.md`; untuk alur pengguna gunakan `USER_FLOW.md`. Jika dokumen tersebut bertentangan dengan keputusan pengguna, hentikan bagian terkait dan minta klarifikasi.
- Dokumen yang terkunci atau gagal dibuat bukan spesifikasi siap implementasi.

## Berkas tersedia

- [PRD.md](PRD.md)
- [DESIGN.md](DESIGN.md)
- [REQUIREMENTS.md](REQUIREMENTS.md)
- [FEATURES.md](FEATURES.md)
- [USER_FLOW.md](USER_FLOW.md)
- [DATABASE.md](DATABASE.md)
- [API.md](API.md)
- [BUSINESS_RULES.md](BUSINESS_RULES.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ROADMAP.md](ROADMAP.md)
- [DECISIONS.md](DECISIONS.md)
- [TASKS.md](TASKS.md)
