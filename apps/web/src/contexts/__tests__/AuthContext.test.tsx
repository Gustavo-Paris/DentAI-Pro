import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';

// --- Mock supabase client ---

let authStateCallback: (event: string, session: unknown) => void;

const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: {
    subscription: { unsubscribe: vi.fn() },
  },
}));
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      getUser: (...args: unknown[]) => mockGetUser(...args),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authStateCallback = cb;
        return mockOnAuthStateChange(cb);
      },
    },
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// --- Helper: test component that exposes useAuth ---

function AuthConsumer({ onRender }: { onRender: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onRender(auth);
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user">{auth.user ? auth.user.email : 'null'}</span>
      <span data-testid="session">{auth.session ? 'active' : 'null'}</span>
    </div>
  );
}

const fakeUser = {
  id: 'user-123',
  email: 'dentist@example.com',
  app_metadata: {},
  user_metadata: { full_name: 'Dr. Test' },
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
};

const fakeSession = {
  access_token: 'token-abc',
  refresh_token: 'refresh-xyz',
  expires_in: 3600,
  token_type: 'bearer',
  user: fakeUser,
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSignUp.mockResolvedValue({ data: {}, error: null });
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockInvoke.mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------
  // useAuth outside provider
  // ---------------------------------------------------------------

  describe('useAuth outside AuthProvider', () => {
    it('should throw when used outside AuthProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        render(<AuthConsumer onRender={() => {}} />);
      }).toThrow('useAuth must be used within an AuthProvider');
      spy.mockRestore();
    });
  });

  // ---------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------

  describe('initial state', () => {
    it('should start with loading=true, then resolve to loading=false with no user', async () => {
      const renders: Array<{ loading: boolean; user: unknown }> = [];

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={(auth) => renders.push({ loading: auth.loading, user: auth.user })} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      // After mount + getSession resolves, loading should be false
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should populate user/session when getSession returns existing session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      expect(screen.getByTestId('user').textContent).toBe('dentist@example.com');
      expect(screen.getByTestId('session').textContent).toBe('active');
    });

    it('should handle getSession error gracefully', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('session').textContent).toBe('null');
    });
  });

  // ---------------------------------------------------------------
  // Sign in with email/password
  // ---------------------------------------------------------------

  describe('signIn', () => {
    it('should call supabase.auth.signInWithPassword and return no error on success', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

      let authRef: ReturnType<typeof useAuth> | undefined;

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={(auth) => { authRef = auth; }} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => expect(authRef).toBeDefined());

      let result: { error: unknown } | undefined;
      await act(async () => {
        result = await authRef!.signIn('user@test.com', 'password123');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'password123',
      });
      expect(result!.error).toBeNull();
    });

    it('should return error on invalid credentials', async () => {
      const authError = { message: 'Invalid login credentials', status: 400 };
      mockSignInWithPassword.mockResolvedValue({ data: {}, error: authError });

      let authRef: ReturnType<typeof useAuth> | undefined;

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={(auth) => { authRef = auth; }} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => expect(authRef).toBeDefined());

      let result: { error: unknown } | undefined;
      await act(async () => {
        result = await authRef!.signIn('bad@test.com', 'wrong');
      });

      expect(result!.error).toEqual(authError);
    });
  });

  // ---------------------------------------------------------------
  // Sign in with Google OAuth
  // ---------------------------------------------------------------

  describe('signInWithGoogle', () => {
    it('should call supabase.auth.signInWithOAuth with google provider', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

      let authRef: ReturnType<typeof useAuth> | undefined;

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={(auth) => { authRef = auth; }} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => expect(authRef).toBeDefined());

      let result: { error: unknown } | undefined;
      await act(async () => {
        result = await authRef!.signInWithGoogle();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/dashboard'),
        },
      });
      expect(result!.error).toBeNull();
    });

    it('should return error on OAuth failure', async () => {
      const authError = { message: 'OAuth error', status: 500 };
      mockSignInWithOAuth.mockResolvedValue({ data: {}, error: authError });

      let authRef: ReturnType<typeof useAuth> | undefined;

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={(auth) => { authRef = auth; }} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => expect(authRef).toBeDefined());

      let result: { error: unknown } | undefined;
      await act(async () => {
        result = await authRef!.signInWithGoogle();
      });

      expect(result!.error).toEqual(authError);
    });
  });

  // ---------------------------------------------------------------
  // Sign up
  // ---------------------------------------------------------------

  describe('signUp', () => {
    it('should call supabase.auth.signUp with user data and send welcome email', async () => {
      mockSignUp.mockResolvedValue({ data: {}, error: null });

      let authRef: ReturnType<typeof useAuth> | undefined;

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={(auth) => { authRef = auth; }} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => expect(authRef).toBeDefined());

      let result: { error: unknown } | undefined;
      await act(async () => {
        result = await authRef!.signUp('new@test.com', 'pass123', 'Dr. New User', 'CRO-12345');
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'pass123',
        options: {
          emailRedirectTo: expect.any(String),
          data: {
            full_name: 'Dr. New User',
            cro: 'CRO-12345',
          },
        },
      });
      expect(result!.error).toBeNull();
      // Welcome email fire-and-forget
      expect(mockInvoke).toHaveBeenCalledWith('send-email', { body: { template: 'welcome' } });
    });

    it('should pass cro as null when not provided', async () => {
      mockSignUp.mockResolvedValue({ data: {}, error: null });

      let authRef: ReturnType<typeof useAuth> | undefined;

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={(auth) => { authRef = auth; }} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => expect(authRef).toBeDefined());

      await act(async () => {
        await authRef!.signUp('new@test.com', 'pass123', 'User Without CRO');
      });

      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({
            data: expect.objectContaining({ cro: null }),
          }),
        }),
      );
    });

    it('should not send welcome email on signUp error', async () => {
      const authError = { message: 'Email taken', status: 422 };
      mockSignUp.mockResolvedValue({ data: {}, error: authError });

      let authRef: ReturnType<typeof useAuth> | undefined;

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={(auth) => { authRef = auth; }} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => expect(authRef).toBeDefined());

      let result: { error: unknown } | undefined;
      await act(async () => {
        result = await authRef!.signUp('taken@test.com', 'pass', 'Name');
      });

      expect(result!.error).toEqual(authError);
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------

  describe('signOut', () => {
    it('should call supabase.auth.signOut', async () => {
      mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

      let authRef: ReturnType<typeof useAuth> | undefined;

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={(auth) => { authRef = auth; }} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => expect(authRef).toBeDefined());

      await act(async () => {
        await authRef!.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------
  // Auth state change listener
  // ---------------------------------------------------------------

  describe('onAuthStateChange listener', () => {
    it('should subscribe on mount and unsubscribe on unmount', async () => {
      const { unmount } = await act(async () =>
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        ),
      );

      expect(mockOnAuthStateChange).toHaveBeenCalled();

      const unsubscribe = mockOnAuthStateChange.mock.results[0].value.data.subscription.unsubscribe;
      unmount();
      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should update user/session on SIGNED_IN event', async () => {
      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Simulate SIGNED_IN auth state change
      await act(async () => {
        authStateCallback('SIGNED_IN', fakeSession);
      });

      expect(screen.getByTestId('user').textContent).toBe('dentist@example.com');
      expect(screen.getByTestId('session').textContent).toBe('active');
    });

    it('should clear user/session on SIGNED_OUT event', async () => {
      mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('dentist@example.com');
      });

      // Simulate SIGNED_OUT
      await act(async () => {
        authStateCallback('SIGNED_OUT', null);
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('session').textContent).toBe('null');
    });

    it('should update session on TOKEN_REFRESHED event', async () => {
      mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('session').textContent).toBe('active');
      });

      const refreshedSession = {
        ...fakeSession,
        access_token: 'refreshed-token',
        user: { ...fakeUser, email: 'refreshed@example.com' },
      };

      await act(async () => {
        authStateCallback('TOKEN_REFRESHED', refreshedSession);
      });

      expect(screen.getByTestId('user').textContent).toBe('refreshed@example.com');
    });
  });

  // ---------------------------------------------------------------
  // Idle timeout
  // ---------------------------------------------------------------

  describe('idle timeout', () => {
    it('should sign out after 30 minutes of inactivity when session is active', async () => {
      mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('session').textContent).toBe('active');
      });

      // Advance time by 30 minutes
      await act(async () => {
        vi.advanceTimersByTime(30 * 60 * 1000);
      });

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should reset idle timer on user activity', async () => {
      mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('session').textContent).toBe('active');
      });

      // Advance 20 minutes
      await act(async () => {
        vi.advanceTimersByTime(20 * 60 * 1000);
      });

      // Simulate user activity (mousedown resets timer)
      await act(async () => {
        document.dispatchEvent(new MouseEvent('mousedown'));
      });

      // Advance another 20 minutes (total 40 from start, but only 20 from last activity)
      await act(async () => {
        vi.advanceTimersByTime(20 * 60 * 1000);
      });

      // Should NOT have signed out yet (only 20 min since activity)
      expect(mockSignOut).not.toHaveBeenCalled();

      // Advance remaining 10 minutes to hit the 30 min mark from last activity
      await act(async () => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should not set idle timer when there is no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      await act(async () => {
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Advance past idle timeout
      await act(async () => {
        vi.advanceTimersByTime(31 * 60 * 1000);
      });

      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should clean up event listeners and timer on unmount', async () => {
      mockGetSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = await act(async () =>
        render(
          <MemoryRouter>
            <AuthProvider>
              <AuthConsumer onRender={() => {}} />
            </AuthProvider>
          </MemoryRouter>,
        ),
      );

      await waitFor(() => {
        expect(screen.getByTestId('session').textContent).toBe('active');
      });

      unmount();

      const removedEvents = removeEventListenerSpy.mock.calls.map(([event]) => event);
      expect(removedEvents).toContain('mousedown');
      expect(removedEvents).toContain('keydown');
      expect(removedEvents).toContain('scroll');
      expect(removedEvents).toContain('touchstart');

      removeEventListenerSpy.mockRestore();
    });
  });
});
