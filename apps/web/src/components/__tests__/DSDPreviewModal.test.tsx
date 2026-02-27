import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DSDPreviewModal } from '../DSDPreviewModal';

// Mock react-i18next
vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, params?: Record<string, any>) => {
        if (params) return `${key}:${JSON.stringify(params)}`;
        return key;
      },
      i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
    }),
    Trans: ({ children }: any) => children,
  };
});

// Mock lucide-react
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    Smile: ({ className }: any) => <span data-testid="smile-icon" className={className} />,
  };
});

// Mock useSignedUrl
vi.mock('@/hooks/useSignedUrl', () => ({
  getSignedUrl: vi.fn().mockImplementation((_bucket: string, path: string) => {
    if (!path) return Promise.resolve(null);
    return Promise.resolve(`https://signed.example.com/${path}`);
  }),
}));

// Mock ComparisonSlider
vi.mock('@/components/dsd/ComparisonSlider', () => ({
  ComparisonSlider: ({ beforeImage, afterImage, afterLabel }: any) => (
    <div data-testid="comparison-slider">
      <img src={beforeImage} alt="before" data-testid="slider-before" />
      <img src={afterImage} alt="after" data-testid="slider-after" />
      {afterLabel && <span data-testid="slider-label">{afterLabel}</span>}
    </div>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    open ? (
      <div data-testid="dialog" role="dialog">
        {children}
        <button data-testid="dialog-close" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>
    ) : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DSDPreviewModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    photoPath: 'photos/clinical.jpg',
    simulationPath: 'simulations/dsd.jpg',
    layers: null as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('should render when open is true', () => {
      render(<DSDPreviewModal {...defaultProps} />);
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      render(<DSDPreviewModal {...defaultProps} open={false} />);
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('should render the modal title with smile icon', () => {
      render(<DSDPreviewModal {...defaultProps} />);
      expect(screen.getByTestId('smile-icon')).toBeInTheDocument();
      expect(screen.getByText('components.dsdPreview.title')).toBeInTheDocument();
    });
  });

  // ---- Image display ----

  describe('image display', () => {
    it('should show loading skeleton initially', () => {
      render(<DSDPreviewModal {...defaultProps} />);
      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should show comparison slider with signed URLs after loading', async () => {
      render(<DSDPreviewModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-slider')).toBeInTheDocument();
      });

      const beforeImg = screen.getByTestId('slider-before');
      const afterImg = screen.getByTestId('slider-after');

      expect(beforeImg).toHaveAttribute('src', 'https://signed.example.com/photos/clinical.jpg');
      expect(afterImg).toHaveAttribute('src', 'https://signed.example.com/simulations/dsd.jpg');
    });

    it('should show not-available message when both paths are null', async () => {
      render(
        <DSDPreviewModal
          {...defaultProps}
          photoPath={null}
          simulationPath={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('components.dsdPreview.notAvailable')).toBeInTheDocument();
      });
    });

    it('should show not-available message when photoPath is null', async () => {
      render(
        <DSDPreviewModal
          {...defaultProps}
          photoPath={null}
          simulationPath="simulations/dsd.jpg"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('components.dsdPreview.notAvailable')).toBeInTheDocument();
      });
    });

    it('should show not-available message when simulationPath is null', async () => {
      render(
        <DSDPreviewModal
          {...defaultProps}
          photoPath="photos/clinical.jpg"
          simulationPath={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('components.dsdPreview.notAvailable')).toBeInTheDocument();
      });
    });
  });

  // ---- Close button ----

  describe('close button', () => {
    it('should call onOpenChange(false) when close button is clicked', async () => {
      render(<DSDPreviewModal {...defaultProps} />);

      const closeButton = screen.getByTestId('dialog-close');
      closeButton.click();

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  // ---- Layers ----

  describe('layers', () => {
    const layerProps = {
      ...defaultProps,
      layers: [
        { type: 'restorations-only', simulation_url: 'simulations/restorations.jpg', includes_gengivoplasty: false },
        { type: 'whitening-restorations', simulation_url: 'simulations/whitening.jpg', includes_gengivoplasty: false },
        { type: 'complete-treatment', simulation_url: 'simulations/complete.jpg', includes_gengivoplasty: true },
      ],
    };

    it('should render layer tabs when multiple layers are provided', async () => {
      render(<DSDPreviewModal {...layerProps} />);

      await waitFor(() => {
        // "restorations" text appears both in the tab button and the ComparisonSlider label
        const restorationsEls = screen.getAllByText('components.dsdPreview.restorations');
        expect(restorationsEls.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('components.dsdPreview.whiteningRestorations')).toBeInTheDocument();
        expect(screen.getByText('components.dsdPreview.completeTreatment')).toBeInTheDocument();
      });
    });

    it('should show gingiva badge for layers with gengivoplasty', async () => {
      render(<DSDPreviewModal {...layerProps} />);

      await waitFor(() => {
        expect(screen.getByText('components.dsdPreview.gingiva')).toBeInTheDocument();
      });
    });

    it('should switch active layer when tab is clicked', async () => {
      render(<DSDPreviewModal {...layerProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-slider')).toBeInTheDocument();
      });

      // Click on whitening-restorations tab
      const whiteningTab = screen.getByText('components.dsdPreview.whiteningRestorations');
      whiteningTab.click();

      await waitFor(() => {
        const afterImg = screen.getByTestId('slider-after');
        expect(afterImg).toHaveAttribute(
          'src',
          'https://signed.example.com/simulations/whitening.jpg'
        );
      });
    });

    it('should not render layer tab buttons when only one layer is provided', async () => {
      const singleLayerProps = {
        ...defaultProps,
        layers: [
          { type: 'restorations-only', simulation_url: 'simulations/restorations.jpg' },
        ],
      };

      render(<DSDPreviewModal {...singleLayerProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-slider')).toBeInTheDocument();
      });

      // The label text may appear in the ComparisonSlider mock (afterLabel),
      // but the layer tab buttons should not be rendered for a single layer.
      // Verify no <button> with the restorations text exists.
      const allEls = screen.queryAllByText('components.dsdPreview.restorations');
      const buttonEls = allEls.filter((el) => el.tagName === 'BUTTON');
      expect(buttonEls).toHaveLength(0);
    });

    it('should not render layer tabs when layers is null', async () => {
      render(<DSDPreviewModal {...defaultProps} layers={null} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-slider')).toBeInTheDocument();
      });

      expect(screen.queryByText('components.dsdPreview.restorations')).not.toBeInTheDocument();
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('should handle layers with null simulation_url gracefully', async () => {
      const propsWithNullLayer = {
        ...defaultProps,
        layers: [
          { type: 'restorations-only', simulation_url: null },
          { type: 'whitening-restorations', simulation_url: 'simulations/whitening.jpg' },
        ],
      };

      render(<DSDPreviewModal {...propsWithNullLayer} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-slider')).toBeInTheDocument();
      });
    });

    it('should use afterUrl fallback when active layer URL is not resolved', async () => {
      // getSignedUrl returns null for a specific path
      const { getSignedUrl } = await import('@/hooks/useSignedUrl');
      (getSignedUrl as any).mockImplementation((_bucket: string, path: string) => {
        if (path === 'simulations/broken.jpg') return Promise.resolve(null);
        return Promise.resolve(`https://signed.example.com/${path}`);
      });

      const propsWithBrokenLayer = {
        ...defaultProps,
        simulationPath: 'simulations/dsd.jpg',
        layers: [
          { type: 'restorations-only', simulation_url: 'simulations/broken.jpg' },
          { type: 'whitening-restorations', simulation_url: 'simulations/whitening.jpg' },
        ],
      };

      render(<DSDPreviewModal {...propsWithBrokenLayer} />);

      await waitFor(() => {
        expect(screen.getByTestId('comparison-slider')).toBeInTheDocument();
      });

      // Should fall back to the main afterUrl (simulationPath)
      const afterImg = screen.getByTestId('slider-after');
      expect(afterImg).toHaveAttribute('src', 'https://signed.example.com/simulations/dsd.jpg');
    });

    it('should not load URLs when modal is closed', async () => {
      const mod = await import('@/hooks/useSignedUrl');
      render(<DSDPreviewModal {...defaultProps} open={false} />);
      expect(mod.getSignedUrl).not.toHaveBeenCalled();
    });
  });
});
