import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Loader2, User, Smile, Sparkles, Lightbulb, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageUtils';
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
}

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
    quality: 0.7,
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

export function PhotoUploadStep({
  imageBase64,
  onImageChange,
  onAnalyze,
  onQuickCase,
  isUploading,
  additionalPhotos = { smile45: null, face: null },
  onAdditionalPhotosChange,
}: PhotoUploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveSmile45, setDragActiveSmile45] = useState(false);
  const [dragActiveFace, setDragActiveFace] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [processingOptional, setProcessingOptional] = useState<'smile45' | 'face' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const smile45InputRef = useRef<HTMLInputElement>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);

  // Detecta dispositivo móvel real via userAgent
  const isMobileDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);

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

  const handleFile = useCallback(async (file: File) => {
    // Validação de tipo - aceitar imagens E arquivos sem tipo (HEIC no Safari)
    if (!file.type.startsWith('image/') && file.type !== '' && file.type !== 'application/octet-stream') {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 10MB');
      return;
    }

    setIsCompressing(true);

    try {
      let processedBlob: File | Blob = file;

      // Verificar se é HEIC usando a nova biblioteca
      const fileIsHeic = await checkIsHeic(file);

      if (fileIsHeic) {
        toast.info('Convertendo foto do iPhone...');
        processedBlob = await convertHeicToJpeg(file);
      }

      // Comprimir a imagem
      const compressedBase64 = await compressImage(processedBlob);
      onImageChange(compressedBase64);

    } catch {
      // Fallback: tentar conversão automática do Safari
      try {
        const base64 = await readFileAsDataURL(file);

        // Se o Safari converteu automaticamente para JPEG/PNG
        if (base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/png')) {
          onImageChange(base64);
          toast.info('Imagem carregada com conversão automática');
          return;
        }

        toast.error('Erro ao processar imagem. Tente tirar a foto novamente ou envie como JPG.');
      } catch {
        toast.error('Não foi possível processar esta foto. Tente enviar como JPG ou usar a câmera diretamente.');
      }
    } finally {
      setIsCompressing(false);
    }
  }, [onImageChange]);

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
      toast.error('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 10MB');
      return;
    }

    setProcessingOptional(type);

    try {
      let processedBlob: File | Blob = file;

      const fileIsHeic = await checkIsHeic(file);
      if (fileIsHeic) {
        processedBlob = await convertHeicToJpeg(file);
      }

      const compressedBase64 = await compressImage(processedBlob);

      if (onAdditionalPhotosChange) {
        onAdditionalPhotosChange({
          ...additionalPhotos,
          [type]: compressedBase64,
        });
      }

      toast.success(type === 'smile45' ? 'Foto 45° adicionada' : 'Foto de face adicionada');
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
        toast.error('Erro ao processar foto opcional');
      } catch {
        toast.error('Erro ao processar foto');
      }
    } finally {
      setProcessingOptional(null);
    }
  }, [additionalPhotos, onAdditionalPhotosChange]);

  const handleOptionalFileChange = (type: 'smile45' | 'face') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleOptionalFile(e.target.files[0], type);
    }
  };

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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold font-display mb-2">Foto Intraoral</h2>
        <p className="text-muted-foreground">
          Envie uma foto da cavidade para análise automática com IA
        </p>
      </div>

      {!imageBase64 ? (
        /* Premium Drop Zone */
        <div
          className={`relative rounded-xl p-[2px] transition-all duration-300 ${
            dragActive
              ? 'bg-gradient-to-br from-primary via-primary/60 to-primary/30 scale-[1.02]'
              : 'bg-gradient-to-br from-primary/20 via-transparent to-primary/10'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="bg-card rounded-[11px] grain-overlay">
            <div className="py-16 px-4">
              {isCompressing ? (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    Processando imagem...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Otimizando para análise
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Camera className="w-10 h-10 text-primary animate-[float_3s_ease-in-out_infinite]" />
                  </div>

                  <h3 className="text-lg font-medium mb-2">
                    Arraste uma foto aqui
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {showCameraButton ? 'ou escolha uma foto existente ou tire uma nova' : 'ou escolha uma foto do seu dispositivo'}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="default"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-press"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Escolher da Galeria
                    </Button>
                    {showCameraButton && (
                      <Button
                        variant="outline"
                        onClick={() => cameraInputRef.current?.click()}
                        className="btn-press"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Tirar Foto
                      </Button>
                    )}
                  </div>

                  {/* Format chips */}
                  <div className="flex items-center gap-2 mt-6">
                    {['JPG', 'PNG', 'HEIC', '10MB'].map((fmt) => (
                      <Badge key={fmt} variant="outline" className="text-xs font-normal">
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
                alt="Foto intraoral"
                className="w-full max-h-[400px] object-contain ring-2 ring-primary/20 rounded-xl"
              />
              {/* Badge overlay */}
              <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground border border-border/50">
                <Camera className="w-3 h-3 mr-1" />
                Intraoral
              </Badge>
              {/* Frosted glass remove button */}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background/90 border border-border/50"
                onClick={handleRemove}
                aria-label="Remover foto intraoral"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input para galeria - sem capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Input para câmera - com capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Inputs ocultos para fotos opcionais */}
      <input
        ref={smile45InputRef}
        type="file"
        accept="image/*"
        onChange={handleOptionalFileChange('smile45')}
        className="hidden"
      />
      <input
        ref={faceInputRef}
        type="file"
        accept="image/*"
        onChange={handleOptionalFileChange('face')}
        className="hidden"
      />

      {/* Fotos adicionais — always visible after main photo (dimmed if empty) */}
      {imageBase64 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Fotos adicionais — melhoram a análise de proporções
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
                        alt="Sorriso 45°"
                        className="w-full h-24 object-cover rounded-lg ring-1 ring-primary/20"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 bg-background/80 backdrop-blur-sm"
                        onClick={() => removeOptionalPhoto('smile45')}
                        aria-label="Remover foto 45°"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <Badge className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm text-foreground text-[10px] border border-border/50">
                        Sorriso 45°
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
                          <span className="text-xs font-medium">Sorriso 45°</span>
                          <span className="text-[10px]">Opcional</span>
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
                        alt="Face completa"
                        className="w-full h-24 object-cover rounded-lg ring-1 ring-primary/20"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 bg-background/80 backdrop-blur-sm"
                        onClick={() => removeOptionalPhoto('face')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <Badge className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm text-foreground text-[10px] border border-border/50">
                        Face
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
                          <span className="text-xs font-medium">Face Completa</span>
                          <span className="text-[10px]">Opcional</span>
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

      {/* CTA — Quick Case (primary) + Full Flow (secondary) */}
      {imageBase64 && (
        <div className="flex flex-col items-center gap-3">
          {onQuickCase && (
            <div className="flex flex-col items-center gap-1">
              <Button
                size="lg"
                onClick={onQuickCase}
                disabled={isUploading}
                className="btn-glow-gold btn-press font-semibold text-base min-w-[240px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Análise Rápida com IA
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground/70">
                1 crédito — resultado em segundos
              </p>
            </div>
          )}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAnalyze}
              disabled={isUploading}
              className="text-muted-foreground hover:text-foreground btn-press"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Análise Completa (3 créditos)
            </Button>
            <p className="text-[10px] text-muted-foreground/70">
              Inclui preferências e simulação DSD
            </p>
          </div>
        </div>
      )}

      {/* Tips — Discrete card with gold accent stripe */}
      <div className="border-l-2 border-primary/30 pl-4 py-2">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-primary/50 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">Dicas para melhor análise</p>
            <ul className="text-xs text-muted-foreground/80 space-y-0.5">
              <li>Foto bem iluminada e focada na cavidade</li>
              <li>Dentes limpos e secos para melhor visualização</li>
              <li>Escala VITA próxima ao dente, se disponível</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
