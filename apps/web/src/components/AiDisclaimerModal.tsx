import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield } from 'lucide-react';

const STORAGE_KEY = 'ai-disclaimer-accepted';

export function useAiDisclaimer() {
  const [accepted, setAccepted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  );

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setAccepted(true);
  };

  return { accepted, accept };
}

interface AiDisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
}

export function AiDisclaimerModal({ open, onAccept }: AiDisclaimerModalProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t('consent.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <p className="text-sm text-muted-foreground">{t('consent.intro')}</p>
          <ul className="text-sm space-y-2 list-disc pl-5 text-muted-foreground">
            <li>{t('consent.bullet1')}</li>
            <li>{t('consent.bullet2')}</li>
            <li>{t('consent.bullet3')}</li>
            <li>{t('consent.bullet4')}</li>
            <li>{t('consent.bullet5')}</li>
          </ul>
        </div>

        <div className="flex items-center gap-2 py-2">
          <Checkbox
            id="consent-check"
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
          />
          <label
            htmlFor="consent-check"
            className="text-sm font-medium cursor-pointer"
          >
            {t('consent.checkbox')}
          </label>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <p className="text-xs text-muted-foreground mr-auto">
            {t('consent.footer')}{' '}
            <a href="/privacy" className="underline text-primary">
              {t('landing.privacy')}
            </a>
            .
          </p>
          <Button onClick={onAccept} disabled={!checked}>
            {t('consent.accept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
