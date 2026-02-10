import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  initAnalytics,
  identifyUser,
  resetAnalytics,
  trackEvent,
  optInCapturing,
  optOutCapturing,
} from '@/lib/analytics';

/** localStorage key used by CookieConsent component */
const COOKIE_CONSENT_KEY = 'cookie-consent';

/**
 * Non-visual wrapper that wires PostHog to:
 * 1. Cookie consent state (LGPD opt-in / opt-out)
 * 2. Auth state (identify / reset)
 * 3. Route changes (pageview tracking)
 */
export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const location = useLocation();
  const prevUserId = useRef<string | null>(null);

  // --- 1. Initialise PostHog on mount ---
  useEffect(() => {
    initAnalytics();

    // Apply existing consent if the user already accepted/rejected previously
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === 'accepted') {
      optInCapturing();
    } else if (consent === 'essential') {
      optOutCapturing();
    }
    // If null (no choice yet), we stay opted out by default
  }, []);

  // --- 2. Listen for consent changes via storage events + polling ---
  useEffect(() => {
    // Handle cross-tab consent changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== COOKIE_CONSENT_KEY) return;
      if (e.newValue === 'accepted') optInCapturing();
      else optOutCapturing();
    };
    window.addEventListener('storage', handleStorage);

    // Poll for same-tab consent changes (CookieConsent sets localStorage
    // synchronously and does not emit a custom event)
    const interval = setInterval(() => {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (consent === 'accepted') optInCapturing();
      else if (consent === 'essential') optOutCapturing();
    }, 2_000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // --- 3. Auth-driven identification ---
  useEffect(() => {
    if (user && user.id !== prevUserId.current) {
      identifyUser(user.id, { email: user.email });
      prevUserId.current = user.id;
    }

    if (!user && prevUserId.current) {
      resetAnalytics();
      prevUserId.current = null;
    }
  }, [user]);

  // --- 4. Pageview tracking on route changes ---
  useEffect(() => {
    trackEvent('$pageview', {
      $current_url: window.location.href,
      path: location.pathname,
    });
  }, [location.pathname, location.search]);

  return <>{children}</>;
}
