import type { Metadata } from "next";
import type { ReactNode } from "react";

import { hasRole } from "@repo/core";
import { Toaster } from "@repo/ui";

import { PersonaSwitcher } from "@/components/persona-switcher";
import { SidebarNav, type NavItem } from "@/components/sidebar-nav";
import { getPersona } from "@/lib/actor";
import { apps } from "@/lib/apps";
import { personas } from "@/lib/personas";

import "./globals.css";

export const metadata: Metadata = {
  title: "Internal Tools",
  description: "Internal tools platform",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const persona = await getPersona();
  const navItems: NavItem[] = [
    { href: "/", label: "Home" },
    ...apps
      .filter((app) => hasRole(persona, app.requiredRole))
      .map((app) => ({ href: app.basePath, label: app.name })),
  ];

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
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
            <div className="border-sidebar-border border-t p-2">
              <PersonaSwitcher personas={personas} current={persona} />
            </div>
          </aside>
          <main className="ml-60 flex-1 px-8 py-8">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
