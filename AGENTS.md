# House Rules

Rules every change (human- or AI-authored) must follow. Design rationale lives in `docs/architecture/`.

## Package boundaries

- App packages (`packages/apps/*`) never import each other. If two apps need the same entity, promote it to the core slice in `packages/db`.
- Apps may only depend on `@repo/core`, `@repo/db`, `@repo/ui`, `@repo/config`.
- Platform tables (`users`, `audit_log`, `approvals`, `notifications`, `app_config`) are kernel-write-only: apps use the kernel services in `@repo/core` (writeAudit, requestApproval/decideApproval, notify, getConfig) — never write these tables directly.

## Mutations

- Every mutation goes through `defineAction()` from `@repo/core` (auth → role check → zod validation → domain logic → audit). No exceptions.
- Server actions for mutations; REST route handlers only where an external consumer exists.
- Separation-of-duties rules (approver ≠ requester, etc.) live in approval policies' `canDecide`, never in UI-only checks.

## Data

- Money is integer cents + ISO currency code. Never floats.
- Statuses are text columns with check constraints, not Postgres enums.
- Each app package owns its schema slice in `src/schema.ts`; `packages/db` owns core/platform tables and aggregates all slices for drizzle-kit.

## Migrations

- Generate with `pnpm db:generate`; commit the emitted SQL with the PR.
- Never edit an already-applied migration file.
- Migrations must be backward-compatible with the currently-deployed code (expand/contract: add nullable column → deploy code → backfill → tighten later), because prod migrations run before the deploy promotes.

## New apps

- Scaffold with `pnpm gen:app <id>`, then follow the printed next steps. Do not hand-create app packages.

## UI

- The design system is shadcn/ui. Shared components live in `packages/ui`; add new primitives there via the shadcn CLI. Apps import from `@repo/ui` — never install UI primitives inside an app package.

## General

- Update the relevant doc in `docs/` in the same PR as the change it describes.
- Run `pnpm lint typecheck test build` before opening a PR.
- Never commit secrets; `.env` files are gitignored.
