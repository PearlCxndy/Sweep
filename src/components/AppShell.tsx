"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Mark } from "./Mark";
import { storeLabel } from "@/domain/types";
import { useActiveStore } from "@/lib/store";

type Screen = "list" | "trips" | "knows" | "shop";

const NAV: { href: string; label: string; short: string; id: Screen }[] = [
  { href: "/", label: "Your list", short: "List", id: "list" },
  { href: "/trips", label: "Past trips", short: "Trips", id: "trips" },
  { href: "/knows", label: "What sweep knows", short: "Knows", id: "knows" },
  { href: "/shop", label: "Your shop", short: "Shop", id: "shop" },
];

/**
 * Planning chrome only. Trip mode stays full-bleed — nobody is standing
 * in front of a sidebar while they shop.
 *
 * Desktop: left rail. Mobile: the same three destinations as a bottom bar,
 * so Past trips and What sweep knows are reachable the same way.
 */
export function AppShell({
  current,
  aside,
  dock,
  hideMobileChrome = false,
  children,
}: {
  current: Screen;
  aside?: ReactNode;
  dock?: ReactNode;
  hideMobileChrome?: boolean;
  children: ReactNode;
}) {
  const store = useActiveStore();

  return (
    <div className="min-h-dvh bg-[var(--wash)] lg:flex">
      <aside className="hidden w-[230px] shrink-0 flex-col border-r border-black/10 bg-[var(--paper)] px-5 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <Mark size={40} />
          <span className="t-title">sweep.</span>
        </Link>

        <nav className="mt-8 flex flex-col gap-1.5">
          {NAV.map((item) => (
            <NavLink key={item.id} item={item} current={current} />
          ))}
        </nav>

        <StoreCard />
      </aside>

      {!hideMobileChrome && (
        <header className="flex items-center justify-between px-5 pt-6 pb-2 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <Mark size={36} />
            <span className="t-title">sweep.</span>
          </Link>
          <p className="t-data max-w-[40%] truncate text-right text-[var(--concrete)]">
            {storeLabel(store)}
          </p>
        </header>
      )}

      <div
        className={`min-w-0 flex-1 lg:pb-0 ${
          dock
            ? "pb-[calc(9.5rem+env(safe-area-inset-bottom))]"
            : "pb-[calc(4.75rem+env(safe-area-inset-bottom))]"
        }`}
      >
        {children}
      </div>

      {aside && (
        <aside className="hidden w-[400px] shrink-0 flex-col overflow-y-auto border-l border-black/10 bg-[var(--paper)] px-6 py-8 lg:flex">
          {aside}
        </aside>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-[var(--paper)]/95 px-3 pt-2 backdrop-blur-sm lg:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {dock && <div className="mb-2 px-2">{dock}</div>}
        <nav className="flex gap-1" aria-label="Planning">
          {NAV.map((item) => (
            <NavLink key={item.id} item={item} current={current} compact />
          ))}
        </nav>
      </div>
    </div>
  );
}

function NavLink({
  item,
  current,
  compact = false,
}: {
  item: (typeof NAV)[number];
  current: Screen;
  compact?: boolean;
}) {
  const active = item.id === current;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`press flex h-11 items-center rounded-[14px] ${
        compact ? "flex-1 justify-center px-2 text-[15px]" : "px-3.5"
      } ${
        active ? "bg-[var(--ripe)] text-[var(--ink)]" : "text-[var(--concrete)]"
      }`}
    >
      {compact ? item.short : item.label}
    </Link>
  );
}

function StoreCard() {
  const store = useActiveStore();
  return (
    <div className="mt-auto rounded-[18px] bg-[var(--shelf)] p-3.5">
      <p className="t-data text-[var(--concrete)]">STORE</p>
      <p className="t-list mt-1.5 leading-snug">{storeLabel(store)}</p>
      <p className="t-data mt-2 text-[var(--concrete)]">
        {store.hasLayout ? "LAYOUT KNOWN" : "NO AISLE DATA"}
      </p>
    </div>
  );
}
