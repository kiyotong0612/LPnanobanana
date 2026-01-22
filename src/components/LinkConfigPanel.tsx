'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Link2, Trash2, ExternalLink, Plus, X, MousePointer2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLPStore } from '@/store/lpStore';
import type { EditRegion, ClickableRegion } from '@/types';
import { cn } from '@/lib/utils';

interface LinkConfigPanelProps {
  imageSrc: string;
}

export function LinkConfigPanel({ imageSrc }: LinkConfigPanelProps) {
  const {
    clickableRegions,
    addClickableRegion,
    updateClickableRegion,
    removeClickableRegion,
  } = useLPStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<EditRegion | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<EditRegion | null>(null);

  // フォーム入力
  const [formUrl, setFormUrl] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formNewTab, setFormNewTab] = useState(false);

  // 選択中の領域が変わったらフォームを更新
  useEffect(() => {
    if (selectedRegionId) {
      const region = clickableRegions.find((r) => r.id === selectedRegionId);
      if (region) {
        setFormUrl(region.url);
        setFormLabel(region.label);
        setFormNewTab(region.openInNewTab);
        setShowForm(true);
      }
    }
  }, [selectedRegionId, clickableRegions]);

  // マウス座標を相対座標に変換
  const getRelativePosition = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      return { x, y };
    },
    []
  );

  // マウスダウン
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = getRelativePosition(e);

      // 既存の領域をクリックしたかチェック
      const clickedRegion = clickableRegions.find((r) => {
        const { region } = r;
        return (
          pos.x >= region.x &&
          pos.x <= region.x + region.width &&
          pos.y >= region.y &&
          pos.y <= region.y + region.height
        );
      });

      if (clickedRegion) {
        setSelectedRegionId(clickedRegion.id);
        setPendingRegion(null);
        return;
      }

      // 新しい領域の描画を開始
      setSelectedRegionId(null);
      setShowForm(false);
      setIsDrawing(true);
      setStartPos(pos);
      setCurrentRect(null);
    },
    [clickableRegions, getRelativePosition]
  );

  // マウス移動
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDrawing || !startPos) return;

      const pos = getRelativePosition(e);
      const x = Math.min(startPos.x, pos.x);
      const y = Math.min(startPos.y, pos.y);
      const width = Math.abs(pos.x - startPos.x);
      const height = Math.abs(pos.y - startPos.y);

      setCurrentRect({ x, y, width, height });
    },
    [isDrawing, startPos, getRelativePosition]
  );

  // マウスアップ
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentRect) {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentRect(null);
      return;
    }

    // 最小サイズチェック
    if (currentRect.width >= 0.02 && currentRect.height >= 0.02) {
      setPendingRegion(currentRect);
      setFormUrl('');
      setFormLabel('');
      setFormNewTab(false);
      setShowForm(true);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null);
  }, [isDrawing, currentRect]);

  // グローバルイベントリスナー
  useEffect(() => {
    if (isDrawing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDrawing, handleMouseMove, handleMouseUp]);

  // リンク追加/更新
  const handleSaveLink = () => {
    if (!formUrl.trim()) return;

    if (selectedRegionId) {
      // 既存の領域を更新
      updateClickableRegion(selectedRegionId, {
        url: formUrl,
        label: formLabel || formUrl,
        openInNewTab: formNewTab,
      });
    } else if (pendingRegion) {
      // 新しい領域を追加
      addClickableRegion(
        pendingRegion,
        'link',
        formUrl,
        formLabel || formUrl,
        formNewTab
      );
      setPendingRegion(null);
    }

    setShowForm(false);
    setSelectedRegionId(null);
    setFormUrl('');
    setFormLabel('');
    setFormNewTab(false);
  };

  // キャンセル
  const handleCancel = () => {
    setShowForm(false);
    setSelectedRegionId(null);
    setPendingRegion(null);
    setFormUrl('');
    setFormLabel('');
    setFormNewTab(false);
  };

  // 領域のスタイル
  const getRegionStyle = (clickableRegion: ClickableRegion, isSelected: boolean) => {
    const { region, style } = clickableRegion;
    const isButton = clickableRegion.type === 'button' && style;

    if (isButton) {
      // ボタンの場合は実際の色で表示
      return {
        left: `${region.x * 100}%`,
        top: `${region.y * 100}%`,
        width: `${region.width * 100}%`,
        height: `${region.height * 100}%`,
        backgroundColor: style.backgroundColor,
        border: isSelected ? '3px solid #f59e0b' : '2px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '8px',
        opacity: isSelected ? 1 : 0.9,
        boxShadow: isSelected ? '0 0 0 3px rgba(245, 158, 11, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
      };
    }

    // リンクの場合
    return {
      left: `${region.x * 100}%`,
      top: `${region.y * 100}%`,
      width: `${region.width * 100}%`,
      height: `${region.height * 100}%`,
      border: isSelected ? '3px solid #3b82f6' : '2px solid #3b82f6',
      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)',
    };
  };

  const detectedCount = clickableRegions.filter((r) => r.id.startsWith('detected-')).length;
  const buttonCount = clickableRegions.filter((r) => r.type === 'button').length;
  const urlMissingCount = clickableRegions.filter((r) => !r.url).length;

  return (
    <div className="space-y-4">
      {/* 検出結果の表示 */}
      {detectedCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AIが{detectedCount}個のボタンを検出しました。URLを設定してください。</span>
        </div>
      )}

      {/* 説明 */}
      <div className="text-sm text-muted-foreground">
        {buttonCount > 0
          ? '検出されたボタンにURLを設定するか、新しいリンク領域を追加できます。'
          : '画像上でドラッグしてリンク領域を設定してください。設定した領域はクリック可能になります。'}
      </div>

      {/* 画像とリンク領域 */}
      <div
        ref={containerRef}
        className="relative w-full cursor-crosshair select-none rounded-lg overflow-hidden border border-border"
        onMouseDown={handleMouseDown}
      >
        <img
          src={imageSrc}
          alt="LP画像"
          className="w-full"
          draggable={false}
        />

        {/* 既存のクリッカブル領域 */}
        {clickableRegions.map((r, index) => {
          const isButton = r.type === 'button' && r.style;
          const isDetected = r.id.startsWith('detected-');

          return (
            <div
              key={r.id}
              className="absolute pointer-events-auto"
              style={getRegionStyle(r, r.id === selectedRegionId)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRegionId(r.id);
                setPendingRegion(null);
              }}
            >
              {/* ボタンの場合はテキストを表示 */}
              {isButton && (
                <div
                  className="absolute inset-0 flex items-center justify-center font-bold text-xs pointer-events-none"
                  style={{ color: r.style?.textColor || '#fff' }}
                >
                  {r.label}
                </div>
              )}

              {/* バッジ */}
              <span
                className={cn(
                  'absolute -top-2 -left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md z-10 flex items-center gap-1',
                  isButton ? 'bg-amber-500' : 'bg-blue-500'
                )}
              >
                {isDetected && <Sparkles className="w-2.5 h-2.5" />}
                {isButton ? <MousePointer2 className="w-2.5 h-2.5" /> : <Link2 className="w-2.5 h-2.5" />}
                {index + 1}
              </span>

              {/* URLが未設定の場合の警告 */}
              {!r.url && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  URL未設定
                </span>
              )}

              {/* 削除ボタン */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full p-0 hover:bg-destructive/90 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  removeClickableRegion(r.id);
                  if (selectedRegionId === r.id) {
                    setSelectedRegionId(null);
                    setShowForm(false);
                  }
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          );
        })}

        {/* 描画中/pending領域 */}
        {(currentRect || pendingRegion) && (
          <div
            className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20 pointer-events-none"
            style={{
              left: `${(currentRect || pendingRegion)!.x * 100}%`,
              top: `${(currentRect || pendingRegion)!.y * 100}%`,
              width: `${(currentRect || pendingRegion)!.width * 100}%`,
              height: `${(currentRect || pendingRegion)!.height * 100}%`,
            }}
          >
            <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md flex items-center gap-1">
              <Plus className="w-3 h-3" />
              新規
            </span>
          </div>
        )}

        {/* ヘルプテキスト */}
        {clickableRegions.length === 0 && !isDrawing && !pendingRegion && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-lg">
              ドラッグしてリンク領域を追加（またはボタン検出中...）
            </div>
          </div>
        )}
        {urlMissingCount > 0 && clickableRegions.length > 0 && !isDrawing && !pendingRegion && !showForm && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-lg">
              {urlMissingCount}個のボタンにURLが未設定です
            </div>
          </div>
        )}
      </div>

      {/* リンク設定フォーム */}
      {showForm && (
        <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              {selectedRegionId ? 'リンクを編集' : '新しいリンクを追加'}
            </h4>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">リンク先URL <span className="text-destructive">*</span></Label>
            <Input
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://example.com/purchase"
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">ラベル（アクセシビリティ用）</Label>
            <Input
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder="購入ページへ"
              className="text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="newTab"
              checked={formNewTab}
              onCheckedChange={setFormNewTab}
            />
            <Label htmlFor="newTab" className="text-xs cursor-pointer">
              新しいタブで開く
            </Label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSaveLink}
              disabled={!formUrl.trim()}
              size="sm"
              className="flex-1"
            >
              {selectedRegionId ? '更新' : '追加'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              size="sm"
            >
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* リンク一覧 */}
      {clickableRegions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">
            設定済み ({clickableRegions.length}) -
            {buttonCount > 0 && ` ボタン: ${buttonCount}`}
            {clickableRegions.length - buttonCount > 0 && ` リンク: ${clickableRegions.length - buttonCount}`}
          </Label>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {clickableRegions.map((r, index) => {
              const isButton = r.type === 'button' && r.style;
              const isDetected = r.id.startsWith('detected-');

              return (
                <div
                  key={r.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded border text-sm cursor-pointer transition-colors',
                    selectedRegionId === r.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-border hover:bg-muted/50',
                    !r.url && 'border-red-500/50'
                  )}
                  onClick={() => setSelectedRegionId(r.id)}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded text-white text-xs font-bold flex items-center justify-center flex-shrink-0',
                      isButton ? 'bg-amber-500' : 'bg-blue-500'
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs font-medium">{r.label}</span>
                      {isDetected && (
                        <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      )}
                      {isButton && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1 rounded">
                          ボタン
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground flex items-center gap-1">
                      {r.url ? (
                        <>
                          {r.url}
                          {r.openInNewTab && <ExternalLink className="w-3 h-3 flex-shrink-0" />}
                        </>
                      ) : (
                        <span className="text-red-500">URL未設定 - クリックして設定</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeClickableRegion(r.id);
                      if (selectedRegionId === r.id) {
                        setSelectedRegionId(null);
                        setShowForm(false);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
