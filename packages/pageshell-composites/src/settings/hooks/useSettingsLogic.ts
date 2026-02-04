/**
 * useSettingsLogic Hook
 *
 * Extracted logic from SettingsPage for better separation of concerns.
 * Handles section state, keyboard navigation, and focus management.
 *
 * @module settings/hooks/useSettingsLogic
 */

'use client';

import * as React from 'react';
import { useHandlerMap } from '@pageshell/core';
import type { SettingsSectionConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface UseSettingsLogicOptions<TValues extends Record<string, unknown>> {
  /** Section configurations */
  sections: SettingsSectionConfig<TValues>[];
  /** Controlled active section */
  activeSection?: string;
  /** Section change handler */
  onSectionChange?: (sectionId: string) => void;
}

export interface UseSettingsLogicReturn<TValues extends Record<string, unknown>> {
  /** Current active section ID */
  activeSection: string;
  /** Active section configuration */
  activeSectionInfo: SettingsSectionConfig<TValues> | undefined;
  /** Handle section change */
  handleSectionChange: (sectionId: string) => void;
  /** Get memoized click handler for a section */
  getSectionClickHandler: (sectionId: string) => () => void;
  /** Keyboard navigation handler */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Ref map for section buttons */
  sectionRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  /** Ref for content area (focus target) */
  contentRef: React.RefObject<HTMLElement | null>;
}

// =============================================================================
// Hook
// =============================================================================

export function useSettingsLogic<TValues extends Record<string, unknown>>(
  options: UseSettingsLogicOptions<TValues>
): UseSettingsLogicReturn<TValues> {
  const {
    sections,
    activeSection: controlledActiveSection,
    onSectionChange,
  } = options;

  // ===========================================================================
  // State
  // ===========================================================================

  const [internalActiveSection, setInternalActiveSection] = React.useState(
    sections[0]?.id ?? ''
  );

  const activeSection = controlledActiveSection ?? internalActiveSection;

  // ===========================================================================
  // Section Change Handler
  // ===========================================================================

  const handleSectionChange = React.useCallback(
    (sectionId: string) => {
      if (onSectionChange) {
        onSectionChange(sectionId);
      } else {
        setInternalActiveSection(sectionId);
      }
    },
    [onSectionChange]
  );

  // Memoize section click handlers to prevent unnecessary re-renders
  const { getHandler: getSectionClickHandler } = useHandlerMap((sectionId: string) => {
    handleSectionChange(sectionId);
  });

  // ===========================================================================
  // Active Section Info
  // ===========================================================================

  const activeSectionInfo = React.useMemo(
    () => sections.find((s) => s.id === activeSection),
    [sections, activeSection]
  );

  // ===========================================================================
  // Refs
  // ===========================================================================

  const sectionRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const contentRef = React.useRef<HTMLElement>(null);

  // ===========================================================================
  // Keyboard Navigation
  // ===========================================================================

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const currentIndex = sections.findIndex((s) => s.id === activeSection);
      let newIndex: number | null = null;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          newIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = sections.length - 1;
          break;
      }

      if (newIndex !== null) {
        const newSection = sections[newIndex];
        if (newSection) {
          handleSectionChange(newSection.id);
          sectionRefs.current.get(newSection.id)?.focus();
        }
      }
    },
    [sections, activeSection, handleSectionChange]
  );

  // ===========================================================================
  // Focus Management
  // ===========================================================================

  const previousSectionRef = React.useRef<string>(activeSection);

  React.useEffect(() => {
    let frameId: number | undefined;

    // Only focus if section actually changed (not on initial mount)
    if (previousSectionRef.current !== activeSection && contentRef.current) {
      // Small delay to allow DOM to update
      frameId = requestAnimationFrame(() => {
        contentRef.current?.focus();
      });
    }
    previousSectionRef.current = activeSection;

    return () => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [activeSection]);

  return {
    activeSection,
    activeSectionInfo,
    handleSectionChange,
    getSectionClickHandler,
    handleKeyDown,
    sectionRefs,
    contentRef,
  };
}
