import {
  AuditTrail,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  StatusBadge,
} from "@repo/ui";

import type { KycCaseDetail } from "../queries";
import { CaseActions, type KycCaseActions } from "./case-actions";

export function KycCaseScreen({
  detail,
  actions,
}: {
  detail: KycCaseDetail;
  actions: KycCaseActions;
}) {
  const { kycCase, customerName, customerEmail, customerRiskScore, assigneeName } = detail;

  return (
    <div>
      <PageHeader
        title={`Case: ${customerName}`}
        description={customerEmail}
        actions={<CaseActions status={kycCase.status} actions={actions} />}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Case</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Status">
              <StatusBadge status={kycCase.status} />
            </Row>
            <Row label="Risk level">
              <StatusBadge status={kycCase.riskLevel} />
            </Row>
            <Row label="Customer risk score">{customerRiskScore}</Row>
            <Row label="Assignee">{assigneeName ?? "Unassigned"}</Row>
            <Row label="SLA due">
              {kycCase.slaDueAt ? kycCase.slaDueAt.toLocaleString("en-US") : "—"}
            </Row>
            {kycCase.decisionReason ? (
              <Row label="Last reason">{kycCase.decisionReason}</Row>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {detail.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between">
                  <span className="capitalize">{doc.type.replaceAll("_", " ")}</span>
                  <a
                    href={doc.blobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    View
                  </a>
                </li>
              ))}
              {detail.documents.length === 0 ? (
                <li className="text-muted-foreground">No documents uploaded.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditTrail entries={detail.auditTrail} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
