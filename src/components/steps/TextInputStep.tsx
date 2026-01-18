'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLPStore } from '@/store/lpStore';

export function TextInputStep() {
  const { textContent, setTextContent } = useLPStore();

  const addAdditionalText = () => {
    setTextContent({
      additionalTexts: [...textContent.additionalTexts, ''],
    });
  };

  const updateAdditionalText = (index: number, value: string) => {
    const newTexts = [...textContent.additionalTexts];
    newTexts[index] = value;
    setTextContent({ additionalTexts: newTexts });
  };

  const removeAdditionalText = (index: number) => {
    const newTexts = textContent.additionalTexts.filter((_, i) => i !== index);
    setTextContent({ additionalTexts: newTexts });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">テキストを入力</h3>
        <p className="text-sm text-muted-foreground">
          LPに表示するキャッチコピーや説明文を入力してください
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Copy */}
        <div className="space-y-2 stagger-item">
          <Label htmlFor="mainCopy" className="text-base font-medium flex items-center gap-2">
            メインキャッチコピー
            <span className="text-xs text-muted-foreground font-normal">（推奨）</span>
          </Label>
          <Input
            id="mainCopy"
            placeholder="例：あなたの夢を、カタチにする"
            value={textContent.mainCopy}
            onChange={(e) => setTextContent({ mainCopy: e.target.value })}
            className="text-lg h-12"
          />
        </div>

        {/* Sub Copy */}
        <div className="space-y-2 stagger-item">
          <Label htmlFor="subCopy" className="text-base font-medium flex items-center gap-2">
            サブキャッチコピー
          </Label>
          <Input
            id="subCopy"
            placeholder="例：革新的なソリューションで、ビジネスを加速"
            value={textContent.subCopy}
            onChange={(e) => setTextContent({ subCopy: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="space-y-2 stagger-item">
          <Label htmlFor="description" className="text-base font-medium flex items-center gap-2">
            本文・説明文
          </Label>
          <Textarea
            id="description"
            placeholder="例：私たちは、お客様のビジネス課題を解決するために、最先端のテクノロジーと豊富な経験を活かしたサービスを提供しています。"
            value={textContent.description}
            onChange={(e) => setTextContent({ description: e.target.value })}
            rows={4}
          />
        </div>

        {/* CTA Text */}
        <div className="space-y-2 stagger-item">
          <Label htmlFor="ctaText" className="text-base font-medium flex items-center gap-2">
            CTAボタンテキスト
            <span className="text-xs text-muted-foreground font-normal">（推奨）</span>
          </Label>
          <Input
            id="ctaText"
            placeholder="例：今すぐ無料で始める"
            value={textContent.ctaText}
            onChange={(e) => setTextContent({ ctaText: e.target.value })}
          />
        </div>

        {/* Additional Texts */}
        <div className="space-y-3 stagger-item">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">追加テキスト</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addAdditionalText}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              追加
            </Button>
          </div>

          {textContent.additionalTexts.map((text, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder={`追加テキスト ${index + 1}`}
                value={text}
                onChange={(e) => updateAdditionalText(index, e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAdditionalText(index)}
                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {textContent.additionalTexts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
              「追加」ボタンで追加のテキストブロックを作成できます
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
