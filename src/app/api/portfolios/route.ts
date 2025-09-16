import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { userService } from '@/lib/user/user-service'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'
import { db } from '@/lib/db'
import { userPortfolios, portfolioHoldings } from '@/lib/schema/users'
import { eq } from 'drizzle-orm'

const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required').max(100, 'Portfolio name too long'),
  description: z.string().optional(),
  type: z.enum(['REAL', 'PAPER', 'WATCHLIST']).default('PAPER'),
  isDefault: z.boolean().default(false),
  currency: z.string().default('USD'),
  initialValue: z.number().min(0).default(0),
  settings: z.object({
    autoRebalance: z.boolean().default(false),
    riskLevel: z.enum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']).default('MODERATE'),
    allowShortSelling: z.boolean().default(false),
    allowOptions: z.boolean().default(false),
    allowCrypto: z.boolean().default(false)
  }).optional()
})

const addHoldingSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required'),
  quantity: z.number().min(0.00001, 'Quantity must be positive'),
  averageCost: z.number().min(0, 'Average cost must be non-negative'),
  addedAt: z.string().datetime().optional()
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
          service: 'portfolios-api',
          operation: 'get-portfolios',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const portfolios = await userService.getUserPortfolios(session.user.id)

    // Enrich portfolios with current values and performance metrics
    const enrichedPortfolios = await Promise.all(
      portfolios.map(async (portfolio) => {
        // Get portfolio holdings
        const holdings = await db
          .select()
          .from(portfolioHoldings)
          .where(eq(portfolioHoldings.portfolioId, portfolio.id))

        // Calculate portfolio metrics (simplified for now)
        const totalValue = holdings.reduce((sum, holding) =>
          sum + (holding.quantity * holding.averageCost), 0)

        const totalCost = holdings.reduce((sum, holding) =>
          sum + (holding.quantity * holding.averageCost), 0)

        const unrealizedPnL = totalValue - totalCost
        const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0

        return {
          ...portfolio,
          holdings: holdings.length,
          totalValue,
          totalCost,
          unrealizedPnL,
          unrealizedPnLPercent,
          dayChange: 0, // Would need real-time price data
          dayChangePercent: 0
        }
      })
    )

    return NextResponse.json(createSuccessResponse({
      portfolios: enrichedPortfolios,
      metadata: {
        totalPortfolios: enrichedPortfolios.length,
        totalValue: enrichedPortfolios.reduce((sum, p) => sum + p.totalValue, 0),
        hasDefaultPortfolio: enrichedPortfolios.some(p => p.isDefault)
      }
    }, requestId))

  } catch (error) {
    console.error('Get portfolios API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching portfolios',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'portfolios-api',
        operation: 'get-portfolios',
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
          service: 'portfolios-api',
          operation: 'create-portfolio',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 401 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = createPortfolioSchema.safeParse(body)
    if (!validationResult.success) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid portfolio data provided',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'portfolios-api',
          operation: 'create-portfolio',
          requestId,
          additionalData: { validationErrors: validationResult.error.errors }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const portfolioData = validationResult.data

    // Check if setting as default portfolio
    if (portfolioData.isDefault) {
      // Remove default flag from other portfolios
      await db
        .update(userPortfolios)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(userPortfolios.userId, session.user.id))
    }

    // Create new portfolio
    const [newPortfolio] = await db.insert(userPortfolios).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name: portfolioData.name,
      description: portfolioData.description || '',
      type: portfolioData.type,
      isDefault: portfolioData.isDefault,
      currency: portfolioData.currency,
      totalValue: portfolioData.initialValue,
      totalCost: portfolioData.initialValue,
      unrealizedPnL: 0,
      realizedPnL: 0,
      settings: portfolioData.settings || {
        autoRebalance: false,
        riskLevel: 'MODERATE',
        allowShortSelling: false,
        allowOptions: false,
        allowCrypto: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()

    // Log portfolio creation
    await userService.logUserBehavior(session.user.id, 'portfolio_created', {
      portfolioId: newPortfolio.id,
      portfolioName: newPortfolio.name,
      portfolioType: newPortfolio.type,
      timestamp: new Date()
    })

    return NextResponse.json(createSuccessResponse({
      portfolio: newPortfolio,
      metadata: {
        portfolioId: newPortfolio.id,
        createdAt: newPortfolio.createdAt
      }
    }, requestId), { status: 201 })

  } catch (error) {
    console.error('Create portfolio API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while creating portfolio',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'portfolios-api',
        operation: 'create-portfolio',
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