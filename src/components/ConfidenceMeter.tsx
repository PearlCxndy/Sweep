import type { Confidence } from "@/domain/types";

const FILLED: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

const WORD: Record<Confidence, string> = {
  high: "Strong evidence",
  medium: "Some evidence",
  low: "Little evidence",
};

const LABEL: Record<Confidence, string> = {
  high: "SURE",
  medium: "SOME",
  low: "MAYBE",
};

/**
 * Evidence strength, never a percentage, never a coloured pill.
 * Three dots. The unfilled ones stay visible so the scale is legible.
 */
export function ConfidenceMeter({
  confidence,
  className = "",
  labelled = false,
}: {
  confidence: Confidence;
  className?: string;
  labelled?: boolean;
}) {
  const filled = FILLED[confidence];
  const quiet = confidence === "low";

  return (
    <span
      className={`t-data inline-flex items-center gap-1.5 ${
        quiet ? "text-[var(--concrete)]" : "text-[var(--ink)]"
      } ${className}`}
      title={WORD[confidence]}
    >
      <span className="sr-only">{WORD[confidence]}</span>
      <span className="inline-flex gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={i < filled ? "opacity-100" : "opacity-30"}>
            ●
          </span>
        ))}
      </span>
      {labelled && <span>{LABEL[confidence]}</span>}
    </span>
  );
}
