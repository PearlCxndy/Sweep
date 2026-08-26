import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { normaliseUkPostcode } from "@/domain/postcode";
import { mergeSeededPlaces } from "@/domain/stores";
import { RETAILER_NAMES } from "@/domain/types";
import { clientKey, rateLimit } from "@/lib/rateLimit";

const Body = z
  .object({
    retailer: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    postcode: z.string().max(12).optional(),
  })
  .refine((b) => (b.lat != null && b.lng != null) || b.postcode, {
    message: "Need coordinates or a postcode",
  });

const PlacesResponse = z.object({
  places: z
    .array(
      z.object({
        id: z.string(),
        displayName: z.object({ text: z.string() }),
        formattedAddress: z.string(),
        location: z.object({ latitude: z.number(), longitude: z.number() }),
      }),
    )
    .optional()
    .default([]),
});

/**
 * Places (New) bills by the fields you ask for. Four fields, not the whole
 * place object — asking for everything on every keystroke is how a prototype
 * generates a real invoice.
 */
const FIELDS =
  "places.id,places.displayName,places.formattedAddress,places.location";

/** Onboarding never fails because a third party is down. */
const EMPTY = { places: [] as unknown[] };

export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", ...EMPTY },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
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

  const { retailer, lat, lng, postcode: rawPostcode } = parsed.data;
  const postcode = rawPostcode ? normaliseUkPostcode(rawPostcode) : undefined;

  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) {
    // No key: still return the seeded Tesco for an E14 postcode, so the
    // postcode path is a real alternative rather than an empty box.
    console.warn("[stores/search] GOOGLE_MAPS_SERVER_KEY is not set");
    return NextResponse.json({
      places: postcode ? mergeSeededPlaces(retailer, postcode, []) : [],
    });
  }

  const name =
    RETAILER_NAMES[retailer as keyof typeof RETAILER_NAMES] ?? "supermarket";

  // Text search covers both cases: bias by coordinates when we have them,
  // put the postcode in the query when we do not.
  const body: Record<string, unknown> = {
    textQuery: postcode
      ? `${name} supermarket ${postcode}`
      : `${name} supermarket`,
    includedType: "supermarket",
    maxResultCount: 6,
    regionCode: "GB",
  };
  if (lat != null && lng != null) {
    body.locationBias = {
      circle: { center: { latitude: lat, longitude: lng }, radius: 8000 },
    };
  }

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": FIELDS,
        },
        body: JSON.stringify(body),
        // Branches do not move. A day of caching makes repeat searches free.
        next: { revalidate: 86_400 },
      },
    );

    const live = res.ok
      ? PlacesResponse.parse(await res.json()).places.map((p) => ({
          placeId: p.id,
          name: p.displayName.text,
          address: p.formattedAddress,
          lat: p.location.latitude,
          lng: p.location.longitude,
        }))
      : [];

    return NextResponse.json({
      places: mergeSeededPlaces(retailer, postcode, live),
    });
  } catch {
    return NextResponse.json({
      places: mergeSeededPlaces(retailer, postcode, []),
    });
  }
}
