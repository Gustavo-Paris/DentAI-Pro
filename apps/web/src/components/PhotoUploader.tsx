import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { compressImage } from '@/lib/imageUtils';
import { SIGNED_URL_EXPIRY_SECONDS } from '@/lib/constants';

interface PhotoUploaderProps {
  label: string;
  description: string;
  photoType: 'frontal' | '45' | 'face';
  value: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  evaluationId?: string;
}

export default function PhotoUploader({
  label,
  description,
  photoType,
  value,
  onChange,
  userId,
  evaluationId,
}: PhotoUploaderProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('components.photoUploader.onlyImages'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('components.photoUploader.maxSize'));
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);

    try {
      // Compress image before upload
      const compressedBase64 = await compressImage(file, 1280, 0.7);
      const byteString = atob(compressedBase64.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const compressedBlob = new Blob([ab], { type: 'image/jpeg' });

      const fileName = `${userId}/${evaluationId || 'temp'}_${photoType}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('clinical-photos')
        .upload(fileName, compressedBlob, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL (result not used as we store path, not URL)
      supabase.storage
        .from('clinical-photos')
        .getPublicUrl(fileName);

      onChange(fileName);
      toast.success(t('components.photoUploader.uploadSuccess'));
    } catch (error) {
      logger.error('Upload error:', error);
      toast.error(t('components.photoUploader.uploadError'));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value) {
      try {
        await supabase.storage.from('clinical-photos').remove([value]);
      } catch (error) {
        logger.error('Error removing file:', error);
      }
    }
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from('clinical-photos')
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
    return data?.signedUrl;
  };

  // Load existing image if value is set
  useState(() => {
    if (value && !preview) {
      getSignedUrl(value).then((url) => {
        if (url) setPreview(url);
      });
    }
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Preview area */}
          <div className="relative w-24 h-24 flex-shrink-0">
            {preview ? (
              <div className="relative w-full h-full">
                <img
                  src={preview}
                  alt={label}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
                  aria-label={t('components.photoUploader.removePhoto')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-full bg-secondary rounded-lg flex items-center justify-center hover:bg-secondary/80 transition-colors"
                aria-label={uploading ? t('components.photoUploader.uploading') : t('components.photoUploader.addPhoto', { label })}
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                )}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{label}</h4>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
            
            {!preview && !uploading && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3 h-3 mr-1" />
                {t('components.photoUploader.uploadButton')}
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}
