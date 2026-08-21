import { eq } from "@repo/db/orm";

import { platformSchema, type Db } from "@repo/db";

export interface ConfigEntry {
  key: string;
  value: unknown;
  updatedBy: string;
  updatedAt: Date;
}

export async function listConfig(db: Db): Promise<ConfigEntry[]> {
  return db.select().from(platformSchema.appConfig).orderBy(platformSchema.appConfig.key);
}

export async function setConfig(
  db: Db,
  key: string,
  value: unknown,
  updatedBy: string,
): Promise<void> {
  await db
    .insert(platformSchema.appConfig)
    .values({ key, value, updatedBy, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: platformSchema.appConfig.key,
      set: { value, updatedBy, updatedAt: new Date() },
    });
}

export async function getConfig<T>(db: Db, key: string, fallback: T): Promise<T> {
  const rows = await db
    .select()
    .from(platformSchema.appConfig)
    .where(eq(platformSchema.appConfig.key, key))
    .limit(1);
  const row = rows[0];
  return row ? (row.value as T) : fallback;
}
