"use client";

import { useState } from "react";
import { APIProvider, AdvancedMarker, Map } from "@vis.gl/react-google-maps";

import { RETAILER_NAMES } from "@/domain/types";
import type { Retailer } from "@/domain/types";
import { hasSeededLayout, seededPlaceFor } from "@/domain/stores";
import { requestLocation } from "@/lib/geo";

export type Place = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const LONDON = { lat: 51.5074, lng: -0.1278 };
const BROWSER_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;

type Phase = "idle" | "loading" | "denied" | "empty";

export function BranchPicker({
  retailer,
  onPick,
  onSkip,
  onUseDemo,
  demoBranch,
}: {
  retailer: Retailer;
  onPick: (place: Place) => void;
  onSkip: () => void;
  /** Case-study scaffolding: the one branch with seeded history behind it. */
  onUseDemo: () => void;
  demoBranch: string;
}) {
  const seeded = seededPlaceFor(retailer);
  const [places, setPlaces] = useState<Place[]>(seeded ? [seeded] : []);
  const [selected, setSelected] = useState<Place | null>(seeded ?? null);
  const [postcode, setPostcode] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");

  async function search(body: Record<string, unknown>) {
    setPhase("loading");
    try {
      const res = await fetch("/api/stores/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retailer, ...body }),
      });
      const data = (await res.json()) as { places?: Place[] };
      const found = data.places ?? [];
      setPlaces(found);
      setSelected(found[0] ?? null);
      setPhase(found.length ? "idle" : "empty");
    } catch {
      // A third party being down must not block a shopping list.
      setPlaces([]);
      setSelected(null);
      setPhase("empty");
    }
  }

  async function useMyLocation() {
    setPhase("loading");
    const coords = await requestLocation();
    if (!coords) {
      setPhase("denied");
      return;
    }
    await search(coords);
  }

  const center = selected
    ? { lat: selected.lat, lng: selected.lng }
    : places[0]
      ? { lat: places[0].lat, lng: places[0].lng }
      : LONDON;

  const showPostcode = phase === "denied" || phase === "empty";

  return (
    <div>
      <h1 className="t-item">Which branch?</h1>
      <p className="t-reason mt-2">
        Sweep orders your list by the layout of one shop, so it needs the right
        one. {RETAILER_NAMES[retailer]} Extra and Metro are laid out nothing
        alike.
      </p>

      {places.length === 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={phase === "loading"}
            className="btn btn-56 btn-ink w-full"
          >
            {phase === "loading" ? "Looking…" : "Find shops near me"}
          </button>

          {showPostcode && (
            <div className="fade-in mt-5">
              <p className="t-reason">
                {phase === "denied"
                  ? "No location, no problem. A postcode works just as well."
                  : `No ${RETAILER_NAMES[retailer]} found near there.`}
              </p>
              <label htmlFor="pc" className="sr-only">
                Postcode
              </label>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (postcode.trim().length >= 3) search({ postcode });
                }}
              >
                <input
                  id="pc"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="E14 0TB"
                  autoComplete="postal-code"
                  inputMode="text"
                  maxLength={12}
                  className="t-list h-12 min-w-0 flex-1 rounded-2xl border-[1.5px] border-[var(--concrete)] bg-transparent px-3.5 placeholder:text-[var(--concrete)]"
                />
                <button
                  type="submit"
                  disabled={postcode.trim().length < 3}
                  className="btn btn-48 btn-outline shrink-0 px-5"
                >
                  Search
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {places.length > 0 && (
        <div className="mt-6">
          {/* The map confirms a location. The list below is the real control
              surface: a 44px row beats a pin when you are holding a phone. */}
          {BROWSER_KEY && (
            <APIProvider apiKey={BROWSER_KEY}>
              <Map
                mapId={MAP_ID}
                defaultCenter={center}
                defaultZoom={13}
                center={center}
                gestureHandling="greedy"
                disableDefaultUI
                style={{ height: 200, borderRadius: 12 }}
              >
                {places.map((p) => (
                  <AdvancedMarker
                    key={p.placeId}
                    position={{ lat: p.lat, lng: p.lng }}
                    onClick={() => setSelected(p)}
                  />
                ))}
              </Map>
            </APIProvider>
          )}

          <ul className="mt-4 flex flex-col gap-2">
            {places.map((p) => {
              const isSelected = selected?.placeId === p.placeId;
              const known = hasSeededLayout(retailer, p.name);
              return (
                <li key={p.placeId}>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    aria-pressed={isSelected}
                    className={`flex min-h-[56px] w-full flex-col justify-center rounded-2xl px-4 py-2.5 text-left ${
                      isSelected
                        ? "border-[2.5px] border-[var(--ink)] bg-[var(--ripe-wash)]"
                        : "border-[1.5px] border-[var(--concrete)]"
                    }`}
                  >
                    <span className="t-list">{p.name}</span>
                    <span className="t-reason mt-0.5">{p.address} · {known ? "layout known · 14 aisles" : "layout unknown · sorts by section"}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onPick(selected)}
            className="btn btn-56 btn-ink mt-6 w-full"
          >
            {selected ? `Use ${selected.name}` : "Pick a branch"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaces([]);
              setSelected(null);
              setPhase("idle");
            }}
            className="btn btn-48 btn-ghost mt-2 w-full"
          >
            Find a different shop
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onSkip}
        className="btn btn-48 btn-ghost mt-2 w-full"
      >
        Skip for now
      </button>

      {!places.some((p) => hasSeededLayout(retailer, p.name)) && (
        <button
          type="button"
          onClick={onUseDemo}
          className="btn btn-48 btn-ghost mt-2 w-full"
        >
          Use {demoBranch}
        </button>
      )}
    </div>
  );
}
