/**
 * Recovery Codes UI Utilities
 *
 * Client-side utilities for formatting, copying, and downloading recovery codes.
 * Framework-agnostic, works in any browser environment.
 *
 * @packageDocumentation
 */

// =============================================================================
// Constants
// =============================================================================

/** Default recovery code length (8 characters) */
export const RECOVERY_CODE_LENGTH = 8;

/** Default split position for display formatting (4 characters) */
export const RECOVERY_CODE_SPLIT = 4;

// =============================================================================
// Types
// =============================================================================

/**
 * Translated strings for recovery codes download file.
 * All fields are required to ensure proper localization.
 */
export interface RecoveryCodesDownloadStrings {
  /** Header title (e.g., "My App - MFA Recovery Codes") */
  title: string;
  /** Generated at label (e.g., "Generated at:") */
  generatedAt: string;
  /** Important notice (e.g., "IMPORTANT: Keep these codes safe!...") */
  importantNotice: string;
  /** Footer warning (e.g., "If you lose access to your authenticator...") */
  footerWarning: string;
}

/**
 * Options for downloading recovery codes.
 */
export interface DownloadRecoveryCodesOptions {
  /** Filename for download (default: "recovery-codes.txt") */
  filename?: string;
  /** Locale for date formatting (default: 'en-US') */
  locale?: string;
  /** Translated strings for file content */
  strings?: RecoveryCodesDownloadStrings;
  /** Code length for formatting (default: 8) */
  codeLength?: number;
}

// =============================================================================
// Default Strings
// =============================================================================

/**
 * Default English strings for recovery codes download.
 */
export const DEFAULT_RECOVERY_CODES_STRINGS: RecoveryCodesDownloadStrings = {
  title: 'MFA Recovery Codes',
  generatedAt: 'Generated at:',
  importantNotice: 'IMPORTANT: Keep these codes in a safe place! Each code can only be used once.',
  footerWarning: `If you lose access to your authenticator app and these codes,
you will NOT be able to access your account. Contact support if
you need help recovering access.`,
};

// =============================================================================
// Formatting
// =============================================================================

/**
 * Format recovery code for display (with hyphen for readability).
 *
 * @param code - Plain-text recovery code
 * @param codeLength - Expected code length (default: 8)
 * @returns Formatted code (e.g., "ABCD-1234")
 *
 * @example
 * ```ts
 * formatRecoveryCodeForDisplay("ABCD1234"); // "ABCD-1234"
 * formatRecoveryCodeForDisplay("ABC123");   // "ABC123" (unchanged, not 8 chars)
 * ```
 */
export function formatRecoveryCodeForDisplay(
  code: string,
  codeLength: number = RECOVERY_CODE_LENGTH
): string {
  if (code.length !== codeLength) return code;
  const split = Math.floor(codeLength / 2);
  return `${code.slice(0, split)}-${code.slice(split)}`;
}

// =============================================================================
// Clipboard
// =============================================================================

/**
 * Copy recovery codes to clipboard (plain text, one per line).
 *
 * Uses the Clipboard API with a fallback for older browsers.
 *
 * @param codes - Array of recovery codes
 * @param codeLength - Expected code length for formatting (default: 8)
 * @returns Promise that resolves when copied
 * @throws Error if clipboard is not available and fallback fails
 *
 * @example
 * ```ts
 * await copyRecoveryCodesToClipboard(["ABCD1234", "EFGH5678"]);
 * // Clipboard now contains:
 * // ABCD-1234
 * // EFGH-5678
 * ```
 */
export async function copyRecoveryCodesToClipboard(
  codes: string[],
  codeLength: number = RECOVERY_CODE_LENGTH
): Promise<void> {
  const formattedCodes = codes
    .map((code) => formatRecoveryCodeForDisplay(code, codeLength))
    .join('\n');

  // Try modern Clipboard API first
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(formattedCodes);
      return;
    } catch {
      // Fall through to legacy method
    }
  }

  // Fallback for browsers without Clipboard API
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = formattedCodes;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// =============================================================================
// Download
// =============================================================================

/**
 * Download recovery codes as a .txt file.
 *
 * Creates a formatted text file with header, numbered codes, and footer.
 * Uses UTF-8 BOM for proper encoding in text editors.
 *
 * @param codes - Array of recovery codes
 * @param options - Download options (filename, locale, strings)
 *
 * @example
 * ```ts
 * downloadRecoveryCodes(["ABCD1234", "EFGH5678"], {
 *   filename: 'my-app-recovery-codes.txt',
 *   locale: 'en-US',
 *   strings: {
 *     title: 'My App - MFA Recovery Codes',
 *     generatedAt: 'Generated at:',
 *     importantNotice: 'Keep these safe!',
 *     footerWarning: 'Contact support if lost.',
 *   },
 * });
 * ```
 */
export function downloadRecoveryCodes(
  codes: string[],
  options: DownloadRecoveryCodesOptions = {}
): void {
  const {
    filename = 'recovery-codes.txt',
    locale = 'en-US',
    strings = DEFAULT_RECOVERY_CODES_STRINGS,
    codeLength = RECOVERY_CODE_LENGTH,
  } = options;

  // Format timestamp using locale
  const timestamp = new Date().toLocaleString(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // Build file content
  const header = `${strings.title}
${strings.generatedAt} ${timestamp}

${strings.importantNotice}

${'─'.repeat(50)}

`;

  const formattedCodes = codes
    .map((code, index) => {
      const num = (index + 1).toString().padStart(2, '0');
      return `${num}. ${formatRecoveryCodeForDisplay(code, codeLength)}`;
    })
    .join('\n');

  const footer = `

${'─'.repeat(50)}

${strings.footerWarning}
`;

  const content = header + formattedCodes + footer;

  // Create blob with UTF-8 BOM for proper encoding
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/plain;charset=utf-8' });

  // Trigger download
  if (typeof document !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
