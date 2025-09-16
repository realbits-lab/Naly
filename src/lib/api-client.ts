import { MarketDataPoint } from '@/types/market'
import { APIResponse } from '@/types/errors'

interface MarketDataParams {
  ticker: string
  dataTypes: string[]
  startDate: Date
  endDate: Date
  frequency?: 'realtime' | 'daily' | 'weekly' | 'monthly'
}

interface HistoricalDataParams {
  ticker: string
  years?: number
}

interface BatchMarketDataRequest {
  requests: {
    ticker: string
    data_types: string[]
    start_date: string
    end_date: string
    frequency?: string
  }[]
}

class APIClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data: APIResponse<T> = await response.json()

    if (!data.success) {
      throw new Error(data.error.message)
    }

    return data.data
  }

  // Market Data API Methods
  async getMarketData(params: MarketDataParams): Promise<MarketDataPoint[]> {
    const searchParams = new URLSearchParams({
      ticker: params.ticker,
      data_types: params.dataTypes.join(','),
      start_date: params.startDate.toISOString(),
      end_date: params.endDate.toISOString(),
      ...(params.frequency && { frequency: params.frequency })
    })

    return this.makeRequest<MarketDataPoint[]>(`/market-data?${searchParams}`)
  }

  async getHistoricalData(params: HistoricalDataParams): Promise<{
    data: MarketDataPoint[]
    metadata: {
      ticker: string
      years: number
      dataPoints: number
      dateRange: {
        start: Date | null
        end: Date | null
      }
    }
  }> {
    const searchParams = new URLSearchParams({
      ticker: params.ticker,
      ...(params.years && { years: params.years.toString() })
    })

    return this.makeRequest(`/market-data/historical?${searchParams}`)
  }

  async batchGetMarketData(requests: BatchMarketDataRequest): Promise<{
    results: Array<{
      index: number
      success: boolean
      data?: MarketDataPoint[]
      error?: string
    }>
  }> {
    return this.makeRequest('/market-data', {
      method: 'POST',
      body: JSON.stringify(requests),
    })
  }

  // Health Check
  async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded'
    timestamp: string
    services: Record<string, { status: string; responseTime: number; error?: string }>
    version: string
    environment: string
    uptime: number
  }> {
    return this.makeRequest('/health')
  }

  // Convenience Methods
  async getStockPrice(ticker: string, days: number = 30): Promise<MarketDataPoint[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    return this.getMarketData({
      ticker,
      dataTypes: ['STOCK_PRICE'],
      startDate,
      endDate,
      frequency: 'daily'
    })
  }

  async getStockPriceAndVolume(ticker: string, days: number = 30): Promise<MarketDataPoint[]> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    return this.getMarketData({
      ticker,
      dataTypes: ['STOCK_PRICE', 'VOLUME'],
      startDate,
      endDate,
      frequency: 'daily'
    })
  }

  async getMultipleStockPrices(tickers: string[], days: number = 30): Promise<{
    results: Array<{
      index: number
      success: boolean
      data?: MarketDataPoint[]
      error?: string
    }>
  }> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const requests = tickers.map(ticker => ({
      ticker,
      data_types: ['STOCK_PRICE'],
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      frequency: 'daily' as const
    }))

    return this.batchGetMarketData({ requests })
  }
}

// Export a singleton instance
export const apiClient = new APIClient()

// Export the class for custom instances
export { APIClient }

// Type exports for consumers
export type {
  MarketDataParams,
  HistoricalDataParams,
  BatchMarketDataRequest
}