import { useCallback, useEffect, memo, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { GenericErrorState } from '@parisgroup-ai/pageshell/composites';
import { useListLogic } from '@parisgroup-ai/pageshell/core';
import { useEvaluationSessions } from '@/hooks/domain/useEvaluationSessions';
import type { EvaluationSession } from '@/hooks/domain/useEvaluationSessions';
import { evaluationKeys } from '@/hooks/domain/evaluation/useEvaluationData';
import { evaluations } from '@/data';
import { useAuth } from '@/contexts/AuthContext';
import { Card, SearchInput } from '@parisgroup-ai/pageshell/primitives';
import { StatusBadge, defineStatusConfig } from '@parisgroup-ai/pageshell/primitives';
import { Badge } from '@parisgroup-ai/pageshell/primitives';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@parisgroup-ai/pageshell/primitives';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { CheckCircle, ChevronRight, ChevronLeft, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { getDateLocale, getDateFormat } from '@/lib/date-utils';
import { formatToothLabel } from '@/lib/treatment-config';
import { QUERY_STALE_TIMES } from '@/lib/constants';

// =============================================================================
// Static configs (no hook dependencies)
// =============================================================================

const SESSION_STATUS_CONFIG = defineStatusConfig({
  completed: { label: '', variant: 'success', icon: 'CheckCircle' },
  partial: { label: '', variant: 'warning', icon: 'CheckCircle' },
  pending: { label: '', variant: 'muted' },
});

const SEARCH_FIELDS: ('patient_name')[] = ['patient_name'];
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

  const borderClass = isNew
    ? 'border-l-2 border-l-primary ring-1 ring-primary/20'
    : isCompleted
    ? 'border-l-2 border-l-success'
    : 'border-l-2 border-l-primary';

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
        className={`p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer animate-[fade-in-up_0.6s_ease-out_both] dark:bg-gradient-to-br dark:from-card dark:to-card/80 glow-card ${borderClass}`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <p className="font-medium text-sm sm:text-base">
                {session.patient_name || t('evaluation.patientNoName')}
              </p>
              {isNew && (
                <Badge variant="secondary" className="text-xs">
                  {t('evaluation.new')}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
              <p className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                {t('evaluation.case', { count: session.evaluationCount })}
              </p>
              <span className="text-muted-foreground hidden sm:inline flex-shrink-0">•</span>
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
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            <StatusBadge label={statusLabel} variant={SESSION_STATUS_CONFIG[sessionStatus].variant} size="sm" />
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                {format(new Date(session.created_at), getDateFormat('short'), { locale: getDateLocale() })}
              </span>
              <span className="sm:hidden">
                {format(new Date(session.created_at), 'dd/MM', { locale: getDateLocale() })}
              </span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
        </div>
        {/* Mini progress bar */}
        {session.evaluationCount > 1 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-success' : 'bg-primary'}`}
                  style={{ width: `${Math.round((session.completedCount / session.evaluationCount) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {session.completedCount}/{session.evaluationCount}
              </span>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
});

// =============================================================================
// Page Adapter — uses useListLogic directly (workaround for ListPage
// pagination bug where client-side items are not sliced by page)
// =============================================================================

export default function Evaluations() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.evaluations'));
  const { sessions, isLoading, isError, newSessionId, newTeethCount } =
    useEvaluationSessions();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

  const initialFilters = useMemo(() => {
    const filters: Record<string, string> = {};
    if (urlStatus && VALID_STATUS_VALUES.has(urlStatus)) {
      filters.status = urlStatus;
    }
    if (urlTreatment && VALID_TREATMENT_VALUES.has(urlTreatment)) {
      filters.treatmentTypes = urlTreatment;
    }
    return filters;
    // Only compute once on mount — URL is the source of truth for initial state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // useListLogic — handles search, filter, sort, and pagination client-side.
  // Used directly instead of ListPage to work around ListPage's pagination bug
  // (ListPage renders sortedItems instead of paginatedItems).
  // ---------------------------------------------------------------------------
  const listLogicFilters = useMemo(() => ({
    status: {
      options: [
        { value: 'all', label: t('evaluation.statusAll') },
        { value: 'pending', label: t('evaluation.statusPending') },
        { value: 'completed', label: t('evaluation.statusCompleted') },
      ],
      defaultValue: 'all',
    },
    treatmentTypes: {
      options: TREATMENT_TYPE_OPTIONS.map(({ value, labelKey }) => ({
        value,
        label: t(labelKey),
      })),
      defaultValue: 'all',
    },
  }), [t]);

  const listLogic = useListLogic<EvaluationSession>({
    items: sessions,
    searchFields: SEARCH_FIELDS,
    filters: listLogicFilters,
    initialFilters,
    initialSearch: urlSearch,
    pageSize: PAGE_SIZE,
  });

  // Sync filter/search changes back to URL
  const handleFilterChange = useCallback((key: string, value: string) => {
    listLogic.setFilter(key, value);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (key === 'status') {
        if (value && value !== 'all') next.set('status', value);
        else next.delete('status');
      }
      if (key === 'treatmentTypes') {
        if (value && value !== 'all') next.set('treatment', value);
        else next.delete('treatment');
      }
      return next;
    }, { replace: true });
  }, [listLogic, setSearchParams]);

  const handleSearchChange = useCallback((value: string) => {
    listLogic.setSearch(value);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set('q', value);
      else next.delete('q');
      return next;
    }, { replace: true });
  }, [listLogic, setSearchParams]);

  // Prefetch evaluation detail data on hover for instant navigation
  const handleSessionHover = useCallback((sessionId: string) => {
    if (!user) return;
    void queryClient.prefetchQuery({
      queryKey: evaluationKeys.session(sessionId),
      queryFn: () => evaluations.listBySession(sessionId, user.id),
      staleTime: QUERY_STALE_TIMES.SHORT,
    });
  }, [queryClient, user]);

  if (isError) {
    return (
      <GenericErrorState
        title={t('evaluation.loadError')}
        description={t('errors.tryReloadPage')}
      />
    );
  }

  const showingStart = Math.min((listLogic.page - 1) * PAGE_SIZE + 1, listLogic.filteredCount);
  const showingEnd = Math.min(listLogic.page * PAGE_SIZE, listLogic.filteredCount);

  return (
    <div className="relative section-glow-bg overflow-hidden max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Ambient AI grid overlay */}
      <div className="ai-grid-pattern absolute inset-0 opacity-30 dark:opacity-50 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />

      {/* Success Banner — only when freshly navigated (not from sessionStorage) */}
      {newSessionId && (
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
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">{t('evaluation.title')}</h1>
        <Link to="/new-case">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            {t('evaluation.newEvaluation')}
          </Button>
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        <div className="flex-1">
          <SearchInput
            value={listLogic.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t('evaluation.searchByPatient')}
          />
        </div>
        <div className="flex gap-2">
          <Select value={listLogic.filters.status || 'all'} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder={t('evaluation.statusFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('evaluation.statusAll')}</SelectItem>
              <SelectItem value="pending">{t('evaluation.statusPending')}</SelectItem>
              <SelectItem value="completed">{t('evaluation.statusCompleted')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={listLogic.filters.treatmentTypes || 'all'} onValueChange={(v) => handleFilterChange('treatmentTypes', v)}>
            <SelectTrigger className="w-[140px] sm:w-[160px]">
              <SelectValue placeholder={t('evaluation.treatmentFilter')} />
            </SelectTrigger>
            <SelectContent>
              {TREATMENT_TYPE_OPTIONS.map(({ value, labelKey }) => (
                <SelectItem key={value} value={value}>{t(labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && listLogic.filteredCount === 0 && (
        <div className="text-center py-12">
          {listLogic.hasActiveFilters ? (
            <>
              <p className="text-muted-foreground mb-2">{t('evaluation.emptyTitle')}</p>
              <Button variant="outline" size="sm" onClick={() => listLogic.clearFilters()}>
                {t('evaluation.clearFilters', { defaultValue: 'Limpar filtros' })}
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mb-1">{t('evaluation.emptyTitle')}</p>
              <p className="text-muted-foreground mb-4">{t('evaluation.emptyDescription')}</p>
              <Link to="/new-case">
                <Button>{t('evaluation.emptyAction')}</Button>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Card grid — uses paginatedItems (correctly sliced) */}
      {!isLoading && listLogic.paginatedItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 stagger-enter">
          {listLogic.paginatedItems.map((session, index) => (
            <SessionCard
              key={session.session_id}
              session={session}
              isNew={effectiveNewId === session.session_id}
              index={index}
              onHover={handleSessionHover}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && listLogic.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('common.showingOf', { defaultValue: 'Mostrando' })}{' '}
            <span className="font-medium">{showingStart}</span>
            {' '}{t('common.to', { defaultValue: 'a' })}{' '}
            <span className="font-medium">{showingEnd}</span>
            {' '}{t('common.of', { defaultValue: 'de' })}{' '}
            <span className="font-medium">{listLogic.filteredCount}</span>
            {' '}{t('evaluation.paginationItems', { defaultValue: 'avaliações' })}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={listLogic.page <= 1}
              onClick={() => listLogic.prevPage()}
              aria-label={t('common.previousPage', { defaultValue: 'Página anterior' })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: listLogic.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === listLogic.page ? 'default' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => listLogic.setPage(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={listLogic.page >= listLogic.totalPages}
              onClick={() => listLogic.nextPage()}
              aria-label={t('common.nextPage', { defaultValue: 'Próxima página' })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
