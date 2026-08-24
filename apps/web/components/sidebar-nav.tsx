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
                "relative flex items-center gap-2.5 rounded-full px-3.5 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              {Icon ? <Icon className="size-4 shrink-0" strokeWidth={1.75} /> : null}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold",
                    active
                      ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                      : "bg-sidebar-primary text-sidebar-primary-foreground",
                  )}
                >
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
