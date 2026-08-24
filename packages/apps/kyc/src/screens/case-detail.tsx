import {
  AuditTrail,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageHeader,
  StatusBadge,
  formatDateTime,
} from "@repo/ui";

import type { KycCaseDetail } from "../queries";
import { CaseActions, type KycCaseActions } from "./case-actions";
import { DocumentUpload } from "./document-upload";

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
        breadcrumb={
          <>
            <a href="/kyc" className="hover:text-foreground transition-colors">
              KYC Review Queue
            </a>
            <span>/</span>
            <span className="text-foreground">{customerName}</span>
          </>
        }
        title={customerName}
        description={customerEmail}
        actions={<CaseActions status={kycCase.status} actions={actions} />}
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {detail.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="capitalize">{doc.type.replaceAll("_", " ")}</span>
                    <a
                      href={`/kyc/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-xs font-medium underline-offset-2 hover:underline"
                    >
                      View document
                    </a>
                  </li>
                ))}
                {detail.documents.length === 0 ? (
                  <li className="text-muted-foreground py-2.5">No documents uploaded.</li>
                ) : null}
              </ul>
              {kycCase.status !== "approved" && kycCase.status !== "rejected" ? (
                <DocumentUpload upload={actions.uploadDocument} />
              ) : null}
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
        <Card className="lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>Case summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <Row label="Status">
              <StatusBadge status={kycCase.status} />
            </Row>
            <Row label="Risk level">
              <StatusBadge status={kycCase.riskLevel} />
            </Row>
            <Row label="Risk score">
              <span className="font-mono tabular-nums">{customerRiskScore}</span>
            </Row>
            <Row label="Assignee">{assigneeName ?? "Unassigned"}</Row>
            <Row label="SLA due">
              <span className="font-mono text-xs tabular-nums">
                {kycCase.slaDueAt ? formatDateTime(kycCase.slaDueAt) : "—"}
              </span>
            </Row>
            {kycCase.decisionReason ? (
              <Row label="Last reason">{kycCase.decisionReason}</Row>
            ) : null}
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
      <span className="text-right">{children}</span>
    </div>
  );
}
