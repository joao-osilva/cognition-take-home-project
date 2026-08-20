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
  Textarea,
  formatMoney,
  toast,
} from "@repo/ui";

import type { RefundableTransaction } from "../queries";

export function RequestRefundDialog({
  transactions,
  onRequest,
}: {
  transactions: RefundableTransaction[];
  onRequest: (transactionId: string, amountCents: number, reason: string) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const selected = transactions.find((t) => t.id === transactionId);
  const amountCents = Math.round(Number(amount) * 100);
  const valid =
    selected && Number.isFinite(amountCents) && amountCents > 0 && reason.trim().length >= 3;

  const submit = () =>
    startTransition(async () => {
      if (!selected) return;
      const result = await onRequest(selected.id, amountCents, reason.trim());
      if (result.ok) {
        toast.success("Refund request submitted");
        setOpen(false);
        setTransactionId("");
        setAmount("");
        setReason("");
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Request refund</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a refund</DialogTitle>
          <DialogDescription>
            Refunds at or above the configured threshold require approval by a second person.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Transaction</Label>
            <Select value={transactionId} onValueChange={setTransactionId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a settled transaction" />
              </SelectTrigger>
              <SelectContent>
                {transactions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.customerName} — {formatMoney(t.amount, t.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={
                selected ? `Up to ${formatMoney(selected.amount, selected.currency)}` : "0.00"
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="refund-reason">Reason</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required — recorded in the audit log"
            />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!valid || pending} onClick={submit}>
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
