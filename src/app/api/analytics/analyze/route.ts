import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsEngine } from '@/lib/analytics/analytics-engine'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'

// Singleton analytics engine
let analyticsEngine: AnalyticsEngine | null = null

async function getAnalyticsEngine(): Promise<AnalyticsEngine> {
  if (!analyticsEngine) {
    analyticsEngine = new AnalyticsEngine()
    await analyticsEngine.initialize()
  }
  return analyticsEngine
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const ticker = searchParams.get('ticker')
    const tickersParam = searchParams.get('tickers')
    const days = parseInt(searchParams.get('days') || '30')

    // Validate parameters
    if (!ticker && !tickersParam) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Either ticker or tickers parameter is required',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'analytics-analyze-api',
          operation: 'analyze',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    if (days < 1 || days > 365) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Days parameter must be between 1 and 365',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'analytics-analyze-api',
          operation: 'analyze',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const engine = await getAnalyticsEngine()

    // Single ticker analysis
    if (ticker) {
      const result = await engine.analyzeTicker(ticker.toUpperCase(), days)

      return NextResponse.json(createSuccessResponse({
        ticker: ticker.toUpperCase(),
        analysis: result,
        requestMetadata: {
          analysisType: 'single-ticker',
          days,
          requestId
        }
      }, requestId))
    }

    // Multiple tickers analysis
    if (tickersParam) {
      const tickers = tickersParam
        .split(',')
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0)

      if (tickers.length === 0) {
        const error: ApplicationError = {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'At least one valid ticker must be provided',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'analytics-analyze-api',
            operation: 'analyze',
            requestId
          },
          retryable: false
        }
        return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
      }

      if (tickers.length > 20) {
        const error: ApplicationError = {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Maximum 20 tickers can be analyzed at once',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'analytics-analyze-api',
            operation: 'analyze',
            requestId,
            additionalData: { tickerCount: tickers.length }
          },
          retryable: false
        }
        return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
      }

      const result = await engine.analyzeMultipleTickers(tickers, days)

      return NextResponse.json(createSuccessResponse({
        tickers,
        analysis: result,
        requestMetadata: {
          analysisType: 'multi-ticker',
          tickerCount: tickers.length,
          days,
          requestId
        }
      }, requestId))
    }

  } catch (error) {
    console.error('Analytics analyze API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred during analysis',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'analytics-analyze-api',
        operation: 'analyze',
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
    const body = await request.json()

    // Validate request body
    if (!body.tickers || !Array.isArray(body.tickers)) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Request body must contain a "tickers" array',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'analytics-analyze-api',
          operation: 'batch-analyze',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const tickers = body.tickers.map((t: string) => t.trim().toUpperCase()).filter((t: string) => t.length > 0)
    const days = body.days || 30
    const includeDetailed = body.includeDetailed || false

    if (tickers.length === 0 || tickers.length > 50) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Tickers array must contain between 1 and 50 valid ticker symbols',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'analytics-analyze-api',
          operation: 'batch-analyze',
          requestId,
          additionalData: { tickerCount: tickers.length }
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    if (days < 1 || days > 365) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Days parameter must be between 1 and 365',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'analytics-analyze-api',
          operation: 'batch-analyze',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const engine = await getAnalyticsEngine()

    if (includeDetailed) {
      // Process each ticker individually for detailed analysis
      const results = []

      for (const ticker of tickers) {
        try {
          const result = await engine.analyzeTicker(ticker, days)
          results.push({
            ticker,
            success: true,
            analysis: result
          })
        } catch (error) {
          results.push({
            ticker,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      return NextResponse.json(createSuccessResponse({
        results,
        requestMetadata: {
          analysisType: 'detailed-batch',
          tickerCount: tickers.length,
          days,
          requestId
        }
      }, requestId))
    } else {
      // Use batch processing for summary analysis
      const result = await engine.analyzeMultipleTickers(tickers, days)

      return NextResponse.json(createSuccessResponse({
        tickers,
        analysis: result,
        requestMetadata: {
          analysisType: 'batch-summary',
          tickerCount: tickers.length,
          days,
          requestId
        }
      }, requestId))
    }

  } catch (error) {
    console.error('Analytics batch analyze API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred during batch analysis',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'analytics-analyze-api',
        operation: 'batch-analyze',
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
    case ErrorCode.MISSING_DATA_ERROR:
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