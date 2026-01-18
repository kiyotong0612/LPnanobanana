# Research & Design Decisions

## Summary
- **Feature**: `lp-generator`
- **Discovery Scope**: New Feature（グリーンフィールド開発）
- **Key Findings**:
  - Nano Banana APIは9:16アスペクト比をサポート（LP生成に最適）
  - 最大14枚の参照画像を入力可能（素材6枚+参考3枚で十分）
  - クライアントサイドでの直接API呼び出しが可能（CORS対応済み）

## Research Log

### Nano Banana API仕様
- **Context**: LP画像生成の技術的実現可能性を調査
- **Sources Consulted**:
  - [Google AI Developers - Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
  - [Nano Banana完全ガイド](https://manabinoba.blog/nanobanana-complete-guide/)
- **Findings**:
  - モデルID: `gemini-2.5-flash-image` / `gemini-3-pro-image-preview`
  - アスペクト比: `1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9`
  - 解像度: `1K`, `2K`, `4K`（大文字K必須）
  - 画像入力: Base64エンコード、最大14枚
  - レスポンス: `response_modalities: ["TEXT", "IMAGE"]`
  - 出力: Base64エンコードされた画像バイナリ
  - SynthID透かしが自動付与
- **Implications**:
  - 9:16アスペクト比でLP縦長画像の生成が可能
  - クライアントサイドから直接API呼び出し可能

### プロンプト最適化
- **Context**: 高品質なLP画像生成のためのプロンプト戦略
- **Sources Consulted**:
  - [API経由でNano Bananaを使う最強プロンプト戦略](https://apidog.com/jp/blog/use-nano-banana-via-api-for-free-jp/)
- **Findings**:
  - キーワード羅列ではなく、場面を説明する叙述的文章が推奨
  - 英語プロンプトの方が精度が高い（日本語→英語翻訳が必要）
  - 被写体の詳細説明、環境・背景設定、照明・雰囲気、出力形式仕様を含める
- **Implications**:
  - プロンプト生成機能で日本語入力を英語に変換する必要あり
  - テンプレートベースのプロンプト生成が有効

### LPサイズ・レイアウト
- **Context**: LP画像の最適なサイズとレイアウト
- **Sources Consulted**:
  - [ランディングページのサイズで重要なポイント](https://imitsu.jp/matome/hp-design/5256030656066009)
- **Findings**:
  - PC: 横幅1000〜1200px、ファーストビュー高さ550〜650px
  - スマホ: 横幅350〜375px（画像は2倍の640〜750px）
  - 9:16アスペクト比で生成後、必要に応じてトリミング
- **Implications**:
  - 9:16比率でセクションごとに生成し、後で結合する方法も検討可能

### フロントエンド技術選定
- **Context**: Webアプリケーションの技術スタック選定
- **Sources Consulted**: 一般的なベストプラクティス
- **Findings**:
  - Next.js 14+: App Router、Server Actions（ただし今回はクライアントサイドAPI呼び出し）
  - TypeScript: 型安全性の確保
  - Tailwind CSS: 高速なUI開発
  - shadcn/ui: 高品質なUIコンポーネント
  - React Hook Form: フォーム管理
  - Zustand: 軽量な状態管理
- **Implications**:
  - モダンなReact技術スタックで開発効率を最大化

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Client-Side API Call | ブラウザから直接Gemini APIを呼び出す | サーバーレス、低コスト、シンプル | APIキーがクライアントに露出（ユーザー自身のキー使用で軽減） | 採用 |
| Backend Proxy | サーバー経由でAPI呼び出し | APIキー保護、レート制限可能 | サーバー運用コスト、複雑性増加 | 将来検討 |
| Edge Function | Vercel Edge FunctionsでAPI呼び出し | 低レイテンシ、APIキー保護 | 追加の複雑性 | 将来検討 |

## Design Decisions

### Decision: クライアントサイド直接API呼び出し
- **Context**: APIキーの管理方法とアーキテクチャ選択
- **Alternatives Considered**:
  1. バックエンドプロキシ経由 — サーバー運用が必要
  2. クライアントサイド直接呼び出し — ユーザー自身のAPIキーを使用
- **Selected Approach**: クライアントサイド直接呼び出し（ユーザーのAPIキー使用）
- **Rationale**:
  - サーバーレスでシンプルな構成
  - ユーザーが自分のAPI利用料金を管理
  - 初期MVPとして最速でリリース可能
- **Trade-offs**:
  - APIキーがクライアントに存在（ユーザー自身のキーなので許容）
  - レート制限はGoogleのAPI側で管理
- **Follow-up**: 将来的にマルチユーザー対応時はバックエンドプロキシを検討

### Decision: ウィザード形式のUI
- **Context**: 複数の入力項目（画像、テキスト、色など）を効率的に収集
- **Alternatives Considered**:
  1. 単一フォーム — すべてを1画面で入力
  2. ウィザード形式 — ステップごとに入力
- **Selected Approach**: ウィザード形式
- **Rationale**:
  - 入力項目が多いため、段階的なガイドがユーザー体験を向上
  - 各ステップで入力内容の妥当性を確認可能
- **Trade-offs**: 画面遷移が増える
- **Follow-up**: ショートカットで上級ユーザーは一括入力も可能にする

### Decision: プロンプト自動生成・翻訳
- **Context**: 日本語入力から英語プロンプトを生成する必要性
- **Alternatives Considered**:
  1. ユーザーが直接英語プロンプトを入力
  2. システムが日本語入力を英語プロンプトに変換
- **Selected Approach**: システムによる自動変換
- **Rationale**:
  - 日本語ユーザーの使いやすさ向上
  - プロンプトエンジニアリングのノウハウをシステムに組み込み
- **Trade-offs**: 翻訳精度に依存
- **Follow-up**: Gemini APIのテキスト生成機能で翻訳を実行

## Risks & Mitigations
- **Risk 1**: APIキーの漏洩リスク → ユーザー自身のキー使用、ローカルストレージでの暗号化保存
- **Risk 2**: プロンプトの翻訳品質 → テンプレートベースの構造化プロンプトで安定化
- **Risk 3**: 画像生成の品質ばらつき → 複数枚生成オプション、プレビューで確認
- **Risk 4**: API料金の予期せぬ増加 → 生成前に概算コスト表示

## References
- [Google AI Developers - Image Generation](https://ai.google.dev/gemini-api/docs/image-generation) — Nano Banana API公式ドキュメント
- [Nano Banana完全ガイド](https://manabinoba.blog/nanobanana-complete-guide/) — 使い方ガイド
- [ランディングページのサイズ](https://imitsu.jp/matome/hp-design/5256030656066009) — LPサイズのベストプラクティス
