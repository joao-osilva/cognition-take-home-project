import { createDb } from "./index";
import { customers, transactions } from "./schema/core";
import { appConfig } from "./schema/platform";

async function main() {
  const db = createDb();

  const insertedCustomers = await db
    .insert(customers)
    .values([
      { name: "Alice Nguyen", email: "alice@example.com", riskScore: 12 },
      { name: "Bruno Costa", email: "bruno@example.com", riskScore: 55 },
      { name: "Carla Mendes", email: "carla@example.com", riskScore: 83 },
      { name: "Deepak Rao", email: "deepak@example.com", riskScore: 30 },
    ])
    .returning();

  await db.insert(transactions).values(
    insertedCustomers.flatMap((c, i) => [
      { customerId: c.id, amount: 12550 + i * 5000, currency: "USD", status: "settled" },
      { customerId: c.id, amount: 250000 + i * 10000, currency: "USD", status: "settled" },
    ]),
  );

  await db.insert(appConfig).values([
    { key: "refunds.approval_threshold", value: 100000, updatedBy: "seed" },
    { key: "kyc.sla_hours", value: 48, updatedBy: "seed" },
  ]);

  console.log("Seed complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
