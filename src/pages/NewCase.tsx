import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import PhotoUploader from '@/components/PhotoUploader';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  User,
  Stethoscope,
  Palette,
  ClipboardList,
  Camera
} from 'lucide-react';

interface FormData {
  // Patient Info
  patientName: string;
  patientAge: string;
  // Tooth Selection
  selectedTooth: string;
  toothRegion: 'anterior' | 'posterior';
  // Clinical Findings
  cavityClass: string;
  restorationSize: string;
  substrate: string;
  hasBruxism: boolean;
  // Aesthetic Requirements
  aestheticLevel: string;
  toothShade: string;
  needsStratification: boolean;
  // Budget
  budget: string;
  longevityExpectation: string;
  // Notes
  clinicalNotes: string;
  // Photos
  photoFrontal: string | null;
  photo45: string | null;
  photoFace: string | null;
}

const initialFormData: FormData = {
  patientName: '',
  patientAge: '',
  selectedTooth: '',
  toothRegion: 'anterior',
  cavityClass: 'I',
  restorationSize: 'pequena',
  substrate: 'esmalte',
  hasBruxism: false,
  aestheticLevel: 'alto',
  toothShade: 'A2',
  needsStratification: false,
  budget: 'intermediário',
  longevityExpectation: 'média',
  clinicalNotes: '',
  photoFrontal: null,
  photo45: null,
  photoFace: null,
};

const TEETH = {
  upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
  lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
};

const steps = [
  { id: 1, name: 'Paciente', icon: User },
  { id: 2, name: 'Dente', icon: Stethoscope },
  { id: 3, name: 'Clínico', icon: ClipboardList },
  { id: 4, name: 'Estética', icon: Palette },
  { id: 5, name: 'Fotos', icon: Camera },
];

export default function NewCase() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1 && (!formData.patientName || !formData.patientAge)) {
      toast.error('Preencha os dados do paciente');
      return;
    }
    if (step === 2 && !formData.selectedTooth) {
      toast.error('Selecione um dente');
      return;
    }
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
      // Create evaluation record using existing evaluations table
      const { data: evaluation, error: evalError } = await supabase
        .from('evaluations')
        .insert({
          user_id: user.id,
          patient_age: parseInt(formData.patientAge),
          tooth: formData.selectedTooth,
          region: formData.toothRegion,
          cavity_class: `Classe ${formData.cavityClass}`,
          restoration_size: formData.restorationSize,
          substrate: formData.substrate,
          bruxism: formData.hasBruxism,
          aesthetic_level: formData.aestheticLevel,
          tooth_color: formData.toothShade,
          stratification_needed: formData.needsStratification,
          budget: formData.budget,
          longevity_expectation: formData.longevityExpectation,
          photo_frontal: formData.photoFrontal,
          photo_45: formData.photo45,
          photo_face: formData.photoFace,
        })
        .select()
        .single();

      if (evalError) throw evalError;

      // Call AI recommendation edge function with userId for inventory-aware recommendations
      const { error: aiError } = await supabase.functions.invoke(
        'recommend-resin',
        {
          body: {
            evaluationId: evaluation.id,
            userId: user.id,
            patientAge: formData.patientAge,
            tooth: formData.selectedTooth,
            region: formData.toothRegion,
            cavityClass: `Classe ${formData.cavityClass}`,
            restorationSize: formData.restorationSize,
            substrate: formData.substrate,
            bruxism: formData.hasBruxism,
            aestheticLevel: formData.aestheticLevel,
            toothColor: formData.toothShade,
            stratificationNeeded: formData.needsStratification,
            budget: formData.budget,
            longevityExpectation: formData.longevityExpectation,
          },
        }
      );

      if (aiError) throw aiError;

      // If photos were uploaded, analyze them with multimodal AI
      const hasPhotos = formData.photoFrontal || formData.photo45 || formData.photoFace;
      if (hasPhotos) {
        const { error: photoError } = await supabase.functions.invoke(
          'analyze-photos',
          {
            body: {
              evaluationId: evaluation.id,
              photoFrontal: formData.photoFrontal,
              photo45: formData.photo45,
              photoFace: formData.photoFace,
            },
          }
        );

        if (photoError) {
          console.error('Photo analysis error:', photoError);
          toast.warning('Recomendação gerada, mas análise de fotos falhou');
        }
      }

      toast.success('Caso criado e analisado com sucesso!');
      navigate(`/result/${evaluation.id}`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao criar caso');
    } finally {
      setLoading(false);
    }
  };

  const isAnterior = (tooth: string) => {
    const anteriorTeeth = ['11', '12', '13', '21', '22', '23', '31', '32', '33', '41', '42', '43'];
    return anteriorTeeth.includes(tooth);
  };

  const selectTooth = (tooth: string) => {
    updateField('selectedTooth', tooth);
    updateField('toothRegion', isAnterior(tooth) ? 'anterior' : 'posterior');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-xl font-semibold tracking-tight">Novo Caso</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((s) => (
              <div 
                key={s.id} 
                className={`flex flex-col items-center ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step >= s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-xs hidden sm:block">{s.name}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step 1: Patient Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Dados do Paciente</h2>
              <p className="text-sm text-muted-foreground">Informações básicas do paciente</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Nome do paciente</Label>
                <Input
                  id="patientName"
                  placeholder="Nome completo"
                  value={formData.patientName}
                  onChange={(e) => updateField('patientName', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientAge">Idade</Label>
                <Input
                  id="patientAge"
                  type="number"
                  placeholder="Ex: 35"
                  value={formData.patientAge}
                  onChange={(e) => updateField('patientAge', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Tooth Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Seleção do Dente</h2>
              <p className="text-sm text-muted-foreground">Clique no dente a ser restaurado</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Upper Teeth */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 text-center">Superior</p>
                    <div className="grid grid-cols-8 gap-1">
                      {TEETH.upper.map((tooth) => (
                        <button
                          key={tooth}
                          onClick={() => selectTooth(tooth)}
                          className={`aspect-square rounded text-xs font-medium transition-colors ${
                            formData.selectedTooth === tooth
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                          }`}
                        >
                          {tooth}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lower Teeth */}
                  <div>
                    <div className="grid grid-cols-8 gap-1">
                      {TEETH.lower.map((tooth) => (
                        <button
                          key={tooth}
                          onClick={() => selectTooth(tooth)}
                          className={`aspect-square rounded text-xs font-medium transition-colors ${
                            formData.selectedTooth === tooth
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                          }`}
                        >
                          {tooth}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Inferior</p>
                  </div>
                </div>

                {formData.selectedTooth && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg text-center">
                    <p className="text-sm">
                      Dente <span className="font-semibold">{formData.selectedTooth}</span> selecionado
                      <span className="text-muted-foreground ml-2">
                        ({formData.toothRegion === 'anterior' ? 'Anterior' : 'Posterior'})
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Clinical Findings */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Achados Clínicos</h2>
              <p className="text-sm text-muted-foreground">Características da cavidade</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Classe de cavidade</Label>
                <RadioGroup
                  value={formData.cavityClass}
                  onValueChange={(value) => updateField('cavityClass', value)}
                  className="grid grid-cols-5 gap-2"
                >
                  {['I', 'II', 'III', 'IV', 'V'].map((cls) => (
                    <div key={cls}>
                      <RadioGroupItem
                        value={cls}
                        id={`class-${cls}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`class-${cls}`}
                        className="flex items-center justify-center p-3 border rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {cls}
                      </Label>
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
                  {[
                    { value: 'pequena', label: 'Pequena', desc: 'Até 1/3 da distância intercuspídea' },
                    { value: 'média', label: 'Média', desc: '1/3 a 2/3 da distância intercuspídea' },
                    { value: 'extensa', label: 'Extensa', desc: 'Mais de 2/3, pode envolver cúspides' },
                  ].map((size) => (
                    <div key={size.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={size.value} id={size.value} className="mt-1" />
                      <Label htmlFor={size.value} className="font-normal cursor-pointer">
                        <span className="font-medium">{size.label}</span>
                        <p className="text-sm text-muted-foreground">{size.desc}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Substrato predominante</Label>
                <RadioGroup
                  value={formData.substrate}
                  onValueChange={(value) => updateField('substrate', value)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['esmalte', 'dentina', 'ambos'].map((sub) => (
                    <div key={sub}>
                      <RadioGroupItem
                        value={sub}
                        id={`sub-${sub}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`sub-${sub}`}
                        className="flex items-center justify-center p-3 border rounded-lg cursor-pointer capitalize peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {sub}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Paciente com bruxismo?</Label>
                  <p className="text-sm text-muted-foreground">Ranger ou apertar os dentes</p>
                </div>
                <RadioGroup
                  value={formData.hasBruxism ? 'yes' : 'no'}
                  onValueChange={(value) => updateField('hasBruxism', value === 'yes')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="brux-yes" />
                    <Label htmlFor="brux-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="brux-no" />
                    <Label htmlFor="brux-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Aesthetic Requirements */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Requisitos Estéticos e Orçamento</h2>
              <p className="text-sm text-muted-foreground">Expectativas de resultado</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Nível de exigência estética</Label>
                <RadioGroup
                  value={formData.aestheticLevel}
                  onValueChange={(value) => updateField('aestheticLevel', value)}
                >
                  {[
                    { value: 'alto', label: 'Alto', desc: 'Paciente muito exigente, máxima naturalidade' },
                    { value: 'médio', label: 'Médio', desc: 'Resultado natural, sem detalhes extremos' },
                    { value: 'baixo', label: 'Baixo', desc: 'Funcional, sem grandes exigências estéticas' },
                  ].map((level) => (
                    <div key={level.value} className="flex items-start space-x-3">
                      <RadioGroupItem value={level.value} id={`aes-${level.value}`} className="mt-1" />
                      <Label htmlFor={`aes-${level.value}`} className="font-normal cursor-pointer">
                        <span className="font-medium">{level.label}</span>
                        <p className="text-sm text-muted-foreground">{level.desc}</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toothShade">Cor do dente (escala VITA)</Label>
                <Input
                  id="toothShade"
                  placeholder="Ex: A2, B1, C3"
                  value={formData.toothShade}
                  onChange={(e) => updateField('toothShade', e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Necessita estratificação?</Label>
                  <p className="text-sm text-muted-foreground">Técnica de camadas para naturalidade</p>
                </div>
                <RadioGroup
                  value={formData.needsStratification ? 'yes' : 'no'}
                  onValueChange={(value) => updateField('needsStratification', value === 'yes')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="strat-yes" />
                    <Label htmlFor="strat-yes">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="strat-no" />
                    <Label htmlFor="strat-no">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Orçamento do paciente</Label>
                <RadioGroup
                  value={formData.budget}
                  onValueChange={(value) => updateField('budget', value)}
                  className="grid grid-cols-3 gap-2"
                >
                  {['premium', 'intermediário', 'econômico'].map((budget) => (
                    <div key={budget}>
                      <RadioGroupItem
                        value={budget}
                        id={`budget-${budget}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`budget-${budget}`}
                        className="flex items-center justify-center p-3 border rounded-lg cursor-pointer capitalize peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        {budget}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicalNotes">Observações clínicas (opcional)</Label>
                <Textarea
                  id="clinicalNotes"
                  placeholder="Informações adicionais relevantes para o caso..."
                  value={formData.clinicalNotes}
                  onChange={(e) => updateField('clinicalNotes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Photos */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Fotos Clínicas</h2>
              <p className="text-sm text-muted-foreground">
                Opcional: adicione fotos para análise multimodal com IA e protocolo de estratificação personalizado
              </p>
            </div>

            <div className="space-y-4">
              <PhotoUploader
                label="Sorriso Frontal"
                description="Foto frontal do sorriso com os dentes naturais expostos"
                photoType="frontal"
                value={formData.photoFrontal}
                onChange={(url) => updateField('photoFrontal', url)}
                userId={user?.id || ''}
              />

              <PhotoUploader
                label="Sorriso 45°"
                description="Vista lateral do sorriso para análise de forma e contorno"
                photoType="45"
                value={formData.photo45}
                onChange={(url) => updateField('photo45', url)}
                userId={user?.id || ''}
              />

              <PhotoUploader
                label="Rosto Completo"
                description="Foto do rosto para análise de harmonia facial"
                photoType="face"
                value={formData.photoFace}
                onChange={(url) => updateField('photoFace', url)}
                userId={user?.id || ''}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              A análise de fotos utiliza IA multimodal (Gemini 2.5 Pro) para gerar um protocolo de estratificação personalizado baseado nas características visuais do paciente.
            </p>
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
                'Analisar Caso'
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}