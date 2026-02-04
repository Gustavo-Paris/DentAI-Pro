/**
 * Compress an image file to JPEG with configurable dimensions and quality.
 * Maintains aspect ratio and includes a safety timeout for mobile devices.
 */
export async function compressImage(
  file: File | Blob,
  maxWidth: number = 1280,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Safety timeout for problematic mobile devices
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Timeout loading image'));
    }, 15000);

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
