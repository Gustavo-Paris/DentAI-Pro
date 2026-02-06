import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { User, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';

interface SearchResult {
  id: string;
  session_id: string;
  type: 'patient' | 'tooth' | 'date';
  title: string;
  subtitle: string;
  teethCount: number;
  teeth: string[];
}

interface Evaluation {
  id: string;
  session_id: string | null;
  patient_name: string | null;
  tooth: string;
  created_at: string;
  status: string | null;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Global keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Programmatic open via custom event (used by mobile search button)
  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('open-global-search', handler);
    return () => document.removeEventListener('open-global-search', handler);
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Group evaluations by session_id
  const groupBySession = useCallback((evaluations: Evaluation[]): SearchResult[] => {
    const sessionMap = new Map<string, Evaluation[]>();

    evaluations.forEach((evaluation) => {
      const sessionKey = evaluation.session_id || evaluation.id;
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, []);
      }
      sessionMap.get(sessionKey)!.push(evaluation);
    });

    return Array.from(sessionMap.entries()).map(([sessionId, evals]) => ({
      id: evals[0].id,
      session_id: sessionId,
      type: 'patient' as const,
      title: evals[0].patient_name || 'Paciente sem nome',
      subtitle: format(new Date(evals[0].created_at), "d 'de' MMM yyyy", { locale: ptBR }),
      teethCount: evals.length,
      teeth: evals.map((e) => e.tooth),
    }));
  }, []);

  // Search logic with debounce
  const searchEvaluations = useCallback(
    async (searchTerm: string) => {
      if (!user || searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('id, session_id, patient_name, tooth, created_at, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          logger.error('Search error:', error);
          setResults([]);
          return;
        }

        if (data) {
          const searchLower = searchTerm.toLowerCase();

          const filtered = data.filter((e) => {
            // Search by patient name
            if (e.patient_name?.toLowerCase().includes(searchLower)) return true;

            // Search by tooth number
            if (e.tooth.toLowerCase().includes(searchLower)) return true;

            // Search by date (Brazilian format)
            const dateStr = format(new Date(e.created_at), "d 'de' MMMM yyyy", {
              locale: ptBR,
            });
            if (dateStr.toLowerCase().includes(searchLower)) return true;

            // Search by short date format
            const shortDate = format(new Date(e.created_at), 'dd/MM/yyyy');
            if (shortDate.includes(searchTerm)) return true;

            return false;
          });

          const groupedResults = groupBySession(filtered);
          setResults(groupedResults.slice(0, 10));
        }
      } catch (err) {
        logger.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [user, groupBySession]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchEvaluations(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchEvaluations]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(`/evaluation/${result.session_id}`);
  };

  // Don't render if user is not authenticated
  if (!user) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar paciente, dente ou data..."
        value={query}
        onValueChange={setQuery}
        aria-label="Buscar paciente, dente ou data"
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>Buscando...</span>
            </div>
          ) : query.length < 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          )}
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Avaliações">
            {results.map((result) => (
              <CommandItem
                key={result.session_id}
                value={`${result.title} ${result.teeth.join(' ')} ${result.subtitle}`}
                onSelect={() => handleSelect(result)}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-medium truncate">{result.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {result.teethCount} dente{result.teethCount > 1 ? 's' : ''}: {result.teeth.slice(0, 3).join(', ')}
                    {result.teeth.length > 3 && ` +${result.teeth.length - 3}`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Calendar className="w-3 h-3" />
                  <span>{result.subtitle}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
