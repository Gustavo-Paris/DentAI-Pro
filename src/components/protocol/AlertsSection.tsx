import { AlertTriangle } from "lucide-react";

interface AlertsSectionProps {
  alerts: string[];
}

export default function AlertsSection({ alerts }: AlertsSectionProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-500/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
        <h4 className="font-medium text-amber-700 dark:text-amber-400">Alertas</h4>
      </div>
      <ul className="space-y-2">
        {alerts.map((alert, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span className="text-amber-500 dark:text-amber-400 mt-1">•</span>
            <span className="text-amber-700 dark:text-amber-300">{alert}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
