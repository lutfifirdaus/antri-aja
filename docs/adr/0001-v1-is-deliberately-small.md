# 0001. v1 is deliberately smaller than the original PRD

Status: accepted (2026-11-22)

## Context

The original specs (now in `docs/vision/`) describe a multi-tenant SaaS: tiers, payments, WhatsApp/SMS/email, bulk import, offline PWA, three staff roles, 5k–50k participants, Redis and Socket.IO. No code existed and no real event was planned. The core value is much smaller: register, one-scan check-in, assign to a counter, call, serve.

## Decision

v1 serves **one small event inside the owner's own organization** (about 200–2,000 people, 2–5 counters), on one VPS and one Postgres.

Out of v1: multi-tenancy, freemium tiers and quotas, payments and invoices, WhatsApp/SMS/email notifications, bulk import, offline staff PWA, supervisor role, regional coverage rules, analytics dashboards, Redis, WebSockets.

Kept: one-scan QR check-in (DEC-004) and automatic distribution across counters (DEC-005), in simplified form.

Done means: a dry run with ~20 fake participants, 2 staff phones on 2 counters and a projector board, with no database access needed.

## Consequences

- DEC-001, 002, 003, 006 and 007 in `docs/vision/DECISIONS.md` are superseded for v1. They are deferred, not deleted.
- The vision docs stay as a reference for later phases.
- Anything not listed above needs a new ADR or issue before it enters v1.
