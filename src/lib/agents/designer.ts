import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { DesignerInput, DesignerOutput } from './types';
import { generateAndStoreImage } from '../services/image-generator';

export async function runDesigner(input: DesignerInput): Promise<DesignerOutput> {
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
  `;

  const { object } = await generateObject({
    model: google('gemini-2.0-flash'),
    schema: z.object({
      thumbnail: z.object({
        description: z.string().describe('Detailed image generation prompt for the thumbnail'),
        alt: z.string().describe('Alt text for accessibility'),
      }),
      layoutSuggestion: z.string(),
    }),
    prompt: prompt,
  });

  // 2. Generate the actual thumbnail image using Gemini image generation
  const imagePrompt = `Create a professional news article thumbnail image: ${object.thumbnail.description}.
Style: Modern, clean, high-quality digital illustration or photorealistic image suitable for a news article.
Aspect ratio: 16:9 landscape format.
No text or watermarks.`;

  console.log('Generating thumbnail image...');
  const generatedImage = await generateAndStoreImage(imagePrompt);

  // 3. Build assets array with the generated image URL
  const assets = [{
    type: 'image' as const,
    description: object.thumbnail.description,
    alt: object.thumbnail.alt,
    url: generatedImage?.url || `https://placehold.co/600x400?text=${encodeURIComponent('News')}`,
  }];

  return {
    assets,
    layoutSuggestion: object.layoutSuggestion,
  };
}
