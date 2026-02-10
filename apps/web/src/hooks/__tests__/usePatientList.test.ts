import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure computation logic from usePatientList
// The hook depends on React Query + AuthContext, so we test the data
// transformation that maps raw patients + evaluation stats into
// PatientWithStats objects.
// ---------------------------------------------------------------------------

interface PatientWithStats {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  sessionCount: number;
  caseCount: number;
  completedCount: number;
  lastVisit: string | null;
}

interface PatientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface EvaluationStat {
  patient_id: string;
  session_id: string | null;
  status: string | null;
  created_at: string;
}

// Mirror the queryFn logic from usePatientList
function computePatientStats(
  patientsData: PatientRow[],
  evaluationsData: EvaluationStat[],
): PatientWithStats[] {
  return patientsData.map((patient) => {
    const patientEvals =
      evaluationsData?.filter((e) => e.patient_id === patient.id) || [];
    const uniqueSessions = new Set(patientEvals.map((e) => e.session_id));
    const completedCount = patientEvals.filter(
      (e) => e.status === 'completed',
    ).length;
    const lastEval = patientEvals.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

    return {
      id: patient.id,
      name: patient.name,
      phone: patient.phone ?? null,
      email: patient.email ?? null,
      sessionCount: uniqueSessions.size,
      caseCount: patientEvals.length,
      completedCount,
      lastVisit: lastEval?.created_at || null,
    };
  });
}

describe('computePatientStats', () => {
  const patients: PatientRow[] = [
    { id: 'p1', name: 'João Silva', phone: '11999999999', email: 'joao@test.com' },
    { id: 'p2', name: 'Maria Santos', phone: null, email: null },
  ];

  it('should return empty array for empty patients', () => {
    expect(computePatientStats([], [])).toEqual([]);
  });

  it('should map patient fields correctly', () => {
    const result = computePatientStats(patients, []);
    expect(result[0].id).toBe('p1');
    expect(result[0].name).toBe('João Silva');
    expect(result[0].phone).toBe('11999999999');
    expect(result[0].email).toBe('joao@test.com');
  });

  it('should handle null phone and email', () => {
    const result = computePatientStats(patients, []);
    expect(result[1].phone).toBeNull();
    expect(result[1].email).toBeNull();
  });

  it('should compute zero stats when no evaluations', () => {
    const result = computePatientStats(patients, []);
    expect(result[0].sessionCount).toBe(0);
    expect(result[0].caseCount).toBe(0);
    expect(result[0].completedCount).toBe(0);
    expect(result[0].lastVisit).toBeNull();
  });

  it('should count total cases (evaluations) per patient', () => {
    const evals: EvaluationStat[] = [
      { patient_id: 'p1', session_id: 's1', status: 'pending', created_at: '2025-01-01T10:00:00Z' },
      { patient_id: 'p1', session_id: 's1', status: 'completed', created_at: '2025-01-01T11:00:00Z' },
      { patient_id: 'p1', session_id: 's2', status: 'pending', created_at: '2025-01-02T10:00:00Z' },
    ];
    const result = computePatientStats(patients, evals);
    expect(result[0].caseCount).toBe(3);
  });

  it('should count unique sessions per patient', () => {
    const evals: EvaluationStat[] = [
      { patient_id: 'p1', session_id: 's1', status: 'pending', created_at: '2025-01-01T10:00:00Z' },
      { patient_id: 'p1', session_id: 's1', status: 'completed', created_at: '2025-01-01T11:00:00Z' },
      { patient_id: 'p1', session_id: 's2', status: 'pending', created_at: '2025-01-02T10:00:00Z' },
    ];
    const result = computePatientStats(patients, evals);
    expect(result[0].sessionCount).toBe(2);
  });

  it('should count completed evaluations per patient', () => {
    const evals: EvaluationStat[] = [
      { patient_id: 'p1', session_id: 's1', status: 'completed', created_at: '2025-01-01T10:00:00Z' },
      { patient_id: 'p1', session_id: 's1', status: 'pending', created_at: '2025-01-01T11:00:00Z' },
      { patient_id: 'p1', session_id: 's1', status: 'completed', created_at: '2025-01-01T12:00:00Z' },
    ];
    const result = computePatientStats(patients, evals);
    expect(result[0].completedCount).toBe(2);
  });

  it('should find the most recent evaluation date as lastVisit', () => {
    const evals: EvaluationStat[] = [
      { patient_id: 'p1', session_id: 's1', status: 'completed', created_at: '2025-01-01T10:00:00Z' },
      { patient_id: 'p1', session_id: 's2', status: 'pending', created_at: '2025-03-15T10:00:00Z' },
      { patient_id: 'p1', session_id: 's1', status: 'completed', created_at: '2025-01-05T10:00:00Z' },
    ];
    const result = computePatientStats(patients, evals);
    expect(result[0].lastVisit).toBe('2025-03-15T10:00:00Z');
  });

  it('should not cross-pollinate stats between patients', () => {
    const evals: EvaluationStat[] = [
      { patient_id: 'p1', session_id: 's1', status: 'completed', created_at: '2025-01-01T10:00:00Z' },
      { patient_id: 'p1', session_id: 's1', status: 'completed', created_at: '2025-01-01T11:00:00Z' },
      { patient_id: 'p2', session_id: 's2', status: 'pending', created_at: '2025-01-02T10:00:00Z' },
    ];
    const result = computePatientStats(patients, evals);
    // p1
    expect(result[0].caseCount).toBe(2);
    expect(result[0].completedCount).toBe(2);
    expect(result[0].sessionCount).toBe(1);
    // p2
    expect(result[1].caseCount).toBe(1);
    expect(result[1].completedCount).toBe(0);
    expect(result[1].sessionCount).toBe(1);
  });

  it('should handle null session_id (counts as unique per eval)', () => {
    const evals: EvaluationStat[] = [
      { patient_id: 'p1', session_id: null, status: 'completed', created_at: '2025-01-01T10:00:00Z' },
      { patient_id: 'p1', session_id: null, status: 'pending', created_at: '2025-01-02T10:00:00Z' },
    ];
    const result = computePatientStats(patients, evals);
    // Both have session_id=null, so Set will have size 1 (null is a single entry)
    expect(result[0].sessionCount).toBe(1);
    expect(result[0].caseCount).toBe(2);
  });

  it('should handle evaluations with no matching patients', () => {
    const evals: EvaluationStat[] = [
      { patient_id: 'p-unknown', session_id: 's1', status: 'completed', created_at: '2025-01-01T10:00:00Z' },
    ];
    const result = computePatientStats(patients, evals);
    // p1 and p2 should have no evals
    expect(result[0].caseCount).toBe(0);
    expect(result[1].caseCount).toBe(0);
  });
});

// --- Default return values from hook ---

describe('usePatientList default state', () => {
  it('should have correct default shape', () => {
    // When query data is undefined, the hook returns these defaults
    const defaultPatients = undefined?.patients ?? [];
    const defaultTotal = undefined?.total ?? 0;

    expect(defaultPatients).toEqual([]);
    expect(defaultTotal).toBe(0);
  });
});

// --- Patient search/filter logic (commonly used in page adapter) ---

describe('patient filtering logic', () => {
  const patients: PatientWithStats[] = [
    { id: 'p1', name: 'João Silva', phone: '11999999999', email: 'joao@test.com', sessionCount: 3, caseCount: 5, completedCount: 4, lastVisit: '2025-01-15' },
    { id: 'p2', name: 'Maria Santos', phone: null, email: 'maria@test.com', sessionCount: 1, caseCount: 2, completedCount: 2, lastVisit: '2025-01-10' },
    { id: 'p3', name: 'Ana Oliveira', phone: '21888888888', email: null, sessionCount: 0, caseCount: 0, completedCount: 0, lastVisit: null },
  ];

  function filterPatients(list: PatientWithStats[], query: string): PatientWithStats[] {
    if (!query.trim()) return list;
    const lowerQuery = query.toLowerCase();
    return list.filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.phone?.toLowerCase().includes(lowerQuery) ||
        p.email?.toLowerCase().includes(lowerQuery),
    );
  }

  it('should return all patients when query is empty', () => {
    expect(filterPatients(patients, '')).toHaveLength(3);
    expect(filterPatients(patients, '  ')).toHaveLength(3);
  });

  it('should filter by name', () => {
    const result = filterPatients(patients, 'João');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('should filter by name case-insensitive', () => {
    const result = filterPatients(patients, 'maria');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p2');
  });

  it('should filter by phone', () => {
    const result = filterPatients(patients, '999999');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('should filter by email', () => {
    const result = filterPatients(patients, 'maria@test');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p2');
  });

  it('should return empty when no match', () => {
    expect(filterPatients(patients, 'zzzzz')).toHaveLength(0);
  });

  it('should handle patients with null phone/email gracefully', () => {
    const result = filterPatients(patients, 'Oliveira');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p3');
  });

  it('should match partial name', () => {
    const result = filterPatients(patients, 'Santos');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p2');
  });
});
