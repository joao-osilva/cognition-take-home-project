import { eq } from "@repo/db/orm";

import { platformSchema, type Db } from "@repo/db";

export interface ConfigEntry {
  key: string;
  value: unknown;
  updatedBy: string;
  updatedByName: string | null;
  updatedAt: Date;
}

export async function listConfig(db: Db): Promise<ConfigEntry[]> {
  const { appConfig, users } = platformSchema;
  const rows = await db
    .select({ entry: appConfig, updatedByName: users.name })
    .from(appConfig)
    .leftJoin(users, eq(appConfig.updatedBy, users.id))
    .orderBy(appConfig.key);
  return rows.map(({ entry, updatedByName }) => ({ ...entry, updatedByName }));
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
