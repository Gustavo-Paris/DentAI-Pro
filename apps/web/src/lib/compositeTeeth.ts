import type { ToothBoundsPct } from '@/types/dsd';
import { yieldToMain } from './canvasUtils';

// --- Image loading helpers ---

/** Convert a data URL to a Blob without fetch (avoids CSP connect-src restrictions). */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/** Load an image from a URL or data URL, returning an ImageBitmap. */
async function loadImageBitmap(urlOrDataUrl: string): Promise<ImageBitmap> {
  if (urlOrDataUrl.startsWith('data:')) {
    return createImageBitmap(dataUrlToBlob(urlOrDataUrl));
  }
  const res = await fetch(urlOrDataUrl);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return createImageBitmap(await res.blob());
}

/**
 * Creates a composite image that overlays AI-modified teeth onto the original
 * photo, preserving the original lips/gums/background.
 *
 * Uses a single unified mask covering the entire dental arch (computed from
 * all tooth bounds) with heavy gaussian blur for invisible blending.
 */
export async function createCompositeTeethOnly(params: {
  beforeDataUrl: string;
  afterUrl: string;
  bounds: ToothBoundsPct[];
  includeGingiva?: boolean;
}): Promise<Blob> {
  const { beforeDataUrl, afterUrl, bounds, includeGingiva } = params;

  const [beforeBitmap, afterBitmap] = await Promise.all([
    loadImageBitmap(beforeDataUrl),
    loadImageBitmap(afterUrl),
  ]);

  const w = beforeBitmap.width;
  const h = beforeBitmap.height;

  // Yield before heavy canvas operations to keep UI responsive
  await yieldToMain();

  // Base canvas (original)
  const base = document.createElement('canvas');
  base.width = w;
  base.height = h;
  const baseCtx = base.getContext('2d');
  if (!baseCtx) throw new Error('Canvas não suportado');
  baseCtx.drawImage(beforeBitmap, 0, 0);

  // Overlay canvas (AI output)
  const overlay = document.createElement('canvas');
  overlay.width = w;
  overlay.height = h;
  const overlayCtx = overlay.getContext('2d');
  if (!overlayCtx) throw new Error('Canvas não suportado');
  overlayCtx.drawImage(afterBitmap, 0, 0);

  // Mask canvas — single unified region covering entire dental arch
  const mask = document.createElement('canvas');
  mask.width = w;
  mask.height = h;
  const maskCtx = mask.getContext('2d');
  if (!maskCtx) throw new Error('Canvas não suportado');

  // Compute unified bounding box from all tooth bounds
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const b of bounds) {
    const bx = (b.x / 100) * w;
    const by = (b.y / 100) * h;
    const bw = (b.width / 100) * w;
    const bh = (b.height / 100) * h;
    left = Math.min(left, bx - bw / 2);
    right = Math.max(right, bx + bw / 2);
    top = Math.min(top, by - bh / 2);
    bottom = Math.max(bottom, by + bh / 2);
  }

  // Expand the region slightly for safety margin
  const padX = (right - left) * 0.08;
  const padY = (bottom - top) * 0.1;
  left -= padX;
  right += padX;
  top -= padY;
  bottom += padY;

  // For gengivoplasty layers, expand upward to include gingival region
  if (includeGingiva) {
    const archHeight = bottom - top;
    top -= archHeight * 0.35;
  }

  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const rx = (right - left) / 2;
  const ry = (bottom - top) / 2;

  // Draw single unified ellipse mask
  const blurAmount = includeGingiva ? 25 : 20;

  maskCtx.fillStyle = 'rgba(255,255,255,1)';
  maskCtx.beginPath();
  maskCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  maskCtx.fill();

  // Heavy blur for invisible blending
  maskCtx.save();
  maskCtx.filter = `blur(${blurAmount}px)`;
  maskCtx.globalAlpha = 0.6;
  maskCtx.beginPath();
  maskCtx.ellipse(cx, cy, rx * 1.1, ry * 1.1, 0, 0, Math.PI * 2);
  maskCtx.fill();
  maskCtx.restore();

  // Yield before compositing
  await yieldToMain();

  // Apply mask to overlay (keep only dental region)
  overlayCtx.globalCompositeOperation = 'destination-in';
  overlayCtx.drawImage(mask, 0, 0);
  overlayCtx.globalCompositeOperation = 'source-over';

  // Merge overlay on top of base
  baseCtx.drawImage(overlay, 0, 0);

  return await new Promise<Blob>((resolve, reject) => {
    base.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem final'))),
      'image/jpeg',
      0.92
    );
  });
}
