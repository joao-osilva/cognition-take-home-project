# Data Model

## Entity grouping

Three tiers, mirroring package ownership:

| Tier | Purpose | Tables | Ownership / write access |
|---|---|---|---|
| **core** | Company-wide business entities, usable by any app | `customers`, `transactions` | Shared slice in `packages/db`; read by any app (in a real deployment these would be fed from source systems, here they're seeded) |
| **platform** | Tech infrastructure of the tools platform | `users`, `audit_log`, `approvals`, `notifications`, `app_config` | Kernel-only writes — apps use kernel services (audit writer, approval engine, notify, config), never these tables directly |
| **app** | Entities relevant to a single app | `kyc_cases`, `kyc_documents` (KYC); `refund_requests` (Refunds); `feature_flags` (Flags) | Owned and written by exactly one app package; schema slice lives in that package |

Promotion rule: when an app-specific entity becomes needed by a second app, it is promoted to **core** — apps never import each other's slices.

## Tables

### core
- `customers` — id, name, email, risk_score, created_at
- `transactions` — id, customer_id (FK), amount, currency, status, created_at

### platform
- `users` — id (= Clerk user id), email, name, timestamps. Mirror of Clerk, synced via webhook, so FKs and audit joins work locally. Roles live in Clerk.
- `audit_log` — id, actor_id, action, entity_type, entity_id, before (JSON), after (JSON), metadata (JSON: IP, etc.), created_at. **INSERT-only** (UPDATE/DELETE revoked at the DB-role level); written in the same transaction as the mutation it records.
- `approvals` — id, entity_type, entity_id (polymorphic), requested_by, decided_by, decision, reason, rule_snapshot (JSON: rule/threshold that triggered it), timestamps.
- `notifications` — id, recipient_id, type, payload (JSON), read_at, created_at.
- `app_config` — key, value (JSON), updated_by, updated_at. Config-over-code store (approval thresholds, SLA windows, queue statuses); changes are audited like any mutation.

### app
- `kyc_cases` — id, customer_id (FK core), status (`pending|in_review|approved|rejected|escalated`), risk_level, assignee_id, sla_due_at, decision_reason, timestamps
- `kyc_documents` — id, case_id (FK), type, blob_url, uploaded_at
- `refund_requests` — id, transaction_id (FK core), amount, currency, reason, status (`requested|pending_approval|approved|rejected|processed`), requested_by, timestamps
- `feature_flags` — id, key, description, environment (`dev|staging|prod`), state (on/off/percentage), owner_id, updated_at; unique (key, environment)

## Decisions

1. **Polymorphic `approvals`** (entity_type + entity_id): one approval engine and one UI across all apps, at the cost of no DB-level FK (mitigated by kernel-only writes). **Revisit triggers**: auditors requiring DB-enforced referential integrity; type-specific approval data outgrowing JSON; heavy cross-entity approval reporting; evolution to multi-step/parallel approval chains — any of these argues for per-type tables or a dedicated workflow model.
2. **`users` mirror table** synced from Clerk via webhook — DB stays self-contained for joins/FKs; Clerk remains the source of truth for identity and roles.
3. **Money as integer cents** plus ISO currency code; never floats.
4. **Statuses as text + CHECK constraints** rather than Postgres enums — adding a status is a cheap change (fits config-over-code), not an enum migration.
