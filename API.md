# API.md: AntriAja

## 1. Ruang Lingkup Dokumen

Dokumen ini mendefinisikan kontrak HTTP API publik dan internal AntriAja: mekanisme autentikasi/otorisasi, format respons standar, format paginasi, serta definisi endpoint inti yang menopang modul Manajemen Event & Kuota, Pendaftaran & Verifikasi QR Sekali Scan (DEC-004), Mesin Antrian Real-time (DEC-005), Manajemen Multi-Petugas & Loket (DEC-007), Dashboard & Analitik (DEC-006), dan Monetisasi Freemium + Hybrid (DEC-001, DEC-002).

Skema database, ERD, dan relasi tabel dirujuk ke `DATABASE.md`. Arsitektur runtime, topologi Socket.IO, dan strategi Redis Pub/Sub dirujuk ke `ARCHITECTURE.md`. Perilaku testable per fitur dirujuk ke `REQUIREMENTS.md` dan `FEATURES.md`. Nilai yang belum ditetapkan secara eksplisit oleh pengguna ditandai `TBD` sesuai SPEC-DRIVEN CONTRACT; dokumen ini **tidak** mengarang nominal, harga, atau SLA.

Semua endpoint berada di bawah base path `/api/v1`. Kontrak real-time (Socket.IO events) dirujuk ke `ARCHITECTURE.md`; dokumen ini hanya mendefinisikan jembatan REST untuk langganan token WebSocket.

---

## 2. Authentication & Authorization

### 2.1 Mekanisme Autentikasi

AntriAja menggunakan **Clerk v6** sebagai identity provider dengan model multi-tenant. Autentikasi pengguna internal (Owner, Admin Event, Supervisor, Verifikator, Operator Loket, Super Admin Platform) menggunakan **Clerk Session JWT** yang diterbitkan oleh Clerk dan diverifikasi oleh backend Express 5 melalui Clerk middleware.

Autentikasi peserta (pengguna publik tanpa akun Clerk) menggunakan **Participant Access Token** — JWT pendek yang diterbitkan backend setelah pendaftaran berhasil, berisi klaim `participant_id` dan `event_id`.

| Tipe Token | Penerbit | Pengguna | Masa Berlaku |
|:---|:---|:---|:---|
| Clerk Session JWT | Clerk | Super Admin, Owner, Admin Event, Supervisor, Verifikator, Operator Loket | TBD (mengikuti konfigurasi Clerk) |
| Participant Access Token | Backend AntriAja | Peserta | TBD |
| Display Access Token | Backend AntriAja | Papan Antrian Publik (private event) | TBD |

### 2.2 Header Format

Semua request terautentikasi **MUST** menyertakan header berikut:

```
Authorization: Bearer <token>
X-Tenant-Id: <tenant_uuid>
X-Request-Id: <uuid_v4>
Content-Type: application/json
```

- `Authorization` — wajib untuk semua endpoint kecuali endpoint publik yang ditandai `Public`.
- `X-Tenant-Id` — wajib untuk semua endpoint yang beroperasi dalam konteks tenant (Owner, Admin Event, Supervisor, Verifikator, Operator Loket). Backend memverifikasi bahwa user adalah anggota tenant tersebut melalui Clerk Organization membership.
- `X-Request-Id` — opsional namun direkomendasikan untuk tracing; jika tidak dikirim, backend membuat UUID baru dan mengembalikannya di header respons.

### 2.3 Model Otorisasi

Otorisasi menggunakan **Role-Based Access Control (RBAC)** dengan peran yang didefinisikan pada `PRD.md` (DEC-007). Setiap endpoint mendeklarasikan level akses minimum. Backend memvalidasi:

1. Token valid dan belum kedaluwarsa.
2. User adalah anggota tenant pada header `X-Tenant-Id`.
3. Peran user memenuhi izin minimum endpoint.
4. Untuk Operator Loket, resource yang diakses (loket, antrian) **MUST** termasuk dalam penugasan loket user.

Kegagalan otorisasi mengembalikan `403 Forbidden` dengan kode error spesifik (mis. `ERR-QR-005` untuk scan tanpa izin).

### 2.4 Idempotensi Scan QR

Endpoint verifikasi QR (`POST /api/v1/events/:eventId/verify`) **MUST** bersifat idempotent secara semantik: scan kedua pada QR yang sama mengembalikan `409 Conflict` dengan `ERR-QR-002` dan **tidak** mengubah status peserta. Proteksi duplikasi ditegakkan melalui unique constraint database dan Redis lock per `participant_id`.

---

## 3. Standard Response & Pagination Formats

### 3.1 Format Respons Sukses

Semua respons sukses mengembalikan objek JSON dengan field `data` (objek atau array) dan opsional `meta`:

```json
{
  "data": { },
  "meta": { }
}
```

### 3.2 Format Respons Error

Semua respons error mengembalikan objek dengan struktur konsisten:

```json
{
  "error": {
    "code": "ERR-REG-003",
    "message": "Peserta dengan NIK ini sudah terdaftar pada event.",
    "details": { "field": "nik" },
    "requestId": "b1f2c3d4-..."
  }
}
```

Field `code` mengikuti tabel kode error pada `PRD.md`. Field `message` dalam Bahasa Indonesia; `details` opsional untuk menyertakan konteks validasi.

### 3.3 Format Paginasi

Endpoint list menggunakan paginasi berbasis cursor untuk dataset besar (peserta hingga 50.000 per event, DEC-006) dan offset untuk dataset kecil.

```json
{
  "data": [ ],
  "meta": {
    "page": 1,
    "pageSize": 100,
    "total": 48213,
    "hasNext": true,
    "nextCursor": "cDoxMDAwMA=="
  }
}
```

Parameter query standar: `page` (default 1), `pageSize` (default 100, maksimum 500), `cursor` (opsional, menggantikan `page` untuk dataset besar), `sort` (mis. `createdAt:desc`).

---

## 4. API Endpoints

Endpoint dikelompokkan per domain. Setiap endpoint mendefinisikan Method, Path, Deskripsi, Auth level, Request Body, Response Body, dan Status Codes.

### 4.1 Event Management

#### POST /api/v1/events

**Deskripsi:** Membuat event baru. Sistem menghitung estimasi tier (gratis/berbayar) berdasarkan kuota dan fitur (DEC-002) dan menolak jika kuota melebihi paket aktif tenant (`ERR-BILL-001`).

**Auth level:** Owner, Admin Event

**Request Body:**

```json
{
  "name": "Pembagian Daging Qurban 1446H",
  "description": "Distribusi daging qurban untuk warga Kelurahan Sukamaju.",
  "category": "SOSIAL",
  "startsAt": "2026-06-15T01:00:00.000Z",
  "endsAt": "2026-06-15T09:00:00.000Z",
  "timezone": "Asia/Jakarta",
  "quota": 8000,
  "location": {
    "address": "Balai RW 05, Kelurahan Sukamaju",
    "latitude": -6.2146,
    "longitude": 106.8451
  },
  "coverage": {
    "provinceCode": "31",
    "cityCode": "3174",
    "districtCode": "3174010",
    "villageCode": "3174010001"
  },
  "initialCounters": [
    { "name": "Loket A", "serviceType": "DAGING", "maxParallel": 1 },
    { "name": "Loket B", "serviceType": "DAGING", "maxParallel": 1 }
  ],
  "queueStrategy": "LEAST_LOADED"
}
```

**Response Body (201):**

```json
{
  "data": {
    "id": "evt_01HX9K...",
    "tenantId": "tnt_01HX...",
    "name": "Pembagian Daging Qurban 1446H",
    "status": "DRAFT",
    "quota": 8000,
    "registeredCount": 0,
    "queueStrategy": "LEAST_LOADED",
    "estimatedTier": "MEDIUM",
    "tierThresholdWarning": null,
    "counters": [
      { "id": "ctr_01HX...", "name": "Loket A", "status": "INACTIVE" }
    ],
    "createdAt": "2026-05-01T08:12:33.000Z"
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 201 | Event berhasil dibuat |
| 400 | `ERR-EV-001` kuota < 1 atau `ERR-EV-002` endsAt ≤ startsAt |
| 402 | `ERR-BILL-001` kuota melebihi tier aktif |
| 403 | User bukan anggota tenant atau peran tidak memenuhi |
| 422 | Payload tidak lolos validasi skema |

---

#### GET /api/v1/events/:eventId

**Deskripsi:** Mengambil detail event termasuk status, kuota terpakai, daftar loket, dan konfigurasi strategi antrian.

**Auth level:** Owner, Admin Event, Supervisor, Verifikator, Operator Loket

**Request Body:** N/A

**Response Body (200):**

```json
{
  "data": {
    "id": "evt_01HX9K...",
    "name": "Pembagian Daging Qurban 1446H",
    "status": "PUBLISHED",
    "category": "SOSIAL",
    "startsAt": "2026-06-15T01:00:00.000Z",
    "endsAt": "2026-06-15T09:00:00.000Z",
    "timezone": "Asia/Jakarta",
    "quota": 8000,
    "registeredCount": 6421,
    "verifiedCount": 3102,
    "quotaUsagePercent": 80.26,
    "queueStrategy": "LEAST_LOADED",
    "coverage": { "provinceCode": "31", "cityCode": "3174" },
    "counters": [
      {
        "id": "ctr_01HX...",
        "name": "Loket A",
        "status": "ACTIVE",
        "activeQueueCount": 12,
        "assignedStaff": [
          { "userId": "usr_01HX...", "role": "OPERATOR_LOKET" }
        ]
      }
    ]
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 200 | Berhasil |
| 403 | User bukan anggota tenant |
| 404 | Event tidak ditemukan |

---

### 4.2 Participant Registration & QR Verification

#### POST /api/v1/events/:eventId/registrations

**Deskripsi:** Pendaftaran peserta publik. Membuat record peserta, memvalidasi NIK/HP/wilayah/kuota, dan menerbitkan QR sekali scan (DEC-004). Endpoint ini **public** (tanpa Clerk token) tetapi **rate-limited** 100 req/menit per IP.

**Auth level:** Public

**Request Body:**

```json
{
  "fullName": "Budi Santoso",
  "nik": "3174012345670001",
  "phone": "081234567890",
  "domicile": {
    "provinceCode": "31",
    "cityCode": "3174",
    "districtCode": "3174010",
    "villageCode": "3174010001"
  },
  "customFields": {
    "jumlah_anggota_keluarga": 4
  }
}
```

**Response Body (201):**

```json
{
  "data": {
    "participantId": "prt_01HX...",
    "eventId": "evt_01HX9K...",
    "queueNumber": "A-06422",
    "status": "WAITING",
    "accessToken": "eyJhbGciOi...",
    "qr": {
      "payload": "AA:evt_01HX9K...:prt_01HX...:9f2c...",
      "imageUrl": "https://cdn.antriaja.id/qr/prt_01HX....png",
      "expiresAt": "2026-06-15T09:00:00.000Z"
    }
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 201 | Pendaftaran berhasil, QR diterbitkan |
| 400 | `ERR-REG-001` NIK bukan 16 digit atau `ERR-REG-002` format HP tidak valid |
| 409 | `ERR-REG-003` NIK sudah terdaftar pada event |
| 410 | `ERR-REG-004` kuota event habis |
| 422 | Peserta di luar wilayah cakupan (FR-02) |
| 429 | Rate limit terlampaui |

---

#### POST /api/v1/events/:eventId/verify

**Deskripsi:** Verifikasi QR sekali scan oleh Verifikator atau Operator Loket (DEC-004). Endpoint bersifat idempotent: scan kedua pada QR yang sama mengembalikan `409` dengan `ERR-QR-002` dan tidak mengubah status.

**Auth level:** Verifikator, Operator Loket, Supervisor, Admin Event, Owner

**Request Body:**

```json
{
  "qrPayload": "AA:evt_01HX9K...:prt_01HX...:9f2c...",
  "counterId": "ctr_01HX...",
  "scannedAt": "2026-06-15T01:22:11.000Z",
  "deviceId": "dev_a1b2c3"
}
```

**Response Body (200):**

```json
{
  "data": {
    "result": "VERIFIED",
    "participant": {
      "participantId": "prt_01HX...",
      "maskedNik": "••••••••••••0001",
      "fullName": "Budi Santoso",
      "queueNumber": "A-06422",
      "previousStatus": "WAITING",
      "newStatus": "VERIFIED"
    },
    "counter": { "id": "ctr_01HX...", "name": "Loket A" },
    "verifiedBy": { "userId": "usr_01HX...", "role": "VERIFIKATOR" },
    "verifiedAt": "2026-06-15T01:22:11.412Z"
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 200 | QR valid, peserta diverifikasi |
| 403 | `ERR-QR-005` petugas tidak memiliki izin scan |
| 404 | `ERR-QR-004` QR tidak ditemukan atau milik event lain |
| 409 | `ERR-QR-002` QR sudah digunakan |
| 410 | `ERR-QR-001` QR kedaluwarsa (event selesai) |
| 422 | `ERR-QR-003` signature QR tidak valid |

---

### 4.3 Counter & Staff Assignment

#### POST /api/v1/events/:eventId/counters

**Deskripsi:** Membuat loket baru dan menugaskan petugas (DEC-007). Satu petugas dapat ditugaskan ke beberapa loket. Loket tanpa petugas aktif otomatis berstatus `INACTIVE`.

**Auth level:** Owner, Admin Event, Supervisor

**Request Body:**

```json
{
  "name": "Loket C",
  "serviceType": "DAGING",
  "maxParallel": 2,
  "assignedStaff": [
    { "userId": "usr_01HXa...", "role": "OPERATOR_LOKET" },
    { "userId": "usr_01HXb...", "role": "VERIFIKATOR" }
  ]
}
```

**Response Body (201):**

```json
{
  "data": {
    "id": "ctr_01HXc...",
    "eventId": "evt_01HX9K...",
    "name": "Loket C",
    "status": "ACTIVE",
    "maxParallel": 2,
    "assignedStaff": [
      { "userId": "usr_01HXa...", "role": "OPERATOR_LOKET", "assignedAt": "2026-05-02T03:11:00.000Z" }
    ],
    "createdAt": "2026-05-02T03:11:00.000Z"
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 201 | Loket dibuat |
| 403 | Peran tidak memenuhi |
| 409 | Nama loket duplikat dalam event |
| 422 | `maxParallel` < 1 atau `assignedStaff` kosong |

---

#### PATCH /api/v1/events/:eventId/counters/:counterId

**Deskripsi:** Memperbarui konfigurasi loket, termasuk menonaktifkan loket. Jika loket dinonaktifkan saat memiliki antrian aktif, sistem **MUST** mengembalikan `409` kecuali request menyertakan `reassignToCounterId` untuk mengalihkan antrian (FR-04).

**Auth level:** Owner, Admin Event, Supervisor

**Request Body:**

```json
{
  "status": "INACTIVE",
  "reassignToCounterId": "ctr_01HXd...",
  "reason": "Petugas shift selesai"
}
```

**Response Body (200):**

```json
{
  "data": {
    "id": "ctr_01HXc...",
    "status": "INACTIVE",
    "reassignedQueueCount": 12,
    "reassignedTo": "ctr_01HXd...",
    "updatedAt": "2026-06-15T03:40:12.000Z"
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 200 | Loket diperbarui |
| 403 | Peran tidak memenuhi |
| 404 | Loket tidak ditemukan |
| 409 | Loket memiliki antrian aktif tanpa `reassignToCounterId` |

---

### 4.4 Queue Engine

#### GET /api/v1/events/:eventId/queue

**Deskripsi:** Mengambil snapshot antrian real-time per loket atau agregat event. Mendukung filter status dan loket. Endpoint ini adalah sumber data untuk papan antrian publik (FR-08) dan dashboard operator.

**Auth level:** Public (dengan `Display Access Token` untuk event private), atau Clerk token untuk petugas

**Query Parameters:**

| Parameter | Tipe | Default | Deskripsi |
|:---|:---|:---|:---|
| `counterId` | string | - | Filter per loket |
| `status` | enum | `CALLED,SERVING` | Filter status peserta |
| `limit` | int | 10 | Maksimum item per loket |
| `cursor` | string | - | Cursor paginasi untuk dataset besar |

**Response Body (200):**

```json
{
  "data": {
    "eventId": "evt_01HX9K...",
    "counters": [
      {
        "counterId": "ctr_01HXa...",
        "counterName": "Loket A",
        "status": "ACTIVE",
        "nowServing": {
          "queueNumber": "A-06421",
          "participantMaskedName": "Budi S.",
          "servingSince": "2026-06-15T02:01:00.000Z"
        },
        "upNext": [
          { "queueNumber": "A-06422", "participantMaskedName": "Siti R." },
          { "queueNumber": "A-06423", "participantMaskedName": "Ahmad F." }
        ],
        "activeCount": 12,
        "waitingPoolCount": 0
      }
    ],
    "aggregate": {
      "totalWaiting": 3102,
      "totalCalled": 8,
      "totalServing": 4,
      "totalDone": 1204,
      "totalNoShow": 32,
      "waitingPool": 0
    }
  },
  "meta": {
    "generatedAt": "2026-06-15T02:01:12.000Z",
    "nextCursor": null
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 200 | Berhasil |
| 401 | Event private tanpa `Display Access Token` |
| 404 | Event tidak ditemukan |

---

#### POST /api/v1/events/:eventId/queue/:participantId/call

**Deskripsi:** Memanggil peserta berikutnya ke loket. Operator Loket hanya dapat memanggil ke loket yang ditugaskan. Setelah sukses, backend mempublikasikan event `queue:called` melalui Socket.IO + Redis Pub/Sub dan memicu notifikasi (FR-09).

**Auth level:** Operator Loket, Supervisor, Admin Event, Owner

**Request Body:**

```json
{
  "counterId": "ctr_01HXa...",
  "overrideParticipantId": "prt_01HXz...",
  "note": "Panggilan ke-1"
}
```

**Response Body (200):**

```json
{
  "data": {
    "participantId": "prt_01HXz...",
    "queueNumber": "A-06422",
    "counterId": "ctr_01HXa...",
    "counterName": "Loket A",
    "previousStatus": "WAITING",
    "newStatus": "CALLED",
    "callAttempt": 1,
    "calledAt": "2026-06-15T02:02:30.000Z",
    "noShowThreshold": 3
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 200 | Peserta dipanggil |
| 403 | Operator Loket memanggil ke loket di luar penugasan |
| 404 | Peserta tidak ditemukan |
| 409 | Peserta berstatus `NO_SHOW` atau `CANCELLED` |

---

#### PATCH /api/v1/events/:eventId/queue/:participantId/status

**Deskripsi:** Mengubah status peserta (`SERVING`, `DONE`, `NO_SHOW`, `CANCELLED`). Perubahan status mempublikasikan event real-time ke semua klien (FR-07). Reset status dari `NO_SHOW` ke `WAITING` hanya dapat dilakukan oleh Supervisor.

**Auth level:** Operator Loket (untuk loketnya), Verifikator (terbatas), Supervisor, Admin Event, Owner

**Request Body:**

```json
{
  "newStatus": "DONE",
  "counterId": "ctr_01HXa...",
  "reason": null
}
```

**Response Body (200):**

```json
{
  "data": {
    "participantId": "prt_01HXz...",
    "previousStatus": "SERVING",
    "newStatus": "DONE",
    "servingDurationMs": 84210,
    "doneAt": "2026-06-15T02:03:54.000Z",
    "nextAutoCalled": {
      "participantId": "prt_01HY0...",
      "queueNumber": "A-06423"
    }
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 200 | Status diperbarui |
| 403 | Peran tidak memenuhi atau loket di luar penugasan |
| 404 | Peserta tidak ditemukan |
| 409 | Transisi status tidak valid (mis. `CANCELLED` → `SERVING`) |

---

### 4.5 Dashboard & Analytics

#### GET /api/v1/events/:eventId/analytics

**Deskripsi:** Mengambil metrik agregat untuk dashboard (FR-10). Query agregasi **MUST** selesai < 2 detik untuk 50.000 peserta (DEC-006) melalui materialized view atau cache Redis.

**Auth level:** Owner, Admin Event, Supervisor, Super Admin Platform

**Query Parameters:**

| Parameter | Tipe | Default | Deskripsi |
|:---|:---|:---|:---|
| `from` | ISO8601 | - | Awal rentang waktu |
| `to` | ISO8601 | - | Akhir rentang waktu |
| `counterId` | string | - | Filter per loket |
| `groupBy` | enum | `hour` | `hour` \| `counter` \| `status` |

**Response Body (200):**

```json
{
  "data": {
    "eventId": "evt_01HX9K...",
    "totals": {
      "registered": 6421,
      "verified": 3102,
      "waiting": 1204,
      "serving": 4,
      "done": 1856,
      "noShow": 38
    },
    "averageWaitMs": 421000,
    "throughputPerHour": [
      { "hour": "2026-06-15T01:00:00.000Z", "done": 210 },
      { "hour": "2026-06-15T02:00:00.000Z", "done": 340 }
    ],
    "counterLoad": [
      { "counterId": "ctr_01HXa...", "name": "Loket A", "activeCount": 12, "doneCount": 412 },
      { "counterId": "ctr_01HXb...", "name": "Loket B", "activeCount": 8, "doneCount": 380 }
    ],
    "generatedAt": "2026-06-15T02:05:00.000Z"
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 200 | Berhasil |
| 403 | Peran tidak memenuhi |
| 404 | Event tidak ditemukan |

---

#### GET /api/v1/events/:eventId/participants

**Deskripsi:** Pencarian dan filter peserta (FR-19). NIK dimask untuk peran non-Owner (6 digit terakhir). Mendukung paginasi cursor untuk dataset besar.

**Auth level:** Owner, Admin Event, Supervisor, Verifikator, Operator Loket

**Query Parameters:**

| Parameter | Tipe | Default | Deskripsi |
|:---|:---|:---|:---|
| `q` | string | - | Pencarian nama / NIK / nomor HP |
| `status` | enum | - | `WAITING` \| `VERIFIED` \| `CALLED` \| `SERVING` \| `DONE` \| `NO_SHOW` \| `CANCELLED` |
| `counterId` | string | - | Filter per loket |
| `villageCode` | string | - | Filter wilayah |
| `page` | int | 1 | Nomor halaman |
| `pageSize` | int | 100 | Maksimum 500 |
| `cursor` | string | - | Cursor paginasi |

**Response Body (200):**

```json
{
  "data": [
    {
      "participantId": "prt_01HXz...",
      "fullName": "Budi Santoso",
      "maskedNik": "••••••••••••0001",
      "maskedPhone": "0812••••7890",
      "queueNumber": "A-06422",
      "status": "DONE",
      "counterId": "ctr_01HXa...",
      "registeredAt": "2026-06-14T10:00:00.000Z",
      "verifiedAt": "2026-06-15T01:22:11.000Z",
      "doneAt": "2026-06-15T02:03:54.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 100,
    "total": 6421,
    "hasNext": true,
    "nextCursor": "cDoxMDAwMA=="
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 200 | Berhasil |
| 403 | Peran tidak memenuhi |
| 404 | Event tidak ditemukan |

---

### 4.6 Billing & Tier Management

#### POST /api/v1/tenants/:tenantId/subscription/upgrade

**Deskripsi:** Mengajukan upgrade paket tenant (DEC-001, DEC-002). Sistem membuat invoice dan mengembalikan URL pembayaran. Payment gateway TBD (Midtrans/Xendit/Stripe). Tier aktif baru berlaku setelah invoice `PAID`.

**Auth level:** Owner, Super Admin Platform

**Request Body:**

```json
{
  "targetTier": "LARGE",
  "addOns": [
    { "code": "EXTRA_COUNTERS", "quantity": 5 },
    { "code": "WHATSAPP_NOTIFICATION", "quantity": 1 }
  ],
  "billingCycle": "MONTHLY"
}
```

**Response Body (201):**

```json
{
  "data": {
    "invoiceId": "inv_01HX...",
    "status": "PENDING",
    "amount": 0,
    "currency": "IDR",
    "paymentUrl": "https://gateway.tbd/checkout/inv_01HX...",
    "expiresAt": "2026-05-03T08:00:00.000Z",
    "targetTier": "LARGE",
    "effectiveAt": null,
    "pricingNote": "TBD"
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 201 | Invoice dibuat, status `PENDING` |
| 402 | `ERR-BILL-002` pembayaran sebelumnya gagal |
| 403 | Peran tidak memenuhi |
| 422 | Kombinasi tier/add-on tidak valid |

---

### 4.7 Bulk Participant Import

#### POST /api/v1/events/:eventId/participants/import

**Deskripsi:** Mengimpor peserta massal dari CSV/Excel (FR-16). Validasi per baris, pembuatan QR untuk baris valid, laporan baris gagal. Batas 10.000 baris dan 5MB per import (TBD).

**Auth level:** Owner, Admin Event

**Request Body:** `multipart/form-data`

| Field | Tipe | Wajib | Deskripsi |
|:---|:---|:---|:---|
| `file` | file | Ya | CSV/XLSX, maksimum 5MB |
| `duplicateStrategy` | enum | Tidak | `REJECT` (default) \| `SKIP` |
| `dryRun` | boolean | Tidak | Jika `true`, hanya validasi tanpa menyimpan |

**Response Body (202):**

```json
{
  "data": {
    "importJobId": "imp_01HX...",
    "status": "PROCESSING",
    "totalRows": 9500,
    "estimatedDurationMs": 45000
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 202 | Import job diterima, diproses asinkron |
| 400 | `ERR-IMP-001` duplikat NIK dalam file (mode `REJECT`) |
| 403 | Peran tidak memenuhi |
| 413 | `ERR-IMP-002` file melebihi 5MB |
| 422 | `ERR-IMP-003` baris valid melebihi kuota event |

---

#### GET /api/v1/imports/:importJobId

**Deskripsi:** Mengambil status dan hasil import job, termasuk daftar baris gagal dengan alasan.

**Auth level:** Owner, Admin Event

**Response Body (200):**

```json
{
  "data": {
    "importJobId": "imp_01HX...",
    "status": "COMPLETED",
    "totalRows": 9500,
    "successCount": 9420,
    "failedCount": 80,
    "failedRows": [
      { "row": 12, "errorCode": "ERR-REG-001", "message": "NIK bukan 16 digit" },
      { "row": 45, "errorCode": "ERR-REG-003", "message": "NIK duplikat dalam file" }
    ],
    "startedAt": "2026-05-10T02:00:00.000Z",
    "completedAt": "2026-05-10T02:00:47.000Z"
  }
}
```

**Status Codes:**

| Code | Kondisi |
|:---|:---|
| 200 | Berhasil |
| 403 | Peran tidak memenuhi |
| 404 | Import job tidak ditemukan |

---

## 5. Ringkasan Kode Status & Error

| HTTP | Kode Error | Konteks |
|:---|:---|:---|
| 400 | ERR-EV-001, ERR-EV-002, ERR-REG-001, ERR-REG-002, ERR-IMP-001 | Validasi input |
| 402 | ERR-BILL-001, ERR-BILL-002 | Billing |
| 403 | ERR-QR-005 | Otorisasi gagal |
| 404 | ERR-QR-004 | Resource tidak ditemukan |
| 409 | ERR-REG-003, ERR-QR-002 | Konflik duplikat |
| 410 | ERR-REG-004, ERR-QR-001 | Resource kedaluwarsa/habis |
| 413 | ERR-IMP-002 | Payload terlalu besar |
| 422 | ERR-QR-003, ERR-IMP-003 | Entitas tidak diproses |
| 429 | - | Rate limit terlampaui |

---

## 6. Catatan Integrasi

- **WebSocket Handshake:** Klien memperoleh `socketToken` melalui `GET /api/v1/events/:eventId/socket-token` (Auth level sesuai peran). Token digunakan untuk koneksi Socket.IO. Detail event real-time dirujuk ke `ARCHITECTURE.md`.
- **Notifikasi:** Endpoint notifikasi (WhatsApp/Email/SMS) dikelola internal; provider TBD. Status pengiriman dapat diakses melalui `GET /api/v1/events/:eventId/notifications` (TBD untuk v1).
- **Ekspor CSV:** Endpoint `GET /api/v1/events/:eventId/analytics/export` dan `GET /api/v1/events/:eventId/participants/export` mengembalikan `Content-Type: text/csv` dengan streaming; detail format file dirujuk ke `FEATURES.md`.
- **Idempotency-Key:** Endpoint mutasi yang dipanggil berulang dari klien mobile **SHOULD** menyertakan header `Idempotency-Key: <uuid>` untuk mencegah duplikasi operasi (khususnya `POST /verify` dan `POST /call`).