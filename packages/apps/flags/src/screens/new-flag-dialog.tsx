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
  toast,
} from "@repo/ui";

const KEY_PATTERN = /^[a-z][a-z0-9._-]*$/;

export function NewFlagDialog({
  onCreate,
}: {
  onCreate: (key: string, description: string) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setKey("");
      setDescription("");
      setKeyError(null);
    }
  };

  const validateKey = (value: string) => {
    if (value.length > 0 && !KEY_PATTERN.test(value)) {
      setKeyError("Use lowercase letters, digits, dots, dashes or underscores");
    } else {
      setKeyError(null);
    }
  };

  const submit = () =>
    startTransition(async () => {
      const result = await onCreate(key.trim(), description.trim());
      if (result.ok) {
        toast.success(`Flag "${key.trim()}" created (off in all environments)`);
        setOpen(false);
      } else {
        setKeyError(result.error);
      }
    });

  const valid = KEY_PATTERN.test(key.trim()) && description.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>New flag</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create feature flag</DialogTitle>
          <DialogDescription>
            The flag is created off in dev, staging, and prod. Turning it on in prod requires
            approval.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid && !pending) submit();
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="flag-key">Key</Label>
            <Input
              id="flag-key"
              value={key}
              onChange={(e) => {
                const next = e.target.value.toLowerCase();
                setKey(next);
                if (keyError) validateKey(next);
              }}
              onBlur={() => validateKey(key)}
              placeholder="checkout-v2…"
              className="font-mono text-[13px]"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(keyError)}
              aria-describedby="flag-key-help"
            />
            {keyError ? (
              <p className="text-destructive text-xs" role="alert">
                {keyError}
              </p>
            ) : (
              <p id="flag-key-help" className="text-muted-foreground text-xs">
                Lowercase, e.g. checkout-v2 — this is what services read from the API.
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="flag-description">Description</Label>
            <Textarea
              id="flag-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this flag control?…"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!valid || pending}>
              {pending ? "Creating…" : "Create flag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
