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

export interface ClinicalInsights {
  treatmentDistribution: Array<{ label: string; value: number; color: string }>;
  topResin: string | null;
  topResins: Array<{ name: string; count: number }>;
  inventoryRate: number;
  totalEvaluated: number;
}

export interface WeeklyTrendPoint {
  label: string;
  value: number;
}

export interface DashboardSession {
  session_id: string;
  patient_name: string | null;
  created_at: string;
  teeth: string[];
  evaluationCount: number;
  completedCount: number;
  treatmentTypes: string[];
  patientAge: number | null;
}

export interface DashboardMetrics {
  totalCases: number;
  totalPatients: number;
  pendingSessions: number;
  weeklySessions: number;
  completionRate: number;
  pendingTeeth: number;
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

  // Insights
  clinicalInsights: ClinicalInsights | null;
  weeklyTrends: WeeklyTrendPoint[];

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
// Insights computation (pure function)
// ---------------------------------------------------------------------------

// Gemini sometimes returns English enum values — normalize to Portuguese
const TREATMENT_NORMALIZE: Record<string, string> = {
  porcelain: 'porcelana',
  resin: 'resina',
  crown: 'coroa',
  implant: 'implante',
  endodontics: 'endodontia',
  referral: 'encaminhamento',
};

const TREATMENT_COLORS: Record<string, string> = {
  resina: '#3b82f6',
  porcelana: '#a855f7',
  coroa: '#f59e0b',
  implante: '#ef4444',
  endodontia: '#10b981',
  encaminhamento: '#6b7280',
};

const TREATMENT_LABELS: Record<string, string> = {
  resina: 'Resina',
  porcelana: 'Porcelana',
  coroa: 'Coroa',
  implante: 'Implante',
  endodontia: 'Endodontia',
  encaminhamento: 'Encaminhamento',
};

interface RawInsightRow {
  id: string;
  created_at: string;
  treatment_type: string | null;
  is_from_inventory: boolean | null;
  resins: { name: string } | null;
}

function computeInsights(
  rows: RawInsightRow[],
  weeksBack: number,
): { clinicalInsights: ClinicalInsights; weeklyTrends: WeeklyTrendPoint[] } {
  // 1. Treatment distribution
  const typeCounts = new Map<string, number>();
  let inventoryCount = 0;

  for (const row of rows) {
    const raw = row.treatment_type;
    const t = raw ? (TREATMENT_NORMALIZE[raw.toLowerCase()] || raw.toLowerCase()) : null;
    if (t) typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
    if (row.is_from_inventory) inventoryCount++;
  }

  const treatmentDistribution = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      label: TREATMENT_LABELS[type] || type,
      value: count,
      color: TREATMENT_COLORS[type] || '#6b7280',
    }));

  // 2. Top resin
  const resinCounts = new Map<string, number>();
  for (const row of rows) {
    const name = row.resins?.name;
    if (name) resinCounts.set(name, (resinCounts.get(name) || 0) + 1);
  }
  const topResins = Array.from(resinCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topResin = topResins.length > 0 ? topResins[0].name : null;

  // 3. Inventory rate
  const inventoryRate = rows.length > 0 ? Math.round((inventoryCount / rows.length) * 100) : 0;

  // 4. Weekly trends — fill all weeks (including empty ones)
  const now = new Date();
  const weekMap = new Map<string, number>();
  const weekLabels: string[] = [];

  for (let i = weeksBack - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(now, i * 7), { weekStartsOn: 1 });
    const key = weekStart.toISOString();
    weekMap.set(key, 0);
    weekLabels.push(key);
  }

  for (const row of rows) {
    const weekStart = startOfWeek(new Date(row.created_at), { weekStartsOn: 1 });
    const key = weekStart.toISOString();
    if (weekMap.has(key)) {
      weekMap.set(key, weekMap.get(key)! + 1);
    }
  }

  const weeklyTrends: WeeklyTrendPoint[] = weekLabels.map(key => ({
    label: format(new Date(key), 'd MMM', { locale: ptBR }),
    value: weekMap.get(key) || 0,
  }));

  return {
    clinicalInsights: {
      treatmentDistribution,
      topResin,
      topResins,
      inventoryRate,
      totalEvaluated: rows.length,
    },
    weeklyTrends,
  };
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  profile: () => [...dashboardQueryKeys.all, 'profile'] as const,
  metrics: () => [...dashboardQueryKeys.all, 'metrics'] as const,
  counts: () => [...dashboardQueryKeys.all, 'counts'] as const,
  insights: () => [...dashboardQueryKeys.all, 'insights'] as const,
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

      const [metrics, recentData] = await Promise.all([
        evaluations.getDashboardMetrics({ userId: user.id }),
        evaluations.getRecent({ userId: user.id, limit: 50 }),
      ]);

      const dashboardMetrics: Omit<DashboardMetrics, 'totalCases' | 'totalPatients'> = {
        pendingSessions: metrics.pendingSessionCount,
        weeklySessions: metrics.weeklySessionCount,
        completionRate: metrics.completionRate,
        pendingTeeth: metrics.pendingTeethCount,
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
          treatmentTypes: [...new Set(evals.map(e => e.treatment_type).filter(Boolean))] as string[],
          patientAge: evals[0].patient_age ?? null,
        }));

      return { metrics: dashboardMetrics, sessions };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });
  const { data: countsData } = useQuery({
    queryKey: dashboardQueryKeys.counts(),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const [totalCases, totalPatients] = await Promise.all([
        evaluations.countByUserId(user.id),
        patients.countByUserId(user.id),
      ]);
      return { totalCases, totalPatients };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const { data: insightsData, isLoading: loadingInsights } = useQuery({
    queryKey: dashboardQueryKeys.insights(),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const raw = await evaluations.getDashboardInsights({ userId: user.id, weeksBack: 8 });
      return computeInsights(raw as RawInsightRow[], 8);
    },
    enabled: !!user,
    staleTime: 60 * 1000,
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
  const loading = loadingProfile || loadingDashboard || loadingInsights;
  const profile = profileData?.profile;
  const avatarUrl = profileData?.avatarUrl ?? null;
  const firstName = extractFirstName(profile?.full_name);
  const greeting = getTimeGreeting();

  const metrics: DashboardMetrics = {
    totalCases: countsData?.totalCases ?? 0,
    totalPatients: countsData?.totalPatients ?? 0,
    ...(dashboardData?.metrics ?? {
      pendingSessions: 0,
      weeklySessions: 0,
      completionRate: 0,
      pendingTeeth: 0,
    }),
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

  const isNewUser = !loading && sessions.length === 0 && metrics.pendingSessions === 0;

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
    clinicalInsights: insightsData?.clinicalInsights ?? null,
    weeklyTrends: insightsData?.weeklyTrends ?? [],
    creditsPerMonth,
    isActive,
    isFree,
  };
}

// Re-export for convenience
export { dashboardQueryKeys as dashboardKeys };
