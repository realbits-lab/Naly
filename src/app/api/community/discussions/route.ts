import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { communityService } from '@/lib/community/community-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const createDiscussionSchema = z.object({
  title: z.string().max(255).optional(),
  content: z.string().min(1).max(10000),
  relatedEventId: z.string().uuid().optional(),
  relatedTicker: z.string().max(10).optional(),
  tags: z.array(z.string()).max(10).optional()
})

const discussionFiltersSchema = z.object({
  ticker: z.string().optional(),
  tags: z.array(z.string()).optional(),
  authorId: z.string().uuid().optional(),
  sortBy: z.enum(['latest', 'popular', 'controversial']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
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
          operation: 'get-discussions',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      ticker: searchParams.get('ticker') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      authorId: searchParams.get('authorId') || undefined,
      sortBy: searchParams.get('sortBy') as 'latest' | 'popular' | 'controversial' | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0
    }

    // Validate filters
    const validationResult = discussionFiltersSchema.safeParse(filters)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid query parameters',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'community-api',
          operation: 'get-discussions',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const discussions = await communityService.getDiscussions(validationResult.data)

    return NextResponse.json(createSuccessResponse({
      discussions,
      pagination: {
        limit: validationResult.data.limit || 20,
        offset: validationResult.data.offset || 0,
        hasMore: discussions.length === (validationResult.data.limit || 20)
      }
    }, requestId))

  } catch (error) {
    console.error('Get discussions API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching discussions',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'community-api',
        operation: 'get-discussions',
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

export async function POST(request: NextRequest) {
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
          operation: 'create-discussion',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = createDiscussionSchema.safeParse(body)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid discussion data',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'community-api',
          operation: 'create-discussion',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const discussionData = validationResult.data

    const discussion = await communityService.createDiscussion({
      authorId: session.user.id,
      title: discussionData.title,
      content: discussionData.content,
      relatedEventId: discussionData.relatedEventId,
      relatedTicker: discussionData.relatedTicker,
      tags: discussionData.tags
    })

    return NextResponse.json(createSuccessResponse({
      discussion,
      message: 'Discussion created successfully'
    }, requestId), { status: 201 })

  } catch (error) {
    console.error('Create discussion API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while creating discussion',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'community-api',
        operation: 'create-discussion',
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