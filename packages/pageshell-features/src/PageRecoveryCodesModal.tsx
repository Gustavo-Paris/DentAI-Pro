'use client';

/**
 * PageRecoveryCodesModal - Declarative modal for displaying recovery codes
 *
 * Handles the complete flow of showing recovery codes including:
 * - Warning about one-time use
 * - Formatted codes grid (XXXX-XXXX)
 * - Copy and download actions
 * - Confirmation checkbox before closing
 * - Unsaved codes confirmation dialog
 *
 * Uses PageRecoveryCodesList internally for the codes display.
 *
 * @example Basic usage
 * ```tsx
 * <PageRecoveryCodesModal
 *   open={showCodes}
 *   onOpenChange={setShowCodes}
 *   codes={recoveryCodes}
 *   onCopy={handleCopy}
 *   onDownload={handleDownload}
 * />
 * ```
 *
 * @example With custom labels
 * ```tsx
 * <PageRecoveryCodesModal
 *   open={showCodes}
 *   onOpenChange={setShowCodes}
 *   codes={recoveryCodes}
 *   onCopy={handleCopy}
 *   onDownload={handleDownload}
 *   title="Backup Codes"
 *   warningTitle="SAVE THESE CODES"
 *   warningDescription="Each code can only be used once."
 * />
 * ```
 */

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Key } from 'lucide-react';
import { Button, PageModal, PageConfirmDialog } from '@pageshell/primitives';
import { PageRecoveryCodesList } from './PageRecoveryCodesList';

// =============================================================================
// Types
// =============================================================================

export interface PageRecoveryCodesModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Array of recovery codes to display */
  codes: string[];
  /** Callback when copy button is clicked */
  onCopy?: () => void | Promise<void>;
  /** Callback when download button is clicked */
  onDownload?: () => void;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Warning box title */
  warningTitle?: string;
  /** Warning box description */
  warningDescription?: string;
  /** Confirmation checkbox text */
  confirmationText?: string;
  /** Close button text */
  closeText?: string;
  /** Copy button text */
  copyText?: string;
  /** Download button text */
  downloadText?: string;
  /** Unsaved dialog title */
  unsavedBaseDialogTitle?: string;
  /** Unsaved dialog description */
  unsavedBaseDialogDescription?: string;
  /** Format function for codes (default: XXXX-XXXX) */
  formatCode?: (code: string) => string;
}

// =============================================================================
// PageRecoveryCodesModal Component
// =============================================================================

export function PageRecoveryCodesModal({
  open,
  onOpenChange,
  codes,
  onCopy,
  onDownload,
  title = 'New Recovery Codes Generated',
  description = 'Store these codes in a safe place! You will not see them again.',
  warningTitle = 'IMPORTANT',
  warningDescription = 'Each code can only be used once. If you lose access to your authenticator app AND these codes, you will NOT be able to access your account.',
  confirmationText = 'I have saved my recovery codes in a safe place and understand that I will not be able to see them again.',
  closeText = 'Close',
  copyText = 'Copy Codes',
  downloadText = 'Download as .txt',
  unsavedBaseDialogTitle = 'Close without saving?',
  unsavedBaseDialogDescription = 'Have you saved your recovery codes? They will not be displayed again after closing this window.',
  formatCode,
}: PageRecoveryCodesModalProps) {
  // Internal state
  const [codesSaved, setCodesSaved] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setCodesSaved(false);
      setShowUnsavedDialog(false);
    }
  }, [open]);

  // Handle close attempt
  const handleCloseAttempt = useCallback(() => {
    if (!codesSaved) {
      setShowUnsavedDialog(true);
      return;
    }
    onOpenChange(false);
  }, [codesSaved, onOpenChange]);

  // Handle confirmed close (from unsaved dialog)
  const handleConfirmedClose = useCallback(() => {
    setShowUnsavedDialog(false);
    onOpenChange(false);
  }, [onOpenChange]);

  // Prevent closing via onOpenChange unless confirmed
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      handleCloseAttempt();
      return;
    }
    onOpenChange(newOpen);
  }, [handleCloseAttempt, onOpenChange]);

  return (
    <>
      <PageModal
        open={open}
        onOpenChange={handleOpenChange}
        title={title}
        description={description}
        icon={<Key className="h-5 w-5" />}
        size="lg"
        showClose={true}
        showFooterDivider={true}
        footer={
          <Button
            type="button"
            variant="default"
            onClick={handleCloseAttempt}
            disabled={!codesSaved}
            className="w-full"
          >
            {closeText}
          </Button>
        }
      >
        <PageRecoveryCodesList
          codes={codes}
          onCopy={onCopy}
          onDownload={onDownload}
          showWarning={true}
          warningTitle={warningTitle}
          warningDescription={warningDescription}
          showConfirmation={true}
          confirmed={codesSaved}
          onConfirmedChange={setCodesSaved}
          confirmationText={confirmationText}
          copyText={copyText}
          downloadText={downloadText}
          formatCode={formatCode}
        />
      </PageModal>

      {/* Unsaved Codes Confirmation Dialog */}
      <PageConfirmDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        title={unsavedBaseDialogTitle}
        description={unsavedBaseDialogDescription}
        onConfirm={handleConfirmedClose}
        confirmText="Sim, fechar"
        cancelText="Back"
        variant="warning"
      />
    </>
  );
}

PageRecoveryCodesModal.displayName = 'PageRecoveryCodesModal';
