"use client";

import { Download } from "lucide-react";

import { Button } from "@repo/ui";

export function DownloadPdfButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
      <Download className="size-4" />
      Download PDF
    </Button>
  );
}
