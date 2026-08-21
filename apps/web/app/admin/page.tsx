import { hasRole, listConfig } from "@repo/core";
import { PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";

import { getActor } from "@/lib/actor";
import { listClerkUsers } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { NoAccess } from "@/lib/guard";

import { setUserRolesAction, updateConfigAction } from "./actions";
import { ConfigTable } from "./config-table";
import { UsersTable } from "./users-table";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const actor = await getActor();
  if (!hasRole(actor, "admin")) return <NoAccess />;

  const [users, config] = await Promise.all([listClerkUsers(), listConfig(getDb())]);

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Manage user roles and platform configuration — every change is audited"
      />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTable users={users} onSetRoles={setUserRolesAction} />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <ConfigTable
            entries={config.map((entry) => ({
              key: entry.key,
              valueJson: JSON.stringify(entry.value),
              updatedBy: entry.updatedBy,
              updatedAt: entry.updatedAt.toISOString().slice(0, 16).replace("T", " "),
            }))}
            onUpdate={updateConfigAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
