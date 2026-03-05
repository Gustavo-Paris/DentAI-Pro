import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  Label,
} from '@parisgroup-ai/pageshell/primitives';
import { FileText, Download, Copy, Loader2, Check, UtensilsCrossed, Heart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { usePatientDocument } from '@/hooks/domain/evaluation';
import type { PatientDocument } from '@/data/evaluations';
import type { SessionEvaluationRow } from '@/data/evaluations';

interface PatientDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  evaluations: SessionEvaluationRow[];
}

export function PatientDocumentModal({ open, onOpenChange, sessionId, evaluations }: PatientDocumentModalProps) {
  const { t } = useTranslation();
  const [includeTCLE, setIncludeTCLE] = useState(true);
  const { isGenerating, documents, handleGenerateDocument } = usePatientDocument(sessionId);

  // Check if any evaluation already has a patient_document (consolidated: all evals share the same doc)
  const firstExisting = evaluations.find(e => e.patient_document)?.patient_document as PatientDocument | undefined;
  const existingDocs = firstExisting ? [firstExisting] : [];

  const displayDocs = documents || (existingDocs.length > 0 ? existingDocs : null);

  const handleCopy = async () => {
    if (!displayDocs) return;
    const text = displayDocs.map(doc => {
      let content = `${t('patientDocument.treatmentExplanation')}\n\n${doc.treatment_explanation}\n\n`;
      content += `${t('patientDocument.postOperative')}\n${doc.post_operative.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\n`;
      content += `${t('patientDocument.dietaryGuide')} (${t('patientDocument.dietaryDuration', { hours: doc.dietary_guide.duration_hours })})\n`;
      content += `${t('patientDocument.dietaryAvoid')}: ${doc.dietary_guide.avoid.join(', ')}\n`;
      content += `${t('patientDocument.dietaryPrefer')}: ${doc.dietary_guide.prefer.join(', ')}`;
      if (doc.tcle) {
        content += `\n\n${t('patientDocument.tcle')}\n${doc.tcle}`;
      }
      return content;
    }).join('\n\n---\n\n');

    await navigator.clipboard.writeText(text);
    toast.success(t('patientDocument.copied'));
  };

  const handleDownloadPDF = async () => {
    if (!displayDocs) return;
    // Dynamic import to avoid loading jsPDF on initial page load
    const { generatePatientPDF } = await import('@/lib/pdf/patientPDF');
    const patientName = evaluations[0]?.patient_name || 'Paciente';
    await generatePatientPDF(displayDocs, patientName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('patientDocument.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Generate controls */}
        {!displayDocs && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {t('patientDocument.generateDescription')}
            </p>
            <div className="flex items-center gap-3">
              <Switch
                id="include-tcle"
                checked={includeTCLE}
                onCheckedChange={setIncludeTCLE}
              />
              <Label htmlFor="include-tcle" className="text-sm">
                {t('patientDocument.includeTCLE')}
              </Label>
            </div>
            <Button
              onClick={() => handleGenerateDocument(includeTCLE)}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('patientDocument.generating')}
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  {t('patientDocument.generate')}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Document preview */}
        {displayDocs && (
          <div className="space-y-4 py-4">
            {displayDocs.map((doc, idx) => (
              <div key={idx} className="space-y-3">
                {/* Treatment Explanation */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      {t('patientDocument.treatmentExplanation')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-line">{doc.treatment_explanation}</p>
                  </CardContent>
                </Card>

                {/* Post-operative */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      {t('patientDocument.postOperative')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {doc.post_operative.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Dietary Guide */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-green-500" />
                      {t('patientDocument.dietaryGuide')}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({t('patientDocument.dietaryDuration', { hours: doc.dietary_guide.duration_hours })})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-destructive mb-1">{t('patientDocument.dietaryAvoid')}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.dietary_guide.avoid.map((item, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{item}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">{t('patientDocument.dietaryPrefer')}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.dietary_guide.prefer.map((item, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">{item}</span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* TCLE */}
                {doc.tcle && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{t('patientDocument.tcle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/50 p-3 rounded-lg">{doc.tcle}</pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-1.5" />
                {t('patientDocument.copy')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-1.5" />
                {t('patientDocument.downloadPDF')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
