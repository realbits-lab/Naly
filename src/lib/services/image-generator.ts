import { put } from '@vercel/blob';

interface GeneratedImage {
  url: string;
  mimeType: string;
}

export async function generateAndStoreImage(prompt: string): Promise<GeneratedImage | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
    return null;
  }

  try {
    // 1. Generate image using Gemini API
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

    // 2. Extract base64 image from response
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

    const { mimeType, data: base64Data } = imagePart.inlineData;

    // 3. Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 4. Upload to Vercel Blob
    const filename = `article-${Date.now()}.${mimeType.split('/')[1] || 'png'}`;
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: mimeType,
    });

    return {
      url: blob.url,
      mimeType,
    };
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
}
