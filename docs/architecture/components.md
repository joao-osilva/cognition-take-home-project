# System Components — In-House Internal-Tools Platform

_Context: a fintech engineering team building internal tools. The goal is not "3 one-off apps" but a small platform layer so that these 3 apps — and any future internal tool — get authentication, authorization, auditability, and approvals without re-building them each time. This is the actual thing Power Apps sells; replicating it well means replicating the platform, not just the screens._

## Component map

```
┌─────────────────────────────────────────────────────────────┐
│                        Web UI (SPA or SSR)                    │
│   Shared shell: nav, auth session, role-aware rendering       │
│  ┌────────────┐  ┌───────────────┐  ┌──────────────────┐     │
│  │ KYC Queue  │  │ Refunds Dash  │  │ Feature-Flag Admin│     │
│  └────────────┘  └───────────────┘  └──────────────────┘     │
└──────────────────────────┬────────────────────────────────────┘
                           │ HTTPS / JSON
┌──────────────────────────┴────────────────────────────────────┐
│                       API layer (single service)               │
│  AuthN (OIDC) │ AuthZ (RBAC middleware) │ Validation            │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐  │
│  │ Domain modules    │ │ Approval engine  │ │ Audit writer   │  │
│  │ (kyc/refunds/flags)│ │ (state machine) │ │ (append-only)  │  │
│  └──────────────────┘ └──────────────────┘ └────────────────┘  │
│                         │ Notification dispatcher (email/Slack)│
└──────────────────────────┬────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │  PostgreSQL          │
                │  domain tables +     │
                │  audit_log (append-  │
                │  only) + users/roles │
                └─────────────────────┘
```

## 1. Identity & authentication (replaces: Entra ID integration)

- **OIDC against the company IdP** (Entra ID, Google Workspace, Okta — whatever they run). No local passwords, ever.
- Session management (short-lived tokens, server-side sessions for internal tools is fine).
- **Why it matters in fintech**: joiner/mover/leaver flows must be centralized; an offboarded employee must lose access to refund approval the moment their IdP account is disabled.
- Prototype stance: pluggable auth interface with a dev "user switcher" backend; OIDC backend is a config change, not a redesign.

## 2. Authorization / RBAC (replaces: Dataverse security roles)

- Central role model, enforced **server-side on every mutation and sensitive read** — never in the UI alone.
- Roles as data (assignable via admin UI), permissions as code (checked in reviewable middleware). Suggested baseline: `viewer`, `kyc_analyst`, `kyc_senior`, `refund_requester`, `refund_approver`, `flag_editor`, `flag_admin_prod`, `admin`.
- Support **separation-of-duties rules** as first-class: requester ≠ approver, senior-only escalations, prod-only roles. These are fintech table stakes (SOX/PCI-style controls) and are exactly what auditors ask to see demonstrated.
- Future-proofing: resource-level scoping (per-environment for flags, per-amount-band for refunds) rather than only global roles.

## 3. Audit subsystem (replaces: Dataverse auditing)

The compliance backbone; must be designed in, not bolted on.

- **Append-only `audit_log`**: actor, action, entity type/id, before/after JSON, timestamp, request metadata (IP, session). No UPDATE/DELETE grants on the table; enforce at the DB level.
- Written **in the same transaction** as the domain mutation — an action that isn't audited must not commit.
- **Read/access logging** for sensitive views (KYC case detail) — regulators care about who _looked_ at PII, not just who changed it. Implemented for KYC documents: every fetch through `/kyc/documents/[id]` writes a `kyc.document.viewed` audit row.
- Browsable UI: per-record history + global filterable stream.
- Retention & export: configurable retention, export to the company's SIEM/log pipeline later.

## 4. Approval / workflow engine (replaces: Power Automate approvals)

- Generic **state machine per entity type** with transitions guarded by role + rule predicates (e.g. `refund.amount > threshold → requires approval by refund_approver ≠ requester`).
- Approval records are entities themselves (requested_by, decided_by, reason, decided_at) → automatically audited.
- Keep it **synchronous and boring** at first (no queue/worker infra); the interface allows swapping in async later.
- Rules should be data-configurable where cheap (thresholds) and code where correctness matters (SoD checks).

## 5. Data layer (replaces: Dataverse)

- **PostgreSQL**: relational integrity, row-level security available if needed, boring and universally known.
- Schema migrations in git (the ALM story Power Apps struggles with: here it's just code review + CI).
- Validation at both API layer (rich errors) and DB layer (constraints as last line of defense — amounts non-negative, refund ≤ transaction amount, FK integrity).
- No ORM lock-in requirement; pick per stack.
- **KYC documents** live in a private Vercel Blob store: uploads go through a `kyc:operator`-gated server action (type/size validated, random pathname per file) that records the Blob pathname in `kyc_documents`; reads stream through the authenticated `/kyc/documents/[id]` route — the store is never publicly reachable.

## 6. API layer (replaces: Power Apps' hidden middle tier)

- Single service, modular monolith: `kyc`, `refunds`, `flags` modules sharing the auth/RBAC/audit/approval kernel. Microservices are unjustifiable at this scale.
- Typed contracts end-to-end (e.g. OpenAPI or shared TS types) so UI and API can't drift.
- Every endpoint passes through: authn → authz → validation → domain logic → audit write → response.

## 7. Web UI (replaces: canvas/model-driven app builder)

- One SPA/SSR app with a shared shell (nav, session, role-aware menus) and one route-tree per tool.
- A small internal component kit (data table with filters/sort/search, detail panel, action-with-reason modal, status badges, metric cards) — this is the "model-driven" trick: new tools become composition, not construction.
- Responsive web only; no native mobile.

## 8. Notifications (replaces: Outlook/Teams connectors)

- Thin dispatcher interface: `notify(recipient, type, payload)` writes the `notifications` table; the shell renders a bell with unread count and mark-as-read (a `defineAction()` scoped to the current actor).
- Triggered synchronously by domain actions (e.g. refund decided) and by Inngest background functions served from `/api/inngest`: an hourly `kyc-sla-reminder` sweep notifies the assignee (or all `kyc:approver`s when unassigned) about cases past `sla_due_at`, deduplicated per case so reruns don't flood.
- Slack/email delivery deliberately deferred (known-gaps #8) — this is where connector-catalog envy starts; resist it until a real need appears.

## 9. Operations (replaces: Microsoft's SaaS ops)

The honest cost-center of building:

- Deploy: one container + managed Postgres (RDS/Cloud SQL/Fly/Render). CI/CD via existing GitHub Actions.
- Backups: managed-DB automated backups + tested restore.
- Monitoring: error tracking (Sentry) + uptime check; audit log doubles as activity monitoring.
- Secrets: company's existing secret manager.
- Security posture: internal-only network exposure (VPN/zero-trust proxy) as a second wall in front of app auth.

## 10. What deliberately has no component

- No no-code builder — engineers + Devin generate/modify real code instead; that's the substitution at the heart of this evaluation.
- No connector framework — direct integrations written when needed.
- No multi-tenant governance/DLP layer — one org, one engineering team, git is the governance.

## Build order (dependency-driven)

1. Kernel: auth interface + RBAC middleware + audit writer + Postgres schema/migrations.
2. Approval engine on top of the kernel.
3. Refunds app (exercises the most kernel features: thresholds, maker-checker, metrics).
4. KYC queue (assignment, transitions, access logging).
5. Feature-flag panel (env scoping, prod guardrails).
6. Notifications, admin/user management UI, deploy pipeline.
