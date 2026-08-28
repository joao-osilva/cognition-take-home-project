import { featureFlags } from "../../apps/flags/src/schema";
import { kycCases, kycDocuments } from "../../apps/kyc/src/schema";
import { refundRequests } from "../../apps/refunds/src/schema";
import { createDb } from "./index";
import { customers, transactions } from "./schema/core";
import { appConfig, approvals, auditLog, notifications, users } from "./schema/platform";

const HOUR = 60 * 60 * 1000;

function at<T>(items: T[], index: number): T {
  const item = items[index];
  if (!item) throw new Error(`Missing seed row at index ${index}`);
  return item;
}

async function main() {
  const db = createDb();

  // Reset in FK dependency order so the seed is re-runnable.
  await db.delete(kycDocuments);
  await db.delete(kycCases);
  await db.delete(refundRequests);
  await db.delete(featureFlags);
  await db.delete(approvals);
  await db.delete(notifications);
  await db.delete(auditLog);
  await db.delete(appConfig);
  await db.delete(transactions);
  await db.delete(customers);
  await db.delete(users);

  await db.insert(users).values([
    { id: "user-admin", email: "alex@fintech.dev", name: "Alex Admin" },
    { id: "user-kyc-op", email: "kim@fintech.dev", name: "Kim Onboard" },
    { id: "user-kyc-ap", email: "kate@fintech.dev", name: "Kate Senior" },
    { id: "user-ref-op", email: "remy@fintech.dev", name: "Remy Support" },
    { id: "user-ref-ap", email: "rosa@fintech.dev", name: "Rosa Finance" },
    { id: "user-flag-op", email: "finn@fintech.dev", name: "Finn Dev" },
    { id: "user-flag-ap", email: "faye@fintech.dev", name: "Faye Lead" },
  ]);

  const insertedCustomers = await db
    .insert(customers)
    .values([
      { name: "Alice Nguyen", email: "alice@example.com", riskScore: 12 },
      { name: "Bruno Costa", email: "bruno@example.com", riskScore: 55 },
      { name: "Carla Mendes", email: "carla@example.com", riskScore: 83 },
      { name: "Deepak Rao", email: "deepak@example.com", riskScore: 30 },
      { name: "Emma Silva", email: "emma@example.com", riskScore: 67 },
      { name: "Felix Braun", email: "felix@example.com", riskScore: 21 },
    ])
    .returning();

  const insertedTransactions = await db
    .insert(transactions)
    .values(
      insertedCustomers.flatMap((c, i) => [
        { customerId: c.id, amount: 12550 + i * 5000, currency: "USD", status: "settled" },
        { customerId: c.id, amount: 250000 + i * 10000, currency: "USD", status: "settled" },
      ]),
    )
    .returning();

  await db.insert(appConfig).values([
    { key: "kyc.sla_hours", value: 48, updatedBy: "seed" },
    { key: "approvals.reminder_hours", value: 4, updatedBy: "seed" },
  ]);

  const now = Date.now();
  const [alice, bruno, carla, deepak, emma, felix] = insertedCustomers;
  if (!alice || !bruno || !carla || !deepak || !emma || !felix) {
    throw new Error("Expected 6 seeded customers");
  }
  const insertedCases = await db
    .insert(kycCases)
    .values([
      {
        customerId: alice.id,
        status: "pending",
        riskLevel: "low",
        slaDueAt: new Date(now + 40 * HOUR),
      },
      {
        customerId: bruno.id,
        status: "in_review",
        riskLevel: "medium",
        assigneeId: "user-kyc-op",
        slaDueAt: new Date(now + 20 * HOUR),
      },
      {
        customerId: carla.id,
        status: "escalated",
        riskLevel: "high",
        assigneeId: "user-kyc-op",
        slaDueAt: new Date(now - 4 * HOUR),
      },
      {
        customerId: deepak.id,
        status: "approved",
        riskLevel: "low",
        assigneeId: "user-kyc-op",
        decisionReason: "Documents verified against registry",
      },
      {
        customerId: emma.id,
        status: "pending",
        riskLevel: "medium",
        slaDueAt: new Date(now + 6 * HOUR),
      },
      {
        customerId: felix.id,
        status: "rejected",
        riskLevel: "high",
        assigneeId: "user-kyc-ap",
        decisionReason: "Sanctions list match",
      },
    ])
    .returning();

  await db.insert(kycDocuments).values(
    insertedCases.flatMap((c) => [
      { caseId: c.id, type: "passport", blobUrl: "https://example.com/docs/passport.pdf" },
      { caseId: c.id, type: "proof_of_address", blobUrl: "https://example.com/docs/address.pdf" },
    ]),
  );

  const insertedRefunds = await db
    .insert(refundRequests)
    .values([
      {
        transactionId: at(insertedTransactions, 0).id,
        amount: 12550,
        currency: "USD",
        reason: "Duplicate charge",
        status: "processed",
        requestedBy: "user-ref-op",
      },
      {
        transactionId: at(insertedTransactions, 3).id,
        amount: 260000,
        currency: "USD",
        reason: "Service not delivered",
        status: "pending_approval",
        requestedBy: "user-ref-op",
      },
      {
        transactionId: at(insertedTransactions, 5).id,
        amount: 90000,
        currency: "USD",
        reason: "Customer dispute resolved in their favor",
        status: "requested",
        requestedBy: "user-ref-op",
      },
      {
        transactionId: at(insertedTransactions, 7).id,
        amount: 280000,
        currency: "USD",
        reason: "Chargeback pre-emption",
        status: "rejected",
        requestedBy: "user-ref-op",
      },
    ])
    .returning();

  const pendingRefund = insertedRefunds.find((r) => r.status === "pending_approval");
  if (pendingRefund) {
    await db.insert(approvals).values({
      entityType: "refund_request",
      entityId: pendingRefund.id,
      requestedBy: pendingRefund.requestedBy,
      ruleSnapshot: { threshold: 100000, amount: pendingRefund.amount },
    });
  }

  const flagDefs = [
    { key: "new-onboarding-flow", description: "Revamped onboarding wizard" },
    { key: "instant-refunds", description: "Skip manual review for small refunds" },
    { key: "dark-mode", description: "Dark theme for the customer portal" },
  ];
  await db.insert(featureFlags).values(
    flagDefs.flatMap((f) => [
      { ...f, environment: "dev", state: "on", ownerId: "user-flag-op" },
      {
        ...f,
        environment: "staging",
        state: f.key === "dark-mode" ? "percentage" : "on",
        rolloutPercentage: f.key === "dark-mode" ? 50 : null,
        ownerId: "user-flag-op",
      },
      { ...f, environment: "prod", state: "off", ownerId: "user-flag-op" },
    ]),
  );

  console.log("Seed complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
