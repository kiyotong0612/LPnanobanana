import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';

interface SettingsState extends AppSettings {
  // アクション
  setGeminiApiKey: (key: string) => void;
  setVercelToken: (token: string) => void;
  setVercelTeamId: (teamId: string) => void;
  clearSettings: () => void;
  hasGeminiApiKey: () => boolean;
  hasVercelToken: () => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // 初期状態
      geminiApiKey: '',
      vercelToken: '',
      vercelTeamId: '',

      // アクション
      setGeminiApiKey: (key: string) => set({ geminiApiKey: key }),
      setVercelToken: (token: string) => set({ vercelToken: token }),
      setVercelTeamId: (teamId: string) => set({ vercelTeamId: teamId }),

      clearSettings: () =>
        set({
          geminiApiKey: '',
          vercelToken: '',
          vercelTeamId: '',
        }),

      hasGeminiApiKey: () => {
        const { geminiApiKey } = get();
        return geminiApiKey.length > 0;
      },

      hasVercelToken: () => {
        const { vercelToken } = get();
        return vercelToken.length > 0;
      },
    }),
    {
      name: 'lp-generator-settings',
      // セキュリティ: ローカルストレージのみに保存（サーバーには送信しない）
      partialize: (state) => ({
        geminiApiKey: state.geminiApiKey,
        vercelToken: state.vercelToken,
        vercelTeamId: state.vercelTeamId,
      }),
    }
  )
);
