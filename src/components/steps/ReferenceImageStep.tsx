'use client';

import { useCallback, useState } from 'react';
import { Upload, X, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLPStore } from '@/store/lpStore';
import { cn } from '@/lib/utils';
import { processUploadedFile, revokePreviewUrl } from '@/services/imageService';
import type { UploadedImage } from '@/types';

export function ReferenceImageStep() {
  const { referenceImages, addReferenceImage, removeReferenceImage } = useLPStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const maxImages = 3;
  const remainingSlots = maxImages - referenceImages.length;

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
            const uploadedImage = await processUploadedFile(file, 'reference');
            addReferenceImage(uploadedImage);
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
    [addReferenceImage, remainingSlots]
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
      removeReferenceImage(image.id);
    },
    [removeReferenceImage]
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
        <h3 className="text-lg font-semibold">参考デザインをアップロード</h3>
        <p className="text-sm text-muted-foreground">
          イメージするLPのデザイン・スタイルを示す参考画像を最大{maxImages}枚までアップロードできます
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 flex items-start gap-3">
        <Eye className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-purple-400">参考画像とは？</p>
          <p className="text-muted-foreground mt-1">
            生成したいLPの雰囲気やレイアウト、配色を示す画像です。
            AIはこれらを参考にしてデザインを生成します。
          </p>
        </div>
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
          'border-purple-400/30 hover:border-purple-400',
          'transition-all duration-300',
          isDragging && 'border-purple-400 bg-purple-500/5 scale-[1.02]',
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
              'w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center',
              'transition-transform duration-300',
              isDragging && 'scale-110'
            )}
          >
            <Upload
              className={cn(
                'w-8 h-8 text-purple-400 transition-transform',
                isProcessing && 'animate-bounce'
              )}
            />
          </div>
          <div>
            <p className="font-medium">
              {isProcessing ? '処理中...' : '参考デザインをアップロード'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PNG, JPG, WebP, GIF（各10MBまで）
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            残り <span className="font-bold text-purple-400">{remainingSlots}</span> 枚
          </p>
        </div>
      </div>

      {/* Image Grid */}
      {referenceImages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {referenceImages.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                'stagger-item relative group aspect-[9/16] rounded-lg overflow-hidden border bg-card',
                'border-purple-400/30 hover:border-purple-400/60',
                'transition-all duration-200'
              )}
            >
              <img
                src={image.previewUrl}
                alt={`参考デザイン ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
              <div className="absolute top-2 left-2 px-2 py-1 rounded bg-purple-500/90 text-white text-xs font-medium">
                参考 {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skip hint */}
      <p className="text-center text-sm text-muted-foreground">
        参考画像がない場合はスキップして次へ進めます
      </p>
    </div>
  );
}
