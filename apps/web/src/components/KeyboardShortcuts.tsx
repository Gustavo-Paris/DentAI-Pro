import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);
const MOD = isMac ? '⌘' : 'Ctrl';

const SHORTCUT_KEYS = [
  { keys: `${MOD} + K`, descKey: 'components.keyboard.globalSearch' },
  { keys: `${MOD} + N`, descKey: 'components.keyboard.newCase' },
  { keys: `?`, descKey: 'components.keyboard.keyboardShortcuts' },
] as const;

export function KeyboardShortcuts() {
  const { t } = useTranslation();
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // ? — show shortcuts overlay
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowOverlay((prev) => !prev);
        return;
      }

      // Cmd+N — new case (only when authenticated)
      if (e.key === 'n' && (e.metaKey || e.ctrlKey) && user) {
        // Don't override if already on new-case
        if (location.pathname === '/new-case') return;
        e.preventDefault();
        navigate('/new-case');
        return;
      }
    },
    [user, location.pathname, navigate],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={showOverlay} onOpenChange={setShowOverlay}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            {t('components.keyboard.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {SHORTCUT_KEYS.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between py-2 px-1"
            >
              <span className="text-sm text-muted-foreground">{t(shortcut.descKey)}</span>
              <kbd className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
