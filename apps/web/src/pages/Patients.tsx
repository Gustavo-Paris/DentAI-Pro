import { Link } from 'react-router-dom';
import { ListPage } from '@pageshell/composites/list';
import { usePatientList } from '@/hooks/domain/usePatientList';
import type { PatientWithStats } from '@/hooks/domain/usePatientList';
import { Card } from '@/components/ui/card';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =============================================================================
// Card component (presentation only)
// =============================================================================

function PatientCard({ patient, index }: { patient: PatientWithStats; index: number }) {
  return (
    <Link to={`/patient/${patient.id}`} aria-label={`Ver paciente ${patient.name}`}>
      <Card
        className="p-3 sm:p-4 shadow-sm hover:shadow-md rounded-xl transition-all duration-300 cursor-pointer border-l-[3px] border-l-primary animate-[fade-in-up_0.6s_ease-out_both]"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0 text-sm sm:text-base">
            {getInitials(patient.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm sm:text-base truncate">{patient.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {patient.caseCount} {patient.caseCount === 1 ? 'caso' : 'casos'} •{' '}
              {patient.sessionCount}{' '}
              {patient.sessionCount === 1 ? 'avaliação' : 'avaliações'}
              {patient.caseCount > 0 && (
                <span className="ml-1">
                  •{' '}
                  {Math.round(
                    (patient.completedCount / patient.caseCount) * 100,
                  )}
                  % concluído
                </span>
              )}
            </p>
            {patient.lastVisit && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Última visita:{' '}
                {format(new Date(patient.lastVisit), "d 'de' MMM, yyyy", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
        </div>
      </Card>
    </Link>
  );
}

// =============================================================================
// Page Adapter
// =============================================================================

export default function Patients() {
  const { patients, total, isLoading, isError } = usePatientList();

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="font-medium">Erro ao carregar pacientes</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente recarregar a página. Se o problema persistir, entre em contato com o suporte.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <ListPage<PatientWithStats>
          title="Meus Pacientes"
          description={`${total} pacientes`}
          viewMode="cards"
          items={patients}
          isLoading={isLoading}
          keyExtractor={(p) => p.id}
          renderCard={(patient, index) => <PatientCard patient={patient} index={index ?? 0} />}
          gridClassName="grid grid-cols-1 gap-3"
          searchConfig={{
            fields: ['name', 'phone', 'email'],
            placeholder: 'Buscar por nome, telefone ou email...',
          }}
          sort={{
            options: [
              { value: 'recent', label: 'Mais recentes' },
              { value: 'name-asc', label: 'Nome (A-Z)', direction: 'asc' },
              { value: 'name-desc', label: 'Nome (Z-A)', direction: 'desc' },
              { value: 'cases', label: 'Mais casos' },
            ],
            default: 'recent',
            compareFn: (sortKey: string) => (a: PatientWithStats, b: PatientWithStats) => {
              switch (sortKey) {
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
                  return (
                    new Date(b.lastVisit).getTime() -
                    new Date(a.lastVisit).getTime()
                  );
              }
            },
          }}
          pagination={{ defaultPageSize: 20 }}
          createAction={{
            label: 'Nova Avaliação',
            href: '/new-case',
          }}
          emptyState={{
            title: 'Nenhum paciente cadastrado',
            description:
              'Crie uma avaliação para adicionar seu primeiro paciente',
            action: { label: 'Nova Avaliação', href: '/new-case' },
          }}
          labels={{
            search: { placeholder: 'Buscar por nome, telefone ou email...' },
            pagination: { showing: 'Mostrando', of: 'de', items: 'pacientes' },
          }}
        />
    </div>
  );
}
