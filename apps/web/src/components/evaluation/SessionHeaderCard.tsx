import { useTranslation } from 'react-i18next';
import { Badge, Card, CardContent, Progress } from '@parisgroup-ai/pageshell/primitives';
import { Calendar, User, Image as ImageIcon, Eye } from 'lucide-react';
import { ClinicalPhotoThumbnail } from '@/components/OptimizedImage';
import { formatToothLabel } from '@/lib/treatment-config';

// =============================================================================
// Types
// =============================================================================

interface ToothItem {
  id: string;
  tooth: string;
}

export interface SessionHeaderCardProps {
  /** URL path for the clinical photo */
  photoPath?: string | null;
  /** Patient name */
  patientName: string;
  /** Formatted date for desktop view */
  evaluationDate: string;
  /** Formatted date for mobile view */
  evaluationDateShort: string;
  /** Array of evaluation items containing tooth data */
  teeth: ToothItem[];
  /** Number of completed evaluations */
  completedCount: number;
  /** Total number of evaluations */
  evaluationCount: number;
  /** Whether the DSD simulation is available */
  hasDSD: boolean;
  /** Handler for clicking the photo when DSD is available */
  onPhotoClick: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function SessionHeaderCard({
  photoPath,
  evaluationDate,
  evaluationDateShort,
  teeth,
  completedCount,
  evaluationCount,
  hasDSD,
  onPhotoClick,
}: SessionHeaderCardProps) {
  const { t } = useTranslation();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPhotoClick();
    }
  };

  return (
    <Card className="mb-4 sm:mb-6 rounded-xl overflow-hidden glass-card">
      <div className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {photoPath ? (
              <div
                className={`relative w-full md:w-32 lg:w-48 h-32 sm:h-48 flex-shrink-0 group ${hasDSD ? 'cursor-pointer' : ''}`}
                onClick={hasDSD ? onPhotoClick : undefined}
                onKeyDown={hasDSD ? handleKeyDown : undefined}
                role={hasDSD ? 'button' : undefined}
                tabIndex={hasDSD ? 0 : undefined}
                aria-label={hasDSD ? t('dsd.viewSimulation') : undefined}
              >
                <ClinicalPhotoThumbnail
                  path={photoPath}
                  alt={t('evaluation.clinicalPhoto')}
                  size="grid"
                  className="w-full h-full"
                />
                {hasDSD && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background/90 px-2 py-1 rounded-full text-xs font-medium">
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      {t('components.evaluationDetail.viewDSD')}
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
                  <span className="hidden sm:inline">{evaluationDate}</span>
                  <span className="sm:hidden">{evaluationDateShort}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  {evaluationCount} {t('evaluation.teeth')}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                {teeth.map((e) => (
                  <Badge key={e.id} variant="outline" className="text-xs">
                    {formatToothLabel(e.tooth)}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">{t('evaluation.progress')}</span>
                <Progress
                  value={evaluationCount > 0 ? (completedCount / evaluationCount) * 100 : 0}
                  className="h-2 flex-1 max-w-[200px]"
                />
                <span className="font-medium text-xs tabular-nums">
                  {completedCount}/{evaluationCount}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
