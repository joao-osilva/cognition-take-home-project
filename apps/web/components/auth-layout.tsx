import { Flag, Receipt, ShieldCheck, Zap } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-sidebar hidden flex-col justify-between p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="bg-sidebar-primary flex size-8 items-center justify-center rounded-full">
            <Zap className="text-sidebar-primary-foreground size-4.5" strokeWidth={2} />
          </div>
          <span className="text-sidebar-foreground text-base font-semibold tracking-tight">
            Internal Tools
          </span>
        </div>
        <div className="max-w-md space-y-6">
          <h1 className="text-sidebar-foreground text-3xl font-semibold tracking-tight">
            One console for fintech operations.
          </h1>
          <p className="text-sidebar-foreground/60 text-sm leading-relaxed">
            KYC review, refund approvals, and feature flags — with maker-checker guardrails and a
            complete audit trail built in.
          </p>
          <ul className="text-sidebar-foreground/70 space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="text-sidebar-primary size-4" strokeWidth={1.75} />
              KYC case review with SLA tracking
            </li>
            <li className="flex items-center gap-2.5">
              <Receipt className="text-sidebar-primary size-4" strokeWidth={1.75} />
              Maker-checker refund approvals
            </li>
            <li className="flex items-center gap-2.5">
              <Flag className="text-sidebar-primary size-4" strokeWidth={1.75} />
              Guarded production feature flags
            </li>
          </ul>
        </div>
        <p className="text-sidebar-foreground/40 text-xs">fintech ops platform</p>
      </div>
      <div className="flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
