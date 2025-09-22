import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiKeyService } from '@/lib/services/api-key-service';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/account/api-keys/[id] - Get API key details and usage stats
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get API key details
    const apiKeys = await apiKeyService.getUserApiKeys(session.user.id);
    const apiKey = apiKeys.find(key => key.id === id);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Get usage statistics for the last 30 days
    const usageStats = await apiKeyService.getApiKeyUsageStats(id, 30);

    // Get recent logs
    const recentLogs = await apiKeyService.getApiKeyLogs(id, 50);

    return NextResponse.json({
      success: true,
      data: {
        key: apiKey,
        stats: {
          usage: usageStats,
          totalRequests: usageStats.reduce((sum, stat) => sum + stat.requestCount, 0),
          totalErrors: usageStats.reduce((sum, stat) => sum + stat.errorCount, 0),
          avgResponseTime: usageStats.length > 0
            ? Math.round(
                usageStats.reduce((sum, stat) => sum + (stat.avgResponseTime || 0), 0) /
                usageStats.length
              )
            : 0,
        },
        recentLogs,
      },
    });
  } catch (error) {
    console.error('Error fetching API key details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API key details' },
      { status: 500 }
    );
  }
}

// DELETE /api/account/api-keys/[id] - Revoke API key
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    const success = await apiKeyService.revokeApiKey(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'API key not found or already revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    );
  }
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
    const path = new URL(req.url).pathname;

    if (!path.endsWith('/rotate')) {
      return NextResponse.json(
        { error: 'Invalid endpoint' },
        { status: 404 }
      );
    }

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