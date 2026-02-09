import type { ToothBoundsPct } from '@/types/dsd';

/**
 * Creates a composite image that overlays AI-modified teeth onto the original
 * photo, preserving the original lips/gums/background.
 *
 * Uses canvas ellipse masking over detected tooth bounds with soft edges.
 */
export async function createCompositeTeethOnly(params: {
  beforeDataUrl: string;
  afterUrl: string;
  bounds: ToothBoundsPct[];
  includeGingiva?: boolean;
}): Promise<Blob> {
  const { beforeDataUrl, afterUrl, bounds, includeGingiva } = params;

  const [beforeRes, afterRes] = await Promise.all([
    fetch(beforeDataUrl),
    fetch(afterUrl),
  ]);

  if (!beforeRes.ok || !afterRes.ok) {
    throw new Error('Falha ao baixar imagens para composição');
  }

  const [beforeBlob, afterBlob] = await Promise.all([
    beforeRes.blob(),
    afterRes.blob(),
  ]);

  const [beforeBitmap, afterBitmap] = await Promise.all([
    createImageBitmap(beforeBlob),
    createImageBitmap(afterBlob),
  ]);

  const w = beforeBitmap.width;
  const h = beforeBitmap.height;

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

  // Mask canvas
  const mask = document.createElement('canvas');
  mask.width = w;
  mask.height = h;
  const maskCtx = mask.getContext('2d');
  if (!maskCtx) throw new Error('Canvas não suportado');

  // Draw ellipses over teeth bounds
  // When includeGingiva is true (complete-treatment layer), expand mask upward
  // to include the gingival region so gengivoplasty changes are preserved.
  const scaleX = 0.9;
  const scaleY = includeGingiva ? 1.15 : 0.7;
  // Shift ellipses upward to cover gengiva above tooth crown
  const yOffsetRatio = includeGingiva ? -0.15 : 0;

  maskCtx.fillStyle = 'rgba(255,255,255,1)';
  for (const b of bounds) {
    const cx = (b.x / 100) * w;
    const bh = (b.height / 100) * h;
    const cy = (b.y / 100) * h + bh * yOffsetRatio;
    const bw = (b.width / 100) * w;
    const rx = (bw * scaleX) / 2;
    const ry = (bh * scaleY) / 2;

    maskCtx.beginPath();
    maskCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    maskCtx.fill();
  }

  // Soft edges (second blurred pass)
  maskCtx.save();
  maskCtx.filter = includeGingiva ? 'blur(14px)' : 'blur(10px)';
  maskCtx.globalAlpha = 0.55;
  for (const b of bounds) {
    const cx = (b.x / 100) * w;
    const bh = (b.height / 100) * h;
    const cy = (b.y / 100) * h + bh * yOffsetRatio;
    const bw = (b.width / 100) * w;
    const rx = (bw * (scaleX * 1.15)) / 2;
    const ry = (bh * (scaleY * 1.15)) / 2;
    maskCtx.beginPath();
    maskCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    maskCtx.fill();
  }
  maskCtx.restore();

  // Apply mask to overlay (keep only teeth region)
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
