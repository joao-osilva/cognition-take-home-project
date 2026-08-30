# Internal Tools Platform

A prototype internal-tools platform replacing Microsoft Power Apps for a fintech: a launcher of self-contained apps (KYC review queue, refunds dashboard, feature-flag admin) on a shared kernel providing RBAC, audit, approvals, config, and notifications.

Design docs live in [`docs/`](docs/README.md). House rules for changes live in [`AGENTS.md`](AGENTS.md).

## Stack

TypeScript · pnpm + Turborepo · Next.js (single host app) · Drizzle + Neon Postgres · Clerk (auth/roles) · Inngest (jobs) · Vercel (hosting) · Tailwind

## Getting started

### 1. Get Clerk keys (required)

1. Create a free account at [dashboard.clerk.com](https://dashboard.clerk.com) and create an application (any name, email sign-in is enough).
2. Open **Configure → API keys**, pick **Next.js**, and copy the two keys (`pk_test_...` and `sk_test_...`) — you'll paste them into your env file next.

Development keys work on localhost as-is; no domain or webhook setup needed.

### 2. Run with Docker (recommended)

Requires Docker with Compose:

```bash
cp .env.example .env      # paste the Clerk keys; everything else can stay empty
docker compose up --build # Postgres + migrations + web app + Inngest dev server
docker compose exec web pnpm db:seed  # demo dataset (first run, separate terminal)
```

- App: http://localhost:3000 · Inngest dev UI: http://localhost:8288
- Sign up at `/sign-in` — the first user gets the `admin` role (demo convenience), then manage roles at `/admin`
- Reset all data: `docker compose down -v`

### 2 (alt). Run without Docker

Requires Node 20+, pnpm 9, and a Postgres database (local or Neon):

```bash
pnpm install
cp .env.example apps/web/.env.local  # set DATABASE_URL + Clerk keys
pnpm db:migrate           # apply migrations
pnpm db:seed              # demo dataset
pnpm dev                  # http://localhost:3000
```

For background jobs, also run `npx inngest-cli dev` with `INNGEST_DEV=1` set.

### Optional extras

- `BLOB_READ_WRITE_TOKEN` (Vercel Blob) — enables KYC document upload/viewing; everything else works without it.
- Demo sign-ins: the seeded users (`alex+clerk_test@fintech.dev`, `kim+clerk_test@`, `kate+clerk_test@`, `remy+clerk_test@`, `rosa+clerk_test@`, `finn+clerk_test@`, `faye+clerk_test@`) are Clerk test users — the verification code is always `424242`.

## Layout

```
apps/web/                 # host: thin routes, shared shell, launcher
packages/
  core/                   # kernel: RBAC/SoD, audit writer, approval engine,
                          #   config reader, notifications, defineAction()
  db/                     # Neon client, core/platform schema, migrations, seed
  ui/                     # shared component kit
  config/                 # shared tsconfig presets
  apps/kyc|refunds|flags/ # self-contained app packages: schema slice,
                          #   screens, domain logic, meta (nav/roles)
tooling/generators/app/   # pnpm gen:app <id>
```

## What's inside

- **Auth & roles** — Clerk sign-in; roles live in Clerk `publicMetadata.roles` and are managed in-app at `/admin` (also platform config: thresholds, SLAs).
- **Apps** — KYC review queue (`/kyc`), refunds with maker-checker approvals (`/refunds`), feature flags with prod-change approval (`/flags`).
- **Notifications** — sidebar unread badge + `/inbox` history, written by domain actions and Inngest functions (SLA reminders, settlement, approval nudges, digests — see [`docs/architecture/components.md`](docs/architecture/components.md)).
- **Audit** — every mutation and sensitive read lands in `/audit` (admin-only, filterable).
- **KYC documents** — private Vercel Blob storage, streamed through an authenticated route that audits each view.
- **Flags API** — external services read flags via `GET /api/flags?environment=prod` with an `x-api-key` header; keys are managed in Admin → API keys.

## Commands

| Command                                      | What                                      |
| -------------------------------------------- | ----------------------------------------- |
| `pnpm dev`                                   | Run the web app                           |
| `pnpm lint` / `typecheck` / `test` / `build` | Checks (Turborepo-cached; also run in CI) |
| `pnpm db:generate`                           | Emit SQL migrations from schema changes   |
| `pnpm db:migrate` / `db:seed`                | Apply migrations / seed demo data         |
| `pnpm gen:app <id>`                          | Scaffold a new app package + host route   |

## Creating a new app

`pnpm gen:app vendor-onboarding` scaffolds the package and route, then follow the printed steps (register in `apps/web/lib/apps.ts`, add roles, add schema). See [`docs/architecture/web-architecture.md`](docs/architecture/web-architecture.md).
