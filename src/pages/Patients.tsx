import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePatientsList } from "@/hooks/queries/usePatients";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search, Users, Plus, ChevronRight, Loader2, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type SortOption = 'recent' | 'name-asc' | 'name-desc' | 'cases';

const Patients = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [page, setPage] = useState(0);
  const [allPatients, setAllPatients] = useState<Array<{
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    sessionCount: number;
    caseCount: number;
    completedCount: number;
    lastVisit: string | null;
  }>>([]);

  const { data, isLoading, isFetching } = usePatientsList(page, 20);

  // Accumulate patients across pages
  useEffect(() => {
    if (data?.patients) {
      if (page === 0) {
        setAllPatients(data.patients);
      } else {
        setAllPatients(prev => [...prev, ...data.patients]);
      }
    }
  }, [data, page]);

  const handleLoadMore = () => {
    setPage(p => p + 1);
  };

  // Filter and sort patients
  const filteredAndSortedPatients = useMemo(() => {
    const filtered = allPatients.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'pt-BR');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'pt-BR');
        case 'cases':
          return b.caseCount - a.caseCount;
        case 'recent':
        default:
          if (!a.lastVisit && !b.lastVisit) return 0;
          if (!a.lastVisit) return 1;
          if (!b.lastVisit) return -1;
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      }
    });
  }, [allPatients, searchQuery, sortBy]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Meus Pacientes</h1>
              <p className="text-sm text-muted-foreground">{data?.totalCount ?? 0} pacientes</p>
            </div>
          </div>
          <Link to="/new-case">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova Avaliação
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search and Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ArrowUpDown className="w-4 h-4 mr-2 opacity-50" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
              <SelectItem value="cases">Mais casos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && page === 0 && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allPatients.length === 0 && (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum paciente cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie uma avaliação para adicionar seu primeiro paciente
            </p>
            <Link to="/new-case">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
            </Link>
          </Card>
        )}

        {/* No Results */}
        {!isLoading && allPatients.length > 0 && filteredAndSortedPatients.length === 0 && (
          <Card className="p-8 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum paciente encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Tente buscar por outro nome
            </p>
          </Card>
        )}

        {/* Patients List */}
        {!isLoading && filteredAndSortedPatients.length > 0 && (
          <div className="space-y-3">
            {filteredAndSortedPatients.map((patient) => (
              <Link key={patient.id} to={`/patient/${patient.id}`}>
                <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {getInitials(patient.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{patient.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {patient.caseCount} {patient.caseCount === 1 ? "caso" : "casos"} •{" "}
                        {patient.sessionCount} {patient.sessionCount === 1 ? "sessão" : "sessões"}
                        {patient.caseCount > 0 && (
                          <span className="ml-1">
                            • {Math.round((patient.completedCount / patient.caseCount) * 100)}% concluído
                          </span>
                        )}
                      </p>
                      {patient.lastVisit && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Última visita:{" "}
                          {format(new Date(patient.lastVisit), "d 'de' MMM, yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </Link>
            ))}

            {/* Load More Button */}
            {data?.hasMore && !searchQuery && (
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isFetching}
                className="w-full mt-4"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  'Carregar mais'
                )}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Patients;
