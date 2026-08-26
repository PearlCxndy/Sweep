"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BranchPicker } from "./BranchPicker";
import type { Place } from "./BranchPicker";
import { NameStep } from "./NameStep";
import { ReadyStep } from "./ReadyStep";
import { RetailerStep } from "./RetailerStep";
import { Mark } from "@/components/Mark";
import { getPurchases, getStore } from "@/data/repositories";
import { storeName } from "@/domain/types";
import type { Retailer, Store } from "@/domain/types";
import { useHydrated } from "@/lib/hooks";
import { useSweep } from "@/lib/store";

type Step = "name" | "retailer" | "branch" | "ready";

const STEPS: Step[] = ["name", "retailer", "branch", "ready"];
const GROUND: Record<Step, "grove" | "linen"> = {
  name: "grove", retailer: "linen", branch: "linen", ready: "grove",
};

/**
 * Every step is skippable. Skipping all of them lands on a working app with
 * section ordering and no suggestions, which is a legitimate state rather than
 * a degraded one.
 *
 * The rule this flow is built to: onboarding must complete with no network,
 * no location, and no interaction beyond one tap.
 */
export default function Onboarding() {
  const router = useRouter();
  const mounted = useHydrated();
  const completeOnboarding = useSweep((s) => s.completeOnboarding);
  const reduceMotion = useReducedMotion();

  const [step, setStep] = useState<Step>("name");
  const [history, setHistory] = useState<Step[]>([]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [saving, setSaving] = useState(false);

  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: reduceMotion ? 0 : 0.35,
      ease: "easeOut" as const,
    },
  };

  function goTo(next: Step) {
    setHistory((stack) => [...stack, step]);
    setStep(next);
  }

  function goBack() {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((stack) => stack.slice(0, -1));
    setStep(previous);
  }

  async function pickBranch(place: Place) {
    if (!retailer) return;
    setSaving(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retailer,
          name: place.name,
          placeId: place.placeId,
          lat: place.lat,
          lng: place.lng,
        }),
      });
      const data = (await res.json()) as { store?: Store };
      setStore(data.store ?? null);
    } catch {
      // The branch is still worth keeping even if the write failed; the
      // shopper picked it and should not be sent round the loop again.
      setStore({
        id: place.placeId,
        retailer,
        branch: place.name,
        placeId: place.placeId,
        lat: place.lat,
        lng: place.lng,
        hasLayout: false,
      });
    } finally {
      setSaving(false);
      goTo("ready");
    }
  }

  function finish() {
    completeOnboarding({ displayName, store });
    router.replace("/");
  }

  if (!mounted) return <div className="min-h-dvh grove-ground" />;

  const hasHistory = store
    ? getPurchases().some((p) => p.storeId === store.id)
    : false;
  const grove = GROUND[step] === "grove";
  const canGoBack = history.length > 0;
  const stepIndex = STEPS.indexOf(step) + 1;
  const stepTotal = STEPS.length;

  // `isolate` gives the ground its own stacking context, so the produce can sit
  // on a negative layer: above this background, behind every control.
  return (
    <div
      className={`relative isolate min-h-dvh ${
        grove ? "grove-ground" : "bg-[var(--linen)] text-[var(--ink)]"
      }`}
    >
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-5 pt-8 pb-10">
        <header>
          <div className="flex items-center gap-2.5">
            <Mark size={32} />
            <span className="font-[family-name:var(--font-archivo)] text-[20px] font-bold tracking-[-0.035em]">
              sweep.
            </span>
          </div>
          <div
            className="mt-5 h-[3px] w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={1}
            aria-valuenow={stepIndex}
            aria-valuemax={stepTotal}
            aria-label={`Step ${stepIndex} of ${stepTotal}`}
            style={{
              background: grove
                ? "color-mix(in srgb, var(--linen) 22%, transparent)"
                : "color-mix(in srgb, var(--ink) 12%, transparent)",
            }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(stepIndex / stepTotal) * 100}%`,
                background: grove ? "var(--linen)" : "var(--ink)",
                transition: reduceMotion ? undefined : "width 350ms ease-out",
              }}
            />
          </div>
        </header>

        <div className="mt-5 min-h-11">
          <AnimatePresence>
            {canGoBack && (
              <motion.button
                key="onboarding-back"
                type="button"
                onClick={goBack}
                aria-label="Go back"
                initial={fade.initial}
                animate={fade.animate}
                exit={fade.exit}
                transition={fade.transition}
                className={`t-list flex min-h-11 items-center gap-2 ${
                  grove ? "text-[var(--linen)]" : "text-[var(--ink)]"
                }`}
              >
                <span aria-hidden>←</span>
                Back
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={fade.initial}
              animate={fade.animate}
              exit={fade.exit}
              transition={fade.transition}
            >
              {step === "name" && (
                <NameStep
                  initial={displayName}
                  onNext={(name) => {
                    setDisplayName(name);
                    goTo("retailer");
                  }}
                />
              )}

              {step === "retailer" && (
                <RetailerStep
                  initial={retailer}
                  onNext={(picked) => {
                    setRetailer(picked);
                    goTo("branch");
                  }}
                  onSkip={() => goTo("ready")}
                />
              )}

              {step === "branch" && retailer && (
                <>
                  <BranchPicker
                    retailer={retailer}
                    onPick={pickBranch}
                    onSkip={() => goTo("ready")}
                    onUseDemo={() => {
                      setStore(getStore());
                      goTo("ready");
                    }}
                    demoBranch={`${storeName(getStore())} ${getStore().branch}`}
                  />
                  {saving && (
                    <p className="t-reason mt-3" aria-live="polite">
                      Saving that branch…
                    </p>
                  )}
                </>
              )}

              {step === "ready" && (
                <ReadyStep store={store} hasHistory={hasHistory} onDone={finish} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
