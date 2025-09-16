import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { recommendationEngine, RecommendationType, ContentType, InteractionType } from '@/lib/recommendations/recommendation-engine'
import { userService } from '@/lib/user/user-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const getRecommendationsSchema = z.object({
  types: z.array(z.enum([
    'INVESTMENT_OPPORTUNITY',
    'PORTFOLIO_REBALANCE',
    'CONTENT_DISCOVERY',
    'RISK_ALERT',
    'LEARNING_RESOURCE',
    'MARKET_INSIGHT',
    'TRADING_STRATEGY',
    'NEWS_ALERT'
  ])).optional(),
  limit: z.number().min(1).max(50).optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
})

const trackInteractionSchema = z.object({
  type: z.enum([
    'VIEW', 'LIKE', 'SHARE', 'COMMENT', 'BOOKMARK', 'CLICK', 'FOLLOW', 'TRADE'
  ]),
  objectId: z.string().min(1),
  objectType: z.enum(['narrative', 'prediction', 'visualization', 'recommendation']),
  metadata: z.record(z.any()).optional()
})

const updatePreferencesSchema = z.object({
  topics: z.array(z.string()).optional(),
  tickers: z.array(z.string()).optional(),
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  investmentStyle: z.enum(['value', 'growth', 'dividend', 'momentum', 'mixed']).optional(),
  timeHorizon: z.enum(['short', 'medium', 'long']).optional(),
  notificationFrequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
  contentComplexity: z.enum(['basic', 'intermediate', 'advanced', 'expert']).optional()
})

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const session = await auth()

    if (!session?.user) {
      const error: ApplicationError = {
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required for personalized recommendations',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'recommendations-api',
          operation: 'get-recommendations',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      types: searchParams.get('types')?.split(',') as RecommendationType[] | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') as 'low' | 'medium' | 'high' | 'urgent' | undefined
    }

    // Validate query parameters
    const validationResult = getRecommendationsSchema.safeParse(queryParams)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid query parameters',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'recommendations-api',
          operation: 'get-recommendations',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    // Get user profile and portfolio data
    const userProfile = await userService.getUserById(session.user.id)
    if (!userProfile) {
      const error: ApplicationError = {
        code: ErrorCode.NOT_FOUND,
        message: 'User profile not found',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'recommendations-api',
          operation: 'get-recommendations',
          requestId,
          additionalData: { userId: session.user.id }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 404 })
    }

    // Get user portfolio data
    const portfolioData = await getUserPortfolioData(session.user.id)

    // Build recommendation context
    const context = {
      userProfile,
      portfolioData,
      marketConditions: await getMarketConditions(),
      recentActivity: await getUserRecentActivity(session.user.id),
      preferences: await getUserPreferences(session.user.id)
    }

    // Generate recommendations
    const allRecommendations = await recommendationEngine.generateRecommendations(
      session.user.id,
      context
    )

    // Apply filters
    let filteredRecommendations = allRecommendations

    if (validationResult.data.types?.length) {
      filteredRecommendations = filteredRecommendations.filter(rec =>
        validationResult.data.types!.includes(rec.type)
      )
    }

    if (validationResult.data.category) {
      filteredRecommendations = filteredRecommendations.filter(rec =>
        rec.category.toLowerCase().includes(validationResult.data.category!.toLowerCase())
      )
    }

    if (validationResult.data.priority) {
      filteredRecommendations = filteredRecommendations.filter(rec =>
        rec.priority === validationResult.data.priority
      )
    }

    // Apply limit
    const recommendations = filteredRecommendations.slice(0, validationResult.data.limit || 10)

    // Log recommendation delivery for analytics
    await userService.logUserBehavior(session.user.id, 'recommendations_delivered', {
      count: recommendations.length,
      types: recommendations.map(r => r.type),
      timestamp: new Date()
    })

    return NextResponse.json(createSuccessResponse({
      recommendations,
      metadata: {
        totalGenerated: allRecommendations.length,
        totalFiltered: filteredRecommendations.length,
        returned: recommendations.length,
        generatedAt: new Date().toISOString(),
        filters: validationResult.data,
        userContext: {
          audienceType: userProfile.audienceType,
          experienceLevel: userProfile.experienceLevel,
          riskTolerance: userProfile.riskTolerance,
          portfolioValue: portfolioData?.totalValue || 0,
          positionCount: portfolioData?.positions?.length || 0
        }
      }
    }, requestId))

  } catch (error) {
    console.error('Get recommendations API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while generating recommendations',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'recommendations-api',
        operation: 'get-recommendations',
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
          service: 'recommendations-api',
          operation: 'track-interaction',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = trackInteractionSchema.safeParse(body)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid interaction data',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'recommendations-api',
          operation: 'track-interaction',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const interactionData = validationResult.data

    // Track the interaction
    await recommendationEngine.trackInteraction(session.user.id, {
      userId: session.user.id,
      type: interactionData.type as InteractionType,
      objectId: interactionData.objectId,
      objectType: interactionData.objectType,
      timestamp: new Date(),
      metadata: interactionData.metadata || {}
    })

    // Also log to user behavior for analytics
    await userService.logUserBehavior(session.user.id, `recommendation_${interactionData.type.toLowerCase()}`, {
      objectId: interactionData.objectId,
      objectType: interactionData.objectType,
      ...interactionData.metadata
    })

    return NextResponse.json(createSuccessResponse({
      tracked: true,
      interaction: {
        type: interactionData.type,
        objectId: interactionData.objectId,
        objectType: interactionData.objectType,
        timestamp: new Date().toISOString()
      }
    }, requestId))

  } catch (error) {
    console.error('Track interaction API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while tracking interaction',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'recommendations-api',
        operation: 'track-interaction',
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
          service: 'recommendations-api',
          operation: 'update-preferences',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = updatePreferencesSchema.safeParse(body)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid preferences data',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'recommendations-api',
          operation: 'update-preferences',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const preferences = validationResult.data

    // Update user preferences
    await recommendationEngine.updateUserProfile(session.user.id, preferences as any)

    // Log preference update
    await userService.logUserBehavior(session.user.id, 'recommendation_preferences_updated', {
      updatedFields: Object.keys(preferences),
      timestamp: new Date()
    })

    return NextResponse.json(createSuccessResponse({
      updated: true,
      preferences,
      updatedAt: new Date().toISOString()
    }, requestId))

  } catch (error) {
    console.error('Update preferences API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while updating preferences',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'recommendations-api',
        operation: 'update-preferences',
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
async function getUserPortfolioData(userId: string) {
  try {
    const portfolios = await userService.getUserPortfolios(userId)
    const defaultPortfolio = portfolios.find(p => p.isDefault) || portfolios[0]
    return defaultPortfolio || null
  } catch (error) {
    console.warn('Failed to get user portfolio data:', error)
    return null
  }
}

async function getMarketConditions() {
  // Mock market conditions - would fetch real data in production
  return {
    vixLevel: 18.5,
    marketTrend: 'bullish',
    sectorRotation: ['technology', 'healthcare'],
    volatility: 'medium'
  }
}

async function getUserRecentActivity(userId: string) {
  // Mock recent activity - would fetch from database in production
  return []
}

async function getUserPreferences(userId: string) {
  // Mock user preferences - would fetch from database in production
  return {
    topics: ['technology', 'growth'],
    tickers: ['AAPL', 'MSFT', 'GOOGL'],
    riskTolerance: 'moderate' as const,
    investmentStyle: 'growth' as const,
    timeHorizon: 'long' as const,
    notificationFrequency: 'daily' as const,
    contentComplexity: 'intermediate' as const
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