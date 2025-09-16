// Analytics Module Exports

export { EventDetectionEngine } from './event-detection'
export { MarketDataAnalyzer } from './market-analyzer'
export { AnalyticsEngine } from './analytics-engine'

// Type exports from analytics components
export type {
  PriceAnalysis,
  VolumeAnalysis,
  DetectionRule
} from './event-detection'

export type {
  TechnicalIndicators,
  MarketStatistics,
  TrendAnalysis,
  AnomalyDetection
} from './market-analyzer'

export type {
  AnalyticsConfig,
  AnalyticsResult
} from './analytics-engine'

// Utility functions for analytics
export const createDefaultAnalyticsConfig = () => ({
  eventDetection: {
    priceThreshold: 5.0,
    volumeThreshold: 2.0,
    significanceFilters: ['MEDIUM', 'HIGH', 'CRITICAL'],
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
    maxProcessingTime: 60000
  }
})

// Analytics helper functions
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export const classifySignificance = (magnitude: number): string => {
  if (magnitude >= 80) return 'CRITICAL'
  if (magnitude >= 60) return 'HIGH'
  if (magnitude >= 40) return 'MEDIUM'
  return 'LOW'
}

export const calculateVolatilityLevel = (volatility: number): string => {
  if (volatility < 15) return 'low'
  if (volatility < 25) return 'medium'
  if (volatility < 40) return 'high'
  return 'extreme'
}

export const classifyTrendStrength = (strength: number): string => {
  if (strength < 20) return 'weak'
  if (strength < 50) return 'moderate'
  if (strength < 80) return 'strong'
  return 'very_strong'
}

export const formatAnalyticsResult = (result: any) => {
  return {
    ...result,
    formattedProcessingTime: `${result.processingMetadata.processingTime}ms`,
    formattedTimestamp: result.processingMetadata.processedAt.toISOString(),
    summary: {
      totalEvents: result.events.length,
      significantEvents: result.events.filter((e: any) =>
        e.significance === 'HIGH' || e.significance === 'CRITICAL'
      ).length,
      processingTime: result.processingMetadata.processingTime,
      dataPointsAnalyzed: result.processingMetadata.dataPointsAnalyzed
    }
  }
}

// Constants
export const ANALYTICS_CONSTANTS = {
  MAX_TICKERS_PER_REQUEST: 50,
  MAX_DAYS_LOOKBACK: 365,
  MIN_DATA_POINTS_FOR_ANALYSIS: 10,
  DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
  DEFAULT_SIGNIFICANCE_THRESHOLD: 40,
  VOLATILITY_THRESHOLDS: {
    LOW: 15,
    MEDIUM: 25,
    HIGH: 40
  },
  TREND_STRENGTH_THRESHOLDS: {
    WEAK: 20,
    MODERATE: 50,
    STRONG: 80
  }
} as const