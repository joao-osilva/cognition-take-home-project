export interface OverviewSection {
  title: string;
  paragraphs: string[];
}

export const overviewSections: OverviewSection[] = [
  {
    title: "Approach",
    paragraphs: [
      "I leveraged no-ops solutions for most of the components, services that could provide the functionality needed off the shelf without having to build internals and too much boilerplate. The idea is to provide a standardized way for engineers to quickly build new apps while leveraging existing structure (framework, packages, auth, CI/CD, observability), which relieves the burden of maintaining multiple apps.",
      "The obvious cost is vendor dependence and usage-based pricing, but the TCO (total cost of ownership) is still lower than just spinning up everything and managing the infra.",
    ],
  },
  {
    title: "Stack",
    paragraphs: [
      "The stack uses Vercel as central point, not only for deploying the Next.js project but also managing the integrations with Neon (serverless Postgres), Inngest (durable workflows) and Blob storage. Migrations run and Inngest functions re-sync as part of each deploy, so there is no separate release orchestration needed.",
      "For authn/authz I'm using Clerk, which gives social login and user management out of the box. I created custom roles per app in Clerk's user metadata, and mirror users into a local table via webhook so queries can join against them. Clerk supplies identity and role claims, but the per-app RBAC enforcement is ours, in the platform kernel.",
    ],
  },
  {
    title: "Monorepo",
    paragraphs: [
      "I'm using a monorepo with Turbo, a single web app (with routes per app) and packages for each individual app (kyc, refunds, flags) to encapsulate domain logic, plus core platform packages used across all of them (ui, db, core, config). App packages never import each other. If two apps need the same entity it gets promoted to the shared data layer.",
      "I considered one deployable per app, closer to how Power Apps isolates things, but that would increase complexity (N pipelines, N auth setups, N places to patch). The single host means a bad deploy touches every app, but for internal tools that's an inconvenience, not a customer incident, and preview deployments per PR (thanks to Vercel) catch most of it.",
    ],
  },
  {
    title: "Data model",
    paragraphs: [
      "The data model was thought in 3 tiers, to segregate core company entities which are cross-app (customers, transactions), platform internals (audit, approvals, notifications, users, config) and app-specific ones (kyc cases, refund requests, flags). Each app owns its schema slice, so a new app adds tables without breaking the platform or other apps.",
    ],
  },
  {
    title: "The kernel",
    paragraphs: [
      "The apps are basically screens plus operations that change state (claim a kyc case, request a refund, toggle a flag). Instead of each app implementing its own checks, every operation goes through a single helper in the core package, defineAction(): it checks who you are and your role, validates the input, runs the app's logic and writes the audit log. With multiple apps (and more coming) I didn't want auth, permissions and audit reimplemented per app, each slightly different. Apps also can't write to the platform tables directly, so there's no way to change state without leaving an audit trail.",
      "The kernel also owns the approval engine, since every app needed one (granting refunds, escalating kyc cases, enabling flags in production). One person requests, a different person approves, never their own request. Each app defines its approval policy in code and the engine enforces it, so it can't be bypassed by a different screen or client. Approvals snapshot the config values used at the time (e.g. the refund threshold) and every decision lands in the audit log, so an auditor can see who did what, when, and under which rules.",
    ],
  },
  {
    title: "What I didn't replicate",
    paragraphs: [
      "I didn't try to replicate the no-code builder nature of Power Apps. It would be a significant additional effort (infrastructure to deploy and run user-authored apps, isolation and security concerns, a runtime to maintain), and mostly because creating a new sub-app inside this monorepo is standardized enough that Devin can extend the platform from existing patterns, like scaffold generator, fixed package boundaries, the kernel pipeline, house rules in the repo.",
      "Any user, technical or not, can explain their requirements in detail and ask Devin to plan and implement the app as reviewable code, under the same compliance guarantees as everything else, and with the preview environment on every PR, they can assess before pushing anything to prod.",
    ],
  },
];

export const repoTree = `cognition-take-home-project/
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
