import {
  VisualizationService,
  VisualizationConfig
} from '@/types/services'
import {
  Visualization,
  VisualizationType,
  VisualizationData,
  DataSeries,
  DataPoint,
  ChartConfiguration,
  ChartTheme,
  InteractivityOptions,
  AccessibilityOptions,
  Annotation,
  SeriesStyle,
  FilterOption,
  VisualizationDashboard,
  DashboardLayout,
  InteractionConfig
} from '@/types/content'
import {
  MarketDataPoint,
  MarketEvent
} from '@/types/market'
import {
  ApplicationError,
  ErrorCode,
  ErrorSeverity
} from '@/types/errors'
import { db } from '@/lib/db'
import { visualizations } from '@/lib/schema/events'

interface ChartDataTransformer {
  transformData: (data: any[], config: any) => DataSeries[]
  validateData: (data: any[]) => boolean
  getRecommendedConfig: (data: any[]) => Partial<ChartConfiguration>
}

interface VisualizationTemplate {
  type: VisualizationType
  defaultConfig: ChartConfiguration
  interactivity: InteractivityOptions
  accessibility: AccessibilityOptions
  transformer: ChartDataTransformer
}

export class ChartGenerator implements VisualizationService {
  private config: VisualizationConfig | null = null
  private templates: Map<VisualizationType, VisualizationTemplate> = new Map()
  private isConfigured = false

  async configure(config: VisualizationConfig): Promise<void> {
    this.validateConfig(config)
    this.config = config
    await this.initializeTemplates()
    this.isConfigured = true
  }

  async generateVisualization(
    data: any,
    type: string,
    config?: any
  ): Promise<Visualization> {
    this.ensureConfigured()

    const visualizationType = type as VisualizationType
    const template = this.templates.get(visualizationType)

    if (!template) {
      throw this.createError(
        ErrorCode.VALIDATION_ERROR,
        `Unsupported visualization type: ${type}`,
        ErrorSeverity.MEDIUM,
        { type }
      )
    }

    try {
      // Validate input data
      if (!template.transformer.validateData(data)) {
        throw this.createError(
          ErrorCode.DATA_VALIDATION_ERROR,
          'Invalid data format for visualization',
          ErrorSeverity.MEDIUM,
          { type, dataLength: Array.isArray(data) ? data.length : 0 }
        )
      }

      // Transform data
      const transformedData = template.transformer.transformData(data, config)

      // Create visualization data structure
      const visualizationData: VisualizationData = {
        datasets: transformedData,
        annotations: this.generateAnnotations(data, visualizationType),
        timeRange: this.extractTimeRange(transformedData),
        filters: this.generateFilters(data, visualizationType)
      }

      // Merge configuration
      const chartConfiguration: ChartConfiguration = {
        ...template.defaultConfig,
        ...template.transformer.getRecommendedConfig(data),
        ...config
      }

      // Create visualization
      const visualization: Visualization = {
        id: crypto.randomUUID(),
        type: visualizationType,
        title: this.generateTitle(visualizationType, data),
        description: this.generateDescription(visualizationType, data),
        data: visualizationData,
        configuration: chartConfiguration,
        interactivity: { ...template.interactivity, ...config?.interactivity }
      }

      // Store visualization
      await this.storeVisualization(visualization)

      return visualization

    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error
      }

      throw this.createError(
        ErrorCode.VISUALIZATION_ERROR,
        'Failed to generate visualization',
        ErrorSeverity.HIGH,
        { type, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  async createDashboard(visualizations: Visualization[]): Promise<VisualizationDashboard> {
    this.ensureConfigured()

    if (visualizations.length === 0) {
      throw this.createError(
        ErrorCode.VALIDATION_ERROR,
        'At least one visualization is required for dashboard',
        ErrorSeverity.MEDIUM
      )
    }

    // Calculate optimal layout
    const layout = this.calculateOptimalLayout(visualizations.length)

    // Generate interactions between visualizations
    const interactions = this.generateDashboardInteractions(visualizations)

    // Create responsive configuration
    const responsiveness = {
      mobile: true,
      tablet: true,
      desktop: true,
      breakpoints: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        '2xl': 1536
      }
    }

    return {
      layout,
      visualizations,
      interactions,
      responsiveness
    }
  }

  async exportVisualization(visualization: Visualization, format: string): Promise<Buffer> {
    this.ensureConfigured()

    try {
      // For this implementation, we'll return a mock buffer
      // In production, this would generate actual image/PDF files
      const exportData = {
        id: visualization.id,
        type: visualization.type,
        format,
        timestamp: new Date().toISOString(),
        data: visualization.data
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      return Buffer.from(jsonString, 'utf-8')

    } catch (error) {
      throw this.createError(
        ErrorCode.EXPORT_ERROR,
        `Failed to export visualization in ${format} format`,
        ErrorSeverity.MEDIUM,
        { visualizationId: visualization.id, format, error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  private async initializeTemplates(): Promise<void> {
    // Line Chart Template
    this.templates.set(VisualizationType.LINE_CHART, {
      type: VisualizationType.LINE_CHART,
      defaultConfig: this.createDefaultConfig(),
      interactivity: this.createDefaultInteractivity(),
      accessibility: this.createDefaultAccessibility(),
      transformer: this.createLineChartTransformer()
    })

    // Candlestick Chart Template
    this.templates.set(VisualizationType.CANDLESTICK_CHART, {
      type: VisualizationType.CANDLESTICK_CHART,
      defaultConfig: this.createDefaultConfig(),
      interactivity: { ...this.createDefaultInteractivity(), zoom: true, pan: true },
      accessibility: this.createDefaultAccessibility(),
      transformer: this.createCandlestickTransformer()
    })

    // Bar Chart Template
    this.templates.set(VisualizationType.BAR_CHART, {
      type: VisualizationType.BAR_CHART,
      defaultConfig: this.createDefaultConfig(),
      interactivity: this.createDefaultInteractivity(),
      accessibility: this.createDefaultAccessibility(),
      transformer: this.createBarChartTransformer()
    })

    // Fan Chart Template
    this.templates.set(VisualizationType.FAN_CHART, {
      type: VisualizationType.FAN_CHART,
      defaultConfig: { ...this.createDefaultConfig(), theme: ChartTheme.LIGHT },
      interactivity: this.createDefaultInteractivity(),
      accessibility: this.createDefaultAccessibility(),
      transformer: this.createFanChartTransformer()
    })

    // Probability Chart Template
    this.templates.set(VisualizationType.PROBABILITY_CHART, {
      type: VisualizationType.PROBABILITY_CHART,
      defaultConfig: this.createDefaultConfig(),
      interactivity: this.createDefaultInteractivity(),
      accessibility: this.createDefaultAccessibility(),
      transformer: this.createProbabilityChartTransformer()
    })

    // Waterfall Chart Template
    this.templates.set(VisualizationType.WATERFALL_CHART, {
      type: VisualizationType.WATERFALL_CHART,
      defaultConfig: this.createDefaultConfig(),
      interactivity: this.createDefaultInteractivity(),
      accessibility: this.createDefaultAccessibility(),
      transformer: this.createWaterfallChartTransformer()
    })
  }

  private createDefaultConfig(): ChartConfiguration {
    return {
      theme: this.config?.defaultTheme || ChartTheme.AUTO,
      responsive: true,
      interactive: true,
      exportable: this.config?.exportFormats && this.config.exportFormats.length > 0,
      accessibility: this.createDefaultAccessibility()
    }
  }

  private createDefaultInteractivity(): InteractivityOptions {
    const baseInteractivity: InteractivityOptions = {
      zoom: false,
      pan: false,
      hover: true,
      click: true,
      brush: false,
      tooltip: true
    }

    switch (this.config?.interactivityLevel) {
      case 'ADVANCED':
        return { ...baseInteractivity, zoom: true, pan: true, brush: true }
      case 'BASIC':
        return { ...baseInteractivity, zoom: false, pan: false, brush: false }
      default:
        return baseInteractivity
    }
  }

  private createDefaultAccessibility(): AccessibilityOptions {
    return {
      highContrast: this.config?.accessibilityLevel === 'WCAG_AAA',
      screenReaderSupport: this.config?.accessibilityLevel !== 'BASIC',
      keyboardNavigation: this.config?.accessibilityLevel !== 'BASIC',
      altText: 'Interactive financial chart'
    }
  }

  // Data Transformers
  private createLineChartTransformer(): ChartDataTransformer {
    return {
      transformData: (data: MarketDataPoint[]) => {
        const priceData = data.filter(d => d.dataType === 'STOCK_PRICE')
        const volumeData = data.filter(d => d.dataType === 'VOLUME')

        const series: DataSeries[] = []

        if (priceData.length > 0) {
          series.push({
            name: 'Price',
            data: priceData.map(d => ({
              x: d.timestamp,
              y: Number(d.value)
            })),
            style: {
              color: '#3b82f6',
              lineWidth: 2
            },
            metadata: {
              unit: '$',
              description: 'Stock price over time',
              source: priceData[0].source
            }
          })
        }

        if (volumeData.length > 0) {
          series.push({
            name: 'Volume',
            data: volumeData.map(d => ({
              x: d.timestamp,
              y: Number(d.value)
            })),
            style: {
              color: '#10b981',
              lineWidth: 1,
              fillOpacity: 0.3
            },
            metadata: {
              unit: 'shares',
              description: 'Trading volume',
              source: volumeData[0].source
            }
          })
        }

        return series
      },
      validateData: (data: any[]) => {
        return Array.isArray(data) && data.length > 0 && data.every(d =>
          d.timestamp && d.value !== undefined && d.dataType
        )
      },
      getRecommendedConfig: (data: any[]) => ({
        theme: data.length > 1000 ? ChartTheme.DARK : ChartTheme.LIGHT
      })
    }
  }

  private createCandlestickTransformer(): ChartDataTransformer {
    return {
      transformData: (data: MarketDataPoint[]) => {
        // Group data by date for OHLC calculation
        const priceData = data.filter(d => d.dataType === 'STOCK_PRICE')
        const groupedData = this.groupByDate(priceData)

        const candlestickData = Object.entries(groupedData).map(([date, dayData]) => {
          const prices = dayData.map(d => Number(d.value))
          return {
            x: new Date(date),
            y: {
              open: prices[0],
              high: Math.max(...prices),
              low: Math.min(...prices),
              close: prices[prices.length - 1]
            }
          }
        })

        return [{
          name: 'OHLC',
          data: candlestickData,
          style: {
            color: '#ef4444', // Red for bearish
            lineWidth: 1
          },
          metadata: {
            unit: '$',
            description: 'Open, High, Low, Close prices',
            source: priceData[0]?.source
          }
        }]
      },
      validateData: (data: any[]) => {
        return Array.isArray(data) && data.length > 0
      },
      getRecommendedConfig: () => ({
        theme: ChartTheme.DARK
      })
    }
  }

  private createBarChartTransformer(): ChartDataTransformer {
    return {
      transformData: (data: any[]) => {
        // Transform data for bar chart (e.g., volume by period)
        return [{
          name: 'Volume',
          data: data.map((d, index) => ({
            x: d.label || d.timestamp || index,
            y: Number(d.value || d.volume || 0)
          })),
          style: {
            color: '#8b5cf6',
            fillOpacity: 0.8
          },
          metadata: {
            unit: 'units',
            description: 'Bar chart data',
            source: data[0]?.source || 'UNKNOWN'
          }
        }]
      },
      validateData: (data: any[]) => {
        return Array.isArray(data) && data.length > 0
      },
      getRecommendedConfig: () => ({})
    }
  }

  private createFanChartTransformer(): ChartDataTransformer {
    return {
      transformData: (scenarios: any[]) => {
        // Transform prediction scenarios into fan chart data
        const series: DataSeries[] = []

        scenarios.forEach((scenario, index) => {
          const color = index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#ef4444'

          series.push({
            name: scenario.type || `Scenario ${index + 1}`,
            data: [{
              x: new Date(),
              y: scenario.priceTarget?.value || scenario.value || 0
            }],
            style: {
              color,
              fillOpacity: 0.3
            },
            metadata: {
              unit: '$',
              description: scenario.description || 'Prediction scenario',
              source: 'PREDICTION_ENGINE'
            }
          })
        })

        return series
      },
      validateData: (data: any[]) => {
        return Array.isArray(data) && data.length > 0
      },
      getRecommendedConfig: () => ({
        theme: ChartTheme.LIGHT
      })
    }
  }

  private createProbabilityChartTransformer(): ChartDataTransformer {
    return {
      transformData: (scenarios: any[]) => {
        return [{
          name: 'Probabilities',
          data: scenarios.map(s => ({
            x: s.type || s.name,
            y: s.probability * 100
          })),
          style: {
            color: '#f59e0b',
            fillOpacity: 0.7
          },
          metadata: {
            unit: '%',
            description: 'Scenario probabilities',
            source: 'PREDICTION_ENGINE'
          }
        }]
      },
      validateData: (data: any[]) => {
        return Array.isArray(data) && data.length > 0 &&
               data.every(d => typeof d.probability === 'number')
      },
      getRecommendedConfig: () => ({})
    }
  }

  private createWaterfallChartTransformer(): ChartDataTransformer {
    return {
      transformData: (data: any[]) => {
        let cumulative = 0

        return [{
          name: 'Waterfall',
          data: data.map(d => {
            const value = Number(d.value || 0)
            const result = {
              x: d.label || d.name,
              y: value,
              cumulative: cumulative + value
            }
            cumulative += value
            return result
          }),
          style: {
            color: '#06b6d4',
            fillOpacity: 0.8
          },
          metadata: {
            unit: '$',
            description: 'Cumulative value changes',
            source: data[0]?.source || 'ANALYSIS_ENGINE'
          }
        }]
      },
      validateData: (data: any[]) => {
        return Array.isArray(data) && data.length > 0
      },
      getRecommendedConfig: () => ({})
    }
  }

  // Helper methods
  private groupByDate(data: MarketDataPoint[]): Record<string, MarketDataPoint[]> {
    return data.reduce((groups, dataPoint) => {
      const date = dataPoint.timestamp.toISOString().split('T')[0]
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(dataPoint)
      return groups
    }, {} as Record<string, MarketDataPoint[]>)
  }

  private generateAnnotations(data: any[], type: VisualizationType): Annotation[] {
    const annotations: Annotation[] = []

    // Add significant events as annotations
    if (Array.isArray(data) && data.length > 0) {
      // Find data points with significant changes
      for (let i = 1; i < data.length; i++) {
        const current = Number(data[i].value || 0)
        const previous = Number(data[i - 1].value || 0)
        const change = Math.abs((current - previous) / previous)

        if (change > 0.1) { // 10% change
          annotations.push({
            type: 'point',
            position: {
              x: data[i].timestamp || i,
              y: current
            },
            content: `${change > 0 ? '+' : ''}${(change * 100).toFixed(1)}%`,
            style: {
              color: change > 0 ? '#10b981' : '#ef4444'
            }
          })
        }
      }
    }

    return annotations.slice(0, 5) // Limit to 5 annotations
  }

  private extractTimeRange(datasets: DataSeries[]): { start: Date; end: Date } {
    let start = new Date()
    let end = new Date(0)

    datasets.forEach(dataset => {
      dataset.data.forEach(point => {
        const pointDate = new Date(point.x)
        if (pointDate < start) start = pointDate
        if (pointDate > end) end = pointDate
      })
    })

    return { start, end }
  }

  private generateFilters(data: any[], type: VisualizationType): FilterOption[] {
    const filters: FilterOption[] = []

    // Add time range filters
    filters.push(
      { name: '1D', value: '1day', active: false },
      { name: '1W', value: '1week', active: false },
      { name: '1M', value: '1month', active: true },
      { name: '3M', value: '3months', active: false },
      { name: '1Y', value: '1year', active: false }
    )

    // Add data type filters if applicable
    if (type === VisualizationType.LINE_CHART) {
      filters.push(
        { name: 'Price', value: 'price', active: true },
        { name: 'Volume', value: 'volume', active: true }
      )
    }

    return filters
  }

  private generateTitle(type: VisualizationType, data: any[]): string {
    const ticker = data[0]?.ticker || 'Market'

    switch (type) {
      case VisualizationType.LINE_CHART:
        return `${ticker} Price & Volume`
      case VisualizationType.CANDLESTICK_CHART:
        return `${ticker} Candlestick Chart`
      case VisualizationType.FAN_CHART:
        return `${ticker} Price Prediction Fan Chart`
      case VisualizationType.PROBABILITY_CHART:
        return 'Scenario Probabilities'
      case VisualizationType.WATERFALL_CHART:
        return 'Contribution Analysis'
      default:
        return `${ticker} Chart`
    }
  }

  private generateDescription(type: VisualizationType, data: any[]): string {
    switch (type) {
      case VisualizationType.LINE_CHART:
        return 'Time series showing price movement and trading volume'
      case VisualizationType.CANDLESTICK_CHART:
        return 'OHLC candlestick chart showing price action'
      case VisualizationType.FAN_CHART:
        return 'Probabilistic price forecast with uncertainty bands'
      case VisualizationType.PROBABILITY_CHART:
        return 'Distribution of scenario probabilities'
      case VisualizationType.WATERFALL_CHART:
        return 'Sequential breakdown of contributing factors'
      default:
        return 'Interactive financial data visualization'
    }
  }

  private calculateOptimalLayout(count: number): DashboardLayout {
    let columns = 1
    let rows = count

    if (count <= 2) {
      columns = count
      rows = 1
    } else if (count <= 4) {
      columns = 2
      rows = Math.ceil(count / 2)
    } else if (count <= 6) {
      columns = 3
      rows = Math.ceil(count / 3)
    } else {
      columns = 4
      rows = Math.ceil(count / 4)
    }

    return {
      columns,
      rows,
      gaps: 16,
      responsive: true
    }
  }

  private generateDashboardInteractions(visualizations: Visualization[]): InteractionConfig[] {
    const interactions: InteractionConfig[] = []

    // Create time range synchronization
    for (let i = 0; i < visualizations.length - 1; i++) {
      interactions.push({
        type: 'time_sync',
        source: visualizations[i].id,
        target: visualizations[i + 1].id,
        action: 'sync_time_range'
      })
    }

    // Create cross-highlighting for related data
    visualizations.forEach((viz, index) => {
      if (viz.type === VisualizationType.LINE_CHART) {
        visualizations.forEach((otherViz, otherIndex) => {
          if (index !== otherIndex && otherViz.type === VisualizationType.BAR_CHART) {
            interactions.push({
              type: 'cross_highlight',
              source: viz.id,
              target: otherViz.id,
              action: 'highlight_related'
            })
          }
        })
      }
    })

    return interactions
  }

  private async storeVisualization(visualization: Visualization): Promise<void> {
    try {
      await db.insert(visualizations).values({
        id: visualization.id,
        type: visualization.type,
        title: visualization.title,
        description: visualization.description,
        data: visualization.data,
        configuration: visualization.configuration,
        interactivity: visualization.interactivity,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Failed to store visualization:', error)
      // Don't throw - visualization can still be returned
    }
  }

  private ensureConfigured(): void {
    if (!this.isConfigured || !this.config) {
      throw this.createError(
        ErrorCode.MISSING_CONFIGURATION,
        'Chart generator not configured',
        ErrorSeverity.CRITICAL
      )
    }
  }

  private validateConfig(config: VisualizationConfig): void {
    if (!config.defaultTheme) {
      throw new Error('Default theme is required')
    }
    if (!config.interactivityLevel) {
      throw new Error('Interactivity level is required')
    }
    if (!config.accessibilityLevel) {
      throw new Error('Accessibility level is required')
    }
  }

  private createError(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity,
    additionalData?: any
  ): ApplicationError {
    return {
      code,
      message,
      severity,
      metadata: {
        timestamp: new Date(),
        service: 'chart-generator',
        operation: 'generate',
        additionalData
      },
      retryable: code === ErrorCode.DATABASE_QUERY_ERROR || severity === ErrorSeverity.HIGH
    }
  }
}