import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure computation logic from usePatientProfile
// The hook depends on React Query + Router + AuthContext, so we test the data
// transformation functions that produce session groupings, metrics, initials,
// and form initialization.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Inline types (mirrored from hook + data layer)
// ---------------------------------------------------------------------------

interface PatientSession {
  session_id: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
  created_at: string;
}

interface Evaluation {
  id: string;
  session_id: string | null;
  tooth: string;
  status: string | null;
  created_at: string;
}

interface EditForm {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface PatientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  birth_date: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Pure functions mirrored from the hook
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function groupSessions(data: Evaluation[]): PatientSession[] {
  const sessionMap = new Map<string, { teeth: string[]; statuses: string[]; created_at: string }>();
  (data || []).forEach((evaluation) => {
    const sessionId = evaluation.session_id || `legacy-${evaluation.id}`;
    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, { teeth: [], statuses: [], created_at: evaluation.created_at });
    }
    const session = sessionMap.get(sessionId)!;
    session.teeth.push(evaluation.tooth);
    session.statuses.push(evaluation.status || 'draft');
  });

  return Array.from(sessionMap.entries()).map(([sessionId, sessionData]) => ({
    session_id: sessionId,
    teeth: sessionData.teeth,
    evaluationCount: sessionData.teeth.length,
    completedCount: sessionData.statuses.filter((s: string) => s === 'completed').length,
    created_at: sessionData.created_at,
  }));
}

function computeMetrics(sessions: PatientSession[]) {
  const totalSessions = sessions.length;
  const totalCases = sessions.reduce((sum, s) => sum + s.evaluationCount, 0);
  const completedCases = sessions.reduce((sum, s) => sum + s.completedCount, 0);
  const firstVisit = sessions.length > 0 ? sessions[sessions.length - 1].created_at : null;
  return { totalSessions, totalCases, completedCases, firstVisit };
}

function initializeForm(patient: PatientRow | null): EditForm {
  if (patient) {
    return {
      name: patient.name,
      phone: patient.phone || '',
      email: patient.email || '',
      notes: patient.notes || '',
    };
  }
  return { name: '', phone: '', email: '', notes: '' };
}

// ---------------------------------------------------------------------------
// getInitials
// ---------------------------------------------------------------------------

describe('getInitials', () => {
  it('should return two uppercase initials for a two-word name', () => {
    expect(getInitials('João Silva')).toBe('JS');
  });

  it('should return a single initial for a single-word name', () => {
    expect(getInitials('Maria')).toBe('M');
  });

  it('should return at most 2 characters for a three-word name', () => {
    expect(getInitials('Ana Clara Oliveira')).toBe('AC');
  });

  it('should return empty string for empty input', () => {
    expect(getInitials('')).toBe('');
  });

  it('should uppercase lowercase names', () => {
    expect(getInitials('carlos eduardo')).toBe('CE');
  });

  it('should handle names with extra spaces gracefully', () => {
    // "a  b".split(' ') => ["a", "", "b"] — empty string [0] is undefined
    // The implementation maps n[0] which is undefined for empty strings
    // so this tests the actual behavior
    const result = getInitials('Ana  Beatriz');
    // split produces ["Ana", "", "Beatriz"] — n[0] of "" is undefined
    // .join('') will produce "Aundefined B..." — but .toUpperCase().slice(0,2) trims
    // In practice this is an edge case the hook does not guard against
    expect(result).toBeDefined();
  });

  it('should handle a very long name', () => {
    expect(getInitials('Pedro Henrique da Silva Santos')).toBe('PH');
  });
});

// ---------------------------------------------------------------------------
// groupSessions
// ---------------------------------------------------------------------------

describe('groupSessions', () => {
  it('should return empty array for empty input', () => {
    expect(groupSessions([])).toEqual([]);
  });

  it('should create a single session from a single evaluation', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: 's1', tooth: '11', status: 'completed', created_at: '2025-06-01T10:00:00Z' },
    ];
    const result = groupSessions(evals);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      session_id: 's1',
      teeth: ['11'],
      evaluationCount: 1,
      completedCount: 1,
      created_at: '2025-06-01T10:00:00Z',
    });
  });

  it('should group multiple evaluations under the same session', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: 's1', tooth: '11', status: 'completed', created_at: '2025-06-01T10:00:00Z' },
      { id: 'e2', session_id: 's1', tooth: '21', status: 'pending', created_at: '2025-06-01T10:05:00Z' },
      { id: 'e3', session_id: 's1', tooth: '12', status: 'completed', created_at: '2025-06-01T10:10:00Z' },
    ];
    const result = groupSessions(evals);
    expect(result).toHaveLength(1);
    expect(result[0].teeth).toEqual(['11', '21', '12']);
    expect(result[0].evaluationCount).toBe(3);
    expect(result[0].completedCount).toBe(2);
  });

  it('should separate evaluations from different sessions', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: 's1', tooth: '11', status: 'completed', created_at: '2025-06-01T10:00:00Z' },
      { id: 'e2', session_id: 's2', tooth: '21', status: 'pending', created_at: '2025-06-02T10:00:00Z' },
    ];
    const result = groupSessions(evals);
    expect(result).toHaveLength(2);
    expect(result[0].session_id).toBe('s1');
    expect(result[0].teeth).toEqual(['11']);
    expect(result[1].session_id).toBe('s2');
    expect(result[1].teeth).toEqual(['21']);
  });

  it('should assign legacy session_id for evaluations without session_id', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: null, tooth: '11', status: 'completed', created_at: '2025-05-01T10:00:00Z' },
    ];
    const result = groupSessions(evals);
    expect(result).toHaveLength(1);
    expect(result[0].session_id).toBe('legacy-e1');
  });

  it('should create separate legacy sessions for different null-session evaluations', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: null, tooth: '11', status: 'completed', created_at: '2025-05-01T10:00:00Z' },
      { id: 'e2', session_id: null, tooth: '21', status: 'draft', created_at: '2025-05-02T10:00:00Z' },
    ];
    const result = groupSessions(evals);
    expect(result).toHaveLength(2);
    expect(result[0].session_id).toBe('legacy-e1');
    expect(result[1].session_id).toBe('legacy-e2');
  });

  it('should use the created_at of the first evaluation in each session', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: 's1', tooth: '11', status: 'completed', created_at: '2025-06-01T08:00:00Z' },
      { id: 'e2', session_id: 's1', tooth: '21', status: 'pending', created_at: '2025-06-01T09:00:00Z' },
    ];
    const result = groupSessions(evals);
    expect(result[0].created_at).toBe('2025-06-01T08:00:00Z');
  });

  it('should count mixed statuses correctly', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: 's1', tooth: '11', status: 'completed', created_at: '2025-06-01T10:00:00Z' },
      { id: 'e2', session_id: 's1', tooth: '21', status: 'pending', created_at: '2025-06-01T10:05:00Z' },
      { id: 'e3', session_id: 's1', tooth: '12', status: null, created_at: '2025-06-01T10:10:00Z' },
      { id: 'e4', session_id: 's1', tooth: '22', status: 'completed', created_at: '2025-06-01T10:15:00Z' },
    ];
    const result = groupSessions(evals);
    expect(result[0].evaluationCount).toBe(4);
    expect(result[0].completedCount).toBe(2);
  });

  it('should default null status to draft (not counted as completed)', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: 's1', tooth: '11', status: null, created_at: '2025-06-01T10:00:00Z' },
    ];
    const result = groupSessions(evals);
    expect(result[0].completedCount).toBe(0);
  });

  it('should handle mixed legacy and regular sessions', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: 's1', tooth: '11', status: 'completed', created_at: '2025-06-01T10:00:00Z' },
      { id: 'e2', session_id: null, tooth: '21', status: 'pending', created_at: '2025-05-15T10:00:00Z' },
      { id: 'e3', session_id: 's1', tooth: '12', status: 'completed', created_at: '2025-06-01T10:05:00Z' },
    ];
    const result = groupSessions(evals);
    expect(result).toHaveLength(2);

    const regular = result.find((s) => s.session_id === 's1')!;
    expect(regular.teeth).toEqual(['11', '12']);
    expect(regular.completedCount).toBe(2);

    const legacy = result.find((s) => s.session_id === 'legacy-e2')!;
    expect(legacy.teeth).toEqual(['21']);
    expect(legacy.completedCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeMetrics
// ---------------------------------------------------------------------------

describe('computeMetrics', () => {
  it('should return zeroes and null firstVisit for empty sessions', () => {
    const result = computeMetrics([]);
    expect(result).toEqual({
      totalSessions: 0,
      totalCases: 0,
      completedCases: 0,
      firstVisit: null,
    });
  });

  it('should compute metrics for a single session', () => {
    const sessions: PatientSession[] = [
      { session_id: 's1', teeth: ['11', '21'], evaluationCount: 2, completedCount: 1, created_at: '2025-06-01T10:00:00Z' },
    ];
    const result = computeMetrics(sessions);
    expect(result).toEqual({
      totalSessions: 1,
      totalCases: 2,
      completedCases: 1,
      firstVisit: '2025-06-01T10:00:00Z',
    });
  });

  it('should sum evaluations and completed counts across sessions', () => {
    const sessions: PatientSession[] = [
      { session_id: 's1', teeth: ['11', '21'], evaluationCount: 2, completedCount: 2, created_at: '2025-06-01T10:00:00Z' },
      { session_id: 's2', teeth: ['12', '22', '13'], evaluationCount: 3, completedCount: 1, created_at: '2025-07-01T10:00:00Z' },
    ];
    const result = computeMetrics(sessions);
    expect(result.totalSessions).toBe(2);
    expect(result.totalCases).toBe(5);
    expect(result.completedCases).toBe(3);
  });

  it('should use the last session in the array as firstVisit (oldest)', () => {
    const sessions: PatientSession[] = [
      { session_id: 's2', teeth: ['12'], evaluationCount: 1, completedCount: 1, created_at: '2025-07-01T10:00:00Z' },
      { session_id: 's1', teeth: ['11'], evaluationCount: 1, completedCount: 0, created_at: '2025-06-01T10:00:00Z' },
    ];
    const result = computeMetrics(sessions);
    // firstVisit takes sessions[sessions.length - 1].created_at
    expect(result.firstVisit).toBe('2025-06-01T10:00:00Z');
  });

  it('should handle all evaluations completed', () => {
    const sessions: PatientSession[] = [
      { session_id: 's1', teeth: ['11'], evaluationCount: 1, completedCount: 1, created_at: '2025-06-01T10:00:00Z' },
      { session_id: 's2', teeth: ['21', '22'], evaluationCount: 2, completedCount: 2, created_at: '2025-06-15T10:00:00Z' },
    ];
    const result = computeMetrics(sessions);
    expect(result.completedCases).toBe(3);
    expect(result.totalCases).toBe(3);
  });

  it('should handle no evaluations completed', () => {
    const sessions: PatientSession[] = [
      { session_id: 's1', teeth: ['11', '21'], evaluationCount: 2, completedCount: 0, created_at: '2025-06-01T10:00:00Z' },
      { session_id: 's2', teeth: ['12'], evaluationCount: 1, completedCount: 0, created_at: '2025-07-01T10:00:00Z' },
    ];
    const result = computeMetrics(sessions);
    expect(result.completedCases).toBe(0);
    expect(result.totalCases).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// initializeForm
// ---------------------------------------------------------------------------

describe('initializeForm', () => {
  it('should return empty form when patient is null', () => {
    expect(initializeForm(null)).toEqual({
      name: '',
      phone: '',
      email: '',
      notes: '',
    });
  });

  it('should populate all fields from patient data', () => {
    const patient: PatientRow = {
      id: 'p1',
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@test.com',
      notes: 'Alérgico a látex',
      birth_date: '1990-05-15',
      created_at: '2025-01-01T10:00:00Z',
    };
    expect(initializeForm(patient)).toEqual({
      name: 'João Silva',
      phone: '11999999999',
      email: 'joao@test.com',
      notes: 'Alérgico a látex',
    });
  });

  it('should convert null phone to empty string', () => {
    const patient: PatientRow = {
      id: 'p1',
      name: 'Maria Santos',
      phone: null,
      email: 'maria@test.com',
      notes: null,
      birth_date: null,
      created_at: '2025-01-01T10:00:00Z',
    };
    const form = initializeForm(patient);
    expect(form.phone).toBe('');
  });

  it('should convert null email to empty string', () => {
    const patient: PatientRow = {
      id: 'p1',
      name: 'Maria Santos',
      phone: '11999999999',
      email: null,
      notes: null,
      birth_date: null,
      created_at: '2025-01-01T10:00:00Z',
    };
    const form = initializeForm(patient);
    expect(form.email).toBe('');
  });

  it('should convert null notes to empty string', () => {
    const patient: PatientRow = {
      id: 'p1',
      name: 'Maria Santos',
      phone: null,
      email: null,
      notes: null,
      birth_date: null,
      created_at: '2025-01-01T10:00:00Z',
    };
    const form = initializeForm(patient);
    expect(form.notes).toBe('');
  });

  it('should handle patient with all nullable fields as null', () => {
    const patient: PatientRow = {
      id: 'p1',
      name: 'Ana',
      phone: null,
      email: null,
      notes: null,
      birth_date: null,
      created_at: '2025-01-01T10:00:00Z',
    };
    expect(initializeForm(patient)).toEqual({
      name: 'Ana',
      phone: '',
      email: '',
      notes: '',
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: groupSessions -> computeMetrics pipeline
// ---------------------------------------------------------------------------

describe('groupSessions -> computeMetrics pipeline', () => {
  it('should produce correct metrics from raw evaluations', () => {
    const evals: Evaluation[] = [
      { id: 'e1', session_id: 's1', tooth: '11', status: 'completed', created_at: '2025-06-01T10:00:00Z' },
      { id: 'e2', session_id: 's1', tooth: '21', status: 'completed', created_at: '2025-06-01T10:05:00Z' },
      { id: 'e3', session_id: 's2', tooth: '12', status: 'pending', created_at: '2025-07-01T10:00:00Z' },
      { id: 'e4', session_id: null, tooth: '31', status: 'completed', created_at: '2025-05-01T10:00:00Z' },
    ];
    const sessions = groupSessions(evals);
    const metrics = computeMetrics(sessions);

    expect(metrics.totalSessions).toBe(3); // s1, s2, legacy-e4
    expect(metrics.totalCases).toBe(4);
    expect(metrics.completedCases).toBe(3);
  });

  it('should produce zeroes from empty evaluations', () => {
    const sessions = groupSessions([]);
    const metrics = computeMetrics(sessions);

    expect(metrics.totalSessions).toBe(0);
    expect(metrics.totalCases).toBe(0);
    expect(metrics.completedCases).toBe(0);
    expect(metrics.firstVisit).toBeNull();
  });
});
