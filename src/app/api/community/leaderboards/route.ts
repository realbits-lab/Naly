import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { communityService } from '@/lib/community/community-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const leaderboardQuerySchema = z.object({
  type: z.string().min(1).default('community_points'),
  period: z.enum(['daily', 'weekly', 'monthly', 'all_time']).default('monthly'),
  limit: z.number().min(1).max(100).default(10)
})

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const session = await auth()

    if (!session?.user) {
      const error: ApplicationError = {
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'community-api',
          operation: 'get-leaderboards',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      type: searchParams.get('type') || 'community_points',
      period: searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'all_time' || 'monthly',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10
    }

    // Validate query parameters
    const validationResult = leaderboardQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid query parameters',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'community-api',
          operation: 'get-leaderboards',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const leaderboard = await communityService.getLeaderboards(
      validationResult.data.type,
      validationResult.data.period,
      validationResult.data.limit
    )

    // Get current user's position if they're not in the top results
    let currentUserRank = null
    const currentUserEntry = leaderboard.find(entry => entry.userId === session.user.id)
    if (!currentUserEntry) {
      // This would normally query for user's actual rank
      currentUserRank = {
        userId: session.user.id,
        rank: 999,
        score: 0,
        user: {
          id: session.user.id,
          name: session.user.name || 'Anonymous',
          avatarUrl: session.user.image
        }
      }
    }

    return NextResponse.json(createSuccessResponse({
      leaderboard,
      currentUser: currentUserEntry || currentUserRank,
      metadata: {
        type: validationResult.data.type,
        period: validationResult.data.period,
        totalEntries: leaderboard.length,
        generatedAt: new Date().toISOString()
      }
    }, requestId))

  } catch (error) {
    console.error('Get leaderboards API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching leaderboards',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'community-api',
        operation: 'get-leaderboards',
        requestId,
        additionalData: {
          originalError: error instanceof Error ? error.message : String(error)
        }
      },
      retryable: true
    }

    return NextResponse.json(createErrorResponse(genericError, requestId), { status: 500 })
  }
}

function getHttpStatusFromErrorCode(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
      return 400
    case ErrorCode.UNAUTHORIZED:
      return 401
    case ErrorCode.FORBIDDEN:
      return 403
    case ErrorCode.NOT_FOUND:
      return 404
    case ErrorCode.RATE_LIMITED:
    case ErrorCode.API_RATE_LIMIT_ERROR:
      return 429
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503
    case ErrorCode.API_TIMEOUT:
      return 504
    default:
      return 500
  }
}