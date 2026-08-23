import { createHash, randomBytes } from "node:crypto";

import { platformSchema, type Db } from "@repo/db";
import { and, desc, eq, isNull } from "@repo/db/orm";

// Kernel-owned service for machine-to-machine API keys. Keys are stored as
// SHA-256 hashes; the plaintext is returned once at creation and never again.

const KEY_BYTES = 24;
const KEY_PREFIX = "itk_";

export type ApiKey = typeof platformSchema.apiKeys.$inferSelect;

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): { key: string; keyHash: string; prefix: string } {
  const key = `${KEY_PREFIX}${randomBytes(KEY_BYTES).toString("hex")}`;
  return { key, keyHash: hashKey(key), prefix: key.slice(0, KEY_PREFIX.length + 6) };
}

export async function insertApiKey(
  db: Db,
  values: { name: string; keyHash: string; prefix: string; createdBy: string },
): Promise<{ id: string }> {
  const rows = await db
    .insert(platformSchema.apiKeys)
    .values(values)
    .returning({ id: platformSchema.apiKeys.id });
  const row = rows[0];
  if (!row) throw new Error("Failed to create API key");
  return row;
}

export async function revokeApiKeyById(db: Db, id: string): Promise<void> {
  const rows = await db
    .update(platformSchema.apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(platformSchema.apiKeys.id, id), isNull(platformSchema.apiKeys.revokedAt)))
    .returning({ id: platformSchema.apiKeys.id });
  if (rows.length === 0) throw new Error("Key not found or already revoked");
}

export async function listApiKeys(db: Db): Promise<ApiKey[]> {
  return db.select().from(platformSchema.apiKeys).orderBy(desc(platformSchema.apiKeys.createdAt));
}

/** Returns the active key row for a presented key, or null. Touches lastUsedAt. */
export async function verifyApiKey(db: Db, presentedKey: string): Promise<ApiKey | null> {
  if (!presentedKey.startsWith(KEY_PREFIX)) return null;
  const rows = await db
    .select()
    .from(platformSchema.apiKeys)
    .where(
      and(
        eq(platformSchema.apiKeys.keyHash, hashKey(presentedKey)),
        isNull(platformSchema.apiKeys.revokedAt),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  await db
    .update(platformSchema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(platformSchema.apiKeys.id, row.id));
  return row;
}
