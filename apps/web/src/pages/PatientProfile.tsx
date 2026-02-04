import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  Pencil,
  Plus,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { usePatientProfile } from '@/hooks/domain/usePatientProfile';

// =============================================================================
// Page Adapter
// =============================================================================

const PatientProfile = () => {
  const profile = usePatientProfile();

  if (profile.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (!profile.patient) return null;

  const { patient, sessions, metrics, editForm, patientId } = profile;
  const sessionsList = sessions?.sessions || [];
  const hasMoreSessions = sessions?.hasMore || false;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <header className="bg-card border-b border-border -mx-4 sm:-mx-6 -mt-6 sm:-mt-8 px-4 sm:px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/patients">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {profile.getInitials(patient.name)}
              </div>
              <div>
                <h1 className="text-lg font-semibold">{patient.name}</h1>
                <p className="text-sm text-muted-foreground">Perfil do Paciente</p>
              </div>
            </div>
          </div>

          <Dialog open={profile.editDialogOpen} onOpenChange={profile.setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Paciente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => profile.updateEditField('name', e.target.value)}
                    placeholder="Nome do paciente"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => profile.updateEditField('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => profile.updateEditField('email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notas clínicas</Label>
                  <Textarea
                    id="notes"
                    value={editForm.notes}
                    onChange={(e) => profile.updateEditField('notes', e.target.value)}
                    placeholder="Alergias, preferências, observações..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={profile.closeEditDialog}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={profile.handleSave}
                    disabled={profile.isSaving || !editForm.name.trim()}
                  >
                    {profile.isSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/patients">Pacientes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{patient.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Contact Info */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {patient.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.notes && (
              <div className="flex items-start gap-2 text-muted-foreground w-full mt-2 pt-2 border-t border-border">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="whitespace-pre-wrap">{patient.notes}</span>
              </div>
            )}
            {!patient.phone && !patient.email && !patient.notes && (
              <p className="text-muted-foreground">
                Nenhuma informação adicional.{' '}
                <button className="text-primary hover:underline" onClick={profile.openEditDialog}>
                  Adicionar dados
                </button>
              </p>
            )}
          </div>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessões</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.totalCases}</p>
            <p className="text-xs text-muted-foreground">Casos</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-semibold text-primary">{metrics.completedCases}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.firstVisitFormatted}</p>
            <p className="text-xs text-muted-foreground">1ª Visita</p>
          </Card>
        </div>

        {/* Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Histórico de Sessões</h2>
            <Link to={`/new-case?patient=${patientId}`}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Nova Avaliação
              </Button>
            </Link>
          </div>

          {sessionsList.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Nenhuma avaliação ainda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie a primeira avaliação para este paciente
              </p>
              <Link to={`/new-case?patient=${patientId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Avaliação
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessionsList.map((session) => {
                const isCompleted = session.completedCount === session.evaluationCount;
                const progressPercent = (session.completedCount / session.evaluationCount) * 100;

                return (
                  <Link key={session.session_id} to={`/evaluation/${session.session_id}`}>
                    <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {format(new Date(session.created_at), "d 'de' MMMM, yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                          <Badge
                            variant={isCompleted ? 'default' : 'secondary'}
                            className={isCompleted ? 'bg-primary' : ''}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {isCompleted ? 'Concluído' : 'Em progresso'}
                          </Badge>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {session.teeth.slice(0, 4).map((tooth, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tooth}
                              </Badge>
                            ))}
                            {session.teeth.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{session.teeth.length - 4}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {session.evaluationCount}{' '}
                            {session.evaluationCount === 1 ? 'dente' : 'dentes'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={progressPercent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {session.completedCount}/{session.evaluationCount}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}

              {/* Load more button */}
              {hasMoreSessions && (
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={profile.loadMoreSessions}
                    disabled={profile.isFetchingSessions}
                  >
                    {profile.isFetchingSessions ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      'Carregar mais sessões'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientProfile;
