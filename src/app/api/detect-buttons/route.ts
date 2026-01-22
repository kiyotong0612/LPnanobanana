import { NextRequest, NextResponse } from 'next/server';

// Gemini 2.0 Flash for analysis
const MODEL_ID = 'gemini-2.0-flash';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface DetectedButton {
  x: number;      // 0-1 relative position
  y: number;
  width: number;
  height: number;
  text: string;   // Button text (detected from image)
  type: 'primary' | 'secondary' | 'cta';
  backgroundColor: string;
  textColor: string;
}

interface DetectButtonsRequestBody {
  image: { base64: string; mimeType: string };
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DetectButtonsRequestBody = await request.json();
    const { image, apiKey: clientApiKey } = body;

    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini APIキーが設定されていません' },
        { status: 400 }
      );
    }

    if (!image || !image.base64) {
      return NextResponse.json(
        { success: false, error: '画像が指定されていません' },
        { status: 400 }
      );
    }

    const prompt = `
あなたはLP（ランディングページ）画像を分析するエキスパートです。
この画像内のCTAボタン（Call to Action）を検出してください。

【重要: 検出すべきボタンの特徴】
1. 明確な矩形（四角形）の形状
2. 背景と異なる目立つ色（オレンジ、緑、青、金色など）
3. 中央に配置されたテキスト
4. 「購入」「申し込む」「体験する」「始める」「詳しく」などの行動を促す文言

【具体的な検出対象例】
- 「今すぐ購入する」
- 「無料で始める」
- 「詳しく見る」
- 「今すぐ最高のコーヒーを体験する」
- 「申し込みはこちら」
- 「ダウンロード」
など、ユーザーにクリックを促すボタン

【注意】
- アイコンや装飾要素はボタンではありません
- テキストリンクではなく、明確なボタン形状のものだけを検出
- 画像全体をスキャンして、すべてのCTAボタンを見つけてください

【出力形式】
以下のJSON形式で出力してください。ボタンが見つからない場合は空配列を返してください。

{
  "buttons": [
    {
      "x": 0.1,
      "y": 0.75,
      "width": 0.8,
      "height": 0.06,
      "text": "今すぐ購入する",
      "type": "cta",
      "backgroundColor": "#FF6B00",
      "textColor": "#FFFFFF"
    }
  ]
}

【座標の説明 - 非常に重要】
- x: ボタンの左端の位置（0=画像の左端、1=画像の右端）
- y: ボタンの上端の位置（0=画像の上端、1=画像の下端）
- width: ボタンの幅（0-1の相対サイズ、例: 0.8 = 画像幅の80%）
- height: ボタンの高さ（0-1の相対サイズ、例: 0.06 = 画像高さの6%）
- text: ボタンに書かれているテキスト（正確に読み取る）
- type: "cta"（行動喚起）, "primary"（主要）, "secondary"（副次）
- backgroundColor: ボタンの背景色（16進数カラーコード、例: "#FF6B00"）
- textColor: ボタンのテキスト色（16進数カラーコード、例: "#FFFFFF"）

JSONのみを出力し、説明は不要です。必ず1つ以上のボタンを見つけてください。
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
        temperature: 0.2,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    };

    const url = `${API_BASE_URL}/${MODEL_ID}:generateContent?key=${apiKey}`;

    console.log('[Detect Buttons API] Sending detection request...');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    console.log('[Detect Buttons API] Response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Detect Buttons API] Error:', errorBody);

      if (response.status === 429) {
        return NextResponse.json(
          { success: false, error: 'レート制限に達しました。しばらく待ってから再試行してください。' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, error: `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return NextResponse.json({
        success: true,
        buttons: [],
      });
    }

    let result: { buttons: DetectedButton[] };
    try {
      result = JSON.parse(textContent);
    } catch {
      console.error('[Detect Buttons API] Failed to parse JSON:', textContent);
      return NextResponse.json({
        success: true,
        buttons: [],
      });
    }

    console.log('[Detect Buttons API] Detected buttons:', result.buttons?.length || 0);

    return NextResponse.json({
      success: true,
      buttons: result.buttons || [],
    });
  } catch (error) {
    console.error('[Detect Buttons API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
