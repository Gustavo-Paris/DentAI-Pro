import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Badge, Button } from '@parisgroup-ai/pageshell/primitives';
import { Sparkles, Crown, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PhotoAnalysisResult } from '../ReviewAnalysisStep';

interface TreatmentBannersProps {
  analysisResult: PhotoAnalysisResult | null;
  selectedTeeth: string[];
  hasInventory: boolean;
  whiteningLevel?: 'natural' | 'white' | 'hollywood';
  dsdSuggestions?: { tooth: string; current_issue: string; proposed_change: string }[];
}

export function TreatmentBanners({
  analysisResult,
  selectedTeeth,
  hasInventory,
  whiteningLevel,
  dsdSuggestions,
}: TreatmentBannersProps) {
  const { t } = useTranslation();

  const gingivaSuggestions = useMemo(() => {
    if (!dsdSuggestions) return [];
    return dsdSuggestions.filter(s => {
      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
      return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite');
    });
  }, [dsdSuggestions]);

  return (
    <>
      {/* Whitening Level Badge */}
      {whiteningLevel && whiteningLevel !== 'natural' && (
        <Card className="card-elevated border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-3 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">{t('components.wizard.review.whiteningLevel')}</span>
            <Badge variant="secondary" className="font-medium">
              {whiteningLevel === 'hollywood' ? t('components.wizard.review.hollywoodWhite') : t('components.wizard.review.naturalWhite')}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Gengivoplasty Banner — auto-added from DSD */}
      {selectedTeeth.includes('GENGIVO') && (
        <Card className="border-pink-500/50 bg-pink-50 dark:bg-pink-950/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-pink-800 dark:text-pink-200">
                    {t('components.wizard.review.gingivoplastyTitle')}
                  </h4>
                  <Badge variant="secondary" className="text-xs bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300">
                    {t('components.wizard.review.recommendedByDSD')}
                  </Badge>
                </div>
                <p className="text-sm text-pink-700 dark:text-pink-300">
                  {t('components.wizard.review.gingivoplastyDesc')}
                </p>
                {gingivaSuggestions.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {gingivaSuggestions.map((s, i) => (
                      <li key={i} className="text-xs text-pink-600 dark:text-pink-400">
                        {t('components.wizard.review.tooth', { number: s.tooth })}: {s.proposed_change}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Warning Banner */}
      {!hasInventory && (
        <Card className="border-primary/30 bg-primary/5 dark:bg-primary/10">
          <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-sm text-primary/80">
                {t('components.wizard.review.noResins')}
              </span>
            </div>
            <Link to="/inventory">
              <Button variant="outline" size="sm" className="text-xs btn-press">
                {t('components.wizard.review.registerResins')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Treatment Type Indication Banner */}
      {analysisResult?.treatment_indication === 'porcelana' && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-warning mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-warning">
                  {t('components.wizard.review.porcelainTitle')}
                </h4>
                <p className="text-sm text-warning/80 mt-1">
                  {analysisResult.indication_reason || t('components.wizard.review.porcelainDefault')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
