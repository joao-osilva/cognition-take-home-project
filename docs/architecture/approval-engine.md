# Approval Engine Contract

One generic engine in the kernel; each app opts in by declaring a typed policy.

## Policy declaration (app package)

```ts
// packages/apps/refunds/src/approval-policy.ts
export const refundApprovalPolicy = definePolicy<RefundRequest>({
  entityType: "refund_request",
  needsApproval: (entity, config) =>
    entity.amount > config.get("refunds.approval_threshold"),
  canDecide: (actor, entity) =>
    hasRole(actor, "refunds:approver") && actor.id !== entity.requestedBy, // SoD
  onApproved: (tx, entity) => setStatus(tx, entity, "approved"),
  onRejected: (tx, entity) => setStatus(tx, entity, "rejected"),
});
```

- `needsApproval` — predicate over the entity + live config (thresholds from `app_config`)
- `canDecide` — role check **plus separation-of-duties rules** (requester ≠ approver, etc.)
- `onApproved` / `onRejected` — domain hooks run inside the engine's transaction

## Kernel API (`packages/core`)

- `requestApproval(tx, policy, entity, actor)` — creates the `approvals` row with a `rule_snapshot` (e.g. the threshold value at request time), moves the entity to its pending state, notifies eligible approvers.
- `decideApproval(tx, policy, approvalId, actor, decision, reason)` — enforces `canDecide`, records the decision, runs the domain hook, writes audit entries, notifies the requester.
- Everything happens in **one DB transaction** — approval row, entity state change, audit log, and notification rows commit or roll back together.

## Configuration

Thresholds and similar tunables live in `app_config` (e.g. `refunds.approval_threshold`, integer cents), editable in the admin UI; every change is itself audited. This is the primary config-over-code surface (see known-gaps #7).

## Usage across the apps

| App | `needsApproval` | `canDecide` |
|---|---|---|
| Refunds | amount > configured threshold | `refunds:approver`, ≠ requester |
| KYC | always, for escalated cases | `kyc:approver`, ≠ escalating analyst |
| Flags | always, for `prod` environment changes | `flags:approver` |

## Timers / async

SLA behavior (e.g. KYC case pending too long → escalate/notify) is implemented as Inngest functions registered by app packages — deliberately separate from the synchronous engine. The engine stays a simple, testable state machine.
