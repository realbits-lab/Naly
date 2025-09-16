import { NextRequest, NextResponse } from 'next/server'
import { narrativeService } from '@/lib/narrative/narrative-generator'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const narrativesQuerySchema = z.object({
  ticker: z.string().min(1).max(10).optional(),
  category: z.enum(['market_analysis', 'company_deep_dive', 'earnings', 'technical_analysis', 'sector_overview']).optional(),
  sentiment: z.enum(['bullish', 'bearish', 'neutral']).optional(),
  timeframe: z.enum(['1d', '1w', '1m', '3m', '1y']).optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  format: z.enum(['json', 'markdown', 'html']).default('json')
})

const generateNarrativeSchema = z.object({
  ticker: z.string().min(1).max(10),
  analysisType: z.enum(['technical', 'fundamental', 'market_sentiment', 'earnings']),
  timeframe: z.enum(['1d', '1w', '1m', '3m', '6m', '1y']).default('1m'),
  includeVisualization: z.boolean().default(true),
  targetAudience: z.enum(['retail', 'professional', 'institutional']).default('professional'),
  complexity: z.enum(['basic', 'intermediate', 'advanced', 'expert']).default('intermediate'),
  wordCount: z.number().min(100).max(2000).default(500)
})

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Validate API key (public endpoint but requires API key)
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
            operation: 'get-narratives',
            requestId
          },
          retryable: false
        }, requestId),
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
      )
    }

    // TODO: Validate API key against database
    // For now, we'll allow any non-empty API key

    const { searchParams } = new URL(request.url)
    const queryParams = {
      ticker: searchParams.get('ticker') || undefined,
      category: searchParams.get('category') as any || undefined,
      sentiment: searchParams.get('sentiment') as any || undefined,
      timeframe: searchParams.get('timeframe') as any || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0,
      format: searchParams.get('format') as 'json' | 'markdown' | 'html' || 'json'
    }

    // Validate query parameters
    const validationResult = narrativesQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid query parameters',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'public-api',
            operation: 'get-narratives',
            requestId,
            additionalData: {
              validationErrors: validationResult.error.errors,
              supportedParams: {
                ticker: 'string (1-10 chars)',
                category: ['market_analysis', 'company_deep_dive', 'earnings', 'technical_analysis', 'sector_overview'],
                sentiment: ['bullish', 'bearish', 'neutral'],
                timeframe: ['1d', '1w', '1m', '3m', '1y'],
                limit: 'number (1-100)',
                offset: 'number (min 0)',
                format: ['json', 'markdown', 'html']
              }
            }
          },
          retryable: false
        }, requestId),
        { status: 400 }
      )
    }

    // Mock data for public API (would fetch from database in production)
    const narratives = [
      {
        id: 'nar_001',
        title: 'Apple Stock Shows Strong Momentum Amid AI Developments',
        summary: 'Apple\'s stock demonstrates robust performance as the company continues to integrate AI capabilities across its ecosystem.',
        content: 'Apple Inc. (AAPL) has shown remarkable resilience in the current market environment, with its stock price reflecting strong investor confidence in the company\'s strategic direction. The integration of artificial intelligence across Apple\'s product lineup, particularly in the upcoming iOS updates and new hardware releases, has positioned the company favorably for sustained growth.\n\nTechnical analysis reveals a bullish pattern with strong support levels and increasing volume, indicating continued institutional interest. The company\'s fundamental metrics remain solid, with strong cash flow generation and a robust balance sheet providing stability in uncertain market conditions.',
        ticker: validationResult.data.ticker || 'AAPL',
        category: validationResult.data.category || 'market_analysis',
        sentiment: 'bullish',
        confidence: 0.85,
        timeframe: validationResult.data.timeframe || '1m',
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        metadata: {
          wordCount: 150,
          readingTime: 1,
          sources: ['market_data', 'earnings_reports', 'technical_analysis'],
          targetAudience: 'professional',
          complexity: 'intermediate'
        }
      },
      {
        id: 'nar_002',
        title: 'Market Volatility Creates Opportunities in Tech Sector',
        summary: 'Recent market fluctuations have created attractive entry points for technology stocks with strong fundamentals.',
        content: 'The technology sector has experienced heightened volatility in recent sessions, creating both challenges and opportunities for investors. While short-term price movements have been driven by macroeconomic concerns and interest rate speculation, the underlying fundamentals of many technology companies remain strong.\n\nKey indicators suggest that current valuations may present compelling opportunities for long-term investors. Companies with strong balance sheets, consistent revenue growth, and innovative product pipelines are particularly well-positioned to benefit from any market stabilization.',
        ticker: validationResult.data.ticker || 'QQQ',
        category: validationResult.data.category || 'sector_overview',
        sentiment: 'neutral',
        confidence: 0.78,
        timeframe: validationResult.data.timeframe || '1w',
        generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        metadata: {
          wordCount: 125,
          readingTime: 1,
          sources: ['market_data', 'sector_analysis', 'volatility_metrics'],
          targetAudience: 'professional',
          complexity: 'intermediate'
        }
      }
    ]

    // Filter narratives based on query parameters
    let filteredNarratives = narratives

    if (validationResult.data.ticker) {
      filteredNarratives = filteredNarratives.filter(n =>
        n.ticker.toLowerCase() === validationResult.data.ticker!.toLowerCase()
      )
    }

    if (validationResult.data.category) {
      filteredNarratives = filteredNarratives.filter(n => n.category === validationResult.data.category)
    }

    if (validationResult.data.sentiment) {
      filteredNarratives = filteredNarratives.filter(n => n.sentiment === validationResult.data.sentiment)
    }

    // Apply pagination
    const paginatedNarratives = filteredNarratives
      .slice(validationResult.data.offset, validationResult.data.offset + validationResult.data.limit)

    // Format response based on requested format
    let responseData
    if (validationResult.data.format === 'markdown') {
      responseData = {
        narratives: paginatedNarratives.map(n => ({
          ...n,
          content: `# ${n.title}\n\n**Summary:** ${n.summary}\n\n**Ticker:** ${n.ticker} | **Sentiment:** ${n.sentiment} | **Confidence:** ${Math.round(n.confidence * 100)}%\n\n${n.content}`,
          format: 'markdown'
        }))
      }
    } else if (validationResult.data.format === 'html') {
      responseData = {
        narratives: paginatedNarratives.map(n => ({
          ...n,
          content: `<article><h1>${n.title}</h1><p><strong>Summary:</strong> ${n.summary}</p><div><span><strong>Ticker:</strong> ${n.ticker}</span> | <span><strong>Sentiment:</strong> ${n.sentiment}</span> | <span><strong>Confidence:</strong> ${Math.round(n.confidence * 100)}%</span></div><div>${n.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div></article>`,
          format: 'html'
        }))
      }
    } else {
      responseData = {
        narratives: paginatedNarratives
      }
    }

    return NextResponse.json(
      createSuccessResponse({
        ...responseData,
        pagination: {
          limit: validationResult.data.limit,
          offset: validationResult.data.offset,
          total: filteredNarratives.length,
          hasMore: validationResult.data.offset + validationResult.data.limit < filteredNarratives.length
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          apiVersion: '1.0',
          rateLimit: {
            remaining: 999, // Mock rate limiting
            reset: Math.floor((Date.now() + 3600000) / 1000) // 1 hour from now
          }
        }
      }, requestId),
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': '999',
          'X-RateLimit-Reset': Math.floor((Date.now() + 3600000) / 1000).toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
          'Cache-Control': 'public, max-age=300' // 5 minutes cache
        }
      }
    )

  } catch (error) {
    console.error('Public narratives API error:', error)

    const genericError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching narratives',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'public-api',
        operation: 'get-narratives',
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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
        }
      }
    )
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Validate API key for narrative generation
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!apiKey) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.UNAUTHORIZED,
          message: 'API key required for narrative generation. Get your API key at https://naly.ai/api-keys',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'public-api',
            operation: 'generate-narrative',
            requestId
          },
          retryable: false
        }, requestId),
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
      )
    }

    const body = await request.json()

    // Validate request body
    const validationResult = generateNarrativeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid request body for narrative generation',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'public-api',
            operation: 'generate-narrative',
            requestId,
            additionalData: {
              validationErrors: validationResult.error.errors,
              requiredFields: ['ticker', 'analysisType'],
              supportedValues: {
                analysisType: ['technical', 'fundamental', 'market_sentiment', 'earnings'],
                timeframe: ['1d', '1w', '1m', '3m', '6m', '1y'],
                targetAudience: ['retail', 'professional', 'institutional'],
                complexity: ['basic', 'intermediate', 'advanced', 'expert'],
                wordCount: 'number (100-2000)'
              }
            }
          },
          retryable: false
        }, requestId),
        { status: 400 }
      )
    }

    const requestData = validationResult.data

    // Generate AI narrative (simplified for demo)
    const narrative = {
      id: `nar_${requestId.slice(0, 8)}`,
      title: `${requestData.analysisType === 'technical' ? 'Technical Analysis' : 'Market Analysis'} for ${requestData.ticker}`,
      summary: `AI-generated ${requestData.analysisType} analysis for ${requestData.ticker} over ${requestData.timeframe} timeframe.`,
      content: `This is a custom-generated narrative for ${requestData.ticker} based on ${requestData.analysisType} analysis. The analysis covers a ${requestData.timeframe} timeframe and is tailored for ${requestData.targetAudience} investors with ${requestData.complexity} complexity level.\n\nKey insights and recommendations will be provided based on current market conditions and historical data patterns.`,
      ticker: requestData.ticker.toUpperCase(),
      category: requestData.analysisType === 'earnings' ? 'earnings' : 'market_analysis',
      sentiment: 'neutral', // Would be determined by AI analysis
      confidence: 0.82,
      timeframe: requestData.timeframe,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
      metadata: {
        wordCount: requestData.wordCount,
        readingTime: Math.ceil(requestData.wordCount / 250),
        sources: ['real_time_data', 'ai_analysis', 'market_indicators'],
        targetAudience: requestData.targetAudience,
        complexity: requestData.complexity,
        customGenerated: true,
        includeVisualization: requestData.includeVisualization,
        generatedBy: 'naly-ai-v1.0'
      }
    }

    return NextResponse.json(
      createSuccessResponse({
        narrative,
        generationInfo: {
          processingTimeMs: 850, // Mock processing time
          tokensUsed: Math.floor(requestData.wordCount * 1.2),
          cost: 0.01, // Mock cost in credits
          model: 'gpt-4o-mini',
          version: '1.0'
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          apiVersion: '1.0',
          rateLimit: {
            remaining: 99, // Lower limit for generation
            reset: Math.floor((Date.now() + 3600000) / 1000)
          }
        }
      }, requestId),
      {
        status: 201,
        headers: {
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': Math.floor((Date.now() + 3600000) / 1000).toString(),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
        }
      }
    )

  } catch (error) {
    console.error('Generate narrative API error:', error)

    const genericError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while generating narrative',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'public-api',
        operation: 'generate-narrative',
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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
        }
      }
    )
  }
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
        'Access-Control-Max-Age': '86400' // 24 hours
      }
    }
  )
}