'use client';

/**
 * PageFAQ - FAQ accordion component with sections
 *
 * Displays FAQ sections with expandable questions.
 * Each section has an icon (auto-detected from category) and list of Q&A items.
 *
 * @example Single section
 * ```tsx
 * <PageFAQ
 *   sections={[{
 *     id: 'courses',
 *     category: 'courses',
 *     title: 'Cursos e Aprendizado',
 *     items: [
 *       { question: 'Como começo?', answer: 'Navegue até...' },
 *       { question: 'Posso pausar?', answer: 'Sim, seu progresso...' },
 *     ],
 *   }]}
 * />
 * ```
 *
 * @example Multiple sections
 * ```tsx
 * <PageFAQ
 *   sections={[
 *     { id: 'courses', category: 'courses', title: 'Cursos', items: [...] },
 *     { id: 'mentorship', category: 'mentorship', title: 'Mentoria', items: [...] },
 *     { id: 'account', category: 'account', title: 'Conta', items: [...] },
 *   ]}
 * />
 * ```
 */

import { useState } from 'react';
import {
  ChevronDown,
  Play,
  Calendar,
  Shield,
  Award,
  BookOpen,
  CreditCard,
  Settings,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export type FAQCategory =
  | 'courses'
  | 'mentorship'
  | 'account'
  | 'badges'
  | 'credits'
  | 'settings'
  | 'general';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSection {
  id: string;
  category: FAQCategory;
  title: string;
  items: FAQItem[];
}

export interface PageFAQProps {
  /** FAQ sections */
  sections: FAQSection[];
  /** Grid columns (default: 2 for lg screens) */
  columns?: 1 | 2;
  /** Animation delay index */
  animationDelay?: number;
}

// =============================================================================
// Helpers
// =============================================================================

interface CategoryStyle {
  icon: LucideIcon;
  color: string;
}

function getCategoryStyle(category: FAQCategory): CategoryStyle {
  switch (category) {
    case 'courses':
      return { icon: Play, color: 'bg-success/10 text-success' };
    case 'mentorship':
      return { icon: Calendar, color: 'bg-accent/10 text-accent' };
    case 'account':
      return { icon: Shield, color: 'bg-info/10 text-info' };
    case 'badges':
      return { icon: Award, color: 'bg-warning/10 text-warning' };
    case 'credits':
      return { icon: CreditCard, color: 'bg-primary/10 text-primary' };
    case 'settings':
      return { icon: Settings, color: 'bg-muted text-muted-foreground' };
    default:
      return { icon: HelpCircle, color: 'bg-muted text-muted-foreground' };
  }
}

// =============================================================================
// Sub-Components
// =============================================================================

function FAQItemAccordion({
  item,
  isOpen,
  onToggle,
  testId,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  testId?: string;
}) {
  return (
    <div className="border-b border-border last:border-b-0" data-testid={testId}>
      <button
        className="w-full flex items-center justify-between py-4 text-left hover:text-primary transition-colors"
        onClick={onToggle}
      >
        <span className="font-medium text-foreground pr-4">{item.question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

function FAQSectionCard({ section }: { section: FAQSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { icon: Icon, color } = getCategoryStyle(section.category);

  return (
    <div className="rounded-xl border border-border bg-card" data-testid={`faq-category-${section.id}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-semibold text-foreground">{section.title}</h3>
      </div>

      {/* Items */}
      <div className="px-4">
        {section.items.map((item, index) => (
          <FAQItemAccordion
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            testId={`faq-question-${section.id}-${index}`}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PageFAQ({
  sections,
  columns = 2,
  animationDelay = 3,
}: PageFAQProps) {
  const gridClass = columns === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2';

  return (
    <div
      className={cn(
        'grid gap-6',
        gridClass,
        `portal-animate-in portal-animate-in-delay-${animationDelay}`
      )}
    >
      {sections.map((section) => (
        <FAQSectionCard key={section.id} section={section} />
      ))}
    </div>
  );
}
