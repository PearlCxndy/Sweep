/** Segmented bar. The count above it says the number. */
export function ProgressHairline({
  done,
  total,
  /** The segment that has just been earned, so it can land rather than appear. */
  landing = false,
}: {
  done: number;
  total: number;
  landing?: boolean;
}) {
  const n = Math.max(total, 1);

  return (
    <div
      className="flex gap-1"
      role="progressbar"
      aria-valuenow={done}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${done} of ${total} in the trolley`}
    >
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          aria-hidden
          className={`h-1 flex-1 rounded-full ${
            i < done ? "bg-[var(--ripe)]" : "bg-white/16"
          } ${landing && i === done - 1 ? "hairline-land" : ""}`}
        />
      ))}
    </div>
  );
}
