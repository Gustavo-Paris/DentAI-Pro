import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhotoUploader from '../PhotoUploader';

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

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock imageUtils
vi.mock('@/lib/imageUtils', () => ({
  compressImage: vi.fn().mockResolvedValue('data:image/jpeg;base64,Y29tcHJlc3NlZA=='),
}));

// Mock lucide-react
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  return {
    ...actual,
    Camera: ({ className }: any) => <span data-testid="camera-icon" className={className} />,
    X: ({ className }: any) => <span data-testid="x-icon" className={className} />,
    Loader2: ({ className }: any) => <span data-testid="loader-icon" className={className} />,
    Upload: ({ className }: any) => <span data-testid="upload-icon" className={className} />,
  };
});

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createImageFile(name = 'photo.jpg', type = 'image/jpeg', sizeKB = 100): File {
  const content = new Array(sizeKB * 1024).fill('a').join('');
  return new File([content], name, { type });
}

function createLargeFile(name = 'huge.jpg', type = 'image/jpeg', sizeMB = 6): File {
  const content = new Array(sizeMB * 1024 * 1024).fill('a').join('');
  return new File([content], name, { type });
}

function createNonImageFile(): File {
  return new File(['not an image'], 'document.pdf', { type: 'application/pdf' });
}

/**
 * Mock the global FileReader so the component's reader.onload fires synchronously
 * when readAsDataURL is called.
 */
function mockFileReaderGlobal() {
  const originalFileReader = globalThis.FileReader;
  const MockFR = vi.fn().mockImplementation(() => {
    const instance: any = {
      readAsDataURL: vi.fn().mockImplementation(() => {
        // Fire onload on next microtask
        Promise.resolve().then(() => {
          if (instance.onload) {
            instance.onload({ target: { result: 'data:image/jpeg;base64,dGVzdA==' } });
          }
        });
      }),
      onload: null,
      onerror: null,
      result: null,
    };
    return instance;
  });
  globalThis.FileReader = MockFR as any;
  return () => { globalThis.FileReader = originalFileReader; };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PhotoUploader', () => {
  const makeProps = (overrides: Record<string, any> = {}) => ({
    label: 'Foto Frontal',
    description: 'Faça upload de uma foto frontal',
    photoType: 'frontal' as const,
    value: null as string | null,
    onChange: vi.fn(),
    onUpload: vi.fn().mockResolvedValue(undefined),
    onRemove: vi.fn().mockResolvedValue(undefined),
    getSignedUrl: vi.fn().mockResolvedValue('https://example.com/signed-url'),
    userId: 'user-123',
    evaluationId: 'eval-456',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('should render the label', () => {
      render(<PhotoUploader {...makeProps()} />);
      expect(screen.getByText('Foto Frontal')).toBeInTheDocument();
    });

    it('should render the description', () => {
      render(<PhotoUploader {...makeProps()} />);
      expect(screen.getByText('Faça upload de uma foto frontal')).toBeInTheDocument();
    });

    it('should render upload area when no image is provided', () => {
      render(<PhotoUploader {...makeProps()} />);
      expect(
        screen.getByLabelText('components.photoUploader.addPhoto:{"label":"Foto Frontal"}')
      ).toBeInTheDocument();
    });

    it('should render camera icon in upload area', () => {
      render(<PhotoUploader {...makeProps()} />);
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    });

    it('should render upload button when no image', () => {
      render(<PhotoUploader {...makeProps()} />);
      expect(screen.getByText('components.photoUploader.uploadButton')).toBeInTheDocument();
    });

    it('should render as a Card component', () => {
      render(<PhotoUploader {...makeProps()} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  // ---- Preview with image ----

  describe('preview with image', () => {
    it('should show image preview when value is provided and signed URL loads', async () => {
      render(<PhotoUploader {...makeProps({ value: 'path/to/image.jpg' })} />);

      await waitFor(() => {
        const img = screen.getByAltText('Foto Frontal');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/signed-url');
      });
    });

    it('should show remove button when preview is visible', async () => {
      render(<PhotoUploader {...makeProps({ value: 'path/to/image.jpg' })} />);

      await waitFor(() => {
        expect(
          screen.getByLabelText('components.photoUploader.removePhoto')
        ).toBeInTheDocument();
      });
    });

    it('should not show upload button when preview is visible', async () => {
      render(<PhotoUploader {...makeProps({ value: 'path/to/image.jpg' })} />);

      await waitFor(() => {
        expect(screen.getByAltText('Foto Frontal')).toBeInTheDocument();
      });

      expect(screen.queryByText('components.photoUploader.uploadButton')).not.toBeInTheDocument();
    });
  });

  // ---- File type validation ----

  describe('file type validation', () => {
    it('should reject non-image files with error toast', async () => {
      const { toast } = await import('sonner');
      render(<PhotoUploader {...makeProps()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const nonImageFile = createNonImageFile();

      fireEvent.change(input, { target: { files: [nonImageFile] } });

      expect(toast.error).toHaveBeenCalledWith('components.photoUploader.onlyImages');
    });

    it('should accept image files and call FileReader.readAsDataURL', () => {
      const restore = mockFileReaderGlobal();
      render(<PhotoUploader {...makeProps()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = createImageFile();

      fireEvent.change(input, { target: { files: [imageFile] } });

      // FileReader constructor should have been called
      expect(globalThis.FileReader).toHaveBeenCalled();

      restore();
    });
  });

  // ---- File size validation ----

  describe('file size validation', () => {
    it('should reject files over 5MB with error toast', async () => {
      const { toast } = await import('sonner');
      render(<PhotoUploader {...makeProps()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = createLargeFile();

      fireEvent.change(input, { target: { files: [largeFile] } });

      expect(toast.error).toHaveBeenCalledWith('components.photoUploader.maxSize');
    });
  });

  // ---- Upload flow ----

  describe('upload flow', () => {
    it('should call onUpload and onChange with file name on success', async () => {
      const restore = mockFileReaderGlobal();
      const props = makeProps();
      render(<PhotoUploader {...props} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = createImageFile('test.jpg', 'image/jpeg', 50);

      fireEvent.change(input, { target: { files: [imageFile] } });

      await waitFor(() => {
        expect(props.onUpload).toHaveBeenCalled();
      });

      // fileName should include userId and photoType
      const callArg = props.onUpload.mock.calls[0][0] as string;
      expect(callArg).toContain('user-123');
      expect(callArg).toContain('frontal');
      expect(props.onChange).toHaveBeenCalled();

      restore();
    });

    it('should show error toast when upload fails', async () => {
      const { toast } = await import('sonner');
      const restore = mockFileReaderGlobal();
      const failingUpload = vi.fn().mockRejectedValue(new Error('Upload failed'));
      render(<PhotoUploader {...makeProps({ onUpload: failingUpload })} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = createImageFile('test.jpg', 'image/jpeg', 50);

      fireEvent.change(input, { target: { files: [imageFile] } });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('components.photoUploader.uploadError');
      });

      restore();
    });

    it('should show success toast when upload succeeds', async () => {
      const { toast } = await import('sonner');
      const restore = mockFileReaderGlobal();
      render(<PhotoUploader {...makeProps()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = createImageFile('test.jpg', 'image/jpeg', 50);

      fireEvent.change(input, { target: { files: [imageFile] } });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('components.photoUploader.uploadSuccess');
      });

      restore();
    });
  });

  // ---- Remove ----

  describe('remove', () => {
    it('should call onRemove and onChange(null) when remove button is clicked', async () => {
      const props = makeProps({ value: 'path/to/image.jpg' });
      render(<PhotoUploader {...props} />);

      await waitFor(() => {
        expect(screen.getByLabelText('components.photoUploader.removePhoto')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText('components.photoUploader.removePhoto'));

      await waitFor(() => {
        expect(props.onRemove).toHaveBeenCalledWith('path/to/image.jpg');
        expect(props.onChange).toHaveBeenCalledWith(null);
      });
    });

    it('should not show remove button when no image is provided', () => {
      render(<PhotoUploader {...makeProps()} />);
      expect(screen.queryByLabelText('components.photoUploader.removePhoto')).not.toBeInTheDocument();
    });
  });

  // ---- Hidden file input ----

  describe('hidden file input', () => {
    it('should have a hidden file input that accepts images', () => {
      render(<PhotoUploader {...makeProps()} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('accept', 'image/*');
      expect(input).toHaveClass('hidden');
    });

    it('should do nothing when no file is selected', () => {
      const props = makeProps();
      render(<PhotoUploader {...props} />);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [] } });
      expect(props.onUpload).not.toHaveBeenCalled();
    });
  });

  // ---- Edge cases ----

  describe('edge cases', () => {
    it('should use evaluationId in file name when provided', async () => {
      const restore = mockFileReaderGlobal();
      const props = makeProps({ evaluationId: 'eval-789' });
      render(<PhotoUploader {...props} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = createImageFile();

      fireEvent.change(input, { target: { files: [imageFile] } });

      await waitFor(() => {
        expect(props.onUpload).toHaveBeenCalled();
      });

      const callArg = props.onUpload.mock.calls[0][0] as string;
      expect(callArg).toContain('eval-789');

      restore();
    });

    it('should use "temp" in file name when evaluationId is not provided', async () => {
      const restore = mockFileReaderGlobal();
      const props = makeProps({ evaluationId: undefined });
      render(<PhotoUploader {...props} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = createImageFile();

      fireEvent.change(input, { target: { files: [imageFile] } });

      await waitFor(() => {
        expect(props.onUpload).toHaveBeenCalled();
      });

      const callArg = props.onUpload.mock.calls[0][0] as string;
      expect(callArg).toContain('temp');

      restore();
    });

    it('should call getSignedUrl prop when value is initially set', () => {
      const props = makeProps({ value: 'existing/path.jpg' });
      render(<PhotoUploader {...props} />);
      expect(props.getSignedUrl).toHaveBeenCalledWith('existing/path.jpg');
    });
  });
});
