'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useLPStore } from '@/store/lpStore';
import { MAX_SECTION_MATERIAL_IMAGES } from '@/types';
import { cn } from '@/lib/utils';

interface SectionConfigFormProps {
  sectionId: number;
  isGenerating: boolean;
}

export function SectionConfigForm({ sectionId, isGenerating }: SectionConfigFormProps) {
  const {
    sectionConfigs,
    setSectionInstruction,
    addSectionMaterialImage,
    removeSectionMaterialImage,
  } = useLPStore();

  const [isExpanded, setIsExpanded] = useState(true);

  const config = sectionConfigs.find((c) => c.id === sectionId);
  if (!config) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (config.materialImages.length >= MAX_SECTION_MATERIAL_IMAGES) break;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        addSectionMaterialImage(sectionId, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          base64,
          mimeType: file.type,
          previewUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
  };

  const getSectionTypeLabel = (index: number, total: number): string => {
    if (total === 1) return 'メインLP';
    if (index === 0) return 'ファーストビュー';
    if (index === total - 1) return 'クロージング';
    return `セクション`;
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* ヘッダー */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          'hover:bg-muted/50',
          isExpanded && 'bg-muted/30'
        )}
        disabled={isGenerating}
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--banana)] text-[var(--banana-foreground)] text-sm font-bold">
          {sectionId}
        </div>
        <div className="flex-1">
          <span className="font-medium text-sm">
            LP {sectionId}枚目
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            ({getSectionTypeLabel(sectionId - 1, sectionConfigs.length)})
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {config.materialImages.length > 0 && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              素材 {config.materialImages.length}枚
            </span>
          )}
          {config.instruction && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              指示あり
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* コンテンツ */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border">
          {/* 素材画像 */}
          <div className="space-y-2">
            <Label className="text-xs">このセクション用の素材画像</Label>
            <div className="flex flex-wrap gap-2">
              {config.materialImages.map((img) => (
                <div
                  key={img.id}
                  className="relative w-16 h-16 rounded-md overflow-hidden border border-border group"
                >
                  <img
                    src={img.previewUrl}
                    alt="素材画像"
                    className="w-full h-full object-cover"
                  />
                  {!isGenerating && (
                    <button
                      type="button"
                      onClick={() => removeSectionMaterialImage(sectionId, img.id)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {config.materialImages.length < MAX_SECTION_MATERIAL_IMAGES && (
                <label
                  className={cn(
                    'w-16 h-16 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer transition-colors',
                    'hover:border-[var(--banana)] hover:bg-[var(--banana)]/5',
                    isGenerating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <ImagePlus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">追加</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isGenerating}
                  />
                </label>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              最大{MAX_SECTION_MATERIAL_IMAGES}枚まで
            </p>
          </div>

          {/* 指示テキスト */}
          <div className="space-y-2">
            <Label className="text-xs">このセクションへの指示（任意）</Label>
            <Textarea
              value={config.instruction}
              onChange={(e) => setSectionInstruction(sectionId, e.target.value)}
              placeholder="例: ヒーローセクション、商品画像を大きく配置、キャッチコピーは「今だけ50%OFF」"
              className="min-h-[60px] text-sm resize-none"
              disabled={isGenerating}
            />
          </div>
        </div>
      )}
    </div>
  );
}
