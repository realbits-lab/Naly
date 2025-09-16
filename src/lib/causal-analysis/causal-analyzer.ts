import {
  CausalAnalysisService,
  CausalAnalysisConfig
} from '@/types/services'
import {
  CausalAnalysis,
  CausalFactor,
  EvidenceItem,
  AlternativeExplanation,
  FactorType,
  ImpactLevel,
  EvidenceType,
  TemporalRelation,
  AnalysisMethod
} from '@/types/analytics'
import {
  MarketEvent,
  MarketDataPoint
} from '@/types/market'
import {
  ApplicationError,
  ErrorCode,
  ErrorSeverity
} from '@/types/errors'
import { generateCausalExplanation, generateAIText } from '@/lib/ai'
import { getFinancialDataAPI } from '@/lib/service-registry'
import { db } from '@/lib/db'
import { causalAnalyses, analysisResults } from '@/lib/schema/events'
import { eq } from 'drizzle-orm'

interface CausalHypothesis {
  factor: FactorType
  likelihood: number
  supportingEvidence: MarketDataPoint[]
  temporalAlignment: number
  impact: ImpactLevel
}

interface CorrelationAnalysis {
  correlation: number
  significance: number
  pValue: number
  causationLikelihood: number
}

export class CausalAnalyzer implements CausalAnalysisService {
  private config: CausalAnalysisConfig | null = null
  private isConfigured = false

  async configure(config: CausalAnalysisConfig): Promise<void> {
    this.validateConfig(config)
    this.config = config
    this.isConfigured = true
  }

  async analyzeEvent(event: MarketEvent): Promise<CausalAnalysis> {
    this.ensureConfigured()

    try {
      // Check if analysis already exists
      const existingAnalysis = await this.getExistingAnalysis(event.id)
      if (existingAnalysis && this.config!.useCache) {
        return existingAnalysis
      }

      // Gather contextual data
      const contextualData = await this.gatherContextualData(event)

      // Generate causal hypotheses
      const hypotheses = await this.generateCausalHypotheses(event, contextualData)

      // Evaluate hypotheses
      const evaluatedHypotheses = await this.evaluateHypotheses(hypotheses, event)

      // Identify root cause and contributing factors
      const { rootCause, contributingFactors } = this.identifyRootCause(evaluatedHypotheses)

      // Build evidence chain
      const evidenceChain = this.buildEvidenceChain(rootCause, contributingFactors, event)

      // Generate alternative explanations
      const alternativeExplanations = await this.generateAlternativeExplanations(
        event,
        evaluatedHypotheses,
        rootCause
      )

      // Calculate overall confidence
      const confidenceScore = this.calculateOverallConfidence(
        rootCause,
        contributingFactors,
        evidenceChain
      )

      // Create causal analysis result
      const analysis: CausalAnalysis = {
        eventId: event.id,
        rootCause,
        contributingFactors,
        confidenceScore,
        methodology: this.config!.analysisMethod,
        evidenceChain,
        alternativeExplanations
      }

      // Store analysis result
      await this.storeAnalysis(analysis)

      return analysis

    } catch (error) {
      throw this.createError(
        ErrorCode.ANALYSIS_ERROR,
        `Failed to analyze causal factors for event ${event.id}`,
        ErrorSeverity.HIGH,
        { eventId: event.id, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  async generateExplanation(analysis: CausalAnalysis): Promise<string> {
    this.ensureConfigured()

    try {
      // Get the original event
      const event = await this.getEventById(analysis.eventId)
      if (!event) {
        throw this.createError(
          ErrorCode.NOT_FOUND,
          `Event ${analysis.eventId} not found`,
          ErrorSeverity.MEDIUM
        )
      }

      // Generate AI-powered explanation
      const explanation = await generateCausalExplanation({
        eventData: event,
        evidenceChain: analysis.evidenceChain,
        historicalContext: await this.getHistoricalContext(event)
      })

      return explanation

    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }

      throw this.createError(
        ErrorCode.AI_SERVICE_ERROR,
        'Failed to generate causal explanation',
        ErrorSeverity.MEDIUM,
        { analysisId: analysis.eventId, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  async validateAnalysis(analysis: CausalAnalysis): Promise<number> {
    this.ensureConfigured()

    let validationScore = 0
    const maxScore = 100

    // Validate root cause strength
    if (analysis.rootCause.confidence >= 0.7) {
      validationScore += 30
    } else if (analysis.rootCause.confidence >= 0.5) {
      validationScore += 20
    } else {
      validationScore += 10
    }

    // Validate evidence quality
    const evidenceQuality = this.assessEvidenceQuality(analysis.evidenceChain)
    validationScore += Math.round(evidenceQuality * 25)

    // Validate alternative explanations
    if (analysis.alternativeExplanations.length > 0) {
      validationScore += 15
    }

    // Validate temporal consistency
    const temporalConsistency = this.assessTemporalConsistency(analysis)
    validationScore += Math.round(temporalConsistency * 15)

    // Validate methodology appropriateness
    if (this.isMethodologyAppropriate(analysis)) {
      validationScore += 15
    }

    return Math.min(maxScore, validationScore)
  }

  private async gatherContextualData(event: MarketEvent): Promise<MarketDataPoint[]> {
    const financialAPI = getFinancialDataAPI()

    // Get extended historical data for context
    const endDate = event.timestamp
    const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)) // 30 days before

    try {
      const contextualData = await financialAPI.getMarketData({
        ticker: event.ticker,
        dataTypes: ['STOCK_PRICE', 'VOLUME', 'SENTIMENT_SCORE', 'NEWS_ITEM'],
        startDate,
        endDate,
        frequency: 'daily'
      })

      return contextualData

    } catch (error) {
      console.warn(`Failed to gather contextual data for ${event.ticker}:`, error)
      return []
    }
  }

  private async generateCausalHypotheses(
    event: MarketEvent,
    contextualData: MarketDataPoint[]
  ): Promise<CausalHypothesis[]> {
    const hypotheses: CausalHypothesis[] = []

    // Price movement hypothesis
    const priceData = contextualData.filter(d => d.dataType === 'STOCK_PRICE')
    if (priceData.length > 1) {
      const priceHypothesis = this.analyzePriceMovementCausation(event, priceData)
      if (priceHypothesis) hypotheses.push(priceHypothesis)
    }

    // Volume analysis hypothesis
    const volumeData = contextualData.filter(d => d.dataType === 'VOLUME')
    if (volumeData.length > 1) {
      const volumeHypothesis = this.analyzeVolumePatternCausation(event, volumeData)
      if (volumeHypothesis) hypotheses.push(volumeHypothesis)
    }

    // News sentiment hypothesis
    const newsData = contextualData.filter(d => d.dataType === 'NEWS_ITEM' || d.dataType === 'SENTIMENT_SCORE')
    if (newsData.length > 0) {
      const newsHypothesis = this.analyzeNewsSentimentCausation(event, newsData)
      if (newsHypothesis) hypotheses.push(newsHypothesis)
    }

    // Market pattern hypothesis
    const marketPatternHypothesis = await this.analyzeMarketPatternCausation(event, contextualData)
    if (marketPatternHypothesis) hypotheses.push(marketPatternHypothesis)

    return hypotheses
  }

  private async evaluateHypotheses(
    hypotheses: CausalHypothesis[],
    event: MarketEvent
  ): Promise<CausalFactor[]> {
    const factors: CausalFactor[] = []

    for (const hypothesis of hypotheses) {
      // Convert hypothesis to causal factor
      const factor: CausalFactor = {
        type: hypothesis.factor,
        description: this.generateFactorDescription(hypothesis),
        impact: hypothesis.impact,
        confidence: hypothesis.likelihood,
        supportingEvidence: hypothesis.supportingEvidence.map(this.convertToEvidenceItem),
        temporalRelationship: this.determineTemporalRelationship(hypothesis, event)
      }

      factors.push(factor)
    }

    // Sort factors by confidence and impact
    return factors.sort((a, b) => {
      const scoreA = a.confidence * this.getImpactWeight(a.impact)
      const scoreB = b.confidence * this.getImpactWeight(b.impact)
      return scoreB - scoreA
    })
  }

  private identifyRootCause(factors: CausalFactor[]): {
    rootCause: CausalFactor
    contributingFactors: CausalFactor[]
  } {
    if (factors.length === 0) {
      // Create default root cause if no factors identified
      const defaultRootCause: CausalFactor = {
        type: FactorType.MARKET_SENTIMENT,
        description: 'Market sentiment shift',
        impact: ImpactLevel.MODERATE,
        confidence: 0.5,
        supportingEvidence: [],
        temporalRelationship: TemporalRelation.CONCURRENT
      }

      return {
        rootCause: defaultRootCause,
        contributingFactors: []
      }
    }

    // The highest confidence factor becomes the root cause
    const rootCause = factors[0]

    // Remaining factors become contributing factors
    const contributingFactors = factors
      .slice(1)
      .filter(factor => factor.confidence >= this.config!.confidenceThreshold)
      .slice(0, this.config!.maxFactors - 1)

    return { rootCause, contributingFactors }
  }

  private buildEvidenceChain(
    rootCause: CausalFactor,
    contributingFactors: CausalFactor[],
    event: MarketEvent
  ): EvidenceItem[] {
    const evidenceChain: EvidenceItem[] = []

    // Add root cause evidence
    evidenceChain.push(...rootCause.supportingEvidence)

    // Add contributing factors evidence
    for (const factor of contributingFactors) {
      evidenceChain.push(...factor.supportingEvidence)
    }

    // Add original event data as evidence
    for (const dataPoint of event.sourceData) {
      evidenceChain.push({
        dataPoint,
        relevanceScore: 0.9,
        evidenceType: EvidenceType.QUANTITATIVE,
        timestamp: dataPoint.timestamp,
        description: `Market data point from original event`
      })
    }

    // Sort evidence by relevance and timestamp
    return evidenceChain.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }

  private async generateAlternativeExplanations(
    event: MarketEvent,
    hypotheses: CausalHypothesis[],
    primaryCause: CausalFactor
  ): Promise<AlternativeExplanation[]> {
    const alternatives: AlternativeExplanation[] = []

    // Consider hypotheses that weren't selected as root cause
    for (const hypothesis of hypotheses) {
      if (hypothesis.factor !== primaryCause.type && hypothesis.likelihood >= 0.3) {
        const alternative: AlternativeExplanation = {
          description: `Alternative explanation based on ${hypothesis.factor}`,
          confidence: hypothesis.likelihood,
          supportingEvidence: hypothesis.supportingEvidence.map(this.convertToEvidenceItem),
          likelihood: hypothesis.likelihood
        }
        alternatives.push(alternative)
      }
    }

    // Generate AI-powered alternative explanations if enabled
    if (this.config!.enableAlternativeExplanations && alternatives.length < 2) {
      try {
        const aiAlternatives = await this.generateAIAlternatives(event, primaryCause)
        alternatives.push(...aiAlternatives)
      } catch (error) {
        console.warn('Failed to generate AI alternatives:', error)
      }
    }

    return alternatives.slice(0, 3) // Limit to 3 alternatives
  }

  private calculateOverallConfidence(
    rootCause: CausalFactor,
    contributingFactors: CausalFactor[],
    evidenceChain: EvidenceItem[]
  ): number {
    let confidence = rootCause.confidence * 0.6 // Root cause weight: 60%

    // Contributing factors weight: 25%
    if (contributingFactors.length > 0) {
      const avgContributing = contributingFactors.reduce((sum, f) => sum + f.confidence, 0) / contributingFactors.length
      confidence += avgContributing * 0.25
    }

    // Evidence quality weight: 15%
    const evidenceQuality = this.assessEvidenceQuality(evidenceChain)
    confidence += evidenceQuality * 0.15

    return Math.min(1.0, confidence)
  }

  // Helper methods for hypothesis generation
  private analyzePriceMovementCausation(event: MarketEvent, priceData: MarketDataPoint[]): CausalHypothesis | null {
    if (priceData.length < 5) return null

    const prices = priceData.map(d => Number(d.value)).slice(-5)
    const recentVolatility = this.calculateVolatility(prices)
    const priceChange = Math.abs((prices[prices.length - 1] - prices[0]) / prices[0]) * 100

    if (priceChange > 10 || recentVolatility > 30) {
      return {
        factor: FactorType.MARKET_SENTIMENT,
        likelihood: Math.min(0.9, priceChange / 20),
        supportingEvidence: priceData.slice(-3),
        temporalAlignment: 0.8,
        impact: priceChange > 15 ? ImpactLevel.HIGH : ImpactLevel.MODERATE
      }
    }

    return null
  }

  private analyzeVolumePatternCausation(event: MarketEvent, volumeData: MarketDataPoint[]): CausalHypothesis | null {
    if (volumeData.length < 5) return null

    const volumes = volumeData.map(d => Number(d.value))
    const avgVolume = volumes.slice(0, -2).reduce((sum, v) => sum + v, 0) / (volumes.length - 2)
    const recentVolume = volumes[volumes.length - 1]
    const volumeRatio = recentVolume / avgVolume

    if (volumeRatio > 2) {
      return {
        factor: FactorType.INSTITUTIONAL_FLOW,
        likelihood: Math.min(0.9, volumeRatio / 5),
        supportingEvidence: volumeData.slice(-2),
        temporalAlignment: 0.9,
        impact: volumeRatio > 5 ? ImpactLevel.HIGH : ImpactLevel.MODERATE
      }
    }

    return null
  }

  private analyzeNewsSentimentCausation(event: MarketEvent, newsData: MarketDataPoint[]): CausalHypothesis | null {
    if (newsData.length === 0) return null

    const recentNews = newsData.filter(d =>
      d.timestamp.getTime() >= event.timestamp.getTime() - (24 * 60 * 60 * 1000) // Within 24 hours
    )

    if (recentNews.length > 0) {
      return {
        factor: FactorType.NEWS_SENTIMENT,
        likelihood: 0.7,
        supportingEvidence: recentNews,
        temporalAlignment: 0.8,
        impact: ImpactLevel.MODERATE
      }
    }

    return null
  }

  private async analyzeMarketPatternCausation(
    event: MarketEvent,
    contextualData: MarketDataPoint[]
  ): Promise<CausalHypothesis | null> {
    // Analyze for earnings patterns
    const isEarningsSeason = this.isEarningsSeason(event.timestamp)
    if (isEarningsSeason && event.magnitude > 50) {
      return {
        factor: FactorType.EARNINGS_SURPRISE,
        likelihood: 0.8,
        supportingEvidence: contextualData.slice(-2),
        temporalAlignment: 0.9,
        impact: ImpactLevel.HIGH
      }
    }

    return null
  }

  // Utility methods
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0

    const returns = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length

    return Math.sqrt(variance) * 100
  }

  private generateFactorDescription(hypothesis: CausalHypothesis): string {
    switch (hypothesis.factor) {
      case FactorType.MARKET_SENTIMENT:
        return 'Market sentiment shift detected through price movement analysis'
      case FactorType.INSTITUTIONAL_FLOW:
        return 'Institutional trading activity indicated by unusual volume patterns'
      case FactorType.NEWS_SENTIMENT:
        return 'News-driven sentiment change affecting market perception'
      case FactorType.EARNINGS_SURPRISE:
        return 'Earnings announcement exceeding or falling short of expectations'
      default:
        return 'Market factor contributing to price movement'
    }
  }

  private convertToEvidenceItem = (dataPoint: MarketDataPoint): EvidenceItem => ({
    dataPoint,
    relevanceScore: 0.8,
    evidenceType: EvidenceType.QUANTITATIVE,
    timestamp: dataPoint.timestamp,
    description: `${dataPoint.dataType} data supporting causal analysis`
  })

  private determineTemporalRelationship(hypothesis: CausalHypothesis, event: MarketEvent): TemporalRelation {
    const timeDiff = event.timestamp.getTime() - hypothesis.supportingEvidence[0]?.timestamp.getTime()

    if (Math.abs(timeDiff) < 60 * 60 * 1000) { // Within 1 hour
      return TemporalRelation.CONCURRENT
    } else if (timeDiff > 0) {
      return TemporalRelation.LAGGED
    } else {
      return TemporalRelation.ANTICIPATORY
    }
  }

  private getImpactWeight(impact: ImpactLevel): number {
    switch (impact) {
      case ImpactLevel.DECISIVE: return 1.0
      case ImpactLevel.HIGH: return 0.8
      case ImpactLevel.MODERATE: return 0.6
      case ImpactLevel.LOW: return 0.4
      case ImpactLevel.MINIMAL: return 0.2
      default: return 0.5
    }
  }

  private assessEvidenceQuality(evidenceChain: EvidenceItem[]): number {
    if (evidenceChain.length === 0) return 0

    const avgRelevance = evidenceChain.reduce((sum, e) => sum + e.relevanceScore, 0) / evidenceChain.length
    const recencyBonus = evidenceChain.filter(e =>
      Date.now() - e.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Within 7 days
    ).length / evidenceChain.length

    return (avgRelevance * 0.7) + (recencyBonus * 0.3)
  }

  private assessTemporalConsistency(analysis: CausalAnalysis): number {
    const evidenceTimestamps = analysis.evidenceChain.map(e => e.timestamp.getTime()).sort((a, b) => a - b)

    if (evidenceTimestamps.length < 2) return 1.0

    // Check for logical temporal progression
    let consistencyScore = 1.0
    const maxTimeGap = 7 * 24 * 60 * 60 * 1000 // 7 days

    for (let i = 1; i < evidenceTimestamps.length; i++) {
      const gap = evidenceTimestamps[i] - evidenceTimestamps[i - 1]
      if (gap > maxTimeGap) {
        consistencyScore *= 0.8
      }
    }

    return consistencyScore
  }

  private isMethodologyAppropriate(analysis: CausalAnalysis): boolean {
    // Simple validation - in practice, this would be more sophisticated
    return analysis.methodology === AnalysisMethod.STATISTICAL_INFERENCE ||
           analysis.methodology === AnalysisMethod.FIVE_WHYS
  }

  private isEarningsSeason(date: Date): boolean {
    const month = date.getMonth() + 1
    return month === 1 || month === 4 || month === 7 || month === 10
  }

  private async generateAIAlternatives(event: MarketEvent, primaryCause: CausalFactor): Promise<AlternativeExplanation[]> {
    try {
      const prompt = `
Generate alternative explanations for this market event:

Event: ${event.eventType} for ${event.ticker}
Primary Cause: ${primaryCause.description}
Magnitude: ${event.magnitude}
Timestamp: ${event.timestamp.toISOString()}

Provide 2 brief alternative explanations (max 100 words each) that could plausibly explain this event.
Focus on different causal factors than the primary cause.
Format as JSON array with objects containing 'description' and 'likelihood' (0-1).
`

      const response = await generateAIText({
        prompt,
        temperature: 0.6,
        maxTokens: 500
      })

      const alternatives = JSON.parse(response)
      return alternatives.map((alt: any) => ({
        description: alt.description,
        confidence: alt.likelihood,
        supportingEvidence: [],
        likelihood: alt.likelihood
      }))

    } catch (error) {
      console.warn('Failed to generate AI alternatives:', error)
      return []
    }
  }

  private async getExistingAnalysis(eventId: string): Promise<CausalAnalysis | null> {
    try {
      const result = await db
        .select()
        .from(causalAnalyses)
        .where(eq(causalAnalyses.eventId, eventId))
        .limit(1)

      if (!result.length) return null

      const dbAnalysis = result[0]

      // Convert database record back to CausalAnalysis
      return {
        eventId: dbAnalysis.eventId,
        rootCause: dbAnalysis.rootCause as any,
        contributingFactors: dbAnalysis.contributingFactors as any,
        confidenceScore: dbAnalysis.confidenceScore,
        methodology: dbAnalysis.methodology as any,
        evidenceChain: dbAnalysis.evidenceChain as any,
        alternativeExplanations: dbAnalysis.alternativeExplanations as any
      }

    } catch (error) {
      console.warn('Failed to retrieve existing analysis:', error)
      return null
    }
  }

  private async storeAnalysis(analysis: CausalAnalysis): Promise<void> {
    try {
      await db.insert(causalAnalyses).values({
        id: crypto.randomUUID(),
        eventId: analysis.eventId,
        rootCause: analysis.rootCause,
        contributingFactors: analysis.contributingFactors,
        confidenceScore: analysis.confidenceScore,
        methodology: analysis.methodology,
        evidenceChain: analysis.evidenceChain,
        alternativeExplanations: analysis.alternativeExplanations,
        createdAt: new Date(),
        updatedAt: new Date()
      })

    } catch (error) {
      console.error('Failed to store causal analysis:', error)
      // Don't throw - analysis can still be returned even if storage fails
    }
  }

  private async getEventById(eventId: string): Promise<MarketEvent | null> {
    // This would typically query the events table
    // For now, return null - this would be implemented with proper event retrieval
    return null
  }

  private async getHistoricalContext(event: MarketEvent): Promise<any> {
    // This would gather historical context for the event
    // For now, return basic context
    return {
      ticker: event.ticker,
      eventType: event.eventType,
      timeframe: '30 days'
    }
  }

  private ensureConfigured(): void {
    if (!this.isConfigured || !this.config) {
      throw this.createError(
        ErrorCode.MISSING_CONFIGURATION,
        'Causal analysis service not configured',
        ErrorSeverity.CRITICAL
      )
    }
  }

  private validateConfig(config: CausalAnalysisConfig): void {
    if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1')
    }
    if (config.maxFactors < 1) {
      throw new Error('Max factors must be at least 1')
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
        service: 'causal-analysis',
        operation: 'analyze',
        additionalData
      },
      retryable: code === ErrorCode.DATABASE_QUERY_ERROR || severity === ErrorSeverity.HIGH
    }
  }
}