'use client';

import { useState, useEffect, useCallback } from 'react';
import { Key, Eye, EyeOff, Check, X, Loader2, Trash2, RefreshCw } from 'lucide-react';
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
import { useLPStore } from '@/store/lpStore';
import {
  saveApiKey,
  getApiKey,
  getMaskedApiKey,
  clearApiKey,
  validateApiKeyFormat,
  testApiKey,
} from '@/services/apiKeyService';
import { cn } from '@/lib/utils';

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

export function ApiKeySettings() {
  const { apiKey, setApiKey } = useLPStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing API key on mount
  const loadApiKey = useCallback(async () => {
    setIsLoading(true);
    try {
      const [key, masked] = await Promise.all([getApiKey(), getMaskedApiKey()]);
      if (key) {
        setApiKey(key);
        setMaskedKey(masked);
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setApiKey]);

  useEffect(() => {
    loadApiKey();
  }, [loadApiKey]);

  // Validate input format as user types
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setValidationStatus('idle');
    setValidationMessage(null);

    if (value.trim()) {
      const { valid, message } = validateApiKeyFormat(value);
      if (!valid && message) {
        setValidationMessage(message);
      }
    }
  };

  // Test and save API key
  const handleSave = async () => {
    const { valid, message } = validateApiKeyFormat(inputValue);
    if (!valid) {
      setValidationStatus('invalid');
      setValidationMessage(message || 'Invalid API key');
      return;
    }

    setIsSaving(true);
    setValidationStatus('validating');
    setValidationMessage('APIキーを検証中...');

    try {
      // Test the API key
      const testResult = await testApiKey(inputValue.trim());

      if (testResult.valid) {
        // Save the key
        await saveApiKey(inputValue.trim());
        const [key, masked] = await Promise.all([getApiKey(), getMaskedApiKey()]);

        if (key) {
          setApiKey(key);
          setMaskedKey(masked);
        }

        setValidationStatus('valid');
        setValidationMessage('APIキーを保存しました');
        setInputValue('');

        // Close dialog after short delay
        setTimeout(() => {
          setIsOpen(false);
          setValidationStatus('idle');
          setValidationMessage(null);
        }, 1500);
      } else {
        setValidationStatus('invalid');
        setValidationMessage(testResult.message);
      }
    } catch {
      setValidationStatus('invalid');
      setValidationMessage('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // Clear saved API key
  const handleClear = () => {
    clearApiKey();
    setApiKey(null);
    setMaskedKey(null);
    setInputValue('');
    setValidationStatus('idle');
    setValidationMessage(null);
  };

  // Revalidate existing key
  const handleRevalidate = async () => {
    if (!apiKey) return;

    setValidationStatus('validating');
    setValidationMessage('APIキーを再検証中...');

    try {
      const testResult = await testApiKey(apiKey);
      if (testResult.valid) {
        setValidationStatus('valid');
        setValidationMessage('APIキーは有効です');
      } else {
        setValidationStatus('invalid');
        setValidationMessage(testResult.message);
      }

      // Reset status after delay
      setTimeout(() => {
        setValidationStatus('idle');
        setValidationMessage(null);
      }, 3000);
    } catch {
      setValidationStatus('invalid');
      setValidationMessage('検証に失敗しました');
    }
  };

  const hasExistingKey = !!apiKey && !!maskedKey;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative',
            hasExistingKey
              ? 'text-green-500 hover:text-green-400'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Key className="w-5 h-5" />
          {hasExistingKey && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md glass-card border-[var(--banana)]/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[var(--banana)]" />
            APIキー設定
          </DialogTitle>
          <DialogDescription>
            Gemini API（Nano Banana）のAPIキーを設定してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--banana)]" />
            </div>
          ) : hasExistingKey ? (
            // Existing key view
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>保存済みのAPIキー</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
                    {showKey ? apiKey : maskedKey}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowKey(!showKey)}
                    className="shrink-0"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRevalidate}
                  disabled={validationStatus === 'validating'}
                  className="flex-1 gap-2"
                >
                  {validationStatus === 'validating' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  再検証
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClear}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  削除
                </Button>
              </div>

              {validationMessage && (
                <div
                  className={cn(
                    'flex items-center gap-2 text-sm px-3 py-2 rounded-md',
                    validationStatus === 'valid'
                      ? 'bg-green-500/10 text-green-500'
                      : validationStatus === 'invalid'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {validationStatus === 'validating' && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {validationStatus === 'valid' && <Check className="w-4 h-4" />}
                  {validationStatus === 'invalid' && <X className="w-4 h-4" />}
                  {validationMessage}
                </div>
              )}

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground">新しいキーに変更</Label>
              </div>
            </div>
          ) : (
            // Warning for no key
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
              <p className="font-medium text-destructive">APIキーが設定されていません</p>
              <p className="text-muted-foreground mt-1">
                LP画像を生成するにはAPIキーが必要です
              </p>
            </div>
          )}

          {/* Input form */}
          <div className="space-y-2">
            <Label htmlFor="apikey">
              {hasExistingKey ? '新しいAPIキー' : 'APIキー'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="apikey"
                type={showKey ? 'text' : 'password'}
                placeholder="AIza..."
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className={cn(
                  'font-mono',
                  validationStatus === 'invalid' && 'border-destructive'
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKey(!showKey)}
                className="shrink-0"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {validationMessage && !hasExistingKey && (
              <p
                className={cn(
                  'text-sm',
                  validationStatus === 'valid'
                    ? 'text-green-500'
                    : validationStatus === 'invalid'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                )}
              >
                {validationMessage}
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={!inputValue.trim() || isSaving}
            className="w-full gap-2 bg-[var(--banana)] text-[var(--banana-foreground)] hover:bg-[var(--banana)]/90"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                検証中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {hasExistingKey ? 'キーを更新' : 'キーを保存'}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            APIキーはブラウザ内で暗号化して保存されます
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
