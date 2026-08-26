"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BranchPicker } from "@/app/onboarding/BranchPicker";
import { getPlacements, getStore, getTrips } from "@/data/repositories";
import { storeLabel } from "@/domain/types";
import { useActiveStore, useSweep } from "@/lib/store";

export default function YourShop() {
  const current = useActiveStore();
  const setChosenStore = useSweep((s) => s.setChosenStore);
  const [editing, setEditing] = useState(false);
  const aisles = new Set(getPlacements().filter((p) => p.storeId === current.id).map((p) => p.aisle)).size;
  const trips = getTrips().filter((t) => t.storeId === current.id).length;
  if (editing) return <AppShell current="shop"><main className="mx-auto w-full max-w-[560px] px-5 pt-6 pb-16"><p className="t-data text-[var(--wayfind)]">EDIT SHOP</p><div className="mt-5"><BranchPicker retailer={current.retailer} onPick={(p) => { setChosenStore({ id: p.placeId, retailer: current.retailer, branch: p.name, placeId: p.placeId, lat: p.lat, lng: p.lng, hasLayout: false }); setEditing(false); }} onSkip={() => setEditing(false)} onUseDemo={() => { setChosenStore(getStore()); setEditing(false); }} demoBranch={storeLabel(getStore())} /></div></main></AppShell>;
  return <AppShell current="shop"><main className="mx-auto w-full max-w-[560px] px-5 pt-6 pb-16"><p className="t-data text-[var(--wayfind)]">YOUR SHOP</p><h1 className="t-item mt-2">{storeLabel(current)}</h1><section className="mt-6 rounded-[22px] bg-[var(--shelf)] p-5"><div className="grid grid-cols-3 gap-3"><Fact label="AISLES" value={String(aisles)} /><Fact label="LAYOUT" value={current.hasLayout ? "Known" : "Section"} /><Fact label="TRIPS HERE" value={String(trips)} /></div><button type="button" onClick={() => setEditing(true)} className="btn btn-48 btn-outline mt-5 w-full">Edit shop</button></section><button type="button" onClick={() => setChosenStore({ ...current, hasLayout: !current.hasLayout })} className="mt-4 min-h-12 w-full rounded-2xl border-[1.5px] border-dashed border-[var(--concrete)] px-4 text-left"><span className="t-list">{current.hasLayout ? "Stop trusting this layout" : "Trust this layout"}</span><span className="t-reason mt-1 block">Without a trusted layout, Sweep uses fresh, bakery, dairy, cupboard, frozen, household.</span></button><section className="mt-6"><h2 className="t-title">Tips</h2><p className="t-reason mt-2">Aisles order the trip. Not here opens safe swaps. Locked items stay locked.</p></section></main></AppShell>;
}
function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-[14px] bg-[var(--wash)] p-3"><p className="t-data text-[var(--concrete)]">{label}</p><p className="t-list mt-1">{value}</p></div>; }
