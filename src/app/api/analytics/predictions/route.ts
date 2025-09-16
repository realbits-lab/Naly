import { NextRequest, NextResponse } from 'next/server'
import { PredictionEngine } from '@/lib/prediction/prediction-engine'
import { MarketEvent } from '@/types/market'
import { ModelType } from '@/types/analytics'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'

// Singleton prediction engine
let predictionEngine: PredictionEngine | null = null

async function getPredictionEngine(): Promise<PredictionEngine> {
  if (!predictionEngine) {
    predictionEngine = new PredictionEngine()
    await predictionEngine.configure({
      models: [ModelType.LSTM, ModelType.RANDOM_FOREST, ModelType.LINEAR_REGRESSION, ModelType.ARIMA],
      ensembleWeights: {
        [ModelType.LSTM]: 0.3,
        [ModelType.RANDOM_FOREST]: 0.25,
        [ModelType.LINEAR_REGRESSION]: 0.2,
        [ModelType.ARIMA]: 0.25
      },
      aggregationMethod: 'weighted_average',
      confidenceThreshold: 0.6,
      maxScenarios: 3
    })
  }
  return predictionEngine
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const body = await request.json()

    // Validate request body
    if (!body.event) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Request body must contain an "event" object',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'predictions-api',
          operation: 'generate-prediction',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    // Validate event structure
    const event = body.event as MarketEvent
    if (!event.id || !event.eventType || !event.ticker || !event.timestamp) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Event must contain id, eventType, ticker, and timestamp',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'predictions-api',
          operation: 'generate-prediction',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const engine = await getPredictionEngine()
    const context = body.context || {}

    // Generate prediction
    const prediction = await engine.generatePrediction(event, context)

    // Generate ensemble prediction if requested
    let ensemblePrediction
    if (body.includeEnsemble) {
      try {
        // Create mock predictions for ensemble
        const mockPredictions = [
          { modelType: ModelType.LSTM, bullCase: 120, baseCase: 100, bearCase: 80, confidence: 0.8 },
          { modelType: ModelType.RANDOM_FOREST, bullCase: 115, baseCase: 95, bearCase: 75, confidence: 0.75 }
        ]
        ensemblePrediction = await engine.getEnsemblePrediction(mockPredictions)
      } catch (error) {
        console.warn('Failed to generate ensemble prediction:', error)
      }
    }

    return NextResponse.json(createSuccessResponse({
      prediction,
      ensemblePrediction,
      metadata: {
        eventId: event.id,
        ticker: event.ticker,
        predictionTimestamp: new Date().toISOString(),
        includeEnsemble: !!body.includeEnsemble,
        context: context
      }
    }, requestId))

  } catch (error) {
    console.error('Predictions API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred during prediction generation',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'predictions-api',
        operation: 'generate-prediction',
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
    const body = await request.json()

    // Validate request body for calibration
    if (!body.historicalData || !Array.isArray(body.historicalData)) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Request body must contain a "historicalData" array',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'predictions-api',
          operation: 'calibrate-models',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    if (body.historicalData.length < 10) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'At least 10 historical data points are required for calibration',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'predictions-api',
          operation: 'calibrate-models',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const engine = await getPredictionEngine()

    // Calibrate models
    await engine.calibrateModels(body.historicalData)

    return NextResponse.json(createSuccessResponse({
      calibrationStatus: 'completed',
      dataPointsUsed: body.historicalData.length,
      calibrationTimestamp: new Date().toISOString(),
      message: 'Model calibration completed successfully'
    }, requestId))

  } catch (error) {
    console.error('Model calibration API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred during model calibration',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'predictions-api',
        operation: 'calibrate-models',
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
    const body = await request.json()

    // Validate request body for accuracy evaluation
    if (!body.predictions || !body.outcomes) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Request body must contain both "predictions" and "outcomes" arrays',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'predictions-api',
          operation: 'evaluate-accuracy',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    if (!Array.isArray(body.predictions) || !Array.isArray(body.outcomes)) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Both predictions and outcomes must be arrays',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'predictions-api',
          operation: 'evaluate-accuracy',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    if (body.predictions.length !== body.outcomes.length) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Predictions and outcomes arrays must have equal length',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'predictions-api',
          operation: 'evaluate-accuracy',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const engine = await getPredictionEngine()

    // Evaluate prediction accuracy
    const accuracy = await engine.evaluatePredictionAccuracy(body.predictions, body.outcomes)

    return NextResponse.json(createSuccessResponse({
      overallAccuracy: accuracy,
      evaluationMetrics: {
        totalPredictions: body.predictions.length,
        averageAccuracy: accuracy,
        accuracyPercentage: `${Math.round(accuracy * 100)}%`
      },
      evaluationTimestamp: new Date().toISOString()
    }, requestId))

  } catch (error) {
    console.error('Accuracy evaluation API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred during accuracy evaluation',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'predictions-api',
        operation: 'evaluate-accuracy',
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