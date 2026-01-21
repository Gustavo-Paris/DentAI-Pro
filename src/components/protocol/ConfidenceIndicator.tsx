import { cn } from "@/lib/utils";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface ConfidenceIndicatorProps {
  confidence: "alta" | "média" | "baixa" | string;
}

export default function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const level = confidence.toLowerCase();
  
  const config = {
    alta: {
      icon: ShieldCheck,
      label: "Alta Confiança",
      description: "Caso bem documentado, protocolo recomendado com segurança",
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      bars: 3,
    },
    média: {
      icon: Shield,
      label: "Confiança Média",
      description: "Considere validar detalhes clínicos adicionais",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      bars: 2,
    },
    baixa: {
      icon: ShieldAlert,
      label: "Baixa Confiança",
      description: "Dados insuficientes, revise antes de aplicar",
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      bars: 1,
    },
  };

  const current = config[level as keyof typeof config] || config.média;
  const Icon = current.icon;

  return (
    <div className={cn("rounded-lg border p-4 flex items-center gap-4", current.bg, current.border)}>
      <Icon className={cn("w-8 h-8", current.color)} />
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span className={cn("font-medium", current.color)}>{current.label}</span>
          {/* Confidence bars */}
          <div className="flex gap-1">
            {[1, 2, 3].map((bar) => (
              <div
                key={bar}
                className={cn(
                  "w-3 h-3 rounded-sm",
                  bar <= current.bars ? current.color.replace("text-", "bg-") : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{current.description}</p>
      </div>
    </div>
  );
}
