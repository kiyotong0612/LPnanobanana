'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EditRegion } from '@/types';

interface ImageMarkerProps {
  imageSrc: string;
  regions: Array<{ id: string; region: EditRegion }>;
  selectedRegionId: string | null;
  pendingRegion?: EditRegion | null;  // 選択中（未追加）の領域
  onRegionSelect: (id: string | null) => void;
  onRegionAdd: (region: EditRegion) => void;
  onRegionRemove: (id: string) => void;
  onPendingRegionClear?: () => void;
  disabled?: boolean;
}

export function ImageMarker({
  imageSrc,
  regions,
  selectedRegionId,
  pendingRegion,
  onRegionSelect,
  onRegionAdd,
  onRegionRemove,
  onPendingRegionClear,
  disabled = false,
}: ImageMarkerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<EditRegion | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // コンテナサイズを監視
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

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

  // マウスダウン - 描画開始
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      // 既存の領域をクリックしたかチェック
      const pos = getRelativePosition(e);
      const clickedRegion = regions.find((r) => {
        const { region } = r;
        return (
          pos.x >= region.x &&
          pos.x <= region.x + region.width &&
          pos.y >= region.y &&
          pos.y <= region.y + region.height
        );
      });

      if (clickedRegion) {
        onRegionSelect(clickedRegion.id);
        return;
      }

      // 新しい領域の描画を開始
      onRegionSelect(null);
      setIsDrawing(true);
      setStartPos(pos);
      setCurrentRect(null);
    },
    [disabled, regions, getRelativePosition, onRegionSelect]
  );

  // マウス移動 - 描画中
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

  // マウスアップ - 描画終了
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentRect) {
      setIsDrawing(false);
      setStartPos(null);
      setCurrentRect(null);
      return;
    }

    // 最小サイズチェック（1%以上）
    if (currentRect.width >= 0.01 && currentRect.height >= 0.01) {
      onRegionAdd(currentRect);
    }

    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null);
  }, [isDrawing, currentRect, onRegionAdd]);

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

  // 領域のスタイルを計算
  const getRegionStyle = (region: EditRegion, isSelected: boolean) => ({
    left: `${region.x * 100}%`,
    top: `${region.y * 100}%`,
    width: `${region.width * 100}%`,
    height: `${region.height * 100}%`,
    border: isSelected ? '2px solid #f59e0b' : '2px dashed #f59e0b',
    backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full cursor-crosshair select-none"
      onMouseDown={handleMouseDown}
    >
      {/* 画像 */}
      <img
        src={imageSrc}
        alt="編集対象のLP画像"
        className="w-full rounded-lg"
        draggable={false}
      />

      {/* 既存の領域 */}
      {regions.map(({ id, region }, index) => (
        <div
          key={id}
          className="absolute pointer-events-auto"
          style={getRegionStyle(region, id === selectedRegionId)}
          onClick={(e) => {
            e.stopPropagation();
            onRegionSelect(id);
          }}
        >
          {/* 領域番号 - 左上内側に表示 */}
          <span className="absolute top-1 left-1 bg-[var(--banana)] text-[var(--banana-foreground)] text-xs font-bold px-2 py-1 rounded shadow-md z-10">
            {index + 1}
          </span>
          {/* 削除ボタン */}
          {!disabled && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full p-0 hover:bg-destructive/90 z-20"
              onClick={(e) => {
                e.stopPropagation();
                onRegionRemove(id);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}

      {/* 選択中（未追加）の領域 */}
      {pendingRegion && !currentRect && (
        <div
          className="absolute border-2 border-dashed border-amber-500 bg-amber-500/15 pointer-events-auto"
          style={{
            left: `${pendingRegion.x * 100}%`,
            top: `${pendingRegion.y * 100}%`,
            width: `${pendingRegion.width * 100}%`,
            height: `${pendingRegion.height * 100}%`,
          }}
        >
          <span className="absolute top-1 left-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
            {regions.length + 1}
          </span>
          {!disabled && onPendingRegionClear && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full p-0 hover:bg-destructive/90 z-20"
              onClick={(e) => {
                e.stopPropagation();
                onPendingRegionClear();
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* 描画中の領域 */}
      {currentRect && (
        <div
          className="absolute border-2 border-dashed border-amber-500 bg-amber-500/10 pointer-events-none"
          style={{
            left: `${currentRect.x * 100}%`,
            top: `${currentRect.y * 100}%`,
            width: `${currentRect.width * 100}%`,
            height: `${currentRect.height * 100}%`,
          }}
        >
          <span className="absolute top-1 left-1 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md opacity-80">
            {regions.length + 1}
          </span>
        </div>
      )}

      {/* ヘルプテキスト */}
      {!disabled && regions.length === 0 && !pendingRegion && !isDrawing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-lg">
            ドラッグして編集領域を選択
          </div>
        </div>
      )}
    </div>
  );
}
