"use client";

import {
  Flag,
  House,
  Inbox,
  Receipt,
  ScrollText,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { cn } from "@repo/ui";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  separator?: boolean;
}

const ICONS: Record<string, LucideIcon> = {
  home: House,
  inbox: Inbox,
  kyc: ShieldCheck,
  refunds: Receipt,
  flags: Flag,
  audit: ScrollText,
  admin: Settings,
};

export function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = ICONS[item.icon];
        return (
          <Fragment key={item.href}>
            {item.separator ? <div className="bg-sidebar-border mx-3 my-2 h-px" /> : null}
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              {active ? (
                <span className="bg-sidebar-primary absolute inset-y-1.5 left-0 w-0.5 rounded-full" />
              ) : null}
              {Icon ? (
                <Icon
                  className={cn("size-4 shrink-0", active && "text-sidebar-primary")}
                  strokeWidth={1.75}
                />
              ) : null}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <span className="bg-sidebar-primary text-sidebar-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}
