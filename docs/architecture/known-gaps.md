# Known Gaps

Accepted gaps of the chosen stack (Next.js/Vercel, NeonDB, Clerk, Inngest, Vercel Blob, shadcn) vs. a managed platform like Power Apps. Documented deliberately; not blockers for internal tools at this scale, but must be acknowledged in any build-vs-buy decision.

## 1. Compliance certification of the composition
Each vendor (Vercel, Neon, Clerk, Inngest) is individually SOC 2 certified, but the composed system is not. The burden of demonstrating controls to auditors — access reviews, change management, disaster recovery — falls on the engineering team. With Power Apps, Microsoft's compliance envelope covers much of this.

## 2. PII spread across multiple vendors
User identity lives in Clerk, KYC documents in Vercel Blob, domain data in Neon, logs/traffic in Vercel. That means multiple DPAs to maintain, a larger vendor-risk review surface, and per-vendor data-residency constraints to track — vs. a single Microsoft data estate.

## 3. Private / VPC networking
Vercel's serverless egress makes reaching internal-only systems (VPC-only databases, on-prem services, core banking APIs) awkward — workarounds are static egress IPs or secure tunnels. Power Apps offers an on-premises data gateway for this. If future tools need private connectivity, this stack needs rework or a different deploy target.

## 4. No joint SLA
Five independent SaaS dependencies multiply failure modes: an outage in Clerk (login), Neon, Inngest, or Vercel takes the tools down, and no vendor owes a combined SLA. Power Apps concentrates that risk in a single Microsoft SLA.

## 5. Tamper-proof audit logs (low relevance — mitigable in-app)
Neon is plain Postgres: anyone with admin DB access (or a compromised credential) could `UPDATE`/`DELETE` audit rows and erase evidence of an action (e.g. approve a fraudulent refund, then edit the log). Dataverse auditing is tamper-resistant by design. Mitigation is cheap but must be deliberate: the app only INSERTs into `audit_log`, UPDATE/DELETE revoked at the DB-role level, and periodic export to write-once storage (e.g. S3 object lock) so even a DB admin cannot rewrite history.

## 6. Governance / DLP tooling (low relevance at this scale)
Power Apps' admin center gives IT a central view of every app, its users, and policy control over data flows (DLP — e.g. block connecting CRM data to personal storage). Our stack has no equivalent. With 3 apps owned by one engineering team, git + code review effectively is the governance; this only becomes a real gap if many teams start building tools without central oversight.
