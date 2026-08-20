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
Ops/compliance/PM files a request in plain English → Devin turns it into a PR with migration, tests, and preview link → engineer reviews → merge.
Examples: "add a 'pending documents' status to KYC cases", "show refund aging on the dashboard", "require a reason when disabling a prod flag".
This collapses turnaround from "sprint ticket" to "same-day PR" while keeping engineer review as the control point (see known-gaps #7).

**Intake channel**: Devin's Slack integration — a `#internal-tools` channel where requesters tag @Devin; Devin opens a session, produces the PR, and replies in-thread with PR + Vercel preview link. The requester validates behavior on the preview URL *before* an engineer reviews — the "citizen developer" moment. (Alternative: labeled GitHub issues triggering sessions via the Devin API.)

**Implementation cost**: connect the Slack integration, define channel conventions — no code.

### 2. New apps end-to-end
"We need a vendor-onboarding tracker" → Devin runs the new-app journey: `pnpm gen:app <id>` scaffolds the package skeleton + host route stubs, then Devin fills in schema slice, screens from `@repo/ui`, policies through the kernel, and seed data from the natural-language spec → engineers review a complete, working PR against the preview env. The platform's conventions turn "build an internal tool" into a well-specified task — exactly the shape Devin executes best.

**Implementation cost**: the generator (part of scaffolding anyway) + a "how to add an app" doc that Devin follows — the doc *is* the implementation.

### 3. Documentation & knowledge (the enabler)
Three layers keep every Devin session grounded on house rules:
- **`AGENTS.md`** (repo root) — prescriptive rules Devin must follow when changing code: package boundaries ("apps never import each other; promote shared entities to core"), all mutations through `defineAction()`, migration discipline (generate SQL, never edit applied migrations), role/SoD invariants, "update docs in the same PR"
- **`docs/architecture/`** — the design decision records (*why* things are the way they are), updated in the same PR as the change
- **Devin's DeepWiki** — auto-generated, always-in-sync wiki of *what the code actually is*: architecture diagrams, module docs, and "Ask Devin" Q&A over the codebase. Regenerates as PRs merge — zero upkeep. Uses: new-engineer onboarding without stale wiki pages; non-engineers asking "how does refund approval work?" without interrupting the team; Devin sessions grounding on it when planning changes. Also neutralizes the docs-rot hidden cost of building vs. buying.

**Implementation cost**: write `AGENTS.md` during scaffolding (~1 page); DeepWiki exists for any Devin-connected repo — just link it from the README.

## Control points that stay human

- **PR review + merge** — every Devin change is reviewed by an engineer; Devin never merges. Branch protection: CI green + 1 review required. Git history is the audit trail of *tool* changes (mirroring how `audit_log` records *data* changes)
- **CODEOWNERS** — `packages/core` + `packages/db` require senior-engineer review; app packages need any engineer
- **Devin PR review** — automatic first-pass review on every PR before humans look
- **Production config** — thresholds etc. are changed in the admin UI by authorized humans, not via code PRs

## Honest limits

- Devin ≠ self-service: a non-engineer still waits for a PR + review, not an instant UI edit
- Review capacity becomes the bottleneck — worth measuring PR review turnaround as the platform's real SLA
- Kernel-level changes (approval engine semantics, audit writer) deserve human-led design first, Devin implementation second
