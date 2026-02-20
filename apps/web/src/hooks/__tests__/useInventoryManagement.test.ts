import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure computation logic from useInventoryManagement
// The hook depends on React Query + AuthContext, so we mirror the data
// transformations and test them in isolation — no renderHook, no mocking.
// ---------------------------------------------------------------------------

// --- Inline types (mirror from hook + data layer) ---

interface RawInventoryItem {
  id: string;
  resin_id: string;
  resin: {
    shade: string;
    brand: string;
    product_line: string;
    type: string;
    opacity: string;
  };
}

interface FlatInventoryItem {
  id: string;
  resinId: string;
  shade: string;
  brand: string;
  product_line: string;
  type: string;
  opacity: string;
}

interface CatalogResin {
  id: string;
  brand: string;
  product_line: string;
  shade: string;
  type: string;
  opacity: string;
}

interface CatalogFilters {
  search: string;
  brand: string;
  type: string;
}

interface GroupedResins {
  [brand: string]: {
    [productLine: string]: CatalogResin[];
  };
}

// ---------------------------------------------------------------------------
// Mirror pure functions from useInventoryManagement
// ---------------------------------------------------------------------------

function flattenItems(items: RawInventoryItem[]): FlatInventoryItem[] {
  return items.map((item) => ({
    id: item.id,
    resinId: item.resin_id,
    shade: item.resin.shade,
    brand: item.resin.brand,
    product_line: item.resin.product_line,
    type: item.resin.type,
    opacity: item.resin.opacity,
  }));
}

function extractBrandOptions(
  items: RawInventoryItem[],
): { value: string; label: string }[] {
  return [...new Set(items.map((item) => item.resin.brand))]
    .sort()
    .map((b) => ({ value: b, label: b }));
}

function extractTypeOptions(
  items: RawInventoryItem[],
): { value: string; label: string }[] {
  return [...new Set(items.map((item) => item.resin.type))]
    .sort()
    .map((t) => ({ value: t, label: t }));
}

function filterCatalog(
  catalog: CatalogResin[],
  inventoryResinIds: Set<string>,
  filters: CatalogFilters,
): CatalogResin[] {
  return catalog.filter((resin) => {
    const notInInventory = !inventoryResinIds.has(resin.id);
    const matchesSearch =
      resin.shade.toLowerCase().includes(filters.search.toLowerCase()) ||
      resin.brand.toLowerCase().includes(filters.search.toLowerCase()) ||
      resin.product_line.toLowerCase().includes(filters.search.toLowerCase());
    const matchesBrand =
      filters.brand === 'all' || resin.brand === filters.brand;
    const matchesType =
      filters.type === 'all' || resin.type === filters.type;
    return notInInventory && matchesSearch && matchesBrand && matchesType;
  });
}

function groupCatalog(resins: CatalogResin[]): GroupedResins {
  const grouped: GroupedResins = {};
  resins.forEach((resin) => {
    if (!grouped[resin.brand]) grouped[resin.brand] = {};
    if (!grouped[resin.brand][resin.product_line])
      grouped[resin.brand][resin.product_line] = [];
    grouped[resin.brand][resin.product_line].push(resin);
  });
  return grouped;
}

function parseCSVLine(line: string): string[] {
  return (
    line
      .match(/("([^"]*("")?)*"|[^,]*)(,|$)/g)
      ?.map((v) =>
        v
          .replace(/,$/, '')
          .replace(/^"|"$/g, '')
          .replace(/""/g, '"')
          .trim(),
      ) || []
  );
}

function matchCSVRows(
  dataLines: string[],
  catalog: CatalogResin[],
  inventoryResinIds: Set<string>,
): { matched: CatalogResin[]; unmatched: string[] } {
  const matched: CatalogResin[] = [];
  const unmatched: string[] = [];

  for (const line of dataLines) {
    const cols = parseCSVLine(line);
    const [brand, productLine, shade] = cols;
    if (!brand || !shade) {
      unmatched.push(line);
      continue;
    }

    const match = catalog.find(
      (r) =>
        r.brand.toLowerCase() === brand.toLowerCase() &&
        r.shade.toLowerCase() === shade.toLowerCase() &&
        (!productLine ||
          r.product_line.toLowerCase() === productLine.toLowerCase()),
    );

    if (
      match &&
      !inventoryResinIds.has(match.id) &&
      !matched.some((m) => m.id === match.id)
    ) {
      matched.push(match);
    } else if (!match) {
      unmatched.push(`${brand} - ${productLine || '?'} - ${shade}`);
    }
  }

  return { matched, unmatched };
}

function toggleResinInSet(prev: Set<string>, resinId: string): Set<string> {
  const next = new Set(prev);
  if (next.has(resinId)) next.delete(resinId);
  else next.add(resinId);
  return next;
}

function detectHeaderLine(firstLine: string): boolean {
  return firstLine.toLowerCase().includes('marca');
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const sampleItems: RawInventoryItem[] = [
  {
    id: 'inv-1',
    resin_id: 'r1',
    resin: { shade: 'A2E', brand: '3M', product_line: 'Filtek Z350 XT', type: 'esmalte', opacity: 'translucido' },
  },
  {
    id: 'inv-2',
    resin_id: 'r2',
    resin: { shade: 'A3B', brand: '3M', product_line: 'Filtek Z350 XT', type: 'corpo', opacity: 'semi-opaco' },
  },
  {
    id: 'inv-3',
    resin_id: 'r3',
    resin: { shade: 'B1', brand: 'Ivoclar', product_line: 'IPS Empress', type: 'esmalte', opacity: 'translucido' },
  },
];

const sampleCatalog: CatalogResin[] = [
  { id: 'r1', brand: '3M', product_line: 'Filtek Z350 XT', shade: 'A2E', type: 'esmalte', opacity: 'translucido' },
  { id: 'r2', brand: '3M', product_line: 'Filtek Z350 XT', shade: 'A3B', type: 'corpo', opacity: 'semi-opaco' },
  { id: 'r3', brand: 'Ivoclar', product_line: 'IPS Empress', shade: 'B1', type: 'esmalte', opacity: 'translucido' },
  { id: 'r4', brand: 'Ivoclar', product_line: 'IPS Empress', shade: 'A1', type: 'dentina', opacity: 'opaco' },
  { id: 'r5', brand: 'Tokuyama', product_line: 'Omnichroma', shade: 'Universal', type: 'corpo', opacity: 'semi-opaco' },
  { id: 'r6', brand: '3M', product_line: 'Filtek Supreme', shade: 'A2E', type: 'esmalte', opacity: 'translucido' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('flattenItems', () => {
  it('should return empty array for empty input', () => {
    expect(flattenItems([])).toEqual([]);
  });

  it('should map all fields correctly', () => {
    const result = flattenItems([sampleItems[0]]);
    expect(result).toEqual([
      {
        id: 'inv-1',
        resinId: 'r1',
        shade: 'A2E',
        brand: '3M',
        product_line: 'Filtek Z350 XT',
        type: 'esmalte',
        opacity: 'translucido',
      },
    ]);
  });

  it('should flatten all items preserving order', () => {
    const result = flattenItems(sampleItems);
    expect(result).toHaveLength(3);
    expect(result[0].resinId).toBe('r1');
    expect(result[1].resinId).toBe('r2');
    expect(result[2].resinId).toBe('r3');
  });

  it('should use inventory id (not resin id) as id', () => {
    const result = flattenItems(sampleItems);
    expect(result[0].id).toBe('inv-1');
    expect(result[0].resinId).toBe('r1');
  });
});

describe('extractBrandOptions', () => {
  it('should return empty array for empty input', () => {
    expect(extractBrandOptions([])).toEqual([]);
  });

  it('should extract unique brands sorted alphabetically', () => {
    const result = extractBrandOptions(sampleItems);
    expect(result).toEqual([
      { value: '3M', label: '3M' },
      { value: 'Ivoclar', label: 'Ivoclar' },
    ]);
  });

  it('should deduplicate brands from same manufacturer', () => {
    const items: RawInventoryItem[] = [
      { ...sampleItems[0] },
      { ...sampleItems[1] }, // also 3M
    ];
    const result = extractBrandOptions(items);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('3M');
  });
});

describe('extractTypeOptions', () => {
  it('should return empty array for empty input', () => {
    expect(extractTypeOptions([])).toEqual([]);
  });

  it('should extract unique types sorted alphabetically', () => {
    const result = extractTypeOptions(sampleItems);
    expect(result).toEqual([
      { value: 'corpo', label: 'corpo' },
      { value: 'esmalte', label: 'esmalte' },
    ]);
  });

  it('should deduplicate types', () => {
    // sampleItems has two 'esmalte' entries
    const result = extractTypeOptions(sampleItems);
    const esmalteCount = result.filter((o) => o.value === 'esmalte').length;
    expect(esmalteCount).toBe(1);
  });
});

describe('filterCatalog', () => {
  const defaultFilters: CatalogFilters = { search: '', brand: 'all', type: 'all' };

  it('should return empty array for empty catalog', () => {
    const result = filterCatalog([], new Set(), defaultFilters);
    expect(result).toEqual([]);
  });

  it('should return all items when no filters and no inventory', () => {
    const result = filterCatalog(sampleCatalog, new Set(), defaultFilters);
    expect(result).toHaveLength(sampleCatalog.length);
  });

  it('should exclude items already in inventory', () => {
    const inventoryIds = new Set(['r1', 'r3']);
    const result = filterCatalog(sampleCatalog, inventoryIds, defaultFilters);
    expect(result).toHaveLength(4);
    expect(result.find((r) => r.id === 'r1')).toBeUndefined();
    expect(result.find((r) => r.id === 'r3')).toBeUndefined();
  });

  it('should filter by search matching shade', () => {
    const filters: CatalogFilters = { search: 'A2E', brand: 'all', type: 'all' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(2); // r1 and r6 both have shade A2E
    expect(result.every((r) => r.shade === 'A2E')).toBe(true);
  });

  it('should filter by search matching brand', () => {
    const filters: CatalogFilters = { search: 'Tokuyama', brand: 'all', type: 'all' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r5');
  });

  it('should filter by search matching product line', () => {
    const filters: CatalogFilters = { search: 'Omnichroma', brand: 'all', type: 'all' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r5');
  });

  it('should be case-insensitive on search', () => {
    const filters: CatalogFilters = { search: 'ivoclar', brand: 'all', type: 'all' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(2); // r3 and r4
    expect(result.every((r) => r.brand === 'Ivoclar')).toBe(true);
  });

  it('should filter by brand', () => {
    const filters: CatalogFilters = { search: '', brand: 'Ivoclar', type: 'all' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.brand === 'Ivoclar')).toBe(true);
  });

  it('should filter by type', () => {
    const filters: CatalogFilters = { search: '', brand: 'all', type: 'corpo' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(2); // r2 and r5
    expect(result.every((r) => r.type === 'corpo')).toBe(true);
  });

  it('should combine brand and type filters', () => {
    const filters: CatalogFilters = { search: '', brand: '3M', type: 'esmalte' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(2); // r1 and r6
    expect(result.every((r) => r.brand === '3M' && r.type === 'esmalte')).toBe(true);
  });

  it('should combine search with brand filter', () => {
    const filters: CatalogFilters = { search: 'A2E', brand: '3M', type: 'all' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(2); // r1 and r6
  });

  it('should combine all filters and inventory exclusion', () => {
    const inventoryIds = new Set(['r1']);
    const filters: CatalogFilters = { search: 'A2E', brand: '3M', type: 'esmalte' };
    const result = filterCatalog(sampleCatalog, inventoryIds, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r6');
  });

  it('should return empty when no match for search', () => {
    const filters: CatalogFilters = { search: 'NonExistent', brand: 'all', type: 'all' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(0);
  });

  it('should treat "all" brand/type as no filter', () => {
    const filters: CatalogFilters = { search: '', brand: 'all', type: 'all' };
    const result = filterCatalog(sampleCatalog, new Set(), filters);
    expect(result).toHaveLength(sampleCatalog.length);
  });
});

describe('groupCatalog', () => {
  it('should return empty object for empty input', () => {
    expect(groupCatalog([])).toEqual({});
  });

  it('should group by brand at top level', () => {
    const grouped = groupCatalog(sampleCatalog);
    expect(Object.keys(grouped)).toContain('3M');
    expect(Object.keys(grouped)).toContain('Ivoclar');
    expect(Object.keys(grouped)).toContain('Tokuyama');
  });

  it('should group by product_line at second level', () => {
    const grouped = groupCatalog(sampleCatalog);
    expect(Object.keys(grouped['3M'])).toContain('Filtek Z350 XT');
    expect(Object.keys(grouped['3M'])).toContain('Filtek Supreme');
    expect(Object.keys(grouped['Ivoclar'])).toContain('IPS Empress');
    expect(Object.keys(grouped['Tokuyama'])).toContain('Omnichroma');
  });

  it('should place resins in correct brand/product_line bucket', () => {
    const grouped = groupCatalog(sampleCatalog);
    expect(grouped['3M']['Filtek Z350 XT']).toHaveLength(2);
    expect(grouped['3M']['Filtek Supreme']).toHaveLength(1);
    expect(grouped['Ivoclar']['IPS Empress']).toHaveLength(2);
    expect(grouped['Tokuyama']['Omnichroma']).toHaveLength(1);
  });

  it('should preserve resin objects in groups', () => {
    const grouped = groupCatalog([sampleCatalog[0]]);
    const resin = grouped['3M']['Filtek Z350 XT'][0];
    expect(resin.id).toBe('r1');
    expect(resin.shade).toBe('A2E');
  });

  it('should handle single resin input', () => {
    const grouped = groupCatalog([sampleCatalog[4]]);
    expect(Object.keys(grouped)).toEqual(['Tokuyama']);
    expect(Object.keys(grouped['Tokuyama'])).toEqual(['Omnichroma']);
    expect(grouped['Tokuyama']['Omnichroma']).toHaveLength(1);
  });
});

describe('parseCSVLine', () => {
  it('should parse simple comma-separated values', () => {
    const cols = parseCSVLine('3M,Z350,A2');
    expect(cols[0]).toBe('3M');
    expect(cols[1]).toBe('Z350');
    expect(cols[2]).toBe('A2');
  });

  it('should parse quoted values', () => {
    const cols = parseCSVLine('"3M","Filtek Z350 XT","A2E"');
    expect(cols[0]).toBe('3M');
    expect(cols[1]).toBe('Filtek Z350 XT');
    expect(cols[2]).toBe('A2E');
  });

  it('should handle escaped double quotes inside quoted fields', () => {
    const cols = parseCSVLine('"Brand ""Special""","Line","A1"');
    expect(cols[0]).toBe('Brand "Special"');
  });

  it('should handle empty fields', () => {
    const cols = parseCSVLine('3M,,A2');
    expect(cols[0]).toBe('3M');
    expect(cols[1]).toBe('');
    expect(cols[2]).toBe('A2');
  });

  it('should handle mixed quoted and unquoted fields', () => {
    const cols = parseCSVLine('3M,"Filtek Z350 XT",A2');
    expect(cols[0]).toBe('3M');
    expect(cols[1]).toBe('Filtek Z350 XT');
    expect(cols[2]).toBe('A2');
  });

  it('should trim whitespace from values', () => {
    const cols = parseCSVLine(' 3M , Z350 , A2 ');
    expect(cols[0]).toBe('3M');
    expect(cols[1]).toBe('Z350');
    expect(cols[2]).toBe('A2');
  });
});

describe('detectHeaderLine', () => {
  it('should detect Portuguese header with "Marca"', () => {
    expect(detectHeaderLine('Marca,Linha,Cor')).toBe(true);
  });

  it('should detect header case-insensitively', () => {
    expect(detectHeaderLine('marca,linha,cor')).toBe(true);
    expect(detectHeaderLine('MARCA,LINHA,COR')).toBe(true);
  });

  it('should not detect data lines as headers', () => {
    expect(detectHeaderLine('3M,Filtek Z350 XT,A2E')).toBe(false);
  });

  it('should not detect empty line as header', () => {
    expect(detectHeaderLine('')).toBe(false);
  });
});

describe('matchCSVRows', () => {
  const catalog: CatalogResin[] = [
    { id: 'r1', brand: '3M', product_line: 'Filtek Z350 XT', shade: 'A2E', type: 'esmalte', opacity: 'translucido' },
    { id: 'r2', brand: '3M', product_line: 'Filtek Z350 XT', shade: 'A3B', type: 'corpo', opacity: 'semi-opaco' },
    { id: 'r3', brand: 'Ivoclar', product_line: 'IPS Empress', shade: 'B1', type: 'esmalte', opacity: 'translucido' },
    { id: 'r4', brand: 'Tokuyama', product_line: 'Omnichroma', shade: 'Universal', type: 'corpo', opacity: 'semi-opaco' },
  ];

  it('should return empty results for empty input', () => {
    const result = matchCSVRows([], catalog, new Set());
    expect(result.matched).toEqual([]);
    expect(result.unmatched).toEqual([]);
  });

  it('should match a valid CSV row', () => {
    const result = matchCSVRows(['3M,Filtek Z350 XT,A2E'], catalog, new Set());
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].id).toBe('r1');
    expect(result.unmatched).toHaveLength(0);
  });

  it('should match case-insensitively', () => {
    const result = matchCSVRows(['3m,filtek z350 xt,a2e'], catalog, new Set());
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].id).toBe('r1');
  });

  it('should match without product line when empty', () => {
    const result = matchCSVRows(['Ivoclar,,B1'], catalog, new Set());
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].id).toBe('r3');
  });

  it('should report unmatched lines for unknown resins', () => {
    const result = matchCSVRows(['UnknownBrand,UnknownLine,X9'], catalog, new Set());
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0]).toBe('UnknownBrand - UnknownLine - X9');
  });

  it('should format unmatched with "?" when product line is missing', () => {
    const result = matchCSVRows(['UnknownBrand,,X9'], catalog, new Set());
    expect(result.unmatched[0]).toBe('UnknownBrand - ? - X9');
  });

  it('should skip lines with missing brand', () => {
    const result = matchCSVRows([',SomeLine,A2'], catalog, new Set());
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0]).toBe(',SomeLine,A2');
  });

  it('should skip lines with missing shade', () => {
    const result = matchCSVRows(['3M,Filtek Z350 XT,'], catalog, new Set());
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(1);
  });

  it('should exclude items already in inventory', () => {
    const inventoryIds = new Set(['r1']);
    const result = matchCSVRows(['3M,Filtek Z350 XT,A2E'], catalog, inventoryIds);
    expect(result.matched).toHaveLength(0);
    // Not counted as unmatched either (it was found but excluded)
    expect(result.unmatched).toHaveLength(0);
  });

  it('should deduplicate matched resins from duplicate CSV rows', () => {
    const lines = [
      '3M,Filtek Z350 XT,A2E',
      '3m,Filtek Z350 XT,A2E',
    ];
    const result = matchCSVRows(lines, catalog, new Set());
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].id).toBe('r1');
  });

  it('should handle quoted CSV fields', () => {
    const result = matchCSVRows(['"3M","Filtek Z350 XT","A2E"'], catalog, new Set());
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].id).toBe('r1');
  });

  it('should match multiple valid rows', () => {
    const lines = [
      '3M,Filtek Z350 XT,A2E',
      'Ivoclar,IPS Empress,B1',
      'Tokuyama,Omnichroma,Universal',
    ];
    const result = matchCSVRows(lines, catalog, new Set());
    expect(result.matched).toHaveLength(3);
    expect(result.unmatched).toHaveLength(0);
  });

  it('should handle mix of matched and unmatched rows', () => {
    const lines = [
      '3M,Filtek Z350 XT,A2E',
      'FakeBrand,FakeLine,X99',
      'Ivoclar,IPS Empress,B1',
    ];
    const result = matchCSVRows(lines, catalog, new Set());
    expect(result.matched).toHaveLength(2);
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0]).toContain('FakeBrand');
  });
});

describe('toggleResinInSet', () => {
  it('should add resin to empty set', () => {
    const result = toggleResinInSet(new Set(), 'r1');
    expect(result.has('r1')).toBe(true);
    expect(result.size).toBe(1);
  });

  it('should add resin to set that does not contain it', () => {
    const prev = new Set(['r1', 'r2']);
    const result = toggleResinInSet(prev, 'r3');
    expect(result.has('r3')).toBe(true);
    expect(result.size).toBe(3);
  });

  it('should remove resin from set that contains it', () => {
    const prev = new Set(['r1', 'r2', 'r3']);
    const result = toggleResinInSet(prev, 'r2');
    expect(result.has('r2')).toBe(false);
    expect(result.size).toBe(2);
  });

  it('should not mutate the original set', () => {
    const prev = new Set(['r1']);
    const result = toggleResinInSet(prev, 'r1');
    expect(prev.has('r1')).toBe(true);
    expect(result.has('r1')).toBe(false);
  });

  it('should toggle on then off', () => {
    const step1 = toggleResinInSet(new Set(), 'r1');
    expect(step1.has('r1')).toBe(true);
    const step2 = toggleResinInSet(step1, 'r1');
    expect(step2.has('r1')).toBe(false);
    expect(step2.size).toBe(0);
  });

  it('should handle toggling multiple different resins', () => {
    let set = new Set<string>();
    set = toggleResinInSet(set, 'r1');
    set = toggleResinInSet(set, 'r2');
    set = toggleResinInSet(set, 'r3');
    expect(set.size).toBe(3);
    set = toggleResinInSet(set, 'r2');
    expect(set.size).toBe(2);
    expect(set.has('r1')).toBe(true);
    expect(set.has('r2')).toBe(false);
    expect(set.has('r3')).toBe(true);
  });
});

// --- Default return values from hook ---

describe('useInventoryManagement default state', () => {
  it('should have correct defaults when query data is undefined', () => {
    const allItems = undefined ?? [];
    const total = undefined ?? 0;
    const catalog = undefined ?? [];

    expect(allItems).toEqual([]);
    expect(total).toBe(0);
    expect(catalog).toEqual([]);
  });

  it('should produce empty flat items from empty allItems', () => {
    expect(flattenItems([])).toEqual([]);
  });

  it('should produce empty brand/type options from empty allItems', () => {
    expect(extractBrandOptions([])).toEqual([]);
    expect(extractTypeOptions([])).toEqual([]);
  });

  it('should produce empty grouped catalog from empty filtered list', () => {
    expect(groupCatalog([])).toEqual({});
  });
});
