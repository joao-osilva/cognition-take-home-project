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
  EmptyState,
  Input,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@repo/ui";

import type { CreateApiKeyResult } from "./actions";

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export function ApiKeysTable({
  keys,
  onCreate,
  onRevoke,
}: {
  keys: ApiKeyRow[];
  onCreate: (name: string) => Promise<CreateApiKeyResult>;
  onRevoke: (id: string) => Promise<ActionResult>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateKeyDialog onCreate={onCreate} />
      </div>
      {keys.length === 0 ? (
        <EmptyState
          title="No API keys yet"
          hint="Create one to let external services read feature flags via /api/flags."
        />
      ) : (
        <div className="bg-card overflow-x-auto rounded-lg border shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="font-mono text-sm">{key.prefix}…</TableCell>
                  <TableCell className="text-muted-foreground">{key.createdBy}</TableCell>
                  <TableCell className="text-muted-foreground">{key.createdAt}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {key.lastUsedAt ?? "never"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={key.revokedAt ? "revoked" : "active"} />
                  </TableCell>
                  <TableCell className="text-right">
                    {!key.revokedAt && (
                      <RevokeButton id={key.id} name={key.name} onRevoke={onRevoke} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function CreateKeyDialog({
  onCreate,
}: {
  onCreate: (name: string) => Promise<CreateApiKeyResult>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const create = () =>
    startTransition(async () => {
      const result = await onCreate(name.trim());
      if (result.ok) {
        setCreatedKey(result.key);
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setName("");
          setCreatedKey(null);
        }
      }}
    >
      <Button
        size="sm"
        onClick={() => {
          setName("");
          setCreatedKey(null);
          setOpen(true);
        }}
      >
        Create key
      </Button>
      <DialogContent>
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>API key created</DialogTitle>
              <DialogDescription>
                Copy it now — this is the only time it is shown. Callers send it in the{" "}
                <code>x-api-key</code> header.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-md p-3 font-mono text-sm break-all select-all">
              {createdKey}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(createdKey);
                  toast.success("Copied to clipboard");
                }}
              >
                Copy
              </Button>
              <Button
                onClick={() => {
                  setCreatedKey(null);
                  setName("");
                  setOpen(false);
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>
                For external services reading feature flags via <code>/api/flags</code>. The key is
                shown once at creation.
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="e.g. payments-backend"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={create} disabled={pending || name.trim().length === 0}>
                Create
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RevokeButton({
  id,
  name,
  onRevoke,
}: {
  id: string;
  name: string;
  onRevoke: (id: string) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();

  const revoke = () =>
    startTransition(async () => {
      const result = await onRevoke(id);
      if (result.ok) {
        toast.success(`${name} revoked`);
      } else {
        toast.error(result.error);
      }
    });

  return (
    <Button size="sm" variant="outline" onClick={revoke} disabled={pending}>
      Revoke
    </Button>
  );
}
