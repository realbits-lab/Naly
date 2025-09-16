'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarketOverviewProps {
  userId: string
  config?: {
    showIndices?: boolean
    showCommodities?: boolean
    showCrypto?: boolean
    compact?: boolean
  }
  className?: string
}

interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume?: string
  marketCap?: string
  category: 'indices' | 'commodities' | 'crypto'
}

export function MarketOverview({ userId, config = {}, className }: MarketOverviewProps) {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const {
    showIndices = true,
    showCommodities = false,
    showCrypto = false,
    compact = false
  } = config

  useEffect(() => {
    loadMarketData()
    const interval = setInterval(loadMarketData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [showIndices, showCommodities, showCrypto])

  const loadMarketData = async () => {
    try {
      setLoading(true)

      // Simulate API call - replace with actual market data fetching
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockData: MarketData[] = []

      if (showIndices) {
        mockData.push(
          {
            symbol: 'SPY',
            name: 'SPDR S&P 500',
            price: 456.78,
            change: 4.23,
            changePercent: 0.94,
            volume: '45.2M',
            marketCap: '423B',
            category: 'indices'
          },
          {
            symbol: 'QQQ',
            name: 'Invesco QQQ',
            price: 384.12,
            change: -2.15,
            changePercent: -0.56,
            volume: '28.7M',
            marketCap: '203B',
            category: 'indices'
          },
          {
            symbol: 'IWM',
            name: 'iShares Russell 2000',
            price: 198.45,
            change: 1.87,
            changePercent: 0.95,
            volume: '18.9M',
            marketCap: '67B',
            category: 'indices'
          }
        )
      }

      if (showCommodities) {
        mockData.push(
          {
            symbol: 'GLD',
            name: 'SPDR Gold Trust',
            price: 182.34,
            change: -0.78,
            changePercent: -0.43,
            volume: '8.1M',
            marketCap: '67B',
            category: 'commodities'
          },
          {
            symbol: 'USO',
            name: 'United States Oil',
            price: 78.90,
            change: 2.45,
            changePercent: 3.20,
            volume: '12.3M',
            marketCap: '5.8B',
            category: 'commodities'
          }
        )
      }

      if (showCrypto) {
        mockData.push(
          {
            symbol: 'GBTC',
            name: 'Grayscale Bitcoin Trust',
            price: 42.56,
            change: 5.67,
            changePercent: 15.35,
            volume: '23.4M',
            marketCap: '12.8B',
            category: 'crypto'
          }
        )
      }

      setMarketData(mockData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading market data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadMarketData()
  }

  if (loading && marketData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Market Overview</CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Activity className="h-4 w-4" />
          <span>Market Overview</span>
        </CardTitle>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn(
              "h-3 w-3",
              loading && "animate-spin"
            )} />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className={cn(
          "space-y-3",
          compact && "space-y-2"
        )}>
          {marketData.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.symbol}
                  </p>
                  <Badge
                    variant="outline"
                    className="text-xs capitalize"
                  >
                    {item.category}
                  </Badge>
                </div>
                {!compact && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.name}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-medium">
                  ${item.price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <div className={cn(
                  "flex items-center justify-end space-x-1 text-xs",
                  item.change >= 0 ? "text-bull" : "text-bear"
                )}>
                  {item.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {item.change >= 0 ? '+' : ''}
                    {item.change.toFixed(2)}
                  </span>
                  <span>
                    ({item.changePercent >= 0 ? '+' : ''}
                    {item.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!compact && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              <button className="hover:text-foreground transition-colors">
                View all →
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}