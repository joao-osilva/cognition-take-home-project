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
  Textarea,
  formatMoney,
  toast,
} from "@repo/ui";

import type { RefundableTransaction } from "../queries";
import { TransactionCombobox } from "./transaction-combobox";

export function RequestRefundDialog({
  onRequest,
  onSearch,
}: {
  onRequest: (transactionId: string, amountCents: number, reason: string) => Promise<ActionResult>;
  onSearch: (query: string) => Promise<RefundableTransaction[]>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RefundableTransaction | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  const amountCents = Math.round(Number(amount) * 100);
  const amountEntered = amount.trim().length > 0;
  const exceedsMax = Boolean(
    selected && Number.isFinite(amountCents) && amountCents > selected.amount,
  );
  const valid =
    selected &&
    Number.isFinite(amountCents) &&
    amountCents > 0 &&
    !exceedsMax &&
    reason.trim().length >= 3;

  const submit = () =>
    startTransition(async () => {
      if (!selected) return;
      const result = await onRequest(selected.id, amountCents, reason.trim());
      if (result.ok) {
        toast.success("Refund request submitted for approval");
        setOpen(false);
        setSelected(null);
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
            Every refund request requires approval by a second person before it is processed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Transaction</Label>
            <TransactionCombobox selected={selected} onSelect={setSelected} onSearch={onSearch} />
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
              aria-invalid={exceedsMax}
              placeholder={
                selected ? `Up to ${formatMoney(selected.amount, selected.currency)}` : "0.00"
              }
            />
            {exceedsMax && selected ? (
              <p className="text-destructive text-xs" role="alert">
                Amount exceeds the transaction total of{" "}
                {formatMoney(selected.amount, selected.currency)}.
              </p>
            ) : null}
            {amountEntered && !exceedsMax && (!Number.isFinite(amountCents) || amountCents <= 0) ? (
              <p className="text-destructive text-xs" role="alert">
                Enter an amount greater than zero.
              </p>
            ) : null}
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
            Submit for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
