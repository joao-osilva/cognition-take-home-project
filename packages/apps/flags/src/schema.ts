import { sql } from "@repo/db/orm";
import { check, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "@repo/db/pg-core";

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    description: text("description").notNull().default(""),
    environment: text("environment").notNull(),
    state: text("state").notNull().default("off"),
    rolloutPercentage: integer("rollout_percentage"),
    ownerId: text("owner_id").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("feature_flags_key_env_unique").on(t.key, t.environment),
    check("feature_flags_env_check", sql`${t.environment} in ('dev','staging','prod')`),
    check("feature_flags_state_check", sql`${t.state} in ('on','off','percentage')`),
  ],
);
