# Power Apps Deep Research — Build vs Buy Context

*Context: Series C fintech, ~60 engineers, $250K/yr license, 3 internal apps (KYC review queue, refunds dashboard, feature-flag admin panel).*

## 1. What Power Apps actually is

A low-code suite inside Microsoft Power Platform. Key components:

- **Canvas apps** — drag-and-drop UI builder ("PowerPoint-like"), logic in PowerFx (Excel-style formula language). Web + mobile responsive out of the box.
- **Model-driven apps** — auto-generated CRUD UIs (forms, views, grids, dashboards) derived from a data model in Dataverse. This is what a KYC queue / refunds dashboard would typically be: define tables → get an admin UI nearly for free.
- **Dataverse** — the managed data platform: relational tables, column-level security, business rules/validation, row-level security via security roles, and built-in field-level audit history.
- **Connectors** — 1,000+ prebuilt connectors (SQL Server, Postgres, REST, Salesforce, SharePoint...). "Premium" connectors (incl. SQL, HTTP/custom APIs — i.e., anything a fintech actually uses) require paid per-user licensing.
- **Power Automate** — workflow/approvals engine: multi-stage approvals, notifications (email/Teams), scheduled & event-driven flows, human-in-the-loop sign-off with full audit of who approved what.
- **Copilot/AI** — natural-language app generation (increasingly the headline feature).

## 2. Where the value really lies for a team like this

Ranked by what matters for fintech internal tools:

1. **Speed of CRUD-over-data UIs** — forms, tables, filters, detail views without frontend work.
2. **Auth & permissions for free** — Entra ID (Azure AD) SSO, security roles, row/column-level security. Nobody builds login screens.
3. **Audit & compliance** — Dataverse auditing logs every field change and data access; critical for KYC/refunds where regulators ask "who approved this and when." Microsoft explicitly markets this at financial institutions.
4. **Approval workflows** — Power Automate approvals (e.g., refund > $X requires manager sign-off) are point-and-click.
5. **Governance at scale** — Power Platform admin center: DLP policies, environment isolation (dev/test/prod), managed environments, tenant-wide security score, ALM pipelines with Git integration.
6. **Zero ops** — Microsoft runs hosting, patching, backups, uptime.

Note: for 3 apps used by a 60-engineer org, items 5–6 are the bulk of what $250K buys — and are also the most over-provisioned part.

## 3. Known limitations (well-documented pain points)

- **Delegation limits**: queries the connector can't push down are evaluated client-side on max 500–2,000 rows → silently wrong results on large datasets. Real risk for a refunds dashboard over a big transactions table.
- **Licensing complexity & cost**: Premium is $20/user/mo list. Premium connectors (SQL, custom REST APIs) gate almost everything a fintech needs behind Premium. Dataverse capacity (250MB DB / 2GB file accrued per user) billed extra beyond entitlements. Per-user daily API request caps.
- **Developer experience**: PowerFx, not real code; limited version control ergonomics (improving via Git integration but still solution-XML based); no native testing story; hard to code-review; engineers generally dislike it — relevant since this client's builders are engineers, not citizen developers.
- **Vendor lock-in**: apps are not portable; data model in Dataverse; logic in PowerFx/flows.
- **Performance**: slow load times on complex apps / large datasets are a recurring complaint.

## 4. Pricing reality check

- Power Apps Premium: **$20/user/mo** → 60 users ≈ **$14.4K/yr** list. The client's **$250K/yr** strongly suggests an enterprise bundle (Dynamics/capacity add-ons/E5 attach) or heavy over-provisioning — worth the VP asking Microsoft for a re-quote regardless of build-vs-buy.
- Per-app plan: $5/user/app/mo; pay-as-you-go $10/active user/app/mo.
- Comparators: Retool (dev-centric, JS/SQL, ~$10–50/user/mo), open-source options (ToolJet, Appsmith, Budibase) at ~$0 license + self-host cost.

## 5. What our prototype must replicate to be credible

The 20% of Power Apps delivering 80% of value for these 3 apps:

1. CRUD UIs over a relational store (queue views, detail views, filters, status transitions).
2. Role-based access control (analyst vs. approver vs. admin) + SSO stub.
3. Audit log of every state change (who/what/when) — the compliance hook.
4. Approval workflow (e.g., refund above threshold requires second approver).
5. Simple, boring, maintainable stack an engineer can extend in an afternoon — this is the pitch for Devin: regen/extend apps from plain code instead of a licensed builder.

What we should NOT try to replicate (and be honest about): drag-and-drop maker UX for non-engineers, 1,000 connectors, managed hosting/patching/SLA, tenant governance/DLP tooling, mobile apps for free.

## 6. Key risk framing for the recommendation

- Build risk: security (authz bugs in home-grown RBAC), maintenance falls on product engineers (opportunity cost), no vendor SLA, audit features must be built deliberately not assumed.
- Buy risk: cost scaling per user, lock-in, engineers hate maintaining low-code, delegation/perf ceilings, paying enterprise-platform prices for 3 CRUD apps.
- Middle paths worth mentioning: renegotiate the Microsoft contract; per-app licensing; open-source low-code (self-host); or build with Devin (the case we're evaluating).

### Sources
- learn.microsoft.com: powerapps-overview, maker components, admin/security, manage-dataverse-auditing, architecture/key-concepts/dataverse-auditing, alm/pipelines, alm/git-integration
- microsoft.com Power Apps pricing + Power Platform Licensing Guide (Aug 2025)
- conducthq.com/journal/power-apps-limitations, techtarget.com Power Apps limitations, selecthub/tooljet Retool comparisons
