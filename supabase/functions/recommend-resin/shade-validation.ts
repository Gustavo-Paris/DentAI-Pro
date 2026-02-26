import { logger } from "../_shared/logger.ts";
import { ResinCatalogRowSchema, type RecommendResinResponseParsed } from "../_shared/aiSchemas.ts";

interface ShadeValidationParams {
  recommendation: RecommendResinResponseParsed;
  aestheticGoals: string | undefined;
  // deno-lint-ignore no-explicit-any
  supabase: any;
  /** FDI tooth notation (e.g. "11") — used for layer count validation */
  tooth?: string;
  /** Cavity class (e.g. "Classe III") — used for layer count validation */
  cavityClass?: string;
}

// ---------------------------------------------------------------------------
// Minimum layer count validation
// ---------------------------------------------------------------------------

interface LayerCountContext {
  tooth: string;          // FDI notation, e.g. "11", "36"
  cavityClass: string;    // e.g. "Classe III", "Classe IV", "Fechamento de Diastema"
}

// Anterior teeth: 13-23 (upper), 33-43 (lower) in FDI notation
function isAnteriorTooth(tooth: string): boolean {
  if (tooth.length !== 2) return false;
  const quadrant = parseInt(tooth[0], 10);
  const position = parseInt(tooth[1], 10);
  // Quadrants 1,2 (upper) and 3,4 (lower); positions 1-3 (incisors + canine)
  return [1, 2, 3, 4].includes(quadrant) && position >= 1 && position <= 3;
}

// Aesthetic cavity classes that require full stratification
const AESTHETIC_CLASSES = [
  'classe i', 'classe ii', 'classe iii', 'classe iv', 'classe v',
  'faceta direta', 'fechamento de diastema',
  'recontorno estético', 'lente de contato',
];

/**
 * Validates that the protocol has a clinically appropriate minimum number of layers.
 *
 * - Anterior teeth with aesthetic cases (Class III, IV, V, diastema, faceta): minimum 3 layers
 *   (dentina + efeitos/translucidez + esmalte)
 * - Posterior teeth with Class I/II: minimum 2 layers acceptable
 *
 * Does NOT block the protocol — only adds a warning to alerts if the count is too low.
 */
export function validateMinimumLayerCount(layers: unknown[], context: LayerCountContext): string | null {
  if (!layers || !Array.isArray(layers)) return null;

  const layerCount = layers.length;
  const anterior = isAnteriorTooth(context.tooth);
  const classLower = context.cavityClass?.toLowerCase() || '';
  const isAestheticCase = AESTHETIC_CLASSES.some(c => classLower.includes(c));

  if (anterior && isAestheticCase) {
    const minRequired = 3;
    if (layerCount < minRequired) {
      const warning = `Protocolo gerou apenas ${layerCount} camada(s) para dente anterior estético (${context.tooth}, ${context.cavityClass}). Mínimo recomendado: ${minRequired} camadas (dentina + efeitos/translucidez + esmalte).`;
      logger.warn(`Layer count validation: ${warning}`);
      return warning;
    }
  } else {
    // Posterior teeth or non-aesthetic cases
    const minRequired = 2;
    if (layerCount < minRequired) {
      const warning = `Protocolo gerou apenas ${layerCount} camada(s) para dente ${context.tooth} (${context.cavityClass}). Mínimo recomendado: ${minRequired} camadas.`;
      logger.warn(`Layer count validation: ${warning}`);
      return warning;
    }
  }

  return null;
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
  tooth,
  cavityClass,
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
  // Always include Harmonize and Empress Direct for cristas proximais auto-fix
  productLines.add('Harmonize');
  productLines.add('Empress Direct');

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
    if (rows) {
      for (const row of rows) {
        const parsed = ResinCatalogRowSchema.safeParse(row);
        if (parsed.success) {
          catalogRows.push(parsed.data);
        } else {
          logger.warn(`Invalid resin catalog row skipped: ${JSON.stringify(row)}`);
        }
      }
    }
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

      // Enforce: cristas MUST use Harmonize XLE, Empress BL-L/BL-XL, or Z350 WE — auto-fix if not
      if (isCristasLayer && productLine) {
        const plLower = productLine.toLowerCase();
        const isAllowedForCristas = plLower.includes('harmonize') || plLower.includes('empress') || (plLower.includes('z350') && layer.shade === 'WE');
        if (!isAllowedForCristas) {
          const originalBrand = layer.resin_brand;
          const originalShade = layer.shade;
          // Try to find Harmonize or Empress in catalog
          const harmonizeRows = catalogRows.filter(r => r.product_line.toLowerCase().includes('harmonize'));
          const empressRows = catalogRows.filter(r => r.product_line.toLowerCase().includes('empress'));
          if (harmonizeRows.length > 0) {
            const xle = harmonizeRows.find(r => r.shade === 'XLE') || harmonizeRows.find(r => r.type?.toLowerCase().includes('esmalte'));
            if (xle) {
              layer.resin_brand = `Kerr - Harmonize`;
              layer.shade = xle.shade;
              shadeReplacements[originalShade] = xle.shade;
            }
          } else if (empressRows.length > 0) {
            const blL = empressRows.find(r => /BL-?L/i.test(r.shade)) || empressRows.find(r => r.type?.toLowerCase().includes('esmalte'));
            if (blL) {
              layer.resin_brand = `Ivoclar - IPS Empress Direct`;
              layer.shade = blL.shade;
              shadeReplacements[originalShade] = blL.shade;
            }
          }
          const actuallyChanged = layer.resin_brand !== originalBrand || layer.shade !== originalShade;
          if (actuallyChanged) {
            validationAlerts.push(
              `Cristas Proximais: ${originalBrand} (${originalShade}) substituído por ${layer.resin_brand} (${layer.shade}). Cristas requerem XLE(Harmonize) ou BL-L(Empress Direct).`
            );
            logger.warn(`Cristas auto-fix: ${originalBrand} ${originalShade} → ${layer.resin_brand} ${layer.shade}`);
          } else {
            validationAlerts.push(
              `Cristas Proximais: ${originalBrand} (${originalShade}) não é ideal para cristas — substituição automática não foi possível. Recomendado: XLE(Harmonize) ou BL-L(Empress Direct).`
            );
            logger.warn(`Cristas auto-fix failed: ${originalBrand} ${originalShade} — no replacement found in catalog`);
          }
        }
      }

      // Enforce: aumento incisal MUST use translucent shades (Trans/CT family)
      const isAumentoIncisal = (layerType.includes('aumento') && layerType.includes('incisal')) ||
                               layerType.includes('incisal build');
      if (isAumentoIncisal && !layerType.includes('efeito') && layer.shade) {
        const translucentShades = ['CT', 'GT', 'Trans', 'Trans20', 'Trans30'];
        const isTranslucent = translucentShades.some(ts =>
          layer.shade.toUpperCase().includes(ts.toUpperCase())
        );
        if (!isTranslucent) {
          const originalShade = layer.shade;
          const originalBrand = layer.resin_brand;
          // Prefer CT from Z350 or Trans from FORMA in catalog
          const z350CT = catalogRows.find(r => r.shade === 'CT' && matchesLine(r.product_line, 'Z350'));
          const formaTrans = catalogRows.find(r => /^Trans$/i.test(r.shade) && matchesLine(r.product_line, 'FORMA'));
          const empressTrans = catalogRows.find(r => /Trans20/i.test(r.shade) && matchesLine(r.product_line, 'Empress'));
          const vittraTrans = catalogRows.find(r => /^Trans$/i.test(r.shade) && matchesLine(r.product_line, 'Vittra'));
          const replacement = z350CT || formaTrans || empressTrans || vittraTrans;
          if (replacement) {
            layer.shade = replacement.shade;
            if (z350CT && !/z350/i.test(originalBrand || '')) {
              layer.resin_brand = '3M ESPE - Filtek Z350 XT';
            } else if (formaTrans && !/forma/i.test(originalBrand || '')) {
              layer.resin_brand = 'Ultradent - FORMA';
            }
            shadeReplacements[originalShade] = replacement.shade;
          } else {
            // Fallback: force CT if no catalog match
            layer.shade = 'CT';
            shadeReplacements[originalShade] = 'CT';
          }
          validationAlerts.push(
            `Aumento Incisal: shade ${originalShade} inválido — requer resina translúcida (Trans/CT). Substituído por ${layer.shade}.`
          );
          logger.warn(`Aumento incisal enforcement: ${originalBrand} ${originalShade} → ${layer.resin_brand} ${layer.shade}`);
        }
      }

      // Enforce: dentina/corpo layers must NOT use enamel shades
      const isDentinaCorpoLayer = layerType.includes('dentina') || layerType.includes('corpo') || layerType.includes('body');
      if (isDentinaCorpoLayer && layer.shade) {
        const enamelShadesList = ['WE', 'A1E', 'A2E', 'A3E', 'B1E', 'B2E', 'CT', 'GT', 'BT', 'YT', 'MW', 'CE', 'JE', 'TN', 'INC', 'BL1', 'BL2', 'BL3', 'BL-L', 'BL-XL', 'BL-T', 'XLE', 'Trans20', 'Trans30', 'Trans', 'Opal'];
        const isEnamelShadeForBody = enamelShadesList.some(es => layer.shade.toUpperCase() === es.toUpperCase());
        if (isEnamelShadeForBody) {
          const originalShade = layer.shade;
          // Prefer WB, then DA1, then A1 as body shade
          const bodyRows = lineRows.filter(r => r.type?.toLowerCase().includes('body') || r.type?.toLowerCase().includes('dentina') || r.type?.toLowerCase().includes('universal'));
          const wbRow = bodyRows.find(r => r.shade === 'WB');
          const da1Row = bodyRows.find(r => r.shade === 'DA1');
          const a1Row = bodyRows.find(r => r.shade.startsWith('A1'));
          const replacement = wbRow || da1Row || a1Row || bodyRows[0];
          if (replacement) {
            layer.shade = replacement.shade;
            shadeReplacements[originalShade] = replacement.shade;
            validationAlerts.push(
              `Dentina/Corpo: shade ${originalShade} é shade de ESMALTE, inválido para camada de corpo. Substituído por ${replacement.shade}.`
            );
            logger.warn(`Dentina/corpo enforcement: ${originalShade} → ${replacement.shade}`);
          } else {
            // Hard fallback: catalog empty or product line not found — force safe body shade
            layer.shade = 'WB';
            shadeReplacements[originalShade] = 'WB';
            validationAlerts.push(
              `Dentina/Corpo: shade ${originalShade} é shade de ESMALTE, inválido para camada de corpo. Catálogo não encontrado — substituído por WB (fallback seguro).`
            );
            logger.warn(`Dentina/corpo enforcement (hard fallback): ${originalShade} → WB`);
          }
        }
      }

      // Enforce: Z350 cannot have BL1/BL2/BL3 shades (they don't exist in this product line)
      if (productLine && /z350/i.test(productLine) && layer.shade && /^BL\d?$/i.test(layer.shade)) {
        const originalShade = layer.shade;
        // Find best Z350 alternative based on layer type
        const z350Rows = getRowsForLine(productLine);
        const z350NonBL = z350Rows.filter(r => !(/^BL/i.test(r.shade)));
        if (z350NonBL.length === 0) {
          // Catalog missing or empty — force safe default
          layer.shade = isEnamelLayer ? 'A1E' : 'A1';
          shadeReplacements[originalShade] = layer.shade;
          validationAlerts.push(
            `Cor ${originalShade} não disponível na linha Filtek Z350 XT. Substituída automaticamente por ${layer.shade}.`
          );
          logger.warn(`Z350 BL enforcement fallback: ${originalShade} → ${layer.shade} (no catalog rows)`);
        } else {
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
              `Cor ${originalShade} não disponível na linha Filtek Z350 XT. Substituída automaticamente por ${replacement.shade}.`
            );
            logger.warn(`Z350 BL enforcement: ${originalShade} → ${replacement.shade}`);
          }
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

      // Enforce: esmalte vestibular final must NOT use translucent shades
      if (isEnamelLayer && layer.shade) {
        const translucentShades = ['CT', 'GT', 'BT', 'YT', 'WT'];
        const isTranslucent = translucentShades.some(ts => layer.shade.toUpperCase() === ts.toUpperCase());
        const isVestibularFinal = layerType.includes('vestibular') || layerType.includes('final');
        if (isTranslucent && isVestibularFinal) {
          const originalShade = layer.shade;
          // Prefer WE, then MW, then A1E
          const weRow = lineRows.find(r => r.shade === 'WE');
          const mwRow = lineRows.find(r => r.shade === 'MW');
          const a1eRow = lineRows.find(r => r.shade === 'A1E');
          const replacement = weRow || mwRow || a1eRow;
          if (replacement) {
            layer.shade = replacement.shade;
            shadeReplacements[originalShade] = replacement.shade;
            validationAlerts.push(
              `Esmalte Vestibular Final: shade translúcido ${originalShade} inválido para esmalte final. Substituído por ${replacement.shade}.`
            );
            logger.warn(`Enamel final enforcement: ${originalShade} → ${replacement.shade}`);
          }
        }

        // Prefer Estelite Omega or Palfique LX5 over Z350 for esmalte vestibular final
        if (isVestibularFinal && productLine && /z350/i.test(productLine)) {
          const palfiqueWE = catalogRows.find(r =>
            matchesLine(r.product_line, 'Palfique') && r.shade === 'WE'
          );
          const esteliteWE = catalogRows.find(r =>
            matchesLine(r.product_line, 'Estelite Omega') && (r.shade === 'WE' || r.shade === 'MW')
          );
          const preferred = palfiqueWE || esteliteWE;
          if (preferred) {
            const originalBrand = layer.resin_brand;
            const originalShade = layer.shade;
            layer.resin_brand = palfiqueWE
              ? 'Tokuyama - Palfique LX5'
              : 'Tokuyama - Estelite Omega';
            layer.shade = preferred.shade;
            shadeReplacements[originalShade] = preferred.shade;
            validationAlerts.push(
              `Esmalte Vestibular Final: ${originalBrand} (${originalShade}) → ${layer.resin_brand} (${preferred.shade}) — polimento superior para camada de esmalte anterior.`
            );
            logger.warn(`Enamel final preference: ${originalBrand} ${originalShade} → ${layer.resin_brand} ${preferred.shade}`);
          }
        }
      }

      // Check if patient wants BL but product line doesn't have it (in-memory check)
      if (wantsWhitening && !productLineWithoutBL) {
        const hasBL = lineRows.some(
          (r) => /bl|bianco/i.test(r.shade)
        );
        // Lines known to have BL shades should never be flagged
        const isKnownBLLine = /omega|bianco|empress|forma/i.test(productLine);
        if (!hasBL && !isKnownBLLine) {
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

  // Enforce: anterior aesthetic protocols MUST include Efeitos Incisais layer
  if (tooth && cavityClass) {
    const anterior = isAnteriorTooth(tooth);
    const classLower = cavityClass.toLowerCase();
    const isAestheticCase = AESTHETIC_CLASSES.some(c => classLower.includes(c));
    if (anterior && isAestheticCase && recommendation.protocol.layers.length >= 3) {
      const hasEfeitos = recommendation.protocol.layers.some(
        (l: { name?: string }) => {
          const n = (l.name || '').toLowerCase();
          return n.includes('efeito') || n.includes('corante') || n.includes('caracteriza');
        }
      );
      if (!hasEfeitos) {
        // Find where Esmalte Vestibular Final is and insert Efeitos before it
        const esmalteIdx = recommendation.protocol.layers.findIndex(
          (l: { name?: string }) => {
            const n = (l.name || '').toLowerCase();
            return (n.includes('esmalte') && (n.includes('vestibular') || n.includes('final')));
          }
        );
        const insertIdx = esmalteIdx >= 0 ? esmalteIdx : recommendation.protocol.layers.length;
        const efeitosLayer = {
          order: insertIdx + 1,
          name: 'Efeitos Incisais',
          resin_brand: 'Ivoclar - Empress Direct Color',
          shade: 'White/Amber',
          thickness: '0.1mm',
          purpose: 'Reproduzir efeitos ópticos naturais: halo opaco incisal, linhas de craze, micro-pontos de caracterização',
          technique: 'Aplicar corante branco para halo opaco na borda incisal. Corante âmbar para linhas de craze. Pincel fino antes da camada de esmalte.',
          optional: true,
        };
        recommendation.protocol.layers.splice(insertIdx, 0, efeitosLayer);
        // Re-number all layers
        for (let i = 0; i < recommendation.protocol.layers.length; i++) {
          recommendation.protocol.layers[i].order = i + 1;
        }
        validationAlerts.push(
          'Efeitos Incisais adicionados ao protocolo — obrigatório para estético anterior. Camada marcada como opcional (decisão do dentista).'
        );
        logger.warn('Efeitos Incisais layer injected: anterior aesthetic protocol was missing corantes');
      }
    }
  }

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

  // Validate minimum layer count if clinical context is available
  if (tooth && cavityClass && recommendation.protocol?.layers) {
    const layerWarning = validateMinimumLayerCount(
      recommendation.protocol.layers,
      { tooth, cavityClass },
    );
    if (layerWarning) {
      recommendation.protocol.warnings = recommendation.protocol.warnings || [];
      recommendation.protocol.warnings.push(layerWarning);
    }
  }
}
