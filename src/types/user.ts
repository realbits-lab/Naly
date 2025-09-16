// User and Personalization Types based on development specification

import { ComplexityLevel, AudienceType } from './content'
import { TimeHorizon } from './analytics'

export enum UserRole {
  RETAIL_INDIVIDUAL = 'RETAIL_INDIVIDUAL',
  RETAIL_PROFESSIONAL = 'RETAIL_PROFESSIONAL',
  INSTITUTIONAL_ANALYST = 'INSTITUTIONAL_ANALYST',
  INSTITUTIONAL_MANAGER = 'INSTITUTIONAL_MANAGER',
  ADMIN = 'ADMIN',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum RiskTolerance {
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE',
  SPECULATIVE = 'SPECULATIVE',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export enum NotificationType {
  PRICE_ALERT = 'PRICE_ALERT',
  NEWS_ALERT = 'NEWS_ALERT',
  ANALYSIS_READY = 'ANALYSIS_READY',
  PREDICTION_UPDATE = 'PREDICTION_UPDATE',
  PORTFOLIO_CHANGE = 'PORTFOLIO_CHANGE',
  LEARNING_REMINDER = 'LEARNING_REMINDER',
  COMMUNITY_UPDATE = 'COMMUNITY_UPDATE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RecommendationType {
  CONTENT_RECOMMENDATION = 'CONTENT_RECOMMENDATION',
  STOCK_ANALYSIS = 'STOCK_ANALYSIS',
  PORTFOLIO_INSIGHT = 'PORTFOLIO_INSIGHT',
  LEARNING_SUGGESTION = 'LEARNING_SUGGESTION',
  FEATURE_DISCOVERY = 'FEATURE_DISCOVERY',
}

export enum InvestmentRecommendationType {
  BUY_RECOMMENDATION = 'BUY_RECOMMENDATION',
  SELL_RECOMMENDATION = 'SELL_RECOMMENDATION',
  HOLD_RECOMMENDATION = 'HOLD_RECOMMENDATION',
  WATCHLIST_ADDITION = 'WATCHLIST_ADDITION',
  PORTFOLIO_REBALANCE = 'PORTFOLIO_REBALANCE',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export enum UserActionType {
  VIEW_PAGE = 'VIEW_PAGE',
  CLICK_LINK = 'CLICK_LINK',
  SEARCH = 'SEARCH',
  FILTER_DATA = 'FILTER_DATA',
  EXPORT_DATA = 'EXPORT_DATA',
  SHARE_CONTENT = 'SHARE_CONTENT',
  SAVE_TO_WATCHLIST = 'SAVE_TO_WATCHLIST',
  UPDATE_PORTFOLIO = 'UPDATE_PORTFOLIO',
  MAKE_PREDICTION = 'MAKE_PREDICTION',
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
  BOOKMARK = 'BOOKMARK',
}

export interface UserDemographics {
  age: number
  location: string
  occupation: string
  investmentExperience: number
  incomeLevel: string
}

export interface NotificationPreferences {
  channels: NotificationChannel[]
  frequency: string
  quietHours: {
    start: string
    end: string
  }
  types: NotificationType[]
}

export interface DashboardConfiguration {
  layout: string
  widgets: string[]
  theme: string
  density: string
}

export interface UserPreferences {
  contentComplexity: ComplexityLevel
  riskTolerance: RiskTolerance
  investmentHorizon: TimeHorizon
  interestedSectors: string[]
  notificationSettings: NotificationPreferences
  dashboardLayout: DashboardConfiguration
}

export interface PerformanceMetrics {
  totalReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
}

export interface RiskMetrics {
  beta: number
  var: number
  expectedShortfall: number
  correlation: number
  concentration: number
}

export interface Holding {
  ticker: string
  quantity: number
  averageCost: number
  currentValue: number
  allocation: number
  acquiredDate: Date
}

export interface Portfolio {
  holdings: Holding[]
  totalValue: number
  performance: PerformanceMetrics
  riskMetrics: RiskMetrics
  lastUpdated: Date
}

export interface Watchlist {
  id: string
  name: string
  tickers: string[]
  alerts: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ReadingPattern {
  contentType: string
  averageTime: number
  completionRate: number
  frequency: number
}

export interface EngagementMetrics {
  sessionsPerWeek: number
  averageSessionTime: number
  pagesPerSession: number
  contentShared: number
  commentsPosted: number
}

export interface AccuracyMetrics {
  predictions: number
  correctPredictions: number
  averageConfidence: number
  calibrationScore: number
}

export interface BiasIndicator {
  biasType: string
  severity: number
  frequency: number
  examples: string[]
}

export interface LearningMetrics {
  lessonsCompleted: number
  skillLevel: string
  progressRate: number
  streakDays: number
}

export interface UserBehavior {
  readingPatterns: ReadingPattern[]
  engagementMetrics: EngagementMetrics
  predictionAccuracy: AccuracyMetrics
  biasIndicators: BiasIndicator[]
  learningProgress: LearningMetrics
}

export interface UserProfile {
  userId: string
  demographics: UserDemographics
  preferences: UserPreferences
  portfolio: Portfolio
  watchlist: Watchlist
  behavior: UserBehavior
  subscriptionTier: SubscriptionTier
  createdAt: Date
  lastActiveAt: Date
}

export interface RecommendationMetadata {
  source: string
  algorithm: string
  confidence: number
  factors: string[]
}

export interface RecommendationContent {
  title: string
  description: string
  actionUrl: string
  metadata: RecommendationMetadata
  visualPreview: string
}

export interface Recommendation {
  userId: string
  type: RecommendationType
  content: RecommendationContent
  reasoning: string[]
  confidence: number
  priority: Priority
  expiresAt: Date
  createdAt: Date
}

export interface ReturnExpectation {
  expected: number
  range: {
    low: number
    high: number
  }
  probability: number
}

export interface AnalysisReference {
  id: string
  type: string
  title: string
  url: string
}

export interface InvestmentRecommendation {
  type: InvestmentRecommendationType
  ticker: string
  reasoning: string[]
  confidence: number
  riskLevel: RiskLevel
  timeHorizon: TimeHorizon
  expectedReturn: ReturnExpectation
  supportingAnalysis: AnalysisReference[]
}

export interface LearningTopic {
  id: string
  name: string
  category: string
  difficulty: ComplexityLevel
}

export interface LearningContent {
  id: string
  title: string
  description: string
  type: string
  url: string
  duration: number
}

export interface LearningRecommendation {
  topic: LearningTopic
  content: LearningContent
  difficulty: ComplexityLevel
  estimatedTime: number
  prerequisites: string[]
  learningObjectives: string[]
}

export interface UserInteraction {
  userId: string
  actionType: UserActionType
  resourceId: string
  resourceType: string
  timestamp: Date
  metadata: any
}

export interface SessionData {
  sessionId: string
  userId: string
  startTime: Date
  endTime: Date
  pageViews: number
  actions: UserInteraction[]
  deviceInfo: any
}

export interface BehaviorPattern {
  pattern: string
  frequency: number
  confidence: number
  impact: string
}

export interface UserSegment {
  id: string
  name: string
  description: string
  criteria: any
  size: number
}

export interface InferredPreferences {
  sectors: string[]
  riskLevel: RiskLevel
  contentTypes: string[]
  features: string[]
}

export interface RiskProfile {
  tolerance: RiskTolerance
  capacity: number
  timeHorizon: TimeHorizon
  objectives: string[]
}

export interface BehaviorAnalysis {
  patterns: BehaviorPattern[]
  segments: UserSegment[]
  preferences: InferredPreferences
  riskProfile: RiskProfile
  engagement: EngagementMetrics
}

export interface CognitiveBias {
  type: string
  description: string
  severity: number
  examples: string[]
}

export interface SeverityLevel {
  bias: string
  level: number
  impact: string
}

export interface BiasMinigation {
  bias: string
  strategy: string
  description: string
  effectiveness: number
}

export interface BiasAssessment {
  detectedBiases: CognitiveBias[]
  severity: SeverityLevel[]
  recommendations: BiasMinigation[]
  educationalContent: LearningContent[]
}

export interface UserPrediction {
  eventId: string
  prediction: any
  confidence: number
  timestamp: Date
  rationale: string[]
}

export interface DecisionHistory {
  decisions: any[]
  outcomes: any[]
  patterns: BehaviorPattern[]
}

export interface NotificationTrigger {
  type: string
  conditions: any
  active: boolean
}

export interface NotificationMetadata {
  category: string
  urgency: Priority
  source: string
  related: string[]
}

export interface NotificationContent {
  title: string
  message: string
  actionUrl: string
  visualPreview: string
  metadata: NotificationMetadata
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  priority: Priority
  content: NotificationContent
  trigger: NotificationTrigger
  deliveryChannels: NotificationChannel[]
  expiresAt: Date
  createdAt: Date
}