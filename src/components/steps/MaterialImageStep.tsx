'use client';

import { useCallback, useState } from 'react';
import { Upload, X, ImagePlus, AlertCircle, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useLPStore } from '@/store/lpStore';
import { cn } from '@/lib/utils';
import {
  processUploadedFile,
  revokePreviewUrl,
  getUsageOptions,
  getUsageLabel,
} from '@/services/imageService';
import type { ImageUsageType, UploadedImage } from '@/types';

export function MaterialImageStep() {
  const { materialImages, addMaterialImage, removeMaterialImage } = useLPStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const maxImages = 6;
  const remainingSlots = maxImages - materialImages.length;
  const usageOptions = getUsageOptions();

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
            const uploadedImage = await processUploadedFile(file, 'material', 'auto');
            addMaterialImage(uploadedImage);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'ファイルの処理に失敗しました');
          }
        }

        if (files.length > remainingSlots) {
          setError(`最大${maxImages}枚までです。${files.length - remainingSlots}枚のファイルは追加されませんでした。`);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [addMaterialImage, remainingSlots]
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
      removeMaterialImage(image.id);
      if (selectedImageId === image.id) {
        setSelectedImageId(null);
      }
    },
    [removeMaterialImage, selectedImageId]
  );

  const handleUsageChange = useCallback(
    (imageId: string, usage: ImageUsageType) => {
      // Update the image usage in the store
      const { materialImages } = useLPStore.getState();
      const image = materialImages.find((img) => img.id === imageId);
      if (image) {
        // Remove and re-add with updated usage
        removeMaterialImage(imageId);
        addMaterialImage({ ...image, usage, customUsage: usage === 'custom' ? '' : undefined });
      }
    },
    [addMaterialImage, removeMaterialImage]
  );

  const handleCustomUsageChange = useCallback(
    (imageId: string, customUsage: string) => {
      const { materialImages } = useLPStore.getState();
      const image = materialImages.find((img) => img.id === imageId);
      if (image) {
        removeMaterialImage(imageId);
        addMaterialImage({ ...image, customUsage });
      }
    },
    [addMaterialImage, removeMaterialImage]
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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">素材画像をアップロード</h3>
        <p className="text-sm text-muted-foreground">
          LPに使用したい画像（商品写真、ロゴ、人物など）を最大{maxImages}枚までアップロードできます
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-destructive/70 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Zone */}
      <div
        className={cn(
          'upload-zone rounded-xl p-8 text-center cursor-pointer',
          'transition-all duration-300',
          isDragging && 'border-[var(--banana)] bg-[var(--banana)]/5 scale-[1.02]',
          remainingSlots === 0 && 'opacity-50 cursor-not-allowed',
          isProcessing && 'pointer-events-none opacity-70'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'w-16 h-16 rounded-full bg-[var(--banana)]/10 flex items-center justify-center',
              'transition-transform duration-300',
              isDragging && 'scale-110'
            )}
          >
            <Upload
              className={cn(
                'w-8 h-8 text-[var(--banana)] transition-transform',
                isProcessing && 'animate-bounce'
              )}
            />
          </div>
          <div>
            <p className="font-medium">
              {isProcessing ? '処理中...' : 'クリックまたはドラッグ&ドロップ'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PNG, JPG, WebP, GIF（各10MBまで）
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            残り <span className="font-bold text-[var(--banana)]">{remainingSlots}</span> 枚
          </p>
        </div>
      </div>

      {/* Image Grid */}
      {materialImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {materialImages.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                'stagger-item relative group rounded-lg overflow-hidden border bg-card',
                'transition-all duration-200',
                selectedImageId === image.id
                  ? 'border-[var(--banana)] ring-2 ring-[var(--banana)]/30'
                  : 'border-border hover:border-[var(--banana)]/50'
              )}
            >
              {/* Image Preview */}
              <div className="aspect-square relative">
                <img
                  src={image.previewUrl}
                  alt={`素材画像 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageId(selectedImageId === image.id ? null : image.id);
                    }}
                  >
                    <Settings2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-white text-xs">
                  {index + 1}/{maxImages}
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 rounded bg-[var(--banana)]/90 text-[var(--banana-foreground)] text-xs font-medium">
                  {getUsageLabel(image.usage || 'auto')}
                </div>
              </div>

              {/* Usage Settings (Expanded) */}
              {selectedImageId === image.id && (
                <div className="p-3 border-t border-border space-y-2 bg-card/95">
                  <label className="text-xs font-medium text-muted-foreground">
                    使用方法
                  </label>
                  <Select
                    value={image.usage || 'auto'}
                    onValueChange={(value) => handleUsageChange(image.id, value as ImageUsageType)}
                  >
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {usageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {image.usage === 'custom' && (
                    <Input
                      placeholder="カスタムの使用方法を入力..."
                      value={image.customUsage || ''}
                      onChange={(e) => handleCustomUsageChange(image.id, e.target.value)}
                      className="h-8 text-xs"
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add more placeholder */}
          {remainingSlots > 0 && (
            <div
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-[var(--banana)] transition-colors flex items-center justify-center cursor-pointer"
              onClick={openFileDialog}
            >
              <ImagePlus className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Usage Legend */}
      {materialImages.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            画像をホバーして<Settings2 className="w-3 h-3 inline mx-1" />をクリックすると使用方法を変更できます
          </p>
        </div>
      )}
    </div>
  );
}
