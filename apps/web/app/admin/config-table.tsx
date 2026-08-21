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
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@repo/ui";

export interface ConfigRow {
  key: string;
  valueJson: string;
  updatedBy: string;
  updatedAt: string;
}

export function ConfigTable({
  entries,
  onUpdate,
}: {
  entries: ConfigRow[];
  onUpdate: (key: string, valueJson: string) => Promise<ActionResult>;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Updated by</TableHead>
          <TableHead>Updated at</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.key}>
            <TableCell className="font-medium">{entry.key}</TableCell>
            <TableCell className="font-mono text-sm">{entry.valueJson}</TableCell>
            <TableCell className="text-muted-foreground">{entry.updatedBy}</TableCell>
            <TableCell className="text-muted-foreground">{entry.updatedAt}</TableCell>
            <TableCell className="text-right">
              <EditConfigDialog entry={entry} onUpdate={onUpdate} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EditConfigDialog({
  entry,
  onUpdate,
}: {
  entry: ConfigRow;
  onUpdate: (key: string, valueJson: string) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(entry.valueJson);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await onUpdate(entry.key, value);
      if (result.ok) {
        toast.success(`${entry.key} updated`);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(entry.valueJson);
      }}
    >
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {entry.key}</DialogTitle>
          <DialogDescription>
            Value is stored as JSON — numbers, strings (quoted), booleans, or objects.
          </DialogDescription>
        </DialogHeader>
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
