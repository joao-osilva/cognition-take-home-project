import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { apps } from "@/lib/apps";

import "./globals.css";

export const metadata: Metadata = {
  title: "Internal Tools",
  description: "Internal tools platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3 text-sm">
            <Link href="/" className="font-semibold">
              Internal Tools
            </Link>
            {apps.map((app) => (
              <Link key={app.id} href={app.basePath} className="text-zinc-600 hover:text-zinc-900">
                {app.name}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
