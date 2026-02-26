import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { evaluations, patients, inventory } from '@/data';
import { QUERY_STALE_TIMES } from '@/lib/constants';

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  completed: boolean;
}

export interface OnboardingProgress {
  steps: OnboardingStep[];
  completionPercentage: number;
  allComplete: boolean;
  nextStep: OnboardingStep | null;
  loading: boolean;
}

export function useOnboardingProgress(): OnboardingProgress {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const [caseCount, patientCount, inventoryCount] = await Promise.all([
        evaluations.countByUserId(user.id),
        patients.countByUserId(user.id),
        inventory.countByUserId(user.id),
      ]);
      return { caseCount, patientCount, inventoryCount };
    },
    enabled: !!user,
    staleTime: QUERY_STALE_TIMES.MEDIUM,
  });

  const steps = useMemo<OnboardingStep[]>(() => [
    {
      id: 'first-case',
      label: t('dashboard.onboarding.step2Title'),
      description: t('dashboard.onboarding.step2Desc'),
      href: '/new-case',
      completed: (data?.caseCount ?? 0) > 0,
    },
    {
      id: 'inventory',
      label: t('dashboard.onboarding.step1Title'),
      description: t('dashboard.onboarding.step1Desc'),
      href: '/inventory',
      completed: (data?.inventoryCount ?? 0) > 0,
    },
    {
      id: 'patient',
      label: t('dashboard.onboarding.step3Title'),
      description: t('dashboard.onboarding.step3Desc'),
      href: '/patients',
      completed: (data?.patientCount ?? 0) > 0,
    },
  ], [data, t]);

  const completedCount = steps.filter(s => s.completed).length;
  const completionPercentage = Math.round((completedCount / steps.length) * 100);
  const allComplete = completedCount === steps.length;
  const nextStep = steps.find(s => !s.completed) ?? null;

  return {
    steps,
    completionPercentage,
    allComplete,
    nextStep,
    loading: isLoading,
  };
}
