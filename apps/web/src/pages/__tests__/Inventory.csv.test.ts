import { describe, it, expect } from 'vitest';

// Unit tests for CSV export/import logic extracted from Inventory.tsx

interface CatalogResin {
  id: string;
  brand: string;
  product_line: string;
  shade: string;
  type: string;
  opacity: string;
}

// Mirror of handleExportCSV logic
function generateCSV(items: Array<{ resin: CatalogResin }>): string {
  const header = 'Marca,Linha,Cor,Tipo,Opacidade';
  const rows = items.map((item) =>
    [item.resin.brand, item.resin.product_line, item.resin.shade, item.resin.type, item.resin.opacity]
      .map((v) => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}

// Mirror of CSV parsing logic from handleCSVFile
function parseCSVLine(line: string): string[] {
  return (
    line
      .match(/("([^"]*("")?)*"|[^,]*)(,|$)/g)
      ?.map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || []
  );
}

function matchCSVToCatalog(
  dataLines: string[],
  catalog: CatalogResin[],
  existingIds: Set<string>
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
        (!productLine || r.product_line.toLowerCase() === productLine.toLowerCase())
    );

    if (match && !existingIds.has(match.id) && !matched.some((m) => m.id === match.id)) {
      matched.push(match);
    } else if (!match) {
      unmatched.push(`${brand} - ${productLine || '?'} - ${shade}`);
    }
  }

  return { matched, unmatched };
}

describe('CSV Export', () => {
  it('generates correct CSV header and rows', () => {
    const items = [
      {
        resin: {
          id: '1',
          brand: '3M',
          product_line: 'Filtek Z350 XT',
          shade: 'A2E',
          type: 'esmalte',
          opacity: 'translúcido',
        },
      },
    ];

    const csv = generateCSV(items);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Marca,Linha,Cor,Tipo,Opacidade');
    expect(lines[1]).toBe('"3M","Filtek Z350 XT","A2E","esmalte","translúcido"');
  });

  it('escapes double quotes in values', () => {
    const items = [
      {
        resin: {
          id: '1',
          brand: 'Brand "Special"',
          product_line: 'Line',
          shade: 'A1',
          type: 'dentina',
          opacity: 'opaco',
        },
      },
    ];

    const csv = generateCSV(items);
    expect(csv).toContain('"Brand ""Special"""');
  });

  it('handles null/undefined values', () => {
    const items = [
      {
        resin: {
          id: '1',
          brand: '3M',
          product_line: 'Z350',
          shade: 'A2',
          type: 'esmalte',
          opacity: null as unknown as string,
        },
      },
    ];

    const csv = generateCSV(items);
    expect(csv).toContain('""'); // null becomes empty string
  });

  it('handles empty inventory', () => {
    const csv = generateCSV([]);
    expect(csv).toBe('Marca,Linha,Cor,Tipo,Opacidade');
  });
});

describe('CSV Parsing', () => {
  it('parses simple CSV line', () => {
    const cols = parseCSVLine('3M,Z350,A2,esmalte,opaco');
    expect(cols[0]).toBe('3M');
    expect(cols[1]).toBe('Z350');
    expect(cols[2]).toBe('A2');
  });

  it('parses quoted CSV values', () => {
    const cols = parseCSVLine('"3M","Filtek Z350 XT","A2E","esmalte","translúcido"');
    expect(cols[0]).toBe('3M');
    expect(cols[1]).toBe('Filtek Z350 XT');
    expect(cols[2]).toBe('A2E');
  });

  it('handles escaped quotes in CSV', () => {
    const cols = parseCSVLine('"Brand ""X""","Line","A1"');
    expect(cols[0]).toBe('Brand "X"');
  });
});

describe('CSV Import Matching', () => {
  const catalog: CatalogResin[] = [
    { id: 'r1', brand: '3M', product_line: 'Filtek Z350 XT', shade: 'A2E', type: 'esmalte', opacity: 'translúcido' },
    { id: 'r2', brand: '3M', product_line: 'Filtek Z350 XT', shade: 'A3B', type: 'corpo', opacity: 'semi-opaco' },
    { id: 'r3', brand: 'Ivoclar', product_line: 'IPS Empress', shade: 'B1', type: 'esmalte', opacity: 'translúcido' },
  ];

  it('matches resins by brand, product line, and shade (case insensitive)', () => {
    const lines = ['3m,Filtek Z350 XT,a2e'];
    const result = matchCSVToCatalog(lines, catalog, new Set());
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].id).toBe('r1');
    expect(result.unmatched).toHaveLength(0);
  });

  it('matches without product line', () => {
    const lines = ['ivoclar,,B1'];
    const result = matchCSVToCatalog(lines, catalog, new Set());
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].id).toBe('r3');
  });

  it('reports unmatched resins', () => {
    const lines = ['Unknown Brand,Unknown Line,X9'];
    const result = matchCSVToCatalog(lines, catalog, new Set());
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0]).toContain('Unknown Brand');
  });

  it('skips lines with missing brand or shade', () => {
    const lines = [',Line,', 'Brand,,'];
    const result = matchCSVToCatalog(lines, catalog, new Set());
    expect(result.unmatched).toHaveLength(2);
  });

  it('excludes already existing inventory items', () => {
    const lines = ['3M,Filtek Z350 XT,A2E'];
    const existing = new Set(['r1']);
    const result = matchCSVToCatalog(lines, catalog, existing);
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(0); // not counted as unmatched either
  });

  it('deduplicates matched resins', () => {
    const lines = ['3M,Filtek Z350 XT,A2E', '3m,Filtek Z350 XT,A2E'];
    const result = matchCSVToCatalog(lines, catalog, new Set());
    expect(result.matched).toHaveLength(1);
  });
});
