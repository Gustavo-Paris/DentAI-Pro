import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@parisgroup-ai/pageshell/primitives';
import { Loader2, Download, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import type { DataExport, DeleteAccountResult } from '@/data/privacy';

export function PrivacySection({
  exportData,
  deleteAccount,
}: {
  exportData: () => Promise<DataExport>;
  deleteAccount: (confirmation: string) => Promise<DeleteAccountResult>;
}) {
  const { t } = useTranslation();
  const CONFIRMATION_PHRASE = t('profile.deleteConfirmPhrase');
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = await exportData();

      // Trigger browser download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${t('profile.exportFilename')}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t('profile.exportSuccess'));
    } catch (error) {
      logger.error('Error exporting data:', error);
      toast.error(t('profile.exportError'));
    } finally {
      setIsExporting(false);
    }
  }, [exportData]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmation !== CONFIRMATION_PHRASE) {
      toast.error(t('profile.deleteTypeExact', { phrase: CONFIRMATION_PHRASE }));
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteAccount(deleteConfirmation);

      if (result.success) {
        toast.success(t('profile.deleteSuccess'));
        setShowDeleteDialog(false);
        // Sign out and redirect to home
        await signOut();
        navigate('/', { replace: true });
      } else {
        toast.error(result.message || t('profile.deleteError'));
      }
    } catch (error) {
      logger.error('Error deleting account:', error);
      toast.error(t('profile.deleteRetryError'));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmation, signOut, navigate]);

  return (
    <div className="space-y-6">
      {/* LGPD Rights Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-display">{t('profile.lgpdTitle')}</CardTitle>
              <CardDescription>
                {t('profile.lgpdLaw')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              {t('profile.lgpdIntro')}
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>{t('profile.lgpdAccess')}</strong> {t('profile.lgpdAccessDesc')}</li>
              <li><strong>{t('profile.lgpdDeletion')}</strong> {t('profile.lgpdDeletionDesc')}</li>
              <li><strong>{t('profile.lgpdCorrection')}</strong> {t('profile.lgpdCorrectionDesc')}</li>
              <li><strong>{t('profile.lgpdInfo')}</strong> {t('profile.lgpdInfoDesc')}</li>
            </ul>
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs">
                <strong>{t('profile.lgpdRetention')}</strong> {t('profile.lgpdRetentionDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">{t('profile.exportDataTitle')}</CardTitle>
          <CardDescription>
            {t('profile.exportDataDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('profile.exportDataIncludes')}
          </p>
          <Button
            onClick={handleExportData}
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('profile.exporting')}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {t('profile.exportButton')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg font-display text-destructive">{t('profile.deleteAccountTitle')}</CardTitle>
              <CardDescription>
                {t('profile.deleteAccountDesc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('profile.deleteAccountWarning')}
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('profile.deleteAccountButton')}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open);
        if (!open) setDeleteConfirmation('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{t('profile.confirmDeleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('profile.confirmDeleteDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-medium text-destructive">
                {t('profile.deleteDataList')}
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-5">
                <li>{t('profile.deleteDataProfile')}</li>
                <li>{t('profile.deleteDataPatients')}</li>
                <li>{t('profile.deleteDataPhotos')}</li>
                <li>{t('profile.deleteDataProtocols')}</li>
                <li>{t('profile.deleteDataCredits')}</li>
                <li>{t('profile.deleteDataSubscription')}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                {t('profile.deleteConfirmLabelPrefix')} <strong className="text-destructive">{CONFIRMATION_PHRASE}</strong> {t('profile.deleteConfirmLabelSuffix')}
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={CONFIRMATION_PHRASE}
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
              disabled={isDeleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== CONFIRMATION_PHRASE}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('profile.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('profile.deletePermanently')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
