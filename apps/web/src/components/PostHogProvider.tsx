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
    void initAnalytics().then(() => {
      // Apply existing consent if the user already accepted/rejected previously
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (consent === 'accepted') {
        void optInCapturing();
      } else if (consent === 'essential') {
        void optOutCapturing();
      }
      // If null (no choice yet), we stay opted out by default
    });
  }, []);

  // --- 2. Listen for consent changes via storage events + custom event ---
  useEffect(() => {
    // Handle cross-tab consent changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== COOKIE_CONSENT_KEY) return;
      if (e.newValue === 'accepted') void optInCapturing();
      else void optOutCapturing();
    };
    window.addEventListener('storage', handleStorage);

    // Handle same-tab consent changes via CustomEvent dispatched by CookieConsent
    const handleConsentChange = (e: Event) => {
      const consent = (e as CustomEvent).detail?.consent;
      if (consent === 'accepted') void optInCapturing();
      else if (consent === 'essential') void optOutCapturing();
    };
    window.addEventListener('cookie-consent-change', handleConsentChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cookie-consent-change', handleConsentChange);
    };
  }, []);

  // --- 3. Auth-driven identification ---
  useEffect(() => {
    if (user && user.id !== prevUserId.current) {
      void identifyUser(user.id, { email: user.email });
      prevUserId.current = user.id;
    }

    if (!user && prevUserId.current) {
      void resetAnalytics();
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
