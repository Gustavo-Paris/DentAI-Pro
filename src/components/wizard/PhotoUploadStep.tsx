import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Image as ImageIcon, Loader2, ChevronDown, ChevronUp, User, Smile } from 'lucide-react';
import { toast } from 'sonner';
// heic-to is dynamically imported to reduce initial bundle size (20MB library)
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

export interface AdditionalPhotos {
  smile45: string | null;
  face: string | null;
}

interface PhotoUploadStepProps {
  imageBase64: string | null;
  onImageChange: (base64: string | null) => void;
  onAnalyze: () => void;
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

// Compress image to reduce payload size for API calls
// Max 1280px and quality 0.7 to ensure payloads stay under Edge Function limits
const compressImage = async (
  file: File | Blob, 
  maxWidth: number = 1280, 
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Timeout de segurança para dispositivos móveis problemáticos
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
};

export function PhotoUploadStep({
  imageBase64,
  onImageChange,
  onAnalyze,
  isUploading,
  additionalPhotos = { smile45: null, face: null },
  onAdditionalPhotosChange,
}: PhotoUploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isOptionalOpen, setIsOptionalOpen] = useState(false);
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

  const optionalPhotosCount = [additionalPhotos.smile45, additionalPhotos.face].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Foto Intraoral</h2>
        <p className="text-muted-foreground">
          Envie uma foto da cavidade para análise automática com IA
        </p>
      </div>

      {!imageBase64 ? (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="py-16">
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
                  <Camera className="w-10 h-10 text-primary" />
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
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Escolher da Galeria
                  </Button>
                  {showCameraButton && (
                    <Button
                      variant="outline"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Tirar Foto
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-6">
                  Formatos: JPG, PNG, HEIC • Máximo: 10MB
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={imageBase64}
                alt="Foto intraoral"
                className="w-full max-h-[400px] object-contain rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
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

      {/* Seção de fotos opcionais - aparece após foto principal */}
      {imageBase64 && (
        <Collapsible open={isOptionalOpen} onOpenChange={setIsOptionalOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between py-3 h-auto">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Fotos adicionais (opcional)</span>
                {optionalPhotosCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {optionalPhotosCount} foto{optionalPhotosCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs">Melhora a análise</span>
                {isOptionalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Foto 45° */}
              <Card className="border-dashed">
                <CardContent className="p-3">
                  {additionalPhotos.smile45 ? (
                    <div className="relative">
                      <img 
                        src={additionalPhotos.smile45} 
                        alt="Sorriso 45°" 
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeOptionalPhoto('smile45')}
                        aria-label="Remover foto 45°"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <span className="absolute bottom-1 left-1 bg-background/80 text-xs px-1 rounded">
                        Sorriso 45°
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => smile45InputRef.current?.click()}
                      disabled={processingOptional === 'smile45'}
                      className="w-full h-24 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
                    >
                      {processingOptional === 'smile45' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Smile className="w-5 h-5" />
                          <span className="text-xs font-medium">Sorriso 45°</span>
                          <span className="text-[10px]">Corredor bucal</span>
                        </>
                      )}
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* Foto Face */}
              <Card className="border-dashed">
                <CardContent className="p-3">
                  {additionalPhotos.face ? (
                    <div className="relative">
                      <img 
                        src={additionalPhotos.face} 
                        alt="Face completa" 
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeOptionalPhoto('face')}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <span className="absolute bottom-1 left-1 bg-background/80 text-xs px-1 rounded">
                        Face
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => faceInputRef.current?.click()}
                      disabled={processingOptional === 'face'}
                      className="w-full h-24 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
                    >
                      {processingOptional === 'face' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <User className="w-5 h-5" />
                          <span className="text-xs font-medium">Face Completa</span>
                          <span className="text-[10px]">Proporções faciais</span>
                        </>
                      )}
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Essas fotos ajudam a melhorar a análise de proporções, mas não são usadas na simulação visual.
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}

      {imageBase64 && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={onAnalyze}
            disabled={isUploading}
            className="min-w-[200px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Analisar com IA
              </>
            )}
          </Button>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium text-sm mb-2">Dicas para melhor análise:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Foto bem iluminada e focada na área da cavidade</li>
          <li>• Dentes limpos e secos para melhor visualização</li>
          <li>• Escala de cor VITA próxima ao dente (se disponível)</li>
          <li>• Afastador para melhor acesso visual (se disponível)</li>
        </ul>
      </div>
    </div>
  );
}
