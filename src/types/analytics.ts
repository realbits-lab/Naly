// Analytics Types based on development specification

import { MarketEvent, MarketDataPoint, MarketCondition, SectorData, MacroData, TimeWindow } from './market'

export enum FactorType {
  EARNINGS_SURPRISE = 'EARNINGS_SURPRISE',
  NEWS_SENTIMENT = 'NEWS_SENTIMENT',
  INSIDER_ACTIVITY = 'INSIDER_ACTIVITY',
  INSTITUTIONAL_FLOW = 'INSTITUTIONAL_FLOW',
  MARKET_SENTIMENT = 'MARKET_SENTIMENT',
  REGULATORY_CHANGE = 'REGULATORY_CHANGE',
  SECTOR_ROTATION = 'SECTOR_ROTATION',
}

export enum ImpactLevel {
  MINIMAL = 'MINIMAL',
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  DECISIVE = 'DECISIVE',
}

export enum EvidenceType {
  QUANTITATIVE = 'QUANTITATIVE',
  QUALITATIVE = 'QUALITATIVE',
  STATISTICAL = 'STATISTICAL',
  HISTORICAL = 'HISTORICAL',
}

export enum TemporalRelation {
  IMMEDIATE = 'IMMEDIATE',
  LAGGED = 'LAGGED',
  ANTICIPATORY = 'ANTICIPATORY',
  CONCURRENT = 'CONCURRENT',
}

export enum AnalysisMethod {
  GRANGER_CAUSALITY = 'GRANGER_CAUSALITY',
  FIVE_WHYS = 'FIVE_WHYS',
  STATISTICAL_INFERENCE = 'STATISTICAL_INFERENCE',
  MACHINE_LEARNING = 'MACHINE_LEARNING',
}

export enum ScenarioType {
  BULL_CASE = 'BULL_CASE',
  BASE_CASE = 'BASE_CASE',
  BEAR_CASE = 'BEAR_CASE',
}

export enum TimeHorizon {
  ONE_WEEK = 'ONE_WEEK',
  ONE_MONTH = 'ONE_MONTH',
  THREE_MONTHS = 'THREE_MONTHS',
  SIX_MONTHS = 'SIX_MONTHS',
  ONE_YEAR = 'ONE_YEAR',
}

export enum PredictionMethod {
  ENSEMBLE_MODELS = 'ENSEMBLE_MODELS',
  TIME_SERIES_ANALYSIS = 'TIME_SERIES_ANALYSIS',
  MACHINE_LEARNING = 'MACHINE_LEARNING',
  STATISTICAL_MODELS = 'STATISTICAL_MODELS',
}

export enum ModelType {
  LSTM = 'LSTM',
  TRANSFORMER = 'TRANSFORMER',
  RANDOM_FOREST = 'RANDOM_FOREST',
  LINEAR_REGRESSION = 'LINEAR_REGRESSION',
  ARIMA = 'ARIMA',
  GARCH = 'GARCH',
}

export enum InferenceMethod {
  GRANGER_CAUSALITY = 'GRANGER_CAUSALITY',
  PEARL_CAUSALITY = 'PEARL_CAUSALITY',
  INSTRUMENTAL_VARIABLES = 'INSTRUMENTAL_VARIABLES',
}

export enum CausalDirection {
  FORWARD = 'FORWARD',
  REVERSE = 'REVERSE',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

export interface EvidenceItem {
  dataPoint: MarketDataPoint
  relevanceScore: number
  evidenceType: EvidenceType
  timestamp: Date
  description: string
}

export interface CausalFactor {
  type: FactorType
  description: string
  impact: ImpactLevel
  confidence: number
  supportingEvidence: EvidenceItem[]
  temporalRelationship: TemporalRelation
}

export interface AlternativeExplanation {
  description: string
  confidence: number
  supportingEvidence: EvidenceItem[]
  likelihood: number
}

export interface CausalAnalysis {
  eventId: string
  rootCause: CausalFactor
  contributingFactors: CausalFactor[]
  confidenceScore: number
  methodology: AnalysisMethod
  evidenceChain: EvidenceItem[]
  alternativeExplanations: AlternativeExplanation[]
}

export interface AnalysisContext {
  historicalEvents: MarketEvent[]
  marketConditions: MarketCondition[]
  sectorData: SectorData
  macroeconomicData: MacroData
  timeWindow: TimeWindow
}

export interface CausalRelationship {
  cause: string
  effect: MarketEvent
  strength: number
  direction: CausalDirection
  lagTime: number
}

export interface ConfidenceInterval {
  lower: number
  upper: number
  confidence: number
}

export interface CausalInferenceResult {
  causalRelationships: CausalRelationship[]
  statisticalSignificance: number
  confidenceInterval: ConfidenceInterval
  methodology: InferenceMethod
}

export interface EvidenceSynthesis {
  rankedFactors: CausalFactor[]
  overallConfidence: number
  consensusView: string
  uncertainties: string[]
}

export interface PriceRange {
  low: number
  high: number
  median: number
}

export interface PriceTarget {
  value: number
  range: PriceRange
  confidence: number
  timeframe: TimeHorizon
}

export interface ScenarioCondition {
  description: string
  probability: number
  dependsOn: string[]
}

export interface PredictionScenario {
  type: ScenarioType
  probability: number
  description: string
  keyDrivers: string[]
  supportingEvidence: EvidenceItem[]
  priceTarget: PriceTarget
  conditions: ScenarioCondition[]
}

export interface ModelMetadata {
  name: string
  version: string
  trainedOn: Date
  accuracy: number
  features: string[]
}

export interface UncertaintyMetrics {
  variance: number
  standardDeviation: number
  confidenceInterval: ConfidenceInterval
  entropy: number
}

export interface PredictiveAnalysis {
  eventId: string
  scenarios: PredictionScenario[]
  timeHorizon: TimeHorizon
  methodology: PredictionMethod
  modelMetadata: ModelMetadata
  uncertainty: UncertaintyMetrics
  lastUpdated: Date
}

export interface PatternData {
  pattern: string
  frequency: number
  historicalOutcomes: any[]
  confidence: number
}

export interface MarketState {
  volatility: number
  volume: number
  sentiment: number
  trend: string
  regime: string
}

export interface EconomicIndicator {
  name: string
  value: number
  change: number
  trend: string
  importance: number
}

export interface SectorTrend {
  sector: string
  performance: number
  momentum: number
  outlook: string
}

export interface PredictionContext {
  historicalPatterns: PatternData[]
  currentMarketState: MarketState
  economicIndicators: EconomicIndicator[]
  sectorTrends: SectorTrend[]
  timeHorizon: TimeHorizon
}

export interface FeatureImportance {
  feature: string
  importance: number
  direction: number
}

export interface ModelPrediction {
  modelType: ModelType
  prediction: any
  confidence: number
  features: FeatureImportance[]
  metadata: ModelMetadata
}

export interface EnsembleConfiguration {
  models: ModelType[]
  weights: number[]
  aggregationMethod: string
}

export interface ModelContribution {
  modelType: ModelType
  weight: number
  contribution: number
}

export interface PredictionPerformance {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
}

export interface EnsemblePrediction {
  scenarios: PredictionScenario[]
  uncertainty: UncertaintyMetrics
  modelContributions: ModelContribution[]
  performance: PredictionPerformance
}

export interface PredictionHistory {
  predictionId: string
  timestamp: Date
  prediction: any
  confidence: number
  actualOutcome?: any
}

export interface OutcomeData {
  eventId: string
  actualValue: any
  timestamp: Date
  metadata: any
}

export interface CalibrationResults {
  updatedWeights: Record<ModelType, number>
  performanceMetrics: Record<ModelType, PredictionPerformance>
  recommendations: string[]
}