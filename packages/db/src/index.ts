import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";

export type Db = PgDatabase<PgQueryResultHKT>;

function isNeonUrl(url: string): boolean {
  return new URL(url).hostname.endsWith(".neon.tech");
}

// Neon's HTTP driver for Neon databases; node-postgres for any other Postgres
// (local dev, Docker).
export function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (isNeonUrl(url)) {
    return drizzleNeon(neon(url)) as unknown as Db;
  }
  return drizzlePg(new Pool({ connectionString: url })) as unknown as Db;
}

export * as coreSchema from "./schema/core";
export * as platformSchema from "./schema/platform";
