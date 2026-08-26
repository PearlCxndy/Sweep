import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { RETAILERS } from "@/domain/types";
import type { Retailer } from "@/domain/types";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { upsertStore } from "@/lib/db/stores";

const Body = z.object({
  retailer: z.enum(RETAILERS as [Retailer, ...Retailer[]]),
  name: z.string().min(1).max(120),
  placeId: z.string().max(200).nullable().default(null),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
});

export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const store = await upsertStore(parsed.data);
    return NextResponse.json({ store });
  } catch (error) {
    console.error("[stores] upsert failed", error);
    return NextResponse.json({ error: "upsert_failed" }, { status: 500 });
  }
}
