import { queryNotifications } from "@repo/core";
import { PageHeader } from "@repo/ui";

import { getActor } from "@/lib/actor";
import { getDb } from "@/lib/db";
import { formatMessage, notificationHref } from "@/lib/notifications";

import { InboxFilters } from "./filters";
import { InboxList } from "./inbox-list";
import { Pagination } from "../audit/pagination";

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
    type: n.type,
    message: formatMessage(n),
    href: notificationHref(n),
    read: n.readAt !== null,
    createdAt: n.createdAt.toLocaleString("en-US"),
  }));

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Everything the platform has notified you about — track, filter, and jump to the work"
      />
      <InboxFilters types={result.types} current={{ status, type }} />
      <div className="mt-4">
        <InboxList items={items} />
      </div>
      <Pagination page={page} totalPages={totalPages} total={result.total} />
    </div>
  );
}
