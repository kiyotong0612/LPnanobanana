import { create } from 'zustand';
import type {
  UploadedImage,
  TextContent,
  ColorScheme,
  GenerationConfig,
  GeneratedImage,
  StepConfig,
} from '@/types';

// ウィザードステート
interface WizardState {
  currentStep: number;
  steps: StepConfig[];
  canProceed: boolean;
  canGoBack: boolean;
}

// LP生成ストア
interface LPStore {
  // ウィザード状態
  wizard: WizardState;

  // 素材データ
  materialImages: UploadedImage[];
  referenceImages: UploadedImage[];
  textContent: TextContent;
  colorScheme: ColorScheme;
  generationConfig: GenerationConfig;

  // 生成結果
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  error: string | null;

  // APIキー
  apiKey: string | null;

  // アクション
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  addMaterialImage: (image: UploadedImage) => void;
  removeMaterialImage: (id: string) => void;
  addReferenceImage: (image: UploadedImage) => void;
  removeReferenceImage: (id: string) => void;
  setTextContent: (content: Partial<TextContent>) => void;
  setColorScheme: (scheme: Partial<ColorScheme>) => void;
  setGenerationConfig: (config: Partial<GenerationConfig>) => void;
  setApiKey: (key: string | null) => void;
  addGeneratedImage: (image: GeneratedImage) => void;
  clearGeneratedImages: () => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// 初期ステップ設定
const initialSteps: StepConfig[] = [
  { id: 'material', title: '素材画像', description: '使用する素材画像をアップロード', isComplete: false },
  { id: 'reference', title: '参考デザイン', description: '参考にするLP画像をアップロード', isComplete: false },
  { id: 'text', title: 'テキスト', description: 'キャッチコピーや説明文を入力', isComplete: false },
  { id: 'color', title: '色指定', description: 'カラースキームを設定', isComplete: false },
  { id: 'settings', title: '生成設定', description: '解像度と枚数を設定', isComplete: false },
  { id: 'generate', title: '生成', description: 'LP画像を生成', isComplete: false },
];

// 初期テキストコンテンツ
const initialTextContent: TextContent = {
  mainCopy: '',
  subCopy: '',
  description: '',
  ctaText: '',
  additionalTexts: [],
};

// 初期カラースキーム
const initialColorScheme: ColorScheme = {
  mainColor: undefined,
  accentColor: undefined,
  backgroundColor: undefined,
  extractFromReference: false,
};

// 初期生成設定
const initialGenerationConfig: GenerationConfig = {
  aspectRatio: '9:16',
  imageSize: '2K',
  numberOfImages: 1,
};

export const useLPStore = create<LPStore>((set, get) => ({
  // 初期状態
  wizard: {
    currentStep: 0,
    steps: initialSteps,
    canProceed: false,
    canGoBack: false,
  },
  materialImages: [],
  referenceImages: [],
  textContent: initialTextContent,
  colorScheme: initialColorScheme,
  generationConfig: initialGenerationConfig,
  generatedImages: [],
  isGenerating: false,
  error: null,
  apiKey: null,

  // アクション
  setCurrentStep: step =>
    set(state => ({
      wizard: {
        ...state.wizard,
        currentStep: step,
        canGoBack: step > 0,
        canProceed: state.wizard.steps[step]?.isComplete ?? false,
      },
    })),

  nextStep: () => {
    const { wizard } = get();
    if (wizard.currentStep < wizard.steps.length - 1) {
      set(state => ({
        wizard: {
          ...state.wizard,
          currentStep: state.wizard.currentStep + 1,
          canGoBack: true,
        },
      }));
    }
  },

  prevStep: () => {
    const { wizard } = get();
    if (wizard.currentStep > 0) {
      set(state => ({
        wizard: {
          ...state.wizard,
          currentStep: state.wizard.currentStep - 1,
          canGoBack: state.wizard.currentStep - 1 > 0,
        },
      }));
    }
  },

  addMaterialImage: image =>
    set(state => ({
      materialImages: [...state.materialImages, image],
    })),

  removeMaterialImage: id =>
    set(state => ({
      materialImages: state.materialImages.filter(img => img.id !== id),
    })),

  addReferenceImage: image =>
    set(state => ({
      referenceImages: [...state.referenceImages, image],
    })),

  removeReferenceImage: id =>
    set(state => ({
      referenceImages: state.referenceImages.filter(img => img.id !== id),
    })),

  setTextContent: content =>
    set(state => ({
      textContent: { ...state.textContent, ...content },
    })),

  setColorScheme: scheme =>
    set(state => ({
      colorScheme: { ...state.colorScheme, ...scheme },
    })),

  setGenerationConfig: config =>
    set(state => ({
      generationConfig: { ...state.generationConfig, ...config },
    })),

  setApiKey: key => set({ apiKey: key }),

  addGeneratedImage: image =>
    set(state => ({
      generatedImages: [...state.generatedImages, image],
    })),

  clearGeneratedImages: () => set({ generatedImages: [] }),

  setIsGenerating: isGenerating => set({ isGenerating }),

  setError: error => set({ error }),

  reset: () =>
    set({
      wizard: {
        currentStep: 0,
        steps: initialSteps,
        canProceed: false,
        canGoBack: false,
      },
      materialImages: [],
      referenceImages: [],
      textContent: initialTextContent,
      colorScheme: initialColorScheme,
      generationConfig: initialGenerationConfig,
      generatedImages: [],
      isGenerating: false,
      error: null,
    }),
}));
