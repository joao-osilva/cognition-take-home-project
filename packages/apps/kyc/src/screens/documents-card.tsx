"use client";

import { useRef, useState, useTransition } from "react";

import type { ActionResult } from "@repo/core";
import { Badge, Button, toast } from "@repo/ui";

import { kycDocumentTypeLabel } from "../labels";

const REQUIRED_TYPES = ["passport", "proof_of_address", "selfie"] as const;
const MAX_BYTES = 10 * 1024 * 1024;

export interface DocumentItem {
  id: string;
  type: string;
}

export function DocumentsCard({
  documents,
  canEdit,
  upload,
  remove,
}: {
  documents: DocumentItem[];
  canEdit: boolean;
  upload: (formData: FormData) => Promise<ActionResult>;
  remove: (documentId: string) => Promise<ActionResult>;
}) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function uploadFor(type: string, file: File) {
    if (file.size > MAX_BYTES) {
      toast.error("File exceeds the 10 MB limit");
      return;
    }
    const formData = new FormData();
    formData.set("type", type);
    formData.set("file", file);
    setPendingKey(type);
    startTransition(async () => {
      const result = await upload(formData);
      setPendingKey(null);
      if (result.ok) toast.success(`${kycDocumentTypeLabel(type)} uploaded`);
      else toast.error(result.error);
    });
  }

  function removeDoc(doc: DocumentItem) {
    setPendingKey(doc.id);
    startTransition(async () => {
      const result = await remove(doc.id);
      setPendingKey(null);
      if (result.ok) toast.success(`${kycDocumentTypeLabel(doc.type)} removed`);
      else toast.error(result.error);
    });
  }

  function pickFile(key: string) {
    fileRefs.current[key]?.click();
  }

  function fileInput(key: string, type: string) {
    return (
      <input
        ref={(el) => {
          fileRefs.current[key] = el;
        }}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        className="sr-only"
        aria-label={`Upload ${kycDocumentTypeLabel(type)}`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) uploadFor(type, file);
        }}
      />
    );
  }

  const otherDocs = documents.filter((d) => d.type === "other");

  return (
    <ul className="divide-y text-sm">
      {REQUIRED_TYPES.map((type) => {
        const doc = documents.find((d) => d.type === type);
        const busy = pendingKey === type || (doc ? pendingKey === doc.id : false);
        return (
          <li key={type} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium">{kycDocumentTypeLabel(type)}</span>
              {doc ? (
                <Badge variant="outline" className="shrink-0 text-xs">
                  Uploaded
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground shrink-0 text-xs">
                  Missing
                </Badge>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {doc ? (
                <>
                  <Button asChild variant="outline" size="sm">
                    <a href={`/kyc/documents/${doc.id}`} target="_blank" rel="noreferrer">
                      View
                    </a>
                  </Button>
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => removeDoc(doc)}
                    >
                      {busy ? "Removing…" : "Remove"}
                    </Button>
                  ) : null}
                </>
              ) : canEdit ? (
                <>
                  {fileInput(type, type)}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => pickFile(type)}
                  >
                    {busy ? "Uploading…" : "Upload"}
                  </Button>
                </>
              ) : (
                <span className="text-muted-foreground text-xs">Not provided</span>
              )}
            </div>
          </li>
        );
      })}
      {otherDocs.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">Other document</span>
            <Badge variant="outline" className="shrink-0 text-xs">
              Uploaded
            </Badge>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/kyc/documents/${doc.id}`} target="_blank" rel="noreferrer">
                View
              </a>
            </Button>
            {canEdit ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={pendingKey === doc.id}
                onClick={() => removeDoc(doc)}
              >
                {pendingKey === doc.id ? "Removing…" : "Remove"}
              </Button>
            ) : null}
          </div>
        </li>
      ))}
      {canEdit ? (
        <li className="py-2.5">
          {fileInput("other", "other")}
          <Button
            variant="ghost"
            size="sm"
            disabled={pendingKey === "other"}
            onClick={() => pickFile("other")}
          >
            {pendingKey === "other" ? "Uploading…" : "+ Add other document"}
          </Button>
        </li>
      ) : null}
    </ul>
  );
}
