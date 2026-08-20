# Devin in the SDLC

How the team leverages Devin once the platform is live — the answer to "who maintains this without a dedicated tools team?", and the direct replacement for Power Apps' no-code self-service.

## Why this platform is unusually Devin-friendly (by design)

Several architecture decisions were made partly to make AI-driven changes safe and reviewable:

- **Self-contained app packages** — a change to refunds touches `packages/apps/refunds` + thin host routes; small blast radius, easy review
- **Kernel enforces the pipeline** — `defineAction()` means generated code *cannot* skip auth/RBAC/audit; the dangerous parts are centralized, hand-written, and unit-tested
- **Typed end-to-end + zod** — the compiler and CI catch a large class of AI mistakes
- **Plain SQL migrations** — schema changes are explicit, reviewable diffs
- **Preview env per PR** (Vercel + Neon branch) — every Devin PR is testable in isolation before a human approves
- **Generator conventions** (`pnpm gen:app`) — a repeatable recipe Devin can follow for whole-app scaffolding

## The workflows

### 1. Change requests on existing apps (the common case)
Ops/compliance/PM files a request in plain English (Slack/Linear/GitHub issue) → Devin turns it into a PR with migration, tests, and preview link → engineer reviews → merge.
Examples: "add a 'pending documents' status to KYC cases", "show refund aging on the dashboard", "require a reason when disabling a prod flag".
This collapses turnaround from "sprint ticket" to "same-day PR" while keeping engineer review as the control point (see known-gaps #7).

### 2. New apps end-to-end
"We need a vendor-onboarding tracker" → Devin runs the new-app journey (scaffold package, schema slice, screens from `@repo/ui`, policies through the kernel, seed, host routes) → engineers review a complete, working PR against the preview env. The platform's conventions turn "build an internal tool" into a well-specified task — exactly the shape Devin executes best.

### 3. Maintenance & upkeep
- Dependency upgrades (Next.js/Drizzle/Clerk SDK bumps) with CI as the safety net
- Bug fixes from error reports (Sentry issue → Devin PR)
- Test-coverage expansion, refactors, lint-rule adoption

### 4. Documentation & knowledge
- Docs (like this folder) kept in-repo; Devin updates them in the same PR as the change
- Session-based knowledge accumulates conventions (e.g. "app packages never import each other"), so future sessions follow house rules automatically

## Control points that stay human

- **PR review + merge** — every Devin change is reviewed by an engineer; git history is the audit trail of *tool* changes (mirroring how `audit_log` records *data* changes)
- **Role/permission changes and kernel changes** — flagged for senior review by CODEOWNERS on `packages/core` and `packages/db`
- **Production config** — thresholds etc. are changed in the admin UI by authorized humans, not via code PRs

## Honest limits

- Devin ≠ self-service: a non-engineer still waits for a PR + review, not an instant UI edit
- Review capacity becomes the bottleneck — worth measuring PR review turnaround as the platform's real SLA
- Kernel-level changes (approval engine semantics, audit writer) deserve human-led design first, Devin implementation second
