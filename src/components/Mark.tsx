import Image from "next/image";

import logo from "@/app/sweeplogo.png";

/** The grocery-bag mark. Sits next to the word, or alone as the brand. */
export function Mark({
  size = 36,
  labelled = false,
}: {
  size?: number;
  labelled?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt={labelled ? "sweep." : ""}
      width={size}
      height={size}
      priority
      className="shrink-0 rounded-[10px]"
      aria-hidden={labelled ? undefined : true}
    />
  );
}
