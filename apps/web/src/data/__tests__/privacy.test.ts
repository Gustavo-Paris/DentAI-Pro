import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportData, deleteAccount } from '../privacy';

// ---------------------------------------------------------------------------
// Mock supabase client
// ---------------------------------------------------------------------------

const mockInvoke = vi.fn();

vi.mock('../client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('privacy.exportData', () => {
  it('should invoke data-export edge function and return result', async () => {
    const exportResult = {
      export_metadata: {
        exported_at: '2025-01-01T00:00:00Z',
        user_id: 'user-1',
        user_email: 'test@example.com',
        format_version: '1.0',
        lgpd_reference: 'Art. 18, V',
      },
      profile: { name: 'Test' },
      evaluations: [],
      patients: [],
      drafts: [],
      credit_usage: [],
      subscription: null,
      inventory: [],
      payment_history: [],
    };

    mockInvoke.mockResolvedValue({ data: exportResult, error: null });

    const result = await exportData();

    expect(result).toEqual(exportResult);
    expect(mockInvoke).toHaveBeenCalledWith('data-export', { body: {} });
  });

  it('should throw when edge function returns error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Export failed') });

    await expect(exportData()).rejects.toThrow('Export failed');
  });
});

describe('privacy.deleteAccount', () => {
  it('should invoke delete-account edge function with confirmation', async () => {
    const deleteResult = {
      success: true,
      message: 'Account deleted',
      deleted: ['profile', 'evaluations', 'patients'],
    };

    mockInvoke.mockResolvedValue({ data: deleteResult, error: null });

    const result = await deleteAccount('EXCLUIR MINHA CONTA');

    expect(result).toEqual(deleteResult);
    expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
      body: { confirmation: 'EXCLUIR MINHA CONTA' },
    });
  });

  it('should throw when edge function returns error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Deletion failed') });

    await expect(deleteAccount('EXCLUIR MINHA CONTA')).rejects.toThrow('Deletion failed');
  });

  it('should pass arbitrary confirmation strings through', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: false, message: 'Invalid confirmation', deleted: [] },
      error: null,
    });

    const result = await deleteAccount('wrong confirmation');

    expect(result.success).toBe(false);
    expect(mockInvoke).toHaveBeenCalledWith('delete-account', {
      body: { confirmation: 'wrong confirmation' },
    });
  });
});
