// Prediction Module Exports

// Re-export types from analytics types
export type {
	EnsembleConfiguration,
	EnsemblePrediction,
	FeatureImportance,
	ModelContribution,
	ModelMetadata,
	ModelPrediction,
	ModelType,
	PredictionMethod,
	PredictionPerformance,
	PredictionScenario,
	PredictiveAnalysis,
	PriceRange,
	PriceTarget,
	ScenarioCondition,
	ScenarioType,
	TimeHorizon,
	UncertaintyMetrics,
} from "@/types/analytics";
export type {
	PredictionConfig,
	PredictionService,
} from "@/types/services";
export { PredictionEngine } from "./prediction-engine";

// Utility functions for predictions
export const createDefaultPredictionConfig = () => ({
	models: ["LSTM", "RANDOM_FOREST", "LINEAR_REGRESSION", "ARIMA"] as const,
	ensembleWeights: {
		LSTM: 0.3,
		RANDOM_FOREST: 0.25,
		LINEAR_REGRESSION: 0.2,
		ARIMA: 0.25,
	},
	aggregationMethod: "weighted_average",
	confidenceThreshold: 0.6,
	maxScenarios: 3,
});

export const calculateScenarioProbabilities = (scenarios: any[]): number[] => {
	const totalWeight = scenarios.reduce((sum, s) => sum + (s.weight || 1), 0);
	return scenarios.map((s) => (s.weight || 1) / totalWeight);
};

export const normalizeScenarioProbabilities = (
	probabilities: number[],
): number[] => {
	const sum = probabilities.reduce((total, prob) => total + prob, 0);
	if (sum === 0) return probabilities.map(() => 1 / probabilities.length);
	return probabilities.map((prob) => prob / sum);
};

export const calculateExpectedValue = (scenarios: any[]): number => {
	return scenarios.reduce((sum, scenario) => {
		const value = scenario.priceTarget?.value || scenario.value || 0;
		const probability = scenario.probability || 0;
		return sum + value * probability;
	}, 0);
};

export const calculatePredictionRange = (
	scenarios: any[],
): { min: number; max: number; spread: number } => {
	const values = scenarios
		.map((s) => s.priceTarget?.value || s.value)
		.filter((v) => v !== undefined && v !== null);

	if (values.length === 0) {
		return { min: 0, max: 0, spread: 0 };
	}

	const min = Math.min(...values);
	const max = Math.max(...values);
	const spread = max - min;

	return { min, max, spread };
};

export const formatPredictionScenarios = (scenarios: any[]) => {
	return scenarios.map((scenario) => ({
		...scenario,
		formattedProbability: `${Math.round(scenario.probability * 100)}%`,
		formattedPriceTarget: scenario.priceTarget
			? `$${scenario.priceTarget.value.toFixed(2)}`
			: "N/A",
		scenarioLabel:
			scenario.type === "BULL_CASE"
				? "Bull Case"
				: scenario.type === "BASE_CASE"
					? "Base Case"
					: scenario.type === "BEAR_CASE"
						? "Bear Case"
						: "Unknown",
		confidenceLabel: scenario.priceTarget?.confidence
			? `${Math.round(scenario.priceTarget.confidence * 100)}%`
			: "N/A",
	}));
};

export const assessPredictionReliability = (
	uncertainty: any,
): "High" | "Medium" | "Low" => {
	const confidenceInterval = uncertainty?.confidenceInterval;
	if (!confidenceInterval) return "Low";

	const range = confidenceInterval.upper - confidenceInterval.lower;
	const midpoint = (confidenceInterval.upper + confidenceInterval.lower) / 2;
	const relativeRange = midpoint > 0 ? range / midpoint : 1;

	if (relativeRange < 0.1) return "High";
	if (relativeRange < 0.3) return "Medium";
	return "Low";
};

export const calculateModelConsensus = (modelContributions: any[]): number => {
	if (modelContributions.length === 0) return 0;

	const weights = modelContributions.map((mc) => mc.weight);
	const contributions = modelContributions.map((mc) => mc.contribution);

	// Calculate weighted variance of contributions
	const weightedMean =
		contributions.reduce((sum, contrib, i) => sum + contrib * weights[i], 0) /
		weights.reduce((sum, w) => sum + w, 0);

	const weightedVariance =
		contributions.reduce(
			(sum, contrib, i) => sum + weights[i] * (contrib - weightedMean) ** 2,
			0,
		) / weights.reduce((sum, w) => sum + w, 0);

	// Convert variance to consensus score (lower variance = higher consensus)
	return Math.max(0, 1 - Math.sqrt(weightedVariance));
};

// Validation helpers
export const validatePredictionScenario = (
	scenario: any,
): { valid: boolean; issues: string[] } => {
	const issues: string[] = [];

	if (!scenario.type) {
		issues.push("Scenario type is required");
	}

	if (
		typeof scenario.probability !== "number" ||
		scenario.probability < 0 ||
		scenario.probability > 1
	) {
		issues.push("Probability must be a number between 0 and 1");
	}

	if (!scenario.description || scenario.description.trim().length === 0) {
		issues.push("Scenario description is required");
	}

	if (!scenario.priceTarget) {
		issues.push("Price target is required");
	} else {
		if (
			typeof scenario.priceTarget.value !== "number" ||
			scenario.priceTarget.value <= 0
		) {
			issues.push("Price target value must be a positive number");
		}

		if (
			typeof scenario.priceTarget.confidence !== "number" ||
			scenario.priceTarget.confidence < 0 ||
			scenario.priceTarget.confidence > 1
		) {
			issues.push("Price target confidence must be between 0 and 1");
		}
	}

	return {
		valid: issues.length === 0,
		issues,
	};
};

export const validateEnsemblePrediction = (
	ensemble: any,
): { valid: boolean; issues: string[] } => {
	const issues: string[] = [];

	if (!Array.isArray(ensemble.scenarios) || ensemble.scenarios.length === 0) {
		issues.push("Scenarios array is required and must not be empty");
	} else {
		const totalProbability = ensemble.scenarios.reduce(
			(sum: number, s: any) => sum + (s.probability || 0),
			0,
		);
		if (Math.abs(totalProbability - 1.0) > 0.01) {
			issues.push("Scenario probabilities must sum to 1.0");
		}
	}

	if (!ensemble.uncertainty) {
		issues.push("Uncertainty metrics are required");
	}

	if (!Array.isArray(ensemble.modelContributions)) {
		issues.push("Model contributions array is required");
	}

	if (!ensemble.performance) {
		issues.push("Performance metrics are required");
	}

	return {
		valid: issues.length === 0,
		issues,
	};
};

// Constants
export const PREDICTION_CONSTANTS = {
	MIN_CONFIDENCE_THRESHOLD: 0.3,
	MAX_CONFIDENCE_THRESHOLD: 1.0,
	DEFAULT_CONFIDENCE_THRESHOLD: 0.6,
	MAX_SCENARIOS: 5,
	MIN_SCENARIOS: 1,
	DEFAULT_SCENARIOS: 3,
	TIME_HORIZON_DAYS: {
		ONE_WEEK: 7,
		ONE_MONTH: 30,
		THREE_MONTHS: 90,
		SIX_MONTHS: 180,
		ONE_YEAR: 365,
	},
	MODEL_WEIGHTS: {
		LSTM: 0.3,
		TRANSFORMER: 0.25,
		RANDOM_FOREST: 0.2,
		LINEAR_REGRESSION: 0.15,
		ARIMA: 0.1,
	},
	RELIABILITY_THRESHOLDS: {
		HIGH: 0.8,
		MEDIUM: 0.6,
		LOW: 0.4,
	},
} as const;

// Error messages
export const PREDICTION_ERROR_MESSAGES = {
	INSUFFICIENT_DATA: "Insufficient historical data for accurate prediction",
	MODEL_INITIALIZATION_FAILED: "Failed to initialize prediction models",
	ENSEMBLE_AGGREGATION_FAILED: "Failed to aggregate ensemble predictions",
	SCENARIO_GENERATION_FAILED: "Failed to generate prediction scenarios",
	CALIBRATION_FAILED: "Model calibration failed",
	VALIDATION_FAILED: "Prediction validation failed",
} as const;
