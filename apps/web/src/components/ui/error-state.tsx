import { Link } from 'react-router-dom';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface ErrorStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ErrorStateAction;
  /** Use 'card' for inline error states or 'fullscreen' for centered page-level states */
  variant?: 'card' | 'fullscreen';
}

export function ErrorState({
  title,
  description,
  icon: Icon = AlertTriangle,
  action,
  variant = 'card',
}: ErrorStateProps) {
  const actionButton = action ? (
    action.href ? (
      <Link to={action.href}>
        <Button variant="outline">{action.label}</Button>
      </Link>
    ) : (
      <Button variant="outline" onClick={action.onClick}>
        {action.label}
      </Button>
    )
  ) : null;

  if (variant === 'fullscreen') {
    return (
      <div role="main" className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-lg font-semibold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {actionButton}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Card className="p-6 text-center">
        <Icon className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {actionButton && <div className="mt-3">{actionButton}</div>}
      </Card>
    </div>
  );
}
