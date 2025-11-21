import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { DesignerInput, DesignerOutput } from './types';
import { generateAndStoreImage } from '../services/image-generator';
import { generateStructuredWithAIServer, getTextGenerationProvider } from '../services/text-generator';

// Schema for thumbnail generation
const thumbnailSchema = {
  type: 'object',
  properties: {
    thumbnail: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Detailed image generation prompt for the thumbnail' },
        alt: { type: 'string', description: 'Alt text for accessibility' },
      },
      required: ['description', 'alt'],
    },
    layoutSuggestion: { type: 'string' },
  },
  required: ['thumbnail', 'layoutSuggestion'],
};

// Zod schema for Gemini
const thumbnailZodSchema = z.object({
  thumbnail: z.object({
    description: z.string().describe('Detailed image generation prompt for the thumbnail'),
    alt: z.string().describe('Alt text for accessibility'),
  }),
  layoutSuggestion: z.string(),
});

type ThumbnailResult = z.infer<typeof thumbnailZodSchema>;

export async function runDesigner(input: DesignerInput): Promise<DesignerOutput> {
  const textProvider = getTextGenerationProvider();

  console.log('='.repeat(60));
  console.log('[DESIGNER] Starting designer agent...');
  console.log('[DESIGNER] Text generation provider:', textProvider);
  console.log('[DESIGNER] Input title:', input.content.title);
  console.log('[DESIGNER] Content length:', input.content.content.length);
  console.log('='.repeat(60));

  // 1. Generate asset descriptions using AI
  const prompt = `
    You are an expert AI Designer. You need to create a thumbnail image for the following article.

    Title: ${input.content.title}
    Content: ${input.content.content}

    Your task:
    1. Create ONE main thumbnail image description that would be perfect for this article.
    2. The image should be eye-catching, professional, and relevant to the article topic.
    3. Describe the layout strategy for the article.

    For the thumbnail, provide a detailed description that can be used to generate the image.
    Focus on: visual style, colors, composition, and key elements that represent the article's topic.

    Return a JSON object with the following structure:
    {
      "thumbnail": {
        "description": "detailed image generation prompt",
        "alt": "alt text for accessibility"
      },
      "layoutSuggestion": "layout strategy description"
    }
  `;

  const startTime = Date.now();
  let object: ThumbnailResult;

  // 2. Route to appropriate text generation provider
  if (textProvider === 'ai-server') {
    console.log('[DESIGNER] Generating thumbnail description with AI Server...');
    console.log('[DESIGNER] AI_SERVER_TEXT_URL:', process.env.AI_SERVER_TEXT_URL);

    const result = await generateStructuredWithAIServer<ThumbnailResult>(
      prompt,
      thumbnailSchema,
      { maxTokens: 2048, temperature: 0.7 }
    );

    if (!result || !result.output) {
      console.error('[DESIGNER] FAILED: AI Server text generation returned null');
      console.log('[DESIGNER] Falling back to Gemini...');
      const geminiResult = await generateObject({
        model: google('gemini-2.0-flash'),
        schema: thumbnailZodSchema,
        prompt: prompt,
      });
      object = geminiResult.object;
    } else {
      console.log('[DESIGNER] AI Server response valid:', result.isValid);
      object = result.output;
    }
  } else {
    console.log('[DESIGNER] Generating thumbnail description with Gemini...');
    const geminiResult = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: thumbnailZodSchema,
      prompt: prompt,
    });
    object = geminiResult.object;
  }

  console.log(`[DESIGNER] Thumbnail description generated (${Date.now() - startTime}ms)`);
  console.log('[DESIGNER] Thumbnail description:', object.thumbnail.description);
  console.log('[DESIGNER] Alt text:', object.thumbnail.alt);

  // 2. Generate the actual thumbnail image using configured provider
  const imagePrompt = `Create a professional news article thumbnail image: ${object.thumbnail.description}.
Style: Modern, clean, high-quality digital illustration or photorealistic image suitable for a news article.
Aspect ratio: 16:9 landscape format.
No text or watermarks.`;

  console.log('[DESIGNER] Starting image generation...');
  console.log('[DESIGNER] Image prompt length:', imagePrompt.length);

  const imageStartTime = Date.now();
  const generatedImage = await generateAndStoreImage(imagePrompt);

  if (generatedImage) {
    console.log(`[DESIGNER] Image generated successfully (${Date.now() - imageStartTime}ms)`);
    console.log('[DESIGNER] Image URL:', generatedImage.url);
  } else {
    console.error('[DESIGNER] FAILED: Image generation returned null');
  }

  // 3. Build assets array with the generated image URL
  const assets = [{
    type: 'image' as const,
    description: object.thumbnail.description,
    alt: object.thumbnail.alt,
    url: generatedImage?.url || `https://placehold.co/600x400?text=${encodeURIComponent('News')}`,
  }];

  console.log('[DESIGNER] Final asset URL:', assets[0].url);
  console.log(`[DESIGNER] Total time: ${Date.now() - startTime}ms`);
  console.log('='.repeat(60));

  return {
    assets,
    layoutSuggestion: object.layoutSuggestion,
  };
}
