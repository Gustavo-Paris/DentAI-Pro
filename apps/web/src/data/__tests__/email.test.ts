import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail } from '../email';
import type { EmailTemplate } from '../email';

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

describe('email.sendEmail', () => {
  it('should invoke send-email edge function with template', async () => {
    const result = { success: true, template: 'welcome' as EmailTemplate };
    mockInvoke.mockResolvedValue({ data: result, error: null });

    const response = await sendEmail('welcome');

    expect(response).toEqual(result);
    expect(mockInvoke).toHaveBeenCalledWith('send-email', {
      body: { template: 'welcome', data: undefined },
    });
  });

  it('should pass template-specific data', async () => {
    const result = { success: true, template: 'credit-warning' as EmailTemplate };
    mockInvoke.mockResolvedValue({ data: result, error: null });

    const response = await sendEmail('credit-warning', { remaining: 2 });

    expect(response).toEqual(result);
    expect(mockInvoke).toHaveBeenCalledWith('send-email', {
      body: { template: 'credit-warning', data: { remaining: 2 } },
    });
  });

  it('should throw when edge function returns error', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: new Error('Email send failed') });

    await expect(sendEmail('weekly-digest')).rejects.toThrow('Email send failed');
  });

  it('should support all template types', async () => {
    const templates: EmailTemplate[] = ['welcome', 'credit-warning', 'weekly-digest', 'account-deleted'];

    for (const template of templates) {
      mockInvoke.mockResolvedValue({
        data: { success: true, template },
        error: null,
      });

      const result = await sendEmail(template);
      expect(result.template).toBe(template);
      expect(result.success).toBe(true);
    }
  });
});
