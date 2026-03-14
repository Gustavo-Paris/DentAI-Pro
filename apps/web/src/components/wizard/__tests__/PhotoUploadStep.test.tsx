import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoUploadStep } from '../PhotoUploadStep';

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Card: ({ children, ...p }: any) => <div data-testid="card" {...p}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick, disabled, ...p }: any) => (
    <button onClick={onClick} disabled={disabled} {...p}>{children}</button>
  ),
  Badge: ({ children }: any) => <span>{children}</span>,
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <span>{children}</span>,
  Label: ({ children }: any) => <label>{children}</label>,
  Textarea: ({ value, onChange, ...p }: any) => (
    <textarea value={value} onChange={onChange} {...p} />
  ),
  FileDropzone: ({ children, onDrop, onDropRejected, accept, maxSize, className }: any) => {
    const handleDrop = (e: any) => {
      e.preventDefault();
      const files: File[] = Array.from(e.dataTransfer?.files ?? []);
      if (files.length === 0) return;
      const accepted: File[] = [];
      const rejected: { file: File; errors: { code: string }[] }[] = [];
      for (const file of files) {
        const errors: { code: string }[] = [];
        if (maxSize != null && file.size > maxSize) errors.push({ code: 'file-too-large' });
        if (accept != null) {
          const acceptedMimes = Object.keys(accept);
          const matchesMime = acceptedMimes.some((mime) => {
            if (mime.endsWith('/*')) return file.type.startsWith(mime.replace('/*', '/'));
            return file.type === mime;
          });
          if (!matchesMime) errors.push({ code: 'file-invalid-type' });
        }
        if (errors.length > 0) rejected.push({ file, errors });
        else accepted.push(file);
      }
      if (accepted.length > 0 && onDrop) onDrop(accepted);
      if (rejected.length > 0 && onDropRejected) onDropRejected(rejected);
    };
    return (
      <div
        data-testid="file-dropzone"
        className={className}
        onDragEnter={() => {}}
        onDragLeave={() => {}}
        onDrop={handleDrop}
        onClick={() => onDrop?.([new File([''], 'test.jpg', { type: 'image/jpeg' })])}
      >
        {typeof children === 'function' ? children({ isDragActive: false }) : children}
      </div>
    );
  },
}));

vi.mock('lucide-react', () => {
  const S = (p: any) => <span data-testid="icon" {...p} />;
  return {
    Camera: S, Upload: S, X: S, Loader2: S, User: S, Smile: S,
    Sparkles: S, Lightbulb: S, Zap: S, AlertCircle: S, CheckCircle2: S,
    AlertTriangle: S, ShieldAlert: S, FileImage: S, Mic: S, MicOff: S,
  };
});

vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

vi.mock('@/lib/imageUtils', () => ({
  compressImage: vi.fn().mockResolvedValue('data:image/jpeg;base64,compressed'),
  getImageDimensions: vi.fn().mockResolvedValue({ width: 1024, height: 768 }),
  compressBase64ForAnalysis: vi.fn().mockResolvedValue('data:image/jpeg;base64,small'),
}));

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

vi.mock('@/data', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { score: 80 }, error: null }),
    },
  },
}));

vi.mock('@/hooks/useSpeechToText', () => ({
  useSpeechToText: () => ({
    isListening: false,
    isSupported: false,
    transcript: '',
    toggle: vi.fn(),
  }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('heic-to', () => ({
  isHeic: vi.fn().mockResolvedValue(false),
  heicTo: vi.fn().mockResolvedValue(new Blob(['jpeg'], { type: 'image/jpeg' })),
}));

const defaultProps = {
  imageBase64: null as string | null,
  onImageChange: vi.fn(),
  onAnalyze: vi.fn(),
  isUploading: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PhotoUploadStep', () => {
  it('renders drop zone when no image', () => {
    render(<PhotoUploadStep {...defaultProps} />);
    expect(screen.getByText('components.wizard.photoUpload.title')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.dragHere')).toBeInTheDocument();
  });

  it('renders image preview when imageBase64 is set', () => {
    render(<PhotoUploadStep {...defaultProps} imageBase64="data:image/jpeg;base64,abc" />);
    expect(screen.getByAltText('components.wizard.photoUpload.altIntraoral')).toBeInTheDocument();
  });

  it('calls handleRemove when remove button clicked', () => {
    const onImageChange = vi.fn();
    render(<PhotoUploadStep {...defaultProps} imageBase64="data:image/jpeg;base64,abc" onImageChange={onImageChange} />);
    const removeBtn = screen.getByLabelText('components.wizard.photoUpload.removeIntraoral');
    fireEvent.click(removeBtn);
    expect(onImageChange).toHaveBeenCalledWith(null);
  });

  it('calls onAnalyze when analyze button clicked', () => {
    const onAnalyze = vi.fn();
    render(<PhotoUploadStep {...defaultProps} imageBase64="data:image/jpeg;base64,abc" onAnalyze={onAnalyze} />);
    fireEvent.click(screen.getByText('components.wizard.photoUpload.fullAnalysis'));
    expect(onAnalyze).toHaveBeenCalled();
  });

  it('renders quick case button when onQuickCase provided', () => {
    const onQuickCase = vi.fn();
    render(
      <PhotoUploadStep {...defaultProps} imageBase64="data:image/jpeg;base64,abc" onQuickCase={onQuickCase} />,
    );
    fireEvent.click(screen.getByText('components.wizard.photoUpload.quickAnalysis'));
    expect(onQuickCase).toHaveBeenCalled();
  });

  it('handles drag events on drop zone', () => {
    render(<PhotoUploadStep {...defaultProps} />);
    const dropZone = screen.getByRole('region');
    fireEvent.dragEnter(dropZone);
    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);
  });

  it('handles file drop', async () => {
    const onImageChange = vi.fn();
    render(<PhotoUploadStep {...defaultProps} onImageChange={onImageChange} />);
    const dropZone = screen.getByRole('region');
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    await waitFor(() => {
      expect(onImageChange).toHaveBeenCalled();
    });
  });

  it('rejects non-image file', async () => {
    const { toast } = await import('sonner');
    render(<PhotoUploadStep {...defaultProps} />);
    const dropZone = screen.getByRole('region');
    const file = new File(['text'], 'test.txt', { type: 'text/plain' });
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('rejects file over 10MB', async () => {
    const { toast } = await import('sonner');
    render(<PhotoUploadStep {...defaultProps} />);
    const dropZone = screen.getByRole('region');
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    fireEvent.drop(dropZone, { dataTransfer: { files: [largeFile] } });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('handles file input change', async () => {
    const onImageChange = vi.fn();
    render(<PhotoUploadStep {...defaultProps} onImageChange={onImageChange} />);
    const input = screen.getByLabelText('components.wizard.photoUpload.chooseFromGallery');
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(onImageChange).toHaveBeenCalled();
    });
  });

  it('shows uploading state', () => {
    render(<PhotoUploadStep {...defaultProps} imageBase64="data:image/jpeg;base64,abc" isUploading={true} />);
    expect(screen.getByText('components.wizard.photoUpload.sending')).toBeInTheDocument();
  });

  it('renders additional photo slots when image is set', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        onAdditionalPhotosChange={vi.fn()}
      />,
    );
    expect(screen.getByText('components.wizard.photoUpload.additionalPhotos')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.smile45Label')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.faceLabel')).toBeInTheDocument();
    expect(screen.getByText('components.wizard.photoUpload.radiographLabel')).toBeInTheDocument();
  });

  it('renders remove buttons for additional photos', () => {
    const onAdditionalPhotosChange = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        additionalPhotos={{ smile45: 'data:image/jpeg;base64,45', face: null, radiograph: null }}
        onAdditionalPhotosChange={onAdditionalPhotosChange}
      />,
    );
    const removeBtn = screen.getByLabelText('components.wizard.photoUpload.remove45');
    fireEvent.click(removeBtn);
    expect(onAdditionalPhotosChange).toHaveBeenCalledWith({
      smile45: null,
      face: null,
      radiograph: null,
    });
  });

  it('renders remove button for face photo', () => {
    const onAdditionalPhotosChange = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        additionalPhotos={{ smile45: null, face: 'data:image/jpeg;base64,face', radiograph: null }}
        onAdditionalPhotosChange={onAdditionalPhotosChange}
      />,
    );
    const removeBtn = screen.getByLabelText('components.wizard.photoUpload.removeFace');
    fireEvent.click(removeBtn);
    expect(onAdditionalPhotosChange).toHaveBeenCalledWith({
      smile45: null,
      face: null,
      radiograph: null,
    });
  });

  it('renders remove button for radiograph', () => {
    const onAdditionalPhotosChange = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        additionalPhotos={{ smile45: null, face: null, radiograph: 'data:image/jpeg;base64,rad' }}
        onAdditionalPhotosChange={onAdditionalPhotosChange}
      />,
    );
    const removeBtn = screen.getByLabelText('components.wizard.photoUpload.removeRadiograph');
    fireEvent.click(removeBtn);
    expect(onAdditionalPhotosChange).toHaveBeenCalledWith({
      smile45: null,
      face: null,
      radiograph: null,
    });
  });

  it('handles anamnesis text change', () => {
    const onAnamnesisChange = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        anamnesis=""
        onAnamnesisChange={onAnamnesisChange}
      />,
    );
    const textarea = screen.getByPlaceholderText('components.wizard.photo.anamnesisPlaceholder');
    fireEvent.change(textarea, { target: { value: 'Patient notes' } });
    expect(onAnamnesisChange).toHaveBeenCalledWith('Patient notes');
  });

  it('handles drag events on optional photo cards', () => {
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        onAdditionalPhotosChange={vi.fn()}
      />,
    );
    const cards = screen.getAllByTestId('card');
    if (cards.length > 0) {
      const card = cards[0];
      fireEvent.dragEnter(card);
      fireEvent.dragLeave(card);
      fireEvent.dragOver(card);
    }
  });

  it('handles optional smile45 file input change', async () => {
    const onAdditionalPhotosChange = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        onAdditionalPhotosChange={onAdditionalPhotosChange}
      />,
    );
    const input = screen.getByLabelText('components.wizard.photoUpload.smile45Label');
    const file = new File(['img'], 'smile45.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(onAdditionalPhotosChange).toHaveBeenCalled();
    });
  });

  it('handles optional face file input change', async () => {
    const onAdditionalPhotosChange = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        onAdditionalPhotosChange={onAdditionalPhotosChange}
      />,
    );
    const input = screen.getByLabelText('components.wizard.photoUpload.faceLabel');
    const file = new File(['img'], 'face.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(onAdditionalPhotosChange).toHaveBeenCalled();
    });
  });

  it('handles optional radiograph file input change', async () => {
    const onAdditionalPhotosChange = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        onAdditionalPhotosChange={onAdditionalPhotosChange}
      />,
    );
    const input = screen.getByLabelText('components.wizard.photoUpload.radiographLabel');
    const file = new File(['img'], 'rad.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(onAdditionalPhotosChange).toHaveBeenCalled();
    });
  });

  it('rejects non-image optional file', async () => {
    const { toast } = await import('sonner');
    const onAdditionalPhotosChange = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        onAdditionalPhotosChange={onAdditionalPhotosChange}
      />,
    );
    const input = screen.getByLabelText('components.wizard.photoUpload.smile45Label');
    const file = new File(['text'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('rejects optional file over 10MB', async () => {
    const { toast } = await import('sonner');
    const onAdditionalPhotosChange = vi.fn();
    render(
      <PhotoUploadStep
        {...defaultProps}
        imageBase64="data:image/jpeg;base64,abc"
        onAdditionalPhotosChange={onAdditionalPhotosChange}
      />,
    );
    const input = screen.getByLabelText('components.wizard.photoUpload.smile45Label');
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [largeFile] } });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('warns about small image dimensions', async () => {
    const { getImageDimensions } = await import('@/lib/imageUtils');
    const { toast } = await import('sonner');
    (getImageDimensions as any).mockResolvedValueOnce({ width: 320, height: 240 });

    const onImageChange = vi.fn();
    render(<PhotoUploadStep {...defaultProps} onImageChange={onImageChange} />);
    const dropZone = screen.getByRole('region');
    const file = new File(['image'], 'small.jpg', { type: 'image/jpeg' });
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalled();
    });
  });

  it('handles HEIC file conversion', async () => {
    const { isHeic } = await import('heic-to');
    (isHeic as any).mockResolvedValueOnce(true);

    const onImageChange = vi.fn();
    render(<PhotoUploadStep {...defaultProps} onImageChange={onImageChange} />);
    const dropZone = screen.getByRole('region');
    const file = new File(['heic-data'], 'photo.heic', { type: 'image/heic' });
    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
    await waitFor(() => {
      expect(onImageChange).toHaveBeenCalled();
    });
  });

});
