# 0004. Auth.js, argon2id and database-backed PIN lockout

Status: accepted (2026-11-22)

## Context

Issue #3 needs Google sign-in for admins on an email allowlist, station PINs for staff, and a rate limit on PIN entry without Redis. The issue leaves the auth and hashing libraries to the implementer.

## Decision

- **Admin sign-in: Auth.js (next-auth v5), Google provider, JWT session.** No user or session tables. The allowlist (`ADMIN_EMAILS`) is checked at sign-in and again in `requireAdmin` on every admin route, so removing an email revokes access on the next request.
- **PIN hashing: argon2id** via `@node-rs/argon2`. PINs are 6 random digits from a CSPRNG, shown once, stored only as a hash.
- **Lockout: a `pin_attempts` table.** Failed attempts are rows. 5 failures per IP and station, or 30 per station across all IPs, in 15 minutes lock entry; the lock lifts as rows age out. A correct PIN clears that IP's rows at that station. No Redis.
- **Staff cookies:** HMAC-SHA256 signed value with the expiry inside the signed payload, `HttpOnly`, `Secure`, `SameSite=Lax`, expiring at the next midnight in the event timezone (WIB, UTC+7, no daylight saving).

## Consequences

- A 6-digit PIN has only 10^6 values. Safety comes from the lockout, not the PIN: the station-wide cap of 30 per 15 minutes allows about 2,900 guesses a day.
- Locked-out staff wait up to 15 minutes, or the admin rotates the PIN. Locking out a legitimate venue Wi-Fi IP shared by many staff is possible; the per-station cap is separate so one noisy IP does not block others.
- Behind Cloudflare the client IP must come from a trusted header (`CF-Connecting-IP`). Using the wrong header would let an attacker rotate IPs or lock everyone out. Decide this when wiring the staff entry route.
- Auth.js cannot read `pin_attempts` or staff cookies; those are ours. Moving to Better Auth later would only touch the admin session.
