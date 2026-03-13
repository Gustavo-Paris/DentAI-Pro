import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'test-user-id' }, loading: false })),
}));

vi.mock('@/data', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { synced: true } }),
    },
  },
  profiles: {
    getFullByUserId: vi.fn().mockResolvedValue({
      full_name: 'Dr. Test User',
      cro: 'CRO-SP 12345',
      clinic_name: 'Test Clinic',
      phone: '11999999999',
      avatar_url: null,
      clinic_logo_url: null,
    }),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    getAvatarPublicUrl: vi.fn((url: string) => `https://storage.test/${url}`),
  },
  payments: {
    listByUserId: vi.fn().mockResolvedValue([
      {
        id: 'pay-1',
        amount: 2990,
        currency: 'brl',
        status: 'succeeded',
        description: 'Test Subscription',
        invoice_url: null,
        invoice_pdf: null,
        created_at: '2025-01-01T10:00:00Z',
      },
    ]),
  },
  subscriptions: {
    syncCreditPurchase: vi.fn().mockResolvedValue({ synced: true, credits_added: 0, sessions_processed: 0 }),
  },
  privacy: {
    exportData: vi.fn().mockResolvedValue({ data: {} }),
    deleteAccount: vi.fn().mockResolvedValue({ success: true }),
  },
  storage: {
    uploadAvatar: vi.fn().mockResolvedValue('user/avatar.jpg'),
    getAvatarPublicUrl: vi.fn((url: string) => `https://storage.test/${url}`),
  },
  evaluations: {
    getDashboardMetrics: vi.fn().mockResolvedValue({ weeklySessionCount: 5, pendingTeethCount: 2 }),
    countByUserId: vi.fn().mockResolvedValue(20),
  },
  email: {
    sendEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: vi.fn(() => ({
    refreshSubscription: vi.fn(),
    creditsRemaining: 10,
    creditsPerMonth: 50,
    isActive: true,
    isFree: false,
    isLoading: false,
  })),
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

import { useProfile } from '@/hooks/domain/useProfile';

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

describe('useProfile (renderHook coverage)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    expect(result.current).toBeDefined();
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.isUploadingLogo).toBe(false);
    expect(result.current.sendingDigest).toBe(false);
  });

  it('should load profile data', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.profile.full_name).toBe('Dr. Test User');
    expect(result.current.profile.cro).toBe('CRO-SP 12345');
  });

  it('should update fields', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    act(() => {
      result.current.updateField('full_name', 'Dr. New Name');
    });
    expect(result.current.profile.full_name).toBe('Dr. New Name');
  });

  it('should compute isDirty when form is modified', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isDirty).toBe(false);
    act(() => {
      result.current.updateField('full_name', 'Changed Name');
    });
    expect(result.current.isDirty).toBe(true);
  });

  it('should load payment records', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoadingPayments).toBe(false);
    });
    expect(result.current.paymentRecords).toBeDefined();
    expect(result.current.paymentRecords?.length).toBe(1);
  });

  it('should have refs defined', () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    expect(result.current.fileInputRef).toBeDefined();
    expect(result.current.logoInputRef).toBeDefined();
  });

  it('should provide syncCreditPurchase function', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    expect(typeof result.current.syncCreditPurchase).toBe('function');
    const syncResult = await result.current.syncCreditPurchase();
    expect(syncResult.synced).toBe(true);
  });

  it('should provide exportData function', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    expect(typeof result.current.exportData).toBe('function');
  });

  it('should provide deleteAccount function', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    expect(typeof result.current.deleteAccount).toBe('function');
  });

  it('should provide sendWeeklyDigest function', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    expect(typeof result.current.sendWeeklyDigest).toBe('function');
  });

  it('should preview URLs be null initially', () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    expect(result.current.avatarPreview).toBeNull();
    expect(result.current.logoPreview).toBeNull();
  });

  it('should call sendWeeklyDigest and show success toast', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.sendWeeklyDigest();
    });

    const { evaluations: evalsData, email } = await import('@/data');
    expect(evalsData.getDashboardMetrics).toHaveBeenCalled();
    expect(evalsData.countByUserId).toHaveBeenCalled();
    expect(email.sendEmail).toHaveBeenCalledWith('weekly-digest', expect.objectContaining({
      casesThisWeek: 5,
      totalCases: 20,
      pendingTeeth: 2,
    }));
    expect(toast.success).toHaveBeenCalled();
  });

  it('should handle sendWeeklyDigest error', async () => {
    const { toast } = await import('sonner');
    const { evaluations: evalsData } = await import('@/data');
    (evalsData.getDashboardMetrics as any).mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.sendWeeklyDigest();
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should handle avatar upload success', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } } as any;

    await act(async () => {
      await result.current.handleAvatarUpload(event);
    });

    expect(toast.success).toHaveBeenCalled();
    expect(result.current.avatarPreview).toContain('https://storage.test/');
  });

  it('should reject non-image avatar upload', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as any;

    await act(async () => {
      await result.current.handleAvatarUpload(event);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should reject oversized avatar upload', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const bigFile = new File([new ArrayBuffer(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [bigFile] } } as any;

    await act(async () => {
      await result.current.handleAvatarUpload(event);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should handle avatar upload with no file', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const event = { target: { files: [] } } as any;
    await act(async () => {
      await result.current.handleAvatarUpload(event);
    });
    // Should not throw, early return
  });

  it('should handle logo upload success', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['test'], 'logo.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as any;

    await act(async () => {
      await result.current.handleLogoUpload(event);
    });

    expect(toast.success).toHaveBeenCalled();
    expect(result.current.logoPreview).toContain('https://storage.test/');
  });

  it('should reject non-image logo upload', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as any;

    await act(async () => {
      await result.current.handleLogoUpload(event);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should reject oversized logo upload (>1MB)', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const bigFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    const event = { target: { files: [bigFile] } } as any;

    await act(async () => {
      await result.current.handleLogoUpload(event);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should handle avatar upload error', async () => {
    const { toast } = await import('sonner');
    const { storage: storageData } = await import('@/data');
    (storageData.uploadAvatar as any).mockRejectedValueOnce(new Error('upload fail'));

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } } as any;

    await act(async () => {
      await result.current.handleAvatarUpload(event);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should handle logo upload error', async () => {
    const { toast } = await import('sonner');
    const { storage: storageData } = await import('@/data');
    (storageData.uploadAvatar as any).mockRejectedValueOnce(new Error('upload fail'));

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const file = new File(['test'], 'logo.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as any;

    await act(async () => {
      await result.current.handleLogoUpload(event);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('should call exportData', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    const exportResult = await result.current.exportData();
    expect(exportResult).toBeDefined();
  });

  it('should call deleteAccount', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    const deleteResult = await result.current.deleteAccount('CONFIRM');
    expect(deleteResult).toBeDefined();
  });

  it('should handle handleSave', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      try {
        await result.current.handleSave();
      } catch {
        // May throw due to navigation mock, that's ok
      }
    });

    const { profiles } = await import('@/data');
    expect(profiles.updateProfile).toHaveBeenCalled();
  });

  it('sets avatar preview from profileData when avatar_url exists', async () => {
    const { profiles } = await import('@/data');
    (profiles.getFullByUserId as any).mockResolvedValueOnce({
      full_name: 'Dr. With Avatar',
      cro: '123',
      clinic_name: 'Clinic',
      phone: '999',
      avatar_url: 'avatars/test.jpg',
      clinic_logo_url: 'logos/clinic.png',
    });

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.avatarPreview).toContain('avatars/test.jpg');
    expect(result.current.logoPreview).toContain('logos/clinic.png');
  });
});
