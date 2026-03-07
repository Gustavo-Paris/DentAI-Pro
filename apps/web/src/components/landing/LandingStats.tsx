import { useTranslation } from 'react-i18next';
import { useScrollRevealChildren } from '@/hooks/useScrollReveal';

export function LandingStats() {
  const { t } = useTranslation();
  const statsRef = useScrollRevealChildren<HTMLDivElement>();

  return (
    <section aria-label={t('landing.statsSection')} className="py-10 sm:py-14 bg-gradient-to-b from-secondary/40 to-secondary/10 relative overflow-hidden">
      <div className="absolute inset-0 ai-grid-pattern opacity-20" />
      <div className="container mx-auto px-4 sm:px-6">
        <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { value: '<2min', label: t('landing.statsFirstResult') },
            { value: '6', label: t('landing.statsTreatmentTypes') },
            { value: '15+', label: t('landing.statsResinBrands') },
            { value: '250+', label: t('landing.statsVitaColors') },
          ].map((stat, i) => (
            <div
              key={i}
              className={`scroll-reveal scroll-reveal-delay-${i + 1} ${i > 0 ? 'sm:border-l sm:border-primary/30' : ''}`}
            >
              <p className="text-4xl sm:text-5xl md:text-6xl font-semibold font-display text-primary glow-stat">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
