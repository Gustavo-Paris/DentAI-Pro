import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Eye,
  FileDown,
  CheckCircle,
  MoreHorizontal,
  Calendar,
  User,
  Image as ImageIcon,
  AlertCircle,
  Layers,
  Crown,
  Stethoscope,
  ArrowUpRight,
  CircleX,
  Plus,
  Share2,
  Loader2 as ShareLoader,
} from 'lucide-react';

import { useEvaluationDetail } from '@/hooks/domain/useEvaluationDetail';
import type { EvaluationItem } from '@/hooks/domain/useEvaluationDetail';
import { AddTeethModal } from '@/components/AddTeethModal';
import { ClinicalPhotoThumbnail } from '@/components/OptimizedImage';

// =============================================================================
// Treatment type configuration (presentation-only)
// =============================================================================

const treatmentConfig: Record<string, {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  resina: { label: 'Resina Composta', shortLabel: 'Resina', icon: Layers, variant: 'default' },
  porcelana: { label: 'Faceta de Porcelana', shortLabel: 'Faceta', icon: Crown, variant: 'secondary' },
  coroa: { label: 'Coroa Total', shortLabel: 'Coroa', icon: Crown, variant: 'secondary' },
  implante: { label: 'Implante', shortLabel: 'Implante', icon: CircleX, variant: 'outline' },
  endodontia: { label: 'Endodontia', shortLabel: 'Endo', icon: Stethoscope, variant: 'outline' },
  encaminhamento: { label: 'Encaminhamento', shortLabel: 'Encaminhar', icon: ArrowUpRight, variant: 'outline' },
};

// =============================================================================
// Presentation helpers
// =============================================================================

function getTreatmentBadge(evaluation: EvaluationItem) {
  const treatmentType = evaluation.treatment_type || 'resina';
  const config = treatmentConfig[treatmentType] || treatmentConfig.resina;
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

  return (
    <div>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{detail.patientName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {detail.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Evaluation Header */}
            <Card className="mb-4 sm:mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  {/* Photo Preview */}
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

                  {/* Evaluation Info */}
                  <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-semibold mb-2">{detail.patientName}</h1>

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

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Progresso:</span>
                      <span className="font-medium">
                        {detail.completedCount}/{detail.evaluations.length} finalizados
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={detail.handleShareCase}
                disabled={detail.isSharing}
                className="text-xs sm:text-sm"
              >
                {detail.isSharing ? (
                  <ShareLoader className="w-4 h-4 sm:mr-2 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>
              {detail.pendingTeeth.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => detail.setShowAddTeethModal(true)}
                  className="text-xs sm:text-sm border-primary/50 text-primary hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Adicionar mais dentes</span>
                  <span className="sm:hidden">Adicionar</span>
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {detail.pendingTeeth.length}
                  </Badge>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={detail.handleMarkAllAsCompleted}
                disabled={detail.completedCount === detail.evaluations.length}
                className="text-xs sm:text-sm"
              >
                <CheckCircle className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Marcar todos como concluídos</span>
                <span className="sm:hidden">Concluir todos</span>
              </Button>
            </div>

            {/* Cases Table - Desktop */}
            <Card className="hidden sm:block">
              <CardHeader>
                <CardTitle className="text-lg">Casos Gerados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dente</TableHead>
                      <TableHead>Tratamento</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.evaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">{evaluation.tooth}</TableCell>
                        <TableCell>{getTreatmentBadge(evaluation)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground capitalize">
                            {detail.getClinicalDetails(evaluation)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(evaluation, detail.getChecklistProgress)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
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
                                      onClick={() => detail.handleMarkAsCompleted(evaluation.id)}
                                      disabled={!detail.canMarkAsCompleted(evaluation)}
                                      className={!detail.canMarkAsCompleted(evaluation) ? 'opacity-50' : ''}
                                    >
                                      {detail.canMarkAsCompleted(evaluation) ? (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                      ) : (
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                      )}
                                      Marcar como finalizado
                                    </DropdownMenuItem>
                                  </TooltipTrigger>
                                  {!detail.canMarkAsCompleted(evaluation) && (
                                    <TooltipContent>
                                      Complete o checklist para finalizar
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
              <h3 className="font-semibold text-lg">Casos Gerados</h3>
              {detail.evaluations.map((evaluation) => (
                <Card key={evaluation.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTreatmentBadge(evaluation)}
                      <p className="font-semibold">Dente {evaluation.tooth}</p>
                    </div>
                    {getStatusBadge(evaluation, detail.getChecklistProgress)}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 capitalize">
                    {detail.getClinicalDetails(evaluation)}
                  </p>

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
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => detail.handleExportPDF(evaluation.id)}>
                          <FileDown className="w-4 h-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                        {evaluation.status !== 'completed' && detail.canMarkAsCompleted(evaluation) && (
                          <DropdownMenuItem onClick={() => detail.handleMarkAsCompleted(evaluation.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar como finalizado
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
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
    </div>
  );
}
