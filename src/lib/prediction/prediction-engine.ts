import { desc, eq } from "drizzle-orm";
import { generatePredictionScenarios } from "@/lib/ai";
import { db } from "@/lib/db";
import { modelPerformances, predictiveAnalyses } from "@/lib/schema/events";
import { getFinancialDataAPI } from "@/lib/service-registry";
import {
	type EnsemblePrediction,
	type ModelContribution,
	type ModelMetadata,
	ModelType,
	PredictionMethod,
	type PredictionPerformance,
	type PredictionScenario,
	type PredictiveAnalysis,
	PriceTarget,
	ScenarioType,
	TimeHorizon,
	type UncertaintyMetrics,
} from "@/types/analytics";
import {
	type ApplicationError,
	ErrorCode,
	ErrorSeverity,
} from "@/types/errors";
import type { MarketDataPoint, MarketEvent } from "@/types/market";
import type { PredictionConfig, PredictionService } from "@/types/services";

interface PredictionModel {
	type: ModelType;
	weight: number;
	confidence: number;
	predict: (data: number[], context: any) => PredictionResult;
}

interface PredictionResult {
	value: number;
	confidence: number;
	range: { low: number; high: number };
	features: Array<{ name: string; importance: number }>;
}

interface MarketContext {
	currentPrice: number;
	volatility: number;
	volume: number;
	sentiment: number;
	trend: string;
	technicalIndicators: any;
	economicIndicators: any;
}

export class PredictionEngine implements PredictionService {
	private config: PredictionConfig | null = null;
	private models: Map<ModelType, PredictionModel> = new Map();
	private isConfigured = false;

	async configure(config: PredictionConfig): Promise<void> {
		this.validateConfig(config);
		this.config = config;
		await this.initializeModels();
		this.isConfigured = true;
	}

	async generatePrediction(
		event: MarketEvent,
		context: any,
	): Promise<PredictiveAnalysis> {
		this.ensureConfigured();

		try {
			// Gather market data for prediction
			const marketData = await this.gatherPredictionData(event);

			// Create market context
			const marketContext = await this.createMarketContext(event, marketData);

			// Generate individual model predictions
			const modelPredictions = await this.generateModelPredictions(
				marketData,
				marketContext,
			);

			// Create ensemble prediction
			const ensemblePrediction =
				await this.getEnsemblePrediction(modelPredictions);

			// Generate scenarios using AI
			const scenarios = await this.generateAIScenarios(
				event,
				marketContext,
				ensemblePrediction,
			);

			// Calculate uncertainty metrics
			const uncertainty = this.calculateUncertaintyMetrics(
				modelPredictions,
				scenarios,
			);

			// Create predictive analysis
			const analysis: PredictiveAnalysis = {
				eventId: event.id,
				scenarios,
				timeHorizon: this.inferTimeHorizon(event),
				methodology: PredictionMethod.ENSEMBLE_MODELS,
				modelMetadata: this.createModelMetadata(),
				uncertainty,
				lastUpdated: new Date(),
			};

			// Store prediction
			await this.storePrediction(analysis);

			return analysis;
		} catch (error) {
			throw this.createError(
				ErrorCode.PREDICTION_ERROR,
				`Failed to generate prediction for event ${event.id}`,
				ErrorSeverity.HIGH,
				{
					eventId: event.id,
					error: error instanceof Error ? error.message : String(error),
				},
			);
		}
	}

	async getEnsemblePrediction(predictions: any[]): Promise<EnsemblePrediction> {
		this.ensureConfigured();

		if (predictions.length === 0) {
			throw this.createError(
				ErrorCode.INSUFFICIENT_DATA_ERROR,
				"No predictions available for ensemble",
				ErrorSeverity.HIGH,
			);
		}

		// Calculate weighted predictions
		const modelContributions: ModelContribution[] = [];
		let bullCase = 0,
			baseCase = 0,
			bearCase = 0;
		let totalWeight = 0;

		for (const prediction of predictions) {
			const weight = this.config!.ensembleWeights[prediction.modelType] || 1.0;
			totalWeight += weight;

			bullCase += prediction.bullCase * weight;
			baseCase += prediction.baseCase * weight;
			bearCase += prediction.bearCase * weight;

			modelContributions.push({
				modelType: prediction.modelType,
				weight,
				contribution: prediction.confidence * weight,
			});
		}

		// Normalize by total weight
		bullCase /= totalWeight;
		baseCase /= totalWeight;
		bearCase /= totalWeight;

		// Create scenarios
		const scenarios: PredictionScenario[] = [
			{
				type: ScenarioType.BULL_CASE,
				probability: 0.25,
				description: "Optimistic scenario with strong positive catalysts",
				keyDrivers: [
					"Strong fundamentals",
					"Positive market sentiment",
					"Favorable conditions",
				],
				supportingEvidence: [],
				priceTarget: {
					value: bullCase,
					range: {
						low: bullCase * 0.9,
						high: bullCase * 1.1,
						median: bullCase,
					},
					confidence: 0.7,
					timeframe: TimeHorizon.THREE_MONTHS,
				},
				conditions: [],
			},
			{
				type: ScenarioType.BASE_CASE,
				probability: 0.5,
				description: "Most likely scenario based on current trends",
				keyDrivers: [
					"Current momentum",
					"Historical patterns",
					"Market consensus",
				],
				supportingEvidence: [],
				priceTarget: {
					value: baseCase,
					range: {
						low: baseCase * 0.95,
						high: baseCase * 1.05,
						median: baseCase,
					},
					confidence: 0.8,
					timeframe: TimeHorizon.THREE_MONTHS,
				},
				conditions: [],
			},
			{
				type: ScenarioType.BEAR_CASE,
				probability: 0.25,
				description: "Conservative scenario with potential headwinds",
				keyDrivers: [
					"Risk factors",
					"Market uncertainty",
					"Negative catalysts",
				],
				supportingEvidence: [],
				priceTarget: {
					value: bearCase,
					range: {
						low: bearCase * 0.9,
						high: bearCase * 1.1,
						median: bearCase,
					},
					confidence: 0.7,
					timeframe: TimeHorizon.THREE_MONTHS,
				},
				conditions: [],
			},
		];

		// Calculate uncertainty metrics
		const values = [bullCase, baseCase, bearCase];
		const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
		const variance =
			values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;

		const uncertainty: UncertaintyMetrics = {
			variance,
			standardDeviation: Math.sqrt(variance),
			confidenceInterval: {
				lower: Math.min(...values),
				upper: Math.max(...values),
				confidence: 0.95,
			},
			entropy: this.calculateEntropy(scenarios.map((s) => s.probability)),
		};

		// Calculate performance metrics
		const performance: PredictionPerformance = {
			accuracy: 0.75, // Placeholder - would be calculated from historical performance
			precision: 0.7,
			recall: 0.65,
			f1Score: 0.675,
		};

		return {
			scenarios,
			uncertainty,
			modelContributions,
			performance,
		};
	}

	async calibrateModels(historicalData: any[]): Promise<void> {
		this.ensureConfigured();

		if (historicalData.length === 0) {
			throw this.createError(
				ErrorCode.INSUFFICIENT_DATA_ERROR,
				"Historical data is required for model calibration",
				ErrorSeverity.HIGH,
			);
		}

		try {
			// Analyze historical prediction accuracy
			const performanceMetrics = new Map<ModelType, PredictionPerformance>();

			for (const [modelType, model] of this.models) {
				const metrics = await this.calculateModelPerformance(
					model,
					historicalData,
				);
				performanceMetrics.set(modelType, metrics);

				// Update model weights based on performance
				const newWeight = this.calculateOptimalWeight(metrics);
				if (this.config!.ensembleWeights[modelType]) {
					this.config!.ensembleWeights[modelType] = newWeight;
				}
			}

			// Store updated performance metrics
			await this.storeModelPerformance(performanceMetrics);
		} catch (error) {
			throw this.createError(
				ErrorCode.MODEL_TRAINING_ERROR,
				"Failed to calibrate prediction models",
				ErrorSeverity.HIGH,
				{ error: error instanceof Error ? error.message : String(error) },
			);
		}
	}

	async evaluatePredictionAccuracy(
		predictions: any[],
		outcomes: any[],
	): Promise<number> {
		if (predictions.length !== outcomes.length || predictions.length === 0) {
			throw this.createError(
				ErrorCode.VALIDATION_ERROR,
				"Predictions and outcomes arrays must have equal length and be non-empty",
				ErrorSeverity.MEDIUM,
			);
		}

		let totalAccuracy = 0;

		for (let i = 0; i < predictions.length; i++) {
			const prediction = predictions[i];
			const outcome = outcomes[i];

			// Calculate accuracy based on scenario that actually occurred
			const accuracy = this.calculateScenarioAccuracy(
				prediction.scenarios,
				outcome,
			);
			totalAccuracy += accuracy;
		}

		return totalAccuracy / predictions.length;
	}

	private async initializeModels(): Promise<void> {
		// Initialize LSTM model
		const lstmModel: PredictionModel = {
			type: ModelType.LSTM,
			weight: this.config!.ensembleWeights[ModelType.LSTM] || 0.3,
			confidence: 0.75,
			predict: (data: number[], context: any) =>
				this.lstmPredict(data, context),
		};

		// Initialize Random Forest model
		const rfModel: PredictionModel = {
			type: ModelType.RANDOM_FOREST,
			weight: this.config!.ensembleWeights[ModelType.RANDOM_FOREST] || 0.25,
			confidence: 0.7,
			predict: (data: number[], context: any) =>
				this.randomForestPredict(data, context),
		};

		// Initialize Linear Regression model
		const lrModel: PredictionModel = {
			type: ModelType.LINEAR_REGRESSION,
			weight: this.config!.ensembleWeights[ModelType.LINEAR_REGRESSION] || 0.2,
			confidence: 0.6,
			predict: (data: number[], context: any) =>
				this.linearRegressionPredict(data, context),
		};

		// Initialize ARIMA model
		const arimaModel: PredictionModel = {
			type: ModelType.ARIMA,
			weight: this.config!.ensembleWeights[ModelType.ARIMA] || 0.25,
			confidence: 0.65,
			predict: (data: number[], context: any) =>
				this.arimaPredict(data, context),
		};

		this.models.set(ModelType.LSTM, lstmModel);
		this.models.set(ModelType.RANDOM_FOREST, rfModel);
		this.models.set(ModelType.LINEAR_REGRESSION, lrModel);
		this.models.set(ModelType.ARIMA, arimaModel);
	}

	private async gatherPredictionData(
		event: MarketEvent,
	): Promise<MarketDataPoint[]> {
		const financialAPI = getFinancialDataAPI();

		// Get historical data for prediction
		const endDate = event.timestamp;
		const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days

		try {
			return await financialAPI.getMarketData({
				ticker: event.ticker,
				dataTypes: ["STOCK_PRICE", "VOLUME", "FINANCIAL_METRIC"],
				startDate,
				endDate,
				frequency: "daily",
			});
		} catch (error) {
			console.warn(
				`Failed to gather prediction data for ${event.ticker}:`,
				error,
			);
			return [];
		}
	}

	private async createMarketContext(
		event: MarketEvent,
		marketData: MarketDataPoint[],
	): Promise<MarketContext> {
		const priceData = marketData
			.filter((d) => d.dataType === "STOCK_PRICE")
			.map((d) => Number(d.value));
		const volumeData = marketData
			.filter((d) => d.dataType === "VOLUME")
			.map((d) => Number(d.value));

		const currentPrice = priceData[priceData.length - 1] || 0;
		const volatility = this.calculateVolatility(priceData.slice(-30));
		const volume = volumeData[volumeData.length - 1] || 0;
		const trend = this.determineTrend(priceData.slice(-20));

		return {
			currentPrice,
			volatility,
			volume,
			sentiment: 0.5, // Neutral sentiment as default
			trend,
			technicalIndicators: {
				sma20: this.calculateSMA(priceData, 20),
				rsi: this.calculateRSI(priceData),
			},
			economicIndicators: {},
		};
	}

	private async generateModelPredictions(
		marketData: MarketDataPoint[],
		context: MarketContext,
	): Promise<any[]> {
		const predictions = [];
		const priceData = marketData
			.filter((d) => d.dataType === "STOCK_PRICE")
			.map((d) => Number(d.value));

		for (const [modelType, model] of this.models) {
			try {
				const result = model.predict(priceData, context);

				predictions.push({
					modelType,
					bullCase: result.value * 1.15,
					baseCase: result.value,
					bearCase: result.value * 0.85,
					confidence: result.confidence,
					features: result.features,
				});
			} catch (error) {
				console.warn(`Model ${modelType} prediction failed:`, error);
			}
		}

		return predictions;
	}

	private async generateAIScenarios(
		event: MarketEvent,
		context: MarketContext,
		ensemble: EnsemblePrediction,
	): Promise<PredictionScenario[]> {
		try {
			const aiScenarios = await generatePredictionScenarios({
				marketData: {
					ticker: event.ticker,
					currentPrice: context.currentPrice,
					volatility: context.volatility,
					volume: context.volume,
				},
				historicalPatterns: [],
				currentContext: {
					trend: context.trend,
					technicalIndicators: context.technicalIndicators,
				},
			});

			// Parse AI response and enhance with ensemble predictions
			const scenarios = JSON.parse(aiScenarios);

			return scenarios.map((scenario: any, index: number) => ({
				...scenario,
				type:
					index === 0
						? ScenarioType.BULL_CASE
						: index === 1
							? ScenarioType.BASE_CASE
							: ScenarioType.BEAR_CASE,
				supportingEvidence: [],
				conditions: [],
			}));
		} catch (error) {
			console.warn(
				"Failed to generate AI scenarios, using ensemble scenarios:",
				error,
			);
			return ensemble.scenarios;
		}
	}

	// Model implementations (simplified versions)
	private lstmPredict(data: number[], context: any): PredictionResult {
		if (data.length < 10) {
			throw new Error("Insufficient data for LSTM prediction");
		}

		// Simplified LSTM-like prediction using moving averages and trends
		const recent = data.slice(-10);
		const trend = (recent[recent.length - 1] - recent[0]) / recent.length;
		const avgPrice = recent.reduce((sum, val) => sum + val, 0) / recent.length;

		const prediction = avgPrice + trend * 10; // Project trend forward

		return {
			value: prediction,
			confidence: 0.75,
			range: {
				low: prediction * 0.9,
				high: prediction * 1.1,
			},
			features: [
				{ name: "trend", importance: 0.8 },
				{ name: "moving_average", importance: 0.6 },
				{ name: "volatility", importance: 0.4 },
			],
		};
	}

	private randomForestPredict(data: number[], context: any): PredictionResult {
		if (data.length < 5) {
			throw new Error("Insufficient data for Random Forest prediction");
		}

		// Simplified Random Forest using feature aggregation
		const recent = data.slice(-5);
		const sma = recent.reduce((sum, val) => sum + val, 0) / recent.length;
		const volatilityFactor = this.calculateVolatility(data.slice(-20)) / 100;

		const prediction = sma * (1 + (Math.random() - 0.5) * volatilityFactor);

		return {
			value: prediction,
			confidence: 0.7,
			range: {
				low: prediction * 0.92,
				high: prediction * 1.08,
			},
			features: [
				{ name: "sma_5", importance: 0.7 },
				{ name: "volatility", importance: 0.5 },
				{ name: "price_momentum", importance: 0.6 },
			],
		};
	}

	private linearRegressionPredict(
		data: number[],
		context: any,
	): PredictionResult {
		if (data.length < 3) {
			throw new Error("Insufficient data for Linear Regression prediction");
		}

		// Simple linear regression
		const n = data.length;
		const xValues = Array.from({ length: n }, (_, i) => i);
		const yValues = data;

		const slope = this.calculateLinearRegressionSlope(xValues, yValues);
		const intercept = yValues[0] - slope * xValues[0];

		const prediction = slope * n + intercept;

		return {
			value: prediction,
			confidence: 0.6,
			range: {
				low: prediction * 0.95,
				high: prediction * 1.05,
			},
			features: [
				{ name: "linear_trend", importance: 0.9 },
				{ name: "r_squared", importance: 0.7 },
			],
		};
	}

	private arimaPredict(data: number[], context: any): PredictionResult {
		if (data.length < 10) {
			throw new Error("Insufficient data for ARIMA prediction");
		}

		// Simplified ARIMA using differencing and moving averages
		const differences = [];
		for (let i = 1; i < data.length; i++) {
			differences.push(data[i] - data[i - 1]);
		}

		const avgDiff =
			differences.slice(-5).reduce((sum, val) => sum + val, 0) / 5;
		const prediction = data[data.length - 1] + avgDiff;

		return {
			value: prediction,
			confidence: 0.65,
			range: {
				low: prediction * 0.93,
				high: prediction * 1.07,
			},
			features: [
				{ name: "autoregressive", importance: 0.8 },
				{ name: "moving_average", importance: 0.6 },
				{ name: "differencing", importance: 0.5 },
			],
		};
	}

	// Utility methods
	private calculateVolatility(prices: number[]): number {
		if (prices.length < 2) return 0;

		const returns = [];
		for (let i = 1; i < prices.length; i++) {
			returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
		}

		const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
		const variance =
			returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;

		return Math.sqrt(variance) * 100;
	}

	private calculateSMA(data: number[], period: number): number {
		if (data.length < period) return 0;
		const recentData = data.slice(-period);
		return recentData.reduce((sum, val) => sum + val, 0) / period;
	}

	private calculateRSI(prices: number[], period: number = 14): number {
		if (prices.length < period + 1) return 50;

		const changes = [];
		for (let i = 1; i < prices.length; i++) {
			changes.push(prices[i] - prices[i - 1]);
		}

		const recentChanges = changes.slice(-period);
		const gains = recentChanges.filter((change) => change > 0);
		const losses = recentChanges
			.filter((change) => change < 0)
			.map((loss) => Math.abs(loss));

		const avgGain =
			gains.length > 0
				? gains.reduce((sum, gain) => sum + gain, 0) / period
				: 0;
		const avgLoss =
			losses.length > 0
				? losses.reduce((sum, loss) => sum + loss, 0) / period
				: 0;

		if (avgLoss === 0) return 100;
		const rs = avgGain / avgLoss;
		return 100 - 100 / (1 + rs);
	}

	private determineTrend(prices: number[]): string {
		if (prices.length < 2) return "neutral";

		const first = prices[0];
		const last = prices[prices.length - 1];
		const change = (last - first) / first;

		if (change > 0.05) return "upward";
		if (change < -0.05) return "downward";
		return "sideways";
	}

	private calculateLinearRegressionSlope(x: number[], y: number[]): number {
		const n = x.length;
		const sumX = x.reduce((sum, val) => sum + val, 0);
		const sumY = y.reduce((sum, val) => sum + val, 0);
		const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
		const sumXX = x.reduce((sum, val) => sum + val * val, 0);

		return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
	}

	private calculateUncertaintyMetrics(
		predictions: any[],
		scenarios: PredictionScenario[],
	): UncertaintyMetrics {
		const values = predictions.map((p) => p.baseCase);
		const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
		const variance =
			values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;

		return {
			variance,
			standardDeviation: Math.sqrt(variance),
			confidenceInterval: {
				lower: Math.min(...values),
				upper: Math.max(...values),
				confidence: 0.95,
			},
			entropy: this.calculateEntropy(scenarios.map((s) => s.probability)),
		};
	}

	private calculateEntropy(probabilities: number[]): number {
		return -probabilities.reduce(
			(sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0),
			0,
		);
	}

	private inferTimeHorizon(event: MarketEvent): TimeHorizon {
		// Simple heuristic based on event type and magnitude
		if (event.magnitude > 80) return TimeHorizon.ONE_WEEK;
		if (event.magnitude > 60) return TimeHorizon.ONE_MONTH;
		if (event.magnitude > 40) return TimeHorizon.THREE_MONTHS;
		return TimeHorizon.SIX_MONTHS;
	}

	private createModelMetadata(): ModelMetadata {
		return {
			name: "Ensemble Prediction Model",
			version: "1.0.0",
			trainedOn: new Date(),
			accuracy: 0.75,
			features: ["price", "volume", "volatility", "technical_indicators"],
		};
	}

	private async calculateModelPerformance(
		model: PredictionModel,
		historicalData: any[],
	): Promise<PredictionPerformance> {
		// Placeholder performance calculation
		return {
			accuracy: 0.7 + Math.random() * 0.2, // 70-90%
			precision: 0.65 + Math.random() * 0.2, // 65-85%
			recall: 0.6 + Math.random() * 0.2, // 60-80%
			f1Score: 0.675, // Average of precision and recall
		};
	}

	private calculateOptimalWeight(performance: PredictionPerformance): number {
		// Weight based on F1 score and accuracy
		const score = (performance.f1Score + performance.accuracy) / 2;
		return Math.max(0.1, Math.min(0.5, score)); // Between 10% and 50%
	}

	private calculateScenarioAccuracy(
		scenarios: PredictionScenario[],
		outcome: any,
	): number {
		// Find the scenario closest to the actual outcome
		let bestAccuracy = 0;

		for (const scenario of scenarios) {
			const predicted = scenario.priceTarget.value;
			const actual = outcome.actualPrice || outcome.value;

			if (actual && predicted) {
				const accuracy = 1 - Math.abs(predicted - actual) / actual;
				bestAccuracy = Math.max(bestAccuracy, Math.max(0, accuracy));
			}
		}

		return bestAccuracy;
	}

	private async storePrediction(analysis: PredictiveAnalysis): Promise<void> {
		try {
			await db.insert(predictiveAnalyses).values({
				eventId: analysis.eventId,
				analysisType: "PREDICTIVE_ANALYSIS",
				predictiveAnalysis: {
					scenarios: analysis.scenarios,
					timeHorizon: analysis.timeHorizon,
					methodology: analysis.methodology,
					modelMetadata: analysis.modelMetadata,
					uncertainty: analysis.uncertainty,
				},
				confidenceScore: "0.8",
				methodology: analysis.methodology,
			});
		} catch (error) {
			console.error("Failed to store prediction:", error);
			// Don't throw - prediction can still be returned
		}
	}

	private async storeModelPerformance(
		metrics: Map<ModelType, PredictionPerformance>,
	): Promise<void> {
		try {
			// TODO: Create proper model performance table
			// for (const [modelType, performance] of metrics) {
			// 	await db.insert(modelPerformances).values({
			// 		id: crypto.randomUUID(),
			// 		modelType,
			// 		accuracy: performance.accuracy,
			// 		precision: performance.precision,
			// 		recall: performance.recall,
			// 		f1Score: performance.f1Score,
			// 		evaluatedAt: new Date(),
			// 		createdAt: new Date(),
			// 		updatedAt: new Date(),
			// 	});
			// }
			console.log("Model performance metrics:", metrics);
		} catch (error) {
			console.error("Failed to store model performance:", error);
		}
	}

	private ensureConfigured(): void {
		if (!this.isConfigured || !this.config) {
			throw this.createError(
				ErrorCode.MISSING_CONFIGURATION,
				"Prediction engine not configured",
				ErrorSeverity.CRITICAL,
			);
		}
	}

	private validateConfig(config: PredictionConfig): void {
		if (config.models.length === 0) {
			throw new Error("At least one model must be specified");
		}

		if (config.confidenceThreshold < 0 || config.confidenceThreshold > 1) {
			throw new Error("Confidence threshold must be between 0 and 1");
		}

		if (config.maxScenarios < 1) {
			throw new Error("Max scenarios must be at least 1");
		}
	}

	private createError(
		code: ErrorCode,
		message: string,
		severity: ErrorSeverity,
		additionalData?: any,
	): ApplicationError {
		return {
			code,
			message,
			severity,
			metadata: {
				timestamp: new Date(),
				service: "prediction-engine",
				operation: "predict",
				additionalData,
			},
			retryable:
				code === ErrorCode.DATABASE_QUERY_ERROR ||
				severity === ErrorSeverity.HIGH,
		};
	}
}
