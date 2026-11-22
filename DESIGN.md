# DESIGN.md: AntriAja

## 1. Design Read (Evidence-Based)

- **Product:** AntriAja — platform SaaS manajemen antrian massal untuk acara spontan (bansos, qurban, vaksinasi, pasar murah) dan operasional UMKM/instansi. Sistem menangani 5.000–50.000 peserta per event dengan verifikasi QR sekali scan (DEC-004) dan pembagian loket otomatis antar multi-petugas (DEC-005, DEC-007).
- **Target Audience:** Tiga persona operasional dengan konteks perangkat berbeda — (a) **Petugas lapangan** (Verifikator, Operator Loket) memakai PWA mobile di bawah tekanan waktu nyata, sering di bawah sinar matahari, satu tangan memegang HP dan satu tangan memegang barang; (b) **Supervisor & Admin Event** memakai dashboard desktop untuk memantau beban loket, memindahkan antrian, dan menangani insiden; (c) **Peserta** membuka halaman publik event sekali dari smartphone untuk mendaftar dan menerima QR.
- **Product Type:** SaaS Application.
- **Primary User Goal:** Menjaga throughput verifikasi dan pelayanan tetap tinggi pada puncak lonjakan peserta tanpa duplikasi scan, sambil memberi supervisor visibilitas real-time atas beban tiap loket.
- **User Roles & Workflows:** Peran dan izin mengikuti matriks di PRD. Kebutuhan layar per peran:
  - **Verifikator:** satu layar dominan — kamera scanner full-bleed dengan overlay status valid/invalid yang harus terbaca dalam < 1 detik (NFR performa QR). Tidak ada navigasi kompleks.
  - **Operator Loket:** daftar antrian loket yang ditugaskan, tombol "Panggil Berikutnya", dan tiga aksi status (`SERVING`, `DONE`, `NO_SHOW`). Layar dioptimalkan untuk tap berulang cepat.
  - **Supervisor:** dashboard beban per loket (FR-10), kontrol pemindahan antrian antar loket (FR-04), dan penonaktifan loket.
  - **Admin Event / Owner:** manajemen event (FR-01), konfigurasi loket & petugas (FR-03), import peserta massal (FR-16), pencarian & filter peserta (FR-19), broadcast (FR-20), billing (FR-13/14).
  - **Peserta:** form pendaftaran (FR-05) dan kartu QR (FR-06) — dua layar saja.
  - **Papan Antrian Publik (FR-08):** layar display non-interaktif yang dibaca dari jarak 3–10 meter.
- **Brand / Aesthetic Direction:** *Institutional-utilitarian dengan kontras tinggi untuk kondisi lapangan.* Referensi visual: papan informasi bandara, dasbor kontrol operasional, signage fasilitas publik. Ciri konkret yang diwajibkan: latar netral terang dengan teks gelap pekat, angka antrian berukuran raksasa dengan tabular numerals, hairline border sebagai pemisah, dan status yang dikomunikasikan lewat label teks + ikon (bukan warna saja, karena banyak pengguna lapangan mungkin memiliki buta warna parsial dan membaca di bawah cahaya terik). Tidak ada gradient dekoratif, tidak ada glassmorphism, tidak ada blob mesh.
- **Key Personality Traits:** **Presisi** (setiap angka antrian harus dapat dipercaya), **Tenang di bawah tekanan** (tidak ada animasi yang mengganggu saat lonjakan), **Terbaca dari jauh** (tipografi dan kontras dirancang untuk layar display dan HP di bawah matahari).

## 2. Design Dials (Context-Specific)

- **DESIGN_VARIANCE: 2/10.** AntriAja adalah alat operasional dengan data yang harus konsisten di seluruh layar. Variasi layout tinggi akan memperlambat pemindaian (scanning) oleh supervisor dan membingungkan petugas lapangan yang bekerja di bawah tekanan. Konsistensi posisi elemen adalah fitur, bukan kekurangan — tombol "Panggil Berikutnya" harus berada di lokasi yang sama di setiap sesi. Variasi hanya diizinkan pada papan antrian publik (FR-08) yang bersifat display, bukan interaktif.
- **MOTION_INTENSITY: 2/10.** Task velocity tinggi (scan QR < 1 detik, panggil antrian berulang). Animasi yang lebih dari sekadar feedback interaksi akan memperlambat persepsi dan berisiko mengganggu pada perangkat kelas menengah. Motion hanya diizinkan untuk: (a) transisi opacity/transform pada feedback tombol, (b) highlight baris saat status peserta berubah real-time, (c) transisi masuk/keluar pada toast notifikasi. Durasi maksimum 150ms. Tidak ada scroll-linked animation, tidak ada parallax, tidak ada entrance animation pada tabel data.
- **VISUAL_DENSITY: 8/10.** Dashboard supervisor dan operator loket harus menampilkan banyak informasi sekaligus: nomor antrian, nama peserta (ter-mask sesuai FR-19), status, waktu tunggu, beban loket. Ruang kosong berlebih akan memaksa scroll dan memperlambat keputusan. Density tinggi dicapai lewat tipografi rapat (line-height 1.35 pada tabel), padding sel 8–12px, dan hairline divider — bukan lewat card bertumpuk. Pengecualian: halaman pendaftaran peserta (FR-05) dan papan antrian publik (FR-08) memakai density 4/10 karena audiensnya bukan operator terlatih.

## 3. Visual Identity & Product-Type Adaptation

Karena produk ini adalah SaaS operasional dengan tiga konteks pemakaian yang sangat berbeda (lapangan mobile, dashboard desktop, display publik), sistem visual harus beradaptasi per konteks tanpa kehilangan identitas:

**Adaptasi per konteks:**
- **Konteks lapangan (PWA petugas, FR-17):** Prioritas pada ukuran target sentuh besar (minimal 48×48px, lebih besar dari minimum WCAG 44px karena dipakai sambil berdiri), kontras teks minimum 7:1 (bukan hanya 4.5:1) untuk keterbacaan di bawah sinar matahari, dan tidak ada elemen interaktif yang bergantung pada hover. Tombol aksi utama berukuran penuh lebar layar.
- **Konteks dashboard (Admin/Supervisor):** Prioritas pada pemindaian tabel, filter yang selalu terlihat, dan hierarki angka yang kuat. Angka metrik (total terdaftar, terverifikasi, no-show) memakai tipografi besar dengan tabular numerals agar kolom angka sejajar saat dipindai mata.
- **Konteks display publik (FR-08):** Prioritas pada ukuran font raksasa (nomor antrian yang dipanggil minimal 96px), kontras maksimum, dan tata letak yang stabil (tidak ada elemen yang bergerak kecuali nomor yang berubah). Dirancang untuk dibaca dari jarak jauh.

**Distinctiveness tanpa slop:**
- Pemisah antar seksi menggunakan **hairline border 1px** dengan warna `--color-border`, bukan card bertumpuk dengan shadow.
- Hierarki dibangun lewat **kontras tipografi** (perbedaan ukuran dan berat font yang tegas) dan **ruang kosong terstruktur**, bukan lewat warna latar yang berbeda-beda.
- Angka antrian adalah elemen visual dominan — diperlakukan seperti elemen tipografi utama, bukan badge kecil.
- Status peserta (FR-07: `WAITING`, `CALLED`, `SERVING`, `DONE`, `NO_SHOW`, `CANCELLED`) direpresentasikan sebagai **label teks monospace dengan border tipis**, bukan pill berwarna penuh. Ini memastikan status tetap terbaca saat dicetak, di-screenshot, atau dilihat oleh pengguna buta warna.
- Ikonografi dibatasi pada ikon fungsional (kamera, panah, centang, silang) dari satu set konsisten (Lucide). Tidak ada ilustrasi dekoratif, tidak ada maskot, tidak ada abstract shape.

## 4. Semantic Color System (Color Discipline)

PRD tidak menetapkan warna brand eksplisit, sehingga palet diturunkan dari kebutuhan fungsional: netral dominan untuk area data, satu warna aksen untuk aksi utama, dan warna semantik untuk status antrian. Netral membentuk ~90% antarmuka.

```css
:root {
  /* Brand */
  --color-primary: #1A3A5C;      /* navy institusional — header, teks judul, sidebar aktif */
  --color-secondary: #4A6572;    /* slate — elemen sekunder, ikon non-aktif */
  --color-accent: #C2410C;       /* burnt orange — HANYA untuk primary CTA & state aktif kritis */

  /* Semantic status */
  --color-success: #15803D;      /* VERIFIED, DONE */
  --color-warning: #B45309;      /* CALLED, NO_SHOW, kuota 80% */
  --color-danger: #B91C1C;       /* ERR-*, CANCELLED, scan duplikat */

  /* Surface & text */
  --color-bg: #F7F7F5;           /* off-white hangat — latar halaman */
  --color-surface: #FFFFFF;      /* panel, tabel, form */
  --color-fg: #18181B;           /* teks utama */
  --color-muted: #6B7280;        /* teks sekunder, label, metadata */
  --color-border: #E4E4E7;       /* hairline rule 1px */

  /* Status antrian (FR-07) — dipakai sebagai border/label, bukan fill */
  --status-waiting: #6B7280;
  --status-called: #B45309;
  --status-serving: #1A3A5C;
  --status-done: #15803D;
  --status-noshow: #B91C1C;
  --status-cancelled: #71717A;
}
```

**Aturan penggunaan warna (mengikat):**

| Warna | Diizinkan untuk | Dilarang untuk |
|:---|:---|:---|
| `--color-primary` | Header bar, judul halaman, border sidebar aktif, tombol secondary | Body text panjang, fill area besar |
| `--color-accent` | Maksimal SATU tombol primary per viewport (mis. "Panggil Berikutnya", "Daftar Sekarang") | Lebih dari satu CTA, dekorasi, border default |
| `--color-success` | Label status `VERIFIED`/`DONE`, toast sukses scan QR, indikator kuota aman | Tombol aksi, header |
| `--color-warning` | Label status `CALLED`/`NO_SHOW`, banner peringatan kuota 80% (FR-13) | Aksi destruktif |
| `--color-danger` | Pesan error (`ERR-QR-002`, `ERR-REG-003`, dll.), label `CANCELLED`, konfirmasi hapus | Notifikasi informasi |
| `--color-border` | Semua pemisah seksi, border tabel, border input | Teks, fill |

**Prohibisi eksplisit:** tidak ada gradient biru/ungu neon sebagai indikator teknologi. Tidak ada mesh gradient background. Tidak ada warna yang dipakai sebagai satu-satunya pembawa makna — setiap warna status selalu disertai label teks (lihat §12).

## 5. Typography & Type Scale (Typography Discipline)

**Font Families:**

- **UI & Body — `Inter`** (via `next/font/google`). Dipilih bukan karena default, tetapi karena: (a) memiliki **tabular numerals** (`font-feature-settings: "tnum"`) yang wajib untuk kolom angka antrian dan metrik dashboard agar tidak bergeser saat angka berubah real-time; (b) x-height tinggi untuk keterbacaan di layar kecil; (c) dukungan lengkap karakter Latin Extended untuk nama peserta Indonesia. Ini adalah persyaratan fungsional, bukan preferensi estetika.
- **Angka antrian & kode — `JetBrains Mono`**. Dipakai khusus untuk: nomor antrian panggilan (FR-07/FR-08), kode QR fallback manual (FR-17), NIK ter-mask (FR-19), dan ID event. Alasan: lebar karakter seragam mencegah layout shift saat nomor bertambah digit (`A-009` → `A-010`), dan memperjelas perbedaan karakter ambigu (`0`/`O`, `1`/`I`) saat petugas mengetik kode manual.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

**Type Scale:**

| Level | Size (rem / px) | Weight | Line-Height | Tracking | Rationale |
|:---|:---|:---|:---|:---|:---|
| display (nomor panggilan publik) | 6rem / 96px | 700 mono | 1.0 | -0.02em | Dibaca dari jarak 3–10m di papan antrian (FR-08) |
| h1 | 2rem / 32px | 700 | 1.2 | -0.01em | Judul halaman dashboard |
| h2 | 1.5rem / 24px | 600 | 1.25 | -0.005em | Judul seksi |
| h3 | 1.125rem / 18px | 600 | 1.3 | 0 | Sub-judul, header panel |
| h4 | 1rem / 16px | 600 | 1.35 | 0 | Label grup form |
| body | 0.875rem / 14px | 400 | 1.5 | 0 | Teks standar dashboard (density 8) |
| body-lg | 1rem / 16px | 400 | 1.5 | 0 | Form pendaftaran peserta, halaman publik |
| small | 0.8125rem / 13px | 400 | 1.4 | 0 | Metadata tabel, timestamp |
| caption | 0.75rem / 12px | 500 | 1.35 | 0.01em | Label status, helper text, unit |
| metric | 1.75rem / 28px | 700 | 1.1 | -0.01em | Angka KPI dashboard (tabular) |

Aturan: `body` 14px dipakai di seluruh dashboard untuk density; halaman peserta dan papan publik memakai `body-lg` 16px. Tidak ada teks di bawah 12px.

## 6. Layout Strategy & Anti-Repetition Rules

**Content Composition — pola layout per jenis konten (mengikat):**

| Konten | Pola Layout | Alasan |
|:---|:---|:---|
| Dashboard Supervisor (FR-10) | **Metric strip + master/detail**: baris metrik angka di atas, tabel beban loket sebagai master, panel detail loket di kanan | Supervisor butuh melihat semua loket sekaligus lalu menelusuri satu |
| Manajemen peserta (FR-19) | **Dense data table + filter bar sticky** | Pemindaian cepat, filter selalu terlihat |
| Detail peserta | **Split-pane**: daftar kiri, detail kanan (desktop); stack (mobile) | Menghindari kehilangan konteks daftar |
| Scanner QR (FR-06, FR-17) | **Full-bleed kamera + overlay status** | Satu tugas, satu layar |
| Konfigurasi event (FR-01) | **Form multi-step vertikal dengan section divider** | Banyak field, perlu progres jelas |
| Papan antrian publik (FR-08) | **Display grid**: nomor besar kiri, daftar berikutnya kanan | Terbaca dari jauh |
| Antrian operator loket (FR-04) | **List vertikal dengan aksi inline per baris** | Tap berulang cepat |
| Billing & invoice (FR-14) | **Tabel invoice + panel ringkasan paket** | Perbandingan status |

**Prohibisi anti-repetisi:** Dilarang menggunakan pola "Hero → 3 Cards" di mana pun dalam aplikasi. Dilarang mengulang struktur section yang identik antar halaman. Setiap halaman dashboard harus memiliki struktur yang ditentukan oleh jenis datanya, bukan template seragam.

**Grid & Spacing:**

| Token | Nilai | Penggunaan |
|:---|:---|:---|
| `--space-1` | 4px | Gap ikon-teks, padding label |
| `--space-2` | 8px | Padding sel tabel, gap antar label |
| `--space-3` | 12px | Padding kartu kecil, gap tombol |
| `--space-4` | 16px | Padding panel standar, gutter mobile |
| `--space-6` | 24px | Jarak antar seksi, gutter desktop |
| `--space-8` | 32px | Jarak antar blok besar |
| `--space-12` | 48px | Padding halaman atas/bawah |

Grid: 12 kolom desktop (gutter 24px), 8 kolom tablet (gutter 16px), 4 kolom mobile (gutter 16px). Lebar konten maksimum dashboard: 1440px. Halaman form peserta: maksimum 640px terpusat.

## 7. Anti-AI-Slop Rules (Avoid vs. Prefer)

- **Avoid:** Generic three-card feature grid di landing/dashboard. → **Prefer:** Metric strip horizontal untuk KPI, tabel terstruktur untuk perbandingan, layout asimetris master/detail untuk data hierarkis.
- **Avoid:** Setiap seksi dibungkus card rounded dengan shadow. → **Prefer:** Pemisahan lewat white space dan hairline divider (`--color-border` 1px). Card hanya dipakai sesuai §8.
- **Avoid:** Gradient ungu/biru atau glowing mesh background. → **Prefer:** Latar flat `--color-bg` dengan aksen semantik sparse dan kontras tinggi.
- **Avoid:** Ikon dekoratif, badge bermakna kosong, abstract shape. → **Prefer:** Hierarki tipografi langsung, label status monospace, ikonografi fungsional (Lucide) yang selalu disertai label teks.
- **Avoid:** Animasi layout-heavy atau gerakan dekoratif. → **Prefer:** Transisi `opacity`/`transform` maksimal 150ms, hanya untuk feedback interaksi dan highlight perubahan status real-time.
- **Avoid:** Placeholder "Lorem ipsum" atau data contoh palsu. → **Prefer:** Data kosong dengan empty state instruksional (§11) atau data mock yang diturunkan dari field nyata (nama peserta contoh, nomor antrian `A-001`).
- **Avoid:** Warna sebagai satu-satunya pembawa makna status. → **Prefer:** Label teks + ikon + warna (lihat §12).

## 8. Card & Container Discipline

**Card diizinkan HANYA untuk:**
- Widget metrik dashboard (FR-10) yang berdiri sendiri dan dapat difilter.
- Item antrian yang dapat di-drag atau dipindah antar loket oleh Supervisor (FR-04).
- Panel ringkasan paket/billing (FR-13, FR-14).
- Kartu QR peserta (FR-06) — karena QR adalah objek fisik yang harus "dibawa" peserta.
- Modal dialog dan dropdown menu.

**Card DILARANG untuk:**
- Seksi teks standar — gunakan heading + hairline divider.
- Baris tabel — gunakan border bawah 1px.
- Grup field form — gunakan fieldset dengan heading, bukan card.
- Item list antrian operator — gunakan baris dengan divider, bukan card bertumpuk.

**Prohibisi nesting:** Dilarang menempatkan card di dalam card (Card → Card → Card). Jika sebuah panel membutuhkan sub-pemisah, gunakan `--color-border` hairline, bukan card baru.

**Bentuk:** radius maksimum 6px (`rounded-md`). Tidak ada `rounded-2xl` atau pill besar kecuali untuk label status kecil. Shadow hanya `shadow-sm` pada elemen yang benar-benar mengambang (modal, dropdown); panel statis tidak memakai shadow.

## 9. Component Rules & Action Hierarchy

**Action Hierarchy:**

| Tier | Gaya | Penggunaan | Batas |
|:---|:---|:---|:---|
| Primary | Fill `--color-accent`, teks putih, tinggi 44px (mobile 48px) | Satu aksi dominan per viewport: "Panggil Berikutnya", "Daftar Sekarang", "Scan QR" | Maksimal 1 per viewport |
| Secondary | Border 1px `--color-primary`, teks `--color-primary`, transparan | Aksi penting non-dominan: "Simpan Draft", "Filter", "Ekspor CSV" | Boleh beberapa |
| Tertiary | Teks saja, underline saat hover | Aksi navigasi/sekunder: "Batal", "Lihat detail", "Ubah" | Tidak terbatas |
| Destructive | Fill `--color-danger` atau border danger | "Batalkan Event", "Hapus Petugas", "Reset Status" | Selalu butuh konfirmasi dialog |

Aturan: hanya satu tombol Primary yang boleh terlihat dominan per viewport. Pada layar scanner QR, tombol Primary adalah kontrol shutter/scan; aksi lain turun ke Secondary/Tertiary.

**State Visuals (wajib, sesuai WCAG):**

| State | Aturan Visual |
|:---|:---|
| Hover | Perubahan `background-color` atau `border-color` saja; tidak ada transform yang menggeser layout |
| Focus | Ring 2px `--color-accent` dengan `outline-offset: 2px`; wajib terlihat pada semua elemen interaktif via keyboard |
| Disabled | `opacity: 0.5`, `cursor: not-allowed`, atribut `aria-disabled="true"`; tidak menerima fokus |
| Selected | Border kiri 3px `--color-accent` + latar `--color-bg`; teks tetap kontras |
| Active | `background-color` lebih gelap 10%; durasi transisi 100ms |
| Loading | Tombol menampilkan spinner inline 16px + teks berubah ("Memproses…"); tombol disabled selama proses |

## 10. Behavioral Responsive Design

Breakpoint: **mobile** `< 640px`, **tablet** `640–1024px`, **desktop** `> 1024px`.

| Komponen | Desktop | Tablet | Mobile |
|:---|:---|:---|:---|
| Navigasi utama | Sidebar kiri tetap (240px) | Sidebar collapse ke ikon (64px) | Bottom bar dengan 4 ikon utama + menu "Lainnya" |
| Dashboard master/detail | Split-pane berdampingan | Master penuh, detail slide-over | Master penuh, detail sebagai halaman terpisah |
| Tabel peserta (FR-19) | Semua kolom | Sembunyikan kolom sekunder (wilayah, loket) | Hanya kolom nama + status; detail via expand row |
| Scanner QR (FR-06) | Kamera + panel hasil samping | Kamera + panel hasil bawah | Kamera full-bleed + overlay hasil menutupi bawah |
| Metric strip (FR-10) | 4–6 metrik sejajar | 2–3 per baris | 2 per baris, scroll horizontal jika > 4 |
| Papan antrian publik (FR-08) | Nomor besar + daftar kanan | Nomor besar + daftar bawah | Nomor besar saja; daftar berikutnya disembunyikan |
| Form pendaftaran (FR-05) | 2 kolom | 2 kolom | 1 kolom, tombol submit sticky di bawah |
| Aksi baris tabel | Tombol ikon inline | Tombol ikon inline | Menu overflow "⋯" |

Aturan tambahan: pada mobile, semua target sentuh minimal 48×48px (lebih besar dari minimum WCAG karena konteks lapangan). Bottom bar tidak boleh menutupi konten — selalu ada padding bawah 72px pada scroll container.

## 11. States (Loading, Empty, Error)

**Loading State:**
- Skeleton loader yang **meniru bentuk container sebenarnya**: tabel peserta menampilkan 10 baris skeleton dengan lebar kolom sesuai; metric strip menampilkan 4 blok angka skeleton; daftar antrian menampilkan 5 baris skeleton.
- Dilarang memakai spinner infinite generik sebagai satu-satunya indikator untuk konten yang bentuknya diketahui.
- Spinner inline hanya untuk aksi tombol (submit, scan) dan operasi < 1 detik.

**Empty State:**
Setiap empty state wajib memuat: (a) satu kalimat penjelas konteks, (b) aksi langsung berikutnya.
- Belum ada event → "Belum ada event. Buat event pertama Anda." + tombol Primary "Buat Event".
- Belum ada peserta terdaftar → "Belum ada peserta. Bagikan tautan pendaftaran atau import CSV." + tombol Secondary "Import CSV".
- Antrian loket kosong (FR-04) → tampilkan status `IDLE` dengan teks "Tidak ada antrian di loket ini."
- Pencarian tanpa hasil (FR-19) → "Tidak ada peserta yang cocok dengan filter." + tombol Tertiary "Reset filter".
- Broadcast tanpa peserta (FR-20) → "Event ini belum memiliki peserta, broadcast tidak dapat dikirim." (mengacu `ERR-BC-001`).

**Error State:**
- Error ditampilkan sebagai alert kontekstual di dekat area yang gagal, bukan toast global untuk error yang dapat ditindaklanjuti.
- Setiap error wajib menampilkan: kode error (jika ada, mis. `ERR-QR-002`), pesan manusiawi, dan tombol retry/aksi.
- Contoh scan QR (FR-06): `ERR-QR-002` → banner merah "QR sudah digunakan" + detail "Peserta ini sudah diverifikasi pada [timestamp]" + tombol Tertiary "Lihat detail peserta".
- Error jaringan pada PWA petugas → banner "Koneksi terputus. Coba lagi." + tombol Secondary "Coba lagi" + indikator status koneksi persisten di header.
- Error billing (`ERR-BILL-001`) → panel di konteks pembuatan event, bukan modal terpisah, dengan tautan langsung ke halaman upgrade.

## 12. Accessibility & Inclusivity (WCAG 2.1 AA)

- **Keyboard navigation:** Semua elemen interaktif dapat dijangkau via Tab dalam urutan logis. Scanner QR menyediakan fallback input kode manual (FR-17) yang dapat diakses keyboard. Modal men-trapping fokus dan menutup dengan Escape.
- **Focus ring:** Minimum 2px `--color-accent` dengan `outline-offset: 2px`, kontras ≥ 3:1 terhadap latar. Dilarang `outline: none` tanpa pengganti.
- **ARIA roles:** Tabel data memakai `<table>` semantik dengan `<th scope>`. Status antrian memakai `role="status"` dan `aria-live="polite"` untuk update real-time. Toast memakai `role="alert"` untuk error dan `aria-live="assertive"`. Scanner memakai `aria-label` deskriptif.
- **Touch targets:** Minimum 44×44px di semua konteks; 48×48px pada PWA petugas (konteks lapangan).
- **Status tidak boleh hanya warna:** Setiap status antrian (`WAITING`, `CALLED`, `SERVING`, `DONE`, `NO_SHOW`, `CANCELLED`) selalu ditampilkan sebagai label teks monospace + ikon + warna. Contoh: `✓ DONE` (hijau), `✕ NO_SHOW` (merah), `◷ CALLED` (oranye). Ini kritis karena banyak pengguna lapangan dapat memiliki buta warna dan membaca di bawah cahaya terik.
- **Kontras:** Teks body minimum 4.5:1; teks pada konteks lapangan (PWA petugas) minimum 7:1. Angka antrian pada papan publik minimum 7:1.
- **Reduced motion:** Hormati `prefers-reduced-motion: reduce` — nonaktifkan transisi `transform`, pertahankan hanya transisi `opacity` ≤ 100ms.
- **Bahasa:** `lang="id"` pada `<html>`; semua label, pesan error, dan konten dalam Bahasa Indonesia (sesuai Out of Scope: tidak ada multi-bahasa).

## 13. Design Rationale

Keputusan desain utama diturunkan langsung dari peran pengguna dan alur kerja di PRD:

1. **Density tinggi (8/10) dan variance rendah (2/10)** dipilih karena pengguna utama adalah operator terlatih yang bekerja di bawah tekanan waktu. Supervisor harus memindai beban seluruh loket dalam satu pandangan (FR-10); Operator Loket harus menekan tombol yang sama berulang tanpa mencari. Konsistensi posisi elemen meningkatkan kecepatan dan mengurangi kesalahan.

2. **Motion minimal (2/10)** karena setiap milidetik berarti saat lonjakan 50.000 peserta (DEC-006). Animasi dekoratif akan memperlambat persepsi dan berisiko pada perangkat kelas menengah yang umum dipakai petugas lapangan.

3. **Tipografi monospace untuk angka dan kode** karena nomor antrian berubah real-time (FR-07). Tanpa tabular numerals dan lebar karakter seragam, layout akan bergeser setiap kali nomor bertambah digit — mengganggu pemindaian dan pada papan publik (FR-08) menyebabkan teks "melompat".

4. **Status sebagai label teks + ikon, bukan warna saja** karena verifikasi QR sekali scan (DEC-004) adalah titik kritis anti-fraud. Kesalahan membaca status (mis. mengira `NO_SHOW` adalah `DONE`) berdampak langsung pada distribusi yang adil. Aksesibilitas di sini adalah persyaratan fungsional, bukan sekadar kepatuhan.

5. **Hairline border dan white space sebagai pemisah, bukan card bertumpuk** karena dashboard supervisor menampilkan banyak tabel dan metrik. Card bertumpuk akan menambah noise visual dan mengurangi density efektif.

6. **Dua density mode** (8 untuk dashboard, 4 untuk form peserta dan papan publik) mengakomodasi dua audiens berbeda: operator terlatih vs peserta awam yang hanya mendaftar sekali.

7. **Palet netral dominan dengan satu aksen** karena warna semantik (success/warning/danger) harus tetap menonjol untuk status antrian. Jika latar berwarna-warni, sinyal status akan tenggelam.

## 14. NO Invented Design Content Rule

Dilarang membuat konten desain fiktif. Aturan mengikat:

- **Dilarang** membuat testimoni pengguna, logo klien, atau studi kasus yang tidak ada di PRD.
- **Dilarang** menampilkan statistik atau angka klaim ("10.000+ event", "99% kepuasan") yang tidak berasal dari PRD atau data nyata.
- **Dilarang** membuat screenshot abstrak atau mockup palsu yang tidak merepresentasikan fitur aktual.
- **Dilarang** menambahkan seksi marketing (pricing table dengan harga fiktif, comparison chart dengan kompetitor fiktif) — harga dan ambang tier masih `TBD` sesuai DEC-002 dan Constraints PRD.
- Semua data contoh (mock data) harus diturunkan dari field nyata: nama peserta, NIK ter-mask 16 digit, nomor antrian format `A-001`, status dari enum FR-07, kode error dari tabel PRD. Contoh event: "Pembagian Daging Qurban 2025", "Vaksinasi Gratis Kelurahan Sukamaju".
- Jika sebuah layar membutuhkan konten yang belum didefinisikan (mis. field formulir tambahan yang `TBD` di FR-05), tampilkan placeholder netral "Field tambahan belum dikonfigurasi" — bukan mengarang field.

## 15. Design Pre-Flight Checklist

- [ ] Design is derived from PRD/project context.
- [ ] Design Read is specific.
- [ ] Design dials are intentional.
- [ ] Visual direction is justified.
- [ ] Color hierarchy is intentional.
- [ ] Typography is