import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { listFlagsForEnvironment } from "@repo/app-flags";

import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const ENVIRONMENTS = new Set(["dev", "staging", "prod"]);

function isAuthorized(request: Request): boolean {
  const expected = process.env["FLAGS_API_KEY"];
  if (!expected) return false;
  const provided = request.headers.get("x-api-key") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Read-only flag snapshot for external services (e.g. the product backend
// evaluating flags at runtime). Authenticated by a shared API key, not Clerk,
// because callers are machines, not console users.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
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
