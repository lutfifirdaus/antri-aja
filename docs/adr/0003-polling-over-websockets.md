# 0003. Polling instead of WebSockets

Status: accepted (2026-11-22)

## Context

The vision specs used Socket.IO with Redis Pub/Sub for real-time status. At v1 scale (up to ~2,000 participants) that is more infrastructure than needed.

## Decision

Clients poll every ~5 seconds: the participant ticket page, the public board and the staff queue views. Endpoints return small JSON and are never cached (Cloudflare bypass included).

Rough load: 2,000 participants polling every 5 s is about 400 requests per second at the extreme worst case, which one Next.js process and Postgres handle comfortably for small JSON reads. In practice most people are not on the page at once.

## Consequences

- Updates can lag by up to ~5 seconds. Acceptable for a queue.
- The API shape stays the same, so server-sent events or WebSockets can replace polling later without changing the screens.
- If polling load becomes a problem, first lengthen the interval for participants, then consider SSE.
