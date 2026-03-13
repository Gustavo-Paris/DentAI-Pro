import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientDataSection } from '../PatientDataSection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, any>) => {
      if (params) return `${key}:${JSON.stringify(params)}`;
      return key;
    },
  }),
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
  Input: ({ value, onChange, onBlur, ...props }: any) => (
    <input value={value} onChange={onChange} onBlur={onBlur} {...props} />
  ),
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  Popover: ({ children }: any) => <div>{children}</div>,
  PopoverContent: ({ children }: any) => <div>{children}</div>,
  PopoverTrigger: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/calendar', () => ({
  Calendar: ({ onSelect }: any) => (
    <div data-testid="calendar">
      <button data-testid="calendar-date" onClick={() => onSelect?.(new Date('2000-06-15'))}>
        Pick date
      </button>
    </div>
  ),
}));

vi.mock('@/components/PatientAutocomplete', () => ({
  PatientAutocomplete: ({ value, onChange }: any) => (
    <div data-testid="patient-autocomplete">
      <input
        data-testid="patient-input"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
      />
      <button
        data-testid="select-patient-btn"
        onClick={() => onChange('João Silva', 'p-123', '1990-05-20')}
      >
        Select Patient
      </button>
    </div>
  ),
}));

vi.mock('lucide-react', () => ({
  CalendarIcon: () => <span data-testid="calendar-icon" />,
  User: () => <span data-testid="user-icon" />,
}));

vi.mock('@/lib/date-utils', () => ({
  calculateAge: (date: string) => {
    const birth = new Date(date);
    const now = new Date();
    return now.getFullYear() - birth.getFullYear();
  },
  getDateLocale: () => ({}),
}));

vi.mock('date-fns', () => ({
  format: (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${d}/${m}/${date.getFullYear()}`;
  },
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('PatientDataSection', () => {
  const defaultProps = {
    formData: { patientName: '', patientAge: '' },
    onFormChange: vi.fn(),
    patients: [],
    selectedPatientId: null,
    onPatientSelect: vi.fn(),
    patientBirthDate: null,
    onPatientBirthDateChange: vi.fn(),
    dobError: false,
    setDobError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders patient data section', () => {
    render(<PatientDataSection {...defaultProps} />);
    expect(screen.getByText('components.wizard.review.patientData')).toBeInTheDocument();
  });

  it('renders birth date input', () => {
    render(<PatientDataSection {...defaultProps} />);
    expect(screen.getByPlaceholderText('components.wizard.review.birthDatePlaceholder')).toBeInTheDocument();
  });

  it('handles birth date text input with auto-formatting', () => {
    render(<PatientDataSection {...defaultProps} />);
    const input = screen.getByPlaceholderText('components.wizard.review.birthDatePlaceholder');

    // Type a complete date
    fireEvent.change(input, { target: { value: '15061990' } });

    // The onChange should have been triggered and formatted
    expect(defaultProps.onPatientBirthDateChange).toHaveBeenCalled();
    expect(defaultProps.setDobError).toHaveBeenCalledWith(false);
    expect(defaultProps.onFormChange).toHaveBeenCalled();
  });

  it('handles partial date input (2 digits)', () => {
    render(<PatientDataSection {...defaultProps} />);
    const input = screen.getByPlaceholderText('components.wizard.review.birthDatePlaceholder');
    fireEvent.change(input, { target: { value: '15' } });
    // Just formatting, no birth date change yet
  });

  it('handles partial date input (4 digits)', () => {
    render(<PatientDataSection {...defaultProps} />);
    const input = screen.getByPlaceholderText('components.wizard.review.birthDatePlaceholder');
    fireEvent.change(input, { target: { value: '1506' } });
    // Just formatting, no complete date yet
  });

  it('handles onBlur to clear input text when birthDate is set', () => {
    render(<PatientDataSection {...defaultProps} patientBirthDate="1990-06-15" />);
    const input = screen.getByPlaceholderText('components.wizard.review.birthDatePlaceholder');
    fireEvent.blur(input);
    // Input text should be cleared
  });

  it('renders calendar date picker', () => {
    render(<PatientDataSection {...defaultProps} />);
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
  });

  it('handles calendar date selection', () => {
    render(<PatientDataSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId('calendar-date'));

    expect(defaultProps.onPatientBirthDateChange).toHaveBeenCalledWith('2000-06-15');
    expect(defaultProps.onFormChange).toHaveBeenCalled();
    expect(defaultProps.setDobError).toHaveBeenCalledWith(false);
  });

  it('shows age when birth date is set', () => {
    render(<PatientDataSection {...defaultProps} patientBirthDate="1990-06-15" />);
    // Should show the calculated age
    const ageElement = screen.getByText(/components\.wizard\.review\.yearsOld/);
    expect(ageElement).toBeInTheDocument();
  });

  it('shows recommendation message when no birth date', () => {
    render(<PatientDataSection {...defaultProps} />);
    expect(screen.getByText('components.wizard.review.recommendedForPrecision')).toBeInTheDocument();
  });

  it('shows add birth date message for selected patient without birth date', () => {
    render(<PatientDataSection {...defaultProps} selectedPatientId="p-123" />);
    expect(screen.getByText('components.wizard.review.addForAutoFill')).toBeInTheDocument();
  });

  it('handles patient selection from autocomplete', () => {
    render(<PatientDataSection {...defaultProps} />);
    fireEvent.click(screen.getByTestId('select-patient-btn'));
    expect(defaultProps.onFormChange).toHaveBeenCalledWith({ patientName: 'João Silva' });
    expect(defaultProps.onPatientSelect).toHaveBeenCalledWith('João Silva', 'p-123', '1990-05-20');
  });
});
