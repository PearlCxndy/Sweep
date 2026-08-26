import type { Product, SectionKey } from "@/domain/types";
import { CategoryMark, categoryMarkForProduct } from "./CategoryMark";

/**
 * Flat cut-fruit marks. Illustration fills sit apart from UI state colour —
 * two tones per object, no outline, no gradient.
 */
export function ProductMark({
  section,
  product,
  size = 52,
  className = "",
}: {
  section?: SectionKey;
  product?: Product;
  size?: number;
  className?: string;
}) {
  const key = section ?? product?.category ?? "cupboard";
  const art = product
    ? PRODUCT_ART[product.id]
    : section
      ? SECTION_ART[section]
      : undefined;
  const categoryArt = product && !art ? categoryMarkForProduct(product) : undefined;

  if (categoryArt) {
    return (
      <CategoryMark
        name={categoryArt}
        size={size}
        className={className}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`relative inline-block shrink-0 overflow-hidden rounded-[15px] bg-[#F4F7EA] ${className}`}
      style={{ width: size, height: size }}
    >
      {art ? <FlatProductArt art={art} /> : <MarkInner section={key} size={size} />}
    </span>
  );
}

/** A crop from the hand-cut grocery sprite sheet. */
export type FlatProductArtName =
  | "bananas"
  | "tomatoes"
  | "apple"
  | "lemon"
  | "springOnions"
  | "carrot"
  | "avocado"
  | "potato"
  | "broccoli"
  | "milk"
  | "bread"
  | "cheese";

const ART_FILE: Record<FlatProductArtName, string> = {
  bananas: "bananas-centered-v3",
  tomatoes: "tomato-centered-v4",
  apple: "apple-centered-v3",
  lemon: "lemon",
  springOnions: "spring-onions",
  carrot: "carrot",
  avocado: "avocado",
  potato: "potato",
  broccoli: "broccoli",
  milk: "milk-centered-v3",
  bread: "bread-centered-v3",
  cheese: "cheese-centered-v3",
};

const PRODUCT_ART: Record<string, FlatProductArtName> = {
  bananas: "bananas",
  "cherry-tomatoes": "tomatoes",
  carrots: "carrot",
  "gala-apples": "apple",
  avocados: "avocado",
  "spring-onions": "springOnions",
  "maris-piper": "potato",
  lemons: "lemon",
  "baby-spinach": "broccoli",
  "garden-peas": "broccoli",
  "mixed-vegetables": "broccoli",
  "white-bread": "bread",
  "wholemeal-bread": "bread",
  bagels: "bread",
  croissants: "bread",
  "gf-white-loaf": "bread",
  "gf-brown-loaf": "bread",
  "mature-cheddar": "cheese",
  "milk-semi-2l": "milk",
  "milk-semi-1l": "milk",
  "milk-whole-2l": "milk",
  "milk-arla-semi-2l": "milk",
};

const SECTION_ART: Partial<Record<SectionKey, FlatProductArtName>> = {
  fresh: "tomatoes",
  dairy: "milk",
  bakery: "bread",
};

export function hasProductArtwork(product: Product): boolean {
  return Boolean(PRODUCT_ART[product.id]);
}

export function FlatProductArt({ art }: { art: FlatProductArtName }) {
  return (
    // A standalone tile keeps the item centred and prevents neighbouring
    // artwork from appearing in the rounded icon.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/product-marks/flat/${ART_FILE[art]}.png`}
      alt=""
      className="absolute inset-0 size-full object-cover"
    />
  );
}

function MarkInner({ section, size }: { section: SectionKey; size: number }) {
  const s = size / 52;

  if (section === "dairy") {
    return (
      <>
        <span
          className="absolute rounded-[4px] bg-[#DCE9F6]"
          style={{ left: 13 * s, bottom: 8 * s, width: 16 * s, height: 32 * s }}
        />
        <span
          className="absolute bg-[#B9D2EA]"
          style={{ left: 13 * s, top: 11 * s, width: 16 * s, height: 8 * s }}
        />
        <span
          className="absolute rounded-[3px] bg-[#F4E9C6]"
          style={{ right: 6 * s, bottom: 8 * s, width: 13 * s, height: 18 * s }}
        />
      </>
    );
  }

  if (section === "bakery") {
    return (
      <>
        <span
          className="absolute bg-[#F0D9A8]"
          style={{
            left: 6 * s,
            top: 16 * s,
            width: 40 * s,
            height: 24 * s,
            borderRadius: `${11 * s}px ${11 * s}px ${6 * s}px ${6 * s}px`,
          }}
        />
        <span
          className="absolute rounded-[3px] bg-[#D9BE86]"
          style={{ left: 14 * s, top: 24 * s, width: 24 * s, height: 5 * s }}
        />
      </>
    );
  }

  if (section === "fresh") {
    return (
      <>
        <span
          className="absolute rounded-full bg-[#E4574C]"
          style={{ left: 6 * s, bottom: 6 * s, width: 28 * s, height: 28 * s }}
        />
        <span
          className="absolute rounded-full border-[3px] border-[#E4574C] bg-[#F6EFDC]"
          style={{ right: 4 * s, bottom: 5 * s, width: 20 * s, height: 20 * s }}
        />
        <span
          className="absolute rounded-[2px] bg-[#7A5533]"
          style={{ left: 22 * s, top: 6 * s, width: 4 * s, height: 11 * s }}
        />
        <span
          className="absolute bg-[#4E8A46]"
          style={{
            left: 26 * s,
            top: 7 * s,
            width: 14 * s,
            height: 8 * s,
            borderRadius: `0 ${8 * s}px 0 ${8 * s}px`,
          }}
        />
      </>
    );
  }

  if (section === "cupboard") {
    return (
      <>
        <span
          className="absolute rounded-[3px] bg-[#C9AE7E]"
          style={{ left: 10 * s, bottom: 8 * s, width: 16 * s, height: 30 * s }}
        />
        <span
          className="absolute rounded-[3px] bg-[#A98A5C]"
          style={{ right: 8 * s, bottom: 8 * s, width: 17 * s, height: 21 * s }}
        />
      </>
    );
  }

  if (section === "frozen") {
    return (
      <>
        <span
          className="absolute rounded-[10px] bg-[#E6EEF6]"
          style={{ left: 8 * s, top: 8 * s, width: 36 * s, height: 36 * s }}
        />
        <span
          className="absolute rounded-full bg-[#BCD6EA]"
          style={{ left: 16 * s, top: 16 * s, width: 20 * s, height: 20 * s }}
        />
      </>
    );
  }

  return (
    <>
      <span
        className="absolute rounded-[6px] bg-[#C7BFE4]"
        style={{ left: 8 * s, bottom: 8 * s, width: 36 * s, height: 26 * s }}
      />
      <span
        className="absolute rounded-full bg-[#A79BD6]"
        style={{ left: 16 * s, top: 10 * s, width: 16 * s, height: 16 * s }}
      />
    </>
  );
}

export const SECTION_WASH: Record<SectionKey, string> = {
  dairy: "#E4EEF6",
  bakery: "#F6F0E3",
  fresh: "#E8E4F2",
  cupboard: "#F5EFE5",
  frozen: "#EDF4F5",
  household: "#F0EEF5",
};
