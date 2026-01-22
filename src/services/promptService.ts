/**
 * Prompt Service v3 - LP構成に基づいた一貫性のある生成
 *
 * LP構成の基本3セクション:
 * 1. ファーストビュー - 最初の印象、キャッチコピー、メインビジュアル
 * 2. ボディ - 特徴、ベネフィット、社会的証明
 * 3. クロージング - CTA、信頼性、行動促進
 */

export interface LPStructure {
  totalSections: number;
  productName: string;
  targetAudience: string;
  mainBenefit: string;
  colorScheme: string;
  sections: SectionPlan[];
}

export interface SectionPlan {
  index: number;
  type: 'firstview' | 'problem' | 'solution' | 'features' | 'benefits' | 'social-proof' | 'faq' | 'offer' | 'closing';
  title: string;
  content: string[];
  designNotes: string;
}

/**
 * 商品説明からLP全体の構成を計画
 */
export function planLPStructure(description: string, totalSections: number): LPStructure {
  const structure: LPStructure = {
    totalSections,
    productName: extractProductName(description),
    targetAudience: extractTargetAudience(description),
    mainBenefit: extractMainBenefit(description),
    colorScheme: 'Professional, modern color palette derived from the product/service theme',
    sections: [],
  };

  // セクション構成を決定
  if (totalSections === 1) {
    structure.sections = [
      {
        index: 0,
        type: 'firstview',
        title: 'Complete LP',
        content: [
          'Hero headline with main value proposition',
          'Key features (3-4 points)',
          'Primary CTA button',
          'Trust indicators',
        ],
        designNotes: 'Full LP in one image - hero at top, features in middle, CTA at bottom',
      },
    ];
  } else if (totalSections === 2) {
    structure.sections = [
      {
        index: 0,
        type: 'firstview',
        title: 'ファーストビュー',
        content: [
          'Attention-grabbing headline',
          'Subheadline with key benefit',
          'Hero visual',
          'Optional CTA',
        ],
        designNotes: 'Maximum visual impact, minimal text, clear value proposition',
      },
      {
        index: 1,
        type: 'closing',
        title: 'クロージング',
        content: [
          'Features summary (3-4 points)',
          'Strong CTA with urgency',
          'Trust badges or guarantees',
          'Contact or action prompt',
        ],
        designNotes: 'Drive action, reinforce value, remove hesitation',
      },
    ];
  } else if (totalSections === 3) {
    structure.sections = [
      {
        index: 0,
        type: 'firstview',
        title: 'ファーストビュー',
        content: [
          'Compelling headline',
          'Value proposition subheadline',
          'Hero visual/product image',
        ],
        designNotes: 'Capture attention instantly, communicate core value',
      },
      {
        index: 1,
        type: 'features',
        title: '特徴・ベネフィット',
        content: [
          '3-4 key features with icons',
          'Benefits for the user',
          'Problem-solution framing',
        ],
        designNotes: 'Clear visual hierarchy, scannable layout',
      },
      {
        index: 2,
        type: 'closing',
        title: 'クロージング・CTA',
        content: [
          'Reinforced value proposition',
          'Prominent CTA button',
          'Urgency or scarcity message',
          'Trust elements (guarantee, support)',
        ],
        designNotes: 'Strong call-to-action, remove final objections',
      },
    ];
  } else if (totalSections === 4) {
    structure.sections = [
      {
        index: 0,
        type: 'firstview',
        title: 'ファーストビュー',
        content: [
          'Powerful headline',
          'Emotional subheadline',
          'Premium hero visual',
        ],
        designNotes: 'Bold, impactful first impression',
      },
      {
        index: 1,
        type: 'features',
        title: '特徴紹介',
        content: [
          'Product/service features (3-4)',
          'Visual feature cards or icons',
          'Brief explanations',
        ],
        designNotes: 'Clean, organized feature showcase',
      },
      {
        index: 2,
        type: 'benefits',
        title: 'ベネフィット・証明',
        content: [
          'User benefits and transformation',
          'Social proof (testimonials, numbers)',
          'Before/after or case study hints',
        ],
        designNotes: 'Build trust and desire',
      },
      {
        index: 3,
        type: 'closing',
        title: 'クロージング',
        content: [
          'Final value reinforcement',
          'Large, prominent CTA',
          'Limited-time offer or bonus',
          'Guarantee and support info',
        ],
        designNotes: 'Maximize conversion, eliminate hesitation',
      },
    ];
  } else {
    // 5〜12枚: 動的にセクション構成を決定
    structure.sections = generateDynamicSections(totalSections);
  }

  return structure;
}

/**
 * 5枚以上のLP用に動的にセクション構成を生成
 */
function generateDynamicSections(totalSections: number): SectionPlan[] {
  const sections: SectionPlan[] = [];

  // 固定セクション: ファーストビュー（最初）とクロージング（最後）
  // 残りのセクション数を計算
  const middleSections = totalSections - 2;

  // セクションテンプレート（中間セクション用）
  const sectionTemplates: Omit<SectionPlan, 'index'>[] = [
    {
      type: 'problem',
      title: '問題提起',
      content: [
        'Pain points and challenges',
        'Empathy with user frustrations',
        'Current situation visualization',
      ],
      designNotes: 'Create emotional connection with the problem',
    },
    {
      type: 'solution',
      title: '解決策の提示',
      content: [
        'Product/service as the solution',
        'How it addresses the problems',
        'Transformation promise',
      ],
      designNotes: 'Bridge from problem to solution',
    },
    {
      type: 'features',
      title: '特徴紹介',
      content: [
        'Key features with visual icons',
        'Technical specifications',
        'Unique selling points',
      ],
      designNotes: 'Clean feature showcase with visuals',
    },
    {
      type: 'features',
      title: '特徴紹介 2',
      content: [
        'Additional features',
        'Detailed explanations',
        'Competitive advantages',
      ],
      designNotes: 'Continue feature showcase',
    },
    {
      type: 'features',
      title: '特徴紹介 3',
      content: [
        'More detailed features',
        'Use cases and applications',
        'Integration capabilities',
      ],
      designNotes: 'Deep dive into features',
    },
    {
      type: 'benefits',
      title: 'ベネフィット',
      content: [
        'User transformation and outcomes',
        'Before/after comparison',
        'Time/money savings',
      ],
      designNotes: 'Focus on user value',
    },
    {
      type: 'benefits',
      title: 'ベネフィット 2',
      content: [
        'Lifestyle improvements',
        'Emotional benefits',
        'Long-term value',
      ],
      designNotes: 'Emotional appeal',
    },
    {
      type: 'social-proof',
      title: '社会的証明',
      content: [
        'Customer testimonials',
        'Success metrics and numbers',
        'Trust badges and certifications',
      ],
      designNotes: 'Build credibility with proof',
    },
    {
      type: 'faq',
      title: 'よくある質問',
      content: [
        'Common questions answered',
        'Objection handling',
        'Support and guarantee info',
      ],
      designNotes: 'Remove doubts and hesitation',
    },
    {
      type: 'offer',
      title: '限定特典・オファー',
      content: [
        'Special bonuses',
        'Limited-time offers',
        'Exclusive benefits',
      ],
      designNotes: 'Create urgency and added value',
    },
  ];

  // ファーストビューを追加
  sections.push({
    index: 0,
    type: 'firstview',
    title: 'ファーストビュー',
    content: [
      'Powerful headline',
      'Emotional subheadline',
      'Premium hero visual',
    ],
    designNotes: 'Bold, impactful first impression',
  });

  // 中間セクションを選択して追加
  // 枚数に応じて適切なセクションを選択
  const selectedTemplates = sectionTemplates.slice(0, middleSections);

  selectedTemplates.forEach((template, i) => {
    sections.push({
      ...template,
      index: i + 1,
    });
  });

  // クロージングを追加
  sections.push({
    index: totalSections - 1,
    type: 'closing',
    title: 'クロージング・CTA',
    content: [
      'Final value reinforcement',
      'Large, prominent CTA button',
      'Limited-time urgency',
      'Guarantee and support info',
    ],
    designNotes: 'Maximize conversion, eliminate hesitation',
  });

  return sections;
}

function extractProductName(description: string): string {
  // Simple extraction - in production, could use AI
  const lines = description.split(/[。\n]/);
  return lines[0]?.slice(0, 50) || 'Product';
}

function extractTargetAudience(description: string): string {
  return 'Target customers interested in this product/service';
}

function extractMainBenefit(description: string): string {
  return 'The primary value and benefit of the product/service';
}

export interface LPPromptInput {
  description: string;
  sectionInstruction?: string;  // このセクション固有の指示
  structure: LPStructure;
  sectionIndex: number;
  hasMaterialImages: boolean;
  hasReferenceImages: boolean;
}

/**
 * 特定セクションの生成プロンプトを構築
 */
export function buildLPPrompt(input: LPPromptInput): string {
  const { description, sectionInstruction, structure, sectionIndex, hasMaterialImages, hasReferenceImages } = input;
  const section = structure.sections[sectionIndex];
  const isFirst = sectionIndex === 0;
  const isLast = sectionIndex === structure.totalSections - 1;

  let prompt = `You are creating section ${sectionIndex + 1} of ${structure.totalSections} for a professional Japanese landing page.

=== PRODUCT/SERVICE ===
${description}

=== LP OVERALL STRUCTURE ===
Total sections: ${structure.totalSections}
${structure.sections.map((s, i) => `Section ${i + 1}: ${s.title} (${s.type})`).join('\n')}

=== THIS SECTION: ${section.title} ===
Type: ${section.type}
Role: ${section.designNotes}

Content to include:
${section.content.map(c => `- ${c}`).join('\n')}
${sectionInstruction ? `
=== USER'S SPECIFIC INSTRUCTION FOR THIS SECTION ===
${sectionInstruction}
(IMPORTANT: Follow this instruction as the primary guide for this section's content and design)
` : ''}

=== CRITICAL DESIGN REQUIREMENTS ===

1. CONSISTENCY ACROSS ALL SECTIONS:
   - Use the SAME color palette throughout all sections
   - Maintain consistent typography (font styles, sizes, hierarchy)
   - Keep the same visual style and design language
   - Ensure seamless visual flow between sections

2. SEAMLESS CONNECTION (NO GAPS):
   - ZERO padding/margin at top and bottom edges
   - Design elements should extend to the very edge
   - Background should be continuous, not cut off
   - When sections are stacked vertically, they must connect perfectly

3. JAPANESE TEXT:
   - All text content must be in Japanese
   - Create compelling, marketing-focused copy
   - Use appropriate honorifics and tone for B2C

4. LAYOUT:
   - Aspect ratio: 9:16 (vertical, mobile-first)
   - Edge-to-edge design
   - ${isFirst ? 'This is the TOP section - no content above it' : 'Seamlessly connect with section above'}
   - ${isLast ? 'This is the BOTTOM section - include final CTA' : 'Seamlessly connect with section below'}

5. VISUAL STYLE:
   - Modern, professional Japanese LP aesthetic
   - High contrast for readability
   - Premium feel appropriate for the product/service

6. CTA BUTTONS (VERY IMPORTANT):
   - CTA buttons must be CLEARLY RECTANGULAR with sharp, defined edges
   - Use a SOLID, BRIGHT contrasting color (e.g., orange, green, or brand accent color)
   - Button must have CLEAR BOUNDARIES - no gradients that fade into background
   - Button text must be centered, bold, and easily readable
   - Button should be horizontally centered in the section
   - Typical button text: "今すぐ購入", "無料で始める", "詳しく見る", etc.
   - Button height: approximately 5-8% of section height
   - Button width: approximately 60-80% of section width
   - Add subtle shadow or border to make button stand out
`;

  if (hasMaterialImages) {
    prompt += `
=== MATERIAL IMAGES ===
Incorporate the provided product/material images naturally.
${isFirst ? 'Use prominently in the hero area.' : 'Use as supporting visuals where appropriate.'}
`;
  }

  if (hasReferenceImages) {
    prompt += `
=== STYLE REFERENCE ===
Match the visual style, colors, and aesthetic of the reference images.
Apply this style consistently across ALL sections.
`;
  }

  prompt += `
=== OUTPUT ===
Generate a production-ready LP section image that:
- Connects seamlessly with adjacent sections (NO visible seams or gaps)
- Maintains perfect visual consistency with other sections
- Uses professional Japanese marketing copy
- Has NO padding at top/bottom edges
`;

  return prompt;
}
