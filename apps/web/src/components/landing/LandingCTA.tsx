import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { Sparkles, Check } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export function LandingCTA() {
  const { t } = useTranslation();
  const ctaRef = useScrollReveal<HTMLDivElement>();

  return (
    <section aria-label={t('landing.ctaSection')} className="py-12 sm:py-20 relative overflow-hidden grain-overlay">
      {/* Gradient mesh — inverted from hero (origin bottom) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgb(var(--color-primary-rgb)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgb(var(--color-primary-rgb)/0.10),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_40%,rgb(var(--color-primary-rgb)/0.05),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_20%_40%,rgb(var(--color-primary-rgb)/0.05),transparent)]" />
      <div className="glow-orb glow-orb-reverse w-64 h-64 bg-primary/20 dark:bg-primary/25 bottom-[-20%] left-[10%]" />
      <div className="glow-orb glow-orb-slow w-48 h-48 bg-[rgb(var(--accent-violet-rgb)/0.12)] dark:bg-[rgb(var(--accent-violet-rgb)/0.15)] top-[10%] right-[20%]" />

      <div ref={ctaRef} className="scroll-reveal container mx-auto px-4 sm:px-6 text-center relative max-w-2xl">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 sm:mb-4 font-display neon-text">
          {t('landing.ctaTitle')}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto">
          {t('landing.ctaSubtitle')}
        </p>
        <ul className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-8 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" aria-hidden="true" />{t('landing.ctaFeature1')}</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" aria-hidden="true" />{t('landing.ctaFeature2')}</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" aria-hidden="true" />{t('landing.ctaFeature3')}</li>
        </ul>
        <Link to="/register">
          <Button size="lg" className="px-6 sm:px-8 h-12 text-base btn-glow">
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            {t('landing.ctaCTA')}
          </Button>
        </Link>
      </div>
    </section>
  );
}
