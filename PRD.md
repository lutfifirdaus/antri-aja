# PRD: AntriAja v1

AntriAja manages a mass queue at a physical event. v1 serves **one small event inside the owner's own organization** (about 200–2,000 people, 2–5 counters). The long-term vision is archived in `docs/vision/`. See `docs/adr/0001-v1-is-deliberately-small.md` for what was cut and why.

## Problem

Distribution events (qurban, bansos, similar) get crowded and chaotic. Manual checking allows duplicates, counters are unevenly loaded, and nobody knows who has been served.

## Users

- **Admin**: sets up the event and counters, watches progress, fixes problems.
- **Gate staff**: scans QR codes at the entrance, adds walk-ins.
- **Counter staff**: call the next person, mark served or skipped.
- **Participant**: registers, shows a QR, sees their number and wait.

## v1 scope

1. Admin signs in with Google (email allowlist), creates an event (name, optional max participants, registration open/closed) and counters.
2. Participants register on a public link with a name and an optional phone number. Gate staff or the admin can also add a person manually.
3. Each participant gets a QR and a page `/t/<token>`.
4. Gate staff scan the QR once. The participant is checked in, gets a number (`A12`) at the open counter with the fewest waiting people. A second scan is rejected.
5. Counter staff call the next ticket, then serve it or skip it. A skipped ticket can be re-queued once, at the end of the same counter's line. The admin can move a ticket to another counter.
6. Participants see number, counter and people ahead, refreshing about every 5 seconds. A public board shows what each counter is serving.
7. The admin can delete all participant data for an event. Data is deleted 30 days after the event.

## Not in v1

Multi-tenancy, tiers and quotas, payments, WhatsApp/SMS/email, bulk import, offline staff app, supervisor role, regional rules, analytics dashboards, real-time sockets.

## Quality bar

- Check-in is exactly-once: two simultaneous scans of one QR create one ticket.
- Ticket numbers are unique per counter and never change.
- Works on phones over HTTPS (camera needs it). UI text is Indonesian.
- Minimal personal data: name and optional phone only.
- If signal fails, staff search a participant by name or number and check in manually.

## Definition of done

A dry run with about 20 fake participants, 2 staff phones on 2 counters and a projector showing the board, completed without anyone touching the database. Then one real small event in the owner's organization.
