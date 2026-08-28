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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  MoreHorizontalIcon,
  toast,
} from "@repo/ui";

export function FlagRowMenu({
  flagKey,
  archived,
  onArchive,
  onRestore,
}: {
  flagKey: string;
  archived: boolean;
  onArchive: (key: string) => Promise<ActionResult>;
  onRestore: (key: string) => Promise<ActionResult>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = (action: "archive" | "restore") =>
    startTransition(async () => {
      const result = action === "archive" ? await onArchive(flagKey) : await onRestore(flagKey);
      if (result.ok) {
        toast.success(
          action === "archive" ? `Flag "${flagKey}" archived` : `Flag "${flagKey}" restored`,
        );
        setConfirmOpen(false);
      } else {
        toast.error(result.error);
      }
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={`Actions for ${flagKey}`}
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {archived ? (
            <DropdownMenuItem disabled={pending} onSelect={() => run("restore")}>
              Restore flag
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={pending}
              variant="destructive"
              onSelect={() => setConfirmOpen(true)}
            >
              Archive flag
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive “{flagKey}”?</DialogTitle>
            <DialogDescription>
              The flag disappears from the list and the API stops serving it in every environment.
              You can restore it later from the Archived view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => run("archive")} disabled={pending}>
              {pending ? "Archiving…" : "Archive flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
