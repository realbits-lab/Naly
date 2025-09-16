import { pgTable, uuid, varchar, date, jsonb, decimal, timestamp, index } from 'drizzle-orm/pg-core'

// Model Performance table
export const modelPerformance = pgTable('model_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  modelVersion: varchar('model_version', { length: 50 }).notNull(),
  evaluationDate: date('evaluation_date').notNull(),
  metrics: jsonb('metrics').notNull(),
  testDataset: varchar('test_dataset', { length: 255 }),
  performanceSummary: jsonb('performance_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  modelNameIdx: index('idx_model_performance_name').on(table.modelName, table.evaluationDate),
}))

// Prediction Tracking table
export const predictionTracking = pgTable('prediction_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  predictionId: uuid('prediction_id').notNull(),
  actualOutcome: jsonb('actual_outcome'),
  predictionAccuracy: decimal('prediction_accuracy', { precision: 3, scale: 2 }),
  evaluationDate: date('evaluation_date').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  accuracyIdx: index('idx_prediction_tracking_accuracy').on(table.predictionAccuracy, table.evaluationDate),
}))

// Feature Importance table
export const featureImportance = pgTable('feature_importance', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  modelVersion: varchar('model_version', { length: 50 }).notNull(),
  featureName: varchar('feature_name', { length: 100 }).notNull(),
  importance: decimal('importance', { precision: 5, scale: 4 }).notNull(),
  rank: decimal('rank').notNull(),
  evaluationDate: date('evaluation_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  modelFeatureIdx: index('idx_feature_importance_model').on(table.modelName, table.modelVersion, table.evaluationDate),
  importanceIdx: index('idx_feature_importance_rank').on(table.importance),
}))

// A/B Test Results table
export const abTestResults = pgTable('ab_test_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  testName: varchar('test_name', { length: 100 }).notNull(),
  variant: varchar('variant', { length: 50 }).notNull(),
  userId: uuid('user_id'),
  metric: varchar('metric', { length: 50 }).notNull(),
  value: decimal('value', { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
  sessionId: uuid('session_id'),
  metadata: jsonb('metadata'),
}, (table) => ({
  testVariantIdx: index('idx_ab_test_name_variant').on(table.testName, table.variant),
  timestampIdx: index('idx_ab_test_timestamp').on(table.timestamp),
}))

// Data Quality Metrics table
export const dataQualityMetrics = pgTable('data_quality_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataSource: varchar('data_source', { length: 100 }).notNull(),
  dataType: varchar('data_type', { length: 50 }).notNull(),
  ticker: varchar('ticker', { length: 10 }),
  qualityScore: decimal('quality_score', { precision: 3, scale: 2 }).notNull(),
  completeness: decimal('completeness', { precision: 3, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 3, scale: 2 }),
  timeliness: decimal('timeliness', { precision: 3, scale: 2 }),
  consistency: decimal('consistency', { precision: 3, scale: 2 }),
  issues: jsonb('issues'),
  evaluationDate: date('evaluation_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sourceTypeIdx: index('idx_data_quality_source_type').on(table.dataSource, table.dataType),
  tickerDateIdx: index('idx_data_quality_ticker_date').on(table.ticker, table.evaluationDate),
  qualityScoreIdx: index('idx_data_quality_score').on(table.qualityScore),
}))