/**
 * Sidebar Search Utilities
 *
 * @module hooks/sidebar-search/utils
 */

import type { HighlightSegment, SearchableNavItem, SearchableNavSection } from './types';

// =============================================================================
// Fuzzy Scoring
// =============================================================================

/**
 * Simple fuzzy match scoring.
 * Higher score = better match.
 */
export function fuzzyScore(query: string, text: string): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match
  if (textLower === queryLower) return 100;

  // Starts with query
  if (textLower.startsWith(queryLower)) return 80;

  // Contains query as substring
  if (textLower.includes(queryLower)) return 60;

  // Fuzzy character matching
  let score = 0;
  let queryIndex = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 10 + consecutiveMatches * 5;
      consecutiveMatches++;
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // All query characters must be found
  if (queryIndex < queryLower.length) return 0;

  return score;
}

// =============================================================================
// Highlight Segments
// =============================================================================

/**
 * Split text into highlight segments (safe, no HTML injection).
 */
export function createHighlightSegments(query: string, text: string): HighlightSegment[] {
  if (!query) return [{ text, isMatch: false }];

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(queryLower);

  if (index === -1) {
    // Fuzzy highlight - mark each matching character
    const segments: HighlightSegment[] = [];
    let queryIndex = 0;
    let currentText = '';
    let currentIsMatch = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i]!;
      const isMatch =
        queryIndex < query.length &&
        char.toLowerCase() === query[queryIndex]!.toLowerCase();

      if (isMatch) {
        // Flush non-match buffer
        if (currentText && !currentIsMatch) {
          segments.push({ text: currentText, isMatch: false });
          currentText = '';
        }
        currentText += char;
        currentIsMatch = true;
        queryIndex++;
      } else {
        // Flush match buffer
        if (currentText && currentIsMatch) {
          segments.push({ text: currentText, isMatch: true });
          currentText = '';
        }
        currentText += char;
        currentIsMatch = false;
      }
    }

    // Flush remaining
    if (currentText) {
      segments.push({ text: currentText, isMatch: currentIsMatch });
    }

    return segments;
  }

  // Substring match
  const segments: HighlightSegment[] = [];

  if (index > 0) {
    segments.push({ text: text.slice(0, index), isMatch: false });
  }

  segments.push({
    text: text.slice(index, index + query.length),
    isMatch: true,
  });

  if (index + query.length < text.length) {
    segments.push({ text: text.slice(index + query.length), isMatch: false });
  }

  return segments;
}

// =============================================================================
// Section Flattening
// =============================================================================

/**
 * Flatten sections into searchable items.
 */
export function flattenSections(sections: SearchableNavSection[]): SearchableNavItem[] {
  return sections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      sectionLabel: section.label,
    }))
  );
}
