import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface FormData {
  patientAge: string;
  tooth: string;
  region: string;
  cavityClass: string;
  restorationSize: string;
  substrate: string;
  aestheticLevel: string;
  toothColor: string;
  stratificationNeeded: boolean;
  bruxism: boolean;
  longevityExpectation: string;
  budget: string;
}

const initialFormData: FormData = {
  patientAge: '',
  tooth: '',
  region: 'anterior',
  cavityClass: 'Classe I',
  restorationSize: 'pequena',
  substrate: 'esmalte',
  aestheticLevel: 'alto',
  toothColor: 'A2',
  stratificationNeeded: false,
  bruxism: false,
  longevityExpectation: 'média',
  budget: 'intermediário',
};

export default function Evaluation() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Create evaluation record
      const { data: evaluation, error: insertError } = await supabase
        .from('evaluations')
        .insert({
          user_id: user.id,
          patient_age: parseInt(formData.patientAge),
          tooth: formData.tooth,
          region: formData.region,
          cavity_class: formData.cavityClass,
          restoration_size: formData.restorationSize,
          substrate: formData.substrate,
          aesthetic_level: formData.aestheticLevel,
          tooth_color: formData.toothColor,
          stratification_needed: formData.stratificationNeeded,
          bruxism: formData.bruxism,
          longevity_expectation: formData.longevityExpectation,
          budget: formData.budget,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call AI recommendation edge function
      const { data: recommendation, error: aiError } = await supabase.functions.invoke(
        'recommend-resin',
        {
          body: {
            evaluationId: evaluation.id,
            ...formData,
          },
        }
      );

      if (aiError) throw aiError;

      toast.success('Análise concluída!');
      navigate(`/result/${evaluation.id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao processar avaliação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <span className="text-xl font-semibold tracking-tight">ResinMatch AI</span>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Etapa {step} de {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step 1: Patient Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Informações do paciente</h2>
              <p className="text-sm text-muted-foreground">Dados básicos do caso</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientAge">Idade do paciente</Label>
                <Input
                  id="patientAge"
                  type="number"
                  placeholder="35"
                  value={formData.patientAge}
                  onChange={(e) => updateField('patientAge', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tooth">Dente a ser restaurado</Label>
                <Input
                  id="tooth"
                  placeholder="Ex: 11, 36, 45"
                  value={formData.tooth}
                  onChange={(e) => updateField('tooth', e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Região</Label>
                <RadioGroup
                  value={formData.region}
                  onValueChange={(value) => updateField('region', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="anterior" id="anterior" />
                    <Label htmlFor="anterior" className="font-normal">Anterior</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="posterior" id="posterior" />
                    <Label htmlFor="posterior" className="font-normal">Posterior</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Case Characteristics */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Características do caso</h2>
              <p className="text-sm text-muted-foreground">Detalhes da cavidade e restauração</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Tipo de cavidade</Label>
                <RadioGroup
                  value={formData.cavityClass}
                  onValueChange={(value) => updateField('cavityClass', value)}
                >
                  {['Classe I', 'Classe II', 'Classe III', 'Classe IV', 'Classe V'].map((cls) => (
                    <div key={cls} className="flex items-center space-x-2">
                      <RadioGroupItem value={cls} id={cls} />
                      <Label htmlFor={cls} className="font-normal">{cls}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Tamanho da restauração</Label>
                <RadioGroup
                  value={formData.restorationSize}
                  onValueChange={(value) => updateField('restorationSize', value)}
                >
                  {['pequena', 'média', 'extensa'].map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <RadioGroupItem value={size} id={size} />
                      <Label htmlFor={size} className="font-normal capitalize">{size}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Substrato predominante</Label>
                <RadioGroup
                  value={formData.substrate}
                  onValueChange={(value) => updateField('substrate', value)}
                >
                  {['esmalte', 'dentina', 'ambos'].map((sub) => (
                    <div key={sub} className="flex items-center space-x-2">
                      <RadioGroupItem value={sub} id={sub} />
                      <Label htmlFor={sub} className="font-normal capitalize">{sub}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Aesthetic Requirements */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Requisitos estéticos</h2>
              <p className="text-sm text-muted-foreground">Expectativas de aparência</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Nível de exigência estética</Label>
                <RadioGroup
                  value={formData.aestheticLevel}
                  onValueChange={(value) => updateField('aestheticLevel', value)}
                >
                  {['alto', 'médio', 'baixo'].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level} id={`aes-${level}`} />
                      <Label htmlFor={`aes-${level}`} className="font-normal capitalize">{level}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toothColor">Cor do dente (escala VITA)</Label>
                <Input
                  id="toothColor"
                  placeholder="Ex: A2, B1, C3"
                  value={formData.toothColor}
                  onChange={(e) => updateField('toothColor', e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="stratification" className="font-normal">
                  Necessita estratificação
                </Label>
                <Switch
                  id="stratification"
                  checked={formData.stratificationNeeded}
                  onCheckedChange={(checked) => updateField('stratificationNeeded', checked)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Additional Considerations */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Considerações adicionais</h2>
              <p className="text-sm text-muted-foreground">Fatores que influenciam a escolha</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="bruxism" className="font-normal">
                  Paciente com bruxismo
                </Label>
                <Switch
                  id="bruxism"
                  checked={formData.bruxism}
                  onCheckedChange={(checked) => updateField('bruxism', checked)}
                />
              </div>

              <div className="space-y-3">
                <Label>Expectativa de longevidade</Label>
                <RadioGroup
                  value={formData.longevityExpectation}
                  onValueChange={(value) => updateField('longevityExpectation', value)}
                >
                  {['alta', 'média', 'baixa'].map((exp) => (
                    <div key={exp} className="flex items-center space-x-2">
                      <RadioGroupItem value={exp} id={`long-${exp}`} />
                      <Label htmlFor={`long-${exp}`} className="font-normal capitalize">{exp}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Orçamento do paciente</Label>
                <RadioGroup
                  value={formData.budget}
                  onValueChange={(value) => updateField('budget', value)}
                >
                  {['premium', 'intermediário', 'econômico'].map((budget) => (
                    <div key={budget} className="flex items-center space-x-2">
                      <RadioGroupItem value={budget} id={`budget-${budget}`} />
                      <Label htmlFor={`budget-${budget}`} className="font-normal capitalize">{budget}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                'Obter Recomendação'
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
