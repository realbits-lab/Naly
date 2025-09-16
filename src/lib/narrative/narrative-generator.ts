import {
  NarrativeService,
  NarrativeConfig
} from '@/types/services'
import {
  IntelligentNarrative,
  ContentSection,
  NarrativeMetadata,
  SectionType,
  ComplexityLevel,
  AudienceType,
  ContentStatus,
  ContentValidation,
  AccuracyAssessment,
  BiasAssessment,
  ImprovementSuggestion,
  SentimentScore,
  ContentTemplate
} from '@/types/content'
import {
  MarketEvent
} from '@/types/market'
import {
  CausalAnalysis
} from '@/types/analytics'
import {
  UserProfile
} from '@/types/user'
import {
  ApplicationError,
  ErrorCode,
  ErrorSeverity
} from '@/types/errors'
import {
  generateMarketNarrative,
  generateAIText,
  generateAIObject
} from '@/lib/ai'
import { db } from '@/lib/db'
import { intelligentNarratives, narrativeValidations } from '@/lib/schema/events'
import { eq } from 'drizzle-orm'

interface NarrativeGenerationContext {
  event: MarketEvent
  causalAnalysis?: CausalAnalysis
  prediction?: any
  userProfile?: UserProfile
  template?: ContentTemplate
  additionalContext?: any
}

interface GenerationPrompt {
  systemPrompt: string
  userPrompt: string
  temperature: number
  maxTokens: number
}

export class NarrativeGenerator implements NarrativeService {
  private config: NarrativeConfig | null = null
  private isConfigured = false
  private templates: Map<string, ContentTemplate> = new Map()

  async configure(config: NarrativeConfig): Promise<void> {
    this.validateConfig(config)
    this.config = config
    await this.initializeTemplates()
    this.isConfigured = true
  }

  async generateNarrative(
    event: MarketEvent,
    analysis: CausalAnalysis,
    prediction: any
  ): Promise<IntelligentNarrative> {
    this.ensureConfigured()

    try {
      const context: NarrativeGenerationContext = {
        event,
        causalAnalysis: analysis,
        prediction,
        template: this.getDefaultTemplate()
      }

      // Generate individual sections
      const sections = await this.generateAllSections(context)

      // Extract headline from summary section
      const headline = await this.generateHeadline(context)

      // Create visualizations if enabled
      const visualizations = this.config!.includeVisualizations
        ? await this.generateVisualizationSpecs(context)
        : []

      // Calculate metadata
      const metadata = await this.calculateNarrativeMetadata(sections, context)

      // Create narrative object
      const narrative: IntelligentNarrative = {
        id: crypto.randomUUID(),
        eventId: event.id,
        headline,
        summary: sections.find(s => s.type === SectionType.SUMMARY)!,
        explanation: sections.find(s => s.type === SectionType.EXPLANATION)!,
        prediction: sections.find(s => s.type === SectionType.PREDICTION)!,
        deepDive: sections.find(s => s.type === SectionType.DEEP_DIVE)!,
        metadata,
        visualizations,
        status: ContentStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Validate narrative quality
      if (this.config!.autoValidate) {
        const validation = await this.validateNarrative(narrative)
        if (validation.qualityScore >= this.config!.qualityThreshold) {
          narrative.status = ContentStatus.PUBLISHED
        }
      }

      // Store narrative
      await this.storeNarrative(narrative)

      return narrative

    } catch (error) {
      throw this.createError(
        ErrorCode.AI_SERVICE_ERROR,
        `Failed to generate narrative for event ${event.id}`,
        ErrorSeverity.HIGH,
        { eventId: event.id, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  async adaptNarrative(narrative: IntelligentNarrative, userProfile: UserProfile): Promise<IntelligentNarrative> {
    this.ensureConfigured()

    try {
      // Create personalized template
      const personalizedTemplate = await this.createPersonalizedTemplate(userProfile)

      // Adapt each section
      const adaptedSections = await Promise.all([
        this.adaptSection(narrative.summary, userProfile, personalizedTemplate),
        this.adaptSection(narrative.explanation, userProfile, personalizedTemplate),
        this.adaptSection(narrative.prediction, userProfile, personalizedTemplate),
        this.adaptSection(narrative.deepDive, userProfile, personalizedTemplate)
      ])

      // Create adapted narrative
      const adaptedNarrative: IntelligentNarrative = {
        ...narrative,
        id: crypto.randomUUID(),
        summary: adaptedSections[0],
        explanation: adaptedSections[1],
        prediction: adaptedSections[2],
        deepDive: adaptedSections[3],
        metadata: {
          ...narrative.metadata,
          targetAudience: this.inferAudienceType(userProfile),
          complexityLevel: userProfile.preferences.contentComplexity
        },
        updatedAt: new Date()
      }

      return adaptedNarrative

    } catch (error) {
      throw this.createError(
        ErrorCode.AI_SERVICE_ERROR,
        'Failed to adapt narrative for user profile',
        ErrorSeverity.MEDIUM,
        { narrativeId: narrative.id, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  async validateNarrative(narrative: IntelligentNarrative): Promise<number> {
    this.ensureConfigured()

    try {
      // Perform comprehensive validation
      const validation = await this.performContentValidation(narrative)

      // Store validation results
      await this.storeValidationResults(narrative.id, validation)

      return validation.qualityScore

    } catch (error) {
      throw this.createError(
        ErrorCode.VALIDATION_ERROR,
        'Failed to validate narrative content',
        ErrorSeverity.MEDIUM,
        { narrativeId: narrative.id, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  private async initializeTemplates(): Promise<void> {
    // Retail investor template
    const retailTemplate: ContentTemplate = {
      structure: {
        sections: [SectionType.HEADLINE, SectionType.SUMMARY, SectionType.EXPLANATION, SectionType.PREDICTION],
        maxLength: this.config!.maxLength,
        includeVisualizations: this.config!.includeVisualizations,
        includeSources: true
      },
      styleGuide: {
        tone: 'conversational',
        vocabulary: 'accessible',
        citations: true,
        factChecking: true
      },
      targetAudience: AudienceType.RETAIL,
      complexity: ComplexityLevel.BASIC,
      length: 'MEDIUM'
    }

    // Professional template
    const professionalTemplate: ContentTemplate = {
      structure: {
        sections: [SectionType.HEADLINE, SectionType.SUMMARY, SectionType.EXPLANATION, SectionType.PREDICTION, SectionType.DEEP_DIVE],
        maxLength: this.config!.maxLength * 1.5,
        includeVisualizations: true,
        includeSources: true
      },
      styleGuide: {
        tone: 'analytical',
        vocabulary: 'technical',
        citations: true,
        factChecking: true
      },
      targetAudience: AudienceType.PROFESSIONAL,
      complexity: ComplexityLevel.ADVANCED,
      length: 'LONG'
    }

    this.templates.set('retail', retailTemplate)
    this.templates.set('professional', professionalTemplate)
    this.templates.set('default', retailTemplate)
  }

  private async generateAllSections(context: NarrativeGenerationContext): Promise<ContentSection[]> {
    const sections: ContentSection[] = []

    // Generate summary section
    const summaryPrompt = this.createSectionPrompt(SectionType.SUMMARY, context)
    const summaryContent = await generateAIText(summaryPrompt)

    sections.push({
      type: SectionType.SUMMARY,
      content: summaryContent,
      bulletPoints: await this.extractBulletPoints(summaryContent),
      confidence: 0.85,
      sources: context.causalAnalysis ? [{ source: 'CAUSAL_ANALYSIS', timestamp: new Date(), ticker: context.event.ticker, dataType: 'ANALYSIS_RESULT', value: 'analysis', confidence: context.causalAnalysis.confidenceScore, metadata: {} }] : [],
      visualizations: []
    })

    // Generate explanation section
    const explanationPrompt = this.createSectionPrompt(SectionType.EXPLANATION, context)
    const explanationContent = await generateAIText(explanationPrompt)

    sections.push({
      type: SectionType.EXPLANATION,
      content: explanationContent,
      bulletPoints: await this.extractBulletPoints(explanationContent),
      confidence: context.causalAnalysis ? context.causalAnalysis.confidenceScore : 0.7,
      sources: context.causalAnalysis?.evidenceChain.map(e => e.dataPoint) || [],
      visualizations: []
    })

    // Generate prediction section
    const predictionPrompt = this.createSectionPrompt(SectionType.PREDICTION, context)
    const predictionContent = await generateAIText(predictionPrompt)

    sections.push({
      type: SectionType.PREDICTION,
      content: predictionContent,
      bulletPoints: await this.extractBulletPoints(predictionContent),
      confidence: context.prediction?.uncertainty ? 1 - (context.prediction.uncertainty.entropy / 2) : 0.7,
      sources: [],
      visualizations: []
    })

    // Generate deep dive section if required
    if (context.template?.structure.sections.includes(SectionType.DEEP_DIVE)) {
      const deepDivePrompt = this.createSectionPrompt(SectionType.DEEP_DIVE, context)
      const deepDiveContent = await generateAIText(deepDivePrompt)

      sections.push({
        type: SectionType.DEEP_DIVE,
        content: deepDiveContent,
        bulletPoints: await this.extractBulletPoints(deepDiveContent),
        confidence: 0.8,
        sources: [],
        visualizations: []
      })
    }

    return sections
  }

  private createSectionPrompt(sectionType: SectionType, context: NarrativeGenerationContext): GenerationPrompt {
    const { event, causalAnalysis, prediction, template } = context

    const baseContext = `
Event: ${event.eventType} for ${event.ticker}
Magnitude: ${event.magnitude}
Timestamp: ${event.timestamp.toISOString()}
Significance: ${event.significance}
`

    const causalContext = causalAnalysis ? `
Root Cause: ${causalAnalysis.rootCause.description}
Confidence: ${Math.round(causalAnalysis.confidenceScore * 100)}%
Contributing Factors: ${causalAnalysis.contributingFactors.map(f => f.description).join(', ')}
` : ''

    const predictionContext = prediction ? `
Scenarios: ${prediction.scenarios?.map((s: any) => `${s.type}: ${s.description}`).join('; ')}
` : ''

    let sectionSpecificPrompt = ''
    let maxTokens = 500
    let temperature = 0.6

    switch (sectionType) {
      case SectionType.SUMMARY:
        sectionSpecificPrompt = `Write a concise 3-5 sentence summary explaining what happened and why it matters to investors. Focus on the key facts and immediate implications.`
        maxTokens = 300
        temperature = 0.5
        break

      case SectionType.EXPLANATION:
        sectionSpecificPrompt = `Provide a detailed explanation of the causal factors behind this event. Use the "5 Whys" methodology to trace the event back to its fundamental causes. Be specific about the evidence and maintain objectivity.`
        maxTokens = 800
        temperature = 0.4
        break

      case SectionType.PREDICTION:
        sectionSpecificPrompt = `Generate forward-looking analysis with specific scenarios and their probabilities. Include potential catalysts and key risks. Present uncertainty transparently.`
        maxTokens = 600
        temperature = 0.7
        break

      case SectionType.DEEP_DIVE:
        sectionSpecificPrompt = `Provide comprehensive analysis including historical context, technical analysis, and broader market implications. Include actionable insights for different types of investors.`
        maxTokens = 1000
        temperature = 0.5
        break
    }

    const audienceGuidance = template ? this.getAudienceGuidance(template.targetAudience, template.complexity) : ''

    const systemPrompt = `You are a financial intelligence platform generating intelligent market narratives. ${audienceGuidance}`

    const userPrompt = `${baseContext}${causalContext}${predictionContext}

${sectionSpecificPrompt}

Style guidelines:
- Write in clear, professional financial journalism style
- Use specific numbers and data points when available
- Maintain objectivity and cite evidence
- Present uncertainty transparently
- Avoid jargon or explain technical terms clearly`

    return {
      systemPrompt,
      userPrompt,
      temperature,
      maxTokens
    }
  }

  private async generateHeadline(context: NarrativeGenerationContext): Promise<string> {
    const prompt = {
      systemPrompt: 'You are a financial news headline writer. Create compelling, accurate headlines.',
      userPrompt: `Create a compelling, concise headline (max 80 characters) for this market event:

Event: ${context.event.eventType} for ${context.event.ticker}
Magnitude: ${context.event.magnitude}
Key insight: ${context.causalAnalysis?.rootCause.description || 'Market movement detected'}

The headline should capture the essence of the event and be attention-grabbing but accurate.`,
      temperature: 0.7,
      maxTokens: 50
    }

    return await generateAIText(prompt)
  }

  private async extractBulletPoints(content: string): Promise<string[]> {
    try {
      const prompt = {
        systemPrompt: 'Extract key bullet points from financial content.',
        userPrompt: `Extract 3-5 key bullet points from this financial content. Each point should be concise and actionable:

${content}

Format as JSON array of strings.`,
        temperature: 0.3,
        maxTokens: 200
      }

      const response = await generateAIText(prompt)
      const bulletPoints = JSON.parse(response)

      return Array.isArray(bulletPoints) ? bulletPoints.slice(0, 5) : []

    } catch (error) {
      console.warn('Failed to extract bullet points:', error)
      return []
    }
  }

  private async calculateNarrativeMetadata(
    sections: ContentSection[],
    context: NarrativeGenerationContext
  ): Promise<NarrativeMetadata> {
    const totalWords = sections.reduce((sum, section) => sum + section.content.split(' ').length, 0)
    const readingTime = Math.ceil(totalWords / 200) // Assume 200 words per minute

    // Calculate sentiment score
    const sentiment = await this.calculateSentimentScore(sections.map(s => s.content).join(' '))

    return {
      readingTime,
      complexityLevel: context.template?.complexity || ComplexityLevel.INTERMEDIATE,
      targetAudience: context.template?.targetAudience || AudienceType.RETAIL,
      topicalTags: await this.extractTopicalTags(context.event, sections),
      sentiment,
      version: 1
    }
  }

  private async calculateSentimentScore(text: string): Promise<SentimentScore> {
    // Simplified sentiment calculation
    // In production, this would use a proper sentiment analysis service
    const positiveWords = ['growth', 'increase', 'positive', 'strong', 'bullish', 'opportunity']
    const negativeWords = ['decline', 'decrease', 'negative', 'weak', 'bearish', 'risk', 'concern']

    const words = text.toLowerCase().split(/\s+/)
    const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length
    const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length
    const totalWords = words.length

    const positive = positiveCount / totalWords
    const negative = negativeCount / totalWords
    const neutral = Math.max(0, 1 - positive - negative)

    const overall = positive - negative // Range from -1 to 1

    return {
      positive,
      negative,
      neutral,
      overall,
      confidence: Math.min(1, (positiveCount + negativeCount) / totalWords * 10)
    }
  }

  private async extractTopicalTags(event: MarketEvent, sections: ContentSection[]): Promise<string[]> {
    const tags: Set<string> = new Set()

    // Add event-based tags
    tags.add(event.eventType.toLowerCase().replace('_', '-'))
    tags.add(event.ticker.toLowerCase())

    // Add sector and market cap if available
    if (event.metadata.sector) {
      tags.add(event.metadata.sector.toLowerCase())
    }

    if (event.metadata.marketCap) {
      tags.add(`${event.metadata.marketCap.toLowerCase()}-cap`)
    }

    // Extract additional tags from content using simple keyword matching
    const allContent = sections.map(s => s.content).join(' ').toLowerCase()
    const commonFinancialTerms = ['earnings', 'revenue', 'profit', 'loss', 'merger', 'acquisition', 'ipo', 'dividend', 'buyback']

    for (const term of commonFinancialTerms) {
      if (allContent.includes(term)) {
        tags.add(term)
      }
    }

    return Array.from(tags).slice(0, 10) // Limit to 10 tags
  }

  private async generateVisualizationSpecs(context: NarrativeGenerationContext): Promise<any[]> {
    // This would generate visualization specifications
    // For now, return empty array - visualization generation is a separate task
    return []
  }

  private getDefaultTemplate(): ContentTemplate {
    return this.templates.get('default')!
  }

  private getAudienceGuidance(audience: AudienceType, complexity: ComplexityLevel): string {
    const audienceMap = {
      [AudienceType.RETAIL]: 'Write for individual retail investors with clear, accessible language.',
      [AudienceType.PRO_AM]: 'Write for experienced amateur investors with moderate technical detail.',
      [AudienceType.PROFESSIONAL]: 'Write for financial professionals with technical analysis.',
      [AudienceType.INSTITUTIONAL]: 'Write for institutional investors with sophisticated analysis.'
    }

    const complexityMap = {
      [ComplexityLevel.BASIC]: 'Keep explanations simple and define technical terms.',
      [ComplexityLevel.INTERMEDIATE]: 'Use moderate technical detail with context.',
      [ComplexityLevel.ADVANCED]: 'Include sophisticated analysis and technical concepts.',
      [ComplexityLevel.EXPERT]: 'Use advanced financial concepts and detailed analysis.'
    }

    return `${audienceMap[audience]} ${complexityMap[complexity]}`
  }

  private async createPersonalizedTemplate(userProfile: UserProfile): Promise<ContentTemplate> {
    const baseTemplate = this.getDefaultTemplate()

    return {
      ...baseTemplate,
      targetAudience: this.inferAudienceType(userProfile),
      complexity: userProfile.preferences.contentComplexity,
      structure: {
        ...baseTemplate.structure,
        sections: this.selectSectionsForUser(userProfile),
        maxLength: this.calculateMaxLengthForUser(userProfile)
      }
    }
  }

  private inferAudienceType(userProfile: UserProfile): AudienceType {
    const experience = userProfile.demographics.investmentExperience

    if (experience >= 10) return AudienceType.PROFESSIONAL
    if (experience >= 5) return AudienceType.PRO_AM
    return AudienceType.RETAIL
  }

  private selectSectionsForUser(userProfile: UserProfile): SectionType[] {
    const baseSections = [SectionType.HEADLINE, SectionType.SUMMARY, SectionType.EXPLANATION, SectionType.PREDICTION]

    // Add deep dive for experienced users
    if (userProfile.demographics.investmentExperience >= 5) {
      baseSections.push(SectionType.DEEP_DIVE)
    }

    return baseSections
  }

  private calculateMaxLengthForUser(userProfile: UserProfile): number {
    const baseLength = this.config!.maxLength

    // Adjust based on user preferences
    if (userProfile.preferences.contentComplexity === ComplexityLevel.EXPERT) {
      return baseLength * 1.5
    }
    if (userProfile.preferences.contentComplexity === ComplexityLevel.BASIC) {
      return baseLength * 0.7
    }

    return baseLength
  }

  private async adaptSection(
    section: ContentSection,
    userProfile: UserProfile,
    template: ContentTemplate
  ): Promise<ContentSection> {
    const adaptationPrompt = {
      systemPrompt: `You are adapting financial content for a specific user profile. ${this.getAudienceGuidance(template.targetAudience, template.complexity)}`,
      userPrompt: `Adapt this content for the user profile:

Original content: ${section.content}

User profile:
- Investment experience: ${userProfile.demographics.investmentExperience} years
- Complexity preference: ${userProfile.preferences.contentComplexity}
- Risk tolerance: ${userProfile.preferences.riskTolerance}

Keep the core message but adjust the language, detail level, and examples to match the user's profile.`,
      temperature: 0.5,
      maxTokens: Math.min(section.content.length * 1.2, 800)
    }

    const adaptedContent = await generateAIText(adaptationPrompt)

    return {
      ...section,
      content: adaptedContent,
      bulletPoints: await this.extractBulletPoints(adaptedContent)
    }
  }

  private async performContentValidation(narrative: IntelligentNarrative): Promise<ContentValidation> {
    // Accuracy assessment
    const accuracyAssessment: AccuracyAssessment = {
      factualAccuracy: 0.85, // Placeholder - would use fact-checking service
      sourceReliability: 0.9,
      dataIntegrity: 0.88,
      overallScore: 0.87
    }

    // Bias assessment
    const biasAssessment: BiasAssessment = {
      detectedBiases: [], // Placeholder - would use bias detection
      severityScore: 0.1,
      mitigationSuggestions: ['Maintain neutral tone', 'Present multiple perspectives']
    }

    // Calculate readability score
    const readabilityScore = this.calculateReadabilityScore(narrative)

    // Generate improvement suggestions
    const improvements: ImprovementSuggestion[] = []

    if (accuracyAssessment.overallScore < 0.8) {
      improvements.push({
        category: 'accuracy',
        description: 'Verify data sources and cross-check facts',
        priority: 8,
        estimatedImpact: 7
      })
    }

    if (readabilityScore < 60) {
      improvements.push({
        category: 'readability',
        description: 'Simplify sentence structure and reduce jargon',
        priority: 6,
        estimatedImpact: 5
      })
    }

    // Calculate overall quality score
    const qualityScore = (
      accuracyAssessment.overallScore * 0.4 +
      readabilityScore / 100 * 0.3 +
      (1 - biasAssessment.severityScore) * 0.2 +
      (narrative.metadata.sentiment.confidence) * 0.1
    ) * 100

    return {
      qualityScore,
      accuracyCheck: accuracyAssessment,
      readabilityScore,
      biasAssessment,
      improvements
    }
  }

  private calculateReadabilityScore(narrative: IntelligentNarrative): number {
    // Simplified Flesch Reading Ease calculation
    const allText = [
      narrative.summary.content,
      narrative.explanation.content,
      narrative.prediction.content,
      narrative.deepDive.content
    ].join(' ')

    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const words = allText.split(/\s+/).filter(w => w.length > 0).length
    const syllables = this.countSyllables(allText)

    if (sentences === 0 || words === 0) return 0

    const avgSentenceLength = words / sentences
    const avgSyllablesPerWord = syllables / words

    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)

    return Math.max(0, Math.min(100, fleschScore))
  }

  private countSyllables(text: string): number {
    // Simplified syllable counting
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]+/g, 'a')
      .length
  }

  private async storeNarrative(narrative: IntelligentNarrative): Promise<void> {
    try {
      await db.insert(intelligentNarratives).values({
        id: narrative.id,
        eventId: narrative.eventId,
        headline: narrative.headline,
        sections: {
          summary: narrative.summary,
          explanation: narrative.explanation,
          prediction: narrative.prediction,
          deepDive: narrative.deepDive
        },
        metadata: narrative.metadata,
        visualizations: narrative.visualizations,
        status: narrative.status,
        createdAt: narrative.createdAt,
        updatedAt: narrative.updatedAt
      })
    } catch (error) {
      console.error('Failed to store narrative:', error)
      // Don't throw - narrative can still be returned
    }
  }

  private async storeValidationResults(narrativeId: string, validation: ContentValidation): Promise<void> {
    try {
      await db.insert(narrativeValidations).values({
        id: crypto.randomUUID(),
        narrativeId,
        qualityScore: validation.qualityScore,
        accuracyScore: validation.accuracyCheck.overallScore,
        readabilityScore: validation.readabilityScore,
        biasScore: validation.biasAssessment.severityScore,
        validatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Failed to store validation results:', error)
    }
  }

  private ensureConfigured(): void {
    if (!this.isConfigured || !this.config) {
      throw this.createError(
        ErrorCode.MISSING_CONFIGURATION,
        'Narrative generation service not configured',
        ErrorSeverity.CRITICAL
      )
    }
  }

  private validateConfig(config: NarrativeConfig): void {
    if (config.maxLength <= 0) {
      throw new Error('Max length must be positive')
    }

    if (!config.targetAudience) {
      throw new Error('Target audience is required')
    }

    if (!config.complexityLevel) {
      throw new Error('Complexity level is required')
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
        service: 'narrative-generator',
        operation: 'generate',
        additionalData
      },
      retryable: code === ErrorCode.DATABASE_QUERY_ERROR || code === ErrorCode.AI_SERVICE_ERROR
    }
  }
}