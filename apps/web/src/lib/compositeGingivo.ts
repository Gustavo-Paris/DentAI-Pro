/**
 * Post-generation lip-fix compositing for gengivoplasty (L3) layer.
 *
 * Problem: Gemini's image edit model often lifts the upper lip instead of only
 * trimming gum tissue when generating gengivoplasty simulations.
 *
 * Solution: Composite L2 (correct lips) and L3 (recontoured gums) pixel-by-pixel.
 * Lip pixels are restored from L2; gum/tooth pixels are kept from L3.
 */

import { logger } from './logger';

/** Load an image URL into an HTMLImageElement */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url.substring(0, 80)}`));
    img.src = url;
  });
}

/**
 * Classify a pixel from L2 as "lip" based on color heuristics.
 * Tuned for dental clinical photos (bright, neutral white lighting).
 */
function isLipPixel(r: number, g: number, b: number, y: number, height: number): boolean {
  // Lips are only in the top 60% of a dental smile photo
  if (y > height * 0.6) return false;

  const brightness = (r + g + b) / 3;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  const redDominance = r - g;

  // Lip: moderate brightness, red-dominant, moderate-high saturation
  return (
    brightness > 40 &&
    brightness < 190 &&
    redDominance > 20 &&
    saturation > 30
  );
}

/**
 * Dilate a boolean mask by `radius` pixels (square kernel).
 * Ensures lip mask catches edge pixels at the boundary.
 */
function dilateMask(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let found = false;
      for (let dy = -radius; dy <= radius && !found; dy++) {
        for (let dx = -radius; dx <= radius && !found; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (mask[ny * width + nx]) found = true;
          }
        }
      }
      out[y * width + x] = found ? 1 : 0;
    }
  }
  return out;
}

/**
 * Apply box blur to a float mask for smooth blending at boundaries.
 */
function blurMask(mask: Float32Array, width: number, height: number, radius: number): Float32Array {
  const out = new Float32Array(mask.length);
  const kernelSize = (2 * radius + 1) * (2 * radius + 1);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            sum += mask[ny * width + nx];
            count++;
          }
        }
      }
      out[y * width + x] = sum / count;
    }
  }
  return out;
}

/**
 * Composite L2 (correct lips) and L3 (gengivoplasty) to fix lip movement.
 *
 * @param l2Url - Signed URL of the L2 (whitening) layer
 * @param l3Url - Signed URL of the L3 (gengivoplasty) layer
 * @returns Base64 data URL of the composited image, or null if compositing fails
 */
export async function compositeGengivoplastyLips(
  l2Url: string,
  l3Url: string,
): Promise<string | null> {
  try {
    // Load both images
    const [l2Img, l3Img] = await Promise.all([loadImage(l2Url), loadImage(l3Url)]);

    const width = l2Img.naturalWidth;
    const height = l2Img.naturalHeight;

    if (width === 0 || height === 0) {
      logger.warn('compositeGingivo: invalid image dimensions');
      return null;
    }

    // Draw images to off-screen canvases
    const l2Canvas = document.createElement('canvas');
    l2Canvas.width = width;
    l2Canvas.height = height;
    const l2Ctx = l2Canvas.getContext('2d')!;
    l2Ctx.drawImage(l2Img, 0, 0);

    const l3Canvas = document.createElement('canvas');
    l3Canvas.width = width;
    l3Canvas.height = height;
    const l3Ctx = l3Canvas.getContext('2d')!;
    l3Ctx.drawImage(l3Img, 0, 0);

    const l2Data = l2Ctx.getImageData(0, 0, width, height);
    const l3Data = l3Ctx.getImageData(0, 0, width, height);

    // Step 1: Build lip+changed mask
    const DIFF_THRESHOLD = 30; // Sum of RGB differences to consider "changed"
    const lipChangedMask = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r2 = l2Data.data[i], g2 = l2Data.data[i + 1], b2 = l2Data.data[i + 2];
        const r3 = l3Data.data[i], g3 = l3Data.data[i + 1], b3 = l3Data.data[i + 2];

        const diff = Math.abs(r2 - r3) + Math.abs(g2 - g3) + Math.abs(b2 - b3);
        const changed = diff > DIFF_THRESHOLD;
        const lip = isLipPixel(r2, g2, b2, y, height);

        lipChangedMask[y * width + x] = (lip && changed) ? 1 : 0;
      }
    }

    // Step 2: Dilate the mask by 2px to catch edge artifacts
    const dilatedMask = dilateMask(lipChangedMask, width, height, 2);

    // Step 3: Convert to float and blur for smooth blending (3px radius)
    const floatMask = new Float32Array(dilatedMask.length);
    for (let i = 0; i < dilatedMask.length; i++) {
      floatMask[i] = dilatedMask[i];
    }
    const blurredMask = blurMask(floatMask, width, height, 3);

    // Step 4: Composite — blend L2 (lip) and L3 (everything else)
    const outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    const outCtx = outCanvas.getContext('2d')!;
    const outData = outCtx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const i = idx * 4;

        // alpha = how much to take from L2 (1.0 = full L2, 0.0 = full L3)
        const alpha = blurredMask[idx];

        outData.data[i] = Math.round(l2Data.data[i] * alpha + l3Data.data[i] * (1 - alpha));
        outData.data[i + 1] = Math.round(l2Data.data[i + 1] * alpha + l3Data.data[i + 1] * (1 - alpha));
        outData.data[i + 2] = Math.round(l2Data.data[i + 2] * alpha + l3Data.data[i + 2] * (1 - alpha));
        outData.data[i + 3] = 255;
      }
    }

    outCtx.putImageData(outData, 0, 0);

    // Count how many pixels were restored from L2
    let restoredPixels = 0;
    for (let i = 0; i < blurredMask.length; i++) {
      if (blurredMask[i] > 0.5) restoredPixels++;
    }
    const pct = ((restoredPixels / (width * height)) * 100).toFixed(1);
    logger.log(`compositeGingivo: restored ${restoredPixels} lip pixels (${pct}% of image)`);

    return outCanvas.toDataURL('image/png');
  } catch (err) {
    logger.error('compositeGingivo: compositing failed:', err);
    return null;
  }
}
