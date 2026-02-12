import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, User } from 'lucide-react';
import { PatientAutocomplete } from '@/components/PatientAutocomplete';
import type { Patient } from '@/components/PatientAutocomplete';
import { calculateAge } from '@/lib/dateUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ReviewFormData } from '../ReviewAnalysisStep';

interface PatientDataSectionProps {
  formData: ReviewFormData;
  onFormChange: (data: Partial<ReviewFormData>) => void;
  patients: Patient[];
  selectedPatientId?: string | null;
  onPatientSelect?: (name: string, patientId?: string, birthDate?: string | null) => void;
  patientBirthDate?: string | null;
  onPatientBirthDateChange?: (date: string | null) => void;
  dobError: boolean;
  setDobError: (value: boolean) => void;
}

export function PatientDataSection({
  formData,
  onFormChange,
  patients,
  selectedPatientId,
  onPatientSelect,
  patientBirthDate,
  onPatientBirthDateChange,
  dobError,
  setDobError,
}: PatientDataSectionProps) {
  const { t } = useTranslation();
  const [dobInputText, setDobInputText] = useState('');
  const [dobCalendarOpen, setDobCalendarOpen] = useState(false);

  const handleBirthDateChange = (date: string | null) => {
    if (date) setDobError(false);
    onPatientBirthDateChange?.(date);
  };

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          {t('components.wizard.review.patientData')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <PatientAutocomplete
            value={formData.patientName}
            onChange={(name, patientId, birthDate) => {
              onFormChange({ patientName: name });
              onPatientSelect?.(name, patientId, birthDate);
            }}
            patients={patients}
            selectedPatientId={selectedPatientId}
            placeholder={t('components.wizard.review.patientNamePlaceholder')}
            label={t('components.wizard.review.patientNameLabel')}
          />

          {/* Birth date + calculated age */}
          <div className="space-y-2">
            <Label>
              {t('components.wizard.review.birthDateLabel')}
            </Label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('components.wizard.review.birthDatePlaceholder')}
                  className={cn(
                    "pr-10",
                    dobError && "border-destructive ring-1 ring-destructive"
                  )}
                  disabled={!!selectedPatientId && !!patientBirthDate}
                  value={
                    patientBirthDate && !dobInputText
                      ? format(new Date(patientBirthDate), "dd/MM/yyyy", { locale: ptBR })
                      : dobInputText
                  }
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d/]/g, '');
                    const digits = value.replace(/\//g, '');
                    if (digits.length >= 4) {
                      value = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
                    } else if (digits.length >= 2) {
                      value = digits.slice(0, 2) + '/' + digits.slice(2);
                    }
                    setDobInputText(value);
                    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                    if (match) {
                      const [, dd, mm, yyyy] = match;
                      const day = parseInt(dd, 10);
                      const month = parseInt(mm, 10);
                      const year = parseInt(yyyy, 10);
                      const date = new Date(year, month - 1, day);
                      if (
                        date.getDate() === day &&
                        date.getMonth() === month - 1 &&
                        date.getFullYear() === year &&
                        date <= new Date() &&
                        year >= 1900
                      ) {
                        const isoDate = date.toISOString().split('T')[0];
                        handleBirthDateChange(isoDate);
                        const age = calculateAge(isoDate);
                        onFormChange({ patientAge: String(age) });
                      }
                    }
                  }}
                  onBlur={() => {
                    if (patientBirthDate) {
                      setDobInputText('');
                    }
                  }}
                />
                <Popover open={dobCalendarOpen} onOpenChange={setDobCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      disabled={!!selectedPatientId && !!patientBirthDate}
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={patientBirthDate ? new Date(patientBirthDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const isoDate = date.toISOString().split('T')[0];
                          handleBirthDateChange(isoDate);
                          const age = calculateAge(isoDate);
                          onFormChange({ patientAge: String(age) });
                          setDobInputText('');
                          setDobCalendarOpen(false);
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                      captionLayout="dropdown-buttons"
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {patientBirthDate && (
                <div className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary/10 text-primary min-w-[80px] justify-center">
                  <span className="text-sm font-medium">
                    {t('components.wizard.review.yearsOld', { age: calculateAge(patientBirthDate) })}
                  </span>
                </div>
              )}
            </div>

            {!patientBirthDate && !dobError && (
              <p className="text-xs text-muted-foreground">
                {t('components.wizard.review.recommendedForPrecision')}
              </p>
            )}

            {selectedPatientId && !patientBirthDate && (
              <p className="text-xs text-muted-foreground">
                {t('components.wizard.review.addForAutoFill')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
