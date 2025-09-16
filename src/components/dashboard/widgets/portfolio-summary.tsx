'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  MoreHorizontal,
  DollarSign,
  Percent
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PortfolioSummaryProps {
  userId: string
  config?: {
    showPerformance?: boolean
    showAllocation?: boolean
    showRecentTrades?: boolean
    timeframe?: '1D' | '1W' | '1M' | '3M' | '1Y'
  }
  className?: string
}

interface PortfolioData {
  totalValue: number
  totalCost: number
  dayChange: number
  dayChangePercent: number
  totalReturn: number
  totalReturnPercent: number
  cash: number
  positions: {
    symbol: string
    name: string
    quantity: number
    value: number
    cost: number
    weight: number
    change: number
    changePercent: number
  }[]
  allocation: {
    category: string
    value: number
    percentage: number
    color: string
  }[]
}

export function PortfolioSummary({ userId, config = {}, className }: PortfolioSummaryProps) {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)

  const {
    showPerformance = true,
    showAllocation = true,
    showRecentTrades = false,
    timeframe = '1D'
  } = config

  useEffect(() => {
    loadPortfolioData()
  }, [userId, timeframe])

  const loadPortfolioData = async () => {
    try {
      setLoading(true)

      // Simulate API call - replace with actual portfolio data fetching
      await new Promise(resolve => setTimeout(resolve, 800))

      const mockData: PortfolioData = {
        totalValue: 125467.89,
        totalCost: 118950.00,
        dayChange: 1205.34,
        dayChangePercent: 0.97,
        totalReturn: 6517.89,
        totalReturnPercent: 5.48,
        cash: 4567.23,
        positions: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            quantity: 150,
            value: 28425.00,
            cost: 26250.00,
            weight: 22.65,
            change: 425.00,
            changePercent: 1.62
          },
          {
            symbol: 'MSFT',
            name: 'Microsoft Corporation',
            quantity: 85,
            value: 31875.50,
            cost: 29750.00,
            weight: 25.42,
            change: 287.50,
            changePercent: 0.91
          },
          {
            symbol: 'GOOGL',
            name: 'Alphabet Inc.',
            quantity: 45,
            value: 15678.90,
            cost: 16200.00,
            weight: 12.50,
            change: -145.30,
            changePercent: -0.92
          },
          {
            symbol: 'TSLA',
            name: 'Tesla Inc.',
            quantity: 75,
            value: 18923.45,
            cost: 17850.00,
            weight: 15.08,
            change: 298.65,
            changePercent: 1.60
          }
        ],
        allocation: [
          { category: 'Technology', value: 76979.85, percentage: 61.37, color: '#3b82f6' },
          { category: 'Healthcare', value: 18745.32, percentage: 14.94, color: '#10b981' },
          { category: 'Finance', value: 12456.78, percentage: 9.93, color: '#f59e0b' },
          { category: 'Consumer', value: 8718.71, percentage: 6.95, color: '#ef4444' },
          { category: 'Cash', value: 4567.23, percentage: 3.64, color: '#6b7280' },
          { category: 'Other', value: 4000.00, percentage: 3.19, color: '#8b5cf6' }
        ]
      }

      setPortfolioData(mockData)
    } catch (error) {
      console.error('Error loading portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !portfolioData) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Summary</CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24 mt-1" />
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Wallet className="h-4 w-4" />
          <span>Portfolio Summary</span>
        </CardTitle>

        <div className="flex items-center space-x-2">
          <Badge
            variant={portfolioData.dayChange >= 0 ? "default" : "destructive"}
            className={cn(
              portfolioData.dayChange >= 0
                ? "bg-bull/10 text-bull border-bull/20"
                : "bg-bear/10 text-bear border-bear/20"
            )}
          >
            {timeframe}
          </Badge>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Total Value */}
          <div>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-bold">
                ${portfolioData.totalValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </h3>
              <div className={cn(
                "flex items-center text-sm font-medium",
                portfolioData.dayChange >= 0 ? "text-bull" : "text-bear"
              )}>
                {portfolioData.dayChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span>
                  {portfolioData.dayChange >= 0 ? '+' : ''}
                  ${Math.abs(portfolioData.dayChange).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ({portfolioData.dayChangePercent >= 0 ? '+' : ''}
                  {portfolioData.dayChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total Return: {portfolioData.totalReturnPercent >= 0 ? '+' : ''}
              {portfolioData.totalReturnPercent.toFixed(2)}% (${portfolioData.totalReturn.toLocaleString()})
            </p>
          </div>

          {/* Performance Metrics */}
          {showPerformance && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cost Basis</p>
                <p className="text-sm font-medium">
                  ${portfolioData.totalCost.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cash</p>
                <p className="text-sm font-medium">
                  ${portfolioData.cash.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Top Holdings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Top Holdings</h4>
              <button className="text-xs text-muted-foreground hover:text-foreground">
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {portfolioData.positions.slice(0, 3).map((position) => (
                <div key={position.symbol} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{position.symbol}</p>
                      <span className="text-xs text-muted-foreground">
                        {position.weight.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${position.value.toLocaleString()}
                    </p>
                    <p className={cn(
                      "text-xs",
                      position.change >= 0 ? "text-bull" : "text-bear"
                    )}>
                      {position.change >= 0 ? '+' : ''}
                      {position.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Allocation */}
          {showAllocation && (
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                <PieChart className="h-4 w-4" />
                <span>Asset Allocation</span>
              </h4>
              <div className="space-y-2">
                {portfolioData.allocation.slice(0, 4).map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}