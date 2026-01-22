'use client';

import {
  Sparkles,
  Download,
  RotateCcw,
  Loader2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ImageDropzone } from '@/components/ImageDropzone';
import { SettingsDialog } from '@/components/SettingsDialog';
import { WorkflowPanel } from '@/components/WorkflowPanel';
import { SectionConfigForm } from '@/components/SectionConfigForm';
import { useLPStore } from '@/store/lpStore';
import { MAX_REFERENCE_IMAGES, NumberOfSections } from '@/types';
import { cn } from '@/lib/utils';

export default function Home() {
  const {
    description,
    setDescription,
    referenceImages,
    addReferenceImage,
    removeReferenceImage,
    numberOfSections,
    setNumberOfSections,
    sectionConfigs,
    isGenerating,
    generatedImages,
    combinedImage,
    error,
    generateLP,
    reset,
    currentStep,
  } = useLPStore();

  const canGenerate = description.trim().length > 0 && !isGenerating;

  const handleDownloadCombined = () => {
    if (!combinedImage) return;

    const link = document.createElement('a');
    link.href = `data:${combinedImage.mimeType};base64,${combinedImage.base64}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `lp-${timestamp}.png`;
    link.click();
  };

  const sectionOptions: NumberOfSections[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">LP Generator</h1>
              <p className="text-xs text-muted-foreground">Powered by Nano Banana Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <SettingsDialog />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <Card className="border-border p-5">
              <div className="space-y-5">
                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    商品/サービスの説明 <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    placeholder={`【商品名】プレミアムコーヒー

【特徴】有機栽培、産地直送、焙煎したて

【ターゲット】30代〜50代のコーヒー好き

【LP構成の指定】※任意
・1枚目: インパクトのあるヒーロー、キャッチコピー
・2枚目: 3つの特徴をアイコン付きで紹介
・3枚目: お客様の声、実績
・4枚目: 期間限定オファー、CTAボタン`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[160px] resize-none text-sm"
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    商品やサービスの特徴、ターゲット顧客、伝えたいメッセージを入力してください。
                  </p>
                </div>

                {/* Number of Sections */}
                <div className="space-y-2">
                  <Label className="text-sm">LP枚数</Label>
                  <div className="grid grid-cols-6 gap-1">
                    {sectionOptions.map((num) => (
                      <Button
                        key={num}
                        variant={numberOfSections === num ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNumberOfSections(num)}
                        disabled={isGenerating}
                        className={cn(
                          'h-8 px-0 text-xs',
                          numberOfSections === num && 'bg-primary text-primary-foreground'
                        )}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {numberOfSections === 1
                      ? '1枚の完結したLP画像を生成'
                      : numberOfSections <= 4
                        ? `${numberOfSections}枚のセクション画像を生成`
                        : `${numberOfSections}枚の詳細LP`}
                  </p>
                </div>

                {/* Section Configs - 全てのLP枚数で表示 */}
                <div className="space-y-2">
                  <Label className="text-sm">
                    {numberOfSections === 1 ? 'LP設定' : 'セクションごとの設定'}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {numberOfSections === 1
                      ? '素材画像や具体的な指示を設定できます'
                      : '各セクションに使用する素材画像や具体的な指示を設定できます'}
                  </p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {sectionConfigs.map((config) => (
                      <SectionConfigForm
                        key={config.id}
                        sectionId={config.id}
                        isGenerating={isGenerating}
                      />
                    ))}
                  </div>
                </div>

                {/* Reference Images */}
                <ImageDropzone
                  type="reference"
                  images={referenceImages}
                  maxImages={MAX_REFERENCE_IMAGES}
                  onAdd={addReferenceImage}
                  onRemove={removeReferenceImage}
                  label="参考LP画像（任意）"
                  hint="目指すデザインの参考画像"
                />

                {/* Error Message */}
                {error && currentStep === 'generate' && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={generateLP}
                  disabled={!canGenerate}
                  className="w-full h-11 gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中... ({generatedImages.length}/{numberOfSections})
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      LP画像を生成
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Tips - 生成前のみ表示 */}
            {!combinedImage && (
              <Card className="border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">使い方</h4>
                </div>
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>1. 商品説明を入力し、LP枚数を選択</p>
                  <p>2. 参考LP画像をアップロードすると、そのスタイルを参考に生成</p>
                  <p>3. 生成後は編集、HTML変換、デプロイが可能</p>
                </div>
              </Card>
            )}
          </div>

          {/* Result Preview */}
          <div className="space-y-4">
            <Card className="border-border p-5 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">生成結果</h3>
                {combinedImage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={reset} className="h-8 gap-1.5 text-xs">
                      <RotateCcw className="w-3.5 h-3.5" />
                      リセット
                    </Button>
                    <Button size="sm" onClick={handleDownloadCombined} className="h-8 gap-1.5 text-xs">
                      <Download className="w-3.5 h-3.5" />
                      ダウンロード
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-4 overflow-auto">
                {isGenerating ? (
                  <div className="flex-1 flex items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                      <div>
                        <p className="text-sm font-medium">生成中...</p>
                        <p className="text-xs text-muted-foreground">
                          {generatedImages.length + 1} / {numberOfSections}
                        </p>
                        <div className="w-32 h-1.5 bg-muted rounded-full mx-auto mt-2 overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${(generatedImages.length / numberOfSections) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : combinedImage ? (
                  <div className="relative">
                    <img
                      src={`data:${combinedImage.mimeType};base64,${combinedImage.base64}`}
                      alt="生成されたLP画像"
                      className="w-full rounded-md border border-border"
                    />
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {combinedImage.width} x {combinedImage.height}px
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
                    <div className="text-center text-muted-foreground">
                      <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">
                        左のフォームに入力して生成
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Workflow Panel - 生成後に表示 */}
            {combinedImage && <WorkflowPanel />}

            {/* Workflow Tips - 生成後に表示 */}
            {combinedImage && (
              <Card className="border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">次のステップ</h4>
                </div>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-medium">1</span>
                    <span>編集: 領域を選択して編集指示を追加</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-medium">2</span>
                    <span>HTML変換: React/Next.js/HTMLコードに変換</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-medium">3</span>
                    <span>デプロイ: Vercelにデプロイ</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border mt-8">
        <p>LP Generator - Powered by Nano Banana Pro API</p>
      </footer>
    </div>
  );
}
