// Content Types based on development specification

import type { DataSource } from "./market";

export enum SectionType {
	HEADLINE = "HEADLINE",
	SUMMARY = "SUMMARY",
	EXPLANATION = "EXPLANATION",
	PREDICTION = "PREDICTION",
	DEEP_DIVE = "DEEP_DIVE",
}

export enum ComplexityLevel {
	BASIC = "BASIC",
	INTERMEDIATE = "INTERMEDIATE",
	ADVANCED = "ADVANCED",
	EXPERT = "EXPERT",
}

export enum AudienceType {
	RETAIL = "RETAIL",
	PRO_AM = "PRO_AM",
	PROFESSIONAL = "PROFESSIONAL",
	INSTITUTIONAL = "INSTITUTIONAL",
}

export enum ContentStatus {
	DRAFT = "DRAFT",
	PUBLISHED = "PUBLISHED",
	ARCHIVED = "ARCHIVED",
}

export enum VisualizationType {
	LINE_CHART = "LINE_CHART",
	BAR_CHART = "BAR_CHART",
	CANDLESTICK_CHART = "CANDLESTICK_CHART",
	FAN_CHART = "FAN_CHART",
	SANKEY_DIAGRAM = "SANKEY_DIAGRAM",
	NETWORK_GRAPH = "NETWORK_GRAPH",
	WATERFALL_CHART = "WATERFALL_CHART",
	PROBABILITY_CHART = "PROBABILITY_CHART",
}

export enum ChartTheme {
	LIGHT = "LIGHT",
	DARK = "DARK",
	AUTO = "AUTO",
}

export enum InteractivityLevel {
	NONE = "NONE",
	BASIC = "BASIC",
	ADVANCED = "ADVANCED",
}

export enum AccessibilityLevel {
	BASIC = "BASIC",
	WCAG_A = "WCAG_A",
	WCAG_AA = "WCAG_AA",
	WCAG_AAA = "WCAG_AAA",
}

export enum ContentLength {
	SHORT = "SHORT",
	MEDIUM = "MEDIUM",
	LONG = "LONG",
	COMPREHENSIVE = "COMPREHENSIVE",
}

export interface SentimentScore {
	positive: number;
	negative: number;
	neutral: number;
	overall: number;
	confidence: number;
}

export interface ContentSection {
	type: SectionType;
	content: string;
	bulletPoints: string[];
	confidence: number;
	sources: DataSource[];
	visualizations: string[];
}

export interface NarrativeMetadata {
	readingTime: number;
	complexityLevel: ComplexityLevel;
	targetAudience: AudienceType;
	topicalTags: string[];
	sentiment: SentimentScore;
	version: number;
}

export interface IntelligentNarrative {
	id: string;
	eventId: string;
	headline: string;
	summary: ContentSection;
	explanation: ContentSection;
	prediction: ContentSection;
	deepDive: ContentSection;
	metadata: NarrativeMetadata;
	visualizations: Visualization[];
	status: ContentStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface DataPoint {
	x: number | string | Date;
	y: number;
	metadata?: any;
}

export interface SeriesStyle {
	color: string;
	lineWidth?: number;
	fillOpacity?: number;
	strokeDasharray?: string;
}

export interface SeriesMetadata {
	unit: string;
	description: string;
	source: DataSource;
}

export interface DataSeries {
	name: string;
	data: DataPoint[];
	style: SeriesStyle;
	metadata: SeriesMetadata;
}

export interface Annotation {
	type: "point" | "line" | "area" | "text";
	position: {
		x: number | string | Date;
		y?: number;
	};
	content: string;
	style?: any;
}

export interface FilterOption {
	name: string;
	value: any;
	active: boolean;
}

export interface VisualizationData {
	datasets: DataSeries[];
	annotations: Annotation[];
	timeRange: {
		start: Date;
		end: Date;
	};
	filters: FilterOption[];
}

export interface AccessibilityOptions {
	highContrast: boolean;
	screenReaderSupport: boolean;
	keyboardNavigation: boolean;
	altText: string;
}

export interface InteractivityOptions {
	zoom: boolean;
	pan: boolean;
	hover: boolean;
	click: boolean;
	brush: boolean;
	tooltip: boolean;
}

export interface ChartConfiguration {
	theme: ChartTheme;
	responsive: boolean;
	interactive: boolean;
	exportable: boolean;
	accessibility: AccessibilityOptions;
}

export interface Visualization {
	id: string;
	type: VisualizationType;
	title: string;
	description: string;
	data: VisualizationData;
	configuration: ChartConfiguration;
	interactivity: InteractivityOptions;
}

export interface ContentStructure {
	sections: SectionType[];
	maxLength: number;
	includeVisualizations: boolean;
	includeSources: boolean;
}

export interface StyleGuide {
	tone: string;
	vocabulary: string;
	citations: boolean;
	factChecking: boolean;
}

export interface ContentTemplate {
	structure: ContentStructure;
	styleGuide: StyleGuide;
	targetAudience: AudienceType;
	complexity: ComplexityLevel;
	length: ContentLength;
}

export interface AccuracyAssessment {
	factualAccuracy: number;
	sourceReliability: number;
	dataIntegrity: number;
	overallScore: number;
}

export interface BiasAssessment {
	detectedBiases: string[];
	severityScore: number;
	mitigationSuggestions: string[];
}

export interface ImprovementSuggestion {
	category: string;
	description: string;
	priority: number;
	estimatedImpact: number;
}

export interface ContentValidation {
	qualityScore: number;
	accuracyCheck: AccuracyAssessment;
	readabilityScore: number;
	biasAssessment: BiasAssessment;
	improvements: ImprovementSuggestion[];
}

export interface RawContent {
	text: string;
	metadata: any;
	sources: DataSource[];
}

export interface AdaptedContent {
	text: string;
	complexity: ComplexityLevel;
	readabilityScore: number;
	modifications: string[];
}

export interface QualityCriteria {
	minReadabilityScore: number;
	maxBiasThreshold: number;
	requiredSources: number;
	factCheckRequired: boolean;
}

export interface VisualizationRequirements {
	chartType: VisualizationType;
	interactivity: InteractivityLevel;
	accessibility: AccessibilityLevel;
	responsiveness: ResponsivenessConfig;
	theme: ChartTheme;
}

export interface ResponsivenessConfig {
	mobile: boolean;
	tablet: boolean;
	desktop: boolean;
	breakpoints: Record<string, number>;
}

export interface DashboardLayout {
	columns: number;
	rows: number;
	gaps: number;
	responsive: boolean;
}

export interface InteractionConfig {
	type: string;
	source: string;
	target: string;
	action: string;
}

export interface VisualizationDashboard {
	layout: DashboardLayout;
	visualizations: Visualization[];
	interactions: InteractionConfig[];
	responsiveness: ResponsivenessConfig;
}

export interface DataUpdate {
	type: "append" | "replace" | "update";
	data: DataPoint[];
	seriesId: string;
}

export interface DataSet {
	id: string;
	name: string;
	data: DataSeries[];
	metadata: any;
}
