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

import { kycActionLabel } from "../labels";
import type { KycCaseDetail } from "../queries";
import { CaseActions, type KycCaseActions } from "./case-actions";
import { DocumentsCard } from "./documents-card";

export function KycCaseScreen({
  detail,
  viewerId,
  actions,
}: {
  detail: KycCaseDetail;
  viewerId: string;
  actions: KycCaseActions;
}) {
  const { kycCase, customerName, customerEmail, customerRiskScore, assigneeName } = detail;
  const caseOpen = kycCase.status !== "approved" && kycCase.status !== "rejected";

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
        actions={
          <CaseActions
            status={kycCase.status}
            isAssignee={kycCase.assigneeId === viewerId}
            actions={actions}
          />
        }
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="order-first lg:order-last lg:sticky lg:top-20">
          <Card>
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
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentsCard
                documents={detail.documents}
                canEdit={caseOpen}
                upload={actions.uploadDocument}
                remove={actions.removeDocument}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTrail
                entries={detail.auditTrail.map((e) => ({
                  ...e,
                  actionLabel: kycActionLabel(e.action),
                }))}
                pageSize={6}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right break-words">{children}</span>
    </div>
  );
}
