import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { userService } from '@/lib/user/user-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  audienceType: z.enum(['RETAIL', 'INSTITUTIONAL', 'ACADEMIC']).optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  riskTolerance: z.enum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']).optional(),
  preferredComplexity: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  interests: z.array(z.string()).optional(),
  watchedTickers: z.array(z.string()).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    priceAlerts: z.boolean().optional(),
    newsAlerts: z.boolean().optional(),
    portfolioUpdates: z.boolean().optional()
  }).optional(),
  privacySettings: z.object({
    profileVisibility: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY']).optional(),
    shareAnalytics: z.boolean().optional(),
    allowRecommendations: z.boolean().optional()
  }).optional()
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
          service: 'user-api',
          operation: 'get-profile',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const userProfile = await userService.getUserById(session.user.id)

    if (!userProfile) {
      const error: ApplicationError = {
        code: ErrorCode.NOT_FOUND,
        message: 'User profile not found',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'user-api',
          operation: 'get-profile',
          requestId,
          additionalData: { userId: session.user.id }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 404 })
    }

    return NextResponse.json(createSuccessResponse({
      profile: userProfile,
      metadata: {
        lastUpdated: userProfile.updatedAt,
        profileComplete: calculateProfileCompleteness(userProfile),
        accountAge: Math.floor((Date.now() - userProfile.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      }
    }, requestId))

  } catch (error) {
    console.error('Get user profile API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching user profile',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'user-api',
        operation: 'get-profile',
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

export async function PUT(request: NextRequest) {
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
          service: 'user-api',
          operation: 'update-profile',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid profile data provided',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'user-api',
          operation: 'update-profile',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    // Log user behavior
    await userService.logUserBehavior(session.user.id, 'profile_update', {
      fields: Object.keys(validationResult.data),
      timestamp: new Date()
    })

    // Update profile
    const updatedProfile = await userService.updateUserProfile(session.user.id, validationResult.data)

    return NextResponse.json(createSuccessResponse({
      profile: updatedProfile,
      metadata: {
        updatedFields: Object.keys(validationResult.data),
        profileComplete: calculateProfileCompleteness(updatedProfile),
        lastUpdated: updatedProfile.updatedAt
      }
    }, requestId))

  } catch (error) {
    console.error('Update user profile API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while updating user profile',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'user-api',
        operation: 'update-profile',
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

export async function DELETE(request: NextRequest) {
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
          service: 'user-api',
          operation: 'delete-account',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    // Log account deletion request
    await userService.logUserBehavior(session.user.id, 'account_deletion_request', {
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent')
    })

    // For now, return not implemented as account deletion requires careful data handling
    const error: ApplicationError = {
      code: ErrorCode.NOT_FOUND,
      message: 'Account deletion not implemented - please contact support',
      severity: ErrorSeverity.LOW,
      metadata: {
        timestamp: new Date(),
        service: 'user-api',
        operation: 'delete-account',
        requestId
      },
      retryable: false
    }

    return NextResponse.json(createErrorResponse(error, requestId), { status: 501 })

  } catch (error) {
    console.error('Delete user account API error:', error)

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while processing account deletion request',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'user-api',
        operation: 'delete-account',
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

// Helper functions
function calculateProfileCompleteness(profile: any): number {
  const fields = [
    'displayName', 'audienceType', 'experienceLevel', 'riskTolerance',
    'preferredComplexity', 'timezone', 'language', 'interests', 'watchedTickers'
  ]

  const completedFields = fields.filter(field => {
    const value = profile[field]
    return value !== null && value !== undefined &&
           (Array.isArray(value) ? value.length > 0 : String(value).length > 0)
  })

  return Math.round((completedFields.length / fields.length) * 100)
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