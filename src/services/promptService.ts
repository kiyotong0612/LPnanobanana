/**
 * Prompt Service
 * Generates prompts for LP image generation using Gemini API
 */

import type {
  UploadedImage,
  TextContent,
  ColorScheme,
  GenerationConfig,
  ImageUsageType,
} from '@/types';
import { getUsageLabel } from './imageService';

/**
 * LP generation prompt template
 */
const LP_PROMPT_TEMPLATE = `You are creating a visually stunning vertical landing page image (9:16 aspect ratio).

DESIGN REQUIREMENTS:
- Create a cohesive, professional landing page design
- The layout should flow naturally from top to bottom
- Use minimal padding and maximize content area
- Ensure text is readable and well-positioned
- Apply modern web design principles

CONTENT TO INCLUDE:
{content}

COLOR SCHEME:
{colors}

IMAGE USAGE INSTRUCTIONS:
{imageUsage}

STYLE GUIDELINES:
- Create a seamless, edge-to-edge design
- Use visual hierarchy to guide the viewer's eye
- Incorporate smooth gradients and modern effects where appropriate
- Ensure the CTA button stands out prominently
- Make the design mobile-friendly and impactful

CRITICAL INSTRUCTIONS:
- Generate a COMPLETE landing page image, not a mockup or wireframe
- Fill the entire canvas with the design
- DO NOT include device frames, browser chrome, or placeholder indicators
- The output should be a finished, production-ready LP design
`;

/**
 * Build content section of the prompt
 */
function buildContentSection(textContent: TextContent): string {
  const sections: string[] = [];

  if (textContent.mainCopy) {
    sections.push(`Main Headline: "${textContent.mainCopy}"`);
  }

  if (textContent.subCopy) {
    sections.push(`Subheadline: "${textContent.subCopy}"`);
  }

  if (textContent.description) {
    sections.push(`Body Text: "${textContent.description}"`);
  }

  if (textContent.ctaText) {
    sections.push(`Call-to-Action Button: "${textContent.ctaText}"`);
  }

  if (textContent.additionalTexts.length > 0) {
    const additionalContent = textContent.additionalTexts
      .filter((t) => t.trim())
      .map((t, i) => `  ${i + 1}. "${t}"`)
      .join('\n');
    if (additionalContent) {
      sections.push(`Additional Content:\n${additionalContent}`);
    }
  }

  return sections.length > 0
    ? sections.join('\n')
    : 'Create an attractive landing page with compelling visual elements.';
}

/**
 * Build color section of the prompt
 */
function buildColorSection(colorScheme: ColorScheme): string {
  const colors: string[] = [];

  if (colorScheme.extractFromReference) {
    return 'Extract and use the color palette from the provided reference images.';
  }

  if (colorScheme.mainColor) {
    colors.push(`Primary/Main Color: ${colorScheme.mainColor}`);
  }

  if (colorScheme.accentColor) {
    colors.push(`Accent Color: ${colorScheme.accentColor}`);
  }

  if (colorScheme.backgroundColor) {
    colors.push(`Background Color: ${colorScheme.backgroundColor}`);
  }

  return colors.length > 0
    ? colors.join('\n')
    : 'Use a modern, professional color palette that fits the content.';
}

/**
 * Build image usage section of the prompt
 */
function buildImageUsageSection(materialImages: UploadedImage[]): string {
  if (materialImages.length === 0) {
    return 'No specific images provided. Create original visual elements.';
  }

  const usageDescriptions = materialImages.map((image, index) => {
    const usage = image.usage || 'auto';
    const usageLabel = getUsageLabel(usage);

    if (usage === 'custom' && image.customUsage) {
      return `Image ${index + 1}: ${image.customUsage}`;
    }

    const usageInstructions: Record<ImageUsageType, string> = {
      'main-visual': 'Use as the main hero/visual element prominently displayed',
      background: 'Use as background imagery or texture',
      icon: 'Use as an icon or small decorative element',
      product: 'Feature as a product image with appropriate presentation',
      person: 'Include as a person/human element for relatability',
      auto: 'Integrate naturally into the design where it fits best',
      custom: 'Use according to custom instructions',
    };

    return `Image ${index + 1}: ${usageLabel} - ${usageInstructions[usage]}`;
  });

  return usageDescriptions.join('\n');
}

/**
 * Build reference image instruction
 */
function buildReferenceInstruction(referenceImages: UploadedImage[]): string {
  if (referenceImages.length === 0) {
    return '';
  }

  return `\nREFERENCE STYLE:
The provided reference images show the desired style, layout, and aesthetic.
Match their overall look, feel, and design language while creating original content.
Pay attention to:
- Typography style and hierarchy
- Color usage and gradients
- Spacing and layout patterns
- Visual effects and decorative elements
`;
}

/**
 * Get resolution dimensions
 */
export function getResolutionDimensions(
  imageSize: GenerationConfig['imageSize']
): { width: number; height: number } {
  const dimensions: Record<GenerationConfig['imageSize'], { width: number; height: number }> = {
    '1K': { width: 1080, height: 1920 },
    '2K': { width: 1152, height: 2048 },
    '4K': { width: 2160, height: 3840 },
  };
  return dimensions[imageSize];
}

/**
 * Generate the complete prompt for LP generation
 */
export function generateLPPrompt(
  textContent: TextContent,
  colorScheme: ColorScheme,
  materialImages: UploadedImage[],
  referenceImages: UploadedImage[],
  generationConfig: GenerationConfig
): string {
  const contentSection = buildContentSection(textContent);
  const colorSection = buildColorSection(colorScheme);
  const imageUsageSection = buildImageUsageSection(materialImages);
  const referenceInstruction = buildReferenceInstruction(referenceImages);
  const { width, height } = getResolutionDimensions(generationConfig.imageSize);

  let prompt = LP_PROMPT_TEMPLATE.replace('{content}', contentSection)
    .replace('{colors}', colorSection)
    .replace('{imageUsage}', imageUsageSection);

  prompt += referenceInstruction;

  prompt += `\nOUTPUT SPECIFICATIONS:
- Aspect Ratio: 9:16 (vertical/portrait)
- Target Resolution: ${width}x${height} pixels
- Format: High-quality image suitable for web use
`;

  return prompt;
}

/**
 * Generate continuation prompt for consistent multi-image generation
 * Uses thought_signature for maintaining consistency across images
 */
export function generateContinuationPrompt(
  basePrompt: string,
  imageIndex: number,
  totalImages: number,
  thoughtSignature?: string
): string {
  let continuationPrompt = basePrompt;

  if (imageIndex > 0 && thoughtSignature) {
    continuationPrompt += `\n\nCONSISTENCY INSTRUCTIONS:
This is image ${imageIndex + 1} of ${totalImages} in a series.
Maintain visual consistency with previous images:
- Use the same color palette
- Keep typography style consistent
- Ensure design elements flow naturally
- Create variation while maintaining brand coherence

Previous design context: ${thoughtSignature}
`;
  }

  if (imageIndex === 0 && totalImages > 1) {
    continuationPrompt += `\n\nSERIES INSTRUCTIONS:
This is the first of ${totalImages} images in a series.
Establish a strong visual foundation that can be carried through subsequent images.
`;
  }

  return continuationPrompt;
}

/**
 * Simple translation function using Gemini API
 * Used to translate Japanese text to English for better prompt understanding
 */
export async function translateToEnglish(
  text: string,
  apiKey: string
): Promise<string> {
  if (!text.trim()) return '';

  // Check if text is already mostly English
  const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/;
  if (!japanesePattern.test(text)) {
    return text; // Already in English or non-Japanese
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Translate the following Japanese text to natural English. Only output the translation, nothing else:\n\n${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn('Translation failed, using original text');
      return text;
    }

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return translatedText?.trim() || text;
  } catch (error) {
    console.warn('Translation error, using original text:', error);
    return text;
  }
}

/**
 * Translate all text content to English
 */
export async function translateTextContent(
  textContent: TextContent,
  apiKey: string
): Promise<TextContent> {
  const [mainCopy, subCopy, description, ctaText, ...additionalTexts] = await Promise.all([
    translateToEnglish(textContent.mainCopy, apiKey),
    translateToEnglish(textContent.subCopy, apiKey),
    translateToEnglish(textContent.description, apiKey),
    translateToEnglish(textContent.ctaText, apiKey),
    ...textContent.additionalTexts.map((t) => translateToEnglish(t, apiKey)),
  ]);

  return {
    mainCopy,
    subCopy,
    description,
    ctaText,
    additionalTexts,
  };
}
