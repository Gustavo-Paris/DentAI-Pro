import { Button } from '@parisgroup-ai/pageshell/primitives';
import { Sparkles, ArrowRight, Sun, Zap, Star, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';
import type { WhiteningLevel, PatientPreferences } from '@/types/dsd';

// Re-export for backward compatibility
export type { WhiteningLevel, PatientPreferences };

interface PatientPreferencesStepProps {
  preferences: PatientPreferences;
  onPreferencesChange: (preferences: PatientPreferences) => void;
  onContinue: () => void;
}

/** Shade swatch colors for the gradient strip and before/after indicators */
const SHADE_COLORS = {
  natural: {
    gradientFrom: '#F5E6D3', // warm ivory (A2)
    gradientTo: '#F0EDE8',   // clean white (B1)
    before: '#E8D5B8',       // yellowish (current teeth)
    after: '#F0EDE8',        // B1 target
  },
  hollywood: {
    gradientFrom: '#F0EDE8', // clean white (B1)
    gradientTo: '#FAFAFA',   // bright bleach white (BL1)
    before: '#E8D5B8',       // yellowish (current teeth)
    after: '#FAFAFA',        // BL1 target
  },
} as const;

const WHITENING_OPTIONS: {
  value: WhiteningLevel;
  labelKey: string;
  descKey: string;
  shade: string;
  shadeLabel: string;
  icon: typeof Sun;
}[] = [
  {
    value: 'natural',
    labelKey: 'components.wizard.preferences.naturalLabel',
    descKey: 'components.wizard.preferences.naturalDesc',
    shade: 'B1',
    shadeLabel: 'Alvo: B1 / A1 (clareamento profissional)',
    icon: Sun,
  },
  {
    value: 'hollywood',
    labelKey: 'components.wizard.preferences.hollywoodLabel',
    descKey: 'components.wizard.preferences.hollywoodDesc',
    shade: 'BL1 / BL2 / BL3',
    shadeLabel: 'Alvo: BL1 / BL3 (ultra branco)',
    icon: Star,
  },
];

export function PatientPreferencesStep({
  preferences,
  onPreferencesChange,
  onContinue,
}: PatientPreferencesStepProps) {
  const { t } = useTranslation();
  const { creditsRemaining, getCreditCost } = useSubscription();
  const totalCost = getCreditCost('case_analysis') + getCreditCost('dsd_simulation');
  const hasEnoughCredits = creditsRemaining >= totalCost;

  const handleSelect = (level: WhiteningLevel) => {
    onPreferencesChange({ whiteningLevel: level });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 glow-icon">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold font-display mb-2 neon-text">{t('components.wizard.preferences.title')}</h2>
        <p className="text-muted-foreground text-base">
          {t('components.wizard.preferences.subtitle')}
        </p>
      </div>

      {/* Whitening Level Cards with Color Swatches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label={t('components.wizard.preferences.title')}>
            {WHITENING_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = preferences.whiteningLevel === option.value;
              const colors = SHADE_COLORS[option.value];

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={t(option.labelKey)}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'relative flex flex-col items-stretch rounded-xl border-2 transition-all duration-200 overflow-hidden btn-press cursor-pointer',
                    'glow-card hover:border-primary/50 hover:bg-primary/5',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isSelected
                      ? 'ai-shimmer-border shadow-md'
                      : 'border-border bg-card'
                  )}
                >
                  {/* Shade gradient swatch strip at top */}
                  <div
                    className="w-full h-3 transition-opacity duration-200"
                    style={{
                      background: `linear-gradient(to right, ${colors.gradientFrom}, ${colors.gradientTo})`,
                      opacity: isSelected ? 1 : 0.7,
                    }}
                  />

                  <div className="p-4 flex flex-col items-center">
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-4 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-scale-in">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}

                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors',
                      isSelected ? 'bg-primary text-primary-foreground glow-icon' : 'bg-muted text-muted-foreground'
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Label */}
                    <h3 className={cn(
                      'font-semibold text-base mb-1',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}>
                      {t(option.labelKey)}
                    </h3>

                    {/* Before/After tooth color indicators */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {t('components.wizard.preferences.shadeBeforeLabel', { defaultValue: 'Antes' })}
                        </span>
                        <div
                          className="w-5 h-5 rounded-full border border-border/60 shadow-sm"
                          style={{ backgroundColor: colors.before }}
                          aria-hidden="true"
                        />
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
                      <div className="flex items-center gap-1">
                        <div
                          className="w-5 h-5 rounded-full border border-border/60 shadow-sm"
                          style={{ backgroundColor: colors.after }}
                          aria-hidden="true"
                        />
                        <span className="text-xs text-muted-foreground">
                          {t('components.wizard.preferences.shadeAfterLabel', { defaultValue: 'Depois' })}
                        </span>
                      </div>
                    </div>

                    {/* Shade badge */}
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full mb-1',
                      isSelected
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {option.shade}
                    </span>

                    {/* Shade target label */}
                    <p className="text-xs text-muted-foreground mb-2">
                      {t(`components.wizard.preferences.shadeTarget_${option.value}`, { defaultValue: option.shadeLabel })}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground text-center mb-3">
                      {t(option.descKey)}
                    </p>

                    {/* Per-card credit cost */}
                    <div className="flex items-center gap-1 text-xs">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-muted-foreground">
                        {option.value === 'natural'
                          ? t('components.wizard.preferences.noExtraCredits')
                          : t('components.wizard.preferences.extraCredits')}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Credit cost disclosure — Premium */}
          <div className="rounded-lg p-3 bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span>
                {t('components.wizard.preferences.creditCostText')}{' '}
                <strong className="text-primary font-bold">{totalCost} {t('common.credits')}</strong>{' '}
                {t('components.wizard.preferences.creditCostSuffix')}
              </span>
            </div>
            {!hasEnoughCredits && (
              <div className="flex items-center gap-2 mt-2 text-sm text-warning">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('components.wizard.preferences.insufficientCredits', { count: creditsRemaining })}</span>
              </div>
            )}
          </div>

          {/* Continue button — centered, gold glow */}
          <div className="pt-2 flex justify-center">
            <Button
              onClick={onContinue}
              disabled={creditsRemaining === 0}
              className="w-full sm:w-auto gap-2 btn-glow btn-press font-semibold group"
              size="lg"
            >
              {t('components.wizard.preferences.continueSimulation')}
              <span className="inline-flex items-center gap-0.5 text-xs opacity-80 ml-1">
                <Zap className="w-3 h-3" />{totalCost}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
    </div>
  );
}
