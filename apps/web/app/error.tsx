"use client";

import { AlertTriangle } from "lucide-react";

import { Button, EmptyState } from "@repo/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle />}
      title="Something went wrong"
      hint="An unexpected error occurred while loading this page."
      action={
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      }
      className="mt-8"
    />
  );
}
