'use client';

import { useCallback, useState } from 'react';
import { Upload, X, ImagePlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { processUploadedFile, revokePreviewUrl } from '@/services/imageService';
import type { UploadedImage } from '@/types';

interface ImageDropzoneProps {
  type: 'material' | 'reference';
  images: UploadedImage[];
  maxImages: number;
  onAdd: (image: UploadedImage) => void;
  onRemove: (id: string) => void;
  label: string;
  hint: string;
}

export function ImageDropzone({
  type,
  images,
  maxImages,
  onAdd,
  onRemove,
  label,
  hint,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const remainingSlots = maxImages - images.length;

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      setIsProcessing(true);

      const filesToAdd = Math.min(files.length, remainingSlots);

      try {
        for (let i = 0; i < filesToAdd; i++) {
          const file = files[i];
          try {
            const uploadedImage = await processUploadedFile(file);
            onAdd(uploadedImage);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'ファイルの処理に失敗しました');
          }
        }

        if (files.length > remainingSlots) {
          setError(`最大${maxImages}枚までです。${files.length - remainingSlots}枚は追加されませんでした。`);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [onAdd, remainingSlots, maxImages]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleRemoveImage = useCallback(
    (image: UploadedImage) => {
      revokePreviewUrl(image.previewUrl);
      onRemove(image.id);
    },
    [onRemove]
  );

  const openFileDialog = useCallback(() => {
    if (remainingSlots > 0) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/jpeg,image/png,image/webp,image/gif';
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        handleFileSelect(target.files);
      };
      input.click();
    }
  }, [handleFileSelect, remainingSlots]);

  const isMaterial = type === 'material';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm">{label}</h4>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-destructive/70 hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer',
          'transition-all duration-200',
          isDragging && 'border-[var(--banana)] bg-[var(--banana)]/5',
          !isDragging && 'border-border hover:border-[var(--banana)]/50',
          remainingSlots === 0 && 'opacity-50 cursor-not-allowed',
          isProcessing && 'pointer-events-none opacity-70',
          isMaterial ? 'bg-blue-500/5' : 'bg-purple-500/5'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload
            className={cn(
              'w-6 h-6',
              isMaterial ? 'text-blue-500' : 'text-purple-500',
              isProcessing && 'animate-bounce'
            )}
          />
          <p className="text-xs">
            {isProcessing ? '処理中...' : 'クリックまたはドラッグ&ドロップ'}
          </p>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={image.previewUrl}
                alt={`${label} ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(image);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add more placeholder */}
          {remainingSlots > 0 && (
            <div
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-[var(--banana)] transition-colors flex items-center justify-center cursor-pointer"
              onClick={openFileDialog}
            >
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
