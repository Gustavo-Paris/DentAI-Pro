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
  FileDown,
  CheckCircle,
  MoreHorizontal,
  Calendar,
  User,
  Image as ImageIcon,
  Plus,
  Share2,
  Loader2 as ShareLoader,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

import { DetailPage } from '@pageshell/composites';
import { useEvaluationDetail } from '@/hooks/domain/useEvaluationDetail';
import { Progress } from '@/components/ui/progress';
import type { EvaluationItem } from '@/hooks/domain/useEvaluationDetail';
import { AddTeethModal } from '@/components/AddTeethModal';
import { ClinicalPhotoThumbnail } from '@/components/OptimizedImage';
import { DSDPreviewModal } from '@/components/DSDPreviewModal';
import { getTreatmentConfig, formatToothLabel } from '@/lib/treatment-config';

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
  const [showDSD, setShowDSD] = useState(false);

  const firstEval = detail.evaluations[0];
  const hasDSD = !!(firstEval?.dsd_simulation_url || firstEval?.dsd_simulation_layers?.length);

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
          { label: 'Avaliações', href: '/evaluations' },
          { label: detail.patientName },
        ]}
        query={{ data: detail.evaluations, isLoading: detail.isLoading }}
        headerActions={[
          {
            label: 'Nova Avaliação',
            icon: Sparkles,
            onClick: () => navigate('/new-case'),
            variant: 'default',
          },
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
                    {firstEval?.photo_frontal ? (
                      <div
                        className={`relative w-full md:w-32 lg:w-48 h-32 sm:h-48 flex-shrink-0 group ${hasDSD ? 'cursor-pointer' : ''}`}
                        onClick={hasDSD ? () => setShowDSD(true) : undefined}
                      >
                        <ClinicalPhotoThumbnail
                          path={firstEval.photo_frontal}
                          alt="Foto clínica"
                          size="grid"
                          className="w-full h-full"
                        />
                        {hasDSD && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/90 px-2 py-1 rounded-full text-xs font-medium">
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              Ver DSD
                            </div>
                          </div>
                        )}
                      </div>
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
                            {formatToothLabel(e.tooth)}
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
            {/* Floating selection bar */}
            {detail.selectedIds.size > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background border shadow-lg rounded-full px-4 py-2 flex items-center gap-3 animate-in slide-in-from-bottom-4">
                <span className="text-sm font-medium">{detail.selectedIds.size} selecionado(s)</span>
                <Button
                  size="sm"
                  onClick={() => detail.handleBulkComplete(Array.from(detail.selectedIds))}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Finalizar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={detail.clearSelection}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Cases Table - Desktop */}
            <Card className="hidden sm:block shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-display">Casos Gerados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={detail.selectedIds.size === detail.evaluations.length && detail.evaluations.length > 0}
                          onCheckedChange={() => detail.toggleSelectAll()}
                        />
                      </TableHead>
                      <TableHead>Dente</TableHead>
                      <TableHead>Tratamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.evaluations.map((evaluation) => (
                      <TableRow
                        key={evaluation.id}
                        className="hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/result/${evaluation.id}`)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={detail.selectedIds.has(evaluation.id)}
                            onCheckedChange={() => detail.toggleSelection(evaluation.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{evaluation.tooth === 'GENGIVO' ? 'Gengiva' : evaluation.tooth}</TableCell>
                        <TableCell>{getTreatmentBadge(evaluation)}</TableCell>
                        <TableCell>
                          {getStatusBadge(evaluation, detail.getChecklistProgress)}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Mais opções">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                <Card
                  key={evaluation.id}
                  className={`p-4 shadow-sm rounded-xl border-l-[3px] ${borderColor} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => navigate(`/result/${evaluation.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={detail.selectedIds.has(evaluation.id)}
                          onCheckedChange={() => detail.toggleSelection(evaluation.id)}
                        />
                      </div>
                      {getTreatmentBadge(evaluation)}
                      <p className="font-semibold">{formatToothLabel(evaluation.tooth)}</p>
                    </div>
                    {getStatusBadge(evaluation, detail.getChecklistProgress)}
                  </div>

                  {evaluation.treatment_type === 'resina' && evaluation.resins && (
                    <div className="mb-3 p-2 bg-muted/50 rounded">
                      <p className="text-sm font-medium">{evaluation.resins.name}</p>
                      <p className="text-xs text-muted-foreground">{evaluation.resins.manufacturer}</p>
                    </div>
                  )}

                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
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

      {/* DSD Preview Modal */}
      {hasDSD && (
        <DSDPreviewModal
          open={showDSD}
          onOpenChange={setShowDSD}
          photoPath={firstEval?.photo_frontal ?? null}
          simulationPath={firstEval?.dsd_simulation_url ?? null}
          layers={firstEval?.dsd_simulation_layers}
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
