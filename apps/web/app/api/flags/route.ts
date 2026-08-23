import { NextResponse } from "next/server";

import { listFlagsForEnvironment } from "@repo/app-flags";
import { verifyApiKey } from "@repo/core";

import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const ENVIRONMENTS = new Set(["dev", "staging", "prod"]);

// Read-only flag snapshot for external services (e.g. the product backend
// evaluating flags at runtime). Authenticated by per-consumer API keys
// (created/revoked in Admin -> API keys), not Clerk, because callers are
// machines, not console users.
export async function GET(request: Request) {
  const presented = request.headers.get("x-api-key") ?? "";
  const apiKey = presented ? await verifyApiKey(getDb(), presented) : null;
  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const environment = new URL(request.url).searchParams.get("environment") ?? "prod";
  if (!ENVIRONMENTS.has(environment)) {
    return NextResponse.json(
      { error: "environment must be one of dev, staging, prod" },
      { status: 400 },
    );
  }

  const flags = await listFlagsForEnvironment(getDb(), environment);

  return NextResponse.json(
    {
      environment,
      flags: Object.fromEntries(
        flags.map((flag) => [
          flag.key,
          {
            state: flag.state,
            ...(flag.state === "percentage" ? { rolloutPercentage: flag.rolloutPercentage } : {}),
          },
        ]),
      ),
    },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
