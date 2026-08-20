#!/usr/bin/env node
// pnpm gen:app <id> [--name "Display Name"]
// Scaffolds a self-contained app package plus the thin host route.
import fs from "node:fs";
import path from "node:path";

const [, , id, ...rest] = process.argv;
if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error('Usage: pnpm gen:app <id> [--name "Display Name"]');
  process.exit(1);
}

const nameFlag = rest.indexOf("--name");
const displayName =
  nameFlag !== -1 && rest[nameFlag + 1]
    ? rest[nameFlag + 1]
    : id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const pascal = id.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
const root = path.resolve(import.meta.dirname, "../../..");
const pkgDir = path.join(root, "packages/apps", id);
const routeDir = path.join(root, "apps/web/app", id);

if (fs.existsSync(pkgDir)) {
  console.error(`Package already exists: ${pkgDir}`);
  process.exit(1);
}

const files = {
  [path.join(pkgDir, "package.json")]: `${JSON.stringify(
    {
      name: `@repo/app-${id}`,
      version: "0.0.0",
      private: true,
      type: "module",
      exports: {
        ".": "./src/index.ts",
        "./schema": "./src/schema.ts",
        "./screens": "./src/screens/index.tsx",
      },
      scripts: { lint: "eslint src", typecheck: "tsc --noEmit" },
      dependencies: {
        "@repo/core": "workspace:*",
        "@repo/db": "workspace:*",
        "@repo/ui": "workspace:*",
        "drizzle-orm": "^0.38.3",
        zod: "^3.24.1",
      },
      peerDependencies: { react: "^19.0.0" },
      devDependencies: {
        "@repo/config": "workspace:*",
        "@types/react": "^19.0.2",
        eslint: "^9.17.0",
        react: "^19.0.0",
        typescript: "^5.7.2",
      },
    },
    null,
    2,
  )}\n`,
  [path.join(pkgDir, "tsconfig.json")]: `${JSON.stringify(
    { extends: "@repo/config/tsconfig/react-library.json", include: ["src"] },
    null,
    2,
  )}\n`,
  [path.join(pkgDir, "src/schema.ts")]: `// Schema slice owned by the ${id} app.
// Add pgTable definitions here; drizzle-kit in packages/db aggregates them.
export {};
`,
  [path.join(pkgDir, "src/meta.ts")]: `import type { Role } from "@repo/core";

export const ${pascal.charAt(0).toLowerCase() + pascal.slice(1)}AppMeta = {
  id: "${id}",
  name: "${displayName}",
  description: "TODO: describe this app",
  basePath: "/${id}",
  requiredRole: "admin" satisfies Role, // TODO: add ${id}:operator / ${id}:approver roles
} as const;
`,
  [path.join(pkgDir, "src/screens/index.tsx")]: `import { Card, PageHeader } from "@repo/ui";

export function ${pascal}Screen() {
  return (
    <div>
      <PageHeader title="${displayName}" />
      <Card>TODO: implement ${displayName}.</Card>
    </div>
  );
}
`,
  [path.join(pkgDir, "src/index.ts")]: `export { ${
    pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }AppMeta } from "./meta";
export * as ${pascal.charAt(0).toLowerCase() + pascal.slice(1)}Schema from "./schema";
`,
  [path.join(routeDir, "page.tsx")]: `import { ${pascal}Screen } from "@repo/app-${id}/screens";

export default function ${pascal}Page() {
  return <${pascal}Screen />;
}
`,
};

for (const [file, content] of Object.entries(files)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`created ${path.relative(root, file)}`);
}

console.log(`
Next steps:
1. Add the app to apps/web/lib/apps.ts
2. Add "@repo/app-${id}": "workspace:*" to apps/web/package.json and to transpilePackages in next.config.ts
3. Define roles in packages/core/src/rbac.ts if the app needs its own
4. pnpm install && pnpm db:generate after adding schema tables
`);
