/**
 * HelpCenterArticles Component
 *
 * Article list for help center.
 *
 * @module help-center/components/HelpCenterArticles
 */

'use client';

import * as React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { cn } from '@pageshell/core';
import { PageHeading } from '@pageshell/layouts';
import { resolveIcon } from '@pageshell/primitives';
import type { HelpCenterArticleConfig } from '../types';

// =============================================================================
// Types
// =============================================================================

export interface HelpCenterArticlesProps {
  /** Articles to display */
  articles: HelpCenterArticleConfig[];
  /** Section title */
  title?: string;
  /** Max articles to show */
  limit?: number;
  /** Show "View all" link */
  showViewAll?: boolean;
  /** View all href */
  viewAllHref?: string;
  /** View all label */
  viewAllLabel?: string;
  /** Animation delay */
  animationDelay?: number;
  /** Test ID */
  testId?: string;
}

// =============================================================================
// Article Card Component
// =============================================================================

function ArticleCard({ article }: { article: HelpCenterArticleConfig }) {
  const ResolvedIcon = article.icon ? resolveIcon(article.icon) : null;
  const Icon = ResolvedIcon || FileText;

  return (
    <Link
      to={article.href}
      className={cn(
        'group flex items-start gap-4 p-4 rounded-lg',
        'border border-border bg-card',
        'hover:border-primary/50 hover:bg-muted/50',
        'transition-all duration-200'
      )}
    >
      <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        {article.category && (
          <span className="text-xs text-muted-foreground">
            {article.category}
          </span>
        )}
        {article.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {article.description}
          </p>
        )}
      </div>
      <ArrowRight
        className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"
        aria-hidden="true"
      />
    </Link>
  );
}

// =============================================================================
// Component
// =============================================================================

export function HelpCenterArticles({
  articles,
  title,
  limit,
  showViewAll = true,
  viewAllHref,
  viewAllLabel = 'View all articles',
  animationDelay = 3,
  testId = 'help-articles',
}: HelpCenterArticlesProps) {
  if (articles.length === 0) return null;

  const displayedArticles = limit ? articles.slice(0, limit) : articles;
  const hasMore = limit ? articles.length > limit : false;

  return (
    <div
      className={`portal-animate-in portal-animate-in-delay-${animationDelay}`}
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-4">
        {title && (
          <PageHeading title={title} size="sm" marginBottom="none" />
        )}
        {showViewAll && hasMore && viewAllHref && (
          <Link
            to={viewAllHref}
            className="text-sm text-primary hover:underline"
          >
            {viewAllLabel}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
