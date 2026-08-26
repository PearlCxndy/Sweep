"use client";

import type { ReactNode } from "react";

/**
 * Floating action button, sized to the reference guide:
 *
 *   standard  56 × 56, 24px icon
 *   mini      40 × 40, 24px icon
 *   extended  48 high · 12px lead · 8px gap · 20px trail · 14px label
 *
 * It floats, so it is deliberately not the primary action anywhere in trip
 * mode. A shopper pushing a trolley gets a full-width 56px target for the
 * thing that matters; a FAB is for the secondary action that should stay
 * reachable without taking that space.
 */
export function Fab({
  icon,
  label,
  size = "standard",
  onClick,
  className = "",
  ...rest
}: {
  icon: ReactNode;
  /** Required for the extended size, and the accessible name for the others. */
  label: string;
  size?: "standard" | "mini" | "extended";
  onClick: () => void;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<"button">, "onClick" | "className">) {
  const extended = size === "extended";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={extended ? undefined : label}
      className={`press inline-flex shrink-0 items-center justify-center rounded-full ${
        extended
          ? "h-12 gap-2 pr-5 pl-3"
          : size === "mini"
            ? "size-10"
            : "size-14"
      } ${className}`}
      {...rest}
    >
      <span
        aria-hidden
        className="flex size-6 items-center justify-center leading-none"
      >
        {icon}
      </span>
      {extended && <span className="text-[14px] leading-none">{label}</span>}
    </button>
  );
}
