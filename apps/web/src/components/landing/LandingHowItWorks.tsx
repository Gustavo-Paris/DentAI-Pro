import { useTranslation } from 'react-i18next';
import { useScrollRevealChildren } from '@/hooks/useScrollReveal';

export function LandingHowItWorks() {
  const { t } = useTranslation();
  const howItWorksRef = useScrollRevealChildren<HTMLDivElement>();

  return (
    <section aria-label={t('landing.howItWorksTitle')} className="py-12 sm:py-20 bg-secondary/20 relative overflow-hidden section-glow-bg">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-10 sm:mb-16 font-display neon-text">
          {t('landing.howItWorksTitle')}
        </h2>
        <div ref={howItWorksRef} className="space-y-6 sm:space-y-8 timeline-line">
          {[
            {
              step: '01',
              title: t('landing.step1Title'),
              description: t('landing.step1Desc'),
            },
            {
              step: '02',
              title: t('landing.step2Title'),
              description: t('landing.step2Desc'),
            },
            {
              step: '03',
              title: t('landing.step3Title'),
              description: t('landing.step3Desc'),
            },
            {
              step: '04',
              title: t('landing.step4Title'),
              description: t('landing.step4Desc'),
            },
          ].map((item, index) => (
            <div key={index} className={`scroll-reveal scroll-reveal-delay-${index + 1} flex items-start gap-4 pl-14 sm:pl-16 relative`}>
              <div className="absolute left-[8px] sm:left-[12px] top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0 glow-icon">
                {index + 1}
              </div>
              <div>
                <h3 className="font-display font-medium text-sm sm:text-base mb-1">{item.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
