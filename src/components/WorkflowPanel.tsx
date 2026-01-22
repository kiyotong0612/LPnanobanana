'use client';

import { useState, useMemo } from 'react';
import {
  Wand2,
  Rocket,
  Undo2,
  Loader2,
  Check,
  ExternalLink,
  AlertCircle,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Link2,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageMarker } from '@/components/ImageMarker';
import { LinkConfigPanel } from '@/components/LinkConfigPanel';
import { useLPStore } from '@/store/lpStore';
import { useSettingsStore } from '@/store/settingsStore';
import { cn } from '@/lib/utils';
import type { WorkflowStep, EditRegion, EditItem } from '@/types';

const steps: { id: WorkflowStep; label: string; icon: React.ReactNode }[] = [
  { id: 'edit', label: '編集', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'link', label: 'リンク設定', icon: <Link2 className="w-4 h-4" /> },
  { id: 'deploy', label: 'デプロイ', icon: <Rocket className="w-4 h-4" /> },
];

// 編集項目のステータスアイコン
function EditStatusIcon({ status }: { status: EditItem['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 text-[var(--banana)] animate-spin" />;
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return null;
  }
}

export function WorkflowPanel() {
  const {
    currentStep,
    setCurrentStep,
    combinedImage,
    isEditing,
    editHistory,
    undoEdit,
    editLP,
    editItems,
    currentEditIndex,
    addEditItem,
    removeEditItem,
    updateEditItem,
    clearEditItems,
    applyAllEdits,
    generatedHTML,
    isDeploying,
    deployedUrl,
    deploy,
    error,
    clickableRegions,
    generateDeployableHTML,
  } = useLPStore();

  const { geminiApiKey, vercelToken } = useSettingsStore();

  // ローカル状態
  const [newInstruction, setNewInstruction] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<EditRegion | null>(null);
  const [selectedEditItemId, setSelectedEditItemId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('my-landing-page');

  // 編集項目用の領域データ
  const markerRegions = useMemo(() => {
    return editItems
      .filter((item) => item.region !== null)
      .map((item) => ({
        id: item.id,
        region: item.region as EditRegion,
      }));
  }, [editItems]);

  // 編集項目を追加
  const handleAddEditItem = () => {
    if (!newInstruction.trim()) return;
    addEditItem(newInstruction, selectedRegion);
    setNewInstruction('');
    setSelectedRegion(null);
    setSelectedEditItemId(null);
  };

  // 領域が追加されたとき
  const handleRegionAdd = (region: EditRegion) => {
    setSelectedRegion(region);
    setSelectedEditItemId(null);
  };

  // 領域が選択されたとき
  const handleRegionSelect = (id: string | null) => {
    setSelectedEditItemId(id);
    if (id) {
      const item = editItems.find((it) => it.id === id);
      if (item) {
        setSelectedRegion(item.region);
      }
    } else {
      setSelectedRegion(null);
    }
  };

  // 領域が削除されたとき
  const handleRegionRemove = (id: string) => {
    removeEditItem(id);
    if (selectedEditItemId === id) {
      setSelectedEditItemId(null);
      setSelectedRegion(null);
    }
  };

  // 全ての編集を適用
  const handleApplyAll = async () => {
    await applyAllEdits();
  };

  // 直接編集を適用（編集項目に追加せず即座に実行）
  const handleDirectApply = async () => {
    if (!newInstruction.trim()) return;
    await editLP(newInstruction, selectedRegion);
    setNewInstruction('');
    setSelectedRegion(null);
    setSelectedEditItemId(null);
  };

  const handleDeploy = async () => {
    if (!projectName.trim()) return;
    await deploy(projectName);
  };

  // 画像ベースのHTMLでデプロイ
  const handleDeployWithImage = async () => {
    if (!projectName.trim()) return;
    const html = generateDeployableHTML();
    if (!html) return;

    // deploy関数に直接HTMLを渡せないので、一時的にgeneratedHTMLを設定
    useLPStore.setState({ generatedHTML: html, generatedCSS: '' });
    await deploy(projectName);
  };

  // HTMLをダウンロード
  const handleDownloadHTML = () => {
    const html = generateDeployableHTML();
    if (!html) return;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName || 'landing-page'}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const pendingCount = editItems.filter((item) => item.status === 'pending').length;
  const hasAnyProcessing = editItems.some((item) => item.status === 'processing');

  if (!combinedImage) return null;

  return (
    <Card className="glass border-border/50 p-4">
      {/* Step Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted/50 rounded-lg">
        {steps.map((step) => (
          <Button
            key={step.id}
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep(step.id)}
            className={cn(
              'flex-1 gap-2',
              currentStep === step.id && 'bg-background shadow-sm'
            )}
          >
            {step.icon}
            {step.label}
          </Button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Step */}
      {currentStep === 'edit' && (
        <div className="space-y-4">
          {/* 画像マーカー */}
          <div className="space-y-2">
            <Label>編集領域を選択（ドラッグで範囲指定）</Label>
            <ImageMarker
              imageSrc={`data:${combinedImage.mimeType};base64,${combinedImage.base64}`}
              regions={markerRegions}
              selectedRegionId={selectedEditItemId}
              pendingRegion={selectedRegion}
              onRegionSelect={handleRegionSelect}
              onRegionAdd={handleRegionAdd}
              onRegionRemove={handleRegionRemove}
              onPendingRegionClear={() => setSelectedRegion(null)}
              disabled={isEditing || hasAnyProcessing}
            />
          </div>

          {/* 新規編集項目の追加 */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selectedRegion ? '選択した領域に対する編集指示' : '画像全体に対する編集指示'}
              </span>
              {selectedRegion && (
                <span className="text-xs bg-[var(--banana)]/20 text-[var(--banana-foreground)] px-2 py-0.5 rounded">
                  領域選択中
                </span>
              )}
            </div>
            <Textarea
              value={newInstruction}
              onChange={(e) => setNewInstruction(e.target.value)}
              placeholder="例: 背景色を青に変更して、テキストを白に"
              className="min-h-[60px] resize-none"
              disabled={isEditing || hasAnyProcessing}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleDirectApply}
                disabled={!newInstruction.trim() || isEditing || hasAnyProcessing}
                className="flex-1 gap-2 bg-[var(--banana)] text-[var(--banana-foreground)] hover:bg-[var(--banana)]/90"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    編集中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    今すぐ適用
                  </>
                )}
              </Button>
              <Button
                onClick={handleAddEditItem}
                disabled={!newInstruction.trim() || isEditing || hasAnyProcessing}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                追加
              </Button>
              {selectedRegion && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRegion(null)}
                  disabled={isEditing || hasAnyProcessing}
                >
                  解除
                </Button>
              )}
            </div>
          </div>

          {/* 編集項目リスト */}
          {editItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>編集項目（{editItems.length}件）</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearEditItems}
                  disabled={isEditing || hasAnyProcessing}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  全て削除
                </Button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {editItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-lg border',
                      item.status === 'processing' && 'border-[var(--banana)] bg-[var(--banana)]/5',
                      item.status === 'completed' && 'border-green-500/50 bg-green-500/5',
                      item.status === 'error' && 'border-destructive/50 bg-destructive/5',
                      item.status === 'pending' && 'border-border'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <EditStatusIcon status={item.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        {item.region && (
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            領域指定
                          </span>
                        )}
                      </div>
                      <p className="text-sm truncate">{item.instruction}</p>
                      {item.error && (
                        <p className="text-xs text-destructive mt-1">{item.error}</p>
                      )}
                    </div>
                    {item.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 w-6 h-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeEditItem(item.id)}
                        disabled={isEditing || hasAnyProcessing}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              onClick={handleApplyAll}
              disabled={pendingCount === 0 || isEditing || hasAnyProcessing}
              className="flex-1 gap-2 bg-[var(--banana)] text-[var(--banana-foreground)] hover:bg-[var(--banana)]/90"
            >
              {hasAnyProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  編集中... ({currentEditIndex + 1}/{editItems.filter(i => i.status !== 'completed').length})
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  全て適用（{pendingCount}件）
                </>
              )}
            </Button>
            {editHistory.length > 0 && (
              <Button
                variant="outline"
                onClick={undoEdit}
                disabled={isEditing || hasAnyProcessing}
                className="gap-2"
              >
                <Undo2 className="w-4 h-4" />
                戻す
              </Button>
            )}
          </div>

          {editHistory.length > 0 && (
            <div className="text-xs text-muted-foreground">
              編集履歴: {editHistory.length}回
            </div>
          )}
        </div>
      )}

      {/* Link Configuration Step */}
      {currentStep === 'link' && (
        <div className="space-y-4">
          <LinkConfigPanel
            imageSrc={`data:${combinedImage.mimeType};base64,${combinedImage.base64}`}
          />

          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentStep('deploy')}
              className="flex-1 gap-2 bg-[var(--banana)] text-[var(--banana-foreground)] hover:bg-[var(--banana)]/90"
            >
              <Rocket className="w-4 h-4" />
              デプロイへ進む
            </Button>
          </div>

          {clickableRegions.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {clickableRegions.length}個のリンクが設定されています
            </p>
          )}
        </div>
      )}

      {/* Deploy Step */}
      {currentStep === 'deploy' && (
        <div className="space-y-4">
          {/* プレビュー情報 */}
          <div className="p-3 bg-muted/30 rounded-lg space-y-2">
            <div className="text-sm font-medium">デプロイ内容</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-green-500" />
                LP画像（{combinedImage.width} x {combinedImage.height}px）
              </div>
              <div className="flex items-center gap-2">
                {clickableRegions.length > 0 ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-muted-foreground" />
                )}
                クリッカブル領域: {clickableRegions.length}個
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>プロジェクト名</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-landing-page"
              disabled={isDeploying}
            />
            <p className="text-xs text-muted-foreground">
              英数字とハイフンのみ使用可能
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleDeployWithImage}
              disabled={!projectName.trim() || isDeploying || !vercelToken}
              className="flex-1 gap-2 bg-[var(--banana)] text-[var(--banana-foreground)] hover:bg-[var(--banana)]/90"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  デプロイ中...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Vercelにデプロイ
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadHTML}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              HTML
            </Button>
          </div>

          {!vercelToken && (
            <p className="text-xs text-destructive">
              Vercel Access Tokenを設定してください（右上の設定アイコン）
            </p>
          )}

          {deployedUrl && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                デプロイ完了!
              </p>
              <a
                href={deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                {deployedUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
