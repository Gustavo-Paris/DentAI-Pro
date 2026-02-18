import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getImageDimensions, compressImage } from '../imageUtils';

// ---------------------------------------------------------------------------
// We stub globalThis.Image to control behavior and avoid jsdom side effects.
// Each test creates fresh mock Images to avoid cross-test contamination.
// ---------------------------------------------------------------------------

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

describe('getImageDimensions', () => {
  it('should resolve with dimensions when image loads successfully', async () => {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      const self = this;
      self.naturalWidth = 800;
      self.naturalHeight = 600;
      Object.defineProperty(self, 'src', {
        set(_v: string) {
          // Fire onload synchronously-ish via microtask to avoid timer leaks
          Promise.resolve().then(() => (self.onload as () => void)?.());
        },
      });
    });

    const result = await getImageDimensions('data:image/png;base64,valid');
    expect(result).toEqual({ width: 800, height: 600 });
  });

  it('should reject when image fails to load', async () => {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      const self = this;
      Object.defineProperty(self, 'src', {
        set(_v: string) {
          Promise.resolve().then(() => (self.onerror as () => void)?.());
        },
      });
    });

    await expect(getImageDimensions('data:image/png;base64,broken'))
      .rejects.toThrow('Failed to load image for dimension check');
  });

  it('should reject with timeout error after 5 seconds when image never loads', async () => {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      // Intentionally don't trigger any callback -> timeout
      Object.defineProperty(this, 'src', { set() {} });
    });

    const promise = getImageDimensions('data:image/png;base64,slow');
    // Advance past the 5s timeout
    vi.advanceTimersByTime(5001);
    await expect(promise).rejects.toThrow('Timeout getting image dimensions');
  });
});

describe('compressImage', () => {
  function stubImageWithLoad(opts: { width: number; height: number }) {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      const self = this;
      self.width = opts.width;
      self.height = opts.height;
      let storedSrc: string | undefined;
      Object.defineProperty(self, 'src', {
        get() { return storedSrc; },
        set(v: string) {
          storedSrc = v;
          Promise.resolve().then(() => (self.onload as () => void)?.());
        },
      });
    });
  }

  it('should resolve with compressed base64 when image loads successfully', async () => {
    stubImageWithLoad({ width: 640, height: 480 });

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

    const blob = new Blob(['data'], { type: 'image/jpeg' });
    const result = await compressImage(blob, 1280, 0.88);

    expect(result).toBe('data:image/jpeg;base64,compressed');
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.88);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should resize image maintaining aspect ratio when width exceeds maxWidth', async () => {
    stubImageWithLoad({ width: 2560, height: 1920 });

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

    const blob = new Blob(['data'], { type: 'image/jpeg' });
    await compressImage(blob, 1280);

    // Should resize from 2560x1920 to 1280x960
    expect(mockCanvas.width).toBe(1280);
    expect(mockCanvas.height).toBe(960);
  });

  it('should reject when image fails to load', async () => {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      const self = this;
      Object.defineProperty(self, 'src', {
        set(_v: string) {
          Promise.resolve().then(() => (self.onerror as () => void)?.());
        },
      });
    });

    const blob = new Blob(['data'], { type: 'image/jpeg' });
    await expect(compressImage(blob)).rejects.toThrow('Failed to load image');
  });

  it('should reject with timeout after 15 seconds when image never loads', async () => {
    vi.stubGlobal('Image', function (this: Record<string, unknown>) {
      let storedSrc: string | undefined;
      Object.defineProperty(this, 'src', {
        get() { return storedSrc; },
        set(v: string) { storedSrc = v; },
      });
    });

    const blob = new Blob(['data'], { type: 'image/jpeg' });
    const promise = compressImage(blob);
    vi.advanceTimersByTime(15001);
    await expect(promise).rejects.toThrow('Timeout loading image');
  });
});
