import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { communityService } from '@/lib/community/community-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'

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
          operation: 'get-achievements',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Only allow users to see their own achievements unless they're admin
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      const error: ApplicationError = {
        code: ErrorCode.FORBIDDEN,
        message: 'Access denied',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'community-api',
          operation: 'get-achievements',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 403 })
    }

    const achievements = await communityService.getUserAchievements(userId)

    return NextResponse.json(createSuccessResponse({
      achievements,
      stats: {
        total: achievements.length,
        totalPoints: achievements.reduce((sum, achievement) => sum + achievement.points, 0),
        rareAchievements: achievements.filter(a => ['RARE', 'EPIC', 'LEGENDARY'].includes(a.rarity)).length
      }
    }, requestId))

  } catch (error) {
    console.error('Get achievements API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching achievements',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'community-api',
        operation: 'get-achievements',
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