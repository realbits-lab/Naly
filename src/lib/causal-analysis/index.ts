// Causal Analysis Module Exports

// Re-export types from analytics types
export type {
	AlternativeExplanation,
	AnalysisMethod,
	CausalAnalysis,
	CausalFactor,
	EvidenceItem,
	EvidenceType,
	FactorType,
	ImpactLevel,
	TemporalRelation,
} from "@/types/analytics";
export type {
	CausalAnalysisConfig,
	CausalAnalysisService,
} from "@/types/services";
export { CausalAnalyzer } from "./causal-analyzer";

// Utility functions for causal analysis
export const createDefaultCausalConfig = () => ({
	analysisMethod: "STATISTICAL_INFERENCE" as const,
	confidenceThreshold: 0.6,
	maxFactors: 5,
	enableAlternativeExplanations: true,
	useCache: true,
});

export const classifyFactorImpact = (
	magnitude: number,
	confidence: number,
): "MINIMAL" | "LOW" | "MODERATE" | "HIGH" | "DECISIVE" => {
	const score = magnitude * confidence;

	if (score >= 80) return "DECISIVE";
	if (score >= 60) return "HIGH";
	if (score >= 40) return "MODERATE";
	if (score >= 20) return "LOW";
	return "MINIMAL";
};

export const calculateEvidenceStrength = (evidenceItems: any[]): number => {
	if (evidenceItems.length === 0) return 0;

	const avgRelevance =
		evidenceItems.reduce((sum, item) => sum + (item.relevanceScore || 0.5), 0) /
		evidenceItems.length;

	const diversityBonus = Math.min(0.2, evidenceItems.length * 0.05);

	return Math.min(1.0, avgRelevance + diversityBonus);
};

export const formatCausalAnalysis = (analysis: any) => {
	return {
		...analysis,
		summary: {
			rootCause: analysis.rootCause.type,
			rootCauseConfidence: analysis.rootCause.confidence,
			contributingFactorsCount: analysis.contributingFactors.length,
			alternativeExplanationsCount: analysis.alternativeExplanations.length,
			overallConfidence: analysis.confidenceScore,
			evidenceItemsCount: analysis.evidenceChain.length,
			methodology: analysis.methodology,
		},
		formattedConfidence: `${Math.round(analysis.confidenceScore * 100)}%`,
		strengthRating:
			analysis.confidenceScore > 0.8
				? "Strong"
				: analysis.confidenceScore > 0.6
					? "Moderate"
					: analysis.confidenceScore > 0.4
						? "Weak"
						: "Very Weak",
	};
};

// Analysis validation helpers
export const validateCausalAnalysis = (
	analysis: any,
): { valid: boolean; issues: string[] } => {
	const issues: string[] = [];

	if (!analysis.eventId) {
		issues.push("Missing event ID");
	}

	if (!analysis.rootCause) {
		issues.push("Missing root cause");
	} else {
		if (
			analysis.rootCause.confidence < 0 ||
			analysis.rootCause.confidence > 1
		) {
			issues.push("Root cause confidence must be between 0 and 1");
		}
	}

	if (!Array.isArray(analysis.contributingFactors)) {
		issues.push("Contributing factors must be an array");
	}

	if (!Array.isArray(analysis.evidenceChain)) {
		issues.push("Evidence chain must be an array");
	}

	if (analysis.confidenceScore < 0 || analysis.confidenceScore > 1) {
		issues.push("Overall confidence score must be between 0 and 1");
	}

	return {
		valid: issues.length === 0,
		issues,
	};
};

// Factor type descriptions
export const FACTOR_TYPE_DESCRIPTIONS = {
	EARNINGS_SURPRISE:
		"Company earnings results significantly different from analyst expectations",
	NEWS_SENTIMENT:
		"Market sentiment shift driven by news coverage or announcements",
	INSIDER_ACTIVITY:
		"Trading activity by company insiders affecting market perception",
	INSTITUTIONAL_FLOW: "Large-scale institutional buying or selling pressure",
	MARKET_SENTIMENT: "Overall market mood and investor confidence changes",
	REGULATORY_CHANGE: "New regulations or policy changes affecting the market",
	SECTOR_ROTATION: "Capital movement between different market sectors",
} as const;

// Impact level weights for scoring
export const IMPACT_LEVEL_WEIGHTS = {
	MINIMAL: 0.2,
	LOW: 0.4,
	MODERATE: 0.6,
	HIGH: 0.8,
	DECISIVE: 1.0,
} as const;

// Evidence type priorities
export const EVIDENCE_TYPE_PRIORITIES = {
	QUANTITATIVE: 1.0,
	STATISTICAL: 0.9,
	HISTORICAL: 0.7,
	QUALITATIVE: 0.5,
} as const;

// Constants for causal analysis
export const CAUSAL_ANALYSIS_CONSTANTS = {
	MIN_CONFIDENCE_THRESHOLD: 0.3,
	MAX_CONFIDENCE_THRESHOLD: 1.0,
	DEFAULT_CONFIDENCE_THRESHOLD: 0.6,
	MAX_CONTRIBUTING_FACTORS: 10,
	MAX_ALTERNATIVE_EXPLANATIONS: 5,
	MAX_EVIDENCE_ITEMS: 20,
	TEMPORAL_ALIGNMENT_THRESHOLD: 0.7,
	EVIDENCE_RELEVANCE_THRESHOLD: 0.5,
} as const;
