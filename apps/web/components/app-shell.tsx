"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@repo/ui";

import { SidebarNav, type NavGroup } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="bg-sidebar-primary flex size-7 shrink-0 items-center justify-center rounded-full">
        <Zap className="text-sidebar-primary-foreground size-4" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-sidebar-foreground truncate text-sm font-semibold tracking-tight">
          Internal Tools
        </div>
        <div className="text-sidebar-foreground/50 truncate text-[11px]">fintech ops platform</div>
      </div>
    </div>
  );
}

export function AppShell({
  navGroups,
  userName,
  userRoles,
  bell,
  children,
}: {
  navGroups: NavGroup[];
  userName: string;
  userRoles: string[];
  bell: ReactNode;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarBody = (
    <>
      <Brand />
      <div className="flex-1 overflow-y-auto px-3">
        <SidebarNav groups={navGroups} onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="border-sidebar-border flex items-center gap-3 border-t px-4 py-3">
        <UserButton />
        <div className="min-w-0 flex-1">
          <div className="text-sidebar-foreground truncate text-sm font-medium">{userName}</div>
          <div className="text-sidebar-foreground/50 truncate text-xs">
            {userRoles.join(", ") || "no roles"}
          </div>
        </div>
        <ThemeToggle />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 z-30 hidden w-60 flex-col border-r md:flex">
        {sidebarBody}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col md:ml-60">
        <header className="bg-background/80 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4 backdrop-blur md:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation"
                className="hover:bg-accent -ml-1 flex size-9 items-center justify-center rounded-md transition-colors md:hidden"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar flex w-72 flex-col gap-0 border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebarBody}
            </SheetContent>
          </Sheet>
          <div className="flex-1" />
          {bell}
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
