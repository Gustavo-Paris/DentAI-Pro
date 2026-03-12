import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEvaluationSessions } from '@/hooks/domain/useEvaluationSessions';
import { Button, Card } from '@parisgroup-ai/pageshell/primitives';
import { ListSkeleton } from '@/components/skeletons';
import { FileText, Plus, ChevronDown } from 'lucide-react';
import { SessionCard } from './SessionCard';

type Filter = 'all' | 'pending' | 'completed';

const PAGE_SIZE = 10;

export function CasosTab() {
  const { t } = useTranslation();
  const { sessions, isLoading } = useEvaluationSessions();
  const [filter, setFilter] = useState<Filter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const counts = useMemo(() => ({
    all: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    completed: sessions.filter(s => s.status === 'completed').length,
  }), [sessions]);

  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions;
    return sessions.filter(s => s.status === filter);
  }, [sessions, filter]);

  const visibleSessions = filteredSessions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSessions.length;
  const remaining = filteredSessions.length - visibleCount;

  const handleFilterChange = useCallback((id: Filter) => {
    setFilter(id);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: t('dashboard.casos.all'), count: counts.all },
    { id: 'pending', label: t('dashboard.casos.inProgress'), count: counts.pending },
    { id: 'completed', label: t('dashboard.casos.completed'), count: counts.completed },
  ];

  if (isLoading) {
    return <ListSkeleton />;
  }

  return (
    <div className="space-y-4 stagger-enter">
      {/* Filter pills with counts */}
      <div className="flex gap-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => handleFilterChange(f.id)}
            aria-pressed={filter === f.id}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'glass-panel text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
            <span className={`tabular-nums ${
              filter === f.id ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Session list or empty state */}
      {filteredSessions.length === 0 ? (
        <Card className="p-8 sm:p-10 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium font-display text-sm mb-1 text-primary">
                {t('dashboard.casos.emptyTitle')}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {t('dashboard.casos.emptyDescription')}
              </p>
            </div>
            <Link to="/new-case">
              <Button size="sm">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {t('dashboard.recent.createFirst')}
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleSessions.map(session => (
            <SessionCard key={session.session_id} session={session} />
          ))}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            >
              <ChevronDown className="w-4 h-4 mr-1.5" />
              {t('dashboard.casos.loadMore', { count: Math.min(remaining, PAGE_SIZE) })}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
