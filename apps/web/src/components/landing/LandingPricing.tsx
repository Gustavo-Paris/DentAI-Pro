import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@parisgroup-ai/pageshell/primitives';
import { Check, Zap, Users, RefreshCw } from 'lucide-react';
import { useLandingPlans } from '@/hooks/useLandingPlans';
import { formatPrice } from '@/hooks/useSubscription';

// Static fallback plans for when Supabase query fails (anonymous landing page).
// Description and feature i18n keys are resolved at render time via t().
const LANDING_FALLBACK_PLANS = [
  {
    id: 'free',
    name: 'Free',
    descriptionKey: 'pricing.fallback.freeDesc',

    price_monthly: 0,
    credits_per_month: 5,
    max_users: 1,
    allows_rollover: false,
    featureKeys: [
      { key: 'pricing.fallback.freeFeature1'},
      { key: 'pricing.fallback.freeFeature2'},
      { key: 'pricing.fallback.freeFeature3'},
    ],
    isPopular: false,
  },
  {
    id: 'essencial',
    name: 'Essencial',
    descriptionKey: 'pricing.fallback.starterDesc',

    price_monthly: 5900,
    credits_per_month: 20,
    max_users: 1,
    allows_rollover: false,
    featureKeys: [
      { key: 'pricing.fallback.starterFeature1'},
      { key: 'pricing.fallback.starterFeature2'},
      { key: 'pricing.fallback.starterFeature3'},
    ],
    isPopular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    descriptionKey: 'pricing.fallback.proDesc',

    price_monthly: 9900,
    credits_per_month: 50,
    max_users: 1,
    allows_rollover: true,
    featureKeys: [
      { key: 'pricing.fallback.proFeature1'},
      { key: 'pricing.fallback.proFeature2'},
      { key: 'pricing.fallback.proFeature3'},
      { key: 'pricing.fallback.proFeature4'},
    ],
    isPopular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    descriptionKey: 'pricing.fallback.eliteDesc',

    price_monthly: 24900,
    credits_per_month: 200,
    max_users: 10,
    allows_rollover: true,
    featureKeys: [
      { key: 'pricing.fallback.eliteFeature1'},
      { key: 'pricing.fallback.eliteFeature2'},
      { key: 'pricing.fallback.eliteFeature3'},
      { key: 'pricing.fallback.eliteFeature4'},
    ],
    isPopular: false,
  },
] as const;

export function LandingPricing() {
  const { t } = useTranslation();
  const { plans } = useLandingPlans();

  const displayPlans = plans && plans.length > 0 ? plans : null;

  return (
    <section id="pricing" aria-label={t('pricing.plansAndPricing')} className="py-12 sm:py-20 bg-secondary/30 relative overflow-hidden section-glow-bg">
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
                  className={`relative flex flex-col rounded-xl glass-panel glow-card ${isPopular ? 'border-primary shadow-lg scale-105 ai-shimmer-border' : ''}`}
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
                  className={`relative flex flex-col rounded-xl glass-panel glow-card ${plan.isPopular ? 'border-primary shadow-lg scale-105 ai-shimmer-border' : ''}`}
                >
                  {plan.isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      {t('pricing.mostPopular')}
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{t(plan.descriptionKey)}</CardDescription>
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
                          <span className="text-sm">{t(feature.key)}</span>
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
