"use client";

import { useRef, useState, useTransition } from "react";

import type { ActionResult } from "@repo/core";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@repo/ui";

const DOCUMENT_TYPES = [
  { value: "passport", label: "Passport" },
  { value: "proof_of_address", label: "Proof of address" },
  { value: "selfie", label: "Selfie" },
  { value: "other", label: "Other" },
] as const;

export function DocumentUpload({
  upload,
}: {
  upload: (formData: FormData) => Promise<ActionResult>;
}) {
  const [type, setType] = useState<string>("passport");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file first");
      return;
    }
    const formData = new FormData();
    formData.set("type", type);
    formData.set("file", file);
    startTransition(async () => {
      const result = await upload(formData);
      if (result.ok) {
        toast.success("Document uploaded");
        if (fileRef.current) fileRef.current.value = "";
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-2 border-t pt-3">
      <div className="flex gap-2">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="flex-1" />
      </div>
      <Button size="sm" disabled={pending} onClick={submit}>
        {pending ? "Uploading…" : "Upload document"}
      </Button>
    </div>
  );
}
