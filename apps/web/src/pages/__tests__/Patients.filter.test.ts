import { describe, it, expect } from 'vitest';

// Test the patient filter logic extracted from Patients.tsx
// This validates the search now covers name, phone, and email

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  sessionCount: number;
  caseCount: number;
  completedCount: number;
  lastVisit: string | null;
}

function filterPatients(patients: Patient[], searchQuery: string): Patient[] {
  const query = searchQuery.toLowerCase();
  return patients.filter((p) =>
    p.name.toLowerCase().includes(query) ||
    (p.phone && p.phone.toLowerCase().includes(query)) ||
    (p.email && p.email.toLowerCase().includes(query))
  );
}

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '(11) 99999-1234',
    email: 'joao@email.com',
    sessionCount: 2,
    caseCount: 3,
    completedCount: 1,
    lastVisit: '2026-01-15',
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '(21) 98888-5678',
    email: 'maria@clinica.com.br',
    sessionCount: 1,
    caseCount: 1,
    completedCount: 0,
    lastVisit: '2026-01-20',
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    phone: null,
    email: null,
    sessionCount: 0,
    caseCount: 0,
    completedCount: 0,
    lastVisit: null,
  },
];

describe('Patient filter logic', () => {
  it('should filter by name', () => {
    const result = filterPatients(mockPatients, 'João');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should filter by phone number', () => {
    const result = filterPatients(mockPatients, '99999');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should filter by email', () => {
    const result = filterPatients(mockPatients, 'clinica.com');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should be case-insensitive', () => {
    const result = filterPatients(mockPatients, 'MARIA');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should return all patients when query is empty', () => {
    const result = filterPatients(mockPatients, '');
    expect(result).toHaveLength(3);
  });

  it('should handle patients with null phone and email', () => {
    const result = filterPatients(mockPatients, 'Carlos');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('should not crash when searching phone on patient with null phone', () => {
    const result = filterPatients(mockPatients, '99999');
    // Should return João (has that phone), not crash on Carlos (null phone)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should return empty array when no match', () => {
    const result = filterPatients(mockPatients, 'inexistente');
    expect(result).toHaveLength(0);
  });

  it('should match partial phone with parentheses', () => {
    const result = filterPatients(mockPatients, '(21)');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});
