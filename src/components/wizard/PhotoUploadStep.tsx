import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import heic2any from 'heic2any';

interface PhotoUploadStepProps {
  imageBase64: string | null;
  onImageChange: (base64: string | null) => void;
  onAnalyze: () => void;
  isUploading: boolean;
}

// Detecção robusta de HEIC (Safari iOS pode retornar type vazio)
const isHeicFile = (file: File): boolean => {
  const typeIsHeic = file.type === 'image/heic' || file.type === 'image/heif';
  const nameIsHeic = /\.(heic|heif)$/i.test(file.name);
  const typeIsEmpty = file.type === '' || file.type === 'application/octet-stream';
  
  // Se tipo é HEIC, ou se tipo está vazio/genérico E nome termina em .heic/.heif
  return typeIsHeic || (typeIsEmpty && nameIsHeic);
};

// Converter HEIC para JPEG usando heic2any
const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.7, // Lower quality for smaller payload
    });
    
    // heic2any pode retornar Blob ou Blob[] - garantir que é um Blob
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Criar novo File com extensão .jpg
    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([blob], newFileName, { type: 'image/jpeg' });
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    throw error;
  }
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
  file: File, 
  maxWidth: number = 1280, 
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Timeout de segurança para dispositivos móveis problemáticos
    const timeout = setTimeout(() => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Timeout loading image'));
    }, 10000);
    
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
}: PhotoUploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Detecta dispositivo móvel real via userAgent
  const isMobileDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);

  // Detecta tela pequena para funcionar no preview do Lovable
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
      let processedFile = file;
      
      // Converter HEIC para JPEG primeiro
      if (isHeicFile(file)) {
        toast.info('Convertendo foto do iPhone...');
        processedFile = await convertHeicToJpeg(file);
      }
      
      // Agora comprimir o JPEG resultante
      const compressedBase64 = await compressImage(processedFile);
      onImageChange(compressedBase64);
      
    } catch (error) {
      console.warn('Processing failed:', error);
      
      // Fallback: tentar ler original (pode não funcionar para HEIC)
      try {
        const base64 = await readFileAsDataURL(file);
        onImageChange(base64);
        toast.info('Imagem carregada sem conversão');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        toast.error('Erro ao processar imagem. Tente enviar como JPG ou PNG.');
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
  };

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
