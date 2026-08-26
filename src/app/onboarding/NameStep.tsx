"use client";

import { useState } from "react";
import { ProduceCluster } from "@/components/ProduceCluster";

/**
 * Optional, and skipping is a real option rather than a smaller button.
 * The name personalises one line of copy and nothing else reads it.
 */
export function NameStep({
  initial,
  onNext,
}: {
  initial: string | null;
  onNext: (displayName: string | null) => void;
}) {
  const [name, setName] = useState(initial ?? "");
  const trimmed = name.trim();

  return (
    <form className="relative z-10"
      onSubmit={(e) => {
        e.preventDefault();
        onNext(trimmed.length > 0 ? trimmed : null);
      }}
    >
      <h1 className="t-item">What should we call you?</h1>
      <p className="t-reason mt-2">
        Optional. It changes one line at the top of your list and nothing else.
      </p>

      <label htmlFor="display-name" className="sr-only">
        Your name
      </label>
      <input
        id="display-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoComplete="given-name"
        maxLength={40}
        className="t-list mt-6 h-14 w-full rounded-2xl border-[1.5px] border-[color-mix(in_srgb,var(--linen)_40%,transparent)] bg-transparent px-3.5 text-[var(--linen)] caret-[var(--ripe-strong)] placeholder:text-[color-mix(in_srgb,var(--linen)_55%,transparent)]"
      />

      <div className="mt-8 flex flex-col gap-2">
        <button type="submit" className="btn btn-56 btn-ripe-on-grove w-full">
          Continue
        </button>
        <button
          type="button"
          onClick={() => onNext(null)}
          className="btn btn-48 btn-ghost w-full text-[var(--linen)]"
        >
          Skip
        </button>
      </div>
      <ProduceCluster variant="name" />
    </form>
  );
}
