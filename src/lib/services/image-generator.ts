import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

interface GeneratedImage {
  url: string;
  mimeType: string;
}

// 1. Get API key from .auth/user.json for AI server
function getAIServerApiKey(): string | null {
  try {
    const authPath = path.join(process.cwd(), '.auth', 'user.json');
    const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    // Use writer profile from develop environment
    return authData.develop?.profiles?.writer?.apiKey || null;
  } catch {
    return null;
  }
}

// 2. Generate image using AI server
async function generateImageWithAIServer(prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  console.log('[AI-SERVER-IMAGE] Starting image generation...');

  const apiKey = getAIServerApiKey();
  const serverUrl = process.env.AI_SERVER_IMAGE_URL;

  console.log('[AI-SERVER-IMAGE] Config:', {
    serverUrl,
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
  });

  if (!apiKey) {
    console.error('[AI-SERVER-IMAGE] ERROR: API key not found in .auth/user.json');
    return null;
  }

  if (!serverUrl) {
    console.error('[AI-SERVER-IMAGE] ERROR: AI_SERVER_IMAGE_URL not configured');
    return null;
  }

  const requestBody = {
    prompt: prompt,
    width: 1664,
    height: 928,
    num_inference_steps: 4,
    guidance_scale: 1.0,
  };

  console.log('[AI-SERVER-IMAGE] Request:', {
    url: `${serverUrl}/api/v1/images/generate`,
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 100) + '...',
    ...requestBody,
  });

  const startTime = Date.now();

  try {
    const response = await fetch(`${serverUrl}/api/v1/images/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const elapsed = Date.now() - startTime;
    console.log(`[AI-SERVER-IMAGE] Response status: ${response.status} (${elapsed}ms)`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI-SERVER-IMAGE] ERROR Response:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('[AI-SERVER-IMAGE] Response data keys:', Object.keys(data));
    console.log('[AI-SERVER-IMAGE] Model used:', data.model);
    console.log('[AI-SERVER-IMAGE] Seed:', data.seed);

    // AI server returns base64 image with data URL prefix
    const imageUrl = data.image_url;
    if (!imageUrl) {
      console.error('[AI-SERVER-IMAGE] ERROR: No image_url in response');
      return null;
    }

    console.log('[AI-SERVER-IMAGE] image_url length:', imageUrl.length);

    // Extract base64 data from data URL (data:image/png;base64,...)
    const base64Match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      console.error('[AI-SERVER-IMAGE] ERROR: Invalid image_url format');
      console.error('[AI-SERVER-IMAGE] image_url preview:', imageUrl.substring(0, 50));
      return null;
    }

    console.log('[AI-SERVER-IMAGE] SUCCESS: Image generated', {
      mimeType: base64Match[1],
      base64Length: base64Match[2].length,
      totalTime: `${Date.now() - startTime}ms`,
    });

    return {
      mimeType: base64Match[1],
      base64: base64Match[2],
    };
  } catch (error) {
    console.error('[AI-SERVER-IMAGE] EXCEPTION:', error);
    return null;
  }
}

// 3. Generate image using Gemini
async function generateImageWithGemini(prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return null;
    }

    const data = await response.json();

    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      console.error('No candidates in response');
      return null;
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      console.error('No parts in response');
      return null;
    }

    const imagePart = parts.find((part: any) => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
      console.error('No image data in response');
      return null;
    }

    return {
      mimeType: imagePart.inlineData.mimeType,
      base64: imagePart.inlineData.data,
    };
  } catch (error) {
    console.error('Gemini image generation error:', error);
    return null;
  }
}

// 4. Main function - routes to appropriate provider
export async function generateAndStoreImage(prompt: string): Promise<GeneratedImage | null> {
  const provider = process.env.IMAGE_GENERATION_PROVIDER || 'gemini';

  console.log('='.repeat(60));
  console.log('[IMAGE-GENERATOR] Starting image generation');
  console.log('[IMAGE-GENERATOR] Provider:', provider);
  console.log('[IMAGE-GENERATOR] Environment check:', {
    IMAGE_GENERATION_PROVIDER: process.env.IMAGE_GENERATION_PROVIDER,
    AI_SERVER_IMAGE_URL: process.env.AI_SERVER_IMAGE_URL,
    hasGoogleKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  console.log('='.repeat(60));

  let imageData: { base64: string; mimeType: string } | null = null;

  if (provider === 'ai-server') {
    console.log('[IMAGE-GENERATOR] Routing to AI Server...');
    imageData = await generateImageWithAIServer(prompt);
  } else {
    console.log('[IMAGE-GENERATOR] Routing to Gemini...');
    imageData = await generateImageWithGemini(prompt);
  }

  if (!imageData) {
    console.error('[IMAGE-GENERATOR] FAILED: No image data returned from provider');
    return null;
  }

  console.log('[IMAGE-GENERATOR] Image data received, uploading to Vercel Blob...');

  try {
    // 5. Convert base64 to buffer and upload to Vercel Blob
    const imageBuffer = Buffer.from(imageData.base64, 'base64');
    const filename = `article-${Date.now()}.${imageData.mimeType.split('/')[1] || 'png'}`;

    console.log('[IMAGE-GENERATOR] Uploading:', { filename, bufferSize: imageBuffer.length });

    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: imageData.mimeType,
    });

    console.log('[IMAGE-GENERATOR] SUCCESS: Image uploaded to Vercel Blob');
    console.log('[IMAGE-GENERATOR] Blob URL:', blob.url);
    console.log('='.repeat(60));

    return {
      url: blob.url,
      mimeType: imageData.mimeType,
    };
  } catch (error) {
    console.error('[IMAGE-GENERATOR] EXCEPTION during upload:', error);
    return null;
  }
}
