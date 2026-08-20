import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { removeUser, upsertUser } from "@repo/core";

import { getDb } from "@/lib/db";

// Keeps the platform `users` mirror table in sync with Clerk so FKs and audit
// joins work without API calls. Roles stay in Clerk publicMetadata.
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Verification failed", { status: 400 });
  }

  const db = getDb();

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, external_id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses[0]?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || email;
    await upsertUser(db, { id: external_id ?? id, email, name });
  }

  if (evt.type === "user.deleted" && evt.data.id) {
    await removeUser(db, evt.data.id);
  }

  return new Response("OK", { status: 200 });
}
