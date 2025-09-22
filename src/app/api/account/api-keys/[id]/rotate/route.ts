import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiKeyService } from '@/lib/services/api-key-service';

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/account/api-keys/[id]/rotate - Rotate API key
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const newKey = await apiKeyService.rotateApiKey(id, session.user.id);

    if (!newKey) {
      return NextResponse.json(
        { error: 'API key not found or already revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newKey,
      message: 'API key rotated successfully. Please save this new key securely as it will not be shown again.',
    });
  } catch (error) {
    console.error('Error rotating API key:', error);
    return NextResponse.json(
      { error: 'Failed to rotate API key' },
      { status: 500 }
    );
  }
}