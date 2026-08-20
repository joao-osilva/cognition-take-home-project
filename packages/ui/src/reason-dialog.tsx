"use client";

import { useState } from "react";

import { Button } from "./components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/dialog";
import { Label } from "./components/label";
import { Textarea } from "./components/textarea";

export function ReasonDialog({
  title,
  description,
  trigger,
  confirmLabel,
  onConfirm,
}: {
  title: string;
  description: string;
  trigger: React.ReactNode;
  confirmLabel: string;
  onConfirm: (reason: string, close: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Required — recorded in the audit log"
          />
        </div>
        <DialogFooter>
          <Button
            disabled={reason.trim().length < 3}
            onClick={() => onConfirm(reason, () => setOpen(false))}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
