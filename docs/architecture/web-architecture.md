# Web Architecture Decision

**Decision: Option A — a single Next.js app with file-based routes in the host, domain logic in self-contained packages, and generator-assisted scaffolding.**

## Context

Power Apps acts as a "marketplace": a portal hosting many apps on shared infrastructure (auth, roles, audit, notifications). Our platform must make "create a new internal app" a cheap, repeatable journey for the engineering team. Constraints already agreed: TypeScript everywhere, pnpm + Turborepo monorepo, single Next.js app deployed on Vercel.

## Options considered

| Option                                                 | Shape                                                                                                     | Verdict            |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------ |
| **A. Single app, file-based routes + domain packages** | Pages live in the host (`apps/web`), domain logic in `packages/apps/*`                                    | **Chosen**         |
| B. Manifest + registry                                 | Apps export a typed `AppManifest`; host uses a catch-all route + registry to auto-wire launcher/nav/roles | Runner-up          |
| C. DB-driven marketplace                               | Apps registered/enabled at runtime from the admin UI; dynamic loading                                     | Rejected           |
| D. Next.js app per tool                                | Each tool is its own Vercel deployment + a portal app                                                     | Rejected (for now) |

## Why A

- **Most native to the stack, least customization owned.** Pure file-based routing, layouts, per-route code-splitting, standard middleware — Next.js/Vercel's paved road. Option B introduces a catch-all router + registry framework we'd own and that fights Next.js ergonomics (dynamic imports for code-splitting, server actions in transpiled packages). Option C is rebuilding the platform we declined to buy. Option D multiplies Vercel projects, Clerk configs, env vars, and monitoring for isolation that buys nothing at one-team/3-tools scale.
- **Encapsulation still comes from packages.** Each app is a self-contained package (domain logic, schema slice, server actions, Inngest functions, seed data); the host contains only thin route files that compose package exports with the shared shell.
- **The manual-wiring weakness of A is solved by a generator, not a runtime framework.** `pnpm gen:app <id>` scaffolds both the package and the host route stubs (pages, nav entry, role mapping, Inngest registration), eliminating the "6 scattered edits" failure mode while keeping everything native.

## Repo layout

```
apps/web/                       # host: routes, shell, platform screens
  app/
    page.tsx                    # launcher/home
    kyc/  refunds/  flags/      # thin route files importing package screens
    admin/  audit/  notifications/
    api/inngest/route.ts        # registers all packages' functions
  middleware.ts                 # auth + role checks per path
packages/
  core/                         # kernel: RBAC/SoD policies, audit writer,
                                #   approval state machine, notification service
  db/                           # Drizzle schema, migrations, seed, Neon client
  ui/                           # shadcn-based component kit
  config/                       # shared tsconfig/eslint presets
  apps/kyc/                     # self-contained domain packages:
  apps/refunds/                 #   screens, actions, domain logic,
  apps/flags/                   #   schema slice, seed, inngest functions
tooling/generators/app/         # `pnpm gen:app <id>` scaffold
```

## Design system

`packages/ui` carries the visual identity on top of shadcn/ui: warm cream neutrals with an ink-black primary and pill-shaped buttons (light + dark themes via `next-themes`), Inter/Geist Mono (mono for money, IDs, timestamps), and shared primitives — `StatusBadge` (semantic tones + dot indicator), `StatCard`, `EmptyState`, `Skeleton`, `PageHeader` (with breadcrumbs), `AuditTrail` timeline, and date formatters. The host provides the responsive shell (`AppShell`): warm-neutral sidebar (a deeper cream shade than the content area) with icons and an ink pill for the active item on desktop, sheet navigation on mobile, sticky header with notification bell and theme toggle. Apps compose these primitives instead of styling ad hoc.

## New-app journey (end-to-end)

1. `pnpm gen:app <id>` — scaffolds `packages/apps/<id>` + host route stubs + nav/role entries
2. Implement inside the package: schema slice, domain logic through the kernel (RBAC, audit, approvals come free), screens composed from `@repo/ui`
3. Open a PR — a task shaped for Devin end-to-end
4. Vercel preview deploy (+ Neon branch) for review
5. Merge → tool appears in the launcher for permitted roles

## Revisit triggers

- **A → D** if tool ownership spreads across many teams needing independent deploy cadences — migration is cheap because domain logic already lives in packages.
- **A → B** if the number of apps grows enough that host-side wiring (even generated) becomes a maintenance burden.
