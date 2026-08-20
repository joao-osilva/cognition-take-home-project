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

```bash
pnpm install
cp .env.example .env      # set DATABASE_URL (Neon)
pnpm db:migrate           # apply migrations
pnpm db:seed              # demo dataset
pnpm dev                  # http://localhost:3000
```

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
