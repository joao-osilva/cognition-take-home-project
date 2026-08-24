import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { hasRole } from "@repo/core";
import { Toaster } from "@repo/ui";

import { AppShell } from "@/components/app-shell";
import { NotificationBell } from "@/components/notification-bell";
import type { NavItem } from "@/components/sidebar-nav";
import { getSessionUser } from "@/lib/actor";
import { getNotificationsForUser } from "@/lib/notifications";
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

  const { items: notificationItems, unreadCount } = await getNotificationsForUser(user.id);

  const visibleApps = apps.filter((app) => hasRole(user, app.requiredRole));
  const isAdmin = hasRole(user, "admin");
  const navItems: NavItem[] = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/inbox", label: "Inbox", icon: "inbox", badge: unreadCount || undefined },
    ...visibleApps.map((app, i) => ({
      href: app.basePath,
      label: app.name,
      icon: app.id,
      separator: i === 0,
    })),
    ...(isAdmin
      ? [
          { href: "/audit", label: "Audit", icon: "audit", separator: true },
          { href: "/admin", label: "Admin", icon: "admin" },
        ]
      : []),
  ];

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontClasses} min-h-screen antialiased`}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <ClerkProvider>
            <AppShell
              navItems={navItems}
              userName={user.name}
              userRoles={user.roles}
              bell={
                <NotificationBell notifications={notificationItems} unreadCount={unreadCount} />
              }
            >
              {children}
            </AppShell>
            <Toaster />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
