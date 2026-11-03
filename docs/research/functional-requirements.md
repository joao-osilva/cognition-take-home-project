# Functional Requirements — Replicating Power Apps for the Client's 3 Apps

_What we actually need to build to replace what Power Apps provides today, given the client is a fintech with a KYC review queue, a refunds dashboard, and a feature-flag admin panel._

## 1. Per-app functionality

### 1.1 KYC Review Queue

The compliance-critical app. Analysts review customer identity cases; decisions must be traceable.

- **Queue view**: list of pending KYC cases with status (pending / in review / approved / rejected / escalated), risk level, submission date; sortable + filterable (status, risk, assignee, date range); search by customer name/ID.
- **Case detail view**: customer info, submitted documents (private file storage, authenticated viewing), risk flags, prior decision history.
- **Assignment**: claim / release a case; prevent two analysts reviewing the same case.
- **Decision actions**: approve / reject / escalate with mandatory reason notes.
- **Status transitions enforced server-side** (e.g. can't approve an unclaimed case; escalated cases are decided by an approver other than the escalating analyst).
- **SLA awareness**: age of case surfaced, overdue highlighting, and background reminders when a case breaches its SLA window.
- **Full audit trail** of every action: who viewed, claimed, decided, when, and prior values — this is a regulatory requirement, not a nice-to-have.

### 1.2 Refunds Dashboard

The money-movement app. Highest-risk of the three: bugs here move real money.

- **Refund request list**: status (requested / pending approval / approved / rejected / processed), amount, currency, customer, reason, requester; filter/sort/search.
- **Aggregate metrics**: total refunds today/this week, count by status, avg processing time — the "dashboard" part.
- **Create refund request**: linked to a transaction, amount validation (≤ original transaction amount).
- **Approval workflow on every refund**: each request requires second-person approval (maker-checker / four-eyes principle — standard fintech control). Approver must be a different user from the requester.
- **Approval actions**: approve / reject with reason; notification to requester on decision.
- **Immutable audit log** of the full lifecycle of every refund.

### 1.3 Feature-Flag Admin Panel

The engineering-facing app. Lower compliance weight, but blast radius = production.

- **Flag list**: name, description, state (on/off/percentage rollout), environment (dev/staging/prod), owner, last modified.
- **Flag lifecycle**: self-service creation, toggle/edit with per-environment scoping, percentage rollouts, archive/restore.
- **Read API**: an authenticated endpoint (per-consumer API keys) so services can read flag state.
- **Guardrails on prod**: changing a prod flag requires elevated role (or confirmation step); staging/dev is self-serve.
- **Change history per flag**: who flipped what, when, previous value — essential for incident response ("did the outage start when flag X flipped?").
- **Kill-switch usability**: fast path to disable a flag in an incident.

## 2. Cross-cutting platform capabilities (what Power Apps gives "for free")

These are the real cost of building in-house — the per-app CRUD is easy.

| Capability                 | Power Apps equivalent                       | What we must build                                                                                                                                   |
| -------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication / SSO**   | Entra ID built-in                           | Managed identity provider (Clerk): SSO/social login, sessions, user management                                                                       |
| **RBAC**                   | Dataverse security roles (row/column level) | Per-app roles in the form `app:level` (e.g. `kyc:operator`, `refunds:approver`) plus a global `admin`; enforced server-side on every mutation        |
| **Audit logging**          | Dataverse auditing (field-level, built-in)  | Append-only audit table capturing actor, action, entity, before/after values, timestamp; UI to browse it; ideally also access (read) logging for KYC |
| **Approval workflows**     | Power Automate approvals                    | Central approval engine with per-app policies in code (role requirements, requester ≠ approver); notifications                                       |
| **Data layer**             | Dataverse (managed relational store)        | Relational DB (Postgres) with migrations; validation both client- and server-side                                                                    |
| **Notifications**          | Connectors (Outlook/Teams)                  | In-app inbox + unread badge backed by a notifications table, fed by domain events and background jobs; external delivery (Slack/email) deferred      |
| **Admin/user management**  | Power Platform admin center                 | Minimal user/role management screen                                                                                                                  |
| **Hosting & ops**          | Microsoft SaaS (SLA, patching, backups)     | Managed hosting (Vercel) + managed Postgres (Neon) + managed background jobs (Inngest); ops burden delegated, must still be costed honestly          |
| **Environment separation** | PP environments + ALM pipelines             | Standard git branches + CI/CD — arguably _better_ than Power Apps for an engineering org                                                             |

## 3. What we deliberately do NOT need to replicate

Power Apps capabilities that carry much of its license price but deliver little value for this client:

- **No-code maker UX** — the client's builders are 60 engineers; code (esp. with Devin) is their native interface. This is the single biggest reason the buy-side value prop is weak here.
- **1,000+ connector catalog** — these 3 apps touch a handful of internal systems; direct API/DB integration suffices.
- **Native mobile apps** — internal ops tools; responsive web is enough.
- **Tenant-wide governance/DLP tooling** — needed when hundreds of citizen developers make apps; irrelevant for 3 engineering-owned apps.
- **Copilot app generation** — Devin fills this role, and generates real, portable code instead.
