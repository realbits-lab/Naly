// Narrative Generation Module Exports

export { NarrativeGenerator } from './narrative-generator'

// Re-export types from content types
export type {
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
  ContentTemplate,
  ContentStructure,
  StyleGuide,
  ContentLength
} from '@/types/content'

export type {
  NarrativeService,
  NarrativeConfig
} from '@/types/services'

// Utility functions for narrative generation
export const createDefaultNarrativeConfig = () => ({
  targetAudience: 'RETAIL' as const,
  complexityLevel: 'INTERMEDIATE' as const,
  maxLength: 2000,
  includeVisualizations: true,
  autoValidate: true,
  qualityThreshold: 70
})

export const calculateReadingTime = (wordCount: number, wordsPerMinute: number = 200): number => {
  return Math.ceil(wordCount / wordsPerMinute)
}

export const extractKeyInsights = (narrative: any): string[] => {
  const insights: string[] = []

  // Extract bullet points from all sections
  const sections = [
    narrative.summary,
    narrative.explanation,
    narrative.prediction,
    narrative.deepDive
  ].filter(Boolean)

  sections.forEach(section => {
    if (section.bulletPoints && Array.isArray(section.bulletPoints)) {
      insights.push(...section.bulletPoints)
    }
  })

  return insights.slice(0, 10) // Limit to top 10 insights
}

export const assessNarrativeComplexity = (content: string): 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' => {
  const technicalTerms = [
    'volatility', 'beta', 'correlation', 'sharpe ratio', 'var', 'derivatives',
    'arbitrage', 'hedge', 'leverage', 'liquidity', 'alpha', 'basis points'
  ]

  const words = content.toLowerCase().split(/\s+/)
  const technicalTermCount = words.filter(word =>
    technicalTerms.some(term => word.includes(term))
  ).length

  const technicalDensity = technicalTermCount / words.length * 100

  if (technicalDensity > 5) return 'EXPERT'
  if (technicalDensity > 3) return 'ADVANCED'
  if (technicalDensity > 1) return 'INTERMEDIATE'
  return 'BASIC'
}

export const formatNarrativeMetadata = (narrative: any) => ({
  ...narrative.metadata,
  formattedReadingTime: `${narrative.metadata.readingTime} min read`,
  formattedComplexity: narrative.metadata.complexityLevel.toLowerCase().replace('_', ' '),
  formattedAudience: narrative.metadata.targetAudience.toLowerCase().replace('_', ' '),
  sentimentLabel: narrative.metadata.sentiment.overall > 0.1 ? 'Positive' :
                  narrative.metadata.sentiment.overall < -0.1 ? 'Negative' : 'Neutral',
  topicalTagsString: narrative.metadata.topicalTags.join(', ')
})

export const createContentSummary = (narrative: any) => {
  const wordCount = calculateWordCount(narrative)
  const keyInsights = extractKeyInsights(narrative)

  return {
    headline: narrative.headline,
    wordCount,
    readingTime: narrative.metadata.readingTime,
    keyInsights: keyInsights.slice(0, 3), // Top 3 insights for summary
    sentiment: narrative.metadata.sentiment.overall > 0.1 ? 'Positive' :
               narrative.metadata.sentiment.overall < -0.1 ? 'Negative' : 'Neutral',
    confidence: calculateAverageConfidence(narrative),
    complexity: narrative.metadata.complexityLevel,
    audience: narrative.metadata.targetAudience
  }
}

export const calculateWordCount = (narrative: any): number => {
  const sections = [
    narrative.summary?.content,
    narrative.explanation?.content,
    narrative.prediction?.content,
    narrative.deepDive?.content
  ].filter(Boolean)

  return sections.reduce((total, content) => {
    return total + content.split(/\s+/).filter((word: string) => word.length > 0).length
  }, 0)
}

export const calculateAverageConfidence = (narrative: any): number => {
  const sections = [
    narrative.summary,
    narrative.explanation,
    narrative.prediction,
    narrative.deepDive
  ].filter(Boolean)

  if (sections.length === 0) return 0

  const totalConfidence = sections.reduce((sum, section) =>
    sum + (section.confidence || 0.5), 0
  )

  return totalConfidence / sections.length
}

export const validateNarrativeStructure = (narrative: any): { valid: boolean, issues: string[] } => {
  const issues: string[] = []

  if (!narrative.id) issues.push('Missing narrative ID')
  if (!narrative.eventId) issues.push('Missing event ID')
  if (!narrative.headline) issues.push('Missing headline')

  // Check required sections
  const requiredSections = ['summary', 'explanation', 'prediction']
  requiredSections.forEach(sectionName => {
    const section = narrative[sectionName]
    if (!section) {
      issues.push(`Missing ${sectionName} section`)
    } else {
      if (!section.content) issues.push(`${sectionName} section missing content`)
      if (!section.type) issues.push(`${sectionName} section missing type`)
    }
  })

  // Check metadata
  if (!narrative.metadata) {
    issues.push('Missing narrative metadata')
  } else {
    if (!narrative.metadata.complexityLevel) issues.push('Missing complexity level')
    if (!narrative.metadata.targetAudience) issues.push('Missing target audience')
    if (typeof narrative.metadata.readingTime !== 'number') issues.push('Invalid reading time')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

export const categorizeNarrative = (narrative: any): {
  category: string
  subcategory: string
  tags: string[]
} => {
  const content = [
    narrative.summary?.content,
    narrative.explanation?.content,
    narrative.prediction?.content
  ].filter(Boolean).join(' ').toLowerCase()

  // Determine main category
  let category = 'market-movement'
  if (content.includes('earnings') || content.includes('revenue')) {
    category = 'earnings'
  } else if (content.includes('merger') || content.includes('acquisition')) {
    category = 'ma-activity'
  } else if (content.includes('regulatory') || content.includes('policy')) {
    category = 'regulatory'
  }

  // Determine subcategory
  let subcategory = 'general'
  if (content.includes('surprise') || content.includes('unexpected')) {
    subcategory = 'surprise'
  } else if (content.includes('guidance') || content.includes('outlook')) {
    subcategory = 'guidance'
  } else if (content.includes('technical') || content.includes('chart')) {
    subcategory = 'technical-analysis'
  }

  // Extract relevant tags
  const tags = narrative.metadata?.topicalTags || []

  return { category, subcategory, tags }
}

// Quality assessment helpers
export const assessContentQuality = (narrative: any): {
  score: number
  strengths: string[]
  weaknesses: string[]
} => {
  const strengths: string[] = []
  const weaknesses: string[] = []
  let score = 0

  // Check content completeness (20 points)
  const sections = [narrative.summary, narrative.explanation, narrative.prediction]
  const completeSections = sections.filter(s => s && s.content && s.content.length > 100)
  score += (completeSections.length / sections.length) * 20

  if (completeSections.length === sections.length) {
    strengths.push('All required sections are complete')
  } else {
    weaknesses.push('Some sections are incomplete or too short')
  }

  // Check headline quality (10 points)
  if (narrative.headline && narrative.headline.length > 20 && narrative.headline.length < 100) {
    score += 10
    strengths.push('Headline is well-sized and informative')
  } else {
    weaknesses.push('Headline needs improvement')
  }

  // Check confidence levels (20 points)
  const avgConfidence = calculateAverageConfidence(narrative)
  score += avgConfidence * 20

  if (avgConfidence > 0.7) {
    strengths.push('High confidence in analysis')
  } else {
    weaknesses.push('Low confidence in some sections')
  }

  // Check metadata quality (15 points)
  if (narrative.metadata && narrative.metadata.sentiment && narrative.metadata.topicalTags) {
    score += 15
    strengths.push('Rich metadata and context')
  } else {
    weaknesses.push('Missing or incomplete metadata')
  }

  // Check reading time appropriateness (10 points)
  const wordCount = calculateWordCount(narrative)
  if (wordCount >= 300 && wordCount <= 2000) {
    score += 10
    strengths.push('Appropriate content length')
  } else {
    weaknesses.push(wordCount < 300 ? 'Content too short' : 'Content too long')
  }

  // Check bullet points (10 points)
  const sectionsWithBullets = sections.filter(s => s && s.bulletPoints && s.bulletPoints.length > 0)
  score += (sectionsWithBullets.length / sections.length) * 10

  if (sectionsWithBullets.length > 0) {
    strengths.push('Good use of bullet points for key insights')
  } else {
    weaknesses.push('Missing bullet points for key insights')
  }

  // Check topical relevance (15 points)
  if (narrative.metadata?.topicalTags && narrative.metadata.topicalTags.length >= 3) {
    score += 15
    strengths.push('Well-tagged with relevant topics')
  } else {
    weaknesses.push('Insufficient topical tagging')
  }

  return {
    score: Math.round(score),
    strengths,
    weaknesses
  }
}

// Constants
export const NARRATIVE_CONSTANTS = {
  MIN_WORD_COUNT: 300,
  MAX_WORD_COUNT: 3000,
  DEFAULT_WORD_COUNT: 1500,
  WORDS_PER_MINUTE_READING: 200,
  MIN_QUALITY_SCORE: 60,
  TARGET_QUALITY_SCORE: 80,
  MAX_BULLET_POINTS_PER_SECTION: 5,
  MAX_TOPICAL_TAGS: 10,
  SECTION_TYPES: {
    REQUIRED: ['HEADLINE', 'SUMMARY', 'EXPLANATION', 'PREDICTION'],
    OPTIONAL: ['DEEP_DIVE']
  },
  COMPLEXITY_LEVELS: {
    BASIC: { minWords: 300, maxWords: 800, technicalTermsMax: 5 },
    INTERMEDIATE: { minWords: 500, maxWords: 1500, technicalTermsMax: 15 },
    ADVANCED: { minWords: 800, maxWords: 2500, technicalTermsMax: 30 },
    EXPERT: { minWords: 1000, maxWords: 3000, technicalTermsMax: 50 }
  }
} as const

// Error messages for narrative generation
export const NARRATIVE_ERROR_MESSAGES = {
  MISSING_EVENT: 'Market event is required for narrative generation',
  INVALID_EVENT_STRUCTURE: 'Event must contain id, eventType, ticker, and timestamp',
  GENERATION_FAILED: 'Failed to generate narrative content',
  ADAPTATION_FAILED: 'Failed to adapt narrative for user profile',
  VALIDATION_FAILED: 'Failed to validate narrative quality',
  INSUFFICIENT_DATA: 'Insufficient data for comprehensive narrative generation',
  AI_SERVICE_ERROR: 'AI service error during narrative generation'
} as const