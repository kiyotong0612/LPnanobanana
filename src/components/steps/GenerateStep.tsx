'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Loader2, Download, RotateCcw, ZoomIn, AlertCircle, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLPStore } from '@/store/lpStore';
import { cn } from '@/lib/utils';
import { generateLPImages, type GenerationProgress } from '@/services/geminiService';

export function GenerateStep() {
  const {
    materialImages,
    referenceImages,
    textContent,
    colorScheme,
    generationConfig,
    generatedImages,
    isGenerating,
    error,
    apiKey,
    setIsGenerating,
    setError,
    addGeneratedImage,
    clearGeneratedImages,
  } = useLPStore();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);

  const canGenerate = apiKey && materialImages.length > 0;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !apiKey) return;

    setIsGenerating(true);
    setError(null);
    clearGeneratedImages();

    try {
      const result = await generateLPImages(
        apiKey,
        textContent,
        colorScheme,
        materialImages,
        referenceImages,
        generationConfig,
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      if (result.success) {
        result.images.forEach((image) => {
          addGeneratedImage(image);
        });
      }

      if (result.errors.length > 0) {
        setError(result.errors.join('\n'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成に失敗しました');
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  }, [
    canGenerate,
    apiKey,
    textContent,
    colorScheme,
    materialImages,
    referenceImages,
    generationConfig,
    setIsGenerating,
    setError,
    clearGeneratedImages,
    addGeneratedImage,
  ]);

  const handleDownload = useCallback((imageId: string) => {
    const image = generatedImages.find((img) => img.id === imageId);
    if (!image) return;

    const link = document.createElement('a');
    link.href = `data:${image.mimeType};base64,${image.base64}`;
    link.download = `lp-${Date.now()}.png`;
    link.click();
  }, [generatedImages]);

  const handleDownloadAll = useCallback(async () => {
    if (generatedImages.length === 0) return;

    // Download each image with a slight delay
    for (let i = 0; i < generatedImages.length; i++) {
      const image = generatedImages[i];
      const link = document.createElement('a');
      link.href = `data:${image.mimeType};base64,${image.base64}`;
      link.download = `lp-${Date.now()}-${i + 1}.png`;
      link.click();

      if (i < generatedImages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }, [generatedImages]);

  const selectedImageData = selectedImage
    ? generatedImages.find((img) => img.id === selectedImage)
    : null;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">LP画像を生成</h3>
        <p className="text-sm text-muted-foreground">
          設定した内容でLP画像を生成します
        </p>
      </div>

      {/* API Key Warning */}
      {!apiKey && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">APIキーが設定されていません</p>
            <p className="text-sm text-muted-foreground mt-1">
              生成を開始するには、ヘッダーの🔑アイコンからAPIキーを入力してください。
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-item">
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[var(--banana)]">{materialImages.length}</p>
          <p className="text-xs text-muted-foreground">素材画像</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{referenceImages.length}</p>
          <p className="text-xs text-muted-foreground">参考画像</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[var(--banana)]">{generationConfig.imageSize}</p>
          <p className="text-xs text-muted-foreground">解像度</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[var(--banana)]">{generationConfig.numberOfImages}</p>
          <p className="text-xs text-muted-foreground">生成枚数</p>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center stagger-item">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className={cn(
            'gap-2 px-8 py-6 text-lg',
            'bg-[var(--banana)] text-[var(--banana-foreground)]',
            'hover:bg-[var(--banana)]/90',
            'glow-banana transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              LP画像を生成
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && !isGenerating && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
          <p className="text-destructive whitespace-pre-wrap">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            className="mt-2 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            再試行
          </Button>
        </div>
      )}

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div className="space-y-4 stagger-item">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">生成結果</h4>
            <div className="flex items-center gap-2 text-sm text-green-500">
              <Check className="w-4 h-4" />
              {generatedImages.length}枚生成完了
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map((image, index) => (
              <div
                key={image.id}
                className="relative group aspect-[9/16] rounded-lg overflow-hidden border border-[var(--banana)]/30 bg-card"
              >
                <img
                  src={`data:${image.mimeType};base64,${image.base64}`}
                  alt={`生成画像 ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay controls */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => setSelectedImage(image.id)}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="bg-[var(--banana)] text-[var(--banana-foreground)]"
                    onClick={() => handleDownload(image.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>

                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-[var(--banana)]/90 text-[var(--banana-foreground)] text-xs font-medium">
                  {index + 1}/{generatedImages.length}
                </div>
              </div>
            ))}
          </div>

          {/* Download All Button */}
          {generatedImages.length > 1 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleDownloadAll}
              >
                <Download className="w-4 h-4" />
                すべてダウンロード
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading Animation */}
      {isGenerating && progress && (
        <div className="text-center py-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--banana)]/10 text-[var(--banana)]">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[var(--banana)] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-[var(--banana)] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-[var(--banana)] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">{progress.message}</span>
          </div>

          {progress.status === 'generating' && (
            <div className="w-full max-w-xs mx-auto">
              <div className="h-2 bg-[var(--banana)]/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--banana)] rounded-full transition-all duration-500"
                  style={{
                    width: `${(progress.currentImage / progress.totalImages) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {progress.currentImage} / {progress.totalImages}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">画像プレビュー</DialogTitle>
          {selectedImageData && (
            <div className="relative">
              <img
                src={`data:${selectedImageData.mimeType};base64,${selectedImageData.base64}`}
                alt="Generated LP Preview"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  className="bg-[var(--banana)] text-[var(--banana-foreground)]"
                  onClick={() => handleDownload(selectedImageData.id)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
