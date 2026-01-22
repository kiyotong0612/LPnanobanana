// LP Generator v3 - MVP版 型定義

// アップロードされた画像
export interface UploadedImage {
  id: string;
  base64: string;
  mimeType: string;
  previewUrl: string;
}

// 生成されたLP画像（セクション単位）
export interface GeneratedLPImage {
  base64: string;
  mimeType: string;
}

// 結合されたLP画像（最終出力）
export interface CombinedLPImage {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
}

// LP生成リクエスト（APIに送信）
export interface GenerateLPRequest {
  description: string;
  materialImages: Array<{ base64: string; mimeType: string }>;
  referenceImages: Array<{ base64: string; mimeType: string }>;
}

// LP生成レスポンス（APIから受信）
export interface GenerateLPResponse {
  success: boolean;
  image?: { base64: string; mimeType: string };
  error?: string;
}

// LP枚数オプション（1〜12枚）
export type NumberOfSections = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

// セクションごとの設定
export interface SectionConfig {
  id: number;  // 1から始まるセクション番号
  instruction: string;  // このセクションへの指示
  materialImages: UploadedImage[];  // このセクション用の素材画像
}

// セクションごとの素材画像最大枚数
export const MAX_SECTION_MATERIAL_IMAGES = 4;

// ========== MVP新機能: 会話的編集 ==========

// 編集領域（矩形選択）
export interface EditRegion {
  x: number;      // 0-1 の相対座標（左端が0、右端が1）
  y: number;      // 0-1 の相対座標（上端が0、下端が1）
  width: number;  // 0-1 の相対幅
  height: number; // 0-1 の相対高さ
}

// 編集項目（1つの編集指示）
export interface EditItem {
  id: string;
  region: EditRegion | null;  // null の場合は画像全体
  instruction: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

// 編集履歴
export interface EditHistoryItem {
  id: string;
  instruction: string;
  region: EditRegion | null;
  beforeImage: { base64: string; mimeType: string };
  afterImage: { base64: string; mimeType: string };
  timestamp: number;
}

// 編集リクエスト
export interface EditLPRequest {
  currentImage: { base64: string; mimeType: string };
  instruction: string;
  region?: EditRegion;
}

// 編集レスポンス
export interface EditLPResponse {
  success: boolean;
  image?: { base64: string; mimeType: string };
  error?: string;
}

// ========== MVP新機能: HTML変換 ==========

// HTML変換リクエスト
export interface ConvertToHTMLRequest {
  image: { base64: string; mimeType: string };
  framework: 'html' | 'react' | 'nextjs';
  cssFramework: 'tailwind' | 'css';
}

// HTML変換レスポンス
export interface ConvertToHTMLResponse {
  success: boolean;
  html?: string;
  css?: string;
  error?: string;
}

// ========== MVP新機能: Vercelデプロイ ==========

// デプロイリクエスト
export interface DeployRequest {
  html: string;
  css?: string;
  projectName: string;
}

// デプロイレスポンス
export interface DeployResponse {
  success: boolean;
  url?: string;
  deploymentId?: string;
  error?: string;
}

// ========== 設定 ==========

export interface AppSettings {
  geminiApiKey: string;
  vercelToken: string;
  vercelTeamId?: string;
}

// ========== ワークフロー状態 ==========

export type WorkflowStep = 'generate' | 'edit' | 'html' | 'deploy';

// LP Generator 状態管理
export interface LPGeneratorState {
  // 入力
  description: string;  // 全体の説明（商品/サービス概要）
  materialImages: UploadedImage[];  // 共通素材画像（後方互換性のため残す）
  referenceImages: UploadedImage[];
  numberOfSections: NumberOfSections;
  sectionConfigs: SectionConfig[];  // セクションごとの設定

  // 生成状態
  isGenerating: boolean;
  generatedImages: GeneratedLPImage[];
  combinedImage: CombinedLPImage | null;
  error: string | null;

  // MVP新機能: 編集状態
  isEditing: boolean;
  editHistory: EditHistoryItem[];
  editItems: EditItem[];  // 複数の編集項目
  currentEditIndex: number;  // 現在処理中の編集項目インデックス

  // MVP新機能: HTML変換状態
  isConverting: boolean;
  generatedHTML: string | null;
  generatedCSS: string | null;

  // MVP新機能: デプロイ状態
  isDeploying: boolean;
  deployedUrl: string | null;

  // ワークフロー
  currentStep: WorkflowStep;

  // アクション
  setDescription: (text: string) => void;
  addMaterialImage: (image: UploadedImage) => void;
  removeMaterialImage: (id: string) => void;
  addReferenceImage: (image: UploadedImage) => void;
  removeReferenceImage: (id: string) => void;
  setNumberOfSections: (num: NumberOfSections) => void;
  generateLP: () => Promise<void>;
  reset: () => void;

  // セクションごとの設定アクション
  setSectionInstruction: (sectionId: number, instruction: string) => void;
  addSectionMaterialImage: (sectionId: number, image: UploadedImage) => void;
  removeSectionMaterialImage: (sectionId: number, imageId: string) => void;
  initializeSectionConfigs: (count: number) => void;

  // MVP新機能アクション
  setCurrentStep: (step: WorkflowStep) => void;
  editLP: (instruction: string, region?: EditRegion | null) => Promise<void>;
  undoEdit: () => void;
  convertToHTML: (framework: 'html' | 'react' | 'nextjs', cssFramework: 'tailwind' | 'css') => Promise<void>;
  deploy: (projectName: string) => Promise<void>;

  // 複数編集項目管理
  addEditItem: (instruction: string, region: EditRegion | null) => void;
  removeEditItem: (id: string) => void;
  updateEditItem: (id: string, updates: Partial<EditItem>) => void;
  clearEditItems: () => void;
  applyAllEdits: () => Promise<void>;
}

// 最大枚数制限
export const MAX_MATERIAL_IMAGES = 6;  // 素材画像: 複数可
export const MAX_REFERENCE_IMAGES = 1; // 参考LP画像: 1枚のみ
