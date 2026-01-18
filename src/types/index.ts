// LP Generator 型定義

// 画像使用タイプ
export type ImageUsageType =
  | 'main-visual'
  | 'background'
  | 'icon'
  | 'product'
  | 'person'
  | 'auto'
  | 'custom';

// アップロードされた画像
export interface UploadedImage {
  id: string;
  file: File;
  base64: string;
  type: 'material' | 'reference';
  usage?: ImageUsageType;
  customUsage?: string;
  previewUrl: string;
}

// テキストコンテンツ
export interface TextContent {
  mainCopy: string;
  subCopy: string;
  description: string;
  ctaText: string;
  additionalTexts: string[];
}

// カラースキーム
export interface ColorScheme {
  mainColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  extractFromReference?: boolean;
}

// 生成設定
export interface GenerationConfig {
  aspectRatio: '9:16';
  imageSize: '1K' | '2K' | '4K';
  numberOfImages: 1 | 2 | 3 | 4;
}

// 生成された画像
export interface GeneratedImage {
  id: string;
  base64: string;
  mimeType: string;
  generatedAt: Date;
}

// ウィザードステップ設定
export interface StepConfig {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
}

// LP生成セッション
export interface LPGenerationSession {
  materialImages: UploadedImage[];
  referenceImages: UploadedImage[];
  textContent: TextContent;
  colorScheme: ColorScheme;
  generationConfig: GenerationConfig;
  generatedImages: GeneratedImage[];
}
