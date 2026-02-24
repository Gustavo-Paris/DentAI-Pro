import { logger } from "../_shared/logger.ts";
import type { RecommendResinResponseParsed } from "../_shared/aiSchemas.ts";

/**
 * Resin type as stored in the `resins` table.
 * `indications` contains Black's classification strings like "Classe I", "Classe III", etc.
 * `type` contains the composite type (e.g., "Nanoparticulada", "Bulk Fill").
 */
interface ResinRecord {
  name: string;
  manufacturer?: string;
  price_range: string;
  type?: string;
  indications?: string[];
}

// Group resins by price range for better budget-aware recommendations
export const groupResinsByPrice = <T extends { price_range: string }>(resinList: T[]) => ({
  economico: resinList.filter((r) => r.price_range === "Econômico"),
  intermediario: resinList.filter((r) => r.price_range === "Intermediário"),
  medioAlto: resinList.filter((r) => r.price_range === "Médio-alto"),
  premium: resinList.filter((r) => r.price_range === "Premium"),
});

// Get budget-appropriate resins based on user's budget selection
export const getBudgetAppropriateResins = <T extends { price_range: string }>(
  resinList: T[],
  budget: string
) => {
  const groups = groupResinsByPrice(resinList);
  switch (budget) {
    case "padrão":
      return [...groups.economico, ...groups.intermediario, ...groups.medioAlto];
    case "premium":
      return resinList; // All resins available for premium budget
    default:
      return resinList;
  }
};

/**
 * Black's classification classes typical for anterior vs posterior teeth.
 * - Anterior: III, IV, V (proximal/cervical on anterior teeth)
 * - Posterior: I, II (occlusal/proximal on posterior teeth)
 * - Universal: supports both anterior and posterior classes
 */
const ANTERIOR_CLASSES = ["Classe III", "Classe IV", "Classe V"];
const POSTERIOR_CLASSES = ["Classe I", "Classe II"];

/**
 * Determines if a resin is clinically appropriate for the given tooth region.
 * Uses the resin's `indications` (Black's classification) and `type` to match.
 *
 * @returns "exact" if resin indications match the region, "universal" if resin
 *          covers all classes, or null if not appropriate.
 */
function getRegionMatch(resin: ResinRecord, region: string | undefined): "exact" | "universal" | null {
  const indications = resin.indications || [];
  if (indications.length === 0) return null;

  // Check if resin is universal (covers both anterior and posterior classes)
  const supportsAnterior = ANTERIOR_CLASSES.some(c => indications.includes(c));
  const supportsPosterior = POSTERIOR_CLASSES.some(c => indications.includes(c));
  const isUniversal = supportsAnterior && supportsPosterior;

  if (isUniversal) return "universal";

  // Bulk Fill resins are posterior-only regardless of indications
  const resinType = (resin.type || "").toLowerCase();
  if (resinType.includes("bulk")) {
    return region === "posterior" ? "exact" : null;
  }

  const regionLower = (region || "").toLowerCase();
  if (regionLower === "anterior" && supportsAnterior) return "exact";
  if (regionLower === "posterior" && supportsPosterior) return "exact";

  // If region is unknown or doesn't match, still return universal for broad-spectrum resins
  return null;
}

/**
 * Finds the best clinical fallback resin from inventory, considering tooth region.
 *
 * Priority:
 * 1. Exact region match (indications match anterior/posterior)
 * 2. Universal resin (covers all classes)
 * 3. First available (last resort, with warning)
 */
function findBestInventoryFallback(
  budgetAppropriate: ResinRecord[],
  allInventory: ResinRecord[],
  region: string | undefined,
): { resin: ResinRecord; matchType: "exact" | "universal" | "blind" } | null {
  // Search budget-appropriate first, then all inventory
  for (const pool of [budgetAppropriate, allInventory]) {
    if (pool.length === 0) continue;

    const exactMatches: ResinRecord[] = [];
    const universalMatches: ResinRecord[] = [];

    for (const resin of pool) {
      const match = getRegionMatch(resin, region);
      if (match === "exact") exactMatches.push(resin);
      else if (match === "universal") universalMatches.push(resin);
    }

    // Prefer exact region match
    if (exactMatches.length > 0) {
      return { resin: exactMatches[0], matchType: "exact" };
    }
    // Then universal resins
    if (universalMatches.length > 0) {
      return { resin: universalMatches[0], matchType: "universal" };
    }
  }

  // Last resort: first budget-appropriate or first in inventory, with warning
  const lastResort = budgetAppropriate[0] || allInventory[0];
  if (lastResort) {
    return { resin: lastResort, matchType: "blind" };
  }

  return null;
}

/**
 * Post-AI inventory validation: ensure recommended resin is from inventory.
 * Mutates the recommendation object in place.
 *
 * @param region - Tooth region ("anterior" | "posterior") for clinical fallback matching
 */
export function validateInventoryRecommendation(
  recommendation: RecommendResinResponseParsed,
  hasInventory: boolean,
  inventoryResins: ResinRecord[],
  budgetAppropriateInventory: ResinRecord[],
  region?: string,
): void {
  if (!hasInventory || !recommendation.recommended_resin_name) return;

  const recNameLower = recommendation.recommended_resin_name.toLowerCase();
  const isInInventory = inventoryResins.some(
    (r) => r.name.toLowerCase() === recNameLower
  );
  if (!isInInventory) {
    logger.warn(`AI ignored inventory! Recommended "${recommendation.recommended_resin_name}" is NOT in user inventory. Attempting clinical fallback...`);

    const fallbackResult = findBestInventoryFallback(budgetAppropriateInventory, inventoryResins, region);

    if (fallbackResult) {
      const { resin: fallback, matchType } = fallbackResult;
      if (matchType === "blind") {
        logger.warn(`No region-appropriate inventory resin found for "${region || "unknown"}". Using first available: "${fallback.name}" — clinical suitability not verified.`);
      } else {
        logger.log(`Inventory fallback (${matchType} match for ${region || "unknown"}): "${fallback.name}" (${fallback.manufacturer})`);
      }
      recommendation.ideal_resin_name = recommendation.recommended_resin_name;
      recommendation.ideal_reason = `Resina ideal tecnicamente, mas não está no seu inventário. Usando ${fallback.name} do inventário como alternativa.`;
      recommendation.recommended_resin_name = fallback.name;
      recommendation.is_from_inventory = true;
    }
  } else {
    // Ensure is_from_inventory is correctly set
    recommendation.is_from_inventory = true;
  }
}
