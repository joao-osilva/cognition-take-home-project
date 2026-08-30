# Internal Tools Platform

A prototype internal-tools platform replacing Microsoft Power Apps for a fintech: a launcher of self-contained apps (KYC review queue, refunds dashboard, feature-flag admin) on a shared kernel providing RBAC, audit, approvals, config, and notifications.

Design docs live in [`docs/`](docs/README.md). House rules for changes live in [`AGENTS.md`](AGENTS.md).

## Stack

TypeScript · pnpm + Turborepo · Next.js (single host app) · Drizzle + Neon Postgres · Clerk (auth/roles) · Inngest (jobs) · Vercel (hosting) · Tailwind

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

## Getting started

### Docker (recommended)

Requires Docker with Compose. Clerk keys are the only external dependency:

```bash
cp .env.example .env      # set the Clerk keys (see below); DATABASE_URL can stay empty
docker compose up --build # Postgres + migrations + web app + Inngest dev server
docker compose exec web pnpm db:seed  # demo dataset (first run)
```

The app is at http://localhost:3000 and the Inngest dev UI at
http://localhost:8288. Postgres data persists in the `pgdata` volume
(`docker compose down -v` resets it). `BLOB_READ_WRITE_TOKEN` is optional —
without it everything works except KYC document upload/viewing.

### Without Docker

Requires Node 20+, pnpm 9, and a Postgres database (local or Neon):

```bash
pnpm install
cp .env.example apps/web/.env.local  # set DATABASE_URL + Clerk keys
pnpm db:migrate           # apply migrations
pnpm db:seed              # demo dataset
pnpm dev                  # http://localhost:3000
```

Auth is Clerk: sign in at `/sign-in`. Roles live in Clerk `publicMetadata.roles`
(e.g. `["kyc:operator"]`); the `platform.users` mirror table is synced via the
`/api/webhooks/clerk` webhook (and refreshed on read in local dev). Demo users
(`alex+clerk_test@fintech.dev`, `kim+clerk_test@`, `kate+clerk_test@`,
`remy+clerk_test@`, `rosa+clerk_test@`, `finn+clerk_test@`, `faye+clerk_test@`)
map to the seeded dataset via Clerk `external_id`. The `+clerk_test` suffix
marks them as Clerk test users, so the new-device verification code is always
`424242`.

Admins manage everything in-app at `/admin`: assign roles (written back to
Clerk `publicMetadata.roles`) and edit platform config (thresholds, SLAs).
New sign-ups default to `admin` (demo convenience — see
`apps/web/lib/default-roles.ts` to tighten), so no Clerk-dashboard
bootstrapping is needed.

In-app notifications surface in the bell at the bottom of the sidebar (unread
count + mark-all-read) and in the full `/inbox` page, where every user can
track their history with status/type filters, per-item mark-read, and deep
links to the relevant case or dashboard. Notifications are written by domain
actions (e.g. refund decisions) and by Inngest functions served at
`/api/inngest`:

- `kyc-sla-reminder` (hourly cron) — flags KYC cases past their SLA
- `refund-settlement` (on `refund.approved`) — simulates the settlement leg,
  moves the refund to `processed`, and notifies the requester
- `approval-pending-reminder` (hourly cron) — nudges approvers about
  maker-checker requests older than `approvals.reminder_hours` (config)
- `kyc-decision-fanout` (on `kyc.case.decided`) — tells the assignee when
  someone else decides their case
- `kyc-escalation-fanout` (on `kyc.case.escalated`) — alerts all
  `kyc:approver`s that an escalated case awaits a decision
- `daily-ops-digest` (08:00 UTC cron) — one summary per approver/admin of
  overdue KYC cases and pending approvals

Locally, set `INNGEST_DEV=1` and run `npx inngest-cli dev` to execute
functions; on Vercel the Inngest integration provides the keys and registers
the app on deploy.

KYC documents are stored in a private Vercel Blob store (`BLOB_READ_WRITE_TOKEN`,
injected by the Vercel Blob integration). Operators upload from the case detail
page (PDF/PNG/JPEG/WebP, ≤10 MB); files are viewed through the authenticated
`/kyc/documents/[id]` route, which streams from Blob and audits every access
(`kyc.document.viewed`).

Admins get a global audit browser at `/audit` — the full `audit_log` stream
filterable by actor and entity type, with action/entity-ID search and
pagination.

External services can read feature flags via `GET /api/flags?environment=prod`
(also `dev`/`staging`), authenticated with an `x-api-key` header. Admins create
and revoke per-consumer keys in Admin → API keys (the key is shown once at
creation; only a hash is stored). The response maps flag keys to
`{ state, rolloutPercentage? }`.

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
