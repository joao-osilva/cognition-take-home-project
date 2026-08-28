const ACTION_LABELS: Record<string, string> = {
  "kyc.case.created": "Case created",
  "kyc.case.claimed": "Case claimed",
  "kyc.case.released": "Case released",
  "kyc.case.approved": "Case approved",
  "kyc.case.rejected": "Case rejected",
  "kyc.case.escalated": "Case escalated",
  "kyc.document.uploaded": "Document uploaded",
  "kyc.document.removed": "Document removed",
  "kyc.document.viewed": "Document viewed",
};

export function kycActionLabel(action: string): string {
  const known = ACTION_LABELS[action];
  if (known) return known;
  const words = action
    .replace(/^kyc\./, "")
    .replace(/[._]/g, " ")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  passport: "Passport",
  proof_of_address: "Proof of address",
  selfie: "Selfie",
  other: "Other",
};

export function kycDocumentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] ?? type.replaceAll("_", " ");
}
