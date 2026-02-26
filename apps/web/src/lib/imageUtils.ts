/**
 * Get the natural dimensions of an image from a base64 data URL.
 */
export function getImageDimensions(
  base64: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      reject(new Error('Timeout getting image dimensions'));
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load image for dimension check'));
    };
    img.src = base64;
  });
}

/** Fetch a URL and return its content as a base64 data URL. Returns null on failure. */
export async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const IMAGE_LOAD_TIMEOUT_MS = 15_000;

/**
 * Compress an image file to JPEG with configurable dimensions and quality.
 * Maintains aspect ratio and includes a safety timeout for mobile devices.
 */
/**
 * Re-compress a base64 data URL for AI analysis.
 * Targets 1280px max dimension and 0.80 JPEG quality to keep edge function
 * memory under Supabase limits. The DSD step uses the original higher-quality image.
 */
export function compressBase64ForAnalysis(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      reject(new Error('Timeout compressing for analysis'));
    }, 10_000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        let { naturalWidth: w, naturalHeight: h } = img;
        const MAX = 1280;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round((h * MAX) / w); w = MAX; }
          else        { w = Math.round((w * MAX) / h); h = MAX; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.80));
      } catch (e) { reject(e); }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load image for analysis compression'));
    };
    img.src = dataUrl;
  });
}

export async function compressImage(
  file: File | Blob,
  maxWidth: number = 1280,
  quality: number = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Safety timeout for problematic mobile devices
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Timeout loading image'));
    }, IMAGE_LOAD_TIMEOUT_MS);

    img.onload = () => {
      clearTimeout(timeout);

      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(img.src);
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

        // Clean up object URL
        URL.revokeObjectURL(img.src);

        resolve(compressedBase64);
      } catch (err) {
        URL.revokeObjectURL(img.src);
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}
