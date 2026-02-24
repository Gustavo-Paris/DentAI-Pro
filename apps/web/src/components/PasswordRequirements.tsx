import { Check, X } from 'lucide-react';
import { getPasswordRequirements } from '@/lib/schemas/auth';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export function PasswordRequirements({ password, className = '' }: PasswordRequirementsProps) {
  if (!password) return null;

  const requirements = getPasswordRequirements();

  return (
    <div id="password-requirements" role="list" className={`space-y-1 text-xs ${className}`}>
      {requirements.map((req, index) => {
        const passed = req.test(password);
        return (
          <div
            key={index}
            role="listitem"
            className={`flex items-center gap-1.5 ${passed ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {passed ? (
              <Check className="h-3 w-3" aria-hidden="true" />
            ) : (
              <X className="h-3 w-3" aria-hidden="true" />
            )}
            <span>{req.label}</span>
          </div>
        );
      })}
    </div>
  );
}
