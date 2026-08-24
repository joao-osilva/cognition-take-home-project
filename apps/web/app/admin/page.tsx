import { hasRole, listApiKeys, listConfig } from "@repo/core";
import { PageHeader, Tabs, TabsContent, TabsList, TabsTrigger, formatDateTime } from "@repo/ui";

import { getActor } from "@/lib/actor";
import { listClerkUsers } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { NoAccess } from "@/lib/guard";

import {
  createApiKeyAction,
  revokeApiKeyAction,
  setUserRolesAction,
  updateConfigAction,
} from "./actions";
import { ApiKeysTable } from "./api-keys-table";
import { ConfigTable } from "./config-table";
import { UsersTable } from "./users-table";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const actor = await getActor();
  if (!hasRole(actor, "admin")) return <NoAccess />;

  const [users, config, apiKeys] = await Promise.all([
    listClerkUsers(),
    listConfig(getDb()),
    listApiKeys(getDb()),
  ]);

  const formatDate = (date: Date | null) => (date ? formatDateTime(date) : null);

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
          <TabsTrigger value="api-keys">API keys</TabsTrigger>
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
              updatedAt: formatDateTime(entry.updatedAt),
            }))}
            onUpdate={updateConfigAction}
          />
        </TabsContent>
        <TabsContent value="api-keys" className="mt-4">
          <ApiKeysTable
            keys={apiKeys.map((key) => ({
              id: key.id,
              name: key.name,
              prefix: key.prefix,
              createdBy: key.createdBy,
              createdAt: formatDate(key.createdAt) ?? "",
              lastUsedAt: formatDate(key.lastUsedAt),
              revokedAt: formatDate(key.revokedAt),
            }))}
            onCreate={createApiKeyAction}
            onRevoke={revokeApiKeyAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
