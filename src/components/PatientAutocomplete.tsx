import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Plus, Check } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
}

interface PatientAutocompleteProps {
  value: string;
  onChange: (name: string, patientId?: string, birthDate?: string | null) => void;
  placeholder?: string;
  label?: string;
  selectedPatientId?: string | null;
}

export function PatientAutocomplete({
  value,
  onChange,
  placeholder = 'Nome do paciente',
  label = 'Nome (opcional)',
  selectedPatientId,
}: PatientAutocompleteProps) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, email, birth_date')
        .eq('user_id', user.id)
        .order('name');

      if (!error && data) {
        setPatients(data);
      }
      setIsLoading(false);
    };

    fetchPatients();
  }, [user]);

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

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="patientName">{label}</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="patientName"
          placeholder={placeholder}
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
                Existente
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
                  <p className="font-medium text-sm text-foreground">Criar "{value.trim()}"</p>
                  <p className="text-xs text-muted-foreground">Novo paciente</p>
                </div>
              </button>
            </>
          )}

          {/* No results */}
          {filteredPatients.length === 0 && value.trim().length < 2 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
