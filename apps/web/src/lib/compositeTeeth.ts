import type { ToothBoundsPct } from '@/types/dsd';

// --- HSL color space helpers ---

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/** Draw tooth-region ellipse mask onto a canvas context. */
function drawToothMask(
  ctx: CanvasRenderingContext2D,
  bounds: ToothBoundsPct[],
  w: number,
  h: number,
  opts: { scaleX: number; scaleY: number; yOffsetRatio: number; blur: number },
) {
  ctx.fillStyle = 'rgba(255,255,255,1)';
  for (const b of bounds) {
    const cx = (b.x / 100) * w;
    const bh = (b.height / 100) * h;
    const cy = (b.y / 100) * h + bh * opts.yOffsetRatio;
    const bw = (b.width / 100) * w;
    const rx = (bw * opts.scaleX) / 2;
    const ry = (bh * opts.scaleY) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Soft-edge second pass
  ctx.save();
  ctx.filter = `blur(${opts.blur}px)`;
  ctx.globalAlpha = 0.55;
  for (const b of bounds) {
    const cx = (b.x / 100) * w;
    const bh = (b.height / 100) * h;
    const cy = (b.y / 100) * h + bh * opts.yOffsetRatio;
    const bw = (b.width / 100) * w;
    const rx = (bw * (opts.scaleX * 1.15)) / 2;
    const ry = (bh * (opts.scaleY * 1.15)) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

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

/**
 * Derives L1 (restorations-only, natural color) from L2's raw AI output.
 *
 * Uses HSL color-space transfer: keeps L2's luminance (structural corrections
 * like filled gaps and improved contours) but restores the original photo's
 * hue and saturation (natural tooth color). This guarantees perfect structural
 * consistency between L1 and L2 since L1 is derived from L2's data.
 */
export async function createNaturalColorComposite(params: {
  originalDataUrl: string;
  aiOutputUrl: string;
  bounds: ToothBoundsPct[];
}): Promise<Blob> {
  const { originalDataUrl, aiOutputUrl, bounds } = params;

  const [origRes, aiRes] = await Promise.all([
    fetch(originalDataUrl),
    fetch(aiOutputUrl),
  ]);
  if (!origRes.ok || !aiRes.ok) {
    throw new Error('Failed to load images for natural color composite');
  }

  const [origBlob, aiBlob] = await Promise.all([origRes.blob(), aiRes.blob()]);
  const [origBitmap, aiBitmap] = await Promise.all([
    createImageBitmap(origBlob),
    createImageBitmap(aiBlob),
  ]);

  const w = origBitmap.width;
  const h = origBitmap.height;

  // Original photo pixel data
  const origCanvas = document.createElement('canvas');
  origCanvas.width = w;
  origCanvas.height = h;
  const origCtx = origCanvas.getContext('2d')!;
  origCtx.drawImage(origBitmap, 0, 0);
  const origData = origCtx.getImageData(0, 0, w, h);

  // AI output pixel data (scaled to match original dimensions)
  const aiCanvas = document.createElement('canvas');
  aiCanvas.width = w;
  aiCanvas.height = h;
  const aiCtx = aiCanvas.getContext('2d')!;
  aiCtx.drawImage(aiBitmap, 0, 0, w, h);
  const aiData = aiCtx.getImageData(0, 0, w, h);

  // Tooth mask (same parameters as standard compositing)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const maskCtx = maskCanvas.getContext('2d')!;
  drawToothMask(maskCtx, bounds, w, h, { scaleX: 0.9, scaleY: 0.7, yOffsetRatio: 0, blur: 10 });
  const maskData = maskCtx.getImageData(0, 0, w, h);

  // Start from original photo, then color-transfer in tooth region
  const resultData = origCtx.createImageData(w, h);
  resultData.data.set(origData.data);

  for (let i = 0; i < resultData.data.length; i += 4) {
    const maskVal = maskData.data[i] / 255; // red channel as mask
    if (maskVal < 0.01) continue;

    const [, , lAi] = rgbToHsl(aiData.data[i], aiData.data[i + 1], aiData.data[i + 2]);
    const [hOrig, sOrig, lOrig] = rgbToHsl(origData.data[i], origData.data[i + 1], origData.data[i + 2]);

    // Structural detail from AI + natural color from original.
    // Lightness blend: 65% AI (preserves gap fills, contour corrections) + 35% original.
    const blendedL = lAi * 0.65 + lOrig * 0.35;
    const [rN, gN, bN] = hslToRgb(hOrig, sOrig, blendedL);

    // Apply with soft-edge mask alpha
    resultData.data[i]     = Math.round(rN * maskVal + origData.data[i]     * (1 - maskVal));
    resultData.data[i + 1] = Math.round(gN * maskVal + origData.data[i + 1] * (1 - maskVal));
    resultData.data[i + 2] = Math.round(bN * maskVal + origData.data[i + 2] * (1 - maskVal));
    resultData.data[i + 3] = 255;
  }

  origCtx.putImageData(resultData, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    origCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to generate natural color composite'))),
      'image/jpeg',
      0.92,
    );
  });
}
