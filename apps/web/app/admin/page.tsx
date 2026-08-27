import { hasRole, listApiKeys, listConfig } from "@repo/core";
import { PageHeader, Tabs, TabsContent, TabsList, TabsTrigger, formatDateTime } from "@repo/ui";

import { Pagination } from "@/components/pagination";
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

const PAGE_SIZE = 25;

function pageOf(value: string | undefined): number {
  return Math.max(Number(value ?? "1") || 1, 1);
}

function paginate<T>(rows: T[], page: number): { rows: T[]; totalPages: number } {
  return {
    rows: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    totalPages: Math.max(Math.ceil(rows.length / PAGE_SIZE), 1),
  };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ usersPage?: string; configPage?: string; keysPage?: string }>;
}) {
  const actor = await getActor();
  if (!hasRole(actor, "admin")) return <NoAccess />;

  const [users, config, apiKeys] = await Promise.all([
    listClerkUsers(),
    listConfig(getDb()),
    listApiKeys(getDb()),
  ]);

  const params = await searchParams;
  const usersPage = pageOf(params.usersPage);
  const configPage = pageOf(params.configPage);
  const keysPage = pageOf(params.keysPage);
  const pagedUsers = paginate(users, usersPage);
  const pagedConfig = paginate(config, configPage);
  const pagedKeys = paginate(apiKeys, keysPage);

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
          <UsersTable users={pagedUsers.rows} onSetRoles={setUserRolesAction} />
          <Pagination
            page={usersPage}
            totalPages={pagedUsers.totalPages}
            total={users.length}
            noun="user"
            paramName="usersPage"
          />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <ConfigTable
            entries={pagedConfig.rows.map((entry) => ({
              key: entry.key,
              valueJson: JSON.stringify(entry.value),
              updatedBy: entry.updatedByName ?? entry.updatedBy,
              updatedAt: formatDateTime(entry.updatedAt),
            }))}
            onUpdate={updateConfigAction}
          />
          <Pagination
            page={configPage}
            totalPages={pagedConfig.totalPages}
            total={config.length}
            noun="entry"
            nounPlural="entries"
            paramName="configPage"
          />
        </TabsContent>
        <TabsContent value="api-keys" className="mt-4">
          <ApiKeysTable
            keys={pagedKeys.rows.map((key) => ({
              id: key.id,
              name: key.name,
              prefix: key.prefix,
              createdBy: key.createdByName ?? key.createdBy,
              createdAt: formatDate(key.createdAt) ?? "",
              lastUsedAt: formatDate(key.lastUsedAt),
              revokedAt: formatDate(key.revokedAt),
            }))}
            onCreate={createApiKeyAction}
            onRevoke={revokeApiKeyAction}
          />
          <Pagination
            page={keysPage}
            totalPages={pagedKeys.totalPages}
            total={apiKeys.length}
            noun="key"
            paramName="keysPage"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
