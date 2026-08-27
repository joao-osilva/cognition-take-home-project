# Role Model

## Roles

Lean, per-app roles in the form `app:level`, plus one global role:

| Role               | Grants                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------- |
| `kyc:operator`     | View KYC queue, claim/release cases, manage case documents, decide non-escalated cases |
| `kyc:approver`     | `kyc:operator` + decide escalated cases                                                |
| `refunds:operator` | View refunds dashboard, create refund requests                                         |
| `refunds:approver` | `refunds:operator` + approve/reject refunds pending approval                           |
| `flags:operator`   | View flags, toggle/edit flags in dev/staging                                           |
| `flags:approver`   | `flags:operator` + change prod flags                                                   |
| `admin`            | Everything, incl. admin/config UI and role assignment                                  |

Notes:

- Users can hold multiple roles.
- No `viewer` role for now — no confirmed read-only persona; adding one later is a one-line change to the permission matrix, no schema change.
- Per-app scoping is deliberate least-privilege: a refunds operator has no access to KYC PII.

## Storage & enforcement

- **Storage**: Clerk `publicMetadata.roles` (string array). Clerk is the source of truth; no DB mirror of roles.
- **Enforcement**: server-side in the kernel, on every server action / route handler:
  - `requireRole(actor, role)` and `can(actor, action, entity)` helpers; UI role checks are cosmetic only (launcher/nav filtering).
- **Assignment**: through our admin UI (which writes to Clerk via API) so every role change lands in `audit_log` — not through the Clerk dashboard.

## Separation-of-duties rules (kernel code, not expressible in Clerk)

1. **Refunds**: approver must differ from the requester (maker-checker).
2. **KYC**: an escalated case must be decided by a `kyc:approver` who is not the analyst who escalated it.
3. **Flags**: production changes require `flags:approver`.

These are per-action checks in the approval engine / domain logic, independent of role structure.
