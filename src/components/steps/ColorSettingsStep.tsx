'use client';

import { useState } from 'react';
import { Pipette, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLPStore } from '@/store/lpStore';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  label: string;
  value?: string;
  onChange: (color: string) => void;
  description?: string;
}

function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presetColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#1ABC9C',
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <div className="flex gap-2 items-center">
        <div
          className={cn(
            'w-12 h-12 rounded-lg border-2 cursor-pointer transition-all',
            'hover:scale-105 hover:shadow-md',
            value ? 'border-border' : 'border-dashed border-muted-foreground'
          )}
          style={{ backgroundColor: value || 'transparent' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {!value && (
            <div className="w-full h-full flex items-center justify-center">
              <Pipette className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <Input
          type="text"
          placeholder="#000000"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
        />

        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded cursor-pointer"
        />
      </div>

      {isOpen && (
        <div className="grid grid-cols-6 gap-2 p-3 bg-card border rounded-lg">
          {presetColors.map((color) => (
            <button
              key={color}
              className={cn(
                'w-8 h-8 rounded-md transition-transform hover:scale-110',
                value === color && 'ring-2 ring-[var(--banana)] ring-offset-2 ring-offset-background'
              )}
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color);
                setIsOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ColorSettingsStep() {
  const { colorScheme, setColorScheme, referenceImages } = useLPStore();

  const hasReferenceImages = referenceImages.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">配色を設定</h3>
        <p className="text-sm text-muted-foreground">
          LPのカラースキームを指定してください
        </p>
      </div>

      {/* Extract from reference toggle */}
      {hasReferenceImages && (
        <div className="bg-card border rounded-lg p-4 flex items-center justify-between stagger-item">
          <div className="space-y-0.5">
            <Label className="text-base">参考画像から配色を抽出</Label>
            <p className="text-sm text-muted-foreground">
              アップロードした参考デザインから自動で配色を取得します
            </p>
          </div>
          <Switch
            checked={colorScheme.extractFromReference}
            onCheckedChange={(checked) =>
              setColorScheme({ extractFromReference: checked })
            }
          />
        </div>
      )}

      {/* Manual color selection */}
      <div
        className={cn(
          'space-y-6 transition-opacity',
          colorScheme.extractFromReference && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="stagger-item">
          <ColorPicker
            label="メインカラー"
            description="ブランドの主要カラー、見出しやボタンに使用"
            value={colorScheme.mainColor}
            onChange={(color) => setColorScheme({ mainColor: color })}
          />
        </div>

        <div className="stagger-item">
          <ColorPicker
            label="アクセントカラー"
            description="強調したい要素やホバー状態に使用"
            value={colorScheme.accentColor}
            onChange={(color) => setColorScheme({ accentColor: color })}
          />
        </div>

        <div className="stagger-item">
          <ColorPicker
            label="背景色"
            description="LPの背景に使用する色"
            value={colorScheme.backgroundColor}
            onChange={(color) => setColorScheme({ backgroundColor: color })}
          />
        </div>
      </div>

      {/* Color preview */}
      {(colorScheme.mainColor || colorScheme.accentColor || colorScheme.backgroundColor) && (
        <div className="stagger-item">
          <Label className="text-sm font-medium mb-2 block">プレビュー</Label>
          <div
            className="h-32 rounded-lg border flex items-center justify-center gap-4 p-4"
            style={{ backgroundColor: colorScheme.backgroundColor || '#ffffff' }}
          >
            <div
              className="px-4 py-2 rounded-lg font-bold"
              style={{
                backgroundColor: colorScheme.mainColor || '#000000',
                color: '#ffffff',
              }}
            >
              メイン
            </div>
            <div
              className="px-4 py-2 rounded-lg font-bold"
              style={{
                backgroundColor: colorScheme.accentColor || '#666666',
                color: '#ffffff',
              }}
            >
              アクセント
            </div>
          </div>
        </div>
      )}

      {/* Reset button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setColorScheme({
              mainColor: undefined,
              accentColor: undefined,
              backgroundColor: undefined,
              extractFromReference: false,
            })
          }
          className="gap-2 text-muted-foreground"
        >
          <RefreshCw className="w-4 h-4" />
          リセット
        </Button>
      </div>
    </div>
  );
}
