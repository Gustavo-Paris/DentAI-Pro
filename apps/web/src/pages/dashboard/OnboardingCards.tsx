import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Package, Camera, Users } from 'lucide-react';
import { useScrollRevealChildren } from '@/hooks/useScrollReveal';

const steps = [
  {
    href: '/inventory',
    icon: Package,
    step: '1',
    titleKey: 'dashboard.onboarding.step1Title',
    descKey: 'dashboard.onboarding.step1Desc',
    gradient: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
  },
  {
    href: '/new-case',
    icon: Camera,
    step: '2',
    titleKey: 'dashboard.onboarding.step2Title',
    descKey: 'dashboard.onboarding.step2Desc',
    gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  },
  {
    href: '/patients',
    icon: Users,
    step: '3',
    titleKey: 'dashboard.onboarding.step3Title',
    descKey: 'dashboard.onboarding.step3Desc',
    gradient: 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/5 dark:to-purple-500/5',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
  },
];

export function OnboardingCards() {
  const { t } = useTranslation();
  const containerRef = useScrollRevealChildren();

  return (
    <div ref={containerRef}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {t('dashboard.onboarding.firstSteps')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <Link key={step.href} to={step.href}>
              <Card className={`scroll-reveal scroll-reveal-delay-${i + 1} group relative overflow-hidden p-4 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-xl transition-all duration-300 cursor-pointer h-full`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${step.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      {t('dashboard.onboarding.step', { step: step.step })}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-0.5">{t(step.titleKey)}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
