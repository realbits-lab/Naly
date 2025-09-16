import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { communityService } from '@/lib/community/community-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const challengeFiltersSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional(),
  isActive: z.boolean().optional(),
  userId: z.string().uuid().optional()
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
          operation: 'get-challenges',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      category: searchParams.get('category') || undefined,
      difficulty: searchParams.get('difficulty') as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      userId: searchParams.get('userId') || undefined
    }

    // Validate filters
    const validationResult = challengeFiltersSchema.safeParse(filters)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid query parameters',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'community-api',
          operation: 'get-challenges',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const challenges = await communityService.getChallenges(validationResult.data)

    return NextResponse.json(createSuccessResponse({
      challenges,
      stats: {
        total: challenges.length,
        active: challenges.filter(c => c.isActive).length,
        categories: [...new Set(challenges.map(c => c.category))],
        difficulties: [...new Set(challenges.map(c => c.difficulty))]
      }
    }, requestId))

  } catch (error) {
    console.error('Get challenges API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching challenges',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'community-api',
        operation: 'get-challenges',
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