import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, Button, Badge, Alert, AlertDescription } from '@parisgroup-ai/pageshell/primitives';
import { Camera, Upload, X, Loader2, User, Smile, Sparkles, Lightbulb, Zap, AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage, getImageDimensions } from '@/lib/imageUtils';
import { compressBase64ForAnalysis } from '@/lib/imageUtils';
import { trackEvent } from '@/lib/analytics';
import { supabase } from '@/data';
// heic-to is dynamically imported to reduce initial bundle size (20MB library)

export interface AdditionalPhotos {
  smile45: string | null;
  face: string | null;
}

interface PhotoUploadStepProps {
  imageBase64: string | null;
  onImageChange: (base64: string | null) => void;
  onAnalyze: () => void;
  onQuickCase?: () => void;
  isUploading: boolean;
  additionalPhotos?: AdditionalPhotos;
  onAdditionalPhotosChange?: (photos: AdditionalPhotos) => void;
  /** Called when the background quality check completes with a 0-100 score */
  onPhotoQualityScore?: (score: number | null) => void;
}

type QualityStatus = 'idle' | 'checking' | 'good' | 'warning' | 'low' | 'error';

// Detecção robusta de HEIC usando a biblioteca heic-to + fallback
// Dynamic import to reduce initial bundle size
const checkIsHeic = async (file: File): Promise<boolean> => {
  try {
    // Dynamic import - heic-to only loads when checking HEIC files
    const { isHeic } = await import('heic-to');
    return await isHeic(file);
  } catch {
    // Fallback para detecção por nome/tipo (Safari iOS pode retornar type vazio)
    const typeIsHeic = file.type === 'image/heic' || file.type === 'image/heif';
    const nameIsHeic = /\.(heic|heif)$/i.test(file.name);
    const typeIsEmpty = file.type === '' || file.type === 'application/octet-stream';
    return typeIsHeic || (typeIsEmpty && nameIsHeic);
  }
};

// Converter HEIC para JPEG usando heic-to (suporta iOS 18)
// Dynamic import to reduce initial bundle size
const convertHeicToJpeg = async (file: File): Promise<Blob> => {
  // Dynamic import - heic-to only loads when converting HEIC files
  const { heicTo } = await import('heic-to');
  const jpegBlob = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: 0.88,
  });
  return jpegBlob;
};

// Read file as base64 without compression (fallback for problematic formats)
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Module-level constant: userAgent doesn't change during app lifetime
const IS_MOBILE_DEVICE = typeof navigator !== 'undefined'
  ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  : false;

export const PhotoUploadStep = memo(function PhotoUploadStep({
  imageBase64,
  onImageChange,
  onAnalyze,
  onQuickCase,
  isUploading,
  additionalPhotos = { smile45: null, face: null },
  onAdditionalPhotosChange,
  onPhotoQualityScore,
}: PhotoUploadStepProps) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveSmile45, setDragActiveSmile45] = useState(false);
  const [dragActiveFace, setDragActiveFace] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingOptional, setProcessingOptional] = useState<'smile45' | 'face' | null>(null);
  const [qualityStatus, setQualityStatus] = useState<QualityStatus>('idle');
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const qualityAbortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const smile45InputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  const isMobileDevice = IS_MOBILE_DEVICE;

  // Detecta tela pequena para layout responsivo
  useEffect(() => {
    const checkScreen = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Mostra botão câmera se for mobile real OU tela pequena (para preview)
  const showCameraButton = isMobileDevice || isSmallScreen;

  // Background quality check — runs after photo is set
  useEffect(() => {
    if (!imageBase64) {
      setQualityStatus('idle');
      setQualityScore(null);
      onPhotoQualityScore?.(null);
      return;
    }

    // Don't re-check if we already have a score for this image
    if (qualityStatus !== 'idle') return;

    const abortCtrl = new AbortController();
    qualityAbortRef.current = abortCtrl;

    const checkQuality = async () => {
      setQualityStatus('checking');
      try {
        // Compress to a smaller size for the quality check (saves bandwidth)
        const compressed = await compressBase64ForAnalysis(imageBase64);

        if (abortCtrl.signal.aborted) return;

        const { data, error } = await supabase.functions.invoke<{ score: number }>('check-photo-quality', {
          body: { imageBase64: compressed },
        });

        if (abortCtrl.signal.aborted) return;

        if (error || !data) {
          setQualityStatus('error');
          onPhotoQualityScore?.(null);
          return;
        }

        const score = data.score;
        setQualityScore(score);
        onPhotoQualityScore?.(score);

        if (score >= 60) {
          setQualityStatus('good');
        } else if (score >= 35) {
          setQualityStatus('warning');
        } else {
          setQualityStatus('low');
          trackEvent('photo_quality_low', { score });
        }
      } catch {
        if (!abortCtrl.signal.aborted) {
          setQualityStatus('error');
          onPhotoQualityScore?.(null);
        }
      }
    };

    checkQuality();

    return () => {
      abortCtrl.abort();
      qualityAbortRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBase64]);

  const handleFile = useCallback(async (file: File) => {
    // Clear any previous error and quality state when user tries again
    setUploadError(null);
    setQualityStatus('idle');
    setQualityScore(null);
    qualityAbortRef.current?.abort();

    // Validação de tipo - aceitar imagens E arquivos sem tipo (HEIC no Safari)
    if (!file.type.startsWith('image/') && file.type !== '' && file.type !== 'application/octet-stream') {
      const errorMsg = t('components.wizard.photoUpload.onlyImages');
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = t('components.wizard.photoUpload.maxSize');
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsCompressing(true);

    try {
      let processedBlob: File | Blob = file;

      // Verificar se é HEIC usando a nova biblioteca
      const fileIsHeic = await checkIsHeic(file);

      if (fileIsHeic) {
        toast.info(t('components.wizard.photoUpload.convertingIphone'));
        processedBlob = await convertHeicToJpeg(file);
        // HEIC already converted to JPEG at 0.88 — only resize, skip recompression
        // Use 2048px for DSD simulation quality (higher resolution = better Gemini output)
        const compressedBase64 = await compressImage(processedBlob, 2048, 1.0);

        // Minimum size warning (non-blocking) — P2-57
        try {
          const dims = await getImageDimensions(compressedBase64);
          if (dims.width < 640 || dims.height < 480) {
            toast.warning(t('components.wizard.photoUpload.imageTooSmall'));
          }
        } catch { /* ignore dimension check errors */ }

        onImageChange(compressedBase64);
        trackEvent('photo_uploaded', { file_size: file.size, file_type: 'heic' });
        return;
      }

      // Comprimir a imagem (non-HEIC) — 2048px / 0.92 for DSD simulation quality
      const compressedBase64 = await compressImage(processedBlob, 2048, 0.92);

      // Minimum size warning (non-blocking) — P2-57
      try {
        const dims = await getImageDimensions(compressedBase64);
        if (dims.width < 640 || dims.height < 480) {
          toast.warning(t('components.wizard.photoUpload.imageTooSmall'));
        }
      } catch { /* ignore dimension check errors */ }

      onImageChange(compressedBase64);
      trackEvent('photo_uploaded', { file_size: file.size, file_type: file.type || 'unknown' });

    } catch {
      // Fallback: tentar conversão automática do Safari
      try {
        const base64 = await readFileAsDataURL(file);

        // Se o Safari converteu automaticamente para JPEG/PNG
        if (base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/png')) {
          onImageChange(base64);
          toast.info(t('components.wizard.photoUpload.autoConversion'));
          return;
        }

        const errorMsg = t('components.wizard.photoUpload.processError');
        setUploadError(errorMsg);
        toast.error(errorMsg);
      } catch {
        const errorMsg = t('components.wizard.photoUpload.processErrorFallback');
        setUploadError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setIsCompressing(false);
    }
  }, [onImageChange, t]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  // Handle optional photo upload (45° or Face)
  const handleOptionalFile = useCallback(async (file: File, type: 'smile45' | 'face') => {
    if (!file.type.startsWith('image/') && file.type !== '' && file.type !== 'application/octet-stream') {
      toast.error(t('components.wizard.photoUpload.onlyImages'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('components.wizard.photoUpload.maxSize'));
      return;
    }

    setProcessingOptional(type);

    try {
      let processedBlob: File | Blob = file;

      const fileIsHeic = await checkIsHeic(file);
      if (fileIsHeic) {
        processedBlob = await convertHeicToJpeg(file);
        // HEIC already converted — only resize, skip recompression
        const compressedBase64 = await compressImage(processedBlob, 1280, 1.0);

        if (onAdditionalPhotosChange) {
          onAdditionalPhotosChange({
            ...additionalPhotos,
            [type]: compressedBase64,
          });
        }

        toast.success(type === 'smile45' ? t('components.wizard.photoUpload.photo45Added') : t('components.wizard.photoUpload.faceAdded'));
        return;
      }

      const compressedBase64 = await compressImage(processedBlob);

      if (onAdditionalPhotosChange) {
        onAdditionalPhotosChange({
          ...additionalPhotos,
          [type]: compressedBase64,
        });
      }

      toast.success(type === 'smile45' ? t('components.wizard.photoUpload.photo45Added') : t('components.wizard.photoUpload.faceAdded'));
    } catch {
      try {
        const base64 = await readFileAsDataURL(file);
        if (base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/png')) {
          if (onAdditionalPhotosChange) {
            onAdditionalPhotosChange({
              ...additionalPhotos,
              [type]: base64,
            });
          }
          return;
        }
        toast.error(t('components.wizard.photoUpload.optionalPhotoError'));
      } catch {
        toast.error(t('components.wizard.photoUpload.photoError'));
      }
    } finally {
      setProcessingOptional(null);
    }
  }, [additionalPhotos, onAdditionalPhotosChange, t]);

  const handleSmile45FileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleOptionalFile(e.target.files[0], 'smile45');
    }
  }, [handleOptionalFile]);

  const handleFaceFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleOptionalFile(e.target.files[0], 'face');
    }
  }, [handleOptionalFile]);

  const removeOptionalPhoto = (type: 'smile45' | 'face') => {
    if (onAdditionalPhotosChange) {
      onAdditionalPhotosChange({
        ...additionalPhotos,
        [type]: null,
      });
    }
    if (type === 'smile45' && smile45InputRef.current) {
      smile45InputRef.current.value = '';
    }
    if (type === 'face' && faceInputRef.current) {
      faceInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold font-display mb-2 neon-text">{t('components.wizard.photoUpload.title')}</h2>
        <p className="text-muted-foreground">
          {t('components.wizard.photoUpload.subtitle')}
        </p>
      </div>

      {!imageBase64 ? (
        /* Premium Drop Zone */
        <div
          role="region"
          aria-label={t('components.wizard.photoUpload.dropZoneLabel')}
          className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
            dragActive
              ? 'border-2 border-primary bg-primary/5 scale-[1.02] shadow-[0_0_30px_rgb(var(--color-primary-rgb)/0.15)]'
              : 'border-2 border-dashed border-primary/15 hover:border-primary/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="relative">
            <div className="ai-grid-pattern absolute inset-0 opacity-15 dark:opacity-30 pointer-events-none" aria-hidden="true" />
            <div className="py-10 px-4 relative">
              {isCompressing ? (
                <div className="flex flex-col items-center justify-center text-center" role="status" aria-live="polite">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {t('components.wizard.photoUpload.processing')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('components.wizard.photoUpload.optimizing')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 glow-icon">
                    <Camera className="w-8 h-8 text-primary animate-[float_3s_ease-in-out_infinite]" />
                  </div>

                  <h3 className="text-lg font-medium mb-2">
                    {t('components.wizard.photoUpload.dragHere')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {showCameraButton ? t('components.wizard.photoUpload.orChooseMobile') : t('components.wizard.photoUpload.orChooseDesktop')}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="default"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-press"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t('components.wizard.photoUpload.chooseFromGallery')}
                    </Button>
                    {showCameraButton && (
                      <Button
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        className="btn-press"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {t('components.wizard.photoUpload.takePhoto')}
                      </Button>
                    )}
                  </div>

                  {/* Format chips */}
                  <div className="flex items-center gap-2 mt-6">
                    {['JPG', 'PNG', 'HEIC', '10MB'].map((fmt) => (
                      <Badge key={fmt} variant="outline" className="text-xs font-normal glow-badge">
                        {fmt}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Photo Preview — Premium Card */
        <Card className="card-elevated overflow-hidden rounded-xl">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={imageBase64}
                alt={t('components.wizard.photoUpload.altIntraoral')}
                className="w-full max-h-[250px] md:max-h-[400px] object-contain ring-2 ring-primary/20 rounded-xl"
              />
              {/* Badge overlay */}
              <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground border border-border/50">
                <Camera className="w-3 h-3 mr-1" />
                {t('components.wizard.photoUpload.badgeIntraoral')}
              </Badge>
              {/* Frosted glass remove button */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background/90 border border-border/50"
                onClick={handleRemove}
                aria-label={t('components.wizard.photoUpload.removeIntraoral')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality check indicator */}
      {imageBase64 && qualityStatus !== 'idle' && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all ${
          qualityStatus === 'checking' ? 'bg-muted/50 text-muted-foreground' :
          qualityStatus === 'good' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
          qualityStatus === 'warning' ? 'bg-warning/10 text-warning-foreground dark:text-warning' :
          qualityStatus === 'low' ? 'bg-destructive/10 text-destructive' :
          'bg-muted/30 text-muted-foreground'
        }`}>
          {qualityStatus === 'checking' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{t('components.wizard.photoUpload.checkingQuality')}</span>
            </>
          )}
          {qualityStatus === 'good' && (
            <>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('components.wizard.photoUpload.qualityGood')}</span>
            </>
          )}
          {qualityStatus === 'warning' && (
            <>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{t('components.wizard.photoUpload.qualityWarning')}</span>
            </>
          )}
          {qualityStatus === 'low' && (
            <>
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{t('components.wizard.photoUpload.qualityLow')}</span>
            </>
          )}
          {qualityStatus === 'error' && (
            <>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t('components.wizard.photoUpload.qualityCheckFailed')}</span>
            </>
          )}
        </div>
      )}

      {/* Persistent upload error banner */}
      {uploadError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Input para galeria - sem capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label={t('components.wizard.photoUpload.chooseFromGallery')}
      />

      {/* Input para câmera - com capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label={t('components.wizard.photoUpload.takePhoto')}
      />

      {/* Inputs ocultos para fotos opcionais */}
      <input
        ref={smile45InputRef}
        type="file"
        accept="image/*"
        onChange={handleSmile45FileChange}
        className="hidden"
        aria-label={t('components.wizard.photoUpload.smile45Label')}
      />
      <input
        ref={faceInputRef}
        type="file"
        accept="image/*"
        onChange={handleFaceFileChange}
        className="hidden"
        aria-label={t('components.wizard.photoUpload.faceLabel')}
      />

      {/* Fotos adicionais — always visible after main photo (dimmed if empty) */}
      {imageBase64 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            {t('components.wizard.photoUpload.additionalPhotos')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Foto 45° */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
            >
              <Card
                className={`card-elevated overflow-hidden transition-all duration-200 ${
                  dragActiveSmile45 ? 'border-primary bg-primary/5 scale-[1.02]' : ''
                } ${!additionalPhotos.smile45 ? 'opacity-60 hover:opacity-100' : ''}`}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveSmile45(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveSmile45(false); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActiveSmile45(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleOptionalFile(e.dataTransfer.files[0], 'smile45');
                  }
                }}
              >
                <CardContent className="p-3">
                  {additionalPhotos.smile45 ? (
                    <div className="relative">
                      <img
                        src={additionalPhotos.smile45}
                        alt={t('components.wizard.photoUpload.smile45Alt')}
                        className="w-full h-24 object-cover rounded-lg ring-1 ring-primary/20"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-1 right-1 h-8 w-8 bg-background/80 backdrop-blur-sm"
                        onClick={() => removeOptionalPhoto('smile45')}
                        aria-label={t('components.wizard.photoUpload.remove45')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <Badge className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm text-foreground text-xs border border-border/50">
                        {t('components.wizard.photoUpload.smile45Label')}
                      </Badge>
                    </div>
                  ) : (
                    <button
                      onClick={() => smile45InputRef.current?.click()}
                      disabled={processingOptional === 'smile45'}
                      className="w-full h-24 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors border border-dashed border-border/50"
                    >
                      {processingOptional === 'smile45' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Smile className="w-5 h-5" />
                          <span className="text-xs font-medium">{t('components.wizard.photoUpload.smile45Label')}</span>
                          <span className="text-xs">{t('components.wizard.photoUpload.optional')}</span>
                        </>
                      )}
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Foto Face */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
            >
              <Card
                className={`card-elevated overflow-hidden transition-all duration-200 ${
                  dragActiveFace ? 'border-primary bg-primary/5 scale-[1.02]' : ''
                } ${!additionalPhotos.face ? 'opacity-60 hover:opacity-100' : ''}`}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveFace(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActiveFace(false); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActiveFace(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleOptionalFile(e.dataTransfer.files[0], 'face');
                  }
                }}
              >
                <CardContent className="p-3">
                  {additionalPhotos.face ? (
                    <div className="relative">
                      <img
                        src={additionalPhotos.face}
                        alt={t('components.wizard.photoUpload.faceAlt')}
                        className="w-full h-24 object-cover rounded-lg ring-1 ring-primary/20"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-1 right-1 h-8 w-8 bg-background/80 backdrop-blur-sm"
                        onClick={() => removeOptionalPhoto('face')}
                        aria-label={t('components.wizard.photoUpload.removeFace')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <Badge className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm text-foreground text-xs border border-border/50">
                        {t('components.wizard.photoUpload.faceLabel')}
                      </Badge>
                    </div>
                  ) : (
                    <button
                      onClick={() => faceInputRef.current?.click()}
                      disabled={processingOptional === 'face'}
                      className="w-full h-24 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors border border-dashed border-border/50"
                    >
                      {processingOptional === 'face' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <User className="w-5 h-5" />
                          <span className="text-xs font-medium">{t('components.wizard.photoUpload.faceLabel')}</span>
                          <span className="text-xs">{t('components.wizard.photoUpload.optional')}</span>
                        </>
                      )}
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* CTA — Full Flow (primary) + Quick Case (secondary) */}
      {imageBase64 && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <Button
              size="lg"
              onClick={onAnalyze}
              disabled={isUploading}
              className="btn-glow btn-press font-semibold text-base min-w-[260px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('components.wizard.photoUpload.sending')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('components.wizard.photoUpload.fullAnalysis')}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground/70">
              {t('components.wizard.photoUpload.fullAnalysisCost')}
            </p>
          </div>
          {onQuickCase && (
            <div className="flex flex-col items-center gap-1">
              <Button
                variant="outline"
                size="default"
                onClick={onQuickCase}
                disabled={isUploading}
                className="btn-press min-w-[220px]"
              >
                <Zap className="w-4 h-4 mr-2" />
                {t('components.wizard.photoUpload.quickAnalysis')}
              </Button>
              <p className="text-xs text-muted-foreground/70">
                {t('components.wizard.photoUpload.quickAnalysisCost')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tips — Discrete card with gold accent stripe */}
      <div className="rounded-lg px-4 py-3 bg-muted/30">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-primary/50 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{t('components.wizard.photoUpload.tipsTitle')}</p>
            <ul className="text-xs text-muted-foreground/80 space-y-0.5">
              <li>{t('components.wizard.photoUpload.tip1')}</li>
              <li>{t('components.wizard.photoUpload.tip2')}</li>
              <li>{t('components.wizard.photoUpload.tip3')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});
