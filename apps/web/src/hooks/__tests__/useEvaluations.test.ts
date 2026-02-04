import { describe, it, expect } from 'vitest';

// Test the groupBySession logic and SessionGroup interface
// We can't import groupBySession directly (it's not exported), so we test the shape indirectly.
// Instead, test the exported SessionGroup interface contract through utility logic.

interface Evaluation {
  id: string;
  created_at: string;
  patient_name: string | null;
  tooth: string;
  cavity_class: string;
  status: string | null;
  session_id: string | null;
  treatment_type: string | null;
}

interface SessionGroup {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
  treatmentTypes: string[];
}

// Re-implement groupBySession for unit testing (mirrors the hook's internal function)
function groupBySession(data: Evaluation[]): SessionGroup[] {
  const sessionMap = new Map<string, Evaluation[]>();

  data.forEach((evaluation) => {
    const sessionKey = evaluation.session_id || evaluation.id;
    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, []);
    }
    sessionMap.get(sessionKey)!.push(evaluation);
  });

  return Array.from(sessionMap.entries()).map(([sessionId, evals]) => ({
    session_id: sessionId,
    patient_name: evals[0].patient_name,
    created_at: evals[0].created_at,
    teeth: evals.map((e) => e.tooth),
    evaluationCount: evals.length,
    completedCount: evals.filter((e) => e.status === 'completed').length,
    treatmentTypes: [...new Set(evals.map((e) => e.treatment_type).filter(Boolean))] as string[],
  }));
}

describe('groupBySession', () => {
  const baseEval: Evaluation = {
    id: 'eval-1',
    created_at: '2025-01-01T00:00:00Z',
    patient_name: 'João',
    tooth: '11',
    cavity_class: 'III',
    status: 'pending',
    session_id: 'session-1',
    treatment_type: 'resina',
  };

  it('groups evaluations by session_id', () => {
    const evals: Evaluation[] = [
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
  });

  it('falls back to evaluation id when session_id is null', () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: 'e1', session_id: null },
      { ...baseEval, id: 'e2', session_id: null },
    ];

    const result = groupBySession(evals);
    expect(result).toHaveLength(2);
    expect(result[0].session_id).toBe('e1');
    expect(result[1].session_id).toBe('e2');
  });

  it('counts completed evaluations correctly', () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', status: 'completed' },
      { ...baseEval, id: 'e2', tooth: '12', status: 'pending' },
      { ...baseEval, id: 'e3', tooth: '13', status: 'completed' },
    ];

    const result = groupBySession(evals);
    expect(result[0].completedCount).toBe(2);
    expect(result[0].evaluationCount).toBe(3);
  });

  it('collects unique treatment types', () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', treatment_type: 'resina' },
      { ...baseEval, id: 'e2', tooth: '12', treatment_type: 'porcelana' },
      { ...baseEval, id: 'e3', tooth: '13', treatment_type: 'resina' },
    ];

    const result = groupBySession(evals);
    expect(result[0].treatmentTypes).toEqual(['resina', 'porcelana']);
  });

  it('filters out null treatment types', () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', treatment_type: null },
      { ...baseEval, id: 'e2', tooth: '12', treatment_type: 'coroa' },
    ];

    const result = groupBySession(evals);
    expect(result[0].treatmentTypes).toEqual(['coroa']);
  });

  it('handles empty array', () => {
    const result = groupBySession([]);
    expect(result).toHaveLength(0);
  });

  it('uses first evaluation data for session metadata', () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: 'e1', tooth: '11', patient_name: 'João', created_at: '2025-01-01' },
      { ...baseEval, id: 'e2', tooth: '12', patient_name: 'Maria', created_at: '2025-01-02' },
    ];

    const result = groupBySession(evals);
    expect(result[0].patient_name).toBe('João');
    expect(result[0].created_at).toBe('2025-01-01');
  });
});

describe('treatment type filtering', () => {
  it('filters sessions by treatment type', () => {
    const sessions: SessionGroup[] = [
      {
        session_id: 's1',
        patient_name: 'João',
        created_at: '2025-01-01',
        teeth: ['11'],
        evaluationCount: 1,
        completedCount: 0,
        treatmentTypes: ['resina'],
      },
      {
        session_id: 's2',
        patient_name: 'Maria',
        created_at: '2025-01-02',
        teeth: ['21'],
        evaluationCount: 1,
        completedCount: 1,
        treatmentTypes: ['porcelana', 'coroa'],
      },
    ];

    const filterByTreatment = (type: string) =>
      sessions.filter((s) => type === 'all' || s.treatmentTypes.includes(type));

    expect(filterByTreatment('all')).toHaveLength(2);
    expect(filterByTreatment('resina')).toHaveLength(1);
    expect(filterByTreatment('resina')[0].session_id).toBe('s1');
    expect(filterByTreatment('porcelana')).toHaveLength(1);
    expect(filterByTreatment('coroa')).toHaveLength(1);
    expect(filterByTreatment('implante')).toHaveLength(0);
  });

  it('filters by status and treatment type together', () => {
    const sessions: SessionGroup[] = [
      {
        session_id: 's1',
        patient_name: 'João',
        created_at: '2025-01-01',
        teeth: ['11', '12'],
        evaluationCount: 2,
        completedCount: 2,
        treatmentTypes: ['resina'],
      },
      {
        session_id: 's2',
        patient_name: 'Maria',
        created_at: '2025-01-02',
        teeth: ['21'],
        evaluationCount: 1,
        completedCount: 0,
        treatmentTypes: ['resina', 'porcelana'],
      },
    ];

    const filter = (status: string, treatment: string) =>
      sessions.filter((session) => {
        if (status === 'pending' && session.completedCount >= session.evaluationCount) return false;
        if (status === 'completed' && session.completedCount < session.evaluationCount) return false;
        if (treatment !== 'all' && !session.treatmentTypes.includes(treatment)) return false;
        return true;
      });

    // Completed + resina: only s1
    expect(filter('completed', 'resina')).toHaveLength(1);
    expect(filter('completed', 'resina')[0].session_id).toBe('s1');

    // Pending + resina: only s2
    expect(filter('pending', 'resina')).toHaveLength(1);
    expect(filter('pending', 'resina')[0].session_id).toBe('s2');

    // Pending + porcelana: only s2
    expect(filter('pending', 'porcelana')).toHaveLength(1);

    // Completed + porcelana: none (s2 has porcelana but is pending)
    expect(filter('completed', 'porcelana')).toHaveLength(0);
  });
});
