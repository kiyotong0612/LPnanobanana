'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSettingsStore } from '@/store/settingsStore';

export function SettingsDialog() {
  const {
    geminiApiKey,
    vercelToken,
    vercelTeamId,
    setGeminiApiKey,
    setVercelToken,
    setVercelTeamId,
  } = useSettingsStore();

  const [localGeminiKey, setLocalGeminiKey] = useState('');
  const [localVercelToken, setLocalVercelToken] = useState('');
  const [localVercelTeamId, setLocalVercelTeamId] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showVercelToken, setShowVercelToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLocalGeminiKey(geminiApiKey);
    setLocalVercelToken(vercelToken);
    setLocalVercelTeamId(vercelTeamId || '');
  }, [geminiApiKey, vercelToken, vercelTeamId, open]);

  const handleSave = () => {
    setGeminiApiKey(localGeminiKey);
    setVercelToken(localVercelToken);
    setVercelTeamId(localVercelTeamId);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1000);
  };

  const maskValue = (value: string) => {
    if (!value) return '';
    if (value.length <= 8) return '*'.repeat(value.length);
    return value.slice(0, 4) + '*'.repeat(value.length - 8) + value.slice(-4);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="w-5 h-5" />
          {(!geminiApiKey || !vercelToken) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>API設定</DialogTitle>
          <DialogDescription>
            LP生成・デプロイに必要なAPIキーを設定してください。
            <br />
            <span className="text-xs text-muted-foreground">
              設定はブラウザのローカルストレージに保存されます（サーバーには送信されません）
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gemini-key">Gemini API Key</Label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                キーを取得 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                id="gemini-key"
                type={showGeminiKey ? 'text' : 'password'}
                value={showGeminiKey ? localGeminiKey : maskValue(localGeminiKey)}
                onChange={(e) => setLocalGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
              >
                {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              LP画像の生成・編集・HTML変換に使用
            </p>
          </div>

          {/* Vercel Token */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vercel-token">Vercel Access Token</Label>
              <a
                href="https://vercel.com/account/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                トークンを取得 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <Input
                id="vercel-token"
                type={showVercelToken ? 'text' : 'password'}
                value={showVercelToken ? localVercelToken : maskValue(localVercelToken)}
                onChange={(e) => setLocalVercelToken(e.target.value)}
                placeholder="..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowVercelToken(!showVercelToken)}
              >
                {showVercelToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              生成したLPをVercelにデプロイする際に使用
            </p>
          </div>

          {/* Vercel Team ID (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="vercel-team">Vercel Team ID（任意）</Label>
            <Input
              id="vercel-team"
              value={localVercelTeamId}
              onChange={(e) => setLocalVercelTeamId(e.target.value)}
              placeholder="team_..."
            />
            <p className="text-xs text-muted-foreground">
              チームにデプロイする場合のみ入力
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 bg-[var(--banana)] text-[var(--banana-foreground)] hover:bg-[var(--banana)]/90"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                保存しました
              </>
            ) : (
              '保存'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
