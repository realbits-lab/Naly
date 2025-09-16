import { NextRequest, NextResponse } from 'next/server'
import { NarrativeGenerator } from '@/lib/narrative/narrative-generator'
import { MarketEvent } from '@/types/market'
import { CausalAnalysis } from '@/types/analytics'
import { UserProfile, ComplexityLevel, AudienceType } from '@/types/user'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'

// Singleton narrative generator
let narrativeGenerator: NarrativeGenerator | null = null

async function getNarrativeGenerator(): Promise<NarrativeGenerator> {
  if (!narrativeGenerator) {
    narrativeGenerator = new NarrativeGenerator()
    await narrativeGenerator.configure({
      targetAudience: AudienceType.RETAIL,
      complexityLevel: ComplexityLevel.INTERMEDIATE,
      maxLength: 2000,
      includeVisualizations: true,
      autoValidate: true,
      qualityThreshold: 70
    })
  }
  return narrativeGenerator
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.event) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Request body must contain an "event" object',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'narratives-api',
          operation: 'generate-narrative',
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
          service: 'narratives-api',
          operation: 'generate-narrative',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const generator = await getNarrativeGenerator()

    // Extract optional parameters
    const causalAnalysis = body.causalAnalysis as CausalAnalysis | undefined
    const prediction = body.prediction
    const userProfile = body.userProfile as UserProfile | undefined
    const includeValidation = body.includeValidation || false

    // Generate base narrative
    const narrative = await generator.generateNarrative(
      event,
      causalAnalysis || createDefaultCausalAnalysis(event),
      prediction
    )

    // Adapt for user profile if provided
    let adaptedNarrative = narrative
    if (userProfile) {
      try {
        adaptedNarrative = await generator.adaptNarrative(narrative, userProfile)
      } catch (error) {
        console.warn('Failed to adapt narrative for user profile:', error)
        // Continue with original narrative
      }
    }

    // Validate if requested
    let validationScore: number | undefined
    if (includeValidation) {
      try {
        validationScore = await generator.validateNarrative(adaptedNarrative)
      } catch (error) {
        console.warn('Failed to validate narrative:', error)
      }
    }

    return NextResponse.json(createSuccessResponse({
      narrative: adaptedNarrative,
      validationScore,
      metadata: {
        eventId: event.id,
        ticker: event.ticker,
        generatedAt: new Date().toISOString(),
        isPersonalized: !!userProfile,
        includeValidation,
        wordCount: calculateWordCount(adaptedNarrative),
        estimatedReadingTime: adaptedNarrative.metadata.readingTime
      }
    }, requestId))

  } catch (error) {
    console.error('Narrative generation API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred during narrative generation',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'narratives-api',
        operation: 'generate-narrative',
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

    // Validate required fields for narrative adaptation
    if (!body.narrativeId || !body.userProfile) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Request body must contain narrativeId and userProfile',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'narratives-api',
          operation: 'adapt-narrative',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    // For this endpoint, we would typically fetch the existing narrative from the database
    // For now, return a not implemented response
    const error: ApplicationError = {
      code: ErrorCode.NOT_FOUND,
      message: 'Narrative adaptation from stored narratives not implemented - use POST with userProfile',
      severity: ErrorSeverity.LOW,
      metadata: {
        timestamp: new Date(),
        service: 'narratives-api',
        operation: 'adapt-narrative',
        requestId
      },
      retryable: false
    }

    return NextResponse.json(createErrorResponse(error, requestId), { status: 501 })

  } catch (error) {
    console.error('Narrative adaptation API error:', error)

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred during narrative adaptation',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'narratives-api',
        operation: 'adapt-narrative',
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

    // Validate required fields for narrative validation
    if (!body.narrative) {
      const error: ApplicationError = {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Request body must contain a narrative object',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          timestamp: new Date(),
          service: 'narratives-api',
          operation: 'validate-narrative',
          requestId
        },
        retryable: false
      }
      return NextResponse.json(createErrorResponse(error, requestId), { status: 400 })
    }

    const generator = await getNarrativeGenerator()

    // Validate narrative
    const validationScore = await generator.validateNarrative(body.narrative)

    return NextResponse.json(createSuccessResponse({
      validationScore,
      qualityRating: validationScore >= 80 ? 'Excellent' :
                     validationScore >= 70 ? 'Good' :
                     validationScore >= 60 ? 'Fair' : 'Needs Improvement',
      recommendations: generateQualityRecommendations(validationScore),
      validatedAt: new Date().toISOString()
    }, requestId))

  } catch (error) {
    console.error('Narrative validation API error:', error)

    if (error instanceof ApplicationError || (error as any).code) {
      const appError = error as ApplicationError
      const status = getHttpStatusFromErrorCode(appError.code)
      return NextResponse.json(createErrorResponse(appError, requestId), { status })
    }

    const genericError: ApplicationError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred during narrative validation',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'narratives-api',
        operation: 'validate-narrative',
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
function createDefaultCausalAnalysis(event: MarketEvent): CausalAnalysis {
  return {
    eventId: event.id,
    rootCause: {
      type: 'MARKET_SENTIMENT',
      description: 'Market sentiment shift detected',
      impact: 'MODERATE',
      confidence: 0.7,
      supportingEvidence: [],
      temporalRelationship: 'CONCURRENT'
    },
    contributingFactors: [],
    confidenceScore: 0.7,
    methodology: 'STATISTICAL_INFERENCE',
    evidenceChain: [],
    alternativeExplanations: []
  }
}

function calculateWordCount(narrative: any): number {
  const sections = [
    narrative.summary?.content || '',
    narrative.explanation?.content || '',
    narrative.prediction?.content || '',
    narrative.deepDive?.content || ''
  ]

  return sections.reduce((total, content) =>
    total + content.split(/\s+/).filter((word: string) => word.length > 0).length, 0
  )
}

function generateQualityRecommendations(score: number): string[] {
  const recommendations: string[] = []

  if (score < 60) {
    recommendations.push('Improve factual accuracy and data verification')
    recommendations.push('Simplify language and improve readability')
    recommendations.push('Add more supporting evidence and sources')
  } else if (score < 70) {
    recommendations.push('Enhance clarity and structure')
    recommendations.push('Add more specific examples and data points')
  } else if (score < 80) {
    recommendations.push('Fine-tune tone and audience targeting')
    recommendations.push('Consider adding more actionable insights')
  } else {
    recommendations.push('Excellent quality - maintain current standards')
  }

  return recommendations
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