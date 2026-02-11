import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Crown, Droplets, Sparkles, CheckCircle, AlertTriangle, ClipboardCheck } from 'lucide-react';

interface CementationStep {
  order: number;
  step: string;
  material: string;
  technique?: string;
  time?: string;
}

interface CementationProtocol {
  preparation_steps?: CementationStep[];
  ceramic_treatment: CementationStep[];
  tooth_treatment: CementationStep[];
  cementation: {
    cement_type: string;
    cement_brand: string;
    shade: string;
    light_curing_time: string;
    technique: string;
  };
  finishing: CementationStep[];
  post_operative: string[];
  checklist: string[];
  alerts: string[];
  warnings: string[];
  confidence: "alta" | "média" | "baixa";
}

interface CementationProtocolCardProps {
  protocol: CementationProtocol;
  checkedIndices?: number[];
  onProgressChange?: (indices: number[]) => void;
}

function StepsList({ 
  title, 
  icon: Icon, 
  steps, 
  iconColor = "text-primary" 
}: { 
  title: string; 
  icon: React.ComponentType<{ className?: string }>; 
  steps: CementationStep[]; 
  iconColor?: string;
}) {
  if (!steps || steps.length === 0) return null;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.sort((a, b) => a.order - b.order).map((step, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {step.order}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{step.step}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {step.material}
                  </Badge>
                  {step.time && (
                    <span className="text-xs text-muted-foreground">
                      ⏱ {step.time}
                    </span>
                  )}
                </div>
                {step.technique && (
                  <p className="text-xs text-muted-foreground mt-1">{step.technique}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CementationProtocolCard({
  protocol,
  checkedIndices = [],
  onProgressChange
}: CementationProtocolCardProps) {
  const { t } = useTranslation();
  const handleCheck = (index: number, checked: boolean) => {
    if (!onProgressChange) return;
    if (checked) {
      onProgressChange([...checkedIndices, index]);
    } else {
      onProgressChange(checkedIndices.filter(i => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-amber-400/30 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {t('components.protocol.cementation.title')}
            <Badge 
              variant={protocol.confidence === 'alta' ? 'default' : 'secondary'}
              className={protocol.confidence === 'alta' ? 'bg-primary' : ''}
            >
              {t('components.protocol.cementation.confidence', { level: protocol.confidence })}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Preparation Steps */}
      {protocol.preparation_steps && protocol.preparation_steps.length > 0 && (
        <StepsList 
          title={t('components.protocol.cementation.prepSteps')} 
          icon={Sparkles} 
          steps={protocol.preparation_steps}
          iconColor="text-blue-500" 
        />
      )}

      {/* Ceramic Treatment */}
      <StepsList 
        title={t('components.protocol.cementation.ceramicTreatment')} 
        icon={Crown} 
        steps={protocol.ceramic_treatment}
        iconColor="text-amber-500" 
      />

      {/* Tooth Treatment */}
      <StepsList 
        title={t('components.protocol.cementation.toothTreatment')} 
        icon={Droplets} 
        steps={protocol.tooth_treatment}
        iconColor="text-cyan-500" 
      />

      {/* Cementation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {t('components.protocol.cementation.cementationStep')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">{t('components.protocol.cementation.cementType')}</span>
              <p className="font-medium">{protocol.cementation.cement_type}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t('components.protocol.cementation.brand')}</span>
              <p className="font-medium">{protocol.cementation.cement_brand}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t('components.protocol.cementation.color')}</span>
              <p className="font-medium">{protocol.cementation.shade}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t('components.protocol.cementation.lightCuring')}</span>
              <p className="font-medium">{protocol.cementation.light_curing_time}</p>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">{t('components.protocol.cementation.technique')}</span>
              <p className="font-medium text-sm">{protocol.cementation.technique}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finishing */}
      <StepsList 
        title={t('components.protocol.cementation.finishing')} 
        icon={Sparkles} 
        steps={protocol.finishing}
        iconColor="text-purple-500" 
      />

      {/* Post-operative */}
      {protocol.post_operative && protocol.post_operative.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('components.protocol.cementation.postOperative')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {protocol.post_operative.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Checklist */}
      {protocol.checklist && protocol.checklist.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              {t('components.protocol.cementation.checklist')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {protocol.checklist.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <Checkbox 
                    id={`check-${index}`}
                    checked={checkedIndices.includes(index)}
                    onCheckedChange={(checked) => handleCheck(index, !!checked)}
                    className="mt-0.5"
                  />
                  <label 
                    htmlFor={`check-${index}`}
                    className={`text-sm cursor-pointer flex-1 ${
                      checkedIndices.includes(index) ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {protocol.alerts && protocol.alerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/10 dark:bg-destructive/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              {t('components.protocol.cementation.doNot')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {protocol.alerts.map((alert, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-destructive">
                  <span className="mt-0.5">❌</span>
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {protocol.warnings && protocol.warnings.length > 0 && (
        <Card className="border-warning/50 bg-warning/10 dark:bg-warning/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <AlertTriangle className="w-4 h-4" />
              {t('components.protocol.cementation.attentionPoints')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {protocol.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-warning">
                  <span className="mt-0.5">⚠️</span>
                  {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CementationProtocolCard;
