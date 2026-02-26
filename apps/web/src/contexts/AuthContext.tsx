/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session, AuthError } from '@supabase/supabase-js';
import * as Sentry from '@sentry/react';
import { supabase } from '@/data';
import { logger } from '@/lib/logger';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, cro?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      Sentry.setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);

      // When Supabase fires PASSWORD_RECOVERY (user clicked reset link in email),
      // redirect to /reset-password if not already there. This handles the case
      // where Supabase redirects to site_url (/) instead of the redirectTo URL.
      if (event === 'PASSWORD_RECOVERY' && session) {
        if (window.location.pathname !== '/reset-password') {
          navigate('/reset-password');
        }
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      Sentry.setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setLoading(false);
    }).catch((error) => {
      logger.error('Failed to get auth session:', error);
      setSession(null);
      setUser(null);
      Sentry.setUser(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Idle timeout — sign out after 30 minutes of inactivity
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!session) return;
    idleTimerRef.current = setTimeout(() => {
      logger.log('Session expired due to inactivity');
      supabase.auth.signOut();
    }, IDLE_TIMEOUT_MS);
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => document.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((e) => document.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [session, resetIdleTimer]);

  const signUp = async (email: string, password: string, fullName: string, cro?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          cro: cro || null,
        },
      },
    });

    // Fire-and-forget: send welcome email without blocking the UX
    if (!error) {
      supabase.functions.invoke('send-email', {
        body: { template: 'welcome' },
      }).catch((err) => logger.error('Welcome email failed (non-blocking):', err));

      // Fire-and-forget: apply referral code if one was stored from landing page
      const stored = localStorage.getItem('referral_code');
      if (stored) {
        try {
          // Support both new JSON format and legacy plain string
          const parsed = stored.startsWith('{') ? JSON.parse(stored) : { code: stored, ts: 0 };
          const REFERRAL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
          if (parsed.ts === 0 || Date.now() - parsed.ts < REFERRAL_TTL_MS) {
            // Wait for auth state to propagate before invoking the edge function
            setTimeout(() => {
              supabase.functions.invoke('apply-referral', {
                body: { referralCode: parsed.code },
              })
                .then(() => localStorage.removeItem('referral_code'))
                .catch((err) => logger.error('Referral code application failed (non-blocking):', err));
            }, 2000);
          } else {
            localStorage.removeItem('referral_code');
          }
        } catch (error) {
          logger.error('Failed to parse referral code from localStorage:', error);
          localStorage.removeItem('referral_code');
        }
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error: error as AuthError | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
