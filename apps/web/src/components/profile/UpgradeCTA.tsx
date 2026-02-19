import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
} from '@parisgroup-ai/pageshell/primitives';
import { Sparkles } from 'lucide-react';

export interface UpgradeCTAProps {
  isFree: boolean;
  isActive: boolean;
}

export function UpgradeCTA({ isFree, isActive }: UpgradeCTAProps) {
  const { t } = useTranslation();

  if (!isFree || isActive) return null;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{t('profile.unlockPotential')}</p>
            <p className="text-sm text-muted-foreground">
              {t('profile.unlockPotentialDescription')}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/pricing">{t('common.viewPlans')}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
