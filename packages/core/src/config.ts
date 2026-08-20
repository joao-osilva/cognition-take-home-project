import { eq } from "drizzle-orm";

import { platformSchema, type Db } from "@repo/db";

export async function getConfig<T>(db: Db, key: string, fallback: T): Promise<T> {
  const rows = await db
    .select()
    .from(platformSchema.appConfig)
    .where(eq(platformSchema.appConfig.key, key))
    .limit(1);
  const row = rows[0];
  return row ? (row.value as T) : fallback;
}
