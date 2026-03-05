import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@parisgroup-ai/pageshell/primitives';
import { Heart, AlertCircle, UtensilsCrossed, FileText } from 'lucide-react';
import type { PatientDocument } from '@/data/evaluations';

interface PatientDocumentSectionProps {
  documents: PatientDocument[];
}

export function PatientDocumentSection({ documents }: PatientDocumentSectionProps) {
  const { t } = useTranslation();

  if (documents.length === 0) return null;

  return (
    <div className="space-y-4 animate-[fade-in-up_0.6s_ease-out_0.15s_both]">
      <h2 className="text-lg font-display font-semibold flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        {t('patientDocument.orientationsTitle')}
      </h2>

      {documents.map((doc, idx) => (
        <div key={idx} className="space-y-3">
          {/* Treatment Explanation */}
          <Card className="shadow-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                {t('patientDocument.treatmentExplanation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line">{doc.treatment_explanation}</p>
            </CardContent>
          </Card>

          {/* Post-operative */}
          <Card className="shadow-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                {t('patientDocument.postOperative')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {doc.post_operative.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Dietary Guide */}
          <Card className="shadow-sm rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-green-500" />
                {t('patientDocument.dietaryGuide')}
                <span className="text-xs font-normal text-muted-foreground">
                  ({t('patientDocument.dietaryDuration', { hours: doc.dietary_guide.duration_hours })})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-destructive mb-1.5">{t('patientDocument.dietaryAvoid')}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.dietary_guide.avoid.map((item, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-green-600 mb-1.5">{t('patientDocument.dietaryPrefer')}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.dietary_guide.prefer.map((item, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TCLE */}
          {doc.tcle && (
            <Card className="shadow-sm rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('patientDocument.tcle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-lg leading-relaxed">
                  {doc.tcle}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}
