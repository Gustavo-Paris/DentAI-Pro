import { useTranslation } from 'react-i18next';
import { Camera, Smile, Layers, FileText } from 'lucide-react';
import { FeaturePreview } from '@/components/landing/FeaturePreview';
import { useScrollRevealChildren } from '@/hooks/useScrollReveal';

export function LandingFeatures() {
  const { t } = useTranslation();
  const featuresRef = useScrollRevealChildren<HTMLDivElement>();

  return (
    <section aria-label={t('landing.featuresTitle')} className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center mb-10 sm:mb-16 font-display neon-text">
          {t('landing.featuresTitle')}
        </h2>
        <div ref={featuresRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {([
            {
              icon: Camera,
              title: t('landing.featureAnalysis'),
              description: t('landing.featureAnalysisDesc'),
              preview: 'analysis' as const,
            },
            {
              icon: Smile,
              title: t('landing.featureDSD'),
              description: t('landing.featureDSDDesc'),
              preview: 'dsd' as const,
            },
            {
              icon: Layers,
              title: t('landing.featureProtocol'),
              description: t('landing.featureProtocolDesc'),
              preview: 'protocol' as const,
            },
            {
              icon: FileText,
              title: t('landing.featureReport'),
              description: t('landing.featureReportDesc'),
              preview: 'pdf' as const,
            },
          ]).map((feature, index) => (
            <div
              key={index}
              className={`scroll-reveal scroll-reveal-delay-${index + 1} text-left border border-border rounded-xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group dark:bg-gradient-to-br dark:from-card dark:to-card/80 glass-panel glow-card`}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/8 to-[rgb(var(--accent-violet-rgb)/0.06)] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 glow-icon">
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display font-medium text-sm sm:text-base mb-1 sm:mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
              <FeaturePreview type={feature.preview} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
