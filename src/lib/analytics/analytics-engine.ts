import { EventDetectionEngine } from './event-detection'
import { MarketDataAnalyzer } from './market-analyzer'
import { getFinancialDataAPI } from '@/lib/service-registry'
import {
  MarketEvent,
  MarketDataPoint,
  EventType,
  SignificanceLevel
} from '@/types/market'
import {
  ApplicationError,
  ErrorCode,
  ErrorSeverity
} from '@/types/errors'
import { db } from '@/lib/db'
import { marketEvents, marketDataPoints } from '@/lib/schema/events'
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm'

interface AnalyticsConfig {
  eventDetection: {
    priceThreshold: number
    volumeThreshold: number
    significanceFilters: SignificanceLevel[]
    enableRealTimeDetection: boolean
  }
  analysis: {
    technicalIndicatorsPeriod: number
    volatilityWindow: number
    trendAnalysisWindow: number
    anomalyDetectionWindow: number
  }
  performance: {
    batchSize: number
    parallelProcessing: boolean
    cacheResults: boolean
    maxProcessingTime: number
  }
}

interface AnalyticsResult {
  events: MarketEvent[]
  technicalAnalysis: {
    ticker: string
    indicators: any
    trend: any
    anomalies: any[]
    supportResistance: { support: number[], resistance: number[] }
    marketRegime: any
  }
  marketSummary: {
    totalEvents: number
    significantEvents: number
    topMovers: Array<{ ticker: string, change: number }>
    marketSentiment: 'bullish' | 'bearish' | 'neutral'
    volatilityLevel: 'low' | 'medium' | 'high' | 'extreme'
  }
  processingMetadata: {
    processedAt: Date
    processingTime: number
    dataPointsAnalyzed: number
    tickersProcessed: number
  }
}

export class AnalyticsEngine {
  private eventDetector: EventDetectionEngine
  private marketAnalyzer: MarketDataAnalyzer
  private config: AnalyticsConfig
  private isInitialized = false

  constructor() {
    this.eventDetector = new EventDetectionEngine()
    this.marketAnalyzer = new MarketDataAnalyzer()

    // Default configuration
    this.config = {
      eventDetection: {
        priceThreshold: 5.0, // 5% price movement
        volumeThreshold: 2.0, // 2x average volume
        significanceFilters: [SignificanceLevel.MEDIUM, SignificanceLevel.HIGH, SignificanceLevel.CRITICAL],
        enableRealTimeDetection: true
      },
      analysis: {
        technicalIndicatorsPeriod: 50,
        volatilityWindow: 30,
        trendAnalysisWindow: 20,
        anomalyDetectionWindow: 30
      },
      performance: {
        batchSize: 100,
        parallelProcessing: true,
        cacheResults: true,
        maxProcessingTime: 60000 // 60 seconds
      }
    }
  }

  async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config }
    }

    await this.eventDetector.configure(this.config.eventDetection)
    this.isInitialized = true
  }

  /**
   * Analyze market data for a single ticker
   */
  async analyzeTicker(ticker: string, days: number = 30): Promise<AnalyticsResult> {
    this.ensureInitialized()

    const startTime = Date.now()
    const financialAPI = getFinancialDataAPI()

    try {
      // Get historical data
      const historicalData = await financialAPI.getHistoricalData(ticker, days / 365)

      if (!historicalData.length) {
        throw this.createError(
          ErrorCode.MISSING_DATA_ERROR,
          `No historical data available for ticker ${ticker}`,
          ErrorSeverity.MEDIUM,
          { ticker, days }
        )
      }

      // Detect events
      const events = await this.eventDetector.detectEvents(historicalData)

      // Perform technical analysis
      const technicalAnalysis = await this.performTechnicalAnalysis(ticker, historicalData)

      // Create market summary
      const marketSummary = this.createMarketSummary([ticker], events, [technicalAnalysis])

      const processingTime = Date.now() - startTime

      return {
        events,
        technicalAnalysis,
        marketSummary,
        processingMetadata: {
          processedAt: new Date(),
          processingTime,
          dataPointsAnalyzed: historicalData.length,
          tickersProcessed: 1
        }
      }

    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }

      throw this.createError(
        ErrorCode.ANALYSIS_ERROR,
        `Failed to analyze ticker ${ticker}`,
        ErrorSeverity.HIGH,
        { ticker, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  /**
   * Analyze multiple tickers efficiently
   */
  async analyzeMultipleTickers(tickers: string[], days: number = 30): Promise<AnalyticsResult> {
    this.ensureInitialized()

    if (tickers.length === 0) {
      throw this.createError(
        ErrorCode.VALIDATION_ERROR,
        'At least one ticker must be provided',
        ErrorSeverity.MEDIUM
      )
    }

    if (tickers.length > 50) {
      throw this.createError(
        ErrorCode.VALIDATION_ERROR,
        'Maximum 50 tickers can be analyzed at once',
        ErrorSeverity.MEDIUM,
        { tickerCount: tickers.length }
      )
    }

    const startTime = Date.now()
    const financialAPI = getFinancialDataAPI()

    try {
      const allEvents: MarketEvent[] = []
      const allAnalysis: any[] = []
      let totalDataPoints = 0

      // Process tickers in batches
      const batches = this.chunkArray(tickers, this.config.performance.batchSize)

      for (const batch of batches) {
        const batchPromises = batch.map(async (ticker) => {
          try {
            const result = await this.analyzeTicker(ticker, days)
            return result
          } catch (error) {
            console.error(`Failed to analyze ticker ${ticker}:`, error)
            return null
          }
        })

        const batchResults = await Promise.all(batchPromises)

        for (const result of batchResults) {
          if (result) {
            allEvents.push(...result.events)
            allAnalysis.push(result.technicalAnalysis)
            totalDataPoints += result.processingMetadata.dataPointsAnalyzed
          }
        }
      }

      // Create aggregated market summary
      const marketSummary = this.createMarketSummary(tickers, allEvents, allAnalysis)

      const processingTime = Date.now() - startTime

      return {
        events: allEvents,
        technicalAnalysis: allAnalysis[0] || null, // Return first analysis for compatibility
        marketSummary,
        processingMetadata: {
          processedAt: new Date(),
          processingTime,
          dataPointsAnalyzed: totalDataPoints,
          tickersProcessed: tickers.length
        }
      }

    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }

      throw this.createError(
        ErrorCode.ANALYSIS_ERROR,
        'Failed to analyze multiple tickers',
        ErrorSeverity.HIGH,
        { tickerCount: tickers.length, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  /**
   * Get recent events from database
   */
  async getRecentEvents(limit: number = 50, significanceFilter?: SignificanceLevel[]): Promise<MarketEvent[]> {
    try {
      let query = db
        .select()
        .from(marketEvents)
        .orderBy(desc(marketEvents.timestamp))
        .limit(limit)

      const results = await query

      const events: MarketEvent[] = []

      for (const event of results) {
        // Filter by significance if specified
        if (significanceFilter && !significanceFilter.includes(event.significance as SignificanceLevel)) {
          continue
        }

        // Get source data for this event
        const sourceData = await db
          .select()
          .from(marketDataPoints)
          .where(eq(marketDataPoints.eventId, event.id))

        const mappedEvent: MarketEvent = {
          id: event.id,
          eventType: event.eventType as EventType,
          ticker: event.ticker,
          timestamp: event.timestamp,
          magnitude: event.magnitude,
          significance: event.significance as SignificanceLevel,
          sourceData: sourceData.map(this.mapDatabaseDataPointToMarketDataPoint),
          relatedEvents: event.relatedEventIds || [],
          metadata: event.metadata as any
        }

        events.push(mappedEvent)
      }

      return events

    } catch (error) {
      throw this.createError(
        ErrorCode.DATABASE_QUERY_ERROR,
        'Failed to retrieve recent events',
        ErrorSeverity.MEDIUM,
        { error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  /**
   * Get events for a specific ticker within a date range
   */
  async getTickerEvents(
    ticker: string,
    startDate: Date,
    endDate: Date,
    eventTypes?: EventType[]
  ): Promise<MarketEvent[]> {
    try {
      let query = db
        .select()
        .from(marketEvents)
        .where(
          and(
            eq(marketEvents.ticker, ticker.toUpperCase()),
            gte(marketEvents.timestamp, startDate),
            lte(marketEvents.timestamp, endDate)
          )
        )
        .orderBy(asc(marketEvents.timestamp))

      const results = await query

      const events: MarketEvent[] = []

      for (const event of results) {
        // Filter by event types if specified
        if (eventTypes && !eventTypes.includes(event.eventType as EventType)) {
          continue
        }

        // Get source data for this event
        const sourceData = await db
          .select()
          .from(marketDataPoints)
          .where(eq(marketDataPoints.eventId, event.id))

        const mappedEvent: MarketEvent = {
          id: event.id,
          eventType: event.eventType as EventType,
          ticker: event.ticker,
          timestamp: event.timestamp,
          magnitude: event.magnitude,
          significance: event.significance as SignificanceLevel,
          sourceData: sourceData.map(this.mapDatabaseDataPointToMarketDataPoint),
          relatedEvents: event.relatedEventIds || [],
          metadata: event.metadata as any
        }

        events.push(mappedEvent)
      }

      return events

    } catch (error) {
      throw this.createError(
        ErrorCode.DATABASE_QUERY_ERROR,
        `Failed to retrieve events for ticker ${ticker}`,
        ErrorSeverity.MEDIUM,
        { ticker, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  /**
   * Start real-time monitoring for specified tickers
   */
  async startRealTimeMonitoring(tickers: string[]): Promise<void> {
    this.ensureInitialized()
    await this.eventDetector.startRealTimeDetection(tickers)
  }

  /**
   * Stop real-time monitoring
   */
  async stopRealTimeMonitoring(): Promise<void> {
    await this.eventDetector.stopRealTimeDetection()
  }

  // Private helper methods

  private async performTechnicalAnalysis(ticker: string, data: MarketDataPoint[]) {
    const priceData = data
      .filter(dp => dp.dataType === 'STOCK_PRICE')
      .map(dp => Number(dp.value))

    const volumeData = data
      .filter(dp => dp.dataType === 'VOLUME')
      .map(dp => Number(dp.value))

    if (priceData.length < this.config.analysis.technicalIndicatorsPeriod) {
      return {
        ticker,
        indicators: null,
        trend: null,
        anomalies: [],
        supportResistance: { support: [], resistance: [] },
        marketRegime: null
      }
    }

    const indicators = this.marketAnalyzer.calculateTechnicalIndicators(priceData)
    const trend = this.marketAnalyzer.analyzeTrend(priceData, this.config.analysis.trendAnalysisWindow)
    const anomalies = this.marketAnalyzer.detectAnomalies(data, this.config.analysis.anomalyDetectionWindow)
    const supportResistance = this.marketAnalyzer.findSupportResistanceLevels(priceData)
    const marketRegime = volumeData.length > 0
      ? this.marketAnalyzer.classifyMarketRegime(priceData, volumeData)
      : null

    return {
      ticker,
      indicators,
      trend,
      anomalies,
      supportResistance,
      marketRegime
    }
  }

  private createMarketSummary(tickers: string[], events: MarketEvent[], analyses: any[]) {
    const totalEvents = events.length
    const significantEvents = events.filter(e =>
      e.significance === SignificanceLevel.HIGH || e.significance === SignificanceLevel.CRITICAL
    ).length

    // Calculate top movers from events
    const tickerMoves = new Map<string, number>()
    for (const event of events) {
      if (event.eventType === EventType.PRICE_JUMP) {
        const existingMove = tickerMoves.get(event.ticker) || 0
        tickerMoves.set(event.ticker, Math.max(existingMove, Math.abs(event.magnitude)))
      }
    }

    const topMovers = Array.from(tickerMoves.entries())
      .map(([ticker, change]) => ({ ticker, change }))
      .sort((a, b) => b.change - a.change)
      .slice(0, 10)

    // Determine overall market sentiment
    const bullishEvents = events.filter(e => e.metadata.priceChange > 0).length
    const bearishEvents = events.filter(e => e.metadata.priceChange < 0).length

    let marketSentiment: 'bullish' | 'bearish' | 'neutral'
    if (bullishEvents > bearishEvents * 1.2) {
      marketSentiment = 'bullish'
    } else if (bearishEvents > bullishEvents * 1.2) {
      marketSentiment = 'bearish'
    } else {
      marketSentiment = 'neutral'
    }

    // Determine volatility level
    const avgVolatility = analyses
      .filter(a => a.trend)
      .reduce((sum, a) => sum + a.trend.volatility, 0) / Math.max(1, analyses.length)

    let volatilityLevel: 'low' | 'medium' | 'high' | 'extreme'
    if (avgVolatility < 15) {
      volatilityLevel = 'low'
    } else if (avgVolatility < 25) {
      volatilityLevel = 'medium'
    } else if (avgVolatility < 40) {
      volatilityLevel = 'high'
    } else {
      volatilityLevel = 'extreme'
    }

    return {
      totalEvents,
      significantEvents,
      topMovers,
      marketSentiment,
      volatilityLevel
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private mapDatabaseDataPointToMarketDataPoint(dbDataPoint: any): MarketDataPoint {
    return {
      source: dbDataPoint.source,
      timestamp: dbDataPoint.timestamp,
      ticker: dbDataPoint.ticker,
      dataType: dbDataPoint.dataType,
      value: dbDataPoint.value,
      confidence: dbDataPoint.confidence,
      metadata: dbDataPoint.metadata
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw this.createError(
        ErrorCode.MISSING_CONFIGURATION,
        'Analytics engine not initialized',
        ErrorSeverity.CRITICAL
      )
    }
  }

  private createError(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity,
    additionalData?: any
  ): ApplicationError {
    return {
      code,
      message,
      severity,
      metadata: {
        timestamp: new Date(),
        service: 'analytics-engine',
        operation: 'analysis',
        additionalData
      },
      retryable: code === ErrorCode.DATABASE_QUERY_ERROR || severity === ErrorSeverity.HIGH
    }
  }
}