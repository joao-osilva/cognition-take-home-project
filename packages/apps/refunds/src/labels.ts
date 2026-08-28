const ACTION_LABELS: Record<string, string> = {
  "refunds.requested": "Refund requested",
  "refunds.approved": "Refund approved",
  "refunds.rejected": "Refund rejected",
  "refunds.settled": "Refund settled",
  "approval.requested": "Approval requested",
  "approval.approved": "Approval granted",
  "approval.rejected": "Approval rejected",
};

export function refundActionLabel(action: string): string {
  const known = ACTION_LABELS[action];
  if (known) return known;
  const words = action
    .replace(/^refunds?\./, "")
    .replace(/[._]/g, " ")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
