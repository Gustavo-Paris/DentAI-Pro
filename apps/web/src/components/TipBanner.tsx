import { Card, CardContent, Button } from '@parisgroup-ai/pageshell/primitives';
import type { LucideIcon } from 'lucide-react';

interface TipBannerProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; icon?: LucideIcon; onClick: () => void };
  variant?: 'primary' | 'muted';
  className?: string;
}

const variantStyles = {
  primary: 'border-dashed border-primary/30 bg-primary/5',
  muted: 'border-dashed border-muted-foreground/20 bg-muted/30',
} as const;

const iconStyles = {
  primary: 'text-primary',
  muted: 'text-muted-foreground',
} as const;

export function TipBanner({
  icon: Icon,
  title,
  description,
  action,
  variant = 'primary',
  className,
}: TipBannerProps) {
  return (
    <Card className={`${variantStyles[variant]} ${className ?? ''}`}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconStyles[variant]}`} />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            {action && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={action.onClick}
              >
                {action.icon && <action.icon className="w-3.5 h-3.5 mr-1.5" />}
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
