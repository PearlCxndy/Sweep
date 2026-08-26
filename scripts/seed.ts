/**
 * Seed generator. Output is committed to src/data/seed/*.json.
 *
 * This data is INVENTED. There is no retailer feed behind it and no claim of
 * one. Aisle numbers, prices and stock are fabricated to demonstrate the
 * product's logic. Re-run with `npm run seed`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Inference,
  Product,
  Purchase,
  SectionKey,
  Store,
  StorePlacement,
  Trip,
  UserProductPreference,
} from "../src/domain/types";
import { confidenceOf, intervalsOf, median } from "../src/domain/confidence";
import { RETAILER_NAMES } from "../src/domain/types";

const OUT = join(process.cwd(), "src", "data", "seed");

/** Anchored so the committed seed is reproducible. */
const REFERENCE_TODAY = "2026-08-23";
/** Days between the last shop and the reference day. */
const DAYS_SINCE_LAST_TRIP = 8;

const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const parse = (d: string) => Date.parse(`${d}T00:00:00Z`);

// ---------------------------------------------------------------- store

const store: Store = {
  id: "tesco-express-poplar-high-st",
  retailer: "tesco",
  branch: "Express 262 Poplar High St",
  // Seeded, not resolved through Places, so there is no place_id to claim.
  placeId: null,
  // The branch is named for the demo, but it is not resolved through Places.
  // Do not attach the previous demo branch's coordinates to it.
  lat: null,
  lng: null,
  hasLayout: true,
};

const AISLES = [
  { aisle: 1, order: 1, section: "Fruit & veg" },
  { aisle: 2, order: 2, section: "Bakery" },
  { aisle: 3, order: 3, section: "Meat & fish" },
  { aisle: 4, order: 4, section: "Dairy" },
  { aisle: 5, order: 5, section: "Chilled" },
  { aisle: 6, order: 6, section: "Tins & cooking" },
  { aisle: 7, order: 7, section: "Pasta & rice" },
  { aisle: 8, order: 8, section: "Tea & coffee" },
  { aisle: 9, order: 9, section: "Snacks" },
  { aisle: 10, order: 10, section: "Free from" },
  { aisle: 11, order: 11, section: "Frozen" },
  { aisle: 12, order: 12, section: "Household" },
  { aisle: 13, order: 13, section: "Toiletries" },
  { aisle: 14, order: 14, section: "Drinks" },
];

// ---------------------------------------------------------------- trips

/**
 * Fortnightly Saturday big shops, with a Thursday top-up five days after
 * every other one. 22 trips across roughly six months.
 */
function tripDates(): { date: string; kind: "big" | "topup" }[] {
  const last = parse(REFERENCE_TODAY) - DAYS_SINCE_LAST_TRIP * DAY;
  const big: number[] = [];
  for (let i = 13; i >= 0; i--) big.push(last - i * 14 * DAY);

  const topupAfter = [0, 1, 2, 4, 6, 8, 10, 12];
  const out = [
    ...big.map((ms) => ({ ms, kind: "big" as const })),
    ...topupAfter.map((i) => ({ ms: big[i] + 5 * DAY, kind: "topup" as const })),
  ];
  out.sort((a, b) => a.ms - b.ms);
  return out.map(({ ms, kind }) => ({ date: iso(ms), kind }));
}

const TRIP_DATES = tripDates();

const trips: Trip[] = TRIP_DATES.map((t, i) => ({
  id: `trip-${String(i + 1).padStart(2, "0")}`,
  storeId: store.id,
  startedAt: `${t.date}T09:20:00Z`,
  completedAt: `${t.date}T10:05:00Z`,
  kind: t.kind,
  items: [],
}));

// ---------------------------------------------------------------- catalogue

type Seeded = Omit<Product, "id"> & {
  id: string;
  aisle: number;
  /** How many of the 14 Saturday big shops this product appears in. */
  big?: number;
  /** How many of the 8 midweek top-ups. A top-up basket is small on purpose. */
  topup?: number;
  /** Explicit big-shop positions, when the demo depends on exactly which. */
  bigOn?: number[];
  topupOn?: number[];
};

const p = (s: Seeded): Seeded => s;

/** The March big shop where Tesco semi-skimmed was not on the shelf. */
const SWAP_BIG = 2;

const CATALOGUE: Seeded[] = [
  // Fruit & veg -----------------------------------------------------------
  p({ id: "bananas", name: "Tesco bananas", brand: "Tesco", ownBrand: true, size: "5 pack", category: "fresh", dietaryTags: ["vegan"], price: 89, aisle: 1, big: 14, topup: 8 }),
  p({ id: "cherry-tomatoes", name: "Tesco cherry tomatoes", brand: "Tesco", ownBrand: true, size: "330g", category: "fresh", dietaryTags: ["vegan"], price: 110, aisle: 1, big: 14, topup: 8 }),
  p({ id: "baby-spinach", name: "Tesco baby spinach", brand: "Tesco", ownBrand: true, size: "240g", category: "fresh", dietaryTags: ["vegan"], price: 165, aisle: 1, big: 14 }),
  p({ id: "carrots", name: "Tesco carrots", brand: "Tesco", ownBrand: true, size: "1kg", category: "fresh", dietaryTags: ["vegan"], price: 75, aisle: 1, big: 14 }),
  p({ id: "gala-apples", name: "Tesco gala apples", brand: "Tesco", ownBrand: true, size: "6 pack", category: "fresh", dietaryTags: ["vegan"], price: 190, aisle: 1, big: 14 }),
  p({ id: "avocados", name: "Tesco avocados", brand: "Tesco", ownBrand: true, size: "2 pack", category: "fresh", dietaryTags: ["vegan"], price: 175, aisle: 1, big: 14 }),
  p({ id: "brown-onions", name: "Tesco brown onions", brand: "Tesco", ownBrand: true, size: "1kg", category: "fresh", dietaryTags: ["vegan"], price: 105, aisle: 1, big: 14 }),
  p({ id: "spring-onions", name: "Tesco spring onions", brand: "Tesco", ownBrand: true, size: "100g", category: "fresh", dietaryTags: ["vegan"], price: 85, aisle: 1, big: 4 }),
  p({ id: "maris-piper", name: "Tesco maris piper potatoes", brand: "Tesco", ownBrand: true, size: "2.5kg", category: "fresh", dietaryTags: ["vegan"], price: 199, aisle: 1, big: 14 }),
  p({ id: "lemons", name: "Tesco lemons", brand: "Tesco", ownBrand: true, size: "4 pack", category: "fresh", dietaryTags: ["vegan"], price: 95, aisle: 1, big: 14 }),

  // Meat & fish -----------------------------------------------------------
  p({ id: "chicken-breast", name: "Tesco chicken breast fillets", brand: "Tesco", ownBrand: true, size: "650g", category: "fresh", dietaryTags: [], price: 585, aisle: 3, big: 8, attributes: { cut: "breast" } }),
  p({ id: "chicken-thighs", name: "Tesco chicken thigh fillets", brand: "Tesco", ownBrand: true, size: "650g", category: "fresh", dietaryTags: [], price: 480, aisle: 3, big: 2, attributes: { cut: "thigh" } }),
  p({ id: "beef-mince", name: "Tesco beef mince 12% fat", brand: "Tesco", ownBrand: true, size: "500g", category: "fresh", dietaryTags: [], price: 425, aisle: 3, big: 14 }),
  p({ id: "salmon-fillets", name: "Tesco salmon fillets", brand: "Tesco", ownBrand: true, size: "240g", category: "fresh", dietaryTags: [], price: 450, aisle: 3, big: 3 }),
  p({ id: "cooked-king-prawns", name: "Tesco cooked king prawns", brand: "Tesco", ownBrand: true, size: "180g", category: "fresh", dietaryTags: [], price: 375, aisle: 3, big: 2 }),
  p({ id: "back-bacon", name: "Tesco smoked back bacon", brand: "Tesco", ownBrand: true, size: "300g", category: "fresh", dietaryTags: [], price: 320, aisle: 3, big: 14 }),

  // Chilled ---------------------------------------------------------------
  p({ id: "houmous", name: "Tesco houmous", brand: "Tesco", ownBrand: true, size: "200g", category: "fresh", dietaryTags: ["vegan"], price: 95, aisle: 5, bigOn: [12, 13], topupOn: [7] }),
  p({ id: "orange-juice", name: "Tropicana smooth orange juice", brand: "Tropicana", ownBrand: false, size: "900ml", unitMl: 900, category: "fresh", dietaryTags: ["vegan"], price: 285, aisle: 5, big: 14 }),
  p({ id: "greek-yoghurt", name: "Tesco greek style yoghurt", brand: "Tesco", ownBrand: true, size: "500g", category: "dairy", dietaryTags: ["vegetarian"], price: 130, aisle: 5, big: 14, topup: 8 }),

  // Bakery ----------------------------------------------------------------
  p({ id: "white-bread", name: "Tesco white bread", brand: "Tesco", ownBrand: true, size: "800g", category: "bakery", dietaryTags: ["vegan"], price: 85, aisle: 2, big: 14, topup: 8, attributes: { flour: "white" } }),
  p({ id: "wholemeal-bread", name: "Tesco wholemeal bread", brand: "Tesco", ownBrand: true, size: "800g", category: "bakery", dietaryTags: ["vegan"], price: 85, aisle: 2, big: 2, attributes: { flour: "wholemeal" } }),
  p({ id: "bagels", name: "New York Bakery plain bagels", brand: "New York Bakery", ownBrand: false, size: "5 pack", category: "bakery", dietaryTags: ["vegan"], price: 185, aisle: 2, big: 2 }),
  p({ id: "croissants", name: "Tesco all butter croissants", brand: "Tesco", ownBrand: true, size: "4 pack", category: "bakery", dietaryTags: ["vegetarian"], price: 145, aisle: 2, big: 2 }),

  // Free from -------------------------------------------------------------
  p({ id: "gf-white-loaf", name: "Tesco Free From white loaf", brand: "Tesco", ownBrand: true, size: "550g", category: "bakery", dietaryTags: ["gluten-free"], price: 250, aisle: 10, big: 6, attributes: { flour: "white" } }),
  p({ id: "gf-brown-loaf", name: "Tesco Free From brown loaf", brand: "Tesco", ownBrand: true, size: "550g", category: "bakery", dietaryTags: ["gluten-free"], price: 250, aisle: 10, big: 2, attributes: { flour: "brown" } }),
  p({ id: "gf-penne", name: "Tesco Free From penne", brand: "Tesco", ownBrand: true, size: "500g", category: "cupboard", dietaryTags: ["gluten-free", "vegan"], price: 175, aisle: 10, big: 2 }),

  // Dairy -----------------------------------------------------------------
  p({ id: "milk-semi-2l", name: "Tesco semi-skimmed milk", brand: "Tesco", ownBrand: true, size: "2L", unitMl: 2000, category: "dairy", dietaryTags: ["vegetarian"], price: 145, aisle: 4, lineId: "tesco-milk-semi", attributes: { fat: "semi-skimmed" }, bigOn: bigExcept([SWAP_BIG]), topup: 6 }),
  p({ id: "milk-semi-1l", name: "Tesco semi-skimmed milk", brand: "Tesco", ownBrand: true, size: "1L", unitMl: 1000, category: "dairy", dietaryTags: ["vegetarian"], price: 90, aisle: 4, lineId: "tesco-milk-semi", attributes: { fat: "semi-skimmed" }, topup: 5 }),
  p({ id: "milk-whole-2l", name: "Tesco whole milk", brand: "Tesco", ownBrand: true, size: "2L", unitMl: 2000, category: "dairy", dietaryTags: ["vegetarian"], price: 145, aisle: 4, lineId: "tesco-milk-whole", attributes: { fat: "whole" }, big: 4 }),
  p({ id: "milk-arla-semi-2l", name: "Arla British semi-skimmed milk", brand: "Arla", ownBrand: false, size: "2L", unitMl: 2000, category: "dairy", dietaryTags: ["vegetarian"], price: 165, aisle: 4, lineId: "arla-milk-semi", attributes: { fat: "semi-skimmed" }, bigOn: [SWAP_BIG], topupOn: [3, 4] }),
  p({ id: "salted-butter", name: "Tesco salted butter", brand: "Tesco", ownBrand: true, size: "250g", category: "dairy", dietaryTags: ["vegetarian"], price: 219, aisle: 4, big: 8 }),
  p({ id: "mature-cheddar", name: "Tesco mature cheddar", brand: "Tesco", ownBrand: true, size: "400g", category: "dairy", dietaryTags: ["vegetarian"], price: 315, aisle: 4, big: 14 }),
  p({ id: "free-range-eggs", name: "Tesco free range eggs", brand: "Tesco", ownBrand: true, size: "12 pack", category: "dairy", dietaryTags: ["vegetarian"], price: 285, aisle: 4, big: 11 }),
  p({ id: "double-cream", name: "Tesco double cream", brand: "Tesco", ownBrand: true, size: "300ml", unitMl: 300, category: "dairy", dietaryTags: ["vegetarian"], price: 125, aisle: 4, big: 2 }),

  // Tins & cooking --------------------------------------------------------
  p({ id: "chopped-tomatoes", name: "Tesco chopped tomatoes", brand: "Tesco", ownBrand: true, size: "400g", category: "cupboard", dietaryTags: ["vegan"], price: 45, aisle: 6, big: 4 }),
  p({ id: "baked-beans", name: "Tesco baked beans", brand: "Tesco", ownBrand: true, size: "415g", category: "cupboard", dietaryTags: ["vegan"], price: 42, aisle: 6, big: 14 }),
  p({ id: "olive-oil", name: "Tesco olive oil", brand: "Tesco", ownBrand: true, size: "500ml", unitMl: 500, category: "cupboard", dietaryTags: ["vegan"], price: 395, aisle: 6, big: 2 }),
  p({ id: "tuna-chunks", name: "Tesco tuna chunks in spring water", brand: "Tesco", ownBrand: true, size: "4 x 145g", category: "cupboard", dietaryTags: [], price: 425, aisle: 6, big: 3 }),

  // Pasta & rice ----------------------------------------------------------
  p({ id: "fusilli", name: "Tesco fusilli", brand: "Tesco", ownBrand: true, size: "500g", category: "cupboard", dietaryTags: ["vegan"], price: 75, aisle: 7, attributes: { shape: "fusilli" }, big: 5 }),
  p({ id: "penne", name: "Tesco penne", brand: "Tesco", ownBrand: true, size: "500g", category: "cupboard", dietaryTags: ["vegan"], price: 75, aisle: 7, attributes: { shape: "penne" }, big: 14 }),
  p({ id: "basmati-rice", name: "Tesco basmati rice", brand: "Tesco", ownBrand: true, size: "1kg", category: "cupboard", dietaryTags: ["vegan"], price: 250, aisle: 7, big: 3 }),

  // Tea & coffee ----------------------------------------------------------
  p({ id: "teabags", name: "Tesco everyday tea", brand: "Tesco", ownBrand: true, size: "240 bags", category: "cupboard", dietaryTags: ["vegan"], price: 340, aisle: 8, big: 3 }),
  p({ id: "ground-coffee", name: "Taylors rich italian ground coffee", brand: "Taylors", ownBrand: false, size: "227g", category: "cupboard", dietaryTags: ["vegan"], price: 425, aisle: 8, big: 3 }),

  // Snacks ----------------------------------------------------------------
  p({ id: "salted-crisps", name: "Tesco ready salted crisps", brand: "Tesco", ownBrand: true, size: "6 pack", category: "cupboard", dietaryTags: ["vegetarian"], price: 130, aisle: 9, big: 14 }),
  p({ id: "dark-chocolate", name: "Tesco dark chocolate", brand: "Tesco", ownBrand: true, size: "100g", category: "cupboard", dietaryTags: ["vegan"], price: 110, aisle: 9, big: 2 }),
  p({ id: "porridge-oats", name: "Tesco porridge oats", brand: "Tesco", ownBrand: true, size: "1kg", category: "cupboard", dietaryTags: ["vegan"], price: 165, aisle: 9, big: 2 }),

  // Frozen ----------------------------------------------------------------
  p({ id: "garden-peas", name: "Tesco garden peas", brand: "Tesco", ownBrand: true, size: "1kg", category: "frozen", dietaryTags: ["vegan"], price: 165, aisle: 11, big: 14 }),
  p({ id: "mixed-vegetables", name: "Tesco mixed vegetables", brand: "Tesco", ownBrand: true, size: "1kg", category: "frozen", dietaryTags: ["vegan"], price: 165, aisle: 11, big: 4 }),
  p({ id: "fish-fingers", name: "Birds Eye fish fingers", brand: "Birds Eye", ownBrand: false, size: "12 pack", category: "frozen", dietaryTags: [], price: 375, aisle: 11, big: 2 }),

  // Household -------------------------------------------------------------
  p({ id: "washing-up-liquid", name: "Tesco washing up liquid", brand: "Tesco", ownBrand: true, size: "500ml", unitMl: 500, category: "household", dietaryTags: [], price: 110, aisle: 12, big: 14 }),
  p({ id: "kitchen-towel", name: "Tesco kitchen towel", brand: "Tesco", ownBrand: true, size: "2 pack", category: "household", dietaryTags: [], price: 250, aisle: 12, big: 3 }),
  p({ id: "bin-liners", name: "Tesco bin liners", brand: "Tesco", ownBrand: true, size: "20 pack", category: "household", dietaryTags: [], price: 145, aisle: 12, big: 2 }),
  p({ id: "toothpaste", name: "Colgate total toothpaste", brand: "Colgate", ownBrand: false, size: "75ml", unitMl: 75, category: "household", dietaryTags: [], price: 350, aisle: 13, big: 2 }),

  // Drinks ----------------------------------------------------------------
  p({ id: "sparkling-water", name: "Tesco sparkling water", brand: "Tesco", ownBrand: true, size: "2L", unitMl: 2000, category: "cupboard", dietaryTags: ["vegan"], price: 65, aisle: 14, big: 14 }),

  // Meat & fish ------------------------------------------------------------
  p({ id: "pork-chops", name: "Tesco pork loin chops", brand: "Tesco", ownBrand: true, size: "4 pack", category: "fresh", dietaryTags: [], price: 420, aisle: 3, big: 13, attributes: { cut: "chop" } }),
  p({ id: "pork-mince", name: "Tesco pork mince 10% fat", brand: "Tesco", ownBrand: true, size: "500g", category: "fresh", dietaryTags: [], price: 340, aisle: 3, big: 4, attributes: { cut: "mince" } }),
  p({ id: "pork-sausages", name: "Tesco pork sausages", brand: "Tesco", ownBrand: true, size: "12 pack", category: "fresh", dietaryTags: [], price: 290, aisle: 3, big: 13 }),
  p({ id: "chicken-drumsticks", name: "Tesco chicken drumsticks", brand: "Tesco", ownBrand: true, size: "1kg", category: "fresh", dietaryTags: [], price: 315, aisle: 3, big: 4, attributes: { cut: "drumstick" } }),
  p({ id: "whole-chicken", name: "Tesco whole chicken", brand: "Tesco", ownBrand: true, size: "1.5kg", category: "fresh", dietaryTags: [], price: 445, aisle: 3, big: 3, attributes: { cut: "whole" } }),
  p({ id: "lamb-mince", name: "Tesco lamb mince 20% fat", brand: "Tesco", ownBrand: true, size: "500g", category: "fresh", dietaryTags: [], price: 495, aisle: 3, big: 2 }),
  p({ id: "cod-fillets", name: "Tesco cod fillets", brand: "Tesco", ownBrand: true, size: "260g", category: "fresh", dietaryTags: [], price: 420, aisle: 3, big: 3 }),
  p({ id: "cooked-ham", name: "Tesco wafer thin cooked ham", brand: "Tesco", ownBrand: true, size: "400g", category: "fresh", dietaryTags: [], price: 265, aisle: 3, big: 13 }),
  p({ id: "turkey-mince", name: "Tesco turkey breast mince", brand: "Tesco", ownBrand: true, size: "500g", category: "fresh", dietaryTags: [], price: 375, aisle: 3, big: 2 }),

  // Fruit & veg ------------------------------------------------------------
  p({ id: "broccoli", name: "Tesco broccoli", brand: "Tesco", ownBrand: true, size: "350g", category: "fresh", dietaryTags: ["vegan"], price: 69, aisle: 1, big: 14 }),
  p({ id: "mixed-peppers", name: "Tesco mixed peppers", brand: "Tesco", ownBrand: true, size: "3 pack", category: "fresh", dietaryTags: ["vegan"], price: 165, aisle: 1, big: 13 }),
  p({ id: "cucumber", name: "Tesco cucumber", brand: "Tesco", ownBrand: true, size: "each", category: "fresh", dietaryTags: ["vegan"], price: 79, aisle: 1, big: 13 }),
  p({ id: "mushrooms", name: "Tesco closed cup mushrooms", brand: "Tesco", ownBrand: true, size: "300g", category: "fresh", dietaryTags: ["vegan"], price: 105, aisle: 1, big: 13 }),
  p({ id: "salad-bag", name: "Tesco crispy leaf salad", brand: "Tesco", ownBrand: true, size: "200g", category: "fresh", dietaryTags: ["vegan"], price: 95, aisle: 1, big: 13, topup: 2 }),
  p({ id: "seedless-grapes", name: "Tesco seedless green grapes", brand: "Tesco", ownBrand: true, size: "500g", category: "fresh", dietaryTags: ["vegan"], price: 220, aisle: 1, big: 12 }),
  p({ id: "blueberries", name: "Tesco blueberries", brand: "Tesco", ownBrand: true, size: "200g", category: "fresh", dietaryTags: ["vegan"], price: 210, aisle: 1, big: 12 }),
  p({ id: "courgettes", name: "Tesco courgettes", brand: "Tesco", ownBrand: true, size: "3 pack", category: "fresh", dietaryTags: ["vegan"], price: 115, aisle: 1, big: 4 }),
  p({ id: "garlic", name: "Tesco garlic", brand: "Tesco", ownBrand: true, size: "3 pack", category: "fresh", dietaryTags: ["vegan"], price: 79, aisle: 1, big: 3 }),
  p({ id: "root-ginger", name: "Tesco root ginger", brand: "Tesco", ownBrand: true, size: "each", category: "fresh", dietaryTags: ["vegan"], price: 45, aisle: 1, big: 2 }),
  p({ id: "strawberries", name: "Tesco strawberries", brand: "Tesco", ownBrand: true, size: "400g", category: "fresh", dietaryTags: ["vegan"], price: 250, aisle: 1, big: 3 }),

  // Snacks -----------------------------------------------------------------
  p({ id: "tortilla-chips", name: "Tesco lightly salted tortilla chips", brand: "Tesco", ownBrand: true, size: "200g", category: "cupboard", dietaryTags: ["vegan"], price: 95, aisle: 9, big: 13 }),
  p({ id: "digestives", name: "McVitie's digestive biscuits", brand: "McVitie's", ownBrand: false, size: "400g", category: "cupboard", dietaryTags: ["vegetarian"], price: 185, aisle: 9, big: 12 }),
  p({ id: "salted-peanuts", name: "Tesco salted peanuts", brand: "Tesco", ownBrand: true, size: "200g", category: "cupboard", dietaryTags: ["vegan"], price: 125, aisle: 9, big: 4 }),
  p({ id: "sweet-popcorn", name: "Tesco sweet and salted popcorn", brand: "Tesco", ownBrand: true, size: "100g", category: "cupboard", dietaryTags: ["vegetarian"], price: 110, aisle: 9, big: 3 }),
  p({ id: "jaffa-cakes", name: "McVitie's Jaffa Cakes", brand: "McVitie's", ownBrand: false, size: "10 pack", category: "cupboard", dietaryTags: ["vegetarian"], price: 155, aisle: 9, big: 3 }),
  p({ id: "cereal-bars", name: "Tesco oat and honey bars", brand: "Tesco", ownBrand: true, size: "6 pack", category: "cupboard", dietaryTags: ["vegetarian"], price: 140, aisle: 9, big: 4 }),
  p({ id: "dairy-milk-bar", name: "Cadbury Dairy Milk", brand: "Cadbury", ownBrand: false, size: "110g", category: "cupboard", dietaryTags: ["vegetarian"], price: 165, aisle: 9, big: 4 }),
  p({ id: "salted-pretzels", name: "Tesco salted pretzels", brand: "Tesco", ownBrand: true, size: "175g", category: "cupboard", dietaryTags: ["vegan"], price: 90, aisle: 9, big: 2 }),

  // Dairy & chilled --------------------------------------------------------
  p({ id: "mozzarella", name: "Tesco mozzarella", brand: "Tesco", ownBrand: true, size: "125g", category: "dairy", dietaryTags: ["vegetarian"], price: 90, aisle: 4, big: 12 }),
  p({ id: "soft-cheese", name: "Tesco soft cheese", brand: "Tesco", ownBrand: true, size: "200g", category: "dairy", dietaryTags: ["vegetarian"], price: 130, aisle: 4, big: 4 }),
  p({ id: "halloumi", name: "Tesco halloumi", brand: "Tesco", ownBrand: true, size: "225g", category: "dairy", dietaryTags: ["vegetarian"], price: 240, aisle: 4, big: 3 }),
  p({ id: "oat-drink", name: "Tesco oat drink", brand: "Tesco", ownBrand: true, size: "1L", unitMl: 1000, category: "dairy", dietaryTags: ["vegan"], price: 135, aisle: 4, big: 4 }),

  // Bakery -----------------------------------------------------------------
  p({ id: "tortilla-wraps", name: "Tesco plain tortilla wraps", brand: "Tesco", ownBrand: true, size: "8 pack", category: "bakery", dietaryTags: ["vegan"], price: 100, aisle: 2, big: 12 }),
  p({ id: "pitta-bread", name: "Tesco white pitta bread", brand: "Tesco", ownBrand: true, size: "6 pack", category: "bakery", dietaryTags: ["vegan"], price: 75, aisle: 2, big: 4 }),
  p({ id: "crumpets", name: "Tesco crumpets", brand: "Tesco", ownBrand: true, size: "6 pack", category: "bakery", dietaryTags: ["vegetarian"], price: 85, aisle: 2, big: 3 }),

  // Tins & cooking ---------------------------------------------------------
  p({ id: "chickpeas", name: "Tesco chickpeas", brand: "Tesco", ownBrand: true, size: "400g", category: "cupboard", dietaryTags: ["vegan"], price: 55, aisle: 6, big: 12 }),
  p({ id: "kidney-beans", name: "Tesco red kidney beans", brand: "Tesco", ownBrand: true, size: "400g", category: "cupboard", dietaryTags: ["vegan"], price: 55, aisle: 6, big: 4 }),
  p({ id: "sweetcorn-tin", name: "Tesco sweetcorn", brand: "Tesco", ownBrand: true, size: "325g", category: "cupboard", dietaryTags: ["vegan"], price: 65, aisle: 6, big: 4 }),
  p({ id: "soy-sauce", name: "Tesco soy sauce", brand: "Tesco", ownBrand: true, size: "150ml", unitMl: 150, category: "cupboard", dietaryTags: ["vegan"], price: 110, aisle: 6, big: 2 }),
  p({ id: "tikka-paste", name: "Patak's tikka masala paste", brand: "Patak's", ownBrand: false, size: "283g", category: "cupboard", dietaryTags: ["vegetarian"], price: 210, aisle: 6, big: 3 }),
  p({ id: "clear-honey", name: "Tesco clear honey", brand: "Tesco", ownBrand: true, size: "340g", category: "cupboard", dietaryTags: ["vegetarian"], price: 175, aisle: 6, big: 3 }),
  p({ id: "peanut-butter", name: "Tesco smooth peanut butter", brand: "Tesco", ownBrand: true, size: "340g", category: "cupboard", dietaryTags: ["vegan"], price: 155, aisle: 6, big: 4 }),
  p({ id: "stock-cubes", name: "Tesco chicken stock cubes", brand: "Tesco", ownBrand: true, size: "10 pack", category: "cupboard", dietaryTags: [], price: 100, aisle: 6, big: 3 }),

  // Pasta, rice & cereal ---------------------------------------------------
  p({ id: "spaghetti", name: "Tesco spaghetti", brand: "Tesco", ownBrand: true, size: "500g", category: "cupboard", dietaryTags: ["vegan"], price: 75, aisle: 7, big: 12, attributes: { shape: "spaghetti" } }),
  p({ id: "couscous", name: "Tesco couscous", brand: "Tesco", ownBrand: true, size: "500g", category: "cupboard", dietaryTags: ["vegan"], price: 130, aisle: 7, big: 3 }),
  p({ id: "cornflakes", name: "Tesco cornflakes", brand: "Tesco", ownBrand: true, size: "720g", category: "cupboard", dietaryTags: ["vegan"], price: 155, aisle: 7, big: 4 }),

  // Tea & coffee -----------------------------------------------------------
  p({ id: "instant-coffee", name: "Nescafe Gold instant coffee", brand: "Nescafe", ownBrand: false, size: "100g", category: "cupboard", dietaryTags: ["vegan"], price: 480, aisle: 8, big: 3 }),
  p({ id: "green-tea", name: "Tesco green tea", brand: "Tesco", ownBrand: true, size: "40 bags", category: "cupboard", dietaryTags: ["vegan"], price: 120, aisle: 8, big: 2 }),

  // Frozen -----------------------------------------------------------------
  p({ id: "oven-chips", name: "Tesco oven chips", brand: "Tesco", ownBrand: true, size: "1.5kg", category: "frozen", dietaryTags: ["vegan"], price: 185, aisle: 11, big: 12 }),
  p({ id: "vanilla-ice-cream", name: "Tesco vanilla ice cream", brand: "Tesco", ownBrand: true, size: "1L", unitMl: 1000, category: "frozen", dietaryTags: ["vegetarian"], price: 190, aisle: 11, big: 4 }),
  p({ id: "frozen-berries", name: "Tesco frozen berry mix", brand: "Tesco", ownBrand: true, size: "500g", category: "frozen", dietaryTags: ["vegan"], price: 225, aisle: 11, big: 3 }),
  p({ id: "pepperoni-pizza", name: "Tesco pepperoni pizza", brand: "Tesco", ownBrand: true, size: "330g", category: "frozen", dietaryTags: [], price: 175, aisle: 11, big: 3 }),

  // Household & toiletries -------------------------------------------------
  p({ id: "laundry-liquid", name: "Tesco non-bio laundry liquid", brand: "Tesco", ownBrand: true, size: "1.5L", unitMl: 1500, category: "household", dietaryTags: [], price: 350, aisle: 12, big: 4 }),
  p({ id: "sponge-scourers", name: "Tesco sponge scourers", brand: "Tesco", ownBrand: true, size: "5 pack", category: "household", dietaryTags: [], price: 95, aisle: 12, big: 3 }),
  p({ id: "kitchen-foil", name: "Tesco kitchen foil", brand: "Tesco", ownBrand: true, size: "10m", category: "household", dietaryTags: [], price: 130, aisle: 12, big: 2 }),
  p({ id: "shower-gel", name: "Tesco shower gel", brand: "Tesco", ownBrand: true, size: "500ml", unitMl: 500, category: "household", dietaryTags: [], price: 120, aisle: 13, big: 3 }),
  p({ id: "shampoo", name: "Head & Shoulders shampoo", brand: "Head & Shoulders", ownBrand: false, size: "400ml", unitMl: 400, category: "household", dietaryTags: [], price: 450, aisle: 13, big: 2 }),

  // Drinks -----------------------------------------------------------------
  p({ id: "orange-squash", name: "Tesco orange squash", brand: "Tesco", ownBrand: true, size: "1.5L", unitMl: 1500, category: "cupboard", dietaryTags: ["vegan"], price: 90, aisle: 14, big: 12 }),
  p({ id: "cola", name: "Coca-Cola", brand: "Coca-Cola", ownBrand: false, size: "2L", unitMl: 2000, category: "cupboard", dietaryTags: ["vegan"], price: 225, aisle: 14, big: 4 }),
  p({ id: "apple-juice", name: "Tesco apple juice", brand: "Tesco", ownBrand: true, size: "1L", unitMl: 1000, category: "cupboard", dietaryTags: ["vegan"], price: 115, aisle: 14, big: 4 }),
];

function bigExcept(skip: number[]): number[] {
  return Array.from({ length: 14 }, (_, i) => i).filter((i) => !skip.includes(i));
}


/**
 * What may stand in for what. Narrower than category on purpose: `fresh` holds
 * fruit, veg, meat and fish, and nothing in one of those should ever be offered
 * as a replacement for something in another.
 */
const GROUPS: Record<string, string[]> = {
  milk: ["milk-semi-2l", "milk-semi-1l", "milk-whole-2l", "milk-arla-semi-2l", "oat-drink"],
  yoghurt: ["greek-yoghurt"],
  cheese: ["mature-cheddar", "mozzarella", "soft-cheese", "halloumi"],
  butter: ["salted-butter"],
  eggs: ["free-range-eggs"],
  cream: ["double-cream"],
  bread: ["white-bread", "wholemeal-bread", "bagels", "tortilla-wraps", "pitta-bread", "crumpets"],
  "free-from-bread": ["gf-white-loaf", "gf-brown-loaf"],
  pastry: ["croissants"],
  poultry: ["chicken-breast", "chicken-thighs", "chicken-drumsticks", "whole-chicken", "turkey-mince"],
  "red-meat": ["beef-mince", "lamb-mince"],
  pork: ["pork-chops", "pork-mince", "pork-sausages", "back-bacon"],
  deli: ["cooked-ham"],
  fish: ["salmon-fillets", "cod-fillets", "cooked-king-prawns"],
  dips: ["houmous"],
  fruit: ["bananas", "gala-apples", "lemons", "seedless-grapes", "blueberries", "strawberries", "avocados"],
  veg: ["carrots", "brown-onions", "spring-onions", "maris-piper", "broccoli", "mixed-peppers", "cucumber", "mushrooms", "courgettes", "garlic", "root-ginger", "cherry-tomatoes"],
  salad: ["baby-spinach", "salad-bag"],
  pasta: ["fusilli", "penne", "spaghetti", "gf-penne"],
  grains: ["basmati-rice", "couscous"],
  cereal: ["porridge-oats", "cornflakes"],
  "tinned-veg": ["chopped-tomatoes", "sweetcorn-tin", "baked-beans"],
  "tinned-pulses": ["chickpeas", "kidney-beans"],
  "tinned-fish": ["tuna-chunks"],
  condiments: ["olive-oil", "soy-sauce", "tikka-paste", "stock-cubes"],
  spreads: ["clear-honey", "peanut-butter"],
  tea: ["teabags", "green-tea"],
  coffee: ["ground-coffee", "instant-coffee"],
  crisps: ["salted-crisps", "tortilla-chips", "salted-pretzels", "sweet-popcorn", "salted-peanuts"],
  biscuits: ["digestives", "jaffa-cakes", "cereal-bars"],
  chocolate: ["dark-chocolate", "dairy-milk-bar"],
  "frozen-veg": ["garden-peas", "mixed-vegetables", "frozen-berries"],
  "frozen-potato": ["oven-chips"],
  "frozen-meal": ["fish-fingers", "pepperoni-pizza"],
  "frozen-dessert": ["vanilla-ice-cream"],
  cleaning: ["washing-up-liquid", "laundry-liquid", "sponge-scourers"],
  paper: ["kitchen-towel", "bin-liners", "kitchen-foil"],
  toiletries: ["toothpaste", "shower-gel", "shampoo"],
  "soft-drinks": ["sparkling-water", "orange-squash", "cola"],
  juice: ["orange-juice", "apple-juice"],
};

const GROUP_OF: Record<string, string> = Object.fromEntries(
  Object.entries(GROUPS).flatMap(([group, ids]) => ids.map((id) => [id, group])),
);

/** The ten own-brand lines treated as the household's staples. */
const STAPLE_IDS = [
  "white-bread",
  "bananas",
  "free-range-eggs",
  "salted-butter",
  "chicken-breast",
  "fusilli",
  "chopped-tomatoes",
  "teabags",
  "basmati-rice",
  "porridge-oats",
];

/**
 * Named explicitly rather than matched on the word "milk". A catalogue with
 * "Dairy Milk" chocolate or an oat drink in it would otherwise fold them into
 * the milk figure and quietly change a number the case study quotes.
 */
const MILK_IDS = [
  "milk-semi-2l",
  "milk-semi-1l",
  "milk-whole-2l",
  "milk-arla-semi-2l",
];

// ---------------------------------------------------------------- derive

const BIG_INDICES = TRIP_DATES.map((t, i) => ({ t, i }))
  .filter((x) => x.t.kind === "big")
  .map((x) => x.i);
const TOPUP_INDICES = TRIP_DATES.map((t, i) => ({ t, i }))
  .filter((x) => x.t.kind === "topup")
  .map((x) => x.i);

/** Evenly spread `count` occasions across a pool, always ending on the last. */
function spread(count: number, pool: number[]): number[] {
  if (count >= pool.length) return [...pool];
  if (count <= 0) return [];
  if (count === 1) return [pool[pool.length - 1]];
  const out = new Set<number>();
  for (let k = 0; k < count; k++) {
    out.add(pool[Math.round((k * (pool.length - 1)) / (count - 1))]);
  }
  return [...out].sort((a, b) => a - b);
}

/** Which of the 22 trips a product was bought on. */
function tripsFor(c: Seeded): number[] {
  const big = c.bigOn
    ? c.bigOn.map((i) => BIG_INDICES[i])
    : spread(c.big ?? 0, BIG_INDICES);
  const topup = c.topupOn
    ? c.topupOn.map((i) => TOPUP_INDICES[i])
    : spread(c.topup ?? 0, TOPUP_INDICES);
  return [...new Set([...big, ...topup])].sort((a, b) => a - b);
}

const products: Product[] = CATALOGUE.map((c) => ({
  id: c.id,
  name: c.name,
  brand: c.brand,
  ownBrand: c.ownBrand,
  size: c.size,
  unitMl: c.unitMl,
  category: c.category as SectionKey,
  dietaryTags: c.dietaryTags,
  price: c.price,
  lineId: c.lineId,
  group: GROUP_OF[c.id],
  attributes: c.attributes,
}));

const placements: StorePlacement[] = CATALOGUE.map((c) => {
  const a = AISLES.find((x) => x.aisle === c.aisle)!;
  return {
    storeId: store.id,
    productId: c.id,
    aisle: a.aisle,
    section: a.section,
    aisleOrder: a.order,
  };
});

const purchases: Purchase[] = [];
for (const c of CATALOGUE) {
  const indices = tripsFor(c);
  for (const i of indices) {
    const trip = trips[i];
    purchases.push({
      id: `pur-${c.id}-${trip.id}`,
      productId: c.id,
      storeId: store.id,
      tripId: trip.id,
      date: TRIP_DATES[i].date,
    });
    trip.items.push({
      id: `ti-${c.id}-${trip.id}`,
      productId: c.id,
      quantity: 1,
      status: "in_trolley",
    });
  }
}
purchases.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

// One historical swap: the March trip where Tesco semi-skimmed was not there.
const marchSwapTrip = trips[BIG_INDICES[SWAP_BIG]];
const priorSubstitutions = [
  {
    targetProductId: "milk-semi-2l",
    replacementProductId: "milk-arla-semi-2l",
    date: TRIP_DATES[BIG_INDICES[SWAP_BIG]].date,
  },
];
for (const item of marchSwapTrip.items) {
  if (item.productId === "milk-arla-semi-2l") {
    item.status = "substituted";
    item.substitutedForId = "milk-semi-2l";
  }
}

const preferences: UserProductPreference[] = [
  {
    productId: "gf-white-loaf",
    neverSubstitute: true,
    note: "Mum's coeliac, so a close match isn't good enough. Ring her if it's out.",
  },
];

/** Demo rigging: these two are out at the Poplar High Street branch today. */
const stock = {
  storeId: store.id,
  outOfStockProductIds: ["milk-semi-2l", "gf-white-loaf"],
};

/** The list waiting for the next shop. Eleven items, seven aisles. */
const list = {
  storeId: store.id,
  productIds: [
    "bananas",
    "free-range-eggs",
    "white-bread",
    "gf-white-loaf",
    "chicken-breast",
    "milk-semi-2l",
    "salted-butter",
    "mature-cheddar",
    "fusilli",
    "chopped-tomatoes",
    "washing-up-liquid",
  ],
};

// ---------------------------------------------------------------- inferences

const today = new Date(`${REFERENCE_TODAY}T00:00:00Z`);
const purchasesOf = (id: string) => purchases.filter((p) => p.productId === id);

const milkPurchases = purchases.filter((p) => MILK_IDS.includes(p.productId));
const milkDates = [...new Set(milkPurchases.map((p) => p.date))].sort();
const milkInterval = Math.round(
  median(intervalsOf(milkDates.map((d) => ({ date: d }) as Purchase))),
);

const staplePurchases = purchases.filter((p) => STAPLE_IDS.includes(p.productId));
const breadAndBananas = trips.filter(
  (t) =>
    t.items.some((i) => i.productId === "white-bread") &&
    t.items.some((i) => i.productId === "bananas"),
).length;

const topups = trips.filter((t) => t.kind === "topup").length;

const inferences: Inference[] = [
  {
    id: "inf-milk",
    claim: `Buys milk every ${milkInterval} days`,
    evidenceCount: milkPurchases.length,
    evidenceKind: "purchases",
    confidence: confidenceOf(
      milkDates.map((d) => ({ date: d }) as Purchase),
      today,
    ),
    deleted: false,
    basis: MILK_IDS,
  },
  {
    id: "inf-own-brand",
    claim: "Buys own-brand for staples, not the branded version",
    evidenceCount: staplePurchases.length,
    evidenceKind: "purchases",
    confidence: "high",
    deleted: false,
    basis: STAPLE_IDS,
  },
  {
    id: "inf-saturday",
    claim: "Does the big shop on a Saturday morning",
    evidenceCount: trips.filter((t) => t.kind === "big").length,
    evidenceKind: "trips",
    confidence: "high",
    deleted: false,
    basis: [],
  },
  {
    id: "inf-bread-bananas",
    claim: "Buys bread and bananas on the same trip",
    evidenceCount: breadAndBananas,
    evidenceKind: "trips",
    confidence: breadAndBananas === trips.length ? "high" : "medium",
    deleted: false,
    basis: ["white-bread", "bananas"],
  },
  {
    id: "inf-topup",
    claim: "Tops up midweek when the big shop was more than a week ago",
    evidenceCount: topups,
    evidenceKind: "trips",
    confidence: "medium",
    deleted: false,
    basis: [],
  },
  {
    id: "inf-cheddar-block",
    claim: "Prefers cheddar in a block over grated",
    evidenceCount: purchasesOf("mature-cheddar").length,
    evidenceKind: "purchases",
    confidence: "low",
    deleted: false,
    basis: ["mature-cheddar"],
  },
];

// ---------------------------------------------------------------- write

mkdirSync(OUT, { recursive: true });
const write = (name: string, data: unknown) =>
  writeFileSync(join(OUT, name), `${JSON.stringify(data, null, 2)}\n`);

write("store.json", store);
write("products.json", products);
write("placements.json", placements);
write("purchases.json", purchases);
write("trips.json", trips);
write("preferences.json", preferences);
write("substitutions.json", priorSubstitutions);
write("inferences.json", inferences);
write("stock.json", stock);
write("list.json", list);
write("sponsored.json", {
  productId: "ground-coffee",
  reason: "Paid placement. You have not bought this before.",
});
write("meta.json", {
  generated: REFERENCE_TODAY,
  note: "Invented data. No retailer feed, no retailer access.",
});

// ---------------------------------------------------------------- report

const bigShops = trips.filter((t) => t.kind === "big");
const overlaps: number[] = [];
for (let i = 1; i < bigShops.length; i++) {
  const a = new Set(bigShops[i - 1].items.map((x) => x.productId));
  const b = bigShops[i].items.map((x) => x.productId);
  overlaps.push(b.filter((x) => a.has(x)).length / b.length);
}
const avgOverlap = Math.round(
  (overlaps.reduce((s, x) => s + x, 0) / overlaps.length) * 100,
);

console.log(`store          ${RETAILER_NAMES[store.retailer]} ${store.branch} (${AISLES.length} aisles)`);
console.log(`products       ${products.length}`);
console.log(`trips          ${trips.length}  (${TRIP_DATES[0].date} .. ${TRIP_DATES.at(-1)!.date})`);
console.log(`purchases      ${purchases.length}`);
console.log(`milk           ${milkPurchases.length} purchases, median ${milkInterval} days`);
console.log(`own-brand      ${staplePurchases.length} staple purchases`);
console.log(`basket overlap ${avgOverlap}% big shop to big shop`);
console.log(`basket sizes    big ${Math.round(bigShops.reduce((n, t) => n + t.items.length, 0) / bigShops.length)}, top-up ${Math.round(trips.filter((t) => t.kind === "topup").reduce((n, t) => n + t.items.length, 0) / topups)}`);
console.log("");
console.log("would suggest at 8 days out:");
for (const c of CATALOGUE) {
  const own = purchasesOf(c.id);
  if (own.length < 2) continue;
  const m = median(intervalsOf(own));
  const daysSince = Math.round((Date.parse(`${REFERENCE_TODAY}T00:00:00Z`) - Date.parse(`${own.at(-1)!.date}T00:00:00Z`)) / DAY);
  if (daysSince >= m - 1) {
    console.log(`  ${c.id.padEnd(20)} median ${String(m).padStart(3)}  since ${daysSince}  ${confidenceOf(own, today)}`);
  }
}
