import { MarketDataPoint, MarketEvent, DataType } from '@/types/market'
import { ApplicationError, ErrorCode, ErrorSeverity } from '@/types/errors'

interface TechnicalIndicators {
  sma20: number
  sma50: number
  rsi: number
  bollingerBands: {
    upper: number
    middle: number
    lower: number
  }
  macd: {
    macd: number
    signal: number
    histogram: number
  }
}

interface MarketStatistics {
  mean: number
  median: number
  standardDeviation: number
  variance: number
  skewness: number
  kurtosis: number
  min: number
  max: number
  percentiles: {
    p5: number
    p25: number
    p75: number
    p95: number
  }
}

interface TrendAnalysis {
  direction: 'upward' | 'downward' | 'sideways'
  strength: number
  duration: number
  volatility: number
  momentum: number
}

interface AnomalyDetection {
  isAnomaly: boolean
  score: number
  type: 'price' | 'volume' | 'volatility' | 'correlation'
  confidence: number
  description: string
}

export class MarketDataAnalyzer {

  /**
   * Calculate technical indicators for a stock
   */
  calculateTechnicalIndicators(priceData: number[]): TechnicalIndicators | null {
    if (priceData.length < 50) {
      return null // Need at least 50 data points for meaningful indicators
    }

    return {
      sma20: this.calculateSMA(priceData, 20),
      sma50: this.calculateSMA(priceData, 50),
      rsi: this.calculateRSI(priceData, 14),
      bollingerBands: this.calculateBollingerBands(priceData, 20, 2),
      macd: this.calculateMACD(priceData)
    }
  }

  /**
   * Calculate comprehensive statistics for a data series
   */
  calculateStatistics(data: number[]): MarketStatistics {
    if (data.length === 0) {
      throw this.createError(
        ErrorCode.DATA_VALIDATION_ERROR,
        'Cannot calculate statistics for empty data array',
        ErrorSeverity.MEDIUM
      )
    }

    const sorted = [...data].sort((a, b) => a - b)
    const n = data.length
    const mean = data.reduce((sum, val) => sum + val, 0) / n

    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
    const standardDeviation = Math.sqrt(variance)

    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)]

    // Calculate skewness and kurtosis
    const skewness = this.calculateSkewness(data, mean, standardDeviation)
    const kurtosis = this.calculateKurtosis(data, mean, standardDeviation)

    return {
      mean,
      median,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      min: Math.min(...data),
      max: Math.max(...data),
      percentiles: {
        p5: sorted[Math.floor(0.05 * n)],
        p25: sorted[Math.floor(0.25 * n)],
        p75: sorted[Math.floor(0.75 * n)],
        p95: sorted[Math.floor(0.95 * n)]
      }
    }
  }

  /**
   * Analyze trend characteristics
   */
  analyzeTrend(priceData: number[], timeWindow: number = 20): TrendAnalysis {
    if (priceData.length < timeWindow) {
      throw this.createError(
        ErrorCode.DATA_VALIDATION_ERROR,
        `Need at least ${timeWindow} data points for trend analysis`,
        ErrorSeverity.MEDIUM
      )
    }

    const recentData = priceData.slice(-timeWindow)
    const slope = this.calculateLinearRegressionSlope(recentData)
    const volatility = this.calculateVolatility(recentData)
    const momentum = this.calculateMomentum(recentData)

    // Determine trend direction
    let direction: 'upward' | 'downward' | 'sideways'
    if (Math.abs(slope) < 0.001) {
      direction = 'sideways'
    } else {
      direction = slope > 0 ? 'upward' : 'downward'
    }

    // Calculate trend strength (0-100)
    const strength = Math.min(100, Math.abs(slope) * 1000)

    return {
      direction,
      strength,
      duration: timeWindow,
      volatility,
      momentum
    }
  }

  /**
   * Detect anomalies in market data
   */
  detectAnomalies(dataPoints: MarketDataPoint[], lookbackPeriod: number = 30): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = []

    if (dataPoints.length < lookbackPeriod) {
      return anomalies
    }

    // Price anomaly detection
    const priceData = dataPoints
      .filter(dp => dp.dataType === DataType.STOCK_PRICE)
      .map(dp => Number(dp.value))

    if (priceData.length >= lookbackPeriod) {
      const priceAnomaly = this.detectPriceAnomaly(priceData, lookbackPeriod)
      if (priceAnomaly) {
        anomalies.push(priceAnomaly)
      }
    }

    // Volume anomaly detection
    const volumeData = dataPoints
      .filter(dp => dp.dataType === DataType.VOLUME)
      .map(dp => Number(dp.value))

    if (volumeData.length >= lookbackPeriod) {
      const volumeAnomaly = this.detectVolumeAnomaly(volumeData, lookbackPeriod)
      if (volumeAnomaly) {
        anomalies.push(volumeAnomaly)
      }
    }

    // Volatility anomaly detection
    if (priceData.length >= lookbackPeriod) {
      const volatilityAnomaly = this.detectVolatilityAnomaly(priceData, lookbackPeriod)
      if (volatilityAnomaly) {
        anomalies.push(volatilityAnomaly)
      }
    }

    return anomalies
  }

  /**
   * Calculate correlation between two data series
   */
  calculateCorrelation(series1: number[], series2: number[]): number {
    if (series1.length !== series2.length || series1.length === 0) {
      throw this.createError(
        ErrorCode.DATA_VALIDATION_ERROR,
        'Series must have equal length and be non-empty',
        ErrorSeverity.MEDIUM
      )
    }

    const n = series1.length
    const mean1 = series1.reduce((sum, val) => sum + val, 0) / n
    const mean2 = series2.reduce((sum, val) => sum + val, 0) / n

    let numerator = 0
    let sum1Sq = 0
    let sum2Sq = 0

    for (let i = 0; i < n; i++) {
      const diff1 = series1[i] - mean1
      const diff2 = series2[i] - mean2

      numerator += diff1 * diff2
      sum1Sq += diff1 * diff1
      sum2Sq += diff2 * diff2
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq)
    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * Identify support and resistance levels
   */
  findSupportResistanceLevels(priceData: number[], sensitivity: number = 0.02): {
    support: number[]
    resistance: number[]
  } {
    if (priceData.length < 20) {
      return { support: [], resistance: [] }
    }

    const localMinima: number[] = []
    const localMaxima: number[] = []

    // Find local extrema
    for (let i = 1; i < priceData.length - 1; i++) {
      const current = priceData[i]
      const prev = priceData[i - 1]
      const next = priceData[i + 1]

      if (current < prev && current < next) {
        localMinima.push(current)
      }
      if (current > prev && current > next) {
        localMaxima.push(current)
      }
    }

    // Cluster similar levels
    const support = this.clusterLevels(localMinima, sensitivity)
    const resistance = this.clusterLevels(localMaxima, sensitivity)

    return { support, resistance }
  }

  /**
   * Calculate market regime classification
   */
  classifyMarketRegime(priceData: number[], volumeData: number[]): {
    regime: 'bull' | 'bear' | 'sideways' | 'volatile'
    confidence: number
    characteristics: string[]
  } {
    const trend = this.analyzeTrend(priceData)
    const volatility = this.calculateVolatility(priceData)
    const volumeTrend = this.analyzeTrend(volumeData)

    const characteristics: string[] = []
    let regime: 'bull' | 'bear' | 'sideways' | 'volatile'
    let confidence = 0

    // High volatility regime
    if (volatility > 30) {
      regime = 'volatile'
      confidence = 0.8
      characteristics.push('High volatility', 'Uncertain direction')
    }
    // Bull market
    else if (trend.direction === 'upward' && trend.strength > 50) {
      regime = 'bull'
      confidence = trend.strength / 100
      characteristics.push('Strong upward trend', 'Growing momentum')

      if (volumeTrend.direction === 'upward') {
        characteristics.push('Volume confirmation')
        confidence = Math.min(1, confidence + 0.2)
      }
    }
    // Bear market
    else if (trend.direction === 'downward' && trend.strength > 50) {
      regime = 'bear'
      confidence = trend.strength / 100
      characteristics.push('Strong downward trend', 'Declining momentum')

      if (volumeTrend.direction === 'upward') {
        characteristics.push('Volume confirmation')
        confidence = Math.min(1, confidence + 0.2)
      }
    }
    // Sideways market
    else {
      regime = 'sideways'
      confidence = 1 - (trend.strength / 100)
      characteristics.push('Range-bound movement', 'Lack of clear direction')
    }

    return { regime, confidence, characteristics }
  }

  // Private helper methods

  private calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0
    const recentData = data.slice(-period)
    return recentData.reduce((sum, val) => sum + val, 0) / period
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50

    const changes = []
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1])
    }

    const recentChanges = changes.slice(-period)
    const gains = recentChanges.filter(change => change > 0)
    const losses = recentChanges.filter(change => change < 0).map(loss => Math.abs(loss))

    const avgGain = gains.length > 0 ? gains.reduce((sum, gain) => sum + gain, 0) / period : 0
    const avgLoss = losses.length > 0 ? losses.reduce((sum, loss) => sum + loss, 0) / period : 0

    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private calculateBollingerBands(prices: number[], period: number = 20, deviation: number = 2) {
    const sma = this.calculateSMA(prices, period)
    const recentPrices = prices.slice(-period)

    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
    const standardDev = Math.sqrt(variance)

    return {
      upper: sma + (standardDev * deviation),
      middle: sma,
      lower: sma - (standardDev * deviation)
    }
  }

  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12)
    const ema26 = this.calculateEMA(prices, 26)
    const macd = ema12 - ema26

    // For simplicity, using SMA for signal line instead of EMA of MACD
    const macdLine = [macd] // In practice, you'd calculate this for multiple periods
    const signal = this.calculateSMA(macdLine, 9)

    return {
      macd,
      signal,
      histogram: macd - signal
    }
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return 0

    const multiplier = 2 / (period + 1)
    let ema = prices[0]

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }

    return ema
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0

    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }

    const stats = this.calculateStatistics(returns)
    return stats.standardDeviation * Math.sqrt(252) * 100 // Annualized volatility as percentage
  }

  private calculateMomentum(prices: number[], period: number = 10): number {
    if (prices.length < period) return 0
    const current = prices[prices.length - 1]
    const past = prices[prices.length - period]
    return ((current - past) / past) * 100
  }

  private calculateLinearRegressionSlope(data: number[]): number {
    const n = data.length
    const xValues = Array.from({ length: n }, (_, i) => i)

    const sumX = xValues.reduce((sum, x) => sum + x, 0)
    const sumY = data.reduce((sum, y) => sum + y, 0)
    const sumXY = xValues.reduce((sum, x, i) => sum + x * data[i], 0)
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0)

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  private calculateSkewness(data: number[], mean: number, standardDeviation: number): number {
    const n = data.length
    const skew = data.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 3), 0)
    return skew / n
  }

  private calculateKurtosis(data: number[], mean: number, standardDeviation: number): number {
    const n = data.length
    const kurt = data.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 4), 0)
    return (kurt / n) - 3 // Excess kurtosis
  }

  private detectPriceAnomaly(prices: number[], lookbackPeriod: number): AnomalyDetection | null {
    const currentPrice = prices[prices.length - 1]
    const historicalPrices = prices.slice(-lookbackPeriod - 1, -1)
    const stats = this.calculateStatistics(historicalPrices)

    const zScore = Math.abs((currentPrice - stats.mean) / stats.standardDeviation)

    if (zScore > 3) {
      return {
        isAnomaly: true,
        score: Math.min(100, zScore * 20),
        type: 'price',
        confidence: Math.min(1, zScore / 3),
        description: `Price anomaly detected: ${zScore.toFixed(2)} standard deviations from mean`
      }
    }

    return null
  }

  private detectVolumeAnomaly(volumes: number[], lookbackPeriod: number): AnomalyDetection | null {
    const currentVolume = volumes[volumes.length - 1]
    const historicalVolumes = volumes.slice(-lookbackPeriod - 1, -1)
    const avgVolume = historicalVolumes.reduce((sum, vol) => sum + vol, 0) / historicalVolumes.length

    const ratio = currentVolume / avgVolume

    if (ratio > 3) {
      return {
        isAnomaly: true,
        score: Math.min(100, ratio * 20),
        type: 'volume',
        confidence: Math.min(1, ratio / 5),
        description: `Volume spike detected: ${ratio.toFixed(2)}x average volume`
      }
    }

    return null
  }

  private detectVolatilityAnomaly(prices: number[], lookbackPeriod: number): AnomalyDetection | null {
    const currentVolatility = this.calculateVolatility(prices.slice(-5)) // Recent 5-day volatility
    const historicalVolatility = this.calculateVolatility(prices.slice(-lookbackPeriod - 5, -5))

    const ratio = currentVolatility / historicalVolatility

    if (ratio > 2) {
      return {
        isAnomaly: true,
        score: Math.min(100, ratio * 30),
        type: 'volatility',
        confidence: Math.min(1, ratio / 3),
        description: `Volatility spike detected: ${ratio.toFixed(2)}x historical volatility`
      }
    }

    return null
  }

  private clusterLevels(levels: number[], sensitivity: number): number[] {
    if (levels.length === 0) return []

    const sortedLevels = [...levels].sort((a, b) => a - b)
    const clusters: number[] = []
    let currentCluster = [sortedLevels[0]]

    for (let i = 1; i < sortedLevels.length; i++) {
      const level = sortedLevels[i]
      const clusterMean = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length

      if (Math.abs(level - clusterMean) / clusterMean <= sensitivity) {
        currentCluster.push(level)
      } else {
        clusters.push(clusterMean)
        currentCluster = [level]
      }
    }

    // Add the last cluster
    if (currentCluster.length > 0) {
      const clusterMean = currentCluster.reduce((sum, val) => sum + val, 0) / currentCluster.length
      clusters.push(clusterMean)
    }

    return clusters
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
        service: 'market-analyzer',
        operation: 'analysis',
        additionalData
      },
      retryable: false
    }
  }
}