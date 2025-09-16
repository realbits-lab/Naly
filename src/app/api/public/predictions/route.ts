import { NextRequest, NextResponse } from 'next/server'
import { predictionEngine } from '@/lib/prediction/prediction-engine'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const predictionsQuerySchema = z.object({
  ticker: z.string().min(1).max(10).optional(),
  horizon: z.enum(['1d', '1w', '1m', '3m', '6m', '1y']).optional(),
  type: z.enum(['price', 'movement', 'volatility', 'trend']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  limit: z.number().min(1).max(50).default(10),
  includeAnalysis: z.boolean().default(true),
  format: z.enum(['json', 'csv']).default('json')
})

const generatePredictionSchema = z.object({
  ticker: z.string().min(1).max(10),
  horizon: z.enum(['1d', '1w', '1m', '3m', '6m', '1y']),
  type: z.enum(['price', 'movement', 'volatility', 'trend']).default('price'),
  features: z.array(z.enum([
    'technical_indicators',
    'market_sentiment',
    'fundamental_data',
    'macro_economic',
    'news_sentiment',
    'social_sentiment'
  ])).default(['technical_indicators', 'market_sentiment']),
  modelType: z.enum(['neural_network', 'ensemble', 'transformer', 'lstm']).default('ensemble'),
  includeUncertainty: z.boolean().default(true),
  includeExplanation: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Validate API key
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.UNAUTHORIZED,
          message: 'API key required. Get your API key at https://naly.ai/api-keys',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'public-api',
            operation: 'get-predictions',
            requestId
          },
          retryable: false
        }, requestId),
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams = {
      ticker: searchParams.get('ticker')?.toUpperCase() || undefined,
      horizon: searchParams.get('horizon') as any || undefined,
      type: searchParams.get('type') as any || undefined,
      confidence: searchParams.get('confidence') ? parseFloat(searchParams.get('confidence')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      includeAnalysis: searchParams.get('includeAnalysis') !== 'false',
      format: searchParams.get('format') as 'json' | 'csv' || 'json'
    }

    // Validate query parameters
    const validationResult = predictionsQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid query parameters',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'public-api',
            operation: 'get-predictions',
            requestId,
            additionalData: {
              validationErrors: validationResult.error.errors,
              supportedParams: {
                ticker: 'string (1-10 chars)',
                horizon: ['1d', '1w', '1m', '3m', '6m', '1y'],
                type: ['price', 'movement', 'volatility', 'trend'],
                confidence: 'number (0-1)',
                limit: 'number (1-50)',
                includeAnalysis: 'boolean',
                format: ['json', 'csv']
              }
            }
          },
          retryable: false
        }, requestId),
        {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    const data = validationResult.data

    // Generate mock predictions data
    const generatePredictions = () => {
      const mockTickers = data.ticker ? [data.ticker] : ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX']
      const predictions = []

      for (const ticker of mockTickers.slice(0, data.limit)) {
        const basePrice = 150 + Math.random() * 200
        const horizon = data.horizon || ['1d', '1w', '1m', '3m'][Math.floor(Math.random() * 4)]
        const predictionType = data.type || ['price', 'movement', 'volatility'][Math.floor(Math.random() * 3)]

        let prediction: any = {
          id: `pred_${ticker.toLowerCase()}_${Date.now()}`,
          ticker,
          type: predictionType,
          horizon,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          confidence: Math.min(Math.max(0.6 + Math.random() * 0.3, 0.6), 0.95),
          model: {
            name: 'Naly Prediction Engine v2.1',
            type: 'ensemble',
            features: ['technical_indicators', 'market_sentiment', 'fundamental_data'],
            accuracy: 0.72 + Math.random() * 0.18
          }
        }

        if (predictionType === 'price') {
          const currentPrice = basePrice
          const predictedPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.2)
          const change = predictedPrice - currentPrice
          const changePercent = change / currentPrice

          prediction.currentPrice = currentPrice
          prediction.predictedPrice = predictedPrice
          prediction.change = change
          prediction.changePercent = changePercent
          prediction.uncertainty = {
            lower: predictedPrice * 0.95,
            upper: predictedPrice * 1.05,
            standardDeviation: predictedPrice * 0.03
          }
        } else if (predictionType === 'movement') {
          const direction = Math.random() > 0.5 ? 'up' : 'down'
          const magnitude = Math.random() * 0.1

          prediction.direction = direction
          prediction.magnitude = magnitude
          prediction.probability = {
            up: direction === 'up' ? 0.6 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3,
            down: direction === 'down' ? 0.6 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3,
            neutral: 0.1 + Math.random() * 0.2
          }
        } else if (predictionType === 'volatility') {
          const currentVol = 0.2 + Math.random() * 0.3
          const predictedVol = currentVol * (1 + (Math.random() - 0.5) * 0.4)

          prediction.currentVolatility = currentVol
          prediction.predictedVolatility = predictedVol
          prediction.volatilityChange = predictedVol - currentVol
          prediction.regime = predictedVol > 0.3 ? 'high' : predictedVol > 0.2 ? 'medium' : 'low'
        }

        // Add analysis if requested
        if (data.includeAnalysis) {
          prediction.analysis = {
            keyFactors: [
              'Technical momentum indicators showing bullish divergence',
              'Market sentiment remains positive despite recent volatility',
              'Strong institutional buying pressure observed'
            ],
            risks: [
              'Broader market uncertainty may impact performance',
              'Upcoming earnings season could introduce volatility',
              'Federal Reserve policy decisions pending'
            ],
            supportLevels: predictionType === 'price' ? [
              prediction.currentPrice * 0.95,
              prediction.currentPrice * 0.90
            ] : undefined,
            resistanceLevels: predictionType === 'price' ? [
              prediction.currentPrice * 1.05,
              prediction.currentPrice * 1.10
            ] : undefined
          }
        }

        // Apply confidence filter if specified
        if (!data.confidence || prediction.confidence >= data.confidence) {
          predictions.push(prediction)
        }
      }

      return predictions.slice(0, data.limit)
    }

    const predictions = generatePredictions()

    if (data.format === 'csv') {
      // Convert predictions to CSV format
      const headers = ['ticker', 'type', 'horizon', 'confidence', 'createdAt']

      if (predictions[0]?.predictedPrice) {
        headers.push('currentPrice', 'predictedPrice', 'change', 'changePercent')
      }
      if (predictions[0]?.direction) {
        headers.push('direction', 'magnitude')
      }
      if (predictions[0]?.predictedVolatility) {
        headers.push('currentVolatility', 'predictedVolatility', 'volatilityChange', 'regime')
      }

      const csvContent = [
        headers.join(','),
        ...predictions.map(pred =>
          headers.map(header => pred[header] || '').join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="predictions_${Date.now()}.csv"`,
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': Math.floor((Date.now() + 3600000) / 1000).toString(),
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=600'
        }
      })
    }

    return NextResponse.json(
      createSuccessResponse({
        predictions,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          apiVersion: '1.0',
          totalResults: predictions.length,
          filters: {
            ticker: data.ticker,
            horizon: data.horizon,
            type: data.type,
            minConfidence: data.confidence
          },
          disclaimer: 'Predictions are for informational purposes only and should not be considered as financial advice. Past performance does not guarantee future results.',
          rateLimit: {
            remaining: 99,
            reset: Math.floor((Date.now() + 3600000) / 1000)
          }
        }
      }, requestId),
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': Math.floor((Date.now() + 3600000) / 1000).toString(),
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=600' // 10 minutes cache
        }
      }
    )

  } catch (error) {
    console.error('Public predictions API error:', error)

    const genericError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching predictions',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'public-api',
        operation: 'get-predictions',
        requestId,
        additionalData: {
          originalError: error instanceof Error ? error.message : String(error)
        }
      },
      retryable: true
    }

    return NextResponse.json(
      createErrorResponse(genericError, requestId),
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Validate API key for prediction generation
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.UNAUTHORIZED,
          message: 'API key required for prediction generation. Get your API key at https://naly.ai/api-keys',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'public-api',
            operation: 'generate-prediction',
            requestId
          },
          retryable: false
        }, requestId),
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const body = await request.json()

    // Validate request body
    const validationResult = generatePredictionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid request body for prediction generation',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'public-api',
            operation: 'generate-prediction',
            requestId,
            additionalData: {
              validationErrors: validationResult.error.errors,
              requiredFields: ['ticker', 'horizon'],
              supportedValues: {
                ticker: 'string (1-10 chars)',
                horizon: ['1d', '1w', '1m', '3m', '6m', '1y'],
                type: ['price', 'movement', 'volatility', 'trend'],
                features: ['technical_indicators', 'market_sentiment', 'fundamental_data', 'macro_economic', 'news_sentiment', 'social_sentiment'],
                modelType: ['neural_network', 'ensemble', 'transformer', 'lstm']
              }
            }
          },
          retryable: false
        }, requestId),
        {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    const requestData = validationResult.data

    // Generate custom prediction
    const basePrice = 150 + Math.random() * 100
    const processingTime = 1200 + Math.random() * 800 // Mock processing time

    const prediction = {
      id: `pred_custom_${requestId.slice(0, 8)}`,
      ticker: requestData.ticker.toUpperCase(),
      type: requestData.type,
      horizon: requestData.horizon,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + getExpirationTime(requestData.horizon)).toISOString(),
      confidence: 0.75 + Math.random() * 0.2,
      model: {
        name: `Naly ${requestData.modelType.replace('_', ' ')} Model v2.1`,
        type: requestData.modelType,
        features: requestData.features,
        accuracy: 0.72 + Math.random() * 0.18,
        trainingData: '10 years historical data',
        lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      processingTimeMs: Math.round(processingTime),
      customGenerated: true
    }

    // Add prediction data based on type
    if (requestData.type === 'price') {
      const predictedPrice = basePrice * (1 + (Math.random() - 0.5) * 0.15)
      const change = predictedPrice - basePrice
      const changePercent = change / basePrice

      Object.assign(prediction, {
        currentPrice: basePrice,
        predictedPrice,
        change,
        changePercent,
        uncertainty: requestData.includeUncertainty ? {
          lower: predictedPrice * 0.92,
          upper: predictedPrice * 1.08,
          standardDeviation: predictedPrice * 0.04,
          confidenceInterval: 0.95
        } : undefined
      })
    }

    // Add explanation if requested
    if (requestData.includeExplanation) {
      Object.assign(prediction, {
        explanation: {
          methodology: `This prediction uses a ${requestData.modelType} model trained on historical data and ${requestData.features.join(', ')} to forecast ${requestData.type} movements over a ${requestData.horizon} time horizon.`,
          keyFactors: getKeyFactors(requestData.features, requestData.ticker),
          dataQuality: {
            completeness: 0.95,
            accuracy: 0.92,
            timeliness: 0.98,
            sources: ['market_data', 'financial_statements', 'news_feeds', 'social_media']
          },
          limitations: [
            'Model performance may vary during extreme market conditions',
            'Predictions are based on historical patterns and may not account for unprecedented events',
            'External factors such as regulatory changes may impact accuracy'
          ]
        }
      })
    }

    return NextResponse.json(
      createSuccessResponse({
        prediction,
        generationInfo: {
          processingTimeMs: Math.round(processingTime),
          modelResourcesUsed: 'high',
          computeCost: 0.05, // Mock cost in credits
          featuresProcessed: requestData.features.length,
          dataPointsAnalyzed: 10000 + Math.floor(Math.random() * 5000)
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          apiVersion: '1.0',
          rateLimit: {
            remaining: 24, // Lower limit for custom generation
            reset: Math.floor((Date.now() + 3600000) / 1000)
          }
        }
      }, requestId),
      {
        status: 201,
        headers: {
          'X-RateLimit-Remaining': '24',
          'X-RateLimit-Reset': Math.floor((Date.now() + 3600000) / 1000).toString(),
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Generate prediction API error:', error)

    const genericError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while generating prediction',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'public-api',
        operation: 'generate-prediction',
        requestId,
        additionalData: {
          originalError: error instanceof Error ? error.message : String(error)
        }
      },
      retryable: true
    }

    return NextResponse.json(
      createErrorResponse(genericError, requestId),
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
}

function getExpirationTime(horizon: string): number {
  const expirationMap = {
    '1d': 6 * 60 * 60 * 1000,     // 6 hours
    '1w': 24 * 60 * 60 * 1000,    // 24 hours
    '1m': 7 * 24 * 60 * 60 * 1000, // 7 days
    '3m': 30 * 24 * 60 * 60 * 1000, // 30 days
    '6m': 60 * 24 * 60 * 60 * 1000, // 60 days
    '1y': 180 * 24 * 60 * 60 * 1000  // 180 days
  }

  return expirationMap[horizon as keyof typeof expirationMap] || 24 * 60 * 60 * 1000
}

function getKeyFactors(features: string[], ticker: string): string[] {
  const factorMap: { [key: string]: string[] } = {
    'technical_indicators': [
      'RSI showing oversold conditions with potential reversal signals',
      'Moving averages indicating strong momentum continuation',
      'Volume patterns suggest institutional accumulation'
    ],
    'market_sentiment': [
      'Options flow showing bullish bias among professional traders',
      'Social media sentiment trending positive for the sector',
      'Analyst upgrade cycle beginning for comparable companies'
    ],
    'fundamental_data': [
      'Strong earnings growth trajectory supported by revenue expansion',
      'Balance sheet strength provides downside protection',
      'Improving profit margins indicate operational efficiency'
    ],
    'macro_economic': [
      'Interest rate environment favorable for growth stocks',
      'Economic indicators support consumer discretionary spending',
      'Currency trends benefiting multinational operations'
    ],
    'news_sentiment': [
      'Recent product announcements driving positive coverage',
      'Management commentary indicating confidence in guidance',
      'Industry tailwinds supporting sector rotation'
    ],
    'social_sentiment': [
      'Retail investor interest increasing based on discussion volume',
      'Influencer mentions trending positive for the brand',
      'Community sentiment analysis shows growing optimism'
    ]
  }

  const selectedFactors: string[] = []
  features.forEach(feature => {
    if (factorMap[feature]) {
      selectedFactors.push(factorMap[feature][Math.floor(Math.random() * factorMap[feature].length)])
    }
  })

  return selectedFactors
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Max-Age': '86400'
      }
    }
  )
}