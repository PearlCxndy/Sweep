export type CategoryMarkName =
  | "meat-fish"
  | "fruit-veg"
  | "snacks"
  | "tins-cooking"
  | "dairy"
  | "bakery"
  | "frozen"
  | "household-toiletries"
  | "pantry-drinks";

const CATEGORY_FILE: Record<CategoryMarkName, string> = {
  "meat-fish": "meat-fish-v1",
  "fruit-veg": "fruit-veg-v1",
  snacks: "snacks-v1",
  "tins-cooking": "tins-cooking-v1",
  dairy: "dairy-v1",
  bakery: "bakery-v1",
  frozen: "frozen-v1",
  "household-toiletries": "household-toiletries-v1",
  "pantry-drinks": "pantry-drinks-v1",
};

const SECTION_MARK: Record<string, CategoryMarkName> = {
  "meat & fish": "meat-fish",
  "fruit & veg": "fruit-veg",
  fresh: "fruit-veg",
  snacks: "snacks",
  "tins & cooking": "tins-cooking",
  cupboard: "tins-cooking",
  dairy: "dairy",
  chilled: "dairy",
  bakery: "bakery",
  frozen: "frozen",
  household: "household-toiletries",
  toiletries: "household-toiletries",
  "household/toiletries": "household-toiletries",
  "pasta & rice": "pantry-drinks",
  "tea & coffee": "pantry-drinks",
  drinks: "pantry-drinks",
  "pasta/cereal, tea/coffee, drinks": "pantry-drinks",
};

export function categoryMarkForSection(
  section: string,
): CategoryMarkName | undefined {
  return SECTION_MARK[section.trim().toLowerCase()];
}

const GROUP_MARK: Record<string, CategoryMarkName> = {
  poultry: "meat-fish",
  "red-meat": "meat-fish",
  pork: "meat-fish",
  deli: "meat-fish",
  fish: "meat-fish",
  fruit: "fruit-veg",
  veg: "fruit-veg",
  salad: "fruit-veg",
  crisps: "snacks",
  biscuits: "snacks",
  chocolate: "snacks",
  "tinned-veg": "tins-cooking",
  "tinned-pulses": "tins-cooking",
  "tinned-fish": "tins-cooking",
  condiments: "tins-cooking",
  spreads: "tins-cooking",
  milk: "dairy",
  yoghurt: "dairy",
  cheese: "dairy",
  butter: "dairy",
  eggs: "dairy",
  cream: "dairy",
  dips: "dairy",
  bread: "bakery",
  "free-from-bread": "bakery",
  pastry: "bakery",
  "frozen-veg": "frozen",
  "frozen-potato": "frozen",
  "frozen-meal": "frozen",
  "frozen-dessert": "frozen",
  cleaning: "household-toiletries",
  paper: "household-toiletries",
  toiletries: "household-toiletries",
  pasta: "pantry-drinks",
  grains: "pantry-drinks",
  cereal: "pantry-drinks",
  tea: "pantry-drinks",
  coffee: "pantry-drinks",
  "soft-drinks": "pantry-drinks",
  juice: "pantry-drinks",
};

export function categoryMarkForProduct(
  product: Product,
): CategoryMarkName | undefined {
  if (product.group && GROUP_MARK[product.group]) {
    return GROUP_MARK[product.group];
  }
  return categoryMarkForSection(product.category);
}

export function CategoryMark({
  name,
  size = 44,
  className = "",
}: {
  name: CategoryMarkName;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`relative inline-block shrink-0 overflow-hidden rounded-[15px] bg-[#F6F1DF] ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Standalone square artwork: no sprite positioning or crop leakage. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/category-marks/${CATEGORY_FILE[name]}.png`}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
    </span>
  );
}
import type { Product } from "@/domain/types";
