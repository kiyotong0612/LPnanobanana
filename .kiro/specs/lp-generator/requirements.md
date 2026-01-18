# Requirements Document

## Introduction
本プロジェクトは、Nano Banana API（Gemini 3.0 Pro）を使用して、ランディングページ（LP）のデザイン画像を生成するWebアプリケーションを構築する。LP画像は1枚ずつNano Banana APIを通じて生成される。ユーザーは素材画像、参考デザイン画像、テキスト、色指定などを入力し、縦長（9:16）のLP用デザイン画像を効率的に生成できる。

### 重要な概念の区別
- **素材画像（使ってほしい画像）**: LPに組み込む素材（商品写真、ロゴ、人物写真など）
- **参考デザイン画像（イメージするLPの画像）**: 生成したいLPの雰囲気・スタイルを示す参照画像

## Requirements

### Requirement 1: 画像アップロード機能
**Objective:** As a ユーザー, I want 素材画像と参考デザイン画像を別々にアップロードできる, so that AIが素材の使い方と目指すデザインの方向性を正しく理解できる

#### Acceptance Criteria
1. When ユーザーが素材画像をアップロードする, the LP Generator shall 素材画像エリアに画像を表示し、最大6枚まで受け付ける
2. When ユーザーが参考デザイン画像をアップロードする, the LP Generator shall 参考デザインエリアに画像を表示し、最大3枚まで受け付ける
3. When アップロードされた画像の合計が14枚を超える, the LP Generator shall エラーメッセージを表示し、追加アップロードを拒否する
4. The LP Generator shall 素材画像と参考デザイン画像を視覚的に明確に区別して表示する
5. When 画像がアップロードされる, the LP Generator shall Base64エンコードに変換してAPI送信用に準備する

### Requirement 2: テキスト入力機能
**Objective:** As a ユーザー, I want LP内に表示するテキスト情報を入力できる, so that 生成されるLPに適切なコピーが含まれる

#### Acceptance Criteria
1. The LP Generator shall メインキャッチコピー入力欄を提供する
2. The LP Generator shall サブキャッチコピー入力欄を提供する
3. The LP Generator shall 本文・説明文入力欄を提供する
4. The LP Generator shall CTA（Call To Action）ボタンのテキスト入力欄を提供する
5. Where 追加のテキストブロックが必要な場合, the LP Generator shall 動的にテキスト入力欄を追加できる機能を提供する

### Requirement 3: 画像使用方法の指定機能
**Objective:** As a ユーザー, I want 各素材画像の使い方を指定できる, so that 意図通りの配置・表現でLPが生成される

#### Acceptance Criteria
1. When 素材画像がアップロードされる, the LP Generator shall 各画像に対して使用方法の入力欄を表示する
2. The LP Generator shall 使用方法として「メインビジュアル」「背景」「アイコン」「商品画像」「人物」などの選択肢を提供する
3. The LP Generator shall 自由記述による使用方法の指定も許可する
4. When 使用方法が指定されない場合, the LP Generator shall デフォルトで「自動配置」を適用する

### Requirement 4: 色指定機能
**Objective:** As a ユーザー, I want LPの配色を指定できる, so that ブランドカラーやイメージに合った配色でLPが生成される

#### Acceptance Criteria
1. The LP Generator shall メインカラーのカラーピッカーまたはHEXコード入力欄を提供する
2. The LP Generator shall アクセントカラーのカラーピッカーまたはHEXコード入力欄を提供する
3. The LP Generator shall 背景色のカラーピッカーまたはHEXコード入力欄を提供する
4. Where 参考デザイン画像がアップロードされている場合, the LP Generator shall 参考画像から配色を抽出するオプションを提供する
5. When 色が指定されない場合, the LP Generator shall 参考デザインまたはデフォルトカラーを使用する

### Requirement 5: LP生成設定機能
**Objective:** As a ユーザー, I want 生成するLPの設定を調整できる, so that 目的に合ったサイズ・品質のLP画像が得られる

#### Acceptance Criteria
1. The LP Generator shall アスペクト比として9:16（縦長LP用）をデフォルトで設定する
2. The LP Generator shall 解像度オプション（1K / 2K / 4K）を選択可能にする
3. The LP Generator shall 生成枚数（1〜4枚）を選択可能にする
4. When 解像度が選択されない場合, the LP Generator shall デフォルトで2Kを適用する

### Requirement 6: プロンプト生成・最適化機能
**Objective:** As a ユーザー, I want 入力情報から最適なプロンプトが自動生成される, so that 高品質なLP画像が生成される

#### Acceptance Criteria
1. When 生成ボタンがクリックされる, the LP Generator shall ユーザー入力を英語の説明的プロンプトに変換する
2. The LP Generator shall プロンプトにおいてキーワード羅列ではなく場面を説明する叙述的文章を生成する
3. The LP Generator shall 素材画像の使用方法をプロンプトに反映する
4. The LP Generator shall 参考デザイン画像のスタイルをプロンプトに反映する
5. The LP Generator shall 色指定をプロンプトに含める
6. The LP Generator shall パディング（余白）を最小限に抑える指示をプロンプトに含める

### Requirement 7: Nano Banana API連携機能
**Objective:** As a システム, I want Nano Banana APIと正しく連携できる, so that LP画像を生成できる

#### Acceptance Criteria
1. The LP Generator shall Nano Banana API経由でGemini 3.0 Proモデルを使用し、LP画像を1枚ずつ生成する
2. When API呼び出しを行う, the LP Generator shall 画像をBase64エンコードして送信する
3. The LP Generator shall response_modalitiesに["TEXT", "IMAGE"]を指定する
4. The LP Generator shall image_configでaspect_ratioとimage_sizeを指定する
5. If APIエラーが発生した場合, the LP Generator shall エラーメッセージを表示し、リトライオプションを提供する
6. While API処理中, the LP Generator shall ローディング表示を行う

### Requirement 8: 生成結果表示・ダウンロード機能
**Objective:** As a ユーザー, I want 生成されたLP画像を確認しダウンロードできる, so that 生成結果を利用できる

#### Acceptance Criteria
1. When 画像生成が完了する, the LP Generator shall 生成されたLP画像をプレビュー表示する
2. The LP Generator shall 生成された各画像に対してダウンロードボタンを提供する
3. The LP Generator shall PNG形式でダウンロードを提供する
4. Where 複数枚生成された場合, the LP Generator shall 一括ダウンロード（ZIP）オプションを提供する
5. The LP Generator shall 生成履歴をセッション内で保持する

### Requirement 9: APIキー管理機能
**Objective:** As a ユーザー, I want 自分のAPIキーを安全に設定できる, so that API利用料金を自分で管理できる

#### Acceptance Criteria
1. The LP Generator shall APIキー入力欄を提供する
2. When APIキーが入力される, the LP Generator shall ローカルストレージに暗号化して保存する
3. The LP Generator shall APIキーをマスク表示（*****）する
4. If APIキーが未設定の場合, the LP Generator shall 生成機能を無効化し、設定を促すメッセージを表示する
5. The LP Generator shall APIキーをサーバーに送信せず、クライアントサイドで直接API呼び出しを行う

### Requirement 10: UI/UX要件
**Objective:** As a ユーザー, I want 直感的で使いやすいインターフェースを利用できる, so that 迷わずLP生成ができる

#### Acceptance Criteria
1. The LP Generator shall レスポンシブデザインでPC・タブレット・スマートフォンに対応する
2. The LP Generator shall 入力ステップを視覚的にガイドするウィザード形式を採用する
3. The LP Generator shall ドラッグ&ドロップによる画像アップロードをサポートする
4. The LP Generator shall 各入力欄にプレースホルダーまたはヒントテキストを表示する
5. The LP Generator shall ダークモード対応を提供する
