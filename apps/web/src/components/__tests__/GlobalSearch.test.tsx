import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GlobalSearch } from '../GlobalSearch';
import type { SearchEvaluation } from '../GlobalSearch';

// ---------------------------------------------------------------------------
// Shared mock state
// ---------------------------------------------------------------------------

let mockUserValue: { id: string; email: string } | null = { id: 'user-1', email: 'test@test.com' };

// Mock react-i18next
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, opts?: Record<string, unknown>) => {
        if (opts?.count !== undefined) return `${key}:${opts.count}`;
        return key;
      },
      i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
    }),
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext — uses mockUserValue so tests can control it
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUserValue }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: (date: Date, _fmt: string) => `${date.getDate()} de jan 2026`,
}));
vi.mock('date-fns/locale', () => ({
  ptBR: {},
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  User: ({ className }: { className?: string }) => <span data-testid="user-icon" className={className} />,
  Calendar: ({ className }: { className?: string }) => <span data-testid="calendar-icon" className={className} />,
  Loader2: ({ className }: { className?: string }) => <span data-testid="loader-icon" className={className} />,
}));

// Mock command UI components
vi.mock('@/components/ui/command', () => ({
  CommandDialog: ({ children, open, onOpenChange }: any) =>
    open ? (
      <div data-testid="command-dialog" onClick={() => onOpenChange?.(false)}>
        {children}
      </div>
    ) : null,
  CommandInput: ({ placeholder, value, onValueChange, ...props }: any) => (
    <input
      data-testid="command-input"
      placeholder={placeholder}
      value={value}
      onChange={(e: any) => onValueChange?.(e.target.value)}
      aria-label={props['aria-label']}
    />
  ),
  CommandList: ({ children }: any) => <div data-testid="command-list">{children}</div>,
  CommandEmpty: ({ children }: any) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children, heading }: any) => (
    <div data-testid="command-group">
      <span>{heading}</span>
      {children}
    </div>
  ),
  CommandItem: ({ children, onSelect, value }: any) => (
    <div data-testid="command-item" data-value={value} onClick={() => onSelect?.()}>
      {children}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockEvaluations: SearchEvaluation[] = [
  {
    id: 'eval-1',
    session_id: 'session-1',
    patient_name: 'Maria Silva',
    tooth: '11',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'eval-2',
    session_id: 'session-1',
    patient_name: 'Maria Silva',
    tooth: '21',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'eval-3',
    session_id: 'session-2',
    patient_name: 'João Santos',
    tooth: '14',
    created_at: '2026-01-20T14:30:00Z',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GlobalSearch', () => {
  let mockFetchEvaluations: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockUserValue = { id: 'user-1', email: 'test@test.com' };
    mockFetchEvaluations = vi.fn().mockResolvedValue(mockEvaluations);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should not render dialog when closed', () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);
      expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
    });

    it('should not render when user is not authenticated', () => {
      mockUserValue = null;

      const { container } = render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);
      expect(container.innerHTML).toBe('');
    });
  });

  describe('keyboard shortcut', () => {
    it('should open dialog with Cmd+K', () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      expect(screen.getByTestId('command-dialog')).toBeInTheDocument();
    });

    it('should open dialog with Ctrl+K', () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      });

      expect(screen.getByTestId('command-dialog')).toBeInTheDocument();
    });

    it('should toggle dialog on repeated Cmd+K', () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      // Open
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });
      expect(screen.getByTestId('command-dialog')).toBeInTheDocument();

      // Close
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });
      expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
    });

    it('should not open dialog when just pressing K without modifier', () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k' });
      });

      expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
    });
  });

  describe('search input', () => {
    it('should render search input with placeholder when dialog is open', () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'components.globalSearch.placeholder');
    });

    it('should show min chars message when query is less than 2 characters', () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      expect(screen.getByText('components.globalSearch.minChars')).toBeInTheDocument();
    });
  });

  describe('search results', () => {
    it('should fetch and display results when query is at least 2 characters', async () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      fireEvent.change(input, { target: { value: 'Maria' } });

      // Advance debounce timer + flush microtask queue
      await vi.advanceTimersByTimeAsync(350);

      expect(mockFetchEvaluations).toHaveBeenCalled();
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });

    it('should not fetch when query is less than 2 characters', async () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      fireEvent.change(input, { target: { value: 'M' } });

      await vi.advanceTimersByTimeAsync(350);

      expect(mockFetchEvaluations).not.toHaveBeenCalled();
    });

    it('should group evaluations by session_id', async () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      fireEvent.change(input, { target: { value: 'Maria' } });

      await vi.advanceTimersByTimeAsync(350);

      // Maria has 2 evaluations in session-1, grouped as 1 result
      const items = screen.getAllByTestId('command-item');
      expect(items).toHaveLength(1);
    });

    it('should show no results message when no evaluations match', async () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      fireEvent.change(input, { target: { value: 'ZZZZZ' } });

      await vi.advanceTimersByTimeAsync(350);

      expect(screen.getByText('components.globalSearch.noResults')).toBeInTheDocument();
    });

    it('should filter by tooth number', async () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      fireEvent.change(input, { target: { value: '14' } });

      await vi.advanceTimersByTimeAsync(350);

      expect(screen.getByText('João Santos')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to evaluation when a result is clicked', async () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      fireEvent.change(input, { target: { value: 'João' } });

      await vi.advanceTimersByTimeAsync(350);

      expect(screen.getByText('João Santos')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('command-item'));

      expect(mockNavigate).toHaveBeenCalledWith('/evaluation/session-2');
    });

    it('should close dialog after selecting a result', async () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      fireEvent.change(input, { target: { value: 'João' } });

      await vi.advanceTimersByTimeAsync(350);

      expect(screen.getByText('João Santos')).toBeInTheDocument();

      act(() => {
        fireEvent.click(screen.getByTestId('command-item'));
      });

      expect(screen.queryByTestId('command-dialog')).not.toBeInTheDocument();
    });
  });

  describe('custom event', () => {
    it('should open dialog on open-global-search event', () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        document.dispatchEvent(new Event('open-global-search'));
      });

      expect(screen.getByTestId('command-dialog')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetchEvaluations.mockRejectedValueOnce(new Error('Network error'));

      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      fireEvent.change(input, { target: { value: 'Maria' } });

      await vi.advanceTimersByTimeAsync(350);

      expect(screen.getByText('components.globalSearch.noResults')).toBeInTheDocument();
    });
  });

  describe('dialog state reset', () => {
    it('should reset query and results when dialog closes', async () => {
      render(<GlobalSearch fetchEvaluations={mockFetchEvaluations} />);

      // Open and search
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const input = screen.getByTestId('command-input');
      fireEvent.change(input, { target: { value: 'Maria' } });

      await vi.advanceTimersByTimeAsync(350);

      expect(screen.getByText('Maria Silva')).toBeInTheDocument();

      // Close
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      // Reopen — should be clean
      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      const freshInput = screen.getByTestId('command-input');
      expect(freshInput).toHaveValue('');
      expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();
    });
  });
});
