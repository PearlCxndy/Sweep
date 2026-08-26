import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { clientKey, rateLimit } from "@/lib/rateLimit";

const Query = z.object({
  url: z.string().url(),
});

/**
 * Fetches a single Tesco product's public detail page through Unwrangle.
 * The provider's payload is deliberately passed through unchanged: its schema
 * can evolve, and we should only map fields into Sweep's catalogue after we
 * have a real sample payload to validate against.
 */
export async function GET(req: NextRequest) {
  const limit = rateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const parsed = Query.safeParse({ url: req.nextUrl.searchParams.get("url") });
  if (!parsed.success || !isTescoProductUrl(parsed.data.url)) {
    return NextResponse.json({ error: "invalid_tesco_product_url" }, { status: 400 });
  }

  const key = process.env.UNWRANGLE_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "product_data_not_configured" }, { status: 503 });
  }

  const upstream = new URL("https://data.unwrangle.com/api/getter/");
  upstream.searchParams.set("platform", "tesco_detail");
  upstream.searchParams.set("url", parsed.data.url);
  upstream.searchParams.set("api_key", key);

  try {
    const response = await fetch(upstream, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        { error: "product_data_unavailable" },
        { status: 502 },
      );
    }

    return NextResponse.json({ data: await response.json() });
  } catch {
    return NextResponse.json({ error: "product_data_unavailable" }, { status: 502 });
  }
}

function isTescoProductUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.hostname === "tesco.com" || url.hostname === "www.tesco.com") &&
      /^\/groceries\/en-GB\/products\/\d+$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}
