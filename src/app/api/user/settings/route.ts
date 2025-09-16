import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { userService } from '@/lib/user/user-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  theme: z.enum(['LIGHT', 'DARK', 'AUTO']).optional(),
  dashboardLayout: z.enum(['DEFAULT', 'COMPACT', 'DETAILED', 'CUSTOM']).optional(),
  defaultTimeframe: z.enum(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX']).optional(),
  autoRefresh: z.boolean().optional(),
  showPredictions: z.boolean().optional(),
  showNarratives: z.boolean().optional(),
  enableNotifications: z.boolean().optional(),
  dataRetentionDays: z.number().min(30).max(2555).optional(), // 30 days to 7 years
  customDashboard: z.object({
    widgets: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number()
      }),
      config: z.record(z.any())
    })).optional(),
    layout: z.enum(['GRID', 'MASONRY', 'FLOW']).optional()
  }).optional(),
  tradingSettings: z.object({
    defaultOrderType: z.enum(['MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LIMIT']).optional(),
    confirmOrders: z.boolean().optional(),
    showAdvancedMetrics: z.boolean().optional(),
    riskWarnings: z.boolean().optional()
  }).optional(),
  chartSettings: z.object({
    defaultChartType: z.enum(['LINE', 'CANDLESTICK', 'BAR', 'AREA']).optional(),
    showVolume: z.boolean().optional(),
    showIndicators: z.boolean().optional(),
    indicators: z.array(z.string()).optional(),
    colorScheme: z.enum(['BULL_BEAR', 'BLUE_RED', 'GREEN_RED', 'CUSTOM']).optional()
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
          service: 'user-settings-api',
          operation: 'get-settings',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const userProfile = await userService.getUserById(session.user.id)

    if (!userProfile || !userProfile.settings) {
      const error: ApplicationError = {
        code: ErrorCode.NOT_FOUND,
        message: 'User settings not found',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'user-settings-api',
          operation: 'get-settings',
          requestId,
          additionalData: { userId: session.user.id }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 404 })
    }

    return NextResponse.json(createSuccessResponse({
      settings: userProfile.settings,
      metadata: {
        lastUpdated: userProfile.updatedAt,
        settingsVersion: '1.0'
      }
    }, requestId))

  } catch (error) {
    console.error('Get user settings API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching user settings',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'user-settings-api',
        operation: 'get-settings',
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
          service: 'user-settings-api',
          operation: 'update-settings',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = updateSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid settings data provided',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'user-settings-api',
          operation: 'update-settings',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    // Log settings update
    await userService.logUserBehavior(session.user.id, 'settings_update', {
      updatedSettings: Object.keys(validationResult.data),
      timestamp: new Date()
    })

    // Update settings
    await userService.updateUserSettings(session.user.id, validationResult.data)

    // Get updated user profile to return current settings
    const updatedProfile = await userService.getUserById(session.user.id)

    return NextResponse.json(createSuccessResponse({
      settings: updatedProfile?.settings,
      metadata: {
        updatedFields: Object.keys(validationResult.data),
        lastUpdated: new Date(),
        settingsVersion: '1.0'
      }
    }, requestId))

  } catch (error) {
    console.error('Update user settings API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while updating user settings',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'user-settings-api',
        operation: 'update-settings',
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

export async function PATCH(request: NextRequest) {
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
          service: 'user-settings-api',
          operation: 'reset-settings',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    // Reset to default settings
    const defaultSettings = {
      theme: 'AUTO',
      dashboardLayout: 'DEFAULT',
      defaultTimeframe: '1D',
      autoRefresh: true,
      showPredictions: true,
      showNarratives: true,
      enableNotifications: true,
      dataRetentionDays: 365
    }

    // Log settings reset
    await userService.logUserBehavior(session.user.id, 'settings_reset', {
      timestamp: new Date()
    })

    await userService.updateUserSettings(session.user.id, defaultSettings)

    return NextResponse.json(createSuccessResponse({
      settings: defaultSettings,
      metadata: {
        resetAt: new Date(),
        settingsVersion: '1.0'
      }
    }, requestId))

  } catch (error) {
    console.error('Reset user settings API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while resetting user settings',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'user-settings-api',
        operation: 'reset-settings',
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