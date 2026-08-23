import { hasRole, queryAuditLog } from "@repo/core";
import {
  Badge,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { NoAccess } from "@/lib/guard";

import { AuditFilters } from "./filters";
import { Pagination } from "./pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getActor();
  if (!hasRole(actor, "admin")) return <NoAccess />;

  const params = await searchParams;
  const actorId = first(params["actor"]);
  const entityType = first(params["entity"]);
  const search = first(params["q"]);
  const page = Math.max(Number(first(params["page"]) ?? "1") || 1, 1);

  const result = await queryAuditLog(getDb(), {
    actorId,
    entityType,
    search,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(Math.ceil(result.total / PAGE_SIZE), 1);

  return (
    <div>
      <PageHeader
        title="Audit"
        description="Every mutation and sensitive read across all apps, in one immutable trail"
      />
      <AuditFilters
        actors={result.actors}
        entityTypes={result.entityTypes}
        current={{ actor: actorId, entity: entityType, q: search }}
      />
      <div className="mt-4 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                  No audit events match the current filters
                </TableCell>
              </TableRow>
            ) : (
              result.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                    {row.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.actorName ?? row.actorId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {row.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-56 truncate font-mono text-xs">
                    {row.entityType} · {row.entityId}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-72 truncate text-xs">
                    {row.metadata ? JSON.stringify(row.metadata) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={result.total} />
    </div>
  );
}
