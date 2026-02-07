import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Eye,
  FileDown,
  CheckCircle,
  MoreHorizontal,
  Calendar,
  User,
  Image as ImageIcon,
  Plus,
  Share2,
  Loader2 as ShareLoader,
} from 'lucide-react';

import { DetailPage } from '@pageshell/composites';
import { useEvaluationDetail } from '@/hooks/domain/useEvaluationDetail';
import { Progress } from '@/components/ui/progress';
import type { EvaluationItem } from '@/hooks/domain/useEvaluationDetail';
import { AddTeethModal } from '@/components/AddTeethModal';
import { ClinicalPhotoThumbnail } from '@/components/OptimizedImage';
import { getTreatmentConfig } from '@/lib/treatment-config';

// =============================================================================
// Presentation helpers
// =============================================================================

function getTreatmentBadge(evaluation: EvaluationItem) {
  const config = getTreatmentConfig(evaluation.treatment_type);
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <IconComponent className="w-3 h-3" />
      <span className="hidden md:inline">{config.shortLabel}</span>
    </Badge>
  );
}

function getStatusBadge(evaluation: EvaluationItem, getChecklistProgress: (e: EvaluationItem) => { current: number; total: number }) {
  if (evaluation.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
        <CheckCircle className="w-3 h-3" />
        <span className="hidden sm:inline">Finalizado</span>
      </span>
    );
  }

  const { current, total } = getChecklistProgress(evaluation);
  const hasChecklist = total > 0;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
      <span className="hidden sm:inline">Planejado</span>
      {hasChecklist && (
        <span className="text-muted-foreground">({current}/{total})</span>
      )}
    </span>
  );
}

// =============================================================================
// Page Adapter
// =============================================================================

export default function EvaluationDetails() {
  const detail = useEvaluationDetail();
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    evaluationId: string;
    current: number;
    total: number;
  }>({ open: false, evaluationId: '', current: 0, total: 0 });

  const handleCompleteClick = (id: string) => {
    const result = detail.handleMarkAsCompleted(id);
    if (result?.pending) {
      setConfirmDialog({ open: true, evaluationId: id, current: result.current, total: result.total });
    }
  };

  const handleConfirmComplete = () => {
    detail.handleMarkAsCompleted(confirmDialog.evaluationId, true);
    setConfirmDialog({ open: false, evaluationId: '', current: 0, total: 0 });
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <DetailPage
        title={detail.patientName}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: detail.patientName },
        ]}
        query={{ data: detail.evaluations, isLoading: detail.isLoading }}
        headerActions={[
          {
            label: 'Compartilhar',
            icon: detail.isSharing ? ShareLoader : Share2,
            onClick: detail.handleShareCase,
            disabled: detail.isSharing,
            variant: 'outline',
          },
          ...(detail.pendingTeeth.length > 0
            ? [{
                label: `Adicionar mais dentes (${detail.pendingTeeth.length})`,
                icon: Plus,
                onClick: () => detail.setShowAddTeethModal(true),
                variant: 'outline' as const,
              }]
            : []),
          {
            label: 'Marcar todos como concluídos',
            icon: CheckCircle,
            onClick: detail.handleMarkAllAsCompleted,
            disabled: detail.completedCount === detail.evaluations.length,
            variant: 'outline',
          },
        ]}
        slots={{
          beforeContent: (
            <Card className="mb-4 sm:mb-6 shadow-sm rounded-xl overflow-hidden">
              <div className="bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                    {detail.evaluations[0]?.photo_frontal ? (
                      <ClinicalPhotoThumbnail
                        path={detail.evaluations[0].photo_frontal}
                        alt="Foto clínica"
                        size="grid"
                        className="w-full md:w-32 lg:w-48 h-32 sm:h-48 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-full md:w-32 lg:w-48 h-32 sm:h-48 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-8 sm:w-12 h-8 sm:h-12 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">{detail.evaluationDate}</span>
                          <span className="sm:hidden">{detail.evaluationDateShort}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                          {detail.evaluations.length} dente(s)
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                        {detail.evaluations.map((e) => (
                          <Badge key={e.id} variant="outline" className="text-xs">
                            Dente {e.tooth}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">Progresso:</span>
                        <Progress
                          value={detail.evaluations.length > 0 ? (detail.completedCount / detail.evaluations.length) * 100 : 0}
                          className="h-2 flex-1 max-w-[200px]"
                        />
                        <span className="font-medium text-xs tabular-nums">
                          {detail.completedCount}/{detail.evaluations.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ),
        }}
      >
        {() => (
          <>
            {/* Cases Table - Desktop */}
            <Card className="hidden sm:block shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-display">Casos Gerados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Dente</TableHead>
                      <TableHead>Tratamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.evaluations.map((evaluation) => (
                      <TableRow key={evaluation.id} className="hover:bg-secondary/30 transition-colors">
                        <TableCell className="font-medium">{evaluation.tooth}</TableCell>
                        <TableCell>{getTreatmentBadge(evaluation)}</TableCell>
                        <TableCell>
                          {getStatusBadge(evaluation, detail.getChecklistProgress)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Mais opções">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/result/${evaluation.id}`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver caso
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => detail.handleExportPDF(evaluation.id)}>
                                <FileDown className="w-4 h-4 mr-2" />
                                Exportar PDF
                              </DropdownMenuItem>
                              {evaluation.status !== 'completed' && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DropdownMenuItem
                                      onClick={() => handleCompleteClick(evaluation.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Marcar como finalizado
                                    </DropdownMenuItem>
                                  </TooltipTrigger>
                                  {!detail.isChecklistComplete(evaluation) && (
                                    <TooltipContent>
                                      {detail.getChecklistProgress(evaluation).current} de {detail.getChecklistProgress(evaluation).total} itens completos no checklist
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Cases Cards - Mobile */}
            <div className="sm:hidden space-y-3">
              <h3 className="font-semibold font-display text-lg">Casos Gerados</h3>
              {detail.evaluations.map((evaluation) => {
                const treatmentConfig = getTreatmentConfig(evaluation.treatment_type);
                const borderColor = treatmentConfig.variant === 'default' ? 'border-l-primary' : 'border-l-amber-500';
                return (
                <Card key={evaluation.id} className={`p-4 shadow-sm rounded-xl border-l-[3px] ${borderColor}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTreatmentBadge(evaluation)}
                      <p className="font-semibold">Dente {evaluation.tooth}</p>
                    </div>
                    {getStatusBadge(evaluation, detail.getChecklistProgress)}
                  </div>

                  {evaluation.treatment_type === 'resina' && evaluation.resins && (
                    <div className="mb-3 p-2 bg-muted/50 rounded">
                      <p className="text-sm font-medium">{evaluation.resins.name}</p>
                      <p className="text-xs text-muted-foreground">{evaluation.resins.manufacturer}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/result/${evaluation.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" aria-label="Mais opções">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => detail.handleExportPDF(evaluation.id)}>
                          <FileDown className="w-4 h-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                        {evaluation.status !== 'completed' && (
                          <DropdownMenuItem onClick={() => handleCompleteClick(evaluation.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar como finalizado
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
                );
              })}
            </div>
          </>
        )}
      </DetailPage>
      </div>

      {/* Add Teeth Modal */}
      {detail.evaluations.length > 0 && detail.patientDataForModal && (
        <AddTeethModal
          open={detail.showAddTeethModal}
          onClose={() => detail.setShowAddTeethModal(false)}
          pendingTeeth={detail.pendingTeeth}
          sessionId={detail.sessionId}
          patientData={detail.patientDataForModal}
          onSuccess={detail.handleAddTeethSuccess}
        />
      )}

      {/* Confirm completion with incomplete checklist */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog({ open: false, evaluationId: '', current: 0, total: 0 });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Checklist incompleto</AlertDialogTitle>
            <AlertDialogDescription>
              Existem {confirmDialog.current} de {confirmDialog.total} itens completos no checklist.
              Deseja finalizar mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete}>
              Finalizar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
