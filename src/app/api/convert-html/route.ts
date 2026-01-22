import { NextRequest, NextResponse } from 'next/server';

// Gemini 2.0 Flash (テキスト生成に最適)
const MODEL_ID = 'gemini-2.0-flash';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface ConvertHTMLRequestBody {
  image: { base64: string; mimeType: string };
  framework: 'html' | 'react' | 'nextjs';
  cssFramework: 'tailwind' | 'css';
  apiKey: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConvertHTMLRequestBody = await request.json();
    const { image, framework, cssFramework, apiKey: clientApiKey } = body;

    // APIキー: クライアントから送信された値、または環境変数を使用
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    // バリデーション
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini APIキーが設定されていません' },
        { status: 400 }
      );
    }

    if (!image || !image.base64) {
      return NextResponse.json(
        { success: false, error: '変換する画像が指定されていません' },
        { status: 400 }
      );
    }

    // フレームワーク別のプロンプト
    const frameworkInstructions = {
      html: `
- 純粋なHTML5とCSSで実装してください
- 1つのHTMLファイルに全てを含めてください（インラインスタイル or <style>タグ）
- <!DOCTYPE html>から始まる完全なHTMLを生成してください
      `,
      react: `
- React（TypeScript）コンポーネントとして実装してください
- 関数コンポーネントを使用してください
- export default function LandingPage() の形式で
- 画像はpublicフォルダに配置する想定で相対パスを使用
      `,
      nextjs: `
- Next.js（App Router, TypeScript）のページコンポーネントとして実装してください
- 'use client'ディレクティブを必要に応じて追加
- next/imageコンポーネントは使わず、通常の<img>タグを使用
- export default function LandingPage() の形式で
      `,
    };

    const cssInstructions = {
      tailwind: `
- Tailwind CSSのユーティリティクラスを使用してください
- カスタムCSSは最小限に
- レスポンシブデザインはsm:, md:, lg:プレフィックスで対応
      `,
      css: `
- 通常のCSSを使用してください
- BEM命名規則を推奨
- CSS変数を活用してテーマカラーを管理
      `,
    };

    const prompt = `
あなたはフロントエンド開発のエキスパートです。
このLP画像を解析し、以下の条件でコードに変換してください。

【フレームワーク】
${frameworkInstructions[framework]}

【CSSフレームワーク】
${cssInstructions[cssFramework]}

【重要な要件】
1. 画像のレイアウト、色、フォント、余白を可能な限り再現してください
2. レスポンシブデザイン対応（モバイル・タブレット・デスクトップ）
3. セマンティックなHTML構造を使用
4. 日本語テキストは画像から正確に読み取って使用
5. CTAボタンはクリック可能なスタイルで
6. 背景画像が必要な場合は、プレースホルダーURLを使用

【出力形式】
以下のJSON形式で出力してください:
{
  "html": "<!-- 完全なコード -->",
  "css": "/* 追加のCSS（必要な場合のみ） */"
}

コードのみを出力し、説明は不要です。
`.trim();

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: image.mimeType,
                data: image.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    };

    const url = `${API_BASE_URL}/${MODEL_ID}:generateContent?key=${apiKey}`;

    console.log('[Convert API] Sending convert request to Gemini API...');
    console.log('[Convert API] Framework:', framework, 'CSS:', cssFramework);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('[Convert API] Gemini response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Convert API] Gemini API error:', errorBody);

      if (response.status === 429) {
        return NextResponse.json(
          { success: false, error: 'レート制限に達しました。しばらく待ってから再試行してください。' },
          { status: 429 }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { success: false, error: 'APIキーが無効です。設定を確認してください。' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { success: false, error: `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // レスポンスを解析
    const candidate = data.candidates?.[0];
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'HTML変換結果が生成されませんでした' },
        { status: 500 }
      );
    }

    const textContent = candidate.content?.parts?.[0]?.text;
    if (!textContent) {
      return NextResponse.json(
        { success: false, error: 'HTML変換結果が空です' },
        { status: 500 }
      );
    }

    // JSONをパース
    let result: { html: string; css?: string };
    try {
      result = JSON.parse(textContent);
    } catch {
      // JSONパースに失敗した場合、テキスト全体をHTMLとして扱う
      result = { html: textContent, css: '' };
    }

    return NextResponse.json({
      success: true,
      html: result.html,
      css: result.css || '',
    });
  } catch (error) {
    console.error('[Convert API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
