import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure computation logic from useEvaluationSessions
// The hook depends on React Query, AuthContext, and useLocation.
// We test groupBySession (with the added `status` field) and related logic.
//
// NOTE: The existing useEvaluations.test.ts tests a simpler groupBySession
// that doesn't include the computed `status` field. This file tests the
// full EvaluationSession shape from useEvaluationSessions.
// ---------------------------------------------------------------------------

interface RawEvaluation {
  id: string;
  created_at: string;
  patient_name: string | null;
  tooth: string;
  cavity_class: string;
  status: string | null;
  session_id: string | null;
  treatment_type: string | null;
}

interface EvaluationSession {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
  treatmentTypes: string[];
  status: 'completed' | 'pending';
}

// Mirrors the groupBySession function in useEvaluationSessions
function groupBySession(data: RawEvaluation[]): EvaluationSession[] {
  const sessionMap = new Map<string, RawEvaluation[]>();

  data.forEach((evaluation) => {
    const sessionKey = evaluation.session_id || evaluation.id;
    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, []);
    }
    sessionMap.get(sessionKey)!.push(evaluation);
  });

  return Array.from(sessionMap.entries()).map(([sessionId, evals]) => {
    const completedCount = evals.filter((e) => e.status === 'completed').length;
    const evaluationCount = evals.length;
    return {
      session_id: sessionId,
      patient_name: evals[0].patient_name,
      created_at: evals[0].created_at,
      teeth: evals.map((e) => e.tooth),
      evaluationCount,
      completedCount,
      treatmentTypes: [...new Set(evals.map((e) => e.treatment_type).filter(Boolean))] as string[],
      status: completedCount >= evaluationCount ? 'completed' : 'pending',
    };
  });
}

const baseEval: RawEvaluation = {
  id: 'eval-1',
  created_at: '2025-01-15T10:00:00Z',
  patient_name: 'João Silva',
  tooth: '11',
  cavity_class: 'III',
  status: 'pending',
  session_id: 'session-1',
  treatment_type: 'resina',
};

// --- Session status computation (the key addition over useEvaluations) ---

describe('session status computation', () => {
  it('should be "completed" when all evaluations are completed', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', status: 'completed' },
      { ...baseEval, id: 'e2', tooth: '12', status: 'completed' },
      { ...baseEval, id: 'e3', tooth: '13', status: 'completed' },
    ];
    const result = groupBySession(evals);
    expect(result[0].status).toBe('completed');
  });

  it('should be "pending" when some evaluations are not completed', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', status: 'completed' },
      { ...baseEval, id: 'e2', tooth: '12', status: 'pending' },
    ];
    const result = groupBySession(evals);
    expect(result[0].status).toBe('pending');
  });

  it('should be "pending" when no evaluations are completed', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', status: 'pending' },
      { ...baseEval, id: 'e2', tooth: '12', status: 'pending' },
    ];
    const result = groupBySession(evals);
    expect(result[0].status).toBe('pending');
  });

  it('should be "completed" for single completed evaluation', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', status: 'completed' },
    ];
    const result = groupBySession(evals);
    expect(result[0].status).toBe('completed');
  });

  it('should be "pending" for single pending evaluation', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', status: 'pending' },
    ];
    const result = groupBySession(evals);
    expect(result[0].status).toBe('pending');
  });

  it('should handle null status as not completed (pending session)', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', status: null },
    ];
    const result = groupBySession(evals);
    // null status is not 'completed', so completedCount=0, evaluationCount=1 => pending
    expect(result[0].status).toBe('pending');
    expect(result[0].completedCount).toBe(0);
  });

  it('should compute status per session independently', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', session_id: 's1', status: 'completed' },
      { ...baseEval, id: 'e2', tooth: '12', session_id: 's1', status: 'completed' },
      { ...baseEval, id: 'e3', tooth: '21', session_id: 's2', status: 'pending' },
    ];
    const result = groupBySession(evals);
    expect(result.find(s => s.session_id === 's1')!.status).toBe('completed');
    expect(result.find(s => s.session_id === 's2')!.status).toBe('pending');
  });
});

// --- groupBySession core behavior ---

describe('groupBySession', () => {
  it('should handle empty array', () => {
    expect(groupBySession([])).toHaveLength(0);
  });

  it('should group evaluations by session_id', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', session_id: 'session-1' },
      { ...baseEval, id: 'e2', tooth: '12', session_id: 'session-1' },
      { ...baseEval, id: 'e3', tooth: '21', session_id: 'session-2', patient_name: 'Maria' },
    ];
    const result = groupBySession(evals);
    expect(result).toHaveLength(2);
    expect(result[0].session_id).toBe('session-1');
    expect(result[0].teeth).toEqual(['11', '12']);
    expect(result[0].evaluationCount).toBe(2);
    expect(result[1].session_id).toBe('session-2');
    expect(result[1].teeth).toEqual(['21']);
    expect(result[1].evaluationCount).toBe(1);
  });

  it('should fall back to evaluation id when session_id is null', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', session_id: null },
      { ...baseEval, id: 'e2', session_id: null },
    ];
    const result = groupBySession(evals);
    expect(result).toHaveLength(2);
    expect(result[0].session_id).toBe('e1');
    expect(result[1].session_id).toBe('e2');
  });

  it('should use first evaluation metadata for session', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', patient_name: 'João', created_at: '2025-01-01' },
      { ...baseEval, id: 'e2', tooth: '12', patient_name: 'Maria', created_at: '2025-01-02' },
    ];
    const result = groupBySession(evals);
    expect(result[0].patient_name).toBe('João');
    expect(result[0].created_at).toBe('2025-01-01');
  });

  it('should collect unique treatment types', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', treatment_type: 'resina' },
      { ...baseEval, id: 'e2', tooth: '12', treatment_type: 'porcelana' },
      { ...baseEval, id: 'e3', tooth: '13', treatment_type: 'resina' },
    ];
    const result = groupBySession(evals);
    expect(result[0].treatmentTypes).toEqual(['resina', 'porcelana']);
  });

  it('should filter out null treatment types', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', treatment_type: null },
      { ...baseEval, id: 'e2', tooth: '12', treatment_type: 'coroa' },
      { ...baseEval, id: 'e3', tooth: '13', treatment_type: null },
    ];
    const result = groupBySession(evals);
    expect(result[0].treatmentTypes).toEqual(['coroa']);
  });

  it('should handle session with all null treatment types', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', treatment_type: null },
      { ...baseEval, id: 'e2', tooth: '12', treatment_type: null },
    ];
    const result = groupBySession(evals);
    expect(result[0].treatmentTypes).toEqual([]);
  });

  it('should handle null patient_name', () => {
    const evals: RawEvaluation[] = [
      { ...baseEval, id: 'e1', patient_name: null },
    ];
    const result = groupBySession(evals);
    expect(result[0].patient_name).toBeNull();
  });
});

// --- Hook default values ---

describe('hook default return values', () => {
  it('should default sessions to empty array when query data is undefined', () => {
    const queryData = undefined;
    const sessions = queryData?.sessions ?? [];
    const total = queryData?.total ?? 0;
    expect(sessions).toEqual([]);
    expect(total).toBe(0);
  });
});

// --- Location state defaults ---

describe('location state defaults', () => {
  it('should default newSessionId to null when location state is null', () => {
    const locationState: { newSessionId?: string; teethCount?: number } | null = null;
    expect(locationState?.newSessionId ?? null).toBeNull();
  });

  it('should default newTeethCount to 0 when location state is null', () => {
    const locationState: { newSessionId?: string; teethCount?: number } | null = null;
    expect(locationState?.teethCount ?? 0).toBe(0);
  });

  it('should extract newSessionId when present', () => {
    const locationState = { newSessionId: 'session-abc', teethCount: 3 };
    expect(locationState.newSessionId ?? null).toBe('session-abc');
  });

  it('should extract teethCount when present', () => {
    const locationState = { newSessionId: 'session-abc', teethCount: 5 };
    expect(locationState.teethCount ?? 0).toBe(5);
  });
});

// --- Session filtering helpers (commonly used by page adapter) ---

describe('session filtering', () => {
  const sessions: EvaluationSession[] = [
    {
      session_id: 's1',
      patient_name: 'João',
      created_at: '2025-01-15',
      teeth: ['11', '12'],
      evaluationCount: 2,
      completedCount: 2,
      treatmentTypes: ['resina'],
      status: 'completed',
    },
    {
      session_id: 's2',
      patient_name: 'Maria',
      created_at: '2025-01-16',
      teeth: ['21'],
      evaluationCount: 1,
      completedCount: 0,
      treatmentTypes: ['porcelana', 'coroa'],
      status: 'pending',
    },
    {
      session_id: 's3',
      patient_name: 'Ana',
      created_at: '2025-01-17',
      teeth: ['31', '32', '33'],
      evaluationCount: 3,
      completedCount: 3,
      treatmentTypes: ['resina', 'implante'],
      status: 'completed',
    },
  ];

  function filterByStatus(list: EvaluationSession[], status: string): EvaluationSession[] {
    if (status === 'all') return list;
    return list.filter(s => s.status === status);
  }

  function filterByPatientName(list: EvaluationSession[], query: string): EvaluationSession[] {
    if (!query.trim()) return list;
    const lowerQuery = query.toLowerCase();
    return list.filter(s => s.patient_name?.toLowerCase().includes(lowerQuery));
  }

  it('should filter completed sessions', () => {
    const result = filterByStatus(sessions, 'completed');
    expect(result).toHaveLength(2);
    expect(result.every(s => s.status === 'completed')).toBe(true);
  });

  it('should filter pending sessions', () => {
    const result = filterByStatus(sessions, 'pending');
    expect(result).toHaveLength(1);
    expect(result[0].session_id).toBe('s2');
  });

  it('should return all sessions for "all" status', () => {
    expect(filterByStatus(sessions, 'all')).toHaveLength(3);
  });

  it('should filter by patient name', () => {
    const result = filterByPatientName(sessions, 'Maria');
    expect(result).toHaveLength(1);
    expect(result[0].session_id).toBe('s2');
  });

  it('should filter by patient name case-insensitive', () => {
    const result = filterByPatientName(sessions, 'joão');
    expect(result).toHaveLength(1);
  });

  it('should return all when search query is empty', () => {
    expect(filterByPatientName(sessions, '')).toHaveLength(3);
    expect(filterByPatientName(sessions, '  ')).toHaveLength(3);
  });

  it('should handle null patient_name in filter', () => {
    const sessionsWithNull: EvaluationSession[] = [
      { ...sessions[0], patient_name: null },
    ];
    const result = filterByPatientName(sessionsWithNull, 'João');
    expect(result).toHaveLength(0);
  });
});

// --- Session sorting helpers ---

describe('session sorting', () => {
  const sessions: EvaluationSession[] = [
    {
      session_id: 's1',
      patient_name: 'Ana',
      created_at: '2025-01-15T10:00:00Z',
      teeth: ['11'],
      evaluationCount: 1,
      completedCount: 1,
      treatmentTypes: [],
      status: 'completed',
    },
    {
      session_id: 's2',
      patient_name: 'Carlos',
      created_at: '2025-01-17T10:00:00Z',
      teeth: ['21'],
      evaluationCount: 1,
      completedCount: 0,
      treatmentTypes: [],
      status: 'pending',
    },
    {
      session_id: 's3',
      patient_name: 'Bruno',
      created_at: '2025-01-16T10:00:00Z',
      teeth: ['31'],
      evaluationCount: 1,
      completedCount: 1,
      treatmentTypes: [],
      status: 'completed',
    },
  ];

  it('should sort by created_at descending (newest first)', () => {
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    expect(sorted[0].session_id).toBe('s2');
    expect(sorted[1].session_id).toBe('s3');
    expect(sorted[2].session_id).toBe('s1');
  });

  it('should sort by patient_name alphabetically', () => {
    const sorted = [...sessions].sort((a, b) =>
      (a.patient_name ?? '').localeCompare(b.patient_name ?? ''),
    );
    expect(sorted[0].patient_name).toBe('Ana');
    expect(sorted[1].patient_name).toBe('Bruno');
    expect(sorted[2].patient_name).toBe('Carlos');
  });

  it('should sort by evaluationCount descending', () => {
    const customSessions = [
      { ...sessions[0], evaluationCount: 5 },
      { ...sessions[1], evaluationCount: 2 },
      { ...sessions[2], evaluationCount: 8 },
    ];
    const sorted = customSessions.sort((a, b) => b.evaluationCount - a.evaluationCount);
    expect(sorted[0].evaluationCount).toBe(8);
    expect(sorted[1].evaluationCount).toBe(5);
    expect(sorted[2].evaluationCount).toBe(2);
  });
});
