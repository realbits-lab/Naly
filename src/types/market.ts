// Market Data Types based on development specification

export enum EventType {
	PRICE_JUMP = "PRICE_JUMP",
	EARNINGS_RELEASE = "EARNINGS_RELEASE",
	NEWS_BREAK = "NEWS_BREAK",
	FILING_SUBMISSION = "FILING_SUBMISSION",
	INSIDER_TRADE = "INSIDER_TRADE",
	INSTITUTIONAL_CHANGE = "INSTITUTIONAL_CHANGE",
}

export enum SignificanceLevel {
	LOW = "LOW",
	MEDIUM = "MEDIUM",
	HIGH = "HIGH",
	CRITICAL = "CRITICAL",
}

export enum DataSource {
	FINANCIAL_DATASETS_API = "FINANCIAL_DATASETS_API",
	SEC_FILINGS = "SEC_FILINGS",
	NEWS_FEED = "NEWS_FEED",
	INSIDER_TRADES = "INSIDER_TRADES",
	INSTITUTIONAL_OWNERSHIP = "INSTITUTIONAL_OWNERSHIP",
	EARNINGS_RELEASES = "EARNINGS_RELEASES",
}

export enum DataType {
	STOCK_PRICE = "STOCK_PRICE",
	VOLUME = "VOLUME",
	FINANCIAL_METRIC = "FINANCIAL_METRIC",
	SENTIMENT_SCORE = "SENTIMENT_SCORE",
	NEWS_ITEM = "NEWS_ITEM",
	FILING_DATA = "FILING_DATA",
	TRADE_DATA = "TRADE_DATA",
}

export enum MarketCapCategory {
	MICRO = "MICRO",
	SMALL = "SMALL",
	MID = "MID",
	LARGE = "LARGE",
	MEGA = "MEGA",
}

export enum QualityRating {
	POOR = "POOR",
	FAIR = "FAIR",
	GOOD = "GOOD",
	EXCELLENT = "EXCELLENT",
}

export enum ProcessingFlag {
	NORMALIZED = "NORMALIZED",
	VALIDATED = "VALIDATED",
	ENRICHED = "ENRICHED",
	ANOMALY_DETECTED = "ANOMALY_DETECTED",
}

export interface EventMetadata {
	sector: string;
	marketCap: MarketCapCategory;
	volatility: number;
	volume: number;
	priceChange: number;
	volumeRatio: number;
}

export interface DataPointMetadata {
	reliability: number;
	freshness: number;
	sourceQuality: QualityRating;
	processingFlags: ProcessingFlag[];
}

export interface MarketDataPoint {
	source: DataSource;
	timestamp: Date;
	ticker: string;
	dataType: DataType;
	value: any;
	confidence: number;
	metadata: DataPointMetadata;
}

export interface MarketEvent {
	id: string;
	eventType: EventType;
	ticker: string;
	timestamp: Date;
	magnitude: number;
	significance: SignificanceLevel;
	sourceData: MarketDataPoint[];
	relatedEvents: string[];
	metadata: EventMetadata;
}

export interface MarketDataStream {
	source: DataSource;
	dataPoints: MarketDataPoint[];
	metadata: StreamMetadata;
}

export interface StreamMetadata {
	startTime: Date;
	endTime: Date;
	totalPoints: number;
	averageLatency: number;
	errorRate: number;
}

export interface TimeWindow {
	start: Date;
	end: Date;
	duration: number;
}

export interface TimeRange {
	from: Date;
	to: Date;
}

export interface MarketCondition {
	type: string;
	value: number;
	timestamp: Date;
	description: string;
}

export interface SectorData {
	sector: string;
	performance: number;
	volatility: number;
	volume: number;
	marketCap: number;
	constituents: string[];
}

export interface MacroData {
	indicator: string;
	value: number;
	previousValue: number;
	change: number;
	timestamp: Date;
	frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually";
}
