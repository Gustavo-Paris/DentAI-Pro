import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetPasswordForEmail,
  updateUserPassword,
  getSession,
  onAuthStateChange,
} from '../auth';

const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('../client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
      getSession: (...args: any[]) => mockGetSession(...args),
      onAuthStateChange: (...args: any[]) => mockOnAuthStateChange(...args),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resetPasswordForEmail', () => {
  it('should call supabase with email and redirectTo', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const result = await resetPasswordForEmail('user@test.com', 'https://example.com/reset');

    expect(result).toEqual({ error: null });
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@test.com', {
      redirectTo: 'https://example.com/reset',
    });
  });

  it('should return error when reset fails', async () => {
    const error = new Error('Invalid email');
    mockResetPasswordForEmail.mockResolvedValue({ error });

    const result = await resetPasswordForEmail('bad@test.com', 'https://example.com');

    expect(result.error).toBe(error);
  });
});

describe('updateUserPassword', () => {
  it('should call supabase updateUser with password', async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    const result = await updateUserPassword('new-password-123');

    expect(result).toEqual({ error: null });
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'new-password-123' });
  });

  it('should return error when password update fails', async () => {
    const error = new Error('Weak password');
    mockUpdateUser.mockResolvedValue({ error });

    const result = await updateUserPassword('123');

    expect(result.error).toBe(error);
  });
});

describe('getSession', () => {
  it('should return session data', async () => {
    const sessionData = { data: { session: { user: { id: 'u1' } } }, error: null };
    mockGetSession.mockResolvedValue(sessionData);

    const result = await getSession();

    expect(result).toEqual(sessionData);
  });
});

describe('onAuthStateChange', () => {
  it('should register callback and return subscription', () => {
    const unsubscribe = { data: { subscription: { unsubscribe: vi.fn() } } };
    mockOnAuthStateChange.mockReturnValue(unsubscribe);

    const callback = vi.fn();
    const result = onAuthStateChange(callback);

    expect(result).toBe(unsubscribe);
    expect(mockOnAuthStateChange).toHaveBeenCalledWith(callback);
  });
});
