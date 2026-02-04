/**
 * useSplitPanelLogic Hook
 *
 * Extracted logic from SplitPanelPage for better separation of concerns.
 * Handles mobile detection, selection, keyboard navigation, and accessibility.
 *
 * @module split-panel/hooks/useSplitPanelLogic
 */

'use client';

import * as React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface UseSplitPanelLogicOptions<TItem> {
  // Selection
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  // List data
  listData?: TItem[];
  keyExtractor?: (item: TItem) => string;
  // Mobile
  mobileBreakpoint?: number;
  stackOnMobile?: boolean;
}

export interface UseSplitPanelLogicReturn<TItem> {
  // State
  isMobile: boolean;
  showList: boolean;
  announcement: string;
  // Handlers
  handleSelect: (id: string) => void;
  handleBack: () => void;
  handleListKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  // Utilities
  listKeyExtractor: (item: TItem) => string;
}

// =============================================================================
// Hook
// =============================================================================

export function useSplitPanelLogic<TItem>(
  options: UseSplitPanelLogicOptions<TItem>
): UseSplitPanelLogicReturn<TItem> {
  const {
    selectedId,
    onSelect,
    listData,
    keyExtractor,
    mobileBreakpoint = 768,
    stackOnMobile = true,
  } = options;

  // ===========================================================================
  // State
  // ===========================================================================

  const [isMobile, setIsMobile] = React.useState(false);
  const [showList, setShowList] = React.useState(true);
  const [announcement, setAnnouncement] = React.useState('');

  // Ref to track announcement timeout for cleanup
  const announcementTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===========================================================================
  // Key Extractor
  // ===========================================================================

  const listKeyExtractor = React.useCallback(
    (item: TItem): string => {
      if (keyExtractor) return keyExtractor(item);
      return (item as { id: string }).id;
    },
    [keyExtractor]
  );

  // ===========================================================================
  // Mobile Detection
  // ===========================================================================

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < mobileBreakpoint;
      setIsMobile(mobile);
      if (!mobile) setShowList(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  // Clear announcement timeout on unmount
  React.useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
    };
  }, []);

  // ===========================================================================
  // Handlers
  // ===========================================================================

  const handleSelect = React.useCallback(
    (id: string) => {
      onSelect(id);
      if (isMobile && stackOnMobile) {
        setShowList(false);
      }
      // Clear any pending announcement timeout
      if (announcementTimeoutRef.current) {
        clearTimeout(announcementTimeoutRef.current);
      }
      // Announce selection for screen readers
      setAnnouncement('Item selecionado');
      // Clear after screen reader has time to announce
      announcementTimeoutRef.current = setTimeout(() => setAnnouncement(''), 1000);
    },
    [isMobile, stackOnMobile, onSelect]
  );

  const handleBack = React.useCallback(() => {
    setShowList(true);
    onSelect(null);
  }, [onSelect]);

  // ===========================================================================
  // Keyboard Navigation
  // ===========================================================================

  const handleListKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const items = listData;
      if (!items?.length) return;

      const currentIndex = selectedId
        ? items.findIndex((item) => listKeyExtractor(item) === selectedId)
        : -1;

      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = items.length - 1;
          break;
        case 'Escape':
          event.preventDefault();
          onSelect(null);
          return;
        default:
          return;
      }

      if (newIndex !== currentIndex && newIndex >= 0) {
        const newItem = items[newIndex];
        if (newItem) {
          handleSelect(listKeyExtractor(newItem));
        }
      }
    },
    [listData, selectedId, listKeyExtractor, handleSelect, onSelect]
  );

  return {
    // State
    isMobile,
    showList,
    announcement,
    // Handlers
    handleSelect,
    handleBack,
    handleListKeyDown,
    // Utilities
    listKeyExtractor,
  };
}
