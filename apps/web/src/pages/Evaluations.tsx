import { useCallback, useEffect, memo, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ListPage, GenericErrorState } from '@parisgroup-ai/pageshell/composites';
import { useEvaluationSessions } from '@/hooks/domain/useEvaluationSessions';
import type { EvaluationSession } from '@/hooks/domain/useEvaluationSessions';
import { evaluationKeys } from '@/hooks/domain/evaluation/useEvaluationData';
import { evaluations } from '@/data';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@parisgroup-ai/pageshell/primitives';
import { StatusBadge, defineStatusConfig } from '@parisgroup-ai/pageshell/primitives';
import { Badge } from '@parisgroup-ai/pageshell/primitives';
import { CheckCircle, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { getDateLocale, getDateFormat } from '@/lib/date-utils';
import { formatToothLabel, getTreatmentConfig } from '@/lib/treatment-config';
import { TREATMENT_COLORS, TREATMENT_COLOR_FALLBACK } from '@/lib/treatment-colors';
import { QUERY_STALE_TIMES } from '@/lib/constants';

// =============================================================================
// Static configs (no hook dependencies)
// =============================================================================

const SESSION_STATUS_CONFIG = defineStatusConfig({
  completed: { label: '', variant: 'success', icon: 'CheckCircle' },
  partial: { label: '', variant: 'warning', icon: 'CheckCircle' },
  pending: { label: '', variant: 'muted' },
});

const PAGE_SIZE = 10;

const TREATMENT_TYPE_OPTIONS = [
  { value: 'all', labelKey: 'evaluation.treatmentAll' },
  { value: 'resina', labelKey: 'treatments.resina.shortLabel' },
  { value: 'porcelana', labelKey: 'treatments.porcelana.shortLabel' },
  { value: 'endodontia', labelKey: 'treatments.endodontia.shortLabel' },
  { value: 'implante', labelKey: 'treatments.implante.shortLabel' },
  { value: 'coroa', labelKey: 'treatments.coroa.shortLabel' },
  { value: 'encaminhamento', labelKey: 'treatments.encaminhamento.shortLabel' },
] as const;

// Valid filter values for URL param validation
const VALID_STATUS_VALUES = new Set(['all', 'pending', 'completed']);
const VALID_TREATMENT_VALUES = new Set(TREATMENT_TYPE_OPTIONS.map(o => o.value));

// =============================================================================
// Status-based style tokens (matches dashboard SessionCard)
// =============================================================================

const STATUS_STYLES = {
  completed: {
    accent: 'bg-gradient-to-b from-success to-success/70',
    bar: 'bg-success',
    badge: 'border-success/30 text-success bg-success/5 dark:bg-success/10',
  },
  inProgress: {
    accent: 'bg-gradient-to-b from-primary to-primary/70',
    bar: 'bg-primary',
    badge: 'border-primary/30 text-primary bg-primary/5 dark:bg-primary/10',
  },
} as const;

// =============================================================================
// Card component (presentation only)
// =============================================================================

const SessionCard = memo(function SessionCard({
  session,
  isNew,
  index,
  onHover,
}: {
  session: EvaluationSession;
  isNew: boolean;
  index: number;
  onHover?: (sessionId: string) => void;
}) {
  const { t } = useTranslation();
  const isCompleted = session.status === 'completed';
  const styles = isCompleted ? STATUS_STYLES.completed : STATUS_STYLES.inProgress;
  const progressPercent = session.evaluationCount > 0
    ? Math.round((session.completedCount / session.evaluationCount) * 100)
    : 0;

  const sessionStatus = isCompleted ? 'completed' : session.completedCount > 0 ? 'partial' : 'pending';
  const statusLabel = isCompleted
    ? t('evaluation.completed')
    : session.completedCount > 0
      ? `${t('evaluation.resultsReady')} (${session.completedCount}/${session.evaluationCount})`
      : t('evaluation.statusPending');

  const handleClick = useCallback(() => {
    sessionStorage.removeItem('newSessionId');
    sessionStorage.removeItem('newSessionTimestamp');
  }, []);

  const handleHover = useCallback(() => {
    onHover?.(session.session_id);
  }, [onHover, session.session_id]);

  return (
    <Link to={`/evaluation/${session.session_id}`} onClick={handleClick} onMouseEnter={handleHover} className="block rounded-xl focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2" aria-label={t('evaluation.viewEvaluationOf', { name: session.patient_name || t('evaluation.patientNoName') })}>
      <Card
        className={`group relative overflow-hidden p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer animate-[fade-in-up_0.6s_ease-out_both] dark:bg-gradient-to-br dark:from-card dark:to-card/80 glass-panel glow-card ${isNew ? 'ai-shimmer-border' : ''}`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Gradient accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${styles.accent}`} />

        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <p className="font-semibold text-sm sm:text-base truncate">
                {session.patient_name || t('evaluation.patientNoName')}
              </p>
              {isNew && (
                <Badge variant="secondary" className="text-xs">
                  {t('evaluation.new')}
                </Badge>
              )}
              <StatusBadge label={statusLabel} variant={SESSION_STATUS_CONFIG[sessionStatus].variant} size="sm" />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
              <p className="text-xs text-muted-foreground flex-shrink-0">
                {t('evaluation.case', { count: session.evaluationCount })}
              </p>
              {/* Treatment color chips */}
              {session.treatmentTypes.length > 0 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {session.treatmentTypes.map(type => {
                      const config = getTreatmentConfig(type);
                      const color = TREATMENT_COLORS[type] ?? TREATMENT_COLOR_FALLBACK;
                      return (
                        <Badge
                          key={type}
                          variant="outline"
                          className="text-xs px-1.5 gap-1 border-transparent"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                            color,
                          }}
                        >
                          <config.icon className="w-2.5 h-2.5" />
                          {t(config.shortLabelKey)}
                        </Badge>
                      );
                    })}
                  </div>
                </>
              )}
              {/* Tooth badges */}
              {session.teeth.length > 0 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <div className="flex gap-1.5 flex-wrap items-center min-w-0">
                    {session.teeth.slice(0, 3).map((tooth) => (
                      <Badge key={tooth} variant="outline" className="text-xs whitespace-nowrap">
                        {formatToothLabel(tooth)}
                      </Badge>
                    ))}
                    {session.teeth.length > 3 && (
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        +{session.teeth.length - 3}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
            <span className="hidden sm:inline">
              {format(new Date(session.created_at), getDateFormat('short'), { locale: getDateLocale() })}
            </span>
            <span className="sm:hidden">
              {format(new Date(session.created_at), 'dd/MM', { locale: getDateLocale() })}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
          </div>
        </div>
        {/* Progress bar */}
        {session.evaluationCount > 1 && (
          <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={t('evaluation.progress', { defaultValue: 'Progresso' })}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
              style={{
                width: `${progressPercent}%`,
                boxShadow: `0 0 8px rgb(var(${isCompleted ? '--color-success-rgb' : '--color-primary-rgb'}) / 0.4)`,
              }}
            />
          </div>
        )}
      </Card>
    </Link>
  );
});

// =============================================================================
// Page Adapter — maps domain hook to ListPage composite
// =============================================================================

export default function Evaluations() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.evaluations'));
  const { sessions, isLoading, isError, newSessionId, newTeethCount } =
    useEvaluationSessions();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Persist "New" badge across page reloads via sessionStorage
  // ---------------------------------------------------------------------------
  const [storedNewId] = useState<string | null>(() => {
    const id = sessionStorage.getItem('newSessionId');
    const ts = sessionStorage.getItem('newSessionTimestamp');
    const isRecent = ts && Date.now() - Number(ts) < 3_600_000; // 1 hour
    return isRecent ? id : null;
  });

  const effectiveNewId = newSessionId ?? storedNewId;

  // When newSessionId arrives from location.state, persist and clear nav state
  useEffect(() => {
    if (newSessionId) {
      sessionStorage.setItem('newSessionId', newSessionId);
      sessionStorage.setItem('newSessionTimestamp', Date.now().toString());
      window.history.replaceState({}, document.title);
    }
  }, [newSessionId]);

  // Read initial filter state from URL params (validated)
  const urlStatus = searchParams.get('status');
  const urlTreatment = searchParams.get('treatment');
  const urlSearch = searchParams.get('q') ?? '';

  // ---------------------------------------------------------------------------
  // External filtering — all filters managed here because PageShell's ListPage
  // card view has a bug where pagination UI renders but items aren't sliced.
  // By managing search/filter/pagination externally, we control the slice.
  // ---------------------------------------------------------------------------
  const [treatmentFilter, setTreatmentFilter] = useState<string>(() => {
    if (urlTreatment && VALID_TREATMENT_VALUES.has(urlTreatment)) return urlTreatment;
    return 'all';
  });
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (urlStatus && VALID_STATUS_VALUES.has(urlStatus)) return urlStatus;
    return 'all';
  });
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [page, setPage] = useState(1);

  const filteredSessions = useMemo(() => {
    let result = sessions;
    // Treatment filter
    if (treatmentFilter !== 'all') {
      result = result.filter(s => s.treatmentTypes.includes(treatmentFilter));
    }
    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(s => s.patient_name?.toLowerCase().includes(q));
    }
    return result;
  }, [sessions, treatmentFilter, statusFilter, searchQuery]);

  // Reset page when filters change
  const filteredCount = filteredSessions.length;
  useEffect(() => { setPage(1); }, [filteredCount]);

  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSessions.slice(start, start + PAGE_SIZE);
  }, [filteredSessions, page]);

  // ---------------------------------------------------------------------------
  // Treatment filter change handler
  // ---------------------------------------------------------------------------
  const handleTreatmentChange = useCallback((value: string) => {
    setTreatmentFilter(value);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'all') next.set('treatment', value);
      else next.delete('treatment');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // ---------------------------------------------------------------------------
  // ListPage configuration
  // ---------------------------------------------------------------------------

  const searchConfig = useMemo(
    () => ({ fields: ['patient_name'] as string[], placeholder: t('evaluation.searchByPatient') }),
    [t],
  );

  const createAction = useMemo(
    () => ({ label: t('evaluation.newEvaluation'), onClick: () => navigate('/new-case') }),
    [t, navigate],
  );

  const emptyState = useMemo(
    () => ({
      title: t('evaluation.emptyTitle'),
      description: t('evaluation.emptyDescription'),
      action: { label: t('evaluation.emptyAction'), onClick: () => navigate('/new-case') },
    }),
    [t, navigate],
  );

  const emptySearchState = useMemo(
    () => ({
      title: t('evaluation.emptyTitle'),
      description: t('evaluation.emptyFilteredDescription', { defaultValue: 'Nenhuma avaliacao corresponde aos filtros selecionados.' }),
      showClearButton: true,
    }),
    [t],
  );

  const labels = useMemo(
    () => ({
      search: { placeholder: t('evaluation.searchByPatient') },
      pagination: {
        showing: t('common.showingOf', { defaultValue: 'Mostrando' }),
        of: t('common.of', { defaultValue: 'de' }),
        to: t('common.to', { defaultValue: 'a' }),
        items: t('evaluation.paginationItems', { defaultValue: 'avaliacoes' }),
        previous: t('common.previousPage', { defaultValue: 'Pagina anterior' }),
        next: t('common.nextPage', { defaultValue: 'Proxima pagina' }),
      },
    }),
    [t],
  );

  // Prefetch evaluation detail data on hover for instant navigation
  const handleSessionHover = useCallback((sessionId: string) => {
    if (!user) return;
    void queryClient.prefetchQuery({
      queryKey: evaluationKeys.session(sessionId),
      queryFn: () => evaluations.listBySession(sessionId, user.id),
      staleTime: QUERY_STALE_TIMES.SHORT,
    });
  }, [queryClient, user]);

  // Sync filter/search changes to URL params + local state
  const handleFiltersChange = useCallback((filters: Record<string, string>) => {
    const status = filters.status ?? 'all';
    setStatusFilter(status);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (status && status !== 'all') next.set('status', status);
      else next.delete('status');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSearchChange = useCallback((search: string) => {
    setSearchQuery(search);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (search) next.set('q', search);
      else next.delete('q');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // ---------------------------------------------------------------------------
  // renderCard — wraps SessionCard with effectiveNewId and hover handler
  // ---------------------------------------------------------------------------
  const renderCard = useCallback(
    (session: EvaluationSession, index: number) => (
      <SessionCard
        session={session}
        isNew={effectiveNewId === session.session_id}
        index={index}
        onHover={handleSessionHover}
      />
    ),
    [effectiveNewId, handleSessionHover],
  );

  // ---------------------------------------------------------------------------
  // Treatment pills slot (injected after ListPage's built-in filters)
  // ---------------------------------------------------------------------------
  const treatmentPillsSlot = useMemo(() => (
    <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
      {TREATMENT_TYPE_OPTIONS.map(({ value, labelKey }) => {
        const isActive = treatmentFilter === value;
        const color = value !== 'all' ? TREATMENT_COLORS[value] ?? TREATMENT_COLOR_FALLBACK : undefined;
        return (
          <button
            key={value}
            onClick={() => handleTreatmentChange(value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? color
                  ? 'text-white'
                  : 'bg-primary text-primary-foreground'
                : 'glass-panel text-muted-foreground hover:text-foreground'
            }`}
            style={isActive && color ? {
              backgroundColor: `color-mix(in srgb, ${color} 85%, black)`,
            } : undefined}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  ), [treatmentFilter, handleTreatmentChange, t]);

  // Success banner slot (shown when freshly navigated)
  const headerSlot = useMemo(() => {
    if (!newSessionId) return undefined;
    return (
      <div role="status" aria-live="polite" className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-xl shadow-sm flex items-center gap-3 animate-[fade-in-up_0.6s_ease-out_both] glow-badge">
        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium text-sm sm:text-base">
            {t('evaluation.createdWithCases', { count: newTeethCount })}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('evaluation.newHighlighted')}
          </p>
        </div>
      </div>
    );
  }, [newSessionId, newTeethCount, t]);

  const slots = useMemo(
    () => ({
      headerSlot,
      afterFilters: treatmentPillsSlot,
    }),
    [headerSlot, treatmentPillsSlot],
  );

  if (isError) {
    return (
      <GenericErrorState
        title={t('evaluation.loadError')}
        description={t('errors.tryReloadPage')}
      />
    );
  }

  return (
    <div className="relative z-10 max-w-5xl mx-auto py-6 sm:py-8">
      <ListPage<EvaluationSession>
        title={t('evaluation.title')}
        description={filteredCount > 0 ? t('patients.count', { count: filteredCount }) : undefined}
        viewMode="cards"
        items={paginatedSessions}
        isLoading={isLoading}
        itemKey="session_id"
        renderCard={renderCard}
        gridClassName="grid grid-cols-1 gap-4 stagger-enter"
        searchConfig={searchConfig}
        filters={[
          {
            key: 'status',
            label: t('evaluation.filterStatus', { defaultValue: 'Status' }),
            options: [
              { value: 'all', label: t('evaluation.statusAll') },
              { value: 'pending', label: t('evaluation.statusPending') },
              { value: 'completed', label: t('evaluation.statusCompleted') },
            ],
            default: 'all',
            cardRenderAs: 'buttons' as const,
          },
        ]}
        defaultState={{
          search: urlSearch,
          filters: urlStatus && VALID_STATUS_VALUES.has(urlStatus) ? { status: urlStatus } : {},
        }}
        pagination={false}
        offsetPagination={{
          type: 'offset',
          page,
          pageSize: PAGE_SIZE,
          total: filteredCount,
          onPageChange: setPage,
        }}
        createAction={createAction}
        emptyState={emptyState}
        emptySearchState={emptySearchState}
        slots={slots}
        labels={labels}
        onFiltersChange={handleFiltersChange}
        onSearchChange={handleSearchChange}
      />
    </div>
  );
}
