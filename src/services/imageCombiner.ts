/**
 * Image Combiner Service
 * 複数のセクション画像を縦に結合し、1枚のLP画像を生成
 */

import type { GeneratedLPImage, CombinedLPImage } from '@/types';

/**
 * Base64画像をImageオブジェクトとして読み込む
 */
function loadImage(base64: string, mimeType: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

/**
 * 複数の画像を縦に結合して1枚のLP画像を生成
 * @param images 生成されたセクション画像の配列
 * @returns 結合されたLP画像
 */
export async function combineImages(images: GeneratedLPImage[]): Promise<CombinedLPImage> {
  if (images.length === 0) {
    throw new Error('結合する画像がありません');
  }

  // 全画像を読み込み
  const loadedImages = await Promise.all(
    images.map((img) => loadImage(img.base64, img.mimeType))
  );

  // キャンバスサイズを計算（幅は最大、高さは合計）
  const maxWidth = Math.max(...loadedImages.map((img) => img.width));
  const totalHeight = loadedImages.reduce((sum, img) => sum + img.height, 0);

  // キャンバスを作成
  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas contextの取得に失敗しました');
  }

  // 各画像を縦に並べて描画（隙間なし）
  let currentY = 0;
  for (const img of loadedImages) {
    // 画像を中央揃えで描画（幅が異なる場合）
    const x = (maxWidth - img.width) / 2;
    ctx.drawImage(img, x, currentY);
    currentY += img.height;
  }

  // PNGとして出力
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1];

  return {
    base64,
    mimeType: 'image/png',
    width: maxWidth,
    height: totalHeight,
  };
}
