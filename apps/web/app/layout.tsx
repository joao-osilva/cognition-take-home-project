import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { hasRole } from "@repo/core";
import { Toaster } from "@repo/ui";

import { AppShell } from "@/components/app-shell";
import type { NavGroup } from "@/components/sidebar-nav";
import { getSessionUser } from "@/lib/actor";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { apps } from "@/lib/apps";

import "./globals.css";

const interSans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Internal Tools",
  description: "Internal tools platform",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  const fontClasses = `${interSans.variable} ${geistMono.variable} font-sans`;

  if (!user) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${fontClasses} min-h-screen antialiased`}>
          <ThemeProvider attribute="class" disableTransitionOnChange>
            <ClerkProvider>{children}</ClerkProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  const unreadCount = await getUnreadNotificationCount(user.id);

  const visibleApps = apps.filter((app) => hasRole(user, app.requiredRole));
  const isAdmin = hasRole(user, "admin");
  const navGroups: NavGroup[] = [
    {
      label: "Workspace",
      items: [{ href: "/inbox", label: "Inbox", icon: "inbox", badge: unreadCount || undefined }],
    },
    ...(visibleApps.length > 0
      ? [
          {
            label: "Apps",
            items: visibleApps.map((app) => ({
              href: app.basePath,
              label: app.name,
              icon: app.id,
            })),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            label: "Settings",
            items: [
              { href: "/audit", label: "Audit", icon: "audit" },
              { href: "/admin", label: "Admin", icon: "admin" },
            ],
          },
        ]
      : []),
    {
      label: "Docs",
      items: [
        { href: "/docs/architecture", label: "Architecture", icon: "architecture" },
        { href: "/docs/tbd", label: "TBD", icon: "tbd" },
      ],
    },
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontClasses} min-h-screen antialiased`}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <ClerkProvider>
            <AppShell navGroups={navGroups} userName={user.name} userRoles={user.roles}>
              {children}
            </AppShell>
            <Toaster />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
