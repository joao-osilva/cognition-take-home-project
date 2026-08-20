import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";

export type Db = PgDatabase<PgQueryResultHKT>;

function isLocalUrl(url: string): boolean {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1";
}

// Neon's HTTP driver in deployed environments; node-postgres for local dev.
export function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (isLocalUrl(url)) {
    return drizzlePg(new Pool({ connectionString: url })) as unknown as Db;
  }
  return drizzleNeon(neon(url)) as unknown as Db;
}

export * as coreSchema from "./schema/core";
export * as platformSchema from "./schema/platform";
