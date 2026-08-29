import { PageHeader } from "@repo/ui";

import { getSessionUser } from "@/lib/actor";

export const dynamic = "force-dynamic";

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
        <img
          src="/docs/architecture/assets/platform-overview.svg"
          alt="Platform architecture diagram"
          className="w-full rounded-lg border bg-white p-2"
        />
      </article>
    </div>
  );
}
