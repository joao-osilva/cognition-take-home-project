import { queryNotifications } from "@repo/core";
import { PageHeader, formatRelativeTime } from "@repo/ui";

import { Pagination } from "@/components/pagination";
import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { formatMessage, notificationHref, notificationTypeLabel } from "@/lib/notifications";

import { InboxFilters } from "./filters";
import { InboxList } from "./inbox-list";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getActor();
  const params = await searchParams;
  const status = first(params["status"]);
  const type = first(params["type"]);
  const page = Math.max(Number(first(params["page"]) ?? "1") || 1, 1);

  const result = await queryNotifications(getDb(), actor.id, {
    unreadOnly: status === "unread",
    type,
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(Math.ceil(result.total / PAGE_SIZE), 1);

  const items = result.rows.map((n) => ({
    id: n.id,
    type: notificationTypeLabel(n.type),
    message: formatMessage(n),
    href: notificationHref(n),
    read: n.readAt !== null,
    createdAt: formatRelativeTime(n.createdAt),
  }));

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Approvals, cases, and flag changes that need you land here. Open one to get to work."
      />
      <InboxFilters
        types={result.types.map((value) => ({ value, label: notificationTypeLabel(value) }))}
        current={{ status, type }}
      />
      <div className="mt-4">
        <InboxList items={items} />
      </div>
      <Pagination page={page} totalPages={totalPages} total={result.total} noun="notification" />
    </div>
  );
}
