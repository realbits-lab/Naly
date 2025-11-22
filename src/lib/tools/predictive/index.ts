/**
 * Predictive Agent Tools
 * Comprehensive toolkit for autonomous predictive analysis
 * Based on Vercel AI SDK v6 patterns
 */

// Financial Data Tools
export { fmpFinancialTool, technicalIndicatorsTool } from './fmp-financial';

// Deep Research Tools
export { deepResearchTool, webSearchTool } from './firecrawl-research';

// Prediction Market Tools
export { polymarketTool, polymarketMarketDetailTool } from './polymarket';

// Sports Betting Odds Tools
export { sportsOddsTool, lineMovementTool } from './odds-api';

/**
 * Domain-specific tool bundles for different prediction types
 */

export const stockPredictionTools = {
  fmpFinancialTool: () => import('./fmp-financial').then(m => m.fmpFinancialTool),
  technicalIndicatorsTool: () => import('./fmp-financial').then(m => m.technicalIndicatorsTool),
  deepResearchTool: () => import('./firecrawl-research').then(m => m.deepResearchTool),
  webSearchTool: () => import('./firecrawl-research').then(m => m.webSearchTool),
};

export const cryptoPredictionTools = {
  technicalIndicatorsTool: () => import('./fmp-financial').then(m => m.technicalIndicatorsTool),
  deepResearchTool: () => import('./firecrawl-research').then(m => m.deepResearchTool),
  webSearchTool: () => import('./firecrawl-research').then(m => m.webSearchTool),
};

export const politicsPredictionTools = {
  polymarketTool: () => import('./polymarket').then(m => m.polymarketTool),
  polymarketMarketDetailTool: () => import('./polymarket').then(m => m.polymarketMarketDetailTool),
  deepResearchTool: () => import('./firecrawl-research').then(m => m.deepResearchTool),
  webSearchTool: () => import('./firecrawl-research').then(m => m.webSearchTool),
};

export const sportsPredictionTools = {
  sportsOddsTool: () => import('./odds-api').then(m => m.sportsOddsTool),
  lineMovementTool: () => import('./odds-api').then(m => m.lineMovementTool),
  deepResearchTool: () => import('./firecrawl-research').then(m => m.deepResearchTool),
  webSearchTool: () => import('./firecrawl-research').then(m => m.webSearchTool),
};
