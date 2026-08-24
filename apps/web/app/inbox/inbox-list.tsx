"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Badge, Button, cn, toast } from "@repo/ui";

import { markNotificationsReadAction } from "@/app/notifications/actions";

export interface InboxItem {
  id: string;
  type: string;
  message: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export function InboxList({ items }: { items: InboxItem[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function markRead(ids?: string[]) {
    startTransition(async () => {
      const result = await markNotificationsReadAction(ids);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  const hasUnread = items.some((item) => !item.read);

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Notifications</span>
        {hasUnread && (
          <Button variant="ghost" size="sm" onClick={() => markRead()} disabled={isPending}>
            Mark all read
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground px-4 py-10 text-center text-sm">
          Nothing here — you're all caught up
        </p>
      ) : (
        <ul className="divide-y">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn("flex items-start gap-3 px-4 py-3", !item.read && "bg-accent/40")}
            >
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  item.read ? "bg-transparent" : "bg-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{item.message}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {item.type}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{item.createdAt}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {item.href && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={item.href}>Open</Link>
                  </Button>
                )}
                {!item.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => markRead([item.id])}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
