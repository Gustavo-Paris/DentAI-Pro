import { useState, useEffect, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Plus, Check } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
}

interface PatientAutocompleteProps {
  value: string;
  onChange: (name: string, patientId?: string, birthDate?: string | null) => void;
  patients: Patient[];
  placeholder?: string;
  label?: string;
  selectedPatientId?: string | null;
}

export const PatientAutocomplete = memo(function PatientAutocomplete({
  value,
  onChange,
  patients,
  placeholder,
  label,
  selectedPatientId,
}: PatientAutocompleteProps) {
  const { t } = useTranslation();
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter patients based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredPatients([]);
      return;
    }

    const query = value.toLowerCase().trim();
    const filtered = patients.filter((p) =>
      p.name.toLowerCase().includes(query)
    );
    setFilteredPatients(filtered.slice(0, 5)); // Limit to 5 suggestions
    setHighlightedIndex(-1);
    trackEvent('patient_searched', { result_count: filtered.length });
  }, [value, patients]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue, undefined); // Clear patient ID when typing
    setIsOpen(true);
  };

  // Handle selecting a patient
  const handleSelectPatient = (patient: Patient) => {
    onChange(patient.name, patient.id, patient.birth_date);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Handle creating new patient (just use the typed name)
  const handleCreateNew = () => {
    onChange(value, undefined, null);
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const maxIndex = filteredPatients.length; // +1 for "create new" option

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex === filteredPatients.length) {
          handleCreateNew();
        } else if (highlightedIndex >= 0 && highlightedIndex < filteredPatients.length) {
          handleSelectPatient(filteredPatients[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showDropdown = isOpen && value.trim().length > 0 && (filteredPatients.length > 0 || value.trim().length >= 2);
  const exactMatch = patients.find((p) => p.name.toLowerCase() === value.toLowerCase().trim());

  const resolvedLabel = label ?? t('components.wizard.review.patientNameLabel');
  const resolvedPlaceholder = placeholder ?? t('components.wizard.review.patientNamePlaceholder');

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="patientName">{resolvedLabel}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="patientName"
          placeholder={resolvedPlaceholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={selectedPatientId ? 'pr-10' : ''}
        />
        {selectedPatientId && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 z-50 mt-1 py-1 max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-md"
        >
          {/* Existing patients */}
          {filteredPatients.map((patient, index) => (
            <button
              key={patient.id}
              type="button"
              className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors ${
                highlightedIndex === index ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onClick={() => handleSelectPatient(patient)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="font-medium text-sm truncate text-foreground">{patient.name}</p>
                {patient.phone && (
                  <p className="text-xs text-muted-foreground truncate">{patient.phone}</p>
                )}
              </div>
              <Badge variant="outline" className="text-xs shrink-0 bg-secondary text-secondary-foreground">
                {t('components.patientAutocomplete.existing')}
              </Badge>
            </button>
          ))}

          {/* Create new option */}
          {!exactMatch && value.trim().length >= 2 && (
            <>
              {filteredPatients.length > 0 && <div className="border-t border-border my-1" />}
              <button
                type="button"
                className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors ${
                  highlightedIndex === filteredPatients.length ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                onClick={handleCreateNew}
                onMouseEnter={() => setHighlightedIndex(filteredPatients.length)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{t('components.patientAutocomplete.createNew', { name: value.trim() })}</p>
                  <p className="text-xs text-muted-foreground">{t('components.patientAutocomplete.newPatient')}</p>
                </div>
              </button>
            </>
          )}

          {/* No results */}
          {filteredPatients.length === 0 && value.trim().length < 2 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('components.patientAutocomplete.minChars')}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
