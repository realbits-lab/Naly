import {
  EventDetectionService,
  EventDetectionConfig
} from '@/types/services'
import {
  MarketEvent,
  MarketDataPoint,
  EventType,
  SignificanceLevel,
  EventMetadata,
  MarketCapCategory
} from '@/types/market'
import {
  ApplicationError,
  ErrorCode,
  ErrorSeverity
} from '@/types/errors'
import { db } from '@/lib/db'
import { marketEvents, marketDataPoints } from '@/lib/schema/events'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

interface PriceAnalysis {
  currentPrice: number
  previousPrice: number
  percentChange: number
  absoluteChange: number
  isSignificant: boolean
}

interface VolumeAnalysis {
  currentVolume: number
  averageVolume: number
  volumeRatio: number
  isUnusual: boolean
}

interface DetectionRule {
  type: EventType
  condition: (data: MarketDataPoint[], context: any) => boolean
  scoreCalculator: (data: MarketDataPoint[], context: any) => number
  metadataExtractor: (data: MarketDataPoint[], context: any) => EventMetadata
}

export class EventDetectionEngine implements EventDetectionService {
  private config: EventDetectionConfig | null = null
  private isConfigured = false
  private isRealTimeActive = false
  private monitoredTickers = new Set<string>()
  private detectionRules: DetectionRule[] = []

  constructor() {
    this.initializeDetectionRules()
  }

  async configure(config: EventDetectionConfig): Promise<void> {
    this.validateConfig(config)
    this.config = config
    this.isConfigured = true
  }

  async detectEvents(dataPoints: MarketDataPoint[]): Promise<MarketEvent[]> {
    this.ensureConfigured()

    if (!dataPoints.length) {
      return []
    }

    const events: MarketEvent[] = []

    // Group data points by ticker
    const tickerGroups = this.groupByTicker(dataPoints)

    for (const [ticker, tickerData] of tickerGroups.entries()) {
      try {
        // Sort data chronologically
        const sortedData = tickerData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        // Run detection rules for this ticker
        const tickerEvents = await this.detectEventsForTicker(ticker, sortedData)
        events.push(...tickerEvents)

      } catch (error) {
        console.error(`Event detection failed for ticker ${ticker}:`, error)
        // Continue processing other tickers
      }
    }

    // Filter by significance if configured
    const filteredEvents = this.config!.significanceFilters.length > 0
      ? events.filter(event => this.config!.significanceFilters.includes(event.significance))
      : events

    // Store detected events in database
    if (filteredEvents.length > 0) {
      await this.storeEvents(filteredEvents)
    }

    return filteredEvents
  }

  async startRealTimeDetection(tickers: string[]): Promise<void> {
    this.ensureConfigured()

    if (!this.config!.enableRealTimeDetection) {
      throw this.createError(
        ErrorCode.INVALID_CONFIGURATION,
        'Real-time detection is not enabled in configuration',
        ErrorSeverity.MEDIUM
      )
    }

    if (tickers.length === 0 || tickers.length > 100) {
      throw this.createError(
        ErrorCode.VALIDATION_ERROR,
        'Real-time detection supports 1-100 tickers',
        ErrorSeverity.MEDIUM,
        { tickerCount: tickers.length }
      )
    }

    this.monitoredTickers = new Set(tickers.map(t => t.toUpperCase()))
    this.isRealTimeActive = true

    console.log(`Started real-time event detection for ${tickers.length} tickers`)
  }

  async stopRealTimeDetection(): Promise<void> {
    this.isRealTimeActive = false
    this.monitoredTickers.clear()
    console.log('Stopped real-time event detection')
  }

  async getEventById(eventId: string): Promise<MarketEvent | null> {
    try {
      const result = await db
        .select()
        .from(marketEvents)
        .where(eq(marketEvents.id, eventId))
        .limit(1)

      if (!result.length) {
        return null
      }

      const event = result[0]

      // Get source data
      const sourceData = await db
        .select()
        .from(marketDataPoints)
        .where(eq(marketDataPoints.eventId, eventId))

      return this.mapDatabaseEventToMarketEvent(event, sourceData)
    } catch (error) {
      throw this.createError(
        ErrorCode.DATABASE_QUERY_ERROR,
        `Failed to retrieve event ${eventId}`,
        ErrorSeverity.MEDIUM,
        { eventId, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  private initializeDetectionRules(): void {
    this.detectionRules = [
      // Price Jump Detection
      {
        type: EventType.PRICE_JUMP,
        condition: (data: MarketDataPoint[]) => {
          const analysis = this.analyzePriceMovement(data)
          return analysis.isSignificant && Math.abs(analysis.percentChange) >= (this.config?.priceThreshold || 5)
        },
        scoreCalculator: (data: MarketDataPoint[]) => {
          const analysis = this.analyzePriceMovement(data)
          return Math.min(100, Math.abs(analysis.percentChange) * 2)
        },
        metadataExtractor: (data: MarketDataPoint[]) => {
          const priceAnalysis = this.analyzePriceMovement(data)
          const volumeAnalysis = this.analyzeVolumeActivity(data)

          return {
            sector: 'Unknown', // TODO: Add sector lookup
            marketCap: MarketCapCategory.LARGE, // TODO: Add market cap lookup
            volatility: this.calculateVolatility(data),
            volume: volumeAnalysis.currentVolume,
            priceChange: priceAnalysis.percentChange,
            volumeRatio: volumeAnalysis.volumeRatio
          }
        }
      },

      // Volume Spike Detection
      {
        type: EventType.EARNINGS_RELEASE,
        condition: (data: MarketDataPoint[]) => {
          const volumeAnalysis = this.analyzeVolumeActivity(data)
          return volumeAnalysis.isUnusual && volumeAnalysis.volumeRatio >= (this.config?.volumeThreshold || 2)
        },
        scoreCalculator: (data: MarketDataPoint[]) => {
          const volumeAnalysis = this.analyzeVolumeActivity(data)
          return Math.min(100, volumeAnalysis.volumeRatio * 10)
        },
        metadataExtractor: (data: MarketDataPoint[]) => {
          const priceAnalysis = this.analyzePriceMovement(data)
          const volumeAnalysis = this.analyzeVolumeActivity(data)

          return {
            sector: 'Unknown',
            marketCap: MarketCapCategory.LARGE,
            volatility: this.calculateVolatility(data),
            volume: volumeAnalysis.currentVolume,
            priceChange: priceAnalysis.percentChange,
            volumeRatio: volumeAnalysis.volumeRatio
          }
        }
      }
    ]
  }

  private async detectEventsForTicker(ticker: string, data: MarketDataPoint[]): Promise<MarketEvent[]> {
    if (data.length < 2) {
      return [] // Need at least 2 data points for comparison
    }

    const events: MarketEvent[] = []

    for (const rule of this.detectionRules) {
      try {
        if (rule.condition(data, { ticker })) {
          const magnitude = rule.scoreCalculator(data, { ticker })
          const metadata = rule.metadataExtractor(data, { ticker })
          const significance = this.calculateSignificance(magnitude)

          const event: MarketEvent = {
            id: crypto.randomUUID(),
            eventType: rule.type,
            ticker: ticker,
            timestamp: data[data.length - 1].timestamp,
            magnitude,
            significance,
            sourceData: data,
            relatedEvents: [], // TODO: Implement event correlation
            metadata
          }

          events.push(event)
        }
      } catch (error) {
        console.error(`Rule execution failed for ${rule.type} on ${ticker}:`, error)
        // Continue with other rules
      }
    }

    return events
  }

  private analyzePriceMovement(data: MarketDataPoint[]): PriceAnalysis {
    const priceData = data.filter(d => d.dataType === 'STOCK_PRICE')

    if (priceData.length < 2) {
      return {
        currentPrice: 0,
        previousPrice: 0,
        percentChange: 0,
        absoluteChange: 0,
        isSignificant: false
      }
    }

    const currentPrice = Number(priceData[priceData.length - 1].value)
    const previousPrice = Number(priceData[priceData.length - 2].value)
    const absoluteChange = currentPrice - previousPrice
    const percentChange = (absoluteChange / previousPrice) * 100

    return {
      currentPrice,
      previousPrice,
      percentChange,
      absoluteChange,
      isSignificant: Math.abs(percentChange) >= (this.config?.priceThreshold || 5)
    }
  }

  private analyzeVolumeActivity(data: MarketDataPoint[]): VolumeAnalysis {
    const volumeData = data.filter(d => d.dataType === 'VOLUME')

    if (volumeData.length < 2) {
      return {
        currentVolume: 0,
        averageVolume: 0,
        volumeRatio: 1,
        isUnusual: false
      }
    }

    const currentVolume = Number(volumeData[volumeData.length - 1].value)
    const volumes = volumeData.slice(-10).map(d => Number(d.value)) // Last 10 periods
    const averageVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length
    const volumeRatio = currentVolume / averageVolume

    return {
      currentVolume,
      averageVolume,
      volumeRatio,
      isUnusual: volumeRatio >= (this.config?.volumeThreshold || 2)
    }
  }

  private calculateVolatility(data: MarketDataPoint[]): number {
    const priceData = data.filter(d => d.dataType === 'STOCK_PRICE').map(d => Number(d.value))

    if (priceData.length < 2) return 0

    // Calculate returns
    const returns = []
    for (let i = 1; i < priceData.length; i++) {
      returns.push((priceData[i] - priceData[i - 1]) / priceData[i - 1])
    }

    // Calculate standard deviation of returns
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length

    return Math.sqrt(variance) * 100 // Convert to percentage
  }

  private calculateSignificance(magnitude: number): SignificanceLevel {
    if (magnitude >= 80) return SignificanceLevel.CRITICAL
    if (magnitude >= 60) return SignificanceLevel.HIGH
    if (magnitude >= 40) return SignificanceLevel.MEDIUM
    return SignificanceLevel.LOW
  }

  private groupByTicker(dataPoints: MarketDataPoint[]): Map<string, MarketDataPoint[]> {
    const groups = new Map<string, MarketDataPoint[]>()

    for (const point of dataPoints) {
      const ticker = point.ticker.toUpperCase()
      if (!groups.has(ticker)) {
        groups.set(ticker, [])
      }
      groups.get(ticker)!.push(point)
    }

    return groups
  }

  private async storeEvents(events: MarketEvent[]): Promise<void> {
    try {
      for (const event of events) {
        // Store the event
        await db.insert(marketEvents).values({
          id: event.id,
          eventType: event.eventType,
          ticker: event.ticker,
          timestamp: event.timestamp,
          magnitude: event.magnitude,
          significance: event.significance,
          metadata: event.metadata,
          relatedEventIds: event.relatedEvents,
          createdAt: new Date(),
          updatedAt: new Date()
        })

        // Store source data points
        for (const dataPoint of event.sourceData) {
          await db.insert(marketDataPoints).values({
            id: crypto.randomUUID(),
            eventId: event.id,
            source: dataPoint.source,
            timestamp: dataPoint.timestamp,
            ticker: dataPoint.ticker,
            dataType: dataPoint.dataType,
            value: dataPoint.value,
            confidence: dataPoint.confidence,
            metadata: dataPoint.metadata,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }
    } catch (error) {
      throw this.createError(
        ErrorCode.DATABASE_QUERY_ERROR,
        'Failed to store detected events',
        ErrorSeverity.HIGH,
        { eventCount: events.length, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  private mapDatabaseEventToMarketEvent(dbEvent: any, sourceData: any[]): MarketEvent {
    return {
      id: dbEvent.id,
      eventType: dbEvent.eventType,
      ticker: dbEvent.ticker,
      timestamp: dbEvent.timestamp,
      magnitude: dbEvent.magnitude,
      significance: dbEvent.significance,
      sourceData: sourceData.map(this.mapDatabaseDataPointToMarketDataPoint),
      relatedEvents: dbEvent.relatedEventIds || [],
      metadata: dbEvent.metadata
    }
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

  private ensureConfigured(): void {
    if (!this.isConfigured || !this.config) {
      throw this.createError(
        ErrorCode.MISSING_CONFIGURATION,
        'Event detection service not configured',
        ErrorSeverity.CRITICAL
      )
    }
  }

  private validateConfig(config: EventDetectionConfig): void {
    if (config.priceThreshold <= 0) {
      throw new Error('Price threshold must be positive')
    }
    if (config.volumeThreshold <= 0) {
      throw new Error('Volume threshold must be positive')
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
        service: 'event-detection',
        operation: 'detect-events',
        additionalData
      },
      retryable: code === ErrorCode.DATABASE_QUERY_ERROR || severity === ErrorSeverity.HIGH
    }
  }
}