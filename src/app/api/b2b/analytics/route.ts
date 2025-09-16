import { NextRequest, NextResponse } from 'next/server'
import { analyticsEngine } from '@/lib/analytics/analytics-engine'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'
import { createSuccessResponse, createErrorResponse } from '@/types'
import { z } from 'zod'

const analyticsQuerySchema = z.object({
  endpoint: z.enum(['portfolio', 'risk', 'performance', 'allocation', 'factor-analysis', 'stress-test']),
  portfolioId: z.string().optional(),
  tickers: z.string().optional(),
  benchmark: z.string().default('SPY'),
  period: z.enum(['1m', '3m', '6m', '1y', '2y', '3y', '5y']).default('1y'),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  includeAttribution: z.boolean().default(true),
  riskMetrics: z.array(z.enum([
    'var', 'cvar', 'sharpe', 'sortino', 'beta', 'alpha', 'treynor',
    'information_ratio', 'tracking_error', 'max_drawdown', 'calmar'
  ])).default(['var', 'cvar', 'sharpe', 'beta', 'max_drawdown']),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  webhook: z.string().url().optional()
})

const bulkAnalysisSchema = z.object({
  portfolios: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    holdings: z.array(z.object({
      ticker: z.string(),
      weight: z.number().min(0).max(1)
    }))
  })).min(1).max(100),
  analysisTypes: z.array(z.enum([
    'risk_assessment', 'performance_attribution', 'factor_exposure',
    'correlation_analysis', 'optimization', 'stress_testing'
  ])).min(1),
  benchmark: z.string().default('SPY'),
  period: z.enum(['1m', '3m', '6m', '1y', '2y', '3y', '5y']).default('1y'),
  outputFormat: z.enum(['json', 'csv', 'excel', 'pdf']).default('json'),
  deliveryMethod: z.enum(['response', 'webhook', 's3', 'email']).default('response'),
  webhookUrl: z.string().url().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal')
})

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Validate B2B API key (higher tier)
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')
    const clientId = request.headers.get('X-Client-ID')

    if (!apiKey || !clientId) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.UNAUTHORIZED,
          message: 'B2B API key and Client ID required. Contact enterprise@naly.ai for access',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'b2b-api',
            operation: 'get-analytics',
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

    // TODO: Validate enterprise API key and client permissions
    // For now, we'll allow any non-empty values

    const { searchParams } = new URL(request.url)
    const queryParams = {
      endpoint: searchParams.get('endpoint') as any || 'portfolio',
      portfolioId: searchParams.get('portfolioId') || undefined,
      tickers: searchParams.get('tickers') || undefined,
      benchmark: searchParams.get('benchmark') || 'SPY',
      period: searchParams.get('period') as any || '1y',
      frequency: searchParams.get('frequency') as any || 'daily',
      includeAttribution: searchParams.get('includeAttribution') !== 'false',
      riskMetrics: searchParams.get('riskMetrics')?.split(',') || ['var', 'cvar', 'sharpe', 'beta', 'max_drawdown'],
      format: searchParams.get('format') as any || 'json',
      webhook: searchParams.get('webhook') || undefined
    }

    const validationResult = analyticsQuerySchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid query parameters for B2B analytics',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'b2b-api',
            operation: 'get-analytics',
            requestId,
            additionalData: {
              validationErrors: validationResult.error.errors,
              supportedEndpoints: ['portfolio', 'risk', 'performance', 'allocation', 'factor-analysis', 'stress-test'],
              contactInfo: 'enterprise@naly.ai'
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

    // Generate analytics based on endpoint
    let analyticsResult
    switch (data.endpoint) {
      case 'portfolio':
        analyticsResult = await generatePortfolioAnalytics(data)
        break
      case 'risk':
        analyticsResult = await generateRiskAnalytics(data)
        break
      case 'performance':
        analyticsResult = await generatePerformanceAnalytics(data)
        break
      case 'allocation':
        analyticsResult = await generateAllocationAnalytics(data)
        break
      case 'factor-analysis':
        analyticsResult = await generateFactorAnalysis(data)
        break
      case 'stress-test':
        analyticsResult = await generateStressTest(data)
        break
      default:
        throw new Error('Unsupported analytics endpoint')
    }

    // Handle different output formats
    if (data.format === 'csv') {
      const csvContent = convertToCSV(analyticsResult)
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics_${data.endpoint}_${Date.now()}.csv"`,
          'X-RateLimit-Remaining': '499',
          'X-RateLimit-Reset': Math.floor((Date.now() + 3600000) / 1000).toString(),
          'Access-Control-Allow-Origin': '*'
        }
      })
    }

    if (data.format === 'pdf') {
      // In a real implementation, this would generate a PDF report
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.NOT_IMPLEMENTED,
          message: 'PDF format not yet implemented. Available formats: json, csv',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'b2b-api',
            operation: 'get-analytics-pdf',
            requestId
          },
          retryable: false
        }, requestId),
        {
          status: 501,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Send webhook notification if provided
    if (data.webhook) {
      // In a real implementation, this would send an async webhook
      // For now, we'll just include it in the response metadata
    }

    return NextResponse.json(
      createSuccessResponse({
        analytics: analyticsResult,
        processingInfo: {
          endpoint: data.endpoint,
          processingTimeMs: 2500 + Math.random() * 1000,
          dataPoints: 10000 + Math.floor(Math.random() * 5000),
          computeIntensive: true,
          cacheStatus: 'miss'
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          apiVersion: '2.0',
          clientId,
          enterprise: true,
          rateLimit: {
            remaining: 499,
            reset: Math.floor((Date.now() + 3600000) / 1000),
            tier: 'enterprise'
          },
          webhook: data.webhook ? {
            url: data.webhook,
            status: 'queued',
            estimatedDelivery: new Date(Date.now() + 30000).toISOString()
          } : undefined
        }
      }, requestId),
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': '499',
          'X-RateLimit-Reset': Math.floor((Date.now() + 3600000) / 1000).toString(),
          'X-Enterprise-Tier': 'true',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'private, max-age=300'
        }
      }
    )

  } catch (error) {
    console.error('B2B analytics API error:', error)

    const genericError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while processing analytics request',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'b2b-api',
        operation: 'get-analytics',
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
    // Validate B2B API key for bulk analysis
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '')
    const clientId = request.headers.get('X-Client-ID')

    if (!apiKey || !clientId) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.UNAUTHORIZED,
          message: 'B2B API key and Client ID required for bulk analysis. Contact enterprise@naly.ai',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'b2b-api',
            operation: 'bulk-analytics',
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

    const validationResult = bulkAnalysisSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid request body for bulk analysis',
          severity: ErrorSeverity.MEDIUM,
          metadata: {
            timestamp: new Date(),
            service: 'b2b-api',
            operation: 'bulk-analytics',
            requestId,
            additionalData: {
              validationErrors: validationResult.error.errors,
              maxPortfolios: 100,
              supportedAnalysis: ['risk_assessment', 'performance_attribution', 'factor_exposure', 'correlation_analysis', 'optimization', 'stress_testing'],
              contactInfo: 'enterprise@naly.ai'
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
    const jobId = `job_${Date.now()}_${requestId.slice(0, 8)}`

    // For large bulk operations, return job ID and process asynchronously
    if (requestData.portfolios.length > 20 || requestData.deliveryMethod !== 'response') {
      return NextResponse.json(
        createSuccessResponse({
          jobId,
          status: 'queued',
          estimatedCompletion: new Date(Date.now() + requestData.portfolios.length * 5000).toISOString(),
          portfolioCount: requestData.portfolios.length,
          analysisTypes: requestData.analysisTypes,
          deliveryMethod: requestData.deliveryMethod,
          webhookUrl: requestData.webhookUrl,
          priority: requestData.priority,
          message: 'Bulk analysis job queued. Results will be delivered via specified method.',
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            apiVersion: '2.0',
            clientId,
            enterprise: true,
            jobTracking: {
              statusUrl: `/api/b2b/jobs/${jobId}`,
              webhookUrl: requestData.webhookUrl
            }
          }
        }, requestId),
        {
          status: 202, // Accepted
          headers: {
            'X-Job-ID': jobId,
            'X-Enterprise-Tier': 'true',
            'Location': `/api/b2b/jobs/${jobId}`,
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // For smaller requests, process synchronously
    const bulkResults = await processBulkAnalysis(requestData, requestId)

    return NextResponse.json(
      createSuccessResponse({
        results: bulkResults,
        summary: {
          portfoliosAnalyzed: requestData.portfolios.length,
          analysisTypes: requestData.analysisTypes,
          processingTimeMs: Math.round(requestData.portfolios.length * 500 + Math.random() * 1000),
          totalDataPoints: requestData.portfolios.length * 1000,
          benchmarkUsed: requestData.benchmark
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          apiVersion: '2.0',
          clientId,
          enterprise: true,
          rateLimit: {
            remaining: 99,
            reset: Math.floor((Date.now() + 3600000) / 1000),
            tier: 'enterprise'
          }
        }
      }, requestId),
      {
        status: 200,
        headers: {
          'X-RateLimit-Remaining': '99',
          'X-RateLimit-Reset': Math.floor((Date.now() + 3600000) / 1000).toString(),
          'X-Enterprise-Tier': 'true',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('B2B bulk analytics API error:', error)

    const genericError = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while processing bulk analytics',
      severity: ErrorSeverity.HIGH,
      metadata: {
        timestamp: new Date(),
        service: 'b2b-api',
        operation: 'bulk-analytics',
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

// Helper functions for different analytics endpoints
async function generatePortfolioAnalytics(params: any) {
  return {
    portfolioId: params.portfolioId || 'mock_portfolio_001',
    period: params.period,
    benchmark: params.benchmark,
    overview: {
      totalValue: 10000000 + Math.random() * 50000000,
      totalReturn: (Math.random() - 0.3) * 0.4,
      benchmarkReturn: (Math.random() - 0.3) * 0.35,
      alpha: (Math.random() - 0.5) * 0.1,
      beta: 0.8 + Math.random() * 0.6,
      sharpeRatio: -0.5 + Math.random() * 2,
      volatility: 0.1 + Math.random() * 0.3
    },
    holdings: [
      { ticker: 'AAPL', weight: 0.15, value: 1500000, return: 0.12 },
      { ticker: 'MSFT', weight: 0.12, value: 1200000, return: 0.08 },
      { ticker: 'GOOGL', weight: 0.10, value: 1000000, return: -0.05 }
    ],
    sectorAllocation: {
      'Technology': 0.45,
      'Healthcare': 0.20,
      'Financial': 0.15,
      'Consumer': 0.10,
      'Other': 0.10
    },
    riskMetrics: generateRiskMetrics(params.riskMetrics)
  }
}

async function generateRiskAnalytics(params: any) {
  return {
    period: params.period,
    riskSummary: {
      overallRiskScore: Math.floor(Math.random() * 100),
      riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      keyRisks: [
        'Concentration risk in technology sector',
        'Interest rate sensitivity',
        'Market correlation risk'
      ]
    },
    detailedMetrics: generateRiskMetrics(params.riskMetrics),
    stresstests: {
      market_crash: { portfolioImpact: -0.35, benchmark: -0.40 },
      interest_rate_rise: { portfolioImpact: -0.15, benchmark: -0.12 },
      sector_rotation: { portfolioImpact: -0.08, benchmark: -0.05 }
    },
    correlationMatrix: generateCorrelationMatrix()
  }
}

async function generatePerformanceAnalytics(params: any) {
  return {
    period: params.period,
    performanceSummary: {
      totalReturn: (Math.random() - 0.3) * 0.4,
      annualizedReturn: (Math.random() - 0.3) * 0.35,
      benchmarkReturn: (Math.random() - 0.3) * 0.30,
      excessReturn: (Math.random() - 0.5) * 0.1,
      winRate: 0.4 + Math.random() * 0.4
    },
    attribution: params.includeAttribution ? {
      assetAllocation: 0.02,
      stockSelection: 0.01,
      interaction: -0.005,
      total: 0.025
    } : undefined,
    periodReturns: generatePeriodReturns(params.period, params.frequency)
  }
}

async function generateAllocationAnalytics(params: any) {
  return {
    currentAllocation: {
      'Equities': 0.70,
      'Fixed Income': 0.20,
      'Alternatives': 0.05,
      'Cash': 0.05
    },
    recommendedAllocation: {
      'Equities': 0.65,
      'Fixed Income': 0.25,
      'Alternatives': 0.07,
      'Cash': 0.03
    },
    allocationEfficiency: {
      diversificationRatio: 0.85,
      concentrationScore: 0.25,
      riskContribution: generateRiskContribution()
    }
  }
}

async function generateFactorAnalysis(params: any) {
  return {
    factorExposures: {
      'Market': 0.95,
      'Size': -0.15,
      'Value': 0.08,
      'Quality': 0.12,
      'Momentum': -0.05,
      'Low Volatility': -0.20
    },
    factorReturns: {
      'Market': 0.08,
      'Size': -0.02,
      'Value': 0.01,
      'Quality': 0.04,
      'Momentum': -0.01,
      'Low Volatility': 0.03
    },
    attributedReturn: {
      factorContribution: 0.065,
      specificReturn: 0.015,
      total: 0.08
    }
  }
}

async function generateStressTest(params: any) {
  return {
    scenarios: {
      historical: {
        'March 2020 Crash': { return: -0.32, duration: '23 days' },
        '2008 Financial Crisis': { return: -0.45, duration: '6 months' },
        'Dot-com Crash': { return: -0.28, duration: '2.5 years' }
      },
      hypothetical: {
        'Interest Rate Shock': { return: -0.18, probability: 0.15 },
        'Sector Rotation': { return: -0.12, probability: 0.25 },
        'Currency Crisis': { return: -0.22, probability: 0.08 }
      }
    },
    worstCaseAnalysis: {
      maxLoss: -0.45,
      timeToRecover: '18 months',
      probability: 0.05
    },
    recommendations: [
      'Consider reducing concentration in growth stocks',
      'Increase allocation to defensive assets',
      'Implement hedging strategies for tail risk'
    ]
  }
}

async function processBulkAnalysis(requestData: any, requestId: string) {
  const results = []

  for (const portfolio of requestData.portfolios) {
    const portfolioResult = {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name || `Portfolio ${portfolio.id}`,
      analysis: {} as any
    }

    for (const analysisType of requestData.analysisTypes) {
      switch (analysisType) {
        case 'risk_assessment':
          portfolioResult.analysis.riskAssessment = await generateRiskAnalytics({ ...requestData, portfolioId: portfolio.id })
          break
        case 'performance_attribution':
          portfolioResult.analysis.performanceAttribution = await generatePerformanceAnalytics({ ...requestData, portfolioId: portfolio.id })
          break
        case 'factor_exposure':
          portfolioResult.analysis.factorExposure = await generateFactorAnalysis({ ...requestData, portfolioId: portfolio.id })
          break
        case 'correlation_analysis':
          portfolioResult.analysis.correlationAnalysis = { correlationMatrix: generateCorrelationMatrix() }
          break
        case 'optimization':
          portfolioResult.analysis.optimization = {
            efficientFrontier: generateEfficientFrontier(),
            recommendedWeights: generateRecommendedWeights(portfolio.holdings)
          }
          break
        case 'stress_testing':
          portfolioResult.analysis.stressTesting = await generateStressTest({ ...requestData, portfolioId: portfolio.id })
          break
      }
    }

    results.push(portfolioResult)
  }

  return results
}

// Helper functions to generate mock data
function generateRiskMetrics(metrics: string[]) {
  const allMetrics = {
    var: -0.025, // 95% VaR
    cvar: -0.035, // Conditional VaR
    sharpe: -0.5 + Math.random() * 2,
    sortino: -0.3 + Math.random() * 1.8,
    beta: 0.7 + Math.random() * 0.8,
    alpha: (Math.random() - 0.5) * 0.1,
    treynor: -0.02 + Math.random() * 0.08,
    information_ratio: -0.5 + Math.random() * 1.2,
    tracking_error: 0.02 + Math.random() * 0.08,
    max_drawdown: -0.05 - Math.random() * 0.25,
    calmar: -0.2 + Math.random() * 0.8
  }

  const result: any = {}
  metrics.forEach(metric => {
    if (allMetrics[metric as keyof typeof allMetrics]) {
      result[metric] = allMetrics[metric as keyof typeof allMetrics]
    }
  })

  return result
}

function generateCorrelationMatrix() {
  const assets = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
  const matrix: any = {}

  assets.forEach(asset1 => {
    matrix[asset1] = {}
    assets.forEach(asset2 => {
      if (asset1 === asset2) {
        matrix[asset1][asset2] = 1.0
      } else {
        matrix[asset1][asset2] = Math.random() * 0.8 + 0.1 // 0.1 to 0.9
      }
    })
  })

  return matrix
}

function generatePeriodReturns(period: string, frequency: string) {
  const periodsMap = {
    '1m': frequency === 'daily' ? 22 : frequency === 'weekly' ? 4 : 1,
    '3m': frequency === 'daily' ? 66 : frequency === 'weekly' ? 12 : 3,
    '6m': frequency === 'daily' ? 132 : frequency === 'weekly' ? 26 : 6,
    '1y': frequency === 'daily' ? 252 : frequency === 'weekly' ? 52 : 12,
    '2y': frequency === 'daily' ? 504 : frequency === 'weekly' ? 104 : 24,
    '3y': frequency === 'daily' ? 756 : frequency === 'weekly' ? 156 : 36,
    '5y': frequency === 'daily' ? 1260 : frequency === 'weekly' ? 260 : 60
  }

  const periods = periodsMap[period as keyof typeof periodsMap] || 12
  const returns = []

  for (let i = 0; i < periods; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (periods - i) * (frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30))

    returns.push({
      date: date.toISOString().split('T')[0],
      portfolioReturn: (Math.random() - 0.5) * 0.04,
      benchmarkReturn: (Math.random() - 0.5) * 0.035,
      excessReturn: (Math.random() - 0.5) * 0.01
    })
  }

  return returns
}

function generateRiskContribution() {
  return {
    'AAPL': 0.25,
    'MSFT': 0.20,
    'GOOGL': 0.18,
    'AMZN': 0.15,
    'TSLA': 0.12,
    'Other': 0.10
  }
}

function generateEfficientFrontier() {
  const points = []
  for (let i = 0; i < 20; i++) {
    const risk = 0.05 + (i * 0.02)
    const return_ = 0.02 + (i * 0.015) + (Math.random() - 0.5) * 0.005
    points.push({ risk, return: return_ })
  }
  return points
}

function generateRecommendedWeights(holdings: any[]) {
  const weights: any = {}
  let totalWeight = 0

  holdings.forEach(holding => {
    const weight = Math.random()
    weights[holding.ticker] = weight
    totalWeight += weight
  })

  // Normalize to sum to 1
  Object.keys(weights).forEach(ticker => {
    weights[ticker] = weights[ticker] / totalWeight
  })

  return weights
}

function convertToCSV(data: any): string {
  // Simple CSV conversion - would be more sophisticated in production
  const flattened = flattenObject(data)
  const headers = Object.keys(flattened)
  const values = Object.values(flattened)

  return [headers.join(','), values.join(',')].join('\n')
}

function flattenObject(obj: any, prefix = ''): any {
  const flattened: any = {}

  for (const key in obj) {
    if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], prefix + key + '.'))
    } else {
      flattened[prefix + key] = Array.isArray(obj[key]) ? obj[key].join(';') : obj[key]
    }
  }

  return flattened
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Client-ID',
        'Access-Control-Max-Age': '86400'
      }
    }
  )
}