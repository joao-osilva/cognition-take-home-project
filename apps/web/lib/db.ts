import { createDb, type Db } from "@repo/db";

let db: Db | undefined;

export function getDb(): Db {
  db ??= createDb();
  return db;
}
