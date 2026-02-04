/**
 * SettingsPage Types
 *
 * Type definitions for the SettingsPage composite.
 *
 * @module settings/types
 */

import type { ReactNode } from 'react';
import type { IconProp } from '@pageshell/primitives';
import type { CompositeBaseProps, FormFieldConfig } from '../shared/types';

// =============================================================================
// Section Configuration
// =============================================================================

/**
 * Settings section configuration
 */
export interface SettingsSectionConfig<TValues = Record<string, unknown>> {
  /** Unique section ID */
  id: string;
  /** Section label */
  label: string;
  /** Section icon - accepts string name or ComponentType */
  icon?: IconProp;
  /** Section description */
  description?: string;
  /** Form fields for declarative API */
  fields?: FormFieldConfig<TValues>[];
  /** Layout configuration for fields */
  layout?: FormFieldLayout;
  /** Custom content renderer (alternative to fields) */
  children?: ReactNode;
}

/**
 * Form field layout configuration
 */
export type FormFieldLayout = string[][];

// =============================================================================
// SettingsPage Props
// =============================================================================

/**
 * SettingsPage component props
 *
 * @template TValues - The form values type
 */
export interface SettingsPageProps<TValues = Record<string, unknown>>
  extends Omit<CompositeBaseProps, 'title'> {
  /** Page title */
  title: string;

  // ---------------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------------

  /**
   * Settings sections for navigation
   */
  sections: SettingsSectionConfig<TValues>[];

  /**
   * Active section ID
   */
  activeSection?: string;

  /**
   * Section change handler
   */
  onSectionChange?: (sectionId: string) => void;

  // ---------------------------------------------------------------------------
  // Form Integration
  // ---------------------------------------------------------------------------

  /**
   * Form values (for declarative fields API)
   */
  values?: TValues;

  /**
   * Change handler for form values
   */
  onChange?: (field: string, value: unknown) => void;

  /**
   * Form errors
   */
  errors?: Record<string, string>;

  /**
   * Gap between fields
   */
  fieldGap?: number;

  /**
   * Gap between columns
   */
  columnGap?: number;

  // ---------------------------------------------------------------------------
  // Content
  // ---------------------------------------------------------------------------

  /**
   * Children render function (for sections without fields)
   */
  children?: (activeSection: string) => ReactNode;

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  /**
   * Slot overrides for customization
   */
  slots?: {
    /** Before sidebar */
    beforeSidebar?: ReactNode;
    /** After sidebar */
    afterSidebar?: ReactNode;
    /** Before content */
    beforeContent?: ReactNode;
    /** After content */
    afterContent?: ReactNode;
  };
}
