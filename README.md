# AntriAja

Queue management for physical events: register, scan a one-time QR at the gate, get a number at the least-loaded counter, get called.

v1 targets one small event (about 200–2,000 people, 2–5 counters) on a single VPS.

## Read in this order

1. [`PRD.md`](PRD.md): what v1 is and is not
2. [`GLOSSARY.md`](GLOSSARY.md): the vocabulary
3. [`ARCHITECTURE.md`](ARCHITECTURE.md): stack, data model, endpoints
4. [`docs/adr/`](docs/adr/): why decisions were made
5. [`docs/vision/`](docs/vision/): archived long-term vision (not the v1 contract)

Work is tracked as GitHub Issues. See [`docs/agents/`](docs/agents/) for how agent skills use the tracker, labels and domain docs.

## Quick start

Needs Docker with Compose, and Node 24 with corepack (`corepack enable`) for local tooling.

```bash
cp .env.example .env          # then set POSTGRES_PASSWORD (openssl rand -hex 24)
docker compose up -d --build --wait
curl localhost:3000/api/health   # {"status":"ok","db":"up"}
```

The app is bound to `127.0.0.1:3000` locally. The database has no published port: it is reachable only from the Compose private network. On the VPS, add the production overlay so the app joins the `web` network used by `cloudflared`:

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d --build
```

## Tests

Tests run against a real Postgres, in a container on the private network, using a separate `<POSTGRES_DB>_test` database (the setup refuses any database whose name does not end in `_test`):

```bash
pnpm test:docker
```

CI runs the same suite against a Postgres service container, plus lint, typecheck, a secret scan and a Compose smoke test.

## Secrets

- All secrets come from environment variables. `.env*` is git-ignored; only `.env.example` (placeholders) is tracked.
- A pre-commit hook (husky) scans the staged files with gitleaks. It uses a local `gitleaks` binary if present, otherwise the pinned Docker image, and blocks the commit if neither is available.
- This repo is public: never put real emails, keys, IPs or IDs in code, docs or tests.

## Status

Walking skeleton: Next.js 16, Prisma 7 and Postgres 16 under Docker Compose, a health endpoint that checks the database, and the v1 data model with its first migration. No product features yet.
