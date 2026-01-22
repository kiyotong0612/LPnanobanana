/**
 * Image Service v2 - 簡略化版
 * 画像処理のみ（使用方法設定なし）
 */

import type { UploadedImage } from '@/types';

// Supported MIME types
const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum dimensions for API optimization
const MAX_DIMENSION = 2048;

/**
 * Validate file MIME type
 */
export function validateMimeType(file: File): {
  valid: boolean;
  message?: string;
} {
  if (!SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
    return {
      valid: false,
      message: `サポートされていない形式です。JPEG, PNG, WebP, GIF のみ対応しています。`,
    };
  }
  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): {
  valid: boolean;
  message?: string;
} {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      message: `ファイルサイズが大きすぎます（${sizeMB}MB）。10MB以下にしてください。`,
    };
  }
  return { valid: true };
}

/**
 * Validate image file
 */
export function validateImage(file: File): {
  valid: boolean;
  message?: string;
} {
  const mimeResult = validateMimeType(file);
  if (!mimeResult.valid) return mimeResult;

  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) return sizeResult;

  return { valid: true };
}

/**
 * Convert File to Base64 string
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました'));
    };

    img.src = url;
  });
}

/**
 * Resize image if needed (for API optimization)
 * Maintains aspect ratio, scales down if larger than MAX_DIMENSION
 */
export async function resizeImage(
  file: File,
  maxDimension: number = MAX_DIMENSION
): Promise<{ blob: Blob; resized: boolean; mimeType: string }> {
  const { width, height } = await getImageDimensions(file);

  // Check if resize is needed
  if (width <= maxDimension && height <= maxDimension) {
    return { blob: file, resized: false, mimeType: file.type };
  }

  // Calculate new dimensions maintaining aspect ratio
  let newWidth: number;
  let newHeight: number;

  if (width > height) {
    newWidth = maxDimension;
    newHeight = Math.round((height / width) * maxDimension);
  } else {
    newHeight = maxDimension;
    newWidth = Math.round((width / height) * maxDimension);
  }

  // Create canvas and resize
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context の取得に失敗しました');
  }

  // Load image
  const img = new Image();
  const url = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(url);

      // Draw resized image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, resized: true, mimeType: file.type });
          } else {
            reject(new Error('画像の変換に失敗しました'));
          }
        },
        file.type,
        0.9 // Quality for JPEG/WebP
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像の読み込みに失敗しました'));
    };

    img.src = url;
  });
}

/**
 * Process uploaded file and create UploadedImage object
 */
export async function processUploadedFile(file: File): Promise<UploadedImage> {
  // Validate
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  // Resize if needed
  const { blob, mimeType } = await resizeImage(file);

  // Convert to base64
  const base64 = await fileToBase64(blob);

  // Create preview URL
  const previewUrl = URL.createObjectURL(blob);

  return {
    id: crypto.randomUUID(),
    base64,
    mimeType,
    previewUrl,
  };
}

/**
 * Revoke preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}
