import { logger } from "../_shared/logger.ts";

interface ShadeValidationParams {
  // deno-lint-ignore no-explicit-any
  recommendation: any;
  aestheticGoals: string | undefined;
  // deno-lint-ignore no-explicit-any
  supabase: any;
}

/**
 * Validates and fixes protocol layers against the resin_catalog.
 * Mutates recommendation.protocol.layers, recommendation.protocol.checklist,
 * and recommendation.protocol.alerts in place.
 */
export async function validateAndFixProtocolLayers({
  recommendation,
  aestheticGoals,
  supabase,
}: ShadeValidationParams): Promise<void> {
  if (!recommendation.protocol?.layers || !Array.isArray(recommendation.protocol.layers)) {
    return;
  }

  const validatedLayers = [];
  const validationAlerts: string[] = [];
  const shadeReplacements: Record<string, string> = {}; // Track all shade corrections for checklist sync

  // Check if patient requested whitening (BL shades)
  const wantsWhitening = aestheticGoals?.toLowerCase().includes('hollywood') ||
                         aestheticGoals?.toLowerCase().includes('bl1') ||
                         aestheticGoals?.toLowerCase().includes('bl2') ||
                         aestheticGoals?.toLowerCase().includes('bl3') ||
                         aestheticGoals?.toLowerCase().includes('intenso') ||
                         aestheticGoals?.toLowerCase().includes('notável');

  // Track if any layer uses a product line without BL shades
  let productLineWithoutBL: string | null = null;

  // ── Batch prefetch: single query replaces N+1 per-layer lookups ──
  const productLines = new Set<string>();
  for (const layer of recommendation.protocol.layers) {
    if (layer.shade === 'WT' && layer.resin_brand?.includes('Z350')) {
      shadeReplacements['WT'] = 'CT';
      layer.shade = 'CT';
    }
    const brandMatch = layer.resin_brand?.match(/^(.+?)\s*-\s*(.+)$/);
    const pl = brandMatch ? brandMatch[2].trim() : layer.resin_brand;
    if (pl) productLines.add(pl);
  }

  // Single DB call: fetch all catalog rows for every product line mentioned
  const catalogRows: Array<{ shade: string; type: string; product_line: string }> = [];
  if (productLines.size > 0) {
    // ilike OR chain: product_line ilike %line1% OR ilike %line2% ...
    const orFilter = Array.from(productLines)
      .map((pl) => `product_line.ilike.%${pl}%`)
      .join(",");
    const { data: rows } = await supabase
      .from("resin_catalog")
      .select("shade, type, product_line")
      .or(orFilter);
    if (rows) catalogRows.push(...rows);
  }

  // Build in-memory indexes for O(1) lookups
  // Index: (product_line_keyword, shade) → catalog row
  function matchesLine(catalogLine: string, keyword: string): boolean {
    return catalogLine.toLowerCase().includes(keyword.toLowerCase());
  }
  function getRowsForLine(keyword: string) {
    return catalogRows.filter((r) => matchesLine(r.product_line, keyword));
  }

  for (const layer of recommendation.protocol.layers) {
    const brandMatch = layer.resin_brand?.match(/^(.+?)\s*-\s*(.+)$/);
    const productLine = brandMatch ? brandMatch[2].trim() : layer.resin_brand;
    const layerType = layer.name?.toLowerCase() || '';

    if (productLine && layer.shade) {
      const lineRows = getRowsForLine(productLine);

      // Check if shade exists in the product line (was: per-layer DB query)
      const catalogMatch = lineRows.find((r) => r.shade === layer.shade);

      // For enamel layer, ensure we use specific enamel shades when available
      const isEnamelLayer = layerType.includes('esmalte') || layerType.includes('enamel');

      const isCristasLayer = layerType.includes('crista') || layerType.includes('proxima');

      // Enforce: cristas should use Harmonize XLE or Empress BL-L — flag if not
      if (isCristasLayer && productLine) {
        const plLower = productLine.toLowerCase();
        const isAllowedForCristas = plLower.includes('harmonize') || plLower.includes('empress') || (plLower.includes('z350') && layer.shade === 'WE');
        if (!isAllowedForCristas) {
          validationAlerts.push(
            `Cristas Proximais: ${productLine} (${layer.shade}) não é ideal. Recomendado: XLE(Harmonize) ou BL-L(Empress Direct).`
          );
          logger.warn(`Cristas enforcement: ${productLine} ${layer.shade} flagged — should use Harmonize/Empress`);
        }
      }

      // Enforce: Z350 cannot have BL1/BL2/BL3 shades (they don't exist in this product line)
      if (productLine && /z350/i.test(productLine) && layer.shade && /^BL\d?$/i.test(layer.shade)) {
        const originalShade = layer.shade;
        // Find best Z350 alternative based on layer type
        const z350Rows = getRowsForLine(productLine);
        const z350NonBL = z350Rows.filter(r => !(/^BL/i.test(r.shade)));
        let replacement: { shade: string } | undefined;
        if (isEnamelLayer) {
          replacement = z350NonBL.find(r => r.shade === 'A1E') || z350NonBL.find(r => r.type?.toLowerCase().includes('esmalte'));
        } else {
          replacement = z350NonBL.find(r => r.shade === 'A1') || z350NonBL[0];
        }
        if (replacement) {
          layer.shade = replacement.shade;
          shadeReplacements[originalShade] = replacement.shade;
          validationAlerts.push(
            `Cor ${originalShade} NÃO EXISTE na linha Filtek Z350 XT. Substituída por ${replacement.shade}.`
          );
          logger.warn(`Z350 BL enforcement: ${originalShade} → ${replacement.shade}`);
        }
      }

      if (isEnamelLayer) {
        const enamelShades = lineRows.filter((r) =>
          r.type?.toLowerCase().includes('esmalte')
        );

        if (enamelShades.length > 0) {
          const currentIsUniversal = !['WE', 'CE', 'JE', 'CT', 'Trans', 'IT', 'TN', 'Opal', 'INC'].some(
            prefix => layer.shade.toUpperCase().includes(prefix)
          );

          if (currentIsUniversal) {
            const preferredOrder = ['WE', 'CE', 'JE', 'CT', 'Trans'];
            let bestEnamel = enamelShades[0];

            for (const pref of preferredOrder) {
              const found = enamelShades.find(e => e.shade.toUpperCase().includes(pref));
              if (found) {
                bestEnamel = found;
                break;
              }
            }

            const originalShade = layer.shade;
            layer.shade = bestEnamel.shade;
            shadeReplacements[originalShade] = bestEnamel.shade;
            validationAlerts.push(
              `Camada de esmalte otimizada: ${originalShade} → ${bestEnamel.shade} para máxima translucidez incisal.`
            );
            logger.warn(`Enamel optimization: ${originalShade} → ${bestEnamel.shade} for ${productLine}`);
          }
        }
      }

      // Check if patient wants BL but product line doesn't have it (in-memory check)
      if (wantsWhitening && !productLineWithoutBL) {
        const hasBL = lineRows.some(
          (r) => /bl|bianco/i.test(r.shade)
        );
        if (!hasBL) {
          productLineWithoutBL = productLine;
        }
      }

      if (!catalogMatch) {
        // Shade doesn't exist - find appropriate alternative from cached rows
        let typeFilter = '';
        if (layerType.includes('opaco') || layerType.includes('mascaramento')) {
          typeFilter = 'opaco';
        } else if (layerType.includes('dentina') || layerType.includes('body')) {
          typeFilter = 'universal';
        } else if (isEnamelLayer) {
          typeFilter = 'esmalte';
        }

        const alternatives = typeFilter
          ? lineRows.filter((r) => r.type?.toLowerCase().includes(typeFilter)).slice(0, 5)
          : lineRows.slice(0, 5);

        if (alternatives.length > 0) {
          const originalShade = layer.shade;
          const baseShade = originalShade.replace(/^O/, '').replace(/[DE]$/, '');
          const closestAlt = alternatives.find(a => a.shade.includes(baseShade)) || alternatives[0];

          layer.shade = closestAlt.shade;
          shadeReplacements[originalShade] = closestAlt.shade;
          validationAlerts.push(
            `Cor ${originalShade} substituída por ${closestAlt.shade}: a cor original não está disponível na linha ${productLine}.`
          );
          logger.warn(`Shade validation: ${originalShade} → ${closestAlt.shade} for ${productLine}`);
        } else {
          logger.warn(`No valid shades found for ${productLine}, keeping original: ${layer.shade}`);
        }
      }
    }

    validatedLayers.push(layer);
  }

  // Add BL availability alert if needed
  if (wantsWhitening && productLineWithoutBL) {
    validationAlerts.push(
      `A linha ${productLineWithoutBL} não possui cores BL (Bleach). Para atingir nível de clareamento Hollywood, considere linhas como Palfique LX5, Forma (Ultradent) ou Estelite Bianco que oferecem cores BL.`
    );
    logger.warn(`BL shades not available in ${productLineWithoutBL}, patient wants whitening`);
  }

  // Update layers with validated versions
  recommendation.protocol.layers = validatedLayers;

  // Apply ALL shade replacements to checklist text so steps match validated layers
  if (recommendation.protocol.checklist && Object.keys(shadeReplacements).length > 0) {
    logger.log(`Applying ${Object.keys(shadeReplacements).length} shade replacements to checklist: ${JSON.stringify(shadeReplacements)}`);
    recommendation.protocol.checklist = recommendation.protocol.checklist.map(
      (item: string) => {
        if (typeof item !== 'string') return item;
        let fixed = item;
        for (const [original, replacement] of Object.entries(shadeReplacements)) {
          // Use word-boundary regex to avoid partial matches (e.g., "A1E" inside "DA1E")
          fixed = fixed.replace(new RegExp(`\\b${original}\\b`, 'g'), replacement);
        }
        return fixed;
      }
    );
  }

  // Add validation alerts to protocol alerts (with deduplication)
  if (validationAlerts.length > 0) {
    const existingAlerts: string[] = recommendation.protocol.alerts || [];
    // Filter out validation alerts that duplicate AI-generated ones
    const newAlerts = validationAlerts.filter((va: string) => {
      const vaLower = va.toLowerCase();
      return !existingAlerts.some((ea: string) => {
        const eaLower = ea.toLowerCase();
        // Both mention BL/bleach for same concept = duplicate
        return (vaLower.includes('bl') || vaLower.includes('bleach')) &&
               (eaLower.includes('bl') || eaLower.includes('bleach'));
      });
    });
    recommendation.protocol.alerts = [...existingAlerts, ...newAlerts];
  }
}
