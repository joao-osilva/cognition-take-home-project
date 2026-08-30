import { PageHeader } from "@repo/ui";

import { getSessionUser } from "@/lib/actor";

export const dynamic = "force-dynamic";

const repoTree = `cognition-take-home-project/
├── apps/
│   └── web/                 # Next.js host: routes, layouts, API endpoints
├── packages/
│   ├── core/                # kernel: defineAction, RBAC, approvals, audit
│   ├── db/                  # Drizzle schema, migrations, seed
│   ├── ui/                  # shadcn design system
│   ├── config/              # ESLint, TS, Tailwind presets
│   └── apps/                # one package per app, never import each other
│       ├── kyc/             # schema, actions, screens
│       ├── refunds/         # schema, actions, screens
│       └── flags/           # schema, actions, screens
├── docs/
│   └── architecture/        # design records, diagrams (D2)
├── turbo.json               # task pipeline
└── pnpm-workspace.yaml      # workspace globs`;

export default async function ArchitecturePage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="Architecture"
        description="A high-level view of the platform and the services it runs on."
      />
      <article className="bg-card rounded-lg border p-6 shadow-xs md:p-8">
        <div className="text-foreground/90 space-y-4 text-sm leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2:not(:first-child)]:mt-8">
          <h2>Approach</h2>
          <p>
            I leveraged no-ops solutions for most of the components, services that could provide the
            functionality needed off the shelf without having to build internals and too much
            boilerplate. The idea is to provide a standardized way for engineers to quickly build
            new apps while leveraging existing structure (framework, packages, auth, CI/CD,
            observability), which relieves the burden of maintaining multiple apps.
          </p>
          <p>
            The obvious cost is vendor dependence and usage-based pricing, but the TCO (total cost
            of ownership) is still lower than just spinning up everything and managing the infra.
          </p>
          <h2>Stack</h2>
          <p>
            The stack uses Vercel as central point, not only for deploying the Next.js project but
            also managing the integrations with Neon (serverless Postgres), Inngest (durable
            workflows) and Blob storage. Migrations run and Inngest functions re-sync as part of
            each deploy, so there is no separate release orchestration needed.
          </p>
          <p>
            For authn/authz I&apos;m using Clerk, which gives social login and user management out
            of the box. I created custom roles per app in Clerk&apos;s user metadata, and mirror
            users into a local table via webhook so queries can join against them. Clerk supplies
            identity and role claims, but the per-app RBAC enforcement is ours, in the platform
            kernel.
          </p>
          <h2>Monorepo</h2>
          <p>
            I&apos;m using a monorepo with Turbo, a single web app (with routes per app) and
            packages for each individual app (kyc, refunds, flags) to encapsulate domain logic, plus
            core platform packages used across all of them (ui, db, core, config). App packages
            never import each other. If two apps need the same entity it gets promoted to the shared
            data layer.
          </p>
          <p>
            I considered one deployable per app, closer to how Power Apps isolates things, but that
            would increase complexity (N pipelines, N auth setups, N places to patch). The single
            host means a bad deploy touches every app, but for internal tools that&apos;s an
            inconvenience, not a customer incident, and preview deployments per PR (thanks to
            Vercel) catch most of it.
          </p>
          <h2>Data model</h2>
          <p>
            The data model was thought in 3 tiers, to segregate core company entities which are
            cross-app (customers, transactions), platform internals (audit, approvals,
            notifications, users, config) and app-specific ones (kyc cases, refund requests, flags).
            Each app owns its schema slice, so a new app adds tables without breaking the platform
            or other apps.
          </p>
          <h2>The kernel</h2>
          <p>
            The apps are basically screens plus operations that change state (claim a kyc case,
            request a refund, toggle a flag, assign a role). Instead of each app implementing its
            own checks for these operations, they all go through a single helper in the core
            package, defineAction(). It checks who you are, checks your role, validates the input,
            runs the app&apos;s logic and writes the audit log. I added this because with multiple
            apps (and more coming) I didn&apos;t want auth, permissions and audit reimplemented per
            app, each slightly different, that would make the platform complex to maintain. Apps
            also can&apos;t write to the platform tables directly, so there&apos;s no way to change
            state without leaving an audit trail.
          </p>
          <p>
            The kernel also owns the approval engine, since every app needed some sort of approval
            process (granting refunds, escalating kyc cases, enabling flags in production). One
            person requests, a different person approves, and the requester can never approve their
            own request. Each app defines its own approval policy in code (who can decide, what
            happens on approve/reject), and the engine enforces it, so the rule can&apos;t be
            bypassed by a different screen or client. When an approval is requested, the engine also
            stores a copy of the config values used at that moment (e.g. the refund threshold) on
            the approval record, and every decision lands in the audit log, so an auditor can open
            the audit page in the app and see who did what, when, and under which rules.
          </p>
          <h2>What I didn&apos;t replicate</h2>
          <p>
            I didn&apos;t try to replicate the no-code builder nature of Power Apps. It would be a
            significant additional effort (infrastructure to deploy and run user-authored apps,
            isolation and security concerns, a runtime to maintain), and mostly because creating a
            new sub-app inside this monorepo is standardized enough that Devin can extend the
            platform from existing patterns, like scaffold generator, fixed package boundaries, the
            kernel pipeline, house rules in the repo.
          </p>
          <p>
            Any user, technical or not, can explain their requirements in detail and ask Devin to
            plan and implement the app as reviewable code, under the same compliance guarantees as
            everything else, and with the preview environment on every PR, they can assess before
            pushing anything to prod.
          </p>
        </div>
        <h2 className="mt-8 mb-4 text-lg font-semibold">Platform overview</h2>
        <img
          src="/docs/architecture/assets/platform-overview.svg"
          alt="Platform architecture diagram"
          className="w-full rounded-lg border bg-white p-2"
        />
        <h2 className="mt-8 mb-4 text-lg font-semibold">Repository structure</h2>
        <pre className="bg-muted overflow-x-auto rounded-lg border p-4 font-mono text-sm leading-relaxed">
          {repoTree}
        </pre>
      </article>
    </div>
  );
}
