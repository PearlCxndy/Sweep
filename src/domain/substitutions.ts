import { SECTION_WORD } from "./types";
import type {
  Product,
  Purchase,
  Ranked,
  UserProductPreference,
} from "./types";

export type PriorSubstitution = {
  targetProductId: string;
  replacementProductId: string;
  /** ISO date. */
  date: string;
};

export type Ctx = {
  catalogue: Product[];
  prefs: Record<string, UserProductPreference>;
  purchases: Purchase[];
  priorSubstitutions: PriorSubstitution[];
};

/**
 * Dietary tags that are a safety matter, not a preference. These must survive
 * a substitution. Anything outside this list ("organic") is taste, and taste
 * is allowed to move.
 */
const SAFETY_TAGS = new Set([
  "gluten-free",
  "dairy-free",
  "nut-free",
  "vegan",
  "vegetarian",
  "halal",
  "kosher",
]);

export function requiredTags(target: Product): string[] {
  return target.dietaryTags.filter((t) => SAFETY_TAGS.has(t));
}

/**
 * Tags that satisfy other tags. Vegan is stricter than vegetarian, so a vegan
 * product covers a vegetarian requirement — checking the strings literally
 * would reject it, which is the wrong way round and quietly loses good swaps.
 */
const IMPLIES: Record<string, string[]> = {
  vegan: ["vegetarian", "dairy-free"],
};

function satisfiedTags(product: Product): Set<string> {
  const out = new Set(product.dietaryTags);
  for (const tag of product.dietaryTags) {
    for (const implied of IMPLIES[tag] ?? []) out.add(implied);
  }
  return out;
}

const ATTRIBUTE_LABEL: Record<string, string> = {
  fat: "fat content",
  flour: "flour",
  strength: "strength",
  variety: "variety",
  cut: "cut",
};

/**
 * The safety filter runs first and is a hard gate, never a low score.
 * A protected product returns [] — the UI renders the locked panel and shows
 * no alternatives at all.
 */
export function substitutesFor(target: Product, ctx: Ctx): Ranked[] {
  const pref = ctx.prefs[target.id];
  if (pref?.neverSubstitute) return [];

  const needed = requiredTags(target);
  const pool = ctx.catalogue
    .filter((p) => p.id !== target.id)
    // Group first where there is one: a category is too broad to swap inside.
    // Without this, "fresh" offers lemons in place of pork chops.
    .filter((p) =>
      target.group ? p.group === target.group : p.category === target.category,
    )
    .filter((p) => {
      const has = satisfiedTags(p);
      return needed.every((t) => has.has(t));
    });

  return rank(pool, target, ctx);
}

type Candidate = { product: Product; score: number; reason: string };

export function rank(pool: Product[], target: Product, ctx: Ctx): Ranked[] {
  const boughtIds = new Set(ctx.purchases.map((p) => p.productId));
  const priorByReplacement = new Map<string, PriorSubstitution>();
  for (const s of ctx.priorSubstitutions) {
    if (s.targetProductId !== target.id) continue;
    const existing = priorByReplacement.get(s.replacementProductId);
    if (!existing || existing.date < s.date) {
      priorByReplacement.set(s.replacementProductId, s);
    }
  }
  const habit = ownBrandHabit(ctx);
  const pref = ctx.prefs[target.id];

  const scored: Candidate[] = pool.map((product) => {
    // Each rule contributes to the score; the heaviest one that fires also
    // supplies the sentence shown under the name.
    const reasons: Array<{ weight: number; text: string }> = [];
    let score = 0;

    if (target.lineId && product.lineId === target.lineId) {
      score += 50;
      reasons.push({ weight: 50, text: sizeReason(product, target) });
    }

    const prior = priorByReplacement.get(product.id);
    if (prior) {
      score += 35;
      reasons.push({
        weight: 35,
        text: `You swapped to this in ${monthName(prior.date)}.`,
      });
    } else if (boughtIds.has(product.id)) {
      score += 35;
      reasons.push({ weight: 35, text: "You've bought this before." });
    }

    if (pref?.preferredBrand && product.brand === pref.preferredBrand) {
      score += 20;
      reasons.push({ weight: 20, text: "Your usual brand." });
    } else if (habit && product.ownBrand) {
      score += 20;
      reasons.push({ weight: 20, text: "You mostly buy own-brand." });
    }

    if (product.size === target.size) {
      score += 10;
      const attr = differingAttribute(product, target);
      reasons.push({
        weight: 10,
        text: attr
          ? `Same size, different ${attr}.`
          : "Same size as the one you wanted.",
      });
    }

    score -= Math.abs(product.price - target.price) / 50;

    reasons.sort((a, b) => b.weight - a.weight);
    const reason = reasons[0]?.text ?? "Same section, same dietary needs.";

    return { product, score, reason };
  });

  scored.sort(
    (a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id),
  );

  return scored.slice(0, 3).map((c, i) => ({
    product: c.product,
    score: c.score,
    reason: c.reason,
    recommended: i === 0,
  }));
}

function sizeReason(product: Product, target: Product): string {
  const a = product.unitMl;
  const b = target.unitMl;
  if (a && b && a < b && b % a === 0) {
    return `Same product, smaller size. Buy ${b / a}.`;
  }
  if (a && b && a > b) return "Same product, larger size.";
  if (a && b && a < b) return "Same product, smaller size.";
  return "Same product, different size.";
}

function differingAttribute(product: Product, target: Product): string | null {
  const a = product.attributes ?? {};
  const b = target.attributes ?? {};
  for (const key of Object.keys(b)) {
    if (a[key] && a[key] !== b[key]) return ATTRIBUTE_LABEL[key] ?? key;
  }
  return null;
}

/** Does the shopper reach for own-brand most of the time? */
function ownBrandHabit(ctx: Ctx): boolean {
  if (ctx.purchases.length === 0) return false;
  const byId = new Map(ctx.catalogue.map((p) => [p.id, p]));
  let own = 0;
  let total = 0;
  for (const purchase of ctx.purchases) {
    const product = byId.get(purchase.productId);
    if (!product) continue;
    total++;
    if (product.ownBrand) own++;
  }
  return total > 0 && own / total >= 0.6;
}

function monthName(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    timeZone: "UTC",
  });
}

export function sectionWordFor(product: Product): string {
  return SECTION_WORD[product.category];
}
