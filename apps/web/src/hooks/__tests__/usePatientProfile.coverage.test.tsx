import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(() => ({ patientId: 'patient-test-1' })),
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' }, loading: false })),
}));

vi.mock('@/data', () => ({
  patients: {
    getById: vi.fn().mockResolvedValue({
      id: 'patient-test-1',
      name: 'Test Patient',
      phone: '11999999999',
      email: 'test@email.com',
      notes: 'Test notes',
      birth_date: '1990-05-15',
      created_at: '2025-01-01T10:00:00Z',
      user_id: 'test-user-id',
    }),
    listSessions: vi.fn().mockResolvedValue({
      rows: [
        { id: 'e1', session_id: 'session-1', tooth: '11', status: 'completed', created_at: '2025-06-01T10:00:00Z' },
        { id: 'e2', session_id: 'session-1', tooth: '21', status: 'draft', created_at: '2025-06-01T10:05:00Z' },
        { id: 'e3', session_id: 'session-2', tooth: '12', status: 'completed', created_at: '2025-07-01T10:00:00Z' },
      ],
      count: 3,
    }),
    update: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { usePatientProfile } from '@/hooks/domain/usePatientProfile';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePatientProfile (renderHook coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    expect(result.current).toBeDefined();
    expect(result.current.patientId).toBe('patient-test-1');
    expect(result.current.editDialogOpen).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });

  it('should load patient data', async () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.patient).toBeDefined();
    expect(result.current.patient?.name).toBe('Test Patient');
  });

  it('should load and group sessions', async () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.sessions).toBeDefined();
    expect(result.current.sessions?.sessions.length).toBe(2);
  });

  it('should compute metrics', async () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.metrics.totalSessions).toBe(2);
    expect(result.current.metrics.totalCases).toBe(3);
    expect(result.current.metrics.completedCases).toBe(2);
    expect(result.current.metrics.firstVisit).toBeDefined();
    expect(result.current.metrics.firstVisitFormatted).toBeDefined();
  });

  it('should open and close edit dialog', async () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    act(() => { result.current.openEditDialog(); });
    expect(result.current.editDialogOpen).toBe(true);
    expect(result.current.editForm.name).toBe('Test Patient');
    expect(result.current.editForm.phone).toBe('11999999999');
    expect(result.current.editForm.email).toBe('test@email.com');
    expect(result.current.editForm.notes).toBe('Test notes');
    act(() => { result.current.closeEditDialog(); });
    expect(result.current.editDialogOpen).toBe(false);
  });

  it('should update edit form fields', async () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    act(() => { result.current.openEditDialog(); });
    act(() => { result.current.updateEditField('name', 'Updated Name'); });
    expect(result.current.editForm.name).toBe('Updated Name');
    act(() => { result.current.updateEditField('phone', '11888888888'); });
    expect(result.current.editForm.phone).toBe('11888888888');
  });

  it('should handle setEditDialogOpen', async () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    act(() => { result.current.setEditDialogOpen(true); });
    expect(result.current.editDialogOpen).toBe(true);
    act(() => { result.current.setEditDialogOpen(false); });
    expect(result.current.editDialogOpen).toBe(false);
  });

  it('should provide loadMoreSessions function', async () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    expect(typeof result.current.loadMoreSessions).toBe('function');
  });

  it('should provide handleSave function', async () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    expect(typeof result.current.handleSave).toBe('function');
  });

  it('should compute hasMore correctly', async () => {
    const { result } = renderHook(() => usePatientProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.sessions?.hasMore).toBe(false);
    expect(result.current.sessions?.totalCount).toBe(3);
  });
});
