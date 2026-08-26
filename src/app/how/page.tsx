"use client";

import { AisleMarker } from "@/components/AisleMarker";
import { AppShell } from "@/components/AppShell";
import { ConfidenceMeter } from "@/components/ConfidenceMeter";
import { ProduceScene } from "@/components/ProduceScene";
import { SubstituteTicket } from "@/components/SubstituteTicket";
import { getProduct, getPreferenceMap } from "@/data/repositories";

export default function HowItWorks() {
  const milk = getProduct("milk-semi-1l")!;
  const loaf = getProduct("gf-white-loaf")!;
  const preference = getPreferenceMap()[loaf.id];
  return <AppShell current="list"><main className="mx-auto w-full max-w-[700px] px-5 pt-6 pb-16 lg:px-8">
    {/* Contained, not a fixed band: this page scrolls. */}
    <div className="relative isolate overflow-hidden rounded-[22px] bg-[var(--grove)] px-5 pt-6 pb-[104px] text-[var(--linen)]">
      <ProduceScene variant="how" className="absolute inset-x-0 bottom-0 -z-10 h-[150px]" />
      <p className="t-data text-[color-mix(in_srgb,var(--linen)_70%,transparent)]">HOW IT WORKS</p>
      <h1 className="t-item mt-2 max-w-[18ch]">
        Lists remember items. They do not help you decide.
      </h1>
      <p className="t-reason mt-3 max-w-[46ch] text-[color-mix(in_srgb,var(--linen)_72%,transparent)]">
        A list is at its least useful in the one place you are holding it. Sweep
        is built for the forty minutes inside the shop, and for the three
        decisions a list leaves you to make alone.
      </p>
    </div>
    <div className="mt-7 grid gap-4">
      <section className="rounded-[22px] bg-[var(--shelf)] p-5">
        <p className="t-data text-[var(--concrete)]">01 · REMEMBER</p>
        <h2 className="t-title mt-1">The staple you forgot</h2>
        <p className="t-reason mt-2">
          Suggestions come from how often you have actually bought something,
          and each one says so. A pattern Sweep cannot see yet is called
          unclear rather than dressed up as a guess.
        </p>
        <div className="mt-4 rounded-[18px] bg-[var(--wash)] p-4">
          <p className="t-list">Semi-skimmed milk, 2L</p>
          <p className="t-reason mt-1">You buy this every 9 days. It&rsquo;s been 8.</p>
          <div className="mt-2 flex items-center gap-2">
            <ConfidenceMeter confidence="high" />
            <span className="t-data text-[var(--concrete)]">31 PURCHASES</span>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] bg-[var(--shelf)] p-5"><p className="t-data text-[var(--concrete)]">02 · NAVIGATE</p><h2 className="t-title mt-1">The backtrack</h2><p className="t-reason mt-2">Sweep groups a list in the order of the chosen shop. If it does not know the layout, it sorts by section instead.</p><div className="mt-4"><AisleMarker aisle={4} section="Dairy" /></div></section>
      <section className="rounded-[22px] bg-[var(--shelf)] p-5"><p className="t-data text-[var(--concrete)]">03 · RESOLVE</p><h2 className="t-title mt-1">The empty shelf</h2><p className="t-reason mt-2">A useful alternative gets a reason—not just a product name.</p><div className="mt-4"><SubstituteTicket ranked={{ product: milk, score: 50, reason: "Same product, smaller size. Buy 2.", recommended: true }} onChoose={() => undefined} /></div></section>
      <section className="rounded-[22px] bg-[var(--shelf)] p-5"><p className="t-data text-[var(--halt)]">RESOLVE · THE HARD STOP</p><h2 className="t-title mt-1">The wrong swap</h2><p className="t-reason mt-2">Some items are protected. Sweep does not make a close-but-unsafe substitution.</p><div className="mt-4 rounded-[18px] border-l-2 border-[var(--halt)] bg-[var(--wash)] p-4"><p className="t-data text-[var(--halt)]">NEVER SUBSTITUTE</p><p className="t-list mt-2">{loaf.name}</p><p className="t-reason mt-2">{preference?.note}</p></div></section>
    </div>

    <section className="mt-4 rounded-[22px] border border-black/10 p-5">
      <h2 className="t-title">What is real here</h2>
      <p className="t-reason mt-2">
        This is a prototype with invented data. The shop, its aisle layout, the
        prices and six months of purchase history are all seeded — there is no
        retailer feed behind it and no claim of one. Sweep never says what is on
        a shelf, because only the person standing in front of it can see that.
      </p>
      <p className="t-reason mt-2">
        What is real is the behaviour: the suggestion rules, the safety gate and
        the route ordering are deterministic, and they are covered by tests.
      </p>
    </section>
  </main></AppShell>;
}
