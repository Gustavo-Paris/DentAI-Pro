import { logger } from "../_shared/logger.ts";

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
 * Post-AI inventory validation: ensure recommended resin is from inventory.
 * Mutates the recommendation object in place.
 */
// deno-lint-ignore no-explicit-any
export function validateInventoryRecommendation(
  recommendation: any,
  hasInventory: boolean,
  inventoryResins: Array<{ name: string; manufacturer?: string }>,
  budgetAppropriateInventory: Array<{ name: string; manufacturer?: string }>,
): void {
  if (!hasInventory || !recommendation.recommended_resin_name) return;

  const recNameLower = recommendation.recommended_resin_name.toLowerCase();
  const isInInventory = inventoryResins.some(
    (r) => r.name.toLowerCase() === recNameLower
  );
  if (!isInInventory) {
    logger.warn(`AI ignored inventory! Recommended "${recommendation.recommended_resin_name}" is NOT in user inventory. Attempting fallback...`);
    // Find best inventory match based on budget
    const fallback = budgetAppropriateInventory[0] || inventoryResins[0];
    if (fallback) {
      recommendation.ideal_resin_name = recommendation.recommended_resin_name;
      recommendation.ideal_reason = `Resina ideal tecnicamente, mas não está no seu inventário. Usando ${fallback.name} do inventário como alternativa.`;
      recommendation.recommended_resin_name = fallback.name;
      recommendation.is_from_inventory = true;
      logger.log(`Inventory fallback: "${fallback.name}" (${(fallback as { manufacturer?: string }).manufacturer})`);
    }
  } else {
    // Ensure is_from_inventory is correctly set
    recommendation.is_from_inventory = true;
  }
}
