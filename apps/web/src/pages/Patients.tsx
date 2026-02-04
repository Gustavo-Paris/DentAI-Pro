import { Link } from 'react-router-dom';
import { ListPage } from '@pageshell/composites/list';
import { usePatientList } from '@/hooks/domain/usePatientList';
import type { PatientWithStats } from '@/hooks/domain/usePatientList';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =============================================================================
// Card component (presentation only)
// =============================================================================

function PatientCard({ patient }: { patient: PatientWithStats }) {
  return (
    <Link to={`/patient/${patient.id}`}>
      <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
            {getInitials(patient.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{patient.name}</h3>
            <p className="text-sm text-muted-foreground">
              {patient.caseCount} {patient.caseCount === 1 ? 'caso' : 'casos'} •{' '}
              {patient.sessionCount}{' '}
              {patient.sessionCount === 1 ? 'sessão' : 'sessões'}
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
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </div>
      </Card>
    </Link>
  );
}

// =============================================================================
// Page Adapter
// =============================================================================

export default function Patients() {
  const { patients, total, isLoading } = usePatientList();

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ListPage<PatientWithStats>
          title="Meus Pacientes"
          description={`${total} pacientes`}
          viewMode="cards"
          items={patients}
          isLoading={isLoading}
          keyExtractor={(p) => p.id}
          renderCard={(patient) => <PatientCard patient={patient} />}
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
    </div>
  );
}
