# Glossary

Terms used in AntriAja v1. Use these exact words in code, issues and docs.

| Term | Meaning |
|---|---|
| **Event** | One queue-managed occasion (e.g. a qurban distribution). Has a name, a slug, an optional max-participants cap and a registration open/closed switch. |
| **Participant** | A person registered for an event: name, optional phone, and a unique opaque **token**. |
| **Token** | Random, unguessable string identifying a participant. Encoded in the QR and in the `/t/<token>` page URL. |
| **QR** | The QR code of a participant's token. Valid for **one** check-in. |
| **Check-in** | The single scan at the gate. Creates the participant's ticket and assigns a counter. A second scan is rejected (`already checked in`). |
| **Ticket** | A participant's place in a counter's queue: counter, number, status. One ticket per participant. |
| **Number** | The ticket label shown to people, counter code plus sequence (`A12`). Never changes while the ticket stays at its counter, including a re-queue. If an admin moves the ticket to another counter, it gets a new number from that counter's sequence and the old one is shown as "was A12". |
| **Counter** | A service point (`A`, `B`, ...) with its own queue. Status: `open`, `paused`, `closed`. |
| **Gate** | The entrance station where check-in scans happen. |
| **Station** | A place staff work: the **Gate** or one **Counter**. Staff enter a station with its **PIN**. |
| **PIN** | Short numeric code that unlocks a station. Shared by the admin separately from the station link. One PIN for the Gate per event, one per Counter. |
| **Staff** | A person working a gate or a counter, authenticated by a station PIN link. No account. |
| **Admin** | A person who manages events and counters, authenticated by Google sign-in on an email allowlist. |
| **Call** | Counter staff call the next waiting ticket in their counter. Status `called`. |
| **Serve** | Counter staff mark a called ticket as done. Status `served`. |
| **Skip** | Counter staff mark a called ticket as no-show. Status `skipped`. |
| **Re-queue** | Put a skipped ticket back at the end of the same counter's line, **once**. Number stays the same. |
| **Board** | The public page showing what each counter is serving now. |

Ticket statuses: `waiting` → `called` → `served` or `skipped`; `skipped` → `waiting` (one re-queue only).
