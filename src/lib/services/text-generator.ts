import * as fs from 'fs';
import * as path from 'path';

interface TextGenerationResult {
  text: string;
  model: string;
  tokensUsed: number;
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

// 2. Generate text using AI server
export async function generateTextWithAIServer(
  prompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopSequences?: string[];
  } = {}
): Promise<TextGenerationResult | null> {
  const apiKey = getAIServerApiKey();
  const serverUrl = process.env.AI_SERVER_TEXT_URL;

  if (!apiKey) {
    console.error('AI Server API key not found in .auth/user.json');
    return null;
  }

  if (!serverUrl) {
    console.error('AI_SERVER_TEXT_URL not configured');
    return null;
  }

  try {
    const response = await fetch(`${serverUrl}/api/v1/text/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        stop_sequences: options.stopSequences || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Server text generation error:', errorText);
      return null;
    }

    const data = await response.json();

    return {
      text: data.text,
      model: data.model,
      tokensUsed: data.tokens_used,
    };
  } catch (error) {
    console.error('AI Server text generation error:', error);
    return null;
  }
}

// 3. Stream text using AI server (Server-Sent Events)
export async function* streamTextWithAIServer(
  prompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stopSequences?: string[];
  } = {}
): AsyncGenerator<{ text: string; done: boolean; tokensUsed?: number }> {
  const apiKey = getAIServerApiKey();
  const serverUrl = process.env.AI_SERVER_TEXT_URL;

  if (!apiKey) {
    console.error('AI Server API key not found in .auth/user.json');
    return;
  }

  if (!serverUrl) {
    console.error('AI_SERVER_TEXT_URL not configured');
    return;
  }

  try {
    const response = await fetch(`${serverUrl}/api/v1/text/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        stop_sequences: options.stopSequences || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Server streaming error:', errorText);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('No response body reader');
      return;
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            yield {
              text: data.text,
              done: data.done,
              tokensUsed: data.tokens_used,
            };
            if (data.done) return;
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    console.error('AI Server streaming error:', error);
  }
}

// 4. Generate structured output using AI server
export async function generateStructuredWithAIServer<T>(
  prompt: string,
  schema: object,
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<{ output: T; isValid: boolean } | null> {
  console.log('='.repeat(60));
  console.log('[AI-SERVER-TEXT] Starting structured text generation...');

  const apiKey = getAIServerApiKey();
  const serverUrl = process.env.AI_SERVER_TEXT_URL;

  console.log('[AI-SERVER-TEXT] Config:', {
    serverUrl,
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
  });

  if (!apiKey) {
    console.error('[AI-SERVER-TEXT] ERROR: API key not found in .auth/user.json');
    return null;
  }

  if (!serverUrl) {
    console.error('[AI-SERVER-TEXT] ERROR: AI_SERVER_TEXT_URL not configured');
    return null;
  }

  const requestBody = {
    prompt: prompt,
    guided_decoding: {
      type: 'json',
      schema: schema,
    },
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature || 0.7,
  };

  console.log('[AI-SERVER-TEXT] Request:', {
    url: `${serverUrl}/api/v1/text/structured`,
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 100) + '...',
    maxTokens: requestBody.max_tokens,
    temperature: requestBody.temperature,
    schemaKeys: Object.keys((schema as Record<string, unknown>).properties || schema),
  });

  const startTime = Date.now();

  try {
    const response = await fetch(`${serverUrl}/api/v1/text/structured`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const elapsed = Date.now() - startTime;
    console.log(`[AI-SERVER-TEXT] Response status: ${response.status} (${elapsed}ms)`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI-SERVER-TEXT] ERROR Response:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('[AI-SERVER-TEXT] Response data keys:', Object.keys(data));
    console.log('[AI-SERVER-TEXT] Model used:', data.model);
    console.log('[AI-SERVER-TEXT] Is valid:', data.is_valid);
    console.log('[AI-SERVER-TEXT] Tokens used:', data.tokens_used);

    if (data.parsed_output) {
      console.log('[AI-SERVER-TEXT] Parsed output keys:', Object.keys(data.parsed_output));
    }

    console.log('[AI-SERVER-TEXT] SUCCESS: Structured text generated', {
      isValid: data.is_valid,
      totalTime: `${Date.now() - startTime}ms`,
    });
    console.log('='.repeat(60));

    return {
      output: data.parsed_output as T,
      isValid: data.is_valid,
    };
  } catch (error) {
    console.error('[AI-SERVER-TEXT] EXCEPTION:', error);
    return null;
  }
}

// 5. Check if AI server text generation is configured
export function isAIServerTextEnabled(): boolean {
  return process.env.TEXT_GENERATION_PROVIDER === 'ai-server';
}

// 6. Get the text generation provider
export function getTextGenerationProvider(): 'ai-server' | 'gemini' {
  return process.env.TEXT_GENERATION_PROVIDER === 'ai-server' ? 'ai-server' : 'gemini';
}
