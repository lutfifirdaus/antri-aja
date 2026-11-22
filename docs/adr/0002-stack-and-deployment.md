# 0002. Stack and deployment

Status: accepted (2026-11-22)

## Context

One VPS (Ubuntu 24.04, 4 vCPU, 8 GB RAM, ~80 GB free) that already runs other containers and a Cloudflare Tunnel. Ports 80/443 are not open to the internet. The domain `lutdaus.my.id` is on Cloudflare. Browsers only allow camera access (QR scanning) on HTTPS.

## Decision

- **App:** a single Next.js (App Router, TypeScript) application. Route handlers are the API. No separate backend.
- **Database:** Postgres 16 with Prisma. No Redis.
- **Auth:** Google OAuth for admins with an email allowlist (Auth.js or Better Auth). Staff use per-station PIN links and need no account.
- **HTTPS:** the existing Cloudflare Tunnel. Public hostname `antri.lutdaus.my.id` points to the app container on the shared Docker network `web`. No Caddy, no open ports.
- **Deploy:** manual Docker Compose project `antriaja` (services `app`, `db`) and a small deploy script run over SSH. No Dokploy or Coolify. Revisit if the VPS hosts three or more apps.
- **Backups:** nightly `pg_dump`, last 7 kept, copied off the VPS.

## Consequences

- Cloudflare must bypass cache for `/api/*`, `/t/*` and the board page, so polling returns live data.
- `db` sits on a private network and is never exposed. `app` joins `web` so `cloudflared` can reach it.
- A single VPS is a single point of failure. A printed participant list is the event-day fallback.
- Cloudflare config changes (tunnel ingress rule plus proxied CNAME) need review before applying. The account also holds unrelated work zones, which must not be touched.
