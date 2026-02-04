/**
 * Status & Feedback Icons Registry
 *
 * @module icons/registry/status
 */

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  XCircle,
  Info,
  HelpCircle,
  Loader2,
  Shield,
  ShieldCheck,
} from 'lucide-react';

export const statusIcons = {
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  warning: AlertTriangle,
  'check-circle': CheckCircle,
  success: CheckCircle,
  'check-circle-2': CheckCircle2,
  'check-square': CheckSquare,
  'x-circle': XCircle,
  error: XCircle,
  info: Info,
  'help-circle': HelpCircle,
  help: HelpCircle,
  loader: Loader2,
  loading: Loader2,
  shield: Shield,
  'shield-check': ShieldCheck,
} as const;
