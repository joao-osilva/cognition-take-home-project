import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url));
}

export type Db = ReturnType<typeof createDb>;

export * as coreSchema from "./schema/core";
export * as platformSchema from "./schema/platform";
