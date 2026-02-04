import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';

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
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-4 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-card-foreground flex-1">
          Utilizamos cookies essenciais para o funcionamento do site e cookies
          opcionais para monitoramento de erros (Sentry). Ao clicar em
          &ldquo;Aceitar todos&rdquo;, você consente com o uso de todos os
          cookies conforme a{' '}
          <a href="/privacy" className="underline text-primary">
            Política de Privacidade
          </a>{' '}
          e a LGPD (Lei 13.709/2018).
        </p>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConsent('essential')}
          >
            Apenas essenciais
          </Button>
          <Button size="sm" onClick={() => handleConsent('accepted')}>
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
