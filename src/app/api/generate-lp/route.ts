import { NextRequest, NextResponse } from 'next/server';
import { buildLPPrompt, planLPStructure } from '@/services/promptService';

// Nano Banana Pro (Gemini 3 Pro Image)
const MODEL_ID = 'gemini-3-pro-image-preview';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GenerateLPRequestBody {
  description: string;
  sectionInstruction?: string;  // このセクション固有の指示
  materialImages: Array<{ base64: string; mimeType: string }>;
  referenceImages: Array<{ base64: string; mimeType: string }>;
  sectionIndex?: number;
  totalSections?: number;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('[API] GEMINI_API_KEY is not configured');
    return NextResponse.json(
      { success: false, error: 'APIキーが設定されていません。.env.localを確認してください。' },
      { status: 500 }
    );
  }

  try {
    const body: GenerateLPRequestBody = await request.json();
    const {
      description,
      sectionInstruction = '',
      materialImages,
      referenceImages,
      sectionIndex = 0,
      totalSections = 1,
    } = body;

    // バリデーション
    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, error: '商品/サービスの説明を入力してください' },
        { status: 400 }
      );
    }

    // LP全体の構成を計画
    const structure = planLPStructure(description, totalSections);

    // セクション用プロンプトを構築
    const prompt = buildLPPrompt({
      description,
      sectionInstruction,
      structure,
      sectionIndex,
      hasMaterialImages: materialImages.length > 0,
      hasReferenceImages: referenceImages.length > 0,
    });

    // リクエストパーツを構築
    const parts: GeminiPart[] = [{ text: prompt }];

    // 素材画像を追加
    materialImages.forEach((image) => {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64,
        },
      });
    });

    // 参考画像を追加
    referenceImages.forEach((image) => {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64,
        },
      });
    });

    const requestBody = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseModalities: ['TEXT', 'IMAGE'],
        responseMimeType: 'text/plain',
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    const url = `${API_BASE_URL}/${MODEL_ID}:generateContent?key=${apiKey}`;

    console.log('[API] Sending request to Gemini API...');
    console.log('[API] Section:', sectionIndex + 1, '/', totalSections);
    console.log('[API] Material images:', materialImages.length);
    console.log('[API] Reference images:', referenceImages.length);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('[API] Gemini response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[API] Gemini API error:', errorBody);

      if (response.status === 429) {
        return NextResponse.json(
          { success: false, error: 'レート制限に達しました。しばらく待ってから再試行してください。' },
          { status: 429 }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { success: false, error: 'APIキーが無効です。' },
          { status: 401 }
        );
      }
      if (response.status === 400) {
        return NextResponse.json(
          { success: false, error: `リクエストエラー: ${errorBody}` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: `API Error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // レスポンスを解析
    const candidate = data.candidates?.[0];
    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'レスポンスが生成されませんでした' },
        { status: 500 }
      );
    }

    if (candidate.finishReason === 'SAFETY') {
      return NextResponse.json(
        { success: false, error: 'コンテンツがセーフティフィルターによりブロックされました' },
        { status: 400 }
      );
    }

    const responseParts = candidate.content?.parts || [];
    let image: { base64: string; mimeType: string } | null = null;

    for (const part of responseParts) {
      if (part.inlineData) {
        image = {
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
        break;
      }
    }

    if (!image) {
      return NextResponse.json(
        { success: false, error: '画像の生成に失敗しました。説明を調整して再試行してください。' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
