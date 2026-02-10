import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Extract and test the pure functions from useDashboard
// The hook itself requires React Query, AuthContext, useSubscription, etc.
// so we test the extractable computation logic independently.
// ---------------------------------------------------------------------------

// --- extractFirstName ---

function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return 'Usuário';
  const match = fullName.match(/^(Dra?\.\s*)(.+)/i);
  if (match) {
    const restFirst = match[2].split(' ')[0];
    return `${match[1]}${restFirst}`;
  }
  return fullName.split(' ')[0];
}

describe('extractFirstName', () => {
  it('should return "Usuário" for null', () => {
    expect(extractFirstName(null)).toBe('Usuário');
  });

  it('should return "Usuário" for undefined', () => {
    expect(extractFirstName(undefined)).toBe('Usuário');
  });

  it('should return "Usuário" for empty string', () => {
    expect(extractFirstName('')).toBe('Usuário');
  });

  it('should return first name from full name', () => {
    expect(extractFirstName('João Silva')).toBe('João');
  });

  it('should return single name as-is', () => {
    expect(extractFirstName('Maria')).toBe('Maria');
  });

  it('should handle "Dr." prefix and keep it with first name', () => {
    expect(extractFirstName('Dr. João Silva')).toBe('Dr. João');
  });

  it('should handle "Dra." prefix and keep it with first name', () => {
    expect(extractFirstName('Dra. Maria Santos')).toBe('Dra. Maria');
  });

  it('should handle "Dr." prefix case-insensitive', () => {
    expect(extractFirstName('dr. pedro almeida')).toBe('dr. pedro');
  });

  it('should handle "Dra." with extra spacing', () => {
    expect(extractFirstName('Dra.  Ana Costa')).toBe('Dra.  Ana');
  });

  it('should handle name with many parts', () => {
    expect(extractFirstName('Carlos Eduardo Pereira da Silva')).toBe('Carlos');
  });
});

// --- getTimeGreeting ---

function getTimeGreeting(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

describe('getTimeGreeting', () => {
  it('should return "Bom dia" for morning hours (0-11)', () => {
    expect(getTimeGreeting(0)).toBe('Bom dia');
    expect(getTimeGreeting(6)).toBe('Bom dia');
    expect(getTimeGreeting(11)).toBe('Bom dia');
  });

  it('should return "Boa tarde" for afternoon hours (12-17)', () => {
    expect(getTimeGreeting(12)).toBe('Boa tarde');
    expect(getTimeGreeting(15)).toBe('Boa tarde');
    expect(getTimeGreeting(17)).toBe('Boa tarde');
  });

  it('should return "Boa noite" for evening hours (18-23)', () => {
    expect(getTimeGreeting(18)).toBe('Boa noite');
    expect(getTimeGreeting(21)).toBe('Boa noite');
    expect(getTimeGreeting(23)).toBe('Boa noite');
  });
});

// --- Treatment normalization ---

const TREATMENT_NORMALIZE: Record<string, string> = {
  porcelain: 'porcelana',
  resin: 'resina',
  crown: 'coroa',
  implant: 'implante',
  endodontics: 'endodontia',
  referral: 'encaminhamento',
};

const TREATMENT_COLORS: Record<string, string> = {
  resina: '#3b82f6',
  porcelana: '#a855f7',
  coroa: '#f59e0b',
  implante: '#ef4444',
  endodontia: '#10b981',
  encaminhamento: '#6b7280',
};

const TREATMENT_LABELS: Record<string, string> = {
  resina: 'Resina',
  porcelana: 'Porcelana',
  coroa: 'Coroa',
  implante: 'Implante',
  endodontia: 'Endodontia',
  encaminhamento: 'Encaminhamento',
};

describe('treatment normalization', () => {
  it('should normalize English treatment types to Portuguese', () => {
    expect(TREATMENT_NORMALIZE['porcelain']).toBe('porcelana');
    expect(TREATMENT_NORMALIZE['resin']).toBe('resina');
    expect(TREATMENT_NORMALIZE['crown']).toBe('coroa');
    expect(TREATMENT_NORMALIZE['implant']).toBe('implante');
    expect(TREATMENT_NORMALIZE['endodontics']).toBe('endodontia');
    expect(TREATMENT_NORMALIZE['referral']).toBe('encaminhamento');
  });

  it('should have matching colors for all normalized types', () => {
    const normalizedTypes = Object.values(TREATMENT_NORMALIZE);
    for (const type of normalizedTypes) {
      expect(TREATMENT_COLORS[type]).toBeDefined();
    }
  });

  it('should have matching labels for all normalized types', () => {
    const normalizedTypes = Object.values(TREATMENT_NORMALIZE);
    for (const type of normalizedTypes) {
      expect(TREATMENT_LABELS[type]).toBeDefined();
    }
  });
});

// --- computeInsights ---

interface RawInsightRow {
  id: string;
  created_at: string;
  treatment_type: string | null;
  is_from_inventory: boolean | null;
  resins: { name: string } | null;
}

interface ClinicalInsights {
  treatmentDistribution: Array<{ label: string; value: number; color: string }>;
  topResin: string | null;
  topResins: Array<{ name: string; count: number }>;
  inventoryRate: number;
  totalEvaluated: number;
}

interface WeeklyTrendPoint {
  label: string;
  value: number;
}

// Mirrors the hook's computeInsights function
function computeInsights(
  rows: RawInsightRow[],
  weeksBack: number,
): { clinicalInsights: ClinicalInsights; weeklyTrends: WeeklyTrendPoint[] } {
  const { startOfWeek, subDays, format } = require('date-fns');
  const { ptBR } = require('date-fns/locale');

  const typeCounts = new Map<string, number>();
  let inventoryCount = 0;

  for (const row of rows) {
    const raw = row.treatment_type;
    const t = raw ? (TREATMENT_NORMALIZE[raw.toLowerCase()] || raw.toLowerCase()) : null;
    if (t) typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
    if (row.is_from_inventory) inventoryCount++;
  }

  const treatmentDistribution = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      label: TREATMENT_LABELS[type] || type,
      value: count,
      color: TREATMENT_COLORS[type] || '#6b7280',
    }));

  const resinCounts = new Map<string, number>();
  for (const row of rows) {
    const name = row.resins?.name;
    if (name) resinCounts.set(name, (resinCounts.get(name) || 0) + 1);
  }
  const topResins = Array.from(resinCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topResin = topResins.length > 0 ? topResins[0].name : null;
  const inventoryRate = rows.length > 0 ? Math.round((inventoryCount / rows.length) * 100) : 0;

  const now = new Date();
  const weekMap = new Map<string, number>();
  const weekLabels: string[] = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const ws = startOfWeek(subDays(now, i * 7), { weekStartsOn: 1 });
    const key = ws.toISOString();
    weekMap.set(key, 0);
    weekLabels.push(key);
  }

  for (const row of rows) {
    const ws = startOfWeek(new Date(row.created_at), { weekStartsOn: 1 });
    const key = ws.toISOString();
    if (weekMap.has(key)) {
      weekMap.set(key, weekMap.get(key)! + 1);
    }
  }

  const weeklyTrends: WeeklyTrendPoint[] = weekLabels.map(key => ({
    label: format(new Date(key), 'd MMM', { locale: ptBR }),
    value: weekMap.get(key) || 0,
  }));

  return {
    clinicalInsights: {
      treatmentDistribution,
      topResin,
      topResins,
      inventoryRate,
      totalEvaluated: rows.length,
    },
    weeklyTrends,
  };
}

describe('computeInsights', () => {
  it('should return empty insights for empty rows', () => {
    const { clinicalInsights, weeklyTrends } = computeInsights([], 4);
    expect(clinicalInsights.treatmentDistribution).toHaveLength(0);
    expect(clinicalInsights.topResin).toBeNull();
    expect(clinicalInsights.topResins).toHaveLength(0);
    expect(clinicalInsights.inventoryRate).toBe(0);
    expect(clinicalInsights.totalEvaluated).toBe(0);
    expect(weeklyTrends).toHaveLength(4);
    // All weekly trends should have value 0 when no data
    weeklyTrends.forEach(t => expect(t.value).toBe(0));
  });

  it('should count treatment distribution correctly', () => {
    const rows: RawInsightRow[] = [
      { id: '1', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: false, resins: null },
      { id: '2', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: false, resins: null },
      { id: '3', created_at: new Date().toISOString(), treatment_type: 'porcelana', is_from_inventory: false, resins: null },
    ];
    const { clinicalInsights } = computeInsights(rows, 4);
    expect(clinicalInsights.treatmentDistribution).toHaveLength(2);
    // Sorted by count desc
    expect(clinicalInsights.treatmentDistribution[0].label).toBe('Resina');
    expect(clinicalInsights.treatmentDistribution[0].value).toBe(2);
    expect(clinicalInsights.treatmentDistribution[1].label).toBe('Porcelana');
    expect(clinicalInsights.treatmentDistribution[1].value).toBe(1);
  });

  it('should normalize English treatment types to Portuguese', () => {
    const rows: RawInsightRow[] = [
      { id: '1', created_at: new Date().toISOString(), treatment_type: 'Resin', is_from_inventory: false, resins: null },
      { id: '2', created_at: new Date().toISOString(), treatment_type: 'Crown', is_from_inventory: false, resins: null },
      { id: '3', created_at: new Date().toISOString(), treatment_type: 'PORCELAIN', is_from_inventory: false, resins: null },
    ];
    const { clinicalInsights } = computeInsights(rows, 4);
    const labels = clinicalInsights.treatmentDistribution.map(d => d.label);
    expect(labels).toContain('Resina');
    expect(labels).toContain('Coroa');
    expect(labels).toContain('Porcelana');
    expect(labels).not.toContain('resin');
    expect(labels).not.toContain('crown');
  });

  it('should skip null treatment types', () => {
    const rows: RawInsightRow[] = [
      { id: '1', created_at: new Date().toISOString(), treatment_type: null, is_from_inventory: false, resins: null },
      { id: '2', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: false, resins: null },
    ];
    const { clinicalInsights } = computeInsights(rows, 4);
    expect(clinicalInsights.treatmentDistribution).toHaveLength(1);
    expect(clinicalInsights.totalEvaluated).toBe(2);
  });

  it('should compute top resin correctly', () => {
    const rows: RawInsightRow[] = [
      { id: '1', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: false, resins: { name: 'Filtek Z350' } },
      { id: '2', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: false, resins: { name: 'Filtek Z350' } },
      { id: '3', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: false, resins: { name: 'Charisma' } },
    ];
    const { clinicalInsights } = computeInsights(rows, 4);
    expect(clinicalInsights.topResin).toBe('Filtek Z350');
    expect(clinicalInsights.topResins).toHaveLength(2);
    expect(clinicalInsights.topResins[0]).toEqual({ name: 'Filtek Z350', count: 2 });
    expect(clinicalInsights.topResins[1]).toEqual({ name: 'Charisma', count: 1 });
  });

  it('should return null topResin when no resins', () => {
    const rows: RawInsightRow[] = [
      { id: '1', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: false, resins: null },
    ];
    const { clinicalInsights } = computeInsights(rows, 4);
    expect(clinicalInsights.topResin).toBeNull();
    expect(clinicalInsights.topResins).toHaveLength(0);
  });

  it('should limit topResins to 5', () => {
    const rows: RawInsightRow[] = Array.from({ length: 7 }, (_, i) => ({
      id: String(i),
      created_at: new Date().toISOString(),
      treatment_type: 'resina',
      is_from_inventory: false,
      resins: { name: `Resin ${i}` },
    }));
    const { clinicalInsights } = computeInsights(rows, 4);
    expect(clinicalInsights.topResins).toHaveLength(5);
  });

  it('should compute inventory rate correctly', () => {
    const rows: RawInsightRow[] = [
      { id: '1', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: true, resins: null },
      { id: '2', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: true, resins: null },
      { id: '3', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: false, resins: null },
      { id: '4', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: null, resins: null },
    ];
    const { clinicalInsights } = computeInsights(rows, 4);
    // 2 from inventory out of 4 total = 50%
    expect(clinicalInsights.inventoryRate).toBe(50);
  });

  it('should generate correct number of weekly trend points', () => {
    const { weeklyTrends } = computeInsights([], 8);
    expect(weeklyTrends).toHaveLength(8);
  });

  it('should assign colors from TREATMENT_COLORS map', () => {
    const rows: RawInsightRow[] = [
      { id: '1', created_at: new Date().toISOString(), treatment_type: 'resina', is_from_inventory: false, resins: null },
    ];
    const { clinicalInsights } = computeInsights(rows, 4);
    expect(clinicalInsights.treatmentDistribution[0].color).toBe('#3b82f6');
  });

  it('should use fallback color for unknown treatment types', () => {
    const rows: RawInsightRow[] = [
      { id: '1', created_at: new Date().toISOString(), treatment_type: 'unknown_type', is_from_inventory: false, resins: null },
    ];
    const { clinicalInsights } = computeInsights(rows, 4);
    expect(clinicalInsights.treatmentDistribution[0].color).toBe('#6b7280');
    expect(clinicalInsights.treatmentDistribution[0].label).toBe('unknown_type');
  });
});

// --- isNewUser derived logic ---

describe('isNewUser logic', () => {
  function computeIsNewUser(loading: boolean, sessionsLength: number, pendingSessions: number): boolean {
    return !loading && sessionsLength === 0 && pendingSessions === 0;
  }

  it('should be true when not loading and no sessions', () => {
    expect(computeIsNewUser(false, 0, 0)).toBe(true);
  });

  it('should be false when still loading', () => {
    expect(computeIsNewUser(true, 0, 0)).toBe(false);
  });

  it('should be false when there are sessions', () => {
    expect(computeIsNewUser(false, 3, 0)).toBe(false);
  });

  it('should be false when there are pending sessions', () => {
    expect(computeIsNewUser(false, 0, 2)).toBe(false);
  });
});

// --- showCreditsBanner derived logic ---

describe('showCreditsBanner logic', () => {
  function computeShowCreditsBanner(
    dismissed: boolean,
    loadingCredits: boolean,
    isActive: boolean,
    isFree: boolean,
    creditsRemaining: number,
  ): boolean {
    return !dismissed && !loadingCredits && isActive && !isFree && creditsRemaining <= 5;
  }

  it('should show banner when active, not free, low credits, not dismissed', () => {
    expect(computeShowCreditsBanner(false, false, true, false, 3)).toBe(true);
  });

  it('should not show banner when dismissed', () => {
    expect(computeShowCreditsBanner(true, false, true, false, 3)).toBe(false);
  });

  it('should not show banner when still loading credits', () => {
    expect(computeShowCreditsBanner(false, true, true, false, 3)).toBe(false);
  });

  it('should not show banner when not active', () => {
    expect(computeShowCreditsBanner(false, false, false, false, 3)).toBe(false);
  });

  it('should not show banner for free tier', () => {
    expect(computeShowCreditsBanner(false, false, true, true, 3)).toBe(false);
  });

  it('should not show banner when credits > 5', () => {
    expect(computeShowCreditsBanner(false, false, true, false, 10)).toBe(false);
  });

  it('should show banner when credits exactly 5', () => {
    expect(computeShowCreditsBanner(false, false, true, false, 5)).toBe(true);
  });

  it('should show banner when credits are 0', () => {
    expect(computeShowCreditsBanner(false, false, true, false, 0)).toBe(true);
  });
});

// --- Dashboard session grouping (from queryFn) ---

interface DashboardSession {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
  treatmentTypes: string[];
  patientAge: number | null;
}

interface RecentEvaluation {
  id: string;
  created_at: string;
  tooth: string;
  patient_name: string | null;
  session_id: string | null;
  status: string | null;
  treatment_type: string | null;
  is_from_inventory: boolean | null;
  patient_age: number | null;
}

function groupRecentToSessions(recentData: RecentEvaluation[]): DashboardSession[] {
  const sessionMap = new Map<string, RecentEvaluation[]>();
  recentData.forEach(evaluation => {
    const sessionKey = evaluation.session_id || evaluation.id;
    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, []);
    }
    sessionMap.get(sessionKey)!.push(evaluation);
  });

  return Array.from(sessionMap.entries())
    .slice(0, 5)
    .map(([sessionId, evals]) => ({
      session_id: sessionId,
      patient_name: evals[0].patient_name,
      created_at: evals[0].created_at,
      teeth: evals.map(e => e.tooth),
      evaluationCount: evals.length,
      completedCount: evals.filter(e => e.status === 'completed').length,
      treatmentTypes: [...new Set(evals.map(e => e.treatment_type).filter(Boolean))] as string[],
      patientAge: evals[0].patient_age ?? null,
    }));
}

describe('groupRecentToSessions (dashboard)', () => {
  const baseEval: RecentEvaluation = {
    id: 'eval-1',
    created_at: '2025-01-15T10:00:00Z',
    tooth: '11',
    patient_name: 'João',
    session_id: 'session-1',
    status: 'pending',
    treatment_type: 'resina',
    is_from_inventory: false,
    patient_age: 35,
  };

  it('should group evaluations by session_id', () => {
    const data: RecentEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', session_id: 'session-1' },
      { ...baseEval, id: 'e2', tooth: '12', session_id: 'session-1' },
      { ...baseEval, id: 'e3', tooth: '21', session_id: 'session-2', patient_name: 'Maria' },
    ];
    const result = groupRecentToSessions(data);
    expect(result).toHaveLength(2);
    expect(result[0].session_id).toBe('session-1');
    expect(result[0].teeth).toEqual(['11', '12']);
    expect(result[1].session_id).toBe('session-2');
  });

  it('should limit to 5 sessions', () => {
    const data: RecentEvaluation[] = Array.from({ length: 10 }, (_, i) => ({
      ...baseEval,
      id: `e-${i}`,
      session_id: `session-${i}`,
    }));
    const result = groupRecentToSessions(data);
    expect(result).toHaveLength(5);
  });

  it('should fall back to eval id when session_id is null', () => {
    const data: RecentEvaluation[] = [
      { ...baseEval, id: 'e1', session_id: null },
    ];
    const result = groupRecentToSessions(data);
    expect(result[0].session_id).toBe('e1');
  });

  it('should include patientAge from first evaluation', () => {
    const data: RecentEvaluation[] = [
      { ...baseEval, id: 'e1', patient_age: 42 },
    ];
    const result = groupRecentToSessions(data);
    expect(result[0].patientAge).toBe(42);
  });

  it('should handle null patientAge', () => {
    const data: RecentEvaluation[] = [
      { ...baseEval, id: 'e1', patient_age: null },
    ];
    const result = groupRecentToSessions(data);
    expect(result[0].patientAge).toBeNull();
  });

  it('should count completed evaluations', () => {
    const data: RecentEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', status: 'completed' },
      { ...baseEval, id: 'e2', tooth: '12', status: 'pending' },
      { ...baseEval, id: 'e3', tooth: '13', status: 'completed' },
    ];
    const result = groupRecentToSessions(data);
    expect(result[0].completedCount).toBe(2);
    expect(result[0].evaluationCount).toBe(3);
  });

  it('should collect unique treatment types', () => {
    const data: RecentEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', treatment_type: 'resina' },
      { ...baseEval, id: 'e2', tooth: '12', treatment_type: 'porcelana' },
      { ...baseEval, id: 'e3', tooth: '13', treatment_type: 'resina' },
    ];
    const result = groupRecentToSessions(data);
    expect(result[0].treatmentTypes).toEqual(['resina', 'porcelana']);
  });

  it('should filter out null treatment types', () => {
    const data: RecentEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', treatment_type: null },
      { ...baseEval, id: 'e2', tooth: '12', treatment_type: 'coroa' },
    ];
    const result = groupRecentToSessions(data);
    expect(result[0].treatmentTypes).toEqual(['coroa']);
  });

  it('should handle empty array', () => {
    const result = groupRecentToSessions([]);
    expect(result).toHaveLength(0);
  });
});
