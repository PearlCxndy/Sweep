import { createClient } from "@supabase/supabase-js";

import { cleanBranchName, hasSeededLayout } from "@/domain/stores";
import type { Retailer, Store } from "@/domain/types";

/**
 * Store rows are shared across users, keyed on place_id. Two people picking
 * the same Tesco get the same row — which is the whole reason crowdsourced
 * layout is possible later. If every shopper created a private store record,
 * the tick-order signal could never be pooled.
 *
 * Supabase is used when it is configured. When it is not, this falls back to
 * an in-process map so onboarding still completes with no network, which §11
 * of the brief requires. The fallback is not durable and does not pretend to
 * be: it is what makes the case study runnable without a project.
 */

export type StoreInput = {
  retailer: Retailer;
  name: string;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
};

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(url && serviceKey);

const local = new Map<string, Store>();

export async function upsertStore(input: StoreInput): Promise<Store> {
  const branch = cleanBranchName(input.name, input.retailer);
  const hasLayout = hasSeededLayout(input.retailer, branch);

  if (!supabaseConfigured) {
    const id = input.placeId ?? `local-${local.size + 1}`;
    const existing = local.get(id);
    if (existing) return existing;
    const store: Store = {
      id,
      retailer: input.retailer,
      branch,
      placeId: input.placeId,
      lat: input.lat,
      lng: input.lng,
      hasLayout,
    };
    local.set(id, store);
    return store;
  }

  const db = createClient(url!, serviceKey!, {
    auth: { persistSession: false },
  });

  // A store without a place_id is a manual entry and has nothing to conflict
  // on, so it is inserted rather than upserted.
  if (!input.placeId) {
    const { data, error } = await db
      .from("stores")
      .insert({
        retailer: input.retailer,
        branch,
        place_id: null,
        lat: input.lat,
        lng: input.lng,
        has_layout: hasLayout,
      })
      .select()
      .single();
    if (error) throw error;
    return fromRow(data);
  }

  const { data, error } = await db
    .from("stores")
    .upsert(
      {
        retailer: input.retailer,
        branch,
        place_id: input.placeId,
        lat: input.lat,
        lng: input.lng,
        has_layout: hasLayout,
      },
      { onConflict: "place_id", ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

type StoreRow = {
  id: string;
  retailer: string;
  branch: string;
  place_id: string | null;
  lat: number | null;
  lng: number | null;
  has_layout: boolean;
};

function fromRow(row: StoreRow): Store {
  return {
    id: row.id,
    retailer: row.retailer as Retailer,
    branch: row.branch,
    placeId: row.place_id,
    lat: row.lat,
    lng: row.lng,
    hasLayout: row.has_layout,
  };
}
