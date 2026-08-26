import { ProductMark } from "./ProductMark";
import type { SectionKey } from "@/domain/types";

/** Filled section mark. Same drawing as ProductMark, sized for a row. */
export function SectionIcon({
  section,
  className = "",
}: {
  section: SectionKey;
  className?: string;
}) {
  return <ProductMark section={section} size={44} className={className} />;
}
