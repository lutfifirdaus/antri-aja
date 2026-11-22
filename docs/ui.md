# UI spec: AntriAja v1

Decisions from the UI grilling session. Terms follow `GLOSSARY.md`. Routes and auth follow `ARCHITECTURE.md`. Scope follows `PRD.md` and ADR 0001: anything not listed here needs a new issue.

## Global

- **Look**: plain, high-contrast, utilitarian. One accent color, very large numbers, no illustrations or gradients. Single light theme, no dark mode. People use phones outdoors in bright light and a projector in a hall.
- **Brand**: name stays **AntriAja**. Wordmark in a heavy weight: "Antri" in the foreground color, "Aja" in the accent. Small rounded badge showing a ticket number (`A12`) as the mark. Accent is a deep green around `#0F6B4B`; it must pass contrast as white text on the accent and as the accent on white. Red and amber are reserved for status (error, paused). Brand appears in the page header and favicon only; the board, gate and counter screens stay brand-free.
- **Styling**: plain CSS with a few design tokens (colors, spacing, type scale). No component library.
- **Language**: Indonesian only. Short, polite, neutral, using "Anda" and imperatives ("Tunjukkan QR ini ke petugas"). No slang. Errors say what happened and what to do next ("Sudah check-in. Nomor A12.").
- **Build rules**: apply the installed antislop skills (`antislop`, `-ui`, `-copywriting`, `-layoutmobile`, `-human`, `-code`).

## Registration `/e/<slug>`

- One form: name (required), phone (optional), a single "Daftar" button.
- On success, go straight to `/t/<token>`. That URL is the participant's only handle (no account), so the page shows a banner: "Simpan halaman ini (screenshot atau bookmark) untuk ditunjukkan di pintu masuk".
- Registration closed: "Pendaftaran ditutup", no form.
- Cap reached: "Kuota penuh", no form. Closed and full are separate messages.

## Participant page `/t/<token>`

Phone-first, one screen, no navigation. The page mirrors the ticket status; it starts no flows.

| State | Shows |
|---|---|
| Before check-in | QR large, the name, "Tunjukkan ke petugas di pintu masuk" |
| Waiting | The number huge, the counter, "N orang di depan Anda", a note that it updates automatically |
| Called | Full-width highlight: "Giliran Anda, menuju Loket A" |
| Served | Done message |
| Skipped | "Hubungi petugas di Loket A" (only counter staff can re-queue) |

- Counter `paused`: banner "Loket A sedang istirahat. Nomor Anda tetap A12."
- Counter `closed` while the ticket is waiting: banner "Loket A ditutup. Hubungi petugas, Anda akan dipindahkan." The admin does the move.
- The number is always visible. A moved ticket shows its new number and "was A12" (see Number in the glossary).
- When called, the screen changes color and the browser tab title becomes "Giliran Anda – A12". No sound, vibration or push notification (out of v1).
- Refreshes about every 5 s (ADR 0003).

## Public board `/board/<slug>`

- Landscape, projector, no interaction, refreshes every 5 s.
- Event name as the page title. One large card per counter: counter code, the **now-serving number** in huge type, "N menunggu".
- A `paused` or `closed` counter is dimmed with its status label.
- Fits one screen with no scrolling at 2–5 counters.

## Staff sign-in

- Staff open the station link (gate or counter). The screen shows the station name ("Pintu masuk" or "Loket A") and a numeric PIN keypad. A correct PIN sets the cookie and opens the station screen. A wrong PIN shows "PIN salah" and allows retry.
- The admin shares the link and the PIN separately; the link alone grants nothing.
- One gate PIN per event. Each counter has its own PIN. The admin can rotate any of them.

## Gate

- Full-screen camera scan. The result is a full-screen banner: green with the number and counter, or red with "Sudah check-in".
- "Cari manual" opens search by name, number or phone, matching as you type. Tapping a result shows that person with one "Check-in" button, ending in the same green or red banner.
- If nothing is found, "Tambah manual" opens a form with the searched name filled in and an optional phone. Submitting registers and checks in the person in one step, and the banner shows the number for staff to read out.

## Counter

- Phone-first, thumb-reachable full-width buttons.
- A called ticket is shown large at the top with "Selesai" and "Lewati".
- With nothing called, the main button is "Panggil berikutnya", with the waiting count and a short list of the next few numbers.
- Counter staff can call, serve, skip and re-queue, and nothing else. Pausing or closing a counter is admin-only in v1.

## Admin `/admin`

- Sign-in: one "Masuk dengan Google" button. An email not on the allowlist sees "Akun ini tidak punya akses" and a sign-out link.
- Desktop-first, usable on a phone. One page per event, no charts or analytics (out of v1):
  - **Event settings**: name, cap, registration open/closed switch, purge action.
  - **Counters**: status switch (`open` / `paused` / `closed`), waiting and served counts, station PIN link, PIN rotation.
  - **Tickets**: searchable list, each row has "Pindahkan". A waiting ticket whose counter is `closed` gets a warning badge so the admin sees what needs moving.

## Failure handling

- Polling failure (participant page, board): keep showing the last data and add a small banner "Terputus. Mencoba lagi…" with the last-updated time. The screen is never blank.
- State-changing staff actions (scan, call, serve, skip, manual add): the button is disabled while the request runs. On failure, show an inline error and a retry button. Never retry automatically, so a flaky connection cannot double-call or double-check-in.

## Out of scope for v1

Dark mode, branding beyond the header and favicon, sound/vibration/push, staff pause toggle, analytics. Revisit after the dry run (issue #12).
