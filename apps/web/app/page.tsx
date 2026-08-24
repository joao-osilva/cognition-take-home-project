import { ArrowUpRight, Flag, Receipt, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { hasRole } from "@repo/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
} from "@repo/ui";

import { getSessionUser } from "@/lib/actor";
import { apps } from "@/lib/apps";

const APP_ICONS: Record<string, LucideIcon> = {
  kyc: ShieldCheck,
  refunds: Receipt,
  flags: Flag,
};

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
        {visibleApps.map((app) => {
          const Icon = APP_ICONS[app.id];
          return (
            <Link
              key={app.id}
              href={app.basePath}
              className="focus-visible:ring-ring group rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <Card className="hover:border-primary/40 h-full transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  {Icon ? (
                    <div className="bg-primary/10 text-primary mb-2 flex size-9 items-center justify-center rounded-lg">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </div>
                  ) : null}
                  <CardTitle>{app.name}</CardTitle>
                  <CardDescription>{app.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground group-hover:text-primary flex items-center gap-1 text-sm transition-colors">
                  Open
                  <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {visibleApps.length === 0 ? (
        <EmptyState
          title="Your role has no app access"
          hint="Ask an admin to assign you a role in the Admin console."
        />
      ) : null}
    </div>
  );
}
