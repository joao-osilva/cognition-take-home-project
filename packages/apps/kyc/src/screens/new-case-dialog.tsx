"use client";

import { useState, useTransition } from "react";

import type { ActionResult } from "@repo/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@repo/ui";

export interface NewKycCaseInput {
  customerName: string;
  customerEmail: string;
  riskLevel: "low" | "medium" | "high";
}

export function NewCaseDialog({
  onCreate,
}: {
  onCreate: (input: NewKycCaseInput) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [riskLevel, setRiskLevel] = useState<NewKycCaseInput["riskLevel"]>("low");
  const [pending, startTransition] = useTransition();

  const valid = name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email.trim());

  const submit = () =>
    startTransition(async () => {
      const result = await onCreate({
        customerName: name.trim(),
        customerEmail: email.trim(),
        riskLevel,
      });
      if (result.ok) {
        toast.success("Case created");
        setOpen(false);
        setName("");
        setEmail("");
        setRiskLevel("low");
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New case</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New KYC case</DialogTitle>
          <DialogDescription>
            Opens a pending review case for the customer; the SLA clock starts immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="customer-name">Customer name</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dana Wallace"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer-email">Customer email</Label>
            <Input
              id="customer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. dana@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label>Risk level</Label>
            <Select
              value={riskLevel}
              onValueChange={(v) => setRiskLevel(v as NewKycCaseInput["riskLevel"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["low", "medium", "high"] as const).map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!valid || pending} onClick={submit}>
            Create case
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
