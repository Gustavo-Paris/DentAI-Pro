import { useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoUploadStepProps {
  imageBase64: string | null;
  onImageChange: (base64: string | null) => void;
  onAnalyze: () => void;
  isUploading: boolean;
}

export function PhotoUploadStep({
  imageBase64,
  onImageChange,
  onAnalyze,
  isUploading,
}: PhotoUploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Detecta dispositivo móvel real via userAgent (não apenas por largura de tela)
  const isMobileDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageChange(result);
    };
    reader.readAsDataURL(file);
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
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              
              <h3 className="text-lg font-medium mb-2">
                Arraste uma foto aqui
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {isMobileDevice ? 'ou escolha uma foto existente ou tire uma nova' : 'ou escolha uma foto do seu dispositivo'}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="default"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Escolher da Galeria
                </Button>
                {isMobileDevice && (
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
