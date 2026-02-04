import { useEffect, useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { evaluations, patients, profiles } from '@/data';
import { useSubscription } from '@/hooks/useSubscription';
import { useWizardDraft, WizardDraft } from '@/hooks/useWizardDraft';
import { format, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardSession {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
}

export interface DashboardMetrics {
  pendingCases: number;
  weeklyEvaluations: number;
  completionRate: number;
  totalPatients: number;
}

export interface DashboardState {
  // Profile
  firstName: string;
  avatarUrl: string | null;
  greeting: string;

  // Metrics & sessions
  metrics: DashboardMetrics;
  sessions: DashboardSession[];
  weekRange: { start: string; end: string };

  // Loading states
  loading: boolean;
  loadingCredits: boolean;

  // Derived flags
  isNewUser: boolean;

  // Credits banner
  showCreditsBanner: boolean;
  creditsRemaining: number;
  dismissCreditsBanner: () => void;

  // Draft management
  pendingDraft: WizardDraft | null;
  requestDiscardDraft: () => void;
  confirmDiscardDraft: () => void;
  cancelDiscardDraft: () => void;
  showDiscardConfirm: boolean;

  // Subscription tier
  creditsPerMonth: number;
  isActive: boolean;
  isFree: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function extractFirstName(fullName: string | null | undefined): string {
  if (!fullName) return 'Usuário';
  const match = fullName.match(/^(Dra?\.\s*)(.+)/i);
  if (match) {
    const restFirst = match[2].split(' ')[0];
    return `${match[1]}${restFirst}`;
  }
  return fullName.split(' ')[0];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  profile: () => [...dashboardQueryKeys.all, 'profile'] as const,
  metrics: () => [...dashboardQueryKeys.all, 'metrics'] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboard(): DashboardState {
  const { user } = useAuth();

  // --- Data fetching (inline React Query) ---
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: dashboardQueryKeys.profile(),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const profile = await profiles.getByUserId(user.id);
      let avatarUrl: string | null = null;
      if (profile?.avatar_url) {
        avatarUrl = profiles.getAvatarPublicUrl(profile.avatar_url);
      }
      return { profile, avatarUrl };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: dashboardQueryKeys.metrics(),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const oneWeekAgo = subDays(new Date(), 7).toISOString();

      const [metrics, totalPatients, recentData] = await Promise.all([
        evaluations.getDashboardMetrics({ userId: user.id, oneWeekAgo }),
        patients.countByUserId(user.id),
        evaluations.getRecent({ userId: user.id, limit: 50 }),
      ]);

      const pendingCount = metrics.totalCount - metrics.completedCount;
      const completionRate = metrics.totalCount > 0
        ? Math.round((metrics.completedCount / metrics.totalCount) * 100)
        : 0;

      const dashboardMetrics: DashboardMetrics = {
        pendingCases: pendingCount,
        weeklyEvaluations: metrics.weeklyCount,
        completionRate,
        totalPatients,
      };

      // Group recent evaluations by session_id
      const sessionMap = new Map<string, typeof recentData>();
      recentData.forEach(evaluation => {
        const sessionKey = evaluation.session_id || evaluation.id;
        if (!sessionMap.has(sessionKey)) {
          sessionMap.set(sessionKey, []);
        }
        sessionMap.get(sessionKey)!.push(evaluation);
      });

      const sessions: DashboardSession[] = Array.from(sessionMap.entries())
        .slice(0, 5)
        .map(([sessionId, evals]) => ({
          session_id: sessionId,
          patient_name: evals[0].patient_name,
          created_at: evals[0].created_at,
          teeth: evals.map(e => e.tooth),
          evaluationCount: evals.length,
          completedCount: evals.filter(e => e.status === 'completed').length,
        }));

      return { metrics: dashboardMetrics, sessions };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
  const {
    creditsRemaining,
    creditsPerMonth,
    isActive,
    isFree,
    isLoading: loadingCredits,
  } = useSubscription();
  const { loadDraft, clearDraft } = useWizardDraft(user?.id);

  // --- Local state ---
  const [pendingDraft, setPendingDraft] = useState<WizardDraft | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [creditsBannerDismissed, setCreditsBannerDismissed] = useState(
    () => sessionStorage.getItem('credits-banner-dismissed') === 'true',
  );

  // --- Load draft on mount ---
  useEffect(() => {
    const checkDraft = async () => {
      if (user) {
        const draft = await loadDraft();
        if (draft) {
          setPendingDraft(draft);
        }
      }
    };
    checkDraft();
  }, [user, loadDraft]);

  // --- Derived values ---
  const loading = loadingProfile || loadingDashboard;
  const profile = profileData?.profile;
  const avatarUrl = profileData?.avatarUrl ?? null;
  const firstName = extractFirstName(profile?.full_name);
  const greeting = getTimeGreeting();

  const metrics: DashboardMetrics = dashboardData?.metrics ?? {
    pendingCases: 0,
    weeklyEvaluations: 0,
    completionRate: 0,
    totalPatients: 0,
  };
  const sessions: DashboardSession[] = dashboardData?.sessions ?? [];

  const weekRange = useMemo(() => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return {
      start: format(start, "d 'de' MMM", { locale: ptBR }),
      end: format(end, "d 'de' MMM, yyyy", { locale: ptBR }),
    };
  }, []);

  const isNewUser = !loading && sessions.length === 0 && metrics.totalPatients === 0;

  const showCreditsBanner =
    !creditsBannerDismissed &&
    !loadingCredits &&
    isActive &&
    !isFree &&
    creditsRemaining <= 5;

  // --- Actions ---
  const dismissCreditsBanner = useCallback(() => {
    setCreditsBannerDismissed(true);
    sessionStorage.setItem('credits-banner-dismissed', 'true');
  }, []);

  const requestDiscardDraft = useCallback(() => {
    setShowDiscardConfirm(true);
  }, []);

  const confirmDiscardDraft = useCallback(() => {
    clearDraft();
    setPendingDraft(null);
    setShowDiscardConfirm(false);
  }, [clearDraft]);

  const cancelDiscardDraft = useCallback(() => {
    setShowDiscardConfirm(false);
  }, []);

  return {
    firstName,
    avatarUrl,
    greeting,
    metrics,
    sessions,
    weekRange,
    loading,
    loadingCredits,
    isNewUser,
    showCreditsBanner,
    creditsRemaining,
    dismissCreditsBanner,
    pendingDraft,
    requestDiscardDraft,
    confirmDiscardDraft,
    cancelDiscardDraft,
    showDiscardConfirm,
    creditsPerMonth,
    isActive,
    isFree,
  };
}

// Re-export for convenience
export { dashboardQueryKeys as dashboardKeys };
