# Engineering Workflow

## API convention

- **Server actions for all mutations** (create refund, decide case, toggle flag). Typed end-to-end, zod-validated at the boundary. Each action is declared through a kernel `defineAction()` helper that enforces the pipeline `auth → can() → validate → domain logic → audit` — it cannot be skipped by construction.
- **REST route handlers only where an external consumer exists**:
  - `/api/flags` — the feature-flag read API consumed by other services (token-authenticated)
  - `/api/inngest` — Inngest function mount
  - `/api/webhooks/clerk` — user-mirror sync
- **Reads** via server components calling package-exported query functions. No tRPC — server actions already provide typed RPC.
- Caveat: server actions are POST-only and coupled to the Next.js app. If a mobile app or external service ever needs to mutate, expose targeted REST endpoints then — cheap, since domain logic already lives in packages.

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

### CD (Vercel git integration + marketplace integrations)
- Every PR → preview deployment; merge to main → production deployment. No custom deploy pipeline.
- **Neon Vercel integration**: auto-provisions connection-string env vars per Vercel environment and auto-creates/deletes a Neon database branch per preview deployment — no custom branch-lifecycle automation needed.
- **Inngest Vercel integration**: auto-wires signing/event keys and registers the app's functions on every deploy.

## DB migrations (Drizzle + Neon + Vercel)

1. Schema lives in TypeScript: each app package owns its slice; `packages/db` owns core/platform tables and aggregates all slices.
2. `pnpm db:generate` → drizzle-kit diffs schema vs. existing migrations → emits plain SQL migration files, committed with the PR.
3. **Preview flow**: PR opened → the Neon integration creates a branch for the preview deployment → `drizzle-kit migrate` runs against it (build step) → the preview env points at that branch. Migration + code are reviewed and tested together, fully isolated. Branch is cleaned up with the preview. Previews branch off a **seeded dev branch**, never prod — no real PII in previews (known-gaps #2) and requesters get a usable demo dataset.
4. **Prod flow**: merge to main → `drizzle-kit migrate` runs against the main Neon database **before** the Vercel production promotion. Migrations must be backward-compatible with the still-running previous version (**expand/contract discipline**: add nullable column → deploy code → backfill → tighten later). This rule goes into `AGENTS.md` so Devin-generated migrations follow it too.

## Defaults

- Package scope: `@repo/*`
- Tests: unit tests required for the kernel (RBAC/SoD, approval engine, audit writer); app-level e2e added later
- Seed: `pnpm db:seed` builds a demo dataset (customers, transactions, cases, flags)
