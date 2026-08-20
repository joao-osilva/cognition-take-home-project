# Target Components

Agreed component list for the in-house internal-tools platform (context: fintech engineering team building internal tools — KYC review queue, refunds dashboard, feature-flag admin panel).

Chosen stack: **Next.js on Vercel** (API routes), **NeonDB** (Postgres), **Clerk** (authn/authz), **Inngest** (background jobs/orchestration), **Vercel Blob** (file storage), **shadcn** (design system).

| # | Component | Approach | Filled by | Notes |
|---|---|---|---|---|
| 1 | AuthN / SSO + user management | 3rd-party | Clerk | SSO, sessions, user admin out of the box; no hand-rolled auth |
| 2 | RBAC enforcement + separation-of-duties | **Build** | API middleware; roles stored in Clerk metadata | SoD rules (requester ≠ approver, prod-only roles) are domain logic Clerk can't express — enforced server-side on every endpoint |
| 3 | Audit log | **Build** | NeonDB + API helpers | Append-only `audit_log` (actor, action, before/after, timestamp) written in the same transaction as the mutation; INSERT-only DB role; browsable UI; read-access logging for KYC PII views |
| 4 | Approval engine | **Build** | API layer + Inngest | State machine per entity type with role + rule guards (amount thresholds, maker-checker). Synchronous core; Inngest handles timers/async (e.g. KYC SLA escalation) |
| 5 | Data layer | 3rd-party (managed) | NeonDB | Managed Postgres; migrations in git; DB constraints as last line of defense |
| 6 | API layer | **Build** | Next.js API routes / server actions | Modular monolith: `kyc`, `refunds`, `flags` modules over a shared kernel (auth → authz → validation → domain → audit) |
| 7 | Web UI | **Build** | Next.js + shadcn | Shared shell (nav, session, role-aware rendering) + component kit (data table w/ filters, detail panel, action-with-reason modal, status badges, metric cards); new tools become composition |
| 8 | Feature-flag store | **Build** | NeonDB | Panel owns flags (per-environment state, history); read API for consuming apps; swap for LaunchDarkly later if ever needed |
| 9 | KYC document storage | 3rd-party | Vercel Blob | Real doc storage instead of mocks |
| 10 | Notifications | **Build (in-app)** | NeonDB + Inngest + shadcn | `notifications` table (recipient, type, payload, read_at) written on approval/flag events; bell + unread count in the shared shell. Slack/email delivery deferred (see known-gaps #8) |
| 11 | Admin / config UI | **Build** | Next.js + shadcn | Config-over-code: approval thresholds, SLA windows, queue statuses, role assignments editable as data — the primary non-engineer self-service mitigation (see known-gaps #7) |
| 12 | Hosting / CI | 3rd-party | Vercel | Deploys + per-PR preview envs (pairs with Neon branching); CI via GitHub Actions |

## What is hand-built, and why

Only the differentiated fintech logic is built by hand: **RBAC/SoD enforcement, the audit subsystem, the approval engine, the flag store, the config UI, and the three app UIs**. Everything undifferentiated (identity, database, file storage, hosting, job orchestration, design system) is delegated to managed services.

## Deliberately absent

- **No-code builder** — engineers + Devin generate/modify real code instead (the substitution under evaluation).
- **Connector framework** — direct integrations written when a real need appears.
- **Multi-tenant governance / DLP layer** — git + code review is the governance at this scale (see known-gaps #6).

## Build order (dependency-driven)

1. Kernel: Clerk integration + RBAC middleware + audit writer + schema/migrations
2. Approval engine on the kernel
3. Refunds app (exercises the most kernel features: thresholds, maker-checker, metrics)
4. KYC queue (assignment, enforced transitions, access logging, Blob doc storage)
5. Feature-flag panel (env scoping, prod guardrails, change history)
6. Admin/config UI, notification events, deploy pipeline
