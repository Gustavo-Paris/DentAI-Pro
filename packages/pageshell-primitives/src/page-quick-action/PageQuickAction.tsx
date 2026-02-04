'use client';

/**
 * PageQuickAction - Versatile action component with multiple layouts
 *
 * Framework-agnostic with support for custom Link components.
 *
 * Layouts:
 * - button: CTA button card (default) - for bottom-of-page actions
 * - card: Navigation card - for quick link grids
 * - banner: Horizontal banner - for contact/support CTAs
 * - hero: Gradient hero banner - for page headers
 *
 * Icon is auto-detected from variant or can be overridden.
 *
 * @module page-quick-action
 *
 * @example Button layout (default)
 * ```tsx
 * <PageQuickAction
 *   variant="buy"
 *   title="Comprar Mais Creditos"
 *   description="Explore pacotes com desconto"
 *   href="/mentorship"
 * />
 * ```
 *
 * @example Card layout (for grids) with react-router-dom
 * ```tsx
 * import { Link } from 'react-router-dom';
 *
 * <PageQuickAction
 *   layout="card"
 *   variant="courses"
 *   title="Explorar Cursos"
 *   description="Encontre novos cursos"
 *   href="/student/courses"
 *   LinkComponent={Link}
 * />
 * ```
 *
 * @example Banner layout (for contact)
 * ```tsx
 * <PageQuickAction
 *   layout="banner"
 *   variant="contact"
 *   title="Não encontrou o que procurava?"
 *   description="Nossa equipe está pronta para ajudar"
 *   actionLabel="Enviar Email"
 *   href="mailto:suporte@example.com"
 * />
 * ```
 */

import { type ReactNode, type ComponentType } from 'react';
import {
  ArrowRight,
  Sparkles,
  Plus,
  Zap,
  Gift,
  Star,
  BookOpen,
  CreditCard,
  Award,
  Calendar,
  Settings,
  User,
  HelpCircle,
  Mail,
  ChevronRight,
  ExternalLink,
  Play,
} from 'lucide-react';
import { cn } from '@pageshell/core';

// =============================================================================
// Types
// =============================================================================

export type QuickActionVariant =
  | 'buy'
  | 'add'
  | 'upgrade'
  | 'gift'
  | 'star'
  | 'courses'
  | 'credits'
  | 'achievements'
  | 'calendar'
  | 'settings'
  | 'profile'
  | 'help'
  | 'contact'
  | 'start'
  | 'custom';

export type QuickActionLayout = 'button' | 'card' | 'banner' | 'hero';

/** Link component type for framework-agnostic usage */
export type QuickActionLinkComponent = ComponentType<{
  href: string;
  children: ReactNode;
  className?: string;
}>;

export interface PageQuickActionProps {
  /** Layout style (default: 'button') */
  layout?: QuickActionLayout;
  /** Variant determines the icon (default: 'buy' = Sparkles) */
  variant?: QuickActionVariant;
  /** Override auto-detected icon */
  icon?: ReactNode;
  /** Action title */
  title: string;
  /** Action description */
  description: string;
  /** Click handler (use either onClick or href) */
  onClick?: () => void;
  /** Link destination (use either onClick or href) */
  href?: string;
  /** External link (opens in new tab) */
  external?: boolean;
  /** Action button label (for banner layout) */
  actionLabel?: string;
  /** Animation delay index */
  animationDelay?: number;
  /** Additional class name */
  className?: string;
  /** Custom Link component for framework-agnostic usage (e.g., Link from react-router-dom) */
  LinkComponent?: QuickActionLinkComponent;
}

// =============================================================================
// Helpers
// =============================================================================

function getVariantIcon(variant: QuickActionVariant, size: 'sm' | 'md' | 'lg' = 'md'): ReactNode {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };
  const iconClass = sizeClasses[size];

  switch (variant) {
    case 'buy':
      return <Sparkles className={iconClass} />;
    case 'add':
      return <Plus className={iconClass} />;
    case 'upgrade':
      return <Zap className={iconClass} />;
    case 'gift':
      return <Gift className={iconClass} />;
    case 'star':
      return <Star className={iconClass} />;
    case 'courses':
      return <BookOpen className={iconClass} />;
    case 'credits':
      return <CreditCard className={iconClass} />;
    case 'achievements':
      return <Award className={iconClass} />;
    case 'calendar':
      return <Calendar className={iconClass} />;
    case 'settings':
      return <Settings className={iconClass} />;
    case 'profile':
      return <User className={iconClass} />;
    case 'help':
      return <HelpCircle className={iconClass} />;
    case 'contact':
      return <Mail className={iconClass} />;
    case 'start':
      return <Play className={iconClass} />;
    default:
      return <Sparkles className={iconClass} />;
  }
}

// =============================================================================
// Layout Components
// =============================================================================

interface LayoutProps extends Pick<PageQuickActionProps, 'icon' | 'title' | 'description' | 'onClick' | 'href' | 'animationDelay' | 'actionLabel' | 'external' | 'LinkComponent'> {}

function ButtonLayout({
  icon,
  title,
  description,
  onClick,
  href,
  animationDelay,
  LinkComponent,
}: LayoutProps) {
  const content = (
    <>
      <div className="portal-credits-action-icon">{icon}</div>
      <div className="portal-credits-action-content">
        <span className="portal-credits-action-title">{title}</span>
        <span className="portal-credits-action-desc">{description}</span>
      </div>
      <ArrowRight className="w-5 h-5 portal-credits-action-arrow" />
    </>
  );

  if (href) {
    const Link = LinkComponent || 'a';
    return (
      <div className={`portal-credits-actions portal-animate-in portal-animate-in-delay-${animationDelay}`}>
        <Link href={href} className="portal-credits-action-btn">
          {content}
        </Link>
      </div>
    );
  }

  return (
    <div className={`portal-credits-actions portal-animate-in portal-animate-in-delay-${animationDelay}`}>
      <button className="portal-credits-action-btn" onClick={onClick}>
        {content}
      </button>
    </div>
  );
}

function CardLayout({
  icon,
  title,
  description,
  onClick,
  href,
  external,
  LinkComponent,
}: LayoutProps) {
  const linkProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  const content = (
    <>
      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
            {title}
          </span>
          {external && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
    </>
  );

  const className =
    'flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group';

  if (href) {
    if (external) {
      return (
        <a href={href} className={className} {...linkProps}>
          {content}
        </a>
      );
    }
    const Link = LinkComponent || 'a';
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} onClick={onClick}>
      {content}
    </button>
  );
}

function BannerLayout({
  icon,
  title,
  description,
  onClick,
  href,
  actionLabel,
  animationDelay,
}: LayoutProps) {
  const actionButton = href ? (
    <a
      href={href}
      className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
    >
      {icon}
      <span className="hidden sm:inline">{actionLabel}</span>
      <span className="sm:hidden">Contato</span>
    </a>
  ) : (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm"
    >
      {icon}
      <span className="hidden sm:inline">{actionLabel}</span>
      <span className="sm:hidden">Contato</span>
    </button>
  );

  return (
    <div className={`portal-animate-in portal-animate-in-delay-${animationDelay}`}>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">{icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {actionButton}
        </div>
      </div>
    </div>
  );
}

function HeroLayout({
  icon,
  title,
  description,
  animationDelay,
}: LayoutProps) {
  return (
    <div className={`portal-animate-in portal-animate-in-delay-${animationDelay}`}>
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20">{icon}</div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground mb-1">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PageQuickAction({
  layout = 'button',
  variant = 'buy',
  icon,
  title,
  description,
  onClick,
  href,
  external = false,
  actionLabel = 'Enviar Email',
  animationDelay = 4,
  className,
  LinkComponent,
}: PageQuickActionProps) {
  const iconSize = layout === 'hero' ? 'lg' : layout === 'card' ? 'sm' : 'md';
  const resolvedIcon = icon ?? getVariantIcon(variant, iconSize);

  const wrapperClass = className ? cn(className) : undefined;

  switch (layout) {
    case 'card':
      return (
        <div className={wrapperClass}>
          <CardLayout
            icon={resolvedIcon}
            title={title}
            description={description}
            onClick={onClick}
            href={href}
            external={external}
            LinkComponent={LinkComponent}
          />
        </div>
      );

    case 'banner':
      return (
        <div className={wrapperClass}>
          <BannerLayout
            icon={resolvedIcon}
            title={title}
            description={description}
            onClick={onClick}
            href={href}
            actionLabel={actionLabel}
            animationDelay={animationDelay}
            LinkComponent={LinkComponent}
          />
        </div>
      );

    case 'hero':
      return (
        <div className={wrapperClass}>
          <HeroLayout
            icon={resolvedIcon}
            title={title}
            description={description}
            animationDelay={animationDelay}
            LinkComponent={LinkComponent}
          />
        </div>
      );

    default:
      return (
        <div className={wrapperClass}>
          <ButtonLayout
            icon={resolvedIcon}
            title={title}
            description={description}
            onClick={onClick}
            href={href}
            animationDelay={animationDelay}
            LinkComponent={LinkComponent}
          />
        </div>
      );
  }
}

PageQuickAction.displayName = 'PageQuickAction';
