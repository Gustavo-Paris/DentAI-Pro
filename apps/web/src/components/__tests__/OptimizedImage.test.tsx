import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OptimizedImage, ClinicalPhotoThumbnail, DSDSimulationThumbnail } from '../OptimizedImage';

// Mock useSignedUrl hook
const mockUseSignedUrl = vi.fn();
vi.mock('@/hooks/useSignedUrl', () => ({
  useSignedUrl: (...args: any[]) => mockUseSignedUrl(...args),
  THUMBNAIL_PRESETS: {
    list: { width: 120, height: 120, quality: 60, resize: 'cover' },
    grid: { width: 200, height: 200, quality: 70, resize: 'cover' },
    small: { width: 64, height: 64, quality: 50, resize: 'cover' },
    medium: { width: 400, height: 400, quality: 75, resize: 'contain' },
  },
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ImageOff: ({ className }: { className?: string }) => (
    <span data-testid="image-off-icon" className={className} />
  ),
}));

// Mock Skeleton
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSignedUrl.mockReturnValue({
      url: 'https://example.com/signed-url.jpg',
      isLoading: false,
      error: null,
    });
  });

  describe('successful rendering', () => {
    it('should render img element with signed URL', () => {
      render(
        <OptimizedImage bucket="photos" path="test.jpg" alt="Test image" />,
      );

      const img = screen.getByAltText('Test image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/signed-url.jpg');
    });

    it('should apply loading="lazy" attribute', () => {
      render(
        <OptimizedImage bucket="photos" path="test.jpg" alt="Test image" />,
      );

      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should apply className to img element', () => {
      render(
        <OptimizedImage
          bucket="photos"
          path="test.jpg"
          alt="Test image"
          className="w-full rounded-lg"
        />,
      );

      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('class', 'w-full rounded-lg');
    });

    it('should pass additional imgProps to img element', () => {
      render(
        <OptimizedImage
          bucket="photos"
          path="test.jpg"
          alt="Test image"
          imgProps={{ draggable: false, id: 'my-img' }}
        />,
      );

      const img = screen.getByAltText('Test image');
      expect(img).toHaveAttribute('id', 'my-img');
    });

    it('should call useSignedUrl with correct bucket and path', () => {
      render(
        <OptimizedImage bucket="clinical-photos" path="patient-1/photo.jpg" alt="Photo" />,
      );

      expect(mockUseSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          bucket: 'clinical-photos',
          path: 'patient-1/photo.jpg',
        }),
      );
    });

    it('should use grid preset by default', () => {
      render(
        <OptimizedImage bucket="photos" path="test.jpg" alt="Test" />,
      );

      expect(mockUseSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnail: { width: 200, height: 200, quality: 70, resize: 'cover' },
        }),
      );
    });

    it('should use specified preset', () => {
      render(
        <OptimizedImage bucket="photos" path="test.jpg" alt="Test" preset="small" />,
      );

      expect(mockUseSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnail: { width: 64, height: 64, quality: 50, resize: 'cover' },
        }),
      );
    });

    it('should use custom thumbnail options when provided', () => {
      const customThumbnail = { width: 300, height: 150, quality: 90, resize: 'contain' as const };

      render(
        <OptimizedImage
          bucket="photos"
          path="test.jpg"
          alt="Test"
          thumbnail={customThumbnail}
        />,
      );

      expect(mockUseSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnail: customThumbnail,
        }),
      );
    });
  });

  describe('loading state', () => {
    it('should show skeleton while loading', () => {
      mockUseSignedUrl.mockReturnValue({
        url: null,
        isLoading: true,
        error: null,
      });

      render(
        <OptimizedImage bucket="photos" path="test.jpg" alt="Test" />,
      );

      expect(screen.getByTestId('skeleton')).toBeInTheDocument();
      expect(screen.queryByAltText('Test')).not.toBeInTheDocument();
    });

    it('should apply className to skeleton during loading', () => {
      mockUseSignedUrl.mockReturnValue({
        url: null,
        isLoading: true,
        error: null,
      });

      render(
        <OptimizedImage
          bucket="photos"
          path="test.jpg"
          alt="Test"
          className="w-20 h-20"
        />,
      );

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton.className).toContain('w-20 h-20');
    });
  });

  describe('error state', () => {
    it('should show default error state with ImageOff icon when URL fetch fails', () => {
      mockUseSignedUrl.mockReturnValue({
        url: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(
        <OptimizedImage bucket="photos" path="test.jpg" alt="Test" />,
      );

      expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
      expect(screen.queryByAltText('Test')).not.toBeInTheDocument();
    });

    it('should show default error state when URL is null', () => {
      mockUseSignedUrl.mockReturnValue({
        url: null,
        isLoading: false,
        error: null,
      });

      render(
        <OptimizedImage bucket="photos" path="test.jpg" alt="Test" />,
      );

      expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
    });

    it('should show custom fallback when provided and error occurs', () => {
      mockUseSignedUrl.mockReturnValue({
        url: null,
        isLoading: false,
        error: new Error('Failed'),
      });

      render(
        <OptimizedImage
          bucket="photos"
          path="test.jpg"
          alt="Test"
          fallback={<div data-testid="custom-fallback">No image</div>}
        />,
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByTestId('image-off-icon')).not.toBeInTheDocument();
    });

    it('should show error state when image onError fires', () => {
      render(
        <OptimizedImage bucket="photos" path="test.jpg" alt="Test" />,
      );

      const img = screen.getByAltText('Test');
      fireEvent.error(img);

      // After error, the component should re-render with error state
      expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
      expect(screen.queryByAltText('Test')).not.toBeInTheDocument();
    });

    it('should apply className to error container', () => {
      mockUseSignedUrl.mockReturnValue({
        url: null,
        isLoading: false,
        error: new Error('Broken'),
      });

      const { container } = render(
        <OptimizedImage
          bucket="photos"
          path="test.jpg"
          alt="Test"
          className="w-32 h-32"
        />,
      );

      const errorDiv = container.firstChild as HTMLElement;
      expect(errorDiv.className).toContain('w-32 h-32');
    });
  });

  describe('null/undefined path', () => {
    it('should show error state when path is null', () => {
      mockUseSignedUrl.mockReturnValue({
        url: null,
        isLoading: false,
        error: null,
      });

      render(
        <OptimizedImage bucket="photos" path={null} alt="Test" />,
      );

      expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
    });

    it('should show error state when path is undefined', () => {
      mockUseSignedUrl.mockReturnValue({
        url: null,
        isLoading: false,
        error: null,
      });

      render(
        <OptimizedImage bucket="photos" path={undefined} alt="Test" />,
      );

      expect(screen.getByTestId('image-off-icon')).toBeInTheDocument();
    });
  });
});

describe('ClinicalPhotoThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSignedUrl.mockReturnValue({
      url: 'https://example.com/clinical-photo.jpg',
      isLoading: false,
      error: null,
    });
  });

  it('should render with clinical-photos bucket', () => {
    render(<ClinicalPhotoThumbnail path="photo.jpg" alt="Clinical photo" />);

    expect(mockUseSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: 'clinical-photos' }),
    );
  });

  it('should use list preset by default', () => {
    render(<ClinicalPhotoThumbnail path="photo.jpg" alt="Clinical photo" />);

    expect(mockUseSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        thumbnail: { width: 120, height: 120, quality: 60, resize: 'cover' },
      }),
    );
  });

  it('should accept size prop to change preset', () => {
    render(<ClinicalPhotoThumbnail path="photo.jpg" alt="Clinical photo" size="grid" />);

    expect(mockUseSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        thumbnail: { width: 200, height: 200, quality: 70, resize: 'cover' },
      }),
    );
  });

  it('should apply rounded-lg and object-cover classes', () => {
    render(<ClinicalPhotoThumbnail path="photo.jpg" alt="Clinical photo" />);

    const img = screen.getByAltText('Clinical photo');
    expect(img.className).toContain('rounded-lg');
    expect(img.className).toContain('object-cover');
  });

  it('should merge custom className', () => {
    render(
      <ClinicalPhotoThumbnail
        path="photo.jpg"
        alt="Clinical photo"
        className="w-16 h-16"
      />,
    );

    const img = screen.getByAltText('Clinical photo');
    expect(img.className).toContain('w-16 h-16');
  });
});

describe('DSDSimulationThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSignedUrl.mockReturnValue({
      url: 'https://example.com/dsd-sim.jpg',
      isLoading: false,
      error: null,
    });
  });

  it('should render with dsd-simulations bucket', () => {
    render(<DSDSimulationThumbnail path="sim.jpg" alt="DSD simulation" />);

    expect(mockUseSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: 'dsd-simulations' }),
    );
  });

  it('should use grid preset by default', () => {
    render(<DSDSimulationThumbnail path="sim.jpg" alt="DSD simulation" />);

    expect(mockUseSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        thumbnail: { width: 200, height: 200, quality: 70, resize: 'cover' },
      }),
    );
  });

  it('should accept medium size preset', () => {
    render(<DSDSimulationThumbnail path="sim.jpg" alt="DSD simulation" size="medium" />);

    expect(mockUseSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        thumbnail: { width: 400, height: 400, quality: 75, resize: 'contain' },
      }),
    );
  });

  it('should apply rounded-lg and object-cover classes', () => {
    render(<DSDSimulationThumbnail path="sim.jpg" alt="DSD simulation" />);

    const img = screen.getByAltText('DSD simulation');
    expect(img.className).toContain('rounded-lg');
    expect(img.className).toContain('object-cover');
  });
});
