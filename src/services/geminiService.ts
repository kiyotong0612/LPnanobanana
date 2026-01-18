/**
 * Gemini API Service (Nano Banana)
 * Handles LP image generation using Gemini 3.0 Pro model
 */

import type {
  UploadedImage,
  TextContent,
  ColorScheme,
  GenerationConfig,
  GeneratedImage,
} from '@/types';
import {
  generateLPPrompt,
  generateContinuationPrompt,
  translateTextContent,
} from './promptService';

// Gemini 3.0 Pro Image model
const MODEL_ID = 'gemini-3-pro-image-preview';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
  modelVersion?: string;
}

export interface GenerationResult {
  success: boolean;
  image?: GeneratedImage;
  error?: string;
  thoughtSignature?: string;
}

export interface GenerationProgress {
  currentImage: number;
  totalImages: number;
  status: 'generating' | 'translating' | 'complete' | 'error';
  message: string;
}

/**
 * Build the request body for Gemini API
 */
function buildRequestBody(
  prompt: string,
  materialImages: UploadedImage[],
  referenceImages: UploadedImage[],
  config: GenerationConfig,
  conversationHistory: GeminiContent[] = []
): object {
  const parts: GeminiPart[] = [];

  // Add text prompt
  parts.push({ text: prompt });

  // Add material images
  materialImages.forEach((image) => {
    parts.push({
      inlineData: {
        mimeType: image.file.type,
        data: image.base64,
      },
    });
  });

  // Add reference images
  referenceImages.forEach((image) => {
    parts.push({
      inlineData: {
        mimeType: image.file.type,
        data: image.base64,
      },
    });
  });

  const contents: GeminiContent[] = [
    ...conversationHistory,
    {
      role: 'user',
      parts,
    },
  ];

  return {
    contents,
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseModalities: ['TEXT', 'IMAGE'],
      responseMimeType: 'text/plain',
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  };
}

/**
 * Parse Gemini API response to extract generated image
 */
function parseResponse(response: GeminiResponse): {
  image?: { base64: string; mimeType: string };
  thoughtSignature?: string;
  error?: string;
} {
  if (response.error) {
    return { error: `API Error: ${response.error.message}` };
  }

  const candidate = response.candidates?.[0];
  if (!candidate) {
    return { error: 'No response generated' };
  }

  if (candidate.finishReason === 'SAFETY') {
    return { error: 'Content blocked due to safety filters' };
  }

  const parts = candidate.content?.parts || [];
  let image: { base64: string; mimeType: string } | undefined;
  let thoughtSignature: string | undefined;

  for (const part of parts) {
    if (part.inlineData) {
      image = {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    }
    if (part.text) {
      // Use text response as thought signature for consistency
      thoughtSignature = part.text;
    }
  }

  if (!image) {
    return { error: 'No image was generated. The model may have produced only text.' };
  }

  return { image, thoughtSignature };
}

/**
 * Generate a single LP image
 */
async function generateSingleImage(
  apiKey: string,
  prompt: string,
  materialImages: UploadedImage[],
  referenceImages: UploadedImage[],
  config: GenerationConfig,
  conversationHistory: GeminiContent[] = []
): Promise<GenerationResult> {
  const url = `${API_BASE_URL}/${MODEL_ID}:generateContent?key=${apiKey}`;
  const body = buildRequestBody(prompt, materialImages, referenceImages, config, conversationHistory);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'レート制限に達しました。しばらく待ってから再試行してください。' };
      }
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'APIキーが無効です。設定を確認してください。' };
      }
      return { success: false, error: `API Error: ${response.status} ${response.statusText}` };
    }

    const data: GeminiResponse = await response.json();
    const parsed = parseResponse(data);

    if (parsed.error) {
      return { success: false, error: parsed.error };
    }

    if (!parsed.image) {
      return { success: false, error: '画像の生成に失敗しました' };
    }

    const generatedImage: GeneratedImage = {
      id: crypto.randomUUID(),
      base64: parsed.image.base64,
      mimeType: parsed.image.mimeType,
      generatedAt: new Date(),
    };

    return {
      success: true,
      image: generatedImage,
      thoughtSignature: parsed.thoughtSignature,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'ネットワークエラー。接続を確認してください。' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
    };
  }
}

/**
 * Generate multiple LP images with consistency
 */
export async function generateLPImages(
  apiKey: string,
  textContent: TextContent,
  colorScheme: ColorScheme,
  materialImages: UploadedImage[],
  referenceImages: UploadedImage[],
  generationConfig: GenerationConfig,
  onProgress?: (progress: GenerationProgress) => void
): Promise<{
  success: boolean;
  images: GeneratedImage[];
  errors: string[];
}> {
  const images: GeneratedImage[] = [];
  const errors: string[] = [];
  const totalImages = generationConfig.numberOfImages;

  // Report translation progress
  onProgress?.({
    currentImage: 0,
    totalImages,
    status: 'translating',
    message: 'テキストを翻訳中...',
  });

  // Translate text content to English
  let translatedContent: TextContent;
  try {
    translatedContent = await translateTextContent(textContent, apiKey);
  } catch {
    // Fall back to original content if translation fails
    translatedContent = textContent;
  }

  // Generate base prompt
  const basePrompt = generateLPPrompt(
    translatedContent,
    colorScheme,
    materialImages,
    referenceImages,
    generationConfig
  );

  let thoughtSignature: string | undefined;
  const conversationHistory: GeminiContent[] = [];

  // Generate images one by one
  for (let i = 0; i < totalImages; i++) {
    onProgress?.({
      currentImage: i + 1,
      totalImages,
      status: 'generating',
      message: `LP画像を生成中... (${i + 1}/${totalImages})`,
    });

    // Generate prompt with continuation context
    const prompt = generateContinuationPrompt(basePrompt, i, totalImages, thoughtSignature);

    const result = await generateSingleImage(
      apiKey,
      prompt,
      materialImages,
      referenceImages,
      generationConfig,
      conversationHistory
    );

    if (result.success && result.image) {
      images.push(result.image);
      thoughtSignature = result.thoughtSignature;

      // Add to conversation history for multi-turn consistency
      if (result.thoughtSignature) {
        conversationHistory.push({
          role: 'model',
          parts: [{ text: result.thoughtSignature }],
        });
      }
    } else if (result.error) {
      errors.push(`Image ${i + 1}: ${result.error}`);
    }

    // Small delay between requests to avoid rate limiting
    if (i < totalImages - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  onProgress?.({
    currentImage: totalImages,
    totalImages,
    status: images.length > 0 ? 'complete' : 'error',
    message: images.length > 0 ? '生成完了' : '生成に失敗しました',
  });

  return {
    success: images.length > 0,
    images,
    errors,
  };
}

/**
 * Test API connection
 */
export async function testAPIConnection(apiKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}?key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      return { success: true, message: 'API接続成功' };
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, message: 'APIキーが無効です' };
    }

    return { success: false, message: `接続エラー: ${response.status}` };
  } catch {
    return { success: false, message: 'ネットワークエラー' };
  }
}
