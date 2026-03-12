import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generatePatientDocument, type PatientDocument } from '@/data/evaluations';
import { evaluationKeys } from '@/lib/query-keys';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';

export interface UsePatientDocumentReturn {
  isGenerating: boolean;
  documents: PatientDocument[] | null;
  handleGenerateDocument: (includeTCLE: boolean) => Promise<void>;
  clearDocuments: () => void;
}

export function usePatientDocument(sessionId: string): UsePatientDocumentReturn {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [documents, setDocuments] = useState<PatientDocument[] | null>(null);

  const mutation = useMutation({
    mutationFn: ({ includeTCLE }: { includeTCLE: boolean }) =>
      generatePatientDocument(sessionId, includeTCLE),
    onSuccess: (data) => {
      setDocuments(data);
      queryClient.invalidateQueries({ queryKey: evaluationKeys.session(sessionId) });
      trackEvent('patient_document_generated', {
        session_id: sessionId,
        document_count: data.length,
        has_tcle: data.some(d => !!d.tcle),
      });
      toast.success(t('toasts.patientDocument.generated'));
    },
    onError: (error) => {
      logger.error('Error generating patient document:', error);
      toast.error(t('toasts.patientDocument.error'));
    },
  });

  const handleGenerateDocument = useCallback(async (includeTCLE: boolean) => {
    await mutation.mutateAsync({ includeTCLE });
  }, [mutation]);

  const clearDocuments = useCallback(() => {
    setDocuments(null);
  }, []);

  return {
    isGenerating: mutation.isPending,
    documents,
    handleGenerateDocument,
    clearDocuments,
  };
}
