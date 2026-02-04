'use client';

/**
 * PageRecoveryCodesList - Reusable recovery codes display component
 *
 * Displays recovery codes with copy/download actions and confirmation checkbox.
 * Can be used standalone (inline) or within PageRecoveryCodesModal.
 *
 * @example Inline usage (setup wizard)
 * ```tsx
 * <PageRecoveryCodesList
 *   codes={recoveryCodes}
 *   onCopy={handleCopy}
 *   onDownload={handleDownload}
 *   confirmed={codesSaved}
 *   onConfirmedChange={setCodesSaved}
 * />
 * ```
 *
 * @example With warning (default)
 * ```tsx
 * <PageRecoveryCodesList
 *   codes={recoveryCodes}
 *   onCopy={handleCopy}
 *   onDownload={handleDownload}
 *   showWarning
 * />
 * ```
 *
 * @example Without confirmation (view only)
 * ```tsx
 * <PageRecoveryCodesList
 *   codes={recoveryCodes}
 *   onCopy={handleCopy}
 *   showConfirmation={false}
 * />
 * ```
 */

import * as React from 'react';
import { AlertTriangle, Copy, Download } from 'lucide-react';
import { Button } from '@pageshell/primitives';

// =============================================================================
// Types
// =============================================================================

export interface PageRecoveryCodesListProps {
  /** Array of recovery codes to display */
  codes: string[];
  /** Callback when copy button is clicked */
  onCopy?: () => void | Promise<void>;
  /** Callback when download button is clicked */
  onDownload?: () => void;
  /** Show warning box at top */
  showWarning?: boolean;
  /** Warning box title */
  warningTitle?: string;
  /** Warning box description */
  warningDescription?: string;
  /** Show confirmation checkbox */
  showConfirmation?: boolean;
  /** Controlled confirmation state */
  confirmed?: boolean;
  /** Callback when confirmation changes */
  onConfirmedChange?: (confirmed: boolean) => void;
  /** Confirmation checkbox text */
  confirmationText?: string;
  /** Copy button text */
  copyText?: string;
  /** Download button text */
  downloadText?: string;
  /** Format function for codes (default: XXXX-XXXX) */
  formatCode?: (code: string) => string;
  /** Additional CSS classes for container */
  className?: string;
}

// =============================================================================
// Default Formatter
// =============================================================================

const defaultFormatCode = (code: string): string => {
  if (code.length === 8) {
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }
  return code;
};

// =============================================================================
// PageRecoveryCodesList Component
// =============================================================================

export function PageRecoveryCodesList({
  codes,
  onCopy,
  onDownload,
  showWarning = true,
  warningTitle = 'IMPORTANTE',
  warningDescription = 'Cada código pode ser usado apenas uma vez. Se você perder o acesso ao seu aplicativo autenticador E a esses códigos, você NÃO conseguirá acessar sua conta.',
  showConfirmation = true,
  confirmed,
  onConfirmedChange,
  confirmationText = 'Eu salvei meus códigos de recuperação em local seguro e entendo que não poderei vê-los novamente.',
  copyText = 'Copiar Códigos',
  downloadText = 'Baixar como .txt',
  formatCode = defaultFormatCode,
  className,
}: PageRecoveryCodesListProps) {
  // Internal state for uncontrolled mode
  const [internalConfirmed, setInternalConfirmed] = React.useState(false);

  // Use controlled or uncontrolled state
  const isConfirmed = confirmed !== undefined ? confirmed : internalConfirmed;
  const handleConfirmedChange = (value: boolean) => {
    if (onConfirmedChange) {
      onConfirmedChange(value);
    } else {
      setInternalConfirmed(value);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Warning Box */}
        {showWarning && (
          <div className="flex gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-warning">{warningTitle}</p>
              <p className="text-sm mt-1 text-muted-foreground">
                {warningDescription}
              </p>
            </div>
          </div>
        )}

        {/* Recovery Codes Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {codes.map((code) => (
              <div
                key={code}
                className="px-3 py-2 rounded-md bg-muted/50 border border-border text-center font-mono text-sm text-foreground"
              >
                {formatCode(code)}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          {(onCopy || onDownload) && (
            <div className="grid grid-cols-2 gap-3">
              {onCopy && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCopy}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copyText}
                </Button>
              )}
              {onDownload && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDownload}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadText}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Checkbox */}
        {showConfirmation && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => handleConfirmedChange(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-sm text-muted-foreground">
              {confirmationText}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}

PageRecoveryCodesList.displayName = 'PageRecoveryCodesList';
