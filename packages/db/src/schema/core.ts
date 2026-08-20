import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Core tier: company-wide business entities, readable by any app.
// In a real deployment these would be fed from source systems; here they are seeded.

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  riskScore: integer("risk_score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    amount: integer("amount").notNull(), // integer cents
    currency: text("currency").notNull().default("USD"),
    status: text("status").notNull().default("settled"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("transactions_status_check", sql`${t.status} in ('pending','settled','failed')`)],
);
