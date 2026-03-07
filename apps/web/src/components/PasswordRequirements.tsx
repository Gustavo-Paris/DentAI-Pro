import { Check, X } from 'lucide-react';
import { getPasswordRequirements } from '@/lib/schemas/auth';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

const STRENGTH_COLORS = [
  'bg-destructive',
  'bg-[rgb(var(--color-warning-rgb))]',
  'bg-[rgb(var(--color-warning-rgb))]',
  'bg-[rgb(var(--color-success-rgb))]',
  'bg-[rgb(var(--color-success-rgb))]',
] as const;

function getStrengthColor(metCount: number, segmentIndex: number): string {
  if (segmentIndex >= metCount) return 'bg-muted';
  return STRENGTH_COLORS[Math.min(metCount - 1, STRENGTH_COLORS.length - 1)];
}

export function PasswordRequirements({ password, className = '' }: PasswordRequirementsProps) {
  if (!password) return null;

  const requirements = getPasswordRequirements();
  const metCount = requirements.filter((req) => req.test(password)).length;

  return (
    <div id="password-requirements" className={className}>
      {/* Strength bar */}
      <div className="flex gap-1 mb-2" role="meter" aria-valuenow={metCount} aria-valuemin={0} aria-valuemax={requirements.length}>
        {Array.from({ length: requirements.length }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${getStrengthColor(metCount, i)}`}
          />
        ))}
      </div>

      {/* Requirements list */}
      <div role="list" className="space-y-1 text-xs">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <div
              key={index}
              role="listitem"
              className={`flex items-center gap-1.5 transition-colors ${passed ? 'text-[rgb(var(--color-success-rgb))]' : 'text-muted-foreground'}`}
            >
              {passed ? (
                <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[rgb(var(--color-success-rgb))]">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden="true" />
                </span>
              ) : (
                <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-muted-foreground/20">
                  <X className="h-2.5 w-2.5" aria-hidden="true" />
                </span>
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
