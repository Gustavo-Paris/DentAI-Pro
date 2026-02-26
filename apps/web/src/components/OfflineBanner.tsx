import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      // Just came back online — show brief announcement
      wasOfflineRef.current = false;
      setShowBackOnline(true);
      const timer = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showBackOnline) return null;

  if (isOnline && showBackOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 inset-x-0 z-[70] bg-success text-success-foreground text-center text-sm py-2 px-4 flex items-center justify-center gap-2"
      >
        <Wifi className="w-4 h-4 shrink-0" />
        <span>{t('components.offlineBanner.backOnline')}</span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[70] bg-destructive text-destructive-foreground text-center text-sm py-2 px-4 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{t('components.offlineBanner.message')}</span>
    </div>
  );
}
