import { ClerkProvider, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { hasRole } from "@repo/core";
import { Toaster } from "@repo/ui";

import { NotificationBell } from "@/components/notification-bell";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import { getSessionUser } from "@/lib/actor";
import { getNotificationsForUser } from "@/lib/notifications";
import { apps } from "@/lib/apps";

import "./globals.css";

export const metadata: Metadata = {
  title: "Internal Tools",
  description: "Internal tools platform",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    return (
      <html lang="en">
        <body className="min-h-screen antialiased">
          <ClerkProvider>{children}</ClerkProvider>
        </body>
      </html>
    );
  }

  const { items: notificationItems, unreadCount } = await getNotificationsForUser(user.id);

  const navItems: NavItem[] = [
    { href: "/", label: "Home" },
    ...apps
      .filter((app) => hasRole(user, app.requiredRole))
      .map((app) => ({ href: app.basePath, label: app.name })),
    ...(hasRole(user, "admin") ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ClerkProvider>
          <div className="flex min-h-screen">
            <aside className="bg-sidebar border-sidebar-border fixed inset-y-0 flex w-60 flex-col border-r">
              <div className="px-5 py-5">
                <div className="text-sidebar-foreground text-sm font-semibold tracking-wide">
                  Internal Tools
                </div>
                <div className="text-sidebar-foreground/50 text-xs">fintech ops platform</div>
              </div>
              <div className="flex-1 px-2">
                <SidebarNav items={navItems} />
              </div>
              <div className="border-sidebar-border flex items-center gap-3 border-t px-4 py-3">
                <UserButton />
                <NotificationBell notifications={notificationItems} unreadCount={unreadCount} />
                <div className="min-w-0">
                  <div className="text-sidebar-foreground truncate text-sm font-medium">
                    {user.name}
                  </div>
                  <div className="text-sidebar-foreground/50 truncate text-xs">
                    {user.roles.join(", ") || "no roles"}
                  </div>
                </div>
              </div>
            </aside>
            <main className="ml-60 flex-1 px-8 py-8">{children}</main>
          </div>
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
