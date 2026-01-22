import { NextRequest, NextResponse } from 'next/server';

// Nano Banana Pro (Gemini 3 Pro Image)
const MODEL_ID = 'gemini-3-pro-image-preview';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface EditRegion {
  x: number;      // 0-1 の相対座標
  y: number;
  width: number;
  height: number;
}

interface EditLPRequestBody {
  currentImage: { base64: string; mimeType: string };
  instruction: string;
  region?: EditRegion;  // 編集領域（任意）
  apiKey: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EditLPRequestBody = await request.json();
    const { currentImage, instruction, region, apiKey: clientApiKey } = body;

    // APIキー: クライアントから送信された値、または環境変数を使用
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    // バリデーション
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini APIキーが設定されていません' },
        { status: 400 }
      );
    }

    if (!currentImage || !currentImage.base64) {
      return NextResponse.json(
        { success: false, error: '編集する画像が指定されていません' },
        { status: 400 }
      );
    }

    if (!instruction || !instruction.trim()) {
      return NextResponse.json(
        { success: false, error: '編集指示を入力してください' },
        { status: 400 }
      );
    }

    // 編集領域の説明を構築
    let regionDescription = '';
    if (region) {
      const posX = Math.round(region.x * 100);
      const posY = Math.round(region.y * 100);
      const posW = Math.round(region.width * 100);
      const posH = Math.round(region.height * 100);
      regionDescription = `
【編集対象領域】
画像の左上を(0,0)、右下を(100,100)とした場合:
- 位置: 左から${posX}%、上から${posY}%の位置
- サイズ: 幅${posW}%、高さ${posH}%の領域
この領域内のみを編集してください。領域外は一切変更しないでください。
`;
    }

    // 編集用プロンプトを構築
    const prompt = `
あなたはLP（ランディングページ）画像編集のエキスパートです。
以下の指示に従って、このLP画像を編集してください。

【編集指示】
${instruction}
${regionDescription}

【最重要: LP全体の整合性維持】
このLPは複数セクションで構成されています。編集する際は以下を厳守してください:

1. デザインの一貫性
   - 色使い（背景色、アクセントカラー、テキスト色）を全体で統一
   - フォントスタイル、サイズ感を他の部分と揃える
   - 余白、パディングのバランスを維持

2. 視覚的な連続性
   - セクション間の境界が自然につながるようにする
   - 上下のセクションとの色の流れを考慮
   - グラデーションや背景パターンがある場合は連続性を保つ

3. コンテンツの整合性
   - ブランドイメージを損なわない
   - 全体のトーン&マナーを維持
   - プロフェッショナルなLP品質を保つ

【技術的な制約】
- 指示された部分のみを変更し、それ以外は元のデザインをピクセル単位で維持
- 日本語テキストは正確に、読みやすく生成
- アスペクト比は元の画像と完全に同じ
- 解像度と画質を維持

編集後の画像を生成してください。
`.trim();

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: currentImage.mimeType,
                data: currentImage.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.8,
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

    console.log('[Edit API] Sending edit request to Gemini API...');
    console.log('[Edit API] Instruction:', instruction.slice(0, 100));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('[Edit API] Gemini response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Edit API] Gemini API error:', errorBody);

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
        { success: false, error: '編集結果が生成されませんでした' },
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
        { success: false, error: '編集後の画像の生成に失敗しました。指示を調整して再試行してください。' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error('[Edit API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
