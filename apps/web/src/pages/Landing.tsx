import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@parisgroup-ai/pageshell/primitives';
import { Sparkles, Camera, Smile, Layers, FileText, Star, Check, Zap, Users, RefreshCw } from 'lucide-react';
import { BRAND_NAME } from '@/lib/branding';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HeroMockup } from '@/components/landing/HeroMockup';
import { FeaturePreview } from '@/components/landing/FeaturePreview';
import { useLandingPlans } from '@/hooks/useLandingPlans';
import { formatPrice } from '@/hooks/useSubscription';
import { getInitials } from '@/lib/utils';
import { useScrollReveal, useScrollRevealChildren } from '@/hooks/useScrollReveal';

export default function Landing() {
  const { t } = useTranslation();
  useDocumentTitle('');
  const [searchParams] = useSearchParams();

  // Capture referral code from URL and store in localStorage
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && /^[A-Z0-9-]{4,20}$/i.test(ref)) {
      localStorage.setItem('referral_code', JSON.stringify({ code: ref, ts: Date.now() }));
    }
  }, [searchParams]);

  const statsRef = useScrollRevealChildren<HTMLDivElement>();
  const featuresRef = useScrollRevealChildren<HTMLDivElement>();
  const testimonialsRef = useScrollRevealChildren<HTMLDivElement>();
  const howItWorksRef = useScrollRevealChildren<HTMLDivElement>();
  const ctaRef = useScrollReveal<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50 glass-nav">
        <nav className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between" aria-label="Main">
          <span className="text-lg sm:text-xl font-semibold tracking-[0.2em] font-display text-gradient-brand">{BRAND_NAME}</span>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="min-h-11">{t('landing.login')}</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="min-h-11">{t('landing.start')}</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content">
      {/* Hero */}
      <section aria-label={t('landing.heroSection', { defaultValue: 'Hero' })} className="py-20 sm:py-28 md:py-36 relative overflow-hidden grain-overlay">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgb(var(--color-primary-rgb)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgb(var(--color-primary-rgb)/0.10),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgb(var(--color-primary-rgb)/0.05),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgb(var(--color-primary-rgb)/0.05),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_20%_80%,rgb(var(--color-primary-rgb)/0.03),transparent)] dark:bg-[radial-gradient(ellipse_50%_50%_at_20%_80%,rgb(var(--color-primary-rgb)/0.03),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_1px_at_20px_20px,rgb(var(--color-primary-rgb)/0.05)_1px,transparent_0)] dark:bg-[radial-gradient(circle_1px_at_20px_20px,rgb(var(--color-primary-rgb)/0.03)_1px,transparent_0)] bg-[length:40px_40px]" />
        {/* AI tech grid */}
        <div className="absolute inset-0 ai-grid-pattern opacity-40 dark:opacity-60" style={{ maskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black 20%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black 20%, transparent 70%)' }} />
        {/* Floating glow orbs */}
        <div className="glow-orb w-72 h-72 bg-primary/20 dark:bg-primary/30 top-[-10%] left-[15%]" />
        <div className="glow-orb glow-orb-slow glow-orb-reverse w-96 h-96 bg-accent/15 dark:bg-accent/20 top-[20%] right-[-5%]" />

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
                  <Button size="lg" className="px-6 sm:px-8 h-12 text-base btn-glow-gold">
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

      {/* Stats */}
      <section aria-label={t('landing.statsSection', { defaultValue: 'Estatisticas' })} className="py-10 sm:py-14 bg-gradient-to-b from-secondary/40 to-secondary/10 relative overflow-hidden">
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
                className={`scroll-reveal scroll-reveal-delay-${i + 1} ${i > 0 ? 'sm:border-l sm:border-primary/20' : ''}`}
              >
                <p className="text-4xl sm:text-5xl md:text-6xl font-semibold font-display text-primary glow-stat">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
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
                className={`scroll-reveal scroll-reveal-delay-${index + 1} text-left border border-border rounded-xl p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md group dark:bg-gradient-to-br dark:from-card dark:to-card/80 glow-card`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 glow-icon">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                <FeaturePreview type={feature.preview} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section aria-label={t('landing.testimonialsTitle')} className="py-16 sm:py-24 bg-secondary/20 relative overflow-hidden section-glow-bg">
        <div className="glow-orb glow-orb-slow w-56 h-56 bg-primary/10 dark:bg-primary/15 top-[-15%] right-[-5%]" />
        <div className="glow-orb glow-orb-reverse w-40 h-40 bg-accent/8 dark:bg-accent/10 bottom-[10%] left-[-8%]" />
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-10 sm:mb-16 font-display neon-text">
            {t('landing.testimonialsTitle')}
          </h2>
          <div ref={testimonialsRef} className="grid md:grid-cols-2 gap-6">
            {/* Gradient colors are intentional brand accent colors — each testimonial gets a distinct hue for visual variety */}
            {[
              {
                quote: t('landing.testimonial1Quote'),
                author: t('landing.testimonial1Author'),
                role: t('landing.testimonial1Role'),
                clinic: t('landing.testimonial1Clinic'),
                rating: 5,
                gradient: 'from-primary/20 to-primary/5',
                highlight: t('landing.testimonial1Highlight'),
              },
              {
                quote: t('landing.testimonial2Quote'),
                author: t('landing.testimonial2Author'),
                role: t('landing.testimonial2Role'),
                clinic: t('landing.testimonial2Clinic'),
                rating: 5,
                gradient: 'from-[rgb(var(--accent-violet-rgb)/0.2)] to-[rgb(var(--accent-violet-rgb)/0.05)]',
                highlight: null,
              },
              {
                quote: t('landing.testimonial3Quote'),
                author: t('landing.testimonial3Author'),
                role: t('landing.testimonial3Role'),
                clinic: t('landing.testimonial3Clinic'),
                rating: 4,
                gradient: 'from-[rgb(var(--accent-emerald-rgb)/0.2)] to-[rgb(var(--accent-emerald-rgb)/0.05)]',
                highlight: null,
              },
              {
                quote: t('landing.testimonial4Quote'),
                author: t('landing.testimonial4Author'),
                role: t('landing.testimonial4Role'),
                clinic: t('landing.testimonial4Clinic'),
                rating: 5,
                gradient: 'from-[rgb(var(--accent-amber-rgb)/0.2)] to-[rgb(var(--accent-amber-rgb)/0.05)]',
                highlight: null,
              }
            ].map((testimonial, i) => (
              <div
                key={i}
                className={`scroll-reveal scroll-reveal-delay-${i + 1} relative bg-background rounded-xl p-6 border border-border/50 border-l-4 border-l-primary/40 glow-card`}
              >
                <span className="absolute top-2 right-4 text-7xl leading-none font-serif text-primary/[0.05] select-none" aria-hidden="true">&ldquo;</span>
                {testimonial.highlight && (
                  <Badge variant="secondary" className="mb-3 text-xs">
                    <Zap className="w-3 h-3 mr-1" aria-hidden="true" />
                    {testimonial.highlight}
                  </Badge>
                )}
                <div className="flex gap-1 mb-3" aria-label={t('landing.starRating', { rating: testimonial.rating, defaultValue: `${testimonial.rating} de 5 estrelas` })}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      aria-hidden="true"
                      className={`w-4 h-4 ${j < testimonial.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-primary font-semibold text-sm shrink-0`}>
                    {getInitials(testimonial.author)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-muted-foreground/70">{testimonial.clinic}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — Timeline */}
      <section aria-label={t('landing.howItWorksTitle')} className="py-12 sm:py-20 bg-background relative overflow-hidden section-glow-bg">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-10 sm:mb-16 font-display neon-text">
            {t('landing.howItWorksTitle')}
          </h2>
          <div ref={howItWorksRef} className="space-y-8 sm:space-y-12 timeline-line">
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
              <div key={index} className={`scroll-reveal scroll-reveal-delay-${index + 1} flex items-start gap-4 pl-12 sm:pl-16 relative`}>
                <div className="absolute left-[12px] sm:left-[16px] top-0 w-[18px] h-[18px] sm:w-[18px] sm:h-[18px] rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0 glow-icon">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-medium text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-label={t('landing.faqTitle')} className="py-12 sm:py-20 bg-secondary/20 relative overflow-hidden section-glow-bg">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8 sm:mb-12 font-display neon-text">
            {t('landing.faqTitle')}
          </h2>
          <Accordion type="single" collapsible className="w-full glass-panel rounded-xl p-1">
            <AccordionItem value="item-1">
              <AccordionTrigger>{t('landing.faq1Q')}</AccordionTrigger>
              <AccordionContent>
                {t('landing.faq1A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>{t('landing.faq2Q')}</AccordionTrigger>
              <AccordionContent>
                {t('landing.faq2A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>{t('landing.faq3Q')}</AccordionTrigger>
              <AccordionContent>
                {t('landing.faq3A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>{t('landing.faq4Q')}</AccordionTrigger>
              <AccordionContent>
                {t('landing.faq4A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>{t('landing.faq5Q')}</AccordionTrigger>
              <AccordionContent>
                {t('landing.faq5A')}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>{t('landing.faq6Q')}</AccordionTrigger>
              <AccordionContent>
                {t('landing.faq6A', { brandName: BRAND_NAME })}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>{t('landing.faq7Q')}</AccordionTrigger>
              <AccordionContent>
                {t('landing.faq7A', { brandName: BRAND_NAME })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Pricing */}
      <LandingPricing />

      {/* CTA */}
      <section aria-label={t('landing.ctaSection', { defaultValue: 'Comece agora' })} className="py-12 sm:py-20 relative overflow-hidden grain-overlay">
        {/* Gradient mesh — inverted from hero (origin bottom) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgb(var(--color-primary-rgb)/0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgb(var(--color-primary-rgb)/0.10),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_40%,rgb(var(--color-primary-rgb)/0.05),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_20%_40%,rgb(var(--color-primary-rgb)/0.05),transparent)]" />
        <div className="glow-orb glow-orb-reverse w-64 h-64 bg-primary/20 dark:bg-primary/25 bottom-[-20%] left-[10%]" />
        <div className="glow-orb glow-orb-slow w-48 h-48 bg-accent/15 dark:bg-accent/20 top-[10%] right-[20%]" />

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
            <Button size="lg" className="px-6 sm:px-8 h-12 text-base btn-glow-gold">
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('landing.ctaCTA')}
            </Button>
          </Link>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="py-6 sm:py-8 bg-background">
        <div className="glow-divider mb-6 sm:mb-8" />
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs sm:text-sm text-muted-foreground">
                © {new Date().getFullYear()} {BRAND_NAME}. {t('landing.footer')}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground hover:underline underline-offset-4 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">
                {t('landing.termsOfUse')}
              </Link>
              <Link to="/privacy" className="hover:text-foreground hover:underline underline-offset-4 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded">
                {t('landing.privacy')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Static fallback plans for when Supabase query fails (anonymous landing page).
// Description and feature i18n keys are resolved at render time via t().
const LANDING_FALLBACK_PLANS = [
  {
    id: 'free',
    name: 'Free',
    descriptionKey: 'pricing.fallback.freeDesc',
    descriptionDefault: 'Para experimentar',
    price_monthly: 0,
    credits_per_month: 5,
    max_users: 1,
    allows_rollover: false,
    featureKeys: [
      { key: 'pricing.fallback.freeFeature1', defaultValue: '5 créditos/mês' },
      { key: 'pricing.fallback.freeFeature2', defaultValue: 'Recomendação de resina' },
      { key: 'pricing.fallback.freeFeature3', defaultValue: 'Análise com IA' },
    ],
    isPopular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    descriptionKey: 'pricing.fallback.starterDesc',
    descriptionDefault: 'Para dentistas individuais',
    price_monthly: 5900,
    credits_per_month: 30,
    max_users: 1,
    allows_rollover: false,
    featureKeys: [
      { key: 'pricing.fallback.starterFeature1', defaultValue: '30 créditos/mês' },
      { key: 'pricing.fallback.starterFeature2', defaultValue: 'Protocolos completos' },
      { key: 'pricing.fallback.starterFeature3', defaultValue: 'Export PDF' },
    ],
    isPopular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    descriptionKey: 'pricing.fallback.proDesc',
    descriptionDefault: 'Para consultórios',
    price_monthly: 11900,
    credits_per_month: 80,
    max_users: 3,
    allows_rollover: true,
    featureKeys: [
      { key: 'pricing.fallback.proFeature1', defaultValue: '80 créditos/mês' },
      { key: 'pricing.fallback.proFeature2', defaultValue: 'Rollover de créditos' },
      { key: 'pricing.fallback.proFeature3', defaultValue: 'DSD Simulações' },
      { key: 'pricing.fallback.proFeature4', defaultValue: 'Até 3 usuários' },
    ],
    isPopular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    descriptionKey: 'pricing.fallback.eliteDesc',
    descriptionDefault: 'Para clínicas',
    price_monthly: 24900,
    credits_per_month: 200,
    max_users: 10,
    allows_rollover: true,
    featureKeys: [
      { key: 'pricing.fallback.eliteFeature1', defaultValue: '200 créditos/mês' },
      { key: 'pricing.fallback.eliteFeature2', defaultValue: 'Rollover ilimitado' },
      { key: 'pricing.fallback.eliteFeature3', defaultValue: 'Suporte prioritário' },
      { key: 'pricing.fallback.eliteFeature4', defaultValue: 'Até 10 usuários' },
    ],
    isPopular: false,
  },
] as const;

function LandingPricing() {
  const { t } = useTranslation();
  const { plans } = useLandingPlans();

  const displayPlans = plans && plans.length > 0 ? plans : null;

  return (
    <section id="pricing" className="py-12 sm:py-20 bg-secondary/30 relative overflow-hidden section-glow-bg">
      <div className="glow-divider" />
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold font-display neon-text">
            {t('pricing.plansAndPricing')}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            {t('pricing.startFreeUpgrade')}
          </p>
        </div>

        {displayPlans ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {displayPlans.map((plan) => {
              const isFree = plan.price_monthly === 0;
              const isPopular = plan.name === 'Pro';
              const features = Array.isArray(plan.features)
                ? plan.features
                : JSON.parse(plan.features as unknown as string);

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-105 ai-shimmer-border' : ''}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      {t('pricing.mostPopular')}
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-center mb-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">
                          {isFree ? t('pricing.free') : formatPrice(plan.price_monthly)}
                        </span>
                        {!isFree && <span className="text-muted-foreground">{t('pricing.perMonth')}</span>}
                      </div>
                    </div>

                    <div className="bg-primary/10 rounded-lg p-3 mb-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                        <Zap className="h-4 w-4" aria-hidden="true" />
                        <span>{t('pricing.creditsPerMonth', { count: plan.credits_per_month })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('pricing.creditExplanation')}
                      </p>
                    </div>

                    <div className="flex justify-center gap-4 mb-4 text-sm">
                      {plan.max_users > 1 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" aria-hidden="true" />
                          <span>{t('pricing.users', { count: plan.max_users })}</span>
                        </div>
                      )}
                      {plan.allows_rollover && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <RefreshCw className="h-4 w-4" aria-hidden="true" />
                          <span>{t('pricing.rollover')}</span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to="/register">
                        {isFree ? t('pricing.startFree') : t('pricing.start')}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Fallback: static plans when Supabase query fails (anonymous landing) */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {LANDING_FALLBACK_PLANS.map((plan) => {
              const isFree = plan.price_monthly === 0;
              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${plan.isPopular ? 'border-primary shadow-lg scale-105 ai-shimmer-border' : ''}`}
                >
                  {plan.isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      {t('pricing.mostPopular')}
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{t(plan.descriptionKey, { defaultValue: plan.descriptionDefault })}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="text-center mb-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">
                          {isFree ? t('pricing.free') : formatPrice(plan.price_monthly)}
                        </span>
                        {!isFree && <span className="text-muted-foreground">{t('pricing.perMonth')}</span>}
                      </div>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3 mb-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                        <Zap className="h-4 w-4" aria-hidden="true" />
                        <span>{t('pricing.creditsPerMonth', { count: plan.credits_per_month })}</span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {plan.featureKeys.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="text-sm">{t(feature.key, { defaultValue: feature.defaultValue })}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.isPopular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to="/register">
                        {isFree ? t('pricing.startFree') : t('pricing.start')}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-8">
          {t('pricing.guarantee')}
        </p>
      </div>
    </section>
  );
}
