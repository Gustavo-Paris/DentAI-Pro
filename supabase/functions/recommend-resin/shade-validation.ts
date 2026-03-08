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
  const brandReplacements: Record<string, string> = {}; // Track product-line changes for checklist sync

  // Normalize shade: strip parenthetical descriptions AI sometimes adds, e.g. "MW (Milky White)" → "MW"
  function normalizeShade(shade: string): string {
    return shade.replace(/\s*\(.*?\)\s*$/, '').trim();
  }

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
    // Pre-normalize shade values before any lookups
    if (layer.shade) layer.shade = normalizeShade(layer.shade);
    if (layer.shade === 'WT' && layer.resin_brand?.includes('Z350')) {
      shadeReplacements['WT'] = 'CT';
      layer.shade = 'CT';
    }
    const brandMatch = layer.resin_brand?.match(/^(.+?)\s*-\s*(.+)$/);
    const pl = brandMatch ? brandMatch[2].trim() : layer.resin_brand;
    if (pl) productLines.add(pl);
  }
  // Always include brands referenced by enforcement rules (cristas, aumento incisal, enamel final)
  productLines.add('Harmonize');
  productLines.add('Empress Direct');
  productLines.add('FORMA');
  productLines.add('Vittra APS');
  productLines.add('Estelite Omega');
  productLines.add('Palfique');

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
    // Skip catalog re-check for injected layers (e.g., Efeitos Incisais with synthetic shades)
    if (layer._injected) {
      validatedLayers.push(layer);
      continue;
    }

    const layerTypePre = layer.name?.toLowerCase() || '';
    // Skip catalog validation for corante/efeitos layers — these use artistic shade names (White, Amber, Opal)
    // that don't exist in the resin catalog and should never trigger substitution alerts
    const isCoranteLayer = layerTypePre.includes('efeito') || layerTypePre.includes('corante') ||
      layerTypePre.includes('caracteriza') || layerTypePre.includes('tint');
    if (isCoranteLayer) {
      validatedLayers.push(layer);
      continue;
    }

    const brandMatch = layer.resin_brand?.match(/^(.+?)\s*-\s*(.+)$/);
    const productLine = brandMatch ? brandMatch[2].trim() : layer.resin_brand;
    const layerType = layer.name?.toLowerCase() || '';

    // Normalize shade: strip AI-generated descriptions like "MW (Milky White)" → "MW"
    if (layer.shade) {
      const normalized = normalizeShade(layer.shade);
      if (normalized !== layer.shade) {
        logger.log(`Shade normalized: "${layer.shade}" → "${normalized}" for layer "${layer.name}"`);
        layer.shade = normalized;
      }
    }

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
              if (productLine) brandReplacements[productLine] = 'Harmonize';
            }
          } else if (empressRows.length > 0) {
            const blL = empressRows.find(r => /BL-?L/i.test(r.shade)) || empressRows.find(r => r.type?.toLowerCase().includes('esmalte'));
            if (blL) {
              layer.resin_brand = `Ivoclar - IPS Empress Direct`;
              layer.shade = blL.shade;
              shadeReplacements[originalShade] = blL.shade;
              if (productLine) brandReplacements[productLine] = 'IPS Empress Direct';
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
        // All translucent shades that are clinically acceptable for palatal shell
        const translucentShades = ['CT', 'GT', 'BT', 'YT', 'TN', 'Trans', 'Trans20', 'Trans30', 'Opal'];
        const isTranslucent = translucentShades.some(ts =>
          layer.shade.toUpperCase() === ts.toUpperCase()
        );
        if (!isTranslucent) {
          const originalShade = layer.shade;
          const originalBrand = layer.resin_brand;
          // Priority: Estelite Omega CT > FORMA Trans > Vittra Trans > Empress Opal > Z350 BT
          const esteliteCT = catalogRows.find(r => r.shade === 'CT' && matchesLine(r.product_line, 'Estelite Omega'));
          const formaTrans = catalogRows.find(r => /^Trans$/i.test(r.shade) && matchesLine(r.product_line, 'FORMA'));
          const vittraTrans = catalogRows.find(r => /^Trans$/i.test(r.shade) && matchesLine(r.product_line, 'Vittra'));
          const empressOpal = catalogRows.find(r => r.shade === 'Opal' && matchesLine(r.product_line, 'Empress'));
          const z350BT = catalogRows.find(r => r.shade === 'BT' && matchesLine(r.product_line, 'Z350'));
          const replacement = esteliteCT || formaTrans || vittraTrans || empressOpal || z350BT;

          // Brand alignment map — maps catalog row back to canonical brand string
          const brandAlignmentMap: Array<{ row: typeof replacement; pattern: RegExp; brand: string }> = [
            { row: esteliteCT, pattern: /estelite/i, brand: 'Tokuyama - Estelite Omega' },
            { row: formaTrans, pattern: /forma/i, brand: 'Tokuyama - FORMA' },
            { row: vittraTrans, pattern: /vittra/i, brand: 'FGM - Vittra APS' },
            { row: empressOpal, pattern: /empress/i, brand: 'Ivoclar - IPS Empress Direct' },
            { row: z350BT, pattern: /z350/i, brand: '3M ESPE - Filtek Z350 XT' },
          ];

          if (replacement) {
            layer.shade = replacement.shade;
            // Align brand with whichever catalog row was matched
            for (const entry of brandAlignmentMap) {
              if (replacement === entry.row) {
                if (!entry.pattern.test(originalBrand || '')) {
                  layer.resin_brand = entry.brand;
                  if (productLine) {
                    const newPL = entry.brand.match(/^.+?\s*-\s*(.+)$/)?.[1] || entry.brand;
                    brandReplacements[productLine] = newPL;
                  }
                }
                break;
              }
            }
            shadeReplacements[originalShade] = replacement.shade;
          } else {
            // Fallback: find ANY translucent shade in entire catalog
            const anyTranslucent = catalogRows.find(r =>
              ['CT', 'Trans', 'TRANS', 'Trans20', 'Trans30', 'GT', 'BT', 'YT', 'TN', 'Opal'].some(
                ts => r.shade.toUpperCase() === ts.toUpperCase()
              )
            );
            if (anyTranslucent) {
              layer.shade = anyTranslucent.shade;
              // Derive brand name from catalog product_line
              const knownBrands: Record<string, string> = {
                'z350': '3M ESPE - Filtek Z350 XT',
                'forma': 'Tokuyama - FORMA',
                'empress': 'Ivoclar - IPS Empress Direct',
                'vittra': 'FGM - Vittra APS',
                'estelite omega': 'Tokuyama - Estelite Omega',
                'harmonize': 'Kerr - Harmonize',
                'palfique': 'Tokuyama - Palfique LX5',
              };
              for (const [keyword, brand] of Object.entries(knownBrands)) {
                if (anyTranslucent.product_line.toLowerCase().includes(keyword)) {
                  layer.resin_brand = brand;
                  break;
                }
              }
              shadeReplacements[originalShade] = anyTranslucent.shade;
            } else {
              // Hard fallback: force BT (Z350 always has it) — downstream catalog check will handle
              layer.shade = 'BT';
              shadeReplacements[originalShade] = 'BT';
            }
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
          const currentIsUniversal = !['WE', 'CE', 'JE', 'CT', 'Trans', 'IT', 'TN', 'Opal', 'INC', 'MW'].some(
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
        // Whitening goal determines preference: MW Estelite (natural) vs WE Palfique (lighter)
        if (isVestibularFinal && productLine && /z350/i.test(productLine)) {
          const palfiqueWE = catalogRows.find(r =>
            matchesLine(r.product_line, 'Palfique') && r.shade === 'WE'
          );
          const esteliteMW = catalogRows.find(r =>
            matchesLine(r.product_line, 'Estelite Omega') && r.shade === 'MW'
          );
          const esteliteWE = catalogRows.find(r =>
            matchesLine(r.product_line, 'Estelite Omega') && r.shade === 'WE'
          );

          // Whitening: prefer Palfique LX5 WE (lighter result)
          // Natural: prefer Estelite Omega MW (natural result)
          const preferred = wantsWhitening
            ? (palfiqueWE || esteliteWE)
            : (esteliteMW || palfiqueWE || esteliteWE);

          if (preferred) {
            const originalBrand = layer.resin_brand;
            const originalShade = layer.shade;
            const isPalfique = preferred === palfiqueWE;
            layer.resin_brand = isPalfique
              ? 'Tokuyama - Palfique LX5'
              : 'Tokuyama - Estelite Omega';
            layer.shade = preferred.shade;
            if (originalShade !== preferred.shade) shadeReplacements[originalShade] = preferred.shade;
            if (productLine) {
              const newPL = isPalfique ? 'Palfique LX5' : 'Estelite Omega';
              if (productLine !== newPL) brandReplacements[productLine] = newPL;
            }
            const reason = wantsWhitening
              ? 'resultado mais claro (whitening)'
              : 'resultado natural';
            validationAlerts.push(
              `Esmalte Vestibular Final: ${originalBrand} (${originalShade}) → ${layer.resin_brand} (${preferred.shade}) — ${reason}, polimento superior.`
            );
            logger.warn(`Enamel final preference: ${originalBrand} ${originalShade} → ${layer.resin_brand} ${preferred.shade} (whitening=${!!wantsWhitening})`);
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

      // Re-check catalog match after enforcement rules may have changed shade and/or brand
      const enforcedBrandMatch = layer.resin_brand?.match(/^(.+?)\s*-\s*(.+)$/);
      const enforcedProductLine = enforcedBrandMatch ? enforcedBrandMatch[2].trim() : layer.resin_brand;
      const enforcedLineRows = enforcedProductLine !== productLine ? getRowsForLine(enforcedProductLine || '') : lineRows;
      const enforcedCatalogMatch = enforcedLineRows.find((r) => r.shade === layer.shade);

      if (!enforcedCatalogMatch) {
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
          ? enforcedLineRows.filter((r) => r.type?.toLowerCase().includes(typeFilter)).slice(0, 5)
          : enforcedLineRows.slice(0, 5);

        if (alternatives.length > 0) {
          const originalShade = layer.shade;
          const baseShade = originalShade.replace(/^O/, '').replace(/[DE]$/, '');
          const closestAlt = alternatives.find(a => a.shade.includes(baseShade)) || alternatives[0];

          layer.shade = closestAlt.shade;
          shadeReplacements[originalShade] = closestAlt.shade;
          validationAlerts.push(
            `Cor ${originalShade} substituída por ${closestAlt.shade}: a cor original não está disponível na linha ${enforcedProductLine}.`
          );
          logger.warn(`Shade validation: ${originalShade} → ${closestAlt.shade} for ${enforcedProductLine}`);
        } else {
          logger.warn(`No valid shades found for ${enforcedProductLine}, keeping original: ${layer.shade}`);
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
          shade: 'White/Amber/Blue',
          thickness: '0.1mm',
          purpose: 'Reproduzir efeitos ópticos naturais: halo opaco incisal, linhas de craze, translucidez adicional, micro-pontos de caracterização',
          technique: 'Aplicar corante branco para halo opaco na borda incisal. Corante âmbar para linhas de craze. Corante azul (blue) para translucidez adicional e efeito de profundidade nas bordas incisais. Pincel fino antes da camada de esmalte.',
          optional: true,
          _injected: true,
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

  // Apply ALL shade and brand replacements to text fields so they match validated layers
  const hasShadeReplacements = Object.keys(shadeReplacements).length > 0;
  const hasBrandReplacements = Object.keys(brandReplacements).length > 0;

  if (hasShadeReplacements || hasBrandReplacements) {
    if (hasShadeReplacements) {
      logger.log(`Applying ${Object.keys(shadeReplacements).length} shade replacements: ${JSON.stringify(shadeReplacements)}`);
    }
    if (hasBrandReplacements) {
      logger.log(`Applying ${Object.keys(brandReplacements).length} brand replacements: ${JSON.stringify(brandReplacements)}`);
    }

    // Helper: replace all tracked shade names and product line names in text
    const applyTextFixes = (text: string): string => {
      let fixed = text;
      // Apply brand (product line) replacements first — e.g. "Filtek Z350 XT" → "Harmonize"
      for (const [oldPL, newPL] of Object.entries(brandReplacements)) {
        // Match with flexible patterns: "Filtek Z350 XT", "Z350 XT", "Z350", etc.
        const escaped = oldPL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        fixed = fixed.replace(new RegExp(escaped, 'gi'), newPL);
      }
      // Apply shade replacements — e.g. "WE" → "XLE"
      for (const [original, replacement] of Object.entries(shadeReplacements)) {
        const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        fixed = fixed.replace(new RegExp(`\\b${escaped}\\b`, 'g'), replacement);
      }
      return fixed;
    };

    // 1. Checklist (passo a passo)
    if (recommendation.protocol.checklist) {
      recommendation.protocol.checklist = recommendation.protocol.checklist.map(
        (item: string) => typeof item === 'string' ? applyTextFixes(item) : item
      );
    }

    // 2. Per-layer technique and purpose text
    for (const layer of recommendation.protocol.layers) {
      if (typeof layer.technique === 'string') {
        layer.technique = applyTextFixes(layer.technique);
      }
      if (typeof layer.purpose === 'string') {
        layer.purpose = applyTextFixes(layer.purpose);
      }
    }

    // 3. Alternative protocol fields
    if (recommendation.protocol.alternative) {
      const alt = recommendation.protocol.alternative;
      if (typeof alt.shade === 'string') {
        alt.shade = applyTextFixes(alt.shade);
      }
      if (typeof alt.technique === 'string') {
        alt.technique = applyTextFixes(alt.technique);
      }
      if (typeof alt.tradeoff === 'string') {
        alt.tradeoff = applyTextFixes(alt.tradeoff);
      }
    }

    // 4. Justification text
    if (typeof recommendation.justification === 'string') {
      recommendation.justification = applyTextFixes(recommendation.justification);
    }
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

  // Clean up internal markers before returning
  for (const layer of recommendation.protocol.layers) {
    delete layer._injected;
  }
}
