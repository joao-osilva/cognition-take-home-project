"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge, Button, Popover, PopoverContent, PopoverTrigger, cn, toast } from "@repo/ui";

import { markNotificationsReadAction } from "@/app/notifications/actions";

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function markAllRead() {
    startTransition(async () => {
      const result = await markNotificationsReadAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="text-muted-foreground hover:bg-accent hover:text-foreground relative flex size-9 items-center justify-center rounded-md transition-colors duration-150"
        >
          <Bell className="size-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} disabled={isPending}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">
              No notifications yet
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id} className={cn("px-4 py-3", !n.read && "bg-accent/40")}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />}
                    <div className="min-w-0">
                      <p className="text-sm">{n.message}</p>
                      <p className="text-muted-foreground text-xs">{n.createdAt}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t px-4 py-2 text-center">
          <Link
            href="/inbox"
            className="text-primary text-sm hover:underline"
            onClick={() => setOpen(false)}
          >
            View all in Inbox
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
