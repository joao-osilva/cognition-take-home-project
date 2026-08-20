import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { transactions } from "@repo/db/schema/core";

export const refundRequests = pgTable(
  "refund_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id),
    amount: integer("amount").notNull(), // integer cents
    currency: text("currency").notNull().default("USD"),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("requested"),
    requestedBy: text("requested_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "refund_requests_status_check",
      sql`${t.status} in ('requested','pending_approval','approved','rejected','processed')`,
    ),
  ],
);
