'use client';

import { Monitor, Image as ImageIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useLPStore } from '@/store/lpStore';
import { cn } from '@/lib/utils';

const resolutionOptions = [
  {
    value: '1K' as const,
    label: '1K',
    description: '1080 × 1920 px',
    subtitle: '標準品質',
  },
  {
    value: '2K' as const,
    label: '2K',
    description: '1152 × 2048 px',
    subtitle: '高解像度（推奨）',
    recommended: true,
  },
  {
    value: '4K' as const,
    label: '4K',
    description: '2160 × 3840 px',
    subtitle: '最高品質',
  },
];

const countOptions = [1, 2, 3, 4] as const;

export function GenerationSettingsStep() {
  const { generationConfig, setGenerationConfig } = useLPStore();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">生成設定</h3>
        <p className="text-sm text-muted-foreground">
          生成するLP画像の解像度と枚数を設定してください
        </p>
      </div>

      {/* Aspect Ratio (Fixed) */}
      <div className="stagger-item">
        <Label className="text-base font-medium mb-3 block">アスペクト比</Label>
        <div className="bg-card border rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-20 border-2 border-[var(--banana)] rounded flex items-center justify-center bg-[var(--banana)]/10">
            <Monitor className="w-6 h-6 text-[var(--banana)]" />
          </div>
          <div>
            <p className="font-bold text-lg">9:16</p>
            <p className="text-sm text-muted-foreground">縦長LP用（固定）</p>
          </div>
        </div>
      </div>

      {/* Resolution */}
      <div className="stagger-item">
        <Label className="text-base font-medium mb-3 block">解像度</Label>
        <div className="grid grid-cols-3 gap-3">
          {resolutionOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setGenerationConfig({ imageSize: option.value })}
              className={cn(
                'relative p-4 rounded-lg border-2 text-left transition-all',
                'hover:border-[var(--banana)]/50',
                generationConfig.imageSize === option.value
                  ? 'border-[var(--banana)] bg-[var(--banana)]/10'
                  : 'border-border'
              )}
            >
              {option.recommended && (
                <span className="absolute -top-2 -right-2 bg-[var(--banana)] text-[var(--banana-foreground)] text-xs px-2 py-0.5 rounded-full font-medium">
                  推奨
                </span>
              )}
              <p className="font-bold text-xl">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              <p className="text-xs text-muted-foreground">{option.subtitle}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Number of Images */}
      <div className="stagger-item">
        <Label className="text-base font-medium mb-3 block">生成枚数</Label>
        <div className="grid grid-cols-4 gap-3">
          {countOptions.map((count) => (
            <button
              key={count}
              onClick={() => setGenerationConfig({ numberOfImages: count })}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                'hover:border-[var(--banana)]/50',
                generationConfig.numberOfImages === count
                  ? 'border-[var(--banana)] bg-[var(--banana)]/10'
                  : 'border-border'
              )}
            >
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: count }).map((_, i) => (
                  <ImageIcon
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      generationConfig.numberOfImages === count
                        ? 'text-[var(--banana)]'
                        : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
              <p className="font-bold text-center">{count}枚</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          複数枚生成すると、同じ設定で異なるバリエーションが作成されます
        </p>
      </div>

      {/* Summary */}
      <div className="stagger-item bg-card border rounded-lg p-4">
        <Label className="text-sm font-medium mb-3 block">設定サマリー</Label>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[var(--banana)]">9:16</p>
            <p className="text-xs text-muted-foreground">アスペクト比</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--banana)]">{generationConfig.imageSize}</p>
            <p className="text-xs text-muted-foreground">解像度</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--banana)]">{generationConfig.numberOfImages}</p>
            <p className="text-xs text-muted-foreground">生成枚数</p>
          </div>
        </div>
      </div>
    </div>
  );
}
