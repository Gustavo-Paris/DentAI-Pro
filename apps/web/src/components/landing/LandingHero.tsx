import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge } from '@parisgroup-ai/pageshell/primitives';
import { Sparkles } from 'lucide-react';
import { HeroMockup } from '@/components/landing/HeroMockup';

export function LandingHero() {
  const { t } = useTranslation();

  return (
    <section aria-label={t('landing.heroSection')} className="py-16 sm:py-24 md:py-28 relative overflow-hidden grain-overlay">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgb(var(--color-primary-rgb)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgb(var(--color-primary-rgb)/0.10),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgb(var(--color-primary-rgb)/0.05),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgb(var(--color-primary-rgb)/0.05),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_20%_80%,rgb(var(--color-primary-rgb)/0.03),transparent)] dark:bg-[radial-gradient(ellipse_50%_50%_at_20%_80%,rgb(var(--color-primary-rgb)/0.03),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_1px_at_20px_20px,rgb(var(--color-primary-rgb)/0.05)_1px,transparent_0)] dark:bg-[radial-gradient(circle_1px_at_20px_20px,rgb(var(--color-primary-rgb)/0.03)_1px,transparent_0)] bg-[length:40px_40px]" />
      {/* AI tech grid */}
      <div className="absolute inset-0 ai-grid-pattern opacity-40 dark:opacity-60" style={{ maskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black 20%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black 20%, transparent 70%)' }} />
      {/* Floating glow orbs */}
      <div className="glow-orb w-72 h-72 bg-primary/20 dark:bg-primary/30 top-[-10%] left-[15%]" />
      <div className="glow-orb glow-orb-slow glow-orb-reverse w-96 h-96 bg-[rgb(var(--accent-violet-rgb)/0.12)] dark:bg-[rgb(var(--accent-violet-rgb)/0.15)] top-[20%] right-[-5%]" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Left column — text */}
          <div className="text-center lg:text-left">
            <Badge
              variant="secondary"
              className="mb-6 glow-badge"
              style={{ animation: 'badge-pulse-ring 3s ease-in-out infinite, fade-in-up 0.6s ease-out 0.2s both' }}
            >
              <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
              {t('landing.heroTagline')}
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight mb-4 sm:mb-6 font-display animate-[fade-in-up_0.6s_ease-out_0.4s_both] neon-text">
              {t('landing.heroTitlePre')} <span className="text-gradient-brand">{t('landing.heroTitleHighlight')}</span> {t('landing.heroTitlePost')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-xl mx-auto lg:mx-0 animate-[fade-in-up_0.6s_ease-out_0.6s_both]">
              {t('landing.heroSubtitle')}
            </p>
            <div className="animate-[fade-in-up_0.6s_ease-out_0.8s_both] flex flex-col items-center lg:items-start gap-2">
              <Link to="/register">
                <Button size="lg" className="px-6 sm:px-8 h-12 text-base btn-glow">
                  {t('landing.heroCTA')}
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">{t('landing.heroNoCreditCard')}</p>
            </div>
          </div>

          {/* Right column — device mockup */}
          <div className="hidden lg:block">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
