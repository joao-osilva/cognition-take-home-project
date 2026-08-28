import { readFile } from "node:fs/promises";
import path from "node:path";

import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader, cn } from "@repo/ui";

import { getSessionUser } from "@/lib/actor";

import { Markdown } from "./markdown";

export const dynamic = "force-dynamic";

const DOCS: { slug: string; title: string; file: string }[] = [
  { slug: "components", title: "System components", file: "components.md" },
  { slug: "web-architecture", title: "Web architecture", file: "web-architecture.md" },
  { slug: "data-model", title: "Data model", file: "data-model.md" },
  { slug: "approval-engine", title: "Approval engine", file: "approval-engine.md" },
  { slug: "role-model", title: "Role model", file: "role-model.md" },
  { slug: "engineering-workflow", title: "Engineering workflow", file: "engineering-workflow.md" },
  { slug: "devin-sdlc", title: "Devin SDLC", file: "devin-sdlc.md" },
  { slug: "target-components", title: "Target components", file: "target-components.md" },
  { slug: "known-gaps", title: "Known gaps", file: "known-gaps.md" },
];

export default async function ArchitecturePage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const params = await searchParams;
  const active = DOCS.find((doc) => doc.slug === (params.doc ?? DOCS[0]?.slug));
  if (!active) notFound();

  const filePath = path.join(process.cwd(), "..", "..", "docs", "architecture", active.file);
  const source = await readFile(filePath, "utf8");

  return (
    <div>
      <PageHeader
        title="Architecture"
        description="How the platform is put together — the design records that govern every change."
      />
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav aria-label="Architecture documents" className="shrink-0 lg:w-56">
          <ul className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {DOCS.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/docs/architecture?doc=${doc.slug}`}
                  aria-current={doc.slug === active.slug ? "page" : undefined}
                  className={cn(
                    "block rounded-full px-3.5 py-2 text-sm transition-colors duration-150",
                    doc.slug === active.slug
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="bg-card min-w-0 flex-1 rounded-lg border p-6 shadow-xs md:p-8">
          <Markdown source={source} />
        </article>
      </div>
    </div>
  );
}
