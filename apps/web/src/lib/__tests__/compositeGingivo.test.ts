import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/canvasUtils', () => ({
  yieldToMain: vi.fn().mockResolvedValue(undefined),
}));

// Helper to build a mock Image constructor that fires onload with given dimensions
function stubImageLoad(width: number, height: number) {
  vi.stubGlobal('Image', function (this: Record<string, unknown>) {
    const self = this;
    self.crossOrigin = '';
    self.naturalWidth = width;
    self.naturalHeight = height;
    Object.defineProperty(self, 'src', {
      set(_v: string) {
        Promise.resolve().then(() => (self.onload as () => void)?.());
      },
    });
  });
}

function stubImageError() {
  vi.stubGlobal('Image', function (this: Record<string, unknown>) {
    const self = this;
    self.crossOrigin = '';
    Object.defineProperty(self, 'src', {
      set(_v: string) {
        Promise.resolve().then(() => (self.onerror as () => void)?.());
      },
    });
  });
}

const originalImage = globalThis.Image;

describe('compositeGengivoplastyLips', () => {
  let mockCtx: Record<string, unknown>;
  let mockImageData: { data: Uint8ClampedArray };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a small 4x4 image data for testing
    const pixelCount = 4 * 4;
    const data = new Uint8ClampedArray(pixelCount * 4);
    // Fill with neutral gray pixels
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;     // R
      data[i + 1] = 128; // G
      data[i + 2] = 128; // B
      data[i + 3] = 255; // A
    }
    mockImageData = { data };

    mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(mockImageData),
      createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(pixelCount * 4) }),
      putImageData: vi.fn(),
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(mockCtx),
          toDataURL: vi.fn().mockReturnValue('data:image/png;base64,composited'),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.stubGlobal('Image', originalImage);
    vi.restoreAllMocks();
  });

  it('should return composited data URL on success', async () => {
    stubImageLoad(4, 4);
    const { compositeGengivoplastyLips } = await import('../compositeGingivo');

    const result = await compositeGengivoplastyLips('http://l2.png', 'http://l3.png');
    expect(result).toBe('data:image/png;base64,composited');
  });

  it('should return null when image fails to load', async () => {
    stubImageError();
    const { compositeGengivoplastyLips } = await import('../compositeGingivo');

    const result = await compositeGengivoplastyLips('http://l2.png', 'http://l3.png');
    expect(result).toBeNull();
  });

  it('should return null when image has zero dimensions', async () => {
    stubImageLoad(0, 0);
    const { compositeGengivoplastyLips } = await import('../compositeGingivo');

    const result = await compositeGengivoplastyLips('http://l2.png', 'http://l3.png');
    expect(result).toBeNull();
  });

  it('should return null when too many lip pixels detected (>8%)', async () => {
    stubImageLoad(4, 4);

    // Make ALL pixels look like lip pixels (red-dominant, bright, in upper 30%)
    // and make L3 different so diff > 40
    const pixelCount = 4 * 4;
    const l2Data = new Uint8ClampedArray(pixelCount * 4);
    const l3Data = new Uint8ClampedArray(pixelCount * 4);

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const i = (y * 4 + x) * 4;
        // L2: bright red (lip-like) - high brightness, high red dominance, high saturation
        l2Data[i] = 150;     // R
        l2Data[i + 1] = 80;  // G
        l2Data[i + 2] = 70;  // B
        l2Data[i + 3] = 255; // A
        // L3: significantly different
        l3Data[i] = 50;
        l3Data[i + 1] = 50;
        l3Data[i + 2] = 50;
        l3Data[i + 3] = 255;
      }
    }

    let callCount = 0;
    mockCtx.getImageData = vi.fn(() => {
      callCount++;
      return callCount === 1 ? { data: l2Data } : { data: l3Data };
    });

    const { compositeGengivoplastyLips } = await import('../compositeGingivo');
    const { logger } = await import('@/lib/logger');

    const result = await compositeGengivoplastyLips('http://l2.png', 'http://l3.png');
    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('too many lip pixels'));
  });

  it('should log restored pixel count on success', async () => {
    stubImageLoad(4, 4);
    const { compositeGengivoplastyLips } = await import('../compositeGingivo');
    const { logger } = await import('@/lib/logger');

    await compositeGengivoplastyLips('http://l2.png', 'http://l3.png');
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('compositeGingivo: restored'));
  });

  it('should catch errors and return null', async () => {
    stubImageLoad(4, 4);

    // Make getImageData throw
    mockCtx.getImageData = vi.fn(() => { throw new Error('canvas tainted'); });

    const { compositeGengivoplastyLips } = await import('../compositeGingivo');
    const { logger } = await import('@/lib/logger');

    const result = await compositeGengivoplastyLips('http://l2.png', 'http://l3.png');
    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('compositing failed'),
      expect.any(Error),
    );
  });
});
