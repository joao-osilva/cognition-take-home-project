import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";

export type Db = PgDatabase<PgQueryResultHKT>;

// Local hosts: localhost, loopback IPs, and bare hostnames like Docker
// Compose service names (no dot).
function isLocalUrl(url: string): boolean {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1" || !host.includes(".");
}

// node-postgres for local dev and Docker; Neon's HTTP driver everywhere else
// (deployed environments).
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
