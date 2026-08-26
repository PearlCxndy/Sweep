"use client";

import { AppShell } from "@/components/AppShell";
import { InferenceRow } from "@/components/InferenceRow";
import { getInferences } from "@/data/repositories";
import { useHydrated } from "@/lib/hooks";
import { useSweep } from "@/lib/store";

export default function WhatSweepHasLearned() {
  const deletedIds = useSweep((s) => s.deletedInferenceIds);
  const deleteInference = useSweep((s) => s.deleteInference);
  const sponsoredEnabled = useSweep((s) => s.sponsoredEnabled);
  const setSponsored = useSweep((s) => s.setSponsored);

  const mounted = useHydrated();

  if (!mounted) return <div className="min-h-dvh bg-[var(--wash)]" />;

  const inferences = getInferences().filter(
    (i) => !i.deleted && !deletedIds.includes(i.id),
  );

  return (
    <AppShell current="knows">
      <main className="mx-auto w-full max-w-[560px] px-5 pt-4 pb-8 lg:max-w-none lg:px-8 lg:pt-8">
        <h1 className="t-item">What sweep has learned</h1>
        <p className="t-reason mt-2 max-w-[36rem]">
          All of it comes from your own trips. Delete anything that&apos;s
          wrong and sweep stops using it.
        </p>

        {inferences.length === 0 ? (
          <p className="t-reason mt-8">
            Nothing here. Suggestions will come from purchase history alone.
          </p>
        ) : (
          <ul className="mt-6 grid gap-3 lg:grid-cols-2 lg:gap-4">
            {inferences.map((inference) => (
              <InferenceRow
                key={inference.id}
                inference={inference}
                onDelete={() => deleteInference(inference.id)}
              />
            ))}
          </ul>
        )}

        <section className="mt-6 flex flex-col gap-4 rounded-[22px] bg-[var(--shelf)] p-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h2 className="t-data text-[var(--concrete)]">
              SPONSORED SUGGESTIONS
            </h2>
            <p className="t-list mt-2">
              Max one per trip. Never in your list order, never in
              substitutions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSponsored(!sponsoredEnabled)}
            className="btn btn-48 btn-outline shrink-0 px-6"
          >
            {sponsoredEnabled ? "Turn off" : "Turn on"}
          </button>
        </section>
      </main>
    </AppShell>
  );
}
