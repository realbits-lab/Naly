import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { communityService } from '@/lib/community/community-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const replySchema = z.object({
  content: z.string().min(1).max(5000)
})

const voteSchema = z.object({
  voteType: z.enum(['up', 'down'])
})

export async function GET(
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
          operation: 'get-discussion',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const discussion = await communityService.getDiscussion(params.id)

    if (!discussion) {
      const error: ApplicationError = {
        code: ErrorCode.NOT_FOUND,
        message: 'Discussion not found',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'community-api',
          operation: 'get-discussion',
          requestId,
          additionalData: { discussionId: params.id }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 404 })
    }

    return NextResponse.json(createSuccessResponse({
      discussion
    }, requestId))

  } catch (error) {
    console.error('Get discussion API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching discussion',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'community-api',
        operation: 'get-discussion',
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
          operation: 'reply-discussion',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const body = await request.json()
    const action = body.action

    if (action === 'reply') {
      // Validate reply data
      const validationResult = replySchema.safeParse(body)
      if (!validationResult.success) {
        const error: ApplicationError = {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid reply data',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'community-api',
            operation: 'reply-discussion',
            requestId,
            additionalData: { validationErrors: validationResult.error.errors }
          },
          retryable: false
        }
        return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
      }

      const reply = await communityService.replyToDiscussion({
        authorId: session.user.id,
        parentId: params.id,
        content: validationResult.data.content
      })

      return NextResponse.json(createSuccessResponse({
        reply,
        message: 'Reply created successfully'
      }, requestId), { status: 201 })

    } else if (action === 'vote') {
      // Validate vote data
      const validationResult = voteSchema.safeParse(body)
      if (!validationResult.success) {
        const error: ApplicationError = {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid vote data',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'community-api',
            operation: 'vote-discussion',
            requestId,
            additionalData: { validationErrors: validationResult.error.errors }
          },
          retryable: false
        }
        return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
      }

      await communityService.voteOnDiscussion({
        userId: session.user.id,
        discussionId: params.id,
        voteType: validationResult.data.voteType
      })

      return NextResponse.json(createSuccessResponse({
        message: 'Vote recorded successfully'
      }, requestId))

    } else {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid action. Supported actions: reply, vote',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'community-api',
          operation: 'discussion-action',
          requestId,
          additionalData: { action, supportedActions: ['reply', 'vote'] }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

  } catch (error) {
    console.error('Discussion action API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while processing discussion action',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'community-api',
        operation: 'discussion-action',
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