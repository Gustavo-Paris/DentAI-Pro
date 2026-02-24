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
    <div className={`space-y-1 text-xs ${className}`}>
      {requirements.map((req, index) => {
        const passed = req.test(password);
        return (
          <div 
            key={index} 
            className={`flex items-center gap-1.5 ${passed ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {passed ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{req.label}</span>
          </div>
        );
      })}
    </div>
  );
}
