import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClipboardList, Layers, Wrench, Ruler } from 'lucide-react';

const DIAGNOSTIC_WAXUP_STEPS = [
  'Moldagem de estudo (alginato ou silicone de adição)',
  'Vazamento em gesso tipo IV',
  'Enceramento dos dentes envolvidos com cera para escultura',
  'Aprovação do enceramento pelo paciente',
];

const MOCKUP_STEPS = [
  'Moldagem do enceramento com silicone de condensação (muralha)',
  'Preenchimento da muralha com resina bisacrílica',
  'Posicionamento em boca sobre os dentes sem preparo',
  'Avaliação estética com o paciente (proporção, cor, forma)',
  'Ajustes e aprovação final antes do preparo',
];

const BURS = [
  { name: 'Broca esférica diamantada (1012)', purpose: 'Sulcos de orientação de profundidade' },
  { name: 'Broca tronco-cônica (2135)', purpose: 'Desgaste vestibular controlado' },
  { name: 'Broca chanfro (2068)', purpose: 'Término cervical em chanfro' },
  { name: 'Broca multilaminada (9714)', purpose: 'Acabamento e refinamento do preparo' },
];

const PREP_NOTES = [
  'A profundidade de desgaste varia conforme a estrutura dental remanescente',
  'Desgaste vestibular: 0,3 a 0,5mm para laminados ultrafinos; 0,5 a 0,7mm para facetas convencionais',
  'Término cervical: chanfro leve ou ombro arredondado ao nível gengival ou ligeiramente subgengival',
  'Extensão incisal: manter em esmalte quando possível; envolver bordo incisal se necessário',
  'Extensão proximal: manter ponto de contato quando possível',
];

export function VeneerPreparationCard() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <Card className="border-amber-400/30 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {t('components.protocol.veneerPrep.title')}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t('components.protocol.veneerPrep.subtitle')}
          </p>
        </CardHeader>
      </Card>

      <Accordion type="multiple" defaultValue={["waxup", "mockup", "prep"]} className="space-y-3">
        {/* 1. Diagnostic Wax-up */}
        <AccordionItem value="waxup" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-sm">{t('components.protocol.veneerPrep.diagnosticWaxup')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground mb-3">
              {t('components.protocol.veneerPrep.waxupDesc')}
            </p>
            <ol className="space-y-2">
              {DIAGNOSTIC_WAXUP_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                    {i + 1}
                  </div>
                  {step}
                </li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Mock-up */}
        <AccordionItem value="mockup" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-500" />
              <span className="font-medium text-sm">{t('components.protocol.veneerPrep.mockup')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground mb-3">
              {t('components.protocol.veneerPrep.mockupDesc')}
            </p>
            <ol className="space-y-2">
              {MOCKUP_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-xs font-medium text-cyan-600 dark:text-cyan-400">
                    {i + 1}
                  </div>
                  {step}
                </li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Preparation Sequence */}
        <AccordionItem value="prep" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-500" />
              <span className="font-medium text-sm">{t('components.protocol.veneerPrep.prepSequence')}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground mb-3">
              {t('components.protocol.veneerPrep.prepDesc')}
            </p>
            <div className="space-y-3 mb-4">
              {BURS.map((bur, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-medium text-purple-600 dark:text-purple-400">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{bur.name}</p>
                    <p className="text-xs text-muted-foreground">{bur.purpose}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('components.protocol.veneerPrep.prepGuidelines')}</span>
              </div>
              {PREP_NOTES.map((note, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0 mt-0.5">
                    {i + 1}
                  </Badge>
                  {note}
                </p>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default VeneerPreparationCard;
