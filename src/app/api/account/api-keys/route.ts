import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiKeyService, ApiScope } from '@/lib/services/api-key-service';
import { z } from 'zod';

// Schema for creating API key
const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.string()),
  rateLimit: z.number().min(1).max(10000).optional(),
  ipRestrictions: z.array(z.string()).optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/account/api-keys - List user's API keys
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiKeys = await apiKeyService.getUserApiKeys(session.user.id);

    return NextResponse.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST /api/account/api-keys - Create new API key
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createApiKeySchema.parse(body);

    // Validate scopes
    const validScopes = Object.keys(apiKeyService.API_SCOPES || {});
    const invalidScopes = validatedData.scopes.filter(
      scope => !validScopes.includes(scope)
    );

    if (invalidScopes.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid scopes',
          invalidScopes,
          validScopes,
        },
        { status: 400 }
      );
    }

    // Check user's API key limit (e.g., max 10 active keys)
    const existingKeys = await apiKeyService.getUserApiKeys(session.user.id);
    const activeKeys = existingKeys.filter(key => key.isActive);

    if (activeKeys.length >= 10) {
      return NextResponse.json(
        {
          error: 'API key limit reached',
          message: 'You can have a maximum of 10 active API keys. Please revoke unused keys.',
        },
        { status: 400 }
      );
    }

    // Create the API key
    const apiKeyResponse = await apiKeyService.createApiKey({
      userId: session.user.id,
      name: validatedData.name,
      scopes: validatedData.scopes as ApiScope[],
      rateLimit: validatedData.rateLimit,
      ipRestrictions: validatedData.ipRestrictions,
      expiresInDays: validatedData.expiresInDays,
      metadata: validatedData.metadata,
    });

    return NextResponse.json({
      success: true,
      data: apiKeyResponse,
      message: 'API key created successfully. Please save this key securely as it will not be shown again.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}