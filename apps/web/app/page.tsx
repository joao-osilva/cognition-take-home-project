import Link from "next/link";

import { hasRole } from "@repo/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from "@repo/ui";

import { getSessionUser } from "@/lib/actor";
import { apps } from "@/lib/apps";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) return null;
  const visibleApps = apps.filter((app) => hasRole(user, app.requiredRole));

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Tools available to your role"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleApps.map((app) => (
          <Link key={app.id} href={app.basePath}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{app.name}</CardTitle>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">Open →</CardContent>
            </Card>
          </Link>
        ))}
        {visibleApps.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Your role has no app access. Ask an admin to assign you a role.
          </p>
        ) : null}
      </div>
    </div>
  );
}
