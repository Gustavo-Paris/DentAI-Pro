/**
 * Card Helpers Types
 *
 * Common types for CRUD card action components.
 */

export interface DeleteConfirmDialogProps {
  /**
   * Dialog open state
   */
  open: boolean;

  /**
   * Callback when dialog state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Title for the dialog
   */
  title: string;

  /**
   * Description/warning message
   */
  description: string;

  /**
   * Callback when delete is confirmed
   */
  onConfirm: () => void;

  /**
   * Whether delete is in progress
   * @default false
   */
  isDeleting?: boolean;

  /**
   * Custom confirm button text
   * @default "Delete"
   */
  confirmText?: string;

  /**
   * Custom cancel button text
   * @default "Cancel"
   */
  cancelText?: string;

  /**
   * Custom loading button text
   * @default "Deleting..."
   */
  loadingText?: string;
}

export interface InlineDeleteButtonProps {
  /**
   * Entity ID to delete
   */
  entityId: string;

  /**
   * Entity name for dialog description
   */
  entityName: string;

  /**
   * Dialog title
   */
  dialogTitle: string;

  /**
   * Dialog description template (use {name} for entity name)
   */
  dialogDescription?: string;

  /**
   * Callback when delete is confirmed
   */
  onDelete: (id: string) => void;

  /**
   * Whether delete is in progress
   * @default false
   */
  isDeleting?: boolean;

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Button variant
   * @default 'outline'
   */
  variant?: 'outline' | 'ghost';

  /**
   * Button size
   * @default 'sm'
   */
  size?: 'sm' | 'icon';

  /**
   * Show text label
   * @default true
   */
  showLabel?: boolean;

  /**
   * Labels (i18n)
   */
  labels?: {
    delete?: string;
    cancel?: string;
    deleting?: string;
    confirmDescription?: string;
  };

  /**
   * Additional class names
   */
  className?: string;
}

export interface CardActionButtonsProps {
  /**
   * Callback when edit is clicked
   */
  onEdit: () => void;

  /**
   * Callback when delete is confirmed
   */
  onDelete: () => void;

  /**
   * Entity name for delete dialog
   */
  entityName: string;

  /**
   * Delete dialog title
   */
  deleteDialogTitle?: string;

  /**
   * Whether edit is disabled
   * @default false
   */
  isEditDisabled?: boolean;

  /**
   * Whether delete is disabled
   * @default false
   */
  isDeleteDisabled?: boolean;

  /**
   * Whether delete is in progress
   * @default false
   */
  isDeleting?: boolean;

  /**
   * Button variant for edit
   * @default 'outline'
   */
  editVariant?: 'outline' | 'ghost';

  /**
   * Button variant for delete
   * @default 'outline'
   */
  deleteVariant?: 'outline' | 'ghost';

  /**
   * Labels (i18n)
   */
  labels?: {
    edit?: string;
    delete?: string;
    cancel?: string;
    deleting?: string;
    confirmTitle?: string;
    confirmDescription?: string;
  };
}

export interface UseDeleteDialogReturn {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Open the dialog
   */
  open: () => void;

  /**
   * Close the dialog
   */
  close: () => void;

  /**
   * Set dialog open state
   */
  setOpen: (open: boolean) => void;
}
