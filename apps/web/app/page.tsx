import Link from "next/link";

import { hasRole } from "@repo/core";
import { Card } from "@repo/ui";

import { getActor } from "@/lib/actor";
import { apps } from "@/lib/apps";

export default async function HomePage() {
  const actor = await getActor();
  const visibleApps = apps.filter((app) => hasRole(actor, app.requiredRole));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Apps</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleApps.map((app) => (
          <Link key={app.id} href={app.basePath}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <h2 className="mb-1 font-medium">{app.name}</h2>
              <p className="text-sm text-zinc-500">{app.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
