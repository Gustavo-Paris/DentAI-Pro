import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClipboardList, Layers, Wrench, Ruler } from 'lucide-react';

const WAXUP_KEYS = [
  'components.veneerPrep.waxupStep1',
  'components.veneerPrep.waxupStep2',
  'components.veneerPrep.waxupStep3',
  'components.veneerPrep.waxupStep4',
] as const;

const MOCKUP_KEYS = [
  'components.veneerPrep.mockupStep1',
  'components.veneerPrep.mockupStep2',
  'components.veneerPrep.mockupStep3',
  'components.veneerPrep.mockupStep4',
  'components.veneerPrep.mockupStep5',
] as const;

const BUR_KEYS = [
  { nameKey: 'components.veneerPrep.bur1Name', purposeKey: 'components.veneerPrep.bur1Purpose' },
  { nameKey: 'components.veneerPrep.bur2Name', purposeKey: 'components.veneerPrep.bur2Purpose' },
  { nameKey: 'components.veneerPrep.bur3Name', purposeKey: 'components.veneerPrep.bur3Purpose' },
  { nameKey: 'components.veneerPrep.bur4Name', purposeKey: 'components.veneerPrep.bur4Purpose' },
] as const;

const PREP_NOTE_KEYS = [
  'components.veneerPrep.prepNote1',
  'components.veneerPrep.prepNote2',
  'components.veneerPrep.prepNote3',
  'components.veneerPrep.prepNote4',
  'components.veneerPrep.prepNote5',
] as const;

export function VeneerPreparationCard() {
  const { t } = useTranslation();

  const waxupSteps = useMemo(() => WAXUP_KEYS.map(k => t(k)), [t]);
  const mockupSteps = useMemo(() => MOCKUP_KEYS.map(k => t(k)), [t]);
  const burs = useMemo(() => BUR_KEYS.map(b => ({ name: t(b.nameKey), purpose: t(b.purposeKey) })), [t]);
  const prepNotes = useMemo(() => PREP_NOTE_KEYS.map(k => t(k)), [t]);

  return (
    <div className="space-y-4">
      <Card className="border-warning/30 bg-warning/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-warning" />
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
              {waxupSteps.map((step, i) => (
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
              {mockupSteps.map((step, i) => (
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
              {burs.map((bur, i) => (
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
              {prepNotes.map((note, i) => (
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
