import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoUploadStep } from '../wizard/PhotoUploadStep';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'pt-BR', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock imageUtils
vi.mock('@/lib/imageUtils', () => ({
  compressImage: vi.fn().mockResolvedValue('data:image/jpeg;base64,compressed'),
}));

// Mock heic-to (dynamic import)
vi.mock('heic-to', () => ({
  isHeic: vi.fn().mockResolvedValue(false),
  heicTo: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));

describe('PhotoUploadStep', () => {
  const defaultProps = {
    imageBase64: null as string | null,
    onImageChange: vi.fn(),
    onAnalyze: vi.fn(),
    isUploading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the upload zone when no image is provided', () => {
    render(<PhotoUploadStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.photoUpload.title')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.subtitle')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.dragHere')).toBeInTheDocument();
  });

  it('should render the choose from gallery button', () => {
    render(<PhotoUploadStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.photoUpload.chooseFromGallery')).toBeInTheDocument();
  });

  it('should render format badges (JPG, PNG, HEIC, 10MB)', () => {
    render(<PhotoUploadStep {...defaultProps} />);
    expect(screen.getByText('JPG')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('HEIC')).toBeInTheDocument();
    expect(screen.getByText('10MB')).toBeInTheDocument();
  });

  it('should render tips section', () => {
    render(<PhotoUploadStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.photoUpload.tipsTitle')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.tip1')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.tip2')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.tip3')).toBeInTheDocument();
  });

  it('should render image preview when image is provided', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
      />
    );
    const img = screen.getByAltText('components.wizard.photoUpload.altIntraoral');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,test123');
  });

  it('should render remove button when image is shown', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
      />
    );
    const removeBtn = screen.getByLabelText('components.wizard.photoUpload.removeIntraoral');
    expect(removeBtn).toBeInTheDocument();
  });

  it('should call onImageChange(null) when remove button is clicked', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
      />
    );
    fireEvent.click(screen.getByLabelText('components.wizard.photoUpload.removeIntraoral'));
    expect(defaultProps.onImageChange).toHaveBeenCalledWith(null);
  });

  it('should render analyze button when image is provided', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
      />
    );
    expect(screen.getByText('components.wizard.photoUpload.fullAnalysis')).toBeInTheDocument();
  });

  it('should call onAnalyze when analyze button is clicked', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
      />
    );
    fireEvent.click(screen.getByText('components.wizard.photoUpload.fullAnalysis'));
    expect(defaultProps.onAnalyze).toHaveBeenCalled();
  });

  it('should disable analyze button when isUploading is true', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
        isUploading={true}
      />
    );
    expect(screen.getByText('components.wizard.photoUpload.sending')).toBeInTheDocument();
  });

  it('should render quick case button when onQuickCase is provided', () => {
    const onQuickCase = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
        onQuickCase={onQuickCase}
      />
    );
    expect(screen.getByText('components.wizard.photoUpload.quickAnalysis')).toBeInTheDocument();
  });

  it('should call onQuickCase when quick case button is clicked', () => {
    const onQuickCase = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
        onQuickCase={onQuickCase}
      />
    );
    fireEvent.click(screen.getByText('components.wizard.photoUpload.quickAnalysis'));
    expect(onQuickCase).toHaveBeenCalled();
  });

  it('should render additional photos section when image is provided', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
        onAdditionalPhotosChange={vi.fn()}
      />
    );
    expect(screen.getByText('components.wizard.photoUpload.additionalPhotos')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.smile45Label')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.faceLabel')).toBeInTheDocument();
  });

  it('should not render additional photos section when no image is provided', () => {
    render(<PhotoUploadStep {...defaultProps} />);
    expect(screen.queryByText('components.wizard.photoUpload.additionalPhotos')).not.toBeInTheDocument();
  });

  it('should show additional photo previews when provided', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,main"
        additionalPhotos={{ smile45: 'data:image/jpeg;base64,smile', face: 'data:image/jpeg;base64,face' }}
        onAdditionalPhotosChange={vi.fn()}
      />
    );
    expect(screen.getByAltText('components.wizard.photoUpload.smile45Alt')).toBeInTheDocument();
    expect(screen.getByAltText('components.wizard.photoUpload.faceAlt')).toBeInTheDocument();
  });

  it('should handle drag enter/leave on drop zone', () => {
    render(<PhotoUploadStep {...defaultProps} />);
    const dropZone = screen.getByRole('region', { name: 'components.wizard.photoUpload.dropZoneLabel' });
    expect(dropZone).toBeInTheDocument();

    // Drag enter
    fireEvent.dragEnter(dropZone, { dataTransfer: { files: [] } });
    // Drag leave
    fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } });
  });

  it('should show cost labels for analysis buttons', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
        onQuickCase={vi.fn()}
      />
    );
    expect(screen.getByText('components.wizard.photoUpload.fullAnalysisCost')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.quickAnalysisCost')).toBeInTheDocument();
  });

  it('should render intraoral badge on image preview', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,test123"
      />
    );
    expect(screen.getByText('components.wizard.photoUpload.badgeIntraoral')).toBeInTheDocument();
  });
});
