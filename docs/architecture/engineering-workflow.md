# Engineering Workflow

## API convention

- **Server actions for all mutations** (create refund, decide case, toggle flag). Typed end-to-end, zod-validated at the boundary. Each action is declared through a kernel `defineAction()` helper that enforces the pipeline `auth → can() → validate → domain logic → audit` — it cannot be skipped by construction.
- **REST route handlers only where an external consumer exists**:
  - `/api/flags` — the feature-flag read API consumed by other services (token-authenticated)
  - `/api/inngest` — Inngest function mount
  - `/api/webhooks/clerk` — user-mirror sync
- **Reads** via server components calling package-exported query functions. No tRPC — server actions already provide typed RPC.

## ORM: Drizzle

Chosen over Prisma:
- SQL-like typed queries; no codegen step
- Lightweight on serverless (pairs with Neon's HTTP driver; no engine binary/cold-start weight)
- Migrations are plain SQL files committed to git — reviewable by engineers and auditors alike

## CI/CD

### Local hooks (husky + lint-staged)
- **pre-commit**: lint-staged → eslint --fix + prettier on staged files
- **pre-push**: `turbo typecheck` on affected packages
- Fast checks only; test suites belong in CI, not hooks

### CI (GitHub Actions)
- **On PR**: `turbo lint typecheck test build` — Turborepo caching ensures only affected packages rerun
- **On merge to main**: same checks + production migration + deploy promotion

### CD (Vercel git integration)
- Every PR → preview deployment
- Merge to main → production deployment
- No custom deploy pipeline

## DB migrations (Drizzle + Neon + Vercel)

1. Schema lives in TypeScript: each app package owns its slice; `packages/db` owns core/platform tables and aggregates all slices.
2. `pnpm db:generate` → drizzle-kit diffs schema vs. existing migrations → emits plain SQL migration files, committed with the PR.
3. **Preview flow**: PR opened → GitHub Action creates a **Neon branch** (copy-on-write) → runs `drizzle-kit migrate` against it → the Vercel preview env points at that branch. Migration + code are reviewed and tested together, fully isolated. Branch is deleted when the PR closes.
4. **Prod flow**: merge to main → Action runs `drizzle-kit migrate` against the main Neon database **before** the Vercel production promotion. Migrations must be backward-compatible with the still-running previous version (expand/contract discipline).

## Defaults

- Package scope: `@repo/*`
- Tests: unit tests required for the kernel (RBAC/SoD, approval engine, audit writer); app-level e2e added later
- Seed: `pnpm db:seed` builds a demo dataset (customers, transactions, cases, flags)
