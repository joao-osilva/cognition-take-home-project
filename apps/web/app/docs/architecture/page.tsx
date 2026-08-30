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
        <h2 className="mb-4 text-lg font-semibold">Platform overview</h2>
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
