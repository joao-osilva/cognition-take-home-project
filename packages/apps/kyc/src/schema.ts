import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { customers } from "@repo/db/schema/core";

export const kycCases = pgTable(
  "kyc_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    status: text("status").notNull().default("pending"),
    riskLevel: text("risk_level").notNull().default("low"),
    assigneeId: text("assignee_id"),
    slaDueAt: timestamp("sla_due_at", { withTimezone: true }),
    decisionReason: text("decision_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "kyc_cases_status_check",
      sql`${t.status} in ('pending','in_review','approved','rejected','escalated')`,
    ),
    check("kyc_cases_risk_level_check", sql`${t.riskLevel} in ('low','medium','high')`),
  ],
);

export const kycDocuments = pgTable("kyc_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => kycCases.id),
  type: text("type").notNull(),
  blobUrl: text("blob_url").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});
