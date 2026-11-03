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
      "For authn/authz I'm using Clerk, which gives social login and user management out of the box. I created custom roles per app in Clerk's user metadata.",
    ],
  },
  {
    title: "Repo structure",
    paragraphs: [
      "I'm using a monorepo with Turbo, a single web app (with routes per app) and packages for each individual app (kyc, refunds, flags) to encapsulate domain logic, plus core platform packages used across all of them (ui, db, core, config).",
      "I considered one deployable per app, closer to how Power Apps isolates things, but that would increase complexity (N pipelines, N auth setups, N places to patch). The single host means a bad deploy touches every app, but for internal tools that's an inconvenience and preview deployments per PR (thanks to Vercel) catch most of it.",
    ],
  },
  {
    title: "Data model",
    paragraphs: [
      "The data model was thought in 3 tiers, to segregate core company entities which are cross-app (customers, transactions), platform internals (audit, approvals, notifications, users, config) and app-specific ones (kyc cases, refund requests, flags). Each app owns its schema slice, so a new app adds tables without breaking the platform or other apps.",
    ],
  },
  {
    title: "Platform core",
    paragraphs: [
      "The apps are basically screens plus operations that change state (claim a kyc case, request a refund, toggle a flag). Instead of each app implementing its own checks, every operation goes through a single helper in the core package, that checks who you are and your role, validates the input, runs the app's logic and writes the audit log. That way is consistent across apps.",
      "There is also an approval engine, since every app needed one (granting refunds, escalating kyc cases, enabling flags in production). Each app defines its approval policy in code and the engine enforces it. Every approval lands in the audit log, so it can be audited later.",
    ],
  },
  {
    title: "Known gaps",
    paragraphs: [
      "I didn't try to replicate the no-code builder nature of Power Apps. It would be a significant additional effort (infrastructure to deploy and run user-authored apps, isolation and security concerns, a runtime to maintain), and mostly because creating a new sub-app inside this monorepo is standardized enough that Devin can extend the platform from existing patterns, like scaffold generator, fixed package boundaries, house rules in the repo.",
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
├── tooling/
│   └── generators/          # gen:app scaffold for new app packages
├── docs/
│   ├── architecture/        # design records, diagrams (D2)
│   └── research/            # Power Apps research, functional requirements
├── AGENTS.md                # house rules every change must follow
├── Dockerfile               # web app image for local Docker setup
├── docker-compose.yml       # Postgres + web + Inngest dev server
├── turbo.json               # task pipeline
└── pnpm-workspace.yaml      # workspace globs`;
