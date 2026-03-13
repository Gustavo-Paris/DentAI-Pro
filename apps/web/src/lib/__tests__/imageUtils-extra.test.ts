import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchImageAsBase64, compressBase64ForAnalysis, compressImage } from '../imageUtils';

const originalImage = globalThis.Image;

beforeEach(() => {
  vi.useFakeTimers();
  URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.stubGlobal('Image', originalImage);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('fetchImageAsBase64', () => {
  it('should return base64 data URL on success', async () => {
    const mockBlob = new Blob(['image-data'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    }));

    // Mock FileReader
    const originalFileReader = globalThis.FileReader;
    vi.stubGlobal('FileReader', function (this: Record<string, unknown>) {
      const self = this;
      self.readAsDataURL = vi.fn(() => {
        Promise.resolve().then(() => {
          self.result = 'data:image/png;base64,abc123';
          (self.onloadend as () => void)?.();
        });
      });
    });

    const result = await fetchImageAsBase64('http://example.com/image.png');
    expect(result).toBe('data:image/png;base64,abc123');

    vi.stubGlobal('FileReader', originalFileReader);
  });

  it('should return null on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await fetchImageAsBase64('http://bad-url.com/image.png');
    expect(result).toBeNull();
  });

  it('should return null on FileReader error', async () => {
    const mockBlob = new Blob(['image-data'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(mockBlob),
    }));

    const originalFileReader = globalThis.FileReader;
    vi.stubGlobal('FileReader', function (this: Record<string, unknown>) {
      const self = this;
      self.readAsDataURL = vi.fn(() => {
        Promise.resolve().then(() => {
          (self.onerror as () => void)?.();
        });
      });
    });

    const result = await fetchImageAsBase64('http://example.com/image.png');
    expect(result).toBeNull();

    vi.stubGlobal('FileReader', originalFileReader);
  });
});

describe('compressBase64ForAnalysis', () => {
  function stubImageLoad(w: number, h: number) {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      const self = this;
      self.naturalWidth = w;
      self.naturalHeight = h;
      Object.defineProperty(self, 'src', {
        set(_v: string) {
          Promise.resolve().then(() => (self.onload as () => void)?.());
        },
      });
    });
  }

  it('should compress and return JPEG data URL for small image', async () => {
    stubImageLoad(640, 480);

    const originalCreateElement = document.createElement.bind(document);
    const mockCtx = { drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,compressed'),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return originalCreateElement(tag);
    });

    const result = await compressBase64ForAnalysis('data:image/png;base64,original');
    expect(result).toBe('data:image/jpeg;base64,compressed');
    expect(mockCanvas.width).toBe(640);
    expect(mockCanvas.height).toBe(480);
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.80);
  });

  it('should resize wide images to max 1280px width', async () => {
    stubImageLoad(2560, 1440);

    const originalCreateElement = document.createElement.bind(document);
    const mockCtx = { drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,resized'),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return originalCreateElement(tag);
    });

    const result = await compressBase64ForAnalysis('data:image/png;base64,big');
    expect(result).toBe('data:image/jpeg;base64,resized');
    expect(mockCanvas.width).toBe(1280);
    expect(mockCanvas.height).toBe(720);
  });

  it('should resize tall images to max 1280px height', async () => {
    stubImageLoad(960, 1920);

    const originalCreateElement = document.createElement.bind(document);
    const mockCtx = { drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,tall'),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return originalCreateElement(tag);
    });

    const result = await compressBase64ForAnalysis('data:image/png;base64,tall');
    expect(result).toBe('data:image/jpeg;base64,tall');
    expect(mockCanvas.width).toBe(640);
    expect(mockCanvas.height).toBe(1280);
  });

  it('should reject on timeout', async () => {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      Object.defineProperty(this, 'src', { set() {} });
    });

    const promise = compressBase64ForAnalysis('data:image/png;base64,slow');
    vi.advanceTimersByTime(10001);
    await expect(promise).rejects.toThrow('Timeout compressing for analysis');
  });

  it('should reject on image load error', async () => {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      const self = this;
      Object.defineProperty(self, 'src', {
        set(_v: string) {
          Promise.resolve().then(() => (self.onerror as () => void)?.());
        },
      });
    });

    await expect(compressBase64ForAnalysis('data:image/png;base64,broken'))
      .rejects.toThrow('Failed to load image for analysis compression');
  });

  it('should reject when canvas context is null', async () => {
    stubImageLoad(640, 480);

    const originalCreateElement = document.createElement.bind(document);
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(null),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return originalCreateElement(tag);
    });

    await expect(compressBase64ForAnalysis('data:image/png;base64,noctx'))
      .rejects.toThrow('No canvas context');
  });
});

describe('compressImage - additional edge cases', () => {
  it('should reject when canvas context is null', async () => {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      const self = this;
      self.width = 640;
      self.height = 480;
      let storedSrc: string | undefined;
      Object.defineProperty(self, 'src', {
        get() { return storedSrc; },
        set(v: string) {
          storedSrc = v;
          Promise.resolve().then(() => (self.onload as () => void)?.());
        },
      });
    });

    const originalCreateElement = document.createElement.bind(document);
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(null),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return originalCreateElement(tag);
    });

    const blob = new Blob(['data'], { type: 'image/jpeg' });
    await expect(compressImage(blob)).rejects.toThrow('Could not get canvas context');
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('should use default maxWidth and quality', async () => {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      const self = this;
      self.width = 640;
      self.height = 480;
      let storedSrc: string | undefined;
      Object.defineProperty(self, 'src', {
        get() { return storedSrc; },
        set(v: string) {
          storedSrc = v;
          Promise.resolve().then(() => (self.onload as () => void)?.());
        },
      });
    });

    const originalCreateElement = document.createElement.bind(document);
    const mockCtx = { drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,default'),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return originalCreateElement(tag);
    });

    const blob = new Blob(['data'], { type: 'image/jpeg' });
    // Call without maxWidth and quality to test defaults
    const result = await compressImage(blob);
    expect(result).toBe('data:image/jpeg;base64,default');
    // Default quality is 0.88
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.88);
  });
});
