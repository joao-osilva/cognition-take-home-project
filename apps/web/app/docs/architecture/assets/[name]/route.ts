import { readFile } from "node:fs/promises";
import path from "node:path";

import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/actor";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const user = await getSessionUser();
  if (!user) notFound();

  const { name } = await params;
  if (!/^[a-z0-9-]+\.svg$/.test(name)) notFound();

  const filePath = path.join(process.cwd(), "..", "..", "docs", "architecture", name);
  let body: Buffer;
  try {
    body = await readFile(filePath);
  } catch {
    notFound();
  }

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "private, max-age=300",
    },
  });
}
