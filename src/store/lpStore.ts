import { create } from 'zustand';

// 色を明るく/暗くするヘルパー関数
function adjustColor(hex: string, amount: number): string {
  // #を削除
  let color = hex.replace('#', '');

  // 3桁の場合は6桁に展開
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }

  // RGB値を抽出して調整
  const num = parseInt(color, 16);
  let r = Math.min(255, Math.max(0, (num >> 16) + amount));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));

  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

import type {
  UploadedImage,
  GeneratedLPImage,
  LPGeneratorState,
  NumberOfSections,
  EditHistoryItem,
  EditItem,
  EditRegion,
  WorkflowStep,
  SectionConfig,
  ClickableRegion,
  ClickableType,
} from '@/types';
import { MAX_MATERIAL_IMAGES, MAX_REFERENCE_IMAGES, MAX_SECTION_MATERIAL_IMAGES } from '@/types';
import { combineImages } from '@/services/imageCombiner';
import { useSettingsStore } from './settingsStore';

// セクション設定の初期化ヘルパー
const createInitialSectionConfigs = (count: number): SectionConfig[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    instruction: '',
    materialImages: [],
  }));
};

export const useLPStore = create<LPGeneratorState>((set, get) => ({
  // 初期状態
  description: '',
  materialImages: [],
  referenceImages: [],
  numberOfSections: 1,
  sectionConfigs: createInitialSectionConfigs(1),
  isGenerating: false,
  generatedImages: [],
  combinedImage: null,
  error: null,

  // MVP新機能: 編集状態
  isEditing: false,
  editHistory: [],
  editItems: [],
  currentEditIndex: -1,

  // MVP新機能: HTML変換状態
  isConverting: false,
  generatedHTML: null,
  generatedCSS: null,

  // MVP新機能: デプロイ状態
  isDeploying: false,
  deployedUrl: null,

  // クリッカブル領域
  clickableRegions: [],

  // ワークフロー
  currentStep: 'generate',

  // アクション
  setDescription: (text: string) => set({ description: text }),

  addMaterialImage: (image: UploadedImage) => {
    const { materialImages } = get();
    if (materialImages.length < MAX_MATERIAL_IMAGES) {
      set({ materialImages: [...materialImages, image] });
    }
  },

  removeMaterialImage: (id: string) =>
    set((state) => ({
      materialImages: state.materialImages.filter((img) => img.id !== id),
    })),

  addReferenceImage: (image: UploadedImage) => {
    const { referenceImages } = get();
    if (referenceImages.length < MAX_REFERENCE_IMAGES) {
      set({ referenceImages: [...referenceImages, image] });
    }
  },

  removeReferenceImage: (id: string) =>
    set((state) => ({
      referenceImages: state.referenceImages.filter((img) => img.id !== id),
    })),

  setNumberOfSections: (num: NumberOfSections) => {
    const { sectionConfigs } = get();
    let newConfigs: SectionConfig[];

    if (num > sectionConfigs.length) {
      // セクションが増えた場合、新しいセクションを追加
      const additionalConfigs = Array.from(
        { length: num - sectionConfigs.length },
        (_, i) => ({
          id: sectionConfigs.length + i + 1,
          instruction: '',
          materialImages: [],
        })
      );
      newConfigs = [...sectionConfigs, ...additionalConfigs];
    } else {
      // セクションが減った場合、余分なセクションを削除
      newConfigs = sectionConfigs.slice(0, num);
    }

    set({ numberOfSections: num, sectionConfigs: newConfigs });
  },

  generateLP: async () => {
    const { description, materialImages, referenceImages, numberOfSections, sectionConfigs } = get();

    // バリデーション
    if (!description.trim()) {
      set({ error: '商品/サービスの説明を入力してください' });
      return;
    }

    set({ isGenerating: true, error: null, generatedImages: [], combinedImage: null });

    const generatedImages: GeneratedLPImage[] = [];

    try {
      // 枚数分だけ生成
      for (let i = 0; i < numberOfSections; i++) {
        const sectionConfig = sectionConfigs[i];
        // セクション固有の素材がある場合はそれを使用、なければ共通素材を使用
        const sectionMaterials = sectionConfig?.materialImages.length > 0
          ? sectionConfig.materialImages
          : materialImages;

        const response = await fetch('/api/generate-lp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            sectionInstruction: sectionConfig?.instruction || '',
            materialImages: sectionMaterials.map((img) => ({
              base64: img.base64,
              mimeType: img.mimeType,
            })),
            referenceImages: referenceImages.map((img) => ({
              base64: img.base64,
              mimeType: img.mimeType,
            })),
            sectionIndex: i,
            totalSections: numberOfSections,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          set({
            isGenerating: false,
            error: data.error || `画像${i + 1}の生成に失敗しました`,
            generatedImages,
            combinedImage: null,
          });
          return;
        }

        generatedImages.push({
          base64: data.image.base64,
          mimeType: data.image.mimeType,
        });

        // 途中経過を更新
        set({ generatedImages: [...generatedImages] });

        // レート制限対策で少し待機
        if (i < numberOfSections - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // 全セクション生成完了後、画像を結合
      const combinedImage = await combineImages(generatedImages);

      set({
        generatedImages,
        combinedImage,
        clickableRegions: [], // リセット
      });

      // ボタン検出を実行（バックグラウンド）
      try {
        const detectResponse = await fetch('/api/detect-buttons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: {
              base64: combinedImage.base64,
              mimeType: combinedImage.mimeType,
            },
          }),
        });

        const detectData = await detectResponse.json();

        if (detectData.success && detectData.buttons?.length > 0) {
          // 検出されたボタンをクリッカブル領域として追加
          const detectedRegions = detectData.buttons.map((btn: {
            x: number;
            y: number;
            width: number;
            height: number;
            text: string;
            type: 'primary' | 'secondary' | 'cta';
            backgroundColor: string;
            textColor: string;
          }, index: number) => ({
            id: `detected-${Date.now()}-${index}`,
            region: {
              x: btn.x,
              y: btn.y,
              width: btn.width,
              height: btn.height,
            },
            type: 'button' as const,
            url: '',  // ユーザーが設定
            label: btn.text,
            openInNewTab: false,
            style: {
              backgroundColor: btn.backgroundColor,
              textColor: btn.textColor,
              buttonType: btn.type,
            },
          }));

          set({ clickableRegions: detectedRegions });
        }
      } catch (detectError) {
        console.error('Button detection failed:', detectError);
        // ボタン検出の失敗は無視（メイン機能には影響しない）
      }

      set({
        isGenerating: false,
        currentStep: 'edit',
      });
    } catch (error) {
      set({
        isGenerating: false,
        error:
          error instanceof Error
            ? error.message
            : 'ネットワークエラーが発生しました',
        generatedImages,
        combinedImage: null,
      });
    }
  },

  reset: () =>
    set({
      description: '',
      materialImages: [],
      referenceImages: [],
      numberOfSections: 1,
      sectionConfigs: createInitialSectionConfigs(1),
      isGenerating: false,
      generatedImages: [],
      combinedImage: null,
      error: null,
      isEditing: false,
      editHistory: [],
      editItems: [],
      currentEditIndex: -1,
      isConverting: false,
      generatedHTML: null,
      generatedCSS: null,
      isDeploying: false,
      deployedUrl: null,
      clickableRegions: [],
      currentStep: 'generate',
    }),

  // セクションごとの設定アクション
  setSectionInstruction: (sectionId: number, instruction: string) => {
    set((state) => ({
      sectionConfigs: state.sectionConfigs.map((config) =>
        config.id === sectionId ? { ...config, instruction } : config
      ),
    }));
  },

  addSectionMaterialImage: (sectionId: number, image: UploadedImage) => {
    set((state) => ({
      sectionConfigs: state.sectionConfigs.map((config) =>
        config.id === sectionId && config.materialImages.length < MAX_SECTION_MATERIAL_IMAGES
          ? { ...config, materialImages: [...config.materialImages, image] }
          : config
      ),
    }));
  },

  removeSectionMaterialImage: (sectionId: number, imageId: string) => {
    set((state) => ({
      sectionConfigs: state.sectionConfigs.map((config) =>
        config.id === sectionId
          ? { ...config, materialImages: config.materialImages.filter((img) => img.id !== imageId) }
          : config
      ),
    }));
  },

  initializeSectionConfigs: (count: number) => {
    set({ sectionConfigs: createInitialSectionConfigs(count) });
  },

  // MVP新機能アクション
  setCurrentStep: (step: WorkflowStep) => set({ currentStep: step }),

  editLP: async (instruction: string, region?: EditRegion | null) => {
    const { combinedImage } = get();
    const { geminiApiKey } = useSettingsStore.getState();

    if (!combinedImage) {
      set({ error: '編集する画像がありません' });
      return;
    }

    set({ isEditing: true, error: null });

    try {
      const response = await fetch('/api/edit-lp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentImage: {
            base64: combinedImage.base64,
            mimeType: combinedImage.mimeType,
          },
          instruction,
          region: region || undefined,
          apiKey: geminiApiKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        set({
          isEditing: false,
          error: data.error || '編集に失敗しました',
        });
        return;
      }

      // 編集履歴に追加
      const historyItem: EditHistoryItem = {
        id: Date.now().toString(),
        instruction,
        region: region || null,
        beforeImage: {
          base64: combinedImage.base64,
          mimeType: combinedImage.mimeType,
        },
        afterImage: data.image,
        timestamp: Date.now(),
      };

      // 画像サイズを取得するためにImageを使用
      const img = new Image();
      img.src = `data:${data.image.mimeType};base64,${data.image.base64}`;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      set((state) => ({
        isEditing: false,
        combinedImage: {
          base64: data.image.base64,
          mimeType: data.image.mimeType,
          width: img.width,
          height: img.height,
        },
        editHistory: [...state.editHistory, historyItem],
      }));
    } catch (error) {
      set({
        isEditing: false,
        error:
          error instanceof Error
            ? error.message
            : 'ネットワークエラーが発生しました',
      });
    }
  },

  undoEdit: () => {
    const { editHistory } = get();
    if (editHistory.length === 0) return;

    const lastEdit = editHistory[editHistory.length - 1];

    // 画像サイズを取得するためにImageを使用
    const img = new Image();
    img.src = `data:${lastEdit.beforeImage.mimeType};base64,${lastEdit.beforeImage.base64}`;
    img.onload = () => {
      set((state) => ({
        combinedImage: {
          base64: lastEdit.beforeImage.base64,
          mimeType: lastEdit.beforeImage.mimeType,
          width: img.width,
          height: img.height,
        },
        editHistory: state.editHistory.slice(0, -1),
      }));
    };
  },

  convertToHTML: async (framework: 'html' | 'react' | 'nextjs', cssFramework: 'tailwind' | 'css') => {
    const { combinedImage } = get();
    const { geminiApiKey } = useSettingsStore.getState();

    if (!combinedImage) {
      set({ error: '変換する画像がありません' });
      return;
    }

    set({ isConverting: true, error: null, generatedHTML: null, generatedCSS: null });

    try {
      const response = await fetch('/api/convert-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: {
            base64: combinedImage.base64,
            mimeType: combinedImage.mimeType,
          },
          framework,
          cssFramework,
          apiKey: geminiApiKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        set({
          isConverting: false,
          error: data.error || 'HTML変換に失敗しました',
        });
        return;
      }

      set({
        isConverting: false,
        generatedHTML: data.html,
        generatedCSS: data.css || '',
        currentStep: 'deploy',
      });
    } catch (error) {
      set({
        isConverting: false,
        error:
          error instanceof Error
            ? error.message
            : 'ネットワークエラーが発生しました',
      });
    }
  },

  deploy: async (projectName: string) => {
    const { generatedHTML, generatedCSS } = get();
    const { vercelToken, vercelTeamId } = useSettingsStore.getState();

    if (!generatedHTML) {
      set({ error: 'デプロイするHTMLがありません' });
      return;
    }

    if (!vercelToken) {
      set({ error: 'Vercel Access Tokenが設定されていません。設定画面から設定してください。' });
      return;
    }

    set({ isDeploying: true, error: null, deployedUrl: null });

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: generatedHTML,
          css: generatedCSS,
          projectName,
          vercelToken,
          vercelTeamId: vercelTeamId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        set({
          isDeploying: false,
          error: data.error || 'デプロイに失敗しました',
        });
        return;
      }

      set({
        isDeploying: false,
        deployedUrl: data.url,
      });
    } catch (error) {
      set({
        isDeploying: false,
        error:
          error instanceof Error
            ? error.message
            : 'ネットワークエラーが発生しました',
      });
    }
  },

  // 複数編集項目管理
  addEditItem: (instruction: string, region: EditRegion | null) => {
    const newItem: EditItem = {
      id: Date.now().toString(),
      region,
      instruction,
      status: 'pending',
    };
    set((state) => ({
      editItems: [...state.editItems, newItem],
    }));
  },

  removeEditItem: (id: string) => {
    set((state) => ({
      editItems: state.editItems.filter((item) => item.id !== id),
    }));
  },

  updateEditItem: (id: string, updates: Partial<EditItem>) => {
    set((state) => ({
      editItems: state.editItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  clearEditItems: () => {
    set({ editItems: [], currentEditIndex: -1 });
  },

  applyAllEdits: async () => {
    const { editItems, combinedImage, editLP } = get();

    if (!combinedImage) {
      set({ error: '編集する画像がありません' });
      return;
    }

    const pendingItems = editItems.filter((item) => item.status === 'pending');
    if (pendingItems.length === 0) {
      set({ error: '適用する編集項目がありません' });
      return;
    }

    // 順次編集を適用
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      set({ currentEditIndex: i });

      // ステータスを処理中に更新
      set((state) => ({
        editItems: state.editItems.map((it) =>
          it.id === item.id ? { ...it, status: 'processing' as const } : it
        ),
      }));

      try {
        // editLPを呼び出し（これはcombinedImageを更新する）
        await editLP(item.instruction, item.region);

        // エラーがなければ完了
        const { error } = get();
        if (error) {
          set((state) => ({
            editItems: state.editItems.map((it) =>
              it.id === item.id ? { ...it, status: 'error' as const, error: error } : it
            ),
          }));
          // エラーがあっても続行しない
          break;
        }

        // ステータスを完了に更新
        set((state) => ({
          editItems: state.editItems.map((it) =>
            it.id === item.id ? { ...it, status: 'completed' as const } : it
          ),
        }));

        // レート制限対策で少し待機（最後の項目以外）
        if (i < pendingItems.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        set((state) => ({
          editItems: state.editItems.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : '編集に失敗しました',
                }
              : it
          ),
        }));
        break;
      }
    }

    set({ currentEditIndex: -1 });
  },

  // クリッカブル領域管理
  addClickableRegion: (region: EditRegion, type: ClickableType, url: string, label: string, openInNewTab = false) => {
    const newRegion: ClickableRegion = {
      id: Date.now().toString(),
      region,
      type,
      url,
      label,
      openInNewTab,
    };
    set((state) => ({
      clickableRegions: [...state.clickableRegions, newRegion],
    }));
  },

  updateClickableRegion: (id: string, updates: Partial<Omit<ClickableRegion, 'id'>>) => {
    set((state) => ({
      clickableRegions: state.clickableRegions.map((region) =>
        region.id === id ? { ...region, ...updates } : region
      ),
    }));
  },

  removeClickableRegion: (id: string) => {
    set((state) => ({
      clickableRegions: state.clickableRegions.filter((region) => region.id !== id),
    }));
  },

  clearClickableRegions: () => {
    set({ clickableRegions: [] });
  },

  // デプロイ用HTML生成（画像+クリッカブル領域）
  generateDeployableHTML: () => {
    const { combinedImage, clickableRegions } = get();

    if (!combinedImage) {
      return '';
    }

    // 画像をBase64 data URLに変換
    const imageDataUrl = `data:${combinedImage.mimeType};base64,${combinedImage.base64}`;

    // クリッカブル領域のHTML生成
    const clickableAreasHTML = clickableRegions
      .map((region, index) => {
        const hasStyle = region.style;
        const bgColor = hasStyle?.backgroundColor || '#FF6B00';
        const textColor = hasStyle?.textColor || '#FFFFFF';
        const buttonType = hasStyle?.buttonType || 'cta';
        const isButton = region.type === 'button' && hasStyle;

        if (isButton) {
          // スタイル付きボタン（ホバー効果あり）
          const target = region.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
          return `    <a href="${region.url || '#'}" class="lp-button lp-button-${buttonType}" data-index="${index}"${target}>
      ${region.label}
    </a>`;
        } else {
          // 透明リンク
          const target = region.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
          return `    <a href="${region.url || '#'}" class="lp-link" aria-label="${region.label}" data-index="${index}"${target}></a>`;
        }
      })
      .join('\n');

    // ボタンのスタイル生成（各ボタンごとにカスタム）
    const buttonStyles = clickableRegions
      .filter((r) => r.type === 'button' && r.style)
      .map((region, index) => {
        const actualIndex = clickableRegions.findIndex((r) => r.id === region.id);
        const bgColor = region.style?.backgroundColor || '#FF6B00';
        const textColor = region.style?.textColor || '#FFFFFF';

        // ホバー時の色を計算（少し明るく）
        const hoverBg = adjustColor(bgColor, 20);

        return `
    .lp-button[data-index="${actualIndex}"] {
      top: ${region.region.y * 100}%;
      left: ${region.region.x * 100}%;
      width: ${region.region.width * 100}%;
      height: ${region.region.height * 100}%;
      background-color: ${bgColor};
      color: ${textColor};
    }
    .lp-button[data-index="${actualIndex}"]:hover {
      background-color: ${hoverBg};
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }
    .lp-button[data-index="${actualIndex}"]:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }`;
      })
      .join('\n');

    // リンクのスタイル生成
    const linkStyles = clickableRegions
      .filter((r) => r.type !== 'button' || !r.style)
      .map((region) => {
        const actualIndex = clickableRegions.findIndex((r) => r.id === region.id);
        return `
    .lp-link[data-index="${actualIndex}"] {
      top: ${region.region.y * 100}%;
      left: ${region.region.x * 100}%;
      width: ${region.region.width * 100}%;
      height: ${region.region.height * 100}%;
    }`;
      })
      .join('\n');

    // 完全なHTMLを生成
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    .lp-container {
      position: relative;
      max-width: 600px;
      margin: 0 auto;
    }
    .lp-image {
      width: 100%;
      display: block;
    }

    /* ボタン共通スタイル */
    .lp-button {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      font-weight: bold;
      font-size: clamp(12px, 2.5vw, 16px);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* 透明リンク */
    .lp-link {
      position: absolute;
      display: block;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .lp-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    /* 各ボタンの個別スタイル */
    ${buttonStyles}

    /* 各リンクの個別スタイル */
    ${linkStyles}
  </style>
</head>
<body>
  <div class="lp-container">
    <img src="${imageDataUrl}" alt="Landing Page" class="lp-image">
${clickableAreasHTML}
  </div>
</body>
</html>`;

    return html;
  },
}));
