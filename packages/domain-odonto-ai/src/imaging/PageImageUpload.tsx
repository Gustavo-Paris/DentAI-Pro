'use client';

/**
 * PageImageUpload - Image upload zone
 *
 * Drag-and-drop upload area with file icon, label, preview of selected
 * image, upload progress bar, and error message display. Accepts an
 * onUpload callback with the selected file.
 *
 * @example
 * ```tsx
 * <PageImageUpload
 *   onUpload={(file) => handleUpload(file)}
 *   uploading={false}
 *   progress={0}
 * />
 * ```
 */

import { cn, tPageShell } from '@parisgroup-ai/pageshell/core';
import { Button, PageIcon } from '@parisgroup-ai/pageshell/primitives';

import type { ImageUploadState } from './types';

// =============================================================================
// Types
// =============================================================================

export interface PageImageUploadProps {
  /** Callback when a file is selected for upload */
  onUpload?: (file: File) => void;
  /** Whether an upload is currently in progress */
  uploading?: boolean;
  /** Upload progress (0-100) */
  progress?: number;
  /** Preview URL of the selected file */
  preview?: string;
  /** Error message to display */
  error?: string;
  /** Accepted MIME types */
  accept?: string;
  /** Additional CSS class names */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PageImageUpload({
  onUpload,
  uploading = false,
  progress = 0,
  preview,
  error,
  accept = 'image/*',
  className,
}: PageImageUploadProps) {
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      onUpload?.(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onUpload?.(file);
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          uploading
            ? 'border-primary/40 bg-primary/5 cursor-wait'
            : 'border-border hover:border-primary/50 hover:bg-accent/5 cursor-pointer',
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt={tPageShell('domain.odonto.imaging.upload.previewAlt', 'Upload preview')}
            className="max-h-48 rounded-md object-contain mb-3"
          />
        ) : (
          <PageIcon name="upload" className="w-10 h-10 text-muted-foreground mb-3" />
        )}

        <p className="text-sm font-medium text-foreground">
          {tPageShell('domain.odonto.imaging.upload.dragLabel', 'Drag and drop an image here')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {tPageShell('domain.odonto.imaging.upload.orBrowse', 'or click to browse')}
        </p>

        {/* Hidden file input */}
        <label className="mt-3">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <Button variant="outline" size="sm" asChild disabled={uploading}>
            <span>
              <PageIcon name="file-plus" className="w-4 h-4 mr-1.5" />
              {tPageShell('domain.odonto.imaging.upload.selectFile', 'Select file')}
            </span>
          </Button>
        </label>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{tPageShell('domain.odonto.imaging.upload.uploading', 'Uploading...')}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <PageIcon name="alert-circle" className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
