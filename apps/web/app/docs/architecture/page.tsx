import { Download } from "lucide-react";

import { Button, PageHeader } from "@repo/ui";

import { getSessionUser } from "@/lib/actor";

import { overviewSections, repoTree } from "./content";

export const dynamic = "force-dynamic";

export default async function ArchitecturePage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="Architecture"
        description="A high-level view of the platform and the services it runs on."
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href="/docs/architecture/pdf" download>
              <Download className="size-4" />
              Download PDF
            </a>
          </Button>
        }
      />
      <article className="bg-card rounded-lg border p-6 shadow-xs md:p-8">
        <div className="text-foreground/90 space-y-4 text-sm leading-relaxed">
          {overviewSections.map((section, i) => (
            <section key={section.title} className="space-y-4">
              <h2 className={`text-foreground text-lg font-semibold ${i > 0 ? "mt-8" : ""}`}>
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </section>
          ))}
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
