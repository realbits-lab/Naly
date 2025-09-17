// Visualization Module Exports

// Re-export types from content types
export type {
	AccessibilityLevel,
	AccessibilityOptions,
	Annotation,
	ChartConfiguration,
	ChartTheme,
	DashboardLayout,
	DataPoint,
	DataSeries,
	FilterOption,
	InteractionConfig,
	InteractivityLevel,
	InteractivityOptions,
	ResponsivenessConfig,
	SeriesMetadata,
	SeriesStyle,
	Visualization,
	VisualizationDashboard,
	VisualizationData,
	VisualizationRequirements,
	VisualizationType,
} from "@/types/content";
export type {
	VisualizationConfig,
	VisualizationService,
} from "@/types/services";
export { ChartGenerator } from "./chart-generator";

// Utility functions for visualization generation
export const createDefaultVisualizationConfig = () => ({
	defaultTheme: "AUTO" as const,
	interactivityLevel: "BASIC" as const,
	accessibilityLevel: "WCAG_AA" as const,
	responsiveness: {
		mobile: true,
		tablet: true,
		desktop: true,
		breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 },
	},
	exportFormats: ["png", "svg"],
});

export const getVisualizationTypeForData = (data: any[]): string => {
	if (!Array.isArray(data) || data.length === 0) {
		return "BAR_CHART";
	}

	const firstItem = data[0];

	// Check for OHLC data
	if (
		firstItem.open !== undefined &&
		firstItem.high !== undefined &&
		firstItem.low !== undefined &&
		firstItem.close !== undefined
	) {
		return "CANDLESTICK_CHART";
	}

	// Check for time series data
	if (firstItem.timestamp || firstItem.date) {
		return "LINE_CHART";
	}

	// Check for probability data
	if (firstItem.probability !== undefined) {
		return "PROBABILITY_CHART";
	}

	// Check for scenario data
	if (
		firstItem.type &&
		(firstItem.type === "BULL_CASE" ||
			firstItem.type === "BEAR_CASE" ||
			firstItem.type === "BASE_CASE")
	) {
		return "FAN_CHART";
	}

	// Default to bar chart
	return "BAR_CHART";
};

export const calculateOptimalDimensions = (
	type: string,
	dataSize: number,
): { width: number; height: number } => {
	const baseWidth = 800;
	const baseHeight = 400;

	switch (type) {
		case "LINE_CHART":
			return {
				width: Math.min(1200, baseWidth + dataSize * 2),
				height: baseHeight,
			};
		case "CANDLESTICK_CHART":
			return {
				width: Math.min(1000, baseWidth + dataSize * 3),
				height: baseHeight + 100,
			};
		case "BAR_CHART":
			return {
				width: Math.max(400, dataSize * 50),
				height: baseHeight,
			};
		case "FAN_CHART":
			return {
				width: baseWidth,
				height: baseHeight + 50,
			};
		case "PROBABILITY_CHART":
			return {
				width: Math.max(400, dataSize * 80),
				height: 300,
			};
		default:
			return { width: baseWidth, height: baseHeight };
	}
};

export const getColorScheme = (
	theme: string,
	seriesCount: number,
): string[] => {
	const schemes = {
		LIGHT: [
			"#3b82f6", // Blue
			"#10b981", // Green
			"#ef4444", // Red
			"#f59e0b", // Amber
			"#8b5cf6", // Purple
			"#06b6d4", // Cyan
			"#ec4899", // Pink
			"#84cc16", // Lime
		],
		DARK: [
			"#60a5fa", // Light Blue
			"#34d399", // Light Green
			"#f87171", // Light Red
			"#fbbf24", // Light Amber
			"#a78bfa", // Light Purple
			"#22d3ee", // Light Cyan
			"#f472b6", // Light Pink
			"#a3e635", // Light Lime
		],
		AUTO: [
			"#3b82f6",
			"#10b981",
			"#ef4444",
			"#f59e0b",
			"#8b5cf6",
			"#06b6d4",
			"#ec4899",
			"#84cc16",
		],
	};

	const colors = schemes[theme as keyof typeof schemes] || schemes.AUTO;

	// Repeat colors if we need more than available
	const result: string[] = [];
	for (let i = 0; i < seriesCount; i++) {
		result.push(colors[i % colors.length]);
	}

	return result;
};

export const validateVisualizationData = (
	data: any[],
	type: string,
): { valid: boolean; issues: string[] } => {
	const issues: string[] = [];

	if (!Array.isArray(data)) {
		issues.push("Data must be an array");
		return { valid: false, issues };
	}

	if (data.length === 0) {
		issues.push("Data array cannot be empty");
		return { valid: false, issues };
	}

	switch (type) {
		case "LINE_CHART":
			data.forEach((item, index) => {
				if (!item.timestamp && !item.x) {
					issues.push(`Item ${index}: missing timestamp or x value`);
				}
				if (item.value === undefined && item.y === undefined) {
					issues.push(`Item ${index}: missing value or y value`);
				}
			});
			break;

		case "CANDLESTICK_CHART":
			data.forEach((item, index) => {
				const required = ["open", "high", "low", "close"];
				required.forEach((field) => {
					if (item[field] === undefined) {
						issues.push(`Item ${index}: missing ${field} value`);
					}
				});
			});
			break;

		case "PROBABILITY_CHART":
			data.forEach((item, index) => {
				if (
					typeof item.probability !== "number" ||
					item.probability < 0 ||
					item.probability > 1
				) {
					issues.push(
						`Item ${index}: probability must be a number between 0 and 1`,
					);
				}
			});
			break;

		case "FAN_CHART":
			data.forEach((item, index) => {
				if (!item.type) {
					issues.push(`Item ${index}: missing scenario type`);
				}
				if (!item.priceTarget && !item.value) {
					issues.push(`Item ${index}: missing price target or value`);
				}
			});
			break;
	}

	return {
		valid: issues.length === 0,
		issues,
	};
};

export const formatVisualizationMetadata = (visualization: any) => ({
	id: visualization.id,
	type: visualization.type,
	title: visualization.title,
	description: visualization.description,
	dataPointCount:
		visualization.data?.datasets?.reduce(
			(sum: number, dataset: any) => sum + (dataset.data?.length || 0),
			0,
		) || 0,
	hasInteractivity: Object.values(visualization.interactivity || {}).some(
		Boolean,
	),
	isAccessible: visualization.configuration?.accessibility?.screenReaderSupport,
	isResponsive: visualization.configuration?.responsive,
	theme: visualization.configuration?.theme,
	exportable: visualization.configuration?.exportable,
	annotationCount: visualization.data?.annotations?.length || 0,
	filterCount: visualization.data?.filters?.length || 0,
});

export const createVisualizationSummary = (visualizations: any[]) => {
	const typeCounts = visualizations.reduce((counts, viz) => {
		counts[viz.type] = (counts[viz.type] || 0) + 1;
		return counts;
	}, {});

	const totalDataPoints = visualizations.reduce(
		(sum, viz) =>
			sum +
			(viz.data?.datasets?.reduce(
				(dataSum: number, dataset: any) =>
					dataSum + (dataset.data?.length || 0),
				0,
			) || 0),
		0,
	);

	return {
		totalVisualizations: visualizations.length,
		typeBreakdown: typeCounts,
		totalDataPoints,
		interactiveCount: visualizations.filter((viz) =>
			Object.values(viz.interactivity || {}).some(Boolean),
		).length,
		accessibleCount: visualizations.filter(
			(viz) => viz.configuration?.accessibility?.screenReaderSupport,
		).length,
		responsiveCount: visualizations.filter(
			(viz) => viz.configuration?.responsive,
		).length,
	};
};

export const optimizeVisualizationForPerformance = (
	visualization: any,
	targetDataPoints: number = 1000,
) => {
	const optimized = { ...visualization };

	// Optimize datasets if they're too large
	if (optimized.data?.datasets) {
		optimized.data.datasets = optimized.data.datasets.map((dataset: any) => {
			if (dataset.data && dataset.data.length > targetDataPoints) {
				// Sample data points evenly
				const step = Math.ceil(dataset.data.length / targetDataPoints);
				const sampledData = dataset.data.filter(
					(_: any, index: number) => index % step === 0,
				);

				return {
					...dataset,
					data: sampledData,
					metadata: {
						...dataset.metadata,
						originalDataPoints: dataset.data.length,
						sampledDataPoints: sampledData.length,
						samplingRatio: sampledData.length / dataset.data.length,
					},
				};
			}
			return dataset;
		});
	}

	// Disable some interactions for large datasets
	if (targetDataPoints > 5000) {
		optimized.interactivity = {
			...optimized.interactivity,
			brush: false,
			pan: false,
		};
	}

	return optimized;
};

// Dashboard layout helpers
export const calculateResponsiveLayout = (visualizationCount: number) => {
	const layouts = {
		mobile: { columns: 1, itemHeight: 300 },
		tablet: {
			columns: visualizationCount <= 2 ? visualizationCount : 2,
			itemHeight: 350,
		},
		desktop: {
			columns:
				visualizationCount <= 3
					? visualizationCount
					: visualizationCount <= 6
						? 3
						: 4,
			itemHeight: 400,
		},
	};

	return layouts;
};

export const generateDashboardGrid = (
	count: number,
	maxColumns: number = 4,
) => {
	const columns = Math.min(count, maxColumns);
	const rows = Math.ceil(count / columns);

	return {
		columns,
		rows,
		totalCells: columns * rows,
		utilization: count / (columns * rows),
	};
};

// Constants
export const VISUALIZATION_CONSTANTS = {
	MAX_DATA_POINTS: 10000,
	MAX_SERIES: 20,
	MAX_ANNOTATIONS: 50,
	DEFAULT_ANIMATION_DURATION: 750,
	MIN_CHART_WIDTH: 300,
	MIN_CHART_HEIGHT: 200,
	MAX_DASHBOARD_VISUALIZATIONS: 12,
	PERFORMANCE_THRESHOLDS: {
		FAST: 1000,
		MODERATE: 5000,
		SLOW: 10000,
	},
	COLOR_PALETTES: {
		CATEGORICAL: ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"],
		SEQUENTIAL: ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"],
		DIVERGING: ["#ef4444", "#fbbf24", "#f3f4f6", "#34d399", "#10b981"],
	},
	EXPORT_SETTINGS: {
		PNG: { quality: 0.95, dpi: 300 },
		SVG: { optimization: true },
		PDF: { format: "A4", orientation: "landscape" },
	},
} as const;

// Error messages
export const VISUALIZATION_ERROR_MESSAGES = {
	INVALID_DATA_FORMAT: "Invalid data format for visualization",
	UNSUPPORTED_CHART_TYPE: "Unsupported chart type",
	INSUFFICIENT_DATA: "Insufficient data points for visualization",
	CONFIGURATION_ERROR: "Invalid visualization configuration",
	EXPORT_FAILED: "Failed to export visualization",
	DASHBOARD_LIMIT_EXCEEDED: "Dashboard visualization limit exceeded",
	ACCESSIBILITY_VALIDATION_FAILED: "Accessibility validation failed",
} as const;
