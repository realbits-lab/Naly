import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { communityService } from '@/lib/community/community-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const joinChallengeSchema = z.object({
  action: z.literal('join')
})

const updateProgressSchema = z.object({
  action: z.literal('progress'),
  objectiveId: z.string(),
  value: z.number(),
  metadata: z.record(z.any()).optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
          operation: 'challenge-action',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const body = await request.json()
    const action = body.action

    if (action === 'join') {
      // Validate join data
      const validationResult = joinChallengeSchema.safeParse(body)
      if (!validationResult.success) {
        const error: ApplicationError = {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid join challenge data',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'community-api',
            operation: 'join-challenge',
            requestId,
            additionalData: { validationErrors: validationResult.error.errors }
          },
          retryable: false
        }
        return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
      }

      const progress = await communityService.joinChallenge(session.user.id, params.id)

      return NextResponse.json(createSuccessResponse({
        progress,
        message: 'Successfully joined challenge'
      }, requestId), { status: 201 })

    } else if (action === 'progress') {
      // Validate progress update data
      const validationResult = updateProgressSchema.safeParse(body)
      if (!validationResult.success) {
        const error: ApplicationError = {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid progress update data',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'community-api',
            operation: 'update-challenge-progress',
            requestId,
            additionalData: { validationErrors: validationResult.error.errors }
          },
          retryable: false
        }
        return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
      }

      const progress = await communityService.updateChallengeProgress(
        session.user.id,
        params.id,
        {
          objectiveId: validationResult.data.objectiveId,
          value: validationResult.data.value,
          metadata: validationResult.data.metadata
        }
      )

      return NextResponse.json(createSuccessResponse({
        progress,
        message: 'Progress updated successfully'
      }, requestId))

    } else {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid action. Supported actions: join, progress',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'community-api',
          operation: 'challenge-action',
          requestId,
          additionalData: { action, supportedActions: ['join', 'progress'] }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

  } catch (error) {
    console.error('Challenge action API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while processing challenge action',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'community-api',
        operation: 'challenge-action',
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