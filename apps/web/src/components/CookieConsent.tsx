import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

type ConsentValue = 'accepted' | 'essential';

const STORAGE_KEY = 'cookie-consent';

function applySentryReplayPolicy(consent: ConsentValue) {
  if (consent === 'essential') {
    const replay = Sentry.getClient()?.getIntegrationByName?.('Replay');
    if (replay && 'stop' in replay && typeof replay.stop === 'function') {
      replay.stop();
    }
  }
}

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentValue | null;
    if (!stored) {
      setVisible(true);
    } else {
      applySentryReplayPolicy(stored);
    }
  }, []);

  const handleConsent = (value: ConsentValue) => {
    localStorage.setItem(STORAGE_KEY, value);
    applySentryReplayPolicy(value);
    trackEvent(value === 'accepted' ? 'cookie_consent_accepted' : 'cookie_consent_rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('components.cookieConsent.ariaLabel')}
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-4 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-card-foreground flex-1">
          {t('components.cookieConsent.message')}{' '}
          <a href="/privacy" className="underline text-primary">
            {t('components.cookieConsent.privacyLink')}
          </a>{' '}
          {t('components.cookieConsent.lgpdSuffix')}
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConsent('essential')}
          >
            {t('components.cookieConsent.essentialOnly')}
          </Button>
          <Button size="sm" onClick={() => handleConsent('accepted')}>
            {t('components.cookieConsent.acceptAll')}
          </Button>
        </div>
      </div>
    </div>
  );
}
