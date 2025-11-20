import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { DesignerInput, DesignerOutput } from './types';

export async function runDesigner(input: DesignerInput): Promise<DesignerOutput> {
  const prompt = `
    You are an expert AI Designer. You need to beautify the following content.

    Title: ${input.content.title}
    Content: ${input.content.content}

    Your task:
    1. Suggest visual assets (images, videos, audio) that would enhance this article.
    2. Describe the layout strategy.

    For the assets, provide a description that could be used to generate them (we will mock the URL for now).
  `;

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      assets: z.array(z.object({
        type: z.enum(['image', 'video', 'audio']),
        description: z.string(),
        alt: z.string(),
      })),
      layoutSuggestion: z.string(),
    }),
    prompt: prompt,
  });

  // Mocking URLs for the assets based on description
  const assetsWithUrls = object.assets.map(asset => ({
    ...asset,
    url: `https://placehold.co/600x400?text=${encodeURIComponent(asset.type)}`, // Placeholder
  }));

  return {
    assets: assetsWithUrls,
    layoutSuggestion: object.layoutSuggestion,
  };
}
