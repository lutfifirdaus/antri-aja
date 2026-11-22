# Architecture: AntriAja v1

Decisions behind this are in `docs/adr/`. Terms are in `GLOSSARY.md`.

```
phones / laptops ──HTTPS──> Cloudflare ──tunnel──> cloudflared ──> app (Next.js :3000) ──> db (Postgres)
                  antri.lutdaus.my.id            (existing container,        └── private network
                                                  network "web")
```

One Compose project `antriaja` with two services. `app` joins the existing Docker network `web` plus a private network shared with `db`. `db` is never exposed.

## Stations and auth

| Who | How | Can do |
|---|---|---|
| Admin | Google sign-in, email on allowlist (`ADMIN_EMAILS`) | Everything |
| Gate staff | Gate PIN link → signed cookie | Scan check-in, manual add, search participant |
| Counter staff | Counter PIN link → signed cookie bound to one counter | Call next, serve, skip, re-queue at that counter |
| Participant | Token in URL, no login | See own QR and status |

Decided: the gate has one PIN per event, and each counter has its own. Staff open the station link and type the PIN; the link alone grants nothing.

## Data model

```
events       id, slug (unique), name, max_participants (null = no cap),
             registration_open, gate_pin_hash, created_at
counters     id, event_id, code (unique per event: A, B, ...), name,
             status (open|paused|closed), pin_hash, next_number
participants id, event_id, name, phone (null), token (unique), source (self|manual), created_at
tickets      id, event_id, participant_id (UNIQUE), counter_id, number, queue_order,
             status (waiting|called|served|skipped), requeue_count, previous_number (null),
             checked_in_at, called_at, served_at
             UNIQUE (counter_id, number)
```

- **Exactly-once check-in** comes from `UNIQUE(participant_id)` on tickets. A second insert fails and returns `409`.
- **Number** is `counter.code + next_number`. It never changes at the same counter (including a re-queue). An admin move to another counter issues a new number from the destination counter's sequence and keeps the old one as `previous_number` (shown as "was A12").
- **Order** in the line is `queue_order`. A re-queue sets `queue_order` to the end and `requeue_count = 1`.
- Check-in runs in one transaction under a per-event advisory lock: pick the open counter with the fewest `waiting` tickets (ties: lowest code), increment `next_number`, insert the ticket.

## Endpoints

Public:
- `POST /api/events/:slug/register` → participant + token (refused if closed or full)
- `GET /api/t/:token` → QR payload, ticket (number, counter, ahead count)
- `GET /api/events/:slug/board` → per counter: now serving, waiting count

Staff (PIN cookie):
- `POST /api/staff/enter` (PIN → cookie)
- `POST /api/staff/scan` `{token}` (gate: check-in; 409 if used)
- `POST /api/staff/manual` `{name, phone?}` (gate or admin: register and check in)
- `POST /api/staff/call-next` (counter)
- `POST /api/staff/tickets/:id/serve`, `/skip`, `/requeue` (counter)
- `GET /api/staff/queue` (counter: waiting list)

Admin (Google session):
- `POST|PATCH /api/admin/events`, `POST|PATCH /api/admin/counters`, `POST /api/admin/counters/:id/pin`
- `POST /api/admin/tickets/:id/move` `{counterId}`
- `DELETE /api/admin/events/:id/participants` (purge)

## Realtime

Polling every ~5 s (ADR 0003). No caching on these routes (Cloudflare bypass rule for `/api/*`, `/t/*` and the board).

## Deploy and operations

- Deploy: a script run over SSH does `git pull`, `docker compose up -d --build`, then a health check.
- Backups: nightly `pg_dump` (last 7), copied off the VPS.
- Secrets live in an `.env` on the VPS, never in the repo.
- Cloudflare: public hostname `antri.lutdaus.my.id` on the existing tunnel plus a proxied CNAME, applied only after review.

## Risks

- Single VPS: a printed participant list is the fallback.
- Poor signal at the venue: manual search-and-check-in fallback, signal test beforehand.
- Phone numbers in a public-facing app: keep minimal, purge button, 30-day deletion.
